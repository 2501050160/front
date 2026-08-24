import React, { useState } from "react";
import { FileText, KeyRound, Receipt, ExternalLink, Search, Clock, CheckCircle2, XCircle, AlertTriangle, Printer } from "lucide-react";
import StatusBadge from "../../common/StatusBadge";
import api, { getPdfDownloadUrl } from "../../../services/api";

export function OrdersSection({
    orders = [],
    isLoading = false,
    onCancelOrder,
    onRefresh
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOtpOrder, setSelectedOtpOrder] = useState(null);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const [isReleasing, setIsReleasing] = useState(false);
    const [releaseSuccess, setReleaseSuccess] = useState(false);

    const handleReleasePrint = async (order) => {
        if (!order || !order.otpCode) return;
        setIsReleasing(true);
        try {
            await api.post("/pdf/releasePrint", null, {
                params: {
                    orderId: order.orderId || order.id,
                    otp: order.otpCode.trim()
                }
            });
            setReleaseSuccess(true);
            setTimeout(() => {
                setSelectedOtpOrder(null);
                setReleaseSuccess(false);
                if (onRefresh) onRefresh();
            }, 1500);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to release print. Please enter OTP at the kiosk.");
        } finally {
            setIsReleasing(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const idMatch = (o.orderId || o.id || "").toString().toLowerCase().includes(q);
        const nameMatch = (o.fileName || o.customerName || "").toLowerCase().includes(q);
        const blockMatch = (o.blockLocation || "").toLowerCase().includes(q);
        return idMatch || nameMatch || blockMatch;
    });

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        My Print Orders & History
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Track live print status and access your OTP pickup codes
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or File Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Orders Grid / Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-black uppercase text-[10px]">
                                <th className="p-4">Order ID & OTP</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Kiosk Location</th>
                                <th className="p-4">Print Specs</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                                        <p className="font-bold text-slate-400 text-sm">No orders found</p>
                                        <p className="text-xs text-slate-600 mt-0.5">Your submitted print orders will appear here</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id || order.orderId} className="hover:bg-slate-800/30 transition-colors">
                                        {/* Order ID & OTP */}
                                        <td className="p-4 font-mono">
                                            <p className="font-black text-white">#{order.orderId || order.id}</p>
                                            {order.otpCode && (
                                                <button
                                                    onClick={() => setSelectedOtpOrder(order)}
                                                    className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-black text-[11px] border border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer"
                                                >
                                                    <KeyRound className="w-3 h-3" />
                                                    OTP: {order.otpCode}
                                                </button>
                                            )}
                                        </td>

                                        {/* Timestamp */}
                                        <td className="p-4 text-slate-300">
                                            {(() => {
                                                const rawTime = order.uploadTime || order.createdAt;
                                                if (!rawTime) return "—";
                                                try {
                                                    let str = String(rawTime).trim();
                                                    if (!str.endsWith('Z') && !str.includes('+') && !str.includes('GMT') && !str.includes('Z')) {
                                                        str = str.replace(' ', 'T') + 'Z';
                                                    }
                                                    const d = new Date(str);
                                                    return isNaN(d.getTime()) ? String(rawTime) : d.toLocaleString("en-IN", {
                                                        timeZone: "Asia/Kolkata",
                                                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
                                                    });
                                                } catch (e) {
                                                    return String(rawTime);
                                                }
                                            })()}
                                        </td>

                                        {/* Location */}
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-bold text-[11px] border border-slate-700">
                                                📍 {order.blockLocation || "Default Block"}
                                            </span>
                                        </td>

                                        {/* Specs */}
                                        <td className="p-4 space-y-0.5">
                                            <p className="font-bold text-cyan-300">
                                                {order.printType || "BW"} • {order.copies || 1} copies
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Pages: {order.selectedPages || "ALL"} {order.doubleSided ? "(Duplex)" : ""}
                                            </p>
                                        </td>

                                        {/* Price */}
                                        <td className="p-4 font-black text-white text-sm">
                                            ₹{Number(order.price || 0).toFixed(2)}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* PDF Download */}
                                                <button
                                                    onClick={() => window.open(getPdfDownloadUrl(order.orderId || order.id), "_blank")}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
                                                    title="View PDF File"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Invoice */}
                                                {order.status === "COMPLETED" && (
                                                    <button
                                                        onClick={() => setSelectedInvoiceOrder(order)}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                                                        title="View Digital Receipt"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* OTP Popup Modal */}
            {selectedOtpOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                            <KeyRound className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white">Your Pickup OTP</h3>
                            <p className="text-xs text-slate-400 mt-1">Enter this PIN on kiosk display or release directly below</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                            <span className="font-mono text-4xl font-black text-cyan-300 tracking-widest">
                                {selectedOtpOrder.otpCode || "N/A"}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {selectedOtpOrder.status === "PENDING_SCAN" && (
                                <button
                                    onClick={() => handleReleasePrint(selectedOtpOrder)}
                                    disabled={isReleasing || releaseSuccess}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                >
                                    <Printer className="w-4 h-4" />
                                    {isReleasing ? "Releasing..." : releaseSuccess ? "✅ Released to Printer!" : "🚀 Release Print to Kiosk"}
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedOtpOrder(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Popup Modal */}
            {selectedInvoiceOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-black text-white">Digital Print Receipt</h3>
                                <p className="text-xs text-slate-400 font-mono">Order #{selectedInvoiceOrder.orderId || selectedInvoiceOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoiceOrder(null)}
                                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-300">
                                <span>Kiosk Location:</span>
                                <span className="font-bold text-white">{selectedInvoiceOrder.blockLocation}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Pages & Layout:</span>
                                <span className="font-bold text-white">{selectedInvoiceOrder.selectedPages} ({selectedInvoiceOrder.printType})</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Copies:</span>
                                <span className="font-bold text-white">{selectedInvoiceOrder.copies || 1}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Payment Mode:</span>
                                <span className="font-bold text-emerald-400">{selectedInvoiceOrder.paymentStatus || "PAID"}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                                <span className="font-black text-white">Amount Paid:</span>
                                <span className="font-black text-cyan-400">₹{Number(selectedInvoiceOrder.price || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedInvoiceOrder(null)}
                            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
                        >
                            Close Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrdersSection;
