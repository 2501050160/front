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
        cyan: "from-cyan-500/20 to-blue-600/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/10",
        emerald: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10",
        amber: "from-amber-500/20 to-orange-600/10 border-amber-500/30 text-amber-400 shadow-amber-500/10",
        purple: "from-purple-500/20 to-indigo-600/10 border-purple-500/30 text-purple-400 shadow-purple-500/10",
        rose: "from-rose-500/20 to-pink-600/10 border-rose-500/30 text-rose-400 shadow-rose-500/10",
        sky: "from-sky-500/20 to-blue-600/10 border-sky-500/30 text-sky-400 shadow-sky-500/10"
    };

    const currentTheme = colorThemes[color] || colorThemes.cyan;

    return (
        <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl transition-all shadow-lg ${currentTheme} ${
                onClick ? "cursor-pointer hover:border-white/40" : ""
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</h3>
                    {subtitle && <p className="text-xs font-medium text-slate-400">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10 shrink-0 text-white">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            {badge && (
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/10">
                    {badge}
                </div>
            )}
        </motion.div>
    );
}

export default MetricCard;
