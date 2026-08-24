import axios from "axios";

export const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://printer-backend-kgzp.onrender.com";

const api = axios.create({
    baseURL: `${API_BASE}/api`
});

export const RAZORPAY_KEY =
    import.meta.env.VITE_RAZORPAY_KEY ||
    "rzp_live_TOBWLIHZxellOE";

export const getPdfDownloadUrl = (id) =>
    `${API_BASE}/api/pdf/download/${id}`;

export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (typeof window !== "undefined" && window.Razorpay) {
            resolve(true);
            return;
        }
        const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(true));
            existingScript.addEventListener("error", () => resolve(false));
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const memoryCache = new Map();

export const cachedGet = async (url, ttlMs = 30000) => {
    const now = Date.now();
    const cached = memoryCache.get(url);
    if (cached && (now - cached.timestamp < ttlMs)) {
        return cached.data;
    }
    const response = await api.get(url);
    memoryCache.set(url, { timestamp: now, data: response.data });
    return response.data;
};

export const clearCache = (urlPattern) => {
    if (!urlPattern) {
        memoryCache.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.includes(urlPattern)) {
            memoryCache.delete(key);
        }
    }
};

export default api;
