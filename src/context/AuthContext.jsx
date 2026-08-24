import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { persistUser, clearUserSession, getWalletBalance } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const id = localStorage.getItem("userId");
        if (!id) return null;
        return {
            id,
            name: localStorage.getItem("userName") || "",
            email: localStorage.getItem("userEmail") || "",
            college: localStorage.getItem("userCollege") || "KLU",
            referralCode: localStorage.getItem("referralCode") || "",
            walletBalance: Number(localStorage.getItem("walletBalance") || 0),
        };
    });

    const [adminId, setAdminId] = useState(() => localStorage.getItem("adminId") || null);
    const [walletBalance, setWalletBalance] = useState(() => Number(localStorage.getItem("walletBalance") || 0));

    // Refresh wallet balance
    const refreshWallet = useCallback(async () => {
        const activeUserId = user?.id || localStorage.getItem("userId");
        if (!activeUserId) return;
        try {
            const balance = await getWalletBalance(activeUserId);
            const num = Number(balance != null ? balance : 0);
            setWalletBalance(num);
            setUser((prev) => {
                if (!prev) {
                    const id = localStorage.getItem("userId");
                    if (!id) return null;
                    return {
                        id,
                        name: localStorage.getItem("userName") || "",
                        email: localStorage.getItem("userEmail") || "",
                        college: localStorage.getItem("userCollege") || "KLU",
                        referralCode: localStorage.getItem("referralCode") || "",
                        walletBalance: num,
                    };
                }
                return { ...prev, walletBalance: num };
            });
        } catch (err) {
            console.warn("Failed to refresh wallet balance:", err.message);
        }
    }, [user?.id]);

    useEffect(() => {
        const activeUserId = user?.id || localStorage.getItem("userId");
        if (activeUserId) {
            refreshWallet();
        }
        const handleWalletUpdated = (e) => {
            if (e.detail != null) {
                const num = Number(e.detail) || 0;
                setWalletBalance(num);
                setUser((prev) => (prev ? { ...prev, walletBalance: num } : prev));
            } else {
                refreshWallet();
            }
        };
        window.addEventListener("walletUpdated", handleWalletUpdated);
        window.addEventListener("storage", handleWalletUpdated);
        return () => {
            window.removeEventListener("walletUpdated", handleWalletUpdated);
            window.removeEventListener("storage", handleWalletUpdated);
        };
    }, [user?.id, refreshWallet]);

    const login = useCallback((userData) => {
        persistUser(userData);
        setUser({
            id: userData.id,
            name: userData.name || "",
            email: userData.email || "",
            college: userData.college || "KLU",
            referralCode: userData.referralCode || "",
            walletBalance: Number(userData.walletBalance) || 0,
        });
        setWalletBalance(Number(userData.walletBalance) || 0);
    }, []);

    const logout = useCallback(() => {
        clearUserSession();
        setUser(null);
        setWalletBalance(0);
    }, []);

    const adminLogin = useCallback((id, adminData = {}) => {
        localStorage.setItem("adminId", id);
        if (adminData.adminRole) {
            localStorage.setItem("adminRole", adminData.adminRole);
        }
        if (adminData.adminName) {
            localStorage.setItem("adminName", adminData.adminName);
        }
        setAdminId(id);
    }, []);

    const adminLogout = useCallback(() => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminName");
        setAdminId(null);
    }, []);

    // 5-minute inactivity timeout for regular logged-in users
    useEffect(() => {
        if (user?.id && !adminId) {
            localStorage.setItem("lastActivity", String(Date.now()));

            const updateActivity = () => {
                localStorage.setItem("lastActivity", String(Date.now()));
            };

            const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
            events.forEach((event) => window.addEventListener(event, updateActivity));

            const interval = setInterval(() => {
                const currentUserId = localStorage.getItem("userId");
                const currentAdminId = localStorage.getItem("adminId");

                if (currentUserId && !currentAdminId) {
                    const lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
                    const elapsed = Date.now() - lastActivity;
                    if (elapsed > 5 * 60 * 1000) { // 5 minutes
                        logout();
                        window.location.reload();
                    }
                }
            }, 5000);

            return () => {
                events.forEach((event) => window.removeEventListener(event, updateActivity));
                clearInterval(interval);
            };
        }
    }, [user?.id, adminId, logout]);

    const value = {
        user,
        adminId,
        isAuthenticated: !!user?.id,
        isAdminAuthenticated: !!adminId,
        walletBalance,
        setWalletBalance,
        refreshWallet,
        login,
        logout,
        adminLogin,
        adminLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
