import React, { useState } from "react";
import { Tag, Percent, Plus, Trash2, Copy, Check, Gift, DollarSign, Lock, Unlock, Users } from "lucide-react";
import api from "../../../services/api";

export function PricingCouponsSection({
    blocks = [],
    selectedBlock = "C Block",
    onSelectBlock,
    bwPrice = 2,
    setBwPrice,
    colorPrice = 5,
    setColorPrice,
    duplexPrice = 2,
    setDuplexPrice,
    onSavePrices,
    coupons = [],
    onDeleteCoupon,
    onCreateCoupon,
    rewards = [],
    onCreateReward,
    onDeleteReward,
    systemSettings = {},
    onUpdateSystemSettings,
    showAlert,
    showConfirm
}) {
    // Coupon form
    const [couponCode, setCouponCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState(10);
    const [creatingCoupon, setCreatingCoupon] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    // Reward Voucher form
    const [rewardTitle, setRewardTitle] = useState("");
    const [rewardDesc, setRewardDesc] = useState("");
    const [rewardAmt, setRewardAmt] = useState("");
    const [rewardCode, setRewardCode] = useState("");
    const [rewardMaxClaims, setRewardMaxClaims] = useState(100);
    const [creatingReward, setCreatingReward] = useState(false);

    // Referral Settings form
    const [refReferrerAmt, setRefReferrerAmt] = useState(systemSettings.referrerAmount || 10);
    const [refRefereeAmt, setRefRefereeAmt] = useState(systemSettings.refereeAmount || 5);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleCreateCouponSubmit = async (e) => {
        e.preventDefault();
        if (!couponCode.trim() || !discountPercentage) {
            showAlert("Required", "Please enter coupon code and discount percentage", "warning");
            return;
        }
        setCreatingCoupon(true);
        try {
            await onCreateCoupon({
                couponCode: couponCode.trim().toUpperCase(),
                discountPercentage: Number(discountPercentage),
                expiryDate,
                maxUses: Number(maxUses)
            });
            setCouponCode("");
            setDiscountPercentage("");
            setExpiryDate("");
            setMaxUses(10);
        } finally {
            setCreatingCoupon(false);
        }
    };

    const handleCreateRewardSubmit = async (e) => {
        e.preventDefault();
        if (!rewardTitle.trim() || !rewardCode.trim() || !rewardAmt) {
            showAlert("Required", "Title, Code, and Amount are required", "warning");
            return;
        }
        setCreatingReward(true);
        try {
            await onCreateReward({
                title: rewardTitle.trim(),
                description: rewardDesc.trim(),
                rewardAmount: Number(rewardAmt),
                rewardCode: rewardCode.trim().toUpperCase(),
                maxClaims: Number(rewardMaxClaims)
            });
            setRewardTitle("");
            setRewardDesc("");
            setRewardAmt("");
            setRewardCode("");
            setRewardMaxClaims(100);
        } finally {
            setCreatingReward(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Base Block Pricing Editor */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Tag className="w-5 h-5 text-cyan-400" />
                            Per-Page Pricing Management
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Configure live printing rates per page by campus block</p>
                    </div>

                    {/* Block Selector */}
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 font-bold">Active Block:</span>
                        <select
                            value={selectedBlock}
                            onChange={(e) => onSelectBlock && onSelectBlock(e.target.value)}
                            className="bg-transparent text-cyan-300 font-black cursor-pointer outline-none"
                        >
                            {blocks.map(b => (
                                <option key={b.id || b.name} value={b.name} className="bg-slate-900 text-white">
                                    {b.name} ({b.college || "KLU"})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* B&W Price */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                            Black & White (₹/page)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                            <input
                                type="number"
                                step="0.25"
                                value={bwPrice}
                                onChange={(e) => setBwPrice(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-base outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Color Price */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                            Full Color (₹/page)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                            <input
                                type="number"
                                step="0.5"
                                value={colorPrice}
                                onChange={(e) => setColorPrice(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-base outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Duplex Price */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                            Double Sided (₹/sheet)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                            <input
                                type="number"
                                step="0.25"
                                value={duplexPrice}
                                onChange={(e) => setDuplexPrice(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-base outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onSavePrices}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
                    >
                        Save Updated Rates
                    </button>
                </div>
            </div>

            {/* 2. Coupons Creator & Active Coupons List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Coupon Form */}
                <form onSubmit={handleCreateCouponSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Percent className="w-4 h-4 text-emerald-400" />
                            Create Discount Coupon
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Generate promo codes for students</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Coupon Code</label>
                            <input
                                type="text"
                                placeholder="e.g. EXAM25"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase font-black outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Discount (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    min="1"
                                    max="100"
                                    value={discountPercentage}
                                    onChange={(e) => setDiscountPercentage(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Max Uses</label>
                                <input
                                    type="number"
                                    placeholder="100"
                                    min="1"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Expiration Date (Optional)</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {[
                                    { label: "Today", days: 0 },
                                    { label: "Tomorrow", days: 1 },
                                    { label: "1 Week", days: 7 },
                                    { label: "1 Month", days: 30 },
                                    { label: "1 Year", days: 365 },
                                ].map(preset => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + preset.days);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = expiryDate === dateStr;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => setExpiryDate(dateStr)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-600 text-white border-emerald-500"
                                                    : "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={creatingCoupon}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {creatingCoupon ? "Generating..." : "Publish Coupon"}
                    </button>
                </form>

                {/* Active Coupons Table */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">Active Promotional Coupons</h4>
                        <span className="text-xs text-slate-400">{coupons.length} Active</span>
                    </div>

                    <div className="overflow-x-auto max-h-72 custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                    <th className="py-2.5 px-3">Code</th>
                                    <th className="py-2.5 px-3">Discount</th>
                                    <th className="py-2.5 px-3">Usage</th>
                                    <th className="py-2.5 px-3">Expires</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">
                                            No active coupons found. Create one on the left.
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-800/30">
                                            <td className="py-2.5 px-3 font-mono font-black text-emerald-400">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{c.couponCode}</span>
                                                    <button
                                                        onClick={() => handleCopy(c.couponCode)}
                                                        className="text-slate-500 hover:text-white cursor-pointer"
                                                        title="Copy Code"
                                                    >
                                                        {copiedCode === c.couponCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 font-bold text-white">{c.discountPercentage}% OFF</td>
                                            <td className="py-2.5 px-3 text-slate-300">
                                                {c.usedCount || 0} / {c.maxUses || "∞"}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400">{c.expiryDate || "Never"}</td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    onClick={() => onDeleteCoupon && onDeleteCoupon(c.id)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. Reward Vouchers & Referral Bonus Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reward Vouchers Generator */}
                <form onSubmit={handleCreateRewardSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Gift className="w-4 h-4 text-purple-400" />
                            Claimable Reward Vouchers
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Students can redeem these directly into their wallet</p>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Voucher Title</label>
                                <input
                                    type="text"
                                    placeholder="Fresher Welcome"
                                    value={rewardTitle}
                                    onChange={(e) => setRewardTitle(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Secret Code</label>
                                <input
                                    type="text"
                                    placeholder="WELCOME50"
                                    value={rewardCode}
                                    onChange={(e) => setRewardCode(e.target.value.toUpperCase())}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase font-black outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Wallet Credit (₹)</label>
                                <input
                                    type="number"
                                    placeholder="50"
                                    value={rewardAmt}
                                    onChange={(e) => setRewardAmt(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Max Claims</label>
                                <input
                                    type="number"
                                    placeholder="100"
                                    value={rewardMaxClaims}
                                    onChange={(e) => setRewardMaxClaims(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={creatingReward}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {creatingReward ? "Creating Voucher..." : "Issue Reward Voucher"}
                    </button>
                </form>

                {/* Referral Commission Config */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Referral Reward Rules
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Automated wallet bonuses awarded upon first successful print</p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <label className="text-xs font-bold text-slate-300">Referrer Bonus (User who invites)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={refReferrerAmt}
                                    onChange={(e) => setRefReferrerAmt(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <label className="text-xs font-bold text-slate-300">Referee Bonus (New registered student)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={refRefereeAmt}
                                    onChange={(e) => setRefRefereeAmt(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onUpdateSystemSettings && onUpdateSystemSettings({
                            ...systemSettings,
                            referrerAmount: refReferrerAmt,
                            refereeAmount: refRefereeAmt
                        })}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-black text-xs transition-all cursor-pointer"
                    >
                        Update Referral Rules
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PricingCouponsSection;
