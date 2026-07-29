import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        if (!otp.trim()) {
            setError("Please enter the 6-digit OTP.");
            return;
        }
        if (!newPassword.trim()) {
            setError("Please enter a new password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await api.post("/reset-password", null, {
                params: {
                    email,
                    otp: otp.trim(),
                    newPassword: newPassword.trim()
                }
            });

            setMessage("Password reset successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/", { state: { successMessage: "Password reset successful! You can now log in with your new password." } });
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to reset password. Please check your OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-shell relative">
            {/* Inline SVG Clip Path definition */}
            <svg className="h-0 w-0 absolute pointer-events-none" aria-hidden="true">
                <defs>
                    <clipPath id="auth-clip" clipPathUnits="objectBoundingBox">
                        <path d="M 0,0 L 1.0,0 Q 0.93,0.5 1.0,1 L 0,1 Z" />
                    </clipPath>
                </defs>
            </svg>

            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >
                <div className="auth-visual overflow-hidden relative">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    >
                        <source src="/login_video.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-sky-950/75 to-slate-950/85 z-10 pointer-events-none" />

                    {/* Curved Divider Line */}
                    <svg className="absolute inset-y-0 right-0 w-12 h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginRight: '-6px' }}>
                        <path d="M 100,0 Q 93,50 100,100" fill="none" stroke="#3B82F6" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]" vectorEffect="non-scaling-stroke" />
                    </svg>

                    {/* Soft fade overlay to blend video with card gradient */}
                    <div className="auth-fade-overlay hidden lg:block" />

                    <div className="z-20 relative">
                        <div className="brand-mark">CP</div>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Reset Password
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Choose a strong password to protect your Cloud Print account.
                        </h1>
                    </div>
                </div>

                <div className="auth-card">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                        className="text-center"
                    >
                        <img 
                            src="/reset_password_illustration.png" 
                            alt="Reset Password" 
                            className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(6,182,212,0.35)]"
                        />
                        <p className="eyebrow mx-auto">Password Reset</p>
                        <h2 className="title">Set New Password</h2>
                        <p className="subtitle">
                            Enter the OTP sent to <strong className="text-slate-900">{email}</strong> and choose a new password.
                        </p>

                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold">
                                ✓ {message}
                            </div>
                        )}

                        <form onSubmit={handleReset} className="mt-8 space-y-4">
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="6-digit OTP Code"
                                className="field text-center tracking-[0.3em] font-black text-xl"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                disabled={loading}
                            />

                            <input
                                type="password"
                                placeholder="New Password"
                                className="field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                            />

                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                className="field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="btn w-full py-3"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Reset Password"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            <Link to="/" className="link-action">
                                Back to Login
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.section>
        </main>
    );
}

export default ResetPassword;
