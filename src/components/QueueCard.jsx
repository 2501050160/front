import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock3, FileText, Hash, UserRound } from "lucide-react";

function QueueCard({ order, index = 0 }) {
    const isPendingScan = order.status === "PENDING_SCAN";

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

    const calculateTimeLeft = () => {
        if (!order.cancelWindowEndsAt) return 600;
        const dateObj = parseBackendDate(order.cancelWindowEndsAt);
        if (!dateObj || isNaN(dateObj.getTime())) return 600;
        const expireTime = dateObj.getTime() + 10 * 60 * 1000;
        return Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!isPendingScan) return;

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (left <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [order.cancelWindowEndsAt, isPendingScan]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <motion.div
            className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[22px] border border-white/14 bg-slate-950/38 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.01, backgroundColor: "rgba(15,23,42,0.52)" }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300" />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="absolute -bottom-14 left-1/2 h-28 w-40 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/68">
                        <Hash className="h-3.5 w-3.5" /> Order
                    </p>
                    <p className="mt-2 break-all text-2xl font-black leading-none text-white sm:text-3xl">
                        {order.orderId}
                    </p>
                </div>
                <div className="shrink-0 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/78">
                    #{index + 1}
                </div>
            </div>

            <div className="relative z-10 mt-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/62">
                    <UserRound className="h-3.5 w-3.5" /> Customer
                </p>
                <p className="mt-1 break-words text-xl font-black text-cyan-50">
                    {order.customerName || "Customer"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-cyan-50/58">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/28 px-3 py-2">
                        <FileText className="h-3.5 w-3.5" /> {order.selectedPages || "ALL"}
                    </span>
                    <span className="rounded-xl bg-slate-950/28 px-3 py-2">
                        {order.copies || 1} copies
                    </span>
                </div>
            </div>

            <div className="relative z-10 mt-auto pt-4">
                {isPendingScan ? (
                    <div className="rounded-2xl border border-cyan-300/28 bg-cyan-300/12 p-4 text-center">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">
                            OTP Required
                        </span>
                        <span className="mt-2 block font-mono text-4xl font-black tracking-[0.18em] text-white">
                            {order.otpCode}
                        </span>
                        <span className="mt-2 flex items-center justify-center gap-1.5 text-xs font-black text-cyan-100">
                            <Clock3 className="h-3.5 w-3.5" /> Expires in {formatTime(timeLeft)}
                        </span>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-300/28 bg-amber-300/12 p-4 text-center">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/70">
                            Queue Status
                        </span>
                        <span className="mt-2 block text-2xl font-black uppercase tracking-wider text-amber-100">
                            {order.status === "CANCEL_WINDOW" ? "Confirming" : "Waiting"}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default QueueCard;
