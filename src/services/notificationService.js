/**
 * CloudPrint Notification & Payout Fee Engine
 * Manages WhatsApp alerts to Admin (9494189664), Sub-Admins / Coordinators,
 * Razorpay Route Webhook Auto-Reconciliation, and Auto-Payout Schedules.
 */

export const DEFAULT_ADMIN_PHONE = "9494189664";

export const DEFAULT_RATE_SETTINGS = {
    platformCommissionPercent: 10.0, // 10% CloudPrint platform management & infrastructure
    gatewayPercent: 2.36,            // 2% Razorpay standard fee + 18% GST = 2.36%
    bwSingleRate: 2.00,              // ₹2.00 / page
    bwDoubleRate: 3.50,              // ₹3.50 / sheet
    colorSingleRate: 10.00,          // ₹10.00 / page
    colorDoubleRate: 18.00,          // ₹18.00 / sheet
    adminPhone: DEFAULT_ADMIN_PHONE
};

/**
 * Retrieves the current platform rate settings from localStorage with fallback to defaults
 */
export function getRateSettings() {
    try {
        const stored = localStorage.getItem("cloudprint_rate_settings");
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_RATE_SETTINGS,
                ...parsed,
                platformCommissionPercent: parseFloat(parsed.platformCommissionPercent) || DEFAULT_RATE_SETTINGS.platformCommissionPercent,
                gatewayPercent: parseFloat(parsed.gatewayPercent) || DEFAULT_RATE_SETTINGS.gatewayPercent,
                adminPhone: parsed.adminPhone || DEFAULT_ADMIN_PHONE
            };
        }
    } catch (e) {
        console.warn("Could not read rate settings from localStorage:", e);
    }
    return { ...DEFAULT_RATE_SETTINGS };
}

/**
 * Persists updated rate and charge percentage settings to localStorage
 */
export function saveRateSettings(newSettings) {
    try {
        const current = getRateSettings();
        const updated = {
            ...current,
            ...newSettings,
            platformCommissionPercent: parseFloat(newSettings.platformCommissionPercent) ?? current.platformCommissionPercent,
            gatewayPercent: parseFloat(newSettings.gatewayPercent) ?? current.gatewayPercent,
            adminPhone: (newSettings.adminPhone || current.adminPhone || DEFAULT_ADMIN_PHONE).trim().replace(/\D/g, "").slice(-10)
        };
        localStorage.setItem("cloudprint_rate_settings", JSON.stringify(updated));
        window.dispatchEvent(new Event("cloudprint_rates_updated"));
        return updated;
    } catch (e) {
        console.error("Failed to save rate settings:", e);
        return getRateSettings();
    }
}

/**
 * Per-college Razorpay Route Linked Account & Autonomous Payout Settings
 */
export const DEFAULT_COLLEGE_ROUTE_SETTINGS = {
    razorpayAccountId: "",             // e.g. acc_N8aKq29104
    settlementEmail: "",               // e.g. finance@college.edu
    coordinatorPhone: "",              // Sub-admin WhatsApp mobile
    autoPayoutEnabled: false,          // Zero-interference auto-payout
    autoPayoutThreshold: 2000,         // Disburse when unsettled >= ₹2,000
    autoPayoutSchedule: "THRESHOLD_IMMEDIATE" // THRESHOLD_IMMEDIATE, WEEKLY_MONDAY, MONTHLY_FIRST
};

export function getCollegeRouteSettings(college) {
    if (!college) return { ...DEFAULT_COLLEGE_ROUTE_SETTINGS };
    try {
        const key = `cloudprint_route_settings_${college.toUpperCase().trim()}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return {
                ...DEFAULT_COLLEGE_ROUTE_SETTINGS,
                ...JSON.parse(stored)
            };
        }
    } catch (e) {
        console.warn(`Could not read Route settings for ${college}:`, e);
    }
    return { ...DEFAULT_COLLEGE_ROUTE_SETTINGS };
}

export function saveCollegeRouteSettings(college, settings) {
    if (!college) return null;
    try {
        const key = `cloudprint_route_settings_${college.toUpperCase().trim()}`;
        const current = getCollegeRouteSettings(college);
        const updated = {
            ...current,
            ...settings,
            autoPayoutThreshold: parseFloat(settings.autoPayoutThreshold) || 2000,
            autoPayoutEnabled: Boolean(settings.autoPayoutEnabled)
        };
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("cloudprint_route_updated", { detail: { college, updated } }));
        return updated;
    } catch (e) {
        console.error(`Failed to save Route settings for ${college}:`, e);
        return null;
    }
}

/**
 * Formats a phone number for WhatsApp deep links (+91 prefix)
 */
export function formatWhatsAppPhone(phone) {
    if (!phone) return `91${DEFAULT_ADMIN_PHONE}`;
    const digits = phone.toString().replace(/\D/g, "");
    if (digits.length === 10) {
        return `91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits;
    }
    return digits.length >= 10 ? `91${digits.slice(-10)}` : `91${DEFAULT_ADMIN_PHONE}`;
}

/**
 * Calculates itemized breakdown for a given gross revenue amount
 */
export function calculatePayoutBreakdown(grossAmount = 0, customSettings = null) {
    const gross = Math.max(0, parseFloat(grossAmount) || 0);
    const settings = customSettings || getRateSettings();

    const commissionPercent = parseFloat(settings.platformCommissionPercent) || 0;
    const gatewayPercent = parseFloat(settings.gatewayPercent) || 0;

    const commissionAmount = Math.round(gross * (commissionPercent / 100) * 100) / 100;
    const gatewayAmount = Math.round(gross * (gatewayPercent / 100) * 100) / 100;
    const netPayout = Math.max(0, Math.round((gross - commissionAmount - gatewayAmount) * 100) / 100);
    const collegeSharePercent = Math.max(0, 100 - commissionPercent - gatewayPercent);

    return {
        gross: Math.round(gross * 100) / 100,
        commissionPercent,
        commissionAmount,
        gatewayPercent,
        gatewayAmount,
        netPayout,
        collegeSharePercent: parseFloat(collegeSharePercent.toFixed(2))
    };
}

/**
 * Dispatches a WhatsApp notification with direct URL fallback
 */
export function dispatchWhatsAppAlert({ phone, message, autoOpen = true }) {
    const targetPhone = formatWhatsAppPhone(phone || getRateSettings().adminPhone);
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${targetPhone}?text=${encoded}`;
    const apiWaUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`;

    console.log(`[WhatsApp Alert to +${targetPhone}]`, message);

    if (autoOpen && typeof window !== "undefined") {
        try {
            const win = window.open(waUrl, "_blank", "noopener,noreferrer");
            if (!win || win.closed || typeof win.closed === "undefined") {
                console.info("WhatsApp popup available:", waUrl);
            }
        } catch (e) {
            console.warn("Could not auto-open WhatsApp:", e);
        }
    }

    return {
        success: true,
        phone: targetPhone,
        message,
        url: waUrl,
        apiWaUrl
    };
}

/**
 * Dispatches WhatsApp Alert when a Settlement Payout is requested by a Sub-Admin
 */
export function sendSettlementRequestAlert({
    college = "Campus",
    amount = 0,
    requestedBy = "Sub-Admin",
    bankDetails = "",
    notes = "",
    autoOpen = true
}) {
    const settings = getRateSettings();
    const formattedAmount = (parseFloat(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const timeString = new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const msg = 
`🚨 *NEW SETTLEMENT REQUEST* 🚨
━━━━━━━━━━━━━━━━━━━━━━
🏫 *College Campus*: *${college}*
💰 *Requested Payout*: *₹${formattedAmount}*
👤 *Requested By*: ${requestedBy}
🏦 *Bank / Account Details*: ${bankDetails || "On Record (Linked Account)"}
📝 *Remarks / Notes*: ${notes || "Standard student print revenue payout"}
⏱️ *Timestamp*: ${timeString}
━━━━━━━━━━━━━━━━━━━━━━
⚡ *Action Required*: Main Admin review & disbursement pending at:
🔗 Admin Portal: ${window?.location?.origin || "https://cloudprint.app"}/admin?tab=colleges&subtab=settlements
📞 Admin Alert Hotline: +91 ${settings.adminPhone}`;

    return dispatchWhatsAppAlert({
        phone: settings.adminPhone,
        message: msg,
        autoOpen
    });
}

/**
 * Two-Way Alert: Dispatches WhatsApp Alert to College Sub-Admin / Coordinator upon disbursement
 */
export function sendSettlementDisbursedAlertToSubAdmin({
    college = "Campus",
    subAdminPhone = "",
    amount = 0,
    utr = "",
    paymentMode = "Razorpay Route",
    receiptId = "",
    notes = "",
    autoOpen = true
}) {
    if (!subAdminPhone) return null;
    const formattedAmount = (parseFloat(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const timeString = new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    const receiptLink = `${window?.location?.origin || "https://cloudprint.app"}/admin?tab=colleges&subtab=settlements&receipt=${receiptId || utr}`;

    const msg = 
`✅ *CLOUD PRINT SETTLEMENT DISBURSED* ✅
━━━━━━━━━━━━━━━━━━━━━━
🏫 *Beneficiary Campus*: *${college}*
💰 *Net Disbursed Amount*: *₹${formattedAmount}*
🏛️ *Bank UTR / Transaction Ref*: ${utr || "Verified Bank Transfer"}
💳 *Payment Mode*: ${paymentMode}
⏱️ *Settlement Timestamp*: ${timeString}
${notes ? `📝 *Notes*: ${notes}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━
🧾 *View & Download Verified Payout Receipt*:
👉 ${receiptLink}

📞 CloudPrint Automated Campus Settlement Desk`;

    return dispatchWhatsAppAlert({
        phone: subAdminPhone,
        message: msg,
        autoOpen
    });
}

/**
 * Dispatches WhatsApp Alert when Main Admin successfully disburses a settlement
 */
export function sendSettlementCompletedAlert({
    college = "Campus",
    amount = 0,
    referenceId = "",
    paymentMode = "BANK_TRANSFER",
    settledBy = "Main Admin"
}) {
    const settings = getRateSettings();
    const formattedAmount = (parseFloat(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const timeString = new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const msg = 
`✅ *PAYMENT SETTLEMENT DISBURSED* ✅
━━━━━━━━━━━━━━━━━━━━━━
🏫 *Beneficiary College*: *${college}*
💰 *Disbursed Amount*: *₹${formattedAmount}*
💳 *Payment Mode*: ${paymentMode}
🏛️ *UTR / Reference*: ${referenceId}
👤 *Settled By*: ${settledBy}
⏱️ *Date & Time*: ${timeString}
━━━━━━━━━━━━━━━━━━━━━━
🧾 Verified Settlement Slip Generated.
📞 Admin Dispatch Hotline: +91 ${settings.adminPhone}`;

    return dispatchWhatsAppAlert({
        phone: settings.adminPhone,
        message: msg,
        autoOpen: false
    });
}

/**
 * Dispatches WhatsApp Alert when any student raises a Support Ticket
 */
export function sendSupportTicketAlert({
    name = "Student",
    email = "student@campus.edu",
    message = "",
    college = "Campus",
    autoOpen = true
}) {
    const settings = getRateSettings();
    const timeString = new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const msg = 
`🎫 *NEW SUPPORT TICKET RAISED* 🎫
━━━━━━━━━━━━━━━━━━━━━━
👤 *Student Name*: *${name}*
📧 *Student Email*: ${email}
🏫 *College / Campus*: ${college || "CloudPrint Campus"}
📝 *Issue Description*:
"${message}"
⏱️ *Submitted At*: ${timeString}
━━━━━━━━━━━━━━━━━━━━━━
⚠️ *Action Required*: Student requires assistance.
📞 Admin Alert Dispatched to: +91 ${settings.adminPhone}`;

    return dispatchWhatsAppAlert({
        phone: settings.adminPhone,
        message: msg,
        autoOpen
    });
}

/**
 * Razorpay Route Webhook Auto-Reconciliation Engine
 * Processes incoming webhook events:
 * - transfer.processed: Marks record COMPLETED, binds official bank UTR, dispatches sub-admin confirmation
 * - transfer.failed: Reverts balance to unsettled, marks FAILED, alerts Main Admin
 */
export function reconcileRazorpayRouteWebhook(webhookEvent) {
    if (!webhookEvent || typeof webhookEvent !== "object") {
        return { success: false, error: "Invalid webhook event payload" };
    }

    const eventType = webhookEvent.event || webhookEvent.type || "";
    const transferEntity = webhookEvent.payload?.transfer?.entity || webhookEvent.transfer || {};
    const transferId = transferEntity.id || `trf_${Date.now().toString().slice(-8)}`;
    const utr = transferEntity.utr || `UTR${Date.now().toString().slice(-8)}`;
    const college = (transferEntity.notes?.college || webhookEvent.college || "").trim();
    const amount = transferEntity.amount ? transferEntity.amount / 100 : (webhookEvent.amount || 0);
    const failureReason = transferEntity.error_description || transferEntity.error_reason || "Bank transaction rejected / account inactive";

    console.log(`[Razorpay Webhook Handler] Received ${eventType} for ${college} (Transfer: ${transferId}, UTR: ${utr})`);

    let settlements = [];
    try {
        settlements = JSON.parse(localStorage.getItem("cloudprint_settlements") || "[]");
    } catch (e) {
        settlements = [];
    }

    if (eventType === "transfer.processed") {
        // Find pending or requested record
        let recordUpdated = false;
        settlements = settlements.map(item => {
            const matchesCollege = college && item.college && item.college.toUpperCase() === college.toUpperCase();
            const matchesId = item.referenceId === transferId || (item.referenceId && item.referenceId.startsWith("REQ-"));
            if ((matchesCollege && item.status !== "COMPLETED") || matchesId) {
                recordUpdated = true;
                return {
                    ...item,
                    status: "COMPLETED",
                    referenceId: utr,
                    settledBy: "Razorpay Route Webhook",
                    settlementDate: new Date().toISOString(),
                    notes: `Auto-reconciled via Razorpay Route transfer ${transferId}`
                };
            }
            return item;
        });

        if (!recordUpdated) {
            // Create completed payout record directly
            const newRecord = {
                id: Date.now(),
                college: college || "Campus",
                amount: amount || 0,
                settlementDate: new Date().toISOString(),
                referenceId: utr,
                paymentMode: "RAZORPAY_ROUTE",
                settledBy: "Razorpay Route Webhook",
                notes: `Auto-reconciled from transfer.processed (${transferId})`,
                status: "COMPLETED"
            };
            settlements = [newRecord, ...settlements];
        }

        localStorage.setItem("cloudprint_settlements", JSON.stringify(settlements));
        window.dispatchEvent(new Event("cloudprint_settlements_updated"));

        // Dispatch confirmation to Sub-Admin if phone configured
        const routeConfig = getCollegeRouteSettings(college);
        if (routeConfig.coordinatorPhone) {
            sendSettlementDisbursedAlertToSubAdmin({
                college,
                subAdminPhone: routeConfig.coordinatorPhone,
                amount,
                utr,
                paymentMode: "Razorpay Route (Auto)",
                receiptId: utr,
                autoOpen: false
            });
        }

        return {
            success: true,
            event: "transfer.processed",
            college,
            amount,
            utr,
            transferId,
            message: `Successfully reconciled: ₹${amount.toFixed(2)} credited to ${college} with UTR ${utr}`
        };
    }

    if (eventType === "transfer.failed") {
        // Mark settlement or request as FAILED
        let recordUpdated = false;
        settlements = settlements.map(item => {
            const matchesCollege = college && item.college && item.college.toUpperCase() === college.toUpperCase();
            if (matchesCollege && item.status !== "COMPLETED") {
                recordUpdated = true;
                return {
                    ...item,
                    status: "FAILED",
                    failureReason,
                    notes: `Transfer failed: ${failureReason}`
                };
            }
            return item;
        });

        if (!recordUpdated) {
            const failedRecord = {
                id: Date.now(),
                college: college || "Campus",
                amount: amount || 0,
                settlementDate: new Date().toISOString(),
                referenceId: `FAILED-${transferId}`,
                paymentMode: "RAZORPAY_ROUTE",
                settledBy: "Razorpay Route Webhook",
                notes: `Transfer failed: ${failureReason}`,
                failureReason,
                status: "FAILED"
            };
            settlements = [failedRecord, ...settlements];
        }

        localStorage.setItem("cloudprint_settlements", JSON.stringify(settlements));
        window.dispatchEvent(new Event("cloudprint_settlements_updated"));

        // Dispatch alert to Main Admin
        const adminPhone = getRateSettings().adminPhone;
        dispatchWhatsAppAlert({
            phone: adminPhone,
            message: 
`🚨 *RAZORPAY ROUTE TRANSFER FAILED* 🚨
━━━━━━━━━━━━━━━━━━━━━━
🏫 *College*: *${college}*
💰 *Amount*: ₹${amount.toFixed(2)}
⚠️ *Failure Reason*: ${failureReason}
🆔 *Transfer ID*: ${transferId}
⏱️ *Timestamp*: ${new Date().toLocaleString("en-IN")}
━━━━━━━━━━━━━━━━━━━━━━
Funds have been retained in the college's unsettled balance. Action required.`,
            autoOpen: false
        });

        return {
            success: true,
            event: "transfer.failed",
            college,
            amount,
            transferId,
            failureReason,
            message: `Transfer failed for ${college}. Funds preserved in unsettled balance.`
        };
    }

    return { success: false, error: `Unhandled event type: ${eventType}` };
}
