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
            {/* Top Row: Brand Mark & Direct Exit Button */}
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 w-full">
                {/* Left Side: Hamburger (if sidebar exists) + Logo */}
                <div className="flex items-center gap-3 sm:gap-4">
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
                    <img src={cloudprintLogo} alt="CloudPrint" className="h-8 sm:h-9 object-contain shrink-0" />
                </div>

                {/* Right Controls: Direct Red Exit/Logout Button */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => {
                            clearUserSession();
                            localStorage.clear();
                            navigate("/login");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs transition-all shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 border border-rose-400 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                        title="Sign Out / Exit Session"
                    >
                        <span className="text-sm">🚪</span>
                        <span>Exit</span>
                    </button>
                </div>
            </div>
        </motion.header>
    );
}

export default Navbar;
