import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import CustomModal from "../components/CustomModal";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import blocksVideo from "../assets/blocks.mp4";
import collectVideo from "../assets/collect.mp4";
import inVideo from "../assets/in.mp4";
import { 
  User, 
  LogOut, 
  Sparkles, 
  MapPin, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Activity, 
  Clock, 
  Layers, 
  HelpCircle, 
  Search, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  Check, 
  ExternalLink,
  Info,
  ChevronDown,
  ArrowLeft,
  ScanLine
} from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#6C63FF", "#4F9DFF", "#9F6BFF", "#37E67D", "#F8B84E", "#FF5C7A"];

// Framer motion animation configurations
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardHoverEffects = {
  hover: {
    y: -8,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

function BlockSelection() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blocks, setBlocks] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Student User";
    const userEmail = localStorage.getItem("userEmail") || "student@campus.edu";

    // Dropdowns and menus
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const userCollege = localStorage.getItem("userCollege") || "";
    const isAdminUser = userEmail.toLowerCase().includes("admin");
    const [selectedCollege, setSelectedCollege] = useState(!isAdminUser && userCollege ? userCollege : "");

    // Notification states
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isCollegeSuspended, setIsCollegeSuspended] = useState(false);
    const [suspendedMessage, setSuspendedMessage] = useState("");

    // Direct OTP Release State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [inputOtp, setInputOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [otpTimeLeft, setOtpTimeLeft] = useState(0);
    const [showDirectOtpForm, setShowDirectOtpForm] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState("");
    const [trackingOrderStatus, setTrackingOrderStatus] = useState("");
    const [totalPagesToPrint, setTotalPagesToPrint] = useState(1);
    const [currentPagePrinted, setCurrentPagePrinted] = useState(0);
    const [systemSettings, setSystemSettings] = useState(null);
    const [injectingBulk, setInjectingBulk] = useState(false);
    const [injectProgress, setInjectProgress] = useState("");
    const [bulkCount, setBulkCount] = useState(3);
    const [bulkBlock, setBulkBlock] = useState("C Block");

    const parseBackendDate = (dateVal) => {
        if (!dateVal) return null;
        if (Array.isArray(dateVal)) {
            const [y, m, d, hr, min, sec] = dateVal;
            return new Date(Date.UTC(y, m - 1, d, hr || 0, min || 0, sec || 0));
        }
        if (typeof dateVal === "string") {
            const cleanStr = dateVal.replace(" ", "T");
            const hasOffset = /([+-]\d{2}:?\d{2}|Z)$/.test(cleanStr);
            const isoStr = hasOffset ? cleanStr : cleanStr + "Z";
            return new Date(isoStr);
        }
        return new Date(dateVal);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    useEffect(() => {
        if (!selectedOrderId) return;
        
        const selectedOrder = pendingOrders.find(o => o.orderId === selectedOrderId);
        if (!selectedOrder) return;

        const updateTimer = () => {
            if (!selectedOrder.cancelWindowEndsAt) {
                setOtpTimeLeft(600);
                return;
            }
            const dateObj = parseBackendDate(selectedOrder.cancelWindowEndsAt);
            if (!dateObj || isNaN(dateObj.getTime())) {
                setOtpTimeLeft(600);
                return;
            }
            const expireTime = dateObj.getTime() + 10 * 60 * 1000;
            const left = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
            setOtpTimeLeft(left);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [selectedOrderId, pendingOrders]);

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info", onConfirm = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm
        });
    };

    useEffect(() => {
        if (!userId) {
            navigate("/");
        }
    }, [userId, navigate]);

    // Fetch notifications and check suspension status
    useEffect(() => {
        if (!userId) return;
        const college = localStorage.getItem("userCollege") || "KLU";

        const fetchNotifications = async () => {
            try {
                const res = await api.get("/notifications/user", { params: { college } });
                setNotifications(res.data || []);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };

        const checkSuspension = async () => {
            try {
                const res = await api.get("/system/settings");
                setSystemSettings(res.data);
                const suspended = res.data?.suspendedColleges || "";
                const suspendedList = suspended.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
                if (suspendedList.includes(college.toUpperCase())) {
                    setIsCollegeSuspended(true);
                    setSuspendedMessage(`Printing services for ${college} are temporarily suspended by the administrator. Please try again later.`);
                }
            } catch (err) {
                console.error("Failed to check suspension status:", err);
            }
        };

        fetchNotifications();
        checkSuspension();
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch blocks
            const blocksRes = await api.get("/blocks/all");
            
            // 2. Fetch printers status
            const printersRes = await api.get("/printer/all");
            const printerList = printersRes.data || [];
            setPrinters(printerList);

            // 3. Map block details and fetch queue length in parallel
            const mapped = await Promise.all(blocksRes.data.map(async (b, idx) => {
                const printer = printerList.find(p => p.blockLocation === b.name);
                let queueCount = 0;
                try {
                    const queueRes = await api.get("/queue/pending", { params: { blockLocation: b.name } });
                    queueCount = (queueRes.data || []).length;
                } catch (qErr) {
                    console.error("Failed to load queue size for block " + b.name, qErr);
                }

                return {
                    name: b.name,
                    college: b.college || "KLU",
                    description: `${b.name} Print Center`,
                    icon: defaultIcons[idx % defaultIcons.length],
                    accent: defaultAccents[idx % defaultAccents.length],
                    distance: `${(0.2 + idx * 0.15).toFixed(2)} km`,
                    availablePrinters: printer ? (printer.active && !printer.paused ? "Active Printer" : "Offline") : "Not configured",
                    paperCount: printer ? printer.paperCount : 0,
                    maintenance: printer ? printer.maintenance : false,
                    isOnline: printer ? (printer.active && !printer.paused) : false,
                    colorSupported: printer ? printer.colourSupported === true : false,
                    bwSupported: true,
                    queueCount: queueCount
                };
            }));
            setBlocks(mapped);
        } catch (err) {
            console.error("Failed to load blocks or printer details", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingOrders = async () => {
        if (!userId) return;
        try {
            const res = await api.get("/pdf/userOrders", { params: { userId } });
            const pending = (res.data || []).filter(
                o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW"
            );
            setPendingOrders(pending);
            if (pending.length > 0) {
                // If there's no selected order or the current selected order is not in the list, set to the first one
                const exists = pending.some(o => o.orderId === selectedOrderId);
                if (!exists) {
                    setSelectedOrderId(pending[0].orderId);
                }
            } else {
                setSelectedOrderId("");
            }
        } catch (err) {
            console.error("Failed to fetch pending orders:", err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchPendingOrders();
    }, [userId]);

    // Auto-open OTP modal when redirected from checkout with orderId
    useEffect(() => {
        const redirectOrderId = searchParams.get("orderId");
        const redirectOtp = searchParams.get("otp");
        const redirectFileName = searchParams.get("fileName");
        const redirectBlock = searchParams.get("block");

        if (redirectOrderId && userId) {
            setSearchParams({}, { replace: true });
            
            (async () => {
                const blockLoc = redirectBlock ? decodeURIComponent(redirectBlock) : "";
                let otpBypassed = false;

                if (blockLoc) {
                    try {
                        const printerRes = await api.get("/printer/byBlock", { params: { blockLocation: blockLoc } });
                        const printerConfig = printerRes.data;
                        if (printerConfig && printerConfig.otpEnabled === false) {
                            otpBypassed = true;
                        }
                    } catch (err) {
                        console.error("Failed to check printer config:", err);
                    }
                }

                if (otpBypassed) {
                    showAlert("Direct Printing Released! 🚀", `OTP is bypassed for ${blockLoc}. Your document has been sent directly to the printer spooler!`, "success");
                    navigate("/my-orders");
                } else {
                    setOtpError("");
                    setShowDirectOtpForm(true);
                    
                    if (redirectOtp) {
                        setPendingOrders([
                            {
                                orderId: redirectOrderId,
                                otpCode: redirectOtp,
                                fileName: redirectFileName ? decodeURIComponent(redirectFileName) : "document.pdf",
                                status: "PENDING_SCAN"
                            }
                        ]);
                        setSelectedOrderId(redirectOrderId);
                        setFetchingOrders(false);

                        // Auto release print
                        (async () => {
                            setReleasing(true);
                            try {
                                await api.post("/pdf/releasePrint", null, {
                                    params: { orderId: redirectOrderId, otp: redirectOtp.trim() }
                                });
                                setOtpError("");
                                setTrackingOrderId(redirectOrderId);
                                setTrackingOrderStatus("RELEASING");
                                fetchPendingOrders();
                            } catch (err) {
                                console.error("Auto print release via QR failed:", err);
                                setOtpError(err.response?.data?.message || "QR Release failed. Please enter the OTP manually below.");
                            } finally {
                                setReleasing(false);
                            }
                        })();
                    } else {
                        setFetchingOrders(true);
                        try {
                            const res = await api.get("/pdf/userOrders", { params: { userId } });
                            const pending = (res.data || []).filter(
                                o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW"
                            );
                            setPendingOrders(pending);
                            const match = pending.find(o => o.orderId === redirectOrderId);
                            setSelectedOrderId(match ? match.orderId : (pending.length > 0 ? pending[0].orderId : ""));
                        } catch (err) {
                            setOtpError("Failed to fetch your pending orders.");
                        } finally {
                            setFetchingOrders(false);
                        }
                    }
                }
            })();
        }
    }, [userId, searchParams, setSearchParams]);

    useEffect(() => {
        if (!trackingOrderId || trackingOrderStatus !== "RELEASING") return;

        let active = true;
        const checkStatus = async () => {
            try {
                const response = await api.get("/pdf/details", {
                    params: { orderId: trackingOrderId }
                });
                if (response.data && active) {
                    setTotalPagesToPrint(response.data.totalPages || 1);
                    if (response.data.status === "COMPLETED") {
                        // Switch from RELEASING to PRINTING animation stage!
                        setTrackingOrderStatus("PRINTING");
                        setCurrentPagePrinted(0);
                    }
                }
            } catch (err) {
                console.error("Failed to check order status:", err);
            }
        };

        const interval = setInterval(checkStatus, 1500);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [trackingOrderId, trackingOrderStatus]);

    useEffect(() => {
        if (trackingOrderStatus !== "PRINTING") return;

        let timerId;

        // Step 1: Warmup delay of 5 seconds
        timerId = setTimeout(() => {
            setCurrentPagePrinted(1);

            if (totalPagesToPrint === 1) {
                // If only 1 page, wait 5.0s for the page to print before completing
                timerId = setTimeout(() => {
                    setTrackingOrderStatus("COMPLETED");
                }, 5000);
            } else {
                // If multiple pages, start the 5.0s interval
                let current = 1;
                const intervalId = setInterval(() => {
                    current += 1;
                    setCurrentPagePrinted(current);

                    if (current >= totalPagesToPrint) {
                        clearInterval(intervalId);
                        // Wait one final 5.0s for the last page to finish printing
                        timerId = setTimeout(() => {
                            setTrackingOrderStatus("COMPLETED");
                        }, 5000);
                    }
                }, 5000);

                timerId = intervalId;
            }
        }, 5000);

        return () => {
            clearTimeout(timerId);
            clearInterval(timerId);
        };
    }, [trackingOrderStatus, totalPagesToPrint]);

    const logout = () => {
        clearUserSession();
        navigate("/");
    };

    const selectBlock = (blockName) => {
        localStorage.setItem("selectedBlock", blockName);
        navigate("/dashboard");
    };

    const handleOpenOtpModal = async () => {
        if (!userId) {
            showAlert("Not Logged In", "Please log in to release your prints.", "warning");
            return;
        }
        setShowOtpModal(true);
        setFetchingOrders(true);
        setOtpError("");
        try {
            const res = await api.get("/pdf/userOrders", { params: { userId } });
            const pending = (res.data || []).filter(o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW");
            setPendingOrders(pending);
            if (pending.length > 0) {
                setSelectedOrderId(pending[0].orderId);
            } else {
                setSelectedOrderId("");
            }
        } catch (err) {
            setOtpError("Failed to fetch your pending orders.");
        } finally {
            setFetchingOrders(false);
        }
    };

    const handleDirectRelease = async () => {
        if (!selectedOrderId || inputOtp.length !== 4) {
            setOtpError("Please select an order and enter the 4-digit OTP.");
            return;
        }
        setReleasing(true);
        try {
            await api.post("/pdf/releasePrint", null, {
                params: { orderId: selectedOrderId, otp: inputOtp.trim() }
            });
            const releasedId = selectedOrderId;
            setOtpError("");
            setShowOtpModal(false);
            setShowDirectOtpForm(false);
            setInputOtp("");
            setTrackingOrderId(releasedId);
            setTrackingOrderStatus("RELEASING");
            fetchPendingOrders();
        } catch (err) {
            setOtpError(err.response?.data?.message || "Invalid OTP or Order.");
        } finally {
            setReleasing(false);
        }
    };

    const parseScannedReleaseCode = (decodedText) => {
        const raw = String(decodedText || "").trim();
        if (!raw) return null;

        try {
            const url = new URL(raw);
            const orderId = url.searchParams.get("orderId");
            const otp = url.searchParams.get("otp");
            if (orderId && otp) {
                return { orderId: orderId.trim(), otp: otp.trim() };
            }
        } catch {
            // Plain barcode payloads are expected too, for example ORDER1234-5678.
        }

        const match = raw.match(/^(.+)-(\d{4})$/);
        if (!match) return null;
        return { orderId: match[1].trim(), otp: match[2].trim() };
    };

    const handleScannedRelease = async (decodedText) => {
        const parsed = parseScannedReleaseCode(decodedText);
        setShowBarcodeScanner(false);
        setOtpError("");

        if (!parsed) {
            setShowDirectOtpForm(true);
            setOtpError("Could not read the QR/barcode. Please scan again or enter the OTP manually.");
            return;
        }

        setReleasing(true);
        try {
            await api.post("/pdf/releasePrint", null, {
                params: { orderId: parsed.orderId, otp: parsed.otp }
            });
            setSelectedOrderId(parsed.orderId);
            setInputOtp("");
            setShowDirectOtpForm(false);
            setTrackingOrderId(parsed.orderId);
            setTrackingOrderStatus("RELEASING");
            fetchPendingOrders();
        } catch (err) {
            setShowDirectOtpForm(true);
            setSelectedOrderId(parsed.orderId);
            setInputOtp(parsed.otp);
            setOtpError(err.response?.data?.message || "QR/barcode release failed. Please verify the order and OTP.");
        } finally {
            setReleasing(false);
        }
    };

    const handleInjectBulk = async (count, blockName) => {
        setInjectingBulk(true);
        setInjectProgress("Initializing mock file...");
        try {
            const base64Pdf = "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovUmVzb3VyY2VzIDw8Cj4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDU1Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzEyIFRkCihoZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA3MCAwMDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIG4gCjAwMDAwMDAyMTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozMjYKJSVFT0Y=";
            const byteCharacters = atob(base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const mockFile = new File([blob], `test_kiosk_${blockName.replace(/\s+/g, "_")}.pdf`, { type: "application/pdf" });

            for (let i = 1; i <= count; i++) {
                setInjectProgress(`Uploading test print ${i} of ${count}...`);
                const formData = new FormData();
                formData.append("file", mockFile);
                formData.append("userId", userId);
                formData.append("customerName", userName || "Tester");
                formData.append("blockLocation", blockName);

                const uploadRes = await api.post("/pdf/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                const orderId = uploadRes.data.orderId;

                setInjectProgress(`Bypassing payment for ${orderId}...`);
                await api.post("/pdf/updatePrice", null, {
                    params: { orderId, price: 0.0 }
                });

                await api.post("/pdf/payWithWallet", null, {
                    params: { orderId }
                });

                setInjectProgress(`Spooling ${orderId} into print queue...`);
                await api.post("/queue/proceed", null, {
                    params: { orderId }
                });
            }

            setInjectProgress("");
            showAlert("Tester Injection Complete", `Successfully generated & spooled ${count} bulk test prints for ${blockName}!`, "success");
            fetchPendingOrders();
        } catch (err) {
            console.error("Bulk injection failed:", err);
            let errMsg = "Failed to generate mock prints";
            if (err.response?.data) {
                if (typeof err.response.data === "string") {
                    errMsg = err.response.data;
                } else if (typeof err.response.data === "object") {
                    errMsg = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
                }
            } else if (err.message) {
                errMsg = err.message;
            }
            showAlert("Injection Failed", `Step: "${injectProgress}" failed | Error: ${errMsg}`, "error");
        } finally {
            setInjectingBulk(false);
            setInjectProgress("");
        }
    };

    // Get unique list of colleges
    const collegesList = ["KLU", ...Array.from(new Set(blocks.map(b => b.college))).filter(c => c !== "KLU" && c)];

    // Filtered blocks based on selected college and search query, sorted with online printers at the top
    const filteredBlocks = blocks.filter(b => {
        const matchesCollege = b.college.toUpperCase() === selectedCollege.toUpperCase();
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              b.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCollege && matchesSearch;
    }).sort((a, b) => {
        const aReady = a.isOnline && !a.maintenance;
        const bReady = b.isOnline && !b.maintenance;
        if (aReady && !bReady) return -1;
        if (!aReady && bReady) return 1;
        return 0;
    });

    const isTester = systemSettings && systemSettings.testerModeEnabled && (
        (systemSettings.testerUsernames || "")
            .split(",")
            .map(t => t.trim().toLowerCase())
            .some(t => t && (t === userName.toLowerCase() || t === userEmail.toLowerCase()))
    );

    console.log("=== Tester Sandbox Debug ===", {
        testerModeEnabled: systemSettings?.testerModeEnabled,
        allowedTestersList: systemSettings?.testerUsernames,
        currentUserName: userName,
        currentUserEmail: userEmail,
        isDetectedAsTester: !!isTester
    });

    return (
        <main className="premium-block-bg min-h-screen py-6 px-0 sm:px-4 md:px-8 xl:px-12 relative overflow-hidden font-sans text-slate-950 flex flex-col justify-between">
            {/* Styles for glassmorphism, background, and maintenance stamp */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background-color: #f7fbff;
                }
                .premium-block-bg {
                    background:
                        radial-gradient(circle at 76% 12%, rgba(45, 212, 191, 0.24), transparent 24rem),
                        radial-gradient(circle at 16% 28%, rgba(14, 165, 233, 0.26), transparent 28rem),
                        linear-gradient(135deg, #020617 0%, #082f49 46%, #0f766e 100%);
                }
                .premium-block-bg::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background:
                        linear-gradient(115deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 42px),
                        linear-gradient(to bottom, rgba(2,6,23,0.16), rgba(2,6,23,0.78));
                    opacity: 0.95;
                }
                .premium-block-bg::after {
                    content: "";
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
                    background-size: 22px 22px;
                    mask-image: linear-gradient(to bottom, transparent, black 18%, black 84%, transparent);
                }
                .glass-panel {
                    position: relative;
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(22px);
                    -webkit-backdrop-filter: blur(22px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow: 0 28px 80px rgba(2, 6, 23, 0.34);
                }
                .glass-panel::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    pointer-events: none;
                    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent 36%);
                }
                .premium-block-bg .glass-panel .text-slate-950,
                .premium-block-bg .glass-panel .text-slate-800,
                .premium-block-bg .glass-panel .text-slate-700 {
                    color: #ffffff !important;
                }
                .premium-block-bg .glass-panel .text-slate-500,
                .premium-block-bg .glass-panel .text-slate-600 {
                    color: rgba(207, 250, 254, 0.72) !important;
                }
                .glow-btn {
                    background: linear-gradient(135deg, #0891b2 0%, #059669 100%);
                    box-shadow: 0 12px 28px rgba(8, 145, 178, 0.24);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glow-btn:hover {
                    box-shadow: 0 16px 34px rgba(5, 150, 105, 0.28);
                    transform: scale(1.03);
                }
                .maintenance-stamp {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-12deg);
                    border: 2px solid #e11d48;
                    color: #be123c;
                    background-color: rgba(255, 241, 242, 0.92);
                    font-size: 13px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    padding: 7px 12px;
                    text-transform: uppercase;
                    border-radius: 999px;
                    box-shadow: 0 12px 26px rgba(225, 29, 72, 0.16);
                    pointer-events: none;
                    z-index: 20;
                }
                .offline-stamp {
                    position: absolute;
                    top: 18px;
                    right: 18px;
                    transform: none;
                    border: 1px solid #cbd5e1;
                    color: #64748b;
                    background-color: rgba(248, 250, 252, 0.92);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                    padding: 6px 10px;
                    text-transform: uppercase;
                    border-radius: 999px;
                    box-shadow: 0 10px 24px rgba(100, 116, 139, 0.14);
                    pointer-events: none;
                    z-index: 20;
                }
                .online-stamp {
                    position: absolute;
                    top: 18px;
                    right: 18px;
                    transform: none;
                    border: 1px solid rgba(5, 150, 105, 0.24);
                    color: #047857;
                    background-color: rgba(236, 253, 245, 0.94);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                    padding: 6px 10px;
                    text-transform: uppercase;
                    border-radius: 999px;
                    box-shadow: 0 10px 24px rgba(5, 150, 105, 0.14);
                    pointer-events: none;
                    z-index: 20;
                }
                .notif-panel-enter { animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1); }
                @keyframes slideInRight { from { opacity:0; transform: translateX(24px); } to { opacity:1; transform: translateX(0); } }
                .block-video-bg {
                    position: fixed;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    pointer-events: none;
                    opacity: 0.42;
                    mix-blend-mode: screen;
                    filter: saturate(1.25) contrast(1.04);
                }
                .block-ambient-scrim {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background:
                        linear-gradient(180deg, rgba(2,6,23,0.76), rgba(2,6,23,0.36) 44%, rgba(2,6,23,0.54) 100%),
                        radial-gradient(circle at 70% 16%, rgba(125,211,252,0.18), transparent 28rem);
                }
            `}} />

            <video autoPlay loop muted playsInline className="block-video-bg">
                <source src={blocksVideo} type="video/mp4" />
            </video>
            <div className="block-ambient-scrim" />

            {/* === SUSPENSION SCREEN OVERLAY === */}
            {isCollegeSuspended && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full text-center"
                    >
                        <div className="text-7xl mb-6">🚫</div>
                        <h2 className="text-3xl font-black text-white mb-3">Service Suspended</h2>
                        <p className="text-slate-400 text-sm font-semibold leading-relaxed mb-8">{suspendedMessage}</p>
                        <div className="glass-panel rounded-2xl p-4 border border-[#FF5C7A]/20">
                            <p className="text-xs text-[#FF5C7A] font-bold uppercase tracking-wider">Contact your college administrator for more information.</p>
                        </div>
                        <button onClick={logout} className="mt-8 px-6 py-3 rounded-xl bg-slate-800 border border-white/10 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors">
                            Sign Out
                        </button>
                    </motion.div>
                </div>
            )}

            {/* === NOTIFICATION PANEL DRAWER === */}
            <AnimatePresence>
                {showNotifPanel && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowNotifPanel(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 32 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 32 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm z-[200] flex flex-col"
                            style={{ background: 'rgba(10, 14, 28, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-24px 0 80px rgba(0,0,0,0.5)' }}
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6C63FF]">Campus Updates</p>
                                    <h3 className="text-lg font-extrabold text-white mt-0.5">Notifications</h3>
                                </div>
                                <button
                                    onClick={() => setShowNotifPanel(false)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                        <Bell className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm font-semibold">No notifications yet</p>
                                        <p className="text-xs mt-1 opacity-70">Check back later for campus updates</p>
                                    </div>
                                ) : (
                                    notifications.map((notif, idx) => (
                                        <motion.div
                                            key={notif.id || idx}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="rounded-xl p-4 border border-white/5 bg-slate-900/60"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl mt-0.5">
                                                    {notif.type === 'ALERT' ? '🚨' : notif.type === 'INFO' ? 'ℹ️' : '📢'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white">{notif.title || 'Campus Notification'}</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{notif.message}</p>
                                                    {notif.college && notif.college !== 'ALL' && (
                                                        <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-wider bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 px-2 py-0.5 rounded-full">
                                                            {notif.college}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="px-6 py-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-600 font-semibold text-center">Notifications from your campus administrator</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <PopupManager page="LOCATION_SELECTION" />

            <div className="w-full max-w-[1600px] mx-auto space-y-8 relative z-10 flex-1 flex flex-col">
                
                {/* HEADER (Full Width, Stripe/Vercel navbar) */}
                <motion.header 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full py-4 px-6 rounded-2xl flex items-center justify-between gap-6 relative z-50 border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-slate-950/20"
                >
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse" />
                            <span className="text-[12px] font-extrabold uppercase tracking-widest text-cyan-100">
                            {selectedCollege ? `Block Selection • ${selectedCollege}` : "College Selection • Pick a Campus"}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center flex-1 max-w-md relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                        <input 
                            type="text" 
                            placeholder="Search campus buildings, blocks, or services..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/12 border border-white/15 text-sm text-white placeholder-cyan-100/60 focus:outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 transition-all"
                        />
                    </div>

                    {/* Profile & Dropdown Sign Out */}
                    <div className="flex items-center gap-3 relative">
                        <button
                            onClick={() => navigate("/my-orders")}
                            className="px-4 py-2 h-10 rounded-xl bg-white/12 border border-white/15 text-white hover:border-cyan-200/50 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            View Orders
                        </button>

                        <button
                            onClick={() => setShowNotifPanel(true)}
                            className="relative w-10 h-10 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center text-cyan-50 hover:text-white hover:border-cyan-200/50 transition-colors cursor-pointer"
                        >
                            <Bell className="w-4 h-4" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C7A] animate-pulse" />
                            )}
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-white/15 relative z-50">
                            <button 
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-2 text-left hover:opacity-90 transition-all bg-white/12 p-1.5 rounded-xl border border-white/15"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#9F6BFF] flex items-center justify-center font-bold text-xs text-white shadow-md">
                                    {userName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="hidden sm:block text-xs font-bold text-white">{userName}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showProfileDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-12 z-[9999] w-48 rounded-xl bg-slate-950 border border-white/10 p-2 shadow-2xl"
                                    >
                                        <div className="p-2 border-b border-white/5 text-left mb-1">
                                            <p className="text-xs font-black text-white">{userName}</p>
                                            <p className="text-[10px] text-slate-500 font-semibold truncate">{userEmail}</p>
                                        </div>
                                        <button 
                                            onClick={logout}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[#FF5C7A] hover:bg-[#FF5C7A]/10 text-left transition-all"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.header>

                {/* HERO SECTION & INTERACTIVE CAMPUS MAP */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left (40% columns equivalent on desktop) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-5 flex flex-col justify-between gap-6"
                    >
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-5xl xl:text-[56px] font-extrabold tracking-tight text-white leading-[1.08]">
                                {selectedCollege ? "Choose Print Block" : "Select Your College"}
                            </h1>
                            <p className="text-[16px] text-cyan-50/78 font-medium leading-relaxed max-w-lg">
                                {selectedCollege 
                                    ? `Showing active printing blocks located in ${selectedCollege}. Choose a printer node to route your papers.`
                                    : "Pick your college campus. You will be redirected to choose block locations and spoolers within that campus."
                                }
                            </p>
                        </div>

                    </motion.div>

                    {/* Right (7 columns: Simple, transparent, and smaller 'Have OTP' action card / inline release form) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.55 }}
                        className="lg:col-span-7 flex items-center justify-center lg:justify-end py-4"
                    >
                        {!showDirectOtpForm ? (
                            <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    if (!userId) {
                                        showAlert("Not Logged In", "Please log in to release your prints.", "warning");
                                        return;
                                    }
                                    setOtpError("");
                                    setFetchingOrders(true);
                                    setShowDirectOtpForm(true);
                                    api.get("/pdf/userOrders", { params: { userId } })
                                        .then(res => {
                                            const pending = (res.data || []).filter(o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW");
                                            setPendingOrders(pending);
                                            if (pending.length > 0) {
                                                setSelectedOrderId(pending[0].orderId);
                                            } else {
                                                setSelectedOrderId("");
                                            }
                                        })
                                        .catch(() => setOtpError("Failed to fetch pending orders."))
                                        .finally(() => setFetchingOrders(false));
                                }}
                                className="glass-panel min-h-[190px] p-6 rounded-[24px] text-center cursor-pointer w-full border border-white/10 hover:border-amber-400/40 transition-all duration-300 shadow-2xl shadow-slate-950/40 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                                style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                            >
                                <div className="absolute top-[-10%] right-[-10%] w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                                <span className="text-4xl animate-pulse">🔑</span>
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">Have OTP?</h3>
                                    <p className="text-[11px] text-cyan-200/60 mt-0.5 font-bold">Release your print job here</p>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    if (!userId) {
                                        showAlert("Not Logged In", "Please log in to release your prints.", "warning");
                                        return;
                                    }
                                    setOtpError("");
                                    setShowBarcodeScanner(true);
                                }}
                                className="glass-panel min-h-[190px] p-6 rounded-[24px] text-center cursor-pointer w-full border border-white/10 hover:border-cyan-300/50 transition-all duration-300 shadow-2xl shadow-slate-950/40 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                                style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                            >
                                <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                                    <ScanLine className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">Scan QR / Barcode</h3>
                                    <p className="text-[11px] text-cyan-200/60 mt-0.5 font-bold">Point camera at kiosk display</p>
                                </div>
                            </motion.div>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 rounded-[24px] border border-white/10 relative flex flex-col justify-between shadow-2xl shadow-slate-950/20 text-left w-full max-w-md"
                                style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                            >
                                <button 
                                    onClick={() => setShowDirectOtpForm(false)}
                                    className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    ✕ Close
                                </button>

                                <div className="border-b border-white/5 pb-3 pr-14">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">🔑 Secure Release</span>
                                    <h3 className="text-lg font-black text-white mt-2 tracking-tight">Direct Print Release</h3>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="space-y-1 text-left">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select Pending Order</label>
                                        {fetchingOrders ? (
                                            <p className="text-slate-400 text-xs py-1.5 font-semibold">Loading your pending orders...</p>
                                        ) : pendingOrders.length === 0 ? (
                                            <p className="text-rose-400 text-xs font-semibold bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                                                No pending prints to release.
                                            </p>
                                        ) : (
                                            <select
                                                value={selectedOrderId}
                                                onChange={(e) => {
                                                    setOtpError("");
                                                    setSelectedOrderId(e.target.value);
                                                }}
                                                className="w-full h-10 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-bold text-white focus:border-amber-400 focus:outline-none appearance-none px-3 cursor-pointer"
                                            >
                                                {pendingOrders.map(order => (
                                                    <option key={order.orderId} value={order.orderId} className="bg-slate-950 text-white">
                                                        {order.orderId} - {order.fileName}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">4-Digit OTP Code</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="••••"
                                            value={inputOtp}
                                            onChange={(e) => {
                                                setOtpError("");
                                                setInputOtp(e.target.value);
                                            }}
                                            className="w-full h-10 rounded-xl bg-slate-950/60 border border-white/10 text-center text-sm font-bold text-white placeholder-slate-600 tracking-[0.5em] focus:border-amber-400 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {selectedOrderId && pendingOrders.find(o => o.orderId === selectedOrderId) && (
                                    <div className="mt-2.5 text-[10px] font-bold text-amber-300">
                                        ⏱️ OTP Expires in: <span className="font-mono text-xs font-black bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{formatTime(otpTimeLeft)}</span>
                                    </div>
                                )}

                                {otpError && (
                                    <p className="text-xs font-bold text-rose-400 mt-2 bg-rose-500/10 border border-rose-500/20 py-1.5 px-2.5 rounded-lg">
                                        ⚠️ {otpError}
                                    </p>
                                )}

                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleDirectRelease}
                                        disabled={releasing || pendingOrders.length === 0}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {releasing ? "Releasing..." : "Verify & Print"} <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                    
                    {/* FULL WIDTH COLUMN (Occupies 10 columns) */}
                    <div className="lg:col-span-10 space-y-6">
                        
                        {/* CONDITIONAL VIEW 1: College Selection View (shown before college selection) */}
                        {!selectedCollege ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="border-b border-white/12 pb-4">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-white">Select Campus / College</h2>
                                    <p className="text-xs text-cyan-50/70 mt-1 font-semibold">Choose a college campus to list its available blocks and printers</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {collegesList.map((college, idx) => {
                                        const accent = defaultAccents[idx % defaultAccents.length];
                                        const count = blocks.filter(b => b.college.toUpperCase() === college.toUpperCase()).length;
                                        return (
                                            <motion.button
                                                key={college}
                                                onClick={() => setSelectedCollege(college)}
                                                variants={cardHoverEffects}
                                                whileHover="hover"
                                                className="glass-panel p-8 rounded-[24px] text-left relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-cyan-200 w-full group flex flex-col justify-between min-h-[160px]"
                                            >
                                                <div className="absolute top-0 left-0 w-[4px] h-full" style={{backgroundColor: accent}} />
                                                <div className="space-y-2">
                                                    <span className="text-4xl">🏫</span>
                                                    <h3 className="text-2xl font-black text-white tracking-tight mt-3">{college} College</h3>
                                                    <p className="text-xs text-cyan-200/60 font-semibold">Active campus printing grid counters</p>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300" style={{color: accent}}>
                                                        {count} Blocks Configured
                                                    </span>
                                                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                                                        Select Campus <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            /* CONDITIONAL VIEW 2: Block Location Selection View (shown after selecting a college) */
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between border-b border-white/12 pb-4">
                                    <div>
                                        {(isAdminUser || !userCollege) && (
                                            <button 
                                                onClick={() => setSelectedCollege("")}
                                                className="text-xs font-bold text-cyan-100 hover:underline flex items-center gap-1.5 mb-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/12"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Campus Directory
                                            </button>
                                        )}
                                        <h2 className="text-2xl font-extrabold tracking-tight text-white">Available Print Locations</h2>
                                        <p className="text-xs text-cyan-50/70 mt-1 font-semibold">Select a building block within {selectedCollege} College</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredBlocks.map((block) => (
                                        <motion.div
                                            key={block.name}
                                            variants={cardHoverEffects}
                                            whileHover="hover"
                                            onClick={() => {
                                                if (!block.maintenance && block.isOnline) {
                                                    selectBlock(block.name);
                                                }
                                            }}
                                            className={`glass-panel rounded-[20px] overflow-hidden flex flex-col justify-between text-left group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.22)] hover:border-cyan-400 relative min-h-[300px] ${(!block.maintenance && block.isOnline) ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                                        >
                                            {/* Colored Header banner strip */}
                                            <div className="h-1 w-full" style={{backgroundColor: block.accent}} />

                                            {/* Stamp Overlays */}
                                            {block.maintenance ? (
                                                <div className="maintenance-stamp !text-[9px] !px-2.5 !py-1">
                                                    UNDER MAINTENANCE
                                                </div>
                                            ) : !block.isOnline ? (
                                                <div className="offline-stamp !text-[9px] !px-2.5 !py-1">
                                                    OFFLINE
                                                </div>
                                            ) : (
                                                <div className="online-stamp !text-[9px] !px-2.5 !py-1">
                                                    ONLINE
                                                </div>
                                            )}

                                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-2xl p-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">{block.icon}</span>
                                                        <div className="min-w-0">
                                                            <h4 className="text-lg font-black text-white tracking-tight truncate">{block.name}</h4>
                                                            <p className="text-[11px] text-cyan-200/70 font-bold truncate">{block.description}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Grid (Without Distance field) */}
                                                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/10 text-[12px] text-slate-300">
                                                    <div>
                                                        <p className="text-[10px] font-black text-cyan-200/50 uppercase tracking-wider">Queue</p>
                                                        <p className="font-extrabold text-white mt-0.5 truncate">{block.queueCount} waiting</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-cyan-200/50 uppercase tracking-wider">Mode</p>
                                                        <p className="font-extrabold text-white mt-0.5 truncate">
                                                            {block.colorSupported ? "Color & BW" : "Only BW"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-cyan-200/50 uppercase tracking-wider">Paper</p>
                                                        <p className="font-extrabold text-emerald-400 mt-0.5 truncate">
                                                            📄 {block.paperCount != null ? block.paperCount : 0} Sheets
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-cyan-200/50 uppercase tracking-wider">Status</p>
                                                        <p className="font-extrabold text-white mt-0.5 truncate">
                                                            {block.isOnline ? "Ready" : "Offline"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Select button */}
                                                <button
                                                    className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-white/10 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 mt-3 flex items-center justify-center gap-1.5 pointer-events-none"
                                                    disabled={block.maintenance || !block.isOnline}
                                                    style={(block.maintenance || !block.isOnline) ? { opacity: 0.5 } : {}}
                                                >
                                                    Select Print Counter <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Tester Mode Sandbox Panel */}
                {isTester && (
                    <div className="glass-panel p-6 rounded-[24px] border border-purple-500/30 bg-purple-500/5 mt-8 shadow-2xl relative overflow-hidden text-left">
                        <div className="absolute top-[-30px] right-[-30px] w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-black text-purple-300 flex items-center gap-2">
                                    <span>🧪</span> Tester Sandbox Panel
                                </h3>
                                <p className="text-xs text-cyan-200/60 font-semibold mt-1 max-w-xl">
                                    Simulate printer loads and verify the queue display system. This tool injects multiple mock orders directly into the target spooler tray without requesting wallet deductions.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Order Count</span>
                                    <select 
                                        value={bulkCount} 
                                        onChange={(e) => setBulkCount(parseInt(e.target.value))}
                                        className="h-10 rounded-xl bg-slate-900 border border-white/10 px-3 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value={2}>2 Orders</option>
                                        <option value={3}>3 Orders</option>
                                        <option value={5}>5 Orders</option>
                                        <option value={8}>8 Orders</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kiosk Target</span>
                                    <select 
                                        value={bulkBlock} 
                                        onChange={(e) => setBulkBlock(e.target.value)}
                                        className="h-10 rounded-xl bg-slate-900 border border-white/10 px-3 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        {blocks.map(b => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => handleInjectBulk(bulkCount, bulkBlock)}
                                    disabled={injectingBulk}
                                    className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 text-white font-black text-xs uppercase tracking-wider transition-colors mt-4 sm:mt-0 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {injectingBulk ? "Injecting..." : "Inject bulk orders 🚀"}
                                </button>
                            </div>
                        </div>

                        {injectingBulk && (
                            <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-purple-500/20 text-xs font-bold text-purple-300 animate-pulse flex items-center gap-2">
                                <span className="animate-spin text-sm">🌀</span>
                                <span>{injectProgress}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Slim footer stats / verification security badges */}
                <footer className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6 text-slate-500 text-xs font-semibold">
                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-[#37E67D]" />
                        <span>Protected by campus end-to-end local network encryption.</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-end gap-2.5">
                        <Info className="w-4.5 h-4.5 text-[#4F9DFF]" />
                        <span>Real-time status logs are active and monitored.</span>
                    </div>
                </footer>
            </div>

            {/* Custom Modal overlay popup */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            <BarcodeScannerModal
                isOpen={showBarcodeScanner}
                onClose={() => setShowBarcodeScanner(false)}
                onResult={handleScannedRelease}
            />

            {/* Verification OTP Modal Overlay */}
            <AnimatePresence>
                {showOtpModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#12192D] p-6 text-center shadow-2xl relative overflow-hidden"
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#F8B84E] to-[#9F6BFF]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4F9DFF]">
                                Direct Print Release
                            </p>
                            <h3 className="mt-2 text-xl font-extrabold text-white">
                                Enter Order & OTP
                            </h3>
                            <p className="text-[11px] text-cyan-200/50 mt-2 font-bold px-2">
                                💡 Scan the QR Code on the Kiosk Display using your phone's native camera for instant release, or enter details manually below.
                            </p>
                            
                            <div className="mt-6 space-y-4">
                                {fetchingOrders ? (
                                    <p className="text-slate-400 text-sm py-3 font-semibold">Loading your pending orders...</p>
                                ) : pendingOrders.length === 0 ? (
                                    <p className="text-rose-400 text-sm font-semibold bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                                        You have no pending prints to release.
                                    </p>
                                ) : (
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) => {
                                            setOtpError("");
                                            setSelectedOrderId(e.target.value);
                                        }}
                                        className="w-full h-12 rounded-xl bg-slate-900 border border-white/5 text-center text-sm font-bold text-white focus:border-[#6C63FF] focus:outline-none appearance-none px-4"
                                    >
                                        {pendingOrders.map(order => (
                                            <option key={order.orderId} value={order.orderId}>
                                                {order.orderId} - {order.fileName}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {selectedOrderId && pendingOrders.find(o => o.orderId === selectedOrderId) && (
                                    <div className="text-center text-xs font-bold text-[#F8B84E] bg-[#F8B84E]/10 border border-[#F8B84E]/20 py-2 rounded-xl mt-2">
                                        ⏱️ OTP Expires in: <span className="font-mono text-sm font-black">{formatTime(otpTimeLeft)}</span>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="4-Digit OTP"
                                    value={inputOtp}
                                    onChange={(e) => {
                                        setOtpError("");
                                        setInputOtp(e.target.value);
                                    }}
                                    className="w-full h-12 rounded-xl bg-slate-900 border border-white/5 text-center text-lg font-bold text-white placeholder-slate-500 tracking-[0.5em] focus:border-[#6C63FF] focus:outline-none"
                                />
                            </div>

                            {otpError && (
                                <p className="text-xs font-bold text-[#FF5C7A] mt-4 bg-[#FF5C7A]/10 border border-[#FF5C7A]/20 py-2 rounded-lg">
                                    ⚠️ {otpError}
                                </p>
                            )}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        setOtpError("");
                                        setInputOtp("");
                                    }}
                                    className="h-11 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
                                >
                                    Add New Print / Close
                                </button>
                                <button
                                    onClick={handleDirectRelease}
                                    disabled={releasing || pendingOrders.length === 0}
                                    className="h-11 rounded-xl bg-[#6C63FF] hover:bg-[#8B5CFF] text-xs font-black text-white transition-colors disabled:opacity-50"
                                >
                                    {releasing ? "Releasing..." : "Verify & Print"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Print Tracking Overlay */}
            <AnimatePresence>
                {trackingOrderId && (
                    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-slate-950/98 backdrop-blur-lg text-white">
                        <div className="max-w-xl w-full text-center space-y-8">
                            {trackingOrderStatus === "RELEASING" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="w-48 h-48 mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 flex items-center justify-center p-2">
                                        <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                                        <span className="text-6xl animate-pulse">🖨️</span>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">Spooling Queue</span>
                                        <h2 className="text-3xl font-black tracking-tight mt-3">Spooling Hardware...</h2>
                                        <p className="text-sm text-cyan-200/60 font-semibold">Your print job {trackingOrderId} is being sent to the kiosk. Please wait...</p>
                                    </div>
                                </motion.div>
                            )}

                            {trackingOrderStatus === "PRINTING" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="w-64 h-64 mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                        <video 
                                            src={inVideo} 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">Printing in progress</span>
                                        <h2 className="text-3xl font-black tracking-tight mt-3 text-amber-300">Printing Document</h2>
                                        <p className="text-sm text-cyan-200/60 font-semibold">Hardware active. Please stay near the kiosk tray.</p>
                                        <p className="text-lg font-black text-white mt-4 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl max-w-xs mx-auto">
                                            {currentPagePrinted === 0 
                                                ? "Preparing printer..." 
                                                : <span>📄 Printing Page <span className="text-cyan-300">{currentPagePrinted}</span> of <span className="text-cyan-300">{totalPagesToPrint}</span></span>
                                            }
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {trackingOrderStatus === "COMPLETED" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="w-64 h-64 mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 flex items-center justify-center p-1">
                                        <video 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                            className="w-full h-full object-cover rounded-[20px]"
                                        >
                                            <source src={collectVideo} type="video/mp4" />
                                        </video>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">Ready for collection</span>
                                        <h2 className="text-4xl font-black tracking-tight mt-3 text-emerald-400">Collect Your Papers!</h2>
                                        <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                                            Your print job is completed! Please collect your papers from the printer tray.
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 pt-1">
                                            Total Pages: {totalPagesToPrint} · Order: {trackingOrderId}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setTrackingOrderId("");
                                            setTrackingOrderStatus("");
                                        }}
                                        className="mt-6 px-8 h-12 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer shadow-lg shadow-white/5"
                                    >
                                        Done / Dismiss
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default BlockSelection;
