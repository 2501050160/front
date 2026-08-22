import React, { useState } from "react";
import { Gift, Sparkles, Copy, Check, Share2, Users, ArrowRight } from "lucide-react";
import api from "../../../services/api";

export function CouponsRewardsSection({
    userId,
    referralCode = "",
    onWalletUpdated,
    showAlert
}) {
    const [voucherCode, setVoucherCode] = useState("");
    const [claiming, setClaiming] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = `Hey! Use my referral code ${referralCode} when printing on campus with Cloud Print to get free print credits: https://cloudprint.app`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleClaimVoucher = async (e) => {
        e.preventDefault();
        if (!voucherCode.trim()) {
            showAlert("Required", "Please enter a voucher code", "warning");
            return;
        }

        setClaiming(true);
        try {
            const res = await api.post("/rewards/claim", null, {
                params: {
                    userId,
                    code: voucherCode.trim().toUpperCase()
                }
            });

            showAlert("Voucher Redeemed!", `₹${res.data?.amount || 50} added to your print wallet!`, "success");
            setVoucherCode("");
            const newBal = res.data?.newBalance ?? res.data?.walletBalance;
            if (newBal != null) {
                localStorage.setItem("walletBalance", String(newBal));
                window.dispatchEvent(new CustomEvent("walletUpdated", { detail: newBal }));
                if (onWalletUpdated) onWalletUpdated(newBal);
            }
        } catch (error) {
            console.error(error);
            showAlert("Redemption Failed", error.response?.data?.message || "Invalid or expired voucher code", "error");
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-2 max-w-xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        🎁 Free Wallet Credits & Deals
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white">
                        Student Rewards & Referral Hub
                    </h2>
                    <p className="text-xs text-slate-300">
                        Invite your campus classmates or redeem official event vouchers to earn instant wallet balance for your next print jobs.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Claim Reward Voucher */}
                <form onSubmit={handleClaimVoucher} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">Redeem Gift / Event Voucher</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Got a promo code from a hackathon or campus workshop? Redeem it here.
                            </p>
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase">Secret Voucher Code</label>
                            <input
                                type="text"
                                placeholder="e.g. HACKATHON50"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase font-black text-sm outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={claiming}
                        className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {claiming ? "Claiming..." : "Redeem Voucher Credits"}
                    </button>
                </form>

                {/* 2. Referral Code & Share */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">Your Campus Referral Link</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Friends get ₹5 free on registration. You get ₹10 wallet credit when they print!
                            </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-black">Your Referral Code</span>
                                <p className="font-mono text-lg font-black text-cyan-400">{referralCode || "CPSTUDENT"}</p>
                            </div>
                            <button
                                onClick={handleCopyReferral}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleWhatsAppShare}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share on WhatsApp with Classmates
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CouponsRewardsSection;
