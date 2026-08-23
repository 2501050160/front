import React, { useState, useEffect, useRef } from "react";
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
    ChevronDown,
    KeyRound,
    Plus,
    MapPin
} from "lucide-react";
import cloudprintLogo from "../assets/cloudprint_logo.png";
import { useAuth } from "../context/AuthContext";
import { WalletModal } from "./user/sections/WalletModal";

function Navbar({ searchQuery, setSearchQuery, badge, badgeAction }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, walletBalance, logout, refreshWallet } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const profileMenuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        if (showProfileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showProfileMenu]);
    
    const userId = user?.id || localStorage.getItem("userId");
    const userName = user?.name || localStorage.getItem("userName") || "Student User";
    const userEmail = user?.email || localStorage.getItem("userEmail") || "";
    const userCollege = user?.college || localStorage.getItem("userCollege") || "KLU";
    const selectedBlock = localStorage.getItem("selectedBlock") || "";

    useEffect(() => {
        if (userId) {
            refreshWallet();
        }
    }, [userId, refreshWallet]);

    const handleLogout = () => {
        logout();
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
                
                {/* Left: Brand / Active Campus & Block Selector */}
                <div className="flex items-center gap-3">
                    <Link to="/blocks" className="flex items-center gap-2 group cursor-pointer" title="Go to Campus Block Selection">
                        <img src={cloudprintLogo} alt="CloudPrint" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                    </Link>
                    <Link
                        to="/blocks"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400/40 text-[#37E67D] transition-all cursor-pointer group shadow-sm"
                        title="Click to Change Block / Location"
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse shrink-0"></span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            {badge || `${selectedBlock ? selectedBlock : "Select Block"} • ${userCollege}`}
                        </span>
                        <span className="text-[10px] font-black text-cyan-300 group-hover:underline ml-1">
                            ⇄ Change
                        </span>
                    </Link>
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
                    {/* Change Block Quick Button */}
                    <Link
                        to="/blocks"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all cursor-pointer shrink-0 shadow-sm"
                        title="Change Campus Block"
                    >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Change Block</span>
                        <span className="sm:hidden">Block</span>
                    </Link>

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
                        <button
                            type="button"
                            onClick={() => setShowWalletModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-black ml-1 transition-all cursor-pointer shadow-sm hover:scale-105"
                            title="Click to add wallet money or view balance"
                        >
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span>₹{Number(walletBalance || 0).toFixed(2)}</span>
                            <Plus className="w-3.5 h-3.5 text-emerald-400 font-black" />
                        </button>
                    )}

                    {/* Direct Print Release Trigger Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (location.pathname === "/dashboard") {
                                window.dispatchEvent(new CustomEvent('openDirectReleaseModal'));
                            } else {
                                navigate("/dashboard?action=release");
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Direct Print Release</span>
                    </button>

                    {/* Logout Button */}
                    {userId && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-400 text-rose-400 hover:text-white text-xs font-black transition-all cursor-pointer shrink-0 active:scale-95 ml-1"
                            title="Sign Out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    )}
                </nav>
            </div>

            {/* Wallet Top-up Modal */}
            {showWalletModal && (
                <WalletModal
                    userId={userId}
                    currentBalance={walletBalance}
                    onClose={() => setShowWalletModal(false)}
                    onSuccess={(newBal) => {
                        refreshWallet();
                        setShowWalletModal(false);
                    }}
                />
            )}
        </header>
    );
}

export default Navbar;
