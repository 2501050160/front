import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Phone, User, Search, Download, Printer, CheckCircle, Clock, ExternalLink } from "lucide-react";
import StatusBadge from "../../common/StatusBadge";
import MetricCard from "../../common/MetricCard";
import api, { getPdfDownloadUrl } from "../../../services/api";

export function WhatsAppOrdersSection({
    showAlert,
    showConfirm
}) {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const prevOrdersRef = useRef("");

    const fetchOrders = async () => {
        try {
            const res = await api.get("/pdf/orders");
            const data = res.data || [];
            const hash = JSON.stringify(data.map(o => ({ id: o.id, status: o.status, printStatus: o.printStatus })));
            if (hash !== prevOrdersRef.current) {
                prevOrdersRef.current = hash;
                setOrders(data);
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 4000);
        return () => clearInterval(interval);
    }, []);

    const isWhatsAppOrder = (o) => {
        if (!o) return false;
        const name = (o.customerName || "").toLowerCase();
        const email = (o.userEmail || o.email || "").toLowerCase();
        const channel = (o.orderChannel || "").toUpperCase();
        const referral = (o.appliedReferralCode || "").toUpperCase();
        const orderIdStr = (o.orderId || "").toUpperCase();

        return (
            channel === "WHATSAPP" ||
            channel === "BOT" ||
            channel === "WA" ||
            email.includes("@c.us") ||
            email.includes("whatsapp") ||
            email.startsWith("wa_") ||
            referral.startsWith("WA_") ||
            orderIdStr.startsWith("WA_") ||
            name.includes("+91") ||
            name.includes("(+91") ||
            name.includes("whatsapp") ||
            name.includes("wa_") ||
            /\+?91[\s-]*[0-9]{10}/.test(name) ||
            /\b[6-9][0-9]{9}\b/.test(name) ||
            /[0-9]{10}/.test(name.replace(/[^0-9]/g, ""))
        );
    };

    const waOrders = orders.filter(isWhatsAppOrder);

    const filteredOrders = waOrders.filter(order => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const idMatch = (order.orderId || "").toLowerCase().includes(q);
            const phoneMatch = (order.customerName || order.userEmail || "").toLowerCase().includes(q);
            const otpMatch = (order.otpCode || "").toString().includes(q);
            return idMatch || phoneMatch || otpMatch;
        }
        return true;
    });

    const getPagesCount = (order) => {
        if (!order.selectedPages || order.selectedPages.toUpperCase() === "ALL") {
            return order.totalPages || 1;
        }
        const cleaned = order.selectedPages.split(',').map(x => x.trim()).filter(Boolean);
        if (cleaned.length > 0) {
            let total = 0;
            cleaned.forEach(part => {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) total += Math.max(0, end - start + 1);
                    else total += 1;
                } else {
                    total += 1;
                }
            });
            return total || order.totalPages || 1;
        }
        return order.totalPages || 1;
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.post(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
            fetchOrders();
            showAlert("Status Updated", `Order #${orderId} status changed to ${newStatus}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const isPaidOrder = (o) => {
        if (!o) return false;
        if (o.status === "CANCELLED") return false;
        const pStatus = (o.paymentStatus || "").toUpperCase();
        const oStatus = (o.status || "").toUpperCase();
        return (
            pStatus === "PAID" ||
            pStatus === "SUCCESS" ||
            pStatus === "COMPLETED" ||
            oStatus === "PAID" ||
            oStatus === "COMPLETED" ||
            oStatus === "PRINTING" ||
            oStatus === "PRINTED" ||
            oStatus === "QUEUE" ||
            oStatus === "CANCEL_WINDOW" ||
            oStatus === "PENDING_SCAN" ||
            Boolean(o.razorpayPaymentId) ||
            Boolean(o.paid)
        );
    };

    const paidWaOrders = waOrders.filter(isPaidOrder);

    const waRevenue = paidWaOrders.reduce((sum, o) => {
        const orig = o.originalPrice != null ? o.originalPrice : o.price;
        return { gross: sum.gross + (orig || 0), net: sum.net + (o.price || 0) };
    }, { gross: 0, net: 0 });

    const waWallet = paidWaOrders.filter(o => {
        const payId = (o.razorpayPaymentId || "").toUpperCase();
        const pMethod = (o.paymentMethod || "").toUpperCase();
        return payId === "WALLET" || pMethod === "WALLET";
    }).reduce((s, o) => s + (o.price || 0), 0);

    const waUpi = Math.max(0, waRevenue.net - waWallet);
    const avgOrderVal = paidWaOrders.length > 0 ? waRevenue.net / paidWaOrders.length : 0;

    return (
        <div className="space-y-6">
            {/* Revenue Header Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#075e54] via-[#128c7e] to-[#25d366] shadow-2xl">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">💬</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 text-white border border-white/30">
                                WhatsApp Bot Channel
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">WhatsApp Orders</h2>
                        <p className="text-sm text-green-100/80 font-semibold mt-0.5">Revenue & order metrics for WhatsApp bot-placed print jobs</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3">
                            <p className="text-2xl font-black text-white">₹{waRevenue.gross.toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-green-100 uppercase tracking-wider mt-0.5">Gross Revenue</p>
                        </div>
                        <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3">
                            <p className="text-2xl font-black text-white">₹{waRevenue.net.toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-green-100 uppercase tracking-wider mt-0.5">Net Collected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                    title="WhatsApp Orders"
                    value={waOrders.length}
                    icon={MessageSquare}
                    color="emerald"
                    subtitle="Bot incoming print jobs"
                />
                <MetricCard
                    title="In Queue"
                    value={waOrders.filter(o => o.status === "QUEUE").length}
                    icon={Clock}
                    color="amber"
                    subtitle="Awaiting physical release"
                />
                <MetricCard
                    title="Completed"
                    value={waOrders.filter(o => o.status === "COMPLETED").length}
                    icon={CheckCircle}
                    color="cyan"
                    subtitle="Released successfully"
                />
                <MetricCard
                    title="Avg Order Value"
                    value={`₹${avgOrderVal.toFixed(2)}`}
                    icon={Download}
                    color="purple"
                    subtitle="Per paid WA order"
                />
            </div>

            {/* Payment Method Breakdown */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">💳 Payment Method Split</p>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex mb-3">
                        <div
                            className="bg-cyan-500 h-full transition-all"
                            style={{ width: `${waRevenue.net > 0 ? (waWallet / waRevenue.net) * 100 : 50}%` }}
                        />
                        <div
                            className="bg-indigo-500 h-full transition-all"
                            style={{ width: `${waRevenue.net > 0 ? (waUpi / waRevenue.net) * 100 : 50}%` }}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs font-bold">
                        <div className="flex items-center justify-between text-cyan-300">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                                <span>Wallet</span>
                            </div>
                            <span>₹{waWallet.toFixed(2)} ({waRevenue.net > 0 ? ((waWallet / waRevenue.net) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-indigo-300">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                <span>Direct UPI / Razorpay</span>
                            </div>
                            <span>₹{waUpi.toFixed(2)} ({waRevenue.net > 0 ? ((waUpi / waRevenue.net) * 100).toFixed(1) : 0}%)</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">📊 Order Status Breakdown</p>
                    {["QUEUE", "PRINTING", "COMPLETED", "CANCELLED"].map(s => {
                        const count = waOrders.filter(o => o.status === s).length;
                        const pct = waOrders.length > 0 ? (count / waOrders.length) * 100 : 0;
                        const colors = { QUEUE: "bg-amber-400", PRINTING: "bg-sky-400", COMPLETED: "bg-emerald-400", CANCELLED: "bg-rose-400" };
                        return (
                            <div key={s} className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${colors[s] || "bg-slate-400"} shrink-0`}></span>
                                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div className={`${colors[s] || "bg-slate-400"} h-full transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-300 min-w-[24px] text-right">{count}</span>
                                <span className="text-[10px] text-slate-500 font-bold min-w-[32px]">{pct.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by WhatsApp Phone Number, Order ID, or OTP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer font-bold"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="QUEUE">In Queue</option>
                    <option value="PRINTING">Printing</option>
                    <option value="COMPLETED">Completed</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-black uppercase text-[10px]">
                                <th className="p-4">WhatsApp Phone</th>
                                <th className="p-4">Order ID & OTP</th>
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
                                    <td colSpan={7} className="p-12 text-center text-slate-500">
                                        No WhatsApp Bot orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id || order.orderId} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-mono font-black text-white">{order.customerName || order.userEmail || "WhatsApp User"}</p>
                                                    <span className="text-[10px] text-emerald-400 font-bold">WhatsApp Agent</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono">
                                            <p className="font-bold text-white">#{order.orderId || order.id}</p>
                                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold text-[10px]">
                                                OTP: {order.otpCode || "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-bold">
                                                📍 {order.blockLocation || "Default Block"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {(() => {
                                                const pages = getPagesCount(order);
                                                const copies = order.copies || 1;
                                                const totalPrinted = pages * copies;
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-cyan-300">{order.printType || "BW"}</span>
                                                            <span className="text-slate-500">•</span>
                                                            <span className="font-semibold text-slate-200">{copies} {copies > 1 ? "copies" : "copy"}</span>
                                                            {order.doubleSided && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                                    Duplex
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-black text-[10px] border border-sky-500/20">
                                                                📄 {pages} {pages > 1 ? "pages" : "page"}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-black text-[10px] border border-emerald-500/20">
                                                                🖨️ {totalPrinted} {totalPrinted > 1 ? "sheets" : "sheet"} printed
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-mono">Pages: {order.selectedPages || "ALL"}</p>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4 font-black text-white text-sm">
                                            ₹{Number(order.price || 0).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => window.open(getPdfDownloadUrl(order.orderId || order.id), "_blank")}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
                                                    title="View PDF"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>

                                                {order.status === "QUEUE" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.orderId || order.id, "PRINTING")}
                                                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer"
                                                    >
                                                        Print
                                                    </button>
                                                )}

                                                {order.status === "PRINTING" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.orderId || order.id, "COMPLETED")}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                                                    >
                                                        Done
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
        </div>
    );
}

export default WhatsAppOrdersSection;
