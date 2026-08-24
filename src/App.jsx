import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "./services/api";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
// Lazy loaded page components
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
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
const WhatsAppOrders = lazy(() => import("./pages/WhatsAppOrders"));
const WebOrders = lazy(() => import("./pages/WebOrders"));

const Chatbot = lazy(() => import("./pages/Chatbot"));

// A clean loading fallback for the lazy loaded components
const PageLoader = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-sky-500 rounded-full animate-spin shadow-2xl"></div>
        <p className="mt-4 text-sky-500/80 font-bold uppercase tracking-widest text-xs">Loading</p>
    </div>
);

function App() {
  useEffect(() => {
    // Ping the backend immediately on application load to wake up the sleeping Render server
    api.get("/system/db-status")
      .then(() => console.log("Backend service wake-up triggered successfully."))
      .catch((err) => console.warn("Wake-up ping failed:", err.message));
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public & Guest-Accessible Routes (WhatsApp Razorpay payments, landing, auth, display, bot) */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/verify" element={<VerifyToken />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/display-panel" element={<DisplayPanel />} />
            <Route path="/chatbot" element={<Chatbot />} />

            {/* Checkout & Direct Payment: Supports WhatsApp bot orders & guest payments without forcing login */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute allowGuestOrder>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pay" 
              element={
                <ProtectedRoute allowGuestOrder>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pay/:orderId" 
              element={
                <ProtectedRoute allowGuestOrder>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-success" 
              element={
                <ProtectedRoute allowGuestOrder>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />

            {/* User Protected Routes: Explicitly require active user session */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-orders" 
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referrals" 
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blocks" 
              element={
                <ProtectedRoute>
                  <BlockSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/scan-to-print" 
              element={
                <ProtectedRoute>
                  <ScanToPrint />
                </ProtectedRoute>
              } 
            />

            {/* Admin Protected Routes: Require admin authentication */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/queue" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=queue" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=users" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=analytics" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=settings" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/whatsapp" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=queue&subtab=whatsapp" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/web-orders" 
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin?tab=queue&subtab=web-orders" replace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/printer-settings" 
              element={
                <ProtectedRoute adminOnly>
                  <PrinterSettings />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
}

export default App;
