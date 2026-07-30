import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearUserSession } from "../services/auth";

function Navbar({ title, subtitle, actions = [], badge, tabs = [], activeTab, onTabChange }) {
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
            className="top-bar panel top-bar-glass px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-30"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            <div className="flex items-center gap-4 pr-14 md:pr-0">
                <div className="brand-mark brand-mark-sm">CP</div>
                <div>
                    {subtitle && (
                        <p className="eyebrow !mb-0">{subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="title !mt-0 !mb-0">{title}</h1>
                        {badge && (
                            <span className="status-pill status-created">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
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

            <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto pr-14 md:pr-0 mt-2 md:mt-0">
                {actions.map((action) => {
                    if (action.to) {
                        return (
                            <Link
                                key={action.label}
                                to={action.to}
                                className={action.className || "btn secondary"}
                            >
                                {action.label}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={action.label}
                            onClick={action.onClick || (() => navigate(action.path))}
                            className={action.className || "btn secondary"}
                        >
                            {action.label}
                        </button>
                    );
                })}
            </div>

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
                                    
                                    <motion.div
                                        className="absolute right-0 top-full mt-3 w-64 rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 z-[9999] text-slate-900"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ type: "spring", duration: 0.3 }}
                                    >
                                        <div className="flex flex-col items-center text-center border-b border-slate-100 pb-4 mb-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-black text-2xl border-2 border-white shadow-inner mb-3">
                                                {userId ? getInitials(userName) : "AD"}
                                            </div>
                                            <h4 className="text-base font-black text-slate-900 leading-tight">
                                                {userId ? userName : adminUser}
                                            </h4>
                                            <p className="text-xs font-semibold text-slate-500 truncate max-w-full">
                                                {userId ? userEmail : "System Administrator"}
                                            </p>
                                        </div>

                                        {userId && (
                                            <div className="space-y-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                                                <div className="flex justify-between">
                                                    <span>Wallet Balance:</span>
                                                    <span className="text-emerald-600 font-black">Rs. {walletBalance}</span>
                                                </div>
                                                {referralCode && (
                                                    <div className="flex justify-between">
                                                        <span>Referral ID:</span>
                                                        <span className="text-cyan-600 font-mono font-black">{referralCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {userId && (
                                            <button
                                                onClick={() => {
                                                    setProfileOpen(false);
                                                    navigate("/referrals");
                                                }}
                                                className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg text-xs font-black text-sky-600 flex items-center gap-1.5 transition-colors cursor-pointer mb-2"
                                            >
                                                🏆 Referrals & Rewards
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                if (userId) {
                                                    clearUserSession();
                                                    navigate("/");
                                                } else {
                                                    localStorage.removeItem("adminId");
                                                    localStorage.removeItem("adminUser");
                                                    navigate("/admin-login");
                                                }
                                            }}
                                            className="btn danger w-full min-h-[38px] py-2 text-xs font-black cursor-pointer"
                                        >
                                            Logout
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
