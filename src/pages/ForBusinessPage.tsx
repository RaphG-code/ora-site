import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Zap, Shield, Clock, Users } from "lucide-react";
import HeroOrbitAnimation from "../components/HeroOrbitAnimation";

interface ForBusinessPageProps {
  theme: "light" | "dark";
  openBooking: () => void;
}

const integrations = [
  "Microsoft Excel", "Google Sheets", "Gmail", "Outlook",
  "PDF Documents", "Notion", "Google Drive", "Apple Mail",
];

const benefits = [
  {
    icon: Zap,
    title: "Connect every tool your team already uses",
    desc: "Ora integrates with Excel, Google Workspace, email clients, PDFs, and more — no ripping and replacing your existing stack.",
  },
  {
    icon: Clock,
    title: "Deploy automations in days, not months",
    desc: "We build, configure, and ship your custom automations. You're in production fast, with measurable ROI from week one.",
  },
  {
    icon: Shield,
    title: "Enterprise-grade security",
    desc: "SOC 2 compliant infrastructure. Your data is encrypted in transit and at rest. We never train models on your data.",
  },
  {
    icon: Users,
    title: "Dedicated support & guaranteed SLA",
    desc: "A dedicated automation engineer on call. Response guaranteed within 4 hours. We succeed when you succeed.",
  },
];

const pageCSS = `
@keyframes bizFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.biz-stagger { opacity: 0; }
.biz-ready .biz-stagger { animation: bizFadeUp 0.85s cubic-bezier(.22,1,.36,1) forwards; }
.biz-d1 { animation-delay: 60ms; }
.biz-d2 { animation-delay: 200ms; }
.biz-d3 { animation-delay: 340ms; }
.biz-d4 { animation-delay: 480ms; }
.biz-d5 { animation-delay: 620ms; }

@keyframes bizCardIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.biz-card { opacity: 0; }
.biz-card.visible { animation: bizCardIn 0.7s cubic-bezier(.22,1,.36,1) forwards; }
`;

export default function ForBusinessPage({ theme, openBooking }: ForBusinessPageProps) {
  const dk = theme === "dark";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
    window.scrollTo({ top: 0 });
  }, []);

  // Animate benefit cards on scroll
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".biz-card");
    if (!cards.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ?? "0";
            setTimeout(() => el.classList.add("visible"), parseInt(delay, 10));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={ready ? "biz-ready" : ""}>
      <style>{pageCSS}</style>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-28 pb-28 md:pt-36 md:pb-36 px-6 lg:px-10"
        style={{ background: dk ? "#020617" : "#fefefe" }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
            style={{
              background: dk
                ? "radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)"
                : "radial-gradient(ellipse, rgba(191,227,255,0.5) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ── Left: copy ───────────────────────────────────── */}
            <div className="max-w-[520px]">
              <div
                className={`biz-stagger biz-d1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] mb-6 ${
                  dk
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
              >
                For Business
              </div>

              <h1
                className={`biz-stagger biz-d2 text-[clamp(2.2rem,4.5vw,3.6rem)] font-light leading-[1.08] tracking-[-0.03em] ${
                  dk ? "text-white" : "text-black"
                }`}
              >
                One AI layer across your entire business stack
              </h1>

              <p
                className={`biz-stagger biz-d3 mt-6 text-[clamp(1rem,1.7vw,1.1rem)] leading-[1.75] ${
                  dk ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Ora connects to every tool your team already relies on — Excel,
                Google Workspace, email, PDFs — and silently automates the
                repetitive work that drains time and introduces errors.
              </p>

              <div className="biz-stagger biz-d4 mt-9 flex flex-wrap gap-3">
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
                  Book a discovery call
                  <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all duration-150" />
                </button>
              </div>

              {/* Integration tags */}
              <div className="biz-stagger biz-d5 mt-10 flex flex-wrap gap-2">
                {integrations.map((tool) => (
                  <span
                    key={tool}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      dk
                        ? "bg-white/[0.05] text-gray-400 border border-white/[0.08]"
                        : "bg-gray-50 text-gray-500 border border-gray-200/60"
                    }`}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right: orbit animation ────────────────────────── */}
            <div className="flex justify-center items-center">
              <div className="relative flex items-center justify-center">
                {/* Ambient glow */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 420,
                    height: 420,
                    background: dk
                      ? "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(191,220,255,0.55) 0%, transparent 70%)",
                    filter: "blur(32px)",
                  }}
                  aria-hidden
                />
                <div style={{ transform: "scale(1.5)", transformOrigin: "center" }}>
                  <HeroOrbitAnimation dk={dk} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────── */}
      <section
        className="py-24 md:py-32 px-6 lg:px-10"
        style={{ background: dk ? "#020617" : "#ffffff" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl md:text-[2.75rem] font-light leading-[1.15] tracking-[-0.03em] ${
                dk ? "text-white" : "text-black"
              }`}
            >
              Built for teams that move fast
            </h2>
            <p className={`mt-4 text-lg max-w-md mx-auto ${dk ? "text-gray-400" : "text-gray-500"}`}>
              Enterprise-ready from day one. No setup headaches, no migration risk.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className={`biz-card p-8 rounded-[24px] border ${
                    dk
                      ? "bg-white/[0.025] border-white/[0.07]"
                      : "bg-gray-50/80 border-gray-100"
                  }`}
                  data-delay={String(i * 100)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        dk ? "bg-blue-500/10" : "bg-blue-50"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3
                        className={`text-[17px] font-semibold tracking-tight leading-snug ${
                          dk ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {b.title}
                      </h3>
                      <p
                        className={`mt-2 text-[15px] leading-relaxed ${
                          dk ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 lg:px-10"
        style={{ background: dk ? "#020617" : "#ffffff" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div
            className={`rounded-[32px] px-10 py-16 border ${
              dk
                ? "bg-white/[0.03] border-white/[0.07]"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-6" />
            <h2
              className={`text-3xl md:text-4xl font-light tracking-[-0.03em] ${
                dk ? "text-white" : "text-black"
              }`}
            >
              Ready to eliminate manual work?
            </h2>
            <p className={`mt-4 text-lg ${dk ? "text-gray-400" : "text-gray-500"}`}>
              Talk to us. 30 minutes, no commitment. We'll map out what Ora can
              automate in your stack within the first week.
            </p>
            <button
              onClick={openBooking}
              className={[
                "mt-8 group inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold text-white",
                "transition-all duration-150 hover:-translate-y-px",
                "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600",
                "shadow-[0_4px_20px_rgba(37,99,235,0.3)]",
                "hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]",
              ].join(" ")}
            >
              Book a free discovery call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-[3px] transition-transform duration-150" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
