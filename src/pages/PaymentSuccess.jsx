import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { getWalletBalance } from "../services/auth";
import Navbar from "../components/Navbar";
import documentCloudVideo from "../assets/doccument_cloud.mp4";
import cloudprintLogo from "../assets/cloudprint_logo.png";
import cloudprintWatermark from "../assets/cloudprint_watermark.png";

function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const userId = localStorage.getItem("userId");

    const [secondsLeft, setSecondsLeft] = useState(30);
    const [totalSeconds, setTotalSeconds] = useState(30);
    const [status, setStatus] = useState("CANCEL_WINDOW");
    const [cancelling, setCancelling] = useState(false);
    const [proceeding, setProceeding] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [fileName, setFileName] = useState("");
    const [blockLocation, setBlockLocation] = useState("");
    const [orderDetails, setOrderDetails] = useState(null);

    const otpRef = useRef("");
    const fileNameRef = useRef("");
    const blockLocationRef = useRef("");
    const autoProceedStartedRef = useRef(false);

    useEffect(() => {
        if (!orderId) return;
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get("/pdf/details", {
                    params: { orderId }
                });
                setOrderDetails(response.data);
            } catch (err) {
                console.error("Failed to fetch order details for invoice:", err);
            }
        };
        fetchOrderDetails();
    }, [orderId]);

    const proceedOrder = async () => {
        if (proceeding) return;
        setProceeding(true);
        try {
            await api.post("/queue/proceed", null, {
                params: { orderId }
            });
            navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
        } catch (error) {
            console.error("Failed to proceed order:", error);
            navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
        } finally {
            setProceeding(false);
        }
    };

    useEffect(() => {
        if (!userId && !orderId) {
            navigate("/");
            return;
        }

        if (!orderId) {
            navigate("/my-orders");
            return;
        }

        fetchWindowInfo();

        const interval = setInterval(() => {
            setSecondsLeft((current) => {
                if (current <= 1) {
                    clearInterval(interval);
                    navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        const poll = setInterval(fetchWindowInfo, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(poll);
        };
    }, [orderId]);

    const fetchWindowInfo = async () => {
        try {
            const response = await api.get("/pdf/cancelWindow", {
                params: { orderId }
            });

            if (response.data.found) {
                setStatus(response.data.status);
                
                if (response.data.otpCode) {
                    setOtpCode(response.data.otpCode);
                    otpRef.current = response.data.otpCode;
                }
                if (response.data.fileName) {
                    setFileName(response.data.fileName);
                    fileNameRef.current = response.data.fileName;
                }
                if (response.data.blockLocation) {
                    setBlockLocation(response.data.blockLocation);
                    blockLocationRef.current = response.data.blockLocation;
                }

                if (response.data.secondsLeft != null) {
                    setSecondsLeft(response.data.secondsLeft);
                }

                if (response.data.cancelWindowSeconds) {
                    setTotalSeconds(response.data.cancelWindowSeconds);
                }

                if (response.data.status !== "CANCEL_WINDOW") {
                    navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
                } else {
                    // Check if it is a wallet payment to trigger auto-proceed
                    const isWallet = searchParams.get("paymentMethod") === "wallet";
                    if (isWallet && !autoProceedStartedRef.current) {
                        autoProceedStartedRef.current = true;
                        // Auto-proceed immediately for wallet payments
                        proceedOrder();
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const cancelOrder = async () => {
        if (cancelling) return;

        setCancelling(true);

        try {
            const response = await api.post("/pdf/cancelOrder", null, {
                params: { orderId, userId }
            });

            if (response.data.success) {
                await getWalletBalance(userId);
                alert(response.data.message);
                navigate("/my-orders");
                return;
            }

            alert(response.data.message || "Unable to cancel order");
        } catch (error) {
            console.error(error);
            alert("Unable to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    const progress =
        totalSeconds > 0
            ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
            : 0;

    return (
        <main className="min-h-screen w-full m-0 p-0 overflow-hidden relative bg-black">
            {/* Navbar Area */}
            <div className="w-full px-4 py-4 z-50 absolute top-0 left-0 right-0 mix-blend-difference text-white">
                <Navbar
                    title="Payment Success"
                    subtitle="Order Confirmation"
                />
            </div>
            
            {/* Video Background */}
            <div className="absolute inset-0 w-full h-full">
                <video 
                    src={documentCloudVideo} 
                    autoPlay 
                    playsInline 
                    loop
                    muted
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
            </div>

            {/* Overlay Content */}
            <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
                <motion.div
                    className="w-full max-w-md flex flex-col items-center text-center p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-3xl mb-4 shadow-inner text-emerald-400">
                        ✓
                    </div>
                    <p className="eyebrow text-emerald-300 font-bold tracking-widest text-xs uppercase mb-1">Payment Successful</p>
                    <h1 className="title text-3xl text-white font-black mb-2">Order Confirmed!</h1>
                    <p className="subtitle mx-auto max-w-sm text-sm text-slate-200 font-medium leading-relaxed mb-6">
                        Order <strong>{orderId}</strong> has been successfully placed and routed to your print queue.
                    </p>

                    {/* Kiosk Display Screen Instructions */}
                    <div className="w-full max-w-sm p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-left mb-6 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">📺</span>
                            <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider">Release OTP & Queue Position</h4>
                        </div>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                            Please check your <strong>{blockLocation || 'designated kiosk'}</strong> display screen to find your 4-digit Release OTP, then enter it on the display keypad to print.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
                            <span>Target Kiosk:</span>
                            <span className="text-white font-black">{blockLocation || 'Campus Kiosk'}</span>
                        </div>
                    </div>

                    <div className="grid gap-3 w-full max-w-sm">
                        <button
                            onClick={() => navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`)}
                            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide text-white bg-emerald-500/90 hover:bg-emerald-500 transition-all border border-emerald-400/50 shadow-lg shadow-emerald-500/20"
                        >
                            📺 View Live Queue on Kiosk Screen
                        </button>
                        
                        {orderDetails && (
                            <button
                                onClick={() => window.print()}
                                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition-all rounded-xl border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Invoice Receipt
                            </button>
                        )}
                        
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            🖨️ Print Another Document
                        </button>
                    </div>
                </motion.div>
            </div>

            {orderDetails && (
                <div id="printable-invoice">
                    <div className="invoice-box">
                        <div className="invoice-watermark">{orderDetails.orderId}</div>
                        <img src={cloudprintWatermark} className="invoice-logo-watermark" alt="Watermark" />
                        <div className="invoice-stamp">VERIFIED</div>
                        
                        <div className="invoice-header">
                            <div className="invoice-logo flex items-center gap-2">
                                <img src={cloudprintLogo} alt="CloudPrint" className="h-9 object-contain" />
                            </div>
                            <div className="invoice-title">PAYMENT RECEIPT</div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Order ID:</span>
                                <span className="invoice-val font-bold">{orderDetails.orderId}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Receipt Date:</span>
                                <span className="invoice-val">{new Date(orderDetails.uploadTime).toLocaleString()}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Transaction ID:</span>
                                <span className="invoice-val">{orderDetails.razorpayPaymentId || "N/A"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Payment Method:</span>
                                <span className="invoice-val">{orderDetails.razorpayPaymentId === "WALLET" ? "Wallet Balance" : "Razorpay Online"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Block Location:</span>
                                <span className="invoice-val font-bold">{orderDetails.blockLocation || "C Block"}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <p className="invoice-subtitle">Document Info</p>
                            <div className="invoice-row">
                                <span className="invoice-label">File Name:</span>
                                <span className="invoice-val">{orderDetails.fileName}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Print Option:</span>
                                <span className="invoice-val">{orderDetails.printType}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Sides:</span>
                                <span className="invoice-val">{orderDetails.doubleSided ? "Double Sided" : "Single Sided"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Total Pages:</span>
                                <span className="invoice-val">{orderDetails.totalPages} pages</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Copies:</span>
                                <span className="invoice-val">{orderDetails.copies} copies</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Original Price:</span>
                                <span className="invoice-val">Rs. {Number(orderDetails.originalPrice || orderDetails.price).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Discount Applied:</span>
                                <span className="invoice-val text-green-600">- Rs. {Number(orderDetails.discountAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row invoice-total">
                                <span className="invoice-label">Total Paid:</span>
                                <span className="invoice-val">Rs. {Number(orderDetails.price).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-footer">
                            <p>Thank you for using Cloud Print Self-Service Kiosk!</p>
                            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>This is a system generated digital receipt and does not require a physical signature.</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                #printable-invoice {
                    display: none;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff;
                        color: #000000;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .invoice-box {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        padding: 30px;
                        border-radius: 12px;
                        position: relative;
                        overflow: hidden;
                    }
                    .invoice-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 60px;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.04);
                        pointer-events: none;
                        white-space: nowrap;
                        z-index: 0;
                    }
                    .invoice-logo-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-12deg);
                        width: 70%;
                        max-width: 360px;
                        opacity: 0.09;
                        pointer-events: none;
                        z-index: 0;
                    }
                    .invoice-stamp {
                        position: absolute;
                        bottom: 40px;
                        right: 40px;
                        border: 4px solid #10b981;
                        color: #10b981;
                        font-size: 28px;
                        font-weight: 900;
                        font-family: 'Impact', sans-serif;
                        letter-spacing: 4px;
                        padding: 8px 16px;
                        transform: rotate(15deg);
                        border-radius: 8px;
                        opacity: 0.8;
                        pointer-events: none;
                        z-index: 10;
                    }
                    .invoice-header, .invoice-section, .invoice-divider, .invoice-total-row {
                        position: relative;
                        z-index: 1;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .invoice-logo {
                        font-size: 20px;
                        font-weight: 900;
                        color: #0f172a;
                    }
                    .invoice-title {
                        font-size: 14px;
                        font-weight: 800;
                        letter-spacing: 0.1em;
                        color: #64748b;
                    }
                    .invoice-divider {
                        border-top: 2px dashed #cbd5e1;
                        margin: 20px 0;
                    }
                    .invoice-section {
                        margin-bottom: 15px;
                    }
                    .invoice-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 12px;
                        color: #334155;
                    }
                    .invoice-label {
                        font-weight: 600;
                        color: #64748b;
                    }
                    .invoice-val {
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .invoice-subtitle {
                        font-size: 12px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #0f172a;
                        margin-bottom: 10px;
                    }
                    .invoice-total {
                        font-size: 16px;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .invoice-total .invoice-label {
                        color: #0f172a;
                        font-weight: 900;
                    }
                    .invoice-total .invoice-val {
                        color: #10b981;
                        font-weight: 900;
                    }
                    .invoice-footer {
                        text-align: center;
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 30px;
                        font-weight: 500;
                    }
                }
            `}</style>
        </main>
    );
}

export default PaymentSuccess;
