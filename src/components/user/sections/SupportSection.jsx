import React, { useState } from "react";
import { Headphones, MessageSquare, Send, Phone, HelpCircle, CheckCircle } from "lucide-react";
import api from "../../../services/api";

export function SupportSection({
    userName = "",
    userEmail = "",
    showAlert
}) {
    const [name, setName] = useState(userName);
    const [email, setEmail] = useState(userEmail);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [botPhone, setBotPhone] = useState("918688500278");
    const [botCollege, setBotCollege] = useState("");

    React.useEffect(() => {
        const fetchBot = async () => {
            try {
                const userCol = localStorage.getItem("userCollege") || "KLU";
                const res = await api.get("/college-config");
                if (res.data && Array.isArray(res.data)) {
                    let target = res.data.find(c => c.collegeName && c.collegeName.toUpperCase() === userCol.toUpperCase() && c.whatsappBotPhone);
                    if (!target) target = res.data.find(c => c.dedicatedBotEnabled && c.whatsappBotPhone);
                    if (!target) target = res.data.find(c => c.whatsappBotPhone);
                    if (target && target.whatsappBotPhone) {
                        const digits = target.whatsappBotPhone.replace(/\D/g, "");
                        const formatted = digits.length === 10 ? `91${digits}` : digits;
                        if (formatted) {
                            setBotPhone(formatted);
                            setBotCollege(target.collegeName || userCol);
                        }
                    }
                }
            } catch (e) {}
        };
        fetchBot();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            showAlert("Required", "Please enter your query or issue message", "warning");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/support/create", {
                name: name.trim() || "Student",
                email: email.trim() || userEmail,
                message: message.trim()
            });
            showAlert("Ticket Submitted", "Our campus technician team has received your request.", "success");
            setMessage("");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to submit support ticket", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const faqs = [
        { q: "Where do I enter my OTP code?", a: "Walk up to your designated campus kiosk screen, tap 'Release Prints' and enter the 4-digit PIN." },
        { q: "What happens if a printer runs out of paper?", a: "Your order stays safely queued until refilled, or you can cancel within the cancellation window for a full wallet refund." },
        { q: "How do refunds work?", a: "Cancelled or failed jobs are automatically refunded back to your Cloud Print wallet within seconds." }
    ];

    return (
        <div className="space-y-6">
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-cyan-400" />
                    Student Helpdesk & Technical Support
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    Need help with paper jams, failed payments, or custom printing formats?
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submit Ticket Form */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        Raise a Support Ticket
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Describe Your Issue</label>
                        <textarea
                            rows={4}
                            placeholder="e.g. Order #1234 did not print at C Block kiosk..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? "Submitting..." : "Send Ticket to Technicians"}
                    </button>
                </form>

                {/* FAQs & WhatsApp Support */}
                <div className="space-y-4">
                    {/* WhatsApp Fast Helpline */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Phone className="w-5 h-5" />
                            <h4 className="text-sm font-black text-white">Emergency WhatsApp Bot</h4>
                        </div>
                        <p className="text-xs text-slate-300">
                            Need instant help at a kiosk? Message our automated AI bot on WhatsApp directly.
                        </p>
                        <button
                            onClick={() => window.open(`https://wa.me/${botPhone}?text=Hi`, "_blank")}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                            Open WhatsApp Chat {botCollege ? `(${botCollege})` : ""}
                        </button>
                    </div>

                    {/* FAQs */}
                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                            Frequently Asked Questions
                        </h4>
                        <div className="space-y-2.5 text-xs">
                            {faqs.map((f, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                                    <p className="font-bold text-white">{f.q}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{f.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SupportSection;
