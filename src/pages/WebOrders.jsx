import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import WebOrdersSection from "../components/admin/sections/WebOrdersSection";
import CustomModal from "../components/CustomModal";

export function WebOrders() {
    const navigate = useNavigate();
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

    return (
        <AdminLayout
            activeTab="web-orders"
            onSelectTab={(tabId) => navigate(`/admin?tab=${tabId}`)}
        >
            <WebOrdersSection
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

export default WebOrders;
