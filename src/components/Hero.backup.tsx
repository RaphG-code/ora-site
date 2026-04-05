import { forwardRef, useRef, useEffect, useState } from "react";
import {
  ArrowRight,
  FileSpreadsheet,
  Sparkles,
  Database,
  Calculator,
  Download,
  Clock,
  Check,
} from "lucide-react";
import {
  useTransform,
  useMotionValue,
  motion,
  type MotionValue,
} from "framer-motion";

/* ── Location badge (LA ↔ Paris) ──────────────────────────────── */
const locations = [
  { flag: "🇺🇸", text: "from LA" },
  { flag: "🇫🇷", text: "from Paris" },
] as const;

const LocationBadge = ({ dk }: { dk: boolean }) => {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % locations.length);
        setFading(false);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const loc = locations[idx];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium",
        dk
          ? "bg-white/[0.06] border border-white/[0.10] text-gray-400"
          : "bg-white/80 border border-gray-200/60 text-gray-500",
      ].join(" ")}
    >
      <span
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(-4px)" : "translateY(0)",
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
      >
        {loc.flag}
      </span>
      <span
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(4px)" : "translateY(0)",
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
      >
        {loc.text}
      </span>
    </span>
  );
};

/* ── Scroll-reveal character ─────────────────────────────────── */
const ScrollChar: React.FC<{
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}> = ({ char, progress, range }) => {
  const opacity = useTransform(progress, range, [0.05, 1]);
  return (
    <motion.span style={{ opacity, display: "inline-block" }}>
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
};

/* ── Animations ──────────────────────────────────────────────── */
const heroCSS = `
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-stagger { opacity: 0; }
.hero-ready .hero-stagger { animation: heroFadeUp 0.9s cubic-bezier(.22,1,.36,1) forwards; }
.hero-d1 { animation-delay: 50ms; }
.hero-d2 { animation-delay: 200ms; }
.hero-d3 { animation-delay: 350ms; }
.hero-d4 { animation-delay: 500ms; }
.hero-d5 { animation-delay: 650ms; }

@media (prefers-reduced-motion: reduce) {
  .hero-stagger { animation: none !important; opacity: 1 !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
}

/* Scroll-triggered reveal (no blur — too expensive during scroll) */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 800ms cubic-bezier(.22,1,.36,1),
    transform 800ms cubic-bezier(.22,1,.36,1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
`;

/* ── Mock spreadsheet data ───────────────────────────────────── */
const sheetHeaders = ["Date", "Client", "Amount", "VAT", "Total"];
const sheetRows = [
  ["2024-01-15", "Acme Corp", "$12,400", "20%", "$14,880"],
  ["2024-01-16", "TechFlow", "$8,750", "20%", "$10,500"],
  ["2024-01-17", "DataSync", "$23,100", "15%", "$26,565"],
  ["2024-01-18", "CloudBase", "$6,200", "20%", "$7,440"],
  ["2024-01-19", "NexaLabs", "$15,800", "18%", "$18,644"],
];

/* ── Automation pipeline steps ───────────────────────────────── */
const pipelineSteps = [
  { icon: FileSpreadsheet, label: "Extract data", done: true },
  { icon: Sparkles, label: "Clean & format", done: true },
  { icon: Database, label: "Match with CRM", done: true },
  { icon: Calculator, label: "Compute totals", done: false },
  { icon: Download, label: "Export report", done: false },
];


/* ── Social proof avatar gradients ───────────────────────────── */
const avatars = [
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
];

/* ── Component ───────────────────────────────────────────────── */
interface HeroProps {
  theme: "light" | "dark";
  scrollToSection: (id: string) => void;
  openBooking: () => void;
}

const Hero = forwardRef<HTMLElement, HeroProps>(
  ({ theme, scrollToSection, openBooking }, ref) => {
    const dk = theme === "dark";

    /* ── Delay hero animation until mount (avoids flash on dark bg) ── */
    const [heroReady, setHeroReady] = useState(false);
    useEffect(() => {
      requestAnimationFrame(() => setHeroReady(true));
    }, []);

    /* ── TRUE SCROLL-LOCK: phase 1 = letters, phase 2 = video slides up ── */
    const revealProgress = useMotionValue(0); // 0→1 letters
    const videoSlide = useMotionValue(0);     // 0→1 video rises
    const videoSlideY = useTransform(videoSlide, [0, 1], ["0vh", "-100vh"]);
    const textFadeOut = useTransform(videoSlide, [0, 0.4], [1, 0]);
    const lockRef = useRef<HTMLDivElement>(null);
    const isLockedRef = useRef(false);
    const [textVisible, setTextVisible] = useState(false);

    const revealLines = [
      "Time is your greatest asset.",
      "stop wasting it on excel work.",
      "Ora builds tailored automations",
      "that run silently in the background.",
    ];
    const totalChars = revealLines.reduce((sum, l) => sum + l.length, 0);

    // 1) Entrance animation — text fades up when section is ~30% visible
    useEffect(() => {
      const el = lockRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTextVisible(true);
            obs.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    // 2) Scroll lock — activates when section is ~90% visible (text well centered)
    useEffect(() => {
      const el = lockRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isLockedRef.current) {
            isLockedRef.current = true;
            (window as any).__lenis?.stop();
          }
        },
        { threshold: 0.9 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    // 3) Capture wheel + touch → phase 1 (letters) then phase 2 (video slide)
    useEffect(() => {
      const SPEED = 3600;
      const SLIDE_SPEED = 2000; // video slide speed (higher = slower rise)

      const unlock = () => {
        isLockedRef.current = false;
        (window as any).__lenis?.start();
      };

      const drive = (delta: number) => {
        const lettersComplete = revealProgress.get() >= 1;

        if (lettersComplete) {
          // Phase 2: drive video slide up
          const next = videoSlide.get() + delta / SLIDE_SPEED * SPEED;
          if (next >= 1) {
            videoSlide.set(1);
            unlock();
            return;
          }
          if (next <= 0) {
            // Go back to phase 1
            videoSlide.set(0);
            revealProgress.set(0.99);
            return;
          }
          videoSlide.set(next);
        } else {
          // Phase 1: drive letter reveal
          const next = revealProgress.get() + delta;
          if (next >= 1) {
            revealProgress.set(1);
            // Don't unlock — enter phase 2
            return;
          }
          if (next <= 0) {
            revealProgress.set(0);
            unlock();
            return;
          }
          revealProgress.set(next);
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (!isLockedRef.current) return;
        e.preventDefault();
        drive(e.deltaY / SPEED);
      };

      let lastTouchY = 0;
      const handleTouchStart = (e: TouchEvent) => {
        if (!isLockedRef.current) return;
        lastTouchY = e.touches[0].clientY;
      };
      const handleTouchMove = (e: TouchEvent) => {
        if (!isLockedRef.current) return;
        e.preventDefault();
        const y = e.touches[0].clientY;
        drive((lastTouchY - y) / SPEED);
        lastTouchY = y;
      };

      window.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      window.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });

      return () => {
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
      };
    }, [revealProgress, videoSlide]);

    /* ── Section reveal refs (IntersectionObserver) ─────────── */
    const videoSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const targets = [
        videoSectionRef.current,
      ];
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Add .visible to the section
              entry.target.classList.add("visible");
              // Stagger children that have data-reveal-delay
              entry.target
                .querySelectorAll<HTMLElement>("[data-reveal-delay]")
                .forEach((child) => {
                  setTimeout(() => {
                    child.classList.add("visible");
                  }, parseInt(child.dataset.revealDelay || "0", 10));
                });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      targets.forEach((el) => el && observer.observe(el));
      return () => observer.disconnect();
    }, []);

    return (
      <>
        <style>{heroCSS}</style>

        <section ref={ref} id="hero" className={`relative overflow-hidden${heroReady ? " hero-ready" : ""}`} style={{ marginBottom: "-85vh" }}>
          {/* ── Background ────────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {dk ? (
              <>
                <div className="absolute inset-0 bg-[#020617]" />
                <div
                  className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.07]"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)",
                    filter: "blur(80px)",
                  }}
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[#fefefe]" />
                <div
                  className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(210,232,255,0.45) 0%, transparent 65%)",
                    filter: "blur(40px)",
                    contain: "strict",
                  }}
                />
                <div
                  className="absolute -bottom-20 -left-20 w-[700px] h-[700px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,200,220,0.4) 0%, transparent 60%)",
                    filter: "blur(40px)",
                    contain: "strict",
                  }}
                />
                <div
                  className="absolute -top-10 left-1/3 w-[500px] h-[500px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,210,230,0.3) 0%, transparent 65%)",
                    filter: "blur(40px)",
                    contain: "strict",
                  }}
                />
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 1 — HERO (above the fold)
          ═══════════════════════════════════════════════════ */}
          <div className="relative z-10 pt-28 pb-32 md:pt-36 md:pb-44 lg:pt-44 lg:pb-56">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-center">
                {/* ── Left column: copy ───────────────── */}
                <div className="max-w-xl">
                  {/* H1 */}
                  <h1 className="hero-stagger hero-d1">
                    <span
                      className={[
                        "block text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.03em]",
                        dk ? "text-white" : "text-black",
                      ].join(" ")}
                    >
                      We build AI automation that eliminates manual Excel work
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p
                    className={[
                      "hero-stagger hero-d2 mt-6 text-[clamp(0.95rem,1.8vw,1.125rem)] leading-[1.7] max-w-[460px]",
                      dk ? "text-gray-400" : "text-gray-500",
                    ].join(" ")}
                  >
                    Reporting, reconciliation, and invoicing &mdash; automated
                    in days. Your team focuses on decisions, not data entry.
                  </p>

                  {/* CTAs — deeper blue */}
                  <div className="hero-stagger hero-d3 mt-9 flex flex-wrap items-center gap-3.5">
                    <button
                      onClick={openBooking}
                      className={[
                        "group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold text-white",
                        "transition-all duration-150 hover:-translate-y-px active:translate-y-0",
                        "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600",
                        "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_8px_24px_rgba(37,99,235,0.35)]",
                        "hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_32px_rgba(37,99,235,0.45)]",
                        "hover:from-blue-500 hover:via-blue-400 hover:to-blue-500",
                      ].join(" ")}
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all duration-150" />
                    </button>

                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className={[
                        "inline-flex items-center px-7 py-3.5 rounded-full text-[15px] font-semibold border transition-all duration-150",
                        dk
                          ? "border-white/[0.12] text-gray-300 hover:bg-white/[0.05] hover:border-white/[0.18]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
                        "shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
                      ].join(" ")}
                    >
                      Watch Demo
                    </button>

                    <LocationBadge dk={dk} />
                  </div>

                  {/* Social proof */}
                  <div className="hero-stagger hero-d4 mt-10 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {avatars.map((g, i) => (
                        <div
                          key={i}
                          className={[
                            "w-8 h-8 rounded-full bg-gradient-to-br ring-2",
                            g,
                            dk ? "ring-[#020617]" : "ring-white",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                    <p
                      className={[
                        "text-[13px]",
                        dk ? "text-gray-500" : "text-gray-400",
                      ].join(" ")}
                    >
                      Trusted by{" "}
                      <span
                        className={[
                          "font-semibold",
                          dk ? "text-gray-300" : "text-gray-600",
                        ].join(" ")}
                      >
                        200+ finance &amp; ops teams
                      </span>
                    </p>
                  </div>
                </div>

                {/* ── Right column: mock app card (bigger) ── */}
                <div className="hero-stagger hero-d5 relative lg:scale-110 lg:origin-center">
                  {/* Light blue wrapper */}
                  <div
                    className={[
                      "rounded-[28px] p-4 md:p-5 relative overflow-hidden",
                      dk
                        ? "border border-sky-400/[0.08]"
                        : "border border-[rgba(120,160,255,0.15)]",
                    ].join(" ")}
                    style={{
                      background: dk
                        ? "rgba(14,165,233,0.04)"
                        : "linear-gradient(135deg, #EEF5FF 0%, #E6F0FF 40%, #DCE9FF 100%)",
                      boxShadow: dk
                        ? "0 8px 40px rgba(0,0,0,0.3)"
                        : "0 20px 60px rgba(80,120,255,0.12), 0 4px 16px rgba(80,120,255,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
                    }}
                  >
                    {/* Faint grain texture overlay */}
                    {!dk && (
                      <div
                        className="absolute inset-0 rounded-[28px] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                          opacity: 0.03,
                          mixBlendMode: "soft-light",
                        }}
                      />
                    )}
                    <div
                      className={[
                        "relative rounded-3xl overflow-hidden border",
                        dk
                          ? "bg-[#0a1120]/80 border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                          : "bg-white/90 border-gray-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]",
                      ].join(" ")}
                      style={{ backdropFilter: "blur(8px)" }}
                    >
                      {/* Window chrome */}
                      <div
                        className={[
                          "flex items-center gap-2 px-5 py-3 border-b",
                          dk ? "border-white/[0.06]" : "border-gray-100",
                        ].join(" ")}
                      >
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span
                          className={[
                            "text-[12px] font-medium ml-3",
                            dk ? "text-gray-500" : "text-gray-400",
                          ].join(" ")}
                        >
                          Ora Automation
                        </span>
                      </div>

                      {/* Formula bar */}
                      <div
                        className={[
                          "flex items-center gap-3 px-5 py-2.5 border-b text-[12px]",
                          dk
                            ? "border-white/[0.06] bg-white/[0.02]"
                            : "border-gray-100 bg-gray-50/50",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "font-bold italic",
                            dk ? "text-gray-500" : "text-gray-400",
                          ].join(" ")}
                        >
                          fx
                        </span>
                        <span
                          className={[
                            "font-mono",
                            dk ? "text-sky-400/80" : "text-sky-600/80",
                          ].join(" ")}
                        >
                          =SUM(Amount)*(1+VAT)
                        </span>
                      </div>

                      {/* Content area: spreadsheet + pipeline */}
                      <div className="flex">
                        {/* Spreadsheet table */}
                        <div className="flex-1 overflow-x-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr
                                className={
                                  dk ? "bg-white/[0.03]" : "bg-gray-50/80"
                                }
                              >
                                {sheetHeaders.map((h) => (
                                  <th
                                    key={h}
                                    className={[
                                      "px-3 py-2 text-left font-semibold whitespace-nowrap",
                                      dk
                                        ? "text-gray-400 border-b border-white/[0.06]"
                                        : "text-gray-500 border-b border-gray-100",
                                    ].join(" ")}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sheetRows.map((row, ri) => (
                                <tr
                                  key={ri}
                                  className={
                                    ri === 2
                                      ? dk
                                        ? "bg-sky-500/[0.06]"
                                        : "bg-sky-50/60"
                                      : ""
                                  }
                                >
                                  {row.map((cell, ci) => (
                                    <td
                                      key={ci}
                                      className={[
                                        "px-3 py-2 tabular-nums whitespace-nowrap",
                                        dk
                                          ? "text-gray-300 border-b border-white/[0.04]"
                                          : "text-gray-700 border-b border-gray-50",
                                        ci === 0
                                          ? dk
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                          : "",
                                        ci >= 2 ? "font-medium" : "",
                                      ].join(" ")}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pipeline sidebar — hidden on small screens */}
                        <div
                          className={[
                            "hidden md:block w-44 flex-shrink-0 border-l p-4",
                            dk
                              ? "border-white/[0.06] bg-white/[0.02]"
                              : "border-gray-100 bg-gray-50/30",
                          ].join(" ")}
                        >
                          <p
                            className={[
                              "text-[10px] font-bold uppercase tracking-widest mb-4",
                              dk ? "text-gray-500" : "text-gray-400",
                            ].join(" ")}
                          >
                            Pipeline
                          </p>
                          <div className="space-y-3">
                            {pipelineSteps.map((step, i) => {
                              const Icon = step.icon;
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2.5"
                                >
                                  <div
                                    className={[
                                      "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                                      step.done
                                        ? dk
                                          ? "bg-emerald-500/[0.15] text-emerald-400"
                                          : "bg-emerald-50 text-emerald-500"
                                        : dk
                                          ? "bg-white/[0.05] text-gray-500"
                                          : "bg-gray-100 text-gray-400",
                                    ].join(" ")}
                                  >
                                    {step.done ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Icon className="w-3 h-3" />
                                    )}
                                  </div>
                                  <span
                                    className={[
                                      "text-[11px] font-medium",
                                      step.done
                                        ? dk
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                        : dk
                                          ? "text-gray-500"
                                          : "text-gray-400",
                                    ].join(" ")}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating metric card */}
                  <div
                    className={[
                      "absolute -bottom-5 -left-4 md:-left-6 rounded-2xl px-5 py-3.5 border",
                      dk
                        ? "bg-[#0c1525]/90 border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                        : "bg-white/90 border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
                    ].join(" ")}
                    style={{ backdropFilter: "blur(6px)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          dk ? "bg-sky-500/[0.15]" : "bg-sky-50",
                        ].join(" ")}
                      >
                        <Clock
                          className={[
                            "w-4 h-4",
                            dk ? "text-sky-400" : "text-sky-500",
                          ].join(" ")}
                        />
                      </div>
                      <div>
                        <p
                          className={[
                            "text-[10px] font-medium",
                            dk ? "text-gray-500" : "text-gray-400",
                          ].join(" ")}
                        >
                          Hours saved / week
                        </p>
                        <p
                          className={[
                            "text-[18px] font-bold tracking-tight leading-none mt-0.5",
                            dk ? "text-white" : "text-gray-900",
                          ].join(" ")}
                        >
                          +12h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2A — TRUE SCROLL-LOCK LETTER REVEAL
              Scroll is blocked while letters animate.
              Wheel/touch drives the reveal. Unlocks at 100%.
              Text stays pinned; video scrolls up over it.
          ═══════════════════════════════════════════════════ */}
          <div
            ref={lockRef}
            className="relative z-[1] min-h-screen flex items-center justify-center"
          >
            <motion.div
              className="text-center max-w-4xl mx-auto px-6 lg:px-10"
              style={{
                opacity: textVisible ? textFadeOut : 0,
                scale: 1,
                transform: textVisible ? undefined : "translateY(40px)",
                transition: textVisible
                  ? undefined
                  : "opacity 800ms cubic-bezier(.22,1,.36,1), transform 800ms cubic-bezier(.22,1,.36,1)",
              }}
            >
              {revealLines.map((line, li) => {
                const lineStart = revealLines
                  .slice(0, li)
                  .reduce((s, l) => s + l.length, 0);
                return (
                  <p
                    key={li}
                    className={[
                      "text-2xl md:text-4xl lg:text-5xl font-light leading-[1.6] tracking-[-0.02em]",
                      dk ? "text-white" : "text-black",
                    ].join(" ")}
                  >
                    {line.split("").map((char: string, ci: number) => {
                      const idx = lineStart + ci;
                      const start = (idx / totalChars) * 0.9;
                      const end = Math.min(start + 0.06, 0.95);
                      return (
                        <ScrollChar
                          key={ci}
                          char={char}
                          progress={revealProgress}
                          range={[start, end]}
                        />
                      );
                    })}
                  </p>
                );
              })}

              {/* CTA button */}
              <motion.button
                onClick={openBooking}
                className={[
                  "mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors",
                  dk
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-black/85",
                ].join(" ")}
                style={{ opacity: useTransform(revealProgress, [0.8, 1], [0, 1]) }}
              >
                Book a call
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2B — VIDEO
          ═══════════════════════════════════════════════════ */}
          <motion.div
            ref={videoSectionRef}
            className="relative z-[2] flex items-center justify-center"
            style={{ y: videoSlideY }}
          >
            <div className="max-w-7xl w-full mx-auto px-6 lg:px-10">
              <div className="rounded-[28px] overflow-hidden">
                <video
                  src="/demo-main1-safari.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[16/9] object-cover"
                  onLoadedMetadata={(e) => {
                    e.currentTarget.playbackRate = 0.7;
                  }}
                />
              </div>
            </div>
          </motion.div>


        </section>
      </>
    );
  },
);

Hero.displayName = "Hero";
export default Hero;
