import React, { useState, useEffect, useRef } from "react";
import { Globe, Phone, User, Search, Download, Printer, CheckCircle, Clock, ExternalLink, Trash2 } from "lucide-react";
import StatusBadge from "../../common/StatusBadge";
import MetricCard from "../../common/MetricCard";
import api, { getPdfDownloadUrl } from "../../../services/api";

export function WebOrdersSection({
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
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchOrders();
            }
        }, 15000);
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

    // Web orders are all non-WhatsApp orders
    const webOrders = orders.filter(o => !isWhatsAppOrder(o));

    const filteredOrders = webOrders.filter(order => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const idMatch = (order.orderId || "").toLowerCase().includes(q);
            const nameMatch = (order.customerName || "").toLowerCase().includes(q);
            const emailMatch = (order.userEmail || order.email || "").toLowerCase().includes(q);
            const otpMatch = (order.otpCode || "").toString().includes(q);
            return idMatch || nameMatch || emailMatch || otpMatch;
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

    const handleDeleteOrder = (orderId) => {
        if (localStorage.getItem("adminRole") !== "MAIN_ADMIN" && localStorage.getItem("adminUser") !== "admin") {
            showAlert && showAlert("Only the main admin has permission to delete orders from the database!", "error");
            return;
        }
        if (!orderId) return;

        // Instant optimistic UI deletion: disappears immediately upon pressing delete
        setOrders(prev => prev.filter(o => o.orderId !== orderId && o.id !== orderId && String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId)));

        api.post("/admin/orders/delete", null, {
            params: {
                adminUsername: localStorage.getItem("adminUser") || "admin",
                orderId: String(orderId)
            }
        }).catch(err => {
            console.error("Error deleting order:", err);
            showAlert && showAlert("Failed to delete order: " + (err.response?.data || err.message), "error");
            fetchOrders();
        });
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

    const paidWebOrders = webOrders.filter(isPaidOrder);

    const webRevenue = paidWebOrders.reduce((sum, o) => {
        const orig = o.originalPrice != null ? o.originalPrice : o.price;
        return { gross: sum.gross + (orig || 0), net: sum.net + (o.price || 0) };
    }, { gross: 0, net: 0 });

    const webWallet = paidWebOrders.filter(o => {
        const payId = (o.razorpayPaymentId || "").toUpperCase();
        const pMethod = (o.paymentMethod || "").toUpperCase();
        return payId === "WALLET" || pMethod === "WALLET";
    }).reduce((s, o) => s + (o.price || 0), 0);

    const webUpi = Math.max(0, webRevenue.net - webWallet);
    const avgOrderVal = paidWebOrders.length > 0 ? webRevenue.net / paidWebOrders.length : 0;

    return (
        <div className="space-y-6">
            {/* Revenue Header Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#38bdf8] shadow-2xl">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🌐</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 text-white border border-white/30">
                                Web Portal Channel
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Web Orders</h2>
                        <p className="text-sm text-sky-100/80 font-semibold mt-0.5">Revenue & order metrics for student web app-placed print jobs</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3">
                            <p className="text-2xl font-black text-white">₹{webRevenue.gross.toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-sky-100 uppercase tracking-wider mt-0.5">Gross Revenue</p>
                        </div>
                        <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3">
                            <p className="text-2xl font-black text-white">₹{webRevenue.net.toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-sky-100 uppercase tracking-wider mt-0.5">Net Collected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                    title="Web Orders"
                    value={webOrders.length}
                    icon={Globe}
                    color="sky"
                    subtitle="Student web portal jobs"
                />
                <MetricCard
                    title="In Queue"
                    value={webOrders.filter(o => o.status === "QUEUE").length}
                    icon={Clock}
                    color="amber"
                    subtitle="Awaiting physical release"
                />
                <MetricCard
                    title="Completed"
                    value={webOrders.filter(o => o.status === "COMPLETED").length}
                    icon={CheckCircle}
                    color="emerald"
                    subtitle="Released successfully"
                />
                <MetricCard
                    title="Avg Order Value"
                    value={`₹${avgOrderVal.toFixed(2)}`}
                    icon={Download}
                    color="purple"
                    subtitle="Per paid web order"
                />
            </div>

            {/* Payment Method Breakdown */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg">
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider mb-3">💳 Payment Method Split</p>
                    <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex mb-3.5">
                        <div
                            className="bg-cyan-500 h-full transition-all"
                            style={{ width: `${webRevenue.net > 0 ? (webWallet / webRevenue.net) * 100 : 50}%` }}
                        />
                        <div
                            className="bg-indigo-500 h-full transition-all"
                            style={{ width: `${webRevenue.net > 0 ? (webUpi / webRevenue.net) * 100 : 50}%` }}
                        />
                    </div>
                    <div className="flex flex-col gap-2 text-xs font-bold">
                        <div className="flex items-center justify-between text-cyan-300">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
                                <span className="text-slate-200">Wallet</span>
                            </div>
                            <span className="font-black font-mono">₹{webWallet.toFixed(2)} ({webRevenue.net > 0 ? ((webWallet / webRevenue.net) * 100).toFixed(1) : 0}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-indigo-300">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block shadow-sm shadow-indigo-400/50"></span>
                                <span className="text-slate-200">Direct UPI / Razorpay</span>
                            </div>
                            <span className="font-black font-mono">₹{webUpi.toFixed(2)} ({webRevenue.net > 0 ? ((webUpi / webRevenue.net) * 100).toFixed(1) : 0}%)</span>
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg">
                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider mb-3">📊 Order Status Breakdown</p>
                    {["QUEUE", "PRINTING", "COMPLETED", "CANCELLED"].map(s => {
                        const count = webOrders.filter(o => o.status === s).length;
                        const pct = webOrders.length > 0 ? (count / webOrders.length) * 100 : 0;
                        const colors = { QUEUE: "bg-amber-400", PRINTING: "bg-sky-400", COMPLETED: "bg-emerald-400", CANCELLED: "bg-rose-400" };
                        return (
                            <div key={s} className="flex items-center gap-2 mb-2.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${colors[s] || "bg-slate-400"} shrink-0`}></span>
                                <span className="text-[11px] font-bold text-slate-300 min-w-[75px]">{s}</span>
                                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div className={`${colors[s] || "bg-slate-400"} h-full transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-black text-white min-w-[24px] text-right">{count}</span>
                                <span className="text-xs text-slate-300 font-bold min-w-[36px] text-right font-mono">{pct.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by Student Name, Email, Order ID, or OTP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-medium outline-none focus:border-sky-500 transition-colors"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer font-bold focus:border-sky-500 transition-colors"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="QUEUE">In Queue</option>
                    <option value="PRINTING">Printing</option>
                    <option value="COMPLETED">Completed</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-950 text-slate-200 font-black uppercase text-[11px] tracking-wider">
                                <th className="p-4">Student / Customer</th>
                                <th className="p-4">Order ID & OTP</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Print Specs</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold text-sm">
                                        No Web Portal orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id || order.orderId} className="hover:bg-slate-800/60 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{order.customerName || "Student"}</p>
                                                    <p className="text-[11px] text-slate-400 font-mono">{order.userEmail || order.email || "web@cloudprint.website"}</p>
                                                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">🌐 Web Portal</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono">
                                            <p className="font-black text-white text-sm">#{order.orderId || order.id}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-black text-[11px]">
                                                OTP: {order.otpCode || "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold inline-flex items-center gap-1">
                                                📍 {order.blockLocation || "Default Block"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {(() => {
                                                const pages = getPagesCount(order);
                                                const copies = order.copies || 1;
                                                const totalPrinted = pages * copies;
                                                return (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-black text-cyan-300 text-xs uppercase">{order.printType || "BW"}</span>
                                                            <span className="text-slate-500">•</span>
                                                            <span className="font-bold text-white text-xs">{copies} {copies > 1 ? "copies" : "copy"}</span>
                                                            {order.doubleSided && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-950 text-indigo-300 border border-indigo-500/40 uppercase">
                                                                    Duplex
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-black text-[11px]">
                                                                📄 {pages} {pages > 1 ? "pages" : "page"}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-black text-[11px]">
                                                                🖨️ {totalPrinted} {totalPrinted > 1 ? "sheets" : "sheet"} printed
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-300 font-mono font-semibold">Pages: {order.selectedPages || "ALL"}</p>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4 font-black text-emerald-400 text-base font-mono">
                                            ₹{Number(order.price || 0).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(getPdfDownloadUrl(order.orderId || order.id), "_blank")}
                                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 transition-all cursor-pointer"
                                                    title="View PDF"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>

                                                {order.status === "QUEUE" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.orderId || order.id, "PRINTING")}
                                                        className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                                                    >
                                                        Print
                                                    </button>
                                                )}

                                                {order.status === "PRINTING" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.orderId || order.id, "COMPLETED")}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                                                    >
                                                        Done
                                                    </button>
                                                )}

                                                {(localStorage.getItem("adminRole") === "MAIN_ADMIN" || localStorage.getItem("adminUser") === "admin") && (
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.orderId || order.id)}
                                                        className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                                                        title="Delete this order permanently (Main Admin Only)"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

export default WebOrdersSection;
