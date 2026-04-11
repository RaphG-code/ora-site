import { forwardRef, useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LogosSlider } from "./LogosSlider";
import { AnimatedHeroTitle } from "./ui/animated-hero";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import hourglassData from "../../public/hourglass-brand.json";
import {
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  motion,
  type MotionValue,
} from "framer-motion";

/* ── Lottie Hourglass ────────────────────────────────────────── */
const TOTAL_FRAMES = 62; // animation op value

const HourglassLottie: React.FC<{ progress: MotionValue<number> }> = ({ progress }) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Drive animation frame directly from scroll progress
  useMotionValueEvent(progress, "change", (val) => {
    lottieRef.current?.goToAndStop(val * TOTAL_FRAMES, true);
  });

  return (
    <div
      className="w-48 md:w-64 lg:w-72"
      style={{
        filter:
          "drop-shadow(0 0 32px rgba(59,130,246,0.20)) drop-shadow(0 0 10px rgba(13,148,136,0.15))",
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={hourglassData}
        autoplay={false}
        loop={false}
      />
    </div>
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

    /* ── TRUE SCROLL-LOCK: phase 1 = text+hourglass, phase 2 = video slides up ── */
    const revealProgress = useMotionValue(0);
    const videoSlide     = useMotionValue(0);
    const videoSlideY    = useTransform(videoSlide, [0, 1], ["0vh", "-100vh"]);
    const textFadeOut    = useTransform(videoSlide, [0, 0.4], [1, 0]);
    const lockRef        = useRef<HTMLDivElement>(null);
    const isLockedRef    = useRef(false);

    /* ── Text line reveal motion values (slightly faster reveal) ── */
    const l1o  = useTransform(revealProgress, [0,    0.22], [0, 1]);
    const l1y  = useTransform(revealProgress, [0,    0.22], [24, 0]);
    const l2o  = useTransform(revealProgress, [0.20, 0.40], [0, 1]);
    const l2y  = useTransform(revealProgress, [0.20, 0.40], [24, 0]);
    const l3o  = useTransform(revealProgress, [0.38, 0.58], [0, 1]);
    const l3y  = useTransform(revealProgress, [0.38, 0.58], [24, 0]);
    const ctaO = useTransform(revealProgress, [0.60, 0.75], [0, 1]);

    // Activate scroll-lock when section reaches ~90% visibility
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

    // Capture wheel + touch → phase 1 (text reveal) then phase 2 (video slide)
    useEffect(() => {
      const SPEED       = 3600;
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
            <div className="absolute inset-0 bg-[#fcfbf7] dark:bg-[#111827]" />
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
              SECTION 1 — HERO ABOVE THE FOLD
          ═══════════════════════════════════════════════════ */}
          <div className="relative z-10 pt-28 md:pt-32 lg:pt-36 pb-0">
            <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">

              {/* H1 */}
              <AnimatedHeroTitle />

              {/* Subtitle */}
              <p className="hero-stagger hero-d2 mt-6 text-[clamp(1rem,2vw,1.175rem)] leading-[1.75] text-gray-500 dark:text-gray-400 font-inter max-w-2xl mx-auto">
                Ora crée des automatisations sur-mesure pour traiter vos données, afin que votre équipe se concentre sur ce qui compte vraiment.
              </p>

              {/* CTAs */}
              <div className="hero-stagger hero-d3 mt-9 flex flex-wrap items-center justify-center gap-3.5">
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
                    "border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:border-gray-400 dark:hover:border-white/30",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                    "transition-all duration-150",
                  ].join(" ")}
                >
                  Voir la démo
                </button>
              </div>
            </div>

            {/* ── App screenshot / browser frame ─────────────── */}
            <div className="hero-stagger hero-d4 relative z-10 mt-10 mx-auto max-w-6xl px-6 lg:px-10">
              <div className="browser-frame overflow-hidden">
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

          {/* ── Logos slider ───────────────────────────── */}
          <div className="hero-stagger hero-d5 mx-auto max-w-6xl px-6 lg:px-10">
            <LogosSlider />
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 2A — SCROLL-LOCK: sablier + texte
          ═══════════════════════════════════════════════════ */}
          <div
            ref={lockRef}
            className="relative z-[1] min-h-screen flex items-center bg-[#fcfbf7] dark:bg-[#111827]"
          >
            <motion.div
              className="w-full max-w-5xl mx-auto px-6 lg:px-10 py-16"
              style={{ opacity: textFadeOut }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* ── Left — Hourglass ── */}
                <div className="flex items-center justify-center order-2 md:order-1">
                  <HourglassLottie progress={revealProgress} />
                </div>

                {/* ── Right — Text ── */}
                <div className="flex flex-col justify-center gap-6 order-1 md:order-2">
                  <motion.p
                    className="font-poppins text-2xl md:text-[1.75rem] lg:text-[2rem] font-medium leading-[1.5] tracking-[-0.025em] text-[#111827] dark:text-white"
                    style={{ opacity: l1o, y: l1y }}
                  >
                    Votre temps est votre actif le plus précieux.
                  </motion.p>

                  <motion.p
                    className="font-poppins text-2xl md:text-[1.75rem] lg:text-[2rem] font-medium leading-[1.5] tracking-[-0.025em] text-[#111827] dark:text-white"
                    style={{ opacity: l2o, y: l2y }}
                  >
                    Cessez de le gaspiller sur Excel.
                  </motion.p>

                  <motion.p
                    className="font-poppins text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.25] tracking-[-0.03em] text-brand-gradient mt-2"
                    style={{ opacity: l3o, y: l3y }}
                  >
                    Utilisez Ora.
                  </motion.p>

                  <motion.button
                    onClick={openBooking}
                    className={[
                      "mt-4 w-fit inline-flex items-center gap-2 px-7 py-3.5 rounded-full",
                      "text-[15px] font-semibold font-inter text-white",
                      "bg-gradient-to-r from-[#3b82f6] to-[#0d9488]",
                      "shadow-[0_2px_14px_rgba(59,130,246,0.30)]",
                      "hover:shadow-[0_4px_24px_rgba(59,130,246,0.42)]",
                      "hover:-translate-y-px transition-all duration-150",
                    ].join(" ")}
                    style={{ opacity: ctaO }}
                  >
                    Réserver un appel
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>

              </div>
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
