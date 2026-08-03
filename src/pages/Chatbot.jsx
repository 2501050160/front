import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Calculator,
  PackageSearch,
  History,
  MapPin,
  PhoneCall,
  Send,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  CreditCard,
  QrCode,
  Download,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const INITIAL_QUICK_REPLIES = [
  { id: "upload", label: "Upload Document", icon: Upload, emoji: "📤" },
  { id: "price", label: "Check Printing Price", icon: Calculator, emoji: "💰" },
  { id: "track", label: "Track My Order", icon: PackageSearch, emoji: "📦" },
  { id: "history", label: "Print History", icon: History, emoji: "🖨️" },
  { id: "locate", label: "Locate Print Shop", icon: MapPin, emoji: "🏢" },
  { id: "support", label: "Contact Support", icon: PhoneCall, emoji: "☎" }
];

const KIOSK_LOCATIONS = [
  { name: "KLU - R Block Kiosk", status: "Online", distance: "50m away", queue: "0 min wait", pagesReady: 120 },
  { name: "KLU - C Block Kiosk", status: "Online", distance: "120m away", queue: "2 mins wait", pagesReady: 45 },
  { name: "KLU - L Block Kiosk", status: "Online", distance: "300m away", queue: "0 min wait", pagesReady: 210 },
  { name: "Lakshmi Narayana Xerox (City Desk)", status: "Online", distance: "800m away", queue: "1 min wait", pagesReady: 340 }
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [activeQuickReplies, setActiveQuickReplies] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [theme, setTheme] = useState("dark"); // "dark" | "light"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [session, setSession] = useState({
    college: "KLU Campus",
    selectedKiosk: "KLU - R Block Kiosk",
    step: "MAIN_MENU",
    pendingDoc: null
  });

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, activeQuickReplies]);

  // Initial bot welcome greeting on page load
  useEffect(() => {
    const welcomeId = Date.now();
    const initialGreeting = {
      id: welcomeId,
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: "👋 Hello!\n\nWelcome to Cloud Print.\n\nFast, secure, and hassle-free document printing.\n\nHow can we help you today?",
      type: "greeting"
    };

    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([initialGreeting]);
      setActiveQuickReplies(INITIAL_QUICK_REPLIES);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const playPopSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const handleQuickReplyClick = (reply) => {
    playPopSound();

    // 1. Add User Message
    const userMsg = {
      id: Date.now(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `${reply.emoji} ${reply.label}`
    };

    setMessages((prev) => [...prev, userMsg]);
    // 2. Hide active quick replies immediately
    setActiveQuickReplies([]);
    // 3. Show typing indicator for 1.2 seconds
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      processBotResponse(reply.id);
    }, 1200);
  };

  const processBotResponse = (replyId, customPayload = null) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let botMsg = null;
    let nextReplies = [];

    switch (replyId) {
      case "upload":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "upload_interactive",
          title: "📤 Upload Document for Instant Printing",
          text: `Selected Kiosk: *${session.selectedKiosk}*\n\nPlease attach your PDF document or Image below to check page count & pricing:`,
        };
        nextReplies = [
          { id: "upload_sample_pdf", label: "📄 Attach Sample 5-Page Document.pdf", emoji: "📎" },
          { id: "upload_sample_img", label: "🖼️ Attach Certificate.jpg", emoji: "📷" },
          { id: "main_menu", label: "🔙 Back to Main Menu", emoji: "🏠" }
        ];
        break;

      case "upload_sample_pdf":
      case "upload_sample_img":
        const isPdf = replyId === "upload_sample_pdf";
        const docName = isPdf ? "Lab_Report_Final.pdf" : "ID_Proof_Scan.png";
        const pages = isPdf ? 5 : 1;

        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "doc_summary",
          docName,
          pages,
          text: `📄 *Document Analyzed*: ${docName}\n📊 *Total Pages*: ${pages} Page(s)\n📍 *Target Kiosk*: ${session.selectedKiosk}\n\nPlease select your printing preferences below:`
        };

        nextReplies = [
          { id: "mode_bw", label: `⚫ Black & White (₹${(pages * 2).toFixed(2)})`, emoji: "🖨️" },
          { id: "mode_color", label: `🎨 Full Color (₹${(pages * 5).toFixed(2)})`, emoji: "🌈" },
          { id: "main_menu", label: "❌ Cancel Order", emoji: "🚫" }
        ];
        break;

      case "mode_bw":
      case "mode_color":
        const isColor = replyId === "mode_color";
        const pageCount = 5;
        const total = isColor ? pageCount * 5 : pageCount * 2;
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const orderId = `ORD${Math.floor(100000 + Math.random() * 900000)}`;

        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "order_created",
          orderId,
          otpCode,
          total,
          isColor,
          kiosk: session.selectedKiosk,
          paymentUrl: `http://localhost:5173/checkout?orderId=${orderId}`,
          text: `🎉 *Order Created Successfully!*\n-----------------------------------\n🆔 *Order ID*: ${orderId}\n📄 *File*: Lab_Report_Final.pdf\n🎨 *Print Mode*: ${isColor ? "Color (₹5/pg)" : "Black & White (₹2/pg)"}\n📍 *Target Kiosk*: ${session.selectedKiosk}\n💰 *Total Amount*: ₹${total.toFixed(2)}\n\n🔐 *Your 4-Digit Release OTP*: *${otpCode}*\n\n👉 *Click below to complete 1-tap Razorpay payment:*`
        };

        nextReplies = [
          { id: "track", label: "📦 Track Order Status", emoji: "🔍" },
          { id: "main_menu", label: "🏠 Main Menu", emoji: "✨" }
        ];
        break;

      case "price":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "price_calculator",
          title: "💰 Instant Print Price Estimator",
          text: "Here is our transparent, fixed cloud print tariff across all campus kiosks:\n\n• *Black & White*: ₹2.00 / page\n• *Full Color*: ₹5.00 / page\n• *Double-sided*: 10% Discount applied automatically!\n\nUse the instant calculator widget below:"
        };
        nextReplies = [
          { id: "upload", label: "📤 Print Document Now", emoji: "🚀" },
          { id: "main_menu", label: "🏠 Main Menu", emoji: "🔙" }
        ];
        break;

      case "track":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "order_tracker",
          orderId: "ORD20260166",
          status: "Queued at Kiosk",
          otp: "0001",
          text: "📦 *Active Order Status*\n-----------------------------------\n🆔 *Order ID*: ORD20260166\n📍 *Kiosk*: KLU - R Block Kiosk\n🔐 *Release OTP*: *0001*\n⚡ *Status*: Ready for Pickup!\n\nWalk up to the kiosk touchscreen, enter your OTP **0001**, and your pages will release immediately!"
        };
        nextReplies = [
          { id: "locate", label: "🏢 Show Kiosk Map", emoji: "🗺️" },
          { id: "main_menu", label: "🏠 Main Menu", emoji: "✨" }
        ];
        break;

      case "history":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "print_history",
          text: "🖨️ *Your Recent Cloud Print History*\n-----------------------------------\n1. *Assignment_Final.pdf* • 4 pgs • ₹8.00\n   ✅ Released at R Block (OTP: 8492)\n\n2. *Project_Diagram.png* • Color • ₹5.00\n   ✅ Released at C Block (OTP: 3104)\n\nNeed to reprint any of these documents?"
        };
        nextReplies = [
          { id: "upload", label: "📤 Upload New File", emoji: "📄" },
          { id: "main_menu", label: "🏠 Main Menu", emoji: "🏠" }
        ];
        break;

      case "locate":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "kiosk_locator",
          text: "🏢 *Live Campus Kiosk Locations & Status*\n-----------------------------------\nAll kiosks are active, online, and supplied with high-speed laser paper:"
        };
        nextReplies = [
          { id: "upload", label: "📤 Select Kiosk & Print", emoji: "🎯" },
          { id: "main_menu", label: "🏠 Main Menu", emoji: "🔙" }
        ];
        break;

      case "support":
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "support_info",
          text: "☎ *Cloud Print Customer Care*\n-----------------------------------\nNeed help with paper jams, payment refunds, or kiosk access?\n\n• 💬 *WhatsApp Support*: +91 94941 89664\n• 📧 *Email*: support@cloudprint.edu\n• ⏰ *Hours*: 8:00 AM - 10:00 PM (Mon - Sat)\n\nOur campus tech team responds within 2 minutes!"
        };
        nextReplies = [
          { id: "main_menu", label: "🏠 Back to Main Menu", emoji: "✨" }
        ];
        break;

      case "main_menu":
      default:
        botMsg = {
          id: Date.now(),
          sender: "bot",
          time,
          type: "greeting",
          text: "👋 How else can we help you today with Cloud Print?"
        };
        nextReplies = INITIAL_QUICK_REPLIES;
        break;
    }

    setMessages((prev) => [...prev, botMsg]);
    setActiveQuickReplies(nextReplies);
  };

  const handleCustomTextSend = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    playPopSound();
    const userMsg = {
      id: Date.now(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: textInput.trim()
    };

    const textQuery = textInput.toLowerCase();
    setTextInput("");
    setMessages((prev) => [...prev, userMsg]);
    setActiveQuickReplies([]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      if (textQuery.includes("price") || textQuery.includes("cost") || textQuery.includes("rate")) {
        processBotResponse("price");
      } else if (textQuery.includes("track") || textQuery.includes("otp") || textQuery.includes("status")) {
        processBotResponse("track");
      } else if (textQuery.includes("locate") || textQuery.includes("block") || textQuery.includes("shop")) {
        processBotResponse("locate");
      } else if (textQuery.includes("support") || textQuery.includes("help") || textQuery.includes("call")) {
        processBotResponse("support");
      } else {
        processBotResponse("upload");
      }
    }, 1200);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-[#0b141a] text-slate-100" : "bg-slate-100 text-slate-900"} font-sans flex flex-col items-center justify-center p-0 sm:p-4 md:p-6`}>
      
      {/* Outer Shell Card */}
      <div className={`w-full max-w-4xl h-[100vh] sm:h-[90vh] flex flex-col rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border ${theme === "dark" ? "bg-[#111b21] border-white/10" : "bg-white border-slate-200"}`}>
        
        {/* Chatbot Top Navigation Bar */}
        <header className={`px-4 py-3.5 flex items-center justify-between border-b ${theme === "dark" ? "bg-[#202c33] border-white/10" : "bg-emerald-700 text-white border-emerald-800"}`}>
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full"></span>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide flex items-center gap-2 text-white">
                Cloud Print Assistant
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full uppercase tracking-wider">
                  Official Bot
                </span>
              </h1>
              <p className="text-xs text-emerald-200/80 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online • Instant Auto Replies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Audio" : "Unmute Audio"}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Dark / Light Theme"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Chat Conversation Scroll Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative ${theme === "dark" ? "bg-[#0b141a] bg-opacity-95" : "bg-[#efeae2]"}`}>
          
          {/* Encrypted Notice Pill */}
          <div className="flex justify-center my-2">
            <div className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 shadow-sm border ${theme === "dark" ? "bg-[#182229] text-amber-300/90 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Messages are end-to-end encrypted for instant kiosk release.</span>
            </div>
          </div>

          {/* Messages Stream */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Chat Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 shadow-md text-sm sm:text-base leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#005c4b] text-white rounded-2xl rounded-tr-xs"
                      : theme === "dark"
                      ? "bg-[#202c33] text-slate-100 rounded-2xl rounded-tl-xs border border-white/5"
                      : "bg-white text-slate-900 rounded-2xl rounded-tl-xs border border-slate-200"
                  }`}
                >
                  {/* Text Content */}
                  <div className="whitespace-pre-line font-normal">
                    {msg.text}
                  </div>

                  {/* Special Renderers for Interactive Types */}
                  {msg.type === "price_calculator" && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-slate-400 block font-medium">B&W Print</span>
                          <span className="text-emerald-400 text-base font-bold">₹2.00 / pg</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-slate-400 block font-medium">Color Print</span>
                          <span className="text-sky-400 text-base font-bold">₹5.00 / pg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === "kiosk_locator" && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {KIOSK_LOCATIONS.map((loc, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{loc.name}</span>
                            <span className="text-slate-400 text-[11px]">{loc.distance} • {loc.queue}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                            {loc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === "order_created" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Release OTP</span>
                        <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-mono font-black text-lg rounded-lg shadow-sm">
                          {msg.otpCode}
                        </span>
                      </div>
                      <a
                        href={msg.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs uppercase tracking-wider"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay ₹{msg.total.toFixed(2)} via Razorpay
                      </a>
                    </div>
                  )}

                  {/* Message Timestamp */}
                  <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${msg.sender === "user" ? "text-emerald-200/70" : "text-slate-400"}`}>
                    <span>{msg.time}</span>
                    {msg.sender === "user" && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start"
            >
              <div className={`px-4 py-3 rounded-2xl rounded-tl-xs shadow-md border ${theme === "dark" ? "bg-[#202c33] border-white/5" : "bg-white border-slate-200"}`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.32s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.16s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                </div>
              </div>
            </motion.div>
          )}

          {/* WhatsApp Style Quick Reply Buttons below the message stream */}
          <AnimatePresence>
            {activeQuickReplies.length > 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="pt-2 pb-1 space-y-2"
              >
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Select Quick Reply:
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeQuickReplies.map((reply) => {
                    const IconComp = reply.icon || Sparkles;
                    return (
                      <motion.button
                        key={reply.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleQuickReplyClick(reply)}
                        className={`group px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-sm ${
                          theme === "dark"
                            ? "bg-[#182229] hover:bg-emerald-500/20 border-white/10 hover:border-emerald-500/50 text-slate-100 hover:text-emerald-300"
                            : "bg-white hover:bg-emerald-50 border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-700"
                        }`}
                      >
                        <span className="text-base">{reply.emoji}</span>
                        <span>{reply.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Area */}
        <footer className={`p-3.5 border-t ${theme === "dark" ? "bg-[#202c33] border-white/10" : "bg-white border-slate-200"}`}>
          <form onSubmit={handleCustomTextSend} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message or select a quick reply above..."
              className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm focus:outline-none transition-all ${
                theme === "dark"
                  ? "bg-[#2a3942] border-white/5 text-slate-100 placeholder-slate-400 focus:border-emerald-500/50"
                  : "bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-emerald-500"
              }`}
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
