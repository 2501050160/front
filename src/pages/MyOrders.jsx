import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/user/UserLayout";
import OrdersSection from "../components/user/sections/OrdersSection";
import api from "../services/api";
import { getWalletBalance } from "../services/auth";

export function MyOrders() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const blockLocation = localStorage.getItem("selectedBlock") || "C Block";

    const [orders, setOrders] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        if (!userId) return;
        try {
            const res = await api.get("/pdf/userOrders", { params: { userId } });
            setOrders(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchOrders();
            getWalletBalance(userId).then(setWalletBalance).catch(() => {});
            const interval = setInterval(fetchOrders, 3000);
            return () => clearInterval(interval);
        } else {
            navigate("/login");
        }
    }, [userId]);

    return (
        <UserLayout
            activeTab="orders"
            onSelectTab={(tabId) => navigate(`/dashboard?tab=${tabId}`)}
            walletBalance={walletBalance}
            onWalletUpdated={setWalletBalance}
            blockLocation={blockLocation}
        >
            <OrdersSection
                orders={orders}
                isLoading={isLoading}
            />
        </UserLayout>
    );
}

export default MyOrders;
