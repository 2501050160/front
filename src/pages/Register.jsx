import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, persistUser } from "../services/auth";
import api, { API_BASE } from "../services/api";
import loginHero from "../assets/intro.mp4";
import { Printer } from "lucide-react";

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [collegesList, setCollegesList] = useState([]);
  const [oauthRedirecting, setOauthRedirecting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get("/blocks/all");
        const uniqueColleges = Array.from(new Set(response.data.map(b => b.college).filter(Boolean)));
        setCollegesList(uniqueColleges);
        if (uniqueColleges.length > 0) {
          setCollege(uniqueColleges[0]);
        }
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    fetchColleges();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await registerUser({
        name,
        email: username,
        password,
        college
      });

      persistUser(response);
      navigate("/blocks");
    } catch (err) {
      alert(err.response?.data || "Registration Failed");
    }
  };

  const handleOAuth = (provider) => {
    setOauthRedirecting(provider);
    setTimeout(() => {
      const endpoint = provider.toLowerCase() === "google" ? "google" : "azure"; // backend endpoint
      window.location.href = `${API_BASE}/oauth2/authorization/${endpoint}`;
    }, 1500);
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
          className="w-full h-full object-cover"
        >
          <source src={loginHero} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/15" />
      </div>

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
            <source src={loginHero} type="video/mp4" />
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
          >

            <>
              <p className="eyebrow">Create Account</p>

              <h2 className="title">
                Start printing
              </h2>

              <p className="subtitle">
                Register once, then upload PDFs and pay online.
              </p>

              <form
                onSubmit={handleRegister}
                className="mt-8 space-y-4"
              >

                <input
                  type="text"
                  placeholder="Full name"
                  className="field"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

                <input
                  type="text"
                  placeholder="Username"
                  className="field"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="field"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="field"
                  required
                >
                  {collegesList.length === 0 && <option value="">Loading Colleges...</option>}
                  {collegesList.map((col, idx) => (
                    <option key={idx} value={col}>{col} College</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="btn w-full"
                >
                  Create Account
                </button>

              </form>

              {/* Social OAuth Sign-ins */}
              <div className="relative flex items-center justify-center my-6">
                <span className="h-px bg-slate-200 w-full absolute" />
                <span className="bg-white px-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth("Google")}
                  className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("Microsoft")}
                  className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
                >
                  Microsoft
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="link-action"
                >
                  Login here
                </Link>
              </p>
            </>

          </motion.div>

        </div>

      </motion.section>

    </main>
  );
}

export default Register;
