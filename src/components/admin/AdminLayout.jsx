import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export function AdminLayout({
    children,
    activeTab = "queue",
    onSelectTab,
    orderCount = 0,
    title = "Admin Operations",
    subtitle = "Control Panel",
    selectedCollege = "ALL",
    onChangeCollege,
    colleges = ["ALL", "KLU", "VNR", "CBIT"],
    onRefresh,
    isRefreshing = false
}) {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem("adminSidebarCollapsed") === "true";
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const userRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
    const adminUser = localStorage.getItem("adminUser") || "Admin";
    const adminCollege = localStorage.getItem("adminCollege") || "KLU";

    useEffect(() => {
        const adminId = localStorage.getItem("adminId");
        if (!adminId) {
            navigate("/admin-login");
        }
    }, [navigate]);

    const handleToggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("adminSidebarCollapsed", String(next));
    };

    const handleSelectTab = (tabId) => {
        setIsMobileOpen(false);
        if (onSelectTab) {
            onSelectTab(tabId);
        } else {
            navigate(`/admin?tab=${tabId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-white">
            {/* Desktop Sticky Left Navigation Bar */}
            <div className="hidden md:block shrink-0 sticky top-0 h-screen z-40">
                <AdminSidebar
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                    orderCount={orderCount}
                    userRole={userRole}
                    adminUser={adminUser}
                    adminCollege={adminCollege}
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
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl"
                        >
                            <AdminSidebar
                                activeTab={activeTab}
                                onSelectTab={handleSelectTab}
                                isCollapsed={false}
                                onToggleCollapse={() => setIsMobileOpen(false)}
                                orderCount={orderCount}
                                userRole={userRole}
                                adminUser={adminUser}
                                adminCollege={adminCollege}
                                className="h-full w-full"
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
                <AdminHeader
                    title={title}
                    subtitle={subtitle}
                    onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
                    selectedCollege={selectedCollege}
                    onChangeCollege={onChangeCollege}
                    colleges={colleges}
                    userRole={userRole}
                    adminUser={adminUser}
                    adminCollege={adminCollege}
                    onRefresh={onRefresh}
                    isRefreshing={isRefreshing}
                />

                <main className="flex-1 p-4 md:p-8 space-y-6 relative z-10 max-w-[1600px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
