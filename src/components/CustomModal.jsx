import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function CustomModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info", // "success" | "error" | "warning" | "info" | "confirm"
    onConfirm,
    confirmText = "OK",
    cancelText = "Cancel",
    children
}) {
    const iconMap = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ",
        confirm: "?"
    };

    const gradientMap = {
        success: "from-emerald-500 to-teal-600 shadow-emerald-500/30 text-emerald-100",
        error: "from-rose-500 to-red-600 shadow-rose-500/30 text-rose-100",
        warning: "from-amber-500 to-orange-600 shadow-amber-500/30 text-amber-100",
        info: "from-sky-500 to-blue-600 shadow-sky-500/30 text-sky-100",
        confirm: "from-slate-700 to-slate-900 shadow-slate-700/30 text-slate-100"
    };

    const iconColorMap = {
        success: "text-emerald-500 bg-emerald-50 border-emerald-100",
        error: "text-rose-500 bg-rose-50 border-rose-100",
        warning: "text-amber-500 bg-amber-50 border-amber-100",
        info: "text-sky-500 bg-sky-50 border-sky-100",
        confirm: "text-slate-600 bg-slate-50 border-slate-100"
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const handleDragEnd = (event, info) => {
        if (Math.abs(info.offset.y) > 140 || Math.abs(info.offset.x) > 140) {
            if (type !== "confirm") {
                onClose();
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
                    {/* Backdrop Click */}
                    <div className="absolute inset-0" onClick={type === "confirm" ? null : onClose} />

                    <motion.div
                        className="relative my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 cursor-grab active:cursor-grabbing"
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.6}
                        onDragEnd={handleDragEnd}
                        initial={{ scale: 0.93, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.93, opacity: 0, y: 15 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    >
                        {/* Confetti celebration shower for success type */}
                        {type === "success" && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                                {Array.from({ length: 30 }).map((_, i) => {
                                    const randomLeft = Math.random() * 100;
                                    const randomDelay = Math.random() * 1.2;
                                    const randomDuration = 1.5 + Math.random() * 1.5;
                                    const colors = ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];
                                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                    const randomSize = 6 + Math.random() * 8;
                                    const isCircle = Math.random() > 0.5;

                                    return (
                                        <div
                                            key={i}
                                            className="confetti-particle"
                                            style={{
                                                left: `${randomLeft}%`,
                                                backgroundColor: randomColor,
                                                width: `${randomSize}px`,
                                                height: `${randomSize}px`,
                                                borderRadius: isCircle ? '50%' : '2px',
                                                animationDelay: `${randomDelay}s`,
                                                animationDuration: `${randomDuration}s`
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-4 cursor-grab" />
                        
                        {type !== "confirm" && (
                            <div className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">
                                Swipe or drag away to dismiss
                            </div>
                        )}

                        <div className="flex flex-col items-center text-center">
                            {/* Icon Header */}
                            <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 ${iconColorMap[type]}`}>
                                {iconMap[type]}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-black text-slate-900 mb-2">
                                {title}
                            </h3>

                            {/* Message */}
                            {message && (
                                <p className="text-sm font-semibold text-slate-500 mb-6 whitespace-pre-wrap leading-relaxed">
                                    {message}
                                </p>
                            )}

                            {/* Children */}
                            {children && (
                                <div className="w-full mb-6 text-left">
                                    {children}
                                </div>
                            )}

                            {/* Buttons Footer */}
                            <div className="flex flex-col sm:flex-row w-full gap-3">
                                {type === "confirm" ? (
                                    <>
                                        <button
                                            onClick={onClose}
                                            className="btn secondary flex-1 w-full"
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="btn success flex-1 w-full"
                                        >
                                            {confirmText}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className={`btn w-full ${
                                            type === "error"
                                                ? "danger"
                                                : type === "warning"
                                                ? "warning"
                                                : type === "success"
                                                ? "success"
                                                : ""
                                        }`}
                                    >
                                        {confirmText}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default CustomModal;
