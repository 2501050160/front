import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    Filter, 
    Download, 
    Trash2, 
    Eye, 
    Printer, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Layers, 
    FileText, 
    KeyRound, 
    ArrowUpDown,
    ExternalLink,
    RefreshCw
} from "lucide-react";
import StatusBadge from "../../common/StatusBadge";
import MetricCard from "../../common/MetricCard";
import { getPdfDownloadUrl } from "../../../services/api";

export function QueueSection({
    orders = [],
    blocks = [],
    onUpdateStatus,
    onDeleteOrder,
    onRefresh,
    showAlert,
    showConfirm,
    onExportCSV
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [blockFilter, setBlockFilter] = useState("ALL");
    const [sortAsc, setSortAsc] = useState(false);
    const [viewOtpModalOrder, setViewOtpModalOrder] = useState(null);

    // Compute stats
    const totalOrders = orders.length;
    const queueOrders = orders.filter(o => o.status === "QUEUE").length;
    const printingOrders = orders.filter(o => o.status === "PRINTING").length;
    const completedOrders = orders.filter(o => o.status === "COMPLETED").length;
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED" || o.status === "CANCEL_WINDOW").length;

    // Filter and Sort orders
    const filteredOrders = orders.filter(order => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
        if (blockFilter !== "ALL" && order.blockLocation !== blockFilter) return false;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const idMatch = (order.orderId || "").toLowerCase().includes(q);
            const userMatch = (order.customerName || order.userEmail || order.email || "").toLowerCase().includes(q);
            const otpMatch = (order.otpCode || "").toString().includes(q);
            const blockMatch = (order.blockLocation || "").toLowerCase().includes(q);
            return idMatch || userMatch || otpMatch || blockMatch;
        }
        return true;
    }).sort((a, b) => {
        const timeA = new Date(a.uploadTime || a.createdAt || 0).getTime();
        const timeB = new Date(b.uploadTime || b.createdAt || 0).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
    });

    const handleExport = () => {
        if (onExportCSV) {
            onExportCSV(filteredOrders, "orders_queue", [
                "Order ID", "Date & Time", "Location", "Customer", "Pages", "Copies", "Price", "Payment", "Order Status"
            ]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <MetricCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={Layers}
                    color="sky"
                    subtitle="All recorded jobs"
                />
                <MetricCard
                    title="In Queue"
                    value={queueOrders}
                    icon={Clock}
                    color="amber"
                    subtitle="Waiting for release"
                />
                <MetricCard
                    title="Printing Now"
                    value={printingOrders}
                    icon={Printer}
                    color="cyan"
                    subtitle="Active machine jobs"
                />
                <MetricCard
                    title="Completed"
                    value={completedOrders}
                    icon={CheckCircle2}
                    color="emerald"
                    subtitle="Printed successfully"
                />
                <MetricCard
                    title="Cancelled"
                    value={cancelledOrders}
                    icon={XCircle}
                    color="rose"
                    subtitle="Refunded or voided"
                />
            </div>

            {/* Controls Bar: Search, Filters & Export */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-lg">
                <div className="flex-1 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Name, Email, or OTP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-bold outline-none cursor-pointer"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="QUEUE">In Queue</option>
                        <option value="PRINTING">Printing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    {/* Block Location Filter */}
                    <select
                        value={blockFilter}
                        onChange={(e) => setBlockFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-bold outline-none cursor-pointer"
                    >
                        <option value="ALL">All Blocks</option>
                        {blocks.map(b => (
                            <option key={b.id || b.name} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* Right Side Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortAsc(!sortAsc)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                        title="Sort by Timestamp"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>{sortAsc ? "Oldest First" : "Newest First"}</span>
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Orders Table Container */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-black uppercase tracking-wider">
                                <th className="p-4">Order ID & OTP</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Customer Details</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Print Specs</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-500">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
                                        <p className="text-base font-bold text-slate-400">No print jobs found</p>
                                        <p className="text-xs text-slate-600 mt-1">Try adjusting your filters or search keywords</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr 
                                        key={order.id || order.orderId}
                                        className="hover:bg-slate-800/40 transition-colors group"
                                    >
                                        {/* Order ID & OTP */}
                                        <td className="p-4 font-mono">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white tracking-wide">#{order.orderId || order.id}</span>
                                            </div>
                                            {order.otpCode && (
                                                <button
                                                    onClick={() => setViewOtpModalOrder(order)}
                                                    className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-black cursor-pointer hover:bg-cyan-500/20"
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

                                        {/* Customer */}
                                        <td className="p-4">
                                            <p className="font-bold text-white truncate max-w-[160px]">{order.customerName || "Customer"}</p>
                                            <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{order.userEmail || order.email || "—"}</p>
                                        </td>

                                        {/* Block */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-bold text-[11px] border border-slate-700">
                                                📍 {order.blockLocation || "Default Block"}
                                            </span>
                                        </td>

                                        {/* Print Specs */}
                                        <td className="p-4 space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-cyan-300">{order.printType || "BW"}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-300">{order.copies || 1} copies</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Pages: {order.selectedPages || "ALL"} {order.doubleSided ? "(Duplex)" : ""}
                                            </p>
                                        </td>

                                        {/* Price & Payment */}
                                        <td className="p-4">
                                            <p className="font-black text-white text-sm">₹{Number(order.price || 0).toFixed(2)}</p>
                                            <StatusBadge status={order.paymentStatus || (order.razorpayPaymentId ? "PAID" : "UNPAID")} type="payment" />
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* PDF Download Link */}
                                                <button
                                                    onClick={() => window.open(getPdfDownloadUrl(order.orderId || order.id), "_blank")}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-all cursor-pointer"
                                                    title="View / Download PDF Document"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Quick Status Changers */}
                                                {order.status === "QUEUE" && onUpdateStatus && (
                                                    <button
                                                        onClick={() => onUpdateStatus(order.orderId || order.id, "PRINTING")}
                                                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                        title="Start Printing"
                                                    >
                                                        <Printer className="w-3 h-3" />
                                                        Print
                                                    </button>
                                                )}

                                                {order.status === "PRINTING" && onUpdateStatus && (
                                                    <button
                                                        onClick={() => onUpdateStatus(order.orderId || order.id, "COMPLETED")}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                        title="Mark Completed"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Done
                                                    </button>
                                                )}

                                                {/* Delete Action */}
                                                {onDeleteOrder && (
                                                    <button
                                                        onClick={() => onDeleteOrder(order.orderId || order.id)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                                        title="Cancel / Delete Order"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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

            {/* OTP Modal Popup */}
            <AnimatePresence>
                {viewOtpModalOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Kiosk Release OTP</h3>
                                <p className="text-xs text-slate-400 mt-1">Order #{viewOtpModalOrder.orderId}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                                <span className="font-mono text-3xl font-black text-cyan-300 tracking-widest">
                                    {viewOtpModalOrder.otpCode || "N/A"}
                                </span>
                            </div>
                            <button
                                onClick={() => setViewOtpModalOrder(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default QueueSection;
