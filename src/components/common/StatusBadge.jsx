import React from "react";

export function StatusBadge({ status, type = "order" }) {
    if (!status) return null;

    const s = String(status).toUpperCase();

    if (type === "payment") {
        if (s === "PAID") {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    PAID
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                UNPAID
            </span>
        );
    }

    // Order status badges
    let colorClass = "bg-slate-500/15 text-slate-300 border-slate-500/30";
    let dotClass = "bg-slate-400";
    let label = s;

    switch (s) {
        case "QUEUE":
            colorClass = "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
            dotClass = "bg-amber-400 animate-ping";
            label = "IN QUEUE";
            break;
        case "PRINTING":
            colorClass = "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]";
            dotClass = "bg-cyan-400 animate-pulse";
            label = "PRINTING";
            break;
        case "COMPLETED":
            colorClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
            dotClass = "bg-emerald-400";
            label = "COMPLETED";
            break;
        case "CANCELLED":
            colorClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
            dotClass = "bg-rose-400";
            label = "CANCELLED";
            break;
        case "CANCEL_WINDOW":
            colorClass = "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
            dotClass = "bg-indigo-400 animate-pulse";
            label = "CANCEL WINDOW";
            break;
        default:
            colorClass = "bg-slate-500/15 text-slate-300 border-slate-500/30";
            dotClass = "bg-slate-400";
            label = s;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            {label}
        </span>
    );
}

export default StatusBadge;
