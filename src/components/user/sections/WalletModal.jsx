import React, { useState } from "react";
import { Wallet, X, Plus, ShieldCheck, Sparkles } from "lucide-react";
import api, { RAZORPAY_KEY, loadRazorpayScript } from "../../../services/api";
import { getWalletBalance } from "../../../services/auth";

export function WalletModal({
    userId,
    currentBalance = 0,
    onClose,
    onSuccess
}) {
    const [amount, setAmount] = useState("50");
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const presetAmounts = ["20", "50", "100", "200", "500"];

    const handleRecharge = async (e) => {
        if (e) e.preventDefault();
        const numAmt = Number(amount);
        if (!numAmt || isNaN(numAmt) || numAmt < 1) {
            setErrorMsg("Please enter a valid recharge amount (min ₹1)");
            return;
        }

        setProcessing(true);
        setErrorMsg("");

        try {
            // 1. Create Razorpay order on backend
            const rzpRes = await api.post("/payment/createOrder", null, {
                params: {
                    amount: numAmt,
                    appOrderId: `WALLET_${Date.now()}`
                }
            });

            const orderData = rzpRes.data;

            const options = {
                key: orderData.key_id || RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print Wallet",
                description: `Add ₹${numAmt} to Print Wallet`,
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        const topupRes = await api.post("/wallet/add", null, {
                            params: {
                                userId,
                                amount: numAmt,
                                paymentId: response.razorpay_payment_id
                            }
                        });

                        const newBal = topupRes.data?.walletBalance ?? (currentBalance + numAmt);
                        localStorage.setItem("walletBalance", String(newBal));
                        window.dispatchEvent(new CustomEvent("walletUpdated", { detail: newBal }));
                        if (onSuccess) onSuccess(newBal);
                        setProcessing(false);
                        if (onClose) onClose();
                    } catch (err) {
                        console.error("Failed to credit wallet:", err);
                        setErrorMsg("Payment succeeded but wallet credit failed. Please contact support.");
                        setProcessing(false);
                    }
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

                {errorMsg && (
                    <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>
                )}

                {/* Top Up Button */}
                <button
                    onClick={handleRecharge}
                    disabled={processing}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4" />
                    {processing ? "Connecting Gateway..." : `Proceed to Pay ₹${amount || 0}`}
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
