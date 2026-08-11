import React, { useState } from "react";
import { Users, Search, ShieldCheck, ShieldAlert, DollarSign, Trash2, Download, CheckSquare, Square, UserPlus } from "lucide-react";
import api from "../../../services/api";

export function UserManagementSection({
    users = [],
    orders = [],
    onFetchUsers,
    showAlert,
    showConfirm,
    onExportCSV
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("ALL");
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [walletAdjustUser, setWalletAdjustUser] = useState(null);
    const [walletDelta, setWalletDelta] = useState("");

    const toggleSelectUser = (id) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        }
    };

    const handleToggleBlock = async (userId, currentBlocked) => {
        try {
            await api.post("/admin/users/toggle-block", null, { params: { id: userId } });
            showAlert("Success", `User ${currentBlocked ? "unblocked" : "blocked"} successfully`, "success");
            if (onFetchUsers) onFetchUsers();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update user block status", "error");
        }
    };

    const handleDeleteUser = (userId) => {
        showConfirm(
            "Delete User",
            "Are you sure you want to permanently delete this user? All their print history and wallet balance will be deleted.",
            async () => {
                try {
                    await api.delete("/admin/users/delete", { params: { id: userId } });
                    showAlert("Success", "User deleted successfully", "success");
                    if (onFetchUsers) onFetchUsers();
                } catch (error) {
                    console.error(error);
                    showAlert("Error", "Failed to delete user", "error");
                }
            }
        );
    };

    const handleWalletAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!walletAdjustUser || !walletDelta || isNaN(walletDelta)) {
            showAlert("Invalid Amount", "Please enter a valid amount", "warning");
            return;
        }

        try {
            await api.post("/admin/users/adjust-wallet", null, {
                params: {
                    id: walletAdjustUser.id,
                    amount: Number(walletDelta)
                }
            });
            showAlert("Success", `Wallet balance updated by ₹${walletDelta}`, "success");
            setWalletAdjustUser(null);
            setWalletDelta("");
            if (onFetchUsers) onFetchUsers();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to adjust wallet balance", "error");
        }
    };

    const filteredUsers = users.filter(u => {
        if (collegeFilter !== "ALL" && (u.college || "KLU").toUpperCase() !== collegeFilter.toUpperCase()) return false;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const emailMatch = (u.email || "").toLowerCase().includes(q);
            const nameMatch = (u.name || "").toLowerCase().includes(q);
            const idMatch = (u.id || "").toString().includes(q);
            const refMatch = (u.referralCode || "").toLowerCase().includes(q);
            return emailMatch || nameMatch || idMatch || refMatch;
        }
        return true;
    });

    const handleExport = () => {
        if (onExportCSV) {
            onExportCSV(filteredUsers, "registered_users", [
                "User ID", "Name", "Email", "College", "Orders", "Referral Code", "Wallet Balance", "Status"
            ]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by Name, Email, ID, or Referral Code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* College Filter */}
                    <select
                        value={collegeFilter}
                        onChange={(e) => setCollegeFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer font-bold"
                    >
                        <option value="ALL">All Campuses</option>
                        <option value="KLU">KLU</option>
                        <option value="VNR">VNR</option>
                        <option value="CBIT">CBIT</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export Users
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-black uppercase text-[10px]">
                                <th className="p-4 w-10">
                                    <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-white">
                                        {selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length ? (
                                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4">Student Name & ID</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Campus</th>
                                <th className="p-4">Referral Code</th>
                                <th className="p-4">Wallet Balance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Moderation Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-500">
                                        No registered students found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <button onClick={() => toggleSelectUser(user.id)} className="cursor-pointer">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center">
                                                        {(user.name || "U").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white">{user.name || "Student"}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">ID: #{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-300 font-medium">{user.email}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-black border border-slate-700">
                                                    {user.college || "KLU"}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-amber-400">{user.referralCode || "—"}</td>
                                            <td className="p-4">
                                                <span className="font-black text-emerald-400 text-sm">
                                                    ₹{Number(user.walletBalance || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                                    user.blocked
                                                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                }`}>
                                                    {user.blocked ? "BLOCKED" : "ACTIVE"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Adjust Wallet */}
                                                    <button
                                                        onClick={() => {
                                                            setWalletAdjustUser(user);
                                                            setWalletDelta("");
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                        title="Adjust Wallet Balance"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        Wallet
                                                    </button>

                                                    {/* Block / Unblock */}
                                                    <button
                                                        onClick={() => handleToggleBlock(user.id, user.blocked)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                                            user.blocked
                                                                ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                                                                : "bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30"
                                                        }`}
                                                    >
                                                        {user.blocked ? "Unblock" : "Block"}
                                                    </button>

                                                    {/* Delete User */}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wallet Adjust Modal */}
            {walletAdjustUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <form onSubmit={handleWalletAdjustSubmit} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div>
                            <h3 className="text-base font-black text-white">Adjust Wallet Balance</h3>
                            <p className="text-xs text-slate-400 mt-1">Student: {walletAdjustUser.name} ({walletAdjustUser.email})</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Current Balance:</span>
                            <span className="font-black text-emerald-400 text-sm">₹{Number(walletAdjustUser.walletBalance || 0).toFixed(2)}</span>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Adjustment Amount (₹)</label>
                            <p className="text-[10px] text-slate-500 mb-1">Use positive to credit (e.g. +50), negative to deduct (e.g. -20)</p>
                            <input
                                type="number"
                                step="1"
                                placeholder="+50 or -20"
                                value={walletDelta}
                                onChange={(e) => setWalletDelta(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-sm outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setWalletAdjustUser(null)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default UserManagementSection;
