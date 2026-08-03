import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  UserX, 
  UserCheck, 
  PlusCircle, 
  Trash2, 
  Users, 
  RefreshCw,
  Mail,
  User,
  Shield,
  Coins
} from "lucide-react";
import api from "../services/api";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId) => {
    try {
      await api.post(`/admin/users/toggle-block?id=${userId}`);
      fetchUsers();
      alert("User block status updated");
    } catch (err) {
      console.error(err);
      alert("Error blocking/unblocking user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/admin/users/delete?id=${userId}`);
      fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  const handleAddWallet = async () => {
    const amt = parseFloat(creditAmount);
    if (isNaN(amt) || amt === 0) {
      alert("Please enter a valid non-zero amount");
      return;
    }
    try {
      await api.post(`/admin/users/wallet/add?id=${selectedUser.id}&amount=${amt}`);
      fetchUsers();
      if (amt > 0) {
        alert(`Successfully added ₹${amt} to user wallet.`);
      } else {
        alert(`Successfully deducted ₹${Math.abs(amt)} from user wallet.`);
      }
      setCreditAmount("");
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Error updating wallet balance");
    }
  };

  const loggedInAdminUser = localStorage.getItem("adminUser") || "admin";
  const loggedInAdminRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
  const loggedInAdminCollege = localStorage.getItem("adminCollege") || "KLU";

  const filteredUsers = users.filter(
    (u) => {
      // First apply sub-admin filter
      if (loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") {
        const userCollege = u.college || "KLU";
        if (userCollege.toUpperCase() !== loggedInAdminCollege.toUpperCase()) {
          return false;
        }
      }
      // Then apply search term filter
      if (searchTerm.trim() !== "") {
        const matchesSearch = 
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;
      }
      return true;
    }
  );

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
              <p className="eyebrow">Administration</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                User Management <Users className="w-6 h-6 text-blue-600" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/whatsapp"
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              💬 WhatsApp Section
            </Link>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field pl-10 py-2 text-sm w-72"
              />
            </div>
            <button onClick={fetchUsers} className="btn secondary p-2.5 min-h-0 rounded-xl" title="Refresh User List">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Users Table */}
        <div className="mt-8 panel overflow-x-auto p-6 bg-white rounded-3xl border border-slate-200/80">
          {loading ? (
            <div className="py-20 text-center font-bold text-slate-500 animate-pulse">
              Loading users database...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Contact Email</th>
                  <th>Wallet Balance</th>
                  <th>Status</th>
                  <th>Security / Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">{user.username || "Student"}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                      </span>
                    </td>
                    <td>
                      <span className="font-black text-slate-900 flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" /> ₹{user.walletBalance || "0.00"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${user.blocked ? "status-unpaid" : "status-paid"}`}>
                        {user.blocked ? "Blocked 🚫" : "Active ✅"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                          className="btn secondary py-1.5 px-3 min-h-0 text-xs font-black flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-blue-600" /> Add Money
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user.id)}
                          className={`btn min-h-0 py-1.5 px-3 text-xs font-black flex items-center gap-1 ${
                            user.blocked ? "secondary text-emerald-600" : "danger"
                          }`}
                        >
                          {user.blocked ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Unblock
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Block
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn danger py-1.5 px-2.5 min-h-0"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 font-bold text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Top-up / Adjust Wallet Balance */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative">
              <h3 className="text-xl font-black text-slate-900">Adjust Wallet Credits</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Adjusting balance for: <strong className="text-slate-700">{selectedUser.username || selectedUser.email}</strong>
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50 to add, -50 to deduct"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="field py-3 px-4 font-black"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setCreditAmount("");
                  }}
                  className="btn secondary px-5 py-2.5 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWallet}
                  className="btn success px-6 py-2.5 text-sm font-black"
                >
                  Update Balance 💰
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default UserManagement;
