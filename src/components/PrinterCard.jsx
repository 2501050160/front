function PrinterCard({ printer, onEdit, onDelete, onToggleMaintenance, onToggleBwForColor, onUpdatePaper }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {printer.blockLocation}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        {printer.printerName || "Unnamed Printer"}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                        IP: {printer.printerIp || "Local / USB"}
                    </p>
                    <div className="flex flex-col gap-1.5 mt-2">
                        <div>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${
                                printer.otpEnabled !== false
                                    ? "text-violet-600 bg-violet-50/50 border-violet-100"
                                    : "text-amber-600 bg-amber-50/50 border-amber-100"
                            }`}>
                                {printer.otpEnabled !== false ? "🔑 OTP Required" : "⚡ Direct Print (No OTP)"}
                            </span>
                        </div>
                    </div>
                </div>

                <span
                    className={
                        printer.maintenance
                            ? "status-pill !bg-amber-500 !text-white !border-amber-600 font-bold"
                            : printer.paused
                            ? "status-pill !bg-slate-400 !text-white !border-slate-500 font-bold"
                            : printer.active
                            ? "status-pill status-paid"
                            : "status-pill status-unpaid"
                    }
                >
                    {printer.maintenance ? "Maintenance" : printer.paused ? "Paused" : printer.active ? "Active" : "Inactive"}
                </span>
            </div>

            <div className="mt-3 flex flex-col gap-1">
                <span className={`text-xs font-bold ${printer.colourSupported ? "text-emerald-600" : "text-slate-500"}`}>
                    🎨 Type: {printer.colourSupported ? "Supports Color & BW" : "Black & White Only"}
                </span>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
                {onEdit && (
                    <button
                        onClick={() => onEdit(printer)}
                        className="btn secondary min-h-0 px-4 py-2 text-sm font-bold"
                    >
                        📝 Edit
                    </button>
                )}
                {onToggleMaintenance && (
                    <button
                        onClick={() => onToggleMaintenance(printer)}
                        className={`btn min-h-0 px-4 py-2 text-sm font-bold ${printer.maintenance ? 'success' : 'danger'}`}
                    >
                        🛠 {printer.maintenance ? 'Set Online' : 'Set Maintenance'}
                    </button>
                )}
                {printer.colourSupported && onToggleBwForColor && (
                    <button
                        onClick={() => onToggleBwForColor(printer.id)}
                        className={`btn min-h-0 px-4 py-2 text-sm font-bold ${printer.bwDisabledForColor ? 'success' : 'secondary'}`}
                    >
                        {printer.bwDisabledForColor ? '✅ Enable B&W' : '🚫 Disable B&W'}
                    </button>
                )}
                {onUpdatePaper && (
                    <button
                        onClick={() => onUpdatePaper(printer)}
                        className="btn secondary min-h-0 px-4 py-2 text-sm font-bold"
                    >
                        📄 Update Paper
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(printer.id)}
                        className="btn danger min-h-0 px-4 py-2 text-sm font-bold"
                    >
                        🗑️ Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default PrinterCard;
