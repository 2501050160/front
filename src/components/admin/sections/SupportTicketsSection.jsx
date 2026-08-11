import React, { useState } from "react";
import { Headphones, MessageSquare, CheckCircle, Clock, Search, AlertCircle, Mail } from "lucide-react";
import api from "../../../services/api";

export function SupportTicketsSection({
    tickets = [],
    onFetchTickets,
    showAlert,
    showConfirm
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleResolveTicket = async (id) => {
        try {
            await api.post("/support/resolve", null, { params: { id } });
            showAlert("Success", "Support ticket resolved successfully", "success");
            if (onFetchTickets) onFetchTickets();
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update ticket status", "error");
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (t.name || "").toLowerCase().includes(q) ||
               (t.email || "").toLowerCase().includes(q) ||
               (t.message || "").toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-cyan-400" />
                        Student Support Desk & Queries
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Assisting students with payment disputes and kiosk print failures</p>
                </div>
                <div className="relative w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search tickets by name or message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTickets.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                        No support tickets currently open.
                    </div>
                ) : (
                    filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-white">{ticket.name || "Student"}</h4>
                                        <p className="text-xs text-cyan-400 flex items-center gap-1 mt-0.5">
                                            <Mail className="w-3 h-3" />
                                            {ticket.email}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                        ticket.status === "RESOLVED"
                                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                    }`}>
                                        {ticket.status || "PENDING"}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                    "{ticket.message}"
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                                <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Recent"}</span>
                                {ticket.status !== "RESOLVED" && (
                                    <button
                                        onClick={() => handleResolveTicket(ticket.id)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default SupportTicketsSection;
