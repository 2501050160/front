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

export default api;
