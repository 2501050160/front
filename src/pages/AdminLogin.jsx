import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { Printer } from "lucide-react";

function AdminLogin() {

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response =
                await api.post("/admin/login", {
                        username,
                        password
                    });

            localStorage.setItem(
                "adminId",
                response.data.id
            );

            localStorage.setItem(
                "adminUser",
                response.data.username
            );

            localStorage.setItem(
                "adminRole",
                response.data.role
            );

            localStorage.setItem(
                "adminCollege",
                response.data.college
            );

            navigate("/admin");

        } catch (error) {

            console.error(error);

            alert(
                "Invalid Admin Credentials"
            );
        }
    };

    return (

        <main className="auth-shell-admin">
            {/* Inline SVG Clip Path definition */}
            <svg className="h-0 w-0 absolute pointer-events-none" aria-hidden="true">
                <defs>
                    <clipPath id="auth-clip" clipPathUnits="objectBoundingBox">
                        <path d="M 0,0 L 1.0,0 Q 0.93,0.5 1.0,1 L 0,1 Z" />
                    </clipPath>
                </defs>
            </svg>

            <motion.section
                className="auth-grid-admin"
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

                    {/* Curved Divider Line (Fuchsia glow for admin) */}
                    <svg className="absolute inset-y-0 right-0 w-12 h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ marginRight: '-6px' }}>
                        <path d="M 100,0 Q 93,50 100,100" fill="none" stroke="#D946EF" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(217,70,239,0.9)]" vectorEffect="non-scaling-stroke" />
                    </svg>

                    {/* Top Header Row */}
                    <div className="lg:absolute lg:top-0 lg:left-0 lg:right-0 w-full flex items-center justify-between p-6 lg:p-8 z-[20] mb-10 relative">
                        {/* Logo and CloudPrint text at left side */}
                        <div className="flex flex-row items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-pink-500/25">
                                <Printer className="w-6 h-6" />
                            </div>
                            <span className="text-xl lg:text-2xl font-black tracking-tight text-white">
                                CloudPrint
                            </span>
                        </div>
                        
                        {/* Admin Console at right side */}
                        <div>
                            <p className="text-xs lg:text-sm uppercase tracking-[0.2em] text-pink-300 font-extrabold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent whitespace-nowrap">
                                Admin Console
                            </p>
                        </div>
                    </div>

                </div>

                <div className="auth-card-admin">

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                    >

                        <p className="eyebrow text-pink-400">Admin Console</p>

                        <h2 className="title">
                            Shop Dashboard
                        </h2>

                        <p className="subtitle">
                            Sign in on the print PC to manage rates and printer mappings.
                        </p>

                        <form
                            onSubmit={handleLogin}
                            className="mt-8 space-y-4"
                        >

                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <button
                                type="submit"
                                className="btn btn-admin-glow w-full"
                            >
                                Login to Console
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="btn secondary w-full"
                                style={{
                                    borderColor: "rgba(255, 255, 255, 0.1)",
                                    color: "#cbd5e1"
                                }}
                            >
                                Customer Login
                            </button>

                        </form>

                    </motion.div>

                </div>

            </motion.section>

        </main>
    );
}

export default AdminLogin;
