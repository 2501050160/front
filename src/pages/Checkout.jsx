import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { RAZORPAY_KEY } from "../services/api";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";
import CustomModal from "../components/CustomModal";
import Navbar from "../components/Navbar";

function Checkout() {
    const navigate = useNavigate();
    const initialOrder = JSON.parse(localStorage.getItem("order"));
    const [currentOrder, setCurrentOrder] = useState(initialOrder);
    const order = currentOrder;
    const userId = localStorage.getItem("userId");

    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(order?.price || 0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [haveCoupon, setHaveCoupon] = useState(false);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());
    const [referralCode, setReferralCode] = useState(order?.appliedReferralCode || "");
    const [referralApplied, setReferralApplied] = useState(!!order?.appliedReferralCode);
    const [maintenance, setMaintenance] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [referralEnabled, setReferralEnabled] = useState(true);

    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState("");
    const [nupLayout, setNupLayout] = useState(order?.nupLayout || "1-up");

    const updatePrintSettings = async (newNup) => {
        try {
            const response = await api.post("/pdf/updateOrder", null, {
                params: {
                    orderId: order.orderId,
                    copies: order.copies,
                    selectedPages: order.selectedPages,
                    printType: order.printType,
                    blockLocation: order.blockLocation,
                    nupLayout: newNup
                }
            });
            const updated = response.data;
            localStorage.setItem("order", JSON.stringify(updated));
            setCurrentOrder(updated);
            
            // Reapply coupon if already applied
            if (couponApplied) {
                // If coupon validation needs to run again, or simply clear it:
                setCouponApplied(false);
                setCouponCode("");
                setDiscount(0);
                setFinalAmount(updated.price);
            } else {
                setFinalAmount(updated.price);
            }
        } catch (err) {
            console.error("Failed to update print settings:", err);
        }
    };

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const saveScheduledInfo = async () => {
        try {
            await api.post("/pdf/updateScheduledInfo", null, {
                params: {
                    orderId: order.orderId,
                    scheduledTime: isScheduled ? scheduledTime : ""
                }
            });
        } catch (err) {
            console.error("Failed to save scheduled info:", err);
        }
    };

    const showAlert = (title, message, type = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    };

    const applyReferral = async () => {
        if (referralApplied) {
            showAlert("Already Applied", "Referral code has already been applied to this order.", "warning");
            return;
        }

        if (!referralCode.trim()) {
            showAlert("Required Field", "Please enter a referral code.", "warning");
            return;
        }

        try {
            const response = await api.post("/pdf/applyReferral", null, {
                params: {
                    orderId: order.orderId,
                    referralCode: referralCode.trim(),
                    userId: userId
                }
            });

            if (response.data.success) {
                setReferralApplied(true);
                const updatedOrder = { ...order, appliedReferralCode: referralCode.trim() };
                localStorage.setItem("order", JSON.stringify(updatedOrder));
                showAlert("Success", response.data.message || "Referral code applied successfully!", "success");
            } else {
                showAlert("Failed", response.data.message || "Invalid referral code", "error");
            }
        } catch (error) {
            console.error("Referral application failed:", error);
            showAlert("Error", error.response?.data?.message || "Failed to apply referral code", "error");
        }
    };

    const [paperCount, setPaperCount] = useState(9999);

    useEffect(() => {
        if (!userId) {
            navigate("/");
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }
    }, [userId]);

    useEffect(() => {
        const fetchStatusAndPaper = async () => {
            if (!order) return;
            
            // 1. Fetch global system settings
            try {
                const settingsRes = await api.get("/system/settings");
                if (settingsRes.data && settingsRes.data.referralEnabled !== undefined) {
                    setReferralEnabled(settingsRes.data.referralEnabled);
                }
            } catch (err) {
                console.error("Failed to fetch system settings", err);
            }

            // 2. Fetch block location specific settings
            if (order.blockLocation) {
                try {
                    const response = await api.get("/printer/paper", {
                        params: { blockLocation: order.blockLocation }
                    });
                    setPaperCount(response.data != null ? response.data : 0);

                    const statusRes = await api.get("/system/status", {
                        params: { blockLocation: order.blockLocation }
                    });
                    setMaintenance(statusRes.data.maintenance || false);
                } catch (err) {
                    console.error("Failed to fetch status and paper count", err);
                }
            }
        };
        fetchStatusAndPaper();
    }, [order]);

    let pagesPerCopy = order?.totalPages || 0;
    if (order?.selectedPages && order.selectedPages !== "ALL") {
        const parts = order.selectedPages.split("-").map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            pagesPerCopy = parts[1] - parts[0] + 1;
        }
    }
    const estimatedPagesNeeded = pagesPerCopy * (order?.copies || 1);
    const paperShortage = estimatedPagesNeeded > paperCount;

    const payNow = async () => {
        if (maintenance) {
            showAlert("Machine Under Maintenance", "This printer is currently under maintenance. Please try again later or change your block location.", "error");
            return;
        }
        if (paperShortage) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels. Please change your block location.", "error");
            return;
        }
        if (paymentMethod) return;

        setPaymentMethod("razorpay");
        try {
            await saveScheduledInfo();
            const response = await api.post("/payment/createOrder", null, {
                params: {
                    amount: finalAmount,
                    appOrderId: order.orderId
                }
            });

            const orderData = response.data;

            const options = {
                key: RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print",
                description: "Print Order Payment",
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        // Mark coupon as used only after payment succeeds
                        if (couponApplied && couponCode) {
                            await api.post("/coupon/use", null, {
                                params: { couponCode }
                            }).catch(err => console.error("Failed to mark coupon as used:", err));
                        }

                        await api.post("/pdf/paymentSuccess", null, {
                            params: {
                                orderId: order.orderId,
                                paymentId: response.razorpay_payment_id
                            }
                        });

                        localStorage.removeItem("order");
                        navigate(`/payment-success?orderId=${order.orderId}`);
                    } catch (error) {
                        console.error("Failed to mark order as paid:", error);
                        showAlert("Error", "Unable to update payment status in our database.", "error");
                        setPaymentMethod("");
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log("Payment checkout modal was closed.");
                        showAlert("Payment Cancelled", "The payment checkout was closed.", "warning");
                        setPaymentMethod("");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response) {
                console.error("Razorpay Payment Failure Detail:", response.error);
                showAlert(
                    "Payment Failed",
                    `Reason: ${response.error.description || "The transaction was declined by the bank/gateway."}`,
                    "error"
                );
                setPaymentMethod("");
            });

            rzp.open();
        } catch (error) {
            console.error("Payment initiation error:", error);
            showAlert("Payment Error", "Unable to initiate payment transaction.", "error");
            setPaymentMethod("");
        }
    };

    const payWithWallet = async () => {
        if (paperShortage) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels. Please change your block location.", "error");
            return;
        }
        if (walletBalance < finalAmount) {
            showAlert("Insufficient Funds", "Insufficient wallet balance to place this order.", "warning");
            return;
        }
        if (paymentMethod) return;

        setPaymentMethod("wallet");
        try {
            // Run scheduling only if the user explicitly scheduled it to save an HTTP roundtrip
            if (isScheduled) {
                await saveScheduledInfo();
            }
            
            if (couponApplied && couponCode) {
                // Run coupon consumption and wallet payment in parallel to speed up execution
                await Promise.all([
                    api.post("/coupon/use", null, {
                        params: { couponCode }
                    }).catch(err => console.error("Failed to mark coupon as used:", err)),
                    api.post("/pdf/payWithWallet", null, {
                        params: {
                            orderId: order.orderId
                        }
                    })
                ]);
            } else {
                // Pay immediately
                await api.post("/pdf/payWithWallet", null, {
                    params: {
                        orderId: order.orderId
                    }
                });
            }

            // Update wallet balance in the background; do not block navigation
            getWalletBalance(userId).catch(err => console.error("Failed to update wallet balance in background:", err));
            
            localStorage.removeItem("order");
            navigate(`/payment-success?orderId=${order.orderId}&paymentMethod=wallet`);
        } catch (error) {
            console.error(error);
            showAlert("Error", error.response?.data?.message || "Wallet payment failed", "error");
            setPaymentMethod("");
        }
    };

    const applyCoupon = async () => {
        if (couponApplied) {
            showAlert("Already Applied", "Coupon has already been applied.", "warning");
            return;
        }

        if (!couponCode) {
            showAlert("Required Field", "Please enter coupon code.", "warning");
            return;
        }

        try {
            const response = await api.get("/coupon/validate", {
                params: {
                    couponCode
                }
            });

            const coupon = response.data;
            const discountAmount = (order.price * coupon.discountPercentage) / 100;
            const finalPrice = order.price - discountAmount;

            setDiscount(discountAmount);
            setFinalAmount(finalPrice);
            setCouponApplied(true);

            await api.post("/pdf/updatePrice", null, {
                params: {
                    orderId: order.orderId,
                    price: finalPrice,
                    originalPrice: order.price,
                    discountAmount: discountAmount
                }
            });

            showAlert("Success", "Coupon Applied Successfully", "success");
        } catch (error) {
            console.error(error);
            showAlert("Invalid Coupon", "The entered coupon code is invalid or expired.", "error");
        }
    };

    if (!order) {
        return (
            <main className="page-shell">
                <div className="content-wrap">
                    <div className="panel p-8 text-center">
                        <p className="eyebrow">Checkout</p>
                        <h1 className="title">No active order</h1>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="btn mt-6"
                        >
                            Back To Dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Checkout"
                    subtitle="Secure Payment"
                    actions={[
                        { label: "Edit Order", path: "/dashboard", className: "btn secondary" }
                    ]}
                />

                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <p className="eyebrow">Order Summary</p>

                        <div className="mt-5 space-y-4">
                            {[
                                ["Order ID", order.orderId],
                                ["Customer", localStorage.getItem("userName") || "Customer"],
                                ["Location", order.blockLocation || "C Block"],
                                ["Pages", order.selectedPages],
                                ["Copies", order.copies],
                                ["Print Type", order.printType],
                                ["Total Pages", order.totalPages]
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between border-b border-slate-100 pb-3"
                                >
                                    <span className="font-bold text-slate-500">{label}</span>
                                    <span className="font-black text-slate-900">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Payment Animation Loop */}
                        <div className="mt-6 flex justify-center">
                            <div className="w-full max-w-[240px] rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col items-center">
                                <div className="relative w-16 h-10 bg-slate-800 rounded-md border border-slate-700 p-2 flex flex-col justify-between animate-pulse">
                                    <div className="w-4 h-3 bg-yellow-400 rounded-sm" />
                                    <div className="w-8 h-1 bg-slate-600 rounded-sm" />
                                </div>
                                <p className="text-xs text-slate-500 font-bold mt-3 animate-pulse">Waiting for Payment...</p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <p className="eyebrow">Payment</p>

                        <div className="mt-5 rounded-lg bg-slate-900 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-300">Wallet Balance</span>
                                <span className="text-xl font-black text-cyan-300">Rs. {walletBalance}</span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="font-bold text-slate-300">Base Price</span>
                                <span className="text-xl font-bold">Rs. {Number(order.originalPrice || order.price).toFixed(2)}</span>
                            </div>

                            {order.discountAmount > 0 && (
                                <div className="mt-2 flex items-center justify-between text-green-400 text-sm">
                                    <span className="font-bold">Special Discount (Off-Peak/Bulk)</span>
                                    <span className="font-black">- Rs. {Number(order.discountAmount).toFixed(2)}</span>
                                </div>
                            )}

                            {couponApplied && (
                                <div className="mt-2 flex items-center justify-between text-green-400 text-sm">
                                    <span className="font-bold">Coupon Discount</span>
                                    <span className="font-black">- Rs. {Number(discount).toFixed(2)}</span>
                                </div>
                            )}

                            <div className="mt-6 border-t border-white/15 pt-5">
                                <p className="text-sm font-bold text-slate-300">Final Amount</p>
                                <motion.p
                                    key={finalAmount}
                                    className="mt-1 text-5xl font-black"
                                    initial={{ scale: 0.96, opacity: 0.6 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    Rs. {finalAmount}
                                </motion.p>
                            </div>
                        </div>

                        {/* Premium Shiny Coupon Button */}
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => !couponApplied && setHaveCoupon(!haveCoupon)}
                                disabled={couponApplied}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all relative overflow-hidden group cursor-pointer ${
                                    couponApplied 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default' 
                                    : 'bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border-sky-500/25 hover:border-sky-500/50 text-sky-400 hover:text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.07)] hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:scale-[1.01]'
                                }`}
                            >
                                {/* Shiny Overlay Animation */}
                                {!couponApplied && (
                                    <div className="absolute inset-0 w-[500%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                                )}
                                <span>🎟️</span>
                                <span>{couponApplied ? "Coupon Applied!" : "Apply Coupon"}</span>
                            </button>
                        </div>

                        {(haveCoupon || couponApplied) && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                                <input
                                    type="text"
                                    placeholder="Coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="field"
                                    disabled={couponApplied}
                                />

                                <button
                                    onClick={applyCoupon}
                                    disabled={couponApplied}
                                    className={couponApplied ? "btn secondary" : "btn"}
                                >
                                    {couponApplied ? "Applied" : "Apply"}
                                </button>
                            </div>
                        )}

                        {referralEnabled && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                                <p className="text-sm font-bold text-slate-500 mb-2">Refer & Earn (Referee gets Rs. 5 & Referrer gets Rs. 10)</p>
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                    <input
                                        type="text"
                                        placeholder="Enter referral code"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        className="field uppercase"
                                        disabled={referralApplied}
                                    />

                                    <button
                                        onClick={applyReferral}
                                        disabled={referralApplied}
                                        className={referralApplied ? "btn secondary" : "btn"}
                                    >
                                        {referralApplied ? "Applied" : "Apply Code"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scheduling & Notifications */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-500">Schedule Print for Later?</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isScheduled} 
                                        onChange={(e) => setIsScheduled(e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                                </label>
                            </div>

                            {isScheduled && (
                                <div className="mt-3">
                                    <p className="text-xs font-bold text-slate-400 mb-1">Select Pickup Date & Time</p>
                                    <input
                                        type="datetime-local"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="field w-full"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {maintenance && (
                            <div style={{
                                background: "#f97316",
                                color: "#ffffff",
                                padding: "10px 16px",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: "bold",
                                marginTop: "16px",
                                boxShadow: "0 0 15px rgba(249, 115, 22, 0.3)"
                            }}>
                                <marquee scrollamount="4">⚠️ Please try again later as the machine is under maintenance.</marquee>
                            </div>
                        )}

                        {paperShortage && (
                            <div style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "10px 16px",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: "bold",
                                marginTop: "16px",
                                boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
                            }}>
                                <marquee scrollamount="4">⚠️ Print cannot be done due to low paper. Go back to change locations.</marquee>
                            </div>
                        )}

                        {walletBalance >= finalAmount && (
                            <button
                                onClick={payWithWallet}
                                className="btn secondary mt-4 w-full flex items-center justify-center gap-2"
                                disabled={paperShortage || maintenance || !!paymentMethod}
                                style={paperShortage || maintenance || !!paymentMethod ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                            >
                                {paymentMethod === "wallet" ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Processing wallet payment...
                                    </>
                                ) : "Pay With Wallet"}
                            </button>
                        )}

                        <button
                            onClick={payNow}
                            className="btn success mt-4 w-full flex items-center justify-center gap-2"
                            disabled={paperShortage || maintenance || !!paymentMethod}
                            style={paperShortage || maintenance || !!paymentMethod ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                        >
                            {paymentMethod === "razorpay" ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Proceeding to Payment...
                                </>
                            ) : "Proceed to Payment"}
                        </button>
                    </motion.section>
                </div>
            </div>

            {/* Custom Premium Modal */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </main>
    );
}

export default Checkout;
