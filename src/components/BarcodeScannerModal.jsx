import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera, ScanLine } from "lucide-react";

function BarcodeScannerModal({ isOpen, onClose, onResult }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState("");
    const containerId = "barcode-scanner-container";

    useEffect(() => {
        if (!isOpen) return;
        setError("");

        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                containerId,
                {
                    fps: 10,
                    qrbox: { width: 260, height: 110 },
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                },
                false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear().catch(() => {});
                    onResult(decodedText);
                },
                () => {}
            );

            scannerRef.current = scanner;
        }, 150);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#0D1524] shadow-2xl overflow-hidden">
                <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-purple-500" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Scan to Release</p>
                                <p className="text-sm font-extrabold text-white">Point at barcode on Kiosk screen</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="px-4 pt-4 pb-3">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black min-h-[240px]">
                        <div id={containerId} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold text-center mt-3 flex items-center justify-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                        Align the barcode within the camera frame
                    </p>
                </div>

                {error && (
                    <div className="mx-4 mb-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400">
                        ⚠️ {error}
                    </div>
                )}

                <div className="px-4 pb-5">
                    <button onClick={handleClose} className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-bold transition-all">
                        Cancel — Enter OTP manually instead
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BarcodeScannerModal;
