import React from "react";
import { motion } from "framer-motion";

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "cyan",
    badge,
    onClick,
    className = ""
}) {
    const colorThemes = {
        cyan: "bg-slate-900 border-cyan-500/40 text-cyan-400 shadow-cyan-950/50",
        emerald: "bg-slate-900 border-emerald-500/40 text-emerald-400 shadow-emerald-950/50",
        amber: "bg-slate-900 border-amber-500/40 text-amber-400 shadow-amber-950/50",
        purple: "bg-slate-900 border-purple-500/40 text-purple-400 shadow-purple-950/50",
        rose: "bg-slate-900 border-rose-500/40 text-rose-400 shadow-rose-950/50",
        sky: "bg-slate-900 border-sky-500/40 text-sky-400 shadow-sky-950/50"
    };

    const iconBgs = {
        cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        sky: "bg-sky-500/20 text-sky-300 border-sky-500/30"
    };

    const currentTheme = colorThemes[color] || colorThemes.cyan;
    const currentIconBg = iconBgs[color] || iconBgs.cyan;

    return (
        <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xl ${currentTheme} ${
                onClick ? "cursor-pointer hover:border-white/40" : ""
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-300">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</h3>
                    {subtitle && <p className="text-xs font-bold text-slate-400">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl border shrink-0 ${currentIconBg}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            {badge && (
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {badge}
                </div>
            )}
        </motion.div>
    );
}

export default MetricCard;
