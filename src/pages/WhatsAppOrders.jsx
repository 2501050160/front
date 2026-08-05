import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Download, 
  MessageSquare, 
  Phone, 
  User, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Users
} from "lucide-react";
import api from "../services/api";

function WhatsAppOrders({ isEmbedded = false }) {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeView, setActiveView] = useState("orders"); // "orders" | "users"
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/pdf/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchBlocks = async () => {
    try {
      const res = await api.get("/admin/blocks/all");
      setBlocks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchUsers(), fetchBlocks()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating order status");
    }
  };

  const handleDownload = async (orderId) => {
    try {
      const response = await api.get(`/pdf/download/${orderId}`, {
        responseType: "blob",
      });
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    } catch (err) {
      console.error(err);
      alert("Unable to download PDF file.");
    }
  };

  const loggedInAdminRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
  const loggedInAdminCollege = localStorage.getItem("adminCollege") || "KLU";
  const loggedInAdminUser = localStorage.getItem("adminUser") || "";
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState("ALL");

  // Helper check for WhatsApp order / user
  const isWhatsAppOrder = (o) => {
    if (!o) return false;
    const name = (o.customerName || "").toLowerCase();
    const email = (o.userEmail || "").toLowerCase();
    return (
      name.includes("whatsapp") ||
      name.includes("bot") ||
      email.includes("whatsapp") ||
      email.startsWith("wa_") ||
      o.userId === 0
    );
  };

  const isWhatsAppUser = (u) => {
    if (!u) return false;
    const email = (u.email || "").toLowerCase();
    const ref = (u.referralCode || "").toLowerCase();
    const name = (u.name || "").toLowerCase();
    return email.includes("whatsapp") || email.startsWith("wa_") || ref.startsWith("wa_") || name.includes("whatsapp");
  };

  // Base WhatsApp filtered items
  const waOrdersBase = orders.filter(isWhatsAppOrder);
  const waUsersBase = users.filter(isWhatsAppUser);

  // Sub-Admin vs Main Admin Filtering
  const waOrders = waOrdersBase.filter((o) => {
    if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
      const b = blocks.find(x => x.name === o.blockLocation);
      const col = b ? b.college : "KLU";
      return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
    }
    if (selectedCollegeFilter !== "ALL") {
      const b = blocks.find(x => x.name === o.blockLocation);
      const col = b ? b.college : "KLU";
      return col.toUpperCase() === selectedCollegeFilter.toUpperCase();
    }
    return true;
  });

  const waUsers = waUsersBase.filter((u) => {
    if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
      const uCol = u.college || "KLU";
      return uCol.toUpperCase() === loggedInAdminCollege.toUpperCase();
    }
    if (selectedCollegeFilter !== "ALL") {
      const uCol = u.college || "KLU";
      return uCol.toUpperCase() === selectedCollegeFilter.toUpperCase();
    }
    return true;
  });

  const filteredOrders = waOrders.filter((o) => {
    const matchesSearch =
      (o.orderId && o.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.fileName && o.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.blockLocation && o.blockLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = waUsers.filter((u) => {
    return (
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate metrics
  const totalWaRevenue = waOrders
    .filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED")
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  const activeWaQueue = waOrders.filter((o) => ["QUEUE", "PRINTING", "ORDER_CREATED"].includes(o.status)).length;
  const completedWaOrders = waOrders.filter((o) => o.status === "COMPLETED").length;

  return (
    <div className={!isEmbedded ? "min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8" : "text-slate-100 font-sans"}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {!isEmbedded && (
              <Link to="/admin" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Live WhatsApp Bot Integration
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
                WhatsApp Orders & Users <Phone className="w-6 h-6 text-emerald-400" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loggedInAdminUser === "admin" && (
              <select
                value={selectedCollegeFilter}
                onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="ALL">🏫 All Colleges</option>
                <option value="KLU">KLU Campus</option>
                <option value="Lakshmi Narayana Xerox">Lakshmi Narayana Xerox</option>
              </select>
            )}
            <button onClick={refreshData} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors" title="Refresh Live Data">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveView("orders")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "orders" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                📱 Orders ({waOrders.length})
              </button>
              <button
                onClick={() => setActiveView("users")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "users" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                👥 Accounts ({waUsers.length})
              </button>
            </div>
          </div>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Orders</p>
                <h3 className="text-3xl font-black text-white mt-1">{waOrders.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{completedWaOrders}</span> completed print jobs
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue</p>
                <h3 className="text-3xl font-black text-amber-400 mt-1">{activeWaQueue}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Waiting or printing at kiosk</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Accounts</p>
                <h3 className="text-3xl font-black text-sky-400 mt-1">{waUsers.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Distinct mobile users</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Revenue</p>
                <h3 className="text-3xl font-black text-emerald-400 mt-1">₹{totalWaRevenue.toFixed(2)}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Total paid payments via WhatsApp</p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeView === "orders" ? "Search WhatsApp orders, file name, order ID..." : "Search WhatsApp user accounts..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {activeView === "orders" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "ORDER_CREATED", "QUEUE", "PRINTING", "COMPLETED", "CANCELLED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Table Views */}
        {activeView === "orders" ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">WhatsApp Customer</th>
                    <th className="p-4">File Details</th>
                    <th className="p-4">Kiosk Block</th>
                    <th className="p-4">Price & Payment</th>
                    <th className="p-4">Release OTP</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-slate-400">No WhatsApp orders found.</p>
                        <p className="text-xs mt-1 text-slate-600">Upload a PDF through WhatsApp to test instant order tracking.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const cleanPhone = (o.customerName || "").replace(/[^0-9]/g, "");
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                      return (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">
                            <div>{o.orderId}</div>
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                              {o.uploadTime ? new Date(o.uploadTime).toLocaleString() : "Just now"}
                            </div>
                          </td>

                          <td className="p-4">
                            {(() => {
                              const cleanCustomerName = (o.customerName || "WhatsApp User").replace(/\s*\(\d{14,}\)/g, "").trim();
                              const rawDigitsOrder = (o.customerName || "").replace(/[^0-9]/g, "");
                              const mobileNumOrder = rawDigitsOrder.length >= 10 ? rawDigitsOrder.slice(-10) : rawDigitsOrder;
                              const orderWaLink = mobileNumOrder ? `https://wa.me/91${mobileNumOrder}` : null;
                              return (
                                <>
                                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {cleanCustomerName}
                                  </div>
                                  {orderWaLink && (
                                    <a
                                      href={orderWaLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline mt-0.5"
                                    >
                                      <MessageSquare className="w-3 h-3" /> Chat on WhatsApp (+91 {mobileNumOrder})
                                    </a>
                                  )}
                                </>
                              );
                            })()}
                          </td>

                          <td className="p-4 max-w-[200px] truncate">
                            <div className="font-medium text-slate-200 truncate" title={o.fileName}>
                              {o.fileName}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>📄 {o.totalPages || 1} pages</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-300">{o.printType}</span>
                              <span>•</span>
                              <span>{o.copies || 1} copies</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200">
                              📍 {o.blockLocation || "Block A"}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-emerald-400 text-base">₹{o.price ? o.price.toFixed(2) : "0.00"}</div>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                              o.paymentStatus === "PAID" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                              {o.paymentStatus || "UNPAID"}
                            </span>
                          </td>

                          <td className="p-4">
                            {o.otpCode ? (
                              <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 font-mono font-black text-emerald-400 text-sm tracking-widest">
                                {o.otpCode}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-mono">--</span>
                            )}
                          </td>

                          <td className="p-4">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="ORDER_CREATED">ORDER_CREATED</option>
                              <option value="QUEUE">QUEUE</option>
                              <option value="PRINTING">PRINTING</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDownload(o.id)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">WhatsApp Account Name</th>
                    <th className="p-4">Synthetic Email</th>
                    <th className="p-4">Referral Code</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">Total Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-slate-400">No WhatsApp accounts registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userOrdersCount = waOrders.filter((o) => o.userId === u.id || o.customerName === u.name).length;
                      const rawDigits = (u.name || "").replace(/[^0-9]/g, "") || (u.email || "").replace(/[^0-9]/g, "");
                      const cleanUserName = (u.name || "WhatsApp User").replace(/\s*\(\d{14,}\)/g, "").trim();
                      const mobileNum = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
                      const userPhone = mobileNum ? `+91 ${mobileNum}` : "";
                      const userWaLink = mobileNum ? `https://wa.me/91${mobileNum}` : null;
                      const cleanEmail = mobileNum ? `wa_${mobileNum}@whatsapp` : u.email;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">#{u.id}</td>
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-white">{cleanUserName}</div>
                              {userWaLink && (
                                <a
                                  href={userWaLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-emerald-400 hover:underline block font-mono font-bold mt-0.5"
                                >
                                  {userPhone}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-400">{cleanEmail}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                              {u.referralCode || "WA_DEFAULT"}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-emerald-400">₹{(u.walletBalance || 0).toFixed(2)}</td>
                          <td className="p-4 font-bold text-slate-200">{userOrdersCount} jobs</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default WhatsAppOrders;
