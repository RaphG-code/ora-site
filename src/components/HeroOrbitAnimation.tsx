import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Phases ──────────────────────────────────────────────────── */
type Phase = "entering" | "floating" | "fadeout" | "logo";

/* ── Crisp image ─────────────────────────────────────────────── */
const Img = ({ src, alt, pct = "62%", offsetX = "0px" }: { src: string; alt: string; pct?: string; offsetX?: string }) => (
  <img
    src={src} alt={alt} draggable={false}
    style={{
      width: pct, height: pct, objectFit: "contain", display: "block",
      transform: `translateX(${offsetX}) translateZ(0)`, backfaceVisibility: "hidden",
    } as React.CSSProperties}
  />
);

const ExcelIcon   = () => <Img src="/logos/excel-new.png"  alt="Excel"   pct="58%" offsetX="-3px" />;
const GmailIcon   = () => <Img src="/logos/gmail.png"      alt="Gmail"   pct="60%" />;
const OutlookIcon = () => <Img src="/logos/outlook.png"    alt="Outlook" pct="62%" />;
const MailIcon    = () => <Img src="/logos/mail.png"       alt="Mail"    pct="60%" />;
const NotionIcon  = () => <Img src="/logos/notion.png"     alt="Notion"  pct="56%" />;

const SheetsIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: "58%", height: "58%" }}>
    <rect x="5" y="6" width="22" height="20" rx="2" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
    <line x1="5"  y1="12" x2="27" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="5"  y1="17" x2="27" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="5"  y1="22" x2="27" y2="22" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
    <line x1="13" y1="6"  x2="13" y2="26" stroke="rgba(255,255,255,0.55)" strokeWidth="1"/>
    <rect x="5" y="6" width="8" height="6" rx="1" fill="rgba(255,255,255,0.35)"/>
  </svg>
);

const DriveIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{ width: "62%", height: "62%" }}>
    <path d="M16 5L24.5 20H7.5L16 5Z"  fill="#34A853"/>
    <path d="M7.5 20L3 26H13L16 20"    fill="#FBBC05"/>
    <path d="M24.5 20L29 26H19L16 20"  fill="#EA4335"/>
    <path d="M13 26H19L16 20L13 26Z"   fill="#1E8E3E" opacity="0.75"/>
  </svg>
);

/* ── Layout — 6 icônes en hexagone parfaitement symétrique ──── */
/*   Rayon 100px (collés à Excel), positions horloge             */
const R = 100;
const SPIN_DUR = 32; // secondes / tour complet (sens horaire)
const hex = (deg: number) => ({
  x: Math.round(R * Math.sin((deg * Math.PI) / 180)),
  y: Math.round(-R * Math.cos((deg * Math.PI) / 180)),
});

interface Sat {
  id: string;
  bg: string;
  border: string;
  shadowColor: string;
  Icon: React.FC;
  size: number;
  x: number;
  y: number;
  floatDelay: string;   // negative = starts mid-cycle = natural stagger
  enterDelay: number;
  exitDelay: number;
}

const SATS: Sat[] = [
  // 12h — top
  { id:"drive",   bg:"#ffffff",  border:"rgba(0,0,0,0.07)", shadowColor:"rgba(52,168,83,0.18)",
    Icon:DriveIcon,   size:58, ...hex(0),   floatDelay:"0s",    enterDelay:0.05, exitDelay:0.00 },
  // 2h — top-right
  { id:"gmail",   bg:"#ffffff",  border:"rgba(0,0,0,0.07)", shadowColor:"rgba(234,67,53,0.18)",
    Icon:GmailIcon,   size:52, ...hex(60),  floatDelay:"-0.8s", enterDelay:0.10, exitDelay:0.03 },
  // 4h — bottom-right
  { id:"outlook", bg:"#ffffff",  border:"rgba(0,0,0,0.07)", shadowColor:"rgba(0,120,212,0.18)",
    Icon:OutlookIcon, size:56, ...hex(120), floatDelay:"-1.6s", enterDelay:0.15, exitDelay:0.06 },
  // 6h — bottom
  { id:"mail",    bg:"#ffffff",  border:"rgba(0,0,0,0.07)", shadowColor:"rgba(0,122,255,0.16)",
    Icon:MailIcon,    size:52, ...hex(180), floatDelay:"-2.4s", enterDelay:0.20, exitDelay:0.09 },
  // 8h — bottom-left
  { id:"notion",  bg:"#ffffff",  border:"rgba(0,0,0,0.07)", shadowColor:"rgba(0,0,0,0.14)",
    Icon:NotionIcon,  size:52, ...hex(240), floatDelay:"-3.2s", enterDelay:0.15, exitDelay:0.06 },
  // 10h — top-left
  { id:"sheets",  bg:"#0F9D58", border:"transparent",       shadowColor:"rgba(15,157,88,0.28)",
    Icon:SheetsIcon,  size:58, ...hex(300), floatDelay:"-4.0s", enterDelay:0.10, exitDelay:0.03 },
];

/* ── CSS animations ──────────────────────────────────────────── */
const CSS = `
/* Rotation du groupe entier */
@keyframes spin-cw  { to { transform: rotate(360deg);  } }
/* Contre-rotation de chaque icône (reste droite) */
@keyframes spin-ccw { to { transform: rotate(-360deg); } }
/* Bob vertical doux */
@keyframes float-bob {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-7px); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.45; transform: scale(1);    }
  50%       { opacity: 0.80; transform: scale(1.05); }
}
`;

/* ── Bubble ───────────────────────────────────────────────────── */
function Bubble({ size, bg, border, shadowColor, dk, children }: {
  size: number; bg: string; border: string; shadowColor: string; dk: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `1px solid ${border}`,
      boxShadow: dk
        ? `0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`
        : `0 6px 22px ${shadowColor}, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: "translateZ(0)", backfaceVisibility: "hidden", willChange: "transform",
    } as React.CSSProperties}>
      {children}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────── */
export default function HeroOrbitAnimation({ dk }: { dk: boolean }) {
  const [phase, setPhase] = useState<Phase>("entering");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setPhase("entering");
    const t1 = setTimeout(() => setPhase("floating"),   800);
    const t2 = setTimeout(() => setPhase("fadeout"),   4200);
    const t3 = setTimeout(() => setPhase("logo"),      5000);
    const t4 = setTimeout(() => setCycle(c => c + 1),  7500); // logo visible ~2.5s
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [cycle]);

  const isFading   = phase === "fadeout" || phase === "logo";
  const isFloating = phase === "floating" || phase === "fadeout";
  const showLogo   = phase === "logo";

  return (
    <div className="relative flex items-center justify-center select-none"
      style={{ width: 360, height: 360 }}>
      <style>{CSS}</style>

      {/* Ambient glow */}
      <div aria-hidden style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        background: dk
          ? "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 68%)"
          : "radial-gradient(circle, rgba(180,210,255,0.50) 0%, transparent 68%)",
        filter: "blur(30px)",
        animation: "pulse-glow 4.5s ease-in-out infinite", pointerEvents: "none",
      }}/>

      {/* ── Groupe tournant ── */}
      <div
        key={`ring-${cycle}`}
        style={{
          position: "absolute", width: 0, height: 0, zIndex: 1,
          animation: isFloating ? `spin-cw ${SPIN_DUR}s linear infinite` : "none",
          animationPlayState: isFading ? "paused" : "running",
        }}
      >
        {SATS.map((sat, i) => {
          const Icon = sat.Icon;
          // stagger en cascade : chaque logo rejoint le centre légèrement après le précédent
          const collapseDelay = i * 0.07;
          return (
            <motion.div
              key={`${sat.id}-${cycle}`}
              style={{
                position: "absolute",
                marginLeft: -sat.size / 2,
                marginTop:  -sat.size / 2,
                willChange: "transform, opacity",
              }}
              initial={{ x: sat.x, y: sat.y, scale: 0, opacity: 0 }}
              animate={isFading
                ? { x: 0, y: 0, scale: 0, opacity: 0 }
                : { x: sat.x, y: sat.y, scale: 1, opacity: 1 }
              }
              transition={isFading
                ? {
                    x:       { duration: 0.6, delay: collapseDelay, ease: [0.4, 0, 0.9, 1] },
                    y:       { duration: 0.6, delay: collapseDelay, ease: [0.4, 0, 0.9, 1] },
                    scale:   { duration: 0.5, delay: collapseDelay + 0.1, ease: [0.4, 0, 1, 1] },
                    opacity: { duration: 0.35, delay: collapseDelay + 0.25 },
                  }
                : { type: "spring", stiffness: 200, damping: 22, delay: sat.enterDelay }
              }
            >
              <div style={{
                width: sat.size, height: sat.size,
                animation: isFloating ? `spin-ccw ${SPIN_DUR}s linear infinite` : "none",
                animationPlayState: isFading ? "paused" : "running",
              }}>
                <div style={{
                  animation: isFloating ? `float-bob 3.4s ease-in-out infinite` : "none",
                  animationDelay: sat.floatDelay,
                }}>
                  <Bubble size={sat.size} bg={sat.bg} border={sat.border} shadowColor={sat.shadowColor} dk={dk}>
                    <Icon />
                  </Bubble>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Excel center — disparaît en dernier (le "soleil" absorbé) ── */}
      <motion.div
        key={`excel-${cycle}`}
        style={{ position: "absolute", zIndex: 2, willChange: "transform, opacity" }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={isFading ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={isFading
          ? { duration: 0.5, delay: 0.45, ease: [0.4, 0, 0.9, 1] }
          : { type: "spring", stiffness: 180, damping: 20, delay: 0 }
        }
      >
        <Bubble size={132} bg="#ffffff" border="rgba(0,0,0,0.07)" shadowColor="rgba(33,150,83,0.22)" dk={dk}>
          <ExcelIcon />
        </Bubble>
      </motion.div>

      {/* ── Ora logo — émerge de la galaxie effondrée ── */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            key={`ora-${cycle}`}
            style={{ position: "absolute", zIndex: 10 }}
            initial={{ scale: 0, opacity: 0, filter: "blur(16px)" }}
            animate={{ scale: 1,  opacity: 1, filter: "blur(0px)" }}
            exit={{    scale: 0.9, opacity: 0, filter: "blur(10px)" }}
            transition={{
              scale:   { type: "spring", stiffness: 280, damping: 22 },
              opacity: { duration: 0.35 },
              filter:  { duration: 0.5, ease: "easeOut" },
              // exit handled via animate prop
            }}
          >
            {/* Glow très doux derrière */}
            <motion.div aria-hidden style={{
              position: "absolute", inset: -32, borderRadius: "50%", pointerEvents: "none",
              background: "radial-gradient(circle, rgba(59,122,247,0.14) 0%, transparent 70%)",
              filter: "blur(16px)",
            }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Bulle blanche — fond blanc pour fusionner avec le logo */}
            <Bubble size={116} bg="#ffffff" border="rgba(0,0,0,0.08)" shadowColor="rgba(59,122,247,0.18)" dk={dk}>
              <img
                src="/logos/Logo_Ora.png" alt="Ora" draggable={false}
                style={{
                  width: "66%", height: "66%", objectFit: "contain",
                  transform: "translateZ(0)", backfaceVisibility: "hidden",
                } as React.CSSProperties}
              />
            </Bubble>

            {/* Anneau tournant — fin, discret, élégant */}
            <motion.svg
              aria-hidden
              width="144" height="144"
              style={{ position: "absolute", top: -14, left: -14, pointerEvents: "none", overflow: "visible" }}
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{
                opacity: { duration: 0.5, ease: "easeOut" },
                rotate:  { duration: 4, ease: "linear", repeat: Infinity },
              }}
            >
              <defs>
                <linearGradient id={`g-${cycle}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#3B7AF7" stopOpacity="0.9"/>
                  <stop offset="70%"  stopColor="#3B7AF7" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#3B7AF7" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r="68"
                fill="none"
                stroke={`url(#g-${cycle})`}
                strokeWidth="2"
                strokeDasharray="340 88"
                strokeLinecap="round"
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
