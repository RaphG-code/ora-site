/**
 * SolutionFondsInvestissementPage — Page Solution : Fonds d'investissement
 *
 * Illustration : "Trajectoires de croissance"
 * Un bloc capital unique en bas, dont partent plusieurs courbes ascendantes
 * à angles différents — chaque trajectoire = un investissement.
 * Concept : Allocation et croissance du capital.
 */

import { useState, useEffect } from "react";
import {
  ArrowRight, BarChart2, FileText, TrendingUp,
  Layers, Search, RefreshCcw, CheckCircle, Star,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/* ── CSS local ───────────────────────────────────────────────────── */
const pageCSS = `
@keyframes fiFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fi-stagger { opacity: 0; }
.fi-ready .fi-stagger {
  animation: fiFadeUp 0.85s cubic-bezier(.22,1,.36,1) forwards;
}
.fi-d1 { animation-delay:  60ms; }
.fi-d2 { animation-delay: 180ms; }
.fi-d3 { animation-delay: 300ms; }
.fi-d4 { animation-delay: 420ms; }
.fi-d5 { animation-delay: 540ms; }

.fi-illus { opacity: 0; }
.fi-ready .fi-illus {
  animation: fiFadeUp 1s cubic-bezier(.22,1,.36,1) 500ms forwards;
}

/* Pulse sur le bloc capital */
@keyframes fiCapitalPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.70; }
}
.fi-capital-pulse {
  animation: fiCapitalPulse 2.8s ease-in-out infinite;
  animation-delay: 1.6s;
}

/* Lueur progressive sur les flèches */
@keyframes fiArrowGlow {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}
.fi-arrow-glow {
  animation: fiArrowGlow 3s ease-in-out infinite;
}
.fi-arrow-glow-2 { animation-delay: 0.4s; }
.fi-arrow-glow-3 { animation-delay: 0.8s; }
.fi-arrow-glow-4 { animation-delay: 1.2s; }
.fi-arrow-glow-5 { animation-delay: 1.6s; }

@keyframes fiCardIn {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fi-card { opacity: 0; }
.fi-card.visible {
  animation: fiCardIn 0.7s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes fiTestiIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fi-testi { opacity: 0; }
.fi-testi.visible {
  animation: fiTestiIn 0.65s cubic-bezier(.22,1,.36,1) forwards;
}
`;

/* ════════════════════════════════════════════════════════════════════
   Illustration SVG — Fonds d'investissement
   Concept : "Trajectoires de croissance"
   Un bloc capital en bas, 5 courbes ascendantes divergentes — chaque
   courbe représente un investissement avec sa propre trajectoire.
════════════════════════════════════════════════════════════════════ */

/* Trajectoires : [endX, endY, controlX, controlY, label, colorStop] */
const TRAJECTORIES: [number, number, number, number, string, number][] = [
  [55,  52, 80,  170, "+18%", 0.0],
  [130, 28, 145, 150, "+31%", 0.2],
  [230, 16, 230, 140, "+47%", 0.5],
  [330, 28, 315, 150, "+29%", 0.8],
  [405, 52, 380, 170, "+22%", 1.0],
];

/* Point de départ commun (haut du bloc capital) */
const ORIGIN_X = 230;
const ORIGIN_Y = 218;

function FondsIllustration({ dk, labelCapital, labelPortfolio }: { dk: boolean; labelCapital: string; labelPortfolio: string }) {
  const blockFill   = dk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.92)";
  const blockStroke = dk ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)";
  const labelColor  = dk ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.45)";

  /* Interpolation couleur bleu→teal */
  const lerpColor = (t: number) => {
    const r = Math.round(59 + (13 - 59) * t);
    const g = Math.round(130 + (148 - 130) * t);
    const b = Math.round(246 + (136 - 246) * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <svg
      viewBox="0 0 460 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 480, height: "auto" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="fi-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="fi-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Halo central autour de l'origine ── */}
      <ellipse cx={ORIGIN_X} cy={ORIGIN_Y - 10} rx="90" ry="60"
        fill={dk ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)"}
        style={{ filter: "blur(38px)" }} />

      {/* ── Trajectoires de croissance ── */}
      {TRAJECTORIES.map(([ex, ey, cx, cy, label, t], i) => {
        const color = lerpColor(t);
        const animClass = i === 0 ? "fi-arrow-glow" : `fi-arrow-glow fi-arrow-glow-${i + 1}`;

        /* Vecteur direction à la pointe pour l'arrowhead */
        const dx = ex - cx;
        const dy = ey - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const perpX = -uy;
        const perpY = ux;
        const arrowSize = 7;

        return (
          <g key={i} className={animClass}>
            {/* Halo doux sous la courbe */}
            <path
              d={`M${ORIGIN_X},${ORIGIN_Y} Q${cx},${cy} ${ex},${ey}`}
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              opacity="0.07"
            />
            {/* Courbe principale */}
            <path
              d={`M${ORIGIN_X},${ORIGIN_Y} Q${cx},${cy} ${ex},${ey}`}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            {/* Arrowhead */}
            <polygon
              points={`
                ${ex},${ey}
                ${ex - ux * arrowSize + perpX * (arrowSize * 0.45)},${ey - uy * arrowSize + perpY * (arrowSize * 0.45)}
                ${ex - ux * arrowSize - perpX * (arrowSize * 0.45)},${ey - uy * arrowSize - perpY * (arrowSize * 0.45)}
              `}
              fill={color}
              opacity="0.9"
            />
            {/* Dot à la pointe */}
            <circle cx={ex} cy={ey} r="4.5" fill={color} opacity="0.85" />
            {/* Label rendement */}
            <text
              x={ex + (i < 2 ? -22 : i > 2 ? 22 : 0)}
              y={ey - 14}
              textAnchor={i < 2 ? "end" : i > 2 ? "start" : "middle"}
              fontSize="9"
              fontWeight="700"
              fill={color}
              fontFamily="Inter, sans-serif"
              opacity="0.85"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Bloc capital (bas, centre) ── */}
      <g className="fi-capital-pulse">
        {/* Halo derrière */}
        <rect
          x={ORIGIN_X - 68} y={ORIGIN_Y + 5}
          width="136" height="46" rx="10"
          fill={dk ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)"}
          style={{ filter: "blur(10px)" }}
        />
        {/* Bloc */}
        <rect
          x={ORIGIN_X - 62} y={ORIGIN_Y + 8}
          width="124" height="40" rx="8"
          fill={blockFill}
          stroke={blockStroke}
          strokeWidth="1.2"
          style={{ filter: `drop-shadow(0 4px 14px ${dk ? "rgba(0,0,0,0.35)" : "rgba(59,130,246,0.12)"})` }}
        />
        {/* Icône monnaie */}
        <circle cx={ORIGIN_X - 36} cy={ORIGIN_Y + 28} r="9"
          fill={dk ? "rgba(59,130,246,0.20)" : "rgba(59,130,246,0.10)"}
        />
        <text
          x={ORIGIN_X - 36} y={ORIGIN_Y + 29}
          textAnchor="middle" dominantBaseline="central"
          fontSize="10" fontWeight="700"
          fill="#3b82f6"
          fontFamily="Inter, sans-serif"
        >€</text>
        {/* Label */}
        <text
          x={ORIGIN_X - 14} y={ORIGIN_Y + 24}
          dominantBaseline="central"
          fontSize="9" fontWeight="600"
          fill={dk ? "rgba(255,255,255,0.70)" : "rgba(15,23,42,0.65)"}
          fontFamily="Inter, sans-serif"
        >{labelCapital}</text>
        <text
          x={ORIGIN_X - 14} y={ORIGIN_Y + 37}
          dominantBaseline="central"
          fontSize="8" fontWeight="400"
          fill={labelColor}
          fontFamily="Inter, sans-serif"
        >{labelPortfolio}</text>
      </g>

      {/* ── Points décoratifs ── */}
      {([[14, 14], [446, 14], [14, 266], [446, 266]] as [number, number][]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5"
          fill="#3b82f6" opacity={0.10 + i * 0.03} />
      ))}
    </svg>
  );
}

/* ── Props ───────────────────────────────────────────────────────── */
interface Props {
  theme: "light" | "dark";
  openBooking: () => void;
  onNavigate: (page: "home" | "for-business" | "ora-experience" | "solution-template" | "solution-expertise-comptable" | "solution-audit" | "solution-fonds-investissement" | "solution-banque-affaires" | "not-found") => void;
}

/* ════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════════ */
export default function SolutionFondsInvestissementPage({ theme, openBooking }: Props) {
  const { t } = useLang();
  const dk = theme === "dark";
  const [ready, setReady] = useState(false);

  /* ── Page identity ───────────────────────────────────────────────── */
  const METIER_BADGE  = t({ fr: "Ora pour les Fonds d'Investissement", en: "Ora for Investment Funds" });
  const METIER_NAME   = t({ fr: "les Fonds d'Investissement", en: "investment funds" });
  const HERO_TITLE_L1 = t({ fr: "Votre portefeuille,", en: "Your portfolio," });
  const HERO_TITLE_L2 = t({ fr: "piloté avec précision.", en: "managed with precision." });

  /* ── Solutions métier ────────────────────────────────────────────── */
  const solutions = [
    {
      icon: BarChart2,
      title: t({ fr: "Suivi de portefeuille automatisé", en: "Automated portfolio monitoring" }),
      desc: t({ fr: "Consolidez automatiquement vos positions, valorisations et mouvements depuis vos fichiers Excel. Vision temps réel sur l'ensemble de votre portefeuille, sans ressaisie.", en: "Automatically consolidate your positions, valuations and movements from your Excel files. Real-time view across your entire portfolio, with no re-entry." }),
    },
    {
      icon: TrendingUp,
      title: t({ fr: "Calcul de performance (TRI, multiples)", en: "Performance calculation (IRR, multiples)" }),
      desc: t({ fr: "Ora calcule vos indicateurs clés — TRI, MOIC, DPI, RVPI — à chaque mise à jour de données. Vos comités d'investissement disposent toujours des chiffres justes.", en: "Ora computes your key metrics: IRR, MOIC, DPI, RVPI, at every data update. Your investment committees always have accurate numbers." }),
    },
    {
      icon: FileText,
      title: t({ fr: "Reporting investisseurs (LP)", en: "Investor reporting (LP)" }),
      desc: t({ fr: "Générez vos rapports trimestriels aux limited partners automatiquement. Format uniforme, données consolidées, envoi dans les délais. Votre image de gestionnaire professionnel.", en: "Generate your quarterly reports to limited partners automatically. Consistent format, consolidated data, on-time delivery. The image of a professional asset manager." }),
    },
    {
      icon: Layers,
      title: t({ fr: "Consolidation multi-fonds", en: "Multi-fund consolidation" }),
      desc: t({ fr: "Agrégez les données de plusieurs fonds, millésimes ou stratégies en un seul tableau de bord. Ora gère les devises, les seuils et les règles de consolidation.", en: "Aggregate data from multiple funds, vintages or strategies into a single dashboard. Ora handles currencies, thresholds and consolidation rules." }),
    },
    {
      icon: Search,
      title: t({ fr: "Analyse due diligence", en: "Due diligence analysis" }),
      desc: t({ fr: "Structurez et analysez les données financières de vos cibles directement depuis Excel. Ora extrait, normalise et met en forme les indicateurs clés pour vos mémos.", en: "Structure and analyze the financial data of your targets directly from Excel. Ora extracts, normalizes and formats the key metrics for your memos." }),
    },
    {
      icon: RefreshCcw,
      title: t({ fr: "Valorisation et NAV", en: "Valuation and NAV" }),
      desc: t({ fr: "Automatisez le calcul de votre valeur nette d'actif à chaque période. Ora applique vos méthodes de valorisation et génère les tableaux réconciliés pour votre auditeur.", en: "Automate your net asset value calculation every period. Ora applies your valuation methods and produces reconciled tables for your auditor." }),
    },
  ];

  /* ── Testimonials ────────────────────────────────────────────────── */
  const testimonials = [
    {
      quote: t({ fr: "Nos reportings LP prenaient trois jours à chaque trimestre. Avec Ora, on les produit en une demi-journée. Les investisseurs reçoivent leurs données à temps, sans erreur.", en: "Our LP reports used to take three days every quarter. With Ora, we produce them in half a day. Investors receive their data on time, without errors." }),
      name: "Marc Durand",
      role: "Managing Partner",
      company: "Durand Capital",
      stars: 5,
    },
    {
      quote: t({ fr: "Le calcul du TRI sur l'ensemble du portefeuille était un casse-tête à chaque comité. Ora le fait en temps réel, avec l'historique complet de chaque ligne.", en: "Calculating IRR across the whole portfolio was a headache at every committee. Ora does it in real time, with the full history of each position." }),
      name: "Claire Fontaine",
      role: "Investment Director",
      company: "Fonds Horizon",
      stars: 5,
    },
    {
      quote: t({ fr: "On gère quatre fonds simultanément. La consolidation était un travail de plusieurs personnes. Aujourd'hui, Ora le fait seul. Notre équipe se concentre sur les deals.", en: "We run four funds at the same time. Consolidation used to require several people. Today, Ora does it alone. Our team focuses on deals." }),
      name: "Julien Mercier",
      role: "CFO",
      company: "Meridian PE",
      stars: 5,
    },
  ];

  /* ── Stat pills hero ─────────────────────────────────────────────── */
  const heroStats = [
    { value: t({ fr: "TRI", en: "IRR" }),            label: t({ fr: "calculé en temps réel", en: "calculated in real time" }) },
    { value: "0",                                     label: t({ fr: "erreur de consolidation", en: "consolidation errors" }) },
    { value: t({ fr: "< 1 sem", en: "< 1 week" }),   label: t({ fr: "pour démarrer", en: "to get started" }) },
  ];

  /* ── Points performance ──────────────────────────────────────────── */
  const performancePoints = [
    {
      title: t({ fr: "Indicateurs toujours à jour", en: "Metrics always up to date" }),
      desc: t({ fr: "TRI, MOIC, DPI, TVPI : Ora recalcule automatiquement vos indicateurs à chaque mise à jour de données, sans intervention manuelle.", en: "IRR, MOIC, DPI, TVPI: Ora automatically recalculates your metrics at every data update, with no manual input." }),
    },
    {
      title: t({ fr: "Reporting LP standardisé", en: "Standardized LP reporting" }),
      desc: t({ fr: "Vos rapports investisseurs suivent un format cohérent à chaque période. Ora applique votre modèle et insère les données actualisées.", en: "Your investor reports follow a consistent format every period. Ora applies your template and inserts the updated data." }),
    },
    {
      title: t({ fr: "Traçabilité des valorisations", en: "Valuation traceability" }),
      desc: t({ fr: "Chaque valorisation est documentée avec sa méthode, ses hypothèses et sa date. Votre auditeur dispose d'un historique complet et structuré.", en: "Every valuation is documented with its method, assumptions and date. Your auditor has a complete, structured history." }),
    },
    {
      title: t({ fr: "Consolidation multi-devises", en: "Multi-currency consolidation" }),
      desc: t({ fr: "Ora gère les conversions de devises et les règles de consolidation entre fonds et millésimes, sans formules complexes à maintenir.", en: "Ora handles currency conversions and consolidation rules between funds and vintages, with no complex formulas to maintain." }),
    },
  ];

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".fi-card, .fi-testi");
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
      { threshold: 0.1 },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  const bg             = dk ? "#000000" : "#ffffff";
  const bgContrast     = dk ? "#000000" : "#ffffff";
  const textPrimary    = dk ? "text-white"    : "text-gray-900";
  const textSecondary  = dk ? "text-gray-400" : "text-gray-500";
  const borderMuted    = dk ? "border-white/[0.07]" : "border-gray-200/70";
  const cardBg         = dk ? "bg-white/[0.03]" : "bg-white";

  return (
    <div className={ready ? "fi-ready" : ""}>
      <style>{pageCSS}</style>

      {/* ══ 1. HERO ══ */}
      <section
        className="relative overflow-hidden pt-24 pb-14 md:pt-36 md:pb-32 px-5 lg:px-10"
        style={{ background: bg }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
            style={{
              background: dk
                ? "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 65%)"
                : "radial-gradient(ellipse, rgba(191,220,255,0.48) 0%, transparent 65%)",
              filter: "blur(72px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid gap-9 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-center">
            <div className="max-w-[540px]">
              <div
                className={[
                  "fi-stagger fi-d1",
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                  "text-[11px] font-inter font-semibold uppercase tracking-[0.16em] mb-7",
                  dk
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-blue-50 text-blue-600 border border-blue-100",
                ].join(" ")}
              >
                {METIER_BADGE}
              </div>

              <h1
                className={[
                  "fi-stagger fi-d2",
                  "font-poppins text-[clamp(1.75rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.03em]",
                  textPrimary,
                ].join(" ")}
              >
                <span className="block">{HERO_TITLE_L1}</span>
                <span className="block text-brand-gradient">{HERO_TITLE_L2}</span>
              </h1>

              <p
                className={[
                  "fi-stagger fi-d3",
                  "font-inter mt-5 md:mt-6 text-[clamp(0.95rem,1.6vw,1.05rem)] leading-[1.7] md:leading-[1.8]",
                  textSecondary,
                ].join(" ")}
              >
                {t({
                  fr: "Ora automatise la consolidation, le calcul de performance et le reporting investisseurs directement depuis vos fichiers Excel. Vos équipes se concentrent sur les décisions d'investissement.",
                  en: "Ora automates consolidation, performance calculation and investor reporting directly from your Excel files. Your teams focus on investment decisions.",
                })}
              </p>

              <div className="fi-stagger fi-d4 mt-9">
                <button
                  onClick={openBooking}
                  className={[
                    "group inline-flex items-center gap-2.5 px-7 py-3.5",
                    "rounded-full text-[15px] font-inter font-semibold text-white",
                    "transition-all duration-150 hover:-translate-y-px active:translate-y-0",
                    "bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.10),0_8px_24px_rgba(37,99,235,0.32)]",
                    "hover:shadow-[0_1px_3px_rgba(0,0,0,0.10),0_10px_32px_rgba(37,99,235,0.44)]",
                  ].join(" ")}
                >
                  {t({ fr: "Réserver un appel découverte", en: "Book a discovery call" })}
                  <ArrowRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all duration-150" />
                </button>
              </div>

              <div className="fi-stagger fi-d5 mt-10 flex flex-wrap gap-3">
                {heroStats.map((s) => (
                  <div
                    key={s.label}
                    className={[
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-inter border",
                      dk
                        ? "bg-white/[0.04] border-white/[0.08] text-gray-300"
                        : "bg-white border-gray-200/60 text-gray-600",
                    ].join(" ")}
                  >
                    <span className="font-semibold text-blue-500">{s.value}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fi-illus flex justify-center items-center">
              <FondsIllustration
                dk={dk}
                labelCapital={t({ fr: "Capital alloué", en: "Allocated capital" })}
                labelPortfolio={t({ fr: "Portefeuille diversifié", en: "Diversified portfolio" })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. SOLUTIONS ══ */}
      <section className="py-16 md:py-32 px-5 lg:px-10" style={{ background: bgContrast }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
            <h2 className={["font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]", textPrimary].join(" ")}>
              {t({ fr: "Ce qu'Ora fait pour vous", en: "What Ora does for you" })}
            </h2>
            <p className={["font-inter mt-4 text-[1.05rem] leading-relaxed", textSecondary].join(" ")}>
              {t({ fr: "Des automatisations concrètes, adaptées aux enjeux de ", en: "Concrete automations tailored to the needs of " })}{METIER_NAME}{t({ fr: ". Opérationnelles en moins d'une semaine.", en: ". Up and running in less than a week." })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {solutions.map((sol, i) => {
              const Icon = sol.icon;
              return (
                <div
                  key={i}
                  className={["fi-card p-4 rounded-[16px] md:p-7 md:rounded-[20px] border transition-colors duration-200", borderMuted, cardBg, dk ? "hover:bg-white/[0.05]" : "hover:bg-gray-50/70"].join(" ")}
                  data-delay={String(i * 80)}
                >
                  <div className={["w-9 h-9 rounded-[10px] flex items-center justify-center mb-3 md:w-10 md:h-10 md:rounded-xl md:mb-5", dk ? "bg-blue-500/10" : "bg-blue-50"].join(" ")}>
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className={["font-poppins text-[15px] md:text-[16px] font-semibold tracking-tight leading-snug mb-1.5 md:mb-2", textPrimary].join(" ")}>
                    {sol.title}
                  </h3>
                  <p className={["font-inter text-[14px] leading-[1.5] md:leading-relaxed", textSecondary].join(" ")}>
                    {sol.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className={["mt-12 flex flex-col sm:flex-row sm:items-center gap-5 px-7 py-5 rounded-2xl border", borderMuted, dk ? "bg-white/[0.025]" : "bg-blue-50/40"].join(" ")}>
            <p className={["font-inter text-[14.5px] leading-[1.5] md:text-[15px] md:leading-relaxed flex-1", textSecondary].join(" ")}>
              {t({ fr: "Ora se branche directement sur vos fichiers Excel existants. Aucune migration, aucune refonte de processus.", en: "Ora plugs directly into your existing Excel files. No migration, no process overhaul." })}
            </p>
            {/* "L'expérience Ora" link hidden until that page goes live. */}
          </div>
        </div>
      </section>

      {/* ══ 3. PERFORMANCE & TRANSPARENCE ══ */}
      <section className="py-16 md:py-32 px-5 lg:px-10" style={{ background: bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-9 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-start mb-10 md:mb-16">
            <div>
              <div className={["inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5", "text-[11px] font-inter font-semibold uppercase tracking-[0.16em]", dk ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-teal-50 text-teal-700 border border-teal-100"].join(" ")}>
                {t({ fr: "Performance et transparence", en: "Performance and transparency" })}
              </div>
              <h2 className={["font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]", textPrimary].join(" ")}>
                {t({ fr: "Chiffres fiables.", en: "Reliable numbers." })}
                <br />
                <span className="text-brand-gradient">{t({ fr: "Décisions éclairées.", en: "Informed decisions." })}</span>
              </h2>
            </div>
            <div className="lg:pt-4">
              <p className={["font-inter text-[1.05rem] leading-[1.85]", textSecondary].join(" ")}>
                {t({
                  fr: "Vos investisseurs attendent des reportings précis et des indicateurs de performance vérifiables. Ora garantit la cohérence de vos données d'un cycle à l'autre, automatise les calculs complexes et produit des livrables prêts à partager, sans risque d'erreur manuelle.",
                  en: "Your investors expect accurate reports and verifiable performance metrics. Ora keeps your data consistent from one cycle to the next, automates complex calculations and produces share-ready deliverables, with no risk of manual errors.",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {performancePoints.map((pt, i) => (
              <div
                key={i}
                className={["fi-card flex flex-col gap-2 xs:flex-row xs:gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border", borderMuted, dk ? "bg-white/[0.025]" : "bg-white"].join(" ")}
                data-delay={String(i * 90)}
              >
                <div className={["flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center md:mt-0.5 md:w-10 md:h-10 md:rounded-xl", dk ? "bg-teal-500/10" : "bg-teal-50"].join(" ")}>
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                </div>
                {/* `min-w-0` : enfant de flex, donc `min-width: auto` par
                    défaut — il refusait de descendre sous la largeur de son mot
                    le plus long (« Standardized ») et poussait la page à 324 px
                    dans un écran de 320. Mesuré, pas supposé. */}
                <div className="min-w-0">
                  <h3 className={["font-poppins text-[12.5px] md:text-[15px] font-semibold tracking-tight leading-snug mb-1.5 break-words", textPrimary].join(" ")}>
                    {pt.title}
                  </h3>
                  <p className={["font-inter text-[14px] leading-[1.5] md:leading-relaxed", textSecondary].join(" ")}>
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={["mt-10 px-8 py-8 rounded-[24px] border flex flex-col sm:flex-row sm:items-center gap-6", dk ? "bg-gradient-to-r from-blue-500/10 to-teal-500/10 border-white/[0.08]" : "bg-gradient-to-r from-blue-50 to-teal-50 border-blue-100/60"].join(" ")}>
            <div className="flex-1">
              <p className={["font-inter text-[15px] leading-relaxed", textSecondary].join(" ")}>
                {t({ fr: "Les équipes utilisant Ora réduisent de ", en: "Teams using Ora cut " })}
                <span className={["font-semibold", dk ? "text-white" : "text-gray-900"].join(" ")}>{t({ fr: "70% le temps de préparation", en: "preparation time by 70%" })}</span>{" "}
                {t({ fr: "des reportings LP et des comités d'investissement.", en: "for LP reports and investment committees." })}
              </p>
            </div>
            <button
              onClick={openBooking}
              className={["font-inter text-[14px] font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 hover:gap-2.5 transition-all duration-150", dk ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"].join(" ")}
            >
              {t({ fr: "Voir comment", en: "See how" })} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ══ 4. TESTIMONIALS ══ */}
      <section className="py-16 md:py-32 px-5 lg:px-10" style={{ background: bgContrast }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16 max-w-xl mx-auto">
            <p className={["font-inter text-[11px] font-semibold uppercase tracking-[0.18em] mb-4", dk ? "text-blue-400" : "text-blue-600"].join(" ")}>
              {t({ fr: "Témoignages", en: "Testimonials" })}
            </p>
            <h2 className={["font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]", textPrimary].join(" ")}>
              {t({ fr: "Des gestionnaires qui", en: "Asset managers who" })}
              <br />
              {t({ fr: "font confiance à Ora.", en: "trust Ora." })}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {testimonials.map((testi, i) => (
              <div
                key={i}
                className={["fi-testi flex flex-col gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border", borderMuted, cardBg].join(" ")}
                data-delay={String(i * 100)}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: testi.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className={["font-inter text-[14.5px] leading-[1.5] md:text-[15px] md:leading-relaxed flex-1", textSecondary].join(" ")}>
                  &ldquo;{testi.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-2 border-t border-inherit">
                  <div className={["w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-inter text-[13px] font-semibold", dk ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600"].join(" ")}>
                    {testi.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={["font-inter text-[13px] font-semibold", textPrimary].join(" ")}>{testi.name}</p>
                    <p className={["font-inter text-[12px]", textSecondary].join(" ")}>{testi.role} · {testi.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. CTA ══ */}
      <section className="py-16 md:py-28 px-5 lg:px-10" style={{ background: bg }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className={["rounded-[24px] px-6 py-12 border md:rounded-[32px] md:px-10 md:py-16", borderMuted, dk ? "bg-white/[0.03]" : "bg-gray-50/80"].join(" ")}>
            <TrendingUp className="w-10 h-10 text-blue-500 mx-auto mb-6" />
            <h2 className={["font-poppins text-[clamp(1.45rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]", textPrimary].join(" ")}>
              {t({ fr: "Prêt à automatiser votre gestion ?", en: "Ready to automate your operations?" })}
            </h2>
            <p className={["font-inter mt-4 text-[1.05rem] leading-relaxed", textSecondary].join(" ")}>
              {t({
                fr: "30 minutes, sans engagement. On vous montre ce qu'Ora peut consolider et automatiser dans votre fonds dès la première semaine.",
                en: "30 minutes, no commitment. We show you what Ora can consolidate and automate in your fund from week one.",
              })}
            </p>
            <button
              onClick={openBooking}
              className={[
                "mt-9 group inline-flex items-center gap-2.5 px-8 py-4",
                "rounded-full text-[15px] font-inter font-semibold text-white",
                "transition-all duration-150 hover:-translate-y-px active:translate-y-0",
                "bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600",
                "shadow-[0_4px_20px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.42)]",
              ].join(" ")}
            >
              {t({ fr: "Réserver un appel gratuit", en: "Book a free call" })}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-[3px] transition-transform duration-150" />
            </button>
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {[
                t({ fr: "Sans engagement", en: "No commitment" }),
                t({ fr: "Démarrage en moins d'une semaine", en: "Up and running in under a week" }),
                t({ fr: "Support dédié inclus", en: "Dedicated support included" }),
              ].map((label) => (
                <span key={label} className={["font-inter flex items-center gap-1.5 text-[13px]", textSecondary].join(" ")}>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
