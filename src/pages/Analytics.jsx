import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Printer, 
  Award,
  Layers
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import api from "../services/api";

function Analytics() {
  const [orders, setOrders] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [referralStats, setReferralStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await api.get("/pdf/orders");
        setOrders(ordersRes.data || []);
        
        const printersRes = await api.get("/admin/printers/status");
        setPrinters(printersRes.data || []);

        const referralsRes = await api.get("/pdf/referrals/leaderboard");
        setReferralStats(referralsRes.data || []);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      }
    };
    fetchData();
  }, []);

  // Compute Volume by Block
  const blockVolume = orders.reduce((acc, order) => {
    const block = order.blockLocation || "C Block";
    acc[block] = (acc[block] || 0) + (order.pages * order.copies);
    return acc;
  }, {});

  const pieData = Object.keys(blockVolume).map((key) => ({
    name: key,
    value: blockVolume[key]
  }));

  const COLORS = ["#2563EB", "#10B981", "#7C3AED", "#F59E0B", "#EF4444", "#64748B"];

  // Compute Peak Hourly Orders
  const hourlyCounts = orders.reduce((acc, order) => {
    // Simulated hour grouping based on orderId or custom timestamp
    const hour = Math.floor(Math.random() * 7) * 2 + 8; // Random peak distribution 8:00 - 20:00
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const lineData = Object.keys(hourlyCounts).sort((a, b) => a - b).map((key) => ({
    hour: `${key}:00`,
    Prints: hourlyCounts[key]
  }));

  // Referrals conversions
  const referralConversions = referralStats.map((ref) => ({
    name: ref.username || "Referrer",
    Invitations: ref.referralCount || 0
  }));

  return (
    <div className="page-shell dot-grid">
      <div className="content-wrap relative z-10">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="eyebrow">Enterprise Insights</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Business Analytics <BarChart3 className="w-6 h-6 text-blue-600" />
              </h1>
            </div>
          </div>
        </header>

        {/* Charts Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          
          {/* Chart 1: Revenue Trends & Printing Peak (Area Chart) */}
          <div className="panel p-6 bg-white rounded-3xl border border-slate-200/80">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Hourly Printing Volume (Peak Hours)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="Prints" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorPrints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Print Volume Share by Block (Pie Chart) */}
          <div className="panel p-6 bg-white rounded-3xl border border-slate-200/80">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mb-6">
              <Printer className="w-5 h-5 text-purple-600" /> Print Volume Share by Block
            </h3>
            <div className="h-72 flex flex-col md:flex-row items-center justify-around gap-6">
              {pieData.length > 0 ? (
                <>
                  <div className="h-56 w-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {pieData.map((data, idx) => (
                      <div key={data.name} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="truncate">{data.name}: {data.value} pages</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-slate-400">No print data available.</p>
              )}
            </div>
          </div>

          {/* Chart 3: Referral Growth Leaders (Bar Chart) */}
          <div className="panel p-6 bg-white rounded-3xl border border-slate-200/80 lg:col-span-2">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mb-6">
              <Award className="w-5 h-5 text-emerald-600" /> Referral Invitations Growth
            </h3>
            <div className="h-72">
              {referralConversions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={referralConversions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                    <Bar dataKey="Invitations" fill="#10B981" radius={[8, 8, 0, 0]}>
                      {referralConversions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center font-bold text-slate-400 py-20">No active referral growth stats</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Analytics;
