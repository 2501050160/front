import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import api, { RAZORPAY_KEY } from "../services/api";
import Navbar from "../components/Navbar";
import { getWalletBalance, clearUserSession } from "../services/auth";
import CustomModal from "../components/CustomModal";
import fileUploading from "../assets/file_uploading.mp4";
import howToUpload from "../assets/how_to_upload.mp4";
import walletVideo from "../assets/wallet_video.mp4";
import myOrdersVideo from "../assets/my_orders_video.mp4";
import ordersLoading from "../assets/orders_loading.mp4";
import referralIcon from "../assets/referral-icon.jpg";
import printKioskBg from "../assets/print-kiosk-bg.png";
import kioskFront from "../assets/kiosk-front.png";
import {
    FileText,
    Gift,
    Headphones,
    MapPin,
    Menu,
    PanelLeftClose,
    Printer,
    UploadCloud,
    Wallet
} from "lucide-react";

function Dashboard() {
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const referralCode = localStorage.getItem("referralCode") || "";

    const [printType, setPrintType] = useState("BW");
    const blockLocation = localStorage.getItem("selectedBlock");
    
    // Multiple files support
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [totalPages, setTotalPages] = useState(0);
    const [orderId, setOrderId] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const [copies, setCopies] = useState(1);
    const [pageOption, setPageOption] = useState("ALL");
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");
    const [nupLayout, setNupLayout] = useState("1-up");
    const [doubleSided, setDoubleSided] = useState(false);
    const [haveCoupon, setHaveCoupon] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDetails, setCouponDetails] = useState(null);
    
    // Referral states
    const [haveReferral, setHaveReferral] = useState(false);
    const [enteredReferralCode, setEnteredReferralCode] = useState("");
    const [referralApplied, setReferralApplied] = useState(false);

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState("print");

    // Additional States
    const [uploading, setUploading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [showWalletModal, setShowWalletModal] = useState(false);
    
    // Support Desk
    const [supportName, setSupportName] = useState(userName || "");
    const [supportEmail, setSupportEmail] = useState(userEmail || "");
    const [supportMessage, setSupportMessage] = useState("");
    const [supportSubmitting, setSupportSubmitting] = useState(false);

    // Rewards & Claim Codes
    const [rewardCode, setRewardCode] = useState("");
    const [claimingReward, setClaimingReward] = useState(false);
    const [rewardPoints, setRewardPoints] = useState(0);

    // Dynamic state
    const [paperCount, setPaperCount] = useState(0);
    const [sections, setSections] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [settings, setSettings] = useState({
        referralEnabled: true,
        referrerAmount: 10.0,
        refereeAmount: 5.0,
        popupEnabled: true,
        popupMessage: "",
        adEnabled: true,
        adText: "",
        generalPopupEnabled: false,
        generalPopupMessage: ""
    });

    // Welcome Privacy Modal States
    const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [colorSupported, setColorSupported] = useState(false);
    const [isProceedingToOrder, setIsProceedingToOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");

    // General Announcement Modal States
    const [showGeneralPopup, setShowGeneralPopup] = useState(false);
    const [dontShowGeneralPopupAgain, setDontShowGeneralPopupAgain] = useState(false);

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const showAlert = (title, message, type = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    };

    const [systemStatus, setSystemStatus] = useState({
        databaseConnected: true,
        agentOnline: true,
        printerConfigured: true
    });

    // Check Privacy Notice on mount
    useEffect(() => {
        const dontShow = localStorage.getItem("dontShowPrivacyNotice") === "true";
        if (!dontShow) {
            setShowPrivacyNotice(true);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            navigate("/");
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }
    }, [userId]);

    useEffect(() => {
        fetchPrices();
        fetchActiveSections();
    }, []);

    // Orders Polling (Every 3 seconds)
    const fetchOrders = async () => {
        if (!userId) {
            setLoadingOrders(false);
            return;
        }
        try {
            const response = await api.get("/pdf/userOrders", {
                params: { userId }
            });
            setOrders(response.data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 3000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const fetchActiveSections = async () => {
        try {
            const response = await api.get("/sections/active");
            setSections(response.data || []);
        } catch (err) {
            console.error("Failed to fetch active sections", err);
        }
    };

    const fetchPaperCount = async () => {
        if (!blockLocation) return;
        try {
            const response = await api.get("/printer/paper", {
                params: { blockLocation }
            });
            setPaperCount(response.data != null ? response.data : 0);
        } catch (err) {
            console.error("Failed to fetch paper count", err);
        }
    };

    useEffect(() => {
        const fetchPrinterConfig = async () => {
            if (!blockLocation) return;
            try {
                const response = await api.get("/printer/byBlock", {
                    params: { blockLocation }
                });
                const config = response.data;
                const hasColor = config && config.colourSupported === true;
                setColorSupported(hasColor);
                if (!hasColor) {
                    setPrintType("BW");
                }
            } catch (err) {
                console.error("Failed to fetch printer config for color check", err);
                setColorSupported(false);
                setPrintType("BW");
            }
        };
        fetchPrinterConfig();
    }, [blockLocation]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await api.get("/system/status", {
                    params: { blockLocation }
                });
                setSystemStatus(response.data);
            } catch (err) {
                setSystemStatus({
                    databaseConnected: false,
                    agentOnline: false,
                    printerConfigured: false
                });
            }
            fetchPaperCount();
        };

        if (blockLocation) {
            checkStatus();
            const interval = setInterval(checkStatus, 8000);
            return () => clearInterval(interval);
        }
    }, [blockLocation]);

    // Check Welcome Referral Popup
    useEffect(() => {
        const checkReferralPopup = async () => {
            if (!userId) return;
            try {
                // Fetch public settings
                const settingsRes = await api.get("/system/settings");
                const publicSettings = settingsRes.data;
                setSettings(publicSettings);

                // Check General Announcement Popup
                if (publicSettings.generalPopupEnabled === true || publicSettings.generalPopupEnabled === "true") {
                    const dismissedMsg = localStorage.getItem("dismissedGeneralPopupMessage");
                    if (publicSettings.generalPopupMessage && dismissedMsg !== publicSettings.generalPopupMessage) {
                        setShowGeneralPopup(true);
                    }
                }

                // Fetch user orders to see if this is their first order
                const ordersRes = await api.get("/pdf/userOrders", { params: { userId } });
                const userOrders = ordersRes.data || [];
                const hasPaidOrders = userOrders.some(o => o.paymentStatus === "PAID");

                const shown = sessionStorage.getItem("referralWelcomeShown");
                if (publicSettings.referralEnabled && publicSettings.popupEnabled && !hasPaidOrders && !shown) {
                    sessionStorage.setItem("referralWelcomeShown", "true");
                    showAlert(
                        "🎉 Welcome Offer!",
                        publicSettings.popupMessage || `Refer your friends and earn rewards! Your code is: ${referralCode}`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error checking welcome popup", err);
            }
        };
        checkReferralPopup();
    }, [userId, referralCode]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(files);
            setUploaded(false); 
            uploadPdf(files);
        }
    };

    const uploadPdf = async (filesToUpload = selectedFiles) => {
        if (filesToUpload.length === 0) {
            showAlert("No Files Selected", "Please select PDF or image files to upload.", "warning");
            return;
        }

        const formData = new FormData();
        if (filesToUpload.length === 1) {
            formData.append("file", filesToUpload[0]);
        } else {
            filesToUpload.forEach((file) => {
                formData.append("files", file);
            });
        }
        formData.append("userId", userId);
        formData.append("customerName", userName || "Customer");
        formData.append("blockLocation", blockLocation);

        setUploading(true);
        try {
            const response = await api.post(
                "/pdf/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setTotalPages(response.data.totalPages);
            setOrderId(response.data.orderId);
            setUploaded(true);
            setHaveCoupon(false);
            setCouponCode("");
            setCouponApplied(false);
            setCouponDetails(null);
            
            // Reset referrals
            setHaveReferral(false);
            setEnteredReferralCode("");
            setReferralApplied(false);
            showAlert("Success", "Files processed and uploaded successfully!", "success");
        } catch (error) {
            console.error(error);
            const detailedError = error.response?.data?.message || error.response?.data || error.message || "Could not upload and process the files.";
            showAlert("Upload Failed", detailedError, "error");
        } finally {
            setUploading(false);
        }
    };

    const fetchPrices = async () => {
        try {
            const response = await api.get("/pricing/all", {
                params: { blockLocation }
            });

            response.data.forEach((p) => {
                if (p.printType === "BW") {
                    setBwPrice(p.pricePerPage);
                }
                if (p.printType === "COLOR") {
                    setColorPrice(p.pricePerPage);
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const proceedToOrder = async () => {
        if (!uploaded) {
            showAlert("Files Not Uploaded", "Please upload selected files first.", "warning");
            return;
        }

        if (pageOption === "CUSTOM") {
            const start = parseInt(startPage);
            const end = parseInt(endPage);

            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                showAlert("Invalid Pages", `Pages must be between 1 and ${totalPages}`, "error");
                return;
            }
        }

        if (isLowPaper) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels in this block.", "error");
            return;
        }

        setIsProceedingToOrder(true);
        try {
            const response = await api.post(
                "/pdf/updateOrder",
                null,
                {
                    params: {
                        orderId,
                        copies,
                        printType,
                        blockLocation,
                        selectedPages:
                            pageOption === "ALL"
                                ? "ALL"
                                : `${startPage}-${endPage}`,
                        nupLayout,
                        doubleSided
                    }
                }
            );

            localStorage.setItem("order", JSON.stringify(response.data));
            navigate("/checkout");
        } catch (error) {
            console.error(error);
            showAlert("Order Failed", "Unable to create order.", "error");
        } finally {
            setIsProceedingToOrder(false);
        }
    };

    const applyCoupon = async () => {
        if (couponApplied) {
            showAlert("Already Applied", "Coupon has already been applied.", "warning");
            return;
        }

        if (!couponCode) {
            showAlert("Required Field", "Please enter coupon code.", "warning");
            return;
        }

        try {
            const response = await api.get("/coupon/validate", {
                params: {
                    couponCode
                }
            });

            const coupon = response.data;
            setCouponDetails(coupon);
            setCouponApplied(true);

            showAlert("Success", "Coupon Applied Successfully", "success");
        } catch (error) {
            console.error(error);
            showAlert("Invalid Coupon", "The entered coupon code is invalid or expired.", "error");
        }
    };

    const applyReferral = async () => {
        if (referralApplied) {
            showAlert("Already Applied", "Referral code has already been applied.", "warning");
            return;
        }
        if (!enteredReferralCode) {
            showAlert("Required Field", "Please enter referral code.", "warning");
            return;
        }
        try {
            const formData = new URLSearchParams();
            formData.append("orderId", orderId);
            formData.append("referralCode", enteredReferralCode);
            formData.append("userId", userId);

            const response = await api.post("/pdf/applyReferral", formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            if (response.data && response.data.message && response.data.message.toLowerCase().includes("successfully")) {
                setReferralApplied(true);
                showAlert("Success", response.data.message, "success");
            } else {
                showAlert("Referral Failed", response.data.message || "Failed to apply referral code", "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Referral Failed", error.response?.data?.message || error.response?.data || "Could not apply referral code.", "error");
        }
    };

    const payWithWalletDirect = async () => {
        if (!uploaded) {
            showAlert("Files Not Uploaded", "Please upload selected files first.", "warning");
            return;
        }

        if (pageOption === "CUSTOM") {
            const start = parseInt(startPage);
            const end = parseInt(endPage);

            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                showAlert("Invalid Pages", `Pages must be between 1 and ${totalPages}`, "error");
                return;
            }
        }

        if (isLowPaper) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels in this block.", "error");
            return;
        }

        if (walletBalance < estimatedTotal) {
            showAlert("Insufficient Funds", `Insufficient wallet balance. You need ₹${estimatedTotal.toFixed(2)}, but you only have ₹${walletBalance.toFixed(2)}.`, "warning");
            return;
        }

        if (paymentMethod) return;

        setPaymentMethod("wallet");
        try {
            // 1. Update the order with current settings
            const response = await api.post(
                "/pdf/updateOrder",
                null,
                {
                    params: {
                        orderId,
                        copies,
                        printType,
                        blockLocation,
                        selectedPages:
                            pageOption === "ALL"
                                ? "ALL"
                                : `${startPage}-${endPage}`,
                        nupLayout,
                        doubleSided
                    }
                }
            );

            const finalOrder = response.data;

            // Apply coupon updates and validate before wallet payment
            if (couponApplied && couponDetails) {
                const discount = (finalOrder.price * couponDetails.discountPercentage) / 100;
                const discountedPrice = finalOrder.price - discount;
                
                await api.post("/pdf/updatePrice", null, {
                    params: {
                        orderId: finalOrder.orderId,
                        price: discountedPrice,
                        originalPrice: finalOrder.price,
                        discountAmount: finalOrder.discountAmount + discount
                    }
                });

                // Run coupon consumption and wallet payment in parallel to speed up execution
                await Promise.all([
                    api.post("/coupon/use", null, {
                        params: { couponCode }
                    }).catch(err => console.error("Failed to mark coupon as used:", err)),
                    api.post("/pdf/payWithWallet", null, {
                        params: {
                            orderId: finalOrder.orderId
                        }
                    })
                ]);
            } else {
                // 2. Pay using wallet balance
                await api.post("/pdf/payWithWallet", null, {
                    params: {
                        orderId: finalOrder.orderId
                    }
                });
            }

            await getWalletBalance(userId).then(setWalletBalance);
            localStorage.removeItem("order");
            navigate(`/payment-success?orderId=${finalOrder.orderId}`);
        } catch (error) {
            console.error(error);
            showAlert("Error", error.response?.data?.message || "Wallet payment failed", "error");
        } finally {
            setPaymentMethod("");
        }
    };

    const payNowDirect = async () => {
        if (!uploaded) {
            showAlert("Files Not Uploaded", "Please upload selected files first.", "warning");
            return;
        }

        if (pageOption === "CUSTOM") {
            const start = parseInt(startPage);
            const end = parseInt(endPage);

            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                showAlert("Invalid Pages", `Pages must be between 1 and ${totalPages}`, "error");
                return;
            }
        }

        if (isLowPaper) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels in this block.", "error");
            return;
        }

        if (paymentMethod) return;

        setPaymentMethod("razorpay");
        try {
            // 1. Update the order with current settings
            const response = await api.post(
                "/pdf/updateOrder",
                null,
                {
                    params: {
                        orderId,
                        copies,
                        printType,
                        blockLocation,
                        selectedPages:
                            pageOption === "ALL"
                                ? "ALL"
                                : `${startPage}-${endPage}`,
                        nupLayout,
                        doubleSided
                    }
                }
            );

            const finalOrder = response.data;

            let paymentAmount = finalOrder.price;
            if (couponApplied && couponDetails) {
                const discount = (finalOrder.price * couponDetails.discountPercentage) / 100;
                paymentAmount = finalOrder.price - discount;

                await api.post("/pdf/updatePrice", null, {
                    params: {
                        orderId: finalOrder.orderId,
                        price: paymentAmount,
                        originalPrice: finalOrder.price,
                        discountAmount: finalOrder.discountAmount + discount
                    }
                });
            }

            // 2. Create Razorpay Order
            const rzpRes = await api.post("/payment/createOrder", null, {
                params: {
                    amount: paymentAmount,
                    appOrderId: finalOrder.orderId
                }
            });

            const orderData = rzpRes.data;

            const options = {
                key: RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print",
                description: "Print Order Payment",
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        if (couponApplied && couponCode) {
                            await api.post("/coupon/use", null, {
                                params: { couponCode }
                            }).catch(err => console.error("Failed to mark coupon as used:", err));
                        }

                        await api.post("/pdf/paymentSuccess", null, {
                            params: {
                                orderId: finalOrder.orderId,
                                paymentId: response.razorpay_payment_id
                            }
                        });

                        localStorage.removeItem("order");
                        navigate(`/payment-success?orderId=${finalOrder.orderId}`);
                    } catch (error) {
                        console.error("Failed to mark order as paid:", error);
                        showAlert("Error", "Unable to update payment status in our database.", "error");
                        setPaymentMethod("");
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log("Payment checkout modal was closed.");
                        showAlert("Payment Cancelled", "The payment checkout was closed.", "warning");
                        setPaymentMethod("");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response) {
                console.error("Razorpay Payment Failure Detail:", response.error);
                showAlert(
                    "Payment Failed",
                    `Reason: ${response.error.description || "The transaction was declined by the bank/gateway."}`,
                    "error"
                );
                setPaymentMethod("");
            });

            rzp.open();
        } catch (error) {
            console.error("Payment initiation error:", error);
            showAlert("Payment Error", "Unable to initiate payment transaction.", "error");
            setPaymentMethod("");
        }
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        if (!supportName || !supportEmail || !supportMessage) {
            showAlert("Required Fields Missing", "Please fill in all fields.", "warning");
            return;
        }

        setSupportSubmitting(true);
        try {
            // 1. Save in Database
            await api.post("/support/create", {
                name: supportName,
                email: supportEmail,
                message: supportMessage
            });

            // 2. Send free email using formsubmit.co
            await axios.post("https://formsubmit.co/ajax/saipraveendasari2@gmail.com", {
                name: supportName,
                email: supportEmail,
                message: supportMessage,
                _subject: "New Cloud Print Support Request"
            });

            showAlert("Ticket Created", "Support request submitted successfully! We will get back to you via email.", "success");
            setSupportMessage("");
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to submit support request. Please try again.", "error");
        } finally {
            setSupportSubmitting(false);
        }
    };

    const handleClaimReward = async (e) => {
        e.preventDefault();
        if (!rewardCode.trim()) {
            showAlert("Required Code", "Please enter a reward claim code.", "warning");
            return;
        }

        setClaimingReward(true);
        try {
            const response = await api.post("/rewards/claim", null, {
                params: {
                    userId,
                    claimCode: rewardCode.trim()
                }
            });

            if (response.data.success) {
                showAlert("Claim Successful 🎉", response.data.message || "Wallet balance credited successfully!", "success");
                setRewardCode("");
                getWalletBalance(userId).then(setWalletBalance);
            } else {
                showAlert("Failed", response.data.message || "Invalid claim code", "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Claim Failed", error.response?.data?.message || "Invalid or already claimed reward code.", "error");
        } finally {
            setClaimingReward(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            await api.post("/pdf/cancelOrder", null, {
                params: { orderId, userId }
            });
            showAlert("Order Cancelled", "Your order has been cancelled successfully. Refund has been credited to your wallet.", "success");
            fetchOrders();
            getWalletBalance(userId).then(setWalletBalance);
        } catch (err) {
            console.error(err);
            showAlert("Cancellation Failed", err.response?.data?.message || "Could not cancel the order.", "error");
        }
    };

    const handleLogout = () => {
        clearUserSession();
        navigate("/");
    };

    const rate = printType === "COLOR" ? Number(colorPrice) : Number(bwPrice);
    const selectedPageCount = pageOption === "ALL" ? totalPages : (startPage && endPage ? Math.max(0, Number(endPage) - Number(startPage) + 1) : 0);
    const divisor = nupLayout === "2-up" ? 2 : 
                    nupLayout === "4-up" ? 4 : 
                    nupLayout === "6-up" ? 6 : 
                    nupLayout === "8-up" ? 8 : 
                    nupLayout === "9-up" ? 9 : 1;
    const sheetsToPrint = Math.ceil(selectedPageCount / divisor);
    const estimatedTotalPages = sheetsToPrint * Number(copies || 1);
    const isLowPaper = uploaded && estimatedTotalPages > paperCount;
    const basePrice = sheetsToPrint * Number(copies || 1) * rate;
    const estimatedTotal = couponApplied && couponDetails ? Math.max(0, basePrice - (basePrice * couponDetails.discountPercentage) / 100) : basePrice;
    const isPrintingDisabled = !systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured || isLowPaper || systemStatus.maintenance;

    const displayAdText = settings.adEnabled && settings.adText ? settings.adText.replace("{referralCode}", referralCode) : "";

    const tabs = [
        { id: "print", label: "Print Dashboard", icon: Printer },
        { id: "orders", label: "My Orders", icon: FileText },
        { id: "coupons", label: "Coupons & Rewards", icon: Gift },
        { id: "support", label: "Support Desk", icon: Headphones }
    ];

    const orderStatusClass = (status) => {
        if (status === "CANCELLED") return "status-pill status-unpaid";
        if (status === "CANCEL_WINDOW" || status === "QUEUE") return "status-pill status-created";
        if (status === "COMPLETED") return "status-pill status-completed";
        if (status === "PRINTING") return "status-pill status-printing";
        return "status-pill status-created";
    };

    return (
        <main className="premium-dashboard-bg page-shell page-shell-decorated !px-0 !py-0 min-h-screen">
            <style>{`
                .premium-dashboard-bg {
                    position: relative;
                    overflow: hidden;
                    background:
                        radial-gradient(circle at 76% 12%, rgba(45, 212, 191, 0.26), transparent 24rem),
                        radial-gradient(circle at 16% 28%, rgba(14, 165, 233, 0.28), transparent 28rem),
                        linear-gradient(135deg, #020617 0%, #082f49 42%, #0f766e 100%);
                }
                .premium-dashboard-bg::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background:
                        linear-gradient(115deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 38px),
                        linear-gradient(to bottom, rgba(2,6,23,0.12), rgba(2,6,23,0.72));
                    opacity: 0.9;
                }
                .premium-dashboard-bg::after {
                    content: "";
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background-image: radial-gradient(rgba(255, 255, 255, 0.11) 1px, transparent 1px);
                    background-size: 22px 22px;
                    mask-image: linear-gradient(to bottom, transparent, black 22%, black 82%, transparent);
                }
                .user-dash-card {
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    background:
                        linear-gradient(180deg, rgba(15, 23, 42, 0.76), rgba(8, 47, 73, 0.62));
                    color: #f8fafc;
                    box-shadow: 0 30px 90px rgba(2, 6, 23, 0.38);
                    backdrop-filter: blur(26px);
                }
                .user-dash-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    pointer-events: none;
                    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent 38%);
                }
                .user-dash-sidebar {
                    background: linear-gradient(180deg, rgba(2, 6, 23, 0.96), rgba(8, 47, 73, 0.94));
                    border-color: rgba(255,255,255,0.08);
                    box-shadow: 16px 0 50px rgba(2, 6, 23, 0.22);
                }
                .user-dash-stat {
                    position: relative;
                    overflow: hidden;
                }
                .user-dash-stat::after {
                    content: "";
                    position: absolute;
                    inset: auto -18px -34px auto;
                    width: 110px;
                    height: 110px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.16);
                }
                .user-dash-upload {
                    background:
                        linear-gradient(135deg, rgba(34,211,238,0.12), rgba(16,185,129,0.1)),
                        rgba(255,255,255,0.08);
                    border: 1.5px dashed rgba(125, 211, 252, 0.42);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 35px rgba(8, 145, 178, 0.12);
                }
                .user-dash-sidebar button:not(.bg-gradient-to-r) {
                    color: rgba(226, 232, 240, 0.82);
                }
                .user-dash-sidebar button:not(.bg-gradient-to-r):hover {
                    background: rgba(255,255,255,0.08);
                    color: #ffffff;
                }
                .dashboard-immersive-image {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background-position: center;
                    background-size: cover;
                    opacity: 0.22;
                    mix-blend-mode: screen;
                    filter: saturate(1.16) contrast(1.04);
                }
                .dashboard-stage-card {
                    min-height: 220px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.16);
                    background:
                        linear-gradient(120deg, rgba(2,6,23,0.84), rgba(8,47,73,0.62)),
                        linear-gradient(135deg, rgba(34,211,238,0.16), rgba(16,185,129,0.08));
                    box-shadow: 0 34px 90px rgba(2,6,23,0.42);
                }
                .premium-dashboard-bg .top-bar-glass {
                    background: rgba(255,255,255,0.1) !important;
                    border: 1px solid rgba(255,255,255,0.14) !important;
                    box-shadow: 0 26px 70px rgba(2,6,23,0.35) !important;
                    backdrop-filter: blur(26px) !important;
                }
                .premium-dashboard-bg .top-bar-glass .title,
                .premium-dashboard-bg .top-bar-glass .eyebrow {
                    color: #ffffff !important;
                }
                .premium-dashboard-bg .top-bar-glass .brand-mark {
                    background: rgba(255,255,255,0.14);
                    color: #ffffff;
                    border: 1px solid rgba(255,255,255,0.16);
                }
            `}</style>
            <div className="dashboard-immersive-image" style={{ backgroundImage: `url(${printKioskBg})` }} />
            {/* Flex row container that places the sidebar at the very left edge of the page */}
            <div className="flex flex-col md:flex-row min-h-screen w-full">
                {/* Left Sidebar / Top Mobile Icons Row */}
                <div className={`shrink-0 flex transition-all duration-300 user-dash-sidebar border-r border-slate-200/80 p-4 sticky top-0 z-30 ${
                    isSidebarExpanded 
                        ? "w-full md:w-60 flex-col h-auto md:h-screen justify-between" 
                        : "w-full md:w-20 flex-row md:flex-col items-center justify-around md:justify-start h-auto md:h-screen gap-6"
                }`}>
                    <div>
                        {/* Hamburger / Toggle Header */}
                        <div className={`flex items-center ${isSidebarExpanded ? "justify-between w-full mb-6" : "justify-center mb-0 md:mb-6"}`}>
                            {isSidebarExpanded && (
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Navigation</span>
                            )}
                            <button 
                                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-200 cursor-pointer active:scale-95 transition-all"
                                title={isSidebarExpanded ? "Collapse Menu" : "Expand Menu"}
                            >
                                {isSidebarExpanded ? <PanelLeftClose className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className={`flex ${isSidebarExpanded ? "flex-col gap-2 w-full" : "flex-row md:flex-col gap-3 flex-1 md:flex-initial w-full justify-around md:justify-start"}`}>
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`font-black text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                            isSidebarExpanded 
                                                ? "w-full text-left justify-start px-4 py-3 gap-3" 
                                                : "w-12 h-12 md:w-12 justify-center px-0 py-0"
                                        } ${
                                            isActive 
                                                ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-500/20" 
                                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                                        }`}
                                        title={tab.label}
                                    >
                                        <TabIcon className="w-5 h-5 shrink-0" />
                                        {isSidebarExpanded && (
                                            <span className="truncate">{tab.label}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Profile Details in expanded state */}
                    {isSidebarExpanded && (
                        <div className="pt-6 border-t border-slate-150 w-full mt-auto hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged In As</p>
                            <p className="text-sm font-black text-white truncate mt-0.5">{userName || "Customer"}</p>
                        </div>
                    )}
                </div>

                {/* Right Content Pane (Navbar + Subpages) */}
                <div className="relative z-10 flex-1 min-w-0 w-full px-4 py-4 md:px-8 md:py-6 flex flex-col gap-6">
                    <Navbar
                        title=""
                        subtitle=""
                        badge={blockLocation || "No block"}
                        actions={[
                            { label: `Wallet: ₹${walletBalance}`, onClick: () => setShowWalletModal(true), className: "btn success cursor-pointer !border-emerald-500 !bg-emerald-600/20 !text-emerald-400" },
                            { label: "Change Location", path: "/blocks", className: "btn secondary" }
                        ]}
                    />

                    <section className="dashboard-stage-card relative rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="relative z-10 max-w-2xl">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Premium Print Workspace</p>
                            <h1 className="mt-3 text-4xl md:text-5xl font-black leading-tight text-white">
                                Upload. Pay. Print from your campus kiosk.
                            </h1>
                            <p className="mt-4 text-sm md:text-base font-semibold leading-relaxed text-cyan-50/76">
                                A focused command center for print jobs, wallet payments, pricing, and live printer readiness.
                            </p>
                        </div>
                        <div className="relative h-44 w-full md:w-72 shrink-0">
                            <div className="absolute inset-0 rounded-[24px] bg-cyan-300/10 blur-2xl" />
                            <img
                                src={kioskFront}
                                alt=""
                                className="relative z-10 h-full w-full object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.45)]"
                            />
                        </div>
                    </section>

                    {/* Non-intrusive Referral Advertisement Banner */}
                    {displayAdText && (
                        <div style={{
                            background: "linear-gradient(90deg, #1e293b, #0f172a)",
                            border: "1px solid #0284c7",
                            color: "#cbd5e1",
                            padding: "8px 20px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 15px rgba(2, 132, 199, 0.15)"
                        }}>
                            <marquee scrollamount="4">
                                {displayAdText}
                            </marquee>
                        </div>
                    )}

                    {/* Maintenance mode marquee alert */}
                    {systemStatus.maintenance && (
                        <div style={{
                            background: "#f97316",
                            color: "#ffffff",
                            padding: "10px 16px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            boxShadow: "0 0 15px rgba(249, 115, 22, 0.3)"
                        }}>
                            <marquee scrollamount="4">
                                ⚠️ Please try again later as the machine is under maintenance.
                            </marquee>
                        </div>
                    )}

                    {/* Connectivity guards marquee alert */}
                    {(!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) && (
                        <div style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            padding: "10px 16px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
                        }}>
                            <marquee scrollamount="5">
                                connection is not available
                            </marquee>
                        </div>
                    )}

                    {/* Welcome Card & Statistics Row */}
                    {/* Desktop View: Combined single card row */}
                    <div className="hidden md:flex items-center justify-between p-6 rounded-[24px] user-dash-card border border-white/10 relative overflow-hidden shadow-xl bg-gradient-to-r from-slate-950 via-cyan-950 to-emerald-900 text-white min-h-[110px] mb-0">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-500 via-emerald-500 to-amber-400" />
                        <div className="relative z-10 flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-200">Welcome Back</span>
                            <h3 className="text-2xl font-black mt-1 text-white leading-none">Hello, {userName || "Sai"} 👋</h3>
                            <p className="text-xs font-semibold text-cyan-50/70 mt-2 max-w-xl flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                                Selected printer counter: <strong className="text-white">{blockLocation}</strong>
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-4 bg-white/10 border border-white/15 px-5 py-3 rounded-2xl shadow-inner">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">Wallet Balance</span>
                                <span className="text-2xl font-black mt-0.5 text-white">₹{walletBalance}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View: Keep the original stacked/two-card columns layout */}
                    <div className="flex flex-col gap-4 md:hidden mb-0">
                        <div className="user-dash-card user-dash-stat p-6 rounded-3xl flex flex-col justify-between overflow-hidden relative">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-400" />
                            <div className="relative z-10">
                                <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Welcome Back</p>
                                <h3 className="text-2xl font-black text-white mt-1">Hello, {userName || "Sai"}</h3>
                                <p className="text-sm font-bold text-cyan-50/70 mt-2">
                                    Counter: {blockLocation}
                                </p>
                            </div>
                        </div>

                        <div className="user-dash-stat p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-900 text-white shadow-2xl flex flex-col justify-between border border-white/10">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-cyan-100">Wallet Balance</p>
                                    <h3 className="text-2xl font-black mt-0.5">₹{walletBalance}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* TAB CONTENT: PRINT DASHBOARD */}
                {activeTab === "print" && (
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <motion.section
                            className="user-dash-card p-6 rounded-3xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Step 1</p>
                                    <h2 className="text-2xl font-black text-white">
                                        Upload Files
                                    </h2>
                                </div>

                                <span className={uploaded ? "status-pill status-created" : "status-pill status-unpaid"}>
                                    {uploaded ? "Uploaded" : "Waiting"}
                                </span>
                            </div>

                            <div className="mb-4 text-left">
                                <span className="mb-2 block text-sm font-black text-cyan-50/80">
                                    Printing Location
                                </span>
                                <div className="field !bg-white/10 !border-white/15 !text-white">
                                    {blockLocation}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                {/* Left side: How to Upload Video */}
                                <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-slate-50 relative flex items-center justify-center p-1.5 h-[220px]">
                                    <video 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                    >
                                        <source src={howToUpload} type="video/mp4" />
                                    </video>
                                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/75 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase tracking-wider text-center">
                                        🎬 Tutorial: How to Upload
                                    </div>
                                </div>

                                {/* Right side: Existing Upload Dropzone */}
                                <label 
                                    className="user-dash-upload block !mt-0 h-[220px] rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl" 
                                    style={!systemStatus.databaseConnected ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={!systemStatus.databaseConnected || uploading}
                                    />

                                    <div className="flex flex-col items-center gap-2 text-center">
                                        {selectedFiles.length === 0 && (
                                            <div className="w-14 h-14 mb-2 flex items-center justify-center bg-white text-cyan-600 rounded-2xl border border-cyan-100 shadow-sm animate-bounce" style={{ animationDuration: '2.5s' }}>
                                                <UploadCloud className="w-8 h-8" />
                                            </div>
                                        )}
                                        <span className="text-sm font-black text-cyan-50 leading-tight">
                                            {selectedFiles.length > 0 
                                                ? `${selectedFiles.length} file(s) selected`
                                                : "Choose files (PDF, PNG, JPG)"}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <AnimatePresence>
                                {uploaded && (
                                    <motion.div
                                        className="mt-6 grid gap-4 rounded-lg border border-green-200 bg-green-50 p-4 sm:grid-cols-2"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Order ID
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {orderId}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Customer
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {userName || "Customer"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Total Pages
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {totalPages}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Location
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {blockLocation}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.section>

                        <motion.aside
                            className="user-dash-card p-6 rounded-3xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            <p className="eyebrow">Live Pricing</p>
                            <h2 className="mt-2 text-2xl font-black text-white">
                                Estimate
                            </h2>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <p className="text-sm font-bold text-slate-500">BW</p>
                                    <p className="mt-1 text-2xl font-black text-slate-900">Rs. {bwPrice}</p>
                                </div>

                                <div className="rounded-lg bg-slate-100 p-4">
                                    <p className="text-sm font-bold text-slate-500">Color</p>
                                    <p className="mt-1 text-2xl font-black text-slate-900">Rs. {colorPrice}</p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-lg bg-slate-900 p-5 text-white">
                                <p className="text-sm font-bold text-slate-300">Estimated Total</p>
                                <motion.p
                                    key={estimatedTotal}
                                    className="mt-2 text-4xl font-black"
                                    initial={{ scale: 0.96, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    Rs. {estimatedTotal || 0}
                                </motion.p>
                            </div>

                            {/* Wallet Visual Card */}
                            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h1a2 2 0 012 2v2a2 2 0 01-2 2h-1m2-6h1a2 2 0 012 2v2a2 2 0 01-2 2h-1m-4-6v10m-3-3h12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="eyebrow">Your Wallet</p>
                                    <p className="text-xl font-black text-slate-900">₹{walletBalance}</p>
                                </div>
                            </div>

                            {uploaded && (
                                <div className="mt-5 space-y-3">
                                    <button
                                        onClick={payWithWalletDirect}
                                        disabled={isPrintingDisabled || !!paymentMethod || walletBalance < estimatedTotal}
                                        className="btn secondary w-full flex items-center justify-center gap-2"
                                        style={isPrintingDisabled || !!paymentMethod || walletBalance < estimatedTotal ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                                    >
                                        {paymentMethod === "wallet" ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                Processing Wallet...
                                            </>
                                        ) : `Pay with Wallet (₹${estimatedTotal.toFixed(2)})`}
                                    </button>
                                    <button
                                        onClick={payNowDirect}
                                        disabled={isPrintingDisabled || !!paymentMethod}
                                        className="btn success w-full flex items-center justify-center gap-2"
                                        style={isPrintingDisabled || !!paymentMethod ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                                    >
                                        {paymentMethod === "razorpay" ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                Proceeding to Payment...
                                            </>
                                        ) : "Proceed to Payment"}
                                    </button>
                                </div>
                            )}

                            {/* Printer Info Panel */}
                            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <p className="eyebrow">Printer Details</p>
                                <h3 className="mt-1 text-sm font-black text-slate-900">
                                    {blockLocation} Status
                                </h3>
                                
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Connection</span>
                                        <span className={`status-pill ${systemStatus.agentOnline ? 'status-completed' : 'status-unpaid'}`} style={{ minHeight: '20px', fontSize: '9px', padding: '2px 8px' }}>
                                            {systemStatus.agentOnline ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Configured</span>
                                        <span className={`status-pill ${systemStatus.printerConfigured ? 'status-completed' : 'status-unpaid'}`} style={{ minHeight: '20px', fontSize: '9px', padding: '2px 8px' }}>
                                            {systemStatus.printerConfigured ? 'YES' : 'NO'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2 mt-2">
                                        <span className="font-bold text-slate-500">Paper Remaining</span>
                                        <span className={`font-black ${paperCount < 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {paperCount} sheets
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Section */}
                            {/* Coupon & Referral Section (Side by Side) */}
                            {uploaded && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {/* Coupon Section */}
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between">
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => !couponApplied && setHaveCoupon(!haveCoupon)}
                                                disabled={couponApplied}
                                                className={`w-full h-14 rounded-lg flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer ${
                                                    couponApplied 
                                                    ? 'bg-emerald-600 border-emerald-700/30' 
                                                    : 'bg-red-600 border-red-700/30 shadow-[0_4px_15px_rgba(220,38,38,0.25)]'
                                                }`}
                                            >
                                                {/* Left section: White barcode */}
                                                <div className="w-16 bg-white flex items-center justify-center relative border-r border-dashed border-slate-300">
                                                    {/* Top and Bottom Scallop cutouts */}
                                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 -translate-y-1/2" />
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 translate-y-1/2" />
                                                    
                                                    {/* Barcode representation */}
                                                    <div className="flex gap-[2px] items-center justify-center h-10">
                                                        <div className="w-[2px] h-full bg-slate-900" />
                                                        <div className="w-[4px] h-full bg-slate-900" />
                                                        <div className="w-[1.5px] h-full bg-slate-900" />
                                                        <div className="w-[3px] h-full bg-slate-900" />
                                                        <div className="w-[1.5px] h-full bg-slate-900" />
                                                        <div className="w-[4px] h-full bg-slate-900" />
                                                        <div className="w-[2px] h-full bg-slate-900" />
                                                    </div>
                                                </div>

                                                {/* Right section: Red/Green Coupon text */}
                                                <div className="px-3.5 flex flex-col justify-center text-left text-white">
                                                    <span className="text-[8px] font-black tracking-widest uppercase opacity-85">COUPON</span>
                                                    <span className="text-xs font-black whitespace-nowrap mt-0.5">
                                                        {couponApplied ? "APPLIED!" : "HAVE COUPON?"}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        {(haveCoupon || couponApplied) && (
                                            <div className="mt-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    className="field text-xs py-1.5 w-full"
                                                    disabled={couponApplied}
                                                />
                                                <button
                                                    onClick={applyCoupon}
                                                    disabled={couponApplied}
                                                    className={couponApplied ? "btn secondary text-xs py-1.5 px-3" : "btn text-xs py-1.5 px-3"}
                                                >
                                                    {couponApplied ? "Applied" : "Apply"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Referral Section */}
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between">
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => !referralApplied && setHaveReferral(!haveReferral)}
                                                disabled={referralApplied}
                                                className={`w-full h-14 rounded-lg flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer bg-white ${
                                                    referralApplied 
                                                    ? 'bg-emerald-600 border-emerald-700/30' 
                                                    : 'border-slate-200'
                                                }`}
                                            >
                                                {/* Left section: Referral icon image */}
                                                <div className="w-16 bg-white flex items-center justify-center relative border-r border-dashed border-slate-200">
                                                    {/* Top and Bottom Scallop cutouts */}
                                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 -translate-y-1/2" />
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-1/2 translate-y-1/2" />
                                                    
                                                    <img
                                                        src={referralIcon}
                                                        alt="Referral"
                                                        className="w-10 h-10 object-contain rounded-md"
                                                    />
                                                </div>

                                                {/* Right section: Referral text */}
                                                <div className={`px-3.5 flex flex-col justify-center text-left ${referralApplied ? 'text-white' : 'text-slate-800'}`}>
                                                    <span className={`text-[8px] font-black tracking-widest uppercase ${referralApplied ? 'text-white/80' : 'text-slate-400'}`}>REFERRAL</span>
                                                    <span className="text-xs font-black whitespace-nowrap mt-0.5">
                                                        {referralApplied ? "APPLIED!" : "REFERRAL CODE?"}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        {(haveReferral || referralApplied) && (
                                            <div className="mt-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Referral code"
                                                    value={enteredReferralCode}
                                                    onChange={(e) => setEnteredReferralCode(e.target.value)}
                                                    className="field text-xs py-1.5 w-full"
                                                    disabled={referralApplied}
                                                />
                                                <button
                                                    onClick={applyReferral}
                                                    disabled={referralApplied}
                                                    className={referralApplied ? "btn secondary text-xs py-1.5 px-3" : "btn text-xs py-1.5 px-3"}
                                                >
                                                    {referralApplied ? "Applied" : "Apply"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.aside>

                        <AnimatePresence>
                            {uploaded && (
                                <motion.section
                                    className="panel mt-6 p-6 lg:col-span-2"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 18 }}
                                >
                                    <div className="section-header">
                                        <div>
                                            <p className="eyebrow">Step 2</p>
                                            <h2 className="text-2xl font-black text-slate-900">
                                                Print Settings
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Low paper notification banner on dashboard */}
                                    {isLowPaper && (
                                        <div style={{
                                            background: "#ef4444",
                                            color: "#ffffff",
                                            padding: "10px 16px",
                                            borderRadius: "10px",
                                            fontSize: "13px",
                                            fontWeight: "bold",
                                            marginBottom: "16px",
                                            boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
                                        }}>
                                            <marquee scrollamount="4">⚠️ Print cannot be done due to low paper levels. Selected pages ({estimatedTotalPages}) exceed printer sheets ({paperCount}).</marquee>
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-5">
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Copies
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={copies}
                                                onChange={(e) => setCopies(e.target.value)}
                                                className="field"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Print Type
                                            </span>
                                            <select
                                                value={printType}
                                                onChange={(e) => setPrintType(e.target.value)}
                                                className="field"
                                            >
                                                <option value="BW">Black & White</option>
                                                {colorSupported && (
                                                    <option value="COLOR">Color</option>
                                                )}
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Pages
                                            </span>
                                            <select
                                                value={pageOption}
                                                onChange={(e) => setPageOption(e.target.value)}
                                                className="field"
                                            >
                                                <option value="ALL">All Pages</option>
                                                <option value="CUSTOM">Custom Range</option>
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Pages Per Sheet
                                            </span>
                                            <select
                                                value={nupLayout}
                                                onChange={(e) => setNupLayout(e.target.value)}
                                                className="field"
                                            >
                                                <option value="1-up">1-up (Normal)</option>
                                                <option value="2-up">2-up (Saver)</option>
                                                <option value="4-up">4-up (Compact)</option>
                                                <option value="6-up">6-up (Micro)</option>
                                                <option value="8-up">8-up (Mini)</option>
                                                <option value="9-up">9-up (Nano)</option>
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Print Sides
                                            </span>
                                            <select
                                                value={doubleSided ? "double" : "single"}
                                                onChange={(e) => setDoubleSided(e.target.value === "double")}
                                                className="field"
                                            >
                                                <option value="single">Single Sided</option>
                                                <option value="double">Double Sided (Duplex)</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
                                        <button
                                            onClick={payWithWalletDirect}
                                            className="btn secondary px-8 py-3"
                                            disabled={isPrintingDisabled || !!paymentMethod || walletBalance < estimatedTotal}
                                            style={isPrintingDisabled || !!paymentMethod || walletBalance < estimatedTotal ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                                        >
                                            {paymentMethod === "wallet" ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-slate-700 inline-block mr-2" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                    </svg>
                                                    Processing Wallet Payment...
                                                </>
                                            ) : `Pay with Wallet (₹${estimatedTotal.toFixed(2)})`}
                                        </button>
                                        <button
                                            onClick={payNowDirect}
                                            className="btn success px-8 py-3 flex items-center justify-center gap-2"
                                            disabled={isPrintingDisabled || !!paymentMethod}
                                            style={isPrintingDisabled || !!paymentMethod ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                                        >
                                            {paymentMethod === "razorpay" ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                    </svg>
                                                    Proceeding to Payment...
                                                </>
                                            ) : "Proceed to Payment"}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {pageOption === "CUSTOM" && (
                                            <motion.div
                                                className="mt-4 grid gap-4 md:grid-cols-2"
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                            >
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={totalPages}
                                                    placeholder="Start Page"
                                                    value={startPage}
                                                    onChange={(e) => setStartPage(e.target.value)}
                                                    className="field"
                                                />

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={totalPages}
                                                    placeholder="End Page"
                                                    value={endPage}
                                                    onChange={(e) => setEndPage(e.target.value)}
                                                    className="field"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Dynamic Announcements & Banners */}
                        {sections.length > 0 && (
                            <motion.section 
                                className="panel mt-6 p-6 lg:col-span-2"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Announcements & Services</p>
                                        <h2 className="text-2xl font-black text-slate-900">Featured Updates & Promotions</h2>
                                    </div>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                                    {sections.map((sec, idx) => (
                                        <motion.div
                                            key={sec.id}
                                            className="block-card flex flex-col justify-between"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                borderColor: sec.sectionType === 'ADVERTISING' ? '#0ea5e9' : sec.sectionType === 'NEW_BLOCK' ? '#10b981' : '#8b5cf6',
                                                '--block-accent': sec.sectionType === 'ADVERTISING' ? '#0ea5e9' : sec.sectionType === 'NEW_BLOCK' ? '#10b981' : '#8b5cf6'
                                            }}
                                        >
                                            <div>
                                                <span className="status-pill mb-3" style={{
                                                    color: sec.sectionType === 'ADVERTISING' ? '#0284c7' : sec.sectionType === 'NEW_BLOCK' ? '#047857' : '#6d28d9',
                                                    background: sec.sectionType === 'ADVERTISING' ? '#e0f2fe' : sec.sectionType === 'NEW_BLOCK' ? '#d1fae5' : '#f3e8ff',
                                                    fontSize: '10px',
                                                    minHeight: '20px',
                                                    padding: '2px 8px'
                                                }}>
                                                    {sec.sectionType}
                                                </span>
                                                <h3 className="block-card-title mt-2 text-xl font-bold text-slate-900">{sec.title}</h3>
                                                <p className="block-card-text text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{sec.content}</p>
                                            </div>
                                            {sec.redirectUrl && (
                                                <a href={sec.redirectUrl} target="_blank" rel="noopener noreferrer" className="block-card-cta mt-4 inline-block hover:underline">
                                                    Learn More →
                                                </a>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: MY ORDERS */}
                {activeTab === "orders" && (
                    <div className="relative">
                        {loadingOrders && (
                            <div className="absolute inset-0 z-30 min-h-[300px] flex flex-col items-center justify-center bg-white/95 rounded-2xl border border-slate-100 flex-1 py-12">
                                <div className="w-24 h-24 mb-4 relative rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 flex items-center justify-center">
                                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                        <source src={ordersLoading} type="video/mp4" />
                                    </video>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">Loading Order History...</h3>
                                <p className="text-xs font-semibold text-slate-500">Checking physical queue spooler status</p>
                            </div>
                        )}
                        
                        <div className="grid lg:grid-cols-[1.45fr_0.55fr] gap-6 items-start" style={loadingOrders ? { filter: 'blur(3px)', opacity: 0.65, pointerEvents: 'none' } : {}}>
                            {/* Left Side: Order History Table */}
                            <motion.section
                                className="panel p-6 overflow-x-auto !mb-0"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="section-header mb-6">
                                    <div>
                                        <p className="eyebrow">Track Status</p>
                                        <h2 className="text-2xl font-black text-slate-900">Order History</h2>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        Auto-refreshing every 3s
                                    </span>
                                </div>

                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Location</th>
                                            <th>Pages</th>
                                            <th>Copies</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <td className="font-black">{order.orderId}</td>
                                                <td>{order.blockLocation || "C Block"}</td>
                                                <td>{order.selectedPages}</td>
                                                <td>{order.copies}</td>
                                                <td className="font-black">Rs. {order.price}</td>
                                                <td className="flex items-center gap-2">
                                                     <span className={orderStatusClass(order.status)}>
                                                         {order.status}
                                                     </span>
                                                     {order.status === "PRINTING" && (
                                                         <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                                                             <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                             </svg>
                                                             <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">printing</span>
                                                         </div>
                                                     )}
                                                 </td>
                                                <td>
                                                     <div className="flex items-center gap-2">
                                                         {order.status === "CANCEL_WINDOW" && (
                                                             <button
                                                                 onClick={() => handleCancelOrder(order.orderId)}
                                                                 className="btn danger"
                                                                 style={{ padding: "4px 8px", fontSize: "12px", minHeight: "28px" }}
                                                             >
                                                                 Cancel Print
                                                             </button>
                                                         )}
                                                         {order.paymentStatus === "PAID" && (
                                                             <button
                                                                 onClick={async () => {
                                                                     try {
                                                                         const response = await api.get("/pdf/details", {
                                                                             params: { orderId: order.orderId }
                                                                         });
                                                                         setSelectedInvoiceOrder(response.data);
                                                                         setTimeout(() => {
                                                                             window.print();
                                                                         }, 200);
                                                                     } catch (err) {
                                                                         console.error("Failed to load invoice details:", err);
                                                                     }
                                                                 }}
                                                                 className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black px-2.5 py-1 rounded text-xs transition-all cursor-pointer shadow flex items-center gap-1 min-h-[28px]"
                                                             >
                                                                 Receipt 🧾
                                                             </button>
                                                         )}
                                                     </div>
                                                 </td>
                                            </motion.tr>
                                        ))}

                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan="7">
                                                    <div className="empty-state">
                                                        <div className="empty-state-icon">📄</div>
                                                        <p>No orders yet</p>
                                                        <button
                                                            onClick={() => setActiveTab("print")}
                                                            className="btn mt-4"
                                                        >
                                                            Start Printing
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>

                            {/* Right Side: Visual Queue tracking video panel */}
                            <motion.section 
                                className="panel p-6 flex flex-col items-center justify-center text-center !mb-0"
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                            >
                                <p className="eyebrow">Realtime Queue</p>
                                <h3 className="text-lg font-black text-slate-900 mb-4">Print Hub Status</h3>
                                
                                <div className="w-full max-w-[200px] h-[200px] rounded-xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 relative flex items-center justify-center p-1">
                                    <video 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                    >
                                        <source src={myOrdersVideo} type="video/mp4" />
                                    </video>
                                </div>
                                
                                <p className="text-xs font-bold text-slate-500 mt-4 leading-relaxed">
                                    Your orders are automatically sent to the physical print spooler queue. Refresh status occurs automatically.
                                </p>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: COUPONS & REWARDS */}
                {activeTab === "coupons" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Referral Stats Panel */}
                        <motion.section
                            className="panel p-6 flex flex-col justify-between"
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div>
                                <p className="eyebrow">Refer & Earn</p>
                                <h2 className="text-2xl font-black text-slate-900 mt-1 mb-4">Share the Service</h2>
                                
                                <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                                    Invite your friends to try Cloud Print! When they register using your custom link or enter your referral customer ID on their first checkout, you earn <span className="text-emerald-500 font-bold">Rs. 10</span> and they get <span className="text-cyan-500 font-bold">Rs. 5</span> in wallet balance credits.
                                </p>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Referral ID / Code</span>
                                    <div className="flex items-center justify-between mt-2 gap-3">
                                        <code className="text-2xl font-black text-slate-900 select-all tracking-wider">
                                            {referralCode || userId || "N/A"}
                                        </code>
                                        {referralCode && (
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(referralCode);
                                                    showAlert("Copied!", "Referral code copied to clipboard", "success");
                                                }}
                                                className="btn secondary"
                                                style={{ minHeight: "36px", padding: "6px 12px" }}
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200/60 p-3 rounded-lg">
                                ℹ️ Note: Credits are added instantly after the referred customer places their first paid print order.
                            </div>
                        </motion.section>

                        {/* Claim Promo Code Panel */}
                        <motion.section
                            className="panel p-6"
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p className="eyebrow">Claim Credit</p>
                            <h2 className="text-2xl font-black text-slate-900 mt-1 mb-4">Redeem Rewards</h2>
                            
                            <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                                Received a promo card, code, or special administrator voucher? Enter the claim code below to deposit reward balance directly into your wallet.
                            </p>

                             <div className="flex justify-center mb-5">
                                 <div className="w-16 h-16 flex items-center justify-center bg-purple-50 text-purple-600 rounded-2xl border border-purple-100/50 shadow-sm animate-bounce" style={{ animationDuration: '2s' }}>
                                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125V8.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                     </svg>
                                 </div>
                             </div>

                             <form onSubmit={handleClaimReward} className="space-y-4">
                                <label className="block">
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Claim Code / Voucher Code</span>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. SAVE100, FREE50, ADMINREWARD" 
                                        className="field uppercase tracking-wider font-mono font-black"
                                        value={rewardCode}
                                        onChange={(e) => setRewardCode(e.target.value)}
                                        required
                                    />
                                </label>

                                <button 
                                    type="submit" 
                                    className="btn success w-full mt-2" 
                                    disabled={claimingReward}
                                >
                                    {claimingReward ? "Verifying code..." : "Redeem Code"}
                                </button>
                            </form>
                        </motion.section>
                    </div>
                )}

                {/* TAB CONTENT: SUPPORT DESK */}
                {activeTab === "support" && (
                    <motion.section
                        className="panel p-6 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="eyebrow">Help & Feedback</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-1 mb-2">📞 Support Desk</h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Submit your request below. Tickets will be processed by our administration. Once solved, work related mails are dispatched to <span className="font-bold text-sky-600">saipraveendasari2@gmail.com</span>, and we will contact you back immediately.
                        </p>

                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Your Name</span>
                                <input 
                                    type="text" 
                                    className="field w-full font-bold" 
                                    value={supportName} 
                                    onChange={(e) => setSupportName(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Email Address</span>
                                <input 
                                    type="email" 
                                    className="field w-full font-bold" 
                                    value={supportEmail} 
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Inquiry / Message</span>
                                <textarea 
                                    className="field w-full min-h-[120px]" 
                                    placeholder="Explain your problem, request refunds, or query order details..."
                                    value={supportMessage} 
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                    required
                                />
                            </label>

                            <button 
                                type="submit" 
                                className="btn success w-full mt-4" 
                                disabled={supportSubmitting}
                            >
                                {supportSubmitting ? "Submitting request, please wait..." : "Submit Support Request"}
                            </button>
                        </form>
                    </motion.section>
                )}
                    </div> {/* Close Right Content Pane */}
                </div> {/* Close Main flex layout row */}

            {/* Privacy Policy Modal */}
            <AnimatePresence>
                {showPrivacyNotice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
                        <motion.div
                            className="relative my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 cursor-grab active:cursor-grabbing"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.6}
                            onDragEnd={(event, info) => {
                                if (Math.abs(info.offset.y) > 140 || Math.abs(info.offset.x) > 140) {
                                    if (dontShowAgain) {
                                        localStorage.setItem("dontShowPrivacyNotice", "true");
                                    }
                                    setShowPrivacyNotice(false);
                                }
                            }}
                            initial={{ scale: 0.93, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-4 cursor-grab" />
                            <div className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">
                                Swipe or drag away to dismiss
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 text-sky-500 bg-sky-50 border-sky-100">
                                    🔒
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2">
                                    Privacy & Data Policy
                                </h3>

                                <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                    Your data safety is our top priority. Only order IDs and configurations are saved in our database. To protect your privacy and reduce storage, all uploaded PDF and image files are completely and permanently deleted from our servers immediately after printing.
                                </p>

                                <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-600">Don't show this message again</span>
                                </label>

                                <button
                                    onClick={() => {
                                        if (dontShowAgain) {
                                            localStorage.setItem("dontShowPrivacyNotice", "true");
                                        }
                                        setShowPrivacyNotice(false);
                                    }}
                                    className="btn w-full success"
                                >
                                    I Understand
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* General Announcement Modal */}
            <AnimatePresence>
                {showGeneralPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
                        <motion.div
                            className="relative my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 cursor-grab active:cursor-grabbing"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.6}
                            onDragEnd={(event, info) => {
                                if (Math.abs(info.offset.y) > 140 || Math.abs(info.offset.x) > 140) {
                                    if (dontShowGeneralPopupAgain) {
                                        localStorage.setItem("dismissedGeneralPopupMessage", settings.generalPopupMessage);
                                    }
                                    setShowGeneralPopup(false);
                                }
                            }}
                            initial={{ scale: 0.93, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-4 cursor-grab" />
                            <div className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">
                                Swipe or drag away to dismiss
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 text-indigo-500 bg-indigo-50 border-indigo-100">
                                    📢
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2">
                                    Announcement
                                </h3>

                                <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed whitespace-pre-line">
                                    {settings.generalPopupMessage}
                                </p>

                                <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        checked={dontShowGeneralPopupAgain}
                                        onChange={(e) => setDontShowGeneralPopupAgain(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-600">Don't show this announcement again</span>
                                </label>

                                <button
                                    onClick={() => {
                                        if (dontShowGeneralPopupAgain) {
                                            localStorage.setItem("dismissedGeneralPopupMessage", settings.generalPopupMessage);
                                        }
                                        setShowGeneralPopup(false);
                                    }}
                                    className="btn w-full success"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Uploading Status Popup Modal */}
            <AnimatePresence>
                {uploading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
                        <motion.div 
                            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full my-auto max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col items-center text-center"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Uploading Video Loop */}
                            <div className="w-32 h-32 mb-6 relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                >
                                    <source src={fileUploading} type="video/mp4" />
                                </video>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-950 mb-2">Processing & Uploading...</h3>
                            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                Please wait while your files are uploaded, compiled, and merged. Do not close or refresh this tab.
                            </p>
                            
                            {/* Animated Loading Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-0 bg-sky-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Wallet Details Popup Modal */}
            <AnimatePresence>
                {showWalletModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
                        <motion.div 
                            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full my-auto max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col items-center text-center relative"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button 
                                onClick={() => setShowWalletModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xl font-bold"
                            >
                                ✕
                            </button>

                            {/* Wallet Coins Video Loop */}
                            <div className="w-32 h-32 mb-6 relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                >
                                    <source src={walletVideo} type="video/mp4" />
                                </video>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-955 mb-2">My Printing Wallet</h3>
                            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                Deposit funds to pay for your print orders instantly.
                            </p>
                            
                            {/* Balance Card */}
                            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex flex-col items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Available Balance</span>
                                <span className="text-3xl font-black text-emerald-950 mt-1">₹{walletBalance}</span>
                            </div>

                            {/* Add Balance Mockup Action */}
                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        setActiveTab("coupons");
                                    }}
                                    className="btn w-full"
                                >
                                    Redeem Reward Vouchers
                                </button>
                                <button 
                                    onClick={() => setShowWalletModal(false)}
                                    className="btn secondary w-full"
                                >
                                    Close Wallet
                                </button>
                            </div>
                        </motion.div>
                    </div>
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

            {selectedInvoiceOrder && (
                <div id="printable-invoice">
                    <div className="invoice-box">
                        <div className="invoice-watermark">{selectedInvoiceOrder.orderId}</div>
                        <div className="invoice-stamp">VERIFIED</div>
                        
                        <div className="invoice-header">
                            <div className="invoice-logo">🖨️ CLOUD PRINT</div>
                            <div className="invoice-title">PAYMENT RECEIPT</div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Order ID:</span>
                                <span className="invoice-val font-bold">{selectedInvoiceOrder.orderId}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Order Created:</span>
                                <span className="invoice-val">{new Date(selectedInvoiceOrder.uploadTime).toLocaleString()}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Order Printed:</span>
                                <span className="invoice-val">
                                    {selectedInvoiceOrder.queuedAt 
                                        ? new Date(selectedInvoiceOrder.queuedAt).toLocaleString() 
                                        : (selectedInvoiceOrder.status === "COMPLETED" 
                                            ? "Yes (Counter Picked)" 
                                            : "Pending Kiosk Release")}
                                </span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Transaction ID:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.razorpayPaymentId || "N/A"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Payment Method:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.razorpayPaymentId === "WALLET" ? "Wallet Balance" : "Razorpay Online"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Block Location:</span>
                                <span className="invoice-val font-bold">{selectedInvoiceOrder.blockLocation || "C Block"}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <p className="invoice-subtitle">Document Info</p>
                            <div className="invoice-row">
                                <span className="invoice-label">File Name:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.fileName}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Print Option:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.printType}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Sides:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.doubleSided ? "Double Sided" : "Single Sided"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Print Papers (Pages):</span>
                                <span className="invoice-val font-bold">{selectedInvoiceOrder.selectedPages}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Total Pages Count:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.totalPages} pages</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Copies:</span>
                                <span className="invoice-val">{selectedInvoiceOrder.copies} copies</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Original Price:</span>
                                <span className="invoice-val">Rs. {Number(selectedInvoiceOrder.originalPrice || selectedInvoiceOrder.price).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Discount Applied:</span>
                                <span className="invoice-val text-green-600">- Rs. {Number(selectedInvoiceOrder.discountAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row invoice-total">
                                <span className="invoice-label">Total Paid:</span>
                                <span className="invoice-val">Rs. {Number(selectedInvoiceOrder.price).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-footer">
                            <p>Thank you for using Cloud Print Self-Service Kiosk!</p>
                            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>This is a system generated digital receipt and does not require a physical signature.</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                #printable-invoice {
                    display: none;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff;
                        color: #000000;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .invoice-box {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        padding: 30px;
                        border-radius: 12px;
                        position: relative;
                        overflow: hidden;
                    }
                    .invoice-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 60px;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.04);
                        pointer-events: none;
                        white-space: nowrap;
                        z-index: 0;
                    }
                    .invoice-stamp {
                        position: absolute;
                        bottom: 40px;
                        right: 40px;
                        border: 4px solid #10b981;
                        color: #10b981;
                        font-size: 28px;
                        font-weight: 900;
                        font-family: 'Impact', sans-serif;
                        letter-spacing: 4px;
                        padding: 8px 16px;
                        transform: rotate(15deg);
                        border-radius: 8px;
                        opacity: 0.8;
                        pointer-events: none;
                        z-index: 10;
                    }
                    .invoice-header, .invoice-section, .invoice-divider, .invoice-total-row {
                        position: relative;
                        z-index: 1;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .invoice-logo {
                        font-size: 20px;
                        font-weight: 900;
                        color: #0f172a;
                    }
                    .invoice-title {
                        font-size: 14px;
                        font-weight: 800;
                        letter-spacing: 0.1em;
                        color: #64748b;
                    }
                    .invoice-divider {
                        border-top: 2px dashed #cbd5e1;
                        margin: 20px 0;
                    }
                    .invoice-section {
                        margin-bottom: 15px;
                    }
                    .invoice-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 12px;
                        color: #334155;
                    }
                    .invoice-label {
                        font-weight: 600;
                        color: #64748b;
                    }
                    .invoice-val {
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .invoice-subtitle {
                        font-size: 12px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #0f172a;
                        margin-bottom: 10px;
                    }
                    .invoice-total {
                        font-size: 16px;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .invoice-total .invoice-label {
                        color: #0f172a;
                        font-weight: 900;
                    }
                    .invoice-total .invoice-val {
                        color: #10b981;
                        font-weight: 900;
                    }
                    .invoice-footer {
                        text-align: center;
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 30px;
                        font-weight: 500;
                    }
                }
            `}</style>
        </main>
    );
}

export default Dashboard;
