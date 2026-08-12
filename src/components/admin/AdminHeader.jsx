import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, RefreshCw, School, Bell, LogOut, ChevronDown, CheckCircle2 } from "lucide-react";

export function AdminHeader({
    title = "Admin Operations",
    subtitle = "Control Panel",
    onToggleMobileSidebar,
    selectedCollege = "ALL",
    onChangeCollege,
    colleges = ["ALL", "KLU", "VNR", "CBIT"],
    userRole = "SUB_ADMIN",
    adminUser = "Admin",
    adminCollege = "KLU",
    onRefresh,
    isRefreshing = false
}) {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminCollege");
        navigate("/admin-login");
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3.5 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
            {/* Left side: Mobile Menu Button & Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleMobileSidebar}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden cursor-pointer"
                    title="Toggle Navigation Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-base md:text-xl font-black text-white tracking-tight">{title}</h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE SYNC
                        </span>
                    </div>
                    {subtitle && <p className="text-[11px] font-medium text-slate-400 hidden sm:block">{subtitle}</p>}
                </div>
            </div>

            {/* Right side: Controls & Profile */}
            <div className="flex items-center gap-2.5 md:gap-4">
                {/* College Filter selector if Main Admin */}
                {(userRole === "MAIN_ADMIN" || adminUser === "admin") && onChangeCollege && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300">
                        <School className="w-3.5 h-3.5 text-cyan-400" />
                        <select
                            value={selectedCollege}
                            onChange={(e) => onChangeCollege(e.target.value)}
                            className="bg-transparent border-0 text-white font-bold text-xs focus:ring-0 cursor-pointer outline-none"
                        >
                            {colleges.map(c => (
                                <option key={c} value={c} className="bg-slate-900 text-white">
                                    {c === "ALL" ? "All Campuses" : c}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Manual Refresh Button */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        title="Refresh Live Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
                    </button>
                )}

                {/* Display Panel Shortcut Button */}
                <button
                    onClick={() => navigate("/display-panel")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-black transition-all cursor-pointer shadow-sm shrink-0"
                    title="Open Live Display Panel"
                >
                    <span className="text-sm">📺</span>
                    <span className="hidden sm:inline">Display Panel</span>
                </button>

                {/* Admin Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {adminUser.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-xs font-black text-white leading-none">{adminUser}</p>
                            <p className="text-[10px] text-cyan-400 font-bold leading-none mt-0.5">{userRole}</p>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                    </button>

                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-slate-200">
                                <div className="p-2 border-b border-slate-800 mb-2">
                                    <p className="text-xs font-black text-white">{adminUser}</p>
                                    <p className="text-[11px] text-cyan-400">{userRole} • {adminCollege}</p>
                                </div>
                                <div className="space-y-1">
                                    <Link
                                        to="/display-panel"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        Live TV Display
                                    </Link>
                                    <Link
                                        to="/printer-settings"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        Printer Hardware Setup
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-all text-left cursor-pointer"
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

export default AdminHeader;
