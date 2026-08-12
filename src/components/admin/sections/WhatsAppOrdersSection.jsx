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
        return channel === "WHATSAPP" || email.includes("@c.us") || email.includes("whatsapp") || /^\+?[0-9]{10,13}$/.test(name.trim());
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

    return (
        <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                            <p className="font-bold text-cyan-300">{order.printType || "BW"} • {order.copies || 1} copies</p>
                                            <p className="text-[10px] text-slate-400">Pages: {order.selectedPages || "ALL"}</p>
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
