import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { getPdfDownloadUrl } from "../services/api";
import CustomModal from "../components/CustomModal";
import Navbar from "../components/Navbar";

function AdminDashboard() {
    const navigate = useNavigate();

    const [coupons, setCoupons] = useState([]);
    const [allOrders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");
    const [selectedCollegeFilter, setSelectedCollegeFilter] = useState("ALL");
    const [orderSortDir, setOrderSortDir] = useState("desc");

    const [bwPrice, setBwPrice] = useState(0);
    const [colorPrice, setColorPrice] = useState(0);
    const [blackRedPrice, setBlackRedPrice] = useState(15.0);

    const [couponCode, setCouponCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState(1);
    const [couponUnlocked, setCouponUnlocked] = useState(false);
    const [managerCouponSecretInput, setManagerCouponSecretInput] = useState("");

    const [allUsers, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCoupons, setSelectedCoupons] = useState([]);
    const [allSupportTickets, setSupportTickets] = useState([]);
    const [selectedPricingBlock, setSelectedPricingBlock] = useState("C Block");
    const [activeTab, setActiveTab] = useState("queue");

    // Dynamic settings & blocks
    const [allBlocks, setBlocks] = useState([]);
    const [newBlockName, setNewBlockName] = useState("");
    const [newBlockCollege, setNewBlockCollege] = useState("KLU");
    const [allPrinters, setPrinters] = useState([]);
    const [printerPapers, setPrinterPapers] = useState({});
    
    // New printer states
    const [newPrinterName, setNewPrinterName] = useState("");
    const [newPrinterIp, setNewPrinterIp] = useState("");
    const [newPrinterBlock, setNewPrinterBlock] = useState("");
    const [newPrinterColor, setNewPrinterColor] = useState(false);
    const [newPrinterActive, setNewPrinterActive] = useState(true);
    const [newPrinterMaintenance, setNewPrinterMaintenance] = useState(false);
    const [newPrinterQrScan, setNewPrinterQrScan] = useState(false);
    const [newPrinterOtp, setNewPrinterOtp] = useState(true);
    const [sections, setSections] = useState([]);
    const [systemSettings, setSystemSettings] = useState({
        referralEnabled: true,
        referrerAmount: 10.0,
        refereeAmount: 5.0,
        popupEnabled: true,
        popupMessage: "",
        adEnabled: true,
        adText: "",
        generalPopupEnabled: false,
        generalPopupMessage: "",
        offpeakDiscountPercent: 15.0,
        offpeakStartHour: 21.0,
        offpeakEndHour: 7.0,
        offpeakMorningStart: 7.0,
        offpeakMorningEnd: 9.0
    });

    const [offpeakCollege, setOffpeakCollege] = useState("KLU");
    const [collegeOffpeakSettings, setCollegeOffpeakSettings] = useState({
        offpeakEnabled: true,
        offpeakDiscountPercent: 15.0,
        offpeakStartHour: 21.0,
        offpeakEndHour: 7.0,
        offpeakMorningStart: 7.0,
        offpeakMorningEnd: 9.0
    });

    const [userCollegeFilter, setUserCollegeFilter] = useState("ALL");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [blockCollegeFilter, setBlockCollegeFilter] = useState("ALL");

    // Rewards & Voucher creator states
    const [rewards, setRewards] = useState([]);
    const [rewardTitle, setRewardTitle] = useState("");
    const [rewardDesc, setRewardDesc] = useState("");
    const [rewardAmt, setRewardAmt] = useState("");
    const [rewardCode, setRewardCode] = useState("");
    const [rewardMaxClaims, setRewardMaxClaims] = useState(100);
    const [creatingReward, setCreatingReward] = useState(false);

    // SQL Console states
    const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users;");
    const [sqlResult, setSqlResult] = useState(null);
    const [sqlError, setSqlError] = useState("");
    const [sqlExecuting, setSqlExecuting] = useState(false);

    // Section Creator States (sections state already declared above)
    const [secTitle, setSecTitle] = useState("");
    const [secType, setSecType] = useState("ADVERTISING");
    const [secContent, setSecContent] = useState("");
    const [secRedirect, setSecRedirect] = useState("");
    const [secOrder, setSecOrder] = useState(1);
    const [secActive, setSecActive] = useState(true);

    const [suspendedColleges, setSuspendedColleges] = useState("");
    
    // College Config State
    const [collegeConfigs, setCollegeConfigs] = useState([]);
    const [paymentConfigModal, setPaymentConfigModal] = useState(null);
    const [configKeyId, setConfigKeyId] = useState("");
    const [configKeySecret, setConfigKeySecret] = useState("");

    // Custom Popups States
    const [popups, setPopups] = useState([]);
    const [popTitle, setPopTitle] = useState("");
    const [popMessage, setPopMessage] = useState("");
    const [popTarget, setPopTarget] = useState("ALL");
    const [popDismissible, setPopDismissible] = useState(true);
    const [popActive, setPopActive] = useState(true);

    const [subAdmins, setSubAdmins] = useState([]);
    const [newSubAdminUsername, setNewSubAdminUsername] = useState("");
    const [newSubAdminPassword, setNewSubAdminPassword] = useState("");
    const [newSubAdminCollege, setNewSubAdminCollege] = useState("KLU");
    const [newAdminRole, setNewAdminRole] = useState(localStorage.getItem("adminRole") === "MAIN_ADMIN" ? "SUB_ADMIN" : "MANAGER");
    const [newManagerSecret, setNewManagerSecret] = useState("");
    const [isCreatingSubAdmin, setIsCreatingSubAdmin] = useState(false);
    const [managerLogs, setManagerLogs] = useState([]);

    // Notifications management states
    const [notifications, setNotifications] = useState([]);
    const [notifTitle, setNotifTitle] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [notifCollege, setNotifCollege] = useState("ALL");
    const [notifType, setNotifType] = useState("INFO");

    // Custom Modal configs
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    };

    const showConfirm = (title, message, onConfirm) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type: "confirm",
            onConfirm
        });
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
                if (header === "User ID" || header === "ID") val = row.id != null ? row.id : "";
                else if (header === "Name") val = row.name != null ? row.name : "";
                else if (header === "Username" || header === "Email") val = row.email != null ? row.email : "";
                else if (header === "College") val = row.college || "KLU";
                else if (header === "Orders") val = allOrders.filter(o => o.email === row.email).length;
                else if (header === "Referral Code") val = row.referralCode != null ? row.referralCode : "";
                else if (header === "Wallet Balance") val = row.walletBalance != null ? row.walletBalance.toFixed(2) : "0.00";
                else if (header === "Status") val = row.blocked ? "BLOCKED" : "ACTIVE";

                // For Orders
                else if (header === "Order ID") val = row.orderId != null ? row.orderId : "";
                else if (header === "Date & Time") {
                    val = row.uploadTime
                        ? new Date(row.uploadTime).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })
                        : "—";
                }
                else if (header === "Location") val = row.blockLocation != null ? row.blockLocation : "";
                else if (header === "Customer") val = row.customerName != null ? row.customerName : "";
                else if (header === "Pages") val = row.selectedPages != null ? row.selectedPages : "";
                else if (header === "Copies") val = row.copies != null ? row.copies : "";
                else if (header === "Price") val = row.price != null ? row.price : "";
                else if (header === "Payment") val = row.razorpayPaymentId != null ? row.razorpayPaymentId : "UNPAID";
                else if (header === "Order Status") val = row.status != null ? row.status : "";

                // For Coupons
                else if (header === "Code") val = row.couponCode != null ? row.couponCode : "";
                else if (header === "Discount") val = row.discountPercentage != null ? row.discountPercentage + "%" : "";
                else if (header === "Expiry") val = row.expiryDate != null ? row.expiryDate : "";
                else if (header === "Used") val = `${row.usedCount != null ? row.usedCount : 0} / ${row.maxUses != null ? row.maxUses : 0}`;

                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkDeleteUsers = () => {
        if (selectedUsers.length === 0) return;
        const toDeleteCount = selectedUsers.length;
        showConfirm(
            "Bulk Delete Users",
            `Are you sure you want to delete the ${toDeleteCount} selected users permanently? All their wallet and order history will be deleted.`,
            async () => {
                try {
                    for (const userId of selectedUsers) {
                        await api.delete("/admin/users/delete", { params: { id: userId } });
                    }
                    setSelectedUsers([]);
                    fetchUsers();
                    showAlert("Success", `${toDeleteCount} users deleted successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk delete:", error);
                    showAlert("Error", "Failed to delete all selected users", "error");
                }
            }
        );
    };

    const handleBulkBlockUsers = async (block) => {
        if (selectedUsers.length === 0) return;
        showConfirm(
            block ? "Bulk Block Users" : "Bulk Unblock Users",
            `Are you sure you want to ${block ? "block" : "unblock"} the ${selectedUsers.length} selected users?`,
            async () => {
                try {
                    for (const userId of selectedUsers) {
                        const user = users.find(u => u.id === userId);
                        if (user && user.blocked !== block) {
                            await api.post("/admin/users/toggle-block", null, { params: { id: userId } });
                        }
                    }
                    setSelectedUsers([]);
                    fetchUsers();
                    showAlert("Success", `Selected users updated successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk block toggle:", error);
                    showAlert("Error", `Failed to update selected users`, "error");
                }
            }
        );
    };

    const handleBulkDeleteCoupons = () => {
        if (selectedCoupons.length === 0) return;
        const toDeleteCount = selectedCoupons.length;
        showConfirm(
            "Bulk Delete Coupons",
            `Are you sure you want to delete the ${toDeleteCount} selected coupons permanently?`,
            async () => {
                try {
                    for (const couponId of selectedCoupons) {
                        await api.post("/coupon/delete", null, { params: { id: couponId } });
                    }
                    setSelectedCoupons([]);
                    fetchCoupons();
                    showAlert("Success", `${toDeleteCount} coupons deleted successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk coupon delete:", error);
                    showAlert("Error", "Failed to delete all selected coupons", "error");
                }
            }
        );
    };


    useEffect(() => {
        const adminId = localStorage.getItem("adminId");
        if (!adminId) {
            navigate("/admin-login");
            return;
        }
        
        fetchCoupons();
        fetchOrders();
        fetchStats();
        fetchPrices(selectedPricingBlock);
        fetchBlocks();
        fetchPrinters();

        const interval = setInterval(() => {
            fetchOrders();
            fetchStats();
            fetchPrinters();
        }, 3000);

        return () => clearInterval(interval);
    }, [revenuePeriod]);

    useEffect(() => {
        fetchStats();
    }, [revenuePeriod]);

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        } else if (activeTab === "support") {
            fetchSupportTickets();
        } else if (activeTab === "settings") {
            fetchPrices(selectedPricingBlock);
            fetchCoupons();
            fetchBlocks();
            fetchRewards();
            fetchSystemSettings();
        } else if (activeTab === "blocks") {
            fetchBlocks();
        } else if (activeTab === "colleges") {
            fetchBlocks();
            fetchSuspendedColleges();
            fetchCollegeConfigs();
        } else if (activeTab === "frontend") {
            fetchSystemSettings();
            fetchSections();
            fetchPopups();
        } else if (activeTab === "system") {
            fetchSystemSettings();
            
            const currentRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
            const currentCollege = localStorage.getItem("adminCollege") || "KLU";
            const isSubAdmin = currentRole === "SUB_ADMIN" && localStorage.getItem("adminUser") !== "admin";
            
            const initialOffpeakCollege = isSubAdmin ? currentCollege : "KLU";
            setOffpeakCollege(initialOffpeakCollege);
            fetchCollegeOffpeakSettings(initialOffpeakCollege);
            
            fetchBlocks();
            fetchPrinters();
        } else if (activeTab === "rewards") {
            // rewards moved to settings tab
        } else if (activeTab === "subadmins") {
            fetchSubAdmins();
            fetchBlocks();
        } else if (activeTab === "notifications") {
            fetchNotifications();
        }
    }, [activeTab]);

    const deleteCoupon = async (id) => {
        try {
            await api.post("/coupon/delete", null, {
                params: { id }
            });
            fetchCoupons();
            showAlert("Deleted", "Coupon Deleted Successfully", "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to delete coupon", "error");
        }
    };

    const unlockManagerCoupons = async () => {
        try {
            const adminId = localStorage.getItem("adminId");
            const response = await api.post("/admin/verify-secret", null, {
                params: {
                    adminId,
                    secret: managerCouponSecretInput
                }
            });
            if (response.data.success) {
                setCouponUnlocked(true);
                showAlert("Unlocked", "Coupons section unlocked", "success");
            } else {
                showAlert("Error", "Incorrect secret key", "error");
            }
        } catch (err) {
            showAlert("Error", "Incorrect secret key or error verifying", "error");
        }
    };

    const getPagesCount = (order) => {
        if (!order.selectedPages || order.selectedPages.toUpperCase() === "ALL") {
            return order.totalPages || 0;
        }
        const cleaned = order.selectedPages.split(',').map(x => x.trim()).filter(Boolean);
        return cleaned.length || order.totalPages || 0;
    };

    const showPagesDetails = (order) => {
        const count = getPagesCount(order);
        const details = order.selectedPages && order.selectedPages.toUpperCase() !== "ALL" 
            ? order.selectedPages.replace(/^,/, "")
            : `All pages (1 - ${order.totalPages || count})`;
        showAlert(
            "Selected Pages Details",
            `Total Pages to Print: ${count}\n\nPage numbers: ${details}`,
            "info"
        );
    };

    const fetchCoupons = async () => {
        try {
            const response = await api.get("/coupon/all");
            setCoupons(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/orders");
            setOrders(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/pdf/stats", {
                params: { period: revenuePeriod }
            });
            setStats(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPrices = async (block = selectedPricingBlock) => {
        try {
            const response = await api.get("/pricing/all", {
                params: { blockLocation: block }
            });
            let bwVal = 2.0;
            let colorVal = 5.0;
            let blackRedVal = 15.0;
            response.data.forEach((p) => {
                if (p.printType === "BW") {
                    bwVal = p.pricePerPage;
                }
                if (p.printType === "COLOR") {
                    colorVal = p.pricePerPage;
                }
                if (p.printType === "BLACK_RED") {
                    blackRedVal = p.pricePerPage;
                }
            });
            setBwPrice(bwVal);
            setColorPrice(colorVal);
            setBlackRedPrice(blackRedVal);
        } catch (error) {
            console.error("Error fetching prices:", error);
        }
    };

    const savePrices = async () => {
        const role = (localStorage.getItem("adminRole") || "").toUpperCase();

        // Only ask for secret key if the logged in user is a MANAGER
        if (role === "MANAGER") {
            const secret = window.prompt("Enter Manager Security Key to update prices:");
            if (!secret) return;

            try {
                const adminId = localStorage.getItem("adminId");
                const verifyResponse = await api.post("/admin/verify-secret", null, {
                    params: { adminId, secret }
                });
                if (!verifyResponse.data.success) {
                    showAlert("Error", "Invalid Security Key", "error");
                    return;
                }
            } catch (err) {
                showAlert("Error", "Error verifying security key", "error");
                return;
            }
        }

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
                    printType: "BLACK_RED",
                    pricePerPage: blackRedPrice,
                    blockLocation: selectedPricingBlock
                }
            });

            await api.post("/admin/logs/create", {
                managerName: localStorage.getItem("adminUser") || "Admin",
                college: localStorage.getItem("adminCollege") || "KLU",
                actionType: "PRICING_UPDATE",
                details: `Updated prices for ${selectedPricingBlock} to BW: ${bwPrice}, Color: ${colorPrice}, Black & Red Cover: ${blackRedPrice}`
            });

            showAlert("Success", `Prices Updated Successfully for ${selectedPricingBlock}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Unable to Update Prices", "error");
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/admin/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const toggleBlockUser = async (userId) => {
        try {
            await api.post("/admin/users/toggle-block", null, {
                params: { id: userId }
            });
            fetchUsers();
        } catch (error) {
            console.error("Error toggling block status:", error);
            showAlert("Error", "Failed to toggle block status", "error");
        }
    };

    const deleteUser = async (userId) => {
        showConfirm(
            "Confirm Delete",
            "Are you sure you want to delete this user permanently? All wallet records and orders for this user will be impacted.",
            async () => {
                try {
                    await api.delete("/admin/users/delete", {
                        params: { id: userId }
                    });
                    fetchUsers();
                    showAlert("Success", "User accounts deleted successfully", "success");
                } catch (error) {
                    console.error("Error deleting user:", error);
                    showAlert("Error", "Failed to delete user", "error");
                }
            }
        );
    };

    const fetchSupportTickets = async () => {
        try {
            const response = await api.get("/support/all");
            setSupportTickets(response.data);
        } catch (error) {
            console.error("Error fetching support tickets:", error);
        }
    };

    const resolveSupportTicket = async (id) => {
        try {
            await api.post("/support/resolve", null, {
                params: { id }
            });
            showAlert("Success", "Ticket marked as resolved", "success");
            fetchSupportTickets();
        } catch (err) {
            console.error("Error resolving ticket:", err);
            showAlert("Error", "Failed to resolve support ticket", "error");
        }
    };

    const deleteSupportTicket = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this support ticket permanently?", async () => {
            try {
                await api.delete("/support/delete", {
                    params: { id }
                });
                showAlert("Success", "Support ticket deleted successfully", "success");
                fetchSupportTickets();
            } catch (err) {
                console.error("Error deleting ticket:", err);
                showAlert("Error", "Failed to delete support ticket", "error");
            }
        });
    };

    const [resetScope, setResetScope] = useState("GLOBAL");
    const [resetTargetName, setResetTargetName] = useState("");
    const [selectedAdminOrderIds, setSelectedAdminOrderIds] = useState([]);

    const resetStats = async () => {
        if (loggedInAdminRole !== "MAIN_ADMIN" && loggedInAdminUser !== "admin") {
            showAlert("Permission Denied", "Only the main admin has permission to reset database statistics.", "error");
            return;
        }

        let msg = "This will permanently delete ALL orders and printing history across ALL colleges and blocks.";
        if (resetScope === "COLLEGE") {
            if (!resetTargetName) {
                showAlert("Required", "Please select a target college to reset.", "warning");
                return;
            }
            msg = `This will permanently delete ALL orders and printing history for College '${resetTargetName}'.`;
        } else if (resetScope === "BLOCK") {
            if (!resetTargetName) {
                showAlert("Required", "Please select a target block to reset.", "warning");
                return;
            }
            msg = `This will permanently delete ALL orders and printing history for Block '${resetTargetName}'.`;
        }

        showConfirm(
            "CRITICAL WARNING",
            `${msg} This action CANNOT be undone. Are you sure you want to proceed?`,
            async () => {
                try {
                    await api.post("/admin/reset-stats", null, {
                        params: { 
                            adminUsername: loggedInAdminUser,
                            scope: resetScope,
                            targetName: resetTargetName
                        }
                    });
                    showAlert("Reset Success", "Statistics reset successfully.", "success");
                    fetchStats();
                    fetchOrders();
                } catch (error) {
                    console.error("Error resetting stats:", error);
                    showAlert("Error", error.response?.data || "Failed to reset statistics", "error");
                }
            }
        );
    };

    const handleBulkDeleteOrders = async () => {
        if (loggedInAdminRole !== "MAIN_ADMIN" && loggedInAdminUser !== "admin") {
            showAlert("Permission Denied", "Only the main admin has permission to delete orders.", "error");
            return;
        }
        if (selectedAdminOrderIds.length === 0) {
            showAlert("No Orders Selected", "Please select at least one order to delete.", "warning");
            return;
        }
        showConfirm(
            "Confirm Delete",
            `Are you sure you want to permanently delete ${selectedAdminOrderIds.length} selected order(s)? They will be removed from the database and user history.`,
            async () => {
                try {
                    await api.post("/admin/orders/delete-bulk", selectedAdminOrderIds, {
                        params: { adminUsername: loggedInAdminUser }
                    });
                    showAlert("Delete Success", `${selectedAdminOrderIds.length} order(s) deleted successfully.`, "success");
                    setSelectedAdminOrderIds([]);
                    fetchOrders();
                    fetchStats();
                } catch (error) {
                    console.error("Error deleting orders:", error);
                    showAlert("Error", error.response?.data || "Failed to delete orders", "error");
                }
            }
        );
    };

    const createCoupon = async () => {
        if (Number(discountPercentage) > 95) {
            showAlert("Discount Constraint", "Maximum allowed coupon discount limit is 95%.", "error");
            return;
        }
        try {
            await api.post("/coupon/create", {
                couponCode,
                discountPercentage,
                expiryDate,
                maxUses
            });

            showAlert("Success", "Coupon Created Successfully", "success");
            fetchCoupons();
            setCouponCode("");
            setDiscountPercentage("");
            setExpiryDate("");
            setMaxUses("");
        } catch (error) {
            console.error(error);
            showAlert("Error", error.response?.data?.message || "Unable To Create Coupon", "error");
        }
    };

    // Rewards & Voucher API calls
    const fetchRewards = async () => {
        try {
            const response = await api.get("/rewards/all");
            setRewards(response.data || []);
        } catch (err) {
            console.error("Failed to fetch rewards", err);
        }
    };

    const createReward = async (e) => {
        e.preventDefault();
        if (!rewardTitle.trim() || !rewardDesc.trim() || !rewardAmt || !rewardCode.trim()) {
            showAlert("Required Fields", "Please fill in all reward voucher details.", "warning");
            return;
        }

        setCreatingReward(true);
        try {
            await api.post("/rewards/create", {
                title: rewardTitle.trim(),
                description: rewardDesc.trim(),
                rewardAmount: Number(rewardAmt),
                claimCode: rewardCode.trim().toUpperCase(),
                maxClaims: Number(rewardMaxClaims),
                claimedCount: 0,
                active: true
            });

            showAlert("Success", "Reward voucher created successfully!", "success");
            setRewardTitle("");
            setRewardDesc("");
            setRewardAmt("");
            setRewardCode("");
            setRewardMaxClaims(100);
            fetchRewards();
        } catch (err) {
            console.error(err);
            showAlert("Creation Failed", err.response?.data || "Could not create reward voucher.", "error");
        } finally {
            setCreatingReward(false);
        }
    };

    const toggleRewardActive = async (id, currentActive) => {
        try {
            await api.post("/rewards/update-status", null, {
                params: { id, active: !currentActive }
            });
            fetchRewards();
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to update reward status", "error");
        }
    };

    const deleteReward = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this reward voucher permanently?", async () => {
            try {
                await api.delete("/rewards/delete", {
                    params: { id }
                });
                showAlert("Success", "Reward voucher deleted successfully", "success");
                fetchRewards();
            } catch (err) {
                console.error(err);
                showAlert("Error", "Failed to delete reward voucher", "error");
            }
        });
    };

    const fetchManagerLogs = async () => {
        try {
            const college = (loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") ? loggedInAdminCollege : "ALL";
            const response = await api.get("/admin/logs/all", { params: { college } });
            setManagerLogs(response.data || []);
        } catch (error) {
            console.error("Error fetching manager logs:", error);
        }
    };

    const fetchSubAdmins = async () => {
        try {
            const response = await api.get("/admin/subadmins");
            setSubAdmins(response.data);
        } catch (err) {
            console.error("Error fetching sub-admins:", err);
        }
    };

    const createSubAdmin = async (e) => {
        e.preventDefault();
        if (!newSubAdminUsername || !newSubAdminPassword) {
            showAlert("Error", "Username and Password are required", "error");
            return;
        }
        setIsCreatingSubAdmin(true);
        try {
            await api.post("/admin/subadmins/create", {
                username: newSubAdminUsername,
                password: newSubAdminPassword,
                college: (localStorage.getItem("adminRole") === "SUB_ADMIN" && localStorage.getItem("adminUser") !== "admin") ? localStorage.getItem("adminCollege") || "KLU" : newSubAdminCollege,
                role: newAdminRole,
                managerSecret: newAdminRole === "MANAGER" ? newManagerSecret : null
            });
            showAlert("Success", "Account created successfully!", "success");
            setNewSubAdminUsername("");
            setNewSubAdminPassword("");
            setNewManagerSecret("");
            fetchSubAdmins();
        } catch (err) {
            console.error("Error creating sub-admin:", err);
            showAlert("Creation Failed", err.response?.data || "Could not create sub-admin.", "error");
        } finally {
            setIsCreatingSubAdmin(false);
        }
    };

    const deleteSubAdmin = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this sub-admin?", async () => {
            try {
                await api.delete("/admin/subadmins/delete", { params: { id } });
                showAlert("Success", "Sub-Admin deleted successfully", "success");
                fetchSubAdmins();
            } catch (err) {
                console.error("Error deleting sub-admin:", err);
                showAlert("Error", "Failed to delete sub-admin", "error");
            }
        });
    };

    // Notifications management
    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/all");
            setNotifications(res.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const createNotification = async (e) => {
        e.preventDefault();
        if (!notifTitle.trim() || !notifMessage.trim()) {
            showAlert("Required Fields", "Title and message are required.", "warning");
            return;
        }
        // Sub-admin can only create notifications for their own college
        const college = (loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin")
            ? loggedInAdminCollege
            : notifCollege;
        try {
            await api.post("/notifications/create", {
                title: notifTitle.trim(),
                message: notifMessage.trim(),
                college: college,
                type: notifType
            });
            showAlert("Success", "Notification published successfully!", "success");
            setNotifTitle("");
            setNotifMessage("");
            setNotifCollege("ALL");
            fetchNotifications();
        } catch (err) {
            console.error("Error creating notification:", err);
            showAlert("Error", "Failed to create notification.", "error");
        }
    };

    const deleteNotification = async (id) => {
        showConfirm("Delete Notification", "Are you sure you want to remove this notification?", async () => {
            try {
                await api.delete("/notifications/delete", { params: { id } });
                showAlert("Deleted", "Notification removed successfully.", "success");
                fetchNotifications();
            } catch (err) {
                console.error("Error deleting notification:", err);
                showAlert("Error", "Failed to delete notification.", "error");
            }
        });
    };

    const updateStatus = async (id, status) => {
        try {
            await api.post("/pdf/updateStatus", null, {
                params: { id, status }
            });
            fetchOrders();
            fetchStats();
        } catch (error) {
            console.error(error);
        }
    };

    const downloadPdf = (id) => {
        window.open(getPdfDownloadUrl(id), "_blank");
    };

    const logout = () => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminUser");
        navigate("/admin-login");
    };

    const statusClass = (status) => {
        if (status === "CANCELLED") return "status-pill status-unpaid";
        if (status === "CANCEL_WINDOW") return "status-pill status-unpaid";
        if (status === "QUEUE") return "status-pill status-created";
        if (status === "COMPLETED") return "status-pill status-completed";
        if (status === "PRINTING") return "status-pill status-printing";
        return "status-pill status-created";
    };

    const paymentClass = (status) =>
        status === "PAID" ? "status-pill status-paid" : "status-pill status-unpaid";

    const revenueFilters = [
        ["all", "All Time"],
        ["today", "Today"],
        ["week", "This Week"],
        ["month", "This Month"]
    ];

    const loggedInAdminUser = localStorage.getItem("adminUser") || "admin";
    const loggedInAdminRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
    const loggedInAdminCollege = localStorage.getItem("adminCollege") || "KLU";

    const getRoleFilteredBlocks = () => {
        let filteredBlocks = allBlocks;
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            filteredBlocks = filteredBlocks.filter(b => b.college && b.college.toUpperCase() === loggedInAdminCollege.toUpperCase());
        } else if (blockCollegeFilter !== "ALL") {
            filteredBlocks = filteredBlocks.filter(b => b.college && b.college.toUpperCase() === blockCollegeFilter.toUpperCase());
        }
        return filteredBlocks;
    };

    const getRoleFilteredPrinters = () => {
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            return allPrinters.filter(p => {
                const b = allBlocks.find(x => x.name === p.blockLocation);
                const col = b ? b.college : "KLU";
                return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
            });
        }
        return allPrinters;
    };

    const getRoleFilteredOrders = () => {
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            return allOrders.filter(o => {
                const b = allBlocks.find(x => x.name === o.blockLocation);
                const col = b ? b.college : "KLU";
                return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
            });
        }
        return allOrders;
    };

    const getRoleFilteredUsers = () => {
        let filteredUsers = allUsers;
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            filteredUsers = filteredUsers.filter(u => u.college && u.college.toUpperCase() === loggedInAdminCollege.toUpperCase());
        } else if (userCollegeFilter !== "ALL") {
            filteredUsers = filteredUsers.filter(u => u.college && u.college.toUpperCase() === userCollegeFilter.toUpperCase());
        }
        
        if (userSearchQuery.trim()) {
            const query = userSearchQuery.toLowerCase();
            filteredUsers = filteredUsers.filter(u => 
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.name && u.name.toLowerCase().includes(query)) ||
                (u.id && u.id.toString().includes(query)) ||
                (u.referralCode && u.referralCode.toLowerCase().includes(query))
            );
        }
        return filteredUsers;
    };

    const getRoleFilteredSupportTickets = () => {
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            return allSupportTickets.filter(t => {
                const u = allUsers.find(x => x.email === t.email);
                const col = u ? u.college : "KLU";
                return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
            });
        }
        return allSupportTickets;
    };

    const displayBlocks = getRoleFilteredBlocks();
    const displayPrinters = getRoleFilteredPrinters();
    const displayOrders = getRoleFilteredOrders();
    const displayUsers = getRoleFilteredUsers();
    const displaySupportTickets = getRoleFilteredSupportTickets();

    const orders = displayOrders;
    const users = displayUsers;
    const blocks = displayBlocks;
    const printers = displayPrinters;
    const supportTickets = displaySupportTickets;

    const getFilteredStats = () => {
        const collegeFilteredOrders = displayOrders.filter(o => {
            if (selectedCollegeFilter === "ALL") return true;
            const b = displayBlocks.find(x => x.name === o.blockLocation);
            const col = b ? b.college : "KLU";
            return col.toUpperCase() === selectedCollegeFilter.toUpperCase();
        });

        const getPeriodFilteredOrders = (list, period) => {
            if (period === "all") return list;
            const startOfPeriod = new Date();
            if (period === "today") {
                startOfPeriod.setHours(0,0,0,0);
            } else if (period === "week") {
                const day = startOfPeriod.getDay();
                startOfPeriod.setDate(startOfPeriod.getDate() - day);
                startOfPeriod.setHours(0,0,0,0);
            } else if (period === "month") {
                startOfPeriod.setDate(1);
                startOfPeriod.setHours(0,0,0,0);
            }
            return list.filter(o => {
                const uploadDate = new Date(o.uploadTime || o.createdAt);
                return uploadDate >= startOfPeriod;
            });
        };

        const revenuePeriodOrders = getPeriodFilteredOrders(collegeFilteredOrders, revenuePeriod);

        let grossRevenue = 0;
        let totalDiscounts = 0;
        let netRevenue = 0;
        let razorpayCharges = 0;
        let walletRevenue = 0;
        let upiRevenue = 0;

        revenuePeriodOrders.forEach(o => {
            if (o.paymentStatus === "PAID" && o.status !== "CANCELLED") {
                const original = o.originalPrice != null ? o.originalPrice : o.price;
                grossRevenue += original || 0;
                totalDiscounts += o.discountAmount || 0;
                netRevenue += o.price || 0;
                if (o.razorpayPaymentId === "WALLET") {
                    walletRevenue += o.price || 0;
                } else {
                    upiRevenue += o.price || 0;
                }
            }
        });

        // Razorpay charges only apply to UPI revenue
        const chargePercent = systemSettings.razorpayChargePercentage != null ? systemSettings.razorpayChargePercentage : 2.36;
        razorpayCharges = upiRevenue * (chargePercent / 100);

        const todayOrders = getPeriodFilteredOrders(collegeFilteredOrders, "today");
        let todayRevenue = 0;
        todayOrders.forEach(o => {
            if (o.paymentStatus === "PAID" && o.status !== "CANCELLED") {
                todayRevenue += o.price || 0;
            }
        });

        const completedOrders = collegeFilteredOrders.filter(o => o.status === "COMPLETED").length;
        const printingOrders = collegeFilteredOrders.filter(o => o.status === "PRINTING").length;
        const totalOrders = collegeFilteredOrders.length;
        
        let totalCopies = 0;
        collegeFilteredOrders.filter(o => o.status === "COMPLETED").forEach(o => {
            totalCopies += (o.totalPages || 0) * (o.copies || 1);
        });

        const pendingOrders = collegeFilteredOrders.filter(o => o.status === "ORDER_CREATED" || o.status === "PENDING_SCAN").length;

        return {
            grossRevenue,
            totalDiscounts,
            netRevenue,
            razorpayCharges,
            walletRevenue,
            upiRevenue,
            todayRevenue,
            completedOrders,
            printingOrders,
            totalOrders,
            totalCopies,
            pendingOrders
        };
    };

    const localStats = getFilteredStats();

    const revenueCards = [
        ["Gross Revenue", localStats.grossRevenue || 0, "linear-gradient(135deg, #2563eb, #1d4ed8)"],
        ["Coupon Discounts", localStats.totalDiscounts || 0, "linear-gradient(135deg, #b45309, #c2410c)"],
        ["Razorpay Charges", localStats.razorpayCharges || 0, "linear-gradient(135deg, #7c3aed, #4c1d95)", `${systemSettings.razorpayChargePercentage || 2.36}% per UPI TXN`],
        ["Net Revenue", localStats.netRevenue - (localStats.razorpayCharges || 0), "linear-gradient(135deg, #16865b, #0f766e)"],
        ["Wallet Cash", localStats.walletRevenue || 0, "linear-gradient(135deg, #0f766e, #065f46)"],
        ["UPI Cash", localStats.upiRevenue || 0, "linear-gradient(135deg, #7c3aed, #6d28d9)"]
    ];

    const statCards = [
        ["Today's Revenue", `Rs. ${localStats.todayRevenue || 0}`, "linear-gradient(135deg, #0f766e, #16865b)"],
        ["Total Orders", localStats.totalOrders || 0, "linear-gradient(135deg, #1677b7, #334155)"],
        ["Total Copies", localStats.totalCopies || 0, "linear-gradient(135deg, #5b6f95, #111827)"],
        ["Pending", localStats.pendingOrders || 0, "linear-gradient(135deg, #b7791f, #805ad5)"],
        ["Completed", localStats.completedOrders || 0, "linear-gradient(135deg, #2563eb, #16865b)"]
    ];

    // Dynamic blocks & refills helper methods
    const fetchBlocks = async () => {
        try {
            const response = await api.get("/blocks/all");
            setBlocks(response.data || []);
        } catch (error) {
            console.error("Error fetching blocks:", error);
        }
    };

    const fetchPrinters = async () => {
        try {
            const response = await api.get("/admin/printers/status");
            setPrinters(response.data || []);
            
            const papersMap = {};
            for (const printer of response.data) {
                papersMap[printer.blockLocation] = printer.paperCount != null ? printer.paperCount : 0;
            }
            setPrinterPapers(papersMap);
        } catch (error) {
            console.error("Error fetching printers status:", error);
        }
    };

    const updatePrinterPaper = async (blockLoc, count) => {
        try {
            await api.post("/printer/updatePaper", null, {
                params: {
                    blockLocation: blockLoc,
                    paperCount: count
                }
            });
            showAlert("Success", `Paper count updated successfully for ${blockLoc}`, "success");
            fetchPrinters();
            await api.post("/admin/logs/create", {
                managerName: loggedInAdminUser,
                college: loggedInAdminCollege,
                actionType: "PAPER_COUNT_UPDATE",
                details: `Updated paper count for block ${blockLoc} to ${count}`
            });
        } catch (error) {
            console.error("Failed to update paper count:", error);
            showAlert("Error", "Failed to update paper count", "error");
        }
    };

    const togglePrinterMaintenance = async (printer) => {
        try {
            await api.post("/printer/save", {
                ...printer,
                maintenance: !printer.maintenance
            });
            fetchPrinters();
            await api.post("/admin/logs/create", {
                managerName: loggedInAdminUser,
                college: loggedInAdminCollege,
                actionType: "MAINTENANCE_TOGGLE",
                details: `Toggled maintenance for printer ${printer.printerName} in ${printer.blockLocation} to ${!printer.maintenance}`
            });
            showAlert("Success", `Maintenance status updated for ${printer.printerName}`, "success");
        } catch (error) {
            console.error("Failed to toggle maintenance", error);
            showAlert("Error", "Failed to toggle maintenance status", "error");
        }
    };

    const deletePrinter = async (id) => {
        try {
            await api.delete("/printer/delete", { params: { id } });
            showAlert("Success", "Printer deleted successfully", "success");
            fetchPrinters();
        } catch (error) {
            console.error("Failed to delete printer:", error);
            showAlert("Error", "Failed to delete printer", "error");
        }
    };

    const addPrinter = async (e) => {
        e.preventDefault();
        
        if (!newPrinterBlock) {
            showAlert("Error", "Please select a block", "error");
            return;
        }

        // Limit checks for MANAGER
        if (loggedInAdminRole === "MANAGER") {
            const blockPrinters = allPrinters.filter(p => p.blockLocation === newPrinterBlock);
            const colorPrintersCount = blockPrinters.filter(p => p.colourSupported).length;
            const bwPrintersCount = blockPrinters.filter(p => !p.colourSupported).length;
            
            const maxColor = systemSettings.managerMaxColorPrinters || 1;
            const maxBw = systemSettings.managerMaxBwPrinters || 1;
            
            if (newPrinterColor && colorPrintersCount >= maxColor) {
                showAlert("Error", `Manager limit reached: Max ${maxColor} color printer(s) allowed per block`, "error");
                return;
            }
            if (!newPrinterColor && bwPrintersCount >= maxBw) {
                showAlert("Error", `Manager limit reached: Max ${maxBw} B&W printer(s) allowed per block`, "error");
                return;
            }
        }
        
        try {
            await api.post("/printer/save", {
                printerName: newPrinterName,
                printerIp: newPrinterIp || "192.168.1.100",
                blockLocation: newPrinterBlock,
                colourSupported: newPrinterColor,
                active: newPrinterActive,
                maintenance: newPrinterMaintenance,
                qrScanToPrint: newPrinterQrScan,
                otpEnabled: newPrinterOtp,
                paperCount: 500
            });
            showAlert("Success", "Printer added successfully", "success");
            fetchPrinters();
            setNewPrinterName("");
            setNewPrinterIp("");
            setNewPrinterActive(true);
            setNewPrinterMaintenance(false);
            setNewPrinterQrScan(false);
            setNewPrinterOtp(true);
        } catch (error) {
            console.error("Error adding printer", error);
            showAlert("Error", "Failed to add printer", "error");
        }
    };

    // User moderation helper
    const addBlock = async (e) => {
        e.preventDefault();
        if (!newBlockName.trim()) {
            showAlert("Required", "Please enter a block name", "warning");
            return;
        }
        try {
            await api.post("/blocks/add", null, {
                params: { 
                    name: newBlockName.trim(),
                    college: newBlockCollege.trim()
                }
            });
            showAlert("Success", `Block '${newBlockName}' added to college '${newBlockCollege}' and default prices initialized.`, "success");
            setNewBlockName("");
            setNewBlockCollege("KLU");
            fetchBlocks();
        } catch (error) {
            console.error("Error adding block:", error);
            showAlert("Failed", error.response?.data || "Failed to add block", "error");
        }
    };

    // Rename a block
    const renameBlock = async (id, currentName) => {
        const newName = window.prompt("Enter new name for block:", currentName);
        if (!newName) return;
        try {
            await api.put(`/blocks/rename/${id}`, null, { params: { newName: newName.trim() } });
            showAlert("Success", `Block renamed to '${newName.trim()}'`, "success");
            fetchBlocks();
        } catch (error) {
            console.error("Error renaming block:", error);
            showAlert("Error", error.response?.data || "Failed to rename block", "error");
        }
    };

    // Delete a block
    const deleteBlock = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this block?", async () => {
            try {
                await api.delete(`/blocks/delete/${id}`);
                showAlert("Deleted", "Block deleted successfully", "success");
                fetchBlocks();
            } catch (error) {
                console.error("Error deleting block:", error);
                showAlert("Error", error.response?.data || "Failed to delete block", "error");
            }
        });
    };

    // Regenerate server API key for a block
    const regenerateBlockKey = async (id) => {
        showConfirm("Regenerate Key", "Are you sure? The physical print server will need to be updated with the new key.", async () => {
            try {
                await api.post(`/blocks/generate-key/${id}`);
                showAlert("Success", "Server API Key regenerated successfully", "success");
                fetchBlocks();
            } catch (error) {
                console.error("Error regenerating key:", error);
                showAlert("Error", error.response?.data || "Failed to regenerate key", "error");
            }
        });
    };

    const downloadServerConfig = (block) => {
        if (!block.serverApiKey) {
            showAlert("Error", "Please generate an API Key for this block first.", "error");
            return;
        }

        const blockPrinters = printers.filter(p => p.blockLocation === block.name);
        
        const blocksArray = blockPrinters.length > 0 
            ? blockPrinters.map(p => ({
                blockLocation: block.name,
                printerName: p.printerName || "",
                apiKey: block.serverApiKey
            }))
            : [
                {
                    blockLocation: block.name,
                    printerName: "",
                    apiKey: block.serverApiKey
                }
            ];

        const configObj = {
            backendUrl: import.meta.env.VITE_API_URL || "https://printer-backend-1.onrender.com",
            pollIntervalMs: 5000,
            blocks: blocksArray
        };

        const configStr = JSON.stringify(configObj, null, 2);
        
        const blob = new Blob([configStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert("Downloaded", `config.json for ${block.name} downloaded!`, "success");
    };


    const fetchSystemSettings = async () => {
        try {
            const response = await api.get("/admin/settings");
            setSystemSettings(response.data);
        } catch (error) {
            console.error("Error fetching admin settings:", error);
        }
    };

    const fetchCollegeOffpeakSettings = async (college) => {
        try {
            const response = await api.get(`/admin/settings/offpeak?college=${college}`);
            setCollegeOffpeakSettings(response.data);
        } catch (error) {
            console.error("Error fetching offpeak settings:", error);
        }
    };

    const saveCollegeOffpeakSettings = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/settings/offpeak/update?college=${offpeakCollege}`, collegeOffpeakSettings);
            showAlert("Success", "College Off-Peak Settings Updated Successfully", "success");
        } catch (error) {
            console.error("Error updating offpeak settings:", error);
            showAlert("Error", "Failed to update offpeak settings", "error");
        }
    };

    const saveSystemSettings = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/settings/update", systemSettings);
            showAlert("Success", "System Settings Updated Successfully", "success");
        } catch (error) {
            console.error("Error updating system settings:", error);
            showAlert("Error", "Failed to update system settings", "error");
        }
    };

    const fetchSections = async () => {
        try {
            const response = await api.get("/sections/all");
            setSections(response.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const addSection = async (e) => {
        e.preventDefault();
        if (!secTitle.trim() || !secContent.trim()) {
            showAlert("Required Fields", "Title and Content are required", "warning");
            return;
        }
        try {
            await api.post("/sections/add", {
                title: secTitle.trim(),
                content: secContent.trim(),
                sectionType: secType,
                imageUrl: secImage.trim() || null,
                redirectUrl: secRedirect.trim() || null,
                displayOrder: Number(secOrder || 0),
                active: true
            });
            showAlert("Success", "Frontend Section Added Successfully", "success");
            setSecTitle("");
            setSecContent("");
            setSecImage("");
            setSecRedirect("");
            setSecOrder(0);
            fetchSections();
        } catch (error) {
            console.error("Error adding section:", error);
            showAlert("Error", "Failed to add section", "error");
        }
    };

    const toggleSectionStatus = async (id, currentStatus) => {
        try {
            await api.post("/sections/update-status", null, {
                params: {
                    id,
                    active: !currentStatus
                }
            });
            showAlert("Success", "Section status updated", "success");
            fetchSections();
        } catch (error) {
            console.error("Error toggling section status:", error);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const deleteSection = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this section permanently?", async () => {
            try {
                await api.delete("/sections/delete", {
                    params: { id }
                });
                showAlert("Deleted", "Section deleted successfully", "success");
                fetchSections();
            } catch (error) {
                console.error("Error deleting section:", error);
                showAlert("Error", "Failed to delete section", "error");
            }
        });
    };

    const fetchPopups = async () => {
        try {
            const response = await api.get("/popups/all");
            setPopups(response.data || []);
        } catch (error) {
            console.error("Error fetching popups:", error);
        }
    };

    const fetchSuspendedColleges = async () => {
        try {
            const response = await api.get("/system/settings");
            setSuspendedColleges(response.data?.suspendedColleges || "");
        } catch (error) {
            console.error("Error fetching suspended colleges:", error);
        }
    };

    const fetchCollegeConfigs = async () => {
        try {
            const response = await api.get("/college-config");
            setCollegeConfigs(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleCollegeSuspension = async (college) => {
        try {
            let currentSuspended = suspendedColleges ? suspendedColleges.split(",").map(s => s.trim()).filter(Boolean) : [];
            if (currentSuspended.includes(college)) {
                currentSuspended = currentSuspended.filter(c => c !== college);
            } else {
                currentSuspended.push(college);
            }
            const newValue = currentSuspended.join(",");
            await api.post("/admin/settings/update", { suspendedColleges: newValue });
            setSuspendedColleges(newValue);
            showAlert("Success", `${college} suspension status updated`, "success");
        } catch (error) {
            console.error("Error updating suspension:", error);
            showAlert("Error", "Failed to update college suspension", "error");
        }
    };

    const addPopup = async (e) => {
        e.preventDefault();
        if (!popTitle.trim() || !popMessage.trim()) {
            showAlert("Required Fields", "Title and Message are required", "warning");
            return;
        }
        try {
            await api.post("/popups/add", {
                title: popTitle.trim(),
                message: popMessage.trim(),
                targetPage: popTarget,
                active: popActive,
                dismissible: popDismissible
            });
            showAlert("Success", "Custom Popup Added Successfully", "success");
            setPopTitle("");
            setPopMessage("");
            setPopTarget("ALL");
            setPopDismissible(true);
            setPopActive(true);
            fetchPopups();
        } catch (error) {
            console.error("Error adding popup:", error);
            showAlert("Error", "Failed to add popup", "error");
        }
    };

    const togglePopupStatus = async (id, currentStatus) => {
        try {
            await api.post("/popups/update-status", null, {
                params: {
                    id,
                    active: !currentStatus
                }
            });
            showAlert("Success", "Popup status updated", "success");
            fetchPopups();
        } catch (error) {
            console.error("Error toggling popup status:", error);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const deletePopup = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this popup permanently?", async () => {
            try {
                await api.delete("/popups/delete", {
                    params: { id }
                });
                showAlert("Deleted", "Popup deleted successfully", "success");
                fetchPopups();
            } catch (error) {
                console.error("Error deleting popup:", error);
                showAlert("Error", "Failed to delete popup", "error");
            }
        });
    };

    const runSqlQuery = async (e) => {
        e.preventDefault();
        if (!sqlQuery.trim()) {
            setSqlError("Query cannot be empty");
            return;
        }
        setSqlExecuting(true);
        setSqlResult(null);
        setSqlError("");
        try {
            const response = await api.post("/admin/sql", { query: sqlQuery });
            setSqlResult(response.data);
        } catch (error) {
            console.error("SQL Error:", error);
            setSqlError(error.response?.data || error.message || "Failed to execute query");
        } finally {
            setSqlExecuting(false);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            showAlert("Exporting Backup", "Generating database backup. Please wait...", "info");
            const response = await api.get("/admin/export-sql", { responseType: "blob" });
            const blob = new Blob([response.data], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `backup_${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showAlert("Success", "Database backup SQL file downloaded successfully!", "success");
        } catch (error) {
            console.error("Backup failed:", error);
            showAlert("Backup Failed", error.message || "Failed to download backup file", "error");
        }
    };

    return (
        <main className="page-shell page-shell-decorated !px-0 !py-0 admin-dashboard-root">
            <div className="!max-w-none !w-full px-4 py-4 md:px-8 md:py-6">
                <Navbar
                    title="Admin Dashboard"
                    subtitle="Operations Control Panel"
                    badge="Stats refresh live every 3 seconds."
                    actions={[
                        { label: "📋 Queue Kanban", path: "/admin/queue", className: "btn secondary text-xs py-2 px-3 min-h-0 font-bold" },
                        ...(loggedInAdminRole !== "MANAGER" ? [
                            { label: "👥 Users", path: "/admin/users", className: "btn secondary text-xs py-2 px-3 min-h-0 font-bold" },
                            { label: "📊 Analytics", path: "/admin/analytics", className: "btn secondary text-xs py-2 px-3 min-h-0 font-bold" },
                            { label: "⚙️ Settings", path: "/admin/settings", className: "btn secondary text-xs py-2 px-3 min-h-0 font-bold" },
                            { label: "Printer Settings", path: "/printer-settings", className: "btn text-xs py-2 px-3 min-h-0 font-bold" },
                        ] : []),
                        { label: "Display Panel", path: "/display-panel", className: "btn secondary text-xs py-2 px-3 min-h-0 font-bold" }
                    ]}
                />

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-3 mb-6 mt-6">
                    <button
                        onClick={() => setActiveTab("queue")}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "queue"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Queue & Analytics
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("settings");
                            fetchPrices(selectedPricingBlock);
                            fetchCoupons();
                            fetchBlocks();
                            fetchRewards();
                            fetchSystemSettings();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "settings"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Pricing & Coupons
                    </button>
                    {loggedInAdminRole !== "MANAGER" && (
                        <button
                            onClick={() => {
                                setActiveTab("blocks");
                                fetchBlocks();
                                fetchSuspendedColleges();
                            }}
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                activeTab === "blocks"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100/60"
                            }`}
                        >
                            🏛️ Manage Blocks
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setActiveTab("printers");
                            fetchPrinters();
                            fetchBlocks();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "printers"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        🖨️ Manage Printers
                    </button>
                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                        <button
                            onClick={() => {
                                setActiveTab("colleges");
                                fetchBlocks();
                                fetchSuspendedColleges();
                                fetchCollegeConfigs();
                            }}
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                activeTab === "colleges"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100/60"
                            }`}
                        >
                            🏫 College Management
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setActiveTab("users");
                            fetchUsers();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "users"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        User Moderation
                    </button>
                    {loggedInAdminRole !== "MANAGER" && (
                        <>
                            <button
                                onClick={() => {
                                    setActiveTab("support");
                                    fetchSupportTickets();
                                }}
                                className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                    activeTab === "support"
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100/60"
                                }`}
                            >
                                Support Tickets
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("frontend");
                                    fetchSystemSettings();
                                    fetchSections();
                                }}
                                className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                    activeTab === "frontend"
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100/60"
                                }`}
                            >
                                Frontend Manager
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("system");
                                    fetchSystemSettings();
                                    fetchBlocks();
                                    fetchPrinters();
                                }}
                                className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                    activeTab === "system"
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100/60"
                                }`}
                            >
                                System Config
                            </button>
                        </>
                    )}

                    
                    {loggedInAdminRole !== "MANAGER" && (
                        <button
                            onClick={() => {
                                setActiveTab("subadmins");
                                fetchSubAdmins();
                                fetchManagerLogs();
                            }}
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                activeTab === "subadmins"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100/60"
                            }`}
                        >
                            🔑 Manage Staff
                        </button>
                    )}

                    {loggedInAdminRole !== "MANAGER" && (
                        <button
                            onClick={() => {
                                setActiveTab("notifications");
                                fetchNotifications();
                            }}
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                activeTab === "notifications"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100/60"
                            }`}
                        >
                            🔔 Notifications
                        </button>
                    )}

                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                        <button
                            onClick={() => {
                                setActiveTab("sql");
                                setSqlResult(null);
                                setSqlError("");
                            }}
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                                activeTab === "sql"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100/60"
                            }`}
                        >
                            SQL Terminal
                        </button>
                    )}
                </div>

                {/* Queue & Analytics Tab */}
                {activeTab === "queue" && (
                    <div className="mt-6 space-y-6">
                        {/* Live Printer Stock & Status Map */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {printers.map((p) => {
                                const isLowPaper = p.paperCount < 50;
                                return (
                                    <motion.div
                                        key={p.id}
                                        className="panel p-5 relative overflow-hidden flex flex-col justify-between border-slate-100 hover:shadow-md transition-all duration-300"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-lg leading-tight">{p.blockLocation}</h4>
                                                <p className="text-xs text-slate-400 font-bold mt-0.5">{p.printerName || "Printer Terminal"}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                p.online 
                                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                                    : "bg-slate-500/10 text-slate-400 border border-slate-500/15"
                                            }`}>
                                                {p.online ? "Online" : "Offline"}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                                <span>Paper Stock</span>
                                                <span className={isLowPaper ? "text-rose-500 font-black" : "text-slate-800"}>
                                                    {p.paperCount} Sheets {isLowPaper && "🚨"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-bold text-slate-400">
                                            <span>Active Queue Load:</span>
                                            <span className="text-slate-700 font-black">{p.queueLoad || 0} active jobs</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <motion.section
                            className="panel p-6"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Revenue Analytics</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        Gross vs Net After Coupons
                                    </h2>
                                    <p className="subtitle">
                                        Net revenue = gross revenue − coupon discounts − Razorpay charges ({systemSettings.razorpayChargePercentage || 2.36}%)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {/* College Filter Selection Dropdown - hidden for sub-admins and managers */}
                                    {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">Filter College:</span>
                                            <select
                                                value={selectedCollegeFilter}
                                                onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                                                className="field !w-auto text-xs py-1 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                            >
                                                <option value="ALL">All Colleges</option>
                                                {Array.from(new Set(blocks.map(b => b.college).filter(Boolean))).map(col => (
                                                    <option key={col} value={col}>{col} College</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">College:</span>
                                            <span className="text-xs font-black px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                {loggedInAdminCollege}
                                            </span>
                                        </div>
                                    )}

                                    <div className="revenue-filter">
                                        {revenueFilters.map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() => setRevenuePeriod(value)}
                                                className={
                                                    revenuePeriod === value
                                                        ? "revenue-filter-btn active"
                                                        : "revenue-filter-btn"
                                                }
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={resetStats}
                                        className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        Reset Stats
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
                                {revenueCards.map(([label, value, background, subtitle], index) => (
                                    <motion.div
                                        key={label}
                                        className="revenue-card"
                                        style={{ background }}
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.06 }}
                                    >
                                        <p className="relative z-10 text-sm font-bold text-white/80">
                                            {label}
                                        </p>
                                        <p className="relative z-10 mt-2 text-2xl font-black truncate" title={`Rs. ${Number(value).toFixed(2)}`}>
                                            Rs. {Number(value).toFixed(2)}
                                        </p>
                                        {subtitle && (
                                            <p className="relative z-10 mt-2 text-[10px] font-black uppercase tracking-widest bg-white/20 rounded-md px-2 py-0.5 inline-block">
                                                {subtitle}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>

                        <section className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {statCards.map(([label, value, background], index) => (
                                <motion.div
                                    key={label}
                                    className="stat-card"
                                    style={{ background }}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <p className="text-sm font-bold text-white/80">
                                        {label}
                                    </p>
                                    <p className="text-2xl font-black">
                                        {value}
                                    </p>
                                </motion.div>
                            ))}
                        </section>

                        {/* Visual Analytics Charts */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                            {/* Chart 1: Print Volume by Block Location */}
                            <div className="panel p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <p className="font-bold text-slate-500 mb-4 text-sm">Print Volume by Block Location</p>
                                <div className="h-64 flex items-end justify-around pb-4 border-b border-slate-200">
                                    {(() => {
                                        const blockCounts = displayOrders.reduce((acc, order) => {
                                            const loc = order.blockLocation || "C Block";
                                            acc[loc] = (acc[loc] || 0) + 1;
                                            return acc;
                                        }, {});
                                        if (Object.keys(blockCounts).length === 0) {
                                            blockCounts["C Block"] = 0;
                                        }
                                        const maxCount = Math.max(1, ...Object.values(blockCounts));
                                        
                                        return Object.entries(blockCounts).map(([block, count]) => {
                                            const pct = (count / maxCount) * 100;
                                            return (
                                                <div key={block} className="flex flex-col items-center w-16 group h-full justify-end">
                                                    <span className="text-xs font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count} orders</span>
                                                    <div className="h-44 w-full flex items-end justify-center bg-slate-50/50 rounded-lg p-1 border border-slate-100/30">
                                                        <div 
                                                            style={{ height: `${Math.max(10, pct)}%` }} 
                                                            className="w-8 bg-sky-500 hover:bg-sky-600 rounded-t-md transition-all duration-500 cursor-pointer shadow-sm"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 mt-2">{block}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Chart 2: Hourly Peak Printing Volumes */}
                            <div className="panel p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <p className="font-bold text-slate-500 mb-4 text-sm">Hourly Printing Volume (Peak Hours)</p>
                                <div className="h-64 flex items-end justify-between px-2 pb-4 border-b border-slate-200">
                                    {(() => {
                                        const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
                                        const counts = [0, 0, 0, 0, 0, 0, 0];
                                        
                                        displayOrders.forEach(order => {
                                            const d = new Date(order.uploadTime || order.createdAt);
                                            const hr = d.getHours();
                                            
                                            if (hr >= 8 && hr < 10) counts[0]++;
                                            else if (hr >= 10 && hr < 12) counts[1]++;
                                            else if (hr >= 12 && hr < 14) counts[2]++;
                                            else if (hr >= 14 && hr < 16) counts[3]++;
                                            else if (hr >= 16 && hr < 18) counts[4]++;
                                            else if (hr >= 18 && hr < 20) counts[5]++;
                                            else if (hr >= 20) counts[6]++;
                                        });

                                        const maxCount = Math.max(1, ...counts);
 
                                        return counts.map((count, index) => {
                                            const pct = (count / maxCount) * 100;
                                            return (
                                                <div key={index} className="flex flex-col items-center flex-1 group h-full justify-end">
                                                    <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count} prints</span>
                                                    <div className="h-44 w-full flex items-end justify-center bg-slate-50/50 rounded-lg p-1 border border-slate-100/30 mx-1">
                                                        <div 
                                                            style={{ height: `${Math.max(10, pct)}%` }} 
                                                            className="w-6 bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all duration-500 cursor-pointer shadow-sm"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700 mt-2">{hours[index]}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Chart 3: Print Volume by College Campus — Main Admin only */}
                            {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") && (
                            <div className="panel p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <p className="font-bold text-slate-500 mb-4 text-sm">Print Volume by College / Campus</p>
                                <div className="h-64 flex items-end justify-around pb-4 border-b border-slate-200">
                                    {(() => {
                                        const collegeCounts = displayOrders.reduce((acc, order) => {
                                            const block = displayBlocks.find(b => b.name === order.blockLocation);
                                            const col = block ? block.college : "KLU";
                                            acc[col] = (acc[col] || 0) + 1;
                                            return acc;
                                        }, {});
                                        if (Object.keys(collegeCounts).length === 0) {
                                            collegeCounts["KLU"] = 0;
                                        }
                                        const maxCount = Math.max(1, ...Object.values(collegeCounts));
                                        
                                        return Object.entries(collegeCounts).map(([college, count]) => {
                                            const pct = (count / maxCount) * 100;
                                            return (
                                                <div key={college} className="flex flex-col items-center w-16 group h-full justify-end">
                                                    <span className="text-xs font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count} orders</span>
                                                    <div className="h-44 w-full flex items-end justify-center bg-slate-50/50 rounded-lg p-1 border border-slate-100/30">
                                                        <div 
                                                            style={{ height: `${Math.max(10, pct)}%` }} 
                                                            className="w-8 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-500 cursor-pointer shadow-sm"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 mt-2">{college}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            )}
                        </div>

                        <motion.section
                            className="panel mt-6 overflow-x-auto p-6"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                        >
                            <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="eyebrow">Order history</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        All Orders History
                                    </h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && selectedAdminOrderIds.length > 0 && (
                                        <button
                                            onClick={handleBulkDeleteOrders}
                                            className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            🗑️ Delete Selected ({selectedAdminOrderIds.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => exportToCSV(orders, "active_orders", ["Order ID", "Date & Time", "Location", "Customer", "Pages", "Copies", "Price", "Payment", "Order Status"])}
                                        className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        📥 Export Excel
                                    </button>
                                </div>
                            </div>

                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                            <th className="w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={orders.length > 0 && selectedAdminOrderIds.length === orders.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedAdminOrderIds(orders.map(o => o.orderId));
                                                        } else {
                                                            setSelectedAdminOrderIds([]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th>Order ID</th>
                                        <th
                                            onClick={() => setOrderSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                                            className="cursor-pointer select-none whitespace-nowrap"
                                            title="Sort by Date"
                                        >
                                            Date &amp; Time {orderSortDir === 'desc' ? '▼' : '▲'}
                                        </th>
                                        <th>Location</th>
                                        <th>Customer</th>
                                        <th>Pages</th>
                                        <th>Copies</th>
                                        <th>Price</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {[...(orders || [])].sort((a, b) => {
                                        const ta = new Date(a.uploadTime || 0).getTime();
                                        const tb = new Date(b.uploadTime || 0).getTime();
                                        return orderSortDir === 'desc' ? tb - ta : ta - tb;
                                    }).map((order, index) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                                <td className="w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAdminOrderIds.includes(order.orderId)}
                                                        onChange={() => {
                                                            setSelectedAdminOrderIds(prev =>
                                                                prev.includes(order.orderId)
                                                                    ? prev.filter(id => id !== order.orderId)
                                                                    : [...prev, order.orderId]
                                                            );
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td className="font-black">
                                                <span>{order.orderId}</span>
                                            </td>
                                            <td className="whitespace-nowrap text-slate-500 text-sm">
                                                {order.uploadTime
                                                    ? new Date(order.uploadTime).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: true
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="font-bold">
                                                {order.blockLocation || "C Block"}
                                            </td>
                                            <td className="font-bold text-slate-900">
                                                {order.customerName || "Customer"}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => showPagesDetails(order)}
                                                    className="text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
                                                >
                                                    {getPagesCount(order)}
                                                </button>
                                            </td>
                                            <td>{order.copies}</td>
                                            <td className="font-black text-slate-900">
                                                Rs. {order.price}
                                            </td>
                                            <td>
                                                <span className={paymentClass(order.paymentStatus)}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={statusClass(order.status)}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}

                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center font-bold text-slate-500 py-6">
                                                No print orders in queue
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>
                    </div>
                )}

                {/* Order Queue Tab */}
                {activeTab === "order-queue" && (
                    <motion.section
                        className="panel mt-2 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <p className="eyebrow">Live print queue</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Active Order Queue
                                </h2>
                                <p className="subtitle">
                                    Orders currently in the print pipeline. Refreshes every 3 seconds.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && selectedAdminOrderIds.length > 0 && (
                                    <button
                                        onClick={handleBulkDeleteOrders}
                                        className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        🗑️ Delete Selected ({selectedAdminOrderIds.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => exportToCSV(
                                        orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)),
                                        "order_queue",
                                        ["Order ID", "Location", "Customer", "Pages", "Copies", "Price", "Payment", "Order Status"]
                                    )}
                                    className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                >
                                    📥 Export Queue
                                </button>
                            </div>
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                        <th className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)).length > 0 && selectedAdminOrderIds.length > 0}
                                                onChange={(e) => {
                                                    const queueIds = orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)).map(o => o.orderId);
                                                    if (e.target.checked) {
                                                        setSelectedAdminOrderIds(Array.from(new Set([...selectedAdminOrderIds, ...queueIds])));
                                                    } else {
                                                        setSelectedAdminOrderIds(selectedAdminOrderIds.filter(id => !queueIds.includes(id)));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th>Order ID</th>
                                    <th>Location</th>
                                    <th>Customer</th>
                                    <th>Pages</th>
                                    <th>Copies</th>
                                    <th>Price</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>OTP Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders
                                    .filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status))
                                    .map((order, index) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                            <td className="w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAdminOrderIds.includes(order.orderId)}
                                                    onChange={() => {
                                                        setSelectedAdminOrderIds(prev =>
                                                            prev.includes(order.orderId)
                                                                ? prev.filter(id => id !== order.orderId)
                                                                : [...prev, order.orderId]
                                                        );
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="font-black">
                                            <span>{order.orderId}</span>
                                        </td>
                                        <td className="font-bold">{order.blockLocation || "—"}</td>
                                        <td className="font-bold text-slate-900">{order.customerName || "Customer"}</td>
                                             <td>
                                                 <button
                                                     onClick={() => showPagesDetails(order)}
                                                     className="text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
                                                 >
                                                     {getPagesCount(order)}
                                                 </button>
                                             </td>
                                        <td>{order.copies}</td>
                                        <td className="font-black text-slate-900">Rs. {order.price}</td>
                                        <td>
                                            <span className={paymentClass(order.paymentStatus)}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={statusClass(order.status)}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="font-black text-sky-600 tracking-widest">
                                            {order.otpCode || "—"}
                                        </td>
                                    </motion.tr>
                                ))}

                                {orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)).length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="text-center font-bold text-slate-500 py-6">
                                            No active orders in the print queue
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Pricing & Coupons Tab */}
                {activeTab === "settings" && (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                                    <motion.section
                                        className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Price Settings</p>
                                        <h2 className="text-2xl font-black text-slate-900">
                                            Rate Configuration
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Select Block for Pricing
                                        </span>
                                        <select
                                            value={selectedPricingBlock}
                                            onChange={(e) => {
                                                setSelectedPricingBlock(e.target.value);
                                                fetchPrices(e.target.value);
                                            }}
                                            className="field"
                                        >
                                            {blocks.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Black & White rate (Rs./page)
                                        </span>
                                        <input
                                            type="number"
                                            value={bwPrice}
                                            onChange={(e) => setBwPrice(e.target.value)}
                                            className="field"
                                            step="0.5"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Color rate (Rs./page)
                                        </span>
                                        <input
                                            type="number"
                                            value={colorPrice}
                                            onChange={(e) => setColorPrice(e.target.value)}
                                            className="field"
                                            step="0.5"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Black & Red Cover rate (Rs./cover)
                                        </span>
                                        <input
                                            type="number"
                                            value={blackRedPrice}
                                            onChange={(e) => setBlackRedPrice(e.target.value)}
                                            className="field"
                                            step="0.5"
                                        />
                                    </label>
                                </div>

                                <button
                                    onClick={savePrices}
                                    className="btn success mt-5 w-full"
                                >
                                    Save Prices
                                </button>
                            </motion.section>

                            {/* Block Management Section */}
                            {loggedInAdminRole !== "MANAGER" && (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.07 }}
                            >
                                <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                    <h3 className="font-bold text-lg">Manage Blocks</h3>
                                    {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">Filter College:</span>
                                            <select
                                                value={blockCollegeFilter}
                                                onChange={(e) => setBlockCollegeFilter(e.target.value)}
                                                className="field !w-auto text-xs py-1 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                            >
                                                <option value="ALL">All Colleges</option>
                                                {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => (
                                                    <option key={col} value={col}>{col} College</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <ul className="space-y-2">
                                    {blocks.map(b => (
                                        <li key={b.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{b.name}</span>
                                                <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    {b.college || "KLU"}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {b.serverApiKey ? (
                                                    <div className="flex items-center gap-2 mr-4 bg-slate-50 px-3 py-1 rounded border border-slate-200">
                                                        <span className="text-xs font-mono text-slate-500">Key: {b.serverApiKey}</span>
                                                        <button onClick={() => {navigator.clipboard.writeText(b.serverApiKey); showAlert("Copied", "API Key copied to clipboard", "success");}} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Copy</button>
                                                        <button onClick={() => downloadServerConfig(b)} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 ml-2">Download config.json</button>
                                                        <button onClick={() => regenerateBlockKey(b.id)} className="text-xs font-bold text-red-500 hover:text-red-700 ml-2">Revoke & Regenerate</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => regenerateBlockKey(b.id)} className="btn small !bg-indigo-50 !text-indigo-600 border border-indigo-200 mr-4 hover:!bg-indigo-100">Generate API Key</button>
                                                )}
                                                <button onClick={() => renameBlock(b.id, b.name)} className="btn small">Rename</button>
                                                <button onClick={() => deleteBlock(b.id)} className="btn danger small">Delete</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </motion.section>
                            )}

                            {(loggedInAdminRole !== "MANAGER" || couponUnlocked) ? (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Discounts</p>
                                        <h2 className="text-2xl font-black text-slate-900">
                                            Coupon Generator
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="field"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Discount % (Max 95%)"
                                        value={discountPercentage}
                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                        className="field"
                                        max="95"
                                    />

                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="field"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Max Uses"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="field"
                                    />

                                    <button
                                        onClick={createCoupon}
                                        className="btn w-full mt-2"
                                    >
                                        Create Coupon
                                    </button>
                                </div>
                            </motion.section>
                            ) : (
                                <motion.section
                                    className="panel p-6 flex flex-col items-center justify-center min-h-[300px]"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Coupons & Rewards Locked</h2>
                                    <p className="text-slate-500 mb-6">Please enter the secret key provided by your Sub-Admin.</p>
                                    <div className="flex gap-2 max-w-sm w-full">
                                        <input
                                            type="password"
                                            className="field flex-1"
                                            placeholder="Secret Key"
                                            value={managerCouponSecretInput}
                                            onChange={(e) => setManagerCouponSecretInput(e.target.value)}
                                        />
                                        <button onClick={unlockManagerCoupons} className="btn primary">Unlock</button>
                                    </div>
                                </motion.section>
                            )}
                        </div>

                        {(loggedInAdminRole !== "MANAGER" || couponUnlocked) && (
                            <>

                        <motion.section
                            className="panel mt-6 overflow-x-auto"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="section-header p-6 pb-0 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="eyebrow">Coupons</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        Active Coupons
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => exportToCSV(coupons, "coupons_list", ["Code", "Discount", "Expiry", "Used"])}
                                        className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        📥 Export Excel
                                    </button>
                                    {selectedCoupons.length > 0 && (
                                        <div className="flex items-center gap-2">
                                         <select
                                             value={resetBlockLocation}
                                             onChange={(e) => setResetBlockLocation(e.target.value)}
                                             className="field text-xs font-bold py-1.5 px-3 text-slate-800 bg-white border border-slate-300 rounded-lg"
                                         >
                                             <option value="ALL">All Blocks (Global Reset)</option>
                                             {blocks.map(b => (
                                                 <option key={b.id} value={b.name}>{b.name}</option>
                                             ))}
                                         </select>
                                         <button
                                             onClick={resetStats}
                                             className="btn danger px-4 py-2 text-sm font-bold min-h-0 shrink-0"
                                         >
                                             Reset Stats
                                         </button>
                                     </div>
                                    )}
                                    {selectedCoupons.length > 0 && (
                                        <button
                                            onClick={handleBulkDeleteCoupons}
                                            className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            🗑️ Delete Selected ({selectedCoupons.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <table className="data-table mt-4">
                                <thead>
                                    <tr>
                                        <th className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={coupons.length > 0 && selectedCoupons.length === coupons.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCoupons(coupons.map(c => c.id));
                                                    } else {
                                                        setSelectedCoupons([]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded accent-slate-900"
                                            />
                                        </th>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Expiry</th>
                                        <th>Used</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((coupon, index) => (
                                        <motion.tr
                                            key={coupon.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCoupons.includes(coupon.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCoupons(prev => [...prev, coupon.id]);
                                                        } else {
                                                            setSelectedCoupons(prev => prev.filter(id => id !== coupon.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded accent-slate-900"
                                                />
                                            </td>
                                            <td className="font-black">
                                                {coupon.couponCode}
                                            </td>
                                            <td className="font-bold text-green-600">
                                                {coupon.discountPercentage}%
                                            </td>
                                            <td>
                                                {coupon.expiryDate}
                                            </td>
                                            <td>
                                                {coupon.usedCount} / {coupon.maxUses}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                    className="btn danger min-h-0 px-3 py-2 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {coupons.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center font-bold text-slate-500 py-6">
                                                No coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>

                        {/* Rewards / Voucher Generator — moved from Rewards Panel */}
                        <div className="grid gap-6 md:grid-cols-[1fr_1.3fr] mt-6">
                            <motion.section className="panel p-6" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Rewards Program</p>
                                        <h2 className="text-2xl font-black text-slate-900">Voucher Generator</h2>
                                    </div>
                                </div>
                                <form onSubmit={createReward} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Title</span>
                                        <input type="text" className="field" placeholder="e.g. Free Sign-up Bonus" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} required />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Description</span>
                                        <input type="text" className="field" placeholder="e.g. Earn Rs. 50 wallet credits instantly" value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} required />
                                    </label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Reward Value (Rs.)</span>
                                            <input type="number" className="field" placeholder="e.g. 50" value={rewardAmt} onChange={(e) => setRewardAmt(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Code (uppercase)</span>
                                            <input type="text" className="field uppercase tracking-wider font-mono" placeholder="e.g. BONUS50" value={rewardCode} onChange={(e) => setRewardCode(e.target.value)} required />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Max Claims allowed</span>
                                        <input type="number" className="field" value={rewardMaxClaims} onChange={(e) => setRewardMaxClaims(e.target.value)} required />
                                    </label>
                                    <button type="submit" className="btn success w-full mt-2" disabled={creatingReward}>
                                        {creatingReward ? "Creating Voucher..." : "Generate Reward Code"}
                                    </button>
                                </form>
                            </motion.section>

                            <motion.section className="panel p-6 overflow-x-auto" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Vouchers</p>
                                        <h2 className="text-2xl font-black text-slate-900">Vouchers List</h2>
                                    </div>
                                </div>
                                <table className="data-table w-full">
                                    <thead><tr><th>Code</th><th>Value</th><th>Claims</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {rewards.map(rew => (
                                            <tr key={rew.id}>
                                                <td className="font-mono font-black text-slate-900 tracking-wide uppercase">{rew.claimCode}</td>
                                                <td className="font-bold text-emerald-600">Rs. {rew.rewardAmount.toFixed(2)}</td>
                                                <td className="text-xs font-bold text-slate-500">{rew.claimedCount} / {rew.maxClaims}</td>
                                                <td>
                                                    <button onClick={() => toggleRewardActive(rew.id, rew.active)} className={`status-pill ${rew.active ? 'status-paid' : 'status-unpaid'}`} style={{ fontSize: '10px', minHeight: '22px' }}>
                                                        {rew.active ? "ACTIVE" : "INACTIVE"}
                                                    </button>
                                                </td>
                                                <td><button onClick={() => deleteReward(rew.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button></td>
                                            </tr>
                                        ))}
                                        {rewards.length === 0 && (<tr><td colSpan="5" className="text-center font-bold text-slate-500 py-6">No reward vouchers created yet.</td></tr>)}
                                    </tbody>
                                </table>
                            </motion.section>
                        </div>
                                {/* Referral configuration */}
                                <div className="grid gap-6 lg:grid-cols-2 mt-6">
                                    <motion.section
                                        className="panel p-6"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Referrals</p>
                                                <h2 className="text-2xl font-black text-slate-900">Refer & Earn Program</h2>
                                            </div>
                                        </div>
                                        <form onSubmit={saveSystemSettings} className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="refEnabled-rewards" 
                                                    checked={systemSettings.referralEnabled}
                                                    onChange={(e) => setSystemSettings({...systemSettings, referralEnabled: e.target.checked})}
                                                    className="w-4 h-4 accent-slate-900"
                                                />
                                                <label htmlFor="refEnabled-rewards" className="text-sm font-bold text-slate-700">Referral Program Active</label>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <label className="block">
                                                    <span className="block text-xs font-bold text-slate-500 mb-1">Referrer Reward (Rs.)</span>
                                                    <input 
                                                        type="number" 
                                                        className="field" 
                                                        value={systemSettings.referrerAmount}
                                                        onChange={(e) => setSystemSettings({...systemSettings, referrerAmount: Number(e.target.value)})}
                                                        step="0.5"
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="block text-xs font-bold text-slate-500 mb-1">Referee Reward (Rs.)</span>
                                                    <input 
                                                        type="number" 
                                                        className="field" 
                                                        value={systemSettings.refereeAmount}
                                                        onChange={(e) => setSystemSettings({...systemSettings, refereeAmount: Number(e.target.value)})}
                                                        step="0.5"
                                                    />
                                                </label>
                                            </div>
                                            <button type="submit" className="btn success w-full mt-4">Save Referral Settings</button>
                                        </form>
                                    </motion.section>
                                </div>
                                </>
                            )}
                    </>
                )}

                {/* Blocks Management Tab */}
                {activeTab === "blocks" && (
                    <div className="mt-6 space-y-6">


                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Add Block Panel */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Campus Locations</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add New Block</h2>
                                        <p className="subtitle">Create a new campus printing block that users can select on their location screen.</p>
                                    </div>
                                </div>
                                <form onSubmit={addBlock} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">Block Name</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. C Block, L Block, F Block"
                                            className="field"
                                            value={newBlockName}
                                            onChange={(e) => setNewBlockName(e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">College Name</span>
                                        {(loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") ? (
                                            <input
                                                type="text"
                                                className="field bg-slate-100 cursor-not-allowed"
                                                value={loggedInAdminCollege}
                                                readOnly
                                                disabled
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="e.g. KLU, UoH, etc."
                                                className="field"
                                                value={newBlockCollege}
                                                onChange={(e) => setNewBlockCollege(e.target.value)}
                                                required
                                            />
                                        )}
                                    </label>
                                    <button type="submit" className="btn success w-full">
                                        ➕ Add Block to College
                                    </button>
                                </form>

                                <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-100">
                                    <p className="text-xs font-black text-sky-700 uppercase tracking-wider mb-1">ℹ️ What happens when you add a block?</p>
                                    <ul className="text-xs text-sky-600 font-semibold space-y-1 mt-2">
                                        <li>• Block appears on the user location selection screen</li>
                                        <li>• Default pricing (BW: Rs.2, Color: Rs.5) is auto-initialized</li>
                                        <li>• You can configure prices in the Pricing & Coupons tab</li>
                                    </ul>
                                </div>
                            </motion.section>

                            {/* Blocks Stats */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Summary</p>
                                        <h2 className="text-2xl font-black text-slate-900">Block Overview</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
                                        <p className="text-xs font-bold text-slate-300">Total Blocks</p>
                                        <p className="text-4xl font-black mt-2">{blocks.length}</p>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 p-5 text-white">
                                        <p className="text-xs font-bold text-sky-200">Active Printers</p>
                                        <p className="text-4xl font-black mt-2">{printers.filter(p => p.online).length}</p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {blocks.map((b, idx) => {
                                        const defaultIcons = ["🏛️", "⚡", "📘", "🔬", "🎨", "🏗️"];
                                        const icon = defaultIcons[idx % defaultIcons.length];
                                        const printer = printers.find(p => p.blockLocation === b.name);
                                        return (
                                            <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{icon}</span>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{b.name}</p>
                                                        <p className="text-xs text-slate-400 font-semibold">{printer ? printer.printerName || "Printer assigned" : "No printer assigned"}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                                                    printer?.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                    {printer?.online ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {blocks.length === 0 && (
                                        <div className="text-center py-6 text-slate-400 font-bold text-sm">
                                            No blocks configured yet. Add one above.
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        </div>

                        {/* Block Management Table */}
                        <motion.section
                            className="panel p-6 overflow-x-auto"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="section-header pb-4">
                                <div>
                                    <p className="eyebrow">Block Directory</p>
                                    <h2 className="text-2xl font-black text-slate-900">All Campus Blocks</h2>
                                    <p className="subtitle">Rename or remove campus print locations. Deleting a block will deactivate its linked printer.</p>
                                </div>
                                <button
                                    onClick={fetchBlocks}
                                    className="btn secondary min-h-0 px-4 py-2 text-sm font-bold"
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                            <table className="data-table w-full">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Block ID</th>
                                        <th>Block Name</th>
                                        <th>Printer Status</th>
                                        <th>Paper Level</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((b, index) => {
                                        const printer = printers.find(p => p.blockLocation === b.name);
                                        const isLow = (printer?.paperCount || 0) < 50;
                                        return (
                                            <motion.tr
                                                key={b.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                            >
                                                <td className="font-bold text-slate-400">{index + 1}</td>
                                                <td className="font-mono font-black text-slate-500">#{b.id}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{["🏛️","⚡","📘","🔬","🎨","🏗️"][index % 6]}</span>
                                                        <span className="font-black text-slate-900 text-base">{b.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${
                                                        printer?.online ? "status-paid" : "status-unpaid"
                                                    }`}>
                                                        {printer ? (printer.online ? "ONLINE" : "OFFLINE") : "NO PRINTER"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {printer ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-bold ${
                                                                isLow ? "text-rose-500" : "text-slate-700"
                                                            }`}>
                                                                {printer.paperCount ?? 0}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-bold">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => renameBlock(b.id, b.name)}
                                                            className="btn secondary min-h-0 px-3 py-1.5 text-xs font-bold"
                                                        >
                                                            ✏️ Rename
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBlock(b.id)}
                                                            className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                    {blocks.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center font-bold text-slate-400 py-10">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-4xl">🏛️</span>
                                                    <span>No campus blocks configured. Add your first block above.</span>
                                                    <span className="text-xs text-slate-400">Tip: Start with "C Block", "L Block", "F Block"</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>
                    </div>
                )}

                {/* College Management Tab (Main Admin Only) */}
                {activeTab === "colleges" && (loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                    <div className="mt-6 space-y-6">
                        {/* Colleges Overview panel */}
                        <motion.section 
                            className="panel p-6"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="section-header pb-4 border-b border-slate-100">
                                <h3 className="font-bold text-lg">Manage All Colleges</h3>
                                <p className="text-sm text-slate-500 font-semibold mt-1">Suspend colleges, view their blocks, or delete entire colleges (which removes all associated blocks).</p>
                            </div>
                            
                            <div className="mt-6 flex flex-wrap gap-4">
                                {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => {
                                    const isSuspended = suspendedColleges.split(",").map(s => s.trim()).includes(col);
                                    const colBlocks = allBlocks.filter(b => b.college === col);
                                    return (
                                        <div key={col} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between items-start gap-4 flex-1 min-w-[280px]">
                                            <div className="w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-slate-900 text-xl">{col}</h4>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isSuspended ? 'SUSPENDED' : 'OPERATIONAL'}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-4 mb-4">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Associated Blocks ({colBlocks.length})</p>
                                                    <ul className="text-sm font-semibold text-slate-700 space-y-1 bg-white p-2 border border-slate-200 rounded-lg max-h-[120px] overflow-y-auto">
                                                        {colBlocks.map(cb => (
                                                            <li key={cb.id} className="flex justify-between border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                                                                <span>{cb.name}</span>
                                                            </li>
                                                        ))}
                                                        {colBlocks.length === 0 && <li className="text-slate-400">No blocks</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                            
                                            <div className="flex w-full gap-2 mt-auto">
                                                <button 
                                                    onClick={() => toggleCollegeSuspension(col)}
                                                    className={`btn text-xs py-2 flex-1 ${isSuspended ? 'secondary' : 'warning'}`}
                                                >
                                                    {isSuspended ? 'Resume' : 'Suspend'}
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm(`Are you sure you want to DELETE the college "${col}" and ALL its ${colBlocks.length} blocks? This cannot be undone.`)) {
                                                            try {
                                                                // Delete all blocks for this college
                                                                for (const block of colBlocks) {
                                                                    await api.delete(`/blocks/delete/${block.id}`);
                                                                }
                                                                fetchBlocks();
                                                                // Remove from suspended colleges if it was there
                                                                if (isSuspended) {
                                                                    toggleCollegeSuspension(col);
                                                                }
                                                                alert(`${col} and all its blocks have been deleted.`);
                                                            } catch (err) {
                                                                alert("Error deleting some blocks.");
                                                            }
                                                        }
                                                    }}
                                                    className="btn danger text-xs py-2 flex-1"
                                                >
                                                    Delete College
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const existing = collegeConfigs.find(c => c.collegeName === col);
                                                    setConfigKeyId(existing?.razorpayKeyId || "");
                                                    setConfigKeySecret(existing?.razorpayKeySecret || "");
                                                    setPaymentConfigModal(col);
                                                }}
                                                className="btn primary text-xs py-2 w-full mt-2"
                                            >
                                                Configure Payment Gateway
                                            </button>
                                        </div>
                                    );
                                })}
                                {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).length === 0 && (
                                    <div className="text-sm font-bold text-slate-400 py-4">No colleges found in the system.</div>
                                )}
                            </div>
                        </motion.section>

                        <motion.section 
                            className="panel p-6"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="section-header pb-4 border-b border-slate-100 mb-4">
                                <h3 className="font-bold text-lg">Add New College</h3>
                                <p className="text-sm text-slate-500 font-semibold mt-1">A college requires at least one block to be created. This will create the new college and its first block.</p>
                            </div>
                            <form onSubmit={addBlock} className="space-y-4 max-w-lg">
                                <label className="block">
                                    <span className="block text-sm font-black text-slate-700 mb-2">New College Name</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Stanford University"
                                        className="field"
                                        value={newBlockCollege}
                                        onChange={(e) => setNewBlockCollege(e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-sm font-black text-slate-700 mb-2">First Block Name</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Main Campus Block"
                                        className="field"
                                        value={newBlockName}
                                        onChange={(e) => setNewBlockName(e.target.value)}
                                        required
                                    />
                                </label>
                                <button type="submit" className="btn success w-full">
                                    ➕ Create College & Block
                                </button>
                            </form>
                        </motion.section>
                    </div>
                )}

                {/* User Moderation Tab */}
                {activeTab === "users" && (
                    <motion.section
                        className="panel mt-6 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <p className="eyebrow">Moderation</p>
                                <h2 className="text-2xl font-black text-slate-900">Registered Users</h2>
                                <p className="subtitle">Manage user accounts, block access, or remove accounts.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="relative mr-2">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        className="field !w-auto text-xs py-2 px-3 pl-8 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                </div>
                                {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <span className="text-xs font-bold text-slate-500">College:</span>
                                        <select
                                            value={userCollegeFilter}
                                            onChange={(e) => setUserCollegeFilter(e.target.value)}
                                            className="field !w-auto text-xs py-2 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                        >
                                            <option value="ALL">All Colleges</option>
                                            {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => (
                                                <option key={col} value={col}>{col} College</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button
                                    onClick={() => exportToCSV(users, "registered_users", ["User ID", "Name", "Email", "College", "Orders", "Referral Code", "Wallet Balance", "Status"])}
                                    className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                >
                                    📥 Export Excel
                                </button>
                                {selectedUsers.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => handleBulkBlockUsers(true)}
                                            className="btn warning px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            ⛔ Block Selected ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={() => handleBulkBlockUsers(false)}
                                            className="btn success px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            ✅ Unblock Selected ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={handleBulkDeleteUsers}
                                            className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            🗑️ Delete Selected ({selectedUsers.length})
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <table className="data-table mt-4 w-full">
                            <thead>
                                <tr>
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={users.length > 0 && selectedUsers.length === users.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers(users.map(u => u.id));
                                                } else {
                                                    setSelectedUsers([]);
                                                }
                                            }}
                                            className="w-4 h-4 rounded accent-slate-900"
                                        />
                                    </th>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>College</th>
                                    <th>Orders</th>
                                    <th>Referral Code</th>
                                    <th>Wallet Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers(prev => [...prev, user.id]);
                                                    } else {
                                                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded accent-slate-900"
                                            />
                                        </td>
                                        <td className="font-black">#{user.id}</td>
                                        <td className="font-bold text-slate-900">{user.name}</td>
                                        <td className="font-semibold text-slate-600">{user.email}</td>
                                        <td className="font-bold text-slate-700">{user.college || "KLU"}</td>
                                        <td className="font-bold text-slate-700">{allOrders.filter(o => o.email === user.email).length}</td>
                                        <td className="font-mono text-cyan-600 font-bold">{user.referralCode || "N/A"}</td>
                                        <td className="font-bold text-green-600">Rs. {user.walletBalance != null ? user.walletBalance.toFixed(2) : "0.00"}</td>
                                        <td>
                                            <span className={`status-pill ${user.blocked ? "status-unpaid" : "status-paid"}`}>
                                                {user.blocked ? "BLOCKED" : "ACTIVE"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleBlockUser(user.id)}
                                                    className={`btn min-h-0 px-3 py-1.5 text-xs font-bold ${user.blocked ? "success" : "warning"}`}
                                                >
                                                    {user.blocked ? "Unblock" : "Block"}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center font-bold text-slate-500 py-6">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Support Tickets Tab */}
                {activeTab === "support" && (
                    <motion.section
                        className="panel mt-6 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4">
                            <div>
                                <p className="eyebrow">Support Desk</p>
                                <h2 className="text-2xl font-black text-slate-900">Customer Support Tickets</h2>
                                <p className="subtitle">View customer issues, resolve tickets, or remove them.</p>
                            </div>
                        </div>

                        <table className="data-table mt-4 w-full">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Message</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supportTickets.map((ticket, index) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td className="font-black">#{ticket.id}</td>
                                        <td className="font-bold text-slate-900">{ticket.name}</td>
                                        <td className="font-semibold text-slate-600">{ticket.email}</td>
                                        <td className="max-w-[350px] whitespace-pre-wrap text-slate-700 text-sm font-medium">
                                            {ticket.message}
                                        </td>
                                        <td className="text-xs text-slate-500 font-bold">
                                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${ticket.status === "PENDING" ? "status-unpaid" : "status-completed"}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {ticket.status === "PENDING" && (
                                                    <button
                                                        onClick={() => resolveSupportTicket(ticket.id)}
                                                        className="btn success min-h-0 px-3 py-1.5 text-xs font-bold"
                                                    >
                                                        Mark as Done
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteSupportTicket(ticket.id)}
                                                    className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {supportTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center font-bold text-slate-500 py-6">
                                            No support tickets found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Frontend Manager Tab */}
                {activeTab === "frontend" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Popup and Scrolling configurations */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Marketing Config</p>
                                        <h2 className="text-2xl font-black text-slate-900">Popups & Scrolling Marquees</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="flex items-center gap-2 pt-2 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="popupEnabled" 
                                            checked={systemSettings.popupEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, popupEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="popupEnabled" className="text-sm font-bold text-slate-700">Welcome Referral Popup Enabled</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Welcome Popup Message</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            value={systemSettings.popupMessage}
                                            onChange={(e) => setSystemSettings({...systemSettings, popupMessage: e.target.value})}
                                        />
                                    </label>
                                    <div className="flex items-center gap-2 pt-4 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="adEnabled" 
                                            checked={systemSettings.adEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, adEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="adEnabled" className="text-sm font-bold text-slate-700">Scrolling Announcement Active</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Scrolling Announcement Text</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            value={systemSettings.adText}
                                            onChange={(e) => setSystemSettings({...systemSettings, adText: e.target.value})}
                                        />
                                    </label>
                                    
                                    <div className="flex items-center gap-2 pt-4 pb-2 border-t border-slate-100">
                                        <input 
                                            type="checkbox" 
                                            id="generalPopupEnabled" 
                                            checked={systemSettings.generalPopupEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, generalPopupEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="generalPopupEnabled" className="text-sm font-bold text-slate-700">General Announcement Popup Enabled</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">General Announcement Popup Message</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            placeholder="Write an announcement to show to all users on their dashboard..."
                                            value={systemSettings.generalPopupMessage}
                                            onChange={(e) => setSystemSettings({...systemSettings, generalPopupMessage: e.target.value})}
                                        />
                                    </label>

                                    <button type="submit" className="btn success w-full mt-2">Save Marketing Config</button>
                                </form>
                            </motion.section>

                            {/* Section Creator panel */}
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Layout Sections</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Frontend Section</h2>
                                    </div>
                                </div>
                                <form onSubmit={addSection} className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Title</span>
                                            <input type="text" className="field" placeholder="Section title" value={secTitle} onChange={(e) => setSecTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Section Type</span>
                                            <select className="field" value={secType} onChange={(e) => setSecType(e.target.value)}>
                                                <option value="ADVERTISING">Advertising</option>
                                                <option value="NEW_BLOCK">New Block Info</option>
                                                <option value="FEATURE">Feature Announcement</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Display Order (weight)</span>
                                            <input type="number" className="field" value={secOrder} onChange={(e) => setSecOrder(e.target.value)} />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Redirect Link (optional)</span>
                                            <input type="text" className="field" placeholder="https://google.com or path" value={secRedirect} onChange={(e) => setSecRedirect(e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Content / Announcement Message</span>
                                        <textarea className="field min-h-[90px]" placeholder="Write description or announcement content details..." value={secContent} onChange={(e) => setSecContent(e.target.value)} required />
                                    </label>
                                    <button type="submit" className="btn w-full">Add Frontend Section</button>
                                </form>
                            </motion.section>
                        </div>

                        {/* Layout Sections table */}
                        <motion.section 
                            className="panel p-6 overflow-x-auto"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="section-header mb-4">
                                <div>
                                    <p className="eyebrow">Layout Banners</p>
                                    <h2 className="text-2xl font-black text-slate-900">Custom Frontend Sections</h2>
                                </div>
                            </div>
                            <table className="data-table w-full">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Content</th>
                                        <th>Order</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map(sec => (
                                        <tr key={sec.id}>
                                            <td className="font-black text-slate-900">{sec.title}</td>
                                            <td>
                                                <span className={`status-pill ${
                                                    sec.sectionType === 'ADVERTISING' ? 'status-paid' : sec.sectionType === 'NEW_BLOCK' ? 'status-completed' : 'status-created'
                                                }`} style={{ fontSize: '10px', minHeight: '22px' }}>
                                                    {sec.sectionType}
                                                </span>
                                            </td>
                                            <td className="max-w-xs truncate text-xs font-semibold text-slate-500">{sec.content}</td>
                                            <td className="font-bold">{sec.displayOrder}</td>
                                            <td>
                                                <button 
                                                    onClick={() => toggleSectionStatus(sec.id, sec.active)}
                                                    className={`status-pill ${sec.active ? 'status-paid' : 'status-unpaid'}`}
                                                    style={{ fontSize: '10px', minHeight: '22px' }}
                                                >
                                                    {sec.active ? "ACTIVE" : "INACTIVE"}
                                                </button>
                                            </td>
                                            <td>
                                                <button onClick={() => deleteSection(sec.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sections.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center font-bold text-slate-500 py-6">No custom sections defined. Create one above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>

                        {/* Custom Popups Management Area */}
                        <div className="grid gap-6 lg:grid-cols-2 pt-6 border-t border-slate-200/60">
                            {/* Create Popup Form */}
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Popup Manager</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Custom Popup</h2>
                                    </div>
                                </div>
                                <form onSubmit={addPopup} className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Title</span>
                                            <input type="text" className="field" placeholder="Popup Title" value={popTitle} onChange={(e) => setPopTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Target Page</span>
                                            <select className="field" value={popTarget} onChange={(e) => setPopTarget(e.target.value)}>
                                                <option value="ALL">All Pages</option>
                                                <option value="LOGIN">Login Page</option>
                                                <option value="LOCATION_SELECTION">Location Selection</option>
                                                <option value="DASHBOARD">User Dashboard</option>
                                                <option value="CHECKOUT">Checkout Page</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Popup Message</span>
                                        <textarea className="field min-h-[90px]" placeholder="Write popup message/content..." value={popMessage} onChange={(e) => setPopMessage(e.target.value)} required />
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="popDismissible" 
                                                checked={popDismissible}
                                                onChange={(e) => setPopDismissible(e.target.checked)}
                                                className="w-4 h-4 accent-slate-900"
                                            />
                                            <label htmlFor="popDismissible" className="text-sm font-bold text-slate-700">Dismissible (User can close)</label>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="popActive" 
                                                checked={popActive}
                                                onChange={(e) => setPopActive(e.target.checked)}
                                                className="w-4 h-4 accent-slate-900"
                                            />
                                            <label htmlFor="popActive" className="text-sm font-bold text-slate-700">Active Immediately</label>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn w-full">Create Popup</button>
                                </form>
                            </motion.section>

                            {/* Custom Popups List */}
                            <motion.section 
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Manage Popups</h2>
                                    </div>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Page</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popups.map(pop => (
                                            <tr key={pop.id}>
                                                <td className="font-black text-slate-900">{pop.title}</td>
                                                <td>
                                                    <span className="status-pill status-created" style={{ fontSize: '10px', minHeight: '22px' }}>
                                                        {pop.targetPage}
                                                    </span>
                                                </td>
                                                <td className="max-w-xs truncate text-xs font-semibold text-slate-500">{pop.message}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => togglePopupStatus(pop.id, pop.active)}
                                                        className={`status-pill ${pop.active ? 'status-paid' : 'status-unpaid'}`}
                                                        style={{ fontSize: '10px', minHeight: '22px' }}
                                                    >
                                                        {pop.active ? "ACTIVE" : "INACTIVE"}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button onClick={() => deletePopup(pop.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {popups.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-6">No custom popups created yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* System Config Tab */}
                {activeTab === "system" && (
                    <div className="mt-6 space-y-6">
                        {/* Connection status looping video */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">System Gateway Check</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1">Live background ping check monitoring all database, API routes, and local print agents.</p>
                            </div>
                            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Referral configuration */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Referrals</p>
                                        <h2 className="text-2xl font-black text-slate-900">Refer & Earn Program</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="refEnabled" 
                                            checked={systemSettings.referralEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, referralEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="refEnabled" className="text-sm font-bold text-slate-700">Referral Program Active</label>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Referrer Reward (Rs.)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.referrerAmount}
                                                onChange={(e) => setSystemSettings({...systemSettings, referrerAmount: Number(e.target.value)})}
                                                step="0.5"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Referee Reward (Rs.)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.refereeAmount}
                                                onChange={(e) => setSystemSettings({...systemSettings, refereeAmount: Number(e.target.value)})}
                                                step="0.5"
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full mt-4">Save Referral Settings</button>
                                </form>
                            </motion.section>

                            {/* Thesis configuration */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.03 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Thesis & Bulk Prints</p>
                                        <h2 className="text-2xl font-black text-slate-900">Bulk Discount Rules</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Threshold (Pages)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.thesisDiscountPages || 50}
                                                onChange={(e) => setSystemSettings({...systemSettings, thesisDiscountPages: Number(e.target.value)})}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Discount Percentage (%)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.thesisDiscountPercent || 15}
                                                onChange={(e) => setSystemSettings({...systemSettings, thesisDiscountPercent: Number(e.target.value)})}
                                                step="0.5"
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full mt-4">Save Bulk Print Settings</button>
                                </form>
                            </motion.section>

                            {/* Global App Settings */}
                            {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.035 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Platform Settings</p>
                                        <h2 className="text-2xl font-black text-slate-900">Global Config</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Razorpay/UPI Charge (%)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.razorpayChargePercentage || 2.36}
                                                onChange={(e) => setSystemSettings({...systemSettings, razorpayChargePercentage: Number(e.target.value)})}
                                                step="0.01"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Manager Max B&W Printers</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.managerMaxBwPrinters || 1}
                                                onChange={(e) => setSystemSettings({...systemSettings, managerMaxBwPrinters: Number(e.target.value)})}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Manager Max Color Printers</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.managerMaxColorPrinters || 1}
                                                onChange={(e) => setSystemSettings({...systemSettings, managerMaxColorPrinters: Number(e.target.value)})}
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full mt-4">Save Platform Settings</button>
                                </form>
                            </motion.section>
                            )}


                            {/* Off-Peak Hour Settings */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Off-Peak Printing</p>
                                        <h2 className="text-2xl font-black text-slate-900">Off-Peak Hour Settings</h2>
                                        <p className="subtitle">Discounted rates during low-traffic windows. Toggle to enable or disable the program.</p>
                                    </div>
                                    
                                    {/* College Selector for Main Admin */}
                                    {(loggedInAdminRole !== "SUB_ADMIN" || loggedInAdminUser === "admin") ? (
                                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                            <span className="text-xs font-bold text-slate-500">Configure College:</span>
                                            <select
                                                value={offpeakCollege}
                                                onChange={(e) => {
                                                    setOffpeakCollege(e.target.value);
                                                    fetchCollegeOffpeakSettings(e.target.value);
                                                }}
                                                className="field !w-auto text-xs py-2 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                            >
                                                <option value="ALL" disabled>Select a College</option>
                                                {Array.from(new Set(blocks.map(b => b.college).filter(Boolean))).map(col => (
                                                    <option key={col} value={col}>{col} College</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                            <span className="text-xs font-bold text-slate-500">College:</span>
                                            <span className="text-xs font-black px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                {offpeakCollege}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={saveCollegeOffpeakSettings} className="space-y-4">

                                    {/* Enable / Disable toggle */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                        collegeOffpeakSettings.offpeakEnabled
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                    }`}>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">Off-Peak Discount Program ({offpeakCollege})</p>
                                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                {collegeOffpeakSettings.offpeakEnabled ? "✅ Currently Active — discounts are being applied" : "⏸️ Currently Disabled — no discount applied"}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={collegeOffpeakSettings.offpeakEnabled || false}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakEnabled: e.target.checked})}
                                            />
                                            <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>

                                    {/* Live time preview */}
                                    {collegeOffpeakSettings.offpeakEnabled && (
                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                                            <p className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2">⏰ Active Discount Windows</p>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                                                    🌙 Night: {(() => { const h = collegeOffpeakSettings.offpeakStartHour ?? 21; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                    {" → "}
                                                    {(() => { const h = collegeOffpeakSettings.offpeakEndHour ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                                                    🌅 Morning: {(() => { const h = collegeOffpeakSettings.offpeakMorningStart ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                    {" → "}
                                                    {(() => { const h = collegeOffpeakSettings.offpeakMorningEnd ?? 9; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                                    🏷️ Discount: {collegeOffpeakSettings.offpeakDiscountPercent ?? 15}% OFF
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌙 Night Window — Start Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings.offpeakStartHour !== undefined ? collegeOffpeakSettings.offpeakStartHour : 21}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakStartHour: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings.offpeakStartHour ?? 21; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌙 Night Window — End Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings.offpeakEndHour !== undefined ? collegeOffpeakSettings.offpeakEndHour : 7}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakEndHour: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings.offpeakEndHour ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌅 Morning Window — Start Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings.offpeakMorningStart !== undefined ? collegeOffpeakSettings.offpeakMorningStart : 7}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakMorningStart: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings.offpeakMorningStart ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌅 Morning Window — End Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings.offpeakMorningEnd !== undefined ? collegeOffpeakSettings.offpeakMorningEnd : 9}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakMorningEnd: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings.offpeakMorningEnd ?? 9; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Discount Percentage (%)</span>
                                        <input 
                                            type="number" 
                                            className="field" 
                                            value={collegeOffpeakSettings.offpeakDiscountPercent !== undefined ? collegeOffpeakSettings.offpeakDiscountPercent : 15}
                                            onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakDiscountPercent: Number(e.target.value)})}
                                            step="0.5"
                                        />
                                    </label>
                                    <button type="submit" className="btn success w-full mt-2">Save Off-Peak settings</button>
                                </form>
                            </motion.section>

                            <div className="space-y-6">
                                {/* Dynamic Block Creator - only show for main admin in system tab */}
                                {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                <motion.section 
                                    className="panel p-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <div className="section-header mb-4">
                                        <div>
                                            <p className="eyebrow">Campus Blocks</p>
                                            <h2 className="text-2xl font-black text-slate-900">Add Printing Block</h2>
                                        </div>
                                    </div>
                                    <form onSubmit={addBlock} className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Block name (e.g. D Block)" 
                                            className="field"
                                            value={newBlockName}
                                            onChange={(e) => setNewBlockName(e.target.value)}
                                            required
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="College name (e.g. KLU)" 
                                            className="field"
                                            value={newBlockCollege}
                                            onChange={(e) => setNewBlockCollege(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="btn w-full">Add Block</button>
                                    </form>
                                </motion.section>
                                )}

                                {/* Printers paper count refills */}
                                <motion.section 
                                    className="panel p-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="section-header mb-4">
                                        <div>
                                            <p className="eyebrow">Printers</p>
                                            <h2 className="text-2xl font-black text-slate-900">Printer Paper Levels</h2>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {printers.map(p => {
                                            const currentPaper = printerPapers[p.blockLocation] != null ? printerPapers[p.blockLocation] : 0;
                                            return (
                                                <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-black text-slate-900">{p.blockLocation}</p>
                                                        <p className="text-xs font-bold text-slate-400">{p.printerName || "Not configured"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="number" 
                                                            className="field w-24 text-center font-bold" 
                                                            key={currentPaper}
                                                            defaultValue={currentPaper}
                                                            id={`paper-${p.blockLocation}`}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const count = Number(document.getElementById(`paper-${p.blockLocation}`).value || 0);
                                                                updatePrinterPaper(p.blockLocation, count);
                                                            }}
                                                            className="btn secondary min-h-0 px-3 py-1.5 text-xs"
                                                        >
                                                            Refill
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {printers.length === 0 && (
                                            <p className="text-sm font-bold text-slate-500 text-center py-4">No printer configurations found. Configure them in Printer Settings.</p>
                                        )}
                                    </div>
                                </motion.section>

                                {/* Tester Mode Controls */}
                                {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                <motion.section 
                                    className="panel p-6 border border-purple-500/20 bg-purple-500/5 mt-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <div className="section-header mb-4">
                                        <div>
                                            <p className="eyebrow text-purple-700">Tester Mode Controls</p>
                                            <h2 className="text-2xl font-black text-purple-950">Tester Mode Access</h2>
                                        </div>
                                    </div>
                                    <form onSubmit={saveSystemSettings} className="space-y-4">
                                        <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
                                            <div>
                                                <p className="font-black text-purple-950 text-sm">Enable Tester Access</p>
                                                <p className="text-xs text-purple-700/60 font-semibold mt-0.5">
                                                    Allow designated testers to place prints for free.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={systemSettings.testerModeEnabled || false}
                                                    onChange={(e) => setSystemSettings({...systemSettings, testerModeEnabled: e.target.checked})}
                                                />
                                                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>

                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Tester Usernames / Emails (Comma Separated)</span>
                                            <textarea 
                                                className="field min-h-[70px] border-slate-200 focus:border-purple-600 font-bold" 
                                                placeholder="e.g. tester1, tester2, test@gmail.com" 
                                                value={systemSettings.testerUsernames || ""} 
                                                onChange={(e) => setSystemSettings({...systemSettings, testerUsernames: e.target.value})}
                                                disabled={!systemSettings.testerModeEnabled}
                                            />
                                        </label>
                                        
                                        <button type="submit" className="btn bg-purple-600 hover:bg-purple-500 text-white w-full mt-2 font-black text-xs uppercase tracking-wider">Save Tester settings</button>
                                    </form>
                                </motion.section>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Printers Management Tab */}
                {activeTab === "printers" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Add Printer Form */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Printers</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add New Printer</h2>
                                    </div>
                                </div>
                                <form onSubmit={addPrinter} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">Block Location</span>
                                        <select
                                            className="field"
                                            value={newPrinterBlock}
                                            onChange={(e) => setNewPrinterBlock(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select Block</option>
                                            {displayBlocks.map(b => (
                                                <option key={b.id} value={b.name}>{b.name} ({b.college || "KLU"})</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">Printer Name (Windows printer name)</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. Laser Jet Pro"
                                            className="field"
                                            value={newPrinterName}
                                            onChange={(e) => setNewPrinterName(e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">Printer IP / USB</span>
                                        <input
                                            type="text"
                                            placeholder="Printer IP (optional)"
                                            className="field"
                                            value={newPrinterIp}
                                            onChange={(e) => setNewPrinterIp(e.target.value)}
                                        />
                                    </label>
                                    
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-sm font-black text-slate-700 mb-2">Operation Status</span>
                                            <select className="field cursor-pointer" value={newPrinterActive} onChange={(e) => setNewPrinterActive(e.target.value === "true")}>
                                                <option value="true">Active (Online & Ready)</option>
                                                <option value="false">Offline</option>
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="block text-sm font-black text-slate-700 mb-2">Maintenance Status</span>
                                            <select className="field cursor-pointer" value={newPrinterMaintenance} onChange={(e) => setNewPrinterMaintenance(e.target.value === "true")}>
                                                <option value="false">Normal Operation</option>
                                                <option value="true">Under Maintenance</option>
                                            </select>
                                        </label>
                                    </div>
                                    
                                    <label className="block">
                                        <span className="block text-sm font-black text-slate-700 mb-2">Supported Output Type</span>
                                        <select className="field cursor-pointer" value={newPrinterColor} onChange={(e) => setNewPrinterColor(e.target.value === "true")}>
                                            <option value="false">Black & White Only 📄</option>
                                            <option value="true">Color 🎨</option>
                                        </select>
                                    </label>
                                    
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-sm font-black text-slate-700 mb-2">QR Scan Flow</span>
                                            <select className="field cursor-pointer" value={newPrinterQrScan} onChange={(e) => setNewPrinterQrScan(e.target.value === "true")}>
                                                <option value="false">Direct Printing</option>
                                                <option value="true">QR Scan Required</option>
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="block text-sm font-black text-slate-700 mb-2">OTP Release flow</span>
                                            <select className="field cursor-pointer" value={newPrinterOtp} onChange={(e) => setNewPrinterOtp(e.target.value === "true")}>
                                                <option value="true">OTP Required 🔑</option>
                                                <option value="false">No OTP Required</option>
                                            </select>
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full">Create Printer</button>
                                </form>
                            </motion.section>

                            {/* Printers List */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header mb-4 flex flex-wrap justify-between items-center gap-4">
                                    <h3 className="font-bold text-lg">Active Printers</h3>
                                </div>
                                <ul className="space-y-3">
                                    {getRoleFilteredPrinters().map(p => (
                                          <li key={p.id} className="p-4 border rounded-xl flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow border-slate-200">
                                              <div className="flex items-start justify-between">
                                                  <div>
                                                      <div className="flex items-center gap-2 mb-1">
                                                          <h4 className="font-black text-slate-900 text-lg leading-none">{p.printerName}</h4>
                                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">{p.blockLocation}</span>
                                                          {p.colourSupported && (
                                                              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">Color</span>
                                                          )}
                                                      </div>
                                                      <p className="text-xs font-bold text-slate-500 font-mono mt-1">{p.printerIp || "No IP Configured"}</p>
                                                  </div>
                                                  <div className="flex flex-col items-end gap-1">
                                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider w-24 text-center ${p.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                                          {p.active ? 'Active' : 'Inactive'}
                                                      </span>
                                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider w-24 text-center ${p.maintenance ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-sky-100 text-sky-700 border border-sky-200'}`}>
                                                          {p.maintenance ? 'Maintenance' : 'Online'}
                                                      </span>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                                  <div>
                                                      <button 
                                                          onClick={() => togglePrinterMaintenance(p)}
                                                          className={`btn min-h-0 px-3 py-1.5 text-xs font-bold ${p.maintenance ? 'success' : 'secondary'}`}
                                                      >
                                                          🛠 {p.maintenance ? "Set Online" : "Set Maintenance"}
                                                      </button>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                                                          <div className="px-2 bg-slate-100 text-xs font-bold text-slate-500 border-r border-slate-200 h-full flex items-center">
                                                              📄
                                                          </div>
                                                          <input 
                                                              type="number" 
                                                              className="w-16 text-center font-bold px-2 text-xs bg-transparent outline-none h-full" 
                                                              key={p.paperCount}
                                                              defaultValue={p.paperCount}
                                                              id={`manage-paper-${p.blockLocation}`}
                                                          />
                                                      </div>
                                                      <button 
                                                          onClick={() => {
                                                              const inputEl = document.getElementById(`manage-paper-${p.blockLocation}`);
                                                              if(inputEl) {
                                                                  const count = Number(inputEl.value || 0);
                                                                  updatePrinterPaper(p.blockLocation, count);
                                                              }
                                                          }}
                                                          className="btn secondary min-h-0 px-3 py-1.5 text-xs font-bold h-8"
                                                      >
                                                          Refill
                                                      </button>
                                                      
                                                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                                      
                                                      <button 
                                                          onClick={() => {
                                                              if (window.confirm(`Are you sure you want to delete ${p.printerName}?`)) {
                                                                  deletePrinter(p.id);
                                                              }
                                                          }}
                                                          className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold h-8"
                                                      >
                                                          🗑️
                                                      </button>
                                                  </div>
                                              </div>
                                          </li>
                                    ))}
                                    {getRoleFilteredPrinters().length === 0 && (
                                        <li className="text-sm font-bold text-slate-500 text-center py-4">No printers found.</li>
                                    )}
                                </ul>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* Notifications Management Tab */}
                {activeTab === "notifications" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Create Notification Form */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Campus Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Create Notification</h2>
                                        <p className="subtitle">Send a campus notification to users of a specific college or all colleges.</p>
                                    </div>
                                </div>
                                <form onSubmit={createNotification} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Title</span>
                                        <input type="text" className="field" placeholder="Notification title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} required />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Message</span>
                                        <textarea className="field min-h-[90px]" placeholder="Write notification message..." value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} required />
                                    </label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Type</span>
                                            <select className="field" value={notifType} onChange={(e) => setNotifType(e.target.value)}>
                                                <option value="INFO">ℹ️ Info</option>
                                                <option value="ALERT">🚨 Alert</option>
                                                <option value="ANNOUNCEMENT">📢 Announcement</option>
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Target College</span>
                                            {(loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") ? (
                                                <input type="text" className="field bg-slate-100 cursor-not-allowed" value={loggedInAdminCollege} readOnly disabled />
                                            ) : (
                                                <select className="field" value={notifCollege} onChange={(e) => setNotifCollege(e.target.value)}>
                                                    <option value="ALL">All Colleges</option>
                                                    <option value="KLU">KLU</option>
                                                    <option value="UoH">UoH</option>
                                                    <option value="VIT">VIT</option>
                                                    <option value="SRM">SRM</option>
                                                </select>
                                            )}
                                        </label>
                                    </div>
                                    <button type="submit" className="btn w-full">📢 Publish Notification</button>
                                </form>
                            </motion.section>

                            {/* Notifications List */}
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Published Notifications</h2>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {notifications
                                        .filter(n => {
                                            if (loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") {
                                                return n.college === loggedInAdminCollege || n.college === "ALL";
                                            }
                                            return true;
                                        })
                                        .map((notif) => (
                                        <div key={notif.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-slate-900 text-sm">{notif.title}</p>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{notif.type || 'INFO'}</span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{notif.college || 'ALL'}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{notif.message}</p>
                                            </div>
                                            <button onClick={() => deleteNotification(notif.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold shrink-0">Delete</button>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 font-bold text-sm">No notifications published yet. Create one above.</div>
                                    )}
                                </div>
                            </motion.section>
                        </div>
                    </div>
                )}



                {/* SQL Terminal Tab — Main Admin only */}
                {activeTab === "sql" && (loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                    <motion.section 
                        className="panel mt-6 p-6"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4">
                            <div>
                                <p className="eyebrow">Database Console</p>
                                <h2 className="text-2xl font-black text-slate-900">SQL Execution Console</h2>
                                <p className="subtitle">Execute raw database queries directly. SELECT queries will display output tables, while update statements report rows affected.</p>
                            </div>
                        </div>

                        <form onSubmit={runSqlQuery} className="space-y-4">
                            <textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                className="field font-mono text-sm leading-relaxed min-h-[140px] bg-slate-950 text-cyan-400 border-slate-800 p-4 focus:ring-4 focus:ring-cyan-950"
                                placeholder="SELECT * FROM users;"
                            />
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleDownloadBackup} 
                                    className="btn secondary min-h-0 font-bold px-6 py-2.5"
                                >
                                    📥 Backup Database (SQL)
                                </button>
                                <button type="submit" className="btn warning min-h-0 font-bold px-6 py-2.5" disabled={sqlExecuting}>
                                    {sqlExecuting ? "Executing query..." : "Execute Statement"}
                                </button>
                            </div>
                        </form>

                        {/* Error output */}
                        {sqlError && (
                            <div className="mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-mono whitespace-pre-wrap">
                                ⚠️ {sqlError}
                            </div>
                        )}

                        {/* Results output */}
                        {sqlResult && (
                            <div className="mt-6 border-t border-slate-100 pt-6">
                                <h3 className="text-lg font-black text-slate-900 mb-4">Query Execution Result</h3>
                                
                                {Array.isArray(sqlResult) ? (
                                    sqlResult.length > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                                            <table className="data-table w-full text-xs font-mono">
                                                <thead>
                                                    <tr>
                                                        {Object.keys(sqlResult[0]).map(col => (
                                                            <th key={col} className="bg-slate-100 text-slate-700 p-3 border-b border-slate-200 text-left font-black tracking-wider">{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sqlResult.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-100/80 transition-colors">
                                                            {Object.values(row).map((val, cIdx) => (
                                                                <td key={cIdx} className="p-3 border-b border-slate-200 text-slate-800 font-medium">
                                                                    {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 font-bold text-center py-6 border border-slate-100 rounded-xl bg-slate-50">
                                            Query completed successfully. Empty result set (0 rows returned).
                                        </div>
                                    )
                                ) : (
                                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold">
                                        ✓ {sqlResult.message || `Query succeeded. Rows affected: ${sqlResult.rowsAffected}`}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>
                )}

                {/* Manage Staff Tab */}
                {activeTab === "subadmins" && loggedInAdminRole !== "MANAGER" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
                            {/* Create Staff Form */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, x: -18 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Access Management</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Staff Account</h2>
                                        <p className="subtitle">Provision a sub-admin or manager with dedicated credentials.</p>
                                    </div>
                                </div>
                                <form onSubmit={createSubAdmin} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Username / Email</span>
                                        <input 
                                            type="text" 
                                            className="field" 
                                            placeholder="e.g. kluadmin" 
                                            value={newSubAdminUsername} 
                                            onChange={(e) => setNewSubAdminUsername(e.target.value)} 
                                            required 
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Choose Password</span>
                                        <input 
                                            type="password" 
                                            className="field" 
                                            placeholder="Min 6 characters" 
                                            value={newSubAdminPassword} 
                                            onChange={(e) => setNewSubAdminPassword(e.target.value)} 
                                            required 
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Role</span>
                                        <select
                                            value={newAdminRole}
                                            onChange={(e) => setNewAdminRole(e.target.value)}
                                            className="field cursor-pointer"
                                            disabled={loggedInAdminRole !== "MAIN_ADMIN" && loggedInAdminUser !== "admin"}
                                        >
                                            {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                                                <option value="SUB_ADMIN">Sub-Admin</option>
                                            )}
                                            <option value="MANAGER">Manager</option>
                                        </select>
                                    </label>
                                    {newAdminRole === "MANAGER" && (
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Coupons Secret Key</span>
                                            <input 
                                                type="text" 
                                                className="field" 
                                                placeholder="e.g. SECRET123" 
                                                value={newManagerSecret} 
                                                onChange={(e) => setNewManagerSecret(e.target.value)} 
                                                required 
                                            />
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Assign College / Campus</span>
                                        {(loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") ? (
                                            <input 
                                                type="text" 
                                                className="field bg-slate-100 cursor-not-allowed" 
                                                value={loggedInAdminCollege} 
                                                readOnly 
                                                disabled 
                                            />
                                        ) : (
                                            <select
                                                value={newSubAdminCollege}
                                                onChange={(e) => setNewSubAdminCollege(e.target.value)}
                                                className="field cursor-pointer"
                                                required
                                            >
                                                <option value="" disabled>Select assigned college...</option>
                                                {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => (
                                                    <option key={col} value={col}>{col} College</option>
                                                ))}
                                            </select>
                                        )}
                                    </label>
                                    <button type="submit" className="btn success w-full mt-2" disabled={isCreatingSubAdmin}>
                                        {isCreatingSubAdmin ? "Creating..." : "Save Account"}
                                    </button>
                                </form>
                            </motion.section>

                            {/* Active Staff List */}
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Accounts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Staff Directory</h2>
                                    </div>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Username</th>
                                            <th>Assigned Campus</th>
                                            <th>Role / Scope</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subAdmins.map(adminAcc => (
                                            <tr key={adminAcc.id}>
                                                <td className="font-bold text-slate-400">#{adminAcc.id}</td>
                                                <td className="font-bold text-slate-900">{adminAcc.username}</td>
                                                <td className="text-xs font-black text-[#4F9DFF] uppercase">{adminAcc.college}</td>
                                                <td>
                                                    <span className="status-pill status-paid" style={{ fontSize: '10px', minHeight: '22px' }}>
                                                        {adminAcc.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button onClick={() => deleteSubAdmin(adminAcc.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Revoke Access</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {subAdmins.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-6">No staff provisioned yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        </div>

                        {/* Manager Activity Logs Section */}
                        {loggedInAdminRole === "SUB_ADMIN" && (
                        <motion.section className="panel p-6 overflow-x-auto mt-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="section-header mb-4">
                                <div>
                                    <p className="eyebrow">Audit Trail</p>
                                    <h2 className="text-2xl font-black text-slate-900">Manager Activity Logs</h2>
                                </div>
                            </div>
                            <table className="data-table w-full">
                                <thead>
                                    <tr>
                                        <th>Date / Time</th>
                                        <th>Manager</th>
                                        <th>Action Type</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {managerLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="font-bold text-slate-800">{log.managerName}</td>
                                            <td>
                                                <span className="status-pill status-paid" style={{ fontSize: '10px' }}>
                                                    {log.actionType}
                                                </span>
                                            </td>
                                            <td className="text-sm font-semibold text-slate-600">{log.details}</td>
                                        </tr>
                                    ))}
                                    {managerLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-slate-500 font-bold">
                                                No activity logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Config Modal */}
            <AnimatePresence>
                {paymentConfigModal && (
                    <CustomModal
                        isOpen={!!paymentConfigModal}
                        onClose={() => setPaymentConfigModal(null)}
                        title={`Payment Gateway: ${paymentConfigModal}`}
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 font-semibold mb-4">
                                Route payments dynamically for this specific college. If left empty, payments will fall back to the system default Razorpay account.
                            </p>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Razorpay Key ID</label>
                                <input 
                                    type="text" 
                                    value={configKeyId}
                                    onChange={(e) => setConfigKeyId(e.target.value)}
                                    className="input-field" 
                                    placeholder="rzp_live_..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Razorpay Key Secret</label>
                                <input 
                                    type="password" 
                                    value={configKeySecret}
                                    onChange={(e) => setConfigKeySecret(e.target.value)}
                                    className="input-field" 
                                    placeholder="Secret Key"
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    try {
                                        await api.post("/college-config", {
                                            collegeName: paymentConfigModal,
                                            razorpayKeyId: configKeyId,
                                            razorpayKeySecret: configKeySecret
                                        });
                                        showAlert("Success", "Keys saved for " + paymentConfigModal, "success");
                                        setPaymentConfigModal(null);
                                        fetchCollegeConfigs();
                                    } catch (err) {
                                        showAlert("Error", "Failed to save keys", "error");
                                    }
                                }}
                                className="btn primary w-full mt-2"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </CustomModal>
                )}
            </AnimatePresence>

            {/* Custom Premium Modal */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </main>
    );
}

export default AdminDashboard;
