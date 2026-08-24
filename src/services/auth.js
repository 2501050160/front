import api from "./api";

export async function loginUser(email, password) {
    const response = await api.post("/login", {
        email,
        password
    });

    return response.data;
}

export async function registerUser(user) {
    const response = await api.post("/register", user);

    return response.data;
}

export function persistUser(user) {
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userCollege", user.college || "KLU");
    localStorage.setItem("lastActivity", String(Date.now()));
    if (user.referralCode) {
        localStorage.setItem("referralCode", user.referralCode);
    }

    if (user.walletBalance != null) {
        localStorage.setItem(
            "walletBalance",
            String(user.walletBalance)
        );
        try {
            window.dispatchEvent(new CustomEvent("walletUpdated", { detail: Number(user.walletBalance) }));
        } catch (e) {}
    }
}

export function clearUserSession() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userCollege");
    localStorage.removeItem("referralCode");
    localStorage.removeItem("walletBalance");
    localStorage.removeItem("selectedBlock");
    localStorage.removeItem("order");
    localStorage.removeItem("lastActivity");
    try {
        window.dispatchEvent(new CustomEvent("walletUpdated", { detail: 0 }));
    } catch (e) {}
}

export async function getWalletBalance(userId) {
    const response = await api.get("/wallet/balance", {
        params: { userId }
    });

    const balanceNum = Number(response.data != null ? response.data : 0);
    localStorage.setItem(
        "walletBalance",
        String(balanceNum)
    );

    try {
        window.dispatchEvent(new CustomEvent("walletUpdated", { detail: balanceNum }));
    } catch (e) {}

    return balanceNum;
}

export function getStoredWalletBalance() {
    const value = localStorage.getItem("walletBalance");

    return value ? Number(value) : 0;
}
