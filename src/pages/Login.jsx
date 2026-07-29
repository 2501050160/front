import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, persistUser } from "../services/auth";
import api, { API_BASE } from "../services/api";
import PopupManager from "../components/PopupManager";
import loginHero from "../assets/intro.mp4";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [dbOffline, setDbOffline] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [oauthRedirecting, setOauthRedirecting] = useState(null);
    
    // States for setting OAuth college
    const [oauthNewUser, setOauthNewUser] = useState(null);
    const [oauthCollege, setOauthCollege] = useState("");
    const [collegesList, setCollegesList] = useState([]);
    const [settingCollegeLoading, setSettingCollegeLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await api.get("/blocks/all");
                const uniqueColleges = Array.from(new Set(response.data.map(b => b.college).filter(Boolean)));
                setCollegesList(uniqueColleges);
                if (uniqueColleges.length > 0) {
                    setOauthCollege(uniqueColleges[0]);
                }
            } catch (err) {
                console.error("Failed to fetch colleges", err);
            }
        };
        fetchColleges();
    }, []);

    const handleOAuth = (provider) => {
        setOauthRedirecting(provider);
        setTimeout(() => {
            const endpoint = provider.toLowerCase() === "google" ? "google" : "azure";
            window.location.href = `${API_BASE}/oauth2/authorization/${endpoint}`;
        }, 1500);
    };

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const oauthSuccess = params.get("oauth_success");
        if (oauthSuccess === "true") {
            const isNew = params.get("is_new_user") === "true";
            const user = {
                id: params.get("id"),
                name: params.get("name"),
                email: params.get("email"),
                walletBalance: parseFloat(params.get("walletBalance") || "0.0")
            };
            if (isNew) {
                setOauthNewUser(user);
            } else {
                persistUser(user);
                navigate("/blocks");
            }
        }
    }, [location, navigate]);

    const handleSetOauthCollege = async (e) => {
        e.preventDefault();
        
        if (!oauthCollege) {
            setErrorMessage("Please select a college.");
            return;
        }

        setSettingCollegeLoading(true);
        setErrorMessage("");
        
        try {
            const formData = new URLSearchParams();
            formData.append("email", oauthNewUser.email);
            formData.append("college", oauthCollege);

            await api.post("/oauth/set-college", formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            persistUser({ ...oauthNewUser, college: oauthCollege });
            navigate("/blocks");
        } catch (err) {
            console.error(err);
            setErrorMessage(err.response?.data || "Failed to set college.");
        } finally {
            setSettingCollegeLoading(false);
        }
    };


    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            // Clear location state to avoid showing again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        const checkDb = async () => {
            try {
                const response = await api.get("/system/db-status");
                if (response.data && response.data.databaseConnected) {
                    setDbOffline(false);
                } else {
                    setDbOffline(true);
                }
            } catch (err) {
                setDbOffline(true);
            }
        };
        checkDb();
        const interval = setInterval(checkDb, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            const response = await loginUser(email, password);
            persistUser(response);
            const redirectPath = localStorage.getItem("redirectAfterLogin");
            if (redirectPath) {
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath);
            } else {
                navigate("/blocks");
            }
        } catch (error) {
            console.error(error);
            setError(
                error.response?.data || "Login failed. If the server is waking up, please wait 40 seconds and try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendLink = async () => {
        if (!email) {
            setError("Please type your email address first.");
            return;
        }
        setResending(true);
        setError("");
        setSuccessMessage("");
        try {
            await api.post("/resend-otp", null, {
                params: { email }
            });
            setSuccessMessage("A new verification OTP has been sent to your email!");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || "Failed to resend OTP.");
        } finally {
            setResending(false);
        }
    };

    return (

        <main className="auth-shell relative">
            <AnimatePresence>
                {oauthRedirecting && (
                    <motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white text-center p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin mb-6" />
                        <h3 className="text-xl font-black">🔄 Redirecting to {oauthRedirecting}...</h3>
                        <p className="mt-3 text-sm text-slate-300 max-w-sm font-bold">
                            Please choose your {oauthRedirecting} account to continue. This will only take a moment.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <PopupManager page="LOGIN" />

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
                        <source src={loginHero} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-sky-950/75 to-slate-950/85 z-10 pointer-events-none" />

                    <div className="z-20 relative">
                        <div className="brand-mark">CP</div>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Shop print console
                        </p>
 
                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Upload anywhere. Print here. Collect in minutes.
                        </h1>
                    </div>

                </div>

                <div className="auth-card">

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                    >

                        <p className="eyebrow">Customer Login</p>

                        <h2 className="title">
                            Welcome back
                        </h2>

                        <p className="subtitle">
                            Sign in to upload PDF files and track print orders.
                        </p>

                        {dbOffline && (
                            <div style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                marginTop: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)"
                            }}>
                                <span style={{ animation: "pulse 1s infinite" }}>⚠️</span>
                                <marquee scrollamount="4">connection is not available</marquee>
                            </div>
                        )}

                        <form
                            onSubmit={handleLogin}
                            className="mt-8 space-y-4"
                        >

                            <input
                                type="text"
                                placeholder="Username"
                                className="field"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                disabled={isLoading}
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                className="field"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                disabled={isLoading}
                            />

                            <div className="flex justify-end text-xs font-bold -mt-2 mb-2">
                                <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>

                            {successMessage && (
                                <motion.p
                                    className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    ✓ {successMessage}
                                </motion.p>
                            )}

                             {error && (
                                <motion.div
                                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 space-y-1"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p>⚠️ {error}</p>
                                    {error.includes("Email not verified") && (
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(email)}`)}
                                                className="text-sky-600 hover:text-sky-700 underline block font-bold text-left bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                Verify Email First. Click here to enter your OTP.
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleResendLink}
                                                disabled={resending}
                                                className="text-xs text-slate-500 hover:text-slate-700 underline block text-left bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                {resending ? "Resending OTP..." : "Didn't receive code? Resend OTP."}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                className="btn w-full"
                                disabled={isLoading}
                                style={isLoading ? { opacity: 0.7, cursor: "wait" } : {}}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </button>

                        </form>

                        {/* Social OAuth Sign-ins */}
                        <div className="relative flex items-center justify-center my-6">
                            <span className="h-px bg-slate-200 w-full absolute" />
                            <span className="bg-white px-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                                or continue with
                            </span>
                        </div>

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => handleOAuth("Google")}
                                className="btn secondary w-full py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Continue with Google
                            </button>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-600">

                            <Link
                                to="/admin-login"
                                className="btn secondary w-full"
                            >
                                Admin Login
                            </Link>

                        </div>

                    </motion.div>

                </div>

            </motion.section>


            {/* New OAuth User Set College Modal */}
            <AnimatePresence>
                {oauthNewUser && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-slate-800"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <h2 className="text-2xl font-black tracking-tight text-slate-900">
                                Welcome to Cloud Print 🎉
                            </h2>
                            <p className="mt-2.5 text-xs text-slate-500 font-bold leading-relaxed">
                                Hi <span className="text-blue-600 font-black">{oauthNewUser.name}</span>! Since this is your first time logging in, please select your college campus to continue. 
                            </p>

                            <form onSubmit={handleSetOauthCollege} className="mt-6 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select College / Campus</label>
                                    <select
                                        value={oauthCollege}
                                        onChange={(e) => setOauthCollege(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>-- Select your College --</option>
                                        {collegesList.map((col, idx) => (
                                            <option key={idx} value={col}>{col} College</option>
                                        ))}
                                    </select>
                                </div>

                                {errorMessage && (
                                    <p className="text-xs font-bold text-red-600">
                                        ⚠️ {errorMessage}
                                    </p>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn w-full mt-2"
                                    disabled={settingCollegeLoading}
                                >
                                    {settingCollegeLoading ? "Saving..." : "Continue to Dashboard"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

export default Login;
