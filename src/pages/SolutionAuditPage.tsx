/**
 * SolutionAuditPage — Page Solution : Audit
 *
 * Basée sur SolutionExpertiseComptablePage.
 * Illustration : "Grille d'anomalie" — une grille parfaite de cellules uniformes
 * avec une seule case mise en évidence, représentant la détection d'une anomalie.
 * Concept : Contrôle, vérification, traçabilité.
 */

import { useState, useEffect } from "react";
import {
  ArrowRight, Shield, CheckCircle, Star,
  Search, Zap, FileSpreadsheet, Palette, Send, Eye,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/* ── CSS local ───────────────────────────────────────────────────── */
const pageCSS = `
/* ── Hero stagger ── */
@keyframes auFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.au-stagger { opacity: 0; }
.au-ready .au-stagger {
  animation: auFadeUp 0.85s cubic-bezier(.22,1,.36,1) forwards;
}
.au-d1 { animation-delay:  60ms; }
.au-d2 { animation-delay: 180ms; }
.au-d3 { animation-delay: 300ms; }
.au-d4 { animation-delay: 420ms; }
.au-d5 { animation-delay: 540ms; }

/* ── Illustration entrance ── */
.au-illus { opacity: 0; }
.au-ready .au-illus {
  animation: auFadeUp 1s cubic-bezier(.22,1,.36,1) 500ms forwards;
}

/* ── Cellule anomalie : pulse doux ── */
@keyframes auCellPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
.au-cell-anomaly {
  animation: auCellPulse 2.4s ease-in-out infinite;
  animation-delay: 1.8s;
}

/* ── Scan line ── */
@keyframes auScan {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.7; }
  90%  { opacity: 0.7; }
  100% { transform: translateY(800%); opacity: 0; }
}
.au-scan-line {
  animation: auScan 3.6s cubic-bezier(.4,0,.6,1) infinite;
  animation-delay: 2s;
}

/* ── Card reveal on scroll ── */
@keyframes auCardIn {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
.au-card { opacity: 0; }
.au-card.visible {
  animation: auCardIn 0.7s cubic-bezier(.22,1,.36,1) forwards;
}

/* ── Testimonial reveal ── */
@keyframes auTestiIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.au-testi { opacity: 0; }
.au-testi.visible {
  animation: auTestiIn 0.65s cubic-bezier(.22,1,.36,1) forwards;
}
`;

/* ════════════════════════════════════════════════════════════════════
   Illustration SVG — Audit
   Concept : "Grille d'anomalie"
   Une grille parfaite et uniforme. Une seule case est mise en évidence
   (encadrée, avec un marqueur coloré), représentant la détection d'une
   anomalie dans un flux de données.
════════════════════════════════════════════════════════════════════ */

/* Dimensions de la grille */
const COLS = 7;
const ROWS = 5;
const CELL_W = 42;
const CELL_H = 30;
const GAP = 6;
const GRID_X = 32;
const GRID_Y = 32;

/* Cellule anomalie (ligne 2, colonne 4 — 0-indexed) */
const ANOMALY_ROW = 2;
const ANOMALY_COL = 4;

function AuditIllustration({ dk, anomalyLabel }: { dk: boolean; anomalyLabel: string }) {
  const cellFill    = dk ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)";
  const cellStroke  = dk ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.10)";
  const cellLine    = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  /* Largeur totale de la grille */
  const gridW = COLS * CELL_W + (COLS - 1) * GAP;
  const gridH = ROWS * CELL_H + (ROWS - 1) * GAP;

  /* Position de la cellule anomalie */
  const ax = GRID_X + ANOMALY_COL * (CELL_W + GAP);
  const ay = GRID_Y + ANOMALY_ROW * (CELL_H + GAP);

  /* Halo derrière la grille */
  const haloCx = GRID_X + gridW / 2;
  const haloCy = GRID_Y + gridH / 2;

  return (
    <svg
      viewBox="0 0 460 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 480, height: "auto" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="au-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="au-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="au-grid-clip">
          <rect x={GRID_X - 4} y={GRID_Y - 4} width={gridW + 8} height={gridH + 8} />
        </clipPath>
      </defs>

      {/* ── Halo doux derrière la grille ── */}
      <ellipse cx={haloCx} cy={haloCy} rx={gridW * 0.6} ry={gridH * 0.7}
        fill={dk ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)"}
        style={{ filter: "blur(40px)" }} />

      {/* ── Grille de cellules ── */}
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          const cx = GRID_X + col * (CELL_W + GAP);
          const cy = GRID_Y + row * (CELL_H + GAP);
          const isAnomaly = row === ANOMALY_ROW && col === ANOMALY_COL;

          if (isAnomaly) return null; /* rendu séparé en haut */

          return (
            <g key={`${row}-${col}`}>
              <rect
                x={cx} y={cy}
                width={CELL_W} height={CELL_H} rx="4"
                fill={cellFill}
                stroke={cellStroke}
                strokeWidth="0.8"
              />
              {/* Ligne interne simulant une donnée */}
              <line
                x1={cx + 7} y1={cy + CELL_H / 2 - 3}
                x2={cx + CELL_W - 10} y2={cy + CELL_H / 2 - 3}
                stroke={cellLine} strokeWidth="0.9"
              />
              <line
                x1={cx + 7} y1={cy + CELL_H / 2 + 4}
                x2={cx + CELL_W - 16} y2={cy + CELL_H / 2 + 4}
                stroke={cellLine} strokeWidth="0.7"
              />
            </g>
          );
        })
      )}

      {/* ── Ligne de scan ── */}
      <rect
        className="au-scan-line"
        x={GRID_X}
        y={GRID_Y}
        width={gridW}
        height="2"
        rx="1"
        fill="url(#au-h)"
        opacity="0.55"
        clipPath="url(#au-grid-clip)"
      />

      {/* ── Cellule anomalie (rendue par-dessus tout) ── */}
      <g className="au-cell-anomaly">
        {/* Halo de la cellule */}
        <rect
          x={ax - 6} y={ay - 6}
          width={CELL_W + 12} height={CELL_H + 12} rx="8"
          fill={dk ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.10)"}
          style={{ filter: "blur(8px)" }}
        />
        {/* Corps de la cellule */}
        <rect
          x={ax} y={ay}
          width={CELL_W} height={CELL_H} rx="4"
          fill={dk ? "rgba(59,130,246,0.16)" : "rgba(239,246,255,0.95)"}
          stroke="#3b82f6"
          strokeWidth="1.6"
          filter="url(#au-glow)"
        />
        {/* Ligne interne */}
        <line
          x1={ax + 7} y1={ay + CELL_H / 2 - 3}
          x2={ax + CELL_W - 10} y2={ay + CELL_H / 2 - 3}
          stroke={dk ? "rgba(147,197,253,0.55)" : "rgba(59,130,246,0.35)"} strokeWidth="0.9"
        />
        <line
          x1={ax + 7} y1={ay + CELL_H / 2 + 4}
          x2={ax + CELL_W - 16} y2={ay + CELL_H / 2 + 4}
          stroke={dk ? "rgba(147,197,253,0.40)" : "rgba(59,130,246,0.25)"} strokeWidth="0.7"
        />
        {/* Marqueur d'alerte en haut à droite */}
        <circle
          cx={ax + CELL_W - 4} cy={ay + 4} r="5"
          fill="#3b82f6"
        />
        <text
          x={ax + CELL_W - 4} y={ay + 4}
          textAnchor="middle" dominantBaseline="central"
          fontSize="5.5" fontWeight="700" fill="white"
          fontFamily="Inter, sans-serif"
        >!</text>
      </g>

      {/* ── Étiquette "Anomalie détectée" ── */}
      <g>
        {/* Ligne de liaison */}
        <line
          x1={ax + CELL_W + 2} y1={ay + CELL_H / 2}
          x2={ax + CELL_W + 36} y2={ay + CELL_H / 2}
          stroke={dk ? "rgba(99,155,246,0.40)" : "rgba(59,130,246,0.30)"}
          strokeWidth="0.9"
          strokeDasharray="3 2.5"
        />
        {/* Badge étiquette */}
        <rect
          x={ax + CELL_W + 36} y={ay + CELL_H / 2 - 12}
          width={82} height={24} rx="6"
          fill={dk ? "rgba(59,130,246,0.18)" : "rgba(239,246,255,0.95)"}
          stroke={dk ? "rgba(99,155,246,0.30)" : "rgba(59,130,246,0.22)"}
          strokeWidth="0.9"
        />
        <text
          x={ax + CELL_W + 77} y={ay + CELL_H / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize="7.5" fontWeight="600"
          fill={dk ? "#93c5fd" : "#2563eb"}
          fontFamily="Inter, sans-serif"
        >
          {anomalyLabel}
        </text>
      </g>

      {/* ── Points décoratifs ── */}
      {([[14, 14], [446, 14], [14, 206], [446, 206]] as [number, number][]).map(([x, y], i) => (
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
  onNavigate: (page: "home" | "for-business" | "ora-experience" | "solution-template" | "solution-expertise-comptable" | "solution-audit" | "not-found") => void;
}

/* ════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════════ */
export default function SolutionAuditPage({ theme, openBooking }: Props) {
  const { t } = useLang();
  const dk = theme === "dark";
  const [ready, setReady] = useState(false);

  /* ── Page identity ───────────────────────────────────────────────── */
  const METIER_BADGE  = t({ fr: "Ora pour l'Audit", en: "Ora for Audit" });
  const METIER_NAME   = t({ fr: "l'Audit", en: "Audit" });
  const HERO_TITLE_L1 = t({ fr: "Maîtrisez chaque", en: "Master every" });
  const HERO_TITLE_L2 = t({ fr: "ligne de données.", en: "line of data." });

  /* ── Solutions métier ────────────────────────────────────────────── */
  const solutions = [
    {
      icon: Search,
      title: t({ fr: "Revue par sondage accélérée", en: "Faster sample testing" }),
      desc: t({ fr: "Extrayez, structurez et analysez vos sondages d'audit en quelques clics. Ora prépare l'échantillon, calcule les indicateurs et formate le dossier de travail.", en: "Extract, structure and analyse your audit samples in a few clicks. Ora prepares the sample, computes the indicators and formats the working papers." }),
    },
    {
      icon: Zap,
      title: t({ fr: "Suppression des sélections manuelles", en: "No more manual selections" }),
      desc: t({ fr: "Fini les copier-coller et les filtres à reconfigurer à chaque mission. Ora extrait et prépare automatiquement les données selon vos critères, sans intervention manuelle.", en: "No more copy-paste and filters to reset on every engagement. Ora extracts and prepares data automatically based on your criteria, without manual intervention." }),
    },
    {
      icon: FileSpreadsheet,
      title: t({ fr: "Balances comparatives et TFT dans vos fichiers", en: "Comparative balances and cash flow in your files" }),
      desc: t({ fr: "Balances comparatives, tableaux de flux de trésorerie : Ora les génère directement dans vos fichiers de travail existants. Aucun fichier supplémentaire, aucun onglet à maintenir manuellement.", en: "Comparative balances, cash flow statements: Ora generates them directly in your existing working files. No extra file, no tab to maintain manually." }),
    },
    {
      icon: Palette,
      title: t({ fr: "Documents aux couleurs du cabinet", en: "Documents in your firm's brand" }),
      desc: t({ fr: "Tous les documents produits par Ora respectent automatiquement la charte graphique de votre cabinet. Livrables professionnels, sans mise en forme manuelle.", en: "Every document produced by Ora automatically matches your firm's brand identity. Professional deliverables, without manual formatting." }),
    },
    {
      icon: Send,
      title: t({ fr: "Tableaux prêts à envoyer, envoi mail inclus", en: "Send-ready tables with built-in email" }),
      desc: t({ fr: "Vos tableaux sont immédiatement mis en forme pour envoi client. L'envoi par mail est intégré directement : plus de mauvaise pièce jointe, plus de retraitement avant livraison.", en: "Your tables are instantly formatted for client delivery. Email sending is built in: no wrong attachment, no rework before sending." }),
    },
    {
      icon: Eye,
      title: t({ fr: "Vue manager sur l'avancée du dossier", en: "Manager view on file progress" }),
      desc: t({ fr: "Suivez l'avancée de chaque fichier en temps réel. Commentaires, modifications effectuées, statut par section. La supervision du dossier est fluide et centralisée.", en: "Track every file's progress in real time. Comments, edits made, status by section. File oversight is seamless and centralised." }),
    },
  ];

  /* ── Testimonials ────────────────────────────────────────────────── */
  const testimonials = [
    {
      quote: t({ fr: "Nous auditionnons des fichiers de plusieurs milliers de lignes. Ora détecte les anomalies en quelques secondes, là où notre équipe passait une journée entière à croiser les données manuellement.", en: "We audit files with thousands of lines. Ora detects anomalies in seconds, where our team used to spend an entire day cross-checking the data by hand." }),
      name: "Antoine Lefèvre",
      role: t({ fr: "Associé Audit", en: "Audit Partner" }),
      company: "Lefèvre & Partners",
      stars: 5,
    },
    {
      quote: t({ fr: "La traçabilité est non négociable dans notre métier. Avec Ora, chaque opération est horodatée et documentée automatiquement. Nos dossiers sont irréprochables à chaque revue.", en: "Traceability is non-negotiable in our field. With Ora, every operation is timestamped and documented automatically. Our files stand up to every review." }),
      name: "Sophie Marchand",
      role: t({ fr: "Manager Audit", en: "Audit Manager" }),
      company: "Cabinet Marchand",
      stars: 5,
    },
    {
      quote: t({ fr: "On a réduit de 40% le temps passé sur la phase de contrôle analytique. Ora fait le gros du travail de vérification, notre équipe se concentre sur les vrais enjeux.", en: "We cut 40% of the time spent on analytical review. Ora handles the heavy verification work, and our team focuses on what really matters." }),
      name: "Thomas Vidal",
      role: t({ fr: "Senior Auditeur", en: "Senior Auditor" }),
      company: "Audit & Conseil SAS",
      stars: 5,
    },
  ];

  /* ── Stat pills hero ─────────────────────────────────────────────── */
  const heroStats = [
    { value: "100%",     label: t({ fr: "des données vérifiées", en: "of data verified" }) },
    { value: "0",        label: t({ fr: "anomalie manquée", en: "anomalies missed" }) },
    { value: t({ fr: "< 1 sem", en: "< 1 week" }),  label: t({ fr: "pour démarrer", en: "to get started" }) },
  ];

  /* ── Points de conformité ────────────────────────────────────────── */
  const conformitePoints = [
    {
      title: t({ fr: "Zéro erreur de saisie", en: "Zero input errors" }),
      desc: t({ fr: "Ora élimine les risques liés à la ressaisie manuelle. Chaque donnée est extraite, transformée et vérifiée automatiquement selon vos règles.", en: "Ora removes the risks tied to manual re-entry. Every data point is extracted, transformed and verified automatically against your rules." }),
    },
    {
      title: t({ fr: "Traçabilité totale", en: "Full traceability" }),
      desc: t({ fr: "Toutes les opérations sont enregistrées avec source, date et opérateur. Votre piste d'audit est constituée en temps réel, sans effort supplémentaire.", en: "Every operation is logged with source, date and operator. Your audit trail is built in real time, with no extra effort." }),
    },
  ];

  /* Mount */
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
    window.scrollTo({ top: 0 });
  }, []);

  /* Scroll-triggered card reveal */
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".au-card, .au-testi");
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

  /* ── Design tokens ─────────────────────────────────────────────── */
  const bg             = dk ? "#000000" : "#ffffff";
  const bgContrast     = dk ? "#000000" : "#ffffff";
  const textPrimary    = dk ? "text-white"    : "text-gray-900";
  const textSecondary  = dk ? "text-gray-400" : "text-gray-500";
  const borderMuted    = dk ? "border-white/[0.07]" : "border-gray-200/70";
  const cardBg         = dk ? "bg-white/[0.03]" : "bg-white";

  return (
    <div className={ready ? "au-ready" : ""}>
      <style>{pageCSS}</style>

      {/* ══════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-24 pb-14 md:pt-36 md:pb-32 px-5 lg:px-10"
        style={{ background: bg }}
      >
        {/* Halo arrière-plan */}
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

            {/* ── Colonne gauche : copy ── */}
            <div className="max-w-[540px]">

              {/* Badge */}
              <div
                className={[
                  "au-stagger au-d1",
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                  "text-[11px] font-inter font-semibold uppercase tracking-[0.16em] mb-7",
                  dk
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-blue-50 text-blue-600 border border-blue-100",
                ].join(" ")}
              >
                {METIER_BADGE}
              </div>

              {/* Titre */}
              <h1
                className={[
                  "au-stagger au-d2",
                  "font-poppins text-[clamp(1.75rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.03em]",
                  textPrimary,
                ].join(" ")}
              >
                <span className="block">{HERO_TITLE_L1}</span>
                <span className="block text-brand-gradient">{HERO_TITLE_L2}</span>
              </h1>

              {/* Sous-titre */}
              <p
                className={[
                  "au-stagger au-d3",
                  "font-inter mt-5 md:mt-6 text-[clamp(0.95rem,1.6vw,1.05rem)] leading-[1.7] md:leading-[1.8]",
                  textSecondary,
                ].join(" ")}
              >
                {t({
                  fr: "Ora automatise la vérification, la traçabilité et la détection des anomalies directement depuis vos fichiers Excel. Vos auditeurs se concentrent sur le jugement, pas sur la manipulation de données.",
                  en: "Ora automates verification, traceability and anomaly detection straight from your Excel files. Your auditors focus on judgment, not on data wrangling.",
                })}
              </p>

              {/* CTA */}
              <div className="au-stagger au-d4 mt-9">
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

              {/* Stats pills */}
              <div className="au-stagger au-d5 mt-10 flex flex-wrap gap-3">
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

            {/* ── Colonne droite : illustration ── */}
            <div className="au-illus flex justify-center items-center">
              <AuditIllustration dk={dk} anomalyLabel={t({ fr: "Anomalie détectée", en: "Anomaly detected" })} />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. SOLUTIONS METIER
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-16 md:py-32 px-5 lg:px-10"
        style={{ background: bgContrast }}
      >
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
            <h2
              className={[
                "font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]",
                textPrimary,
              ].join(" ")}
            >
              {t({ fr: "Ce qu'Ora fait pour vous", en: "What Ora does for you" })}
            </h2>
            <p className={["font-inter mt-4 text-[1.05rem] leading-relaxed", textSecondary].join(" ")}>
              {t({
                fr: "Des automatisations concrètes, adaptées aux enjeux de ",
                en: "Concrete automations, built for the realities of ",
              })}
              {METIER_NAME}
              {t({
                fr: ". Opérationnelles en moins d'une semaine.",
                en: ". Live in less than a week.",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {solutions.map((sol, i) => {
              const Icon = sol.icon;
              return (
                <div
                  key={i}
                  className={[
                    "au-card p-4 rounded-[16px] md:p-7 md:rounded-[20px] border transition-colors duration-200",
                    borderMuted, cardBg,
                    dk ? "hover:bg-white/[0.05]" : "hover:bg-gray-50/70",
                  ].join(" ")}
                  data-delay={String(i * 80)}
                >
                  <div
                    className={[
                      "w-9 h-9 rounded-[10px] flex items-center justify-center mb-3 md:w-10 md:h-10 md:rounded-xl md:mb-5",
                      dk ? "bg-blue-500/10" : "bg-blue-50",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3
                    className={[
                      "font-poppins text-[15px] md:text-[16px] font-semibold tracking-tight leading-snug mb-1.5 md:mb-2",
                      textPrimary,
                    ].join(" ")}
                  >
                    {sol.title}
                  </h3>
                  <p className={["font-inter text-[14px] leading-[1.5] md:leading-relaxed", textSecondary].join(" ")}>
                    {sol.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Callout Excel ── */}
          <div
            className={[
              "mt-12 flex flex-col sm:flex-row sm:items-center gap-5 px-7 py-5 rounded-2xl border",
              borderMuted,
              dk ? "bg-white/[0.025]" : "bg-blue-50/40",
            ].join(" ")}
          >
            <p className={["font-inter text-[14.5px] leading-[1.5] md:text-[15px] md:leading-relaxed flex-1", textSecondary].join(" ")}>
              {t({
                fr: "Ora se branche directement sur vos fichiers Excel existants. Aucune migration, aucune refonte de processus.",
                en: "Ora plugs straight into your existing Excel files. No migration, no process overhaul.",
              })}
            </p>
            {/* "L'expérience Ora" link hidden until that page goes live. */}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. SECTION CONFORMITE
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-16 md:py-32 px-5 lg:px-10"
        style={{ background: bg }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="grid gap-9 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-start mb-10 md:mb-16">
            <div>
              <div
                className={[
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5",
                  "text-[11px] font-inter font-semibold uppercase tracking-[0.16em]",
                  dk
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                    : "bg-teal-50 text-teal-700 border border-teal-100",
                ].join(" ")}
              >
                {t({ fr: "Conformité et fiabilité", en: "Compliance and reliability" })}
              </div>
              <h2
                className={[
                  "font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]",
                  textPrimary,
                ].join(" ")}
              >
                {t({ fr: "Zéro erreur.", en: "Zero errors." })}
                <br />
                <span className="text-brand-gradient">{t({ fr: "Zéro oubli.", en: "Zero oversights." })}</span>
              </h2>
            </div>
            <div className="lg:pt-4">
              <p className={["font-inter text-[1.05rem] leading-[1.85]", textSecondary].join(" ")}>
                {t({
                  fr: "En audit, une erreur non détectée peut avoir des conséquences majeures. Ora applique vos règles de contrôle de manière systématique et exhaustive, sans fatigue ni oubli. Chaque vérification est documentée, chaque écart est signalé, chaque décision est tracée.",
                  en: "In audit, one undetected error can carry major consequences. Ora applies your control rules systematically and exhaustively, without fatigue or oversight. Every check is documented, every gap is flagged, every decision is tracked.",
                })}
              </p>
            </div>
          </div>

          {/* Points de conformité */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {conformitePoints.map((pt, i) => (
              <div
                key={i}
                className={[
                  "au-card flex flex-col gap-2 xs:flex-row xs:gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border",
                  borderMuted,
                  dk ? "bg-white/[0.025]" : "bg-white",
                ].join(" ")}
                data-delay={String(i * 90)}
              >
                {/* Icône check */}
                <div
                  className={[
                    "flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center md:mt-0.5 md:w-10 md:h-10 md:rounded-xl",
                    dk ? "bg-teal-500/10" : "bg-teal-50",
                  ].join(" ")}
                >
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                </div>
                {/* `min-w-0` : enfant de flex, donc `min-width: auto` par
                    défaut — sans lui le bloc refuse de descendre sous la
                    largeur de son mot le plus long et pousse la page hors de
                    l'écran à 320 px. */}
                <div className="min-w-0">
                  <h3
                    className={[
                      "font-poppins text-[12.5px] md:text-[15px] font-semibold tracking-tight leading-snug mb-1.5 break-words",
                      textPrimary,
                    ].join(" ")}
                  >
                    {pt.title}
                  </h3>
                  <p className={["font-inter text-[14px] leading-[1.5] md:leading-relaxed", textSecondary].join(" ")}>
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-16 md:py-32 px-5 lg:px-10"
        style={{ background: bgContrast }}
      >
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-10 md:mb-16 max-w-xl mx-auto">
            <p
              className={[
                "font-inter text-[11px] font-semibold uppercase tracking-[0.18em] mb-4",
                dk ? "text-blue-400" : "text-blue-600",
              ].join(" ")}
            >
              {t({ fr: "Témoignages", en: "Testimonials" })}
            </p>
            <h2
              className={[
                "font-poppins text-[clamp(1.55rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]",
                textPrimary,
              ].join(" ")}
            >
              {t({ fr: "Des auditeurs qui font", en: "Auditors who trust" })}
              <br />
              {t({ fr: "confiance à leurs données.", en: "their data." })}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {testimonials.map((testi, i) => (
              <div
                key={i}
                className={[
                  "au-testi flex flex-col gap-3 md:gap-5 p-4 rounded-[16px] md:p-7 md:rounded-[20px] border",
                  borderMuted, cardBg,
                ].join(" ")}
                data-delay={String(i * 100)}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: testi.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <blockquote
                  className={["font-inter text-[14.5px] leading-[1.5] md:text-[15px] md:leading-relaxed flex-1", textSecondary].join(" ")}
                >
                  &ldquo;{testi.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3 pt-2 border-t border-inherit">
                  <div
                    className={[
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      "font-inter text-[13px] font-semibold",
                      dk ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600",
                    ].join(" ")}
                  >
                    {testi.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={["font-inter text-[13px] font-semibold", textPrimary].join(" ")}>
                      {testi.name}
                    </p>
                    <p className={["font-inter text-[12px]", textSecondary].join(" ")}>
                      {testi.role} · {testi.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. CTA
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-16 md:py-28 px-5 lg:px-10"
        style={{ background: bg }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div
            className={[
              "rounded-[24px] px-6 py-12 border md:rounded-[32px] md:px-10 md:py-16",
              borderMuted,
              dk ? "bg-white/[0.03]" : "bg-gray-50/80",
            ].join(" ")}
          >
            <Shield className="w-10 h-10 text-blue-500 mx-auto mb-6" />

            <h2
              className={[
                "font-poppins text-[clamp(1.45rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]",
                textPrimary,
              ].join(" ")}
            >
              {t({ fr: "Prêt à auditer sans erreur ?", en: "Ready to audit without errors?" })}
            </h2>

            <p className={["font-inter mt-4 text-[1.05rem] leading-relaxed", textSecondary].join(" ")}>
              {t({
                fr: "30 minutes, sans engagement. On vous montre ce qu'Ora peut changer dans vos missions dès la première semaine.",
                en: "30 minutes, no strings attached. We show you what Ora can change in your engagements from week one.",
              })}
            </p>

            <button
              onClick={openBooking}
              className={[
                "mt-9 group inline-flex items-center gap-2.5 px-8 py-4",
                "rounded-full text-[15px] font-inter font-semibold text-white",
                "transition-all duration-150 hover:-translate-y-px active:translate-y-0",
                "bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600",
                "shadow-[0_4px_20px_rgba(37,99,235,0.28)]",
                "hover:shadow-[0_6px_28px_rgba(37,99,235,0.42)]",
              ].join(" ")}
            >
              {t({ fr: "Réserver un appel gratuit", en: "Book a free call" })}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-[3px] transition-transform duration-150" />
            </button>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {[
                t({ fr: "Sans engagement", en: "No commitment" }),
                t({ fr: "Démarrage en moins d'une semaine", en: "Live in under a week" }),
                t({ fr: "Support dédié inclus", en: "Dedicated support included" }),
              ].map((label) => (
                <span
                  key={label}
                  className={["font-inter flex items-center gap-1.5 text-[13px]", textSecondary].join(" ")}
                >
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
