import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import api from "../services/api";
import Navbar from "../components/Navbar";
import CustomModal from "../components/CustomModal";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";

function ScanToPrint() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const blockLocation = searchParams.get("block") || "Library";
    const userId = localStorage.getItem("userId");

    const [orders, setOrders] = useState([]);
    const [printer, setPrinter] = useState(null);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [releasing, setReleasing] = useState(false);

    // OTP verification parameters
    const [verifyingOrder, setVerifyingOrder] = useState(null);
    const [mobileOtp, setMobileOtp] = useState("");
    const [mobileOtpError, setMobileOtpError] = useState("");
    const [otpQueue, setOtpQueue] = useState([]);
    const [successCount, setSuccessCount] = useState(0);
    const [failCount, setFailCount] = useState(0);
    const [otpTab, setOtpTab] = useState("keypad"); // "keypad" | "scan"
    const [scannerReady, setScannerReady] = useState(false);
    const scannerRef = useRef(null);
    const SCANNER_ID = "otp-barcode-scanner";

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info", onConfirm = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm
        });
    };

    useEffect(() => {
        if (!userId) {
            // Save this path to localStorage so we can redirect back here after login
            localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
            navigate("/");
            return;
        }

        getWalletBalance(userId).then(setWalletBalance);
        fetchData();
    }, [userId, blockLocation]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch printer config
            const printerRes = await api.get("/printer/byBlock", {
                params: { blockLocation }
            });
            setPrinter(printerRes.data);

            // Fetch pending scan orders
            const ordersRes = await api.get("/pdf/pendingScan", {
                params: { userId, blockLocation }
            });
            const pendingOrders = ordersRes.data || [];
            setOrders(pendingOrders);
            // Default to selecting all orders
            setSelectedOrderIds(pendingOrders.map(o => o.orderId));
        } catch (error) {
            console.error("Failed to load scanner details:", error);
            showAlert("Connection Error", "Unable to contact the backend service.", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectOrder = (orderId) => {
        if (selectedOrderIds.includes(orderId)) {
            setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
        } else {
            setSelectedOrderIds(prev => [...prev, orderId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedOrderIds.length === orders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.orderId));
        }
    };

    const handleKeypadPress = (val) => {
        setMobileOtpError("");
        if (mobileOtp.length < 4) {
            setMobileOtp(prev => prev + val);
        }
    };

    const handleKeypadBackspace = () => {
        setMobileOtpError("");
        setMobileOtp(prev => prev.slice(0, -1));
    };

    const handleKeypadClear = () => {
        setMobileOtpError("");
        setMobileOtp("");
    };

    const handleReleaseVerify = async () => {
        if (mobileOtp.length !== 4) {
            setMobileOtpError("OTP must be exactly 4 digits.");
            return;
        }

        setReleasing(true);
        let updatedSuccess = successCount;
        let updatedFail = failCount;

        try {
            await api.post("/pdf/releasePrint", null, {
                params: { orderId: verifyingOrder.orderId, otp: mobileOtp }
            });
            updatedSuccess++;
            setSuccessCount(updatedSuccess);
        } catch (err) {
            console.error(`Failed to release print for ${verifyingOrder.orderId}:`, err);
            setMobileOtpError(err.response?.data?.message || "Invalid OTP code. Please check the TV display screen.");
            setReleasing(false);
            return;
        }

        setReleasing(false);

        if (otpQueue.length > 0) {
            const [nextId, ...remaining] = otpQueue;
            setOtpQueue(remaining);
            const nextOrder = orders.find(o => o.orderId === nextId);
            setVerifyingOrder(nextOrder);
            setMobileOtp("");
            setMobileOtpError("");
        } else {
            setVerifyingOrder(null);
            if (updatedFail === 0) {
                showAlert(
                    "Printing Started! 🖨️",
                    `Successfully released ${updatedSuccess} print jobs. Please collect your pages from the printer tray.`,
                    "success",
                    () => {
                        navigate("/dashboard");
                    }
                );
            } else {
                showAlert(
                    "Partial Release",
                    `Released ${updatedSuccess} files successfully. ${updatedFail} files failed.`,
                    "warning",
                    () => {
                        fetchData();
                    }
                );
            }
        }
    };

    const releaseSelectedOrders = () => {
        if (selectedOrderIds.length === 0) {
            showAlert("No Selection", "Please select at least one document to print.", "warning");
            return;
        }

        if (printer && printer.maintenance) {
            showAlert("Printer Offline", "This printer is currently under maintenance. You can cancel your orders to refund your wallet, or print at another location.", "error");
            return;
        }

        setSuccessCount(0);
        setFailCount(0);
        
        const [firstId, ...remaining] = selectedOrderIds;
        setOtpQueue(remaining);
        
        const firstOrder = orders.find(o => o.orderId === firstId);
        setVerifyingOrder(firstOrder);
        setMobileOtp("");
        setMobileOtpError("");
    };

    const cancelOrder = async (orderId) => {
        showAlert(
            "Cancel Order?",
            "Are you sure you want to cancel this print order? The amount will be instantly refunded to your wallet.",
            "confirm",
            async () => {
                try {
                    await api.post("/pdf/cancelOrder", null, {
                        params: { orderId, userId }
                    });
                    showAlert("Cancelled Successfully", "Order cancelled and wallet balance refunded.", "success");
                    fetchData();
                } catch (err) {
                    console.error("Cancellation error:", err);
                    showAlert("Error", "Unable to cancel this order.", "error");
                }
            }
        );
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Scan to Print"
                    subtitle={`${blockLocation} Location`}
                    actions={[
                        {
                            label: "Dashboard",
                            path: "/dashboard"
                        },
                        {
                            label: "My Orders",
                            path: "/my-orders"
                        }
                    ]}
                />

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" />
                        <p className="font-bold">Locating printer queue, please wait...</p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        {/* Printer Status Section */}
                        <div className="md:col-span-1 space-y-6">
                            <motion.div
                                className="panel p-6"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p className="eyebrow">Printer Status</p>
                                <h2 className="text-xl font-black text-slate-900 mt-1">
                                    {printer?.printerName || "Printer Offline"}
                                </h2>

                                <div className="mt-4 space-y-3 font-semibold text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Connection:</span>
                                        <span className={printer?.active ? "text-emerald-600" : "text-rose-600"}>
                                            {printer?.active ? "Online ●" : "Offline"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Operational Mode:</span>
                                        <span className={printer?.maintenance ? "text-amber-600" : "text-sky-600"}>
                                            {printer?.maintenance ? "Maintenance 🛠️" : "Ready for Jobs 🔐"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span className="text-slate-500">Paper Level:</span>
                                        <span className="text-slate-800">
                                            {printer?.paperCount != null ? `${printer.paperCount} sheets` : "Unknown"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="panel p-6 bg-slate-900 text-white"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 className="font-black text-lg">Verification Instructions</h3>
                                <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-300 list-disc list-inside leading-relaxed">
                                    <li>Confirm the target printer is correct.</li>
                                    <li>Select the files you want to release.</li>
                                    <li>Tap <strong className="text-cyan-400">"Scan Barcode"</strong> to release instantly by scanning the barcode on the Kiosk TV screen with your camera.</li>
                                    <li>Or tap <strong className="text-sky-400">"Verify & Release"</strong> and type the 4-digit OTP manually.</li>
                                    <li>Your physical printing starts in seconds!</li>
                                </ul>
                            </motion.div>
                        </div>

                        {/* Scanned Orders List */}
                        <div className="md:col-span-2">
                            <motion.div
                                className="panel p-6 flex flex-col h-full"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <p className="eyebrow">Select Documents</p>
                                        <h2 className="text-xl font-black text-slate-900">
                                            Pending Print Queue
                                        </h2>
                                    </div>
                                    {orders.length > 0 && (
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 transition-colors"
                                        >
                                            {selectedOrderIds.length === orders.length ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 flex-1 space-y-3">
                                    {orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                                                selectedOrderIds.includes(order.orderId)
                                                    ? "border-sky-200 bg-sky-50/20"
                                                    : "border-slate-200/60 bg-slate-50/30"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4.5 w-4.5 cursor-pointer"
                                                checked={selectedOrderIds.includes(order.orderId)}
                                                onChange={() => toggleSelectOrder(order.orderId)}
                                            />

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">
                                                    📄 {order.fileName}
                                                </h4>
                                                <p className="text-xs font-semibold text-slate-500 mt-1">
                                                    ID: <span className="font-mono text-slate-700">{order.orderId}</span> ● {order.totalPages} pages ● {order.copies} copies ● <span className="font-bold">{order.printType}</span>
                                                </p>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className="font-black text-slate-900 text-sm">
                                                    ₹{order.price}
                                                </span>
                                                <button
                                                    onClick={() => cancelOrder(order.orderId)}
                                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Cancel & Refund
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {orders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                            <span className="text-4xl mb-3">📭</span>
                                            <h3 className="font-black text-slate-800 text-lg">No Pending Scans</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm leading-relaxed">
                                                There are no print orders waiting to be released at <strong>{blockLocation}</strong>. Please upload files and complete checkouts first.
                                            </p>
                                            <button
                                                onClick={() => navigate("/dashboard")}
                                                className="btn mt-5 px-6 py-2 text-xs font-bold shadow-lg"
                                            >
                                                Go to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {orders.length > 0 && (
                                    <div className="mt-6 border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Scan Barcode button — opens modal on Scan tab */}
                                        <button
                                            onClick={() => {
                                                if (selectedOrderIds.length === 0) {
                                                    showAlert("No Selection", "Please select at least one document to print.", "warning");
                                                    return;
                                                }
                                                if (printer && printer.maintenance) {
                                                    showAlert("Printer Offline", "This printer is currently under maintenance.", "error");
                                                    return;
                                                }
                                                setSuccessCount(0);
                                                setFailCount(0);
                                                const [firstId, ...remaining] = selectedOrderIds;
                                                setOtpQueue(remaining);
                                                const firstOrder = orders.find(o => o.orderId === firstId);
                                                setVerifyingOrder(firstOrder);
                                                setMobileOtp("");
                                                setMobileOtpError("");
                                                setOtpTab("scan"); // open directly on scan tab
                                            }}
                                            disabled={releasing || selectedOrderIds.length === 0}
                                            className="py-3.5 px-4 text-xs md:text-sm font-black tracking-wide shadow-lg flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            📷 Scan Barcode ({selectedOrderIds.length})
                                        </button>

                                        {/* Manual OTP button */}
                                        <button
                                            onClick={releaseSelectedOrders}
                                            disabled={releasing || selectedOrderIds.length === 0}
                                            className="btn py-3.5 px-4 text-xs md:text-sm font-black tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                                        >
                                            {releasing ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                    Releasing...
                                                </>
                                            ) : (
                                                <>
                                                    🔢 Enter OTP Manually ({selectedOrderIds.length})
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification and confirm dialogs */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            {/* Mobile OTP Verification Modal (Keypad + Barcode Scanner tabs) */}
            <AnimatePresence>
                {verifyingOrder && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#0D1524] shadow-2xl overflow-hidden"
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                        >
                            {/* Accent line */}
                            <div className="h-[3px] bg-gradient-to-r from-cyan-400 to-purple-500" />

                            {/* Header */}
                            <div className="px-6 pt-5 pb-4 border-b border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Verify Kiosk OTP</p>
                                <h3 className="mt-1 text-lg font-black text-white truncate">{verifyingOrder.orderId}</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">Check the 4-digit OTP or barcode on the Kiosk TV display.</p>
                            </div>

                            {/* Tabs */}
                            <div className="grid grid-cols-2 border-b border-white/10">
                                <button
                                    onClick={() => {
                                        setOtpTab("scan");
                                        setMobileOtpError("");
                                    }}
                                    className={`py-3 text-xs font-black uppercase tracking-widest transition-all ${
                                        otpTab === "scan"
                                            ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    📷 Scan Barcode
                                </button>
                                <button
                                    onClick={() => setOtpTab("keypad")}
                                    className={`py-3 text-xs font-black uppercase tracking-widest transition-all ${
                                        otpTab === "keypad"
                                            ? "text-sky-400 border-b-2 border-sky-400 bg-sky-500/5"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    🔢 Enter OTP
                                </button>
                            </div>

                            <div className="px-5 pt-4 pb-5">
                                {otpTab === "scan" ? (
                                    /* ---- SCAN TAB ---- */
                                    <OtpBarcodeScanner
                                        active={otpTab === "scan" && !!verifyingOrder}
                                        onResult={(decoded) => {
                                            // Barcode is formatted as `${orderId}-${userId}-${otpCode}`
                                            const parts = decoded.split("-");
                                            let scannedOrderId = null;
                                            let scannedUserId = null;
                                            let scannedOtp = "";

                                            if (parts.length >= 3) {
                                                scannedOrderId = parts[0].trim();
                                                scannedUserId = parts[1].trim();
                                                scannedOtp = parts[2].replace(/\D/g, "").slice(0, 4);
                                            } else if (parts.length === 2) {
                                                scannedOrderId = parts[0].trim();
                                                scannedOtp = parts[1].replace(/\D/g, "").slice(0, 4);
                                            } else {
                                                scannedOtp = decoded.replace(/\D/g, "").slice(0, 4);
                                            }

                                            const currentUserId = String(localStorage.getItem("userId") || "");
                                            const currentUserEmail = localStorage.getItem("userEmail") || "your account";

                                            // STRICT SECURITY CHECK 1: Verify scannedUserId matches logged-in user's account ID
                                            if (scannedUserId && currentUserId && String(scannedUserId) !== currentUserId) {
                                                setMobileOtpError(`⛔ Access Denied: Barcode belongs to another account (${scannedUserId}), not your registered email/account (${currentUserEmail})!`);
                                                setOtpTab("keypad");
                                                return;
                                            }

                                            // STRICT SECURITY CHECK 2: Verify orderId belongs to logged-in user's pending order queue
                                            if (scannedOrderId) {
                                                const matchingUserOrder = orders.find(o => String(o.orderId) === String(scannedOrderId));
                                                if (!matchingUserOrder) {
                                                    setMobileOtpError(`⛔ Access Denied: Order ${scannedOrderId} does not belong to your account (${currentUserEmail})!`);
                                                    setOtpTab("keypad");
                                                    return;
                                                }
                                                // Target matching user order
                                                setVerifyingOrder(matchingUserOrder);
                                            }

                                            if (scannedOtp.length === 4) {
                                                setMobileOtp(scannedOtp);
                                                setMobileOtpError("");
                                                setOtpTab("keypad");
                                            } else {
                                                setMobileOtpError("Invalid barcode format. Please try scanning again or enter OTP manually.");
                                                setOtpTab("keypad");
                                            }
                                        }}
                                    />
                                ) : (
                                    /* ---- KEYPAD TAB ---- */
                                    <>
                                        {/* OTP Display Field */}
                                        <div className="my-4 flex justify-center gap-3">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-black transition-all duration-150 ${
                                                        mobileOtp[i] 
                                                            ? "border-sky-500 bg-sky-500/10 text-sky-400" 
                                                            : "border-white/10 bg-white/5 text-slate-600"
                                                    }`}
                                                >
                                                    {mobileOtp[i] || "•"}
                                                </div>
                                            ))}
                                        </div>

                                        {mobileOtpError && (
                                            <p className="text-xs font-bold text-rose-500 mb-3 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                                                ⚠️ {mobileOtpError}
                                            </p>
                                        )}

                                        {/* Keypad Grid */}
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                                <button 
                                                    key={num}
                                                    onClick={() => handleKeypadPress(String(num))}
                                                    className="h-12 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold text-white transition-all cursor-pointer border border-white/8"
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={handleKeypadClear}
                                                className="h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-xs font-black text-rose-400 transition-all cursor-pointer border border-rose-500/20"
                                            >
                                                Clear
                                            </button>
                                            <button 
                                                onClick={() => handleKeypadPress("0")}
                                                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold text-white transition-all cursor-pointer border border-white/8"
                                            >
                                                0
                                            </button>
                                            <button 
                                                onClick={handleKeypadBackspace}
                                                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-lg font-bold text-white transition-all cursor-pointer flex items-center justify-center border border-white/8"
                                            >
                                                ⌫
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setVerifyingOrder(null);
                                            setOtpTab("keypad");
                                            setMobileOtp("");
                                            setMobileOtpError("");
                                        }}
                                        className="h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReleaseVerify}
                                        disabled={releasing || mobileOtp.length !== 4}
                                        className="h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-black text-white transition-colors cursor-pointer disabled:opacity-40"
                                    >
                                        {releasing ? "Releasing..." : "Verify & Print"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default ScanToPrint;

/* -----------------------------------------------------------------------
   OtpBarcodeScanner – inline barcode / QR scanner for OTP verification
   Uses direct Html5Qrcode instance to prevent DOM flickering & UI rebuilds
----------------------------------------------------------------------- */
function OtpBarcodeScanner({ active, onResult }) {
    const SCANNER_ID = "otp-barcode-video-container";
    const html5QrCodeRef = useRef(null);
    const [cameraState, setCameraState] = useState("initializing"); // "initializing" | "running" | "error"
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!active) return;
        let isCancelled = false;

        const startCamera = async () => {
            setCameraState("initializing");
            setErrorMsg("");

            try {
                // Ensure target container element exists in DOM
                const container = document.getElementById(SCANNER_ID);
                if (!container) return;

                // Stop previous scanner if any
                if (html5QrCodeRef.current) {
                    try {
                        if (html5QrCodeRef.current.isScanning) {
                            await html5QrCodeRef.current.stop();
                        }
                        html5QrCodeRef.current.clear();
                    } catch (e) {}
                    html5QrCodeRef.current = null;
                }

                const scanner = new Html5Qrcode(SCANNER_ID);
                html5QrCodeRef.current = scanner;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 1.33
                };

                const onScanSuccess = async (decodedText) => {
                    if (isCancelled) return;
                    try {
                        if (scanner.isScanning) {
                            await scanner.stop();
                        }
                        scanner.clear();
                    } catch (e) {}
                    html5QrCodeRef.current = null;
                    onResult(decodedText);
                };

                // Attempt environment camera first, fallback to default camera
                try {
                    await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
                } catch (envErr) {
                    console.warn("Back camera failed, trying default camera:", envErr);
                    if (isCancelled) return;
                    await scanner.start({ facingMode: "user" }, config, onScanSuccess, () => {});
                }

                if (!isCancelled) {
                    setCameraState("running");
                }
            } catch (err) {
                console.error("Camera access failed:", err);
                if (!isCancelled) {
                    setCameraState("error");
                    setErrorMsg("Camera access blocked or not supported on this device.");
                }
            }
        };

        startCamera();

        return () => {
            isCancelled = true;
            if (html5QrCodeRef.current) {
                const instance = html5QrCodeRef.current;
                html5QrCodeRef.current = null;
                if (instance.isScanning) {
                    instance.stop().then(() => {
                        try { instance.clear(); } catch (e) {}
                    }).catch(() => {});
                } else {
                    try { instance.clear(); } catch (e) {}
                }
            }
        };
    }, [active]);

    return (
        <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-black min-h-[220px] max-h-[260px] flex items-center justify-center shadow-inner">
                <div id={SCANNER_ID} className="w-full h-full object-cover" />
                {cameraState === "initializing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-cyan-400 p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2" />
                        <p className="text-xs font-bold">Starting camera...</p>
                    </div>
                )}
                {cameraState === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-rose-400 p-4 text-center">
                        <span className="text-2xl mb-1">📷⚠️</span>
                        <p className="text-xs font-bold">{errorMsg}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Please switch to "Enter OTP" tab to enter digits manually.</p>
                    </div>
                )}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold text-center">
                📺 Point camera directly at the barcode on the Kiosk TV display
            </p>
        </div>
    );
}
