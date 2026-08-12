import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearUserSession } from "../services/auth";

function Navbar({ title, subtitle, actions = [], badge, badgeAction, tabs = [], activeTab, onTabChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);
    const [quickLinksOpen, setQuickLinksOpen] = useState(false);

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

    // User quick navigation items
    const userQuickLinks = [
        { label: "New Print Job", desc: "Upload docs & configure print", path: "/dashboard", icon: "🖨️", color: "from-sky-500 to-blue-600" },
        { label: "My Orders & OTP", desc: "Track status & pickup codes", path: "/my-orders", icon: "📦", color: "from-emerald-500 to-teal-600" },
        { label: "Scan to Print", desc: "Instant kiosk QR scanner", path: "/scan-to-print", icon: "📱", color: "from-purple-500 to-indigo-600" },
        { label: "Referrals & Rewards", desc: "Earn ₹10 per referral", path: "/referrals", icon: "🎁", color: "from-amber-500 to-orange-600" },
        { label: "Campus Locations", desc: "Switch kiosk block", path: "/blocks", icon: "🏢", color: "from-cyan-500 to-sky-600" },
        { label: "AI Print Assistant", desc: "Instant chatbot help", path: "/chatbot", icon: "💬", color: "from-pink-500 to-rose-600" },
    ];

    // Admin quick navigation items
    const adminQuickLinks = [
        { label: "Admin Operations", desc: "Live operations & queue", path: "/admin?tab=queue", icon: "📊", color: "from-sky-500 to-blue-600" },
        { label: "Queue Kanban", desc: "Live print dispatch board", path: "/admin?tab=queue", icon: "📋", color: "from-emerald-500 to-teal-600" },
        { label: "Users Management", desc: "Student accounts & wallets", path: "/admin?tab=users", icon: "👥", color: "from-indigo-500 to-purple-600" },
        { label: "Analytics & Reports", desc: "Revenue & print volume", path: "/admin?tab=analytics", icon: "📈", color: "from-amber-500 to-orange-600" },
        { label: "Pricing & Coupons", desc: "Per-page rates & discounts", path: "/admin?tab=settings", icon: "🏷️", color: "from-purple-500 to-pink-600" },
        { label: "WhatsApp Orders", desc: "Bot submitted print jobs", path: "/admin?tab=whatsapp", icon: "🤖", color: "from-green-500 to-emerald-600" },
        { label: "Manage Printers", desc: "Paper levels & kiosk status", path: "/admin?tab=printers", icon: "🖨️", color: "from-cyan-500 to-blue-600" },
        { label: "Manage Blocks", desc: "Campus kiosk locations", path: "/admin?tab=blocks", icon: "🏛️", color: "from-teal-500 to-emerald-600" },
        { label: "TV Display Panel", desc: "Public departure board", path: "/display-panel", icon: "📺", color: "from-rose-500 to-red-600" },
        { label: "Kiosk Hardware", desc: "Physical printer config", path: "/printer-settings", icon: "⚙️", color: "from-slate-600 to-slate-800" },
    ];

    const currentQuickLinks = adminId ? adminQuickLinks : userQuickLinks;

    return (
        <motion.header
            className="top-bar panel top-bar-glass sticky top-0 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col gap-3 z-40 mb-6 backdrop-blur-2xl shadow-lg border border-slate-200/80 w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            {/* Top Row: Title, Subtitle, Badge, Tabs, Quick Links Dropdown & Profile */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full">
                {/* Left Side: Brand mark & Titles */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {title && <div className="brand-mark brand-mark-sm">CP</div>}
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

                {/* Right Controls: Tabs + Quick Links Dropdown + Profile Avatar */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-end md:self-auto">
                    {/* Navigation Tabs (if any) */}
                    {tabs && tabs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 bg-slate-950/5 p-1 rounded-xl border border-slate-200/50">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange && onTabChange(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
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

                    {/* Quick Links Dropdown Button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setQuickLinksOpen(!quickLinksOpen);
                                setProfileOpen(false);
                            }}
                            className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer ${
                                quickLinksOpen
                                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white border border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.35)]"
                                    : "bg-white/90 hover:bg-white text-slate-800 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 shadow-sm"
                            }`}
                            title="Quick Navigation & Action Links"
                        >
                            <span className={quickLinksOpen ? "text-white" : "text-amber-500"}>⚡</span>
                            <span>Quick Links</span>
                            <motion.span
                                animate={{ rotate: quickLinksOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] opacity-80"
                            >
                                ▼
                            </motion.span>
                        </button>

                        <AnimatePresence>
                            {quickLinksOpen && (
                                <>
                                    {/* Backdrop overlay */}
                                    <div 
                                        className="fixed inset-0 z-[9998] cursor-default bg-black/10 backdrop-blur-[1px]"
                                        onClick={() => setQuickLinksOpen(false)}
                                    />

                                    {/* Quick Links Dropdown Menu */}
                                    <motion.div
                                        className="absolute right-0 mt-2.5 w-80 max-h-[82vh] overflow-y-auto custom-scrollbar rounded-2xl bg-white/98 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.22)] p-3.5 text-slate-800 z-[9999]"
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.16 }}
                                    >
                                        <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-150 mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-black">⚡</span>
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Quick Links</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">
                                                {adminId ? "Admin Portal" : "Student Portal"}
                                            </span>
                                        </div>

                                        {/* Page Specific Actions (if any passed to Navbar) */}
                                        {actions && actions.length > 0 && (
                                            <div className="mb-3 pb-2.5 border-b border-slate-150">
                                                <p className="px-2.5 text-[10px] font-black uppercase tracking-wider text-sky-600 mb-1.5 flex items-center gap-1">
                                                    <span>🎯</span> Current Page Actions
                                                </p>
                                                <div className="space-y-1">
                                                    {actions.map((action) => {
                                                        const isActActive = action.path && location.pathname === action.path;
                                                        if (action.to) {
                                                            return (
                                                                <Link
                                                                    key={action.label}
                                                                    to={action.to}
                                                                    onClick={() => setQuickLinksOpen(false)}
                                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left hover:bg-sky-50 hover:text-sky-700 text-slate-700"
                                                                >
                                                                    <span>{action.label}</span>
                                                                    <span className="text-slate-400 text-xs">➔</span>
                                                                </Link>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                key={action.label}
                                                                onClick={() => {
                                                                    setQuickLinksOpen(false);
                                                                    if (action.onClick) action.onClick();
                                                                    else if (action.path) navigate(action.path);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                                                                    isActActive
                                                                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                                                                        : "hover:bg-sky-50 hover:text-sky-700 text-slate-700"
                                                                }`}
                                                            >
                                                                <span>{action.label}</span>
                                                                <span className="text-slate-400 text-xs">➔</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Core Quick Links Grid / List */}
                                        <div className="space-y-1">
                                            <p className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                                <span>🧭</span> Navigation Shortcuts
                                            </p>
                                            {currentQuickLinks.map((item) => {
                                                const isActive = (location.pathname + location.search) === item.path || location.pathname === item.path;
                                                return (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => {
                                                            setQuickLinksOpen(false);
                                                            navigate(item.path);
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                                                            isActive
                                                                ? "bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-300 text-sky-700 shadow-sm"
                                                                : "hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border border-transparent"
                                                        }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.color} text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                                                            {item.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black text-slate-800 group-hover:text-sky-600 truncate flex items-center gap-1.5">
                                                                {item.label}
                                                                {isActive && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ring-2 ring-sky-200"></span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] font-semibold text-slate-400 truncate">
                                                                {item.desc}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

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
