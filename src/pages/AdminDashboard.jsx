import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import CustomModal from "../components/CustomModal";
import api, { getPdfDownloadUrl } from "../services/api";

// Modular Admin Sections
import QueueSection from "../components/admin/sections/QueueSection";
import AnalyticsSection from "../components/admin/sections/AnalyticsSection";
import PricingCouponsSection from "../components/admin/sections/PricingCouponsSection";
import BlockManagementSection from "../components/admin/sections/BlockManagementSection";
import PrinterManagementSection from "../components/admin/sections/PrinterManagementSection";
import CollegeManagementSection from "../components/admin/sections/CollegeManagementSection";
import UserManagementSection from "../components/admin/sections/UserManagementSection";
import WhatsAppOrdersSection from "../components/admin/sections/WhatsAppOrdersSection";
import SupportTicketsSection from "../components/admin/sections/SupportTicketsSection";
import FrontendManagerSection from "../components/admin/sections/FrontendManagerSection";
import SystemConfigSection from "../components/admin/sections/SystemConfigSection";
import StaffManagementSection from "../components/admin/sections/StaffManagementSection";
import NotificationsSection from "../components/admin/sections/NotificationsSection";

export function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab") || "queue";
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    // Sync tab with URL query parameter
    useEffect(() => {
        if (searchParams.get("tab") && searchParams.get("tab") !== activeTab) {
            setActiveTab(searchParams.get("tab"));
        }
    }, [searchParams]);

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    // State collections
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");
    const [selectedCollege, setSelectedCollege] = useState("ALL");
    const [blocks, setBlocks] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [printerPapers, setPrinterPapers] = useState({});
    const [users, setUsers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [sections, setSections] = useState([]);
    const [popups, setPopups] = useState([]);
    const [subAdmins, setSubAdmins] = useState([]);
    const [managerLogs, setManagerLogs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [collegeConfigs, setCollegeConfigs] = useState([]);
    const [suspendedColleges, setSuspendedColleges] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pricing states
    const [selectedPricingBlock, setSelectedPricingBlock] = useState("C Block");
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const [duplexPrice, setDuplexPrice] = useState(2);

    const [systemSettings, setSystemSettings] = useState({
        referralEnabled: true,
        referrerAmount: 10.0,
        refereeAmount: 5.0
    });

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm) => {
        setModalConfig({ isOpen: true, title, message, type: "confirm", onConfirm });
    };

    // Data Fetching Functions
    const fetchOrders = async () => {
        try {
            const res = await api.get("/pdf/orders");
            setOrders(res.data || []);
        } catch (e) {
            console.error("Fetch orders failed:", e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get("/admin/stats", { params: { period: revenuePeriod } });
            setStats(res.data || {});
        } catch (e) {
            console.error("Fetch stats failed:", e);
        }
    };

    const fetchBlocks = async () => {
        try {
            const res = await api.get("/admin/blocks/all");
            setBlocks(res.data || []);
            if (res.data?.length > 0 && !selectedPricingBlock) {
                setSelectedPricingBlock(res.data[0].name);
            }
        } catch (e) {
            console.error("Fetch blocks failed:", e);
        }
    };

    const fetchPrices = async (blockName = selectedPricingBlock) => {
        if (!blockName) return;
        try {
            const res = await api.get("/pricing/all", { params: { blockLocation: blockName } });
            const p = res.data;
            if (p) {
                setBwPrice(p.bwPrice != null ? p.bwPrice : 2);
                setColorPrice(p.colorPrice != null ? p.colorPrice : 5);
                setDuplexPrice(p.duplexPrice != null ? p.duplexPrice : 2);
            }
        } catch (e) {
            console.error("Fetch prices failed:", e);
        }
    };

    const fetchPrinters = async () => {
        try {
            const res = await api.get("/printer/all");
            setPrinters(res.data || []);
        } catch (e) {
            console.error("Fetch printers failed:", e);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data || []);
        } catch (e) {
            console.error("Fetch users failed:", e);
        }
    };

    const fetchCoupons = async () => {
        try {
            const res = await api.get("/coupon/all");
            setCoupons(res.data || []);
        } catch (e) {
            console.error("Fetch coupons failed:", e);
        }
    };

    const fetchRewards = async () => {
        try {
            const res = await api.get("/rewards/all");
            setRewards(res.data || []);
        } catch (e) {
            console.error("Fetch rewards failed:", e);
        }
    };

    const fetchSupportTickets = async () => {
        try {
            const res = await api.get("/support/all");
            setSupportTickets(res.data || []);
        } catch (e) {
            console.error("Fetch tickets failed:", e);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get("/sections/active");
            setSections(res.data || []);
        } catch (e) {
            console.error("Fetch sections failed:", e);
        }
    };

    const fetchPopups = async () => {
        try {
            const res = await api.get("/popups/all");
            setPopups(res.data || []);
        } catch (e) {
            console.error("Fetch popups failed:", e);
        }
    };

    const fetchSubAdmins = async () => {
        try {
            const res = await api.get("/admin/subadmins");
            setSubAdmins(res.data || []);
        } catch (e) {
            console.error("Fetch subadmins failed:", e);
        }
    };

    const fetchManagerLogs = async () => {
        try {
            const res = await api.get("/admin/logs/all");
            setManagerLogs(res.data || []);
        } catch (e) {
            console.error("Fetch logs failed:", e);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/all");
            setNotifications(res.data || []);
        } catch (e) {
            console.error("Fetch notifications failed:", e);
        }
    };

    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchOrders(),
            fetchStats(),
            fetchBlocks(),
            fetchPrinters(),
            fetchUsers(),
            fetchCoupons(),
            fetchRewards()
        ]);
        setIsRefreshing(false);
    };

    // Initial mount & live polling (every 3 seconds)
    useEffect(() => {
        refreshAll();
        const interval = setInterval(() => {
            fetchOrders();
            fetchStats();
            fetchPrinters();
        }, 3000);
        return () => clearInterval(interval);
    }, [revenuePeriod]);

    // Role-filtered slices
    const userRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
    const adminUser = localStorage.getItem("adminUser") || "Admin";
    const adminCollege = localStorage.getItem("adminCollege") || "KLU";

    const filteredBlocks = blocks.filter(b => {
        if ((userRole === "SUB_ADMIN" || userRole === "MANAGER") && adminUser !== "admin") {
            return (b.college || "KLU").toUpperCase() === adminCollege.toUpperCase();
        }
        if (selectedCollege !== "ALL") {
            return (b.college || "KLU").toUpperCase() === selectedCollege.toUpperCase();
        }
        return true;
    });

    const filteredOrders = orders.filter(o => {
        if ((userRole === "SUB_ADMIN" || userRole === "MANAGER") && adminUser !== "admin") {
            const b = blocks.find(x => x.name === o.blockLocation);
            return b && (b.college || "KLU").toUpperCase() === adminCollege.toUpperCase();
        }
        if (selectedCollege !== "ALL") {
            const b = blocks.find(x => x.name === o.blockLocation);
            return b && (b.college || "KLU").toUpperCase() === selectedCollege.toUpperCase();
        }
        return true;
    });

    // Action handlers
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.post(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
            fetchOrders();
            fetchStats();
            showAlert("Success", `Order #${orderId} set to ${newStatus}`, "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to update order status", "error");
        }
    };

    const handleDeleteOrder = (orderId) => {
        showConfirm("Delete Order", `Permanently cancel and remove Order #${orderId}?`, async () => {
            try {
                await api.delete(`/pdf/delete/${orderId}`);
                fetchOrders();
                showAlert("Deleted", "Order removed from queue", "success");
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete order", "error");
            }
        });
    };

    const handleSavePrices = async () => {
        try {
            await api.post("/pricing/update", null, {
                params: {
                    printType: "BW",
                    pricePerPage: bwPrice,
                    blockLocation: selectedPricingBlock
                }
            });
            await api.post("/pricing/update", null, {
                params: {
                    printType: "COLOR",
                    pricePerPage: colorPrice,
                    blockLocation: selectedPricingBlock
                }
            });
            await api.post("/pricing/update", null, {
                params: {
                    printType: "DUPLEX",
                    pricePerPage: duplexPrice,
                    blockLocation: selectedPricingBlock
                }
            });
            showAlert("Success", `Updated prices for ${selectedPricingBlock}`, "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to update prices", "error");
        }
    };

    const handleCreateCoupon = async (data) => {
        try {
            await api.post("/coupon/create", data);
            showAlert("Success", `Coupon ${data.couponCode} created`, "success");
            fetchCoupons();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to create coupon", "error");
        }
    };

    const handleDeleteCoupon = async (id) => {
        showConfirm("Delete Coupon", "Remove this coupon permanently?", async () => {
            try {
                await api.post("/coupon/delete", null, { params: { id } });
                showAlert("Deleted", "Coupon removed", "success");
                fetchCoupons();
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete coupon", "error");
            }
        });
    };

    const handleCreateReward = async (data) => {
        try {
            await api.post("/rewards/create", data);
            showAlert("Success", "Reward voucher created", "success");
            fetchRewards();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to create reward voucher", "error");
        }
    };

    const handleAddBlock = async (data) => {
        try {
            await api.post("/blocks/add", null, { params: data });
            showAlert("Success", `Block ${data.name} added`, "success");
            fetchBlocks();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to add block", "error");
        }
    };

    const handleRenameBlock = async (id, currentName) => {
        const newName = window.prompt("Enter new name for block:", currentName);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/blocks/rename/${id}`, null, { params: { newName: newName.trim() } });
            showAlert("Success", "Block renamed", "success");
            fetchBlocks();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to rename block", "error");
        }
    };

    const handleDeleteBlock = (id) => {
        showConfirm("Delete Block", "Delete this block location?", async () => {
            try {
                await api.delete(`/blocks/delete/${id}`);
                showAlert("Success", "Block deleted", "success");
                fetchBlocks();
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete block", "error");
            }
        });
    };

    const handleRegenerateBlockKey = async (id) => {
        showConfirm("Regenerate Key", "Regenerate Server API Key for this block?", async () => {
            try {
                await api.post(`/blocks/generate-key/${id}`);
                showAlert("Success", "New Server API Key generated", "success");
                fetchBlocks();
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to regenerate key", "error");
            }
        });
    };

    const handleDownloadConfig = (block) => {
        if (!block.serverApiKey) {
            showAlert("Unset Key", "Please generate an API Key for this block first.", "warning");
            return;
        }
        const blockPrinters = printers.filter(p => p.blockLocation === block.name);
        const configData = {
            blockLocation: block.name,
            apiKey: block.serverApiKey,
            college: block.college || "KLU",
            printers: blockPrinters.map(p => ({
                name: p.printerName,
                ip: p.ipAddress,
                color: p.colourSupported
            }))
        };
        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `config_${block.name.toLowerCase().replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddPrinter = async (data) => {
        try {
            await api.post("/printer/add", data);
            showAlert("Success", `Printer ${data.printerName} registered`, "success");
            fetchPrinters();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to register printer", "error");
        }
    };

    const handleDeletePrinter = (id) => {
        showConfirm("Delete Printer", "Delete this printer mapping?", async () => {
            try {
                await api.delete(`/printer/delete/${id}`);
                showAlert("Deleted", "Printer deleted", "success");
                fetchPrinters();
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete printer", "error");
            }
        });
    };

    const handleToggleMaintenance = async (id, currentMaintenance) => {
        try {
            await api.post("/printer/toggle-maintenance", null, { params: { id, maintenance: !currentMaintenance } });
            fetchPrinters();
            showAlert("Success", "Maintenance mode toggled", "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to toggle maintenance", "error");
        }
    };

    const handleUpdatePaperCount = async (blockLocation, count) => {
        try {
            await api.post("/printer/paper/update", null, { params: { blockLocation, paperCount: count } });
            setPrinterPapers(prev => ({ ...prev, [blockLocation]: count }));
            showAlert("Success", `Paper count updated to ${count} sheets`, "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to update paper count", "error");
        }
    };

    const exportToCSV = (data, filename, headers) => {
        if (!data || !data.length) {
            showAlert("No Data", "There is no data to export.", "warning");
            return;
        }
        const csvRows = [];
        csvRows.push(headers.join(","));
        for (const row of data) {
            const values = headers.map(header => {
                let val = "";
                if (header === "Order ID" || header === "ID") val = row.orderId || row.id || "";
                else if (header === "Date & Time") val = row.uploadTime || row.createdAt || "";
                else if (header === "Location") val = row.blockLocation || "";
                else if (header === "Customer") val = row.customerName || row.name || "";
                else if (header === "Price") val = row.price != null ? row.price : "";
                else if (header === "Status") val = row.status || "";
                else val = row[header] != null ? row[header] : "";
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(","));
        }
        const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            orderCount={filteredOrders.filter(o => o.status === "QUEUE").length}
            selectedCollege={selectedCollege}
            onChangeCollege={setSelectedCollege}
            onRefresh={refreshAll}
            isRefreshing={isRefreshing}
        >
            {/* 1. Live Queue */}
            {activeTab === "queue" && (
                <QueueSection
                    orders={filteredOrders}
                    blocks={filteredBlocks}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                    onRefresh={fetchOrders}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    onExportCSV={exportToCSV}
                />
            )}

            {/* 2. Analytics */}
            {activeTab === "analytics" && (
                <AnalyticsSection
                    orders={filteredOrders}
                    stats={stats}
                    revenuePeriod={revenuePeriod}
                    onPeriodChange={setRevenuePeriod}
                    onExportCSV={exportToCSV}
                />
            )}

            {/* 3. Pricing & Coupons */}
            {activeTab === "settings" && (
                <PricingCouponsSection
                    blocks={filteredBlocks}
                    selectedBlock={selectedPricingBlock}
                    onSelectBlock={(b) => {
                        setSelectedPricingBlock(b);
                        fetchPrices(b);
                    }}
                    bwPrice={bwPrice}
                    setBwPrice={setBwPrice}
                    colorPrice={colorPrice}
                    setColorPrice={setColorPrice}
                    duplexPrice={duplexPrice}
                    setDuplexPrice={setDuplexPrice}
                    onSavePrices={handleSavePrices}
                    coupons={coupons}
                    onDeleteCoupon={handleDeleteCoupon}
                    onCreateCoupon={handleCreateCoupon}
                    rewards={rewards}
                    onCreateReward={handleCreateReward}
                    systemSettings={systemSettings}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 4. Blocks */}
            {activeTab === "blocks" && (
                <BlockManagementSection
                    blocks={filteredBlocks}
                    printers={printers}
                    onAddBlock={handleAddBlock}
                    onRenameBlock={handleRenameBlock}
                    onDeleteBlock={handleDeleteBlock}
                    onRegenerateKey={handleRegenerateBlockKey}
                    onDownloadConfig={handleDownloadConfig}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 5. Printers */}
            {activeTab === "printers" && (
                <PrinterManagementSection
                    printers={printers}
                    blocks={filteredBlocks}
                    printerPapers={printerPapers}
                    onAddPrinter={handleAddPrinter}
                    onDeletePrinter={handleDeletePrinter}
                    onToggleMaintenance={handleToggleMaintenance}
                    onUpdatePaperCount={handleUpdatePaperCount}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 6. Colleges */}
            {activeTab === "colleges" && (
                <CollegeManagementSection
                    blocks={blocks}
                    suspendedColleges={suspendedColleges}
                    onToggleSuspension={(col) => showAlert("Updated", `Suspension updated for ${col}`, "info")}
                    collegeConfigs={collegeConfigs}
                    showAlert={showAlert}
                />
            )}

            {/* 7. Users */}
            {activeTab === "users" && (
                <UserManagementSection
                    users={users}
                    orders={orders}
                    onFetchUsers={fetchUsers}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    onExportCSV={exportToCSV}
                />
            )}

            {/* 8. WhatsApp Orders */}
            {activeTab === "whatsapp" && (
                <WhatsAppOrdersSection
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 9. Support Tickets */}
            {activeTab === "support" && (
                <SupportTicketsSection
                    tickets={supportTickets}
                    onFetchTickets={fetchSupportTickets}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 10. Frontend Manager */}
            {activeTab === "frontend" && (
                <FrontendManagerSection
                    sections={sections}
                    popups={popups}
                    systemSettings={systemSettings}
                    onFetchSections={fetchSections}
                    onFetchPopups={fetchPopups}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 11. System Config */}
            {activeTab === "system" && (
                <SystemConfigSection
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 12. Staff Management */}
            {activeTab === "subadmins" && (
                <StaffManagementSection
                    subAdmins={subAdmins}
                    managerLogs={managerLogs}
                    onFetchSubAdmins={fetchSubAdmins}
                    onFetchLogs={fetchManagerLogs}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* 13. Notifications */}
            {activeTab === "notifications" && (
                <NotificationsSection
                    notifications={notifications}
                    onFetchNotifications={fetchNotifications}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            {/* Reusable Alert / Confirm Dialog */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </AdminLayout>
    );
}

export default AdminDashboard;
