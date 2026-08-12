import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
    Printer, 
    Package, 
    Gift, 
    Headphones, 
    Search, 
    LogOut, 
    Wallet,
    Building2,
    ChevronDown
} from "lucide-react";
import cloudprintLogo from "../assets/cloudprint_logo.png";
import { getWalletBalance, clearUserSession } from "../services/auth";

function Navbar({ searchQuery, setSearchQuery, badge }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [walletBalance, setWalletBalance] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Student User";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userCollege = localStorage.getItem("userCollege") || "KLU";

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance).catch(() => {});
        }
    }, [userId]);

    const handleLogout = () => {
        clearUserSession();
        navigate("/");
    };

    const isPathActive = (path) => {
        if (path === "/dashboard?tab=support") {
            return location.pathname === "/dashboard" && location.search.includes("tab=support");
        }
        if (path === "/dashboard") {
            return location.pathname === "/dashboard" && !location.search.includes("tab=support");
        }
        return location.pathname === path;
    };

    const navItems = [
        { label: "Print Dashboard", path: "/dashboard", icon: Printer },
        { label: "My Orders", path: "/my-orders", icon: Package },
        { label: "Coupons & Rewards", path: "/referrals", icon: Gift },
        { label: "Support Desk", path: "/dashboard?tab=support", icon: Headphones },
    ];

    return (
        <header className="w-full bg-slate-950/85 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 px-4 py-3 shadow-xl">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
                
                {/* Left: Brand / Active Campus */}
                <div className="flex items-center gap-3">
                    <Link to="/blocks" className="flex items-center gap-2 group cursor-pointer">
                        <img src={cloudprintLogo} alt="CloudPrint" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                    </Link>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#37E67D]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse"></span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">
                            {badge || `Active Campus • ${userCollege}`}
                        </span>
                    </div>
                </div>

                {/* Center: Search Bar */}
                {setSearchQuery !== undefined ? (
                    <div className="flex items-center flex-1 max-w-md relative mx-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search campus buildings, blocks, or services..."
                            value={searchQuery || ""}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-cyan-100/60 focus:outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 transition-all font-medium"
                        />
                    </div>
                ) : null}

                {/* Right: Navbar Links (Print Dashboard, My Orders, Coupons & Rewards, Support Desk) */}
                <nav className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isPathActive(item.path);
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                                    active
                                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/40"
                                        : "text-slate-200 hover:text-white hover:bg-white/10 border border-white/5"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Wallet Balance Badge */}
                    {userId && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black ml-1">
                            <Wallet className="w-4 h-4" />
                            <span>₹{Number(walletBalance || 0).toFixed(2)}</span>
                        </div>
                    )}

                    {/* User Profile / Logout Dropdown */}
                    {userId && (
                        <div className="relative ml-1">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-extrabold transition-all cursor-pointer"
                            >
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xs font-black">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden md:inline max-w-[100px] truncate">{userName}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2 z-50">
                                    <div className="px-3 py-2 border-b border-white/10">
                                        <p className="text-xs font-black text-white truncate">{userName}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
                                    </div>
                                    <Link
                                        to="/blocks"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all mt-1"
                                    >
                                        <Building2 className="w-4 h-4 text-cyan-400" />
                                        <span>Change Campus Block</span>
                                    </Link>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
