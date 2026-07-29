import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import loginHero from "../assets/intro.mp4";
import otpLoading from "../assets/otp_loading.mp4";

function VerifyOtp() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP code.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await api.post("/verify-otp", null, {
                params: {
                    email,
                    otp: otp.trim()
                }
            });

            setMessage("Email verified successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/", { state: { successMessage: "Verification successful! You can now log in." } });
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Verification failed. Please check your OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setMessage("");
        setResending(true);

        try {
            await api.post("/resend-otp", null, {
                params: { email }
            });
            setMessage("A new 6-digit OTP has been sent to your email!");
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to resend OTP.");
        } finally {
            setResending(false);
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

            {/* Mobile/Tablet Fullscreen Background Video Fallback */}
            <div className="absolute inset-0 z-0 lg:hidden pointer-events-none overflow-hidden">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover opacity-25"
                >
                    <source src={loginHero} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 to-slate-950/80" />
            </div>

            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="auth-visual overflow-hidden relative">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    >
                        <source src={loginHero} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-sky-950/75 to-slate-950/85 z-10 pointer-events-none" />

                    {/* Curved Divider Line */}
                    <svg className="absolute inset-y-0 right-0 w-12 h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginRight: '-6px' }}>
                        <path d="M 100,0 Q 93,50 100,100" fill="none" stroke="#3B82F6" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]" vectorEffect="non-scaling-stroke" />
                    </svg>

                    <div className="z-20 relative">
                        <div className="brand-mark">CP</div>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Email Verification
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Verify your email address to activate your printing account.
                        </h1>
                    </div>
                </div>

                <div className="auth-card flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                        className="w-full text-center"
                    >
                        <div className="w-28 h-28 mx-auto mb-4 relative flex items-center justify-center">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(14,165,233,0.3)]"
                            >
                                <source src={otpLoading} type="video/mp4" />
                            </video>
                        </div>

                        <p className="eyebrow mx-auto">Verify Account</p>
                        <h2 className="title mt-1">Enter OTP</h2>
                        <p className="subtitle">
                            Please type the 6-digit OTP code sent to <strong className="text-slate-900">{email}</strong>.
                        </p>

                        {error && (
                            <motion.div 
                                className="p-3 my-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        {message && (
                            <motion.div 
                                className="p-3 my-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                ✓ {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleVerify} className="mt-8 space-y-4">
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="6-digit OTP Code"
                                className="field text-center tracking-[0.4em] font-black text-2xl"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="btn w-full py-3 mt-4"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify Email"}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col items-center gap-3">
                            <button
                                onClick={handleResend}
                                className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors"
                                disabled={resending}
                            >
                                {resending ? "Resending..." : "Didn't receive code? Resend OTP"}
                            </button>

                            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.section>
        </main>
    );
}

export default VerifyOtp;
