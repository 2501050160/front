import React, { useEffect } from "react";
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
    duration = 4500,
    children
}) {
    // Auto-dismiss non-confirm popup notifications after 4.5 seconds
    useEffect(() => {
        if (isOpen && type !== "confirm") {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, type, duration, onClose]);

    const iconMap = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ",
        confirm: "?"
    };

    const toastBgMap = {
        success: "border-emerald-500/40 bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-slate-900/95 text-white shadow-emerald-500/10",
        error: "border-rose-500/40 bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-slate-900/95 text-white shadow-rose-500/10",
        warning: "border-amber-500/40 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-slate-900/95 text-white shadow-amber-500/10",
        info: "border-sky-500/40 bg-gradient-to-r from-sky-950/95 via-slate-900/95 to-slate-900/95 text-white shadow-sky-500/10",
        confirm: "border-slate-700 bg-slate-900 text-white"
    };

    const iconBadgeMap = {
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        error: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        info: "bg-sky-500/20 text-sky-400 border-sky-500/30",
        confirm: "bg-slate-800 text-slate-300 border-slate-700"
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    if (!isOpen) return null;

    // Render non-intrusive bottom-fixed Popup Banner (type !== "confirm")
    if (type !== "confirm") {
        return (
            <AnimatePresence>
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.92 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-start gap-3.5 relative overflow-hidden ${toastBgMap[type]}`}
                    >
                        {/* Accent Bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                            type === "success" ? "bg-emerald-500" :
                            type === "error" ? "bg-rose-500" :
                            type === "warning" ? "bg-amber-500" : "bg-sky-500"
                        }`} />

                        {/* Icon Badge */}
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${iconBadgeMap[type]}`}>
                            {iconMap[type]}
                        </div>

                        {/* Title & Message */}
                        <div className="flex-1 min-w-0 pr-6 text-left">
                            <h4 className="text-sm font-black tracking-tight text-white">{title}</h4>
                            {message && (
                                <p className="text-xs font-semibold text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{message}</p>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3.5 right-3.5 w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                        >
                            ✕
                        </button>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // Render Modal Dialog for Confirmations (type === "confirm")
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="absolute inset-0" onClick={onClose} />

                <motion.div
                    className="relative my-auto w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-800 z-10 text-white"
                    initial={{ scale: 0.93, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.93, opacity: 0, y: 15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black shadow-inner mb-4 ${iconBadgeMap[type]}`}>
                            {iconMap[type]}
                        </div>

                        <h3 className="text-xl font-black text-white mb-2">{title}</h3>

                        {message && (
                            <p className="text-sm font-semibold text-slate-400 mb-6 whitespace-pre-wrap leading-relaxed">
                                {message}
                            </p>
                        )}

                        {children && <div className="w-full mb-6 text-left">{children}</div>}

                        <div className="flex flex-col sm:flex-row w-full gap-3">
                            <button onClick={onClose} className="btn secondary flex-1 w-full">
                                {cancelText}
                            </button>
                            <button onClick={handleConfirm} className="btn success flex-1 w-full">
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default CustomModal;
