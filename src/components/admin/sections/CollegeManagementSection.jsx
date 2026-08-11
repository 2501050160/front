import React, { useState } from "react";
import { School, ShieldAlert, Key, CheckCircle, AlertTriangle, Building2, Save } from "lucide-react";
import api from "../../../services/api";

export function CollegeManagementSection({
    blocks = [],
    suspendedColleges = "",
    onToggleSuspension,
    collegeConfigs = [],
    onUpdateCollegeConfig,
    showAlert
}) {
    const suspendedList = suspendedColleges ? suspendedColleges.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) : [];

    const colleges = [
        { code: "KLU", name: "KL University (Vijayawada & Hyderabad)", active: !suspendedList.includes("KLU") },
        { code: "VNR", name: "VNR Vignana Jyothi Institute (Hyderabad)", active: !suspendedList.includes("VNR") },
        { code: "CBIT", name: "Chaitanya Bharathi Institute of Tech", active: !suspendedList.includes("CBIT") }
    ];

    const [keyIdInputs, setKeyIdInputs] = useState({});
    const [keySecretInputs, setKeySecretInputs] = useState({});
    const [savingCollege, setSavingCollege] = useState(null);

    const handleSaveConfig = async (collegeCode) => {
        const keyId = keyIdInputs[collegeCode];
        const keySecret = keySecretInputs[collegeCode];

        setSavingCollege(collegeCode);
        try {
            await api.post("/college-config/update", {
                college: collegeCode,
                razorpayKeyId: keyId,
                razorpayKeySecret: keySecret
            });
            showAlert("Success", `Payment configuration updated for ${collegeCode}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update college configuration", "error");
        } finally {
            setSavingCollege(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-cyan-400" />
                    Multi-Campus Governance & Gateway Config
                </h3>
                <p className="text-xs text-slate-400">
                    Control campus emergency suspension, isolate Razorpay merchant credentials, and monitor block distribution.
                </p>
            </div>

            {/* Colleges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {colleges.map(c => {
                    const campusBlocks = blocks.filter(b => (b.college || "KLU").toUpperCase() === c.code);
                    const isSuspended = !c.active;

                    return (
                        <div
                            key={c.code}
                            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-lg">
                                        {c.code}
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                        isSuspended
                                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    }`}>
                                        {isSuspended ? "SUSPENDED" : "OPERATIONAL"}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-white">{c.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                                        {campusBlocks.length} Active Blocks
                                    </p>
                                </div>

                                {/* Gateway Key Setup */}
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                                    <span className="font-black text-slate-400 uppercase text-[10px] flex items-center gap-1">
                                        <Key className="w-3 h-3 text-amber-400" />
                                        Razorpay Gateway Credentials
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Razorpay Key ID (rzp_live_...)"
                                        value={keyIdInputs[c.code] ?? ""}
                                        onChange={(e) => setKeyIdInputs(prev => ({ ...prev, [c.code]: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] outline-none focus:border-cyan-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Razorpay Key Secret"
                                        value={keySecretInputs[c.code] ?? ""}
                                        onChange={(e) => setKeySecretInputs(prev => ({ ...prev, [c.code]: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        onClick={() => handleSaveConfig(c.code)}
                                        disabled={savingCollege === c.code}
                                        className="w-full py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                                    >
                                        {savingCollege === c.code ? "Saving..." : "Save Gateway"}
                                    </button>
                                </div>
                            </div>

                            {/* Emergency Suspension Toggle */}
                            <div className="pt-3 border-t border-slate-800">
                                <button
                                    onClick={() => onToggleSuspension && onToggleSuspension(c.code)}
                                    className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                        isSuspended
                                            ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                                            : "bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30"
                                    }`}
                                >
                                    {isSuspended ? "Lift Suspension" : "Emergency Suspend Campus"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CollegeManagementSection;
