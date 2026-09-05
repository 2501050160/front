import React, { useState } from "react";
import { Building2, Plus, Key, Download, Edit3, Trash2, ShieldCheck, School } from "lucide-react";

export function BlockManagementSection({
    blocks = [],
    printers = [],
    onAddBlock,
    onRenameBlock,
    onDeleteBlock,
    onRegenerateKey,
    onDownloadConfig,
    showAlert,
    showConfirm
}) {
    const [newBlockName, setNewBlockName] = useState("");
    const [newBlockCollege, setNewBlockCollege] = useState("KLU");
    const [collegeFilter, setCollegeFilter] = useState("ALL");
    const [adding, setAdding] = useState(false);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!newBlockName.trim()) {
            showAlert("Required", "Please enter a block name", "warning");
            return;
        }
        setAdding(true);
        try {
            await onAddBlock({
                name: newBlockName.trim(),
                college: newBlockCollege.trim()
            });
            setNewBlockName("");
        } finally {
            setAdding(false);
        }
    };

    const filteredBlocks = blocks.filter(b => {
        if (collegeFilter === "ALL") return true;
        return (b.college || "KLU").toUpperCase() === collegeFilter.toUpperCase();
    });

    return (
        <div className="space-y-6">
            {/* Create Block Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to add a new block */}
                <form onSubmit={handleAddSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Plus className="w-4 h-4 text-cyan-400" />
                            Add Campus Block
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Provision a new physical print location</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Block Name</label>
                            <input
                                type="text"
                                placeholder="e.g. C Block or Library 2nd Floor"
                                value={newBlockName}
                                onChange={(e) => setNewBlockName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Campus / College</label>
                            <select
                                value={newBlockCollege}
                                onChange={(e) => setNewBlockCollege(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                            >
                                <option value="KLU">KLU (KL University)</option>
                                <option value="VNR">VNR VJIET</option>
                                <option value="CBIT">CBIT Hyderabad</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={adding}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {adding ? "Provisioning..." : "Add Block"}
                    </button>
                </form>

                {/* Filter and overview info */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                                Active Printing Locations
                            </h4>
                            <select
                                value={collegeFilter}
                                onChange={(e) => setCollegeFilter(e.target.value)}
                                className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
                            >
                                <option value="ALL">All Campuses</option>
                                <option value="KLU">KLU</option>
                                <option value="VNR">VNR</option>
                                <option value="CBIT">CBIT</option>
                            </select>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Each block operates with an isolated server API key connected to local physical print agents.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Total Blocks</span>
                            <p className="text-xl font-black text-white">{blocks.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Printers Linked</span>
                            <p className="text-xl font-black text-cyan-400">{printers.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase font-black">Colleges Active</span>
                            <p className="text-xl font-black text-emerald-400">
                                {new Set(blocks.map(b => b.college || "KLU")).size}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blocks Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBlocks.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                        No blocks found for this filter.
                    </div>
                ) : (
                    filteredBlocks.map(block => {
                        const blockPrinters = printers.filter(p => p.blockLocation === block.name);
                        return (
                            <div
                                key={block.id || block.name}
                                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-base font-black text-white">{block.name}</h4>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                                            <School className="w-3 h-3" />
                                            {block.college || "KLU"}
                                        </span>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                                        {blockPrinters.length} Printers
                                    </span>
                                </div>

                                {/* Server API Key */}
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                                        <span className="flex items-center gap-1">
                                            <Key className="w-3 h-3 text-amber-400" />
                                            Print-Agent API Key
                                        </span>
                                        {block.serverApiKey ? (
                                            <span className="text-emerald-400 font-black">Active</span>
                                        ) : (
                                            <span className="text-rose-400 font-black">Unset</span>
                                        )}
                                    </div>
                                    <p className="font-mono text-xs text-slate-300 truncate">
                                        {block.serverApiKey ? `${block.serverApiKey.slice(0, 14)}••••••••` : <span className="text-amber-300 font-bold">Click below to generate key</span>}
                                    </p>
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                                    <button
                                        onClick={() => onRegenerateKey && onRegenerateKey(block.id)}
                                        className="py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        🔑 {block.serverApiKey ? "Regenerate Key" : "Generate Key"}
                                    </button>

                                    <button
                                        onClick={() => onDownloadConfig && onDownloadConfig(block)}
                                        className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                        <Download className="w-3 h-3" />
                                        JSON Config
                                    </button>

                                    <button
                                        onClick={() => onRenameBlock && onRenameBlock(block.id, block.name)}
                                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Rename
                                    </button>

                                    <button
                                        onClick={() => onDeleteBlock && onDeleteBlock(block.id)}
                                        className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
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

export default BlockManagementSection;
