import React, { useState } from "react";
import { BellRing, Send, Trash2, Info, AlertTriangle, ShieldAlert } from "lucide-react";
import api from "../../../services/api";

export function NotificationsSection({
    notifications = [],
    onFetchNotifications,
    showAlert,
    showConfirm
}) {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [college, setCollege] = useState("ALL");
    const [type, setType] = useState("INFO");
    const [publishing, setPublishing] = useState(false);

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            showAlert("Required", "Notification title and message are required", "warning");
            return;
        }

        setPublishing(true);
        try {
            await api.post("/notifications/create", {
                title: title.trim(),
                message: message.trim(),
                college,
                type
            });
            showAlert("Success", "Notification broadcasted successfully", "success");
            setTitle("");
            setMessage("");
            if (onFetchNotifications) onFetchNotifications();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to broadcast notification", "error");
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = (id) => {
        showConfirm("Delete Alert", "Are you sure you want to remove this notification?", async () => {
            try {
                await api.delete("/notifications/delete", { params: { id } });
                showAlert("Deleted", "Notification removed", "success");
                if (onFetchNotifications) onFetchNotifications();
            } catch (error) {
                console.error(error);
                showAlert("Error", "Failed to delete notification", "error");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-cyan-400" />
                    Campus Broadcast Notifications & Alerts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Push urgent messages, system updates, and kiosk alerts directly to student dashboards.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notification Form */}
                <form onSubmit={handlePublish} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-white">Broadcast New Alert</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Alert Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Mechanical Lab Kiosk Restocked"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Message Content</label>
                            <textarea
                                rows={3}
                                placeholder="Paper trays have been refilled with fresh 80GSM bond sheets..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Target Campus</label>
                                <select
                                    value={college}
                                    onChange={(e) => setCollege(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                                >
                                    <option value="ALL">All Campuses</option>
                                    <option value="KLU">KLU</option>
                                    <option value="VNR">VNR</option>
                                    <option value="CBIT">CBIT</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Alert Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                                >
                                    <option value="INFO">Information</option>
                                    <option value="WARNING">Warning</option>
                                    <option value="ALERT">Critical Alert</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={publishing}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {publishing ? "Broadcasting..." : "Broadcast Alert"}
                    </button>
                </form>

                {/* Sent Notifications List */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-white">Active Campus Broadcasts</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                                No active broadcast notifications published.
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                notif.type === "ALERT" ? "bg-rose-500/20 text-rose-300" :
                                                notif.type === "WARNING" ? "bg-amber-500/20 text-amber-300" :
                                                "bg-cyan-500/20 text-cyan-300"
                                            }`}>
                                                {notif.type || "INFO"}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400">Campus: {notif.college || "ALL"}</span>
                                        </div>
                                        <h5 className="font-black text-sm text-white">{notif.title}</h5>
                                        <p className="text-xs text-slate-300">{notif.message}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationsSection;
