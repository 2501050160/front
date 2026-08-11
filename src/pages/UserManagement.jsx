import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import UserManagementSection from "../components/admin/sections/UserManagementSection";
import CustomModal from "../components/CustomModal";
import api from "../services/api";

export function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
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

    const fetchUsers = async () => {
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get("/pdf/orders");
            setOrders(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchUsers(), fetchOrders()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <AdminLayout
            activeTab="users"
            onSelectTab={(tabId) => navigate(`/admin?tab=${tabId}`)}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
        >
            <UserManagementSection
                users={users}
                orders={orders}
                onFetchUsers={fetchUsers}
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

export default UserManagement;
