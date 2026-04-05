import { forwardRef, useRef, useEffect, useState } from "react";
import {
  ArrowRight,
} from "lucide-react";
import HeroDemoCard from "./HeroDemoCard";
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
      const SLIDE_SPEED = 2000;

      const unlock = () => {
        isLockedRef.current = false;
        (window as any).__lenis?.start();
      };

      const drive = (delta: number) => {
        const lettersComplete = revealProgress.get() >= 1;

        if (lettersComplete) {
          const next = videoSlide.get() + delta / SLIDE_SPEED * SPEED;
          if (next >= 1) {
            videoSlide.set(1);
            unlock();
            return;
          }
          if (next <= 0) {
            videoSlide.set(0);
            revealProgress.set(0.99);
            return;
          }
          videoSlide.set(next);
        } else {
          const next = revealProgress.get() + delta;
          if (next >= 1) {
            revealProgress.set(1);
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
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
      };
    }, [revealProgress, videoSlide]);

    /* ── Section reveal refs (IntersectionObserver) ─────────── */
    const videoSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const targets = [videoSectionRef.current];
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
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
              <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-start">
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

                  {/* CTAs */}
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

                {/* ── Right column: demo card ── */}
                <div className="flex flex-col items-center">
                  <HeroDemoCard dk={dk} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2A — TRUE SCROLL-LOCK LETTER REVEAL
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
