import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Phase machine ───────────────────────────────────────────── */
type Phase = "entering" | "floating" | "converging" | "logo";

/* ── Logo icon images ────────────────────────────────────────── */
const ImgIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} style={{ width: "62%", height: "62%", objectFit: "contain" }} />
);

const ExcelIcon   = () => <ImgIcon src="/logos/excel.png"   alt="Excel" />;
const GmailIcon   = () => <ImgIcon src="/logos/gmail.png"   alt="Gmail" />;
const OutlookIcon = () => <ImgIcon src="/logos/outlook.png" alt="Outlook" />;
const MailIcon    = () => <ImgIcon src="/logos/mail.png"    alt="Mail" />;
const PdfIcon     = () => <ImgIcon src="/logos/pdf.avif"    alt="PDF" />;
const NotionIcon  = () => <ImgIcon src="/logos/notion.png"  alt="Notion" />;

const SheetsIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" width="58%" height="58%">
    <rect x="5" y="6" width="22" height="20" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
    <line x1="5" y1="12" x2="27" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="5" y1="17" x2="27" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="5" y1="22" x2="27" y2="22" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="13" y1="6" x2="13" y2="26" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
    <rect x="5" y="6" width="8" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
  </svg>
);

const DriveIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" width="62%" height="62%">
    <path d="M16 5L28 26H4L16 5Z" fill="none"/>
    <path d="M16 5L24.5 20H7.5L16 5Z" fill="#34A853" opacity="0.9"/>
    <path d="M7.5 20L3 26H13L16 20" fill="#FBBC05" opacity="0.9"/>
    <path d="M24.5 20L29 26H19L16 20" fill="#EA4335" opacity="0.9"/>
    <path d="M13 26H19L16 20L13 26Z" fill="#1E8E3E" opacity="0.7"/>
  </svg>
);

/* ── Logo definitions ────────────────────────────────────────── */
interface LogoItem {
  id: string;
  label: string;
  bg: string;
  border: string;
  Icon: React.FC;
  size: number;
  x: number;
  y: number;
  floatDur: number;
  floatDelay: number;
  floatAmp: number;
  enterDelay: number;
}

const LOGOS: LogoItem[] = [
  { id:"excel",   label:"Excel",   bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:ExcelIcon,   size:78, x:0,    y:0,    floatDur:3.2, floatDelay:0,    floatAmp:9,  enterDelay:0    },
  { id:"sheets",  label:"Sheets",  bg:"#0F9D58",             border:"transparent",       Icon:SheetsIcon,  size:52, x:-92,  y:-54,  floatDur:2.9, floatDelay:0.4,  floatAmp:7,  enterDelay:0.08 },
  { id:"gmail",   label:"Gmail",   bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:GmailIcon,   size:50, x:92,   y:-58,  floatDur:3.4, floatDelay:0.2,  floatAmp:8,  enterDelay:0.12 },
  { id:"outlook", label:"Outlook", bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:OutlookIcon, size:55, x:116,  y:12,   floatDur:2.7, floatDelay:0.6,  floatAmp:6,  enterDelay:0.18 },
  { id:"mail",    label:"Mail",    bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:MailIcon,    size:50, x:76,   y:84,   floatDur:3.1, floatDelay:0.1,  floatAmp:8,  enterDelay:0.22 },
  { id:"pdf",     label:"PDF",     bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:PdfIcon,     size:46, x:-80,  y:82,   floatDur:2.8, floatDelay:0.5,  floatAmp:6,  enterDelay:0.16 },
  { id:"notion",  label:"Notion",  bg:"#ffffff",             border:"rgba(0,0,0,0.08)",  Icon:NotionIcon,  size:48, x:-118, y:10,   floatDur:3.3, floatDelay:0.7,  floatAmp:7,  enterDelay:0.10 },
  { id:"drive",   label:"Drive",   bg:"rgba(255,255,255,0.95)",border:"rgba(0,0,0,0.07)",Icon:DriveIcon,   size:48, x:4,    y:-108, floatDur:3.0, floatDelay:0.35, floatAmp:7,  enterDelay:0.06 },
];

/* ── CSS ─────────────────────────────────────────────────────── */
const orbitCSS = `
@keyframes orbitFloat {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(var(--fa, -8px)); }
}
`;

/* ── Component ───────────────────────────────────────────────── */
export default function HeroOrbitAnimation({ dk }: { dk: boolean }) {
  const [phase, setPhase] = useState<Phase>("entering");

  useEffect(() => {
    // entering → floating
    const t1 = setTimeout(() => setPhase("floating"),   700);
    // floating → converging
    const t2 = setTimeout(() => setPhase("converging"), 3800);
    // converging → Ora logo
    const t3 = setTimeout(() => setPhase("logo"),       4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isConverging = phase === "converging" || phase === "logo";
  const showLogo     = phase === "logo";

  return (
    <div className="relative flex items-center justify-center select-none" style={{ height: 260, width: 320 }}>
      <style>{orbitCSS}</style>

      {/* ── Orbiting logo bubbles ── */}
      {LOGOS.map((logo) => {
        const Icon = logo.Icon;
        return (
          <motion.div
            key={logo.id}
            style={{
              position: "absolute",
              width:  logo.size,
              height: logo.size,
              zIndex: logo.id === "excel" ? 2 : 1,
            }}
            initial={{ x: logo.x, y: logo.y, scale: 0, opacity: 0 }}
            animate={
              isConverging
                ? { x: 0, y: 0, scale: 0, opacity: 0 }
                : { x: logo.x, y: logo.y, scale: 1, opacity: 1 }
            }
            transition={
              isConverging
                ? {
                    duration: 0.65,
                    delay: logo.id === "excel" ? 0 : Math.random() * 0.12,
                    ease: [0.4, 0, 0.2, 1],
                  }
                : {
                    type: "spring",
                    stiffness: 220,
                    damping: 22,
                    delay: logo.enterDelay,
                  }
            }
          >
            {/* Inner float animation */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "22%",
                background: logo.bg,
                border: `1px solid ${logo.border}`,
                boxShadow: dk
                  ? `0 8px 28px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: isConverging
                  ? "none"
                  : `orbitFloat ${logo.floatDur}s ${logo.floatDelay}s ease-in-out infinite`,
                // @ts-ignore
                "--fa": `-${logo.floatAmp}px`,
              } as React.CSSProperties}
            >
              <Icon />
            </div>
          </motion.div>
        );
      })}

      {/* ── Ora logo (appears after convergence) ── */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            key="ora-logo"
            style={{ position: "absolute", zIndex: 10 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "22%",
                background: "#ffffff",
                border: dk ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.07)",
                boxShadow: dk
                  ? "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 20px 60px rgba(80,120,255,0.18), 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Ora wordmark */}
              <svg viewBox="0 0 80 40" width="68" height="34">
                {/* O */}
                <circle cx="20" cy="20" r="15" fill="none" stroke="#3B7AF7" strokeWidth="7"/>
                {/* r */}
                <path d="M42 26V16" stroke="#3B7AF7" strokeWidth="6" strokeLinecap="round"/>
                <path d="M42 16Q42 10 50 11" stroke="#3B7AF7" strokeWidth="5" strokeLinecap="round" fill="none"/>
                {/* a */}
                <path d="M64 26Q72 27 72 20Q72 12 63 12Q55 12 55 20L55 26Q58 29 64 28Q70 27 72 26" stroke="#3B7AF7" strokeWidth="5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            {/* Glow ring */}
            <motion.div
              style={{
                position: "absolute",
                inset: -12,
                borderRadius: "28%",
                border: "1.5px solid rgba(59,122,247,0.25)",
                pointerEvents: "none",
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                inset: -24,
                borderRadius: "32%",
                border: "1px solid rgba(59,122,247,0.12)",
                pointerEvents: "none",
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
