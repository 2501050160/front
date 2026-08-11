import React, { useState } from "react";
import { Shield, UserPlus, Trash2, Key, School, History, AlertCircle } from "lucide-react";
import api from "../../../services/api";

export function StaffManagementSection({
    subAdmins = [],
    managerLogs = [],
    onFetchSubAdmins,
    onFetchLogs,
    showAlert,
    showConfirm
}) {
    // Sub admin form
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [college, setCollege] = useState("KLU");
    const [role, setRole] = useState("SUB_ADMIN");
    const [managerSecret, setManagerSecret] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            showAlert("Required", "Username and password are required", "warning");
            return;
        }

        setCreating(true);
        try {
            await api.post("/admin/subadmins/create", {
                username: username.trim(),
                password: password.trim(),
                college,
                role,
                managerSecret: role === "MANAGER" ? managerSecret : null
            });
            showAlert("Success", `Account created successfully for ${username}`, "success");
            setUsername("");
            setPassword("");
            setManagerSecret("");
            if (onFetchSubAdmins) onFetchSubAdmins();
        } catch (error) {
            console.error(error);
            showAlert("Error", error.response?.data || "Failed to create staff account", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSubAdmin = (id) => {
        showConfirm("Delete Account", "Are you sure you want to remove this staff account?", async () => {
            try {
                await api.delete("/admin/subadmins/delete", { params: { id } });
                showAlert("Success", "Account deleted", "success");
                if (onFetchSubAdmins) onFetchSubAdmins();
            } catch (error) {
                console.error(error);
                showAlert("Error", "Failed to delete account", "error");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Campus Staff & Access Governance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Provision campus sub-administrators, block managers, and review historical operational audit trails.
                </p>
            </div>

            {/* Account Creator & Active Staff */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <form onSubmit={handleCreateSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-cyan-400" />
                            Provision Staff Account
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Delegate localized block control</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Username</label>
                            <input
                                type="text"
                                placeholder="klu_manager_cblock"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer font-bold"
                                >
                                    <option value="SUB_ADMIN">Sub Admin</option>
                                    <option value="MANAGER">Block Manager</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Campus</label>
                                <select
                                    value={college}
                                    onChange={(e) => setCollege(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer font-bold"
                                >
                                    <option value="KLU">KLU</option>
                                    <option value="VNR">VNR</option>
                                    <option value="CBIT">CBIT</option>
                                </select>
                            </div>
                        </div>

                        {role === "MANAGER" && (
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Manager Secret PIN</label>
                                <input
                                    type="text"
                                    placeholder="4-digit PIN"
                                    value={managerSecret}
                                    onChange={(e) => setManagerSecret(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-cyan-500"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create Account"}
                    </button>
                </form>

                {/* Active Staff List */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-white">Active Staff Accounts</h4>
                    <div className="overflow-x-auto max-h-80 custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                    <th className="py-2.5 px-3">Username</th>
                                    <th className="py-2.5 px-3">Role</th>
                                    <th className="py-2.5 px-3">Campus</th>
                                    <th className="py-2.5 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {subAdmins.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-500">
                                            No additional staff accounts provisioned.
                                        </td>
                                    </tr>
                                ) : (
                                    subAdmins.map(admin => (
                                        <tr key={admin.id} className="hover:bg-slate-800/30">
                                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center text-[10px] font-black">
                                                    {(admin.username || "A").slice(0, 2).toUpperCase()}
                                                </div>
                                                <span>{admin.username}</span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-black text-[10px] border border-cyan-500/30">
                                                    {admin.role || "SUB_ADMIN"}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-300 font-bold">{admin.college || "KLU"}</td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteSubAdmin(admin.id)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    Manager Operational Audit Trail
                </h4>

                <div className="overflow-x-auto max-h-80 custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                <th className="py-2.5 px-3">Timestamp</th>
                                <th className="py-2.5 px-3">Manager</th>
                                <th className="py-2.5 px-3">Campus</th>
                                <th className="py-2.5 px-3">Action Type</th>
                                <th className="py-2.5 px-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {managerLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                                        No recent manager audit logs recorded.
                                    </td>
                                </tr>
                            ) : (
                                managerLogs.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="py-2.5 px-3 text-slate-400">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent"}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-white">{log.managerName || "Admin"}</td>
                                        <td className="py-2.5 px-3 text-cyan-400 font-bold">{log.college || "KLU"}</td>
                                        <td className="py-2.5 px-3 font-bold text-amber-400">{log.actionType}</td>
                                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-md">{log.details}</td>
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

export default StaffManagementSection;
