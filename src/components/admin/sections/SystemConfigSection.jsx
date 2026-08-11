import React, { useState } from "react";
import { Settings, Database, Clock, Terminal, Download, Play, AlertTriangle, CheckCircle } from "lucide-react";
import api from "../../../services/api";

export function SystemConfigSection({
    showAlert,
    showConfirm
}) {
    // Off-peak states
    const [college, setCollege] = useState("KLU");
    const [offpeakSettings, setOffpeakSettings] = useState({
        offpeakEnabled: true,
        offpeakDiscountPercent: 15.0,
        offpeakStartHour: 21.0,
        offpeakEndHour: 7.0,
        offpeakMorningStart: 7.0,
        offpeakMorningEnd: 9.0
    });
    const [savingOffpeak, setSavingOffpeak] = useState(false);

    // SQL Console states
    const [sqlQuery, setSqlQuery] = useState("SELECT id, name, email, college, wallet_balance FROM users LIMIT 10;");
    const [sqlResult, setSqlResult] = useState(null);
    const [sqlError, setSqlError] = useState("");
    const [executingSql, setExecutingSql] = useState(false);

    const handleSaveOffpeak = async (e) => {
        e.preventDefault();
        setSavingOffpeak(true);
        try {
            await api.post("/admin/settings/offpeak", {
                college,
                ...offpeakSettings
            });
            showAlert("Success", `Off-peak discount schedule updated for ${college}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update off-peak schedule", "error");
        } finally {
            setSavingOffpeak(false);
        }
    };

    const handleRunSql = async (e) => {
        e.preventDefault();
        if (!sqlQuery.trim()) {
            setSqlError("SQL statement cannot be blank");
            return;
        }

        setExecutingSql(true);
        setSqlResult(null);
        setSqlError("");
        try {
            const response = await api.post("/admin/sql", { query: sqlQuery });
            setSqlResult(response.data);
        } catch (error) {
            console.error(error);
            setSqlError(error.response?.data?.message || error.response?.data || error.message || "SQL Execution error");
        } finally {
            setExecutingSql(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            showAlert("Exporting Backup", "Generating raw SQL dump from database. Please wait...", "info");
            const response = await api.get("/admin/export-sql", { responseType: "blob" });
            const blob = new Blob([response.data], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `cloudprint_db_backup_${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showAlert("Success", "Database SQL backup successfully downloaded!", "success");
        } catch (error) {
            console.error(error);
            showAlert("Backup Failed", error.message || "Unable to download database backup", "error");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-cyan-400" />
                        System Architecture & Database Governance
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage off-peak smart pricing, raw SQL administration, and live backup exports
                    </p>
                </div>

                <button
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Export Full SQL Backup
                </button>
            </div>

            {/* 1. Off-peak Hours Smart Pricing */}
            <form onSubmit={handleSaveOffpeak} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            Off-Peak Automated Discounts
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Encourage off-hour student printing to smooth out campus queue peaks</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 font-bold">Campus:</span>
                        <select
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            className="bg-transparent text-cyan-300 font-black cursor-pointer outline-none"
                        >
                            <option value="KLU" className="bg-slate-900 text-white">KLU</option>
                            <option value="VNR" className="bg-slate-900 text-white">VNR</option>
                            <option value="CBIT" className="bg-slate-900 text-white">CBIT</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Discount Percentage (%)</label>
                        <input
                            type="number"
                            value={offpeakSettings.offpeakDiscountPercent}
                            onChange={(e) => setOffpeakSettings(prev => ({ ...prev, offpeakDiscountPercent: Number(e.target.value) }))}
                            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Night Start Hour (24h)</label>
                        <input
                            type="number"
                            value={offpeakSettings.offpeakStartHour}
                            onChange={(e) => setOffpeakSettings(prev => ({ ...prev, offpeakStartHour: Number(e.target.value) }))}
                            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Night End Hour (24h)</label>
                        <input
                            type="number"
                            value={offpeakSettings.offpeakEndHour}
                            onChange={(e) => setOffpeakSettings(prev => ({ ...prev, offpeakEndHour: Number(e.target.value) }))}
                            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:border-amber-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={savingOffpeak}
                        className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {savingOffpeak ? "Saving Schedule..." : "Save Off-Peak Rules"}
                    </button>
                </div>
            </form>

            {/* 2. Interactive SQL Execution Console */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-cyan-400" />
                            Live SQL Administration Console
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Execute read/update queries directly against PostgreSQL</p>
                    </div>

                    <button
                        onClick={handleRunSql}
                        disabled={executingSql}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {executingSql ? "Executing..." : "Run Query"}
                    </button>
                </div>

                <div className="space-y-2">
                    <textarea
                        rows={4}
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-cyan-300 font-mono leading-relaxed outline-none focus:border-cyan-500"
                        placeholder="SELECT * FROM users;"
                    />
                </div>

                {/* SQL Error Feedback */}
                {sqlError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                        <AlertTriangle className="w-4 h-4 inline mr-2 -mt-0.5" />
                        {sqlError}
                    </div>
                )}

                {/* SQL Result Table View */}
                {sqlResult && (
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Query Results:</span>
                            <span className="font-bold text-emerald-400">{Array.isArray(sqlResult) ? `${sqlResult.length} rows returned` : "Query executed"}</span>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-x-auto max-h-96 custom-scrollbar">
                            {Array.isArray(sqlResult) && sqlResult.length > 0 ? (
                                <table className="w-full text-left text-xs font-mono">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold">
                                            {Object.keys(sqlResult[0]).map(col => (
                                                <th key={col} className="p-3">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {sqlResult.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/30">
                                                {Object.values(row).map((val, cIdx) => (
                                                    <td key={cIdx} className="p-3 text-slate-200 truncate max-w-xs">
                                                        {val != null ? String(val) : "null"}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <pre className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(sqlResult, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SystemConfigSection;
