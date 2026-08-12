import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearUserSession } from "../services/auth";
import cloudprintLogo from "../assets/cloudprint_logo.png";

function Navbar({ 
    title, 
    subtitle, 
    actions = [], 
    badge, 
    badgeAction, 
    tabs = [], 
    activeTab, 
    onTabChange,
    onToggleSidebar,
    isSidebarCollapsed = false
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "User";
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";
    const referralCode = localStorage.getItem("referralCode") || "";
    const walletBalance = localStorage.getItem("walletBalance") || "0.0";
    const adminId = localStorage.getItem("adminId");
    const adminUser = localStorage.getItem("adminUser") || "Admin";

    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <motion.header
            className="top-bar panel top-bar-glass sticky top-0 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col gap-3 z-40 mb-6 backdrop-blur-2xl shadow-lg border border-slate-200/80 w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            {/* Top Row: Title, Subtitle, Badge, Tabs, Actions & Profile */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full">
                {/* Left Side: 3-line Hamburger Menu Toggle + Brand mark & Titles */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 hover:text-sky-600 border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer shadow-sm flex items-center justify-center active:scale-95 group"
                            title={isSidebarCollapsed ? "Expand Side Navigation (☰)" : "Collapse Side Navigation (☰)"}
                            aria-label="Toggle Side Navigation"
                        >
                            <div className="w-4 h-3.5 flex flex-col justify-between items-center py-0.5">
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                            </div>
                        </button>
                    )}
                    <img src={cloudprintLogo} alt="CloudPrint" className="h-9 object-contain shrink-0" />
                    <div>
                        {subtitle && (
                            <p className="eyebrow !mb-0">{subtitle}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {title && <h1 className="title !mt-0 !mb-0 text-lg sm:text-xl font-black">{title}</h1>}
                            {badge && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] border border-white/20 animate-pulse" style={{ animationDuration: '3.5s' }}>
                                    📍 {badge}
                                </span>
                            )}
                            {badgeAction && (
                                <button
                                    onClick={badgeAction.onClick || (() => navigate(badgeAction.path))}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-slate-800 border border-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer"
                                >
                                    🔄 {badgeAction.label}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Controls: Tabs + Page Actions + Profile Avatar */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-end md:self-auto">
                    {/* Navigation Tabs (if any) */}
                    {tabs && tabs.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 custom-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange && onTabChange(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                                        activeTab === tab.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-100/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    {tab.icon && <span className="text-sm">{tab.icon}</span>}
                                    <div className="flex flex-col text-left">
                                        <span className="leading-tight">{tab.label}</span>
                                        {tab.desc && (
                                            <span className={`text-[9px] font-semibold leading-tight ${activeTab === tab.id ? "text-sky-100" : "text-slate-500"}`}>
                                                {tab.desc}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Page Actions (if any) */}
                    {actions && actions.length > 0 && (
                        <div className="flex items-center gap-2">
                            {actions.map((action) => {
                                if (action.to) {
                                    return (
                                        <Link
                                            key={action.label}
                                            to={action.to}
                                            className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 hover:text-sky-600 border border-slate-200/90 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <span>{action.label}</span>
                                        </Link>
                                    );
                                }
                                return (
                                    <button
                                        key={action.label}
                                        onClick={() => {
                                            if (action.onClick) action.onClick();
                                            else if (action.path) navigate(action.path);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 hover:text-sky-600 border border-slate-200/90 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Display Panel Shortcut Button (Admin Only) */}
                    {Boolean(adminId || localStorage.getItem("adminToken") || localStorage.getItem("adminRole")) && (
                        <button
                            onClick={() => navigate("/display-panel")}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 text-slate-800 hover:text-sky-700 border border-sky-200/80 hover:border-sky-300 text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                            title="Open Live Display Panel"
                        >
                            <span className="text-base">📺</span>
                            <span className="hidden sm:inline">Display Panel</span>
                        </button>
                    )}

                    {/* Profile Avatar & Dropdown */}
                    {(userId || adminId) && (
                        <div 
                            className="relative"
                            onMouseEnter={() => setProfileOpen(true)}
                            onMouseLeave={() => setProfileOpen(false)}
                        >
                            {/* Profile Dropdown Toggle Button */}
                            <button
                                onClick={() => {
                                    setProfileOpen(!profileOpen);
                                    setQuickLinksOpen(false);
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs sm:text-sm border-2 border-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative shrink-0"
                                style={{ minHeight: "36px" }}
                                title="User Profile & Settings"
                            >
                                {userId ? getInitials(userName) : "AD"}
                                {/* Online status badge */}
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <>
                                        {/* Backdrop overlay for closing dropdown on tap/click outside */}
                                        <div 
                                            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                                            onClick={() => setProfileOpen(false)}
                                        />

                                        {/* Dropdown Menu */}
                                        <motion.div
                                            className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-4 text-slate-800 z-[9999]"
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.16 }}
                                        >
                                            <div className="border-b border-slate-150 pb-3 mb-3">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">{userId ? userName : adminUser}</p>
                                                {userId && (
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{userEmail}</p>
                                                )}
                                            </div>

                                            {userId ? (
                                                <div className="space-y-1.5 mb-3">
                                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                                                        <span className="text-xs font-bold text-slate-600">Wallet</span>
                                                        <span className="text-xs font-black text-sky-600">Rs. {Number(walletBalance).toFixed(2)}</span>
                                                    </div>
                                                    {referralCode && (
                                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                                                            <span className="text-xs font-bold text-slate-600">Code</span>
                                                            <span className="text-xs font-black text-slate-900 font-mono tracking-wider">{referralCode}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mb-3">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 border border-sky-200">
                                                        Administrator
                                                    </span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => {
                                                    clearUserSession();
                                                    navigate("/login");
                                                }}
                                                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-100"
                                            >
                                                <span>🚪</span> Sign Out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.header>
    );
}

export default Navbar;
