import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserLayout from "../components/user/UserLayout";
import CustomModal from "../components/CustomModal";
import api, { RAZORPAY_KEY } from "../services/api";
import { getWalletBalance } from "../services/auth";

// Modular User Sections
import PrintSection from "../components/user/sections/PrintSection";
import OrdersSection from "../components/user/sections/OrdersSection";
import CouponsRewardsSection from "../components/user/sections/CouponsRewardsSection";
import SupportSection from "../components/user/sections/SupportSection";

export function Dashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab") || "print";
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    // Sync tab with URL
    useEffect(() => {
        if (searchParams.get("tab") && searchParams.get("tab") !== activeTab) {
            setActiveTab(searchParams.get("tab"));
        }
    }, [searchParams]);

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Student";
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";
    const referralCode = localStorage.getItem("referralCode") || "";
    const blockLocation = localStorage.getItem("selectedBlock") || "C Block";

    // Pricing & Specs State
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const [duplexPrice, setDuplexPrice] = useState(2);
    const [colorSupported, setColorSupported] = useState(true);

    // Multi-file upload states
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileConfigs, setFileConfigs] = useState([]);
    const [uploaded, setUploaded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [orderId, setOrderId] = useState("");

    // Coupon states
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDetails, setCouponDetails] = useState(null);

    // User data
    const [walletBalance, setWalletBalance] = useState(0);
    const [orders, setOrders] = useState([]);
    const [paperCount, setPaperCount] = useState(500);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // System health
    const [systemStatus, setSystemStatus] = useState({
        databaseConnected: true,
        agentOnline: true,
        printerConfigured: true
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

    // 1. Fetch live prices & printer capabilities
    const fetchPricesAndConfig = async () => {
        if (!blockLocation) return;
        try {
            const [pricingRes, printerRes] = await Promise.all([
                api.get("/pricing/all", { params: { blockLocation } }).catch(() => ({ data: {} })),
                api.get("/printer/byBlock", { params: { blockLocation } }).catch(() => ({ data: {} }))
            ]);

            if (pricingRes.data) {
                setBwPrice(pricingRes.data.bwPrice != null ? pricingRes.data.bwPrice : 2);
                setColorPrice(pricingRes.data.colorPrice != null ? pricingRes.data.colorPrice : 5);
                setDuplexPrice(pricingRes.data.duplexPrice != null ? pricingRes.data.duplexPrice : 2);
            }

            if (printerRes.data) {
                setColorSupported(printerRes.data.colourSupported !== false);
            }
        } catch (e) {
            console.error("Failed to fetch block config:", e);
        }
    };

    // 2. Fetch Paper Count & System Status
    const fetchSystemStatus = async () => {
        if (!blockLocation) return;
        try {
            const [statusRes, paperRes] = await Promise.all([
                api.get("/system/status", { params: { blockLocation } }).catch(() => ({
                    data: { databaseConnected: true, agentOnline: true, printerConfigured: true }
                })),
                api.get("/printer/paper", { params: { blockLocation } }).catch(() => ({ data: 500 }))
            ]);
            setSystemStatus(statusRes.data);
            setPaperCount(typeof paperRes.data === "number" ? paperRes.data : 500);
        } catch (e) {
            console.error("Failed to check status:", e);
        }
    };

    // 3. Fetch User Orders
    const fetchUserOrders = async () => {
        if (!userId) return;
        try {
            const res = await api.get("/pdf/userOrders", { params: { userId } });
            setOrders(res.data || []);
        } catch (e) {
            console.error("Failed to fetch user orders:", e);
        }
    };

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance).catch(() => {});
            fetchPricesAndConfig();
            fetchSystemStatus();
            fetchUserOrders();

            const interval = setInterval(() => {
                fetchUserOrders();
                fetchSystemStatus();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [userId, blockLocation]);

    // Handle File Selection
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setSelectedFiles(files);
        setUploaded(false);

        // Build default configs
        const configs = files.map((f, idx) => ({
            id: idx + 1,
            fileName: f.name,
            totalPages: 1,
            copies: 1,
            printType: "BW",
            pageOption: "ALL",
            startPage: "1",
            endPage: "1",
            nupLayout: "1-up",
            doubleSided: false
        }));

        setFileConfigs(configs);
        await uploadPdfFiles(files, configs);
    };

    const updateFileConfig = (index, key, value) => {
        setFileConfigs(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: value };
            return updated;
        });
    };

    const removeFileAt = (index) => {
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        const updatedConfigs = fileConfigs.filter((_, i) => i !== index);
        setSelectedFiles(updatedFiles);
        setFileConfigs(updatedConfigs);

        if (updatedFiles.length === 0) {
            setUploaded(false);
            setOrderId("");
        } else {
            uploadPdfFiles(updatedFiles, updatedConfigs);
        }
    };

    const uploadPdfFiles = async (files, configs) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const formData = new FormData();
        files.forEach(f => formData.append("files", f));
        formData.append("userId", userId);
        formData.append("blockLocation", blockLocation);

        try {
            const res = await api.post("/pdf/uploadMulti", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data) {
                setOrderId(res.data.orderId || res.data.id || `ORD_${Date.now()}`);
                setUploaded(true);

                // If backend returned parsed page counts per file
                if (res.data.fileDetails && Array.isArray(res.data.fileDetails)) {
                    setFileConfigs(prev => prev.map((cfg, i) => ({
                        ...cfg,
                        totalPages: res.data.fileDetails[i]?.totalPages || cfg.totalPages || 1,
                        endPage: String(res.data.fileDetails[i]?.totalPages || cfg.totalPages || 1)
                    })));
                }
            }
        } catch (error) {
            console.error("Upload error:", error);
            showAlert("Upload Failed", "Could not process your files on the server.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    // Compute Live Pricing
    let totalPhysicalSheets = 0;
    let totalBasePrice = 0;

    fileConfigs.forEach(cfg => {
        const rate = cfg.printType === "COLOR" ? colorPrice : bwPrice;
        const isDuplex = cfg.doubleSided;
        
        let pCount = cfg.totalPages || 1;
        if (cfg.pageOption === "CUSTOM" && cfg.startPage && cfg.endPage) {
            pCount = Math.max(1, parseInt(cfg.endPage) - parseInt(cfg.startPage) + 1);
        }

        const div = cfg.nupLayout === "2-up" ? 2 :
                    cfg.nupLayout === "4-up" ? 4 :
                    cfg.nupLayout === "6-up" ? 6 :
                    cfg.nupLayout === "9-up" ? 9 : 1;

        const sheets = Math.ceil(pCount / div);
        const physical = isDuplex ? Math.ceil(sheets / 2.0) : sheets;
        const totalSheetsForFile = physical * Number(cfg.copies || 1);

        totalPhysicalSheets += totalSheetsForFile;
        totalBasePrice += totalSheetsForFile * rate;
    });

    const basePrice = totalBasePrice;
    const discountAmount = couponApplied && couponDetails ? (basePrice * couponDetails.discountPercentage) / 100 : 0;
    const estimatedTotal = Math.max(0, basePrice - discountAmount);
    const isLowPaper = uploaded && totalPhysicalSheets > paperCount;

    // Coupon Application
    const handleApplyCoupon = async (code) => {
        try {
            const res = await api.get("/coupon/validate", { params: { code } });
            if (res.data && res.data.discountPercentage) {
                setCouponApplied(true);
                setCouponDetails(res.data);
                showAlert("Coupon Applied", `${res.data.discountPercentage}% discount added!`, "success");
            } else {
                showAlert("Invalid Coupon", "This promo code is not valid or expired", "warning");
            }
        } catch (e) {
            console.error(e);
            showAlert("Invalid Coupon", "Coupon code not found", "error");
        }
    };

    const handleRemoveCoupon = () => {
        setCouponApplied(false);
        setCouponDetails(null);
    };

    // 1-Click Pay with Wallet
    const handlePayWithWallet = async () => {
        if (!uploaded || !orderId) {
            showAlert("Upload Needed", "Please select files to print first", "warning");
            return;
        }

        if (walletBalance < estimatedTotal) {
            showAlert("Insufficient Wallet Balance", `You need ₹${estimatedTotal.toFixed(2)}, but you only have ₹${walletBalance.toFixed(2)}.`, "warning");
            return;
        }

        setIsProcessingPayment(true);
        try {
            // Update order specs
            await api.post("/pdf/updateOrder", null, {
                params: {
                    orderId,
                    copies: fileConfigs[0]?.copies || 1,
                    printType: fileConfigs[0]?.printType || "BW",
                    blockLocation,
                    selectedPages: fileConfigs[0]?.pageOption === "ALL" ? "ALL" : `${fileConfigs[0]?.startPage}-${fileConfigs[0]?.endPage}`,
                    nupLayout: fileConfigs[0]?.nupLayout || "1-up",
                    doubleSided: fileConfigs[0]?.doubleSided || false
                }
            });

            // Mark wallet payment
            const payRes = await api.post("/pdf/payWithWallet", null, { params: { orderId } });
            if (payRes.data?.newWalletBalance != null) {
                setWalletBalance(payRes.data.newWalletBalance);
            } else {
                getWalletBalance(userId).then(setWalletBalance).catch(() => {});
            }

            navigate(`/payment-success?orderId=${orderId}`);
        } catch (error) {
            console.error("Wallet pay error:", error);
            showAlert("Payment Error", error.response?.data?.message || "Failed to process wallet payment", "error");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Direct Pay with Razorpay Gateway
    const handlePayWithRazorpay = async () => {
        if (!uploaded || !orderId) {
            showAlert("Upload Needed", "Please select files to print first", "warning");
            return;
        }

        setIsProcessingPayment(true);
        try {
            // 1. Create order on backend
            const rzpRes = await api.post("/payment/createOrder", null, {
                params: {
                    amount: estimatedTotal,
                    appOrderId: orderId
                }
            });

            const orderData = rzpRes.data;

            const options = {
                key: RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print",
                description: `Print Order #${orderId}`,
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        await api.post("/pdf/paymentSuccess", null, {
                            params: {
                                orderId,
                                paymentId: response.razorpay_payment_id
                            }
                        });
                        navigate(`/payment-success?orderId=${orderId}`);
                    } catch (err) {
                        console.error("Failed to mark order as paid:", err);
                        showAlert("Error", "Payment succeeded but order status failed to update.", "error");
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                },
                theme: {
                    color: "#06b6d4"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Razorpay init error:", error);
            showAlert("Gateway Error", "Failed to initiate payment gateway", "error");
            setIsProcessingPayment(false);
        }
    };

    return (
        <UserLayout
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            walletBalance={walletBalance}
            onWalletUpdated={setWalletBalance}
            blockLocation={blockLocation}
            systemStatus={systemStatus}
        >
            {/* 1. Print Studio */}
            {activeTab === "print" && (
                <PrintSection
                    selectedFiles={selectedFiles}
                    fileConfigs={fileConfigs}
                    onFilesSelected={handleFileSelect}
                    onUpdateFileConfig={updateFileConfig}
                    onRemoveFile={removeFileAt}
                    uploaded={uploaded}
                    isUploading={isUploading}
                    estimatedSheets={totalPhysicalSheets}
                    basePrice={basePrice}
                    estimatedTotal={estimatedTotal}
                    walletBalance={walletBalance}
                    couponApplied={couponApplied}
                    couponDetails={couponDetails}
                    onApplyCoupon={handleApplyCoupon}
                    onRemoveCoupon={handleRemoveCoupon}
                    onPayWithWallet={handlePayWithWallet}
                    onPayWithRazorpay={handlePayWithRazorpay}
                    isProcessing={isProcessingPayment}
                    isLowPaper={isLowPaper}
                    paperCount={paperCount}
                    isDisabled={!systemStatus.agentOnline || !systemStatus.databaseConnected || isLowPaper}
                    disabledReason={
                        !systemStatus.agentOnline ? "Kiosk physical print agent is currently offline" :
                        isLowPaper ? "Paper tray empty in this block. Please reduce copies or switch block" : ""
                    }
                    colorSupported={colorSupported}
                />
            )}

            {/* 2. My Orders */}
            {activeTab === "orders" && (
                <OrdersSection
                    orders={orders}
                    isLoading={false}
                />
            )}

            {/* 3. Rewards & Coupons */}
            {activeTab === "coupons" && (
                <CouponsRewardsSection
                    userId={userId}
                    referralCode={referralCode}
                    onWalletUpdated={setWalletBalance}
                    showAlert={showAlert}
                />
            )}

            {/* 4. Support Desk */}
            {activeTab === "support" && (
                <SupportSection
                    userName={userName}
                    userEmail={userEmail}
                    showAlert={showAlert}
                />
            )}

            {/* Alert / Confirm Dialog */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </UserLayout>
    );
}

export default Dashboard;
