import React, { useState } from "react";
import { CreditCard, Wallet, Tag, Check, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";

export function OrderSummaryCard({
    estimatedSheets = 0,
    basePrice = 0,
    estimatedTotal = 0,
    walletBalance = 0,
    haveCoupon = false,
    couponCode = "",
    setCouponCode,
    couponApplied = false,
    couponDetails = null,
    onApplyCoupon,
    onRemoveCoupon,
    onPayWithWallet,
    onPayWithRazorpay,
    isProcessing = false,
    isLowPaper = false,
    paperCount = 500,
    isDisabled = false,
    disabledReason = ""
}) {
    const [couponInput, setCouponInput] = useState("");

    const handleCouponSubmit = (e) => {
        e.preventDefault();
        if (couponInput.trim() && onApplyCoupon) {
            onApplyCoupon(couponInput.trim().toUpperCase());
        }
    };

    const hasEnoughWallet = walletBalance >= estimatedTotal;

    return (
        <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 space-y-5 shadow-2xl backdrop-blur-2xl sticky top-24">
            <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Order & Price Summary
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time instant calculation</p>
            </div>

            {/* Sheets & Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                    <span>Physical Sheets to Print:</span>
                    <span className="font-bold text-white">{estimatedSheets} Sheets</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">₹{basePrice.toFixed(2)}</span>
                </div>

                {couponApplied && couponDetails && (
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>Discount ({couponDetails.discountPercentage}% OFF):</span>
                        <span>- ₹{((basePrice * couponDetails.discountPercentage) / 100).toFixed(2)}</span>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-black text-white">Grand Total:</span>
                    <span className="text-2xl font-black text-cyan-400">₹{estimatedTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Coupon Code Section */}
            <div className="space-y-2">
                {!couponApplied ? (
                    <form onSubmit={handleCouponSubmit} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Promo Code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono uppercase text-white outline-none focus:border-cyan-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                            Apply
                        </button>
                    </form>
                ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-emerald-400">
                            🏷️ {couponDetails?.couponCode || "PROMO"} ({couponDetails?.discountPercentage}% OFF)
                        </span>
                        <button
                            onClick={onRemoveCoupon}
                            className="text-[11px] text-rose-400 hover:underline font-bold cursor-pointer"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>

            {/* Warnings */}
            {isLowPaper && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Low paper tray level ({paperCount} remaining). Reduce copies or switch block.</span>
                </div>
            )}

            {isDisabled && disabledReason && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{disabledReason}</span>
                </div>
            )}

            {/* Payment CTA Buttons */}
            <div className="space-y-2 pt-2">
                {/* 1-Click Pay with Wallet */}
                <button
                    onClick={onPayWithWallet}
                    disabled={isProcessing || isDisabled || !hasEnoughWallet || estimatedSheets === 0}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        hasEnoughWallet && estimatedSheets > 0 && !isDisabled
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500 shadow-xl shadow-emerald-600/25"
                            : "bg-slate-950 text-slate-500 border-slate-800 cursor-not-allowed"
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>
                        {hasEnoughWallet
                            ? `1-Tap Wallet Pay (₹${estimatedTotal.toFixed(2)})`
                            : `Insufficient Wallet (Bal: ₹${walletBalance.toFixed(2)})`}
                    </span>
                </button>

                {/* Direct UPI / Razorpay Payment */}
                <button
                    onClick={onPayWithRazorpay}
                    disabled={isProcessing || isDisabled || estimatedSheets === 0}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        estimatedSheets > 0 && !isDisabled
                            ? "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-500 shadow-xl shadow-cyan-600/25"
                            : "bg-slate-950 text-slate-500 border-slate-800 cursor-not-allowed"
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay via UPI / Cards (₹{estimatedTotal.toFixed(2)})</span>
                </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant OTP generated for physical kiosk pickup</span>
            </div>
        </div>
    );
}

export default OrderSummaryCard;
