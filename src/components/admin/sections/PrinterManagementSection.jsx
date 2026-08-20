import React, { useState } from "react";
import { Printer, Plus, Activity, AlertTriangle, CheckCircle2, Sliders, Trash2, QrCode, KeyRound, Layers, PhoneCall, Mail, Bell, RefreshCw } from "lucide-react";
import api from "../../../services/api";

export function PrinterManagementSection({
    printers = [],
    blocks = [],
    printerPapers = {},
    onAddPrinter,
    onDeletePrinter,
    onToggleMaintenance,
    onUpdatePaperCount,
    showAlert,
    showConfirm
}) {
    // Form states
    const [name, setName] = useState("");
    const [ip, setIp] = useState("");
    const [block, setBlock] = useState(blocks[0]?.name || "C Block");
    const [isColor, setIsColor] = useState(false);
    const [isDuplex, setIsDuplex] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isQrScan, setIsQrScan] = useState(false);
    const [isOtp, setIsOtp] = useState(true);
    const [adding, setAdding] = useState(false);
    const [dispatchingAlert, setDispatchingAlert] = useState(false);

    const [paperInputs, setPaperInputs] = useState({});

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showAlert("Required", "Please enter printer name", "warning");
            return;
        }
        setAdding(true);
        try {
            await onAddPrinter({
                printerName: name.trim(),
                ipAddress: ip.trim(),
                blockLocation: block,
                colourSupported: isColor,
                duplexSupported: isDuplex,
                active: isActive,
                maintenance: isMaintenance,
                qrScanEnabled: isQrScan,
                otpEnabled: isOtp
            });
            setName("");
            setIp("");
        } finally {
            setAdding(false);
        }
    };

    const handlePaperRestock = (blockLocation) => {
        const count = paperInputs[blockLocation];
        if (count == null || isNaN(count) || count < 0) {
            showAlert("Invalid Count", "Please enter a valid paper count", "warning");
            return;
        }
        if (onUpdatePaperCount) {
            onUpdatePaperCount(blockLocation, Number(count));
        }
    };

    const handleTestEmergencyAlert = async () => {
        setDispatchingAlert(true);
        try {
            const res = await api.post("/printer/report-issue", {
                blockLocation: block || "C Block",
                printerName: name || "Primary Kiosk Printer",
                issueType: "TEST_ALERT",
                details: "Admin manually triggered test alert to verify WhatsApp & Email delivery."
            });
            showAlert(
                "Alert Dispatched 🚨",
                `Alert sent to:\n• Admin Phone: +91 9494189664 (WhatsApp)\n• Print Agent: +91 8688500278 (WhatsApp)\n• Admin Email: saipraveendasari1@gmail.com`,
                "success"
            );
        } catch (err) {
            showAlert("Alert Failed", err.response?.data?.message || err.message, "error");
        } finally {
            setDispatchingAlert(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Emergency Hardware Alert Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-rose-400">🚨 Automated Alert System</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">Email + WhatsApp Active</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Auto-notifies <strong className="text-white">Admin (+91 9494189664)</strong> &amp; <strong className="text-white">Print Agent (+91 8688500278)</strong> on Paper Out / Jams.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleTestEmergencyAlert}
                    disabled={dispatchingAlert}
                    className="py-2 px-4 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                    {dispatchingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {dispatchingAlert ? "Sending Alert..." : "Test Dispatch Alert"}
                </button>
            </div>
                {/* Add Printer Form */}
                <form onSubmit={handleAddSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Plus className="w-4 h-4 text-cyan-400" />
                            Register Physical Printer
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Map hardware devices to university kiosks</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Printer Model / Name</label>
                            <input
                                type="text"
                                placeholder="HP LaserJet Pro M404dn"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Network IP Address (Optional)</label>
                            <input
                                type="text"
                                placeholder="192.168.1.150"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Assigned Block</label>
                            <select
                                value={block}
                                onChange={(e) => setBlock(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                            >
                                {blocks.map(b => (
                                    <option key={b.id || b.name} value={b.name}>{b.name} ({b.college || "KLU"})</option>
                                ))}
                            </select>
                        </div>

                        {/* Capabilities Toggles */}
                        <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                            <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isColor}
                                    onChange={(e) => setIsColor(e.target.checked)}
                                    className="rounded border-slate-700 text-cyan-500"
                                />
                                <span className="font-bold">Color</span>
                            </label>

                            <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDuplex}
                                    onChange={(e) => setIsDuplex(e.target.checked)}
                                    className="rounded border-slate-700 text-cyan-500"
                                />
                                <span className="font-bold">Duplex</span>
                            </label>

                            <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isOtp}
                                    onChange={(e) => setIsOtp(e.target.checked)}
                                    className="rounded border-slate-700 text-cyan-500"
                                />
                                <span className="font-bold">OTP</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={adding}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {adding ? "Connecting..." : "Add Printer"}
                    </button>
                </form>

                {/* Live Paper Levels & Telemetry Summary */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-400" />
                                Live Paper Tray Management
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Restock paper levels to avoid kiosk print errors</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {blocks.map(b => {
                            const count = printerPapers[b.name] != null ? printerPapers[b.name] : 500;
                            const isLow = count < 50;
                            return (
                                <div key={b.id || b.name} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-sm text-white">{b.name}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                            isLow
                                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                        }`}>
                                            {count} Sheets Remaining
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="New count"
                                            value={paperInputs[b.name] ?? ""}
                                            onChange={(e) => setPaperInputs(prev => ({ ...prev, [b.name]: e.target.value }))}
                                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500"
                                        />
                                        <button
                                            onClick={() => handlePaperRestock(b.name)}
                                            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer"
                                        >
                                            Restock
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Registered Hardware Printers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printers.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                        No printers currently registered. Add your first printer above.
                    </div>
                ) : (
                    printers.map(p => {
                        return (
                            <div
                                key={p.id || p.printerName}
                                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-base font-black text-white">{p.printerName}</h4>
                                        <p className="text-xs text-cyan-400 font-bold mt-0.5">📍 {p.blockLocation}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                        p.maintenance
                                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.maintenance ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                                        {p.maintenance ? "MAINTENANCE" : "ONLINE"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-500 uppercase font-black">Color Mode</span>
                                        <p className="font-bold text-white mt-0.5">{p.colourSupported ? "Color & BW" : "BW Only"}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-500 uppercase font-black">IP Address</span>
                                        <p className="font-mono font-bold text-slate-300 mt-0.5 truncate">{p.ipAddress || "Local USB"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                                    <button
                                        onClick={() => onToggleMaintenance && onToggleMaintenance(p.id, p.maintenance)}
                                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                                            p.maintenance
                                                ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                                                : "bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30"
                                        }`}
                                    >
                                        {p.maintenance ? "Resume Kiosk" : "Put in Maintenance"}
                                    </button>

                                    <button
                                        onClick={() => onDeletePrinter && onDeletePrinter(p.id)}
                                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                        title="Delete Printer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default PrinterManagementSection;
