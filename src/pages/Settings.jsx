import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import PricingCouponsSection from "../components/admin/sections/PricingCouponsSection";
import CustomModal from "../components/CustomModal";
import api from "../services/api";

export function Settings() {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState("C Block");
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const [duplexPrice, setDuplexPrice] = useState(2);
    const [coupons, setCoupons] = useState([]);
    const [rewards, setRewards] = useState([]);
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

    const fetchBlocks = async () => {
        try {
            const res = await api.get("/admin/blocks/all");
            setBlocks(res.data || []);
            if (res.data?.length > 0 && !selectedBlock) {
                setSelectedBlock(res.data[0].name);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPrices = async (bName = selectedBlock) => {
        if (!bName) return;
        try {
            const res = await api.get("/pricing/all", { params: { blockLocation: bName } });
            if (res.data) {
                setBwPrice(res.data.bwPrice != null ? res.data.bwPrice : 2);
                setColorPrice(res.data.colorPrice != null ? res.data.colorPrice : 5);
                setDuplexPrice(res.data.duplexPrice != null ? res.data.duplexPrice : 2);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCoupons = async () => {
        try {
            const res = await api.get("/coupon/all");
            setCoupons(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRewards = async () => {
        try {
            const res = await api.get("/rewards/all");
            setRewards(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchBlocks(), fetchPrices(selectedBlock), fetchCoupons(), fetchRewards()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleSavePrices = async () => {
        try {
            await api.post("/pricing/update", null, {
                params: {
                    printType: "BW",
                    pricePerPage: bwPrice,
                    blockLocation: selectedBlock
                }
            });
            await api.post("/pricing/update", null, {
                params: {
                    printType: "COLOR",
                    pricePerPage: colorPrice,
                    blockLocation: selectedBlock
                }
            });
            await api.post("/pricing/update", null, {
                params: {
                    printType: "DUPLEX",
                    pricePerPage: duplexPrice,
                    blockLocation: selectedBlock
                }
            });
            showAlert("Success", `Updated prices for ${selectedBlock}`, "success");
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to update prices", "error");
        }
    };

    const handleCreateCoupon = async (data) => {
        try {
            await api.post("/coupon/create", data);
            showAlert("Success", "Coupon generated", "success");
            fetchCoupons();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to create coupon", "error");
        }
    };

    const handleDeleteCoupon = (id) => {
        showConfirm("Delete Coupon", "Remove this coupon?", async () => {
            try {
                await api.post("/coupon/delete", null, { params: { id } });
                showAlert("Deleted", "Coupon removed", "success");
                fetchCoupons();
            } catch (e) {
                console.error(e);
                showAlert("Error", "Failed to delete coupon", "error");
            }
        });
    };

    const handleCreateReward = async (data) => {
        try {
            await api.post("/rewards/create", data);
            showAlert("Success", "Reward voucher created", "success");
            fetchRewards();
        } catch (e) {
            console.error(e);
            showAlert("Error", "Failed to create reward voucher", "error");
        }
    };

    return (
        <AdminLayout
            activeTab="settings"
            onSelectTab={(tabId) => navigate(`/admin?tab=${tabId}`)}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
        >
            <PricingCouponsSection
                blocks={blocks}
                selectedBlock={selectedBlock}
                onSelectBlock={(b) => {
                    setSelectedBlock(b);
                    fetchPrices(b);
                }}
                bwPrice={bwPrice}
                setBwPrice={setBwPrice}
                colorPrice={colorPrice}
                setColorPrice={setColorPrice}
                duplexPrice={duplexPrice}
                setDuplexPrice={setDuplexPrice}
                onSavePrices={handleSavePrices}
                coupons={coupons}
                onDeleteCoupon={handleDeleteCoupon}
                onCreateCoupon={handleCreateCoupon}
                rewards={rewards}
                onCreateReward={handleCreateReward}
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

export default Settings;
