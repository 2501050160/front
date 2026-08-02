import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import PrinterCard from "../components/PrinterCard";

function PrinterSettings() {
    const navigate = useNavigate();

    const [printers, setPrinters] = useState([]);
    const [allBlocks, setAllBlocks] = useState([]);
    const [blockLocation, setBlockLocation] = useState("");
    const [printerName, setPrinterName] = useState("");
    const [printerIp, setPrinterIp] = useState("");
    const [active, setActive] = useState(true);
    const [maintenance, setMaintenance] = useState(false);
    const [qrScanToPrint, setQrScanToPrint] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState(true);
    const [colourSupported, setColourSupported] = useState(false);
    const [paused, setPaused] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const adminId = localStorage.getItem("adminId");

        if (!adminId) {
            navigate("/admin-login");
            return;
        }

        fetchPrinters();
        fetchBlocks();
    }, []);

    const fetchBlocks = async () => {
        try {
            const response = await api.get("/admin/blocks/all");
            setAllBlocks(response.data || []);
            if (response.data && response.data.length > 0 && !blockLocation) {
                setBlockLocation(response.data[0].name);
            }
        } catch (error) {
            console.error("Error fetching blocks:", error);
        }
    };

    const fetchPrinters = async () => {
        try {
            const response = await api.get("/printer/all");
            setPrinters(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loggedInAdminRole = localStorage.getItem("adminRole") || "SUB_ADMIN";
    const loggedInAdminCollege = localStorage.getItem("adminCollege") || "KLU";
    const loggedInAdminUser = localStorage.getItem("adminUser") || "";

    const displayBlocks = allBlocks.filter(b => {
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            return b.college && b.college.toUpperCase() === loggedInAdminCollege.toUpperCase();
        }
        return true;
    });

    const displayPrinters = printers.filter(p => {
        if ((loggedInAdminRole === "SUB_ADMIN" || loggedInAdminRole === "MANAGER") && loggedInAdminUser !== "admin") {
            const b = allBlocks.find(x => x.name === p.blockLocation);
            const col = b ? b.college : "KLU";
            return col.toUpperCase() === loggedInAdminCollege.toUpperCase();
        }
        return true;
    });

    const savePrinter = async () => {
        if (!blockLocation || !printerName) {
            alert("Block location and printer name are required");
            return;
        }

        try {
            await api.post("/printer/save", {
                id: editingId,
                blockLocation,
                printerName,
                printerIp,
                active,
                maintenance,
                qrScanToPrint,
                otpEnabled,
                colourSupported,
                paused
            });

            setPrinterName("");
            setPrinterIp("");
            setActive(true);
            setMaintenance(false);
            setQrScanToPrint(false);
            setOtpEnabled(true);
            setColourSupported(false);
            setPaused(false);
            setEditingId(null);
            fetchPrinters();
            logManagerAction("PRINTER_UPDATE", `Updated printer details for ${printerName} in ${blockLocation}`);
            alert(editingId ? "Printer updated successfully" : "Printer saved successfully");
        } catch (error) {
            console.error(error);
            alert(editingId ? "Unable to update printer" : "Unable to save printer");
        }
    };

    const logManagerAction = async (actionType, details) => {
        try {
            await api.post("/admin/logs/create", {
                managerName: loggedInAdminUser,
                college: loggedInAdminCollege,
                actionType: actionType,
                details: details
            });
        } catch (error) {
            console.error("Failed to log manager action", error);
        }
    };

    const toggleMaintenance = async (printer) => {
        try {
            await api.post("/printer/save", {
                id: printer.id,
                blockLocation: printer.blockLocation,
                printerName: printer.printerName,
                printerIp: printer.printerIp,
                active: printer.active,
                maintenance: !printer.maintenance,
                qrScanToPrint: printer.qrScanToPrint,
                otpEnabled: printer.otpEnabled,
                colourSupported: printer.colourSupported,
                paused: printer.paused
            });
            fetchPrinters();
            logManagerAction("MAINTENANCE_TOGGLE", `Toggled maintenance for printer ${printer.printerName} in ${printer.blockLocation} to ${!printer.maintenance}`);
        } catch (error) {
            console.error("Failed to toggle maintenance", error);
            alert("Failed to toggle maintenance status");
        }
    };

    const updatePaperCount = async (printer) => {
        const newCountStr = window.prompt(`Enter new paper count for ${printer.printerName}:`, printer.paperCount || 500);
        if (newCountStr === null) return;
        const newCount = parseInt(newCountStr, 10);
        if (isNaN(newCount) || newCount < 0) {
            alert("Invalid paper count");
            return;
        }

        try {
            await api.post("/printer/updatePaper", null, {
                params: {
                    blockLocation: printer.blockLocation,
                    paperCount: newCount
                }
            });
            fetchPrinters();
            logManagerAction("PAPER_COUNT_UPDATE", `Updated paper count for block ${printer.blockLocation} to ${newCount}`);
        } catch (error) {
            console.error("Failed to update paper count", error);
            alert("Failed to update paper count");
        }
    };

    const handleEdit = (printer) => {
        setEditingId(printer.id);
        setBlockLocation(printer.blockLocation);
        setPrinterName(printer.printerName || "");
        setPrinterIp(printer.printerIp || "");
        setActive(printer.active !== false);
        setMaintenance(printer.maintenance === true);
        setQrScanToPrint(printer.qrScanToPrint === true);
        setOtpEnabled(printer.otpEnabled !== false);
        setColourSupported(printer.colourSupported === true);
        setPaused(printer.paused === true);
    };

    const cancelEdit = () => {
        setPrinterName("");
        setPrinterIp("");
        setActive(true);
        setMaintenance(false);
        setQrScanToPrint(false);
        setOtpEnabled(true);
        setColourSupported(false);
        setPaused(false);
        setEditingId(null);
    };

    const toggleBwForColor = async (id) => {
        try {
            await api.post("/printer/toggleBwForColor", null, { params: { id } });
            fetchPrinters();
        } catch (error) {
            console.error(error);
            alert("Failed to toggle B&W setting for printer");
        }
    };

    const deletePrinter = async (id) => {
        try {
            await api.delete("/printer/delete", {
                params: { id }
            });

            fetchPrinters();
        } catch (error) {
            console.error(error);
            alert("Unable to delete printer");
        }
    };

    return (
        <main className="page-shell">
            <div className="content-wrap">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Navbar
                        title="Printer Settings"
                        subtitle="Admin Configuration"
                        actions={[
                            {
                                label: "Admin Dashboard",
                                path: "/admin"
                            },
                            {
                                label: "Display Panel",
                                path: "/display-panel"
                            }
                        ]}
                    />
                </motion.div>

                <motion.section
                    className="panel mt-6 p-6"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="eyebrow">Register Printer</p>
                    <h2 className="text-2xl font-black text-slate-900">
                        Block Printer Mapping
                    </h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Block Location</label>
                            <select
                                value={blockLocation}
                                onChange={(e) => setBlockLocation(e.target.value)}
                                className="field"
                            >
                                {displayBlocks.length === 0 && <option value="" disabled>Loading blocks...</option>}
                                {displayBlocks.map(b => (
                                    <option key={b.id} value={b.name}>{b.name} ({b.college || "KLU"})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Printer Name</label>
                            <input
                                type="text"
                                placeholder="Windows printer name"
                                value={printerName}
                                onChange={(e) => setPrinterName(e.target.value)}
                                className="field"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Printer IP / USB</label>
                            <input
                                type="text"
                                placeholder="Printer IP (optional)"
                                value={printerIp}
                                onChange={(e) => setPrinterIp(e.target.value)}
                                className="field"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Operation Status</label>
                            <select
                                value={paused ? "paused" : active ? "active" : "inactive"}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "paused") {
                                        setPaused(true);
                                        setActive(false);
                                    } else if (val === "active") {
                                        setPaused(false);
                                        setActive(true);
                                    } else {
                                        setPaused(false);
                                        setActive(false);
                                    }
                                }}
                                className="field"
                            >
                                <option value="active">Active (Online & Ready)</option>
                                <option value="paused">Paused ⏸️</option>
                                <option value="inactive">Inactive 🚫</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Maintenance Status</label>
                            <select
                                value={maintenance ? "true" : "false"}
                                onChange={(e) => setMaintenance(e.target.value === "true")}
                                className="field font-bold text-amber-600 bg-amber-50/50"
                            >
                                <option value="false">Normal Operation</option>
                                <option value="true">Under Maintenance 🛠️</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Supported Output Type</label>
                            <select
                                value={colourSupported ? "true" : "false"}
                                onChange={(e) => setColourSupported(e.target.value === "true")}
                                className="field font-bold text-emerald-600 bg-emerald-50/50"
                            >
                                <option value="false">Black & White Only 📄</option>
                                <option value="true">Supports Color & BW 🎨</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">QR Scan Flow</label>
                            <select
                                value={qrScanToPrint ? "true" : "false"}
                                onChange={(e) => setQrScanToPrint(e.target.value === "true")}
                                className="field font-bold text-sky-600 bg-sky-50/50"
                            >
                                <option value="false">Direct Printing</option>
                                <option value="true">Scan-to-Print 🔐</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">OTP Release flow</label>
                            <select
                                value={otpEnabled ? "true" : "false"}
                                onChange={(e) => setOtpEnabled(e.target.value === "true")}
                                className="field font-bold text-violet-600 bg-violet-50/50"
                            >
                                <option value="true">OTP Required 🔑</option>
                                <option value="false">No OTP Direct ⚡</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 justify-end">
                        {editingId && (
                            <button onClick={cancelEdit} className="btn secondary px-6 py-2.5">
                                Cancel Edit
                            </button>
                        )}
                        <button onClick={savePrinter} className="btn success px-8 py-2.5">
                            {editingId ? "Update Printer" : "Save Printer"}
                        </button>
                    </div>
                </motion.section>

                <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displayPrinters.map((printer) => (
                        <PrinterCard
                            key={printer.id}
                            printer={printer}
                            onEdit={handleEdit}
                            onDelete={loggedInAdminUser === "admin" ? deletePrinter : null}
                            onToggleMaintenance={(loggedInAdminRole === "MANAGER" || loggedInAdminRole === "SUB_ADMIN" || loggedInAdminUser === "admin") ? toggleMaintenance : null}
                            onToggleBwForColor={(loggedInAdminRole === "MANAGER" || loggedInAdminRole === "SUB_ADMIN" || loggedInAdminUser === "admin") ? toggleBwForColor : null}
                            onUpdatePaper={(loggedInAdminRole === "MANAGER" || loggedInAdminRole === "SUB_ADMIN" || loggedInAdminUser === "admin") ? updatePaperCount : null}
                        />
                    ))}

                    {displayPrinters.length === 0 && (
                        <div className="panel p-6 text-center font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                            No printers configured yet
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default PrinterSettings;
