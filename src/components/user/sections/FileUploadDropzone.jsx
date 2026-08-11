import React, { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Plus } from "lucide-react";

export function FileUploadDropzone({
    onFilesSelected,
    selectedFiles = [],
    isUploading = false,
    uploaded = false
}) {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected({ target: { files: e.dataTransfer.files } });
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`relative p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                isDragOver
                    ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                    : uploaded
                    ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400"
                    : "border-cyan-500/30 bg-slate-900/60 hover:border-cyan-400/60 hover:bg-slate-900/80"
            }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={onFilesSelected}
                className="hidden"
            />

            {/* Icon State */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                uploaded
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-cyan-500/15 text-cyan-400 shadow-lg shadow-cyan-500/20"
            }`}>
                {uploaded ? <CheckCircle2 className="w-8 h-8" /> : <UploadCloud className="w-8 h-8 animate-bounce" />}
            </div>

            {/* Headline */}
            <div>
                <h3 className="text-base font-black text-white">
                    {uploaded
                        ? `${selectedFiles.length} Document${selectedFiles.length > 1 ? "s" : ""} Uploaded & Parsed`
                        : "Click to upload or drag & drop files"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Supports PDF documents, Lab Manuals, Presentations (Max 50MB per file)
                </p>
            </div>

            {/* Action Chip */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-cyan-600/20 text-cyan-300 border border-cyan-500/30">
                <Plus className="w-3.5 h-3.5" />
                <span>{selectedFiles.length > 0 ? "Add More Files" : "Browse Files from Device"}</span>
            </div>
        </div>
    );
}

export default FileUploadDropzone;
