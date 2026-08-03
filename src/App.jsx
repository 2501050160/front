import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "./services/api";
import { clearUserSession } from "./services/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

// Lazy loaded page components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DisplayPanel = lazy(() => import("./pages/DisplayPanel"));
const BlockSelection = lazy(() => import("./pages/BlockSelection"));
const VerifyToken = lazy(() => import("./pages/VerifyToken"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PrinterSettings = lazy(() => import("./pages/PrinterSettings"));
const ScanToPrint = lazy(() => import("./pages/ScanToPrint"));
const Referrals = lazy(() => import("./pages/Referrals"));

// New Admin Screens
const QueueManagement = lazy(() => import("./pages/QueueManagement"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));

const Chatbot = lazy(() => import("./pages/Chatbot"));

// A clean loading fallback for the lazy loaded components
const PageLoader = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-sky-500 rounded-full animate-spin shadow-2xl"></div>
        <p className="mt-4 text-sky-500/80 font-bold uppercase tracking-widest text-xs">Loading</p>
    </div>
);

function SessionManager() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const adminId = localStorage.getItem("adminId");

        // 2. Set up 5-minute inactivity timeout for normal users
        if (userId && !adminId) {
            localStorage.setItem("lastActivity", String(Date.now()));

            const updateActivity = () => {
                localStorage.setItem("lastActivity", String(Date.now()));
            };

            const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
            events.forEach(event => window.addEventListener(event, updateActivity));

            const interval = setInterval(() => {
                const currentUserId = localStorage.getItem("userId");
                const currentAdminId = localStorage.getItem("adminId");
                
                if (currentUserId && !currentAdminId) {
                    const lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
                    const elapsed = Date.now() - lastActivity;
                    if (elapsed > 5 * 60 * 1000) { // 5 minutes
                        clearUserSession();
                        window.location.reload();
                    }
                }
            }, 2000);

            return () => {
                events.forEach(event => window.removeEventListener(event, updateActivity));
                clearInterval(interval);
            };
        }
    }, [location.pathname]);

    return null;
}

function App() {
  useEffect(() => {
    // Ping the backend immediately on application load to wake up the sleeping Render server
    api.get("/system/db-status")
      .then(() => console.log("Backend service wake-up triggered successfully."))
      .catch((err) => console.warn("Wake-up ping failed:", err.message));
  }, []);

  return (
    <BrowserRouter>
      <SessionManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/verify" element={<VerifyToken />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* New Admin Operations Subroutes */}
          <Route path="/admin/queue" element={<QueueManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/settings" element={<Settings />} />

          <Route path="/printer-settings" element={<PrinterSettings />} />
          <Route path="/display-panel" element={<DisplayPanel />} />
          <Route path="/blocks" element={<BlockSelection />} />
          <Route path="/scan-to-print" element={<ScanToPrint />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
