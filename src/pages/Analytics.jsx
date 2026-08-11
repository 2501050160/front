import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import AnalyticsSection from "../components/admin/sections/AnalyticsSection";
import api from "../services/api";

export function Analytics() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const [ordersRes, statsRes] = await Promise.all([
                api.get("/pdf/orders").catch(() => ({ data: [] })),
                api.get("/admin/stats", { params: { period: revenuePeriod } }).catch(() => ({ data: {} }))
            ]);
            setOrders(ordersRes.data || []);
            setStats(statsRes.data || {});
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [revenuePeriod]);

    return (
        <AdminLayout
            activeTab="analytics"
            onSelectTab={(tabId) => navigate(`/admin?tab=${tabId}`)}
            onRefresh={fetchData}
            isRefreshing={isRefreshing}
        >
            <AnalyticsSection
                orders={orders}
                stats={stats}
                revenuePeriod={revenuePeriod}
                onPeriodChange={setRevenuePeriod}
            />
        </AdminLayout>
    );
}

export default Analytics;
