import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ListOrdered,
    BarChart3,
    Tag,
    Building2,
    Printer,
    School,
    Users,
    MessageSquare,
    Headphones,
    Palette,
    Settings as SettingsIcon,
    Shield,
    BellRing,
    Tv,
    Sliders,
    LogOut,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export function AdminSidebar({
    activeTab,
    onSelectTab,
    isCollapsed,
    onToggleCollapse,
    orderCount = 0,
    userRole = "SUB_ADMIN",
    adminUser = "Admin",
    adminCollege = "KLU",
    className = ""
}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminCollege");
        navigate("/admin-login");
    };

    const navItems = [
        { id: "queue", label: "Live Queue", icon: ListOrdered, badge: orderCount > 0 ? orderCount : null },
        { id: "analytics", label: "Analytics & Revenue", icon: BarChart3, hideForManager: true },
        { id: "settings", label: "Pricing & Coupons", icon: Tag },
        { id: "blocks", label: "Manage Blocks", icon: Building2, hideForManager: true },
        { id: "printers", label: "Manage Printers", icon: Printer },
        { id: "colleges", label: "College Hub", icon: School, mainAdminOnly: true },
        { id: "users", label: "User Moderation", icon: Users },
        { id: "whatsapp", label: "WhatsApp Orders", icon: MessageSquare },
        { id: "support", label: "Support Tickets", icon: Headphones, hideForManager: true },
        { id: "frontend", label: "Frontend & Ads", icon: Palette, hideForManager: true },
        { id: "system", label: "System Config & SQL", icon: SettingsIcon, hideForManager: true },
    ];

    const filteredItems = navItems.filter(item => {
        if (item.mainAdminOnly && userRole !== "MAIN_ADMIN" && adminUser !== "admin") return false;
        if (item.hideForManager && userRole === "MANAGER") return false;
        return true;
    });

    const [quickLinksOpen, setQuickLinksOpen] = React.useState(false);

    return (
        <aside
            className={`admin-sidebar relative flex flex-col justify-between border-r border-slate-800 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 z-40 ${
                isCollapsed ? "w-20" : "w-64"
            } ${className}`}
            style={{
                background: "linear-gradient(180deg, rgba(2, 6, 23, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)"
            }}
        >
            {/* Top Brand Header */}
            <div>
                <div className={`p-4 flex items-center border-b border-slate-800/80 ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25 shrink-0">
                                CP
                            </div>
                            <div className="truncate">
                                <h2 className="text-sm font-black tracking-wide text-white">Admin Portal</h2>
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                                    {userRole}
                                </span>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25">
                            CP
                        </div>
                    )}

                    {/* Collapse Button */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden md:flex p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* College Info Pill */}
                {!isCollapsed && (
                    <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Campus</span>
                        <span className="font-black text-cyan-400">{adminCollege}</span>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                    {/* Quick Links Section */}
                    {!isCollapsed && (
                        <div className="bg-slate-900/60 rounded-2xl p-2 border border-slate-800/80">
                            <button
                                onClick={() => setQuickLinksOpen(!quickLinksOpen)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-black text-amber-400 hover:text-amber-300 hover:bg-slate-800/60 uppercase tracking-wider transition-all cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-sm">⚡</span>
                                    <span>QUICK LINKS</span>
                                </span>
                                <motion.span
                                    animate={{ rotate: quickLinksOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[10px] text-slate-400"
                                >
                                    ▼
                                </motion.span>
                            </button>

                            {quickLinksOpen && (
                                <div className="space-y-1 mt-1.5">
                                    <button
                                        onClick={() => onSelectTab("queue")}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "queue"
                                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md shadow-sky-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <span className="text-base">📋</span>
                                        <span>Queue Kanban</span>
                                    </button>

                                    <button
                                        onClick={() => onSelectTab("users")}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "users"
                                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md shadow-sky-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <span className="text-base">👥</span>
                                        <span>Users</span>
                                    </button>

                                    <button
                                        onClick={() => onSelectTab("analytics")}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "analytics"
                                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md shadow-sky-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <span className="text-base">📊</span>
                                        <span>Analytics</span>
                                    </button>

                                    <button
                                        onClick={() => onSelectTab("settings")}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "settings"
                                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md shadow-sky-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <span className="text-base">⚙️</span>
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => onSelectTab("printers")}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "printers"
                                                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black shadow-md shadow-sky-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <span className="text-base">🖨️</span>
                                        <span>Printer Settings</span>
                                    </button>

                                    <button
                                        onClick={() => navigate("/display-panel")}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer text-left"
                                    >
                                        <span className="text-base">📺</span>
                                        <span>Display Panel</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        {!isCollapsed && (
                            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                MANAGEMENT PANELS
                            </p>
                        )}
                        {filteredItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelectTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                                        isActive
                                            ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20 font-black"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                    } ${isCollapsed ? "justify-center px-0" : "justify-start"}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    {!isCollapsed && item.badge != null && (
                                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}
                                    {isCollapsed && item.badge != null && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* Bottom Actions & User Profile */}
            <div className="p-3 border-t border-slate-800/80 space-y-2">
                {/* Display Panel Quick Link */}
                <button
                    onClick={() => navigate("/display-panel")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer ${
                        isCollapsed ? "justify-center px-0" : "justify-start"
                    }`}
                    title="Open Live TV Display"
                >
                    <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>Live TV Display</span>}
                </button>

                {/* Hardware Kiosk Settings */}
                {userRole !== "MANAGER" && (
                    <button
                        onClick={() => navigate("/printer-settings")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer ${
                            isCollapsed ? "justify-center px-0" : "justify-start"
                        }`}
                        title="Physical Kiosk Hardware"
                    >
                        <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                        {!isCollapsed && <span>Kiosk Hardware</span>}
                    </button>
                )}

                {/* User Info & Logout */}
                <div className={`pt-2 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="truncate pr-2">
                            <p className="text-xs font-black text-white truncate">{adminUser}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{adminCollege}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer shrink-0"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default AdminSidebar;
