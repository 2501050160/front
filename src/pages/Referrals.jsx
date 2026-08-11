import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Referrals() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");

    const [stats, setStats] = useState({
        referralCode: "",
        totalReferrals: 0,
        cashbackEarned: 0,
        walletBalance: 0
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            navigate("/");
            return;
        }
        fetchReferralData();
    }, [userId]);

    const fetchReferralData = async () => {
        try {
            setLoading(true);
            const statsRes = await api.get("/pdf/referrals/stats", {
                params: { userId }
            });
            setStats(statsRes.data);

            const leaderboardRes = await api.get("/pdf/referrals/leaderboard");
            setLeaderboard(leaderboardRes.data || []);
        } catch (err) {
            console.error("Failed to load referral data:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(stats.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Referrals & Rewards"
                    subtitle="Share & Earn Wallet Credits"
                    badge={`Wallet Rs. ${stats.walletBalance}`}
                    actions={[
                        { label: "New Print", path: "/dashboard" },
                        { label: "Orders", path: "/my-orders", className: "btn secondary" }
                    ]}
                />

                <div className="grid gap-6 mt-6 md:grid-cols-[1fr_1.2fr]">
                    {/* Left Panel: Stats and Share */}
                    <motion.section
                        className="panel p-6 flex flex-col justify-between"
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div>
                            <p className="eyebrow">Your Referral Stats</p>
                            <h2 className="title mt-2">Refer & Earn ₹10</h2>
                            <p className="subtitle text-sm mt-1 max-w-sm">
                                Share your code with fellow campus students. They get ₹5 on their first print, and you earn ₹10 cashback instantly!
                            </p>

                            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center relative overflow-hidden">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Your Referral Code
                                </p>
                                <p className="text-4xl font-black text-white mt-2 select-all tracking-wider">
                                    {stats.referralCode || "LOADING..."}
                                </p>
                                <button
                                    onClick={copyCode}
                                    className="btn secondary mt-4 mx-auto text-xs py-1 px-4 cursor-pointer"
                                >
                                    {copied ? "Copied! ✓" : "Copy Code 📋"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400">Total Referred</p>
                                <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalReferrals} Students</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-600">Total Cashback</p>
                                <p className="text-3xl font-black text-emerald-700 mt-1">Rs. {stats.cashbackEarned}</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Right Panel: Leaderboard */}
                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="eyebrow">Campus Leaderboard</p>
                        <h2 className="title mt-2">Top Referrers of the Month</h2>
                        <p className="subtitle text-sm mt-1 mb-6">
                            See who is leading the printing revolution on campus!
                        </p>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-xs font-bold">Loading leaderboard...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th className="w-16">Rank</th>
                                            <th>Student Name</th>
                                            <th className="text-right">Successful Referrals</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((user, idx) => (
                                            <tr key={idx} className={idx === 0 ? "bg-amber-500/5 font-bold" : ""}>
                                                <td className="font-black text-slate-600">
                                                    {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `#${idx + 1}`}
                                                </td>
                                                <td className="font-bold text-slate-800">{user.name}</td>
                                                <td className="text-right font-black text-sky-600">{user.count}</td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-8 text-slate-400 font-bold">
                                                    No referrals recorded yet. Be the first! 🚀
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.section>
                </div>
            </div>
        </main>
    );
}

export default Referrals;
