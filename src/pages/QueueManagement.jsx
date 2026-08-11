import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import QueueSection from "../components/admin/sections/QueueSection";
import CustomModal from "../components/CustomModal";
import api from "../services/api";

export function QueueManagement() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm) => {
        setModalConfig({ isOpen: true, title, message, type: "confirm", onConfirm });
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get("/pdf/orders");
            setOrders(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBlocks = async () => {
        try {
            const res = await api.get("/admin/blocks/all");
            setBlocks(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchOrders(), fetchBlocks()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.post(`/pdf/updateStatus?id=${orderId}&status=${newStatus}`);
            fetchOrders();
            showAlert("Success", `Order #${orderId} set to ${newStatus}`, "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const handleDeleteOrder = (orderId) => {
        showConfirm("Delete Order", `Delete Order #${orderId}?`, async () => {
            try {
                await api.delete(`/pdf/delete/${orderId}`);
                fetchOrders();
                showAlert("Deleted", "Order removed from queue", "success");
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete order", "error");
            }
        });
    };

    return (
        <AdminLayout
            activeTab="queue"
            onSelectTab={(tabId) => navigate(`/admin?tab=${tabId}`)}
            orderCount={orders.filter(o => o.status === "QUEUE").length}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
        >
            <QueueSection
                orders={orders}
                blocks={blocks}
                onUpdateStatus={handleUpdateStatus}
                onDeleteOrder={handleDeleteOrder}
                onRefresh={fetchOrders}
                showAlert={showAlert}
                showConfirm={showConfirm}
            />

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </AdminLayout>
    );
}

export default QueueManagement;
