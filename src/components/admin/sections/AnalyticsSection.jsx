import React, { useState } from "react";
import { 
    DollarSign, 
    TrendingUp, 
    BarChart3, 
    Layers, 
    Calendar, 
    Download, 
    PieChart as PieIcon, 
    School 
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid, 
    PieChart, 
    Pie, 
    Cell 
} from "recharts";
import MetricCard from "../../common/MetricCard";

export function AnalyticsSection({
    orders = [],
    stats = {},
    revenuePeriod = "all",
    onPeriodChange,
    onExportCSV
}) {
    const [chartPeriod, setChartPeriod] = useState("daily");

    const totalRevenue = stats.totalRevenue || orders.filter(o => o.paymentStatus === "PAID" || o.razorpayPaymentId).reduce((sum, o) => sum + (o.price || 0), 0);
    const paidOrders = orders.filter(o => o.paymentStatus === "PAID" || o.razorpayPaymentId);
    const avgOrderValue = paidOrders.length > 0 ? (totalRevenue / paidOrders.length) : 0;
    
    // Total pages printed
    const totalPages = orders.reduce((sum, o) => {
        let p = 1;
        if (o.selectedPages && o.selectedPages !== "ALL") {
            const parts = o.selectedPages.split("-");
            if (parts.length === 2) {
                p = Math.max(1, parseInt(parts[1]) - parseInt(parts[0]) + 1);
            }
        }
        return sum + (p * (o.copies || 1));
    }, 0);

    // Color distribution
    const bwCount = orders.filter(o => (o.printType || "").toUpperCase() === "BW").length;
    const colorCount = orders.filter(o => (o.printType || "").toUpperCase() === "COLOR").length;
    const duplexCount = orders.filter(o => o.doubleSided).length;

    const pieData = [
        { name: "Black & White", value: bwCount || 1, color: "#38bdf8" },
        { name: "Full Color", value: colorCount || 0, color: "#ec4899" },
        { name: "Double Sided", value: duplexCount || 0, color: "#10b981" }
    ];

    // Compute day-by-day revenue trends for chart
    const trendMap = {};
    orders.forEach(o => {
        const date = new Date(o.uploadTime || o.createdAt || Date.now());
        const dateKey = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        if (!trendMap[dateKey]) {
            trendMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
        }
        if (o.paymentStatus === "PAID" || o.razorpayPaymentId) {
            trendMap[dateKey].revenue += (o.price || 0);
        }
        trendMap[dateKey].orders += 1;
    });

    const chartData = Object.values(trendMap).slice(-10);

    // Campus breakdown
    const campusMap = {};
    orders.forEach(o => {
        const camp = o.blockLocation || "Default Block";
        if (!campusMap[camp]) {
            campusMap[camp] = { name: camp, orders: 0, revenue: 0 };
        }
        campusMap[camp].orders += 1;
        if (o.paymentStatus === "PAID" || o.razorpayPaymentId) {
            campusMap[camp].revenue += (o.price || 0);
        }
    });
    const campusList = Object.values(campusMap);

    return (
        <div className="space-y-6">
            {/* Period Switcher & Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                    <h2 className="text-lg font-black text-white">Financial & Operations Intelligence</h2>
                    <p className="text-xs text-slate-400">Real-time revenue metrics, order velocity, and distribution</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    {[
                        { id: "all", label: "All Time" },
                        { id: "today", label: "Today" },
                        { id: "week", label: "This Week" },
                        { id: "month", label: "This Month" }
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => onPeriodChange && onPeriodChange(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                revenuePeriod === p.id
                                    ? "bg-cyan-600 text-white shadow-md font-black"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Financial Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="emerald"
                    subtitle="Gross collected earnings"
                />
                <MetricCard
                    title="Paid Orders"
                    value={paidOrders.length}
                    icon={TrendingUp}
                    color="cyan"
                    subtitle="Completed transactions"
                />
                <MetricCard
                    title="Average Order Value"
                    value={`₹${avgOrderValue.toFixed(2)}`}
                    icon={BarChart3}
                    color="purple"
                    subtitle="Per successful print job"
                />
                <MetricCard
                    title="Total Pages Printed"
                    value={totalPages}
                    icon={Layers}
                    color="amber"
                    subtitle="Physical paper consumed"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Area Chart */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-white">Revenue & Orders Velocity</h3>
                            <p className="text-xs text-slate-400">Daily earnings progression</p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" name="Revenue (₹)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Print Type Distribution Donut Chart */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-white">Print Mode Breakdown</h3>
                        <p className="text-xs text-slate-400">Distribution across color and duplex</p>
                    </div>

                    <div className="h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        {pieData.map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-slate-300 font-bold">{item.name}</span>
                                </div>
                                <span className="font-black text-white">{item.value} jobs</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Block / Campus Performance Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-white">Block Performance Matrix</h3>
                        <p className="text-xs text-slate-400">Usage and earnings breakdown per location</p>
                    </div>
                    {onExportCSV && (
                        <button
                            onClick={() => onExportCSV(campusList, "block_analytics", ["name", "orders", "revenue"])}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {campusList.map(camp => (
                        <div key={camp.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-sm text-white">{camp.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                                    {camp.orders} Orders
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                                <span>Revenue Generated:</span>
                                <span className="font-black text-emerald-400">₹{camp.revenue.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnalyticsSection;
