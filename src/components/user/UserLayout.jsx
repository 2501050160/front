import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, FileText, Gift, Headphones } from "lucide-react";
import UserSidebar from "./UserSidebar";
import UserHeader from "./UserHeader";
import WalletModal from "./sections/WalletModal";

export function UserLayout({
    children,
    activeTab = "print",
    onSelectTab,
    walletBalance = 0,
    onWalletUpdated,
    blockLocation,
    systemStatus = { databaseConnected: true, agentOnline: true, printerConfigured: true }
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem("userSidebarCollapsed") === "true";
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Student";
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";

    useEffect(() => {
        if (!userId) {
            navigate("/login");
        }
    }, [userId, navigate]);

    const handleToggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("userSidebarCollapsed", String(next));
    };

    const handleSelectTab = (tabId) => {
        setIsMobileOpen(false);
        if (onSelectTab) {
            onSelectTab(tabId);
        } else {
            navigate(`/dashboard?tab=${tabId}`);
        }
    };

    const mobileNavItems = [
        { id: "print", label: "Print", icon: Printer },
        { id: "orders", label: "Orders", icon: FileText },
        { id: "coupons", label: "Rewards", icon: Gift },
        { id: "support", label: "Support", icon: Headphones },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-white">
            {/* Desktop Sticky Left Navigation Bar */}
            <div className="hidden md:block shrink-0 sticky top-0 h-screen z-40">
                <UserSidebar
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                    walletBalance={walletBalance}
                    onOpenWallet={() => setShowWalletModal(true)}
                    blockLocation={blockLocation}
                    userName={userName}
                    userEmail={userEmail}
                    className="h-full"
                />
            </div>

            {/* Mobile Slide-Out Drawer Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl"
                        >
                            <UserSidebar
                                activeTab={activeTab}
                                onSelectTab={handleSelectTab}
                                isCollapsed={false}
                                onToggleCollapse={() => setIsMobileOpen(false)}
                                walletBalance={walletBalance}
                                onOpenWallet={() => {
                                    setIsMobileOpen(false);
                                    setShowWalletModal(true);
                                }}
                                blockLocation={blockLocation}
                                userName={userName}
                                userEmail={userEmail}
                                className="h-full w-full"
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-8">
                <UserHeader
                    blockLocation={blockLocation}
                    walletBalance={walletBalance}
                    onOpenWallet={() => setShowWalletModal(true)}
                    onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
                    userName={userName}
                    userEmail={userEmail}
                    systemStatus={systemStatus}
                />

                <main className="flex-1 p-4 md:p-8 space-y-6 relative z-10 max-w-[1400px] w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-2 z-40 flex items-center justify-around">
                {mobileNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                isActive
                                    ? "text-cyan-400 font-black bg-cyan-500/10"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Wallet Recharge Modal */}
            {showWalletModal && (
                <WalletModal
                    userId={userId}
                    currentBalance={walletBalance}
                    onClose={() => setShowWalletModal(false)}
                    onSuccess={(newBal) => {
                        if (onWalletUpdated) onWalletUpdated(newBal);
                        setShowWalletModal(false);
                    }}
                />
            )}
        </div>
    );
}

export default UserLayout;
