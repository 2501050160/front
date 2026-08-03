import axios from "axios";

export const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://printer-backend-1.onrender.com";

const api = axios.create({
    baseURL: `${API_BASE}/api`
});

export const RAZORPAY_KEY =
    import.meta.env.VITE_RAZORPAY_KEY ||
    "rzp_live_T87am8Vgt9W2O9";

export const getPdfDownloadUrl = (id) =>
    `${API_BASE}/api/pdf/download/${id}`;

export default api;
