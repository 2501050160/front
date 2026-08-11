import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearUserSession } from "../services/auth";

function Navbar({ title, subtitle, actions = [], badge, badgeAction, tabs = [], activeTab, onTabChange }) {
    const navigate = useNavigate();
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
        <motion.div
            className="top-bar panel top-bar-glass px-6 py-5 flex flex-col gap-4 relative z-30 mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            {/* Top Row: Title, Subtitle, Badge, Profile */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4 pr-14 md:pr-0">
                    {title && <div className="brand-mark brand-mark-sm">CP</div>}
                    <div>
                        {subtitle && (
                            <p className="eyebrow !mb-0">{subtitle}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                            {title && <h1 className="title !mt-0 !mb-0">{title}</h1>}
                            {badge && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] border border-white/20 animate-pulse" style={{ animationDuration: '3.5s' }}>
                                    📍 {badge}
                                </span>
                            )}
                            {badgeAction && (
                                <button
                                    onClick={badgeAction.onClick || (() => navigate(badgeAction.path))}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-slate-800 border border-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer"
                                >
                                    🔄 {badgeAction.label}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs (if any) */}
                {tabs && tabs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 bg-slate-950/5 p-1.5 rounded-xl border border-slate-200/50">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange && onTabChange(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? "bg-white text-sky-600 shadow-sm border border-slate-100"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                                }`}
                            >
                                {tab.icon && <span>{tab.icon}</span>}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Separate Dedicated Section for Quick Links */}
            {actions && actions.length > 0 && (
                <div className="w-full pt-3.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 -mx-6 -mb-5 px-6 py-3 rounded-b-2xl">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            ⚡ Quick Action Links & Sub-Panels:
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        {actions.map((action) => {
                            if (action.to) {
                                return (
                                    <Link
                                        key={action.label}
                                        to={action.to}
                                        className={action.className || "btn secondary text-xs py-1.5 px-3 min-h-0 font-bold"}
                                    >
                                        {action.label}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={action.label}
                                    onClick={action.onClick || (() => navigate(action.path))}
                                    className={action.className || "btn secondary text-xs py-1.5 px-3 min-h-0 font-bold"}
                                >
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Floating Profile Avatar in top layer, absolute top-right */}
            {(userId || adminId) && (
                <div 
                    className="absolute right-6 top-5 z-[9999]"
                    onMouseEnter={() => setProfileOpen(true)}
                    onMouseLeave={() => setProfileOpen(false)}
                >
                    {/* Profile Dropdown Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm border-2 border-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                            style={{ minHeight: "40px" }}
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
                                        className="absolute right-0 mt-3 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.15)] p-4 text-slate-800 z-[9999]"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
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
                </div>
            )}
        </motion.div>
    );
}

export default Navbar;
