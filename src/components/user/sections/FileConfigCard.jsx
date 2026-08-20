import React from "react";
import { FileText, Trash2, Layers, Copy, Palette, Sliders, RotateCw, Sparkles, Check } from "lucide-react";

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

            {/* Interactive Print Options Grid (No Dropdowns - Colorful & Attractive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                {/* 1. Orientation: Portrait vs Horizontal Buttons */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-cyan-400" />
                        Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "orientation", "portrait")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                (config.orientation || "portrait") === "portrait"
                                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-300 shadow-md shadow-cyan-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            <span className="w-2.5 h-3.5 border border-current rounded-xs inline-block" />
                            Portrait
                        </button>
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "orientation", "landscape")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                config.orientation === "landscape"
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-purple-300 shadow-md shadow-purple-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            <span className="w-3.5 h-2.5 border border-current rounded-xs inline-block" />
                            Horizontal
                        </button>
                    </div>
                </div>

                {/* 2. Print Mode: BW vs Color Buttons */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Palette className="w-3 h-3 text-pink-400" />
                        Print Color
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "printType", "BW")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                config.printType === "BW"
                                    ? "bg-gradient-to-r from-slate-700 to-zinc-800 text-white border border-slate-400 shadow-md shadow-slate-900/50"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            B&W
                        </button>
                        <button
                            type="button"
                            disabled={!colorSupported}
                            onClick={() => onUpdateConfig(index, "printType", "COLOR")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                config.printType === "COLOR"
                                    ? "bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white border border-pink-300 shadow-md shadow-pink-500/30"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            } ${!colorSupported ? "opacity-30 cursor-not-allowed" : ""}`}
                            title={!colorSupported ? "Color not available in this block" : ""}
                        >
                            Color
                        </button>
                    </div>
                </div>

                {/* 3. Print Sides: Single Side vs Double Side Buttons */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        Print Sides
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "doubleSided", false)}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                !config.doubleSided || config.printType === "COLOR"
                                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white border border-cyan-300 shadow-md shadow-cyan-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            Single Side
                        </button>
                        <button
                            type="button"
                            disabled={config.printType === "COLOR"}
                            onClick={() => onUpdateConfig(index, "doubleSided", true)}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                config.doubleSided && config.printType !== "COLOR"
                                    ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border border-emerald-300 shadow-md shadow-emerald-500/30"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            } ${config.printType === "COLOR" ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                            Double Side
                        </button>
                    </div>
                </div>

                {/* 4. N-Up Layout: 1-Up, 2-Up, 4-Up, 6-Up Buttons */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-purple-400" />
                        Pages/Sheet
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                            { id: "1-up", label: "1-UP", gradient: "from-amber-500 to-orange-600 border-amber-300" },
                            { id: "2-up", label: "2-UP", gradient: "from-sky-500 to-blue-600 border-sky-300" },
                            { id: "4-up", label: "4-UP", gradient: "from-purple-500 to-indigo-600 border-purple-300" },
                            { id: "6-up", label: "6-UP", gradient: "from-fuchsia-500 to-pink-600 border-pink-300" }
                        ].map((layout) => (
                            <button
                                key={layout.id}
                                type="button"
                                onClick={() => onUpdateConfig(index, "nupLayout", layout.id)}
                                className={`py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer text-center ${
                                    (config.nupLayout || "1-up") === layout.id
                                        ? `bg-gradient-to-r ${layout.gradient} text-white shadow-md`
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                }`}
                            >
                                {layout.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. Page Range Buttons & Inputs */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Copy className="w-3 h-3 text-cyan-400" />
                        Pages
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "pageOption", "ALL")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                (config.pageOption || "ALL") === "ALL"
                                    ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white border border-cyan-300 shadow-md"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            All ({config.totalPages || 1})
                        </button>
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(index, "pageOption", "CUSTOM")}
                            className={`py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                config.pageOption === "CUSTOM"
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-300 shadow-md"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                        >
                            Custom
                        </button>
                    </div>

                    {config.pageOption === "CUSTOM" && (
                        <div className="flex items-center gap-1 mt-1">
                            <input
                                type="number"
                                min="1"
                                max={config.totalPages || 1}
                                placeholder="From"
                                value={config.startPage || "1"}
                                onChange={(e) => onUpdateConfig(index, "startPage", e.target.value)}
                                className="w-1/2 p-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-center text-xs outline-none font-black"
                            />
                            <span className="text-slate-500 font-bold">-</span>
                            <input
                                type="number"
                                min="1"
                                max={config.totalPages || 1}
                                placeholder="To"
                                value={config.endPage || config.totalPages || "1"}
                                onChange={(e) => onUpdateConfig(index, "endPage", e.target.value)}
                                className="w-1/2 p-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-center text-xs outline-none font-black"
                            />
                        </div>
                    )}
                </div>

                {/* 6. Number of Copies: Stepper + Quick Pills */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Number of Copies
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => onUpdateConfig(index, "copies", Math.max(1, (config.copies || 1) - 1))}
                                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-black cursor-pointer text-xs flex items-center justify-center border border-slate-700"
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-black text-amber-300 text-xs">{config.copies || 1}</span>
                            <button
                                type="button"
                                onClick={() => onUpdateConfig(index, "copies", (config.copies || 1) + 1)}
                                className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black cursor-pointer text-xs flex items-center justify-center shadow-md shadow-orange-500/20"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 5].map((qty) => (
                                <button
                                    key={qty}
                                    type="button"
                                    onClick={() => onUpdateConfig(index, "copies", qty)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                        Number(config.copies || 1) === qty
                                            ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-orange-500/30 font-black"
                                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-400/50 hover:text-white"
                                    }`}
                                >
                                    {qty}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FileConfigCard;
