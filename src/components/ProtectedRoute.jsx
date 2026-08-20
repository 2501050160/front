import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute: Guards client-side routes against unauthenticated access.
 * - `adminOnly`: Requires admin authentication (redirects to /admin-login)
 * - `allowGuestOrder`: Allows guest access for WhatsApp Razorpay payments & order status links
 * - Default: Requires user authentication (redirects to /login)
 */
export const ProtectedRoute = ({ children, adminOnly = false, allowGuestOrder = false }) => {
    const location = useLocation();
    const { isAuthenticated, isAdminAuthenticated } = useAuth();

    // Fallback to localStorage check in case of transient hydration state
    const hasUserId = isAuthenticated || !!localStorage.getItem("userId");
    const hasAdminId = isAdminAuthenticated || !!localStorage.getItem("adminId");

    if (adminOnly && !hasAdminId) {
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    // Guest checkout / WhatsApp Razorpay payment support:
    // If orderId is present in URL (e.g. /checkout?orderId=... or /payment-success?orderId=...), allow guest access without forcing login
    if (allowGuestOrder) {
        const searchParams = new URLSearchParams(location.search);
        const hasOrderId = searchParams.has("orderId");
        const hasLocalOrder = !!localStorage.getItem("order");
        if (hasOrderId || hasLocalOrder || hasUserId) {
            return children;
        }
    }

    if (!adminOnly && !hasUserId) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
