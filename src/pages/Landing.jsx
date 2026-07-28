import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  UploadCloud,
  CreditCard,
  QrCode,
  ChevronDown,
  Play,
  Lock,
  Sparkles,
  ShieldCheck,
  MapPin,
  Zap,
  FileText,
  Users,
  TrendingUp,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import introVideo from "../assets/intro.mp4";
import demoVideo from "../assets/demo.mp4";
import api from "../services/api";

// ---------------------------------------------------------------------------
// Inline SVG kiosk — pixel-accurate representing the physical cabinet
// ---------------------------------------------------------------------------
function KioskSVG({ paperVisible }) {
  return (
    <svg
      viewBox="0 0 260 520"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", filter: "drop-shadow(0 40px 60px rgba(0,0,0,.75)) drop-shadow(0 0 30px rgba(37,99,235,.3))" }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="40%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
        <linearGradient id="darkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0a0c12" />
          <stop offset="60%" stopColor="#111318" />
          <stop offset="100%" stopColor="#1a1c22" />
        </linearGradient>
        <linearGradient id="swooshGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="kshadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#000" floodOpacity=".5" />
        </filter>
      </defs>

      <g filter="url(#kshadow)">
        <ellipse cx="130" cy="516" rx="70" ry="8" fill="rgba(0,0,0,.4)" />

        {/* Lower dark cabinet */}
        <rect x="20" y="265" width="220" height="240" rx="6" fill="url(#darkGrad)" />
        {/* Left dark panel on upper cabinet */}
        <rect x="20" y="55" width="28" height="210" rx="3" fill="#111318" />
        {/* Upper white cabinet */}
        <rect x="48" y="55" width="192" height="210" rx="6" fill="url(#bodyGrad)" />

        {/* Brand name */}
        <text x="100" y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2563eb" fontFamily="system-ui">CLOUD</text>
        <text x="139" y="46" textAnchor="start" fontSize="13" fontWeight="700" fill="#111827" fontFamily="system-ui">PRINT</text>

        {/* Screen bezel */}
        <rect x="36" y="66" width="144" height="114" rx="5" fill="#0a0c12" />
        {/* Screen surface */}
        <rect x="38" y="68" width="140" height="110" rx="4" fill="#1e3a8a" />
        {/* Screen welcome bar */}
        <rect x="38" y="68" width="140" height="18" rx="0" fill="#1d4ed8" />
        <text x="108" y="81" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="system-ui" fontWeight="500">Welcome to Cloud Print</text>
        {/* Screen icon tiles */}
        <rect x="54" y="100" width="28" height="28" rx="5" fill="#eff6ff" />
        <text x="68" y="118" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontFamily="system-ui">🖨</text>
        <text x="68" y="126" textAnchor="middle" fontSize="5.5" fill="#374151" fontFamily="system-ui">PRINT</text>
        <rect x="94" y="100" width="28" height="28" rx="5" fill="#eff6ff" />
        <text x="108" y="118" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontFamily="system-ui">⊙</text>
        <text x="108" y="126" textAnchor="middle" fontSize="5.5" fill="#374151" fontFamily="system-ui">SCAN</text>
        <rect x="134" y="100" width="28" height="28" rx="5" fill="#eff6ff" />
        <text x="148" y="118" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontFamily="system-ui">💳</text>
        <text x="148" y="126" textAnchor="middle" fontSize="5.5" fill="#374151" fontFamily="system-ui">PAY</text>
        {/* Progress dots on screen */}
        <circle cx="100" cy="166" r="3" fill="#2563eb" />
        <circle cx="110" cy="166" r="3" fill="#93c5fd" />
        <circle cx="120" cy="166" r="3" fill="#93c5fd" />

        {/* Receipt printer */}
        <rect x="186" y="72" width="22" height="60" rx="3" fill="#d1d5db" />
        <rect x="190" y="76" width="14" height="8" rx="1" fill="#9ca3af" />
        <rect x="190" y="90" width="14" height="30" rx="1" fill="#e5e7eb" />

        {/* Blue card reader */}
        <rect x="192" y="144" width="26" height="46" rx="4" fill="#2563eb" />
        <rect x="194" y="146" width="22" height="42" rx="3" fill="#0f172a" />
        <text x="205" y="172" textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="system-ui">PAYMENT</text>

        {/* Self service bar */}
        <rect x="62" y="196" width="118" height="18" rx="4" fill="#0a0c12" />
        <text x="121" y="208" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff" fontFamily="system-ui" letterSpacing="1">SELF SERVICE</text>

        {/* Output slot label + slot */}
        <text x="90" y="248" textAnchor="middle" fontSize="5.5" fill="#9ca3af" fontFamily="system-ui">OUTPUT</text>
        <rect x="48" y="257" width="192" height="8" rx="0" fill="#e5e7eb" />
        <rect x="58" y="250" width="130" height="12" rx="2" fill="#1f2937" />
        {/* Paper slip */}
        {paperVisible && (
          <rect x="72" y="252" width="102" height="6" rx="1" fill="#f9fafb" />
        )}

        {/* USB ports */}
        <rect x="200" y="255" width="16" height="4" rx="1" fill="#374151" />
        <rect x="200" y="261" width="16" height="4" rx="1" fill="#374151" />

        {/* Blue swoosh on lower cabinet */}
        <path d="M 20,335 L 240,290 L 240,308 L 20,355 Z" fill="url(#swooshGrad)" opacity=".9" />

        {/* Cloud logo */}
        <circle cx="120" cy="375" r="18" fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <circle cx="136" cy="370" r="14" fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <circle cx="104" cy="370" r="14" fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <rect x="100" y="374" width="80" height="16" rx="0" fill="#fff" />
        <rect x="112" y="376" width="36" height="22" rx="2" fill="#2563eb" />
        <rect x="116" y="380" width="28" height="10" rx="1" fill="#fff" />
        <rect x="120" y="393" width="20" height="4" rx="1" fill="#fbbf24" />

        {/* Logo text */}
        <text x="118" y="412" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563eb" fontFamily="system-ui">CLOUD</text>
        <text x="146" y="412" textAnchor="start" fontSize="10" fontWeight="700" fill="#111827" fontFamily="system-ui">PRINT</text>
        <text x="130" y="424" textAnchor="middle" fontSize="6.5" fill="#6b7280" fontFamily="system-ui" letterSpacing=".5">PRINT • SCAN • PAY</text>

        {/* 24x7 label */}
        <text x="36" y="462" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui">24x7</text>
        <text x="36" y="474" fontSize="7" fontWeight="700" fill="#60a5fa" fontFamily="system-ui" letterSpacing=".5">PRINTING</text>

        {/* Caster wheels */}
        <rect x="40" y="497" width="22" height="12" rx="6" fill="#1a1c22" />
        <circle cx="51" cy="503" r="4" fill="#0a0c12" />
        <rect x="80" y="497" width="22" height="12" rx="6" fill="#1a1c22" />
        <circle cx="91" cy="503" r="4" fill="#0a0c12" />
        <rect x="158" y="497" width="22" height="12" rx="6" fill="#1a1c22" />
        <circle cx="169" cy="503" r="4" fill="#0a0c12" />
        <rect x="198" y="497" width="22" height="12" rx="6" fill="#1a1c22" />
        <circle cx="209" cy="503" r="4" fill="#0a0c12" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scroll-linked 3D storytelling showcase
// ---------------------------------------------------------------------------
function ScrollHero({ stats, onWatchDemo }) {
  const stageRef = useRef(null);
  const kioskRef = useRef(null);
  const wrapRef  = useRef(null);
  const rafRef   = useRef(null);

  const rotY     = useRef(-25);
  const rotX     = useRef(8);
  const targetY  = useRef(-25);
  const targetX  = useRef(8);
  const scrollRY = useRef(-25);

  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragStartY  = useRef(0);
  const dragBaseY   = useRef(-25);
  const dragBaseX   = useRef(8);
  const dragTimeout = useRef(null);

  const [activeStage, setActiveStage]   = useState(0);
  const [progress, setProgress]         = useState(0);
  const [paperVisible, setPaperVisible] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const shownDrag = useRef(false);

  const lerp = (a, b, t) => a + (b - a) * t;

  const getScrollProgress = useCallback(() => {
    const el = stageRef.current;
    if (!el) return 0;
    const rect  = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, total > 0 ? scrolled / total : 0));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const p = getScrollProgress();
      setProgress(p);
      setScrolled(p > 0.01);

      const stageIdx = Math.min(3, Math.floor(p * 4));
      setActiveStage(stageIdx);
      setPaperVisible(p > 0.82);

      const rotTarget = -25 + p * 380;
      scrollRY.current = rotTarget;
      if (!isDragging.current) targetY.current = rotTarget;

      if (p > 0.05 && !shownDrag.current) {
        shownDrag.current = true;
        setShowDragHint(true);
        setTimeout(() => setShowDragHint(false), 2500);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [getScrollProgress]);

  useEffect(() => {
    const tick = () => {
      rotY.current = lerp(rotY.current, targetY.current, 0.08);
      rotX.current = lerp(rotX.current, targetX.current, 0.08);

      const floatY = Math.sin(Date.now() * 0.0008) * 3;

      if (kioskRef.current) {
        kioskRef.current.style.transform =
          `perspective(900px) rotateX(${rotX.current}deg) rotateY(${rotY.current}deg)`;
      }
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translateY(calc(-50% + ${floatY}px))`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Drag handlers
  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragBaseY.current  = rotY.current;
    dragBaseX.current  = rotX.current;
    clearTimeout(dragTimeout.current);
    e.preventDefault();
  };

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    targetY.current = dragBaseY.current + dx * 0.5;
    targetX.current = Math.max(-20, Math.min(20, dragBaseX.current - dy * 0.3));
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragTimeout.current = setTimeout(() => {
      targetY.current = scrollRY.current;
      targetX.current = 8;
    }, 1800);
  }, []);

  const onTouchStart = (e) => {
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    dragBaseY.current  = rotY.current;
    dragBaseX.current  = rotX.current;
    clearTimeout(dragTimeout.current);
  };

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - dragStartX.current;
    const dy = e.touches[0].clientY - dragStartY.current;
    targetY.current = dragBaseY.current + dx * 0.5;
    targetX.current = Math.max(-20, Math.min(20, dragBaseX.current - dy * 0.3));
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    dragTimeout.current = setTimeout(() => {
      targetY.current = scrollRY.current;
      targetX.current = 8;
    }, 1800);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const stages = [
    {
      eyebrow: "Campus print infrastructure",
      heading: (
        <>
          Print<br />
          <span style={{ color: "#60a5fa" }}>anywhere.</span><br />
          Collect instantly.
        </>
      ),
      desc: "Upload from your laptop, walk to any campus kiosk, scan to collect. Scroll to see how it works — or drag the machine to spin it.",
      ctas: true,
    },
    {
      eyebrow: "Step 01 — Upload",
      heading: (
        <>
          Send it from<br />
          <span style={{ color: "#60a5fa" }}>anywhere.</span>
        </>
      ),
      desc: "Upload a PDF from your dorm, library, or the quad. CloudPrint queues it to the kiosk touchscreen instantly over the cloud.",
    },
    {
      eyebrow: "Step 02 — Pay",
      heading: (
        <>
          Pay in<br />
          <span style={{ color: "#fbbf24" }}>one tap.</span>
        </>
      ),
      desc: "Prepaid wallet, UPI, or card — tap the blue reader beside the screen and checkout completes in seconds.",
    },
    {
      eyebrow: "Step 03 — Collect",
      heading: (
        <>
          Scan.<br />Collect.<br />
          <span style={{ color: "#34d399" }}>Go.</span>
        </>
      ),
      desc: "Scan your QR or enter your OTP — your pages slide from the output tray. Done.",
    },
  ];

  const DOT_PCTS = [0, 33, 66, 100];

  return (
    <div ref={stageRef} style={{ height: "400vh", position: "relative" }}>
      {/* Sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070c",
        }}
      >
        {/* Ambient glows */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: "25%", left: "35%",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(37,99,235,.16) 0%, transparent 70%)",
            borderRadius: "50%", transform: "translate(-50%,-50%)",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "15%",
            width: 320, height: 320,
            background: "radial-gradient(circle, rgba(16,185,129,.09) 0%, transparent 70%)",
            borderRadius: "50%",
          }} />
        </div>

        {/* Progress dot rail */}
        <div style={{
          position: "absolute", left: "2.5%", top: "50%",
          transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            width: 2, height: 160,
            background: "rgba(255,255,255,.07)",
            borderRadius: 2, position: "relative",
          }}>
            {/* Fill bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%",
              background: "#2563eb", borderRadius: 2,
              height: `${progress * 100}%`,
              transition: "height .1s linear",
            }} />
            {/* Dots */}
            {DOT_PCTS.map((pct, i) => (
              <div key={i} style={{
                position: "absolute",
                top: `${pct}%`,
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 9, height: 9,
                borderRadius: "50%",
                background: activeStage === i ? "#2563eb" : "rgba(255,255,255,.12)",
                border: `1.5px solid ${activeStage === i ? "#60a5fa" : "rgba(255,255,255,.18)"}`,
                transition: "background .3s, border-color .3s",
              }} />
            ))}
          </div>
        </div>

        {/* Text panels */}
        <div style={{
          position: "absolute",
          left: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "36%",
          maxWidth: 380,
        }}>
          {stages.map((s, i) => (
            <div
              key={i}
              style={{
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? "auto" : 0,
                left: 0,
                right: 0,
                opacity: activeStage === i ? 1 : 0,
                transform: `translateY(${activeStage === i ? 0 : 24}px)`,
                transition: "opacity .4s ease, transform .4s ease",
                pointerEvents: activeStage === i ? "auto" : "none",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 10, fontWeight: 600, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "#60a5fa", marginBottom: 16,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#2563eb",
                  display: "inline-block",
                }} />
                {s.eyebrow}
              </div>

              <h2 style={{
                fontSize: "clamp(2rem, 3.8vw, 3rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginBottom: 18,
              }}>
                {s.heading}
              </h2>

              <p style={{
                fontSize: 14, color: "#94a3b8", lineHeight: 1.75, maxWidth: 300,
              }}>
                {s.desc}
              </p>

              {s.ctas && (
                <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                  <Link
                    to="/login"
                    style={{
                      padding: "12px 22px",
                      background: "#2563eb",
                      color: "#fff",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ⚡ Upload Document
                  </Link>
                  <button
                    onClick={onWatchDemo}
                    style={{
                      padding: "12px 22px",
                      background: "rgba(255,255,255,.08)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Play size={14} fill="white" /> Watch Demo
                  </button>
                </div>
              )}

              {s.ctas && (
                <div style={{
                  marginTop: 32,
                  paddingTop: 24,
                  borderTop: "1px solid rgba(255,255,255,.08)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}>
                  {[
                    ["🖨️", `${stats.activePrinters} Active Printers`],
                    ["📄", `${stats.pagesPrinted.toLocaleString()} Pages Printed`],
                    ["👨‍🎓", `${stats.studentsServed.toLocaleString()} Students`],
                    ["⚡", `${stats.successRate}% Success Rate`],
                  ].map(([icon, label]) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 12, fontWeight: 600, color: "#64748b",
                    }}>
                      <span style={{ fontSize: 16 }}>{icon}</span> {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Kiosk — right side, draggable */}
        <div
          ref={wrapRef}
          style={{
            position: "absolute",
            right: "8%",
            top: "50%",
            transform: "translateY(-50%)",
            willChange: "transform",
          }}
        >
          <div
            ref={kioskRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{
              width: 230,
              cursor: "grab",
              willChange: "transform",
              userSelect: "none",
            }}
          >
            <KioskSVG paperVisible={paperVisible} />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute",
          bottom: 32, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6,
          opacity: scrolled ? 0 : 1,
          transition: "opacity .5s",
          pointerEvents: "none",
        }}>
          <div style={{
            width: 1, height: 40,
            background: "linear-gradient(to bottom, rgba(255,255,255,.4), transparent)",
            animation: "scrollPulse 1.6s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#64748b", fontWeight: 600,
          }}>Scroll</span>
        </div>

        {/* Drag hint */}
        <div style={{
          position: "absolute",
          bottom: 80,
          right: "8%",
          fontSize: 11,
          color: "#475569",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: showDragHint ? 1 : 0,
          transition: "opacity .5s",
          pointerEvents: "none",
        }}>
          <span>✦</span>
          <span>Drag to spin</span>
        </div>

        <style>{`
          @keyframes scrollPulse {
            0%, 100% { opacity: .4; transform: scaleY(.8); }
            50%       { opacity: 1;  transform: scaleY(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Landing page component
// ---------------------------------------------------------------------------
export default function Landing() {
  const [activeBuilding, setActiveBuilding] = useState("C Block");
  const [activeFaq,      setActiveFaq]      = useState(null);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [showIntro,      setShowIntro]      = useState(false);
  const [isMuted,        setIsMuted]        = useState(true);
  const [showDemo,       setShowDemo]       = useState(false);
  const [isMobile,       setIsMobile]       = useState(false);
  const [typedTitle1,    setTypedTitle1]    = useState("");
  const [typedTitle2,    setTypedTitle2]    = useState("");

  const introVideoRef = useRef(null);
  const demoVideoRef  = useRef(null);

  const [stats, setStats] = useState({
    activePrinters: 27,
    pagesPrinted:   102540,
    studentsServed: 15420,
    successRate:    99.8,
  });

  const [buildingData, setBuildingData] = useState({
    "C Block": {
      status: "Online",
      statusColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
      paper: "85%",
      wait: "2 mins",
      queue: 4,
      model: "Brother HL-L2320D"
    }
  });

  // Typing animation loop
  useEffect(() => {
    const t1 = "Print Anywhere.";
    const t2 = "Collect Instantly.";
    let i1 = 0, i2 = 0;
    let tm1, tm2, tmLoop;

    const type1 = () => {
      if (i1 <= t1.length) {
        setTypedTitle1(t1.substring(0, i1++));
        tm1 = setTimeout(type1, 80);
      } else {
        type2();
      }
    };

    const type2 = () => {
      if (i2 <= t2.length) {
        setTypedTitle2(t2.substring(0, i2++));
        tm2 = setTimeout(type2, 80);
      } else {
        tmLoop = setTimeout(() => {
          setTypedTitle1("");
          setTypedTitle2("");
          i1 = 0;
          i2 = 0;
          type1();
        }, 3000);
      }
    };

    type1();
    return () => {
      clearTimeout(tm1);
      clearTimeout(tm2);
      clearTimeout(tmLoop);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Intro video overlay trigger
  useEffect(() => {
    if (!sessionStorage.getItem("landingIntroShown")) {
      setShowIntro(true);
    }
  }, []);

  const handleSkipIntro = () => {
    sessionStorage.setItem("landingIntroShown", "true");
    setShowIntro(false);
  };

  // Stats polling
  useEffect(() => {
    const fetchStats = () => {
      const apiUrl = import.meta.env?.VITE_API_URL || "https://printer-backend-34ih.onrender.com";
      fetch(`${apiUrl}/api/public/stats`)
        .then((r) => r.json())
        .then((d) => setStats({
          activePrinters: d.activePrinters ?? 27,
          pagesPrinted:   d.pagesPrinted   ?? 102540,
          studentsServed: d.studentsServed  ?? 15420,
          successRate:    d.successRate     ?? 99.8,
        }))
        .catch(() => {});
    };
    fetchStats();
    const iv = setInterval(fetchStats, 5000);
    return () => clearInterval(iv);
  }, []);

  // Fetch real campus data
  useEffect(() => {
    let isMounted = true;
    const fetchBuildingData = async () => {
      try {
        const [blocksRes, printersRes] = await Promise.all([
          api.get("/blocks/all").catch(() => ({ data: [] })),
          api.get("/printer/all").catch(() => ({ data: [] }))
        ]);
        
        const blocks = blocksRes.data || [];
        const printers = printersRes.data || [];
        
        if (blocks.length === 0) return;
        
        const newBuildingData = {};
        
        await Promise.all(blocks.map(async (b) => {
          const printer = printers.find(p => p.blockLocation === b.name);
          let queueCount = 0;
          try {
             const queueRes = await api.get("/queue/pending", { params: { blockLocation: b.name } });
             queueCount = (queueRes.data || []).length;
          } catch (e) {
             // suppress
          }
          
          let status = "Offline";
          let statusColor = "text-rose-500 bg-rose-50 border-rose-100";
          if (printer) {
             if (printer.active) {
                status = printer.maintenance ? "Busy" : "Online";
                statusColor = printer.maintenance 
                  ? "text-amber-500 bg-amber-50 border-amber-100" 
                  : "text-emerald-500 bg-emerald-50 border-emerald-100";
             }
          }
          
          let paperPercent = printer && printer.paperCount !== undefined ? Math.min(100, Math.round((printer.paperCount / 500) * 100)) : 0;
          
          newBuildingData[b.name] = {
            status,
            statusColor,
            paper: `${paperPercent}%${paperPercent < 20 ? " (Low Paper)" : ""}`,
            wait: queueCount > 0 ? `${queueCount * 2} mins` : "0 mins",
            queue: queueCount,
            model: printer && printer.printerName ? printer.printerName : "Standard Printer"
          };
        }));
        
        if (isMounted && Object.keys(newBuildingData).length > 0) {
          setBuildingData(newBuildingData);
          setActiveBuilding(current => {
             if (!newBuildingData[current]) return Object.keys(newBuildingData)[0];
             return current;
          });
        }
      } catch (err) {
        console.error("Error fetching building data:", err);
      }
    };
    
    fetchBuildingData();
    const interval = setInterval(fetchBuildingData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Demo video intersection observer
  useEffect(() => {
    const video = demoVideoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  // FAQ questions list
  const faqData = [
    {
      q: "How does CloudPrint work?",
      a: "Simply upload your PDF to the web portal, customize your print options (color, paper size, page range), make a cashless payment, and print. You'll receive a unique OTP and QR code to release the job at any campus printer.",
    },
    {
      q: "How secure is QR printing?",
      a: "CloudPrint uses point-to-point security. Documents stay encrypted on our server and are only decrypted when you scan your QR or enter your 6-digit OTP at the physical printer. Documents are automatically wiped after printing.",
    },
    {
      q: "Can I pay using my wallet?",
      a: "Yes — students can load a prepaid digital wallet using UPI, card, or net banking via Razorpay for instantaneous checkouts and Happy Hours discounts.",
    },
    {
      q: "Can I print from my mobile?",
      a: "Absolutely. CloudPrint is a progressive web app. No install needed — just open the URL in your phone's browser, upload a file, and pay.",
    },
  ];

  const activeBuil = buildingData[activeBuilding] || {};
  const paperPct   = parseInt(activeBuil.paper) || 0;

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#05070c", color: "#fff", fontFamily: "system-ui, sans-serif", overflowX: "hidden" }}>

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          height: 72, display: "flex", alignItems: "center",
          padding: "0 40px",
          background: "rgba(5,7,12,.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{
              padding: 8, borderRadius: 10,
              background: "#2563eb", color: "#fff",
            }}>
              <Printer size={18} />
            </div>
            <span style={{
              fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em",
              background: "linear-gradient(to right, #2563eb, #818cf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>CloudPrint</span>
          </div>

          {!isMobile && (
            <nav style={{ display: "flex", gap: 40, fontSize: 13, fontWeight: 700, color: "#64748b" }}>
              {[["#features", "Features"], ["#locations", "Locations"], ["#how-it-works", "How it works"], ["#faq", "FAQ"]].map(([href, label]) => (
                <a key={href} href={href} style={{ color: "#64748b", textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "#64748b"}
                >{label}</a>
              ))}
            </nav>
          )}

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <Link to="/login" style={{
              padding: "10px 20px",
              background: "#2563eb", color: "#fff",
              borderRadius: 10, fontWeight: 700,
              fontSize: 13, textDecoration: "none",
            }}>
              ⚡ Upload Document
            </Link>
          </div>
        </header>

        {/* ── Scroll 3D Hero ─────────────────────────────────────────────── */}
        <div style={{ paddingTop: 72 }}>
          <ScrollHero stats={stats} onWatchDemo={() => setShowDemo(true)} />
        </div>

        {/* ── Live Stats ─────────────────────────────────────────────────── */}
        <section style={{
          background: "#0d1117", borderTop: "1px solid rgba(255,255,255,.06)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          padding: "64px 24px",
        }}>
          <div style={{
            maxWidth: 960, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32,
            textAlign: "center",
          }}>
            {[
              [stats.pagesPrinted.toLocaleString() + "+", "Pages Printed", "#fff"],
              [stats.activePrinters.toString(), "Active Printers", "#34d399"],
              [stats.successRate + "%", "Success Rate", "#60a5fa"],
              [stats.studentsServed.toLocaleString() + "+", "Students Served", "#a78bfa"],
            ].map(([num, label, color]) => (
              <div key={label}>
                <p style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color, letterSpacing: "-0.03em" }}>{num}</p>
                <p style={{ marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works (demo video) ───────────────────────────────────── */}
        <section id="how-it-works" style={{ background: "#05070c", padding: "96px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 14px", borderRadius: 20,
                background: "rgba(37,99,235,.15)",
                border: "1px solid rgba(37,99,235,.3)",
                color: "#60a5fa",
              }}>Live Demo</span>
              <h2 style={{ marginTop: 16, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, color: "#fff" }}>
                See CloudPrint in Action
              </h2>
            </div>

            {/* macOS-style video player */}
            <div style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 40px 80px rgba(0,0,0,.5)",
            }}>
              <div style={{
                background: "#0d1117", padding: "12px 18px",
                display: "flex", alignItems: "center", gap: 8,
                borderBottom: "1px solid rgba(255,255,255,.06)",
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ef4444","#f59e0b","#22c55e"].map(c => (
                    <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "block" }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginLeft: 8 }}>
                  CloudPrint — How It Works
                </span>
              </div>
              <video
                ref={demoVideoRef}
                autoPlay muted controls playsInline loop
                style={{ width: "100%", aspectRatio: "16/9", background: "#000", display: "block" }}
              />
            </div>

            {/* Steps grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 20, marginTop: 48,
            }}>
              {[
                { emoji: "📄", title: "Upload PDF",    desc: "Select and upload from any device" },
                { emoji: "🖨️", title: "Choose Printer", desc: "Pick nearest campus kiosk" },
                { emoji: "🔑", title: "Verify OTP",    desc: "Enter code at the kiosk" },
                { emoji: "⚡", title: "Collect Print",  desc: "Grab pages from the output tray" },
              ].map((step, i) => (
                <div key={i} style={{
                  padding: "24px 20px",
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 16, position: "relative",
                }}>
                  <span style={{
                    position: "absolute", top: 14, right: 14,
                    fontSize: 10, fontWeight: 700,
                    background: "rgba(37,99,235,.2)", color: "#60a5fa",
                    width: 20, height: 20, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(37,99,235,.3)",
                  }}>{i + 1}</span>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>{step.emoji}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust features ─────────────────────────────────────────────── */}
        <section id="features" style={{ padding: "96px 24px", background: "#0d1117" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                padding: "4px 14px", borderRadius: 20,
                background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.25)", color: "#60a5fa",
              }}>Security & Trust</span>
              <h2 style={{ marginTop: 16, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, color: "#fff" }}>
                Trusted across campus
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
              {[
                { icon: <Lock size={20} />, iconBg: "#052e16", iconColor: "#22c55e", title: "Secure OTP printing", desc: "No unauthorised prints. Documents release only when you enter your OTP." },
                { icon: <QrCode size={20} />, iconBg: "#0c1a3a", iconColor: "#2563eb", title: "QR code release",    desc: "Scan the QR on the kiosk tray to immediately output your pages." },
                { icon: <CreditCard size={20} />, iconBg: "#1e0a3a", iconColor: "#8b5cf6", title: "Razorpay payments",  desc: "Fast checkouts via UPI, credit card, or net banking." },
              ].map((f) => (
                <div key={f.title} style={{
                  padding: "24px 22px",
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 20, display: "flex", gap: 18,
                }}>
                  <div style={{
                    padding: 12, borderRadius: 14,
                    background: f.iconBg, color: f.iconColor, flexShrink: 0,
                  }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{f.title}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Campus map / building selector ─────────────────────────────── */}
        <section id="locations" style={{ padding: "96px 24px", background: "#05070c" }}>
          <div style={{
            maxWidth: 960, margin: "0 auto",
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 48, alignItems: "center",
          }}>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                padding: "4px 14px", borderRadius: 20,
                background: "rgba(147,51,234,.15)", border: "1px solid rgba(147,51,234,.3)", color: "#a78bfa",
              }}>Interactive campus map</span>
              <h2 style={{ marginTop: 16, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, color: "#fff" }}>
                Find active campus printers
              </h2>
              <p style={{ marginTop: 12, color: "#64748b", lineHeight: 1.8, fontSize: 14 }}>
                Click a building to check real-time queue status, hardware health, and paper load.
              </p>
              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {Object.keys(buildingData).map((name) => {
                  const active = name === activeBuilding;
                  return (
                    <button key={name} onClick={() => setActiveBuilding(name)} style={{
                      padding: "14px 16px", borderRadius: 14, textAlign: "left",
                      cursor: "pointer", transition: "all .2s",
                      border: active ? "2px solid #2563eb" : "1px solid rgba(255,255,255,.08)",
                      background: active ? "rgba(37,99,235,.15)" : "rgba(255,255,255,.03)",
                      color: active ? "#60a5fa" : "#94a3b8",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: buildingData[name].status === "Online" ? "#22c55e"
                            : buildingData[name].status === "Busy" ? "#f59e0b" : "#ef4444",
                          display: "block",
                        }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live status panel */}
            <div style={{
              padding: 32, borderRadius: 24,
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.07)",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569" }}>Selected hub</p>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 4 }}>{activeBuilding}</h3>
                </div>
                <span style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: activeBuil.status === "Online" ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
                  color: activeBuil.status === "Online" ? "#22c55e" : "#ef4444",
                  border: `1px solid ${activeBuil.status === "Online" ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
                }}>
                  {activeBuil.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <p style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>Paper level</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 4 }}>{activeBuil.paper}</p>
                  <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${paperPct}%`, background: "#22c55e", borderRadius: 4, transition: "width 1s ease" }} />
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <p style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>Wait time</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#60a5fa", marginTop: 4 }}>{activeBuil.wait}</p>
                </div>
              </div>

              <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>Active queue</p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginTop: 4 }}>{activeBuil.queue} orders pending</p>
                </div>
                <span style={{ fontSize: 11, color: "#475569" }}>{activeBuil.model}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section id="faq" style={{ background: "#0d1117", padding: "96px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                padding: "4px 14px", borderRadius: 20,
                background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.25)", color: "#60a5fa",
              }}>Questions & Answers</span>
              <h2 style={{ marginTop: 16, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, color: "#fff" }}>
                Frequently asked questions
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {faqData.map((faq, i) => (
                <div key={faq.q} style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    style={{
                      width: "100%", padding: "22px 0",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: `rotate(${activeFaq === i ? 180 : 0}deg)`,
                        transition: "transform .2s",
                        color: "#64748b",
                      }}
                    />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ paddingBottom: 24, fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: "#05070c",
          borderTop: "1px solid rgba(255,255,255,.06)",
          padding: "64px 24px 48px",
          color: "#475569",
          fontSize: 12,
        }}>
          <div style={{
            maxWidth: 960, margin: "0 auto",
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)",
            gap: 40,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 700, fontSize: 14 }}>
                <Printer size={16} /> CloudPrint
              </div>
              <p style={{ marginTop: 12, lineHeight: 1.6 }}>
                Automating campus printing infrastructure with cashless checkouts, secure OTP collections, and dynamic Student discounts.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: ".1em", marginBottom: 16 }}>Features</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>OTP Safe Printing</a>
                <a href="#locations" style={{ color: "inherit", textDecoration: "none" }}>Campus Map</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: ".1em", marginBottom: 16 }}>Support</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link to="/admin-login" style={{ color: "inherit", textDecoration: "none" }}>Admin Login</Link>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>🌐 {window.location.host}</span>
              </div>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: ".1em", marginBottom: 16 }}>CloudPrint</h4>
              <p style={{ lineHeight: 1.6 }}>
                Designed for high-performance kiosk TVs, student notebooks, and campus admins.
              </p>
              <p style={{ marginTop: 16 }}>
                © {new Date().getFullYear()} CloudPrint Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>

      {/* Intro Video Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <video
              ref={introVideoRef}
              autoPlay
              muted={isMuted}
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              onEnded={handleSkipIntro}
            >
              <source src={introVideo} type="video/mp4" />
            </video>

            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.6), transparent 30%, rgba(0,0,0,.2))", zIndex: 10 }} />

            {/* Tap to Start splash */}
            {isMuted && (
              <div
                style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 40, cursor: "pointer" }}
                onClick={() => {
                  const v = introVideoRef.current;
                  if (v) {
                    v.muted = false;
                    v.play().catch(() => {});
                    setIsMuted(false);
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={18} fill="white" color="white" />
                  </div>
                  <p style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Tap to Unmute</p>
                </div>
              </div>
            )}

            {/* Skip button */}
            <button
              onClick={handleSkipIntro}
              style={{
                position: "absolute", bottom: 40, right: 40, zIndex: 40,
                padding: "12px 24px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 20, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              Skip Intro →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Video Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.85)", padding: 16 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              style={{ position: "relative", width: "100%", maxWidth: 896, borderRadius: 20, overflow: "hidden", background: "#0d1117", border: "1px solid rgba(255,255,255,.1)" }}
              initial={{ scale: 0.92, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowDemo(false)}
                style={{
                  position: "absolute", top: 12, right: 12, zIndex: 10,
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(0,0,0,.6)", color: "#fff", border: "1px solid rgba(255,255,255,.2)",
                  fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>

              <div style={{ background: "#05070c", padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ef4444","#f59e0b","#22c55e"].map(c => (
                    <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "block" }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".1em", marginLeft: 8 }}>CloudPrint — How It Works</span>
              </div>

              <video
                src={demoVideo}
                autoPlay
                controls
                style={{ width: "100%", aspectRatio: "16/9", background: "#000", display: "block" }}
                onEnded={() => setShowDemo(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
