import { forwardRef, useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  useTransform,
  useMotionValue,
  motion,
  type MotionValue,
} from "framer-motion";

/* ── Scroll-reveal character ─────────────────────────────────── */
const ScrollChar: React.FC<{
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}> = ({ char, progress, range }) => {
  const opacity = useTransform(progress, range, [0.08, 1]);
  return (
    <motion.span style={{ opacity, display: "inline-block" }}>
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
};

/* ── Animations ──────────────────────────────────────────────── */
const heroCSS = `
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-stagger { opacity: 0; }
.hero-ready .hero-stagger { animation: heroFadeUp 0.9s cubic-bezier(.22,1,.36,1) forwards; }
.hero-d1 { animation-delay: 60ms; }
.hero-d2 { animation-delay: 180ms; }
.hero-d3 { animation-delay: 310ms; }
.hero-d4 { animation-delay: 440ms; }
.hero-d5 { animation-delay: 570ms; }
.hero-d6 { animation-delay: 680ms; }

@media (prefers-reduced-motion: reduce) {
  .hero-stagger { animation: none !important; opacity: 1 !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
}

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

/* Browser chrome frame */
.browser-frame {
  background: #f0f0f0;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 16px 16px 0 0;
  box-shadow:
    0 24px 80px rgba(0,0,0,0.10),
    0 8px 24px rgba(0,0,0,0.05),
    0 0 0 1px rgba(0,0,0,0.04);
}
.browser-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.browser-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.browser-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.browser-dot-red   { background: #ff5f57; }
.browser-dot-amber { background: #febc2e; }
.browser-dot-green { background: #28c840; }
.browser-urlbar {
  flex: 1;
  height: 24px;
  background: white;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9ca3af;
  font-family: Inter, sans-serif;
  max-width: 240px;
  margin: 0 auto;
}
`;

/* ── Social proof avatars ───────────────────────────────────── */
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
  ({ scrollToSection, openBooking }, ref) => {
    /* ── Delay hero animation until mount ── */
    const [heroReady, setHeroReady] = useState(false);
    useEffect(() => {
      requestAnimationFrame(() => setHeroReady(true));
    }, []);

    /* ── TRUE SCROLL-LOCK: phase 1 = letters, phase 2 = video slides up ── */
    const revealProgress = useMotionValue(0);
    const videoSlide = useMotionValue(0);
    const videoSlideY = useTransform(videoSlide, [0, 1], ["0vh", "-100vh"]);
    const textFadeOut = useTransform(videoSlide, [0, 0.4], [1, 0]);
    const lockRef = useRef<HTMLDivElement>(null);
    const isLockedRef = useRef(false);
    const [textVisible, setTextVisible] = useState(false);

    const revealLines = [
      "Le temps est votre actif le plus précieux.",
      "Cessez de le gaspiller sur Excel.",
      "Ora construit des automatisations sur mesure",
      "qui tournent silencieusement en arrière-plan.",
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

    // 2) Scroll lock — activates when section is ~90% visible
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
          if (next >= 1) { videoSlide.set(1); unlock(); return; }
          if (next <= 0) { videoSlide.set(0); revealProgress.set(0.99); return; }
          videoSlide.set(next);
        } else {
          const next = revealProgress.get() + delta;
          if (next >= 1) { revealProgress.set(1); return; }
          if (next <= 0) { revealProgress.set(0); unlock(); return; }
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

    const videoSectionRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const targets = [videoSectionRef.current];
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
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

        <section
          ref={ref}
          id="hero"
          className={`relative overflow-hidden${heroReady ? " hero-ready" : ""}`}
          style={{ marginBottom: "-85vh" }}
        >
          {/* ── Background ────────────────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-[#fcfbf7]" />
            {/* Subtle gradient orbs */}
            <div
              className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)",
                filter: "blur(60px)",
              }}
            />
            <div
              className="absolute top-1/2 -left-20 w-[600px] h-[600px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 60%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 1 — HERO ABOVE THE FOLD (Alpine.inc style)
          ═══════════════════════════════════════════════════ */}
          <div className="relative z-10 pt-28 md:pt-36 lg:pt-44 pb-0">
            <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">

              {/* Eyebrow badge */}
              <div className="hero-stagger hero-d1 mb-7 flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-[12.5px] font-medium font-inter text-gray-500 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#0d9488] inline-block" />
                  Automatisation Excel · Python sur mesure
                </span>
              </div>

              {/* H1 */}
              <h1 className="hero-stagger hero-d2 font-poppins text-[clamp(2.6rem,6.5vw,4.8rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#111827]">
                Automatisez votre{" "}
                <br className="hidden sm:block" />
                <span className="text-brand-gradient">travail Excel.</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-stagger hero-d3 mt-6 text-[clamp(1rem,2vw,1.175rem)] leading-[1.75] text-gray-500 font-inter max-w-2xl mx-auto">
                Ora crée des automatisations sur mesure pour vos rapports, réconciliations et factures &mdash; votre équipe se concentre sur les décisions, pas la saisie.
              </p>

              {/* CTAs */}
              <div className="hero-stagger hero-d4 mt-9 flex flex-wrap items-center justify-center gap-3.5">
                <button
                  onClick={openBooking}
                  className={[
                    "group inline-flex items-center gap-2 px-7 py-3.5 rounded-full",
                    "text-[15px] font-semibold font-inter text-white",
                    "bg-gradient-to-r from-[#3b82f6] to-[#0d9488]",
                    "shadow-[0_2px_12px_rgba(59,130,246,0.30)]",
                    "hover:shadow-[0_4px_24px_rgba(59,130,246,0.40)]",
                    "hover:-translate-y-px active:translate-y-0",
                    "transition-all duration-150",
                  ].join(" ")}
                >
                  Réserver un appel
                  <ArrowRight className="w-4 h-4 opacity-80 group-hover:translate-x-[3px] transition-transform duration-150" />
                </button>

                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className={[
                    "inline-flex items-center px-7 py-3.5 rounded-full",
                    "text-[15px] font-semibold font-inter",
                    "border border-gray-300 text-gray-700",
                    "hover:bg-gray-50 hover:border-gray-400",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                    "transition-all duration-150",
                  ].join(" ")}
                >
                  Voir la démo
                </button>
              </div>

              {/* Social proof */}
              <div className="hero-stagger hero-d5 mt-9 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {avatars.map((g, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ring-2 ring-[#fcfbf7] ${g}`}
                    />
                  ))}
                </div>
                <p className="text-[13px] font-inter text-gray-400">
                  Déjà utilisé par{" "}
                  <span className="font-semibold text-gray-600">200+ équipes finance &amp; ops</span>
                </p>
              </div>
            </div>

            {/* ── App screenshot / browser frame ─────────────── */}
            <div className="hero-stagger hero-d6 relative z-10 mt-14 mx-auto max-w-6xl px-6 lg:px-10">
              <div className="browser-frame overflow-hidden">
                {/* Browser chrome */}
                <div className="browser-chrome">
                  <div className="browser-dots">
                    <div className="browser-dot browser-dot-red" />
                    <div className="browser-dot browser-dot-amber" />
                    <div className="browser-dot browser-dot-green" />
                  </div>
                  <div className="browser-urlbar">
                    app.ora.io
                  </div>
                  <div style={{ width: 56 }} />
                </div>
                {/* Video */}
                <video
                  src="/demo-main1-safari.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[16/9] object-cover"
                  onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.7; }}
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2A — SCROLL-LOCK LETTER REVEAL
          ═══════════════════════════════════════════════════ */}
          <div
            ref={lockRef}
            className="relative z-[1] min-h-screen flex items-center justify-center bg-[#fcfbf7]"
          >
            <motion.div
              className="text-center max-w-4xl mx-auto px-6 lg:px-10"
              style={{
                opacity: textVisible ? textFadeOut : 0,
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
                    className="font-poppins text-2xl md:text-[2.1rem] lg:text-[2.6rem] font-medium leading-[1.55] tracking-[-0.025em] text-[#111827]"
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

              {/* CTA button — fades in once text fully revealed */}
              <motion.button
                onClick={openBooking}
                className={[
                  "mt-10 inline-flex items-center gap-2 px-7 py-3.5 rounded-full",
                  "text-[15px] font-semibold font-inter text-white",
                  "bg-gradient-to-r from-[#3b82f6] to-[#0d9488]",
                  "shadow-[0_2px_14px_rgba(59,130,246,0.30)]",
                  "hover:shadow-[0_4px_24px_rgba(59,130,246,0.42)]",
                  "hover:-translate-y-px transition-all duration-150",
                ].join(" ")}
                style={{ opacity: useTransform(revealProgress, [0.8, 1], [0, 1]) }}
              >
                Réserver un appel
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2B — VIDEO SLIDES UP
          ═══════════════════════════════════════════════════ */}
          <motion.div
            ref={videoSectionRef}
            className="relative z-[2] flex items-center justify-center"
            style={{ y: videoSlideY }}
          >
            <div className="max-w-7xl w-full mx-auto px-6 lg:px-10">
              <div className="rounded-[24px] overflow-hidden border border-gray-200/60 shadow-[0_24px_80px_rgba(0,0,0,0.09),0_4px_16px_rgba(0,0,0,0.04)]">
                <video
                  src="/demo-main1-safari.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[16/9] object-cover"
                  onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.7; }}
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
