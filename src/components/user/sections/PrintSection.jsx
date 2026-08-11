import React, { useState } from "react";
import { FileUploadDropzone } from "./FileUploadDropzone";
import { FileConfigCard } from "./FileConfigCard";
import { OrderSummaryCard } from "./OrderSummaryCard";
import machineVideo from "../../../assets/machine.mp4";

export function PrintSection({
    selectedFiles = [],
    fileConfigs = [],
    onFilesSelected,
    onUpdateFileConfig,
    onRemoveFile,
    uploaded = false,
    isUploading = false,
    estimatedSheets = 0,
    basePrice = 0,
    estimatedTotal = 0,
    walletBalance = 0,
    couponApplied = false,
    couponDetails = null,
    onApplyCoupon,
    onRemoveCoupon,
    onPayWithWallet,
    onPayWithRazorpay,
    isProcessing = false,
    isLowPaper = false,
    paperCount = 500,
    isDisabled = false,
    disabledReason = "",
    colorSupported = true
}) {
    return (
        <div className="space-y-6">
            {/* Hero Kiosk Stage Banner */}
            <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl overflow-hidden">
                <div className="relative z-10 max-w-xl space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        ⚡ Instant Kiosk Terminal Release
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                        Cloud Print Studio
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300">
                        Upload your lab records, assignment notes, or PDF files. Pay via Wallet or UPI, and get your instant OTP code to pick up prints at your kiosk.
                    </p>

                    {/* Step Indicators */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-500/40">1</span>
                            <span className="text-xs font-bold text-white">Upload Files</span>
                        </div>
                        <span className="text-slate-600 font-bold">➔</span>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/40">2</span>
                            <span className="text-xs font-bold text-white">Pay (Wallet / UPI)</span>
                        </div>
                        <span className="text-slate-600 font-bold">➔</span>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/40">3</span>
                            <span className="text-xs font-bold text-white">Enter OTP at Kiosk</span>
                        </div>
                    </div>
                </div>

                {/* Looping Machine Video Preview */}
                <div className="relative h-48 sm:h-56 w-full md:w-80 shrink-0 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover"
                    >
                        <source src={machineVideo} type="video/mp4" />
                    </video>
                </div>
            </div>

            {/* Print Studio Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Columns: Uploader & Config List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* File Upload Dropzone */}
                    <FileUploadDropzone
                        onFilesSelected={onFilesSelected}
                        selectedFiles={selectedFiles}
                        isUploading={isUploading}
                        uploaded={uploaded}
                    />

                    {/* File Configuration Cards */}
                    {fileConfigs.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-white">
                                    Print Document Configurations ({fileConfigs.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {fileConfigs.map((cfg, idx) => (
                                    <FileConfigCard
                                        key={cfg.id || idx}
                                        file={selectedFiles[idx]}
                                        config={cfg}
                                        index={idx}
                                        onUpdateConfig={onUpdateFileConfig}
                                        onRemove={onRemoveFile}
                                        colorSupported={colorSupported}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary & Checkout */}
                <div className="w-full">
                    <OrderSummaryCard
                        estimatedSheets={estimatedSheets}
                        basePrice={basePrice}
                        estimatedTotal={estimatedTotal}
                        walletBalance={walletBalance}
                        couponApplied={couponApplied}
                        couponDetails={couponDetails}
                        onApplyCoupon={onApplyCoupon}
                        onRemoveCoupon={onRemoveCoupon}
                        onPayWithWallet={onPayWithWallet}
                        onPayWithRazorpay={onPayWithRazorpay}
                        isProcessing={isProcessing}
                        isLowPaper={isLowPaper}
                        paperCount={paperCount}
                        isDisabled={isDisabled}
                        disabledReason={disabledReason}
                    />
                </div>
            </div>
        </div>
    );
}

export default PrintSection;
