import React, { useState, useEffect } from "react";
import { School, ShieldAlert, Key, CheckCircle, AlertTriangle, Building2, Save, MessageSquare } from "lucide-react";
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
    const [botPhoneInputs, setBotPhoneInputs] = useState({});
    const [dedicatedBotInputs, setDedicatedBotInputs] = useState({});
    const [savingCollege, setSavingCollege] = useState(null);

    // Sync inputs when collegeConfigs are passed in
    useEffect(() => {
        if (collegeConfigs && collegeConfigs.length > 0) {
            const keyIds = {};
            const keySecrets = {};
            const botPhones = {};
            const dedicatedBots = {};
            collegeConfigs.forEach(cfg => {
                const code = (cfg.collegeName || cfg.college || "").toUpperCase();
                if (code) {
                    keyIds[code] = cfg.razorpayKeyId || "";
                    keySecrets[code] = cfg.razorpayKeySecret || "";
                    botPhones[code] = cfg.whatsappBotPhone || "";
                    dedicatedBots[code] = Boolean(cfg.dedicatedBotEnabled);
                }
            });
            setKeyIdInputs(prev => ({ ...keyIds, ...prev }));
            setKeySecretInputs(prev => ({ ...keySecrets, ...prev }));
            setBotPhoneInputs(prev => ({ ...botPhones, ...prev }));
            setDedicatedBotInputs(prev => ({ ...dedicatedBots, ...prev }));
        }
    }, [collegeConfigs]);

    const handleSaveConfig = async (collegeCode) => {
        const keyId = keyIdInputs[collegeCode];
        const keySecret = keySecretInputs[collegeCode];
        const botPhone = botPhoneInputs[collegeCode];
        const isDedicated = dedicatedBotInputs[collegeCode];

        setSavingCollege(collegeCode);
        try {
            await api.post("/college-config/update", {
                college: collegeCode,
                collegeName: collegeCode,
                razorpayKeyId: keyId,
                razorpayKeySecret: keySecret,
                whatsappBotPhone: botPhone,
                dedicatedBotEnabled: Boolean(isDedicated)
            });
            showAlert("Success", `College configuration updated for ${collegeCode}`, "success");
            if (onUpdateCollegeConfig) onUpdateCollegeConfig();
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
                                </div>

                                {/* WhatsApp Dedicated Bot Setup */}
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-400 uppercase text-[10px] flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3 text-emerald-400" />
                                            WhatsApp Bot Setup
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                            dedicatedBotInputs[c.code]
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : "bg-slate-800 text-slate-400 border-slate-700"
                                        }`}>
                                            {dedicatedBotInputs[c.code] ? "Dedicated Bot" : "Unified Bot (Default)"}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Dedicated Bot Phone (+91 94941...)"
                                        value={botPhoneInputs[c.code] ?? ""}
                                        onChange={(e) => setBotPhoneInputs(prev => ({ ...prev, [c.code]: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] outline-none focus:border-emerald-500"
                                    />
                                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(dedicatedBotInputs[c.code])}
                                            onChange={(e) => setDedicatedBotInputs(prev => ({ ...prev, [c.code]: e.target.checked }))}
                                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                        />
                                        Enable Dedicated WhatsApp Bot Instance
                                    </label>
                                </div>

                                <button
                                    onClick={() => handleSaveConfig(c.code)}
                                    disabled={savingCollege === c.code}
                                    className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {savingCollege === c.code ? "Saving Configuration..." : `Save ${c.code} Configuration`}
                                </button>

                                {/* Download bot_config.json */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const configObj = {
                                            targetCollege: c.code,
                                            backendUrl: "https://printer-backend-kgzp.onrender.com",
                                            frontendUrl: "https://cloudprint.website",
                                            botName: `${c.code} Dedicated WhatsApp Bot`
                                        };
                                        const blob = new Blob([JSON.stringify(configObj, null, 2)], { type: "application/json" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "bot_config.json";
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        showAlert("Config Downloaded", `bot_config.json for ${c.code} downloaded successfully! Place it in the bot-agent folder.`, "success");
                                    }}
                                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    title={`Download bot_config.json for ${c.code}`}
                                >
                                    📥 Download bot_config.json
                                </button>
                            </div>

                            {/* Main Admin Only: Reset College Orders & Emergency Suspension */}
                            <div className="pt-3 border-t border-slate-800 space-y-2">
                                {(localStorage.getItem("adminRole") === "MAIN_ADMIN" || localStorage.getItem("adminUser") === "admin") && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`⚠️ CRITICAL WARNING: This will permanently delete ALL orders and print records for College '${c.code}'. This action CANNOT be undone. Proceed?`)) {
                                                try {
                                                    await api.post("/admin/reset-stats", null, {
                                                        params: {
                                                            adminUsername: localStorage.getItem("adminUser") || "admin",
                                                            scope: "COLLEGE",
                                                            targetName: c.code
                                                        }
                                                    });
                                                    showAlert("Orders Reset", `All orders for ${c.code} have been deleted.`, "success");
                                                } catch (err) {
                                                    console.error(err);
                                                    showAlert("Error", "Failed to reset college orders", "error");
                                                }
                                            }
                                        }}
                                        className="w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer border border-rose-500/40 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 flex items-center justify-center gap-1.5"
                                        title={`Reset all orders for ${c.code}`}
                                    >
                                        🗑️ Reset Orders for {c.code}
                                    </button>
                                )}

                                {(localStorage.getItem("adminRole") === "MAIN_ADMIN" || localStorage.getItem("adminUser") === "admin") && (
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
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CollegeManagementSection;
