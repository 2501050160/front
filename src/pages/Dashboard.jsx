import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import api, { RAZORPAY_KEY, loadRazorpayScript } from "../services/api";
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
import machineVideo from "../assets/machine.mp4";
import cloudprintLogo from "../assets/cloudprint_logo.png";
import cloudprintWatermark from "../assets/cloudprint_watermark.png";
import {
    FileText,
    Gift,
    Headphones,
    MapPin,
    Menu,
    PanelLeftClose,
    Printer,
    UploadCloud,
    Wallet,
    Check,
    Plus,
    Minus,
    Layers,
    Palette,
    FileCheck,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Sliders,
    Zap,
    RotateCw,
    Maximize2,
    Ticket,
    Copy,
    ExternalLink,
    QrCode,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Tv,
    KeyRound
} from "lucide-react";

function Dashboard() {
    const [searchParams] = useSearchParams();
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const referralCode = localStorage.getItem("referralCode") || "";

    const [printType, setPrintType] = useState("BW");
    const [allowBw, setAllowBw] = useState(true);
    const [allowColor, setAllowColor] = useState(true);
    const [bwDuplexPrice, setBwDuplexPrice] = useState(1.5);
    const [colorDuplexPrice, setColorDuplexPrice] = useState(4.0);
    const [isCollegeSuspended, setIsCollegeSuspended] = useState(false);
    const blockLocation = localStorage.getItem("selectedBlock") || "C Block";
    const [completedOrder, setCompletedOrder] = useState(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    
    // Display panel OTP release state
    const [releaseOtpInput, setReleaseOtpInput] = useState("");
    const [releaseOtpError, setReleaseOtpError] = useState("");
    const [isReleasingPrint, setIsReleasingPrint] = useState(false);
    const [printReleasedSuccess, setPrintReleasedSuccess] = useState(false);

    // Direct Print Release Modal State
    const [showDirectReleaseModal, setShowDirectReleaseModal] = useState(false);
    const [pendingOrdersForRelease, setPendingOrdersForRelease] = useState([]);
    const [releaseModalOrderId, setReleaseModalOrderId] = useState("");
    const [releaseModalOtp, setReleaseModalOtp] = useState("");
    const [releaseModalError, setReleaseModalError] = useState("");
    const [isReleasingFromModal, setIsReleasingFromModal] = useState(false);
    
    // Multiple files support
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [totalPages, setTotalPages] = useState(0);
    const [orderId, setOrderId] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const [copies, setCopies] = useState(1);
    const [orientation, setOrientation] = useState("portrait"); // "portrait" | "landscape"
    const [pageOption, setPageOption] = useState("ALL");
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");
    const [nupLayout, setNupLayout] = useState("1-up");
    const [doubleSided, setDoubleSided] = useState(false);
    const [haveCoupon, setHaveCoupon] = useState(false);
    const printSettingsRef = useRef(null);
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
        if (userId && activeTab === "orders") {
            fetchOrders();
            const interval = setInterval(fetchOrders, 8000);
            return () => clearInterval(interval);
        }
    }, [userId, activeTab]);

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

    const verifyKioskStatus = async (showErrorMessage = true) => {
        if (!blockLocation) return false;
        try {
            const response = await api.get("/system/status", {
                params: { blockLocation }
            });
            const status = response.data || {};
            setSystemStatus(status);
            if (status.paperCount !== undefined) {
                setPaperCount(status.paperCount);
            }

            const isAvailable = Boolean(
                status.databaseConnected &&
                (status.available !== undefined ? status.available : (status.printerConfigured && status.active && !status.paused && !status.maintenance))
            );

            if (!isAvailable && showErrorMessage) {
                let errorMsg = `Print Kiosk at ${blockLocation} is currently unavailable for printing.`;
                if (!status.databaseConnected) {
                    errorMsg = "Central database server is disconnected. Please try again in a few moments.";
                } else if (status.maintenance) {
                    errorMsg = `Print Kiosk at ${blockLocation} is currently undergoing maintenance. Please choose another location.`;
                } else if (!status.active || status.paused) {
                    errorMsg = `Print Kiosk at ${blockLocation} is currently offline or paused by administrator.`;
                } else if (!status.printerConfigured) {
                    errorMsg = `No active printer configured for ${blockLocation}. Please select an active campus block.`;
                }
                showAlert("Print Kiosk Unavailable", errorMsg, "error");
            }
            return isAvailable;
        } catch (err) {
            console.error("Failed to verify print kiosk status:", err);
            setSystemStatus({
                databaseConnected: false,
                agentOnline: false,
                printerConfigured: false,
                available: false
            });
            if (showErrorMessage) {
                showAlert("Connection Error", "Cannot reach the print kiosk server. Please check your network and try again.", "error");
            }
            return false;
        }
    };

    // 1. Initial single load on location change (Zero continuous polling)
    useEffect(() => {
        if (blockLocation) {
            verifyKioskStatus(false);
            fetchPaperCount();
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

                // Check College Suspension
                const suspendedStr = publicSettings.suspendedColleges || "";
                const suspendedList = suspendedStr.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
                const userCol = (localStorage.getItem("userCollege") || "KLU").toUpperCase();
                if (suspendedList.includes(userCol)) {
                    setIsCollegeSuspended(true);
                }

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

        // On-demand validation of kiosk server availability before upload
        const isKioskReady = await verifyKioskStatus(true);
        if (!isKioskReady) {
            showAlert("Kiosk Offline", `The print kiosk at ${blockLocation} is currently unavailable. Upload is blocked until the kiosk is available.`, "error");
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

            // Auto-scroll the page down to print settings & summary silently without showing a popup
            setTimeout(() => {
                printSettingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
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

            if (response.data && Array.isArray(response.data)) {
                response.data.forEach((p) => {
                    if (p.printType === "BW") {
                        setBwPrice(p.pricePerPage);
                    }
                    if (p.printType === "COLOR") {
                        setColorPrice(p.pricePerPage);
                    }
                    if (p.printType === "DUPLEX" || p.printType === "DOUBLE" || p.printType === "BW_DUPLEX") {
                        setBwDuplexPrice(p.pricePerPage);
                    }
                });
            }

            // Fetch block printer capabilities
            const printerRes = await api.get("/printer/allByBlock", {
                params: { blockLocation }
            });
            const blockPrinters = printerRes.data || [];

            let hasBw = false;
            let hasColor = false;

            blockPrinters.forEach((p) => {
                if (p.active) {
                    if (p.colourSupported) {
                        hasColor = true;
                        if (!p.bwDisabledForColor) {
                            hasBw = true;
                        }
                    } else {
                        hasBw = true;
                    }
                }
            });

            if (blockPrinters.length === 0 || (!hasBw && !hasColor)) {
                hasBw = true;
                hasColor = true;
            }

            setAllowBw(hasBw);
            setAllowColor(hasColor);

            if (!hasBw && hasColor) {
                setPrintType("COLOR");
            } else if (hasBw && !hasColor) {
                setPrintType("BW");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const proceedToOrder = async () => {
        if (!uploaded) {
            showAlert("Files Not Uploaded", "Please upload selected files first.", "warning");
            return;
        }

        const isKioskReady = await verifyKioskStatus(true);
        if (!isKioskReady) return;

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

        const isKioskReady = await verifyKioskStatus(true);
        if (!isKioskReady) return;

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
            let walletRes;
            if (couponApplied && couponDetails) {
                const discount = (couponDetails.discountPercentage && couponDetails.discountPercentage > 0)
                    ? (finalOrder.price * couponDetails.discountPercentage) / 100
                    : (couponDetails.discountAmount ? Math.min(finalOrder.price, couponDetails.discountAmount) : 0);
                const discountedPrice = Math.max(0, finalOrder.price - discount);
                
                await api.post("/pdf/updatePrice", null, {
                    params: {
                        orderId: finalOrder.orderId,
                        price: discountedPrice,
                        originalPrice: finalOrder.price,
                        discountAmount: finalOrder.discountAmount + discount
                    }
                });

                const [couponResult, payResult] = await Promise.all([
                    api.post("/coupon/use", null, {
                        params: { couponCode }
                    }).catch(err => console.error("Failed to mark coupon as used:", err)),
                    api.post("/pdf/payWithWallet", null, {
                        params: {
                            orderId: finalOrder.orderId
                        }
                    })
                ]);
                walletRes = payResult;
            } else {
                // 2. Pay using wallet balance
                walletRes = await api.post("/pdf/payWithWallet", null, {
                    params: {
                        orderId: finalOrder.orderId
                    }
                });
            }

            if (walletRes?.data?.newWalletBalance != null) {
                setWalletBalance(walletRes.data.newWalletBalance);
            } else {
                getWalletBalance(userId).then(setWalletBalance).catch(() => {});
            }
            localStorage.removeItem("order");
            const paidData = walletRes?.data?.order || finalOrder;
            setCompletedOrder(paidData);
            showAlert("Print Job Created!", `Your 4-digit OTP is ${paidData.otpCode || "ready"}. Collect at ${blockLocation}.`, "success");
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

        const isKioskReady = await verifyKioskStatus(true);
        if (!isKioskReady) return;

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
                const discount = (couponDetails.discountPercentage && couponDetails.discountPercentage > 0)
                    ? (finalOrder.price * couponDetails.discountPercentage) / 100
                    : (couponDetails.discountAmount ? Math.min(finalOrder.price, couponDetails.discountAmount) : 0);
                paymentAmount = Math.max(0, finalOrder.price - discount);

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
                key: orderData.key_id || RAZORPAY_KEY,
                amount: orderData.amount,
                currency: "INR",
                name: "Cloud Print",
                description: `Print Order Payment - ${finalOrder.orderId}`,
                order_id: orderData.id,
                prefill: {
                    name: userName || "Student",
                    email: userEmail || "student@cloudprint.website",
                    contact: localStorage.getItem("userPhone") || "9999999999"
                },
                theme: {
                    color: "#0ea5e9"
                },
                handler: async function (response) {
                    try {
                        if (couponApplied && couponCode) {
                            await api.post("/coupon/use", null, {
                                params: { couponCode }
                            }).catch(err => console.error("Failed to mark coupon as used:", err));
                        }

                        const paidRes = await api.post("/pdf/paymentSuccess", null, {
                            params: {
                                orderId: finalOrder.orderId,
                                paymentId: response.razorpay_payment_id
                            }
                        });

                        localStorage.removeItem("order");
                        const paidData = paidRes.data || finalOrder;
                        setCompletedOrder(paidData);
                        showAlert("Payment Successful!", `Your 4-digit OTP is ${paidData.otpCode || "ready"}. Collect at ${blockLocation}.`, "success");
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

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded || !window.Razorpay) {
                showAlert("Payment Gateway Error", "Unable to load Razorpay payment SDK. Please check your internet connection.", "error");
                setPaymentMethod("");
                return;
            }

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

    const handleResetPrint = () => {
        setCompletedOrder(null);
        setUploaded(false);
        setSelectedFiles([]);
        setOrderId("");
        setTotalPages(0);
        setCopies(1);
        setPageOption("ALL");
        setStartPage("");
        setEndPage("");
        setCouponApplied(false);
        setCouponCode("");
        setCouponDetails(null);
        setReferralApplied(false);
        setEnteredReferralCode("");
        setShowAdvancedSettings(false);
        setReleaseOtpInput("");
        setReleaseOtpError("");
        setPrintReleasedSuccess(false);
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance).catch(() => {});
        }
    };

    const handleReleasePrint = async () => {
        if (!completedOrder || releaseOtpInput.length !== 4) {
            setReleaseOtpError("Please enter the 4-digit OTP shown on the TV display screen.");
            return;
        }
        setIsReleasingPrint(true);
        setReleaseOtpError("");
        try {
            await api.post("/pdf/releasePrint", null, {
                params: {
                    orderId: completedOrder.orderId,
                    otp: releaseOtpInput.trim()
                }
            });
            setPrintReleasedSuccess(true);
            showAlert("Printing Started! 🚀", `Your document is printing at ${completedOrder.blockLocation || blockLocation}.`, "success");
        } catch (err) {
            setReleaseOtpError(err.response?.data?.message || "Invalid OTP code. Please check the TV display panel screen.");
        } finally {
            setIsReleasingPrint(false);
        }
    };

    const handleKeypadPress = (val) => {
        setReleaseOtpError("");
        if (releaseOtpInput.length < 4) {
            setReleaseOtpInput(prev => prev + val);
        }
    };

    const handleKeypadBackspace = () => {
        setReleaseOtpError("");
        setReleaseOtpInput(prev => prev.slice(0, -1));
    };

    const handleKeypadClear = () => {
        setReleaseOtpError("");
        setReleaseOtpInput("");
    };

    const openDirectReleaseModal = async () => {
        setShowDirectReleaseModal(true);
        setReleaseModalError("");
        setReleaseModalOtp("");
        try {
            const res = await api.get("/pdf/userOrders");
            const pending = (res.data || []).filter(o => 
                o.status === "PENDING_SCAN" || o.status === "QUEUE" || o.status === "PAID" || o.status === "CREATED"
            );
            setPendingOrdersForRelease(pending);
            if (pending.length > 0) {
                setReleaseModalOrderId(pending[0].orderId);
            }
        } catch (err) {
            console.warn("Could not load pending orders for direct release", err);
        }
    };

    useEffect(() => {
        const handler = () => openDirectReleaseModal();
        window.addEventListener("openDirectReleaseModal", handler);
        if (searchParams.get("action") === "release") {
            openDirectReleaseModal();
        }
        return () => window.removeEventListener("openDirectReleaseModal", handler);
    }, [searchParams]);

    const handleDirectModalRelease = async (e) => {
        e?.preventDefault();
        if (!releaseModalOrderId) {
            setReleaseModalError("Please select a pending order to release.");
            return;
        }
        if (releaseModalOtp.trim().length !== 4) {
            setReleaseModalError("Please enter the 4-digit OTP shown on the TV display panel.");
            return;
        }
        setIsReleasingFromModal(true);
        setReleaseModalError("");
        try {
            await api.post("/pdf/releasePrint", null, {
                params: {
                    orderId: releaseModalOrderId,
                    otp: releaseModalOtp.trim()
                }
            });
            setShowDirectReleaseModal(false);
            showAlert("Print Released! 🚀", `Your document is now printing at the kiosk.`, "success");
            fetchUserOrders();
        } catch (err) {
            setReleaseModalError(err.response?.data?.message || "Invalid OTP code. Please check the TV display panel.");
        } finally {
            setIsReleasingFromModal(false);
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

    const rate = printType === "COLOR" 
        ? Number(colorPrice) 
        : (doubleSided ? Number(bwDuplexPrice) : Number(bwPrice));
    const selectedPageCount = pageOption === "ALL" ? totalPages : (startPage && endPage ? Math.max(0, Number(endPage) - Number(startPage) + 1) : 0);
    const divisor = nupLayout === "2-up" ? 2 : 
                    nupLayout === "4-up" ? 4 : 
                    nupLayout === "6-up" ? 6 : 
                    nupLayout === "8-up" ? 8 : 
                    nupLayout === "9-up" ? 9 : 1;
    const actualSheets = Math.ceil(selectedPageCount / divisor);
    const sheetsToPrint = doubleSided ? Math.ceil(actualSheets / 2.0) : actualSheets;
    const estimatedTotalPages = sheetsToPrint * Number(copies || 1);
    const isLowPaper = uploaded && estimatedTotalPages > paperCount;
    const basePrice = sheetsToPrint * Number(copies || 1) * rate;
    const estimatedDiscount = couponApplied && couponDetails
        ? ((couponDetails.discountPercentage && couponDetails.discountPercentage > 0)
            ? (basePrice * couponDetails.discountPercentage) / 100
            : (couponDetails.discountAmount ? Math.min(basePrice, couponDetails.discountAmount) : 0))
        : 0;
    const estimatedTotal = Math.max(0, basePrice - estimatedDiscount);
    const isPrintingDisabled = !systemStatus.databaseConnected || (systemStatus.available === false) || !systemStatus.printerConfigured || isLowPaper || systemStatus.maintenance || systemStatus.paused || (systemStatus.active === false);

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
            <div className="flex flex-row min-h-screen w-full relative">
                {/* Mobile Backdrop Overlay when sidebar is expanded */}
                {isSidebarExpanded && (
                    <div 
                        onClick={() => setIsSidebarExpanded(false)} 
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300" 
                    />
                )}

                {/* Left Sidebar / Mobile Icons Rail */}
                <div className={`shrink-0 flex transition-all duration-300 user-dash-sidebar border-r border-slate-200/80 p-3 sm:p-4 z-30 ${
                    isSidebarExpanded 
                        ? "fixed inset-y-0 left-0 w-64 h-screen z-50 md:relative md:w-60 md:sticky md:top-0 flex-col justify-between shadow-2xl md:shadow-none" 
                        : "w-14 sm:w-16 md:w-20 sticky top-0 h-screen flex-col items-center justify-between"
                }`}>
                    <div>
                        {/* Hamburger / Toggle Header */}
                        <div className={`flex items-center ${isSidebarExpanded ? "justify-between w-full mb-6" : "justify-center mb-6"}`}>
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
                        <div className="flex flex-col gap-2 w-full">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            if (window.innerWidth < 768) {
                                                setIsSidebarExpanded(false);
                                            }
                                        }}
                                        className={`font-black text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                            isSidebarExpanded 
                                                ? "w-full text-left justify-start px-4 py-3 gap-3" 
                                                : "w-10 h-10 sm:w-12 sm:h-12 justify-center px-0 py-0"
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
                        badgeAction={{ label: "Change Location", path: "/blocks" }}
                        actions={[]}
                    />

                    <section className="dashboard-stage-card relative rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="relative z-10 max-w-2xl text-left">
                            <p className="text-2xl md:text-3xl font-black uppercase tracking-wider text-cyan-200">Cloud Print</p>
                            
                            {/* Visual steps flow */}
                            <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center text-xs font-black">1</span>
                                    <span className="text-xs font-black text-white">Upload Files</span>
                                </div>
                                <div className="hidden sm:block text-cyan-500/50">➔</div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center text-xs font-black">2</span>
                                    <span className="text-xs font-black text-white">Pay (Wallet/UPI)</span>
                                </div>
                                <div className="hidden sm:block text-cyan-500/50">➔</div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center text-xs font-black">3</span>
                                    <span className="text-xs font-black text-white">Enter OTP at Kiosk</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Looping Machine Video */}
                        <div className="relative h-64 w-full md:w-[460px] shrink-0 rounded-[20px] overflow-hidden border border-white/10 shadow-2xl bg-slate-900/50 p-1 flex items-center justify-center">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover rounded-lg shadow-sm"
                            >
                                <source src={machineVideo} type="video/mp4" />
                            </video>
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

                    {/* Mobile View: Side-by-side columns layout */}
                    <div className="grid grid-cols-2 gap-3.5 md:hidden mb-0">
                        <div className="user-dash-card user-dash-stat p-4.5 rounded-2xl flex flex-col justify-between overflow-hidden relative min-h-[100px]">
                            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-500 via-emerald-500 to-amber-400" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-wider text-cyan-200">Welcome Back</span>
                                <h3 className="text-sm font-black text-white mt-1 leading-tight truncate">Hello, {userName || "Sai"}</h3>
                                <p className="text-[10px] font-semibold text-cyan-50/70 mt-2">
                                    Counter: <strong className="text-white">{blockLocation}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="user-dash-card p-4.5 rounded-2xl bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-900 text-white shadow-2xl flex items-center gap-3 border border-white/10 min-h-[100px]">
                            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                <Wallet className="w-4 h-4 text-cyan-300" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-cyan-100">Wallet Balance</span>
                                <h3 className="text-lg font-black mt-0.5 truncate">₹{walletBalance}</h3>
                            </div>
                        </div>
                    </div>

                {/* TAB CONTENT: PRINT DASHBOARD */}
                {activeTab === "print" && (
                    completedOrder ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="user-dash-card p-6 md:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 text-white shadow-2xl relative overflow-hidden"
                        >
                            {/* Top Status Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                            {printReleasedSuccess ? "Printing Started 🚀" : "Order Paid & In Queue"}
                                        </span>
                                        <h3 className="text-xl font-black text-white">
                                            {printReleasedSuccess ? "Collecting Prints from Tray" : "Enter Display Panel OTP"}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">{completedOrder.blockLocation || blockLocation}</span>
                                </div>
                            </div>

                            {/* Main OTP Verification Section */}
                            {!printReleasedSuccess ? (
                                <div className="my-6 p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-center relative overflow-hidden shadow-inner">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-black mb-3">
                                        <Tv className="w-4 h-4 text-cyan-400" />
                                        Step: Look at TV Display Panel
                                    </div>
                                    <h4 className="text-base font-black text-white">
                                        Enter the 4-digit OTP shown on the TV Screen
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                                        Find your order on the display panel at <strong className="text-cyan-300">{completedOrder.blockLocation || blockLocation}</strong> and enter the 4-digit release code:
                                    </p>

                                    {/* 4-Box Visual Display */}
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center rounded-xl bg-slate-900 border-2 text-3xl sm:text-4xl font-black transition-all ${
                                                    releaseOtpInput[i]
                                                        ? "border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20"
                                                        : "border-slate-700 text-slate-600"
                                                }`}
                                            >
                                                {releaseOtpInput[i] || "•"}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Error Banner */}
                                    {releaseOtpError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 py-2 px-4 rounded-lg inline-block"
                                        >
                                            ⚠️ {releaseOtpError}
                                        </motion.div>
                                    )}

                                    {/* Mobile Keypad */}
                                    <div className="mt-5 max-w-xs mx-auto grid grid-cols-3 gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => handleKeypadPress(String(num))}
                                                className="h-12 rounded-xl bg-slate-900/90 border border-white/10 text-lg font-black text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleKeypadClear}
                                            className="h-12 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs font-black text-rose-300 hover:bg-rose-900/40 active:scale-95 transition-all cursor-pointer uppercase"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleKeypadPress("0")}
                                            className="h-12 rounded-xl bg-slate-900/90 border border-white/10 text-lg font-black text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                                        >
                                            0
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleKeypadBackspace}
                                            className="h-12 rounded-xl bg-slate-900/90 border border-white/10 text-sm font-black text-slate-300 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                                        >
                                            ⌫
                                        </button>
                                    </div>

                                    {/* Verify Button */}
                                    <div className="mt-5 max-w-xs mx-auto">
                                        <button
                                            type="button"
                                            onClick={handleReleasePrint}
                                            disabled={isReleasingPrint || releaseOtpInput.length !== 4}
                                            className="btn success w-full flex items-center justify-center gap-2 py-3.5 !bg-gradient-to-r !from-emerald-500 !to-teal-600 text-white font-black text-base shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isReleasingPrint ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Verifying with Kiosk...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5 fill-current" />
                                                    Verify OTP & Release Print
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="my-6 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center relative overflow-hidden">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                                        <Check className="w-8 h-8 stroke-[3]" />
                                    </div>
                                    <h4 className="mt-4 text-xl font-black text-white">
                                        Document Sent to Printer!
                                    </h4>
                                    <p className="mt-1 text-xs text-emerald-200">
                                        Your print job has been released and is printing at the <strong className="text-white">{completedOrder.blockLocation || blockLocation}</strong> machine tray.
                                    </p>
                                </div>
                            )}

                            {/* Order Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order ID</span>
                                    <p className="mt-0.5 text-xs font-black text-white truncate">{completedOrder.orderId || orderId}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pages</span>
                                    <p className="mt-0.5 text-xs font-black text-white">{completedOrder.totalPages || totalPages} Pages</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Print Mode</span>
                                    <p className="mt-0.5 text-xs font-black text-white">{completedOrder.printType === "COLOR" ? "Color" : "Black & White"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Paid Amount</span>
                                    <p className="mt-0.5 text-xs font-black text-emerald-400">₹{(completedOrder.price || estimatedTotal).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={handleResetPrint}
                                    className="btn primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-sm font-black cursor-pointer"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Print Another Document
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("orders")}
                                    className="btn secondary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold cursor-pointer"
                                >
                                    <FileText className="w-4 h-4" />
                                    View Order Status & Invoices
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <motion.section
                            className="user-dash-card p-6 rounded-3xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="grid md:grid-cols-2 gap-6">
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
                                    <>
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

                                        {/* 1-Tap Quick Print Box */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-4 sm:p-5 shadow-xl text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                    Fast 1-Tap Print
                                                </span>
                                                <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                                                    ₹{estimatedTotal.toFixed(2)} Total
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-slate-300">
                                                Preset: <strong className="text-white">B&W • 1 Copy • All Pages • {doubleSided ? "Duplex" : "Single Sided"}</strong>
                                            </p>

                                            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                {/* 1-Tap Wallet Print Button */}
                                                {walletBalance >= estimatedTotal && (
                                                    <button
                                                        onClick={payWithWalletDirect}
                                                        disabled={isPrintingDisabled || !!paymentMethod}
                                                        className="btn primary flex-1 flex items-center justify-center gap-2 py-3.5 !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-400 hover:!to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
                                                    >
                                                        {paymentMethod === "wallet" ? (
                                                            <>
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                                Creating Print Job...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap className="w-4 h-4 fill-current" />
                                                                1-Tap Wallet (₹{estimatedTotal.toFixed(2)})
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {/* 1-Tap Instant UPI / Razorpay Print Button */}
                                                <button
                                                    onClick={payNowDirect}
                                                    disabled={isPrintingDisabled || !!paymentMethod}
                                                    className="btn success flex-1 flex items-center justify-center gap-2 py-3.5 !bg-gradient-to-r !from-cyan-500 !to-blue-600 hover:!from-cyan-400 hover:!to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20 cursor-pointer"
                                                >
                                                    {paymentMethod === "razorpay" ? (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                            Opening Payment...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-4 h-4" />
                                                            {walletBalance >= estimatedTotal ? `Pay via UPI (₹${estimatedTotal.toFixed(2)})` : `1-Tap UPI Print (₹${estimatedTotal.toFixed(2)})`}
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAdvancedSettings(!showAdvancedSettings);
                                                        if (!showAdvancedSettings && printSettingsRef.current) {
                                                            setTimeout(() => {
                                                                printSettingsRef.current.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }
                                                    }}
                                                    className="btn secondary flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-bold text-slate-300 border-white/20 hover:text-white cursor-pointer shrink-0"
                                                >
                                                    <Sliders className="w-4 h-4 text-cyan-400" />
                                                    {showAdvancedSettings ? "Hide Settings" : "Customize Settings"}
                                                    {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
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

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Sleek Black & White Single Sided Box */}
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 flex flex-col justify-between relative overflow-hidden min-h-[85px]">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">B&W (Single Side)</span>
                                    <p className="mt-1 text-xl font-black text-white">Rs. {bwPrice} / pg</p>
                                </div>

                                {/* Sleek Black & White Duplex Box */}
                                <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 flex flex-col justify-between relative overflow-hidden min-h-[85px]">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">B&W (Duplex / Both Sides)</span>
                                    <p className="mt-1 text-xl font-black text-blue-100">Rs. {bwDuplexPrice} / pg</p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl bg-slate-900/90 border border-white/10 p-5 text-white shadow-xl">
                                <p className="text-sm font-bold text-slate-300">Estimated Total</p>
                                <motion.p
                                    key={estimatedTotal}
                                    className="mt-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400"
                                    initial={{ scale: 0.96, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    Rs. {estimatedTotal || 0}
                                </motion.p>
                            </div>
                        </motion.aside>

                        <AnimatePresence>
                            {uploaded && showAdvancedSettings && (
                                <motion.section
                                    ref={printSettingsRef}
                                    className="user-dash-card mt-6 p-6 lg:col-span-2 rounded-3xl text-left shadow-2xl border border-white/10 relative overflow-hidden"
                                    initial={{ opacity: 0, height: 0, y: 18 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 18 }}
                                    transition={{ duration: 0.35 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                    Step 2 of 2
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold">• Instant Print Spooling</span>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                                                Print &amp; Layout Settings
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                                <span>Document:</span>
                                                <span className="text-cyan-300 font-black px-2.5 py-1 bg-cyan-950/60 rounded-lg border border-cyan-800/40">
                                                    {totalPages} {totalPages === 1 ? "Page" : "Pages"}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedSettings(false)}
                                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span>Hide Settings</span>
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Low paper notification banner on dashboard */}
                                    {isLowPaper && (
                                        <div className="mb-6 rounded-2xl bg-rose-500/20 border border-rose-500/40 p-4 text-rose-200 flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                            <p className="text-xs md:text-sm font-bold">
                                                ⚠️ Print cannot be initiated due to paper shortage. Selected job requires {estimatedTotalPages} sheets, but only {paperCount} sheets remain.
                                            </p>
                                        </div>
                                    )}

                                    {/* Interactive Print Options Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        
                                        {/* 1. Page Orientation: Portrait vs Horizontal / Landscape */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <RotateCw className="w-4 h-4 text-cyan-400" />
                                                    Page Orientation
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                                    orientation === "portrait"
                                                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                                                        : "bg-purple-500/20 text-purple-300 border-purple-400/40"
                                                }`}>
                                                    {orientation === "portrait" ? "Vertical (A4)" : "Horizontal (Wide)"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Portrait Card */}
                                                <button
                                                    type="button"
                                                    onClick={() => setOrientation("portrait")}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                                        orientation === "portrait"
                                                            ? "bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 border-cyan-300 text-white shadow-xl shadow-cyan-500/30 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800/80 hover:text-white"
                                                    }`}
                                                >
                                                    {/* Portrait Sheet Icon Visual */}
                                                    <div className={`w-10 h-14 rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all ${
                                                        orientation === "portrait"
                                                            ? "border-white bg-white/20 shadow-md"
                                                            : "border-slate-500 bg-slate-800"
                                                    }`}>
                                                        <div className="w-full h-1 bg-current opacity-80 rounded-full" />
                                                        <div className="w-3/4 h-1 bg-current opacity-60 rounded-full" />
                                                        <div className="w-full h-1 bg-current opacity-60 rounded-full" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black tracking-wide">Portrait</p>
                                                        <p className={`text-[10px] font-bold mt-0.5 ${orientation === "portrait" ? "text-cyan-100" : "text-slate-400"}`}>Standard Vertical</p>
                                                    </div>
                                                </button>

                                                {/* Horizontal / Landscape Card */}
                                                <button
                                                    type="button"
                                                    onClick={() => setOrientation("landscape")}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-200 text-center cursor-pointer relative overflow-hidden ${
                                                        orientation === "landscape"
                                                            ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 border-purple-300 text-white shadow-xl shadow-purple-500/30 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800/80 hover:text-white"
                                                    }`}
                                                >
                                                    {/* Landscape Sheet Icon Visual */}
                                                    <div className={`w-14 h-10 rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all ${
                                                        orientation === "landscape"
                                                            ? "border-white bg-white/20 shadow-md"
                                                            : "border-slate-500 bg-slate-800"
                                                    }`}>
                                                        <div className="w-full h-1 bg-current opacity-80 rounded-full" />
                                                        <div className="w-2/3 h-1 bg-current opacity-60 rounded-full" />
                                                        <div className="w-full h-1 bg-current opacity-60 rounded-full" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black tracking-wide">Horizontal</p>
                                                        <p className={`text-[10px] font-bold mt-0.5 ${orientation === "landscape" ? "text-purple-100" : "text-slate-400"}`}>Landscape (Wide)</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Number of Copies: Stepper + Quick-Pick Pills */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                                    Number of Copies
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                                    {copies || 1} {Number(copies || 1) === 1 ? "Copy" : "Copies"}
                                                </span>
                                            </div>

                                            {/* Stepper Control */}
                                            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setCopies(Math.max(1, Number(copies || 1) - 1))}
                                                    disabled={Number(copies || 1) <= 1}
                                                    className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black transition-all cursor-pointer border border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
                                                >
                                                    <Minus className="w-5 h-5 text-slate-200" />
                                                </button>
                                                
                                                <div className="text-center px-4">
                                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 tracking-tight">
                                                        {copies || 1}
                                                    </span>
                                                    <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest mt-0.5">
                                                        {Number(copies || 1) === 1 ? "Copy Required" : "Copies Required"}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setCopies(Number(copies || 1) + 1)}
                                                    className="w-11 h-11 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center font-black transition-all cursor-pointer shadow-lg shadow-orange-500/30 border border-amber-300"
                                                >
                                                    <Plus className="w-5 h-5 text-slate-950 font-black" />
                                                </button>
                                            </div>

                                            {/* Quick-Pick Quantity Pills */}
                                            <div className="grid grid-cols-5 gap-2 pt-1">
                                                {[1, 2, 3, 5, 10].map((qty) => (
                                                    <button
                                                        key={qty}
                                                        type="button"
                                                        onClick={() => setCopies(qty)}
                                                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                                            Number(copies) === qty
                                                                ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-orange-500/30 scale-105 font-black"
                                                                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-amber-400/50 hover:bg-slate-800 hover:text-white"
                                                        }`}
                                                    >
                                                        {qty}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. Print Type: Black & White vs Vibrant Color */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <Palette className="w-4 h-4 text-pink-400" />
                                                    Print Ink Mode
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                                    printType === "COLOR"
                                                        ? "bg-pink-500/20 text-pink-300 border-pink-400/40"
                                                        : "bg-slate-800 text-slate-300 border-slate-600"
                                                }`}>
                                                    {printType === "COLOR" ? "Full Color Ink" : "Monochrome B&W"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Black & White Card */}
                                                <button
                                                    type="button"
                                                    disabled={!allowBw}
                                                    onClick={() => setPrintType("BW")}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all duration-200 text-center cursor-pointer ${
                                                        printType === "BW"
                                                            ? "bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 border-slate-300 text-white shadow-xl shadow-slate-900/50 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800/80 hover:text-slate-200"
                                                    } ${!allowBw ? "opacity-40 cursor-not-allowed" : ""}`}
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200 shadow-md">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">Black & White</p>
                                                        <p className="text-[10px] text-cyan-300 font-extrabold mt-0.5">₹{bwPrice} / page</p>
                                                    </div>
                                                </button>

                                                {/* Vibrant Color Card */}
                                                <button
                                                    type="button"
                                                    disabled={!allowColor}
                                                    onClick={() => setPrintType("COLOR")}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all duration-200 text-center cursor-pointer ${
                                                        printType === "COLOR"
                                                            ? "bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 border-pink-300 text-white shadow-xl shadow-pink-500/40 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-pink-500/50 hover:bg-slate-800/80 hover:text-slate-200"
                                                    } ${!allowColor ? "opacity-40 cursor-not-allowed" : ""}`}
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
                                                        <Palette className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">Vibrant Color</p>
                                                        <p className="text-[10px] text-pink-200 font-extrabold mt-0.5">₹{colorPrice} / page</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 4. Print Sides: Single Sided vs Double Sided (Duplex) */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-emerald-400" />
                                                    Print Sides (Duplex)
                                                </span>
                                                {doubleSided && printType !== "COLOR" && (
                                                    <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40 shadow-sm animate-pulse">
                                                        🌱 Saves 50% Paper
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Single Sided Card */}
                                                <button
                                                    type="button"
                                                    onClick={() => setDoubleSided(false)}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all duration-200 text-center cursor-pointer ${
                                                        !doubleSided || printType === "COLOR"
                                                            ? "bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-700 border-cyan-300 text-white shadow-xl shadow-cyan-500/30 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-cyan-500/50 hover:bg-slate-800/80 hover:text-slate-200"
                                                    }`}
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-600 flex items-center justify-center text-slate-200 shadow-md">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">Single Side</p>
                                                        <p className="text-[10px] text-cyan-200 font-extrabold mt-0.5">1 Page / Sheet</p>
                                                    </div>
                                                </button>

                                                {/* Double Sided Card */}
                                                <button
                                                    type="button"
                                                    disabled={printType === "COLOR"}
                                                    onClick={() => setDoubleSided(true)}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all duration-200 text-center cursor-pointer ${
                                                        doubleSided && printType !== "COLOR"
                                                            ? "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 border-emerald-300 text-white shadow-xl shadow-emerald-500/40 scale-[1.02]"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-emerald-500/50 hover:bg-slate-800/80 hover:text-slate-200"
                                                    } ${printType === "COLOR" ? "opacity-40 cursor-not-allowed" : ""}`}
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
                                                        <Layers className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">Double Side</p>
                                                        <p className="text-[10px] text-emerald-200 font-extrabold mt-0.5">₹{bwDuplexPrice} / pg (Duplex)</p>
                                                    </div>
                                                </button>
                                            </div>
                                            {printType === "COLOR" && (
                                                <p className="text-[10px] text-amber-300/90 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-center">
                                                    * Color printing is supported in Single Sided mode only.
                                                </p>
                                            )}
                                        </div>

                                        {/* 5. Page Range Selector */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <FileCheck className="w-4 h-4 text-cyan-400" />
                                                    Page Selection
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                                                    {pageOption === "ALL" ? `All ${totalPages} Pages` : "Custom Range"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPageOption("ALL")}
                                                    className={`py-3 px-3 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-md ${
                                                        pageOption === "ALL"
                                                            ? "bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 border-cyan-300 text-white shadow-cyan-500/30"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-cyan-500/50 hover:text-white"
                                                    }`}
                                                >
                                                    All Pages (1 - {totalPages})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPageOption("CUSTOM")}
                                                    className={`py-3 px-3 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-md ${
                                                        pageOption === "CUSTOM"
                                                            ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 border-purple-300 text-white shadow-purple-500/30"
                                                            : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-purple-500/50 hover:text-white"
                                                    }`}
                                                >
                                                    Custom Range
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {pageOption === "CUSTOM" && (
                                                    <motion.div
                                                        className="grid grid-cols-2 gap-3 pt-2"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">From Page</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={totalPages}
                                                                placeholder="1"
                                                                value={startPage}
                                                                onChange={(e) => setStartPage(e.target.value)}
                                                                className="field mt-1 !bg-slate-900 !border-slate-700 !text-white text-center font-black rounded-xl"
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">To Page</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={totalPages}
                                                                placeholder={totalPages}
                                                                value={endPage}
                                                                onChange={(e) => setEndPage(e.target.value)}
                                                                className="field mt-1 !bg-slate-900 !border-slate-700 !text-white text-center font-black rounded-xl"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* 6. Layout & N-Up (Pages Per Sheet) */}
                                        <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                    <Sliders className="w-4 h-4 text-purple-400" />
                                                    Pages Per Sheet (N-Up)
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                                                    {nupLayout} Layout
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                {[
                                                    { id: "1-up", label: "1-Up", desc: "Standard", gradient: "from-amber-500 to-orange-600 border-amber-300" },
                                                    { id: "2-up", label: "2-Up", desc: "Saver", gradient: "from-sky-500 to-blue-600 border-sky-300" },
                                                    { id: "4-up", label: "4-Up", desc: "Compact", gradient: "from-purple-500 to-indigo-600 border-purple-300" },
                                                    { id: "6-up", label: "6-Up", desc: "Micro", gradient: "from-fuchsia-500 to-pink-600 border-pink-300" },
                                                    { id: "8-up", label: "8-Up", desc: "Mini", gradient: "from-emerald-500 to-teal-600 border-emerald-300" },
                                                    { id: "9-up", label: "9-Up", desc: "Nano", gradient: "from-rose-500 to-red-600 border-rose-300" }
                                                ].map((layout) => (
                                                    <button
                                                        key={layout.id}
                                                        type="button"
                                                        onClick={() => setNupLayout(layout.id)}
                                                        className={`py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border shadow-md ${
                                                            nupLayout === layout.id
                                                                ? `bg-gradient-to-r ${layout.gradient} text-white font-black scale-105`
                                                                : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-white"
                                                        }`}
                                                    >
                                                        <span className="text-xs font-black">{layout.label}</span>
                                                        <span className="text-[9px] opacity-80">{layout.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Coupon, Referral & Payment Action Section at bottom of Print & Layout Settings */}
                                    <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Coupon Section */}
                                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 flex flex-col justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => !couponApplied && setHaveCoupon(!haveCoupon)}
                                                    disabled={couponApplied}
                                                    className={`w-full h-14 rounded-xl flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer ${
                                                        couponApplied 
                                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-400/50' 
                                                        : 'bg-gradient-to-r from-cyan-900/60 via-blue-900/60 to-purple-900/60 border-cyan-500/30'
                                                    }`}
                                                >
                                                    <div className="w-16 bg-white/10 flex items-center justify-center relative border-r border-dashed border-white/20">
                                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-950 rounded-full translate-x-1/2 -translate-y-1/2" />
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-950 rounded-full translate-x-1/2 translate-y-1/2" />
                                                        <Ticket className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="px-3.5 flex flex-col justify-center text-left text-white">
                                                        <span className="text-[8px] font-black tracking-widest uppercase opacity-85">COUPON</span>
                                                        <span className="text-xs font-black whitespace-nowrap mt-0.5">
                                                            {couponApplied ? "COUPON APPLIED!" : "HAVE COUPON?"}
                                                        </span>
                                                    </div>
                                                </button>

                                                {(haveCoupon || couponApplied) && (
                                                    <div className="mt-3 flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Coupon code"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                            className="field text-xs py-2 w-full !bg-slate-900 !border-slate-700 !text-white rounded-xl"
                                                            disabled={couponApplied}
                                                        />
                                                        <button
                                                            onClick={applyCoupon}
                                                            disabled={couponApplied}
                                                            className={couponApplied ? "btn secondary text-xs py-2 px-4 cursor-pointer" : "btn success text-xs py-2 px-4 cursor-pointer"}
                                                        >
                                                            {couponApplied ? "Applied" : "Apply"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Referral Section */}
                                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 flex flex-col justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => !referralApplied && setHaveReferral(!haveReferral)}
                                                    disabled={referralApplied}
                                                    className={`w-full h-14 rounded-xl flex overflow-hidden border transition-all hover:scale-[1.01] relative cursor-pointer ${
                                                        referralApplied 
                                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-400/50' 
                                                        : 'bg-gradient-to-r from-amber-900/60 via-orange-900/60 to-rose-900/60 border-amber-500/30'
                                                    }`}
                                                >
                                                    <div className="w-16 bg-white/10 flex items-center justify-center relative border-r border-dashed border-white/20">
                                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-950 rounded-full translate-x-1/2 -translate-y-1/2" />
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-950 rounded-full translate-x-1/2 translate-y-1/2" />
                                                        <img
                                                            src={referralIcon}
                                                            alt="Referral"
                                                            className="w-8 h-8 object-contain rounded-md"
                                                        />
                                                    </div>
                                                    <div className="px-3.5 flex flex-col justify-center text-left text-white">
                                                        <span className="text-[8px] font-black tracking-widest uppercase opacity-85">REFERRAL</span>
                                                        <span className="text-xs font-black whitespace-nowrap mt-0.5">
                                                            {referralApplied ? "REFERRAL APPLIED!" : "REFERRAL CODE?"}
                                                        </span>
                                                    </div>
                                                </button>

                                                {(haveReferral || referralApplied) && (
                                                    <div className="mt-3 flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Referral code"
                                                            value={enteredReferralCode}
                                                            onChange={(e) => setEnteredReferralCode(e.target.value)}
                                                            className="field text-xs py-2 w-full !bg-slate-900 !border-slate-700 !text-white rounded-xl"
                                                            disabled={referralApplied}
                                                        />
                                                        <button
                                                            onClick={applyReferral}
                                                            disabled={referralApplied}
                                                            className={referralApplied ? "btn secondary text-xs py-2 px-4 cursor-pointer" : "btn success text-xs py-2 px-4 cursor-pointer"}
                                                        >
                                                            {referralApplied ? "Applied" : "Apply"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons: Pay With Wallet or Razorpay */}
                                        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
                                            <button
                                                onClick={payWithWalletDirect}
                                                className="btn secondary w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer"
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
                                                className="btn success w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-cyan-500/20"
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
                                    </div>
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
                    )
                )}

                {/* TAB CONTENT: MY ORDERS */}
                {activeTab === "orders" && (
                    <div className="relative">
                        {loadingOrders && (
                             <div className="absolute inset-0 z-30 min-h-[300px] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/10 flex-1 py-12">
                                <div className="w-24 h-24 mb-4 relative rounded-xl overflow-hidden shadow-md border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                        <source src={ordersLoading} type="video/mp4" />
                                    </video>
                                </div>
                                <h3 className="text-lg font-black text-white mb-1">Loading Order History...</h3>
                                <p className="text-xs font-semibold text-cyan-200/70">Checking physical queue spooler status</p>
                            </div>
                        )}
                        
                        <div className="grid lg:grid-cols-[1.45fr_0.55fr] gap-6 items-start order-tracking-grid" style={loadingOrders ? { filter: 'blur(3px)', opacity: 0.65, pointerEvents: 'none' } : {}}>
                            <style dangerouslySetInnerHTML={{__html: `
                                .order-tracking-grid .data-table th {
                                    background: rgba(255, 255, 255, 0.05);
                                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                                    color: rgba(255, 255, 255, 0.6) !important;
                                }
                                .order-tracking-grid .data-table td {
                                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                                    color: #ffffff !important;
                                }
                                .order-tracking-grid .data-table tbody tr:hover {
                                    background: rgba(255, 255, 255, 0.03) !important;
                                }
                            `}} />

                            {/* Left Side: Order History Table */}
                            <motion.section
                                className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6 overflow-x-auto !mb-0"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="section-header mb-6">
                                    <div>
                                        <p className="eyebrow text-cyan-200">Track Status</p>
                                        <h2 className="text-2xl font-black text-white">Order History</h2>
                                    </div>
                                    <span className="text-xs font-bold text-cyan-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
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
                                                <td className="font-black text-white">{order.orderId}</td>
                                                <td className="text-slate-300">{order.blockLocation || "C Block"}</td>
                                                <td className="text-slate-300">{order.selectedPages}</td>
                                                <td className="text-slate-300">{order.copies}</td>
                                                <td className="font-black text-white">Rs. {order.price}</td>
                                                <td className="flex items-center gap-2">
                                                     <span className={orderStatusClass(order.status)}>
                                                         {order.status === "PENDING_SCAN" ? "Ready for Print (OTP)" :
                                                          order.status === "PRINTING" ? "Printing..." :
                                                          order.status === "COMPLETED" ? "Completed - Collect Print" :
                                                          order.status === "QUEUE" ? "Queued for Printing" :
                                                          order.status === "CANCEL_WINDOW" ? "Queued for Printing" : order.status}
                                                     </span>
                                                     {order.status === "PRINTING" && (
                                                         <div className="flex items-center justify-center gap-1.5 text-emerald-400">
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
                                                    <div className="empty-state text-slate-400">
                                                        <div className="empty-state-icon">📄</div>
                                                        <p>No orders yet</p>
                                                        <button
                                                            onClick={() => setActiveTab("print")}
                                                            className="btn mt-4 cursor-pointer"
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
                                className="rounded-[24px] border border-white/10 bg-slate-950/40 p-6 flex flex-col items-center justify-center text-center !mb-0"
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                            >
                                <p className="eyebrow text-cyan-200">Realtime Queue</p>
                                <h3 className="text-lg font-black text-white mb-4">Print Hub Status</h3>
                                
                                <div className="w-full max-w-[200px] h-[200px] rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-900/50 relative flex items-center justify-center p-1">
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
                                
                                <p className="text-xs font-bold text-cyan-200/70 mt-4 leading-relaxed">
                                    Your orders are automatically sent to the physical print spooler queue. Refresh status occurs automatically.
                                </p>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: COUPONS & REWARDS */}
                {activeTab === "coupons" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Referral Stats Panel - Sleek Dark Theme */}
                        <motion.section
                            className="user-dash-card p-6 flex flex-col justify-between rounded-3xl"
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div>
                                <p className="eyebrow text-cyan-200">Refer & Earn</p>
                                <h2 className="text-2xl font-black text-white mt-1 mb-4">Share the Service</h2>
                                
                                <p className="text-sm font-semibold text-cyan-50/70 mb-6 leading-relaxed">
                                    Invite your friends to try Cloud Print! When they register using your custom link or enter your referral customer ID on their first checkout, you earn <span className="text-emerald-400 font-bold">Rs. 10</span> and they get <span className="text-cyan-400 font-bold">Rs. 5</span> in wallet balance credits.
                                </p>

                                <div className="bg-slate-950/40 border border-white/10 rounded-xl p-4 mb-6">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Referral ID / Code</span>
                                    <div className="flex items-center justify-between mt-2 gap-3">
                                        <code className="text-2xl font-black text-cyan-300 select-all tracking-wider">
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

                            <div className="text-xs font-bold text-cyan-100/70 bg-slate-950/40 border border-white/10 p-3 rounded-lg">
                                ℹ️ Note: Credits are added instantly after the referred customer places their first paid print order.
                            </div>
                        </motion.section>

                        {/* Claim Promo Code Panel - Sleek Dark Theme */}
                        <motion.section
                            className="user-dash-card p-6 rounded-3xl"
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p className="eyebrow text-cyan-200">Claim Credit</p>
                            <h2 className="text-2xl font-black text-white mt-1 mb-4">Redeem Rewards</h2>
                            
                            <p className="text-sm font-semibold text-cyan-50/70 mb-6 leading-relaxed">
                                Received a promo card, code, or special administrator voucher? Enter the claim code below to deposit reward balance directly into your wallet.
                            </p>

                             <div className="flex justify-center mb-5">
                                 <div className="w-16 h-16 flex items-center justify-center bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/30 shadow-sm animate-bounce" style={{ animationDuration: '2s' }}>
                                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125V8.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                     </svg>
                                 </div>
                             </div>

                             <form onSubmit={handleClaimReward} className="space-y-4">
                                <label className="block">
                                    <span className="block text-sm font-bold text-cyan-50/80 mb-2">Claim Code / Voucher Code</span>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. SAVE100, FREE50, ADMINREWARD" 
                                        className="field uppercase tracking-wider font-mono font-black !bg-white/10 !border-white/15 !text-white"
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
                        className="user-dash-card p-6 max-w-2xl mx-auto rounded-3xl"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="eyebrow text-cyan-200">Help & Feedback</p>
                        <h2 className="text-2xl font-black text-white mt-1 mb-2">📞 Support Desk</h2>
                        <p className="text-sm text-cyan-50/70 mb-6 leading-relaxed">
                            Submit your request below. Tickets will be processed by our administration. Once solved, work related mails are dispatched to <span className="font-bold text-sky-400">saipraveendasari2@gmail.com</span>, and we will contact you back immediately.
                        </p>

                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                            <label className="block">
                                <span className="block text-sm font-bold text-cyan-50/80 mb-1">Your Name</span>
                                <input 
                                    type="text" 
                                    className="field w-full font-bold !bg-white/10 !border-white/15 !text-white" 
                                    value={supportName} 
                                    onChange={(e) => setSupportName(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-cyan-50/80 mb-1">Email Address</span>
                                <input 
                                    type="email" 
                                    className="field w-full font-bold !bg-white/10 !border-white/15 !text-white" 
                                    value={supportEmail} 
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-cyan-50/80 mb-1">Inquiry / Message</span>
                                <textarea 
                                    className="field w-full min-h-[120px] !bg-white/10 !border-white/15 !text-white" 
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

            {/* Direct Print Release Popup Modal */}
            <AnimatePresence>
                {showDirectReleaseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                        <motion.div 
                            className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full my-auto max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl border border-amber-500/30 flex flex-col text-left relative text-white"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <button 
                                onClick={() => setShowDirectReleaseModal(false)}
                                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                ✕ Close
                            </button>

                            <div className="border-b border-white/10 pb-3 pr-14">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
                                    <KeyRound className="w-3 h-3 text-amber-400" />
                                    Secure Release
                                </span>
                                <h3 className="text-xl font-black text-white mt-2 tracking-tight">Direct Print Release</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Enter the 4-digit code shown on the TV display panel to release your print job.
                                </p>
                            </div>

                            <form onSubmit={handleDirectModalRelease} className="mt-5 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Pending Order</label>
                                    {pendingOrdersForRelease.length === 0 ? (
                                        <p className="text-amber-300 text-xs font-semibold bg-amber-500/10 py-2.5 px-3 rounded-xl border border-amber-500/20">
                                            No pending prints found. Upload a document to print.
                                        </p>
                                    ) : (
                                        <select
                                            value={releaseModalOrderId}
                                            onChange={(e) => {
                                                setReleaseModalError("");
                                                setReleaseModalOrderId(e.target.value);
                                            }}
                                            className="w-full h-11 rounded-xl bg-slate-950 border border-white/15 text-xs font-bold text-white focus:border-amber-400 focus:outline-none appearance-none px-3 cursor-pointer"
                                        >
                                            {pendingOrdersForRelease.map(order => (
                                                <option key={order.orderId} value={order.orderId} className="bg-slate-950 text-white">
                                                    {order.orderId} • {order.fileName || "Document"} ({order.totalPages || 1} pgs)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enter 4-Digit Kiosk OTP</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={releaseModalOtp}
                                        onChange={(e) => {
                                            setReleaseModalError("");
                                            setReleaseModalOtp(e.target.value.replace(/[^0-9]/g, ''));
                                        }}
                                        className="w-full h-12 rounded-xl bg-slate-950 border border-white/15 text-center text-lg font-black text-amber-300 placeholder-slate-600 tracking-[0.5em] focus:border-amber-400 focus:outline-none"
                                    />
                                </div>

                                {releaseModalError && (
                                    <div className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
                                        ⚠️ {releaseModalError}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isReleasingFromModal || !releaseModalOrderId || releaseModalOtp.length !== 4}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isReleasingFromModal ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                                Verifying &amp; Releasing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 fill-slate-950" />
                                                Verify &amp; Release Print
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
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
                        <img src={cloudprintWatermark} className="invoice-logo-watermark" alt="Watermark" />
                        <div className="invoice-stamp">VERIFIED</div>
                        
                        <div className="invoice-header">
                            <div className="invoice-logo flex items-center gap-2">
                                <img src={cloudprintLogo} alt="CloudPrint" className="h-9 object-contain" />
                            </div>
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
                    .invoice-logo-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-12deg);
                        width: 70%;
                        max-width: 360px;
                        opacity: 0.09;
                        pointer-events: none;
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
