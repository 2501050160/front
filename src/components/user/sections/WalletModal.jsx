import React, { useState } from "react";
import { Wallet, X, Plus, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import api, { RAZORPAY_KEY, loadRazorpayScript } from "../../../services/api";
import { getWalletBalance } from "../../../services/auth";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Attempts to credit the wallet up to maxAttempts times.
 * Useful when Render's free-tier server is waking up (502 transient errors).
 */
async function tryCreditWallet({ userId, email, amount, paymentId, maxAttempts = 4 }) {
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const params = { amount, paymentId };
            if (userId) params.userId = userId;
            if (email) params.email = email;

            const res = await api.post("/wallet/add", null, { params });
            return res;
        } catch (err) {
            lastErr = err;
            if (attempt < maxAttempts) {
                // Exponential back-off: 3s, 6s, 10s
                const delay = attempt === 1 ? 3000 : attempt === 2 ? 6000 : 10000;
                console.warn(`Wallet credit attempt ${attempt} failed. Retrying in ${delay / 1000}s…`, err?.message);
                await sleep(delay);
            }
        }
    }
    throw lastErr;
}

export function WalletModal({
    userId,
    email,
    currentBalance = 0,
    onClose,
    onSuccess
}) {
    const [amount, setAmount] = useState("50");
    const [processing, setProcessing] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");
    const [failedPaymentId, setFailedPaymentId] = useState(null);

    // Resolve email fallback from localStorage when not passed as prop
    const resolvedEmail = email || localStorage.getItem("userEmail") || "";
    const resolvedUserId = userId || localStorage.getItem("userId") || null;

    const presetAmounts = ["20", "50", "100", "200", "500"];

    /**
     * Given a confirmed Razorpay paymentId + amount, try to credit the wallet.
     * Retries up to 4 times with exponential back-off to survive Render cold-starts.
     */
    const creditWalletWithRetry = async (paymentId, numAmt) => {
        setRetrying(true);
        setRetryAttempt(0);
        setErrorMsg("");

        try {
            // Wire up a progress indicator per attempt
            let attempt = 0;
            const wrappedCredit = async () => {
                attempt++;
                setRetryAttempt(attempt);
                const params = { amount: numAmt, paymentId };
                if (resolvedUserId) params.userId = resolvedUserId;
                if (resolvedEmail) params.email = resolvedEmail;
                return api.post("/wallet/add", null, { params });
            };

            // Try up to 4 times
            let lastErr = null;
            let topupRes = null;
            for (let i = 1; i <= 4; i++) {
                setRetryAttempt(i);
                try {
                    topupRes = await wrappedCredit();
                    break; // success
                } catch (err) {
                    lastErr = err;
                    if (i < 4) {
                        const delay = i === 1 ? 3000 : i === 2 ? 6000 : 10000;
                        console.warn(`Wallet credit attempt ${i} failed (${err?.message}). Retrying in ${delay / 1000}s…`);
                        await sleep(delay);
                    }
                }
            }

            if (!topupRes) throw lastErr;

            const newBal = topupRes.data?.walletBalance ?? (Number(currentBalance) + numAmt);
            localStorage.setItem("walletBalance", String(newBal));
            window.dispatchEvent(new CustomEvent("walletUpdated", { detail: newBal }));
            if (onSuccess) onSuccess(newBal);
            setProcessing(false);
            setRetrying(false);
            if (onClose) onClose();
        } catch (err) {
            console.error("Failed to credit wallet after all retries:", err);
            setFailedPaymentId(paymentId);
            setErrorMsg(
                `Payment captured (ID: ${paymentId}) but server credit failed after 4 attempts. ` +
                `Your ₹${numAmt} is safe with Razorpay. Please share this payment ID with support or click "Retry Credit" below.`
            );
            setProcessing(false);
            setRetrying(false);
        }
    };

    const handleRecharge = async (e) => {
        if (e) e.preventDefault();
        const numAmt = Number(amount);
        if (!numAmt || isNaN(numAmt) || numAmt < 1) {
            setErrorMsg("Please enter a valid recharge amount (min ₹1)");
            return;
        }

        setProcessing(true);
        setErrorMsg("");
        setFailedPaymentId(null);

        try {
            // 1. Create Razorpay order on backend
            const orderParams = {
                amount: numAmt,
                appOrderId: `WALLET_${resolvedUserId || "anon"}_${Date.now()}`
            };
            if (resolvedUserId) orderParams.userId = resolvedUserId;

            const rzpRes = await api.post("/payment/createOrder", null, { params: orderParams });
            const orderData = rzpRes.data;

            const options = {
                key: orderData.key_id || RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print Wallet",
                description: `Add ₹${numAmt} to Print Wallet`,
                order_id: orderData.id,
                handler: async function (response) {
                    await creditWalletWithRetry(response.razorpay_payment_id, numAmt);
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                },
                theme: {
                    color: "#0f766e"
                }
            };

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded || !window.Razorpay) {
                setErrorMsg("Payment gateway failed to load. Please check your internet connection.");
                setProcessing(false);
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Wallet recharge error:", err);
            setErrorMsg(err.response?.data?.message || "Failed to initiate payment gateway");
            setProcessing(false);
        }
    };

    const handleRetryCredit = async () => {
        if (!failedPaymentId) return;
        const numAmt = Number(amount);
        await creditWalletWithRetry(failedPaymentId, numAmt);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Title */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">Recharge Print Wallet</h3>
                        <p className="text-xs text-slate-400">Instant 1-tap print releases at any kiosk</p>
                    </div>
                </div>

                {/* Current Balance Display */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Current Balance</span>
                    <span className="text-xl font-black text-emerald-400">₹{Number(currentBalance).toFixed(2)}</span>
                </div>

                {/* Preset Chips */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Select Quick Amount</label>
                    <div className="grid grid-cols-5 gap-2">
                        {presetAmounts.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setAmount(p)}
                                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                    amount === p
                                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                                }`}
                            >
                                ₹{p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Or Enter Custom Amount</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">₹</span>
                        <input
                            type="number"
                            min="1"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-base outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                {/* Retry status */}
                {retrying && (
                    <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Attempt {retryAttempt}/4 — server may be waking up, please wait…
                    </p>
                )}

                {errorMsg && (
                    <div className="rounded-xl bg-rose-950/40 border border-rose-800/50 p-3 space-y-2">
                        <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>
                        {failedPaymentId && (
                            <button
                                onClick={handleRetryCredit}
                                disabled={retrying}
                                className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry Credit
                            </button>
                        )}
                    </div>
                )}

                {/* Top Up Button */}
                <button
                    onClick={handleRecharge}
                    disabled={processing || retrying}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4" />
                    {retrying
                        ? `Crediting wallet (attempt ${retryAttempt}/4)…`
                        : processing
                        ? "Connecting Gateway..."
                        : `Proceed to Pay ₹${amount || 0}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-bit Encrypted Payments via Razorpay UPI / Cards</span>
                </div>
            </div>
        </div>
    );
}

export default WalletModal;
