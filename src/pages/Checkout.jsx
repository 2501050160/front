import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { RAZORPAY_KEY } from "../services/api";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";
import CustomModal from "../components/CustomModal";
import Navbar from "../components/Navbar";
import referralIcon from "../assets/referral-icon.jpg";

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
    const [haveReferral, setHaveReferral] = useState(false);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());
    const [referralCode, setReferralCode] = useState(order?.appliedReferralCode || "");
    const [referralApplied, setReferralApplied] = useState(!!order?.appliedReferralCode);
    const [maintenance, setMaintenance] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [referralEnabled, setReferralEnabled] = useState(true);

    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState("");
    const [nupLayout, setNupLayout] = useState(order?.nupLayout || "1-up");

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const orderIdParam = searchParams.get("orderId");

        if (orderIdParam) {
            api.get(`/pdf/order/${orderIdParam}`)
                .then((res) => {
                    if (res.data) {
                        localStorage.setItem("order", JSON.stringify(res.data));
                        setCurrentOrder(res.data);
                        setFinalAmount(res.data.price || 0);
                        if (res.data.nupLayout) setNupLayout(res.data.nupLayout);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch order from URL parameter:", err.message);
                });
        }
    }, []);

    const updatePrintSettings = async (newNup) => {
        try {
            const response = await api.post("/pdf/updateOrder", null, {
                params: {
                    orderId: order.orderId,
                    copies: order.copies,
                    selectedPages: order.selectedPages,
                    printType: order.printType,
                    blockLocation: order.blockLocation,
                    nupLayout: newNup,
                    doubleSided: order.doubleSided
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

    const [autoPayTriggered, setAutoPayTriggered] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const paramOrderId = queryParams.get("orderId");
        if (paramOrderId) {
            api.get(`/pdf/order/${paramOrderId}`)
                .then((res) => {
                    if (res.data) {
                        setCurrentOrder(res.data);
                        localStorage.setItem("order", JSON.stringify(res.data));
                        setFinalAmount(res.data.price || 0);
                        setNupLayout(res.data.nupLayout || "1-up");
                    }
                })
                .catch((err) => console.error("Failed to load order from query param:", err));
        }
    }, []);

    useEffect(() => {
        if (currentOrder && currentOrder.orderId && !autoPayTriggered && !paymentMethod) {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get("orderId")) {
                setAutoPayTriggered(true);
                setTimeout(() => {
                    payNow();
                }, 600);
            }
        }
    }, [currentOrder]);

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

    const payTestInstant = async () => {
        setPaymentMethod("test");
        try {
            await api.post("/pdf/paymentSuccess", null, {
                params: {
                    orderId: order.orderId,
                    paymentId: "PAY_MOCK_" + Date.now()
                }
            });

            localStorage.removeItem("order");
            navigate(`/payment-success?orderId=${order.orderId}`);
        } catch (error) {
            console.error("Failed to complete test payment:", error);
            showAlert("Error", "Unable to complete test payment.", "error");
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
            
            // Fire all payment and order progression calls in the background asynchronously
            const executePaymentInBackground = async () => {
                try {
                    // Check if user is a configured tester to bypass payment
                    const userName = localStorage.getItem("userName") || "";
                    const userEmail = localStorage.getItem("userEmail") || "";
                    let isTesterUser = false;
                    
                    try {
                        const settingsRes = await api.get("/system/settings");
                        if (settingsRes.data && settingsRes.data.testerModeEnabled) {
                            const testers = (settingsRes.data.testerUsernames || "")
                                .split(",")
                                .map(t => t.trim().toLowerCase());
                            if (testers.includes(userName.toLowerCase()) || testers.includes(userEmail.toLowerCase())) {
                                isTesterUser = true;
                            }
                        }
                    } catch (e) {
                        console.error("Failed to check tester settings:", e);
                    }

                    if (isTesterUser) {
                        // Tester bypass: set price to 0 and pay
                        await api.post("/pdf/updatePrice", null, {
                            params: { orderId: order.orderId, price: 0.0 }
                        });
                    }

                    if (couponApplied && couponCode && !isTesterUser) {
                        await Promise.all([
                            api.post("/coupon/use", null, {
                                params: { couponCode }
                            }).catch(err => console.error("Failed to mark coupon as used:", err)),
                            api.post("/pdf/payWithWallet", null, {
                                params: { orderId: order.orderId }
                            })
                        ]);
                    } else {
                        await api.post("/pdf/payWithWallet", null, {
                            params: { orderId: order.orderId }
                        });
                    }

                    // Directly proceed/finalize order status to spooling instantly
                    await api.post("/queue/proceed", null, {
                        params: { orderId: order.orderId }
                    });

                    // Update wallet balance in the background
                    getWalletBalance(userId).catch(err => console.error("Failed to update wallet balance in background:", err));
                } catch (err) {
                    console.error("Background payment processing failed:", err);
                }
            };

            // Trigger background execution immediately
            executePaymentInBackground();
            
            localStorage.removeItem("order");
            navigate(`/blocks?orderId=${order.orderId}&fileName=${encodeURIComponent(order.fileName)}&block=${encodeURIComponent(order.blockLocation || "")}`);
        } catch (error) {
            console.error(error);
            showAlert("Error", "Wallet payment initiation failed", "error");
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
            const discountAmount = (coupon.discountPercentage && coupon.discountPercentage > 0)
                ? (order.price * coupon.discountPercentage) / 100
                : (coupon.discountAmount ? Math.min(order.price, coupon.discountAmount) : order.price);
            const finalPrice = Math.max(0, order.price - discountAmount);

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
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        Step 2 of 2
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">• Instant Print Spooling</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                                    Print & Layout Settings
                                </h2>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Order ID: <span className="text-cyan-300 font-bold">{order.orderId}</span> | Kiosk: <span className="text-cyan-300 font-bold">{order.blockLocation || "C Block"}</span></p>
                            </div>
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <span>Document:</span>
                                <span className="text-cyan-300 font-black px-2.5 py-1 bg-cyan-950/60 rounded-lg border border-cyan-800/40">
                                    {order.totalPages || 1} {order.totalPages === 1 ? "Page" : "Pages"}
                                </span>
                            </div>
                        </div>

                        {/* Success Banner */}
                        <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-900/90 border border-emerald-500/40 p-4 text-emerald-200 flex items-center justify-between shadow-xl shadow-emerald-950/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg font-black shrink-0">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white">Files Processed & Uploaded Successfully!</h4>
                                    <p className="text-xs font-semibold text-emerald-200/80 mt-0.5">Customize your print layout options below and complete your order.</p>
                                </div>
                            </div>
                            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Ready To Print
                            </span>
                        </div>

                        {/* Low paper notification banner */}
                        {paperShortage && (
                            <div className="mb-6 rounded-2xl bg-rose-500/20 border border-rose-500/40 p-4 text-rose-200 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                <p className="text-xs md:text-sm font-bold">
                                    ⚠️ Print cannot be initiated due to paper shortage. Selected job requires {estimatedPagesNeeded} sheets, but only {paperCount} sheets remain.
                                </p>
                            </div>
                        )}

                        {/* Interactive Print Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* 1. Page Orientation */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <RotateCw className="w-4 h-4 text-cyan-400" />
                                        Page Orientation
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                        (order.orientation || "portrait") === "portrait"
                                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                                            : "bg-purple-500/20 text-purple-300 border-purple-400/40"
                                    }`}>
                                        {(order.orientation || "portrait") === "portrait" ? "Vertical (A4)" : "Horizontal (Wide)"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("orientation", "portrait")}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                            (order.orientation || "portrait") === "portrait"
                                                ? "bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 border-cyan-300 text-white shadow-xl shadow-cyan-500/30 scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800/80 hover:text-white"
                                        }`}
                                    >
                                        <div className={`w-10 h-14 rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all ${
                                            (order.orientation || "portrait") === "portrait"
                                                ? "border-white bg-white/20 shadow-md"
                                                : "border-slate-500 bg-slate-800"
                                        }`}>
                                            <div className="w-full h-1 bg-current opacity-40 rounded-full" />
                                            <div className="w-3/4 h-1 bg-current opacity-40 rounded-full" />
                                            <div className="w-1/2 h-1 bg-current opacity-40 rounded-full" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black block">Portrait</span>
                                            <span className="text-[10px] opacity-80 font-medium">Standard Vertical</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("orientation", "landscape")}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                            order.orientation === "landscape"
                                                ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 border-purple-300 text-white shadow-xl shadow-purple-500/30 scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800/80 hover:text-white"
                                        }`}
                                    >
                                        <div className={`w-14 h-10 rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all ${
                                            order.orientation === "landscape"
                                                ? "border-white bg-white/20 shadow-md"
                                                : "border-slate-500 bg-slate-800"
                                        }`}>
                                            <div className="w-full h-1 bg-current opacity-40 rounded-full" />
                                            <div className="w-3/4 h-1 bg-current opacity-40 rounded-full" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black block">Horizontal</span>
                                            <span className="text-[10px] opacity-80 font-medium">Landscape (Wide)</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Number of Copies */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        Number of Copies
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                        {order.copies || 1} {(order.copies || 1) === 1 ? "Copy" : "Copies"}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => updatePrintOption("copies", Math.max(1, (order.copies || 1) - 1))}
                                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg transition-all cursor-pointer flex items-center justify-center border border-slate-600 shadow-md"
                                        >
                                            -
                                        </button>
                                        <div className="text-center">
                                            <span className="text-2xl font-black text-amber-400 block">{order.copies || 1}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Copies Required</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updatePrintOption("copies", (order.copies || 1) + 1)}
                                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-orange-500/25"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[1, 2, 3, 5, 10].map((qty) => (
                                            <button
                                                key={qty}
                                                type="button"
                                                onClick={() => updatePrintOption("copies", qty)}
                                                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                                                    Number(order.copies || 1) === qty
                                                        ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-orange-500/30 scale-105"
                                                        : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-amber-400/50 hover:text-white"
                                                }`}
                                            >
                                                {qty}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Print Ink Mode */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-pink-400" />
                                        Print Ink Mode
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                        (order.printType || "BW") === "BW"
                                            ? "bg-slate-800 text-slate-300 border-slate-600"
                                            : "bg-pink-500/20 text-pink-300 border-pink-400/40"
                                    }`}>
                                        {(order.printType || "BW") === "BW" ? "Monochrome B&W" : "Vibrant Color"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("printType", "BW")}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                            (order.printType || "BW") === "BW"
                                                ? "bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 border-slate-400 text-white shadow-xl scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white"
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center font-black text-xs">
                                            B/W
                                        </div>
                                        <div>
                                            <span className="text-xs font-black block">Black & White</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Standard B&W</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("printType", "COLOR")}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                            order.printType === "COLOR"
                                                ? "bg-gradient-to-br from-pink-600 via-rose-500 to-purple-600 border-pink-300 text-white shadow-xl shadow-pink-500/30 scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-pink-500/50 hover:text-white"
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-xs shadow-md">
                                            🌈
                                        </div>
                                        <div>
                                            <span className="text-xs font-black block">Vibrant Color</span>
                                            <span className="text-[10px] opacity-80 font-medium">HD Color Print</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 4. Print Sides (Duplex) */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-emerald-400" />
                                        Print Sides (Duplex)
                                    </span>
                                    {order.doubleSided && (
                                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                            🌱 Saves 50% Paper
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("doubleSided", false)}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200 text-center cursor-pointer ${
                                            !order.doubleSided
                                                ? "bg-gradient-to-br from-teal-600 to-cyan-600 border-cyan-300 text-white shadow-xl scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-cyan-500/50 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-xs font-black block">Single Side</span>
                                        <span className="text-[10px] opacity-80 font-medium">1 Page / Sheet</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={order.printType === "COLOR"}
                                        onClick={() => updatePrintOption("doubleSided", true)}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200 text-center cursor-pointer ${
                                            order.doubleSided && order.printType !== "COLOR"
                                                ? "bg-gradient-to-br from-emerald-600 to-green-600 border-emerald-300 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-emerald-500/50 hover:text-white"
                                        } ${order.printType === "COLOR" ? "opacity-30 cursor-not-allowed" : ""}`}
                                    >
                                        <span className="text-xs font-black block">Double Side</span>
                                        <span className="text-[10px] opacity-80 font-medium">2 Sides / Sheet</span>
                                    </button>
                                </div>
                            </div>

                            {/* 5. Page Selection */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <Copy className="w-4 h-4 text-cyan-400" />
                                        Page Selection
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                                        {order.selectedPages || "ALL"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updatePrintOption("selectedPages", "ALL")}
                                        className={`py-3 rounded-2xl border font-black text-xs transition-all cursor-pointer text-center ${
                                            (order.selectedPages || "ALL") === "ALL"
                                                ? "bg-gradient-to-r from-sky-600 to-cyan-600 border-cyan-300 text-white shadow-md scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-white"
                                        }`}
                                    >
                                        All {order.totalPages || 1} Pages
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const start = pageRangeStart || 1;
                                            const end = pageRangeEnd || order.totalPages || 1;
                                            updatePrintOption("selectedPages", `${start}-${end}`);
                                        }}
                                        className={`py-3 rounded-2xl border font-black text-xs transition-all cursor-pointer text-center ${
                                            order.selectedPages && order.selectedPages !== "ALL"
                                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-300 text-white shadow-md scale-[1.02]"
                                                : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-white"
                                        }`}
                                    >
                                        Custom Range
                                    </button>
                                </div>

                                {order.selectedPages && order.selectedPages !== "ALL" && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">From Page</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={order.totalPages || 1}
                                                placeholder="1"
                                                value={pageRangeStart}
                                                onChange={(e) => {
                                                    setPageRangeStart(e.target.value);
                                                    updatePrintOption("selectedPages", `${e.target.value}-${pageRangeEnd || order.totalPages || 1}`);
                                                }}
                                                className="field mt-1 !bg-slate-900 !border-slate-700 !text-white text-center font-black rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">To Page</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={order.totalPages || 1}
                                                placeholder={order.totalPages || 1}
                                                value={pageRangeEnd}
                                                onChange={(e) => {
                                                    setPageRangeEnd(e.target.value);
                                                    updatePrintOption("selectedPages", `${pageRangeStart || 1}-${e.target.value}`);
                                                }}
                                                className="field mt-1 !bg-slate-900 !border-slate-700 !text-white text-center font-black rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 6. Layout & N-Up (Pages Per Sheet) */}
                            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-purple-400" />
                                        Pages Per Sheet (N-Up)
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                                        {order.nupLayout || "1-up"} Layout
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {[
                                        { id: "1-up", label: "1-Up", desc: "Standard", gradient: "from-amber-500 to-orange-600 border-amber-300" },
                                        { id: "2-up", label: "2-Up", desc: "Saver", gradient: "from-sky-500 to-blue-600 border-sky-300" },
                                        { id: "4-up", label: "4-Up", desc: "Compact", gradient: "from-purple-500 to-indigo-600 border-purple-300" },
                                        { id: "6-up", label: "6-Up", desc: "Micro", gradient: "from-fuchsia-500 to-pink-600 border-pink-300" },
                                        { id: "8-up", label: "8-Up", desc: "Mini", gradient: "from-emerald-500 to-teal-600 border-emerald-300" },
                                        { id: "9-up", label: "9-Up", desc: "Nano", gradient: "from-rose-500 to-red-600 border-rose-300" }
                                    ].map((layout) => (
                                        <button
                                            key={layout.id}
                                            type="button"
                                            onClick={() => updatePrintOption("nupLayout", layout.id)}
                                            className={`py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border shadow-md ${
                                                (order.nupLayout || "1-up") === layout.id
                                                    ? `bg-gradient-to-r ${layout.gradient} text-white font-black scale-105`
                                                    : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-white"
                                            }`}
                                        >
                                            <span className="text-xs font-black">{layout.label}</span>
                                            <span className="text-[9px] opacity-80">{layout.desc}</span>
                                        </button>
                                    ))}
                                </div>
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

                        {/* Premium Ticket Coupon Button */}
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => !couponApplied && setHaveCoupon(!haveCoupon)}
                                disabled={couponApplied}
                                className={`w-fit h-14 rounded-lg flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer ${
                                    couponApplied 
                                    ? 'bg-emerald-600 border-emerald-700/30' 
                                    : 'bg-red-600 border-red-700/30 shadow-[0_4px_15px_rgba(220,38,38,0.25)]'
                                }`}
                            >
                                {/* Left section: White barcode */}
                                <div className="w-12 bg-white flex items-center justify-center relative border-r border-dashed border-slate-300">
                                    {/* Top and Bottom Scallop cutouts */}
                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 translate-y-1/2" />
                                    
                                    {/* Barcode representation */}
                                    <div className="flex gap-[1.5px] items-center justify-center h-8">
                                        <div className="w-[1.5px] h-full bg-slate-900" />
                                        <div className="w-[3px] h-full bg-slate-900" />
                                        <div className="w-[1px] h-full bg-slate-900" />
                                        <div className="w-[2px] h-full bg-slate-900" />
                                        <div className="w-[1px] h-full bg-slate-900" />
                                        <div className="w-[3px] h-full bg-slate-900" />
                                        <div className="w-[1.5px] h-full bg-slate-900" />
                                    </div>
                                </div>

                                {/* Right section: Red/Green Coupon text */}
                                <div className="px-3.5 flex flex-col justify-center text-left text-white">
                                    <span className="text-[8px] font-black tracking-widest uppercase opacity-85">COUPON</span>
                                    <span className="text-xs font-black whitespace-nowrap mt-0.5">
                                        {couponApplied ? "COUPON SAVED!" : "HAVE A COUPON?"}
                                    </span>
                                </div>
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
                            <>
                                {/* Premium Megaphone Refer a Friend Button */}
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => !referralApplied && setHaveReferral(!haveReferral)}
                                        disabled={referralApplied}
                                        className={`w-fit h-14 rounded-lg flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer ${
                                            referralApplied 
                                            ? 'bg-emerald-600 border-emerald-700/30' 
                                            : 'bg-slate-900 border-slate-800 shadow-[0_4px_15px_rgba(15,23,42,0.25)]'
                                        }`}
                                    >
                                        {/* Left section: Yellow/Orange background with Megaphone */}
                                        <div className="w-12 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center relative border-r border-dashed border-orange-400/30">
                                            {/* Top and Bottom cutouts */}
                                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 -translate-y-1/2" />
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 translate-y-1/2" />
                                            
                                            {/* Megaphone icon image from assets */}
                                            <img 
                                                src={referralIcon} 
                                                alt="Refer a Friend" 
                                                className="w-10 h-10 object-contain rounded-md animate-pulse" 
                                                style={{ animationDuration: '3s' }}
                                            />
                                        </div>

                                        {/* Right section: Dark slate and orange text block */}
                                        <div className="px-3.5 flex flex-col justify-center text-left text-white">
                                            <span className="text-[8px] font-black tracking-widest uppercase text-amber-400">REFER A</span>
                                            <span className="text-xs font-black whitespace-nowrap mt-0.5 text-white">
                                                {referralApplied ? "REFERRAL APPLIED!" : "FRIEND?"}
                                            </span>
                                        </div>
                                    </button>
                                </div>

                                {(haveReferral || referralApplied) && (
                                    <div className="mt-3 border-t border-slate-100/50 pt-3">
                                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                            Refer & Earn (You get Rs. 5 & Referrer gets Rs. 10)
                                        </p>
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
                            </>
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

                        {/* Pay with Razorpay Button */}

                        <button
                            onClick={payNow}
                            className="btn success mt-3 w-full flex items-center justify-center gap-2"
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
