import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import QueueCard from "../components/QueueCard";
import { getBlockTheme } from "../config/blockThemes";
import studentAd from "../assets/cloud_print_student_offers_ad.png";
import collectVideo from "../assets/collect.mp4";

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
        fetchOrders();

        const interval = setInterval(fetchOrders, 3000);

        return () => {
            clearInterval(interval);
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
        setTotalPagesToPrint(nextPickup.totalPages || 1);
        setCurrentPagePrinted(1);
        setIsReleasing(true);
        setPickupQueue(remaining);
    }, [pickupQueue, activePickup]);

    useEffect(() => {
        if (!activePickup || !isReleasing) return;

        const interval = setInterval(() => {
            setCurrentPagePrinted(prev => {
                if (prev >= totalPagesToPrint) {
                    clearInterval(interval);
                    setIsReleasing(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 5500);

        return () => clearInterval(interval);
    }, [activePickup, isReleasing, totalPagesToPrint]);

    useEffect(() => {
        if (!activePickup || isReleasing) return;

        const timer = setTimeout(() => {
            setActivePickup(null);
            window.location.reload();
        }, 10000);

        return () => clearTimeout(timer);
    }, [activePickup, isReleasing]);

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

            const previousStatus =
                previousStatusesRef.current.get(order.id);

            if (
                previousStatus &&
                previousStatus !== "COMPLETED" &&
                order.status === "COMPLETED" &&
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
        if (waitingOrders.length <= 6) {
            return;
        }
        const interval = setInterval(() => {
            setQueuePageIndex((prev) => {
                const totalPages = Math.ceil(waitingOrders.length / 6);
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

                <div className={`grid ${(hasActiveOrPendingOrders && !activePickup) ? "grid-cols-1" : activePickup ? "lg:grid-cols-[1fr_1.3fr]" : "lg:grid-cols-[1.7fr_1fr]"} gap-8 flex-1 py-8 w-full`}>
                    {/* Left Column: Active order queue / Welcome message / Pickup alert */}
                    <div className="flex flex-col justify-center w-full">
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
                                        <p className={`text-sm font-black uppercase tracking-[0.25em] ${isReleasing ? "text-amber-400" : "text-green-300"}`}>
                                            {isReleasing ? "Printing in progress" : "Ready for collection"}
                                        </p>
                                        <h2 className="mt-3 text-4xl font-black md:text-6xl">
                                            {activePickup.orderId}
                                        </h2>
                                        <p className="mt-2 text-2xl font-black text-cyan-100 md:text-4xl">
                                            {activePickup.customerName || "Customer"}
                                        </p>
                                        <motion.div
                                            className={`mx-auto mt-6 max-w-xl rounded-xl border p-4 ${isReleasing ? "border-amber-400/40 bg-amber-400/10" : "border-green-300/40 bg-green-400/15"}`}
                                            animate={{
                                                boxShadow: isReleasing 
                                                    ? [
                                                        "0 0 0 rgba(245,158,11,0)",
                                                        "0 0 24px rgba(245,158,11,0.2)",
                                                        "0 0 0 rgba(245,158,11,0)"
                                                      ]
                                                    : [
                                                        "0 0 0 rgba(74,222,128,0)",
                                                        "0 0 24px rgba(74,222,128,0.2)",
                                                        "0 0 0 rgba(74,222,128,0)"
                                                      ]
                                            }}
                                            transition={{ duration: 1.8, repeat: Infinity }}
                                        >
                                            <p className="text-base font-bold text-slate-100">
                                                {isReleasing 
                                                    ? "Printing document pages... Please wait."
                                                    : "Your printing is completed! Please collect your papers from the printer tray."}
                                            </p>
                                            <div className={`mt-2 flex flex-col items-center justify-center gap-1.5 text-xs font-bold ${isReleasing ? "text-amber-400" : "text-green-300"}`}>
                                                <span>{isReleasing ? "🖨️ Hardware releasing prints..." : "🖨️ Counter Release successful"}</span>
                                                {isReleasing && (
                                                    <span className="text-lg font-black text-white mt-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl">
                                                        📄 Printing Page {currentPagePrinted} of {totalPagesToPrint}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ) : hasActiveOrPendingOrders ? (
                                <motion.div
                                    key={`queue-${displayBlock}`}
                                    className="grid gap-6 w-full max-w-none mx-auto"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {currentOrder && (
                                        <section className="display-glass p-8 relative overflow-hidden">
                                            <div className="absolute right-4 top-4 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-black uppercase text-emerald-300 animate-pulse">
                                                Active
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                                                Currently Printing
                                            </p>
                                            <p className="mt-2 text-sm font-bold text-white/60">
                                                {currentOrder.status === "PRINTING"
                                                    ? "Printing in progress..."
                                                    : currentOrder.status ===
                                                      "CANCEL_WINDOW"
                                                    ? "Confirming Payment"
                                                    : "Up Next"}
                                            </p>

                                            <motion.h2
                                                key={currentOrder.orderId}
                                                className="mt-3 text-4xl font-black md:text-6xl"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {currentOrder.orderId}
                                            </motion.h2>

                                            <p className="mt-2 text-2xl font-black text-white/90">
                                                {currentOrder.customerName || "Customer"}
                                            </p>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                {[
                                                    ["Pages", currentOrder.selectedPages],
                                                    ["Copies", currentOrder.copies],
                                                    ["Type", currentOrder.printType]
                                                ].map(([label, value]) => (
                                                    <div
                                                        key={label}
                                                        className="rounded-xl bg-white/10 p-3 backdrop-blur"
                                                    >
                                                        <p className="text-xs font-bold text-slate-300">
                                                            {label}
                                                        </p>
                                                        <p className="mt-1 text-xl font-black">
                                                            {value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: theme.accent }}
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

                                    <section className="display-glass p-8">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p
                                                    className="text-sm font-black uppercase tracking-[0.25em]"
                                                    style={{ color: theme.accent }}
                                                >
                                                    Queue
                                                </p>
                                                <h3 className="mt-2 text-3xl font-black">
                                                    Next Orders
                                                </h3>
                                            </div>
                                            <span
                                                className="rounded-full px-4 py-2 text-lg font-black text-slate-950"
                                                style={{ background: theme.accent }}
                                            >
                                                {queueOrders.length}
                                            </span>
                                        </div>

                                        <div className={`mt-6 grid gap-6 ${
                                            waitingOrders.length === 1 ? "grid-cols-1" :
                                            waitingOrders.length === 2 ? "grid-cols-2" :
                                            waitingOrders.length === 3 ? "grid-cols-3" :
                                            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                        }`}>
                                            {waitingOrders.slice(queuePageIndex * 6, (queuePageIndex + 1) * 6).map((order, index) => (
                                                <QueueCard
                                                    key={order.id}
                                                    order={order}
                                                    index={index}
                                                />
                                            ))}

                                            {waitingOrders.length === 0 && (
                                                <div className="col-span-full rounded-xl bg-white/10 p-10 text-center text-2xl font-black text-slate-300">
                                                    No waiting orders
                                                </div>
                                            )}
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

             <motion.div 
                 drag
                 dragMomentum={false}
                 className="fixed bottom-16 left-6 z-40 flex items-center gap-4 p-4 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-2xl max-w-sm transition-all hover:scale-105 cursor-grab active:cursor-grabbing"
             >
                 <div className="p-1.5 bg-white rounded-lg shadow-md shrink-0">
                     <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin)}&color=0f172a`} 
                         alt="Kiosk QR Code"
                         className="w-[100px] h-[100px] block"
                     />
                 </div>
                 <div className="text-left">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                         No App Needed
                     </span>
                     <h4 className="text-base font-black text-white mt-2">
                         Scan to Print
                     </h4>
                     <p className="text-[10px] font-bold text-slate-400 mt-1">
                         Website Link:
                     </p>
                     <code className="text-xs font-black text-cyan-300 block mt-0.5 select-all">
                         www.saipraveen.site
                     </code>
                 </div>
             </motion.div>

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
