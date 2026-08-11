import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/user/UserLayout";
import CouponsRewardsSection from "../components/user/sections/CouponsRewardsSection";
import CustomModal from "../components/CustomModal";
import { getWalletBalance } from "../services/auth";

export function Referrals() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const referralCode = localStorage.getItem("referralCode") || "";
    const blockLocation = localStorage.getItem("selectedBlock") || "C Block";

    const [walletBalance, setWalletBalance] = useState(0);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({ isOpen: true, title, message, type, onConfirm: null });
    };

    useEffect(() => {
        if (!userId) {
            navigate("/login");
        } else {
            getWalletBalance(userId).then(setWalletBalance).catch(() => {});
        }
    }, [userId, navigate]);

    return (
        <UserLayout
            activeTab="coupons"
            onSelectTab={(tabId) => navigate(`/dashboard?tab=${tabId}`)}
            walletBalance={walletBalance}
            onWalletUpdated={setWalletBalance}
            blockLocation={blockLocation}
        >
            <CouponsRewardsSection
                userId={userId}
                referralCode={referralCode}
                onWalletUpdated={setWalletBalance}
                showAlert={showAlert}
            />

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </UserLayout>
    );
}

export default Referrals;
