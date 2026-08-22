import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { getPdfDownloadUrl } from "../services/api";
import CustomModal from "../components/CustomModal";
import Navbar from "../components/Navbar";
import WhatsAppOrdersSection from "../components/admin/sections/WhatsAppOrdersSection";
import cloudprintLogo from "../assets/cloudprint_logo.png";

function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab");

    const loggedInAdminUser = localStorage.getItem("adminUser") || "admin";
    const loggedInAdminRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
    const loggedInAdminCollege = localStorage.getItem("adminCollege") || "KLU";

    const [coupons, setCoupons] = useState([]);
    const [allOrders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");
    const [selectedCollegeFilter, setSelectedCollegeFilter] = useState("ALL");
    const [orderSortDir, setOrderSortDir] = useState("desc");

    const [bwPrice, setBwPrice] = useState(0);
    const [colorPrice, setColorPrice] = useState(0);
    const [duplexPrice, setDuplexPrice] = useState(0);
    const [blockPricesMap, setBlockPricesMap] = useState({});

    const [couponCode, setCouponCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState(1);

    // Flat Coupon Generator states
    const [flatCouponCode, setFlatCouponCode] = useState("");
    const [flatDiscountAmount, setFlatDiscountAmount] = useState("");
    const [flatMinOrderAmount, setFlatMinOrderAmount] = useState("");
    const [flatExpiryDate, setFlatExpiryDate] = useState("");
    const [flatMaxUses, setFlatMaxUses] = useState(1);

    const [couponUnlocked, setCouponUnlocked] = useState(false);
    const [managerCouponSecretInput, setManagerCouponSecretInput] = useState("");

    const [allUsers, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCoupons, setSelectedCoupons] = useState([]);
    const [allSupportTickets, setSupportTickets] = useState([]);
    const [selectedPricingBlock, setSelectedPricingBlock] = useState("C Block");
    const [activeTab, setActiveTab] = useState(tabFromUrl || "queue");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [pricingSubTab, setPricingSubTab] = useState(searchParams.get("subtab") || "pricing");
    const [queueSubTab, setQueueSubTab] = useState(searchParams.get("subtab") || "revenue");
    const [blocksSubTab, setBlocksSubTab] = useState("all-blocks");
    const [printersSubTab, setPrintersSubTab] = useState("printers-list");
    const [collegesSubTab, setCollegesSubTab] = useState("colleges-list");
    const [usersSubTab, setUsersSubTab] = useState("users-list");
    const [supportSubTab, setSupportSubTab] = useState("all-tickets");
    const [frontendSubTab, setFrontendSubTab] = useState("marketing");
    const [systemSubTab, setSystemSubTab] = useState("gateway");
    const [subadminsSubTab, setSubadminsSubTab] = useState("staff-list");
    const [notificationsSubTab, setNotificationsSubTab] = useState("all-notifs");
    const [sqlSubTab, setSqlSubTab] = useState("console");
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    const [newPrinterDuplex, setNewPrinterDuplex] = useState(true);
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

    const [thesisCollege, setThesisCollege] = useState("KLU");
    const [collegeThesisSettings, setCollegeThesisSettings] = useState({
        thesisEnabled: true,
        thesisDiscountPages: 500,
        thesisDiscountPercent: 15.0
    });

    const [platformCollege, setPlatformCollege] = useState("KLU");
    const [collegePlatformSettings, setCollegePlatformSettings] = useState({
        razorpayChargePercentage: 2.36,
        managerMaxBwPrinters: 1,
        managerMaxColorPrinters: 1
    });

    const [userCollegeFilter, setUserCollegeFilter] = useState("ALL");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [blockCollegeFilter, setBlockCollegeFilter] = useState("ALL");
    const [fetchedColleges, setFetchedColleges] = useState([]);

    useEffect(() => {
        api.get("/college-config").then(res => {
            if (Array.isArray(res.data)) {
                const names = res.data.map(c => c.collegeName).filter(Boolean);
                setFetchedColleges(names);
            }
        }).catch(() => {});
    }, []);

    const allColleges = useMemo(() => {
        const list = new Set();
        if (Array.isArray(fetchedColleges) && fetchedColleges.length > 0) {
            fetchedColleges.forEach(c => {
                if (c) list.add(c.trim().toUpperCase());
            });
        }
        if (Array.isArray(allBlocks) && allBlocks.length > 0) {
            allBlocks.forEach(b => {
                if (b?.college) list.add(b.college.trim().toUpperCase());
            });
        }
        // If database is currently empty, ensure at least KLU or loggedInAdminCollege is present
        if (list.size === 0) {
            list.add(loggedInAdminCollege || "KLU");
        }
        return Array.from(list).sort();
    }, [fetchedColleges, allBlocks, loggedInAdminCollege]);

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
    const [collegeModalUser, setCollegeModalUser] = useState(null);
    const [selectedUserCollegeTarget, setSelectedUserCollegeTarget] = useState("");
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
        fetchSupportTickets();
        fetchPrices(selectedPricingBlock);
        fetchBlocks();
        fetchPrinters();
        fetchCollegePlatformSettings(selectedCollege || loggedInAdminCollege || "KLU");

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchOrders();
                fetchStats();
                fetchPrinters();
                fetchSupportTickets();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [revenuePeriod]);

    useEffect(() => {
        fetchStats();
        fetchCollegePlatformSettings(selectedCollege || loggedInAdminCollege || "KLU");
    }, [revenuePeriod, selectedCollege]);

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
            fetchSubAdmins();
            fetchBlocks();
            fetchManagerLogs();
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
            fetchNotifications();
        } else if (activeTab === "system") {
            fetchSystemSettings();
            
            const currentRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
            const currentCollege = localStorage.getItem("adminCollege") || "KLU";
            const isSubAdmin = currentRole === "SUB_ADMIN" && localStorage.getItem("adminUser") !== "admin";
            
            const initialOffpeakCollege = isSubAdmin ? currentCollege : "KLU";
            setOffpeakCollege(initialOffpeakCollege);
            fetchCollegeOffpeakSettings(initialOffpeakCollege);

            const initialThesisCollege = isSubAdmin ? currentCollege : "KLU";
            setThesisCollege(initialThesisCollege);
            fetchCollegeThesisSettings(initialThesisCollege);

            const initialPlatformCollege = isSubAdmin ? currentCollege : "KLU";
            setPlatformCollege(initialPlatformCollege);
            fetchCollegePlatformSettings(initialPlatformCollege);
            
            fetchBlocks();
            fetchPrinters();
        } else if (activeTab === "rewards") {
            // rewards moved to settings tab
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

    const prevOrdersRef = useRef("");
    const prevTicketsRef = useRef("");

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/orders");
            const newOrdersHash = JSON.stringify(
                (response.data || []).map(o => ({ id: o.id, status: o.status, printStatus: o.printStatus, payment: o.razorpayPaymentId }))
            );
            if (newOrdersHash !== prevOrdersRef.current) {
                prevOrdersRef.current = newOrdersHash;
                setOrders(response.data);
            }
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

    const fetchAllBlockPrices = async () => {
        try {
            const response = await api.get("/pricing/all");
            if (response.data && Array.isArray(response.data)) {
                const map = {};
                response.data.forEach((p) => {
                    const b = p.blockLocation || "Default";
                    if (!map[b]) {
                        map[b] = { bw: 2.0, color: 5.0, duplex: 1.5 };
                    }
                    if (p.printType === "BW") map[b].bw = p.pricePerPage;
                    if (p.printType === "COLOR") map[b].color = p.pricePerPage;
                    if (p.printType === "DUPLEX" || p.printType === "DOUBLE") map[b].duplex = p.pricePerPage;
                });
                setBlockPricesMap(map);
            }
        } catch (err) {
            console.error("Error fetching all block prices:", err);
        }
    };

    const fetchPrices = async (block = selectedPricingBlock) => {
        try {
            const response = await api.get("/pricing/all", {
                params: { blockLocation: block }
            });
            let bwVal = 2.0;
            let colorVal = 5.0;
            let duplexVal = 1.5;
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((p) => {
                    if (p.printType === "BW") {
                        bwVal = p.pricePerPage;
                    }
                    if (p.printType === "COLOR") {
                        colorVal = p.pricePerPage;
                    }
                    if (p.printType === "DUPLEX" || p.printType === "DOUBLE") {
                        duplexVal = p.pricePerPage;
                    }
                });
            }
            setBwPrice(bwVal);
            setColorPrice(colorVal);
            setDuplexPrice(duplexVal);
            fetchAllBlockPrices();
        } catch (error) {
            console.error("Error fetching prices:", error);
        }
    };

    const savePrices = async () => {
        if (loggedInAdminRole === "MANAGER") {
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
                    printType: "DUPLEX",
                    pricePerPage: duplexPrice,
                    blockLocation: selectedPricingBlock
                }
            });

            await api.post("/admin/logs/create", {
                managerName: loggedInAdminUser,
                college: loggedInAdminCollege,
                actionType: "PRICING_UPDATE",
                details: `Updated prices for ${selectedPricingBlock} to BW: ${bwPrice}, Color: ${colorPrice}, Duplex: ${duplexPrice}`
            });

            showAlert("Success", `Prices Updated Successfully for ${selectedPricingBlock}`, "success");
            fetchAllBlockPrices();
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

    const handleAddWalletMoney = async (user) => {
        const inputAmount = window.prompt(`Add wallet balance for ${user.name || user.email}.\nEnter amount in ₹ to add:`, "50");
        if (inputAmount === null) return;
        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount === 0) {
            showAlert("Invalid Amount", "Please enter a valid non-zero number for wallet amount.", "error");
            return;
        }
        try {
            await api.post("/admin/users/wallet/add", null, {
                params: { id: user.id, amount }
            });
            showAlert("Success", `Successfully ${amount > 0 ? "added" : "deducted"} ₹${Math.abs(amount).toFixed(2)} for ${user.name || user.email}!`, "success");
            fetchUsers();
        } catch (error) {
            console.error("Error updating wallet money:", error);
            showAlert("Error", "Failed to update user wallet balance.", "error");
        }
    };

    const handleChangeUserCollege = (user) => {
        const isMainAdmin = loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin";
        if (!isMainAdmin) {
            showAlert("Permission Denied", "Only the Main Admin is authorized to change user colleges.", "error");
            return;
        }
        setCollegeModalUser(user);
        setSelectedUserCollegeTarget(user.college || (allColleges && allColleges[0]) || "KLU");
    };

    const handleConfirmUserCollegeChange = async () => {
        if (!collegeModalUser || !selectedUserCollegeTarget) return;
        const target = selectedUserCollegeTarget.trim().toUpperCase();
        try {
            await api.post("/admin/users/update-college", null, {
                params: { id: collegeModalUser.id, college: target, adminUsername: loggedInAdminUser }
            });
            showAlert("Success", `College for ${collegeModalUser.name || collegeModalUser.email} updated to ${target}!`, "success");
            setCollegeModalUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error updating user college:", error);
            showAlert("Error", error.response?.data || "Failed to update user college.", "error");
        }
    };

    const createCouponCanvasBlob = (code, discount, expiry, minOrder) => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext("2d");

            // Background
            const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
            bgGrad.addColorStop(0, "#090d16");
            bgGrad.addColorStop(0.5, "#0f172a");
            bgGrad.addColorStop(1, "#020617");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1200, 630);

            // Ambient Glows
            const orb1 = ctx.createRadialGradient(250, 150, 10, 250, 150, 400);
            orb1.addColorStop(0, "rgba(99, 102, 241, 0.45)");
            orb1.addColorStop(1, "rgba(99, 102, 241, 0)");
            ctx.fillStyle = orb1;
            ctx.fillRect(0, 0, 1200, 630);

            const orb2 = ctx.createRadialGradient(950, 450, 10, 950, 450, 400);
            orb2.addColorStop(0, "rgba(168, 85, 247, 0.4)");
            orb2.addColorStop(1, "rgba(168, 85, 247, 0)");
            ctx.fillStyle = orb2;
            ctx.fillRect(0, 0, 1200, 630);

            // Main Ticket Card Container
            const cardX = 80, cardY = 60, cardW = 1040, cardH = 510, cardR = 32;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
            const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
            cardGrad.addColorStop(0, "rgba(30, 41, 59, 0.85)");
            cardGrad.addColorStop(1, "rgba(15, 23, 42, 0.95)");
            ctx.fillStyle = cardGrad;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
            ctx.stroke();
            ctx.restore();

            // Brand Tag
            ctx.font = "900 24px sans-serif";
            ctx.fillStyle = "#38bdf8";
            ctx.fillText("☁️ CLOUDPRINT PROMO", 130, 130);

            // Special Discount Pill
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(840, 100, 230, 42, 21);
            ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = "900 16px sans-serif";
            ctx.fillStyle = "#e0f2fe";
            ctx.textAlign = "center";
            ctx.fillText("SPECIAL DISCOUNT 🎟️", 955, 127);
            ctx.restore();

            // Main Discount Big Text
            ctx.font = "900 84px sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`${discount || "50% OFF"}`, 130, 240);

            // Subtitle
            ctx.font = "700 24px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("Valid on all Document & Thesis Print Orders", 130, 285);

            // Perforation dashed line
            ctx.save();
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(130, 330);
            ctx.lineTo(1070, 330);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Promo Code Box
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(130, 365, 480, 130, 20);
            ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
            ctx.fill();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = "800 16px sans-serif";
            ctx.fillStyle = "#38bdf8";
            ctx.fillText("USE PROMO CODE AT CHECKOUT", 155, 400);

            ctx.font = "900 48px monospace";
            ctx.fillStyle = "#f8fafc";
            ctx.fillText(code || "PRINT8222", 155, 465);
            ctx.restore();

            // Right side info
            ctx.font = "800 16px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("EXPIRES ON", 660, 395);
            ctx.font = "900 26px sans-serif";
            ctx.fillStyle = "#f8fafc";
            ctx.fillText(expiry || "Valid for Limited Time", 660, 430);

            if (minOrder && Number(minOrder) > 0) {
                ctx.font = "800 16px sans-serif";
                ctx.fillStyle = "#38bdf8";
                ctx.fillText(`⚡ Min Order: ₹${Number(minOrder).toFixed(0)}`, 660, 465);
            }

            ctx.font = "700 15px sans-serif";
            ctx.fillStyle = "#38bdf8";
            ctx.fillText("👉 https://cloudprint.website", 660, 490);

            canvas.toBlob((blob) => resolve(blob), "image/png");
        });
    };

    const createVoucherCanvasBlob = (code, amount, title, maxClaims) => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext("2d");

            // Background
            const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
            bgGrad.addColorStop(0, "#042f2e");
            bgGrad.addColorStop(0.5, "#064e3b");
            bgGrad.addColorStop(1, "#022c22");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1200, 630);

            // Ambient Glows
            const orb1 = ctx.createRadialGradient(250, 150, 10, 250, 150, 400);
            orb1.addColorStop(0, "rgba(52, 211, 153, 0.45)");
            orb1.addColorStop(1, "rgba(52, 211, 153, 0)");
            ctx.fillStyle = orb1;
            ctx.fillRect(0, 0, 1200, 630);

            const orb2 = ctx.createRadialGradient(950, 450, 10, 950, 450, 400);
            orb2.addColorStop(0, "rgba(20, 184, 166, 0.4)");
            orb2.addColorStop(1, "rgba(20, 184, 166, 0)");
            ctx.fillStyle = orb2;
            ctx.fillRect(0, 0, 1200, 630);

            // Main Ticket Card Container
            const cardX = 80, cardY = 60, cardW = 1040, cardH = 510, cardR = 32;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
            const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
            cardGrad.addColorStop(0, "rgba(6, 78, 59, 0.85)");
            cardGrad.addColorStop(1, "rgba(2, 44, 34, 0.95)");
            ctx.fillStyle = cardGrad;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(52, 211, 153, 0.45)";
            ctx.stroke();
            ctx.restore();

            // Brand Tag
            ctx.font = "900 24px sans-serif";
            ctx.fillStyle = "#34d399";
            ctx.fillText("🎁 CLOUDPRINT REWARD VOUCHER", 130, 130);

            // Special Pill
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(840, 100, 230, 42, 21);
            ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
            ctx.fill();
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = "900 16px sans-serif";
            ctx.fillStyle = "#ecfdf5";
            ctx.textAlign = "center";
            ctx.fillText("WALLET BONUS 💰", 955, 127);
            ctx.restore();

            // Main Reward Amount Text
            ctx.font = "900 80px sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`₹${Number(amount || 50).toFixed(2)} FREE`, 130, 240);

            // Title
            ctx.font = "700 24px sans-serif";
            ctx.fillStyle = "#a7f3d0";
            ctx.fillText(title || "Instant Wallet Credit Voucher", 130, 285);

            // Perforation dashed line
            ctx.save();
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(130, 330);
            ctx.lineTo(1070, 330);
            ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Promo Code Box
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(130, 365, 480, 130, 20);
            ctx.fillStyle = "rgba(2, 44, 34, 0.85)";
            ctx.fill();
            ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = "800 16px sans-serif";
            ctx.fillStyle = "#6ee7b7";
            ctx.fillText("REDEEM CLAIM CODE IN WALLET", 155, 400);

            ctx.font = "900 48px monospace";
            ctx.fillStyle = "#f8fafc";
            ctx.fillText(code || "BONUS50", 155, 465);
            ctx.restore();

            // Right side info
            ctx.font = "800 16px sans-serif";
            ctx.fillStyle = "#a7f3d0";
            ctx.fillText("LIMITED AVAILABILITY", 660, 405);
            ctx.font = "900 28px sans-serif";
            ctx.fillStyle = "#f8fafc";
            ctx.fillText(`${maxClaims || 100} Claims Allowed`, 660, 445);

            ctx.font = "700 16px sans-serif";
            ctx.fillStyle = "#34d399";
            ctx.fillText("👉 https://cloudprint.website", 660, 480);

            canvas.toBlob((blob) => resolve(blob), "image/png");
        });
    };

    const shareCouponOnWhatsApp = async (code, discount, expiry) => {
        const text = `🎉 *Special CloudPrint Discount Coupon!*\n\n` +
            `🎟️ *Coupon Code*: *${code || "SPECIAL"}*\n` +
            `💰 *Discount*: *${discount || "10"}% OFF*\n` +
            (expiry ? `⏱️ *Expires*: ${expiry}\n` : ``) +
            `\n👉 Upload & Print now: https://cloudprint.website`;

        try {
            const blob = await createCouponCanvasBlob(code, discount, expiry);
            const file = new File([blob], `coupon_${code || "card"}.png`, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `CloudPrint Coupon: ${code}`,
                    text: text,
                    files: [file]
                });
                return;
            }

            // Fallback: download photo & open WhatsApp
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `CloudPrint_Coupon_${code || "promo"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            showAlert("Photo Downloaded!", `The coupon card image has been saved to your downloads and WhatsApp is open to share it!`, "success");
        } catch (err) {
            console.error("Error sharing coupon photo:", err);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
        }
    };

    const downloadCouponImage = async (code, discount, expiry) => {
        try {
            const blob = await createCouponCanvasBlob(code, discount, expiry);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `CloudPrint_Coupon_${code || "promo"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            showAlert("Downloaded", "Coupon photo saved to your device!", "success");
        } catch (err) {
            showAlert("Error", "Failed to generate image", "error");
        }
    };

    const shareVoucherOnWhatsApp = async (code, amount, title, maxClaims) => {
        const text = `🎁 *Free Wallet Credit Voucher!*\n\n` +
            `🏷️ *Title*: ${title || "Wallet Reward"}\n` +
            `💰 *Reward Amount*: *₹${amount || "50"} Instant Wallet Credits*\n` +
            `🔑 *Claim Code*: *${code || "BONUS"}*\n\n` +
            `👉 Redeem & Print now: https://cloudprint.website`;

        try {
            const blob = await createVoucherCanvasBlob(code, amount, title, maxClaims);
            const file = new File([blob], `voucher_${code || "card"}.png`, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `CloudPrint Voucher: ${code}`,
                    text: text,
                    files: [file]
                });
                return;
            }

            // Fallback: download photo & open WhatsApp
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `CloudPrint_Voucher_${code || "bonus"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            showAlert("Photo Downloaded!", `The voucher card image has been saved to your downloads and WhatsApp is open to share it!`, "success");
        } catch (err) {
            console.error("Error sharing voucher photo:", err);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
        }
    };

    const downloadVoucherImage = async (code, amount, title, maxClaims) => {
        try {
            const blob = await createVoucherCanvasBlob(code, amount, title, maxClaims);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `CloudPrint_Voucher_${code || "bonus"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            showAlert("Downloaded", "Voucher photo saved to your device!", "success");
        } catch (err) {
            showAlert("Error", "Failed to generate image", "error");
        }
    };

    const fetchSupportTickets = async () => {
        try {
            const response = await api.get("/support/all");
            const newTicketsHash = JSON.stringify(
                (response.data || []).map(t => ({ id: t.id, status: t.status }))
            );
            if (newTicketsHash !== prevTicketsRef.current) {
                prevTicketsRef.current = newTicketsHash;
                setSupportTickets(response.data);
            }
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

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.post(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
            fetchOrders();
            showAlert("Status Updated", `Order #${orderId} status changed to ${newStatus}`, "success");
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update order status", "error");
        }
    };

    const createPercentageCoupon = async () => {
        const val = discountPercentage ? Number(discountPercentage) : 10;
        if (val > 95) {
            showAlert("Discount Constraint", "Maximum allowed coupon discount percentage is 95%.", "error");
            return;
        }
        if (val <= 0) {
            showAlert("Invalid Discount", "Please specify a discount percentage greater than 0%.", "warning");
            return;
        }

        const parsedMaxUses = maxUses && !isNaN(parseInt(maxUses, 10)) ? Math.max(1, parseInt(maxUses, 10)) : 100;
        try {
            const payload = {
                couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
                discountPercentage: val,
                discountAmount: 0.0,
                minOrderAmount: 0.0,
                expiryDate: expiryDate && expiryDate.trim() ? expiryDate.trim() : null,
                maxUses: parsedMaxUses,
                active: true
            };

            await api.post("/coupon/create", payload);

            showAlert("Success", "Percentage Coupon Created Successfully", "success");
            fetchCoupons();
            setCouponCode("");
            setDiscountPercentage("");
            setExpiryDate("");
            setMaxUses(1);
        } catch (error) {
            console.error("Failed to create coupon:", error);
            const errDetail = error.response?.data?.message || error.response?.data?.error || error.message || "Unable To Create Coupon";
            showAlert("Error", errDetail, "error");
        }
    };

    const createFlatCoupon = async () => {
        const amt = flatDiscountAmount ? Number(flatDiscountAmount) : 10;
        if (amt <= 0) {
            showAlert("Invalid Amount", "Please specify a flat discount amount greater than ₹0.", "warning");
            return;
        }

        const parsedMaxUses = flatMaxUses && !isNaN(parseInt(flatMaxUses, 10)) ? Math.max(1, parseInt(flatMaxUses, 10)) : 100;
        try {
            const payload = {
                couponCode: flatCouponCode ? flatCouponCode.trim().toUpperCase() : null,
                discountPercentage: 0.0,
                discountAmount: amt,
                minOrderAmount: flatMinOrderAmount ? Number(flatMinOrderAmount) : 0.0,
                expiryDate: flatExpiryDate && flatExpiryDate.trim() ? flatExpiryDate.trim() : null,
                maxUses: parsedMaxUses,
                active: true
            };

            await api.post("/coupon/create", payload);

            showAlert("Success", "Flat Amount Coupon Created Successfully", "success");
            fetchCoupons();
            setFlatCouponCode("");
            setFlatDiscountAmount("");
            setFlatMinOrderAmount("");
            setFlatExpiryDate("");
            setFlatMaxUses(1);
        } catch (error) {
            console.error("Failed to create flat coupon:", error);
            const errDetail = error.response?.data?.message || error.response?.data?.error || error.message || "Unable To Create Flat Coupon";
            showAlert("Error", errDetail, "error");
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

    const formatStudentDisplayName = (rawName) => {
        if (!rawName) return "Student";
        let str = String(rawName).trim();
        const phoneMatch = str.match(/\b(?:\+?91[\s-]*)?([0-9]{6})([0-9]{4})\b/) || str.match(/\b([0-9]{6})([0-9]{4})\b/);
        if (phoneMatch) {
            const last4 = phoneMatch[2];
            let cleanName = str
                .replace(/\(?\+?91[\s-]*[0-9]{10}\)?/g, "")
                .replace(/\([0-9]{10}\)/g, "")
                .replace(/\b[0-9]{10}\b/g, "")
                .replace(/\(\s*\)/g, "")
                .trim();
            if (!cleanName || cleanName.toLowerCase() === "student") {
                cleanName = "Student";
            }
            return `${cleanName} (•••• ${last4})`;
        }
        return str || "Student";
    };

    const isWhatsAppOrder = (o) => {
        if (!o) return false;
        const name = (o.customerName || "").toLowerCase();
        const email = (o.userEmail || o.email || "").toLowerCase();
        const channel = (o.orderChannel || "").toUpperCase();
        const referral = (o.appliedReferralCode || "").toUpperCase();
        const orderIdStr = (o.orderId || "").toUpperCase();

        return (
            channel === "WHATSAPP" ||
            channel === "BOT" ||
            channel === "WA" ||
            email.includes("@c.us") ||
            email.includes("whatsapp") ||
            email.startsWith("wa_") ||
            referral.startsWith("WA_") ||
            orderIdStr.startsWith("WA_") ||
            name.includes("+91") ||
            name.includes("(+91") ||
            name.includes("whatsapp") ||
            name.includes("wa_") ||
            /\+?91[\s-]*[0-9]{10}/.test(name) ||
            /\b[6-9][0-9]{9}\b/.test(name) ||
            /[0-9]{10}/.test(name.replace(/[^0-9]/g, ""))
        );
    };

    const revenueFilters = [
        ["all", "All Time"],
        ["today", "Today"],
        ["week", "This Week"],
        ["month", "This Month"]
    ];

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
            if (period === "today" || period === "day") {
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
        let whatsappGrossRevenue = 0;
        let whatsappNetRevenue = 0;
        let whatsappOrdersCount = 0;
        let webGrossRevenue = 0;
        let webNetRevenue = 0;
        let webOrdersCount = 0;

        let refundedRevenue = 0;
        let refundedOrdersCount = 0;

        revenuePeriodOrders.forEach(o => {
            const isRefunded = o.status === "CANCELLED" || o.paymentStatus === "REFUNDED";
            if (isRefunded) {
                refundedRevenue += (o.price || 0);
                refundedOrdersCount++;
            }

            if ((o.paymentStatus === "PAID" || o.status === "COMPLETED" || o.status === "PRINTING" || o.status === "QUEUE") && o.status !== "CANCELLED") {
                const original = o.originalPrice != null ? o.originalPrice : o.price;
                grossRevenue += original || 0;
                totalDiscounts += o.discountAmount || 0;
                netRevenue += o.price || 0;
                if (o.razorpayPaymentId === "WALLET") {
                    walletRevenue += o.price || 0;
                } else {
                    upiRevenue += o.price || 0;
                }

                const email = (o.userEmail || o.email || "").toLowerCase();
                const name = (o.customerName || "").toLowerCase();
                const channel = (o.orderChannel || "").toUpperCase();
                const referral = (o.appliedReferralCode || "").toUpperCase();
                const orderIdStr = (o.orderId || "").toUpperCase();

                const isWA = channel === "WHATSAPP" ||
                    channel === "BOT" ||
                    channel === "WA" ||
                    email.includes("@c.us") ||
                    email.includes("whatsapp") ||
                    email.startsWith("wa_") ||
                    referral.startsWith("WA_") ||
                    orderIdStr.startsWith("WA_") ||
                    name.includes("+91") ||
                    name.includes("(+91") ||
                    name.includes("whatsapp") ||
                    name.includes("wa_") ||
                    /\+?91[\s-]*[0-9]{10}/.test(name) ||
                    /\b[6-9][0-9]{9}\b/.test(name) ||
                    /[0-9]{10}/.test(name.replace(/[^0-9]/g, ""));

                if (isWA) {
                    whatsappGrossRevenue += original || 0;
                    whatsappNetRevenue += o.price || 0;
                    whatsappOrdersCount++;
                } else {
                    webGrossRevenue += original || 0;
                    webNetRevenue += o.price || 0;
                    webOrdersCount++;
                }
            }
        });

        // Razorpay charges only apply to UPI revenue
        const chargePercent = (collegePlatformSettings && collegePlatformSettings.razorpayChargePercentage !== undefined) ? Number(collegePlatformSettings.razorpayChargePercentage) : 2.36;
        razorpayCharges = upiRevenue * (chargePercent / 100);

        const todayOrders = getPeriodFilteredOrders(collegeFilteredOrders, "today");
        let todayRevenue = 0;
        todayOrders.forEach(o => {
            if ((o.paymentStatus === "PAID" || o.status === "COMPLETED" || o.status === "PRINTING" || o.status === "QUEUE") && o.status !== "CANCELLED") {
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
            whatsappGrossRevenue,
            whatsappNetRevenue,
            whatsappOrdersCount,
            webGrossRevenue,
            webNetRevenue,
            webOrdersCount,
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
        ["Razorpay Charges", localStats.razorpayCharges || 0, "linear-gradient(135deg, #7c3aed, #4c1d95)", `${(collegePlatformSettings && collegePlatformSettings.razorpayChargePercentage !== undefined) ? collegePlatformSettings.razorpayChargePercentage : 2.36}% per UPI TXN`],
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
            const finalName = newPrinterName && newPrinterName.trim() 
                ? newPrinterName.trim() 
                : `${newPrinterBlock} ${newPrinterColor ? "Color" : "B&W"} Printer`;

            await api.post("/printer/save", {
                printerName: finalName,
                printerIp: newPrinterIp && newPrinterIp.trim() ? newPrinterIp.trim() : "192.168.1.100",
                blockLocation: newPrinterBlock,
                colourSupported: !!newPrinterColor,
                duplexSupported: !!newPrinterDuplex,
                active: !!newPrinterActive,
                maintenance: !!newPrinterMaintenance,
                qrScanToPrint: !!newPrinterQrScan,
                otpEnabled: newPrinterOtp !== undefined ? newPrinterOtp : true,
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
            const msg = error.response?.data?.message || "Failed to add printer";
            showAlert("Error", msg, "error");
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

    const fetchCollegeThesisSettings = async (college) => {
        try {
            const response = await api.get(`/admin/settings/thesis?college=${college}`);
            if (response.data) {
                setCollegeThesisSettings(response.data);
            }
        } catch (error) {
            console.error("Error fetching thesis settings:", error);
        }
    };

    const saveCollegeThesisSettings = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/settings/thesis/update?college=${thesisCollege}`, collegeThesisSettings);
            showAlert("Success", `Thesis & Bulk Print Settings for ${thesisCollege} Updated Successfully`, "success");
        } catch (error) {
            console.error("Error updating thesis settings:", error);
            showAlert("Error", "Failed to update bulk print settings", "error");
        }
    };

    const fetchCollegePlatformSettings = async (college) => {
        try {
            const target = (college && college !== "ALL") ? college : (loggedInAdminCollege || "KLU");
            const response = await api.get(`/admin/settings/platform?college=${target}`);
            if (response.data) {
                setCollegePlatformSettings(response.data);
            }
        } catch (error) {
            console.error("Error fetching platform settings:", error);
        }
    };

    const saveCollegePlatformSettings = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/settings/platform/update?college=${platformCollege}`, collegePlatformSettings);
            showAlert("Success", `Platform Settings for ${platformCollege} Updated Successfully`, "success");
            fetchCollegePlatformSettings(platformCollege);
            fetchStats();
        } catch (error) {
            console.error("Error updating platform settings:", error);
            showAlert("Error", "Failed to update platform settings", "error");
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

    const handleTabChange = (tabId) => {
        if (tabId === "analytics") {
            setActiveTab("queue");
            setQueueSubTab("revenue");
            setSearchParams({ tab: "queue", subtab: "revenue" });
            fetchOrders();
            fetchStats();
            if (window.innerWidth < 768) setIsSidebarCollapsed(true);
            return;
        }
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        if (window.innerWidth < 768) {
            setIsSidebarCollapsed(true);
        }
        if (tabId === "settings") {
            fetchPrices(selectedPricingBlock);
            fetchCoupons();
            fetchBlocks();
            fetchRewards();
            fetchSystemSettings();
        } else if (tabId === "blocks") {
            fetchBlocks();
            fetchSuspendedColleges();
        } else if (tabId === "printers") {
            fetchPrinters();
            fetchBlocks();
        } else if (tabId === "colleges") {
            fetchBlocks();
            fetchSuspendedColleges();
            fetchCollegeConfigs();
        } else if (tabId === "users") {
            fetchUsers();
            fetchSubAdmins();
            fetchBlocks();
            fetchManagerLogs();
        } else if (tabId === "support") {
            fetchSupportTickets();
        } else if (tabId === "frontend") {
            fetchSystemSettings();
            fetchSections();
            fetchPopups();
            fetchNotifications();
        } else if (tabId === "system") {
            fetchSystemSettings();
            fetchBlocks();
            fetchPrinters();
        } else if (tabId === "sql") {
            setSqlResult(null);
            setSqlError("");
        }
    };

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            handleTabChange(tab);
        }
    }, [searchParams]);

    return (
        <main className="page-shell page-shell-decorated !px-0 !py-0 admin-dashboard-root flex flex-row min-h-screen w-full relative">
            {/* Mobile Backdrop Overlay when sidebar is expanded */}
            {!isSidebarCollapsed && (
                <div 
                    onClick={() => setIsSidebarCollapsed(true)} 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300" 
                />
            )}

            {/* Left Navigation Bar for Admin Panel — Light Theme */}
            <aside className={`${
                isSidebarCollapsed 
                    ? "w-14 sm:w-16 md:w-20 sticky top-0 h-screen z-30" 
                    : "fixed inset-y-0 left-0 w-64 sm:w-72 h-screen z-50 md:relative md:w-64 md:sticky md:top-0 shadow-2xl md:shadow-lg"
            } shrink-0 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between backdrop-blur-xl transition-all duration-300`}>
                <div>
                    <div className={`p-3 sm:p-4 border-b border-slate-200 flex items-center ${isSidebarCollapsed ? "justify-center flex-col gap-2" : "justify-between"}`}>
                        <div className="flex items-center gap-3">
                            <img src={cloudprintLogo} alt="CloudPrint Logo" className="h-8 object-contain cursor-pointer shrink-0" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title="Toggle Navigation (☰)" />
                            {!isSidebarCollapsed && (
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 leading-tight">Admin Portal</h2>
                                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">{loggedInAdminRole}</span>
                                </div>
                            )}
                        </div>
                        {/* 3-lines Hamburger Toggle Button */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-sm flex items-center justify-center group"
                            title={isSidebarCollapsed ? "Expand Side Navigation (☰)" : "Collapse Side Navigation (✕)"}
                            aria-label="Toggle Side Navigation"
                        >
                            {isSidebarCollapsed ? (
                                <div className="w-4 h-3.5 flex flex-col justify-between items-center py-0.5">
                                    <span className="w-4 h-0.5 bg-slate-500 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                    <span className="w-4 h-0.5 bg-slate-500 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                    <span className="w-4 h-0.5 bg-slate-500 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                </div>
                            ) : (
                                <span className="text-sm font-black text-slate-500 group-hover:text-slate-900">✕</span>
                            )}
                        </button>
                    </div>

                    <div className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">


                        {/* Management Sections */}
                        <div>
                            {!isSidebarCollapsed && (
                                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <span>🗂️</span> MANAGEMENT PANELS
                                </p>
                            )}
                            <div className={`space-y-1 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
                                <button
                                    onClick={() => handleTabChange("queue")}
                                    className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                        activeTab === "queue"
                                            ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                    title={isSidebarCollapsed ? "Queue & Analytics" : undefined}
                                >
                                    <span className="text-base">📋</span>
                                    {!isSidebarCollapsed && <span>Queue & Analytics</span>}
                                </button>

                                <button
                                    onClick={() => handleTabChange("settings")}
                                    className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                        activeTab === "settings"
                                            ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                    title={isSidebarCollapsed ? "Pricing & Coupons" : undefined}
                                >
                                    <span className="text-base">🏷️</span>
                                    {!isSidebarCollapsed && <span>Pricing & Coupons</span>}
                                </button>



                                {loggedInAdminRole !== "MANAGER" && (
                                    <button
                                        onClick={() => handleTabChange("colleges")}
                                        className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            activeTab === "colleges" || activeTab === "blocks" || activeTab === "printers"
                                                ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                        title={isSidebarCollapsed ? "College & Campus Management" : undefined}
                                    >
                                        <span className="text-base">🏫</span>
                                        {!isSidebarCollapsed && <span>College Management</span>}
                                    </button>
                                )}

                                {(() => {
                                    const pendingTicketsCount = allSupportTickets.filter(t => t.status === "PENDING").length;
                                    return (
                                        <button
                                            onClick={() => handleTabChange("users")}
                                            className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left relative ${
                                                activeTab === "users"
                                                    ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            }`}
                                            title={isSidebarCollapsed ? `User Moderation & Support ${pendingTicketsCount > 0 ? `(${pendingTicketsCount} Pending)` : ""}` : undefined}
                                        >
                                            <span className="text-base">👥</span>
                                            {!isSidebarCollapsed && <span>User Moderation & Support</span>}
                                            {!isSidebarCollapsed && pendingTicketsCount > 0 && (
                                                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-sm">
                                                    {pendingTicketsCount}
                                                </span>
                                            )}
                                            {isSidebarCollapsed && pendingTicketsCount > 0 && (
                                                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-white"></span>
                                            )}
                                        </button>
                                    );
                                })()}

                                {loggedInAdminRole !== "MANAGER" && (
                                    <>
                                        <button
                                            onClick={() => handleTabChange("frontend")}
                                            className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                                activeTab === "frontend"
                                                    ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            }`}
                                            title={isSidebarCollapsed ? "Frontend Manager" : undefined}
                                        >
                                            <span className="text-base">🎨</span>
                                            {!isSidebarCollapsed && <span>Frontend Manager</span>}
                                        </button>
                                        <button
                                            onClick={() => handleTabChange("system")}
                                            className={`${isSidebarCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-start px-3 py-2"} flex items-center gap-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                                activeTab === "system"
                                                    ? "bg-sky-500 text-white font-black shadow-md shadow-sky-500/25"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            }`}
                                            title={isSidebarCollapsed ? "System Config" : undefined}
                                        >
                                            <span className="text-base">⚙️</span>
                                            {!isSidebarCollapsed && <span>System Config</span>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-3 border-t border-slate-200 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} text-xs`}>
                    {!isSidebarCollapsed && (
                        <div className="truncate pr-2">
                            <p className="font-black text-slate-900 truncate">{loggedInAdminUser}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">{loggedInAdminCollege}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                        title="Sign Out"
                    >
                        {isSidebarCollapsed ? "🚪" : "Sign Out"}
                    </button>
                </div>
            </aside>

            <div className="!max-w-none !w-full px-4 py-4 md:px-8 md:py-6 flex-1 min-w-0">
                {/* Main Top Header Section with Sub-Navigation Cards */}
                <header className="bg-white/95 border border-slate-200 backdrop-blur-2xl rounded-2xl p-2.5 shadow-sm sticky top-2 z-40 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                    {/* Left Brand Header & Toggle */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shadow-sm flex items-center justify-center active:scale-95 group"
                            title={isSidebarCollapsed ? "Expand Navigation (☰)" : "Collapse Navigation (☰)"}
                        >
                            <div className="w-4 h-3.5 flex flex-col justify-between items-center py-0.5">
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                                <span className="w-4 h-0.5 bg-slate-700 rounded-full group-hover:bg-sky-600 transition-all"></span>
                            </div>
                        </button>
                        <img src={cloudprintLogo} alt="CloudPrint" className="h-8 object-contain shrink-0 cursor-pointer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
                    </div>

                    {/* Header Level Subtab Cards */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar flex-1 min-w-0">
                        {(activeTab === "queue" || activeTab === "order-queue") && (
                            [
                                { id: "live-queue", label: "Live Queue", icon: "📋", desc: "Active Orders" },
                                { id: "whatsapp", label: "WhatsApp Orders", icon: "💬", desc: `${orders.filter(o => {
                                    const e = (o.userEmail || o.email || "").toLowerCase();
                                    const c = (o.orderChannel || "").toUpperCase();
                                    const n = (o.customerName || "").toLowerCase();
                                    const r = (o.appliedReferralCode || "").toUpperCase();
                                    const oid = (o.orderId || "").toUpperCase();
                                    return c === "WHATSAPP" || c === "BOT" || c === "WA" || e.includes("@c.us") || e.includes("whatsapp") || e.startsWith("wa_") || r.startsWith("WA_") || oid.startsWith("WA_") || n.includes("+91") || n.includes("(+91") || n.includes("whatsapp") || n.includes("wa_") || /[0-9]{10}/.test(n.replace(/[^0-9]/g, ""));
                                }).length} Bot Orders` },
                                { id: "display-panel", label: "Display Panel", icon: "📺", desc: "Kiosk Live TV" },
                                { id: "kiosks", label: "Printer Kiosks", icon: "🖨️", desc: "Hardware Map" },
                                { id: "revenue", label: "Revenue Analytics", icon: "💵", desc: "Financial Metrics" },
                                { id: "charts", label: "Visual Charts", icon: "📈", desc: "Trends & Peaks" },
                                { id: "history", label: "Order History", icon: "📜", desc: `${orders.length} Total Logs` },
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => {
                                        if (sub.id === "display-panel") navigate("/display-panel");
                                        else setQueueSubTab(sub.id);
                                    }}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        queueSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${queueSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                        {activeTab === "users" && (
                            [
                                { id: "users-list", label: "User Directory", icon: "👥", desc: `${users.length} Registered` },
                                { id: "tickets", label: "Support Tickets", icon: "🎧", desc: `${allSupportTickets.length} Inquiries` },
                                { id: "wallets", label: "Wallet Balances", icon: "💳", desc: "User Credits" },
                                { id: "moderation", label: "Blocked Accounts", icon: "⛔", desc: `${users.filter(u => u.blocked).length} Suspended` },
                                { id: "staff-list", label: "Staff Directory", icon: "🔑", desc: `${subAdmins.length} Accounts` },
                                { id: "add-staff", label: "Add Staff", icon: "➕", desc: "Create Account" },
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setUsersSubTab(sub.id)}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        usersSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${usersSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                        {activeTab === "settings" && (
                            [
                                { id: "pricing", label: "Price Settings", icon: "💵", desc: "Rate Configuration" },
                                { id: "blocks", label: "Manage Blocks", icon: "🏛️", desc: "Campus Locations" },
                                { id: "coupon-gen", label: "% Discount Coupon", icon: "🎟️", desc: "% Percentage Off" },
                                { id: "flat-coupon-gen", label: "₹ Flat Off Coupon", icon: "🏷️", desc: "Flat ₹ Discount" },
                                { id: "active-coupons", label: "Active Coupons", icon: "📋", desc: `${coupons.length} Active` },
                                { id: "voucher-gen", label: "Voucher Generator", icon: "🎁", desc: "Wallet Credits" },
                                { id: "active-vouchers", label: "Active Vouchers", icon: "🎫", desc: `${rewards.length} Active` },
                                { id: "referrals", label: "Refer & Earn", icon: "👥", desc: "Referral Rules" }
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setPricingSubTab(sub.id)}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        pricingSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${pricingSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                        {(activeTab === "colleges" || activeTab === "blocks" || activeTab === "printers") && (
                            [
                                { id: "colleges-list", label: "College Directory", icon: "🏫", desc: `${Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).length} Campuses` },
                                ...(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin" ? [{ id: "add-college", label: "Add New College", icon: "➕", desc: "Register Campus" }] : []),
                                { id: "all-blocks", label: "Block Directory", icon: "🏛️", desc: `${blocks.length} Configured` },
                                { id: "add-block", label: "Add New Block", icon: "➕", desc: "Create Location" },
                                { id: "overview", label: "Block Overview", icon: "📊", desc: "Terminal Health" },
                                { id: "printers-list", label: "Printers Fleet", icon: "🖨️", desc: `${getRoleFilteredPrinters().length} Online/Configured` },
                                { id: "add-printer", label: "Add Printer", icon: "➕", desc: "Connect Station" },
                                { id: "paper-stock", label: "Paper Stock", icon: "📄", desc: "Trays & Sheets" },
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => {
                                        setCollegesSubTab(sub.id);
                                        setBlocksSubTab(sub.id);
                                        setPrintersSubTab(sub.id);
                                    }}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        collegesSubTab === sub.id || blocksSubTab === sub.id || printersSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${collegesSubTab === sub.id || blocksSubTab === sub.id || printersSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                        {activeTab === "frontend" && (
                            [
                                { id: "marketing", label: "Marketing", icon: "📢", desc: "Banners & Ticker" },
                                { id: "all-notifs", label: "Published Alerts", icon: "🔔", desc: `${notifications.length} Broadcasts` },
                                { id: "create-notif", label: "Create Alert", icon: "✍️", desc: "Compose Broadcast" },
                                { id: "sections-list", label: "Layout Sections", icon: "🗂️", desc: `${sections.length} Configured` },
                                { id: "add-section", label: "Add Section", icon: "➕", desc: "New CMS Block" },
                                { id: "popups-list", label: "Manage Popups", icon: "💬", desc: `${popups.length} Modals` },
                                { id: "add-popup", label: "Add Popup", icon: "✨", desc: "Create Modal" },
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setFrontendSubTab(sub.id)}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        frontendSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${frontendSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                        {activeTab === "system" && (
                            [
                                { id: "gateway", label: "Gateway Status", icon: "🌐", desc: "API Health" },
                                { id: "referrals", label: "Referrals", icon: "🎁", desc: "Bonus Rules" },
                                { id: "thesis", label: "Thesis & Bulk", icon: "📚", desc: "Volume Cuts" },
                                ...(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin" ? [{ id: "global", label: "Global Config", icon: "⚙️", desc: "Platform Fees" }] : []),
                                { id: "offpeak", label: "Off-Peak Hours", icon: "🌙", desc: "Time Windows" },
                                { id: "paper", label: "Paper Levels", icon: "📄", desc: "Hardware Stock" },
                                ...(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin" ? [
                                    { id: "tester", label: "Tester Mode", icon: "🧪", desc: "Free Access QA" },
                                    { id: "sql", label: "SQL Terminal", icon: "💻", desc: "Query & Backup" }
                                ] : []),
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setSystemSubTab(sub.id)}
                                    className={`min-w-[125px] flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-center ${
                                        systemSubTab === sub.id
                                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02] border border-sky-400"
                                            : "bg-slate-50/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{sub.icon}</span>
                                    <span className="text-xs font-black leading-tight">{sub.label}</span>
                                    <span className={`text-[10px] font-semibold mt-0.5 leading-tight ${systemSubTab === sub.id ? "text-sky-100" : "text-slate-500"}`}>
                                        {sub.desc}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Right Header Actions: Display Panel + Profile Sign Out Dropdown */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                        <button
                            onClick={() => navigate("/display-panel")}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 text-slate-800 hover:text-sky-700 border border-sky-200/80 hover:border-sky-300 text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                            title="Open Live Display Panel"
                        >
                            <span className="text-base">📺</span>
                            <span className="hidden sm:inline">Display Panel</span>
                        </button>

                        {/* Profile Pill with Logout Dropdown */}
                        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsProfileMenuOpen(false); }}>
                            <button
                                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all cursor-pointer shadow-md border border-slate-700 hover:border-slate-600 active:scale-95"
                                title="Profile & Sign Out"
                            >
                                {/* Avatar circle */}
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                                    {(loggedInAdminUser || "A").charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden sm:inline max-w-[80px] truncate">{loggedInAdminUser}</span>
                                {/* Chevron */}
                                <svg
                                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-[fadeIn_0.15s_ease]">
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                                                {(loggedInAdminUser || "A").charAt(0).toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-white truncate">{loggedInAdminUser}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">{loggedInAdminRole} · {loggedInAdminCollege}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Menu Items */}
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); navigate("/display-panel"); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-all cursor-pointer text-left"
                                        >
                                            <span className="text-base">📺</span>
                                            <span>Open Display Panel</span>
                                        </button>
                                        <div className="my-1 border-t border-slate-100" />
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer text-left"
                                        >
                                            <span className="text-base">🚪</span>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Queue & Analytics Tab */}
                {(activeTab === "queue" || activeTab === "order-queue") && (
                    <div className="mt-6 space-y-6">

                        {/* Subpage 1: Live Order Queue Table */}
                        {queueSubTab === "live-queue" && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Live print queue</p>
                                        <h2 className="text-2xl font-black text-slate-900">Active Order Queue</h2>
                                        <p className="subtitle">Orders currently in the active print pipeline. Refreshes every 3 seconds.</p>
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

                                <table className="data-table w-full">
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
                                            <th>Actions</th>
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
                                                <td className="font-bold text-slate-900">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span>{formatStudentDisplayName(order.customerName)}</span>
                                                        {isWhatsAppOrder(order) ? (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#25D366]/15 text-[#128C7E] border border-green-300 shadow-xs shrink-0">
                                                                💬 WA
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-200 shadow-xs shrink-0">
                                                                🌐 Web
                                                            </span>
                                                        )}
                                                    </div>
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
                                                <td className="font-black text-sky-600 tracking-widest font-mono">
                                                    {order.otpCode || "—"}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5">
                                                        {order.status !== "PRINTING" && (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, "PRINTING")}
                                                                className="btn success py-1 px-2 text-[11px] min-h-0 font-bold"
                                                                title="Start Printing"
                                                            >
                                                                ▶️ Print
                                                            </button>
                                                        )}
                                                        {order.status === "PRINTING" && (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, "COMPLETED")}
                                                                className="btn success py-1 px-2 text-[11px] min-h-0 font-bold"
                                                                title="Mark Completed"
                                                            >
                                                                ✅ Done
                                                            </button>
                                                        )}
                                                        <a
                                                            href={getPdfDownloadUrl(order.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn secondary py-1 px-2 text-[11px] min-h-0 font-bold"
                                                            title="Download PDF"
                                                        >
                                                            📥 PDF
                                                        </a>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}

                                        {orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)).length === 0 && (
                                            <tr>
                                                <td colSpan="10" className="text-center font-bold text-slate-500 py-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-4xl">📋</span>
                                                        <span>No active orders in the print queue right now.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* Subpage 2: WhatsApp Orders Directory */}
                        {queueSubTab === "whatsapp" && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <WhatsAppOrdersSection
                                    showAlert={(msg, type) => setModalState({ isOpen: true, title: type === "error" ? "Error" : "Success", message: msg, type: type === "error" ? "danger" : "info", showConfirmButton: false })}
                                    showConfirm={(msg, onConfirm) => setModalState({ isOpen: true, title: "Confirm Action", message: msg, type: "confirm", showConfirmButton: true, onConfirm })}
                                />
                            </motion.div>
                        )}



                        {/* Subpage 3: Printer Kiosks Status Map */}
                        {queueSubTab === "kiosks" && (
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="panel p-6 mb-4">
                                    <div className="section-header pb-2">
                                        <div>
                                            <p className="eyebrow">Hardware Map</p>
                                            <h2 className="text-2xl font-black text-slate-900">Printer Kiosk Status</h2>
                                            <p className="subtitle">Live status, paper supplies, and active queue load for all campus printing terminals.</p>
                                        </div>
                                    </div>
                                </div>
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
                                    {printers.length === 0 && (
                                        <div className="col-span-full panel p-12 text-center text-slate-400 font-bold">
                                            No printer terminals registered.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Subpage 4: Revenue Analytics & Gross vs Net Flow */}
                        {queueSubTab === "revenue" && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Main Panel Header & Filter Strip */}
                                <section className="panel p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    FINANCIAL RECONCILIATION
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">
                                                    • Live Audit Engine
                                                </span>
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                                Gross vs Net Revenue
                                            </h2>
                                            <p className="text-sm font-semibold text-slate-500 mt-1 max-w-2xl">
                                                Net revenue = gross revenue − coupon discounts − Razorpay charges ({(collegePlatformSettings && collegePlatformSettings.razorpayChargePercentage !== undefined) ? collegePlatformSettings.razorpayChargePercentage : 2.36}%)
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            {/* College Filter Selection Dropdown */}
                                            {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") ? (
                                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-500">Campus:</span>
                                                    <select
                                                        value={selectedCollegeFilter}
                                                        onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                                                        className="text-xs font-black bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="ALL">All Campuses ({Array.from(new Set(blocks.map(b => b.college).filter(Boolean))).length})</option>
                                                        {Array.from(new Set(blocks.map(b => b.college).filter(Boolean))).map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                                                    <span className="text-xs font-bold text-indigo-500">Campus:</span>
                                                    <span className="text-xs font-black text-indigo-900 uppercase">
                                                        {loggedInAdminCollege}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Period Segmented Switcher */}
                                            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
                                                {[
                                                    ["all", "All Time"],
                                                    ["today", "Today"],
                                                    ["week", "This Week"],
                                                    ["month", "This Month"],
                                                ].map(([period, label]) => {
                                                    const isActive = revenuePeriod === period || (period === "today" && revenuePeriod === "day");
                                                    return (
                                                        <button
                                                            key={period}
                                                            onClick={() => setRevenuePeriod(period)}
                                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                                                isActive
                                                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-black"
                                                                    : "text-slate-500 hover:text-slate-800"
                                                            }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => exportToCSV(orders, "revenue_financial_audit", ["Order ID", "Date & Time", "Customer", "Location", "Price", "Payment", "Order Status"])}
                                                className="btn secondary min-h-0 px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
                                            >
                                                <span>📥</span>
                                                <span>Export CSV</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual Interactive Financial Formula Strip */}
                                    <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative z-10">
                                            
                                            {/* 1. Gross Revenue Box */}
                                            <div className="flex-1 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">1. Gross Billing</span>
                                                    <span className="text-base">💵</span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-black mt-2 text-white">
                                                    ₹{(localStats.grossRevenue || 0).toFixed(2)}
                                                </p>
                                                <span className="text-[10px] text-slate-300 font-semibold mt-0.5">Total Invoiced Spend</span>
                                                <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-col gap-1 text-[9px] font-bold text-sky-200">
                                                    <div>💬 WhatsApp: ₹{(localStats.whatsappGrossRevenue || 0).toFixed(2)} ({localStats.whatsappOrdersCount || 0} ord)</div>
                                                    <div>🌐 Web Portal: ₹{(localStats.webGrossRevenue || 0).toFixed(2)} ({localStats.webOrdersCount || 0} ord)</div>
                                                </div>
                                            </div>

                                            {/* Minus Operator Pill */}
                                            <div className="self-center flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-sm shrink-0">
                                                −
                                            </div>

                                            {/* 2. Coupon Deductions */}
                                            <div className="flex-1 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">2. Coupon Discounts</span>
                                                    <span className="text-base">🎟️</span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-black mt-2 text-amber-200">
                                                    ₹{(localStats.totalDiscounts || 0).toFixed(2)}
                                                </p>
                                                <span className="text-[10px] text-amber-300/80 font-semibold mt-0.5">
                                                    {localStats.grossRevenue > 0 ? ((localStats.totalDiscounts / localStats.grossRevenue) * 100).toFixed(1) : 0}% of gross
                                                </span>
                                            </div>

                                            {/* Minus Operator Pill */}
                                            <div className="self-center flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black text-sm shrink-0">
                                                −
                                            </div>

                                            {/* 3. Razorpay Gateway Fees */}
                                            <div className="flex-1 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">3. Gateway Charges</span>
                                                    <span className="text-base">💳</span>
                                                </div>
                                                <p className="text-xl sm:text-2xl font-black mt-2 text-purple-200">
                                                    ₹{(localStats.razorpayCharges || 0).toFixed(2)}
                                                </p>
                                                <span className="text-[10px] text-purple-300/80 font-semibold mt-0.5">
                                                    {(collegePlatformSettings && collegePlatformSettings.razorpayChargePercentage !== undefined) ? collegePlatformSettings.razorpayChargePercentage : 2.36}% on UPI transactions
                                                </span>
                                            </div>

                                            {/* Equals Operator Pill */}
                                            <div className="self-center flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 font-black text-base shrink-0 shadow-lg shadow-emerald-500/20">
                                                =
                                            </div>

                                            {/* 4. Realized Net Revenue (Hero Result) */}
                                            <div className="flex-[1.2] p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-700 border border-emerald-300/50 shadow-lg shadow-emerald-950/40 flex flex-col justify-between">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">4. Realized Net Revenue</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 text-white">Actual Inflow</span>
                                                </div>
                                                <p className="text-2xl sm:text-3xl font-black mt-1 text-white tracking-tight">
                                                    ₹{((localStats.netRevenue || 0) - (localStats.razorpayCharges || 0)).toFixed(2)}
                                                </p>
                                                <span className="text-[10px] text-emerald-100 font-bold mt-0.5">
                                                    {localStats.grossRevenue > 0 ? ((((localStats.netRevenue || 0) - (localStats.razorpayCharges || 0)) / localStats.grossRevenue) * 100).toFixed(1) : 100}% retention rate
                                                </span>
                                                <div className="mt-2 pt-1.5 border-t border-white/20 flex flex-col gap-1 text-[9px] font-bold text-emerald-100">
                                                    <div>💬 WhatsApp Net: ₹{((localStats.whatsappNetRevenue || 0) - ((localStats.whatsappNetRevenue / Math.max(1, localStats.netRevenue || 1)) * (localStats.razorpayCharges || 0))).toFixed(2)}</div>
                                                    <div>🌐 Web Portal Net: ₹{((localStats.webNetRevenue || 0) - ((localStats.webNetRevenue / Math.max(1, localStats.netRevenue || 1)) * (localStats.razorpayCharges || 0))).toFixed(2)}</div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Key Financial Metric Cards (Includes WhatsApp & Web Revenue) */}
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 mt-6">
                                        {/* Card 1: Gross Revenue */}
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">Gross Revenue</span>
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">💵</div>
                                            </div>
                                            <p className="text-xl font-black text-slate-900">₹{(localStats.grossRevenue || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                Invoiced Spend
                                            </span>
                                        </div>

                                        {/* Card 2: Coupon Discounts */}
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">Coupon Discounts</span>
                                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">🎟️</div>
                                            </div>
                                            <p className="text-xl font-black text-amber-700">₹{(localStats.totalDiscounts || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                                Savings Given
                                            </span>
                                        </div>

                                        {/* Card 3: Razorpay Charges */}
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">Razorpay Charges</span>
                                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">💳</div>
                                            </div>
                                            <p className="text-xl font-black text-purple-700">₹{(localStats.razorpayCharges || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-100">
                                                {(collegePlatformSettings && collegePlatformSettings.razorpayChargePercentage !== undefined) ? collegePlatformSettings.razorpayChargePercentage : 2.36}% on UPI
                                            </span>
                                        </div>

                                        {/* Card 4: Net Revenue (Highlighted) */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-emerald-800">Realized Net</span>
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-emerald-500/30">💎</div>
                                            </div>
                                            <p className="text-xl font-black text-emerald-900">₹{((localStats.netRevenue || 0) - (localStats.razorpayCharges || 0)).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                                                Actual Inflow
                                            </span>
                                        </div>

                                        {/* Card 5: WhatsApp Revenue */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400/80 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-green-900">WhatsApp Revenue</span>
                                                <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-green-500/30">💬</div>
                                            </div>
                                            <p className="text-xl font-black text-green-900">₹{(localStats.whatsappNetRevenue || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black bg-green-600/15 text-green-800 border border-green-300">
                                                Bot Inflow ({localStats.whatsappOrdersCount || 0} ord)
                                            </span>
                                        </div>

                                        {/* Card 6: Web Portal Revenue */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-400/80 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-blue-900">Web Portal Revenue</span>
                                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/30">🌐</div>
                                            </div>
                                            <p className="text-xl font-black text-blue-900">₹{(localStats.webNetRevenue || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black bg-blue-600/15 text-blue-800 border border-blue-300">
                                                Web Inflow ({localStats.webOrdersCount || 0} ord)
                                            </span>
                                        </div>

                                        {/* Card 7: Wallet Cash */}
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">Wallet Cash</span>
                                                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm">👛</div>
                                            </div>
                                            <p className="text-xl font-black text-slate-900">₹{(localStats.walletRevenue || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-100">
                                                Prepaid Credits
                                            </span>
                                        </div>

                                        {/* Card 8: Direct UPI Cash */}
                                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">Direct UPI Cash</span>
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">⚡</div>
                                            </div>
                                            <p className="text-xl font-black text-slate-900">₹{(localStats.upiRevenue || 0).toFixed(2)}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100">
                                                Razorpay Gateway
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Channels & Retention Distribution Bars */}
                                    <div className="grid gap-6 md:grid-cols-2 mt-6 pt-6 border-t border-slate-100">
                                        {/* Channel 1: WhatsApp vs Web Revenue Breakdown */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">📱 Order Channel Revenue</span>
                                                <span className="text-xs font-bold text-slate-500">Total: ₹{(localStats.grossRevenue || 0).toFixed(2)}</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex my-2">
                                                <div
                                                    className="bg-green-500 h-full transition-all"
                                                    style={{ width: `${localStats.grossRevenue > 0 ? ((localStats.whatsappGrossRevenue / localStats.grossRevenue) * 100) : 50}%` }}
                                                    title={`WhatsApp: ${localStats.grossRevenue > 0 ? ((localStats.whatsappGrossRevenue / localStats.grossRevenue) * 100).toFixed(1) : 0}%`}
                                                />
                                                <div
                                                    className="bg-blue-500 h-full transition-all"
                                                    style={{ width: `${localStats.grossRevenue > 0 ? ((localStats.webGrossRevenue / localStats.grossRevenue) * 100) : 50}%` }}
                                                    title={`Web: ${localStats.grossRevenue > 0 ? ((localStats.webGrossRevenue / localStats.grossRevenue) * 100).toFixed(1) : 0}%`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 text-xs font-bold pt-1">
                                                <div className="flex items-center justify-between text-green-800">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                                                        <span>💬 WhatsApp ({localStats.whatsappOrdersCount || 0} orders)</span>
                                                    </div>
                                                    <span>₹{(localStats.whatsappGrossRevenue || 0).toFixed(2)} ({localStats.grossRevenue > 0 ? ((localStats.whatsappGrossRevenue / localStats.grossRevenue) * 100).toFixed(1) : 0}%)</span>
                                                </div>
                                                <div className="flex items-center justify-between text-blue-800">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                                                        <span>🌐 Web Portal ({localStats.webOrdersCount || 0} orders)</span>
                                                    </div>
                                                    <span>₹{(localStats.webGrossRevenue || 0).toFixed(2)} ({localStats.grossRevenue > 0 ? ((localStats.webGrossRevenue / localStats.grossRevenue) * 100).toFixed(1) : 0}%)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Channel 2: Retention Breakdown */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Revenue Retention Health</span>
                                                <span className="text-xs font-bold text-emerald-700 font-mono">
                                                    {localStats.grossRevenue > 0 ? ((((localStats.netRevenue || 0) - (localStats.razorpayCharges || 0)) / localStats.grossRevenue) * 100).toFixed(1) : 100}% Retained
                                                </span>
                                            </div>
                                            {/* Multi-segment Progress Bar */}
                                            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex my-2">
                                                <div 
                                                    className="bg-emerald-500 h-full transition-all" 
                                                    style={{ width: `${localStats.grossRevenue > 0 ? (((localStats.netRevenue - localStats.razorpayCharges) / localStats.grossRevenue) * 100) : 100}%` }}
                                                />
                                                <div 
                                                    className="bg-amber-400 h-full transition-all" 
                                                    style={{ width: `${localStats.grossRevenue > 0 ? ((localStats.totalDiscounts / localStats.grossRevenue) * 100) : 0}%` }}
                                                />
                                                <div 
                                                    className="bg-purple-400 h-full transition-all" 
                                                    style={{ width: `${localStats.grossRevenue > 0 ? ((localStats.razorpayCharges / localStats.grossRevenue) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between text-xs font-bold pt-1 gap-2">
                                                <div className="flex items-center gap-1.5 text-emerald-800">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                                    <span>Net Kept: ₹{((localStats.netRevenue || 0) - (localStats.razorpayCharges || 0)).toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-amber-800">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                                                    <span>Discounts: ₹{(localStats.totalDiscounts || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-purple-800">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
                                                    <span>Fees: ₹{(localStats.razorpayCharges || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Operational KPI Cards */}
                                <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Today's Inflow</span>
                                            <span className="text-sm">🌅</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">₹{(localStats.todayRevenue || 0).toFixed(2)}</p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Live Today</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Total Orders</span>
                                            <span className="text-sm">📦</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{localStats.totalOrders || 0}</p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Customer Jobs</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Printed Sheets</span>
                                            <span className="text-sm">📄</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{localStats.totalCopies || 0}</p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Paper Consumed</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Pending Queue</span>
                                            <span className="text-sm">⏳</span>
                                        </div>
                                        <p className="text-2xl font-black text-amber-600">{localStats.pendingOrders || 0}</p>
                                        <span className="text-[10px] text-amber-700 font-semibold mt-1 block">In Pipeline</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Printing Now</span>
                                            <span className="text-sm">🖨️</span>
                                        </div>
                                        <p className="text-2xl font-black text-blue-600">{localStats.printingOrders || 0}</p>
                                        <span className="text-[10px] text-blue-700 font-semibold mt-1 block">Active On Kiosks</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-500">Completed</span>
                                            <span className="text-sm">✅</span>
                                        </div>
                                        <p className="text-2xl font-black text-emerald-600">{localStats.completedOrders || 0}</p>
                                        <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                                            {localStats.totalOrders > 0 ? ((localStats.completedOrders / localStats.totalOrders) * 100).toFixed(0) : 100}% Success Rate
                                        </span>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* Subpage 5: Visual Charts */}
                        {queueSubTab === "charts" && (
                            <motion.div
                                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
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
                            </motion.div>
                        )}

                        {/* Subpage 6: All Orders History */}
                        {queueSubTab === "history" && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
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

                                <table className="data-table w-full">
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
                                                    No print orders in history
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}
                    </div>
                )}

                {/* Pricing & Coupons Tab */}
                {activeTab === "settings" && (
                    <div className="mt-6 space-y-6">

                        {/* SUBPAGE 1: Price Settings (Rate Configuration) */}
                        {pricingSubTab === "pricing" && (
                            <motion.div 
                                className="grid gap-6 lg:grid-cols-2"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Price Settings</p>
                                            <h2 className="text-2xl font-black text-slate-900">
                                                Rate Configuration
                                            </h2>
                                            <p className="subtitle">Configure page printing costs for each campus block independently.</p>
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
                                                className="field text-sm font-bold"
                                            >
                                                {blocks.map(b => (
                                                    <option key={b.id} value={b.name}>{b.name} ({b.college || "KLU"})</option>
                                                ))}
                                            </select>
                                        </label>

                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <label className="block">
                                                <span className="mb-2 block text-sm font-black text-slate-700">
                                                    Black & White Rate (₹/page)
                                                </span>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                                                    <input
                                                        type="number"
                                                        value={bwPrice}
                                                        onChange={(e) => setBwPrice(e.target.value)}
                                                        className="field !pl-12"
                                                        step="0.5"
                                                    />
                                                </div>
                                            </label>

                                            <label className="block">
                                                <span className="mb-2 block text-sm font-black text-slate-700">
                                                    Color Rate (₹/page)
                                                </span>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                                                    <input
                                                        type="number"
                                                        value={colorPrice}
                                                        onChange={(e) => setColorPrice(e.target.value)}
                                                        className="field !pl-12"
                                                        step="0.5"
                                                    />
                                                </div>
                                            </label>

                                            <label className="block">
                                                <span className="mb-2 block text-sm font-black text-slate-700">
                                                    Double Sided / Duplex (₹/sheet)
                                                </span>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                                                    <input
                                                        type="number"
                                                        value={duplexPrice}
                                                        onChange={(e) => setDuplexPrice(e.target.value)}
                                                        className="field !pl-12"
                                                        step="0.25"
                                                    />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={savePrices}
                                        className="btn success mt-6 w-full"
                                    >
                                        💾 Save Prices for {selectedPricingBlock}
                                    </button>
                                </section>

                                {/* Live Rate Summary Card */}
                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Rate Overview</p>
                                                <h3 className="text-xl font-black text-slate-900">Current Block Pricing</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {blocks.map(b => {
                                                const blockRates = blockPricesMap[b.name] || {};
                                                const bwVal = selectedPricingBlock === b.name ? bwPrice : (blockRates.bw ?? 2);
                                                const colorVal = selectedPricingBlock === b.name ? colorPrice : (blockRates.color ?? 5);
                                                const duplexVal = selectedPricingBlock === b.name ? duplexPrice : (blockRates.duplex ?? 1.5);

                                                return (
                                                    <div 
                                                        key={b.id} 
                                                        onClick={() => {
                                                            setSelectedPricingBlock(b.name);
                                                            fetchPrices(b.name);
                                                        }}
                                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                                            selectedPricingBlock === b.name
                                                                ? "bg-sky-50 border-sky-300 shadow-sm"
                                                                : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                                        }`}
                                                    >
                                                        <div>
                                                            <span className="font-black text-slate-800 text-sm block">{b.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{b.college || "KLU"}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-700">
                                                                B&W: <strong className="text-slate-900">₹{bwVal}</strong>
                                                            </span>
                                                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                                                                Color: <strong className="text-amber-900">₹{colorVal}</strong>
                                                            </span>
                                                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800">
                                                                Both Sides: <strong className="text-cyan-900">₹{duplexVal}</strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-semibold">
                                        💡 Select any block above to quickly load and edit its rate configuration.
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 2: Manage Blocks */}
                        {pricingSubTab === "blocks" && (
                            <motion.div 
                                className="space-y-6"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
                                    {/* Add Block Form */}
                                    <section className="panel p-6">
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Campus Locations</p>
                                                <h2 className="text-2xl font-black text-slate-900">Add New Block</h2>
                                                <p className="subtitle">Register a new campus location for kiosk and queue routing.</p>
                                            </div>
                                        </div>
                                        <form onSubmit={addBlock} className="space-y-4">
                                            <label className="block">
                                                <span className="block text-sm font-black text-slate-700 mb-2">Block Name</span>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. C Block, L Block, Library"
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
                                    </section>

                                    {/* Blocks List */}
                                    <section className="panel p-6 overflow-x-auto">
                                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                            <div>
                                                <p className="eyebrow">Configured Blocks</p>
                                                <h3 className="text-xl font-black text-slate-900">Block Directory ({blocks.length})</h3>
                                            </div>
                                            {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500">Filter:</span>
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
                                        <ul className="space-y-3">
                                            {blocks.map(b => (
                                                <li key={b.id} className="p-3.5 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-lg">🏛️</span>
                                                        <div>
                                                            <span className="font-black text-slate-900 text-sm block">{b.name}</span>
                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                {b.college || "KLU"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {b.serverApiKey ? (
                                                            <>
                                                                <button onClick={() => downloadServerConfig(b)} className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center" title={`Download config.json for ${b.name}`}>📥</button>
                                                                <button onClick={() => regenerateBlockKey(b.id)} className="p-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center" title="Reset / Revoke API Key">🔄</button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => regenerateBlockKey(b.id)} className="btn small !bg-indigo-50 !text-indigo-600 border border-indigo-200 hover:!bg-indigo-100">Generate Key</button>
                                                        )}
                                                        <button onClick={() => renameBlock(b.id, b.name)} className="btn small">Rename</button>
                                                        <button onClick={() => deleteBlock(b.id)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center" title="Delete Block">🗑️</button>
                                                    </div>
                                                </li>
                                            ))}
                                            {blocks.length === 0 && (
                                                <div className="text-center py-8 text-slate-400 font-bold text-sm">No campus blocks found.</div>
                                            )}
                                        </ul>
                                    </section>
                                </div>
                            </motion.div>
                        )}

                        {/* SUBPAGE 3A: % Percentage Coupon Generator */}
                        {pricingSubTab === "coupon-gen" && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {(loggedInAdminRole !== "MANAGER" || couponUnlocked) ? (
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <section className="panel p-6">
                                            <div className="section-header mb-6">
                                                <div>
                                                    <p className="eyebrow">Percentage Discounts</p>
                                                    <h2 className="text-2xl font-black text-slate-900">
                                                        % Coupon Generator
                                                    </h2>
                                                    <p className="subtitle">Create percentage reduction codes (e.g. 50% OFF, 25% OFF).</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <span className="mb-2 block text-sm font-black text-slate-700">Coupon Code</span>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. SEMEXAM50, FESTIVE25"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                            className="field uppercase font-mono font-black tracking-wider"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setCouponCode(`PRINT${Math.floor(1000 + Math.random() * 9000)}`)}
                                                            className="btn secondary shrink-0 text-xs px-3"
                                                        >
                                                            🎲 Random
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-black text-slate-700">Discount Percentage (%)</span>
                                                        <span className="text-xs font-black text-emerald-600">{discountPercentage || 0}% OFF</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="Discount % (Max 95%)"
                                                        value={discountPercentage}
                                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                                        className="field"
                                                        max="95"
                                                        min="1"
                                                    />
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {[10, 20, 25, 50, 75, 90].map(pct => (
                                                            <button
                                                                key={pct}
                                                                type="button"
                                                                onClick={() => setDiscountPercentage(pct.toString())}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                                                    discountPercentage === pct.toString()
                                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                                }`}
                                                            >
                                                                {pct}%
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <span className="mb-2 block text-sm font-black text-slate-700">Expiry Date</span>
                                                        <input
                                                            type="date"
                                                            value={expiryDate}
                                                            onChange={(e) => setExpiryDate(e.target.value)}
                                                            className="field"
                                                        />
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {[
                                                                { label: "Today", days: 0 },
                                                                { label: "Tomorrow", days: 1 },
                                                                { label: "1 Week", days: 7 },
                                                                { label: "1 Month", days: 30 },
                                                                { label: "1 Year", days: 365 },
                                                            ].map(preset => {
                                                                const d = new Date();
                                                                d.setDate(d.getDate() + preset.days);
                                                                const dateStr = d.toISOString().split('T')[0];
                                                                const isSelected = expiryDate === dateStr;
                                                                return (
                                                                    <button
                                                                        key={preset.label}
                                                                        type="button"
                                                                        onClick={() => setExpiryDate(dateStr)}
                                                                        className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                                                            isSelected
                                                                                ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                                                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                                        }`}
                                                                    >
                                                                        {preset.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="mb-2 block text-sm font-black text-slate-700">Max Uses</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Max Uses"
                                                            value={maxUses}
                                                            onChange={(e) => setMaxUses(e.target.value)}
                                                            className="field"
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={createPercentageCoupon}
                                                    className="btn primary w-full mt-4"
                                                >
                                                    ✨ Create % Discount Coupon
                                                </button>
                                            </div>
                                        </section>

                                        {/* Coupon Live Preview Card */}
                                        <section className="panel p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="section-header mb-4">
                                                    <div>
                                                        <p className="eyebrow">Preview</p>
                                                        <h3 className="text-xl font-black text-slate-900">Live Percentage Card</h3>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full">SPECIAL DISCOUNT</span>
                                                            <h3 className="text-3xl font-black mt-3">
                                                                {discountPercentage ? `${discountPercentage}% OFF` : "0% OFF"}
                                                            </h3>
                                                        </div>
                                                        <span className="text-3xl">🎟️</span>
                                                    </div>
                                                    <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[10px] text-sky-200 uppercase font-bold">PROMO CODE</p>
                                                            <p className="font-mono font-black text-lg tracking-wider">{couponCode || "ENTER-CODE"}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-sky-200 uppercase font-bold">EXPIRES</p>
                                                            <p className="text-xs font-bold">{expiryDate || "No Expiry"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WhatsApp Share & Photo Download Buttons for Coupon */}
                                            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => shareCouponOnWhatsApp(couponCode, discountPercentage ? `${discountPercentage}% OFF` : "50% OFF", expiryDate)}
                                                    className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950 shadow-md transition-all cursor-pointer"
                                                >
                                                    <span>💬</span> Share Photo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadCouponImage(couponCode, discountPercentage ? `${discountPercentage}% OFF` : "50% OFF", expiryDate)}
                                                    className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                                                >
                                                    <span>🖼️</span> Download PNG
                                                </button>
                                            </div>

                                            <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Total Active Coupons: <strong>{coupons.length}</strong></span>
                                                <button onClick={() => setPricingSubTab("active-coupons")} className="text-sky-600 hover:text-sky-700 underline cursor-pointer">View all active coupons →</button>
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <section className="panel p-8 flex flex-col items-center justify-center min-h-[350px]">
                                        <span className="text-4xl mb-3">🔒</span>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">Coupons & Discounts Locked</h2>
                                        <p className="text-slate-500 mb-6 text-sm text-center max-w-sm">Please enter the security passkey provided by your Sub-Admin to access coupon configuration.</p>
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
                                    </section>
                                )}
                            </motion.div>
                        )}

                        {/* SUBPAGE 3B: ₹ Flat Amount Off Coupon Generator */}
                        {pricingSubTab === "flat-coupon-gen" && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {(loggedInAdminRole !== "MANAGER" || couponUnlocked) ? (
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <section className="panel p-6">
                                            <div className="section-header mb-6">
                                                <div>
                                                    <p className="eyebrow">Flat Rupee Deductions</p>
                                                    <h2 className="text-2xl font-black text-slate-900">
                                                        ₹ Flat Off Coupon Generator
                                                    </h2>
                                                    <p className="subtitle">Create fixed rupee discount codes with optional minimum order value.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <span className="mb-2 block text-sm font-black text-slate-700">Coupon Code</span>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. FLAT20, SAVE50"
                                                            value={flatCouponCode}
                                                            onChange={(e) => setFlatCouponCode(e.target.value.toUpperCase())}
                                                            className="field uppercase font-mono font-black tracking-wider"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFlatCouponCode(`SAVE${Math.floor(1000 + Math.random() * 9000)}`)}
                                                            className="btn secondary shrink-0 text-xs px-3"
                                                        >
                                                            🎲 Random
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold text-slate-700">Flat Discount (₹)</span>
                                                        <span className="text-xs font-black text-emerald-600">₹{flatDiscountAmount || 0} FLAT OFF</span>
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Discount in ₹ (e.g. 20)"
                                                            value={flatDiscountAmount}
                                                            onChange={(e) => setFlatDiscountAmount(e.target.value)}
                                                            className="field pl-8"
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {[5, 10, 20, 30, 50, 100].map(val => (
                                                            <button
                                                                key={val}
                                                                type="button"
                                                                onClick={() => setFlatDiscountAmount(val.toString())}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                                                    flatDiscountAmount === val.toString()
                                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                                }`}
                                                            >
                                                                ₹{val}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="block text-sm font-black text-slate-700">Min Order Value (₹)</span>
                                                            <span className="text-[11px] font-bold text-slate-400">Optional</span>
                                                        </div>
                                                        <div className="relative">
                                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 50 (0 for no min)"
                                                                value={flatMinOrderAmount}
                                                                onChange={(e) => setFlatMinOrderAmount(e.target.value)}
                                                                className="field pl-8"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {[0, 20, 50, 100, 200].map(val => (
                                                                <button
                                                                    key={val}
                                                                    type="button"
                                                                    onClick={() => setFlatMinOrderAmount(val ? val.toString() : "")}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                                                        (flatMinOrderAmount === val.toString() || (!flatMinOrderAmount && val === 0))
                                                                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                                                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                                    }`}
                                                                >
                                                                    {val === 0 ? "No Min" : `₹${val}+`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="mb-2 block text-sm font-black text-slate-700">Max Uses</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Max Uses"
                                                            value={flatMaxUses}
                                                            onChange={(e) => setFlatMaxUses(e.target.value)}
                                                            className="field"
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="mb-2 block text-sm font-black text-slate-700">Expiry Date</span>
                                                    <input
                                                        type="date"
                                                        value={flatExpiryDate}
                                                        onChange={(e) => setFlatExpiryDate(e.target.value)}
                                                        className="field"
                                                    />
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {[
                                                            { label: "Today", days: 0 },
                                                            { label: "Tomorrow", days: 1 },
                                                            { label: "1 Week", days: 7 },
                                                            { label: "1 Month", days: 30 },
                                                            { label: "1 Year", days: 365 },
                                                        ].map(preset => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() + preset.days);
                                                            const dateStr = d.toISOString().split('T')[0];
                                                            const isSelected = flatExpiryDate === dateStr;
                                                            return (
                                                                <button
                                                                    key={preset.label}
                                                                    type="button"
                                                                    onClick={() => setFlatExpiryDate(dateStr)}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                                                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                                    }`}
                                                                >
                                                                    {preset.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={createFlatCoupon}
                                                    className="btn primary w-full mt-4"
                                                >
                                                    ✨ Create ₹ Flat Off Coupon
                                                </button>
                                            </div>
                                        </section>

                                        {/* Flat Coupon Live Preview Card */}
                                        <section className="panel p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="section-header mb-4">
                                                    <div>
                                                        <p className="eyebrow">Preview</p>
                                                        <h3 className="text-xl font-black text-slate-900">Live Flat Off Card</h3>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl relative overflow-hidden">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full">FLAT DISCOUNT</span>
                                                            <h3 className="text-3xl font-black mt-3">
                                                                {flatDiscountAmount ? `₹${Number(flatDiscountAmount).toFixed(0)} FLAT OFF` : "₹0 OFF"}
                                                            </h3>
                                                        </div>
                                                        <span className="text-3xl">🏷️</span>
                                                    </div>
                                                    <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[10px] text-teal-100 uppercase font-bold">PROMO CODE</p>
                                                            <p className="font-mono font-black text-lg tracking-wider">{flatCouponCode || "ENTER-CODE"}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-teal-100 uppercase font-bold">
                                                                {flatMinOrderAmount && Number(flatMinOrderAmount) > 0 ? `MIN: ₹${flatMinOrderAmount}` : "EXPIRES"}
                                                            </p>
                                                            <p className="text-xs font-bold">{flatExpiryDate || "No Expiry"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WhatsApp Share & Photo Download Buttons for Flat Coupon */}
                                            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => shareCouponOnWhatsApp(flatCouponCode, `₹${flatDiscountAmount || 20} FLAT OFF`, flatExpiryDate, flatMinOrderAmount)}
                                                    className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950 shadow-md transition-all cursor-pointer"
                                                >
                                                    <span>💬</span> Share Photo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadCouponImage(flatCouponCode, `₹${flatDiscountAmount || 20} FLAT OFF`, flatExpiryDate, flatMinOrderAmount)}
                                                    className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                                                >
                                                    <span>🖼️</span> Download PNG
                                                </button>
                                            </div>

                                            <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Total Active Coupons: <strong>{coupons.length}</strong></span>
                                                <button onClick={() => setPricingSubTab("active-coupons")} className="text-teal-600 hover:text-teal-700 underline cursor-pointer">View all active coupons →</button>
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <section className="panel p-8 flex flex-col items-center justify-center min-h-[350px]">
                                        <span className="text-4xl mb-3">🔒</span>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">Coupons & Discounts Locked</h2>
                                        <p className="text-slate-500 mb-6 text-sm text-center max-w-sm">Please enter the security passkey provided by your Sub-Admin to access coupon configuration.</p>
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
                                    </section>
                                )}
                            </motion.div>
                        )}

                        {/* SUBPAGE 4: Active Coupons List */}
                        {pricingSubTab === "active-coupons" && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {(loggedInAdminRole !== "MANAGER" || couponUnlocked) ? (
                                    <section className="panel p-6 overflow-x-auto">
                                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-100">
                                            <div>
                                                <p className="eyebrow">Coupons</p>
                                                <h2 className="text-2xl font-black text-slate-900">
                                                    Active Coupons Directory ({coupons.length})
                                                </h2>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => exportToCSV(coupons, "coupons_list", ["Code", "Discount", "Expiry", "Used"])}
                                                    className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                                >
                                                    📥 Export CSV
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

                                        <table className="data-table mt-4 w-full">
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
                                                    <th>Usage Count</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coupons.map((coupon, index) => (
                                                    <tr key={coupon.id}>
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
                                                        <td className="font-black font-mono tracking-wider">
                                                            {coupon.couponCode}
                                                        </td>
                                                        <td className="font-bold text-emerald-600">
                                                            <div>
                                                                <span>
                                                                    {coupon.discountPercentage && coupon.discountPercentage > 0 
                                                                        ? `${coupon.discountPercentage}% OFF` 
                                                                        : `₹${Number(coupon.discountAmount || 0).toFixed(0)} FLAT OFF`}
                                                                </span>
                                                                {coupon.minOrderAmount && Number(coupon.minOrderAmount) > 0 && (
                                                                    <span className="block text-[10px] font-bold text-sky-600">
                                                                        Min: ₹{Number(coupon.minOrderAmount).toFixed(0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-slate-600 text-xs font-semibold">
                                                            {coupon.expiryDate || "No Expiry"}
                                                        </td>
                                                        <td className="text-xs font-bold text-slate-700">
                                                            {coupon.usedCount} / {coupon.maxUses}
                                                        </td>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => shareCouponOnWhatsApp(coupon.couponCode, coupon.discountPercentage, coupon.expiryDate)}
                                                                    className="btn success min-h-0 px-2.5 py-1 text-xs font-bold flex items-center gap-1 bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950"
                                                                    title="Share coupon via WhatsApp"
                                                                >
                                                                    <span>💬</span> Share
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteCoupon(coupon.id)}
                                                                    className="btn danger min-h-0 px-2.5 py-1 text-xs font-bold"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {coupons.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="text-center font-bold text-slate-500 py-10">
                                                            No active coupons found. Use Coupon Generator to create one.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                ) : (
                                    <section className="panel p-8 flex flex-col items-center justify-center min-h-[300px]">
                                        <span className="text-4xl mb-3">🔒</span>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">Coupons Directory Locked</h2>
                                        <p className="text-slate-500 mb-6 text-sm text-center max-w-sm">Please unlock coupons in the Coupon Generator tab to view active codes.</p>
                                    </section>
                                )}
                            </motion.div>
                        )}

                        {/* SUBPAGE 5: Voucher Generator (Rewards Program) */}
                        {pricingSubTab === "voucher-gen" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Rewards Program</p>
                                            <h2 className="text-2xl font-black text-slate-900">Voucher Generator</h2>
                                            <p className="subtitle">Issue fixed rupee value bonus vouchers that credit directly into user wallets.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={createReward} className="space-y-4">
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Voucher Title</span>
                                            <input type="text" className="field" placeholder="e.g. Welcome Bonus, Festival Treat" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Voucher Description</span>
                                            <input type="text" className="field" placeholder="e.g. Earn Rs. 50 wallet credits instantly" value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} required />
                                        </label>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="block text-xs font-black text-slate-700 mb-1">Reward Amount (₹)</span>
                                                <input type="number" className="field" placeholder="e.g. 50" value={rewardAmt} onChange={(e) => setRewardAmt(e.target.value)} required min="1" />
                                                <div className="flex gap-1.5 mt-2">
                                                    {[20, 50, 100, 200, 500].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setRewardAmt(val.toString())}
                                                            className={`px-2 py-0.5 rounded text-[11px] font-black border transition-all cursor-pointer ${
                                                                rewardAmt === val.toString()
                                                                    ? "bg-emerald-600 text-white border-emerald-600"
                                                                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                                            }`}
                                                        >
                                                            ₹{val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-black text-slate-700 mb-1">Voucher Code (uppercase)</span>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        className="field uppercase tracking-wider font-mono font-black" 
                                                        placeholder="e.g. BONUS50" 
                                                        value={rewardCode} 
                                                        onChange={(e) => setRewardCode(e.target.value.toUpperCase())} 
                                                        required 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setRewardCode(`BONUS${Math.floor(1000 + Math.random() * 9000)}`)}
                                                        className="btn secondary shrink-0 text-xs px-3 cursor-pointer"
                                                        title="Generate Random Voucher Code"
                                                    >
                                                        🎲 Random
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Max Claims allowed</span>
                                            <input type="number" className="field" value={rewardMaxClaims} onChange={(e) => setRewardMaxClaims(e.target.value)} required />
                                        </label>
                                        <button type="submit" className="btn success w-full mt-4" disabled={creatingReward}>
                                            {creatingReward ? "Creating Voucher..." : "🎁 Generate Reward Voucher"}
                                        </button>
                                    </form>
                                </section>

                                {/* Voucher Live Preview Card */}
                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Preview</p>
                                                <h3 className="text-xl font-black text-slate-900">Live Voucher Card</h3>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl relative overflow-hidden">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full">WALLET REWARD</span>
                                                    <h3 className="text-3xl font-black mt-3">₹{rewardAmt ? Number(rewardAmt).toFixed(2) : "50.00"} FREE</h3>
                                                    <p className="text-xs font-semibold text-emerald-100 mt-1">{rewardTitle || "Welcome Bonus"}</p>
                                                </div>
                                                <span className="text-3xl">🎁</span>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] text-emerald-200 uppercase font-bold">VOUCHER CODE</p>
                                                    <p className="font-mono font-black text-lg tracking-wider">{rewardCode || "BONUS50"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-emerald-200 uppercase font-bold">MAX CLAIMS</p>
                                                    <p className="text-xs font-bold">{rewardMaxClaims || "100"} Users</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* WhatsApp Share & Photo Download Buttons for Voucher */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => shareVoucherOnWhatsApp(rewardCode, rewardAmt, rewardTitle, rewardMaxClaims)}
                                            className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950 shadow-md transition-all cursor-pointer"
                                        >
                                            <span>💬</span> Share Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => downloadVoucherImage(rewardCode, rewardAmt, rewardTitle, rewardMaxClaims)}
                                            className="flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                                        >
                                            <span>🖼️</span> Download PNG
                                        </button>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500">
                                        <span>Total Active Vouchers: <strong>{rewards.length}</strong></span>
                                        <button onClick={() => setPricingSubTab("active-vouchers")} className="text-emerald-600 hover:text-emerald-700 underline cursor-pointer">View all active vouchers →</button>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 6: Active Vouchers List */}
                        {pricingSubTab === "active-vouchers" && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <section className="panel p-6 overflow-x-auto">
                                    <div className="section-header mb-6 pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="eyebrow">Active Vouchers</p>
                                            <h2 className="text-2xl font-black text-slate-900">Vouchers Directory ({rewards.length})</h2>
                                        </div>
                                        <button onClick={() => setPricingSubTab("voucher-gen")} className="btn primary text-xs px-3 py-1.5">
                                            ➕ New Voucher
                                        </button>
                                    </div>
                                    <table className="data-table w-full">
                                        <thead><tr><th>Code</th><th>Title</th><th>Reward Value</th><th>Claims Progress</th><th>Status</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {rewards.map(rew => (
                                                <tr key={rew.id}>
                                                    <td className="font-mono font-black text-slate-900 tracking-wide uppercase">{rew.claimCode}</td>
                                                    <td className="font-bold text-slate-700">{rew.title || rew.claimCode}</td>
                                                    <td className="font-black text-emerald-600">₹{rew.rewardAmount ? rew.rewardAmount.toFixed(2) : "0.00"}</td>
                                                    <td className="text-xs font-bold text-slate-600">{rew.claimedCount} / {rew.maxClaims}</td>
                                                    <td>
                                                        <button onClick={() => toggleRewardActive(rew.id, rew.active)} className={`status-pill ${rew.active ? 'status-paid' : 'status-unpaid'}`} style={{ fontSize: '10px', minHeight: '22px' }}>
                                                            {rew.active ? "ACTIVE" : "INACTIVE"}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => shareVoucherOnWhatsApp(rew.claimCode, rew.rewardAmount, rew.title)}
                                                                className="btn success min-h-0 px-2.5 py-1 text-xs font-bold flex items-center gap-1 bg-[#25D366] hover:bg-[#1ebd5a] text-slate-950"
                                                                title="Share voucher via WhatsApp"
                                                            >
                                                                <span>💬</span> Share
                                                            </button>
                                                            <button onClick={() => deleteReward(rew.id)} className="btn danger min-h-0 px-2.5 py-1 text-xs font-bold">Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rewards.length === 0 && (<tr><td colSpan="6" className="text-center font-bold text-slate-500 py-10">No reward vouchers created yet.</td></tr>)}
                                        </tbody>
                                    </table>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 7: Refer & Earn Program (Referrals) */}
                        {pricingSubTab === "referrals" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Referrals</p>
                                            <h2 className="text-2xl font-black text-slate-900">Refer & Earn Program</h2>
                                            <p className="subtitle">Configure automatic wallet reward bonuses for both referrer and new invitees.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={saveSystemSettings} className="space-y-5">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="refEnabled-rewards" 
                                                checked={systemSettings.referralEnabled}
                                                onChange={(e) => setSystemSettings({...systemSettings, referralEnabled: e.target.checked})}
                                                className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                                            />
                                            <label htmlFor="refEnabled-rewards" className="text-sm font-black text-slate-800 cursor-pointer">
                                                Enable Refer & Earn Program
                                                <span className="block text-xs font-semibold text-slate-500 mt-0.5">When checked, users can share referral links to earn credits.</span>
                                            </label>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Referrer Bonus (₹)</span>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input 
                                                        type="number" 
                                                        className="field pl-8" 
                                                        value={systemSettings.referrerAmount}
                                                        onChange={(e) => setSystemSettings({...systemSettings, referrerAmount: Number(e.target.value)})}
                                                        step="0.5"
                                                    />
                                                </div>
                                            </label>
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">New User Bonus (₹)</span>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input 
                                                        type="number" 
                                                        className="field pl-8" 
                                                        value={systemSettings.refereeAmount}
                                                        onChange={(e) => setSystemSettings({...systemSettings, refereeAmount: Number(e.target.value)})}
                                                        step="0.5"
                                                    />
                                                </div>
                                            </label>
                                        </div>
                                        <button type="submit" className="btn success w-full mt-4">💾 Save Referral Rules</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Program Rules</p>
                                                <h3 className="text-xl font-black text-slate-900">How Referrals Work</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="text-slate-900 block mb-0.5">1. User Shares Code</strong>
                                                Students can find their unique referral link in their Account Profile popup or dashboard.
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="text-slate-900 block mb-0.5">2. Invitee Signs Up</strong>
                                                When a new student enters the code during registration, they get <strong>₹{systemSettings.refereeAmount || 5}</strong> free wallet balance.
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="text-slate-900 block mb-0.5">3. Referrer Gets Rewarded</strong>
                                                The referrer instantly receives <strong>₹{systemSettings.referrerAmount || 10}</strong> in their cloud print wallet!
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                                        <span>🎉</span>
                                        <span>Referral bonuses are automatically credited in real-time.</span>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* College & Campus Management Tab */}
                {(activeTab === "colleges" || activeTab === "blocks" || activeTab === "printers") && (
                    <div className="mt-6 space-y-6">

                        {/* SUBPAGE 1: Colleges Directory & Gateway */}
                        {(collegesSubTab === "colleges-list" || blocksSubTab === "colleges-list") && (
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Institutions</p>
                                        <h3 className="font-black text-2xl text-slate-900">Manage All Colleges</h3>
                                        <p className="text-sm text-slate-500 font-semibold mt-1">Suspend colleges, view their blocks, or configure dedicated payment gateways per campus.</p>
                                    </div>
                                    <button
                                        onClick={() => setCollegesSubTab("add-college")}
                                        className="btn primary min-h-0 px-4 py-2 text-xs font-bold"
                                    >
                                        ➕ Add College
                                    </button>
                                </div>
                                
                                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => {
                                        const isSuspended = suspendedColleges.split(",").map(s => s.trim()).includes(col);
                                        const colBlocks = allBlocks.filter(b => b.college === col);
                                        return (
                                            <div key={col} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between items-start gap-4">
                                                <div className="w-full">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-slate-900 text-xl">{col}</h4>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isSuspended ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                            {isSuspended ? 'SUSPENDED' : 'OPERATIONAL'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mt-4 mb-4">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Associated Blocks ({colBlocks.length})</p>
                                                        <ul className="text-sm font-semibold text-slate-700 space-y-1 bg-slate-50 p-3 border border-slate-200 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar">
                                                            {colBlocks.map(cb => (
                                                                <li key={cb.id} className="flex justify-between border-b border-slate-200/60 pb-1.5 pt-0.5 last:border-0 last:pb-0">
                                                                    <span>🏛️ {cb.name}</span>
                                                                </li>
                                                            ))}
                                                            {colBlocks.length === 0 && <li className="text-slate-400">No blocks associated</li>}
                                                        </ul>
                                                    </div>
                                                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-500 uppercase text-[10px]">Razorpay Gateway</span>
                                                            {(() => {
                                                                const existing = collegeConfigs.find(c => c.collegeName === col);
                                                                return (
                                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${existing?.razorpayKeyId ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {existing?.razorpayKeyId ? '✅ Custom Merchant' : 'ℹ️ Default Gateway'}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-full space-y-2 mt-auto">
                                                    <div className="flex w-full gap-2">
                                                        <button 
                                                            onClick={() => toggleCollegeSuspension(col)}
                                                            className={`btn text-xs py-2 flex-1 font-bold ${isSuspended ? 'secondary' : 'warning'}`}
                                                        >
                                                            {isSuspended ? '▶️ Resume' : '⏸️ Suspend'}
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to DELETE the college "${col}" and ALL its ${colBlocks.length} blocks? This cannot be undone.`)) {
                                                                    try {
                                                                        for (const block of colBlocks) {
                                                                            await api.delete(`/blocks/delete/${block.id}`);
                                                                        }
                                                                        fetchBlocks();
                                                                        if (isSuspended) {
                                                                            toggleCollegeSuspension(col);
                                                                        }
                                                                        alert(`${col} and all its blocks have been deleted.`);
                                                                    } catch (err) {
                                                                        alert("Error deleting some blocks.");
                                                                    }
                                                                }
                                                            }}
                                                            className="btn danger text-xs py-2 flex-1 font-bold"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const existing = collegeConfigs.find(c => c.collegeName === col);
                                                            setConfigKeyId(existing?.razorpayKeyId || "");
                                                            setConfigKeySecret(existing?.razorpayKeySecret || "");
                                                            setPaymentConfigModal(col);
                                                        }}
                                                        className="btn primary text-xs py-2 w-full font-bold flex items-center justify-center gap-1.5"
                                                    >
                                                        💳 Configure Payment Gateway
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).length === 0 && (
                                        <div className="col-span-full text-center py-10 text-slate-400 font-bold">No colleges found in the system.</div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* SUBPAGE 2: Add New College Form */}
                        {collegesSubTab === "add-college" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <p className="eyebrow">New Institution</p>
                                        <h3 className="font-black text-2xl text-slate-900">Add New College</h3>
                                        <p className="text-sm text-slate-500 font-semibold mt-1">A college requires at least one initial block location to get established.</p>
                                    </div>
                                    <form onSubmit={addBlock} className="space-y-4">
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
                                        <button type="submit" className="btn success w-full mt-2">
                                            ➕ Create College & Block
                                        </button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Multi-Tenant Setup</p>
                                            <h3 className="text-xl font-black text-slate-900">Multi-College System</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">🏢 Isolated Campus Data</strong>
                                                Each college can have its own sub-admins, printers, blocks, and reports.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">💳 Razorpay Account Splitting</strong>
                                                Attach distinct Razorpay Key ID and Secrets so payments go directly to the respective institution's merchant account.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 3: Block Directory Table & Actions */}
                        {(collegesSubTab === "all-blocks" || blocksSubTab === "all-blocks") && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Campus Locations</p>
                                        <h2 className="text-2xl font-black text-slate-900">Block Directory ({blocks.length})</h2>
                                        <p className="subtitle">Manage physical campus blocks, generate kiosk print-agent config keys, and configure routing.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {((loggedInAdminRole !== "SUB_ADMIN" && loggedInAdminRole !== "MANAGER") || loggedInAdminUser === "admin") && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">Filter:</span>
                                                <select
                                                    value={blockCollegeFilter}
                                                    onChange={(e) => setBlockCollegeFilter(e.target.value)}
                                                    className="field !w-auto text-xs py-1.5 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                                >
                                                    <option value="ALL">All Colleges</option>
                                                    {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => (
                                                        <option key={col} value={col}>{col} College</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { setCollegesSubTab("add-block"); setBlocksSubTab("add-block"); }}
                                            className="btn primary min-h-0 px-4 py-2 text-xs font-bold"
                                        >
                                            ➕ Add Block
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {blocks.map(b => {
                                        const assignedPrinters = printers.filter(p => p.blockLocation === b.name);
                                        return (
                                            <div key={b.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-2xl">🏛️</span>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 text-lg">{b.name}</h4>
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200">
                                                                    {b.college || "KLU"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                                                        <div className="flex justify-between text-slate-600 font-semibold">
                                                            <span>Assigned Printers:</span>
                                                            <strong className="text-slate-900">{assignedPrinters.length} Terminal(s)</strong>
                                                        </div>
                                                        <div className="flex justify-between text-slate-600 font-semibold">
                                                            <span>Agent API Key:</span>
                                                            <span className="font-mono text-[10px] text-slate-700 font-bold">{b.serverApiKey ? "Configured ✅" : "Not Generated ⚠️"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                                    {b.serverApiKey ? (
                                                        <>
                                                            <button onClick={() => downloadServerConfig(b)} className="btn secondary text-xs py-1.5 px-2.5 font-bold flex-1 flex items-center justify-center gap-1" title="Download config.json for Print Agent">
                                                                📥 Config
                                                            </button>
                                                            <button onClick={() => regenerateBlockKey(b.id)} className="btn secondary text-xs py-1.5 px-2.5 font-bold text-amber-600 hover:text-amber-700" title="Reset / Revoke API Key">
                                                                🔄 Key
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => regenerateBlockKey(b.id)} className="btn secondary text-xs py-1.5 px-2.5 font-bold flex-1 text-indigo-600">
                                                            🔑 Generate Key
                                                        </button>
                                                    )}
                                                    <button onClick={() => renameBlock(b.id, b.name)} className="btn secondary text-xs py-1.5 px-2.5 font-bold">
                                                        ✏️ Rename
                                                    </button>
                                                    <button onClick={() => deleteBlock(b.id)} className="btn danger text-xs py-1.5 px-2.5 font-bold" title="Delete Block">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {blocks.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-slate-400 font-bold">
                                            No blocks found in this view. Click "Add Block" to create one.
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* SUBPAGE 4: Add New Block Form */}
                        {(collegesSubTab === "add-block" || blocksSubTab === "add-block") && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <p className="eyebrow">Campus Locations</p>
                                        <h3 className="font-black text-2xl text-slate-900">Add New Block</h3>
                                        <p className="text-sm text-slate-500 font-semibold mt-1">Register a new campus location for kiosk and queue routing.</p>
                                    </div>
                                    <form onSubmit={addBlock} className="space-y-4">
                                        <label className="block">
                                            <span className="block text-sm font-black text-slate-700 mb-2">Block Name</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. C Block, L Block, Library, Central Kiosk"
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
                                                    placeholder="e.g. KLU, Stanford, MIT"
                                                    className="field"
                                                    value={newBlockCollege}
                                                    onChange={(e) => setNewBlockCollege(e.target.value)}
                                                    required
                                                />
                                            )}
                                        </label>
                                        <button type="submit" className="btn success w-full mt-2">
                                            ➕ Create Block Location
                                        </button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Kiosk Hardware Setup</p>
                                            <h3 className="text-xl font-black text-slate-900">Block Configuration Guide</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">🏛️ Physical Print Node</strong>
                                                Each block corresponds to a designated location on campus where students pick up their prints.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">📥 Agent Config JSON</strong>
                                                After creating a block, download its <code>config.json</code> to connect your physical Raspberry Pi / Windows Print Agent.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 5: Block Overview / Rates & Health */}
                        {(collegesSubTab === "overview" || blocksSubTab === "overview") && (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Terminal Health</p>
                                        <h2 className="text-2xl font-black text-slate-900">Block Overview & Terminal Status</h2>
                                        <p className="subtitle">Live status of printers, paper levels, and queue health across all campus blocks.</p>
                                    </div>
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {blocks.map(b => {
                                        const assignedPrinters = printers.filter(p => p.blockLocation === b.name);
                                        const hasActivePrinter = assignedPrinters.some(p => p.active && !p.maintenance);
                                        const printer = assignedPrinters[0];
                                        const paperCount = printer?.paperCount ?? 500;
                                        return (
                                            <div key={b.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between gap-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-black text-slate-900 text-lg">🏛️ {b.name}</h4>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${hasActivePrinter ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                                            {hasActivePrinter ? 'OPERATIONAL' : 'TERMINAL OFFLINE'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500">{b.college || "KLU"}</p>
                                                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                            <span className="text-xl font-black text-slate-900">{assignedPrinters.length}</span>
                                                            <span className="block text-[10px] font-bold text-slate-500 uppercase mt-0.5">Printers</span>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                            <span className="text-xl font-black text-slate-900">{paperCount}</span>
                                                            <span className="block text-[10px] font-bold text-slate-500 uppercase mt-0.5">Paper Sheets</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}

                        {/* SUBPAGE 6: Printers Fleet Directory Table */}
                        {(collegesSubTab === "printers-list" || printersSubTab === "printers-list") && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Hardware Fleet</p>
                                        <h2 className="text-2xl font-black text-slate-900">Printers Directory ({getRoleFilteredPrinters().length})</h2>
                                        <p className="subtitle">View terminal IP addresses, toggle active maintenance status, and restock paper trays.</p>
                                    </div>
                                    <button
                                        onClick={() => { setCollegesSubTab("add-printer"); setPrintersSubTab("add-printer"); }}
                                        className="btn primary min-h-0 px-4 py-2 text-xs font-bold"
                                    >
                                        ➕ Add Printer
                                    </button>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Terminal Name</th>
                                            <th>IP Address</th>
                                            <th>Block Location</th>
                                            <th>Print Type</th>
                                            <th>Status</th>
                                            <th>Maintenance Mode</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getRoleFilteredPrinters().map((p) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">🖨️</span>
                                                        <span className="font-black text-slate-900">{p.printerName}</span>
                                                    </div>
                                                </td>
                                                <td className="font-mono font-bold text-slate-600">{p.printerIp || "192.168.1.100"}</td>
                                                <td><span className="text-xs font-black bg-slate-100 px-2 py-1 rounded text-slate-700">{p.blockLocation}</span></td>
                                                <td>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${p.colourSupported ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {p.colourSupported ? 'COLOR' : 'B&W'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${p.active ? 'status-paid' : 'status-unpaid'}`}>
                                                        {p.active ? 'ONLINE' : 'OFFLINE'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => togglePrinterMaintenance(p)}
                                                        className={`btn small font-bold ${p.maintenance ? 'danger' : 'secondary'}`}
                                                    >
                                                        {p.maintenance ? '🛠️ In Maintenance' : '✅ Operational'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => deletePrinter(p.id)}
                                                        className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {getRoleFilteredPrinters().length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center font-bold text-slate-400 py-10">
                                                    No printers configured. Click Add Printer to connect a new station.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 7: Add Printer Form */}
                        {(collegesSubTab === "add-printer" || printersSubTab === "add-printer") && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Terminal Setup</p>
                                            <h2 className="text-2xl font-black text-slate-900">Add New Printer</h2>
                                            <p className="subtitle">Connect a physical printer terminal to an active campus block location.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={addPrinter} className="space-y-4">
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Select Campus Block</span>
                                            <select
                                                value={newPrinterBlock}
                                                onChange={(e) => setNewPrinterBlock(e.target.value)}
                                                className="field cursor-pointer"
                                                required
                                            >
                                                <option value="">-- Choose Block --</option>
                                                {blocks.map(b => (
                                                    <option key={b.id} value={b.name}>{b.name} ({b.college || "KLU"})</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Printer Station Name</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. C Block HP LaserJet Pro"
                                                className="field"
                                                value={newPrinterName}
                                                onChange={(e) => setNewPrinterName(e.target.value)}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1">Local Network IP Address</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. 192.168.1.100"
                                                className="field font-mono"
                                                value={newPrinterIp}
                                                onChange={(e) => setNewPrinterIp(e.target.value)}
                                            />
                                        </label>
                                        <div className="grid gap-4 sm:grid-cols-3 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={newPrinterColor}
                                                    onChange={(e) => setNewPrinterColor(e.target.checked)}
                                                    className="w-4 h-4 accent-sky-600 rounded"
                                                />
                                                <span className="text-xs font-bold text-slate-800">Color Supported</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={newPrinterDuplex}
                                                    onChange={(e) => setNewPrinterDuplex(e.target.checked)}
                                                    className="w-4 h-4 accent-sky-600 rounded"
                                                />
                                                <span className="text-xs font-bold text-slate-800">Supports Duplex (Double-Sided)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={newPrinterActive}
                                                    onChange={(e) => setNewPrinterActive(e.target.checked)}
                                                    className="w-4 h-4 accent-sky-600 rounded"
                                                />
                                                <span className="text-xs font-bold text-slate-800">Set Online Immediately</span>
                                            </label>
                                        </div>
                                        <button type="submit" className="btn success w-full mt-4">
                                            ➕ Save & Pair Printer Station
                                        </button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Hardware Configuration</p>
                                            <h3 className="text-xl font-black text-slate-900">Printer Pairing</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-800">
                                                <strong className="block mb-0.5 text-sky-950">📡 Local IP Routing</strong>
                                                Each kiosk agent communicates with its assigned printer IP over local subnet or USB driver spooler.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-800">
                                                <strong className="block mb-0.5 text-purple-950">🖨️ B&W vs Color Assignment</strong>
                                                You can configure separate Black & White and Color printer terminals for the same block.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 8: Paper Stock Tray Restock */}
                        {(collegesSubTab === "paper-stock" || printersSubTab === "paper-stock") && (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Paper Inventory</p>
                                        <h2 className="text-2xl font-black text-slate-900">Paper Tray Stock Management</h2>
                                        <p className="subtitle">Monitor and update remaining paper sheets for each campus block printer tray.</p>
                                    </div>
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {blocks.map((b) => {
                                        const printer = printers.find(p => p.blockLocation === b.name);
                                        const currentCount = printer?.paperCount ?? 500;
                                        const isLow = currentCount < 50;
                                        return (
                                            <div key={b.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between gap-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-black text-slate-900 text-lg">🏛️ {b.name}</h4>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isLow ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                            {isLow ? 'LOW STOCK' : 'STOCKED'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500">{b.college || "KLU"}</p>
                                                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                                        <p className="text-3xl font-black text-slate-900">{currentCount}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Sheets Remaining</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Add sheets e.g. 500"
                                                        className="field text-xs py-2 px-3"
                                                        id={`paper-input-${b.name}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const input = document.getElementById(`paper-input-${b.name}`);
                                                            const val = input ? parseInt(input.value) : 0;
                                                            if (val > 0) {
                                                                updatePrinterPaper(b.name, currentCount + val);
                                                                if (input) input.value = "";
                                                            } else {
                                                                showAlert("Invalid Number", "Please enter a valid positive number of sheets.", "warning");
                                                            }
                                                        }}
                                                        className="btn primary text-xs px-4 py-2 font-bold shrink-0"
                                                    >
                                                        📥 Restock
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {blocks.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-slate-400 font-bold text-sm">No campus blocks found to manage paper stock.</div>
                                    )}
                                </div>
                            </motion.section>
                        )}
                    </div>
                )}

                {/* User Moderation Tab */}
                {activeTab === "users" && (
                    <div className="mt-6 space-y-6">

                        {/* SUBPAGE 1: Registered Users Directory */}
                        {usersSubTab === "users-list" && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">User Directory</p>
                                        <h2 className="text-2xl font-black text-slate-900">Registered Users ({users.length})</h2>
                                        <p className="subtitle">Search, filter by campus, and manage customer accounts.</p>
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
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleBulkBlockUsers(true)}
                                                    className="btn warning px-3 py-1.5 text-xs font-bold min-h-0"
                                                >
                                                    Block Selected ({selectedUsers.length})
                                                </button>
                                                <button
                                                    onClick={() => handleBulkBlockUsers(false)}
                                                    className="btn success px-3 py-1.5 text-xs font-bold min-h-0"
                                                >
                                                    Unblock Selected
                                                </button>
                                                <button
                                                    onClick={handleBulkDeleteUsers}
                                                    className="btn danger px-3 py-1.5 text-xs font-bold min-h-0"
                                                >
                                                    Delete Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <table className="data-table mt-4 w-full">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedUsers(users.map(u => u.id));
                                                        else setSelectedUsers([]);
                                                    }}
                                                    checked={selectedUsers.length === users.length && users.length > 0}
                                                />
                                            </th>
                                            <th>User ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Campus</th>
                                            <th>Orders Placed</th>
                                            <th>Referral Code</th>
                                            <th>Wallet Balance</th>
                                            <th>Account Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className={user.blocked ? "bg-rose-50/50" : ""}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => {
                                                            if (selectedUsers.includes(user.id)) setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                            else setSelectedUsers([...selectedUsers, user.id]);
                                                        }}
                                                    />
                                                </td>
                                                <td className="font-bold text-slate-400">#{user.id}</td>
                                                <td className="font-black text-slate-900">{user.name || "Anonymous User"}</td>
                                                <td className="text-slate-600 text-xs font-semibold">{user.email}</td>
                                                <td>
                                                    {(loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") ? (
                                                        <button
                                                            onClick={() => handleChangeUserCollege(user)}
                                                            className="text-xs font-black uppercase text-[#4F9DFF] bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-100 transition-colors cursor-pointer"
                                                            title="Main Admin: Click to change college"
                                                        >
                                                            {user.college || "KLU"} ✎
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-black uppercase text-[#4F9DFF] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                                                            {user.college || "KLU"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="font-black text-slate-700">
                                                    {allOrders.filter(o => o.email === user.email).length}
                                                </td>
                                                <td className="font-mono text-xs font-bold text-slate-500">
                                                    {user.referralCode || "—"}
                                                </td>
                                                <td className="font-black text-emerald-600 text-base">
                                                    ₹{(Number(user.walletBalance) || 0).toFixed(2)}
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${user.blocked ? 'status-unpaid' : 'status-paid'}`} style={{ fontSize: '10px', minHeight: '22px' }}>
                                                        {user.blocked ? "BLOCKED" : "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAddWalletMoney(user)}
                                                            className="btn success min-h-0 px-2.5 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                                            title="Add money to user wallet"
                                                        >
                                                            <span>💳</span> Add Money
                                                        </button>
                                                        <button
                                                            onClick={() => toggleBlockUser(user.id)}
                                                            className={`btn ${user.blocked ? 'success' : 'warning'} min-h-0 px-2.5 py-1 text-xs font-bold cursor-pointer`}
                                                            title={user.blocked ? "Unblock account" : "Block account"}
                                                        >
                                                            {user.blocked ? "Unblock" : "Block"}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(user.id)}
                                                            className="btn danger min-h-0 px-2.5 py-1 text-xs font-bold cursor-pointer"
                                                            title="Delete user account"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="10" className="text-center font-bold text-slate-400 py-8">No registered users found matching filter.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 2: Wallet Balances Breakdown */}
                        {usersSubTab === "wallets" && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                        <p className="text-xs font-bold text-slate-500">Total Wallet Liquidity</p>
                                        <p className="text-2xl font-black text-emerald-600 mt-1">
                                            ₹{users.reduce((acc, u) => acc + (Number(u.walletBalance) || 0), 0).toFixed(2)}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Across all user credit accounts</span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                        <p className="text-xs font-bold text-slate-500">Funded Accounts</p>
                                        <p className="text-2xl font-black text-blue-600 mt-1">
                                            {users.filter(u => Number(u.walletBalance) > 0).length}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Users with positive balance</span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                        <p className="text-xs font-bold text-slate-500">Average Credit Balance</p>
                                        <p className="text-2xl font-black text-indigo-600 mt-1">
                                            ₹{users.length > 0 ? (users.reduce((acc, u) => acc + (Number(u.walletBalance) || 0), 0) / users.length).toFixed(2) : "0.00"}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Mean student wallet hold</span>
                                    </div>
                                </div>

                                <section className="panel p-6 overflow-x-auto">
                                    <div className="section-header pb-4 mb-4 border-b border-slate-100 flex justify-between items-center">
                                        <div>
                                            <p className="eyebrow">Wallet Ledger</p>
                                            <h2 className="text-2xl font-black text-slate-900">Credit Balance Leaderboard</h2>
                                        </div>
                                    </div>
                                    <table className="data-table w-full">
                                        <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Campus</th>
                                                <th>Balance</th>
                                                <th>Total Orders</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...users].sort((a, b) => (Number(b.walletBalance) || 0) - (Number(a.walletBalance) || 0)).slice(0, 50).map((user, idx) => (
                                                <tr key={user.id}>
                                                    <td className="font-black text-slate-400">#{idx + 1}</td>
                                                    <td className="font-bold text-slate-900">{user.name}</td>
                                                    <td className="text-slate-600 text-xs">{user.email}</td>
                                                    <td><span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{user.college || "KLU"}</span></td>
                                                    <td className="font-black text-emerald-600 text-base">₹{(Number(user.walletBalance) || 0).toFixed(2)}</td>
                                                    <td className="font-bold text-slate-700">{allOrders.filter(o => o.email === user.email).length}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 3: Blocked Accounts */}
                        {usersSubTab === "moderation" && (
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-4 border-b border-slate-100">
                                    <div>
                                        <p className="eyebrow">Moderation Queue</p>
                                        <h2 className="text-2xl font-black text-slate-900">Blocked User Accounts ({users.filter(u => u.blocked).length})</h2>
                                        <p className="subtitle">Accounts listed here are suspended from initiating new print orders.</p>
                                    </div>
                                </div>

                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>College</th>
                                            <th>Wallet</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => u.blocked).map(user => (
                                            <tr key={user.id}>
                                                <td className="font-black">#{user.id}</td>
                                                <td className="font-bold text-slate-900">{user.name}</td>
                                                <td className="text-slate-600 text-xs">{user.email}</td>
                                                <td><span className="text-xs font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user.college || "KLU"}</span></td>
                                                <td className="font-bold text-slate-700">₹{(Number(user.walletBalance) || 0).toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        onClick={() => toggleBlockUser(user.id)}
                                                        className="btn success min-h-0 px-4 py-1.5 text-xs font-bold"
                                                    >
                                                        ✅ Unblock Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.filter(u => u.blocked).length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center font-bold text-slate-400 py-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-3xl">🛡️</span>
                                                        <span>No users are currently blocked. All accounts are in good standing.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 4: Staff Directory Table */}
                        {usersSubTab === "staff-list" && (
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Active Accounts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Staff Directory ({subAdmins.length})</h2>
                                    </div>
                                    <button onClick={() => setUsersSubTab("add-staff")} className="btn primary text-xs px-4 py-2 font-bold">
                                        ➕ Add Staff Account
                                    </button>
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
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-8">No staff provisioned yet. Create an account above.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 5: Add Staff Account Form */}
                        {usersSubTab === "add-staff" && (
                            <motion.div
                                className="grid gap-6 md:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <div>
                                            <p className="eyebrow">Access Management</p>
                                            <h2 className="text-2xl font-black text-slate-900">Add Staff Account</h2>
                                            <p className="subtitle">Provision a sub-admin or manager with dedicated credentials.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={createSubAdmin} className="space-y-4">
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Username / Email</span>
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
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Choose Password</span>
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
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Role</span>
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
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Coupons Secret Key</span>
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
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Assign College / Campus</span>
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
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Permissions</p>
                                            <h3 className="text-xl font-black text-slate-900">Role Capabilities</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">Sub-Admin</strong>
                                                Full control over their assigned college campus, printers, queues, users, and coupons.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">Manager</strong>
                                                Operates kiosk terminals, refills paper, and processes coupon voucher redemptions.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 6: Manager Activity Logs Section */}
                        {usersSubTab === "audit-logs" && loggedInAdminRole === "SUB_ADMIN" && (
                            <motion.section className="panel p-6 overflow-x-auto" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="section-header pb-4 mb-4 border-b border-slate-100">
                                    <div>
                                        <p className="eyebrow">Audit Trail</p>
                                        <h2 className="text-2xl font-black text-slate-900">Manager Activity Logs ({managerLogs.length})</h2>
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
                                                <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}
                        {/* SUBPAGE: Support Tickets */}
                        {usersSubTab === "tickets" && (
                            <motion.section
                                className="panel overflow-x-auto p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                                    <div>
                                        <p className="eyebrow">Support Desk</p>
                                        <h2 className="text-2xl font-black text-slate-900">Customer Support Tickets ({supportTickets.length})</h2>
                                        <p className="subtitle">View customer issues, resolve tickets, or remove them.</p>
                                    </div>
                                    <button onClick={fetchSupportTickets} className="btn secondary px-4 py-2 text-xs font-bold min-h-0 cursor-pointer">
                                        🔄 Refresh Tickets
                                    </button>
                                </div>

                                <table className="data-table w-full">
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
                                                                className="btn success min-h-0 px-3 py-1.5 text-xs font-bold cursor-pointer"
                                                            >
                                                                Mark as Done
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteSupportTicket(ticket.id)}
                                                            className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold cursor-pointer"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {supportTickets.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center font-bold text-slate-500 py-8">
                                                    No support tickets found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}
                    </div>
                )}

                {/* Frontend Manager Tab */}
                {activeTab === "frontend" && (
                    <div className="mt-6 space-y-6">

                        {/* SUBPAGE 1: Marketing & Announcements */}
                        {frontendSubTab === "marketing" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Marketing Config</p>
                                            <h2 className="text-2xl font-black text-slate-900">Popups & Scrolling Marquees</h2>
                                            <p className="subtitle">Configure default marketing banners across user dashboards.</p>
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

                                        <button type="submit" className="btn success w-full mt-2">💾 Save Marketing Config</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <div>
                                                <p className="eyebrow">Preview & Tips</p>
                                                <h3 className="text-xl font-black text-slate-900">User Experience</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-4 text-xs text-slate-600 font-medium">
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">📢 Scrolling Marquee</strong>
                                                Appears at the very top of user screens in a vibrant animated banner strip.
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-1">🎁 Welcome Referral Modal</strong>
                                                Displays when users first enter their dashboard to prompt them to invite friends.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 2: Published Notifications List */}
                        {frontendSubTab === "all-notifs" && (
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Active Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Published Notifications ({notifications.length})</h2>
                                    </div>
                                    <button onClick={() => setFrontendSubTab("create-notif")} className="btn primary text-xs px-4 py-2 font-bold">
                                        ✍️ Compose Notification
                                    </button>
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
                                        <div key={notif.id} className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                    <p className="font-black text-slate-900 text-base">{notif.title}</p>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{notif.type || 'INFO'}</span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{notif.college || 'ALL'}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                                            </div>
                                            <button onClick={() => deleteNotification(notif.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold shrink-0">Delete</button>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="text-center py-12 text-slate-400 font-bold text-sm">
                                            No notifications published yet. Click Compose Notification to broadcast an alert.
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* SUBPAGE 3: Create Notification Form */}
                        {frontendSubTab === "create-notif" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <div>
                                            <p className="eyebrow">Campus Alerts</p>
                                            <h2 className="text-2xl font-black text-slate-900">Broadcast Notification</h2>
                                            <p className="subtitle">Send an instant notification to users in a specific college or platform-wide.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={createNotification} className="space-y-4">
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Notification Title</span>
                                            <input type="text" className="field" placeholder="e.g. Server Maintenance Notice" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Message Body</span>
                                            <textarea className="field min-h-[110px]" placeholder="Write notification message details..." value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} required />
                                        </label>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Alert Type</span>
                                                <select className="field" value={notifType} onChange={(e) => setNotifType(e.target.value)}>
                                                    <option value="INFO">ℹ️ Info</option>
                                                    <option value="ALERT">🚨 Alert</option>
                                                    <option value="ANNOUNCEMENT">📢 Announcement</option>
                                                </select>
                                            </label>
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Target College</span>
                                                {(loggedInAdminRole === "SUB_ADMIN" && loggedInAdminUser !== "admin") ? (
                                                    <input type="text" className="field bg-slate-100 cursor-not-allowed" value={loggedInAdminCollege} readOnly disabled />
                                                ) : (
                                                    <select className="field" value={notifCollege} onChange={(e) => setNotifCollege(e.target.value)}>
                                                        <option value="ALL">All Colleges</option>
                                                        {Array.from(new Set(allBlocks.map(b => b.college).filter(Boolean))).map(col => (
                                                            <option key={col} value={col}>{col} College</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </label>
                                        </div>
                                        <button type="submit" className="btn success w-full mt-2">📢 Publish Notification</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Audience Scope</p>
                                            <h3 className="text-xl font-black text-slate-900">Broadcast Guidelines</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">ℹ️ Info</strong>
                                                General non-critical updates like print rate changes or new paper stocks.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">🚨 Alert</strong>
                                                Urgent hardware outages, power maintenance, or immediate network repairs.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 2: Custom Frontend Sections Table */}
                        {frontendSubTab === "sections-list" && (
                            <motion.section 
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Layout Banners</p>
                                        <h2 className="text-2xl font-black text-slate-900">Custom Frontend Sections ({sections.length})</h2>
                                    </div>
                                    <button onClick={() => setFrontendSubTab("add-section")} className="btn primary text-xs px-4 py-2 font-bold">
                                        ➕ Add Section
                                    </button>
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
                                                <td colSpan="6" className="text-center font-bold text-slate-500 py-8">No custom sections defined. Create one above.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 3: Add Frontend Section */}
                        {frontendSubTab === "add-section" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <p className="eyebrow">Layout Sections</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Frontend Section</h2>
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
                                        <button type="submit" className="btn success w-full mt-2">➕ Add Frontend Section</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Help</p>
                                            <h3 className="text-xl font-black text-slate-900">Custom Section Types</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">Advertising</strong>
                                                Promote sponsor cards or promotional student offers.
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">New Block Info</strong>
                                                Alert students when a new building or kiosk gets installed.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 4: Manage Popups List */}
                        {frontendSubTab === "popups-list" && (
                            <motion.section 
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header pb-4 mb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Active Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Manage Popups ({popups.length})</h2>
                                    </div>
                                    <button onClick={() => setFrontendSubTab("add-popup")} className="btn primary text-xs px-4 py-2 font-bold">
                                        ✨ Create Popup
                                    </button>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Target Page</th>
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
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-8">No custom popups created yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        )}

                        {/* SUBPAGE 5: Add Custom Popup Form */}
                        {frontendSubTab === "add-popup" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6">
                                        <p className="eyebrow">Popup Manager</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Custom Popup</h2>
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
                                        <button type="submit" className="btn success w-full mt-2">✨ Create Popup</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Targeting</p>
                                            <h3 className="text-xl font-black text-slate-900">Page Targeting</h3>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            Select specific flow checkpoints like Checkout or Location Selection to guide users or display urgent maintenance notices prior to order payment.
                                        </p>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* System Config Tab */}
                {activeTab === "system" && (
                    <div className="mt-6 space-y-6">

                        {/* SUBPAGE 1: System Gateway Check */}
                        {systemSubTab === "gateway" && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            LIVE STATUS: OPERATIONAL
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900">System Gateway Check</h3>
                                        <p className="text-sm text-slate-500 font-semibold max-w-xl">
                                            Live background ping monitor polling database integrity, auth sessions, and real-time print spoolers.
                                        </p>
                                    </div>
                                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-lg shadow-emerald-500/10 animate-pulse" style={{ animationDuration: '2s' }}>
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="panel p-5">
                                        <p className="text-xs font-bold text-slate-400">Database Connection</p>
                                        <p className="text-lg font-black text-emerald-600 mt-1 flex items-center gap-2"><span>🟢</span> CONNECTED</p>
                                    </div>
                                    <div className="panel p-5">
                                        <p className="text-xs font-bold text-slate-400">API Latency</p>
                                        <p className="text-lg font-black text-slate-900 mt-1">&lt; 45ms</p>
                                    </div>
                                    <div className="panel p-5">
                                        <p className="text-xs font-bold text-slate-400">Active Terminals Online</p>
                                        <p className="text-lg font-black text-sky-600 mt-1">{printers.filter(p => p.online).length} / {printers.length}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* SUBPAGE 2: Referral Configuration */}
                        {systemSubTab === "referrals" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6">
                                        <div>
                                            <p className="eyebrow">Referrals</p>
                                            <h2 className="text-2xl font-black text-slate-900">Refer & Earn Program</h2>
                                            <p className="subtitle">Set bonuses rewarded when existing students invite classmates.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={saveSystemSettings} className="space-y-5">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                id="refEnabled-sys" 
                                                checked={systemSettings.referralEnabled}
                                                onChange={(e) => setSystemSettings({...systemSettings, referralEnabled: e.target.checked})}
                                                className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                                            />
                                            <label htmlFor="refEnabled-sys" className="text-sm font-black text-slate-800 cursor-pointer">
                                                Referral Program Active
                                                <span className="block text-xs font-semibold text-slate-500 mt-0.5">When checked, referrals credit automatic wallet balance.</span>
                                            </label>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Referrer Reward (₹)</span>
                                                <input 
                                                    type="number" 
                                                    className="field" 
                                                    value={systemSettings.referrerAmount}
                                                    onChange={(e) => setSystemSettings({...systemSettings, referrerAmount: Number(e.target.value)})}
                                                    step="0.5"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Referee Reward (₹)</span>
                                                <input 
                                                    type="number" 
                                                    className="field" 
                                                    value={systemSettings.refereeAmount}
                                                    onChange={(e) => setSystemSettings({...systemSettings, refereeAmount: Number(e.target.value)})}
                                                    step="0.5"
                                                />
                                            </label>
                                        </div>
                                        <button type="submit" className="btn success w-full mt-4">💾 Save Referral Settings</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Program Rules</p>
                                            <h3 className="text-xl font-black text-slate-900">How Referrals Work</h3>
                                        </div>
                                        <div className="space-y-3 text-xs text-slate-600 font-medium">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">1. Student Shares Unique Code</strong>
                                                Found in their user profile dialog.
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                                <strong className="block text-slate-900 mb-0.5">2. Invitee Signs Up</strong>
                                                Receives ₹{systemSettings.refereeAmount || 5} free wallet balance on account creation.
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 3: Bulk / Thesis Prints */}
                        {systemSubTab === "thesis" && (
                            <motion.div
                                className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header mb-6 flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="eyebrow">Thesis & Bulk Prints</p>
                                            <h2 className="text-2xl font-black text-slate-900">Bulk Discount Rules</h2>
                                            <p className="subtitle">Automatically give automatic bulk discount percentages on large document orders.</p>
                                        </div>

                                        {(loggedInAdminRole !== "SUB_ADMIN" || loggedInAdminUser === "admin") ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">Configure College:</span>
                                                <select
                                                    value={thesisCollege}
                                                    onChange={(e) => {
                                                        setThesisCollege(e.target.value);
                                                        fetchCollegeThesisSettings(e.target.value);
                                                    }}
                                                    className="field !w-auto text-xs py-2 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                                >
                                                    {allColleges.map(col => (
                                                        <option key={col} value={col}>🏫 {col} College</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">College:</span>
                                                <span className="text-xs font-black px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                    {thesisCollege}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={saveCollegeThesisSettings} className="space-y-4">
                                        {/* Enable / Disable Toggle Switch */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                            collegeThesisSettings?.thesisEnabled
                                                ? "border-emerald-400 bg-emerald-50"
                                                : "border-slate-200 bg-slate-50"
                                        }`}>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">Bulk Discount Program ({thesisCollege})</p>
                                                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                    {collegeThesisSettings?.thesisEnabled ? "✅ Currently Active — discounts are being applied" : "⏸️ Currently Disabled — no discount applied"}
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={Boolean(collegeThesisSettings?.thesisEnabled)}
                                                    onChange={(e) => setCollegeThesisSettings({...collegeThesisSettings, thesisEnabled: e.target.checked})}
                                                />
                                                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Threshold (Pages)</span>
                                                <input 
                                                    type="number" 
                                                    className="field" 
                                                    value={collegeThesisSettings?.thesisDiscountPages !== undefined ? collegeThesisSettings.thesisDiscountPages : 500}
                                                    onChange={(e) => setCollegeThesisSettings({...collegeThesisSettings, thesisDiscountPages: Number(e.target.value)})}
                                                    min="1"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="block text-xs font-black text-slate-700 mb-1.5">Discount Percentage (%)</span>
                                                <input 
                                                    type="number" 
                                                    className="field" 
                                                    value={collegeThesisSettings?.thesisDiscountPercent !== undefined ? collegeThesisSettings.thesisDiscountPercent : 15}
                                                    onChange={(e) => setCollegeThesisSettings({...collegeThesisSettings, thesisDiscountPercent: Number(e.target.value)})}
                                                    step="0.5"
                                                    min="0"
                                                    max="100"
                                                />
                                            </label>
                                        </div>
                                        <button type="submit" className="btn success w-full mt-4">💾 Save Bulk Print Settings ({thesisCollege})</button>
                                    </form>
                                </section>

                                <section className="panel p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="section-header mb-4">
                                            <p className="eyebrow">Information</p>
                                            <h3 className="text-xl font-black text-slate-900">Thesis Submissions</h3>
                                        </div>
                                        <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 space-y-2">
                                            <p>When an uploaded PDF exceeds the page threshold ({collegeThesisSettings?.thesisDiscountPages || 500} pages), the system automatically applies a {collegeThesisSettings?.thesisDiscountPercent || 15}% bulk discount during checkout.</p>
                                            <p className="font-semibold text-sky-900 mt-2">Campus rules operate independently per college so specific discounts can be tailored for student thesis printing.</p>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SUBPAGE 4: Global Platform Config */}
                        {systemSubTab === "global" && (loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                            <motion.section
                                className="panel p-6 max-w-2xl"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-6 pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Platform Settings</p>
                                        <h2 className="text-2xl font-black text-slate-900">Campus Platform Config</h2>
                                        <p className="subtitle">Set gateway transaction charges and device allowances per campus.</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">Configure College:</span>
                                        <select
                                            value={platformCollege}
                                            onChange={(e) => {
                                                setPlatformCollege(e.target.value);
                                                fetchCollegePlatformSettings(e.target.value);
                                            }}
                                            className="field !w-auto text-xs py-2 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                        >
                                            {allColleges.map(col => (
                                                <option key={col} value={col}>🏫 {col} College</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <form onSubmit={saveCollegePlatformSettings} className="space-y-4">
                                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-900">
                                        <span>🏫 Campus Configuration:</span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-950 font-black">{platformCollege}</span>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Razorpay/UPI Charge (%)</span>
                                            <input 
                                                type="number" 
                                                className="field font-bold" 
                                                value={collegePlatformSettings?.razorpayChargePercentage !== undefined ? collegePlatformSettings.razorpayChargePercentage : 2.36}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
                                                    setCollegePlatformSettings({...collegePlatformSettings, razorpayChargePercentage: clamped});
                                                }}
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />
                                            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                                                Allowed: 0.00% – 100.00%
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Manager Max B&W Printers</span>
                                            <input 
                                                type="number" 
                                                className="field font-bold" 
                                                value={collegePlatformSettings?.managerMaxBwPrinters !== undefined ? collegePlatformSettings.managerMaxBwPrinters : 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    const clamped = isNaN(val) ? 1 : Math.max(1, Math.min(50, val));
                                                    setCollegePlatformSettings({...collegePlatformSettings, managerMaxBwPrinters: clamped});
                                                }}
                                                min="1"
                                                max="50"
                                                step="1"
                                            />
                                            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                                                Allowed: 1 – 50 units
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-black text-slate-700 mb-1.5">Manager Max Color Printers</span>
                                            <input 
                                                type="number" 
                                                className="field font-bold" 
                                                value={collegePlatformSettings?.managerMaxColorPrinters !== undefined ? collegePlatformSettings.managerMaxColorPrinters : 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    const clamped = isNaN(val) ? 1 : Math.max(1, Math.min(50, val));
                                                    setCollegePlatformSettings({...collegePlatformSettings, managerMaxColorPrinters: clamped});
                                                }}
                                                min="1"
                                                max="50"
                                                step="1"
                                            />
                                            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                                                Allowed: 1 – 50 units
                                            </span>
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full mt-4">💾 Save Platform Settings ({platformCollege})</button>
                                </form>
                            </motion.section>
                        )}

                        {/* SUBPAGE 5: Off-Peak Hour Settings */}
                        {systemSubTab === "offpeak" && (
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-6 pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="eyebrow">Off-Peak Printing</p>
                                        <h2 className="text-2xl font-black text-slate-900">Off-Peak Hour Settings</h2>
                                        <p className="subtitle">Discounted rates during low-traffic windows. Toggle to enable or disable the program.</p>
                                    </div>
                                    
                                    {(loggedInAdminRole !== "SUB_ADMIN" || loggedInAdminUser === "admin") ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">Configure College:</span>
                                            <select
                                                value={offpeakCollege}
                                                onChange={(e) => {
                                                    setOffpeakCollege(e.target.value);
                                                    fetchCollegeOffpeakSettings(e.target.value);
                                                }}
                                                className="field !w-auto text-xs py-2 px-3 font-black bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
                                            >
                                                {allColleges.map(col => (
                                                    <option key={col} value={col}>🏫 {col} College</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">College:</span>
                                            <span className="text-xs font-black px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                {offpeakCollege}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={saveCollegeOffpeakSettings} className="space-y-5">
                                    {/* Enable / Disable toggle */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                        collegeOffpeakSettings?.offpeakEnabled
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                    }`}>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">Off-Peak Discount Program ({offpeakCollege})</p>
                                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                {collegeOffpeakSettings?.offpeakEnabled ? "✅ Currently Active — discounts are being applied" : "⏸️ Currently Disabled — no discount applied"}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={Boolean(collegeOffpeakSettings?.offpeakEnabled)}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakEnabled: e.target.checked})}
                                            />
                                            <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>

                                    {/* Live time preview */}
                                    {collegeOffpeakSettings?.offpeakEnabled && (
                                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                                            <p className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2">⏰ Active Discount Windows</p>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                                                    🌙 Night: {(() => { const h = collegeOffpeakSettings?.offpeakStartHour ?? 21; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                    {" → "}
                                                    {(() => { const h = collegeOffpeakSettings?.offpeakEndHour ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                                                    🌅 Morning: {(() => { const h = collegeOffpeakSettings?.offpeakMorningStart ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                    {" → "}
                                                    {(() => { const h = collegeOffpeakSettings?.offpeakMorningEnd ?? 9; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                                    🏷️ Discount: {collegeOffpeakSettings?.offpeakDiscountPercent ?? 15}% OFF
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
                                                value={collegeOffpeakSettings?.offpeakStartHour !== undefined ? collegeOffpeakSettings.offpeakStartHour : 21}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakStartHour: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings?.offpeakStartHour ?? 21; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌙 Night Window — End Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings?.offpeakEndHour !== undefined ? collegeOffpeakSettings.offpeakEndHour : 7}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakEndHour: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings?.offpeakEndHour ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌅 Morning Window — Start Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings?.offpeakMorningStart !== undefined ? collegeOffpeakSettings.offpeakMorningStart : 7}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakMorningStart: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings?.offpeakMorningStart ?? 7; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">🌅 Morning Window — End Hour (24h)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={collegeOffpeakSettings?.offpeakMorningEnd !== undefined ? collegeOffpeakSettings.offpeakMorningEnd : 9}
                                                onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakMorningEnd: Number(e.target.value)})}
                                                min="0" max="23"
                                            />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                                                = {(() => { const h = collegeOffpeakSettings?.offpeakMorningEnd ?? 9; return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; })()}
                                            </span>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Discount Percentage (%)</span>
                                        <input 
                                            type="number" 
                                            className="field" 
                                            value={collegeOffpeakSettings?.offpeakDiscountPercent !== undefined ? collegeOffpeakSettings.offpeakDiscountPercent : 15}
                                            onChange={(e) => setCollegeOffpeakSettings({...collegeOffpeakSettings, offpeakDiscountPercent: Number(e.target.value)})}
                                            step="0.5"
                                        />
                                    </label>
                                    <button type="submit" className="btn success w-full mt-2">💾 Save Off-Peak Settings</button>
                                </form>
                            </motion.section>
                        )}

                        {/* SUBPAGE 6: Printer Paper Levels */}
                        {systemSubTab === "paper" && (
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-6 pb-4 border-b border-slate-100">
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
                                                        className="btn secondary min-h-0 px-3 py-1.5 text-xs font-bold"
                                                    >
                                                        Refill
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {printers.length === 0 && (
                                        <p className="text-sm font-bold text-slate-500 text-center py-4">No printer configurations found.</p>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* SUBPAGE 7: Tester Mode Controls */}
                        {systemSubTab === "tester" && (loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                            <motion.section 
                                className="panel p-6 border border-purple-500/20 bg-purple-500/5"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-6 pb-4 border-b border-purple-100">
                                    <div>
                                        <p className="eyebrow text-purple-700">Tester Mode Controls</p>
                                        <h2 className="text-2xl font-black text-purple-950">Tester Mode Access</h2>
                                        <p className="subtitle text-purple-800/80">Allow designated QA testers and admins to place free test prints without payment.</p>
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
                                    
                                    <button type="submit" className="btn bg-purple-600 hover:bg-purple-500 text-white w-full mt-2 font-black text-xs uppercase tracking-wider">💾 Save Tester Settings</button>
                                </form>
                            </motion.section>
                        )}
                        {/* SUBPAGE 8: SQL Terminal & DB Backup */}
                        {systemSubTab === "sql" && (loggedInAdminRole === "MAIN_ADMIN" || loggedInAdminUser === "admin") && (
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <section className="panel p-6">
                                    <div className="section-header pb-4 border-b border-slate-100 mb-6 flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <p className="eyebrow">Database Console</p>
                                            <h2 className="text-2xl font-black text-slate-900">SQL Execution Console</h2>
                                            <p className="subtitle">Execute raw database queries directly or download timestamped SQL dump backups.</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleDownloadBackup} 
                                            className="btn primary font-black text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
                                        >
                                            📥 Download SQL Dump
                                        </button>
                                    </div>

                                    <form onSubmit={runSqlQuery} className="space-y-4">
                                        {/* Quick Table Presets */}
                                        <div className="space-y-1.5">
                                            <span className="block text-xs font-black text-slate-500 uppercase tracking-wider">⚡ Quick Table Presets (Click table to populate SELECT query):</span>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { label: "users", query: "SELECT * FROM users LIMIT 50;" },
                                                    { label: "print_orders (pdf_files)", query: "SELECT * FROM pdf_files ORDER BY id DESC LIMIT 50;" },
                                                    { label: "wallets (users)", query: "SELECT id, name, email, wallet_balance, college FROM users WHERE wallet_balance > 0 ORDER BY wallet_balance DESC LIMIT 50;" },
                                                    { label: "colleges (college_configs)", query: "SELECT * FROM college_configs LIMIT 50;" },
                                                    { label: "blocks (campus_blocks)", query: "SELECT * FROM campus_blocks LIMIT 50;" },
                                                    { label: "printers (printer_config)", query: "SELECT * FROM printer_config LIMIT 50;" },
                                                    { label: "coupons", query: "SELECT * FROM coupons LIMIT 50;" },
                                                    { label: "support_tickets", query: "SELECT * FROM support_tickets ORDER BY id DESC LIMIT 50;" },
                                                    { label: "manager_logs", query: "SELECT * FROM manager_logs ORDER BY id DESC LIMIT 50;" },
                                                    { label: "system_settings", query: "SELECT * FROM system_settings LIMIT 50;" },
                                                    { label: "whatsapp_orders", query: "SELECT * FROM pdf_files WHERE order_channel = 'WHATSAPP' OR user_email LIKE 'wa_%' ORDER BY id DESC LIMIT 50;" },
                                                    { label: "pricing", query: "SELECT * FROM pricing LIMIT 50;" },
                                                    { label: "admin_accounts", query: "SELECT id, username, role, college FROM admin LIMIT 50;" }
                                                ].map((item) => (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        onClick={() => setSqlQuery(item.query)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 text-slate-800 hover:text-white font-mono text-xs font-bold transition-all border border-slate-200 hover:border-cyan-400 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                                                    >
                                                        <span>📊</span>
                                                        <span>{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <textarea
                                            value={sqlQuery}
                                            onChange={(e) => setSqlQuery(e.target.value)}
                                            className="field font-mono text-sm leading-relaxed min-h-[160px] bg-slate-950 text-cyan-400 border-slate-800 p-4 focus:ring-4 focus:ring-cyan-950 rounded-xl"
                                            placeholder="SELECT * FROM users LIMIT 20;"
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button type="submit" className="btn warning min-h-0 font-bold px-6 py-2.5 cursor-pointer" disabled={sqlExecuting}>
                                                {sqlExecuting ? "Executing query..." : "⚡ Execute Statement"}
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
                                </section>
                            </motion.div>
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
                        title={`💳 Payment Gateway: ${paymentConfigModal}`}
                        duration={0}
                    >
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-semibold mb-2">
                                Route online UPI & card payments for <strong>{paymentConfigModal}</strong> directly into its own Razorpay Merchant account. If left empty or reset, payments will fall back to the system default master account.
                            </p>
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1">Razorpay Key ID</label>
                                <input 
                                    type="text" 
                                    value={configKeyId}
                                    onChange={(e) => setConfigKeyId(e.target.value)}
                                    className="field font-mono text-xs" 
                                    placeholder="rzp_live_... or rzp_test_..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1">Razorpay Key Secret</label>
                                <input 
                                    type="password" 
                                    value={configKeySecret}
                                    onChange={(e) => setConfigKeySecret(e.target.value)}
                                    className="field font-mono text-xs" 
                                    placeholder="Razorpay Secret Key"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={async () => {
                                        try {
                                            await api.post("/college-config", {
                                                collegeName: paymentConfigModal,
                                                razorpayKeyId: configKeyId.trim(),
                                                razorpayKeySecret: configKeySecret.trim()
                                            });
                                            showAlert("Success", "Payment credentials saved for " + paymentConfigModal, "success");
                                            setPaymentConfigModal(null);
                                            fetchCollegeConfigs();
                                        } catch (err) {
                                            console.error("Save config error:", err);
                                            showAlert("Error", "Failed to save keys. Please verify backend connection.", "error");
                                        }
                                    }}
                                    className="btn primary flex-1 py-2.5 font-black text-xs"
                                >
                                    💾 Save Credentials
                                </button>
                                {(() => {
                                    const existing = collegeConfigs.find(c => c.collegeName === paymentConfigModal);
                                    if (existing && existing.id) {
                                        return (
                                            <button 
                                                onClick={async () => {
                                                    if (window.confirm(`Reset ${paymentConfigModal} back to system default Razorpay gateway?`)) {
                                                        try {
                                                            await api.delete(`/college-config/${existing.id}`);
                                                            showAlert("Reset Complete", `Reset ${paymentConfigModal} to default gateway.`, "success");
                                                            setPaymentConfigModal(null);
                                                            fetchCollegeConfigs();
                                                        } catch (err) {
                                                            showAlert("Error", "Failed to reset config.", "error");
                                                        }
                                                    }
                                                }}
                                                className="btn danger text-xs py-2.5 px-3 font-bold"
                                                title="Reset to Master Default Gateway"
                                            >
                                                🗑️ Reset Default
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </CustomModal>
                )}
            </AnimatePresence>

            {/* Change User College Modal */}
            {collegeModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-left animate-fadeIn">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                                    <span className="text-2xl">🏫</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Change Campus College</h3>
                                    <p className="text-xs font-semibold text-slate-500">{collegeModalUser.name || collegeModalUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCollegeModalUser(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Select from Available Campuses:
                                </label>
                                <select
                                    value={selectedUserCollegeTarget}
                                    onChange={(e) => setSelectedUserCollegeTarget(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                                >
                                    {allColleges.map((c) => (
                                        <option key={c} value={c}>
                                            🏫 {c} Campus
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-xs text-sky-900 font-medium flex items-start gap-2.5">
                                <span className="text-base shrink-0">ℹ️</span>
                                <span>Changing the student's campus immediately updates their pricing rates, active kiosks, and off-peak discount windows.</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCollegeModalUser(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUserCollegeChange}
                                className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md transition-all cursor-pointer"
                            >
                                Confirm & Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
