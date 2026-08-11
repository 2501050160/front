import React from "react";
import { useNavigate } from "react-router-dom";
import { 
    Printer, 
    FileText, 
    Gift, 
    Headphones, 
    MapPin, 
    Wallet, 
    LogOut, 
    ChevronLeft, 
    ChevronRight,
    Sparkles,
    CreditCard
} from "lucide-react";
import { clearUserSession } from "../../services/auth";

export function UserSidebar({
    activeTab = "print",
    onSelectTab,
    isCollapsed = false,
    onToggleCollapse,
    walletBalance = 0,
    onOpenWallet,
    blockLocation,
    userName = "Student",
    userEmail = "user@example.com",
    className = ""
}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearUserSession();
        navigate("/login");
    };

    const navItems = [
        { id: "print", label: "Print Studio", icon: Printer },
        { id: "orders", label: "My Orders", icon: FileText },
        { id: "coupons", label: "Rewards & Deals", icon: Gift },
        { id: "support", label: "Help & Support", icon: Headphones },
    ];

    return (
        <aside
            className={`user-sidebar relative flex flex-col justify-between border-r border-slate-800 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 z-40 ${
                isCollapsed ? "w-20" : "w-64"
            } ${className}`}
            style={{
                background: "linear-gradient(180deg, rgba(2, 6, 23, 0.98) 0%, rgba(8, 47, 73, 0.92) 100%)"
            }}
        >
            {/* Top Brand & Location */}
            <div>
                <div className={`p-4 flex items-center border-b border-slate-800/80 ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25 shrink-0">
                                CP
                            </div>
                            <div className="truncate">
                                <h2 className="text-sm font-black tracking-wide text-white">Cloud Print</h2>
                                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Kiosk Terminal</p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25">
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

                {/* Location Pill */}
                {!isCollapsed && (
                    <div className="mx-3 mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                            <span>Selected Kiosk</span>
                            <button
                                onClick={() => navigate("/blocks")}
                                className="text-cyan-400 hover:underline cursor-pointer"
                            >
                                Change
                            </button>
                        </div>
                        <p className="text-xs font-black text-white flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{blockLocation || "Select Campus Block"}</span>
                        </p>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav className="p-3 space-y-1.5 mt-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelectTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-600/20 font-black"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                } ${isCollapsed ? "justify-center px-0" : "justify-start"}`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Wallet & Profile */}
            <div className="p-3 border-t border-slate-800/80 space-y-3">
                {/* Wallet Balance Card */}
                {!isCollapsed ? (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase text-emerald-400">
                            <span className="flex items-center gap-1">
                                <Wallet className="w-3.5 h-3.5" />
                                My Wallet
                            </span>
                            <span className="text-white font-black text-sm">₹{Number(walletBalance).toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onOpenWallet}
                            className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                        >
                            + Top Up Balance
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onOpenWallet}
                        className="w-full p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center cursor-pointer"
                        title={`Wallet: ₹${Number(walletBalance).toFixed(2)}`}
                    >
                        <Wallet className="w-5 h-5" />
                    </button>
                )}

                {/* Profile & Logout */}
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} pt-1`}>
                    {!isCollapsed && (
                        <div className="truncate pr-2">
                            <p className="text-xs font-black text-white truncate">{userName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
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

export default UserSidebar;
