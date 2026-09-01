/**
 * SolutionBanqueAffairesPage — Page Solution : Banque d'Affaires
 *
 * Illustration : "Deal convergence"
 * Deux blocs (entreprises) sur les côtés, des lignes qui convergent vers
 * un point central (le deal), puis une flèche qui repart vers le haut.
 * Concept : Connexion et exécution de deals.
 */

import { useState, useEffect } from "react";
import {
  ArrowRight, GitMerge, FileText, BarChart2,
  Database, Zap, ClipboardCheck, CheckCircle, Star,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/* ── CSS local ───────────────────────────────────────────────────── */
const pageCSS = `
@keyframes baFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ba-stagger { opacity: 0; }
.ba-ready .ba-stagger {
  animation: baFadeUp 0.85s cubic-bezier(.22,1,.36,1) forwards;
}
.ba-d1 { animation-delay:  60ms; }
.ba-d2 { animation-delay: 180ms; }
.ba-d3 { animation-delay: 300ms; }
.ba-d4 { animation-delay: 420ms; }
.ba-d5 { animation-delay: 540ms; }

.ba-illus { opacity: 0; }
.ba-ready .ba-illus {
  animation: baFadeUp 1s cubic-bezier(.22,1,.36,1) 500ms forwards;
}

/* Pulse sur le point deal */
@keyframes baDealPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.08); opacity: 0.80; }
}
.ba-deal-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: baDealPulse 2.6s ease-in-out infinite;
  animation-delay: 1.4s;
}

/* Pulse flèche sortante */
@keyframes baArrowPulse {
  0%, 100% { opacity: 0.85; }
  50%       { opacity: 1; }
}
.ba-arrow-pulse {
  animation: baArrowPulse 2.2s ease-in-out infinite;
  animation-delay: 1.8s;
}

/* Dash animé sur les lignes convergentes */
@keyframes baDashMove {
  from { stroke-dashoffset: 40; }
  to   { stroke-dashoffset: 0; }
}
.ba-dash-anim {
  stroke-dasharray: 6 4;
  animation: baDashMove 1.2s linear infinite;
}
.ba-ready .ba-dash-anim {
  animation: baDashMove 1.2s linear infinite;
}

@keyframes baCardIn {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ba-card { opacity: 0; }
.ba-card.visible {
  animation: baCardIn 0.7s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes baTestiIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ba-testi { opacity: 0; }
.ba-testi.visible {
  animation: baTestiIn 0.65s cubic-bezier(.22,1,.36,1) forwards;
}
`;

/* ════════════════════════════════════════════════════════════════════
   Illustration SVG — Banque d'Affaires
   Concept : "Deal convergence"
   Deux blocs entreprises sur les côtés, lignes convergeant vers un
   point central (deal), puis une flèche forte qui repart vers le haut.
════════════════════════════════════════════════════════════════════ */

/* Coordonnées clés */
const LEFT_BLOCK  = { x: 20,  y: 98,  w: 108, h: 60 };
const RIGHT_BLOCK = { x: 332, y: 98,  w: 108, h: 60 };
const DEAL_CX = 230;
const DEAL_CY = 128;
const DEAL_R  = 22;

/* Points de connexion */
const LEFT_CONN  = { x: LEFT_BLOCK.x + LEFT_BLOCK.w,   y: LEFT_BLOCK.y + LEFT_BLOCK.h / 2 };
const RIGHT_CONN = { x: RIGHT_BLOCK.x,                  y: RIGHT_BLOCK.y + RIGHT_BLOCK.h / 2 };

/* Flèche sortante vers le haut */
const ARROW_TOP_Y = 22;

function BanqueIllustration({ dk, labels }: { dk: boolean; labels: { companyA: string; companyB: string; deal: string; valueCreated: string } }) {
  const blockFill   = dk ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.90)";
  const blockStroke = dk ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
  const blockLine   = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const connStroke  = dk ? "rgba(99,155,246,0.45)" : "rgba(59,130,246,0.30)";
  const labelColor  = dk ? "rgba(255,255,255,0.50)" : "rgba(15,23,42,0.42)";

  /* Arrowhead (up) */
  const arrowAW = 9;
  const arrowAH = 10;

  return (
    <svg
      viewBox="0 0 460 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 480, height: "auto" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="ba-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="ba-v" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="ba-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ba-glow-s" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Halo autour du deal ── */}
      <circle cx={DEAL_CX} cy={DEAL_CY} r="50"
        fill={dk ? "rgba(59,130,246,0.10)" : "rgba(59,130,246,0.07)"}
        style={{ filter: "blur(32px)" }} />

      {/* ── Halo flèche montante ── */}
      <line
        x1={DEAL_CX} y1={DEAL_CY - DEAL_R}
        x2={DEAL_CX} y2={ARROW_TOP_Y + 14}
        stroke="#0d9488" strokeWidth="14" strokeLinecap="round"
        opacity="0.07"
      />

      {/* ── Bloc gauche (Entreprise A) ── */}
      <g>
        <rect
          x={LEFT_BLOCK.x} y={LEFT_BLOCK.y}
          width={LEFT_BLOCK.w} height={LEFT_BLOCK.h} rx="8"
          fill={blockFill} stroke={blockStroke} strokeWidth="1"
          style={{ filter: `drop-shadow(0 4px 12px ${dk ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.06)"})` }}
        />
        {/* Lignes internes */}
        {[12, 22, 32, 42].map((dy, i) => (
          <line key={i}
            x1={LEFT_BLOCK.x + 10} y1={LEFT_BLOCK.y + dy}
            x2={LEFT_BLOCK.x + LEFT_BLOCK.w - (i % 2 === 0 ? 16 : 24)} y2={LEFT_BLOCK.y + dy}
            stroke={blockLine} strokeWidth="0.85"
          />
        ))}
        {/* Accent coloré haut gauche */}
        <rect x={LEFT_BLOCK.x + 8} y={LEFT_BLOCK.y + 8} width="16" height="4" rx="2"
          fill="#3b82f6" opacity="0.30"
        />
        {/* Label */}
        <text x={LEFT_BLOCK.x + LEFT_BLOCK.w / 2} y={LEFT_BLOCK.y + LEFT_BLOCK.h + 14}
          textAnchor="middle" fontSize="8.5" fontWeight="600"
          fill={labelColor} fontFamily="Inter, sans-serif"
        >{labels.companyA}</text>
      </g>

      {/* ── Bloc droit (Entreprise B) ── */}
      <g>
        <rect
          x={RIGHT_BLOCK.x} y={RIGHT_BLOCK.y}
          width={RIGHT_BLOCK.w} height={RIGHT_BLOCK.h} rx="8"
          fill={blockFill} stroke={blockStroke} strokeWidth="1"
          style={{ filter: `drop-shadow(0 4px 12px ${dk ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.06)"})` }}
        />
        {[12, 22, 32, 42].map((dy, i) => (
          <line key={i}
            x1={RIGHT_BLOCK.x + 10} y1={RIGHT_BLOCK.y + dy}
            x2={RIGHT_BLOCK.x + RIGHT_BLOCK.w - (i % 2 === 0 ? 16 : 24)} y2={RIGHT_BLOCK.y + dy}
            stroke={blockLine} strokeWidth="0.85"
          />
        ))}
        <rect x={RIGHT_BLOCK.x + RIGHT_BLOCK.w - 24} y={RIGHT_BLOCK.y + 8} width="16" height="4" rx="2"
          fill="#0d9488" opacity="0.30"
        />
        <text x={RIGHT_BLOCK.x + RIGHT_BLOCK.w / 2} y={RIGHT_BLOCK.y + RIGHT_BLOCK.h + 14}
          textAnchor="middle" fontSize="8.5" fontWeight="600"
          fill={labelColor} fontFamily="Inter, sans-serif"
        >{labels.companyB}</text>
      </g>

      {/* ── Ligne convergente gauche ── */}
      <line
        className="ba-dash-anim"
        x1={LEFT_CONN.x} y1={LEFT_CONN.y}
        x2={DEAL_CX - DEAL_R} y2={DEAL_CY}
        stroke={connStroke} strokeWidth="1.4"
      />

      {/* ── Ligne convergente droite ── */}
      <line
        className="ba-dash-anim"
        x1={RIGHT_CONN.x} y1={RIGHT_CONN.y}
        x2={DEAL_CX + DEAL_R} y2={DEAL_CY}
        stroke={connStroke} strokeWidth="1.4"
        style={{ animationDirection: "reverse" }}
      />

      {/* ── Point deal (centre) ── */}
      <g className="ba-deal-pulse">
        {/* Halo externe */}
        <circle cx={DEAL_CX} cy={DEAL_CY} r={DEAL_R + 8}
          fill={dk ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)"}
          style={{ filter: "blur(6px)" }}
        />
        {/* Cercle principal */}
        <circle cx={DEAL_CX} cy={DEAL_CY} r={DEAL_R}
          fill={dk ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.95)"}
          stroke="url(#ba-h)" strokeWidth="1.8"
          filter="url(#ba-glow)"
        />
        {/* Logo Ora */}
        <image
          href="/logos/icon-color.png"
          x={DEAL_CX - 12} y={DEAL_CY - 12}
          width="24" height="24"
        />
      </g>

      {/* ── Label "Deal" ── */}
      <text x={DEAL_CX} y={DEAL_CY + DEAL_R + 14}
        textAnchor="middle" fontSize="8" fontWeight="700"
        fill={dk ? "rgba(147,197,253,0.75)" : "rgba(37,99,235,0.70)"}
        fontFamily="Inter, sans-serif"
      >{labels.deal}</text>

      {/* ── Flèche montante (gradient vert→bleu) ── */}
      <g className="ba-arrow-pulse">
        {/* Halo */}
        <line
          x1={DEAL_CX} y1={DEAL_CY - DEAL_R - 2}
          x2={DEAL_CX} y2={ARROW_TOP_Y + arrowAH}
          stroke="#0d9488" strokeWidth="10" strokeLinecap="round"
          opacity="0.08"
        />
        {/* Tige */}
        <line
          x1={DEAL_CX} y1={DEAL_CY - DEAL_R - 2}
          x2={DEAL_CX} y2={ARROW_TOP_Y + arrowAH}
          stroke="url(#ba-v)" strokeWidth="3.5" strokeLinecap="round"
        />
        {/* Arrowhead */}
        <polygon
          points={`${DEAL_CX},${ARROW_TOP_Y} ${DEAL_CX - arrowAW},${ARROW_TOP_Y + arrowAH} ${DEAL_CX + arrowAW},${ARROW_TOP_Y + arrowAH}`}
          fill="#0d9488"
          filter="url(#ba-glow)"
        />
        {/* Label valeur créée */}
        <text x={DEAL_CX + 16} y={DEAL_CY - DEAL_R - 24}
          fontSize="9" fontWeight="700"
          fill={dk ? "#5eead4" : "#0d9488"}
          fontFamily="Inter, sans-serif"
        >{labels.valueCreated}</text>
      </g>

      {/* ── Points décoratifs ── */}
      {([[14, 14], [446, 14], [14, 216], [446, 216]] as [number, number][]).map(([x, y], i) => (
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
export default function SolutionBanqueAffairesPage({ theme, openBooking }: Props) {
  const { t } = useLang();
  const dk = theme === "dark";
  const [ready, setReady] = useState(false);

  /* ── Page identity ───────────────────────────────────────────────── */
  const METIER_BADGE  = t({ fr: "Ora pour la Banque d'Affaires", en: "Ora for Investment Banking" });
  const METIER_NAME   = t({ fr: "la Banque d'Affaires", en: "investment banking" });
  const HERO_TITLE_L1 = t({ fr: "Chaque deal,", en: "Every deal," });
  const HERO_TITLE_L2 = t({ fr: "exécuté sans friction.", en: "executed without friction." });

  /* ── Solutions métier ────────────────────────────────────────────── */
  const solutions = [
    {
      icon: BarChart2,
      title: t({ fr: "Modélisation financière automatisée", en: "Automated financial modeling" }),
      desc: t({ fr: "Vos modèles DCF, LBO et comparables boursiers sont alimentés automatiquement depuis vos sources de données. Fin des copier-coller et des formules cassées à la veille du closing.", en: "Your DCF, LBO and trading comparables models are populated automatically from your data sources. No more copy-paste or broken formulas on the eve of closing." }),
    },
    {
      icon: Database,
      title: t({ fr: "Consolidation de données M&A", en: "M&A data consolidation" }),
      desc: t({ fr: "Agrégez les données financières de la cible, des comparables et de vos hypothèses en un seul fichier structuré. Ora gère les formats hétérogènes et les mises à jour itératives.", en: "Aggregate financial data from the target, comparables and your assumptions in a single structured file. Ora handles heterogeneous formats and iterative updates." }),
    },
    {
      icon: GitMerge,
      title: t({ fr: "Suivi de pipeline de deals", en: "Deal pipeline tracking" }),
      desc: t({ fr: "Suivez l'avancement de chaque transaction — NDA, LOI, due diligence, SPA — avec un tableau de bord actualisé automatiquement depuis vos données sources.", en: "Track the progress of every transaction, NDA, LOI, due diligence, SPA, with a dashboard updated automatically from your source data." }),
    },
    {
      icon: FileText,
      title: t({ fr: "Mémos et teasers enrichis", en: "Enhanced memos and teasers" }),
      desc: t({ fr: "Préparez vos CIM et mémos d'information en extrayant automatiquement les indicateurs clés depuis vos analyses. Ora formate et structure, votre équipe rédige le récit.", en: "Prepare your CIMs and information memos by automatically extracting key indicators from your analyses. Ora formats and structures, your team writes the story." }),
    },
    {
      icon: Zap,
      title: t({ fr: "Analyses de sensibilité rapides", en: "Fast sensitivity analyses" }),
      desc: t({ fr: "Générez des tableaux de sensibilité et des scénarios en quelques secondes. Ora applique vos hypothèses, recalcule les valorisations et présente les résultats proprement.", en: "Generate sensitivity tables and scenarios in seconds. Ora applies your assumptions, recalculates valuations and presents results cleanly." }),
    },
    {
      icon: ClipboardCheck,
      title: t({ fr: "Suivi de due diligence", en: "Due diligence tracking" }),
      desc: t({ fr: "Organisez et consolidez les données reçues pendant la DD directement dans Excel. Ora identifie les manques, croise les sources et produit la synthèse pour votre comité.", en: "Organize and consolidate data received during DD directly in Excel. Ora identifies gaps, cross-references sources and produces the summary for your committee." }),
    },
  ];

  /* ── Testimonials ────────────────────────────────────────────────── */
  const testimonials = [
    {
      quote: t({ fr: "Sur un deal M&A sous time pressure, la mise à jour du modèle financier prenait une demi-journée à chaque nouvelle donnée. Avec Ora, c'est immédiat. On peut aller plus vite que les vendeurs.", en: "On an M&A deal under time pressure, updating the financial model took half a day with every new data point. With Ora, it is immediate. We can move faster than the sellers." }),
      name: "Alexandre Petit",
      role: t({ fr: "Managing Director", en: "Managing Director" }),
      company: "Atlas Advisory",
      stars: 5,
    },
    {
      quote: t({ fr: "La consolidation des données de due diligence était un travail d'équipe chaotique. Ora structure tout automatiquement. Notre analyse est plus propre et plus rapide.", en: "Consolidating due diligence data was chaotic teamwork. Ora structures everything automatically. Our analysis is cleaner and faster." }),
      name: "Émilie Renard",
      role: t({ fr: "Vice-President M&A", en: "Vice-President M&A" }),
      company: "Renard & Co.",
      stars: 5,
    },
    {
      quote: t({ fr: "On a réduit de 60% le temps passé sur la mise en forme des mémos. Ora fait le travail de consolidation et de formatage, notre équipe rédige le contenu à valeur ajoutée.", en: "We cut the time spent formatting memos by 60%. Ora does the consolidation and formatting work, our team writes the high-value content." }),
      name: "Nicolas Blanc",
      role: t({ fr: "Analyste Senior", en: "Senior Analyst" }),
      company: "Conseil & Croissance",
      stars: 5,
    },
  ];

  /* ── Stat pills hero ─────────────────────────────────────────────── */
  const heroStats = [
    { value: "60%",      label: t({ fr: "de temps gagné sur les modèles", en: "time saved on models" }) },
    { value: "0",        label: t({ fr: "formule cassée", en: "broken formulas" }) },
    { value: t({ fr: "< 1 sem", en: "< 1 wk" }),  label: t({ fr: "pour démarrer", en: "to get started" }) },
  ];

  /* ── Points exécution ────────────────────────────────────────────── */
  const executionPoints = [
    {
      title: t({ fr: "Modèles toujours à jour", en: "Always up-to-date models" }),
      desc: t({ fr: "Ora alimente vos modèles financiers automatiquement à chaque mise à jour des données sources. Votre équipe travaille sur des chiffres justes, pas sur des exports obsolètes.", en: "Ora feeds your financial models automatically whenever source data is updated. Your team works with accurate numbers, not stale exports." }),
    },
    {
      title: t({ fr: "Zéro erreur de formule", en: "Zero formula errors" }),
      desc: t({ fr: "Les erreurs de référence et les formules cassées disparaissent. Ora applique vos règles de calcul de manière systématique, sans risque d'erreur humaine sous pression.", en: "Reference errors and broken formulas disappear. Ora applies your calculation rules systematically, with no risk of human error under pressure." }),
    },
    {
      title: t({ fr: "Historique des versions", en: "Version history" }),
      desc: t({ fr: "Chaque itération de vos modèles et analyses est tracée automatiquement. Retrouvez n'importe quelle version antérieure avec ses hypothèses, sans chercher dans vos emails.", en: "Every iteration of your models and analyses is tracked automatically. Retrieve any previous version with its assumptions, without searching through emails." }),
    },
    {
      title: t({ fr: "Scénarios et sensibilités en temps réel", en: "Real-time scenarios and sensitivities" }),
      desc: t({ fr: "Changez une hypothèse, Ora recalcule l'ensemble de vos scénarios instantanément. Votre équipe présente des analyses à jour lors de chaque réunion client.", en: "Change one assumption, Ora recalculates all your scenarios instantly. Your team presents up-to-date analyses at every client meeting." }),
    },
  ];

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".ba-card, .ba-testi");
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
    <div className={ready ? "ba-ready" : ""}>
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
                  "ba-stagger ba-d1",
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
                  "ba-stagger ba-d2",
                  "font-poppins text-[clamp(1.75rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.03em]",
                  textPrimary,
                ].join(" ")}
              >
                <span className="block">{HERO_TITLE_L1}</span>
                <span className="block text-brand-gradient">{HERO_TITLE_L2}</span>
              </h1>

              <p
                className={[
                  "ba-stagger ba-d3",
                  "font-inter mt-5 md:mt-6 text-[clamp(0.95rem,1.6vw,1.05rem)] leading-[1.7] md:leading-[1.8]",
                  textSecondary,
                ].join(" ")}
              >
                {t({
                  fr: "Ora automatise la modélisation financière, la consolidation des données de due diligence et le suivi de pipeline directement depuis Excel. Vos banquiers se concentrent sur les deals, pas sur les données.",
                  en: "Ora automates financial modeling, due diligence data consolidation and pipeline tracking directly from Excel. Your bankers focus on deals, not on data.",
                })}
              </p>

              <div className="ba-stagger ba-d4 mt-9">
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

              <div className="ba-stagger ba-d5 mt-10 flex flex-wrap gap-3">
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

            <div className="ba-illus flex justify-center items-center">
              <BanqueIllustration dk={dk} labels={{
                companyA: t({ fr: "Entreprise A", en: "Company A" }),
                companyB: t({ fr: "Entreprise B", en: "Company B" }),
                deal: t({ fr: "DEAL", en: "DEAL" }),
                valueCreated: t({ fr: "Valeur créée", en: "Value created" }),
              }} />
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
              {t({
                fr: `Des automatisations concrètes, adaptées aux enjeux de ${METIER_NAME}. Opérationnelles en moins d'une semaine.`,
                en: `Concrete automations, tailored to the challenges of ${METIER_NAME}. Operational in less than a week.`,
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {solutions.map((sol, i) => {
              const Icon = sol.icon;
              return (
                <div
                  key={i}
                  className={["ba-card p-4 rounded-[16px] md:p-7 md:rounded-[20px] border transition-colors duration-200", borderMuted, cardBg, dk ? "hover:bg-white/[0.05]" : "hover:bg-gray-50/70"].join(" ")}
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
              {t({
                fr: "Ora se branche directement sur vos fichiers Excel existants. Aucune migration, aucune refonte de processus.",
                en: "Ora plugs directly into your existing Excel files. No migration, no process overhaul.",
              })}
            </p>
            {/* "L'expérience Ora" link hidden until that page goes live. */}
          </div>
        </div>
      </section>

      {/* ══ 3. RAPIDITE & PRECISION ══ */}
      <section className="py-16 md:py-32 px-5 lg:px-10" style={{ background: bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-9 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-start mb-10 md:mb-16">
            <div>
              <div className={["inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5", "text-[11px] font-inter font-semibold uppercase tracking-[0.16em]", dk ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-teal-50 text-teal-700 border border-teal-100"].join(" ")}>
                {t({ fr: "Rapidité et précision d'exécution", en: "Execution speed and precision" })}
              </div>
              <h2 className={["font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]", textPrimary].join(" ")}>
                {t({ fr: "Des modèles fiables.", en: "Reliable models." })}
                <br />
                <span className="text-brand-gradient">{t({ fr: "À la vitesse du deal.", en: "At deal speed." })}</span>
              </h2>
            </div>
            <div className="lg:pt-4">
              <p className={["font-inter text-[1.05rem] leading-[1.85]", textSecondary].join(" ")}>
                {t({
                  fr: "En banque d'affaires, une erreur dans un modèle financier peut coûter une transaction. Ora élimine les risques liés à la manipulation manuelle de données sous pression temporelle. Vos équipes travaillent plus vite, avec des chiffres sur lesquels elles peuvent compter.",
                  en: "In investment banking, a single error in a financial model can cost a transaction. Ora removes the risks tied to manual data handling under time pressure. Your teams work faster, with numbers they can trust.",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {executionPoints.map((pt, i) => (
              <div
                key={i}
                className={["ba-card flex flex-col gap-2 xs:flex-row xs:gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border", borderMuted, dk ? "bg-white/[0.025]" : "bg-white"].join(" ")}
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
                {t({ fr: "Les équipes d'advisory utilisant Ora réduisent de", en: "Advisory teams using Ora cut" })}{" "}
                <span className={["font-semibold", dk ? "text-white" : "text-gray-900"].join(" ")}>{t({ fr: "60% le temps", en: "60% of the time" })}</span>{" "}
                {t({
                  fr: "consacré à la mise à jour des modèles et à la consolidation des données de due diligence.",
                  en: "spent updating models and consolidating due diligence data.",
                })}
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
              {t({ fr: "Des banquiers qui closent", en: "Bankers closing" })}
              <br />
              {t({ fr: "plus vite avec Ora.", en: "faster with Ora." })}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={["ba-testi flex flex-col gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border", borderMuted, cardBg].join(" ")}
                data-delay={String(i * 100)}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className={["font-inter text-[14.5px] leading-[1.5] md:text-[15px] md:leading-relaxed flex-1", textSecondary].join(" ")}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-2 border-t border-inherit">
                  <div className={["w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-inter text-[13px] font-semibold", dk ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600"].join(" ")}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={["font-inter text-[13px] font-semibold", textPrimary].join(" ")}>{t.name}</p>
                    <p className={["font-inter text-[12px]", textSecondary].join(" ")}>{t.role} · {t.company}</p>
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
            <GitMerge className="w-10 h-10 text-blue-500 mx-auto mb-6" />
            <h2 className={["font-poppins text-[clamp(1.45rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]", textPrimary].join(" ")}>
              {t({ fr: "Prêt à accélérer vos deals ?", en: "Ready to accelerate your deals?" })}
            </h2>
            <p className={["font-inter mt-4 text-[1.05rem] leading-relaxed", textSecondary].join(" ")}>
              {t({
                fr: "30 minutes, sans engagement. On vous montre ce qu'Ora peut automatiser dans vos processus M&A dès la première semaine.",
                en: "30 minutes, no strings attached. We show you what Ora can automate in your M&A processes from the very first week.",
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
                t({ fr: "Démarrage en moins d'une semaine", en: "Launch in under a week" }),
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
