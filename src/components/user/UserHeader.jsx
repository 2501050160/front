import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, MapPin, Wallet, ChevronDown, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { clearUserSession } from "../../services/auth";

export function UserHeader({
    blockLocation,
    walletBalance = 0,
    onOpenWallet,
    onToggleMobileSidebar,
    userName = "Student",
    userEmail = "user@example.com",
    systemStatus = { databaseConnected: true, agentOnline: true, printerConfigured: true }
}) {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const isConnected = systemStatus.databaseConnected && systemStatus.agentOnline && systemStatus.printerConfigured;

    const handleLogout = () => {
        clearUserSession();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3.5 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
            {/* Left: Mobile Menu & Location Pill */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleMobileSidebar}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden cursor-pointer"
                    title="Toggle Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Location Badge */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/blocks")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-black text-white hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm"
                    >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate max-w-[140px] sm:max-w-[220px]">{blockLocation || "Select Location"}</span>
                        <span className="text-[10px] text-cyan-400 ml-1 font-bold">Change ➔</span>
                    </button>

                    {/* Live Kiosk Connection Dot */}
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        isConnected
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                        {isConnected ? "KIOSK ONLINE" : "CONNECTING"}
                    </span>
                </div>
            </div>

            {/* Right: Wallet Balance & Profile */}
            <div className="flex items-center gap-3">
                {/* Wallet Balance Pill */}
                <button
                    onClick={onOpenWallet}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-black text-emerald-300 transition-all cursor-pointer shadow-sm"
                >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>₹{Number(walletBalance).toFixed(2)}</span>
                    <span className="hidden sm:inline text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded text-white">+ Add</span>
                </button>

                {/* Profile Avatar */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    </button>

                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-slate-200">
                                <div className="p-2 border-b border-slate-800 mb-2">
                                    <p className="text-xs font-black text-white">{userName}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            onOpenWallet();
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
                                    >
                                        <span>Wallet Balance</span>
                                        <span className="text-emerald-400 font-black">₹{Number(walletBalance).toFixed(2)}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate("/blocks");
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold cursor-pointer"
                                    >
                                        <span>Switch Campus Block</span>
                                        <span className="text-cyan-400">➔</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 font-bold transition-all text-left cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default UserHeader;
