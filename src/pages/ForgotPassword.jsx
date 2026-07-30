import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { Printer } from "lucide-react";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await api.post("/forgot-password", null, {
                params: {
                    email: email.trim()
                }
            });

            setMessage("Password reset OTP generated! Redirecting to password reset page...");
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to generate password reset request.");
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
                <div className="auth-visual overflow-hidden relative flex flex-col justify-center items-center text-center p-8 lg:p-12">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    >
                        <source src="/login_video.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-slate-950/15 z-10 pointer-events-none" />

                    {/* Curved Divider Line */}
                    <svg className="absolute inset-y-0 right-0 w-12 h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginRight: '-6px' }}>
                        <path d="M 100,0 Q 93,50 100,100" fill="none" stroke="#3B82F6" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]" vectorEffect="non-scaling-stroke" />
                    </svg>

                    {/* Centered Customer Branding Block */}
                    <div className="z-20 relative flex flex-col items-center gap-6">
                        <div className="flex flex-row items-center gap-4">
                            <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 animate-pulse">
                                <Printer className="w-10 h-10" />
                            </div>
                            <span className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                                CloudPrint
                            </span>
                        </div>
                        
                        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                        
                        <div className="flex flex-col items-center">
                            <p className="text-xl lg:text-2xl uppercase tracking-[0.25em] text-blue-300 font-extrabold bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">
                                Customer Portal
                            </p>
                        </div>
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
                            src="/forgot_password_illustration.png" 
                            alt="Forgot Password" 
                            className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(168,85,247,0.35)]"
                        />
                        <p className="eyebrow mx-auto">Account Recovery</p>
                        <h2 className="title">Forgot Password</h2>
                        <p className="subtitle">
                            Enter the email address associated with your Cloud Print account.
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

                        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="btn w-full py-3"
                                disabled={loading}
                            >
                                {loading ? "Generating OTP..." : "Send Reset Code"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            Remember your password?{" "}
                            <Link to="/" className="link-action">
                                Login here
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.section>
        </main>
    );
}

export default ForgotPassword;
