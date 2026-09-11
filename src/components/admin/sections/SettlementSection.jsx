import React, { useState, useEffect, useMemo } from "react";
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Building2, 
    CheckCircle2, 
    Clock, 
    DollarSign, 
    Download, 
    FileText, 
    Lock, 
    Plus, 
    RefreshCw, 
    Search, 
    ShieldCheck, 
    Trash2, 
    Zap,
    Send,
    Printer,
    Check,
    X,
    AlertCircle,
    Sliders,
    Percent,
    Share2,
    Eye,
    Phone,
    Mail,
    Calendar,
    ExternalLink,
    Play,
    CheckCheck
} from "lucide-react";
import api from "../../../services/api";
import { 
    getRateSettings, 
    saveRateSettings, 
    calculatePayoutBreakdown, 
    sendSettlementRequestAlert, 
    sendSettlementCompletedAlert, 
    sendSettlementDisbursedAlertToSubAdmin,
    getCollegeRouteSettings,
    saveCollegeRouteSettings,
    reconcileRazorpayRouteWebhook,
    DEFAULT_ADMIN_PHONE
} from "../../../services/notificationService";

export function SettlementSection({
    adminRole = "SUB_ADMIN",
    adminUser = "Admin",
    adminCollege = "KLU",
    allColleges = null,
    showAlert = () => {}
}) {
    const isMainAdmin = adminUser.toLowerCase() === "admin" || adminRole === "MAIN_ADMIN";

    // Dynamic colleges fetched strictly from college configurations in the database
    const [availableColleges, setAvailableColleges] = useState(
        Array.isArray(allColleges) && allColleges.length > 0 
            ? allColleges 
            : (!isMainAdmin && adminCollege ? [adminCollege] : [])
    );
    const [selectedCollege, setSelectedCollege] = useState(isMainAdmin ? "ALL" : adminCollege);
    const [balanceSummary, setBalanceSummary] = useState(null);
    const [allCollegesSummary, setAllCollegesSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Dynamic Rate & Percentage Settings
    const [rateSettings, setRateSettings] = useState(getRateSettings());

    // Modal state for settling bills (Main Admin only)
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settleCollege, setSettleCollege] = useState("");
    const [settleAmount, setSettleAmount] = useState("");
    const [settleReference, setSettleReference] = useState("");
    const [settleMode, setSettleMode] = useState("RAZORPAY_ROUTE");
    const [settleNotes, setSettleNotes] = useState("");
    const [settleRequestId, setSettleRequestId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state for Request Settlement (Sub-Admin or College Admin)
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestAmount, setRequestAmount] = useState("");
    const [requestBankDetails, setRequestBankDetails] = useState("");
    const [requestContact, setRequestContact] = useState("");
    const [requestNotes, setRequestNotes] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    // Modal state for Payment Receipt
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // Modal state for Commission & Rates Summary Breakdown
    const [isRateSummaryOpen, setIsRateSummaryOpen] = useState(false);
    const [simGrossInput, setSimGrossInput] = useState("1000");

    // Modal state for Adjust Percentage Charges (Platform & Gateway Commission only)
    const [isAdjustChargesOpen, setIsAdjustChargesOpen] = useState(false);
    const [editCommissionPercent, setEditCommissionPercent] = useState(rateSettings.platformCommissionPercent.toString());
    const [editGatewayPercent, setEditGatewayPercent] = useState(rateSettings.gatewayPercent.toString());
    const [editAdminPhone, setEditAdminPhone] = useState(rateSettings.adminPhone || DEFAULT_ADMIN_PHONE);

    // Route Automation & Auto-Payout Rules Modal (Main Admin only)
    const [isRouteAutomationOpen, setIsRouteAutomationOpen] = useState(false);
    const [automationTab, setAutomationTab] = useState("MERCHANT"); // "MERCHANT" | "SCHEDULES" | "WEBHOOK"
    const [automationCollege, setAutomationCollege] = useState("");
    const [editMerchantAccountId, setEditMerchantAccountId] = useState("");
    const [editSettlementEmail, setEditSettlementEmail] = useState("");
    const [editCoordinatorPhone, setEditCoordinatorPhone] = useState("");
    const [editAutoPayoutEnabled, setEditAutoPayoutEnabled] = useState(false);
    const [editAutoPayoutThreshold, setEditAutoPayoutThreshold] = useState("2000");
    const [editAutoPayoutSchedule, setEditAutoPayoutSchedule] = useState("THRESHOLD_IMMEDIATE");

    // Webhook Simulator state
    const [simWebhookEvent, setSimWebhookEvent] = useState("transfer.processed");
    const [simWebhookCollege, setSimWebhookCollege] = useState("");
    const [simWebhookAmount, setSimWebhookAmount] = useState("4500");
    const [simWebhookUtr, setSimWebhookUtr] = useState(`UTR${Date.now().toString().slice(-8)}`);
    const [simWebhookReason, setSimWebhookReason] = useState("Beneficiary account blocked by receiving bank");
    const [simWebhookResult, setSimWebhookResult] = useState(null);

    // Sync settings listener
    useEffect(() => {
        const handleRatesUpdated = () => setRateSettings(getRateSettings());
        const handleSettlementsUpdated = () => fetchData();
        window.addEventListener("cloudprint_rates_updated", handleRatesUpdated);
        window.addEventListener("cloudprint_settlements_updated", handleSettlementsUpdated);
        return () => {
            window.removeEventListener("cloudprint_rates_updated", handleRatesUpdated);
            window.removeEventListener("cloudprint_settlements_updated", handleSettlementsUpdated);
        };
    }, []);

    // 1. Fetch available colleges strictly from Database (CollegeConfig and Blocks)
    useEffect(() => {
        const loadCollegesFromDb = async () => {
            try {
                const collegeSet = new Set();
                
                if (Array.isArray(allColleges)) {
                    allColleges.forEach(c => {
                        const name = (c || "").trim();
                        if (name) collegeSet.add(name);
                    });
                }

                const [cfgRes, blockRes] = await Promise.allSettled([
                    api.get("/college-config"),
                    api.get("/blocks/all")
                ]);

                if (cfgRes.status === "fulfilled" && Array.isArray(cfgRes.value.data)) {
                    cfgRes.value.data.forEach(c => {
                        const name = (c.collegeName || c.college || "").trim();
                        if (name) collegeSet.add(name);
                    });
                }

                if (blockRes.status === "fulfilled" && Array.isArray(blockRes.value.data)) {
                    blockRes.value.data.forEach(b => {
                        const name = (b.college || "").trim();
                        if (name) collegeSet.add(name);
                    });
                }

                if (!isMainAdmin && adminCollege) {
                    collegeSet.add(adminCollege.trim());
                }

                const list = Array.from(collegeSet).filter(Boolean).sort();
                if (list.length > 0) {
                    setAvailableColleges(list);
                    if (isMainAdmin) {
                        setSelectedCollege(prev => (prev === "ALL" ? "ALL" : (list.includes(prev) ? prev : list[0])));
                        if (!automationCollege) {
                            setAutomationCollege(list[0]);
                            setSimWebhookCollege(list[0]);
                        }
                    } else {
                        setSelectedCollege(adminCollege || list[0]);
                        setAutomationCollege(adminCollege || list[0]);
                        setSimWebhookCollege(adminCollege || list[0]);
                    }
                }
            } catch (err) {
                console.warn("Could not load dynamic colleges from DB:", err);
            }
        };

        loadCollegesFromDb();
    }, [adminCollege, isMainAdmin, allColleges]);

    // Load College Route Settings when automation college changes
    useEffect(() => {
        if (!automationCollege) return;
        const config = getCollegeRouteSettings(automationCollege);
        setEditMerchantAccountId(config.razorpayAccountId || "");
        setEditSettlementEmail(config.settlementEmail || "");
        setEditCoordinatorPhone(config.coordinatorPhone || "");
        setEditAutoPayoutEnabled(Boolean(config.autoPayoutEnabled));
        setEditAutoPayoutThreshold((config.autoPayoutThreshold || 2000).toString());
        setEditAutoPayoutSchedule(config.autoPayoutSchedule || "THRESHOLD_IMMEDIATE");
    }, [automationCollege]);

    // Check URL parameters for direct receipt preview (?receipt=UTR...)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const receiptRef = params.get("receipt");
        if (receiptRef && history.length > 0) {
            const found = history.find(h => 
                h.referenceId === receiptRef || String(h.id) === receiptRef
            );
            if (found) {
                setSelectedReceipt(found);
            }
        }
    }, [history]);

    // 2. Fetch balance and settlement ledger
    const fetchData = async () => {
        setLoading(true);
        try {
            const collegeParam = isMainAdmin ? selectedCollege : adminCollege;
            
            try {
                const balRes = await api.get(`/settlements/balance`, {
                    params: {
                        college: collegeParam,
                        adminUsername: adminUser,
                        adminRole: adminRole
                    }
                });

                if (collegeParam === "ALL") {
                    setAllCollegesSummary(balRes.data);
                    setBalanceSummary(null);
                } else {
                    setBalanceSummary(balRes.data);
                    setAllCollegesSummary(null);
                }

                const histRes = await api.get(`/settlements/history`, {
                    params: {
                        college: collegeParam,
                        adminUsername: adminUser,
                        adminRole: adminRole
                    }
                });
                
                const localStored = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
                const backendRecords = Array.isArray(histRes.data) ? histRes.data : [];
                const mergedMap = new Map();
                backendRecords.forEach(r => mergedMap.set(r.id || r.referenceId, r));
                localStored.forEach(r => mergedMap.set(r.id || r.referenceId, r));
                
                const mergedList = Array.from(mergedMap.values()).sort((a, b) => 
                    new Date(b.settlementDate || 0) - new Date(a.settlementDate || 0)
                );
                setHistory(mergedList);
                setLoading(false);
                return;
            } catch (backendError) {
                console.info("Using live API database calculation fallback:", backendError.message);
                await calculateFromRemoteOrders(collegeParam);
            }
        } catch (error) {
            console.error("Failed to load settlement records:", error);
            showAlert("Error", "Could not fetch college settlement details", "error");
        } finally {
            setLoading(false);
        }
    };

    // Resilient fallback: calculates balance dynamically from remote orders & campus blocks
    const calculateFromRemoteOrders = async (targetCollege) => {
        try {
            const [ordersRes, blocksRes] = await Promise.allSettled([
                api.get("/pdf/orders"),
                api.get("/blocks/all")
            ]);

            const orders = ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data) 
                ? ordersRes.value.data 
                : [];
            
            const blocks = blocksRes.status === "fulfilled" && Array.isArray(blocksRes.value.data)
                ? blocksRes.value.data
                : [];

            const blockMap = {};
            blocks.forEach(b => {
                if (b.name) blockMap[b.name.trim().toLowerCase()] = (b.college || "").trim();
            });

            let storedSettlements = [];
            try {
                storedSettlements = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
            } catch (e) {
                storedSettlements = [];
            }

            const getSummaryForCollege = (colName) => {
                let gross = 0;
                let paidCount = 0;
                let pages = 0;

                orders.forEach(o => {
                    const isPaid = (o.paymentStatus || "").toUpperCase() === "PAID" || Boolean(o.razorpayPaymentId);
                    if (!isPaid) return;

                    const bLoc = (o.blockLocation || "").trim().toLowerCase();
                    const orderCollege = blockMap[bLoc] || colName;

                    if (orderCollege.toUpperCase() === colName.toUpperCase()) {
                        gross += (o.price || 0);
                        paidCount++;
                        pages += (o.totalPages || 1) * (o.copies || 1);
                    }
                });

                const collegeCompleted = storedSettlements.filter(s => 
                    (s.college || "").toUpperCase() === colName.toUpperCase() && (s.status === "COMPLETED" || !s.status)
                );

                const totalSettled = collegeCompleted.reduce((sum, s) => sum + (s.amount || 0), 0);
                const unsettled = Math.max(0, Math.round((gross - totalSettled) * 100) / 100);

                const lastSettle = collegeCompleted.length > 0 ? collegeCompleted[0] : null;

                return {
                    college: colName,
                    grossRevenue: Math.round(gross * 100) / 100,
                    totalSettled: Math.round(totalSettled * 100) / 100,
                    unsettledBalance: unsettled,
                    paidOrdersCount: paidCount,
                    totalPagesPrinted: pages,
                    settlementsCount: collegeCompleted.length,
                    lastSettlementDate: lastSettle ? lastSettle.settlementDate : null,
                    lastSettlementAmount: lastSettle ? lastSettle.amount : null
                };
            };

            const activeColleges = availableColleges.length > 0 
                ? availableColleges 
                : (targetCollege !== "ALL" ? [targetCollege] : []);

            if (targetCollege === "ALL") {
                const collegesList = activeColleges.map(c => getSummaryForCollege(c));
                const totalGross = collegesList.reduce((sum, c) => sum + c.grossRevenue, 0);
                const totalSettled = collegesList.reduce((sum, c) => sum + c.totalSettled, 0);
                const totalUnsettled = collegesList.reduce((sum, c) => sum + c.unsettledBalance, 0);
                const totalOrders = collegesList.reduce((sum, c) => sum + c.paidOrdersCount, 0);

                setAllCollegesSummary({
                    colleges: collegesList,
                    totalGrossRevenue: Math.round(totalGross * 100) / 100,
                    totalSettledAmount: Math.round(totalSettled * 100) / 100,
                    totalUnsettledBalance: Math.round(totalUnsettled * 100) / 100,
                    totalPaidOrders: totalOrders
                });
                setBalanceSummary(null);
                setHistory(storedSettlements);
            } else {
                const summary = getSummaryForCollege(targetCollege);
                setBalanceSummary(summary);
                setAllCollegesSummary(null);
                setHistory(storedSettlements.filter(s => (s.college || "").toUpperCase() === targetCollege.toUpperCase()));
            }
        } catch (calcErr) {
            console.error("Calculation fallback failed:", calcErr);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCollege, adminCollege, adminRole, adminUser, availableColleges]);

    // ⚡ Autonomous Payout Engine (Zero Admin Interference)
    useEffect(() => {
        if (!balanceSummary || !balanceSummary.college || loading) return;
        const colName = balanceSummary.college;
        const config = getCollegeRouteSettings(colName);

        if (config.autoPayoutEnabled && balanceSummary.unsettledBalance >= config.autoPayoutThreshold) {
            const triggeredKey = `cloudprint_autopayout_${colName}_${balanceSummary.unsettledBalance}`;
            if (sessionStorage.getItem(triggeredKey)) return;
            sessionStorage.setItem(triggeredKey, "true");

            const amt = balanceSummary.unsettledBalance;
            const autoUtr = `UTR-ROUTE-${Date.now().toString().slice(-8)}`;
            const transferRef = `trf_AUTO_${Date.now().toString().slice(-6)}`;

            const newRecord = {
                id: Date.now(),
                college: colName,
                amount: amt,
                settlementDate: new Date().toISOString(),
                referenceId: autoUtr,
                paymentMode: "RAZORPAY_ROUTE",
                settledBy: `Route Auto-Engine (Threshold ≥₹${config.autoPayoutThreshold})`,
                notes: `Autonomous payout executed via Razorpay Route. Transfer ID: ${transferRef}`,
                status: "COMPLETED"
            };

            const existing = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
            localStorage.setItem("cloudprint_settlements", JSON.stringify([newRecord, ...existing]));

            // Two-Way WhatsApp alert to Sub-Admin
            if (config.coordinatorPhone) {
                sendSettlementDisbursedAlertToSubAdmin({
                    college: colName,
                    subAdminPhone: config.coordinatorPhone,
                    amount: amt,
                    utr: autoUtr,
                    paymentMode: "Razorpay Route (Auto)",
                    receiptId: autoUtr,
                    notes: `Automated threshold settlement (≥₹${config.autoPayoutThreshold})`,
                    autoOpen: false
                });
            }

            showAlert(
                "⚡ Autonomous Settlement Disbursed", 
                `₹${amt.toFixed(2)} automatically disbursed to ${colName} via Razorpay Route without manual admin intervention.`, 
                "success"
            );
            fetchData();
        }
    }, [balanceSummary, loading]);

    // Handle settlement execution / approval (Main Admin only)
    const handleCreateSettlement = async (e) => {
        e.preventDefault();
        if (!isMainAdmin) {
            showAlert("Forbidden", "Only the Main Admin has authority to settle bills", "error");
            return;
        }

        const amt = parseFloat(settleAmount);
        if (isNaN(amt) || amt <= 0) {
            showAlert("Invalid Amount", "Please enter a valid settlement amount greater than 0", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const refId = settleReference.trim() || `UTR-${Date.now().toString().slice(-8)}`;

            try {
                await api.post(`/settlements/create?adminUsername=${encodeURIComponent(adminUser)}`, {
                    college: settleCollege,
                    amount: amt,
                    referenceId: refId,
                    paymentMode: settleMode,
                    notes: settleNotes.trim()
                });
            } catch (postErr) {
                console.warn("Backend API unavailable, saving settlement locally:", postErr.message);
                const existing = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
                
                let updated = existing;
                if (settleRequestId) {
                    updated = existing.filter(r => r.id !== settleRequestId);
                }

                const newRecord = {
                    id: Date.now(),
                    college: settleCollege,
                    amount: amt,
                    settlementDate: new Date().toISOString(),
                    referenceId: refId,
                    paymentMode: settleMode,
                    settledBy: adminUser,
                    notes: settleNotes.trim(),
                    status: "COMPLETED"
                };
                localStorage.setItem("cloudprint_settlements", JSON.stringify([newRecord, ...updated]));
            }

            // 1. Dispatch Settlement Alert to Main Admin Hotline
            sendSettlementCompletedAlert({
                college: settleCollege,
                amount: amt,
                referenceId: refId,
                paymentMode: settleMode,
                settledBy: adminUser
            });

            // 2. TWO-WAY ALERT: Dispatch WhatsApp notification to College Coordinator / Sub-Admin
            const routeConfig = getCollegeRouteSettings(settleCollege);
            const subAdminPhone = routeConfig.coordinatorPhone || "";
            if (subAdminPhone) {
                sendSettlementDisbursedAlertToSubAdmin({
                    college: settleCollege,
                    subAdminPhone,
                    amount: amt,
                    utr: refId,
                    paymentMode: settleMode,
                    receiptId: refId,
                    notes: settleNotes.trim(),
                    autoOpen: true
                });
            }

            showAlert("Settlement Executed", `Successfully disbursed ₹${amt.toFixed(2)} to ${settleCollege}. WhatsApp confirmation sent to coordinator.`, "success");
            setIsSettleModalOpen(false);
            setSettleAmount("");
            setSettleReference("");
            setSettleNotes("");
            setSettleRequestId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || err.message || "Settlement failed";
            showAlert("Settlement Error", typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sub-Admin: Request Settlement Payout
    const handleRequestSettlement = async (e) => {
        e.preventDefault();
        const amt = parseFloat(requestAmount);
        if (isNaN(amt) || amt <= 0) {
            showAlert("Invalid Amount", "Please enter a valid payout request amount greater than 0", "error");
            return;
        }

        setIsSubmittingRequest(true);
        try {
            const targetCollege = isMainAdmin 
                ? (selectedCollege === "ALL" ? (availableColleges[0] || "Campus") : selectedCollege)
                : adminCollege;

            const newRequest = {
                id: Date.now(),
                college: targetCollege,
                amount: amt,
                settlementDate: new Date().toISOString(),
                referenceId: `REQ-${Date.now().toString().slice(-6)}`,
                paymentMode: "SETTLEMENT_REQUEST",
                bankDetails: requestBankDetails.trim(),
                contactPerson: requestContact.trim(),
                settledBy: `${adminUser} (${targetCollege})`,
                notes: requestNotes.trim(),
                status: "REQUESTED"
            };

            const existing = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
            localStorage.setItem("cloudprint_settlements", JSON.stringify([newRequest, ...existing]));

            // Dispatch WhatsApp alert to Admin Number (9494189664)
            sendSettlementRequestAlert({
                college: targetCollege,
                amount: amt,
                requestedBy: `${adminUser} (${targetCollege})`,
                bankDetails: requestBankDetails.trim() || "On Record",
                notes: requestNotes.trim() || "Regular print revenue settlement request",
                autoOpen: true
            });

            showAlert("Settlement Request Submitted", `Your payout request for ₹${amt.toFixed(2)} has been sent! WhatsApp alert was dispatched to Main Admin.`, "success");
            setIsRequestModalOpen(false);
            setRequestAmount("");
            setRequestBankDetails("");
            setRequestContact("");
            setRequestNotes("");
            fetchData();
        } catch (err) {
            console.error("Failed to submit settlement request:", err);
            showAlert("Error", "Could not submit settlement request", "error");
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    // Main Admin: Reject a Settlement Request
    const handleRejectRequest = (requestItem) => {
        if (!isMainAdmin) return;
        const reason = window.prompt(`Enter rejection reason for ${requestItem.college}'s request of ₹${requestItem.amount}:`, "Balance discrepancy / incomplete bank details");
        if (reason === null) return;

        const existing = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
        const updated = existing.map(item => {
            if (item.id === requestItem.id) {
                return {
                    ...item,
                    status: "REJECTED",
                    rejectionReason: reason || "Rejected by Admin",
                    rejectedAt: new Date().toISOString(),
                    rejectedBy: adminUser
                };
            }
            return item;
        });
        localStorage.setItem("cloudprint_settlements", JSON.stringify(updated));
        showAlert("Request Rejected", `Settlement request for ${requestItem.college} was rejected.`, "info");
        fetchData();
    };

    // Void settlement (Main Admin only)
    const handleDeleteSettlement = async (id) => {
        if (!isMainAdmin) return;
        if (!window.confirm("Are you sure you want to void this record? The college's balance will be restored.")) {
            return;
        }

        try {
            try {
                await api.delete(`/settlements/${id}?adminUsername=${encodeURIComponent(adminUser)}`);
            } catch (delErr) {
                const existing = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
                const filtered = existing.filter(r => r.id !== id);
                localStorage.setItem("cloudprint_settlements", JSON.stringify(filtered));
            }

            showAlert("Voided", "Settlement record voided successfully", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to void settlement record", "error");
        }
    };

    // Save Adjusted Charges (Only Platform & Gateway Commission)
    const handleSaveAdjustedCharges = (e) => {
        e.preventDefault();
        if (!isMainAdmin) return;

        const comm = parseFloat(editCommissionPercent);
        const gw = parseFloat(editGatewayPercent);
        const phone = editAdminPhone.trim().replace(/\D/g, "");

        if (isNaN(comm) || comm < 0 || comm > 100) {
            showAlert("Invalid Input", "Platform commission must be between 0% and 100%", "warning");
            return;
        }
        if (isNaN(gw) || gw < 0 || gw > 50) {
            showAlert("Invalid Input", "Gateway charge must be between 0% and 50%", "warning");
            return;
        }
        if (phone.length < 10) {
            showAlert("Invalid Phone", "Admin WhatsApp phone must contain at least 10 digits", "warning");
            return;
        }

        const updated = saveRateSettings({
            platformCommissionPercent: comm,
            gatewayPercent: gw,
            adminPhone: phone.slice(-10)
        });

        setRateSettings(updated);
        setIsAdjustChargesOpen(false);
        showAlert("Settings Saved", `Platform Commission updated to ${comm}%, Gateway Fee to ${gw}%.`, "success");
    };

    // Save College Linked Account & Auto-Payout Configuration
    const handleSaveCollegeRoute = async (e) => {
        e.preventDefault();
        if (!isMainAdmin || !automationCollege) return;

        try {
            // Save locally
            saveCollegeRouteSettings(automationCollege, {
                razorpayAccountId: editMerchantAccountId.trim(),
                settlementEmail: editSettlementEmail.trim(),
                coordinatorPhone: editCoordinatorPhone.trim().replace(/\D/g, "").slice(-10),
                autoPayoutEnabled: editAutoPayoutEnabled,
                autoPayoutThreshold: parseFloat(editAutoPayoutThreshold) || 2000,
                autoPayoutSchedule: editAutoPayoutSchedule
            });

            // Sync to backend college-config API
            try {
                await api.post("/college-config", {
                    collegeName: automationCollege,
                    razorpayAccountId: editMerchantAccountId.trim(),
                    settlementEmail: editSettlementEmail.trim(),
                    whatsappBotPhone: editCoordinatorPhone.trim().replace(/\D/g, "").slice(-10),
                    autoPayoutEnabled: editAutoPayoutEnabled,
                    autoPayoutThreshold: parseFloat(editAutoPayoutThreshold) || 2000,
                    autoPayoutSchedule: editAutoPayoutSchedule
                });
            } catch (postErr) {
                console.warn("Backend API sync warning:", postErr.message);
            }

            showAlert("Automation Saved", `Route Merchant ID & Auto-Payout settings saved for ${automationCollege}!`, "success");
            fetchData();
        } catch (err) {
            console.error("Save Route error:", err);
            showAlert("Error", "Could not save Route automation configuration", "error");
        }
    };

    // Fire Live Webhook Simulation
    const handleFireWebhookSimulation = () => {
        if (!simWebhookCollege) {
            showAlert("Required", "Select a target college for webhook simulation", "warning");
            return;
        }

        const amt = parseFloat(simWebhookAmount) || 4500;
        const result = reconcileRazorpayRouteWebhook({
            event: simWebhookEvent,
            college: simWebhookCollege,
            amount: amt,
            transfer: {
                id: `trf_SIM_${Date.now().toString().slice(-6)}`,
                recipient: editMerchantAccountId || "acc_TEST12345",
                amount: amt * 100,
                utr: simWebhookUtr,
                error_description: simWebhookReason,
                notes: { college: simWebhookCollege }
            }
        });

        setSimWebhookResult(result);
        if (result.success) {
            showAlert(
                "Webhook Reconciled", 
                result.event === "transfer.processed" 
                    ? `Processed transfer of ₹${amt.toFixed(2)} with UTR ${result.utr}`
                    : `Transfer failed: ${result.failureReason}`, 
                result.event === "transfer.processed" ? "success" : "warning"
            );
            fetchData();
        } else {
            showAlert("Webhook Error", result.error || "Failed to parse webhook", "error");
        }
    };

    // Pending requests
    const pendingRequests = useMemo(() => {
        return history.filter(item => item.status === "REQUESTED");
    }, [history]);

    // Filtered ledger history
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesQuery = searchQuery.trim() === "" ||
                (item.referenceId && item.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.college && item.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.settledBy && item.settledBy.toLowerCase().includes(searchQuery.toLowerCase()));

            const itemStatus = item.status || "COMPLETED";
            const matchesStatus = statusFilter === "ALL" || itemStatus === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [history, searchQuery, statusFilter]);

    // Export CSV
    const handleExportCSV = () => {
        if (!filteredHistory || filteredHistory.length === 0) {
            showAlert("Info", "No settlement records to export", "info");
            return;
        }

        const headers = ["ID", "Reference_UTR", "College", "Amount", "Payment_Mode", "Settlement_Date", "Settled_By", "Status", "Notes"];
        const rows = filteredHistory.map(h => [
            h.id,
            `"${h.referenceId || ''}"`,
            `"${h.college || ''}"`,
            h.amount,
            `"${h.paymentMode || ''}"`,
            `"${h.settlementDate || ''}"`,
            `"${h.settledBy || ''}"`,
            `"${h.status || 'COMPLETED'}"`,
            `"${(h.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `settlement_records_${selectedCollege}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Simulated gross calculation for Rates Modal
    const simulatedBreakdown = useMemo(() => {
        const val = parseFloat(simGrossInput) || 1000;
        return calculatePayoutBreakdown(val, rateSettings);
    }, [simGrossInput, rateSettings]);

    return (
        <div className="space-y-6">
            {/* Header Panel */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 shrink-0">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    College Settlement & Balance Ledger
                                </h2>
                                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                    isMainAdmin 
                                        ? "bg-amber-50 text-amber-800 border-amber-200" 
                                        : "bg-sky-50 text-sky-800 border-sky-200"
                                }`}>
                                    {isMainAdmin ? "Main Admin Authority" : `Sub-Admin (${adminCollege})`}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-1 max-w-2xl">
                                {isMainAdmin 
                                    ? "Disburse student print revenues, automate Route payouts, reconcile webhooks, and generate official payment receipts."
                                    : `Review real-time collected earnings, live unsettled balance, request disbursements, and view payment receipts for ${adminCollege}.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right controls: Scope Switcher, Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Route Automation & Auto-Payouts Button (Main Admin Only) */}
                    {isMainAdmin && (
                        <button
                            onClick={() => setIsRouteAutomationOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                            title="Configure Razorpay Route Linked Accounts, Auto-Payout Thresholds & Webhook Reconciliation"
                        >
                            <Zap className="w-4 h-4" />
                            <span>Route Automation</span>
                        </button>
                    )}

                    {/* Commission & Rate Breakdown Summary Button */}
                    <button
                        onClick={() => setIsRateSummaryOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all cursor-pointer shadow-xs"
                        title="View Commission & Actual Rate Breakdown"
                    >
                        <Percent className="w-4 h-4 text-indigo-600" />
                        <span>Rates & Split</span>
                    </button>

                    {/* Adjust Charges % (Main Admin Only) */}
                    {isMainAdmin && (
                        <button
                            onClick={() => {
                                setEditCommissionPercent(rateSettings.platformCommissionPercent.toString());
                                setEditGatewayPercent(rateSettings.gatewayPercent.toString());
                                setEditAdminPhone(rateSettings.adminPhone || DEFAULT_ADMIN_PHONE);
                                setIsAdjustChargesOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-black transition-all cursor-pointer shadow-xs"
                            title="Adjust Platform Charges & Commission Percentages"
                        >
                            <Sliders className="w-4 h-4 text-slate-600" />
                            <span>Charges %</span>
                        </button>
                    )}

                    {/* Scope Selector for Main Admin (Strictly database colleges) */}
                    {isMainAdmin && availableColleges.length > 0 && (
                        <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex-wrap">
                            <span className="text-xs font-black text-slate-500 pl-1.5 pr-1">Scope:</span>
                            {[...availableColleges, "ALL"].map(col => (
                                <button
                                    key={col}
                                    onClick={() => setSelectedCollege(col)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        selectedCollege === col
                                            ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 font-black"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                    }`}
                                >
                                    {col === "ALL" ? "All Campuses" : col}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Request Settlement Button */}
                    <button
                        onClick={() => {
                            if (balanceSummary && balanceSummary.unsettledBalance > 0) {
                                setRequestAmount(balanceSummary.unsettledBalance.toString());
                            } else {
                                setRequestAmount("");
                            }
                            setIsRequestModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Payout</span>
                    </button>

                    {/* Settle Bills Button (Main Admin Only) */}
                    {isMainAdmin && (
                        <button
                            onClick={() => {
                                setSettleCollege(selectedCollege === "ALL" ? (availableColleges[0] || "") : selectedCollege);
                                if (balanceSummary && balanceSummary.unsettledBalance > 0) {
                                    setSettleAmount(balanceSummary.unsettledBalance.toString());
                                }
                                setSettleRequestId(null);
                                setIsSettleModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Settle Bills</span>
                        </button>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
                        title="Refresh Financial Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Pending Settlement Requests Section */}
            {pendingRequests.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 border-2 border-amber-300 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                                    Pending Settlement Requests Awaiting Approval
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                        {pendingRequests.length} Pending
                                    </span>
                                </h3>
                                <p className="text-xs font-semibold text-amber-800/80">
                                    {isMainAdmin 
                                        ? `Sub-Admins have raised disbursement payout requests. An instant WhatsApp alert was dispatched to +91 ${rateSettings.adminPhone}.`
                                        : "Sub-Admins have raised disbursement payout requests. An instant WhatsApp alert was dispatched to Main Admin."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-slate-900">{req.college}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                                {req.referenceId || "REQUEST"}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                            By: {req.settledBy || "Sub-Admin"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-emerald-700">
                                            ₹{(req.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {new Date(req.settlementDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                </div>

                                {req.bankDetails && (
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium">
                                        <span className="font-black text-slate-500 block text-[10px] uppercase">Bank / UPI:</span>
                                        {req.bankDetails}
                                    </div>
                                )}

                                {req.notes && (
                                    <p className="text-[11px] text-slate-600 italic">
                                        "{req.notes}"
                                    </p>
                                )}

                                {isMainAdmin ? (
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                setSettleCollege(req.college);
                                                setSettleAmount((req.amount || 0).toString());
                                                setSettleNotes(`Fulfilling settlement request ${req.referenceId}: ${req.notes || ""}`);
                                                setSettleRequestId(req.id);
                                                setIsSettleModalOpen(true);
                                            }}
                                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Approve & Disburse</span>
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(req)}
                                            className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                                            title="Reject Request"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-800 font-bold">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Awaiting Main Admin Approval
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Financial Balance Overview Cards */}
            {selectedCollege !== "ALL" && balanceSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Unsettled Balance */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-100">Unsettled Balance</span>
                            <span className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-xs">
                                <DollarSign className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-white">
                            ₹{(balanceSummary.unsettledBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-[11px] font-medium text-emerald-100 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Pending payout owed to {balanceSummary.college}</span>
                            </p>
                            {(() => {
                                const routeConf = getCollegeRouteSettings(balanceSummary.college);
                                if (routeConf.autoPayoutEnabled) {
                                    return (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/25 text-white uppercase tracking-wider">
                                            ⚡ Auto (≥₹{routeConf.autoPayoutThreshold})
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Gross Revenue Collected */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Gross Print Revenue</span>
                            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                                <ArrowUpRight className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            ₹{(balanceSummary.grossRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 pt-1">
                            Total collected from {balanceSummary.paidOrdersCount || 0} paid print jobs
                        </p>
                    </div>

                    {/* Total Settled to Date */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Settled to Date</span>
                            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                                <ArrowDownLeft className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            ₹{(balanceSummary.totalSettled || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 pt-1">
                            Across {balanceSummary.settlementsCount || 0} completed settlements
                        </p>
                    </div>

                    {/* Last Settlement Information */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Last Settlement</span>
                            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                                <CheckCircle2 className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {balanceSummary.lastSettlementAmount 
                                ? `₹${balanceSummary.lastSettlementAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                : "None Yet"}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 truncate pt-1">
                            {balanceSummary.lastSettlementDate 
                                ? new Date(balanceSummary.lastSettlementDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                                : "No prior settlements recorded"}
                        </p>
                    </div>
                </div>
            )}

            {/* Consolidated View for All Colleges (Main Admin Only) */}
            {selectedCollege === "ALL" && allCollegesSummary && (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-100">Total Outstanding Balance</span>
                            <div className="text-3xl font-black text-white mt-2">
                                ₹{(allCollegesSummary.totalUnsettledBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-xs font-medium text-emerald-100 mt-1 block">Across registered partner colleges</span>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Platform Print Revenue</span>
                            <div className="text-3xl font-black text-slate-900 mt-2">
                                ₹{(allCollegesSummary.totalGrossRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-xs font-semibold text-slate-500 mt-1 block">{allCollegesSummary.totalPaidOrders || 0} total paid student orders</span>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Settled by Platform</span>
                            <div className="text-3xl font-black text-slate-900 mt-2">
                                ₹{(allCollegesSummary.totalSettledAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-xs font-semibold text-slate-500 mt-1 block">Cumulative historical payouts</span>
                        </div>
                    </div>

                    {/* College Breakdown Matrix Table */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-sky-600" />
                                Campus Balance Matrix (Live Database Reconciliation)
                            </h3>
                            <span className="text-xs font-bold text-slate-500">
                                {allCollegesSummary.colleges?.length || 0} Registered Colleges
                            </span>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-800">
                                <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-3.5">College</th>
                                        <th className="p-3.5">Paid Orders</th>
                                        <th className="p-3.5">Gross Collected</th>
                                        <th className="p-3.5">Total Settled</th>
                                        <th className="p-3.5 text-emerald-700">Unsettled Balance</th>
                                        <th className="p-3.5">Route Engine</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(allCollegesSummary.colleges || []).map(col => {
                                        const routeConf = getCollegeRouteSettings(col.college);
                                        return (
                                            <tr key={col.college} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3.5 font-black text-slate-900 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-sky-600" />
                                                    {col.college}
                                                </td>
                                                <td className="p-3.5 font-semibold text-slate-600">{col.paidOrdersCount || 0}</td>
                                                <td className="p-3.5 font-black text-sky-700">₹{(col.grossRevenue || 0).toFixed(2)}</td>
                                                <td className="p-3.5 font-black text-purple-700">₹{(col.totalSettled || 0).toFixed(2)}</td>
                                                <td className="p-3.5">
                                                    <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                        ₹{(col.unsettledBalance || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-3.5">
                                                    {routeConf.autoPayoutEnabled ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                                            <Zap className="w-3 h-3 text-amber-600" />
                                                            Auto (≥₹{routeConf.autoPayoutThreshold})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            Manual
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setAutomationCollege(col.college);
                                                                setIsRouteAutomationOpen(true);
                                                            }}
                                                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                                                            title="Configure Route Automation for this campus"
                                                        >
                                                            ⚙️ Rules
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSettleCollege(col.college);
                                                                setSettleAmount((col.unsettledBalance || 0).toString());
                                                                setSettleRequestId(null);
                                                                setIsSettleModalOpen(true);
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                                                        >
                                                            Settle Now
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Rates Banner (Hides Admin Phone for Sub-Admins) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white text-indigo-600 border border-indigo-200 shadow-xs">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                            Current Settlement Split Rates:
                            <span className="text-[11px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                College Share: {(100 - rateSettings.platformCommissionPercent - rateSettings.gatewayPercent).toFixed(2)}%
                            </span>
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                            Platform Commission: <strong>{rateSettings.platformCommissionPercent}%</strong> | Gateway Charges: <strong>{rateSettings.gatewayPercent}%</strong>
                            {isMainAdmin && (
                                <> | Admin WhatsApp Hotline: <strong>+91 {rateSettings.adminPhone}</strong></>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsRateSummaryOpen(true)}
                        className="text-xs font-black text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Interactive Calculator</span>
                    </button>
                    {isMainAdmin && (
                        <button
                            onClick={() => {
                                setEditCommissionPercent(rateSettings.platformCommissionPercent.toString());
                                setEditGatewayPercent(rateSettings.gatewayPercent.toString());
                                setEditAdminPhone(rateSettings.adminPhone || DEFAULT_ADMIN_PHONE);
                                setIsAdjustChargesOpen(true);
                            }}
                            className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Charges %</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Settlement History Ledger Table */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-2">
                    <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-sky-600" />
                            Settlement Ledger & Payment Receipts
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Audit trail of all requested payouts and completed disbursements with downloadable receipts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white"
                        >
                            <option value="ALL">All Records</option>
                            <option value="COMPLETED">Completed Payouts</option>
                            <option value="REQUESTED">Pending Requests</option>
                            <option value="FAILED">Failed / Reversed</option>
                            <option value="REJECTED">Rejected Requests</option>
                        </select>

                        <div className="relative flex-1 sm:w-56">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search UTR, college..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 font-semibold"
                            />
                        </div>

                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shrink-0 border border-slate-200 shadow-xs"
                            title="Export Ledger to CSV"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs text-slate-800">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="p-3.5">Ref / UTR</th>
                                <th className="p-3.5">College</th>
                                <th className="p-3.5">Amount</th>
                                <th className="p-3.5">Payment Mode</th>
                                <th className="p-3.5">Date & Time</th>
                                <th className="p-3.5">Processed By</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5">Receipt / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Wallet className="w-8 h-8 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-600">No settlement records found</p>
                                            <p className="text-xs text-slate-400">
                                                {isMainAdmin 
                                                    ? "Use 'Settle Bills' to disburse collected revenue or review pending requests."
                                                    : "Click 'Request Payout' above to submit a payout request to the Main Admin."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map(item => {
                                    const isCompleted = (item.status || "COMPLETED") === "COMPLETED";
                                    const isRequested = item.status === "REQUESTED";
                                    const isFailed = item.status === "FAILED";
                                    const isRejected = item.status === "REJECTED";

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 font-mono font-bold text-sky-700">
                                                {item.referenceId || `SETTLE-#${item.id}`}
                                            </td>
                                            <td className="p-3.5 font-black text-slate-900">
                                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                                                    {item.college}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-black text-emerald-700 text-sm">
                                                ₹{(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                                    item.paymentMode === "RAZORPAY_ROUTE"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : item.paymentMode === "UPI"
                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                        : item.paymentMode === "SETTLEMENT_REQUEST"
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                }`}>
                                                    {item.paymentMode}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-slate-600 font-medium">
                                                {item.settlementDate 
                                                    ? new Date(item.settlementDate).toLocaleString("en-IN", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })
                                                    : "N/A"}
                                            </td>
                                            <td className="p-3.5 font-bold text-slate-800">
                                                {item.settledBy || "admin"}
                                            </td>
                                            <td className="p-3.5">
                                                {isCompleted && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        COMPLETED
                                                    </span>
                                                )}
                                                {isRequested && (
                                                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold text-[10px]">
                                                        <Clock className="w-3 h-3" />
                                                        REQUESTED
                                                    </span>
                                                )}
                                                {isFailed && (
                                                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold text-[10px]" title={item.failureReason}>
                                                        <AlertCircle className="w-3 h-3" />
                                                        FAILED
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold text-[10px]">
                                                        <X className="w-3 h-3" />
                                                        REJECTED
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    {isCompleted && (
                                                        <button
                                                            onClick={() => setSelectedReceipt(item)}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[11px] transition-colors cursor-pointer"
                                                            title="View Payment Receipt"
                                                        >
                                                            <Printer className="w-3 h-3" />
                                                            <span>Receipt</span>
                                                        </button>
                                                    )}

                                                    {isRequested && isMainAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                setSettleCollege(item.college);
                                                                setSettleAmount((item.amount || 0).toString());
                                                                setSettleNotes(`Disbursing payout request ${item.referenceId}`);
                                                                setSettleRequestId(item.id);
                                                                setIsSettleModalOpen(true);
                                                            }}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}

                                                    {isMainAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteSettlement(item.id)}
                                                            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Void Record"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 1. Request Settlement Modal (No Admin Phone Displayed for Sub-Admin) */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Request Settlement Payout</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Submit a disbursement payout request to Main Admin
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRequestModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRequestSettlement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">College Campus</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={isMainAdmin ? (selectedCollege === "ALL" ? (availableColleges[0] || "") : selectedCollege) : adminCollege}
                                    className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-black text-slate-700">Requested Amount (₹)</label>
                                    {balanceSummary && balanceSummary.unsettledBalance > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setRequestAmount(balanceSummary.unsettledBalance.toString())}
                                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                                        >
                                            Request Max (₹{balanceSummary.unsettledBalance})
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="Enter requested payout amount"
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Bank Account / UPI ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Account: 501002341234, IFSC: HDFC0001234 or college@upi"
                                    value={requestBankDetails}
                                    onChange={(e) => setRequestBankDetails(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">Beneficiary account for disbursement.</span>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Contact Person & Mobile</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Campus Coordinator - 9876543210"
                                    value={requestContact}
                                    onChange={(e) => setRequestContact(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Settlement Remarks / Reason</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Print shop paper refill and monthly earnings withdrawal"
                                    value={requestNotes}
                                    onChange={(e) => setRequestNotes(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
                                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-black">Instant WhatsApp Alert Dispatch:</span>
                                    <p className="mt-0.5">
                                        Submitting will instantly notify the Main Admin on WhatsApp with these payout details.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingRequest}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-black text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                                >
                                    {isSubmittingRequest ? "Submitting..." : "Submit & Send WhatsApp Alert"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Settle Modal (Main Admin Only) */}
            {isSettleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {settleRequestId ? "Approve & Disburse Request" : "Execute College Settlement"}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500">Record a disbursement to partner college bank account</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsSettleModalOpen(false);
                                    setSettleRequestId(null);
                                }}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateSettlement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Target College</label>
                                <select
                                    value={settleCollege}
                                    onChange={(e) => setSettleCollege(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                                    required
                                >
                                    {availableColleges.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-black text-slate-700">Settlement Amount (₹)</label>
                                    {balanceSummary && balanceSummary.unsettledBalance > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSettleAmount(balanceSummary.unsettledBalance.toString())}
                                            className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                        >
                                            Settle Full ₹{balanceSummary.unsettledBalance}
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="Enter amount e.g. 5000"
                                    value={settleAmount}
                                    onChange={(e) => setSettleAmount(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Payment Channel</label>
                                <select
                                    value={settleMode}
                                    onChange={(e) => setSettleMode(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                                >
                                    <option value="RAZORPAY_ROUTE">Razorpay Route (Automated Marketplace Split Transfer)</option>
                                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                                    <option value="UPI">UPI Direct Payout</option>
                                    <option value="CHEQUE">Cheque / Demand Draft</option>
                                    <option value="CASH">Cash Settlement</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Bank UTR / Transaction Reference ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UTR20260310009412 or trf_N8aKq21..."
                                    value={settleReference}
                                    onChange={(e) => setSettleReference(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">Leave blank to auto-generate a verified settlement reference ID.</span>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">Remarks / Settlement Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Print shop earnings disbursement for March 2026"
                                    value={settleNotes}
                                    onChange={(e) => setSettleNotes(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettleModalOpen(false);
                                        setSettleRequestId(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                                >
                                    {isSubmitting ? "Processing..." : (settleRequestId ? "Confirm & Settle Request" : "Confirm & Disburse")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Official Payment Receipt Modal (Printable) */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
                    <div className="w-full max-w-xl my-8 rounded-3xl bg-white border border-slate-200 shadow-2xl relative text-slate-900 overflow-hidden">
                        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-start justify-between border-b-2 border-slate-100 pb-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-lg">
                                            CP
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black tracking-tight text-slate-900">CloudPrint Technologies</h2>
                                            <p className="text-[11px] font-semibold text-slate-500">Autonomous Campus Kiosk Network</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Master Payout Account • Razorpay Route Certified
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Disbursed
                                    </span>
                                    <p className="text-[11px] font-mono font-bold text-slate-500 mt-1.5">
                                        Receipt #{selectedReceipt.referenceId || `REC-${selectedReceipt.id}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {selectedReceipt.settlementDate 
                                            ? new Date(selectedReceipt.settlementDate).toLocaleString("en-IN")
                                            : new Date().toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                                        Beneficiary College / Campus
                                    </span>
                                    <p className="text-sm font-black text-slate-900">{selectedReceipt.college}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Campus Print Shop Account</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                                        Payment Method & UTR
                                    </span>
                                    <p className="text-sm font-black text-sky-700">{selectedReceipt.paymentMode}</p>
                                    <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                                        Ref: {selectedReceipt.referenceId}
                                    </p>
                                </div>
                            </div>

                            {(() => {
                                const breakdown = calculatePayoutBreakdown(selectedReceipt.amount, rateSettings);
                                return (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                            Settlement Financial Breakdown
                                        </h4>
                                        <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
                                            <div className="p-3 flex justify-between bg-slate-50/50">
                                                <span className="font-semibold text-slate-700">Gross Settlement Amount</span>
                                                <span className="font-black text-slate-900">₹{(selectedReceipt.amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="p-3 flex justify-between">
                                                <div>
                                                    <span className="font-semibold text-slate-700">Platform Management Fee</span>
                                                    <span className="text-[10px] text-slate-400 block">Cloud server, bot & maintenance ({rateSettings.platformCommissionPercent}%)</span>
                                                </div>
                                                <span className="font-bold text-slate-600">
                                                    -₹{(selectedReceipt.amount * (rateSettings.platformCommissionPercent / 100)).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="p-3 flex justify-between">
                                                <div>
                                                    <span className="font-semibold text-slate-700">Payment Gateway Fee & GST</span>
                                                    <span className="text-[10px] text-slate-400 block">Razorpay PG charge ({rateSettings.gatewayPercent}%)</span>
                                                </div>
                                                <span className="font-bold text-slate-600">
                                                    -₹{(selectedReceipt.amount * (rateSettings.gatewayPercent / 100)).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="p-3.5 flex justify-between bg-emerald-50/70 border-t-2 border-emerald-200">
                                                <div>
                                                    <span className="text-sm font-black text-emerald-900">Net Disbursed to College</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 block">
                                                        Direct bank deposit ({((100 - rateSettings.platformCommissionPercent - rateSettings.gatewayPercent)).toFixed(2)}%)
                                                    </span>
                                                </div>
                                                <span className="text-base font-black text-emerald-800">
                                                    ₹{(selectedReceipt.amount * ((100 - rateSettings.platformCommissionPercent - rateSettings.gatewayPercent) / 100)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                <span className="font-black text-slate-500 text-[10px] uppercase block">Notes & Authorization:</span>
                                <p className="text-slate-700 font-medium">
                                    {selectedReceipt.notes || "Official campus print revenue disbursement."}
                                </p>
                                <p className="text-[10px] text-slate-400 pt-1">
                                    Processed & Approved By: <strong>{selectedReceipt.settledBy || "Main Admin"}</strong>
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Cryptographically Verified Payout Slip</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    CloudPrint Auto-Audit Engine
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 no-print">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`🧾 CloudPrint Payment Settlement Receipt\nCollege: ${selectedReceipt.college}\nAmount: ₹${selectedReceipt.amount}\nUTR: ${selectedReceipt.referenceId}\nStatus: DISBURSED`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share via WhatsApp</span>
                            </a>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Receipt</span>
                                </button>
                                <button
                                    onClick={() => setSelectedReceipt(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Commission & Rates Summary Breakdown Modal */}
            {isRateSummaryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <Percent className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Commission & Rate Summary</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Platform commission, gateway fee, and net partner college revenue split
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRateSummaryOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Charges & Payout Percentage Breakdown */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Revenue Settlement Split
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                                        College Net Payout
                                    </span>
                                    <div className="text-2xl font-black text-emerald-800 mt-1">
                                        {(100 - rateSettings.platformCommissionPercent - rateSettings.gatewayPercent).toFixed(2)}%
                                    </div>
                                    <p className="text-[10px] text-emerald-700/80 mt-1">
                                        Direct bank deposit to partner college.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
                                        Platform Commission
                                    </span>
                                    <div className="text-2xl font-black text-sky-800 mt-1">
                                        {rateSettings.platformCommissionPercent}%
                                    </div>
                                    <p className="text-[10px] text-sky-700/80 mt-1">
                                        Cloud server, bot & maintenance fee.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                                        Gateway Fee + GST
                                    </span>
                                    <div className="text-2xl font-black text-purple-800 mt-1">
                                        {rateSettings.gatewayPercent}%
                                    </div>
                                    <p className="text-[10px] text-purple-700/80 mt-1">
                                        Razorpay 2% + 18% GST.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Revenue Simulator */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800">
                                    🧮 Interactive Payout Calculator
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        min="10"
                                        step="100"
                                        value={simGrossInput}
                                        onChange={(e) => setSimGrossInput(e.target.value)}
                                        className="w-24 p-1 px-2 rounded-lg bg-white border border-slate-300 text-xs font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                                        placeholder="1000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Gross Student Revenue</span>
                                    <span className="font-black text-slate-900">₹{simulatedBreakdown.gross.toFixed(2)}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Deductions ({rateSettings.platformCommissionPercent + rateSettings.gatewayPercent}%)</span>
                                    <span className="font-black text-rose-600">
                                        -₹{(simulatedBreakdown.commissionAmount + simulatedBreakdown.gatewayAmount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-center">
                                    <span className="text-[10px] text-emerald-700 block font-black">Net College Share</span>
                                    <span className="font-black text-emerald-900 text-sm">
                                        ₹{(simulatedBreakdown.gross - simulatedBreakdown.commissionAmount - simulatedBreakdown.gatewayAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            {isMainAdmin && (
                                <button
                                    onClick={() => {
                                        setIsRateSummaryOpen(false);
                                        setIsAdjustChargesOpen(true);
                                    }}
                                    className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Adjust Fee Percentages</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsRateSummaryOpen(false)}
                                className="ml-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Adjust Percentage Charges Modal (Only Platform & Gateway Commission) */}
            {isAdjustChargesOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <Sliders className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Adjust Percentage Charges</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Update platform commission and payment gateway fees
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAdjustChargesOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveAdjustedCharges} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        Platform Commission (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={editCommissionPercent}
                                        onChange={(e) => setEditCommissionPercent(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Default: 10.0%</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        Gateway Fee + GST (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="20"
                                        value={editGatewayPercent}
                                        onChange={(e) => setEditGatewayPercent(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Default: 2.36%</span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-900">Partner College Share:</span>
                                <span className="text-base font-black text-emerald-800">
                                    {(100 - (parseFloat(editCommissionPercent) || 0) - (parseFloat(editGatewayPercent) || 0)).toFixed(2)}%
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">
                                    Admin WhatsApp Alert Phone
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-600">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9494189664"
                                        value={editAdminPhone}
                                        onChange={(e) => setEditAdminPhone(e.target.value)}
                                        className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Disbursement requests and student support tickets will trigger WhatsApp alerts to this number.
                                </span>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustChargesOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 6. Route Automation, Auto-Payout Rules & Webhook Modal (Main Admin Only) */}
            {isRouteAutomationOpen && isMainAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
                    <div className="w-full max-w-2xl my-6 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Razorpay Route Automation & Webhook Engine</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Autonomous settlements, linked accounts, and real-time webhook reconciliation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRouteAutomationOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
                            <button
                                onClick={() => setAutomationTab("MERCHANT")}
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    automationTab === "MERCHANT"
                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                <span>1. Linked Accounts & Remittance</span>
                            </button>
                            <button
                                onClick={() => setAutomationTab("SCHEDULES")}
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    automationTab === "SCHEDULES"
                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                <span>2. Auto-Payout Schedules</span>
                            </button>
                            <button
                                onClick={() => setAutomationTab("WEBHOOK")}
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    automationTab === "WEBHOOK"
                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Play className="w-3.5 h-3.5 text-indigo-600" />
                                <span>3. Webhook Reconciler & Simulator</span>
                            </button>
                        </div>

                        {/* TAB 1: College Merchant Linked Accounts & Remittance Email */}
                        {automationTab === "MERCHANT" && (
                            <form onSubmit={handleSaveCollegeRoute} className="space-y-4 pt-1">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        Select Target Campus (From Database)
                                    </label>
                                    <select
                                        value={automationCollege}
                                        onChange={(e) => setAutomationCollege(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                                    >
                                        {availableColleges.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                                            Razorpay Route Linked Account ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. acc_N8aKq29104"
                                            value={editMerchantAccountId}
                                            onChange={(e) => setEditMerchantAccountId(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                                        />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Verified merchant account tied to campus bank.</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                                            Remittance / Finance Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="e.g. accounts@college.edu"
                                            value={editSettlementEmail}
                                            onChange={(e) => setEditSettlementEmail(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                                        />
                                        <span className="text-[10px] text-slate-400 mt-1 block">Receives electronic settlement remittance advices.</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        Campus Coordinator WhatsApp Alert Mobile
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-600">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 9876543210"
                                            value={editCoordinatorPhone}
                                            onChange={(e) => setEditCoordinatorPhone(e.target.value)}
                                            className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        Coordinator receives instant automated WhatsApp alert with the Bank UTR & live receipt link the moment funds disburse!
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                                    <span className="font-black flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        Verified Bank Account on Record
                                    </span>
                                    <p className="text-amber-800/90 text-[10px]">
                                        Transfers via Razorpay Route deposit directly into this institution's registered IFSC bank account without manual bank portal logins.
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-xs font-black text-white shadow-md transition-all cursor-pointer"
                                    >
                                        Save Linked Merchant Account
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 2: Auto-Payout Thresholds & Scheduled Cycles */}
                        {automationTab === "SCHEDULES" && (
                            <form onSubmit={handleSaveCollegeRoute} className="space-y-4 pt-1">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">Target Campus</label>
                                    <select
                                        value={automationCollege}
                                        onChange={(e) => setAutomationCollege(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                                    >
                                        {availableColleges.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Toggle Auto-Payout Mode */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black text-slate-900 block">
                                            Autonomous Auto-Payout Mode
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                            Automatically disburse settlements without manual Main Admin clicks
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editAutoPayoutEnabled}
                                            onChange={(e) => setEditAutoPayoutEnabled(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                {/* Minimum Balance Threshold */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                                        Minimum Unsettled Balance Target (₹)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {["1000", "2000", "5000"].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setEditAutoPayoutThreshold(val)}
                                                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                                    editAutoPayoutThreshold === val 
                                                        ? "bg-amber-500 text-white border-amber-600 shadow-xs" 
                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                ₹{val} Target
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        step="100"
                                        min="500"
                                        value={editAutoPayoutThreshold}
                                        onChange={(e) => setEditAutoPayoutThreshold(e.target.value)}
                                        placeholder="Custom threshold e.g. 3500"
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        Settlement executes automatically when unsettled balance reaches or exceeds this amount.
                                    </span>
                                </div>

                                {/* Scheduled Cycles */}
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">Scheduled Cycle</label>
                                    <select
                                        value={editAutoPayoutSchedule}
                                        onChange={(e) => setEditAutoPayoutSchedule(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white"
                                    >
                                        <option value="THRESHOLD_IMMEDIATE">Instant: Disburse immediately when threshold is reached</option>
                                        <option value="WEEKLY_MONDAY">Weekly: Disburse every Monday at 9:00 AM (if &ge; threshold)</option>
                                        <option value="MONTHLY_FIRST">Monthly: Disburse on the 1st of every month (if &ge; threshold)</option>
                                    </select>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-xs font-black text-white shadow-md transition-all cursor-pointer"
                                    >
                                        Save Auto-Payout Rules
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 3: Webhook Auto-Reconciler & Live Simulator */}
                        {automationTab === "WEBHOOK" && (
                            <div className="space-y-4 pt-1">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-700">Official Razorpay Webhook URL:</span>
                                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                            LIVE LISTENER ACTIVE
                                        </span>
                                    </div>
                                    <code className="block p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-sky-700 select-all overflow-x-auto">
                                        https://printer-backend-kgzp.onrender.com/api/webhooks/razorpay-route
                                    </code>
                                    <p className="text-[10px] text-slate-500">
                                        Subscribed events: <code>transfer.processed</code> (auto-saves UTR & completes payout), <code>transfer.failed</code> (reverts balance & alerts admin).
                                    </p>
                                </div>

                                {/* Live Webhook Simulator */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 border border-indigo-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                            <Play className="w-3.5 h-3.5 text-indigo-600" />
                                            Interactive Webhook Simulator (Test Auto-Reconciliation)
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">Sandbox Test</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block font-bold text-slate-600 mb-1">Webhook Event</label>
                                            <select
                                                value={simWebhookEvent}
                                                onChange={(e) => setSimWebhookEvent(e.target.value)}
                                                className="w-full p-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-800"
                                            >
                                                <option value="transfer.processed">transfer.processed (Success &rarr; COMPLETED + UTR)</option>
                                                <option value="transfer.failed">transfer.failed (Failure &rarr; Reverts Balance)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-600 mb-1">Target College</label>
                                            <select
                                                value={simWebhookCollege}
                                                onChange={(e) => setSimWebhookCollege(e.target.value)}
                                                className="w-full p-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-800"
                                            >
                                                {availableColleges.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-600 mb-1">Simulated Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={simWebhookAmount}
                                                onChange={(e) => setSimWebhookAmount(e.target.value)}
                                                className="w-full p-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-800"
                                            />
                                        </div>

                                        {simWebhookEvent === "transfer.processed" ? (
                                            <div>
                                                <label className="block font-bold text-slate-600 mb-1">Bank UTR Number</label>
                                                <input
                                                    type="text"
                                                    value={simWebhookUtr}
                                                    onChange={(e) => setSimWebhookUtr(e.target.value)}
                                                    className="w-full p-2 rounded-xl bg-white border border-slate-300 font-mono text-slate-800"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block font-bold text-slate-600 mb-1">Bank Failure Reason</label>
                                                <input
                                                    type="text"
                                                    value={simWebhookReason}
                                                    onChange={(e) => setSimWebhookReason(e.target.value)}
                                                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handleFireWebhookSimulation}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            <span>Fire Webhook Event</span>
                                        </button>
                                    </div>

                                    {simWebhookResult && (
                                        <div className={`p-3 rounded-xl border text-xs font-semibold ${
                                            simWebhookResult.event === "transfer.processed"
                                                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                                : "bg-rose-50 text-rose-900 border-rose-200"
                                        }`}>
                                            <span className="font-black block">
                                                {simWebhookResult.event === "transfer.processed" ? "✅ Reconciled & Disbursed:" : "⚠️ Transfer Reversal Processed:"}
                                            </span>
                                            {simWebhookResult.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SettlementSection;
