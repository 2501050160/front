import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Play, 
  Download, 
  XOctagon, 
  CheckCircle,
  FileText,
  Clock,
  Printer,
  Trash2
} from "lucide-react";
import api from "../services/api";

function QueueManagement() {
  const [orders, setOrders] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get("/pdf/orders");
      setOrders(response.data || []);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await api.get("/admin/blocks/all");
      setBlocks(response.data || []);
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBlocks();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
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

  const roleFilteredOrders = orders.filter((o) => {
    if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
       const b = blocks.find(x => x.name === o.blockLocation);
       const col = b ? b.college : "KLU";
       return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
    }
    return true;
  });

  const filteredOrders = roleFilteredOrders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteSelected = async () => {
    if (loggedInAdminRole !== "MAIN_ADMIN" && loggedInAdminUser !== "admin") {
      alert("Only the main admin has permission to delete orders from the database!");
      return;
    }
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedOrderIds.length} selected order(s)? They will be removed from the database and user history.`)) {
      return;
    }
    try {
      await api.post("/admin/orders/delete-bulk", selectedOrderIds, {
        params: { adminUsername: loggedInAdminUser }
      });
      alert(`Deleted ${selectedOrderIds.length} order(s) successfully.`);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error deleting orders: " + (err.response?.data || err.message));
    }
  };

  const handleDeleteSingleOrder = async (orderId) => {
    if (loggedInAdminRole !== "MAIN_ADMIN" && loggedInAdminUser !== "admin") {
      alert("Only the main admin has permission to delete orders from the database!");
      return;
    }
    if (!orderId) return;
    if (!window.confirm(`Are you sure you want to permanently delete Order #${orderId}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.post("/admin/orders/delete", null, {
        params: {
          adminUsername: loggedInAdminUser,
          orderId: String(orderId)
        }
      });
      alert(`Order #${orderId} deleted successfully.`);
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error deleting order: " + (err.response?.data || err.message));
    }
  };

  const getColumnOrders = (columnType) => {
    if (columnType === "waiting") {
      return filteredOrders.filter((o) =>
        ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE"].includes(o.status)
      );
    }
    if (columnType === "printing") {
      return filteredOrders.filter((o) => o.status === "PRINTING");
    }
    if (columnType === "completed") {
      return filteredOrders.filter((o) =>
        ["COMPLETED", "CANCELLED"].includes(o.status)
      );
    }
    return [];
  };

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
              <p className="eyebrow">Operations</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Queue Kanban <Printer className="w-6 h-6 text-blue-600" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && selectedOrderIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="btn danger py-2 px-4 text-xs font-black min-h-0 rounded-xl flex items-center gap-1.5"
              >
                🗑️ Delete Selected ({selectedOrderIds.length})
              </button>
            )}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field pl-10 py-2 text-sm w-60"
              />
            </div>
            <button onClick={fetchOrders} className="btn secondary p-2.5 min-h-0 rounded-xl" title="Refresh Live Queue">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Kanban Board Grid */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          
          {/* Column: Waiting */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Waiting Queue
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-700">
                {getColumnOrders("waiting").length}
              </span>
            </div>
            
            <div className="kanban-column flex flex-col gap-3">
              {getColumnOrders("waiting").map((order) => (
                <div key={order.id} className="kanban-card">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.orderId)}
                          onChange={() => toggleSelectOrder(order.orderId)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <span className="text-xs font-black text-slate-400">#{order.orderId}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                      {order.status}
                    </span>
                  </div>
                  
                  <h4 className="mt-3 text-sm font-black text-slate-900">{order.customerName || "Student"}</h4>
                  <p className="mt-1 text-xs text-slate-500 font-bold">{order.blockLocation} · {order.selectedPages} pages · {order.copies} copies</p>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleUpdateStatus(order.id, "PRINTING")}
                      className="btn success py-1 px-3 text-xs min-h-0 flex-1 flex items-center justify-center gap-1 font-bold"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Print
                    </button>
                    <button
                      onClick={() => handleDownload(order.id)}
                      className="btn secondary py-1 px-2.5 min-h-0"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                      <button
                        onClick={() => handleDeleteSingleOrder(order.orderId || order.id)}
                        className="btn danger py-1 px-2 min-h-0"
                        title="Delete Order Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {getColumnOrders("waiting").length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-10">No orders waiting</p>
              )}
            </div>
          </div>

          {/* Column: Printing */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-blue-500 animate-pulse" /> Active Printing
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                {getColumnOrders("printing").length}
              </span>
            </div>

            <div className="kanban-column !bg-blue-50/20 !border-blue-200/30 flex flex-col gap-3">
              {getColumnOrders("printing").map((order) => (
                <div key={order.id} className="kanban-card !border-blue-200 shadow-blue-50/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.orderId)}
                          onChange={() => toggleSelectOrder(order.orderId)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <span className="text-xs font-black text-blue-500">#{order.orderId}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500 text-white animate-pulse">
                      Printing
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-black text-slate-900">{order.customerName || "Student"}</h4>
                  <p className="mt-1 text-xs text-slate-500 font-bold">{order.blockLocation} · {order.selectedPages} pages · {order.copies} copies</p>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                      className="btn success py-1 px-3 text-xs min-h-0 flex-1 flex items-center justify-center gap-1 font-bold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                      className="btn danger py-1 px-2.5 min-h-0"
                      title="Cancel Job"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                    </button>
                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                      <button
                        onClick={() => handleDeleteSingleOrder(order.orderId || order.id)}
                        className="btn danger py-1 px-2 min-h-0"
                        title="Delete Order Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {getColumnOrders("printing").length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-10">No active print jobs</p>
              )}
            </div>
          </div>

          {/* Column: Completed/Cancelled */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Finished History
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                {getColumnOrders("completed").length}
              </span>
            </div>

            <div className="kanban-column flex flex-col gap-3">
              {getColumnOrders("completed").map((order) => (
                <div key={order.id} className={`kanban-card opacity-70 hover:opacity-100 transition-opacity`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.orderId)}
                          onChange={() => toggleSelectOrder(order.orderId)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <span className="text-xs font-black text-slate-400">#{order.orderId}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      order.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-black text-slate-900">{order.customerName || "Student"}</h4>
                  <p className="mt-1 text-xs text-slate-500 font-bold">{order.blockLocation} · {order.selectedPages} pages · {order.copies} copies</p>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleUpdateStatus(order.id, "QUEUE")}
                      className="btn secondary py-1 px-3 text-xs min-h-0 flex-1 flex items-center justify-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Print Again
                    </button>
                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                      <button
                        onClick={() => handleDeleteSingleOrder(order.orderId || order.id)}
                        className="btn danger py-1 px-2 min-h-0"
                        title="Delete Order Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {getColumnOrders("completed").length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-10">No finished logs today</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default QueueManagement;
