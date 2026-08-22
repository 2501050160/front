import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api, { API_BASE } from "../services/api";
import { getBlockTheme } from "../config/blockThemes";
import studentAd from "../assets/cloud_print_student_offers_ad.png";
import collectVideo from "../assets/collect.mp4";
import inVideo from "../assets/in.mp4";

function DisplayPanel() {
    const [orders, setOrders] = useState([]);
    const [displayBlock, setDisplayBlock] = useState(localStorage.getItem("selectedDisplayBlock") || "");
    const [blocks, setBlocks] = useState([]);
    const [slideIndex, setSlideIndex] = useState(0);
    const [pickupQueue, setPickupQueue] = useState([]);
    const [activePickup, setActivePickup] = useState(null);
    const [displayAdPhotoEnabled, setDisplayAdPhotoEnabled] = useState(true);
    const [queuePageIndex, setQueuePageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenAd, setShowFullscreenAd] = useState(false);
    const [isReleasing, setIsReleasing] = useState(true);
    const [totalPagesToPrint, setTotalPagesToPrint] = useState(1);
    const [currentPagePrinted, setCurrentPagePrinted] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    const parseBackendDate = (dateVal) => {
        if (!dateVal) return null;
        if (Array.isArray(dateVal)) {
            const [y, m, d, hr, min, sec] = dateVal;
            return new Date(y, m - 1, d, hr || 0, min || 0, sec || 0);
        }
        if (typeof dateVal === "string") {
            const cleanStr = dateVal.replace(" ", "T");
            return new Date(cleanStr);
        }
        return new Date(dateVal);
    };

    const getOtpExpiryFormatted = (order) => {
        let expireTimestamp;
        const baseDate = order.fileExpiryTime || order.cancelWindowEndsAt || order.paidAt || order.queuedAt || order.uploadTime || order.createdAt;
        if (baseDate) {
            const dateObj = parseBackendDate(baseDate);
            if (dateObj && !isNaN(dateObj.getTime())) {
                if (order.fileExpiryTime && baseDate === order.fileExpiryTime) {
                    expireTimestamp = dateObj.getTime();
                } else {
                    expireTimestamp = dateObj.getTime() + 10 * 60 * 1000; // 10-minute OTP expiration window
                }
            }
        }
        if (!expireTimestamp) {
            expireTimestamp = Date.now() + 10 * 60 * 1000;
        }

        let leftSeconds = Math.floor((expireTimestamp - currentTime) / 1000);
        // Safety guard: OTP window is maximum 10 minutes (600s). Clamp clock drift.
        if (leftSeconds > 600) {
            leftSeconds = 600;
        }
        if (leftSeconds <= 0) {
            return "Expired";
        }
        const mins = Math.floor(leftSeconds / 60);
        const secs = leftSeconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);
            if (!isFull) {
                // Auto-logout when exiting fullscreen for security
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRole");
                localStorage.removeItem("adminUser");
                localStorage.removeItem("adminCollege");
                window.location.href = "/admin-login";
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (displayAdPhotoEnabled) {
                setShowFullscreenAd(true);
                setTimeout(() => {
                    setShowFullscreenAd(false);
                }, 4000); // show ad for 4 seconds
            }
        }, 14000); // 10 seconds showing queue + 4 seconds showing ad
        return () => clearInterval(interval);
    }, [displayAdPhotoEnabled]);

    const theme = getBlockTheme(displayBlock);
    const welcomeSlides = theme.slides;

    const previousStatusesRef = useRef(new Map());
    const timersRef = useRef([]);

    useEffect(() => {
        const role = localStorage.getItem("adminRole");
        const college = localStorage.getItem("adminCollege");

        // We'll set a cleanup function so if the user navigates away (e.g. Back button) they are logged out
        const cleanup = () => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminRole");
            localStorage.removeItem("adminUser");
            localStorage.removeItem("adminCollege");
        };

        const fetchBlocks = async () => {
            try {
                const response = await api.get("/blocks/all");
                let fetchedBlocks = response.data;
                
                // Filter blocks based on captured college if sub-admin
                if (role === "SUB_ADMIN" && college) {
                    fetchedBlocks = fetchedBlocks.filter(b => b.college === college);
                }
                
                setBlocks(fetchedBlocks);
                if (fetchedBlocks.length > 0) {
                    const names = fetchedBlocks.map(b => b.name);
                    const saved = localStorage.getItem("selectedDisplayBlock");
                    if (saved && names.includes(saved)) {
                        setDisplayBlock(saved);
                    } else if (!names.includes(displayBlock)) {
                        setDisplayBlock(names[0]);
                        localStorage.setItem("selectedDisplayBlock", names[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch blocks", err);
            }
        };
        fetchBlocks();

        return cleanup;
    }, []);

    useEffect(() => {
        if (displayBlock) {
            localStorage.setItem("selectedDisplayBlock", displayBlock);
        }
    }, [displayBlock]);

    useEffect(() => {
        setSlideIndex(0);
    }, [displayBlock]);

    useEffect(() => {
        // Initial fetch when display panel loads or block changes
        fetchOrders();

        // Real-Time Event-Driven Updates: Update ONLY when a user sends an order or status changes
        const sseUrl = `${API_BASE}/api/sse/stream`;
        let eventSource = null;

        try {
            eventSource = new EventSource(sseUrl);

            eventSource.onmessage = () => {
                fetchOrders();
            };

            eventSource.addEventListener("ORDER_UPDATED", () => {
                fetchOrders();
            });

            eventSource.addEventListener("QUEUE_UPDATED", () => {
                fetchOrders();
            });

            eventSource.addEventListener("PRINTER_ALERT", () => {
                fetchOrders();
            });

            eventSource.onerror = () => {
                // Connection auto-reconnects in background if network drops
            };
        } catch (e) {
            console.warn("SSE EventSource initialization note:", e);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
            timersRef.current.forEach(clearTimeout);
        };
    }, [displayBlock]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((current) =>
                (current + 1) % welcomeSlides.length
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [welcomeSlides.length]);

    useEffect(() => {
        if (activePickup || pickupQueue.length === 0) {
            return;
        }

        const [nextPickup, ...remaining] = pickupQueue;
        setActivePickup(nextPickup);
        setPickupQueue(remaining);

        // Display "Your print job is ready!" for 6 seconds, then cleanly return to live queue
        const timer = setTimeout(() => {
            setActivePickup(null);
            fetchOrders();
        }, 6000);

        return () => clearTimeout(timer);
    }, [pickupQueue, activePickup]);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/orders", {
                params: { t: Date.now() }
            });
            const incomingOrders = response.data || [];

            detectCompletedOrders(incomingOrders);
            setOrders(incomingOrders);

            // Fetch public settings for ad photo status
            api.get("/system/settings").then(res => {
                if (res.data && res.data.displayAdPhotoEnabled !== undefined) {
                    setDisplayAdPhotoEnabled(res.data.displayAdPhotoEnabled);
                }
            }).catch(() => {});
        } catch (error) {
            console.error(error);
        }
    };

    const detectCompletedOrders = (incomingOrders) => {
        const nextStatuses = new Map();

        incomingOrders.forEach((order) => {
            const location = order.blockLocation;

            if (location !== displayBlock) {
                return;
            }

            const previousStatus = previousStatusesRef.current.get(order.id);
            const isPrintingOrCompleted = order.status === "PRINTING" || order.status === "COMPLETED";
            const wasPrintingOrCompleted = previousStatus === "PRINTING" || previousStatus === "COMPLETED";

            if (
                previousStatus &&
                !wasPrintingOrCompleted &&
                isPrintingOrCompleted &&
                order.paymentStatus === "PAID"
            ) {
                setPickupQueue((currentQueue) => [
                    ...currentQueue,
                    order
                ]);
            }

            nextStatuses.set(order.id, order.status);
        });

        previousStatusesRef.current = nextStatuses;
    };



    const queueOrders = orders
        .filter(
            (order) =>
                order.paymentStatus === "PAID" &&
                ["PENDING_SCAN", "CANCEL_WINDOW", "QUEUE", "PRINTING"].includes(
                    order.status
                ) &&
                order.blockLocation === displayBlock
        )
        .sort((a, b) => a.id - b.id);

    const currentOrder =
        queueOrders.find((order) => order.status === "PRINTING") ||
        queueOrders.find((order) => order.status === "QUEUE");

    const waitingOrders = queueOrders.filter(
        (order) => order.id !== currentOrder?.id
    );

    const hasActiveOrPendingOrders = queueOrders.length > 0;

    useEffect(() => {
        setQueuePageIndex(0);
        if (waitingOrders.length <= 4) {
            return;
        }
        const interval = setInterval(() => {
            setQueuePageIndex((prev) => {
                const totalPages = Math.ceil(waitingOrders.length / 4);
                return (prev + 1) % totalPages;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [waitingOrders.length, displayBlock]);

    const currentSlide = welcomeSlides[slideIndex];

    return (
        <main
            className="display-shell min-h-screen overflow-hidden text-white"
            style={{ background: theme.background }}
        >
            <motion.div
                className="display-orb display-orb-one"
                style={{ background: theme.accentSoft }}
                animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="display-orb display-orb-two"
                style={{ background: theme.glow, opacity: 0.16 }}
                animate={{ x: [0, -50, 0], y: [0, 35, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="display-grid-overlay" />

            <section className="relative z-10 flex min-h-screen flex-col p-3 md:p-4">
                <motion.header
                    className="flex flex-wrap items-center justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <p
                            className="text-xs font-black uppercase tracking-[0.22em]"
                            style={{ color: theme.accent }}
                        >
                            {theme.label}
                        </p>
                        <h1 className="mt-1 text-2xl font-black md:text-4xl">
                            {displayBlock}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleFullscreen}
                            className="display-select font-black text-xs uppercase tracking-widest px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg cursor-pointer"
                        >
                            {isFullscreen ? "🗖 Windowed" : "🖥️ Fullscreen"}
                        </button>

                        <div className="display-select-wrap">
                            <span className="text-sm font-black uppercase tracking-widest text-slate-200">
                                Block
                            </span>
                            <select
                                value={displayBlock}
                                onChange={(e) => setDisplayBlock(e.target.value)}
                                className="display-select"
                            >
                                {blocks.map((block) => (
                                    <option key={block.id} value={block.name}>
                                        {block.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.header>

                <div className={`grid ${(hasActiveOrPendingOrders && !activePickup) ? "grid-cols-1" : activePickup ? "lg:grid-cols-[1fr_1.3fr]" : "lg:grid-cols-[1.7fr_1fr]"} gap-6 flex-1 pt-3 pb-4 w-full`}>
                    {/* Left Column: Active order queue / Welcome message / Pickup alert */}
                    <div className={`flex flex-col w-full ${(hasActiveOrPendingOrders && !activePickup) ? "justify-start" : "justify-center"}`}>
                        <AnimatePresence mode="wait">
                            {activePickup ? (
                                <motion.div
                                    key={`pickup-${activePickup.id}`}
                                    className="display-glass w-full max-w-none p-10 text-center mx-auto"
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                >
                                    <div className="relative z-10 w-full">
                                        <p className="text-sm font-black uppercase tracking-[0.25em] text-green-300">
                                            Ready for collection
                                        </p>
                                        <h2 className="mt-3 text-4xl font-black md:text-6xl text-white">
                                            {activePickup.orderId}
                                        </h2>
                                        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                                            <p className="text-2xl font-black text-cyan-100 md:text-4xl">
                                                {formatStudentDisplayName(activePickup.customerName)}
                                            </p>
                                            {isWhatsAppOrder(activePickup) ? (
                                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-black bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/50 shadow-md">
                                                    💬 WhatsApp Payment (₹{(activePickup.price != null ? activePickup.price : 0).toFixed(2)})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-sm font-black bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-md">
                                                    🌐 Web App Payment (₹{(activePickup.price != null ? activePickup.price : 0).toFixed(2)})
                                                </span>
                                            )}
                                        </div>
                                        <motion.div
                                            className="mx-auto mt-6 max-w-xl rounded-2xl border overflow-hidden border-green-300/40 bg-green-400/15"
                                            animate={{
                                                boxShadow: [
                                                    "0 0 0 rgba(74,222,128,0)",
                                                    "0 0 24px rgba(74,222,128,0.25)",
                                                    "0 0 0 rgba(74,222,128,0)"
                                                ]
                                            }}
                                            transition={{ duration: 1.8, repeat: Infinity }}
                                        >
                                            <div className="w-full h-48 relative border-b border-white/10 bg-slate-950/40">
                                                <video 
                                                    src={collectVideo} 
                                                    autoPlay 
                                                    loop 
                                                    muted 
                                                    playsInline 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-6">
                                                <p className="text-base font-black text-green-100">
                                                    Your print job is ready! Please collect your sheets from the output tray.
                                                </p>
                                                <p className="mt-2 text-xs font-bold text-white/60">
                                                    This screen will return to the live queue shortly.
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ) : hasActiveOrPendingOrders ? (
                                <motion.div
                                    key={`queue-${displayBlock}`}
                                    className="grid gap-4 w-full max-w-none mx-auto"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {currentOrder && (
                                        <section className="display-glass relative overflow-hidden p-7">
                                            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: theme.accent }} />
                                            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                                            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/14 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                                                            Live Print
                                                        </span>
                                                        <span className="rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-50/70">
                                                            {currentOrder.status === "PRINTING" ? "In Progress" : currentOrder.status === "CANCEL_WINDOW" ? "Confirming" : "Next Up"}
                                                        </span>
                                                    </div>

                                                    <motion.h2
                                                        key={currentOrder.orderId}
                                                        className="mt-4 break-all text-5xl font-black leading-none md:text-7xl"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                    >
                                                        {currentOrder.orderId}
                                                    </motion.h2>

                                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                        <p className="text-3xl font-black text-cyan-50">
                                                            {formatStudentDisplayName(currentOrder.customerName)}
                                                        </p>
                                                        {isWhatsAppOrder(currentOrder) ? (
                                                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black bg-[#25D366] text-slate-950 border border-[#25D366] shadow-lg">
                                                                💬 WHATSAPP ORDER • ₹{(currentOrder.price != null ? currentOrder.price : 0).toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm">
                                                                🌐 WEB APP ORDER • ₹{(currentOrder.price != null ? currentOrder.price : 0).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        ["Pages", currentOrder.selectedPages || "ALL"],
                                                        ["Copies", currentOrder.copies || 1],
                                                        ["Print Type", currentOrder.printType || "BW"],
                                                        ["Channel", isWhatsAppOrder(currentOrder) ? "💬 WhatsApp" : "🌐 Web Portal"]
                                                    ].map(([label, value]) => (
                                                        <div
                                                            key={label}
                                                            className={`rounded-2xl border ${isWhatsAppOrder(currentOrder) && label === "Channel" ? "border-[#25D366]/50 bg-[#25D366]/15" : "border-white/12 bg-slate-950/28"} p-3.5 backdrop-blur`}
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-50/58">
                                                                {label}
                                                            </p>
                                                            <p className={`mt-0.5 text-xl font-black ${isWhatsAppOrder(currentOrder) && label === "Channel" ? "text-[#25D366]" : "text-white"} truncate`}>
                                                                {value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="relative z-10 mt-7 h-3 overflow-hidden rounded-full bg-white/10">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: isWhatsAppOrder(currentOrder) ? "#25D366" : theme.accent }}
                                                    animate={{ x: ["-100%", "120%"] }}
                                                    transition={{
                                                        duration: 1.6,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            </div>
                                        </section>
                                    )}

                                    <section className="display-glass overflow-hidden p-0">
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                                            <div className="px-6 pt-5 pb-0">
                                                <p
                                                    className="text-sm font-black uppercase tracking-[0.25em]"
                                                    style={{ color: theme.accent }}
                                                >
                                                    Professional Queue
                                                </p>
                                                <h3 className="mt-2 text-3xl font-black md:text-4xl">
                                                    Orders Waiting
                                                </h3>
                                                <p className="mt-1 text-sm font-bold text-cyan-50/60">
                                                    Students can find their queue position here. For WhatsApp orders, reply with your 4-digit OTP directly in WhatsApp to release prints!
                                                </p>
                                            </div>
                                            <div className="flex gap-3 px-6 pt-5 pb-0">
                                                <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-center">
                                                    <p className="text-3xl font-black text-white">{queueOrders.length}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-50/58">Total</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-center">
                                                    <p className="text-3xl font-black text-white">{waitingOrders.length}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-50/58">Waiting</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="overflow-hidden rounded-3xl border border-white/12 bg-slate-950/26">
                                                <div className="grid grid-cols-[60px_1.1fr_1.3fr_180px_130px_60px] gap-0 border-b border-white/10 bg-white/10 px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-50/62">
                                                    <span>Pos</span>
                                                    <span>Order & Channel</span>
                                                    <span>Student</span>
                                                    <span className="text-center">OTP / Status</span>
                                                    <span className="text-center">OTP Expiry</span>
                                                    <span className="text-right">Pages</span>
                                                </div>

                                                <div className="space-y-3 p-3">
                                                    {waitingOrders.slice(queuePageIndex * 4, (queuePageIndex + 1) * 4).map((order, index) => {
                                                        const isPendingScan = order.status === "PENDING_SCAN";
                                                        const isWA = isWhatsAppOrder(order);
                                                        const queuePalettes = [
                                                            {
                                                                rail: "from-cyan-300 to-blue-500",
                                                                row: "from-cyan-500/24 via-blue-500/14 to-slate-950/14",
                                                                badge: "border-cyan-200/45 bg-cyan-300/20 text-cyan-50",
                                                                chip: "border-cyan-200/45 bg-cyan-300/18 text-cyan-50",
                                                                glow: "shadow-cyan-500/20"
                                                            },
                                                            {
                                                                rail: "from-emerald-300 to-lime-400",
                                                                row: "from-emerald-500/24 via-lime-500/12 to-slate-950/14",
                                                                badge: "border-emerald-200/45 bg-emerald-300/20 text-emerald-50",
                                                                chip: "border-emerald-200/45 bg-emerald-300/18 text-emerald-50",
                                                                glow: "shadow-emerald-500/20"
                                                            },
                                                            {
                                                                rail: "from-fuchsia-300 to-pink-500",
                                                                row: "from-fuchsia-500/24 via-pink-500/12 to-slate-950/14",
                                                                badge: "border-fuchsia-200/45 bg-fuchsia-300/20 text-fuchsia-50",
                                                                chip: "border-fuchsia-200/45 bg-fuchsia-300/18 text-fuchsia-50",
                                                                glow: "shadow-fuchsia-500/20"
                                                            },
                                                            {
                                                                rail: "from-amber-300 to-orange-500",
                                                                row: "from-amber-500/26 via-orange-500/12 to-slate-950/14",
                                                                badge: "border-amber-200/45 bg-amber-300/20 text-amber-50",
                                                                chip: "border-amber-200/45 bg-amber-300/18 text-amber-50",
                                                                glow: "shadow-amber-500/20"
                                                            },
                                                            {
                                                                rail: "from-violet-300 to-indigo-500",
                                                                row: "from-violet-500/24 via-indigo-500/12 to-slate-950/14",
                                                                badge: "border-violet-200/45 bg-violet-300/20 text-violet-50",
                                                                chip: "border-violet-200/45 bg-violet-300/18 text-violet-50",
                                                                glow: "shadow-violet-500/20"
                                                            },
                                                            {
                                                                rail: "from-rose-300 to-red-500",
                                                                row: "from-rose-500/24 via-red-500/12 to-slate-950/14",
                                                                badge: "border-rose-200/45 bg-rose-300/20 text-rose-50",
                                                                chip: "border-rose-200/45 bg-rose-300/18 text-rose-50",
                                                                glow: "shadow-rose-500/20"
                                                            }
                                                        ];
                                                        const queuePosition = queuePageIndex * 4 + index + 1;
                                                        const palette = queuePalettes[(queuePosition - 1) % queuePalettes.length];
                                                        return (
                                                            <motion.div
                                                                key={order.id}
                                                                className={`relative grid grid-cols-[60px_1.1fr_1.3fr_180px_130px_60px] items-center gap-0 overflow-hidden rounded-2xl border ${isWA ? "border-[#25D366]/50 bg-gradient-to-r from-[#25D366]/20 via-emerald-950/40 to-slate-950/20 shadow-[#25D366]/20 ring-1 ring-[#25D366]/30" : `border-white/12 bg-gradient-to-r ${palette.row} ${palette.glow}`} px-5 py-4 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:shadow-2xl`}
                                                                initial={{ opacity: 0, x: -18 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.04 }}
                                                            >
                                                                <div className={`absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b ${isWA ? "from-[#25D366] via-emerald-400 to-green-500" : palette.rail}`} />
                                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.08),transparent_45%)]" />
                                                                <div>
                                                                    <span className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-xl font-black shadow-lg ${isWA ? "border-[#25D366]/60 bg-[#25D366]/30 text-emerald-200" : palette.badge}`}>
                                                                        {queuePosition}
                                                                    </span>
                                                                </div>
                                                                <div className="relative min-w-0 pr-2">
                                                                    <p className="truncate text-xl font-black leading-none text-white">
                                                                        {order.orderId}
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                                        {isWA ? (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#25D366] text-slate-950 shadow-md">
                                                                                💬 WHATSAPP • ₹{(order.price != null ? order.price : 0).toFixed(2)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm">
                                                                                🌐 WEB APP • ₹{(order.price != null ? order.price : 0).toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="relative min-w-0 pr-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <p className="truncate text-lg font-black text-white">
                                                                            {formatStudentDisplayName(order.customerName)}
                                                                        </p>
                                                                    </div>
                                                                    <p className="mt-1 text-[10px] font-bold text-white/50">
                                                                        {order.printType || "BW"} • {order.copies || 1} copies
                                                                    </p>
                                                                </div>
                                                                <div className="relative text-center">
                                                                    {isPendingScan ? (
                                                                        <div className={`rounded-2xl border px-3 py-2 shadow-lg ${isWA ? "border-[#25D366]/50 bg-[#25D366]/20" : palette.chip} ${palette.glow} flex flex-col items-center justify-center`}>
                                                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isWA ? "text-[#25D366]" : "text-cyan-200/80"} leading-none`}>
                                                                                {isWA ? "REPLY IN WA" : "RELEASE OTP"}
                                                                            </p>
                                                                            <p className={`font-mono ${isWA ? "text-sm tracking-normal text-emerald-300" : "text-2xl tracking-widest text-white"} font-black mt-1 leading-none`}>
                                                                                {isWA ? "💬 Enter in WA" : order.otpCode}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`rounded-2xl border px-4 py-3 shadow-lg ${palette.chip} ${palette.glow}`}>
                                                                            <p className="text-xl font-black uppercase tracking-wider text-white">
                                                                                {order.status === "PRINTING" ? "Printing" : order.status === "CANCEL_WINDOW" ? "Confirming" : "Waiting"}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="relative text-center">
                                                                    {isPendingScan ? (
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300/80">Expires In</span>
                                                                            <span className="font-mono text-base font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg mt-0.5 shadow-sm">
                                                                                ⏱️ {getOtpExpiryFormatted(order)}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-white/40">—</span>
                                                                    )}
                                                                </div>
                                                                <div className="relative text-right">
                                                                    <p className="text-2xl font-black text-white leading-none">
                                                                        {order.totalPages ? order.totalPages * (order.copies || 1) : "—"}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-white/40 leading-none mt-0.5">pg</p>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}

                                                    {waitingOrders.length === 0 && (
                                                        <div className="p-12 text-center text-2xl font-black text-slate-300">
                                                            No waiting orders
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={`welcome-${displayBlock}-${slideIndex}`}
                                    className="display-glass w-full max-w-5xl p-10 text-center mx-auto"
                                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -24, scale: 0.98 }}
                                    transition={{ duration: 0.55 }}
                                >
                                    <motion.p
                                        className="text-lg font-black uppercase tracking-[0.25em]"
                                        style={{ color: theme.accent }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        Welcome
                                    </motion.p>
                                    <motion.h2
                                        className="mt-3 text-3xl font-black leading-tight md:text-5xl"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 }}
                                    >
                                        {currentSlide.title}
                                    </motion.h2>
 
                                     <motion.p
                                        className="mx-auto mt-4 max-w-2xl text-base font-bold leading-relaxed text-slate-200 md:text-lg"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.16 }}
                                    >
                                        {currentSlide.text}
                                    </motion.p>

                                    <div className="mt-10 flex justify-center gap-3">
                                        {welcomeSlides.map((slide, index) => (
                                            <motion.span
                                                key={slide.title}
                                                className="rounded-full"
                                                style={{
                                                    background:
                                                        index === slideIndex
                                                            ? theme.accent
                                                            : "rgba(255,255,255,0.25)"
                                                }}
                                                animate={{
                                                    width:
                                                        index === slideIndex
                                                            ? 48
                                                            : 12,
                                                    height: 12
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Premium ambient loop video presentation */}
                    {(!hasActiveOrPendingOrders || activePickup) && (
                        <div className="hidden lg:block relative overflow-hidden h-[calc(100vh-210px)] w-full rounded-3xl">
                            <video
                                key={activePickup ? "collect" : "ambient"}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-80"
                            >
                                <source src={activePickup ? collectVideo : "/assets/printer_rollers.mp4"} type="video/mp4" />
                            </video>
                            {/* Smooth horizontal gradient overlay that blends into the background on the left side */}
                            <div 
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(to right, ${theme.background} 0%, ${theme.background}40 40%, transparent 100%)`
                                }}
                            />
                        </div>
                    )}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">
                    <span>Cloud Print · {displayBlock}</span>
                    <span className="text-cyan-300 font-black normal-case tracking-normal">🌐 Upload & Print: {window.location.host}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                </footer>
            </section>


            <AnimatePresence>
                {false && showFullscreenAd && !activePickup && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4">
                            <img
                                src={studentAd}
                                alt="Special Offers"
                                className="w-full h-full object-contain rounded-3xl border border-white/10 shadow-2xl"
                            />
                            {/* Countdown banner */}
                            <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-black text-slate-300">
                                Returning to Queue soon...
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default DisplayPanel;
