import React, { useState } from "react";
import { Palette, Plus, Trash2, Eye, ExternalLink, BellRing, Sparkles } from "lucide-react";
import api from "../../../services/api";

export function FrontendManagerSection({
    sections = [],
    popups = [],
    systemSettings = {},
    onFetchSections,
    onFetchPopups,
    onUpdateSystemSettings,
    showAlert,
    showConfirm
}) {
    // Banner form
    const [title, setTitle] = useState("");
    const [type, setType] = useState("ADVERTISING");
    const [content, setContent] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [order, setOrder] = useState(1);
    const [creatingBanner, setCreatingBanner] = useState(false);

    // Popup form
    const [popTitle, setPopTitle] = useState("");
    const [popMessage, setPopMessage] = useState("");
    const [popTarget, setPopTarget] = useState("ALL");
    const [creatingPopup, setCreatingPopup] = useState(false);

    const handleCreateBanner = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            showAlert("Required", "Title and content are required", "warning");
            return;
        }
        setCreatingBanner(true);
        try {
            await api.post("/sections/create", {
                title: title.trim(),
                sectionType: type,
                content: content.trim(),
                redirectUrl: redirectUrl.trim(),
                displayOrder: Number(order),
                active: true
            });
            showAlert("Success", "Promotional Banner created successfully", "success");
            setTitle("");
            setContent("");
            setRedirectUrl("");
            if (onFetchSections) onFetchSections();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to create banner", "error");
        } finally {
            setCreatingBanner(false);
        }
    };

    const handleDeleteBanner = (id) => {
        showConfirm("Delete Banner", "Are you sure you want to remove this banner?", async () => {
            try {
                await api.delete("/sections/delete", { params: { id } });
                showAlert("Success", "Banner removed", "success");
                if (onFetchSections) onFetchSections();
            } catch (error) {
                console.error(error);
                showAlert("Error", "Failed to delete banner", "error");
            }
        });
    };

    const handleCreatePopup = async (e) => {
        e.preventDefault();
        if (!popTitle.trim() || !popMessage.trim()) {
            showAlert("Required", "Title and message are required", "warning");
            return;
        }
        setCreatingPopup(true);
        try {
            await api.post("/popups/add", {
                title: popTitle.trim(),
                message: popMessage.trim(),
                targetPage: popTarget,
                active: true,
                dismissible: true
            });
            showAlert("Success", "Custom Announcement Modal created", "success");
            setPopTitle("");
            setPopMessage("");
            if (onFetchPopups) onFetchPopups();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to create popup", "error");
        } finally {
            setCreatingPopup(false);
        }
    };

    const handleDeletePopup = (id) => {
        showConfirm("Delete Popup", "Are you sure you want to remove this popup?", async () => {
            try {
                await api.delete("/popups/delete", { params: { id } });
                showAlert("Success", "Popup removed", "success");
                if (onFetchPopups) onFetchPopups();
            } catch (error) {
                console.error(error);
                showAlert("Error", "Failed to delete popup", "error");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Header info */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan-400" />
                    Frontend Experience & Announcement Manager
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Publish dynamic in-app banners, campus news announcements, and targeted student popups in real-time.
                </p>
            </div>

            {/* 1. Promotional Banners Creator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleCreateBanner} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Create Banner / Notice
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Appears directly in the student dashboard hero</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Banner Headline</label>
                            <input
                                type="text"
                                placeholder="Semester Exam Special Offer!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Banner Body Message</label>
                            <textarea
                                rows={3}
                                placeholder="Get 20% off on all color lab manual printouts this week..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Redirect URL (Optional)</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={creatingBanner}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {creatingBanner ? "Publishing..." : "Publish Banner"}
                    </button>
                </form>

                {/* Active Banners List */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-white">Live Frontend Banners</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {sections.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                                No promotional banners published yet.
                            </div>
                        ) : (
                            sections.map(sec => (
                                <div key={sec.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <h5 className="font-black text-sm text-white">{sec.title}</h5>
                                        <p className="text-xs text-slate-400">{sec.content}</p>
                                        {sec.redirectUrl && (
                                            <a href={sec.redirectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline">
                                                <ExternalLink className="w-3 h-3" />
                                                {sec.redirectUrl}
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBanner(sec.id)}
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

            {/* 2. Announcement Modal Popups */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleCreatePopup} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <BellRing className="w-4 h-4 text-purple-400" />
                            Targeted Modal Popup
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Appears as an alert popup upon student login</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Popup Title</label>
                            <input
                                type="text"
                                placeholder="Important Campus Maintenance Notice"
                                value={popTitle}
                                onChange={(e) => setPopTitle(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Announcement Message</label>
                            <textarea
                                rows={3}
                                placeholder="C Block printer tray maintenance scheduled tonight from 10 PM..."
                                value={popMessage}
                                onChange={(e) => setPopMessage(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={creatingPopup}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {creatingPopup ? "Creating..." : "Save Popup"}
                    </button>
                </form>

                {/* Active Popups */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-white">Active Popups</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {popups.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                                No modal popups currently active.
                            </div>
                        ) : (
                            popups.map(pop => (
                                <div key={pop.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <h5 className="font-black text-sm text-white">{pop.title}</h5>
                                        <p className="text-xs text-slate-300">"{pop.message}"</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePopup(pop.id)}
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

export default FrontendManagerSection;
