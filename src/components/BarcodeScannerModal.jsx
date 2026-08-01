import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, ScanLine, ShieldCheck } from "lucide-react";

function BarcodeScannerModal({ isOpen, onClose, onResult }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState("");
    const [cameraState, setCameraState] = useState("idle");
    const containerId = "barcode-scanner-container";

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        setError("");
        setCameraState("requesting");

        const stopScanner = async () => {
            if (!scannerRef.current) return;
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            } catch {
                // Ignore cleanup errors when camera permission was interrupted.
            } finally {
                scannerRef.current = null;
            }
        };

        const startScanner = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState("error");
                setError("Camera access is not available in this browser. Please use Chrome or open the site over HTTPS.");
                return;
            }

            try {
                const permissionStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } }
                });
                permissionStream.getTracks().forEach((track) => track.stop());

                if (cancelled) return;

                setCameraState("starting");
                const scanner = new Html5Qrcode(containerId, {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39
                    ],
                    verbose: false
                });
                scannerRef.current = scanner;

                const width = Math.min(window.innerWidth - 56, 420);
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 12,
                        qrbox: { width, height: Math.max(160, Math.round(width * 0.46)) },
                        aspectRatio: 1.777
                    },
                    async (decodedText) => {
                        await stopScanner();
                        if (!cancelled) {
                            onResult(decodedText);
                        }
                    },
                    () => {}
                );

                if (!cancelled) {
                    setCameraState("ready");
                }
            } catch (err) {
                console.error("Camera scanner failed:", err);
                setCameraState("error");
                if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
                    setError("Camera permission was blocked. Please allow camera access in the browser prompt, then try scanning again.");
                } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
                    setError("No camera was found on this device.");
                } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
                    setError("Camera scanning requires HTTPS. Please open the deployed secure website, then try again.");
                } else {
                    setError("Could not start the camera. Close this scanner and try again, or enter the OTP manually.");
                }
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [isOpen, onResult]);

    if (!isOpen) return null;

    const handleClose = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            } catch {
                // Best-effort cleanup.
            } finally {
                scannerRef.current = null;
            }
        }
        onClose();
    };

    const statusText = {
        requesting: "Please allow camera permission in the browser prompt.",
        starting: "Starting camera...",
        ready: "Align the QR or barcode inside the frame.",
        error: "Camera could not start.",
        idle: "Preparing scanner..."
    }[cameraState];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0D1524] shadow-2xl overflow-hidden">
                <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-purple-500" />
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Scan to Release</p>
                                <p className="text-sm font-extrabold text-white">Allow camera, then scan the kiosk QR/barcode</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="px-4 pt-4 pb-3">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black min-h-[280px]">
                        {(cameraState === "requesting" || cameraState === "starting" || cameraState === "idle") && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 text-center px-6">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-7 h-7 text-cyan-300" />
                                </div>
                                <p className="text-sm font-black text-white">{statusText}</p>
                                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                                    Your browser may show an Allow/Block camera permission popup. Choose Allow to open the scanner.
                                </p>
                            </div>
                        )}
                        <div id={containerId} className="min-h-[280px] [&_video]:!w-full [&_video]:!min-h-[280px] [&_video]:!object-cover [&_canvas]:!hidden" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold text-center mt-3 flex items-center justify-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                        {statusText}
                    </p>
                </div>

                {error && (
                    <div className="mx-4 mb-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400">
                        {error}
                    </div>
                )}

                <div className="px-4 pb-5">
                    <button onClick={handleClose} className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-bold transition-all">
                        Cancel and enter OTP manually
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BarcodeScannerModal;
