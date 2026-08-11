import React from "react";
import { FileText, Trash2, Layers, Copy, Palette, Sliders, ChevronDown } from "lucide-react";

export function FileConfigCard({
    file,
    config,
    index,
    onUpdateConfig,
    onRemove,
    colorSupported = true
}) {
    if (!config) return null;

    return (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-all">
            {/* Header: File Name, Page count & Remove */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                        <h4 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">{config.fileName || file?.name || "Document.pdf"}</h4>
                        <span className="text-[11px] font-bold text-cyan-400">
                            {config.totalPages || 1} Total Pages
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onRemove(index)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer shrink-0"
                    title="Remove File"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Print Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                {/* 1. Print Mode: BW vs Color */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Print Color</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "printType", "BW")}
                            className={`py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                                config.printType === "BW"
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            B&W
                        </button>
                        <button
                            type="button"
                            disabled={!colorSupported}
                            onClick={() => onUpdateConfig(index, "printType", "COLOR")}
                            className={`py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                                config.printType === "COLOR"
                                    ? "bg-pink-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            } ${!colorSupported ? "opacity-30 cursor-not-allowed" : ""}`}
                            title={!colorSupported ? "Color not available in this block" : ""}
                        >
                            Color
                        </button>
                    </div>
                </div>

                {/* 2. Page Range: ALL vs Custom */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Pages to Print</label>
                    <select
                        value={config.pageOption}
                        onChange={(e) => onUpdateConfig(index, "pageOption", e.target.value)}
                        className="w-full py-2 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none cursor-pointer"
                    >
                        <option value="ALL">All Pages (1 - {config.totalPages || 1})</option>
                        <option value="CUSTOM">Custom Page Range</option>
                    </select>

                    {config.pageOption === "CUSTOM" && (
                        <div className="flex items-center gap-1 mt-1">
                            <input
                                type="number"
                                min="1"
                                max={config.totalPages || 1}
                                placeholder="From"
                                value={config.startPage || "1"}
                                onChange={(e) => onUpdateConfig(index, "startPage", e.target.value)}
                                className="w-1/2 p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-center text-xs outline-none"
                            />
                            <span className="text-slate-500 font-bold">-</span>
                            <input
                                type="number"
                                min="1"
                                max={config.totalPages || 1}
                                placeholder="To"
                                value={config.endPage || config.totalPages || "1"}
                                onChange={(e) => onUpdateConfig(index, "endPage", e.target.value)}
                                className="w-1/2 p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-center text-xs outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* 3. Duplex & N-Up Layout */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Layout & Sides</label>
                    <div className="flex items-center gap-2">
                        <select
                            value={config.nupLayout || "1-up"}
                            onChange={(e) => onUpdateConfig(index, "nupLayout", e.target.value)}
                            className="w-1/2 py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none cursor-pointer"
                        >
                            <option value="1-up">1 Page/Sheet</option>
                            <option value="2-up">2 Pages/Sheet</option>
                            <option value="4-up">4 Pages/Sheet</option>
                            <option value="6-up">6 Pages/Sheet</option>
                            <option value="9-up">9 Pages/Sheet</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "doubleSided", !config.doubleSided)}
                            className={`w-1/2 py-2 px-1 rounded-xl font-black text-[11px] transition-all cursor-pointer border ${
                                config.doubleSided
                                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-slate-950 text-slate-400 border-slate-800"
                            }`}
                        >
                            {config.doubleSided ? "✓ Both Sides" : "Single Side"}
                        </button>
                    </div>
                </div>

                {/* 4. Number of Copies */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Copies</label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "copies", Math.max(1, (config.copies || 1) - 1))}
                            className="w-8 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-black cursor-pointer"
                        >
                            -
                        </button>
                        <span className="flex-1 text-center font-black text-white text-xs">{config.copies || 1}</span>
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "copies", (config.copies || 1) + 1)}
                            className="w-8 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-black cursor-pointer"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FileConfigCard;
