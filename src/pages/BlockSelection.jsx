import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
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
  ArrowLeft
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
    const [pendingOrders, setPendingOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [inputOtp, setInputOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [otpTimeLeft, setOtpTimeLeft] = useState(0);

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
        if (!showOtpModal || !selectedOrderId) return;
        
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
    }, [showOtpModal, selectedOrderId, pendingOrders]);

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

    useEffect(() => {
        const fetchPendingOrders = async () => {
            if (!userId) return;
            try {
                const res = await api.get("/pdf/userOrders", { params: { userId } });
                const pending = (res.data || []).filter(
                    o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW"
                );
                setPendingOrders(pending);
            } catch (err) {
                console.error("Failed to fetch pending orders on mount:", err);
            }
        };

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
                    setShowOtpModal(true);
                    
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
            setOtpError("");
            setShowOtpModal(false);
            setInputOtp("");
            showAlert("Printing Started! 🖨️", "Successfully released your print job. Please collect your pages from the printer tray.", "success");
        } catch (err) {
            setOtpError(err.response?.data?.message || "Invalid OTP or Order.");
        } finally {
            setReleasing(false);
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

    return (
        <main className="min-h-screen bg-[#060B17] py-8 px-0 sm:px-4 md:px-8 xl:px-12 relative overflow-hidden font-sans text-white flex flex-col justify-between">
            {/* Styles for glassmorphism, background, and maintenance stamp */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background-color: #060B17;
                }
                .glass-panel {
                    background: rgba(18, 25, 45, 0.65);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
                }
                .glow-btn {
                    background: linear-gradient(135deg, #6C63FF 0%, #8B5CFF 100%);
                    box-shadow: 0 4px 20px rgba(108, 99, 255, 0.35);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glow-btn:hover {
                    box-shadow: 0 6px 24px rgba(108, 99, 255, 0.5);
                    transform: scale(1.03);
                }
                .maintenance-stamp {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-12deg);
                    border: 3px double #FF5C7A;
                    color: #FF5C7A;
                    background-color: rgba(255, 92, 122, 0.07);
                    font-family: 'Impact', sans-serif;
                    font-size: 22px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    padding: 8px 16px;
                    text-transform: uppercase;
                    border-radius: 4px;
                    box-shadow: 0 0 15px rgba(255, 92, 122, 0.15);
                    pointer-events: none;
                    z-index: 20;
                }
                .offline-stamp {
                    position: absolute;
                    top: 25px;
                    right: 15px;
                    transform: rotate(-12deg);
                    border: 3px double #94a3b8;
                    color: #94a3b8;
                    background-color: rgba(148, 163, 184, 0.07);
                    font-family: 'Impact', sans-serif;
                    font-size: 22px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    padding: 8px 16px;
                    text-transform: uppercase;
                    border-radius: 4px;
                    box-shadow: 0 0 15px rgba(148, 163, 184, 0.15);
                    pointer-events: none;
                    z-index: 20;
                }
                .online-stamp {
                    position: absolute;
                    top: 25px;
                    right: 15px;
                    transform: rotate(-12deg);
                    border: 3px double #37E67D;
                    color: #37E67D;
                    background-color: rgba(55, 230, 125, 0.07);
                    font-family: 'Impact', sans-serif;
                    font-size: 22px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    padding: 8px 16px;
                    text-transform: uppercase;
                    border-radius: 4px;
                    box-shadow: 0 0 15px rgba(55, 230, 125, 0.15);
                    pointer-events: none;
                    z-index: 20;
                }
                .notif-panel-enter { animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1); }
                @keyframes slideInRight { from { opacity:0; transform: translateX(24px); } to { opacity:1; transform: translateX(0); } }
            `}} />

            {/* Glowing Refined Accents */}
            <div className="absolute top-[-15%] left-[-15%] w-[65rem] h-[65rem] bg-indigo-500/[0.08] rounded-full blur-[190px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-15%] w-[55rem] h-[55rem] bg-purple-500/[0.07] rounded-full blur-[170px] pointer-events-none" />
            <div className="absolute top-[35%] right-[5%] w-[50rem] h-[50rem] bg-[#4F9DFF]/[0.06] rounded-full blur-[165px] pointer-events-none" />

            {/* Premium Cyber grid background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-30 pointer-events-none" />

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
                    className="w-full glass-panel py-4 px-6 rounded-2xl flex items-center justify-between gap-6 relative z-50"
                >
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse" />
                        <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#4F9DFF]">
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
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-900/60 border border-white/5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] transition-all"
                        />
                    </div>

                    {/* Profile & Dropdown Sign Out */}
                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setShowNotifPanel(true)}
                            className="relative w-10 h-10 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C7A] animate-pulse" />
                            )}
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-white/10 relative z-50">
                            <button 
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-2 text-left hover:opacity-90 transition-all bg-slate-900/40 p-1.5 rounded-xl border border-white/5"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#9F6BFF] flex items-center justify-center font-bold text-xs text-white shadow-md">
                                    {userName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="hidden sm:block text-xs font-bold text-slate-200">{userName}</span>
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
                            <p className="text-[16px] text-slate-400 font-medium leading-relaxed max-w-lg">
                                {selectedCollege 
                                    ? `Showing active printing blocks located in ${selectedCollege}. Choose a printer node to route your papers.`
                                    : "Pick your college campus. You will be redirected to choose block locations and spoolers within that campus."
                                }
                            </p>
                        </div>

                        {/* Direct action links */}
                        <div className="glass-panel p-6 rounded-[24px] flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400">Ready to upload files?</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Proceed to document upload directly</p>
                            </div>
                            <button 
                                onClick={() => navigate("/my-orders")}
                                className="px-5 h-11 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 hover:bg-slate-900 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all"
                            >
                                View Order History <ArrowRight className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Right (60% columns equivalent: Campus Map Satellite centerpiece) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.55 }}
                        className="lg:col-span-7 rounded-[26px] overflow-hidden border border-white/5 bg-[#12192D]/40 backdrop-blur-md relative h-[300px] lg:h-auto flex flex-col justify-end shadow-2xl group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#060B17] via-transparent to-transparent z-10 pointer-events-none" />
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 brightness-[0.85] group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                        >
                            <source src={mapPin} type="video/mp4" />
                        </video>

                        <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2.5 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-[#37E67D] animate-ping" />
                            <span className="text-[10px] font-extrabold tracking-widest text-[#37E67D] uppercase">CAMPUS MAP SATELLITE</span>
                        </div>

                        <div className="relative z-10 p-6 space-y-1 text-left bg-gradient-to-t from-[#12192D]/90 via-[#12192D]/60 to-transparent">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#4F9DFF]">Map Preview</p>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Campus Printer Grid Network <ExternalLink className="w-4 h-4 text-slate-400" />
                            </h3>
                        </div>
                    </motion.div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                    
                    {/* LEFT PANEL COLUMN (Occupies 3 columns) */}
                    <div className="lg:col-span-3 space-y-8">
                        
                        {/* Premium OTP Card */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="glass-panel p-6 rounded-[24px] text-left relative overflow-hidden border-[#F8B84E]/20 hover:border-[#F8B84E]/40 transition-all duration-300"
                        >
                            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-[#F8B84E]/10 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🔑</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#F8B84E] bg-[#F8B84E]/10 border border-[#F8B84E]/20 px-2.5 py-1 rounded-full">Secure release</span>
                            </div>

                            <h3 className="text-xl font-extrabold text-white mt-4 tracking-tight">Already Have an OTP?</h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Enter your code to release your queued print job instantly at any printer node.
                            </p>

                            <button 
                                onClick={handleOpenOtpModal}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#F8B84E] to-[#e0a030] text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-5 flex items-center justify-center gap-2 shadow-lg shadow-[#F8B84E]/20"
                            >
                                Verify OTP Code <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>


                    </div>

                    {/* RIGHT PANEL COLUMN (Occupies 7 columns) */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* CONDITIONAL VIEW 1: College Selection View (shown before college selection) */}
                        {!selectedCollege ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="border-b border-white/5 pb-4">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-white">Select Campus / College</h2>
                                    <p className="text-xs text-slate-400 mt-1 font-semibold">Choose a college campus to list its available blocks and printers</p>
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
                                                className="glass-panel p-8 rounded-[24px] text-left relative overflow-hidden transition-all duration-300 hover:shadow-2xl border-white/5 hover:border-white/15 w-full group flex flex-col justify-between min-h-[160px]"
                                            >
                                                <div className="absolute top-0 left-0 w-[4px] h-full" style={{backgroundColor: accent}} />
                                                <div className="space-y-2">
                                                    <span className="text-4xl">🏫</span>
                                                    <h3 className="text-2xl font-black text-white tracking-tight mt-3">{college} College</h3>
                                                    <p className="text-xs text-slate-400 font-semibold">Active campus printing grid counters</p>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400" style={{color: accent}}>
                                                        {count} Blocks Configured
                                                    </span>
                                                    <span className="text-xs font-bold text-[#4F9DFF] flex items-center gap-1">
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
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div>
                                        {(isAdminUser || !userCollege) && (
                                            <button 
                                                onClick={() => setSelectedCollege("")}
                                                className="text-xs font-bold text-[#4F9DFF] hover:underline flex items-center gap-1.5 mb-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Campus Directory
                                            </button>
                                        )}
                                        <h2 className="text-2xl font-extrabold tracking-tight text-white">Available Print Locations</h2>
                                        <p className="text-xs text-slate-400 mt-1 font-semibold">Select a building block within {selectedCollege} College</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredBlocks.map((block) => (
                                        <motion.div
                                            key={block.name}
                                            variants={cardHoverEffects}
                                            whileHover="hover"
                                            className="glass-panel rounded-[24px] overflow-hidden flex flex-col justify-between text-left group transition-all duration-300 hover:shadow-[0_16px_35px_rgba(0,0,0,0.5)] border-white/5 hover:border-[#6C63FF]/30 relative"
                                        >
                                            {/* Colored Header banner strip */}
                                            <div className="h-1.5 w-full" style={{backgroundColor: block.accent}} />

                                            {/* Stamp Overlays */}
                                            {block.maintenance ? (
                                                <div className="maintenance-stamp">
                                                    UNDER MAINTENANCE
                                                </div>
                                            ) : !block.isOnline ? (
                                                <div className="offline-stamp">
                                                    OFFLINE
                                                </div>
                                            ) : (
                                                <div className="online-stamp">
                                                    ONLINE
                                                </div>
                                            )}

                                            <div className="p-6 space-y-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl p-2.5 rounded-xl bg-slate-900/80 border border-white/5">{block.icon}</span>
                                                        <div>
                                                            <h4 className="text-xl font-bold text-white tracking-tight">{block.name}</h4>
                                                            <p className="text-sm text-slate-400 font-semibold">{block.description}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Grid (Without Distance field) */}
                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-[13px] text-slate-400">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Prints in Queue</p>
                                                        <p className="font-extrabold text-slate-200 mt-0.5">⏳ {block.queueCount} prints waiting</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Support Mode</p>
                                                        <p className="font-extrabold text-slate-200 mt-0.5">
                                                            {block.colorSupported ? "Color & BW Available" : "Only BW Available"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Paper Count</p>
                                                        <p className="font-extrabold text-[#37E67D] mt-0.5">
                                                            📄 {block.paperCount != null ? block.paperCount : 0} Sheets
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Printer Status</p>
                                                        <p className="font-extrabold text-slate-200 mt-0.5">
                                                            {block.isOnline ? "Ready to spool" : "Spooler offline"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Select button */}
                                                <button
                                                    onClick={() => selectBlock(block.name)}
                                                    className="w-full h-11 rounded-xl bg-slate-900/80 hover:bg-gradient-to-r hover:from-[#6C63FF] hover:to-[#8B5CFF] text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 border border-white/5 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 mt-4 flex items-center justify-center gap-2"
                                                    disabled={block.maintenance || !block.isOnline}
                                                    style={(block.maintenance || !block.isOnline) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
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
        </main>
    );
}

export default BlockSelection;
