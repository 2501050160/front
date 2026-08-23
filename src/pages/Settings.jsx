import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Save, 
  Percent, 
  Clock, 
  Megaphone, 
  Coins,
  FileText,
  Shield,
  KeyRound,
  Globe,
  Smartphone
} from "lucide-react";
import api from "../services/api";

function Settings() {
  const [settings, setSettings] = useState({
    referralEnabled: true,
    referrerAmount: 10.0,
    refereeAmount: 5.0,
    popupEnabled: true,
    popupMessage: "",
    adEnabled: true,
    adText: "",
    generalPopupEnabled: false,
    generalPopupMessage: "",
    thesisDiscountPages: 50.0,
    thesisDiscountPercent: 15.0,
    cancelWindowEnabled: true,
    displayAdPhotoEnabled: true,
    testerModeEnabled: false,
    testerUsernames: "",
    webOtpRequired: true,
    whatsappOtpRequired: true
  });

  const [pricing, setPricing] = useState({
    bwRate: 2.0,
    colorRate: 10.0
  });

  const [otpRules, setOtpRules] = useState({
    collegeRules: {},
    blockRules: {}
  });

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/admin/settings");
      setSettings(response.data);
      
      const pricingRes = await api.get("/pricing/rates");
      if (pricingRes.data) {
        setPricing({
          bwRate: pricingRes.data.bwRate || 2.0,
          colorRate: pricingRes.data.colorRate || 10.0
        });
      }

      try {
        const otpRes = await api.get("/admin/settings/otp-rules");
        if (otpRes.data) {
          setOtpRules({
            collegeRules: otpRes.data.collegeRules || {},
            blockRules: otpRes.data.blockRules || {}
          });
        }
      } catch (err) {
        console.warn("Could not fetch OTP rules:", err);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await api.post("/admin/settings/update", settings);
      await api.post(`/pricing/rates/update?bwRate=${pricing.bwRate}&colorRate=${pricing.colorRate}`);
      await api.post("/admin/settings/otp-rules/update", {
        webOtpRequired: settings.webOtpRequired,
        whatsappOtpRequired: settings.whatsappOtpRequired,
        collegeOverrides: otpRules.collegeRules,
        blockOverrides: otpRules.blockRules
      });
      alert("System configuration and OTP security rules saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings configuration");
    }
  };

  return (
    <div className="page-shell dot-grid">
      <div className="content-wrap relative z-10">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="eyebrow">Operations</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                System Configurations <SettingsIcon className="w-6 h-6 text-blue-600" />
              </h1>
            </div>
          </div>

          <button onClick={handleSaveSettings} className="btn success px-6 py-2.5 flex items-center gap-1.5 font-black text-sm rounded-xl">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </header>

        {loading ? (
          <div className="py-20 text-center font-bold text-slate-500 animate-pulse">
            Loading system preferences...
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            
            {/* Panel 1: Printing Rates & Thesis Discount rules */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-blue-600" /> Pricing Rates & Thesis Rules
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Black & White Page Rate (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricing.bwRate}
                    onChange={(e) => setPricing({ ...pricing, bwRate: parseFloat(e.target.value) })}
                    className="field font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Color Page Rate (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricing.colorRate}
                    onChange={(e) => setPricing({ ...pricing, colorRate: parseFloat(e.target.value) })}
                    className="field font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thesis Minimum Pages</label>
                  <input
                    type="number"
                    value={settings.thesisDiscountPages}
                    onChange={(e) => setSettings({ ...settings, thesisDiscountPages: parseFloat(e.target.value) })}
                    className="field font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Thesis Discount (%)</label>
                  <input
                    type="number"
                    value={settings.thesisDiscountPercent}
                    onChange={(e) => setSettings({ ...settings, thesisDiscountPercent: parseFloat(e.target.value) })}
                    className="field font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Panel 2: Referrals topups program configs */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Coins className="w-5 h-5 text-amber-500" /> Referral Reward Allocations
              </h3>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-black">Enable Referrals</h4>
                  <p className="text-xs text-slate-400 font-bold">Reward students for inviting mates.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.referralEnabled}
                  onChange={(e) => setSettings({ ...settings, referralEnabled: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Referrer Reward (₹)</label>
                  <input
                    type="number"
                    value={settings.referrerAmount}
                    onChange={(e) => setSettings({ ...settings, referrerAmount: parseFloat(e.target.value) })}
                    className="field font-bold"
                    disabled={!settings.referralEnabled}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Referee Reward (₹)</label>
                  <input
                    type="number"
                    value={settings.refereeAmount}
                    onChange={(e) => setSettings({ ...settings, refereeAmount: parseFloat(e.target.value) })}
                    className="field font-bold"
                    disabled={!settings.referralEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Panel 4: Operations & Kiosk Configs */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-blue-600" /> Kiosk & Queue Settings
              </h3>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-black">Enable Cancel Window</h4>
                  <p className="text-xs text-slate-400 font-bold">Give students 30s after checkout to cancel printing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.cancelWindowEnabled}
                  onChange={(e) => setSettings({ ...settings, cancelWindowEnabled: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-black">Show Display Panel Ads</h4>
                  <p className="text-xs text-slate-400 font-bold">Auto-rotate promotional fullscreen offer photos on TVs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.displayAdPhotoEnabled}
                  onChange={(e) => setSettings({ ...settings, displayAdPhotoEnabled: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Panel: OTP Verification & Print Release Governance */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6 lg:col-span-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" /> OTP Verification & Print Release Governance
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Control whether students must enter/reply with a 4-digit OTP at kiosks or WhatsApp vs bypass for instant direct printing.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  🔐 Granular Security Rules
                </span>
              </div>

              {/* Master Global Channels */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 1. Web / Normal Orders OTP */}
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  settings.webOtpRequired !== false
                    ? "border-indigo-400 bg-indigo-50/40"
                    : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-black text-slate-900">Normal / Web Orders OTP</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.webOtpRequired !== false}
                        onChange={(e) => setSettings({ ...settings, webOtpRequired: e.target.checked })}
                      />
                      <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {settings.webOtpRequired !== false
                      ? "✅ Active (Default) — Web orders go to PENDING_SCAN and require 4-digit OTP or QR code to release at kiosk."
                      : "⚡ Bypassed — Web orders immediately spool directly to printer hardware upon checkout."}
                  </p>
                </div>

                {/* 2. WhatsApp Orders OTP */}
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  settings.whatsappOtpRequired !== false
                    ? "border-emerald-400 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-black text-slate-900">WhatsApp Orders OTP</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.whatsappOtpRequired !== false}
                        onChange={(e) => setSettings({ ...settings, whatsappOtpRequired: e.target.checked })}
                      />
                      <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {settings.whatsappOtpRequired !== false
                      ? "✅ Active (Default) — WhatsApp orders require student to enter 4-digit OTP shown on TV display before paper is printed."
                      : "⚡ Bypassed — WhatsApp orders print directly upon payment/wallet deduction without requiring OTP release."}
                  </p>
                </div>
              </div>

              {/* Block & College Specific Overrides */}
              {Object.keys(otpRules.blockRules).length > 0 && (
                <div className="mt-2 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    🏛️ Location / Block-Level Security Overrides ({Object.keys(otpRules.blockRules).length} Blocks)
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase">
                        <tr>
                          <th className="py-3 px-4">Block Location</th>
                          <th className="py-3 px-4">Web Orders OTP</th>
                          <th className="py-3 px-4">WhatsApp Orders OTP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                        {Object.entries(otpRules.blockRules).map(([blk, val]) => (
                          <tr key={blk} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 font-black">{blk}</td>
                            <td className="py-3 px-4">
                              <select
                                value={val?.webOtp === null || val?.webOtp === undefined ? "INHERIT" : (val.webOtp ? "REQUIRED" : "BYPASS")}
                                onChange={(e) => {
                                  const newVal = e.target.value === "INHERIT" ? null : e.target.value === "REQUIRED";
                                  setOtpRules(prev => ({
                                    ...prev,
                                    blockRules: {
                                      ...prev.blockRules,
                                      [blk]: { ...(prev.blockRules[blk] || {}), webOtp: newVal }
                                    }
                                  }));
                                }}
                                className="field py-1 px-2.5 text-xs font-bold w-auto cursor-pointer"
                              >
                                <option value="INHERIT">🌐 Inherit Global ({settings.webOtpRequired !== false ? 'Required' : 'Bypass'})</option>
                                <option value="REQUIRED">🔒 Force OTP Required</option>
                                <option value="BYPASS">⚡ Force Direct Print (Bypass)</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={val?.whatsappOtp === null || val?.whatsappOtp === undefined ? "INHERIT" : (val.whatsappOtp ? "REQUIRED" : "BYPASS")}
                                onChange={(e) => {
                                  const newVal = e.target.value === "INHERIT" ? null : e.target.value === "REQUIRED";
                                  setOtpRules(prev => ({
                                    ...prev,
                                    blockRules: {
                                      ...prev.blockRules,
                                      [blk]: { ...(prev.blockRules[blk] || {}), whatsappOtp: newVal }
                                    }
                                  }));
                                }}
                                className="field py-1 px-2.5 text-xs font-bold w-auto cursor-pointer"
                              >
                                <option value="INHERIT">💬 Inherit Global ({settings.whatsappOtpRequired !== false ? 'Required' : 'Bypass'})</option>
                                <option value="REQUIRED">🔒 Force OTP Required</option>
                                <option value="BYPASS">⚡ Force Direct Print (Bypass)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 3: Global Announcements & Popups */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6 lg:col-span-2">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Megaphone className="w-5 h-5 text-purple-600" /> Campus Notices & Popups
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* General Banner announcement */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black">Enable Notice Message Banner</h4>
                      <p className="text-xs text-slate-400 font-bold">Show announcement notice to all dashboard visitors.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.generalPopupEnabled}
                      onChange={(e) => setSettings({ ...settings, generalPopupEnabled: e.target.checked })}
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <textarea
                    rows="3"
                    placeholder="Enter announcement text..."
                    value={settings.generalPopupMessage}
                    onChange={(e) => setSettings({ ...settings, generalPopupMessage: e.target.value })}
                    className="field py-3 px-4 font-bold"
                    disabled={!settings.generalPopupEnabled}
                  />
                </div>

                {/* Welcome Promo announcement popup */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black">Enable Referral Welcome Modal</h4>
                      <p className="text-xs text-slate-400 font-bold">Pop open a congrats referral dialog on first registration.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.popupEnabled}
                      onChange={(e) => setSettings({ ...settings, popupEnabled: e.target.checked })}
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <textarea
                    rows="3"
                    placeholder="Enter congratulation message details..."
                    value={settings.popupMessage}
                    onChange={(e) => setSettings({ ...settings, popupMessage: e.target.value })}
                    className="field py-3 px-4 font-bold"
                    disabled={!settings.popupEnabled}
                  />
                </div>

              </div>
            </div>

            {/* Panel 4: Tester Mode settings */}
            <div className="panel p-8 bg-white rounded-3xl border border-slate-200/80 flex flex-col gap-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Shield className="w-5 h-5 text-purple-600" /> Tester Mode Access Configuration
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <div>
                    <h4 className="text-sm font-black text-purple-950">Enable Tester Access</h4>
                    <p className="text-xs text-purple-700/60 font-bold">Allow designated testers to place prints for free.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.testerModeEnabled || false}
                    onChange={(e) => setSettings({ ...settings, testerModeEnabled: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tester Usernames / Emails (Comma Separated)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. tester1, tester2, test@gmail.com"
                    value={settings.testerUsernames || ""}
                    onChange={(e) => setSettings({ ...settings, testerUsernames: e.target.value })}
                    className="field py-3 px-4 font-bold border-slate-200 focus:border-purple-600"
                    disabled={!settings.testerModeEnabled}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Settings;
