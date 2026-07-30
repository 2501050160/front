import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { Printer } from "lucide-react";

function VerifyToken() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("No verification token found in the URL.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get("/verify", {
                    params: { token }
                });
                if (response.data && response.data.success) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setErrorMsg(response.data?.message || "Verification failed.");
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
                setErrorMsg(err.response?.data?.message || "Verification link is invalid or has expired.");
            }
        };

        verifyEmail();
    }, [token]);

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
                    <div className="absolute inset-0 bg-slate-950/15 z-10 pointer-events-none" />

                    {/* Curved Divider Line */}
                    <svg className="absolute inset-y-0 right-0 w-12 h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginRight: '-6px' }}>
                        <path d="M 100,0 Q 93,50 100,100" fill="none" stroke="#3B82F6" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]" vectorEffect="non-scaling-stroke" />
                    </svg>



                    <div className="z-20 relative flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 animate-pulse">
                            <Printer className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">
                            CloudPrint
                        </span>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Email Verification
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pb-1">
                            Verify your email address to active your printing account.
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
                        <p className="eyebrow mx-auto">Verify Account</p>
                        
                        {status === "verifying" && (
                            <div className="py-8 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-sky-500 mb-6" />
                                <h2 className="title">Verifying Email...</h2>
                                <p className="subtitle">Please wait while we validate your secure token.</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="py-6 flex flex-col items-center">
                                <img
                                    src="/email_verify_success.png"
                                    alt="Verification Successful"
                                    className="w-24 h-24 object-contain mb-6 drop-shadow-[0_8px_16px_rgba(16,185,129,0.25)]"
                                />
                                <h2 className="title text-emerald-600">Verification Successful! 🎉</h2>
                                <p className="subtitle">Your email address has been successfully verified. You can now access your printing account.</p>
                                
                                <button
                                    onClick={() => navigate("/", { state: { successMessage: "Verification successful! You can now log in." } })}
                                    className="btn w-full mt-8 py-3"
                                >
                                    Proceed to Login
                                </button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="py-6 flex flex-col items-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-6 text-rose-500 bg-rose-50 border-rose-100">
                                    ⚠️
                                </div>
                                <h2 className="title text-rose-600">Verification Failed</h2>
                                <p className="subtitle text-rose-500 font-semibold mb-6">{errorMsg}</p>
                                
                                <Link to="/" className="btn w-full py-3 mb-4">
                                    Back to Login
                                </Link>

                                <Link to="/register" className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors">
                                    Register a new account
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.section>
        </main>
    );
}

export default VerifyToken;
