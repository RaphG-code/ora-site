import { Suspense, lazy, useEffect, useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom"; // used for booking modal
import Lenis from "lenis";
import { Analytics } from "@vercel/analytics/react";
import { animatedScrollToId } from "./lib/scrollTo";
import OraLogoSpinner from "./components/OraLogoSpinner";
// ⚠ QualifierFlow, QualifierResult et GiftReveal NE SONT PLUS MONTÉS depuis le
// 2026-08-19 (client : « fais quelque chose de beaucoup plus straight to the
// point, ne mets pas combien d'heures vous passez »). Les trois fichiers
// restent dans le dépôt ; les remonter demanderait de rétablir leurs phases
// dans BookingPhase, leurs branches de rendu et leurs entrées de BOOKING_STEPS.
import SlotPicker, { ContactDirect, type Slot } from "./components/SlotPicker";
// StackingCards n'est plus monté du tout depuis le 2026-08-15 : les deux cartes
// qui montaient l'une sur l'autre sont parties le 2026-08-14, et le bandeau de
// formats (FileChipStrip) a suivi l'en-tête « Automatisez de bout en bout » le
// lendemain. Il vit maintenant en pied de la section à onglets, qui l'importe
// directement depuis StackingCards.tsx.
import AtlasShowcase from "./components/AtlasShowcase";
import IndustrySelector from "./components/IndustrySelector";
import ControlShowcase from "./components/ControlShowcase";
import PlatformShowcase from "./components/PlatformShowcase";
import AutomationTabs from "./components/AutomationTabs";
// import EnterpriseReady from "./components/EnterpriseReady"; // masqué pour l'instant
// import FinanceUseCases from "./components/FinanceUseCases"; // masqué pour l'instant
// import ProblemSection from "./components/ProblemSection"; // masqué pour l'instant
// UseCases (encadrés classiques + mur de dézoom) REMPLACÉ le 2026-08-06 par
// UseCasesBento, le clone de la grille bento stripe.com en pervenche (décision
// client : « remplace la partie ancienne, les encadrés classiques ne rendent
// pas très bien »). Le fichier UseCases.tsx reste dans le dépôt, prêt à être
// réimporté ici si on revient en arrière.
import UseCasesBento from "./components/UseCasesBento";
import FAQ from "./components/FAQ";
// === Subtle "bubble" animation for HOW IT WORKS steps ===
const bubbleStyles = `
/* === Booking loading screen fade-out === */
@keyframes loaderFadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; visibility: hidden; }
}
.booking-loading-screen.fade-out {
  animation: loaderFadeOut 0.6s ease-out forwards;
}

/* === Light hero animated aurora (subtle moving blue/pink) === */
@keyframes auroraFloat {
  0%   { transform: translate3d(-2%, -1%, 0) scale(1); }
  50%  { transform: translate3d(2%, 1.5%, 0) scale(1.06); }
  100% { transform: translate3d(-2%, -1%, 0) scale(1); }
}

/* auroraHue removed — filter: hue-rotate() causes expensive repaints */

@keyframes auroraShift {
  0%   { background-position: 12% 18%, 88% 20%, 52% 92%; opacity: 0.95; }
  50%  { background-position: 18% 22%, 82% 16%, 58% 88%; opacity: 0.85; }
  100% { background-position: 12% 18%, 88% 20%, 52% 92%; opacity: 0.95; }
}

.hero-aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transform: translateZ(0);
  will-change: transform;
  contain: layout paint;
}

.hero-aurora::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(520px 520px at 12% 18%, rgba(191,227,255,0.55) 0%, rgba(191,227,255,0.20) 35%, rgba(191,227,255,0.00) 70%),
    radial-gradient(560px 560px at 88% 20%, rgba(255,214,236,0.52) 0%, rgba(255,214,236,0.18) 35%, rgba(255,214,236,0.00) 70%),
    radial-gradient(620px 620px at 52% 92%, rgba(200,231,255,0.42) 0%, rgba(200,231,255,0.14) 35%, rgba(200,231,255,0.00) 70%);
  background-repeat: no-repeat;
  background-size: 120% 120%, 120% 120%, 120% 120%;
  opacity: 0.92;
  animation:
    auroraFloat 12s ease-in-out infinite,
    auroraShift 10s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero-aurora::before {
    animation: none !important;
  }
}

@keyframes bubble {
  0% { opacity: 0; transform: translateY(6px) scale(0.8); }
  30% { opacity: 0.6; }
  50% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
}
.animate-bubble {
  animation: bubble 2.4s ease-in-out infinite;
}

/* === Ora experience video placeholder subtle shimmer === */
@keyframes placeholderGlow {
  0% { background-position: 0% 50%; opacity: 0.85; }
  50% { background-position: 100% 50%; opacity: 1; }
  100% { background-position: 0% 50%; opacity: 0.9; }
}

.placeholder-anim {
  background-image: linear-gradient(
    110deg,
    rgba(56,189,248,0.10) 0%,
    rgba(147,197,253,0.18) 40%,
    rgba(236,72,153,0.14) 65%,
    rgba(56,189,248,0.10) 100%
  );
  background-size: 200% 200%;
  animation: placeholderGlow 5.2s ease-in-out infinite;
}

/* === Ora experience video cinematic reveal === */
@keyframes videoReveal {
  0% {
    opacity: 0;
    transform: perspective(1200px) rotateY(-6deg) translateX(80px) scale(0.88);
  }
  60% {
    opacity: 0.85;
    transform: perspective(1200px) rotateY(-1deg) translateX(8px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1);
  }
}

.video-reveal {
  opacity: 0;
  transform: perspective(1200px) rotateY(-6deg) translateX(80px) scale(0.88);
}

.video-reveal.visible {
  animation: videoReveal 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}


/* === Phone ringing animation for Discovery call step === */
@keyframes phoneRing {
  0%, 100% { transform: rotate(0deg); }
  4% { transform: rotate(14deg); }
  8% { transform: rotate(-14deg); }
  12% { transform: rotate(10deg); }
  16% { transform: rotate(-10deg); }
  20% { transform: rotate(6deg); }
  24% { transform: rotate(0deg); }
}
@keyframes phonePulse1 {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes phonePulse2 {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.8); opacity: 0; }
}
@keyframes phonePulse3 {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(3.4); opacity: 0; }
}
@keyframes phoneGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes phoneDot {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
}

@keyframes iconRing {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  15% { transform: rotate(-10deg) translateY(-1px); }
  30% { transform: rotate(10deg) translateY(-1px); }
  45% { transform: rotate(-6deg) translateY(0); }
  60% { transform: rotate(6deg) translateY(0); }
}

@keyframes iconPlug {
  0%, 100% { transform: translateX(0); }
  40% { transform: translateX(2px); }
  60% { transform: translateX(-2px); }
}

@keyframes iconPlan {
  0%, 100% { transform: translateY(0); opacity: 0.95; }
  50% { transform: translateY(-2px); opacity: 1; }
}

@keyframes iconLaunch {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(6deg); }
}

.icon-ring { animation: iconRing 1.4s ease-in-out infinite; transform-origin: 50% 50%; }
.icon-plug { animation: iconPlug 1.2s ease-in-out infinite; }
.icon-plan { animation: iconPlan 1.6s ease-in-out infinite; }
.icon-launch { animation: iconLaunch 1.3s ease-in-out infinite; }

.icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(56,189,248,0.10);
}
.dark .icon-chip {
  background: rgba(56,189,248,0.16);
}

/* === Hero suggestions rail (stealth scrollbar) === */
.suggestion-rail {
  scrollbar-width: thin; /* Firefox */
  scrollbar-gutter: stable both-edges;
  scrollbar-color: rgba(56,189,248,0.18) transparent;
}
.dark .suggestion-rail {
  scrollbar-color: rgba(56,189,248,0.14) transparent;
}

.suggestion-rail::-webkit-scrollbar {
  height: 4px;
}
.suggestion-rail::-webkit-scrollbar-track {
  background: transparent;
}
.suggestion-rail::-webkit-scrollbar-thumb {
  background: rgba(56,189,248,0.18);
  border-radius: 9999px;
}
.dark .suggestion-rail::-webkit-scrollbar-thumb {
  background: rgba(56,189,248,0.14);
}

/* reveal a bit more on hover */
.suggestion-rail:hover {
  scrollbar-color: rgba(56,189,248,0.35) transparent;
}
.dark .suggestion-rail:hover {
  scrollbar-color: rgba(56,189,248,0.28) transparent;
}
.suggestion-rail:hover::-webkit-scrollbar-thumb {
  background: rgba(56,189,248,0.35);
}
.dark .suggestion-rail:hover::-webkit-scrollbar-thumb {
  background: rgba(56,189,248,0.28);
}


/* === Button hover text wipe (down out, up in) === */
.btn-wipe {
  position: relative;
  overflow: hidden;
}
.btn-wipe .btn-wipe-inner {
  position: relative;
  display: inline-block;
  line-height: 1;
}
.btn-wipe .btn-wipe-out,
.btn-wipe .btn-wipe-in {
  display: inline-block;
  transition: transform 260ms ease, opacity 260ms ease;
  will-change: transform, opacity;
}
.btn-wipe .btn-wipe-in {
  position: absolute;
  left: 0;
  top: 0;
  transform: translateY(-120%);
  opacity: 0;
}
.btn-wipe:hover .btn-wipe-out {
  transform: translateY(120%);
  opacity: 0;
}
.btn-wipe:hover .btn-wipe-in {
  transform: translateY(0%);
  opacity: 1;
}

/* === Stunning quote animations === */
@keyframes quoteGlowSweep {
  0% { transform: translateX(-120%); opacity: 0; }
  15% { opacity: 0.75; }
  100% { transform: translateX(120%); opacity: 0; }
}

@keyframes quotePop {
  0% { opacity: 0; transform: translateY(26px) scale(0.96); }
  60% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.quote-pop {
  animation: quotePop 1100ms cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform, opacity;
}

.quote-shine {
  position: relative;
  display: inline-block;
}

.quote-shine::after {
  content: "";
  position: absolute;
  inset: -18px -26px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.55), rgba(59,130,246,0.35), transparent);
  filter: blur(14px);
  opacity: 0;
  transform: translateX(-120%);
  pointer-events: none;
}

.quote-shine.on::after {
  opacity: 1;
  animation: quoteGlowSweep 1.9s ease-out 120ms both;
}

/* === Hero caption (fancy, subtle) === */
@keyframes heroCaptionIn {
  0% { opacity: 0; }
  60% { opacity: 1; }
  100% { opacity: 1; }
}
.hero-caption {
  position: relative;
  display: inline-block;
}
.hero-caption-inner {
  position: relative;
  display: inline-block;
  animation: heroCaptionIn 1100ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
  will-change: opacity;
}

@keyframes heroCaptionShine {
  0% { transform: translateX(-140%); opacity: 0; }
  18% { opacity: 0.9; }
  100% { transform: translateX(140%); opacity: 0; }
}
.hero-caption::after {
  content: "";
  position: absolute;
  left: -24%;
  right: -24%;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.42), rgba(59,130,246,0.26), transparent);
  filter: blur(14px);
  opacity: 0;
  transform: translateX(-140%);
  pointer-events: none;
  animation: heroCaptionShine 2.1s ease-out 520ms both;
}
/* Planet orbits for Ora experience card 1 */
@keyframes orbit1 {
  0%   { transform: rotate(0deg) translateX(90px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
}
@keyframes orbit2 {
  0%   { transform: rotate(120deg) translateX(130px) rotate(-120deg); }
  100% { transform: rotate(480deg) translateX(130px) rotate(-480deg); }
}
@keyframes orbit3 {
  0%   { transform: rotate(240deg) translateX(60px) rotate(-240deg); }
  100% { transform: rotate(600deg) translateX(60px) rotate(-600deg); }
}
@keyframes orbitRing {
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
.planet {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}
.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.08);
  top: 50%;
  left: 50%;
}

@keyframes stepFadeIn {
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  50% { opacity: 0.7; }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes heroEntrance {
  0%   { opacity: 0; transform: translateY(22px); }
  60%  { opacity: 0.8; }
  100% { opacity: 1; transform: translateY(0); }
}
.hero-enter {
  opacity: 0;
  animation: heroEntrance 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.hero-enter-d1 { animation-delay: 0ms; }
.hero-enter-d2 { animation-delay: 200ms; }
.hero-enter-d3 { animation-delay: 400ms; }
.hero-enter-d4 { animation-delay: 900ms; }

/* Subtle badge attention pulse — plays after all entrance anims are done */
@keyframes badgeNotice {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  30%  { transform: scale(1.045); box-shadow: 0 0 18px 4px rgba(59,130,246,0.18); }
  60%  { transform: scale(0.99); box-shadow: 0 0 6px 1px rgba(59,130,246,0.06); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
}
@keyframes badgeShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.badge-notice {
  animation: badgeNotice 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 2.6s both,
             badgeShimmer 1.4s ease 2.8s both;
  background-size: 200% 100%;
  background-image: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255,255,255,0.18) 46%,
    rgba(255,255,255,0.22) 50%,
    rgba(255,255,255,0.18) 54%,
    transparent 70%
  );
}

@keyframes heroLineReveal {
  0%   { clip-path: inset(0 100% 0 0); opacity: 0; }
  15%  { opacity: 1; }
  100% { clip-path: inset(0 0% 0 0); opacity: 1; }
}
.hero-line-reveal {
  display: inline-block;
  opacity: 0;
  animation: heroLineReveal 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* === Feature row reveal — dark mode only (white bg had jank) === */
@keyframes featReveal {
  from { opacity: 0; transform: translate3d(0, 24px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
.dark .feat-row .feat-child { opacity: 0; }
.dark .feat-row.feat-visible .feat-child {
  animation: featReveal 0.65s cubic-bezier(.22,1,.36,1) var(--feat-delay, 0ms) both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-bubble,
  .icon-ring,
  .icon-plug,
  .icon-plan,
  .icon-launch,
  .quote-pop,
  .hero-caption-inner {
    animation: none !important;
  }
  .btn-wipe .btn-wipe-out,
  .btn-wipe .btn-wipe-in {
    transition: none !important;
  }
}

/* Hide Cal.com default loading spinner */
cal-inline-widget .loader,
cal-inline-widget [data-testid="loader"],
cal-inline-widget .cal-loading {
  display: none !important;
}

/* Final CTA — subtle grid fading at the edges */
.cta-grid {
  -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 50%, #000 25%, transparent 78%);
  mask-image: radial-gradient(ellipse 75% 65% at 50% 50%, #000 25%, transparent 78%);
}

/* Final CTA — floating decorative cards */
@keyframes ctaFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-12px); }
}
.cta-float { animation: ctaFloat 7s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .cta-float { animation: none; }
}
`;
import Cal from "@calcom/embed-react";
import { Card } from "./components/ui/card";
import Navigation from "./components/Navigation";
import { OraFooter } from "./components/Footer";
// OraGallery = the Bending-Spoons-style 6-video carousel hero. Preserved intact
// and ready to swap back in once the real demo clips are available (just replace
// <OraHeroVideo> below with <OraGallery>). Temporarily replaced by a single
// demo video via OraHeroVideo.
// import OraGallery from "./components/OraGallery";
// OraHeroVideo (single ora-1.mp4 demo) replaced by the scroll-driven demo
// below. File kept for reference.
// import OraHeroVideo from "./components/OraHeroVideo";
import OraHeroDemo from "./components/OraHeroDemo";
// DemoVideoCurtain (white "Vos dossiers financiers…" panel) removed: the main
// demo (ora-1.mp4) now lives in the hero. Component file kept for reference.
// import DemoVideoCurtain from "./components/DemoVideoCurtain";
/* ══ LES SEIZE PAGES SONT CHARGÉES À LA DEMANDE ══════════════════════════════
   Elles étaient toutes importées en dur, donc toutes empaquetées dans le chunk
   d'entrée : mesuré avant la bascule, 373 ko minifiés de pages qui ne
   s'affichent JAMAIS sur l'accueil partaient quand même à chaque visite, sur un
   site dont l'immense majorité du trafic ne verra que la racine.
   `lazy` + `Suspense` suffisent ici, précisément parce que le routeur est un
   état React et non react-router : une seule branche est montée à la fois, il
   n'y a donc rien à précharger ni à coordonner.
   ⚠ L'ACCUEIL N'EST PAS DANS CETTE LISTE. Il est rendu en ligne dans la branche
   finale du conditionnel, sans import de page ; le découper n'aurait aucun sens,
   c'est la page qu'on vient chercher. */
const ForBusinessPage = lazy(() => import("./pages/ForBusinessPage"));
const OraExperiencePage = lazy(() => import("./pages/OraExperiencePage"));
const SolutionTemplatePage = lazy(() => import("./pages/SolutionTemplatePage"));
const SolutionExpertiseComptablePage = lazy(() => import("./pages/SolutionExpertiseComptablePage"));
const SolutionAuditPage = lazy(() => import("./pages/SolutionAuditPage"));
const SolutionFondsInvestissementPage = lazy(() => import("./pages/SolutionFondsInvestissementPage"));
const SolutionBanqueAffairesPage = lazy(() => import("./pages/SolutionBanqueAffairesPage"));
const ConfidentialitePage = lazy(() => import("./pages/ConfidentialitePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const MentionsLegalesPage = lazy(() => import("./pages/MentionsLegalesPage"));
const PolitiqueConfidentialitePage = lazy(() => import("./pages/PolitiqueConfidentialitePage"));
const CGUPage = lazy(() => import("./pages/CGUPage"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));
const EspaceClientPage = lazy(() => import("./pages/EspaceClientPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

import { useLang } from "./lib/i18n";
import {
  Clock,
  X,
  Zap,
  ArrowRight,
  FileSpreadsheet,
  Mail,
  BarChart3,
} from "lucide-react";

// ← Replace with your Cal.com username/event-slug once your account is set up
// Example: "raphael-gaugain/discovery-call"
const CAL_LINK = "raphael-gaugain-cfjl0b/discovery-call";

/** Les DEUX temps de la fenêtre de réservation, pour le rail de gauche.
 *  Ils NOMMENT ce qui se passe, ils ne numérotent pas : « Étape 2 / 2 » ne dit
 *  rien de plus que la position, alors que « Vos coordonnées » dit ce qui est
 *  demandé à l'écran suivant.
 *  ⚠ Il y en avait TROIS jusqu'au 2026-08-19 (« Votre contexte », « Ce qu'on
 *  regarde », « Votre créneau ») : les deux premières nommaient le
 *  questionnaire et son récapitulatif, qui ont sauté. Un rail de deux entrées
 *  est à la limite de l'utile ; il est gardé parce qu'il annonce qu'un
 *  formulaire attend après le clic sur l'heure, ce qui, sans lui, surprend. */
const BOOKING_STEPS = [
  { fr: "Votre créneau", en: "Your slot" },
  { fr: "Vos coordonnées", en: "Your details" },
];

// Adresse affichée en alternative au calendrier. Passée à la boîte générique le
// 2026-08-03 sur demande du client : c'est celle qu'il relève, et elle est déjà
// annoncée à douze autres endroits du site. Une adresse nominative sur un bouton
// de prise de rendez-vous fait perdre des prospects sans que personne ne s'en
/* ⚠ `BOOKING_EMAIL` A DÉMÉNAGÉ dans SlotPicker.tsx, sous le nom
   EMAIL_CONTACT : le bouton qui l'utilise y vit désormais, et il est partagé
   entre les deux étapes de la réservation (voir ContactDirect). */

// === Scroll Fade-In Wrapper ===
type FadeInOnScrollProps = {
  children: ReactNode;
  delay?: number; // in ms
  className?: string;
  direction?: "up" | "left" | "right";
  onVisible?: () => void;
};

const FadeInOnScroll = ({
  children,
  delay = 0,
  className = "",
  direction = "up",
  onVisible,
}: FadeInOnScrollProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (onVisible) onVisible();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [onVisible]);

  const hiddenTransform =
    direction === "left"
      ? "translateX(-60px)"
      : direction === "right"
        ? "translateX(60px)"
        : "translateY(60px)";

  return (
    <div
      ref={ref}
      className={`transform-gpu ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0,0,0)" : hiddenTransform,
        transition:
          "opacity 800ms cubic-bezier(.22,1,.36,1), transform 800ms cubic-bezier(.22,1,.36,1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};


// === URL-based routing helpers ===
type Page =
  | "home"
  | "for-business"
  | "ora-experience"
  | "solution-template"
  | "solution-expertise-comptable"
  | "solution-audit"
  | "solution-fonds-investissement"
  | "solution-banque-affaires"
  | "confidentialite"
  | "pricing"
  | "mentions-legales"
  | "politique-confidentialite"
  | "cgu"
  | "espace-client"
  | "telechargement"
  | "demo"
  | "not-found";

const PAGE_TO_PATH: Record<Page, string> = {
  "home": "/",
  "for-business": "/for-business",
  "ora-experience": "/ora-experience",
  "solution-template": "/solution-template",
  "solution-expertise-comptable": "/solution-expertise-comptable",
  "solution-audit": "/solution-audit",
  "solution-fonds-investissement": "/solution-fonds-investissement",
  "solution-banque-affaires": "/solution-banque-affaires",
  "confidentialite": "/confidentialite",
  "pricing": "/pricing",
  "mentions-legales": "/mentions-legales",
  "politique-confidentialite": "/politique-confidentialite",
  "cgu": "/cgu",
  "espace-client": "/espace-client",
  // Hidden client download page: reachable only via this private direct link.
  // NOT added to HIDDEN_PAGES (that would 404 it) and NOT linked in nav/footer.
  "telechargement": "/telechargement/ora-app",
  // Online demo funnel (lead-gen): not linked in the nav yet, reachable at /demo.
  // The magic-link delivery space lives at /demo?ml=<job_id> (same page key).
  "demo": "/demo",
  "not-found": "/not-found",
};

/* ══ TITRE ET DESCRIPTION PAR PAGE ═══════════════════════════════════════════
   Ajoutés le 2026-08-15, après audit. Les quinze routes servaient jusque-là un
   SEUL <title> et une seule description, ceux d'index.html : `document.title`
   n'était écrit nulle part dans le code, et il n'y a pas de rendu serveur. Une
   recherche sur « Ora mentions légales » et la page d'accueil renvoyaient donc
   le même résultat, et le partage d'une page de solution montrait le titre de
   l'accueil.
   ⚠ CE N'EST PAS DU RÉFÉRENCEMENT COMPLET, et il faut le savoir : ces titres
   sont écrits par React APRÈS le chargement. Google exécute le JavaScript et
   les verra ; LinkedIn, Slack et iMessage ne l'exécutent pas et continueront de
   lire les balises d'index.html pour toutes les pages. Les vignettes de partage
   par page demandent un pré-rendu (vite-plugin-ssg ou l'équivalent), c'est un
   chantier à part.
   La description est écrite dans la balise existante d'index.html plutôt que
   dans une nouvelle : deux balises `description` dans un même document, c'est
   un document invalide et un moteur qui choisit tout seul. */
const SITE = "https://ora-solution.com";

const PAGE_META: Record<Page, { title: { fr: string; en: string }; desc: { fr: string; en: string } }> = {
  "home": {
    title: {
      fr: "Ora, l'automatisation du travail répétitif sur Excel",
      en: "Ora, automation for repetitive spreadsheet work",
    },
    desc: {
      fr: "Ora enchaîne le travail répétitif qui va de la donnée brute au document final. Traitement local, résultat reproductible, journal d'audit.",
      en: "Ora runs the repetitive chain from raw data to finished document. Local processing, reproducible results, audit trail.",
    },
  },
  "for-business": {
    title: { fr: "Ora pour les entreprises", en: "Ora for business" },
    desc: {
      fr: "Automatiser les traitements récurrents d'une direction financière, sur vos propres fichiers et sans les sortir de chez vous.",
      en: "Automate a finance team's recurring work, on your own files, without them leaving your machines.",
    },
  },
  "ora-experience": {
    title: { fr: "L'expérience Ora", en: "The Ora experience" },
    desc: {
      fr: "Ce que change une chaîne de traitement automatisée, du dépôt du fichier au livrable prêt à envoyer.",
      en: "What an automated chain changes, from dropping the file to a deliverable ready to send.",
    },
  },
  "solution-template": {
    title: { fr: "Solutions Ora par métier", en: "Ora solutions by field" },
    desc: {
      fr: "Les traitements qu'Ora reprend, métier par métier, avec les livrables qui en sortent.",
      en: "The work Ora takes over, field by field, with the deliverables it produces.",
    },
  },
  "solution-expertise-comptable": {
    title: { fr: "Ora pour l'expertise comptable", en: "Ora for accounting firms" },
    desc: {
      fr: "Bilan développé, prévisionnel, contrôles de clôture : les travaux qui reviennent à chaque période, exécutés d'un clic.",
      en: "Detailed balance sheets, forecasts, closing checks: the work that comes back every period, run in one click.",
    },
  },
  "solution-audit": {
    title: { fr: "Ora pour l'audit", en: "Ora for audit" },
    desc: {
      fr: "Contrôles sur le FEC, écritures atypiques documentées, journal d'audit par document. Le même résultat à chaque exécution.",
      en: "Checks on the ledger, unusual entries documented, an audit trail per document. The same result on every run.",
    },
  },
  "solution-fonds-investissement": {
    title: { fr: "Ora pour les fonds d'investissement", en: "Ora for investment funds" },
    desc: {
      fr: "Dossiers de deal reliés à leurs sources, retraitements reproductibles et livrables montés sur vos propres modèles.",
      en: "Deal files linked to their sources, reproducible rework, deliverables built on your own templates.",
    },
  },
  "solution-banque-affaires": {
    title: { fr: "Ora pour la banque d'affaires", en: "Ora for investment banking" },
    desc: {
      fr: "Évaluations, comparatifs et supports de comité montés depuis un même jeu de chiffres, traçable de bout en bout.",
      en: "Valuations, comparisons and committee decks built from one set of figures, traceable end to end.",
    },
  },
  "confidentialite": {
    title: { fr: "Confidentialité et sécurité", en: "Privacy and security" },
    desc: {
      fr: "Où vivent vos fichiers, qui peut les lire, ce qui est journalisé. Traitement local par défaut.",
      en: "Where your files live, who can read them, what is logged. Local processing by default.",
    },
  },
  "pricing": {
    title: { fr: "Tarifs", en: "Pricing" },
    desc: {
      fr: "Ce que coûte Ora, et ce que couvre l'accompagnement.",
      en: "What Ora costs, and what the onboarding covers.",
    },
  },
  "mentions-legales": {
    title: { fr: "Mentions légales", en: "Legal notice" },
    desc: {
      fr: "Éditeur, hébergeur et informations légales du site Ora.",
      en: "Publisher, host and legal information for the Ora website.",
    },
  },
  "politique-confidentialite": {
    title: { fr: "Politique de confidentialité", en: "Privacy policy" },
    desc: {
      fr: "Les données que nous collectons sur ce site, pourquoi, et combien de temps nous les gardons.",
      en: "What data this site collects, why, and how long we keep it.",
    },
  },
  "cgu": {
    title: { fr: "Conditions générales d'utilisation", en: "Terms of use" },
    desc: {
      fr: "Les conditions d'utilisation du site et du logiciel Ora.",
      en: "The terms of use for the Ora website and software.",
    },
  },
  "espace-client": {
    title: { fr: "Mon espace Ora", en: "My Ora space" },
    desc: {
      fr: "L'espace client Ora : vos automatisations, vos fichiers et votre suivi.",
      en: "The Ora client space: your automations, your files and your tracking.",
    },
  },
  "telechargement": {
    title: { fr: "Télécharger Ora", en: "Download Ora" },
    desc: {
      fr: "Installer l'application Ora sur votre poste.",
      en: "Install the Ora app on your machine.",
    },
  },
  "demo": {
    title: { fr: "Tester Ora sur vos fichiers", en: "Try Ora on your own files" },
    desc: {
      fr: "Choisissez une automatisation, déposez un fichier, regardez le résultat. Directement dans votre navigateur, sans installation.",
      en: "Pick an automation, drop a file, watch the result. Straight in your browser, nothing to install.",
    },
  },
  "not-found": {
    title: { fr: "Page introuvable", en: "Page not found" },
    desc: {
      fr: "Cette page n'existe pas ou n'est plus en ligne.",
      en: "This page does not exist, or is no longer online.",
    },
  },
};

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  (Object.entries(PAGE_TO_PATH) as [Page, string][]).map(([p, path]) => [path, p])
);

// Pages temporarily hidden until they go live. Direct URL access to any of
// these resolves to the 404 page, and their nav/footer links are removed.
// To re-enable a page, delete it from this set and restore its links.
const HIDDEN_PAGES = new Set<Page>(["ora-experience", "pricing", "confidentialite"]);

function getPageFromPath(pathname: string): Page {
  const page = PATH_TO_PAGE[pathname] ?? "not-found";
  return HIDDEN_PAGES.has(page) ? "not-found" : page;
}

const App = () => {
  const { t, lang } = useLang();

  // Smooth scroll with inertia (Lenis)
  useEffect(() => {
    // Réglage 2026-08-06 (client : « sur tout le site le scroll vers le bas
    // doit être plus fluide ») : lerp 0,15 → 0,18, la page suit la molette de
    // plus près, et wheelMultiplier 1,0 → 1,2, chaque cran parcourt 20 % de
    // distance en plus. Les sections épinglées (hero, mur des cas d'usage,
    // cartes empilées) se traversent d'autant plus vite sans toucher à leurs
    // chorégraphies.
    /* ⚠ DÉFILEMENT NATIF SI LE VISITEUR LE DEMANDE (audit du 2026-08-15).
       Lenis détourne la molette : c'est un mouvement imposé, et un mouvement
       imposé est précisément ce que `prefers-reduced-motion` vise — c'est un
       déclencheur vestibulaire classique, au même titre qu'un parallaxe.
       Le reste du site le respectait partout SAUF ici, c'est-à-dire à
       l'endroit qui touche chaque pixel de chaque page.
       On ne l'installe donc pas du tout, plutôt que de l'installer et de
       l'arrêter : `window.__lenis` reste indéfini, et les appelants
       (animatedScrollToId, la restauration au retour arrière, le hero) ont
       tous déjà leur repli en `window.scrollTo`. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.18,
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
    });
    (window as any).__lenis = lenis;

    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  // Scroll to top on initial page load / refresh
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingReady, setBookingReady] = useState(false);
  const [bookingFading, setBookingFading] = useState(false);
  // ── LE PARCOURS N'A PLUS QUE DEUX TEMPS (client 2026-08-19) ──────────────
  //  - "slots"    : la grille de créneaux, quatre par jour, un jour sur deux
  //  - "calendar" : l'embed Cal.com, ouvert SUR le jour choisi, qui confirme
  // Il en avait quatre : "qualifier" (quatre questions), "result" (récap),
  // "gift" (déjà court-circuitée depuis des semaines) puis "calendar". Les
  // trois écrans supprimés demandaient six clics avant de montrer la moindre
  // disponibilité, sur le seul chemin de conversion du site.
  type BookingPhase = "slots" | "calendar";
  const [bookingPhase, setBookingPhase] = useState<BookingPhase>("slots");
  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);

  /* ── LA MODALE EST UN VRAI DIALOGUE (audit du 2026-08-15) ─────────────────
     Elle n'en avait AUCUN des comportements attendus, et c'est le seul chemin
     de conversion du site : pas d'Escape, pas de piège de focus, pas de
     restauration du focus, pas de verrou de défilement, et un bouton de
     fermeture sans nom accessible. Un visiteur au clavier qui l'ouvrait devait
     tabuler jusqu'au bout pour en sortir ; un lecteur d'écran n'était pas
     informé qu'elle s'était ouverte et continuait de lire la page dessous.

     `bookingOpenerRef` retient l'élément qui a ouvert la fenêtre. Il y a cinq
     déclencheurs sur la page (nav, hero, Atlas, CTA final, pied de page) : sans
     cette mémoire, la fermeture rendrait le focus au corps du document et le
     lecteur repartirait du haut de la page, pas de l'endroit où il en était. */
  const bookingRef = useRef<HTMLDivElement>(null);
  const bookingOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isBookingOpen) return;

    // Verrou de défilement. Le décalage compense la disparition de la barre de
    // défilement, sans quoi toute la page saute de ~15 px à l'ouverture.
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    // Le focus entre dans la fenêtre, sur son premier élément atteignable.
    const SEL =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(bookingRef.current?.querySelectorAll<HTMLElement>(SEL) ?? []).filter(
        (el) => el.offsetParent !== null || el.tagName === "IFRAME",
      );
    const enter = window.setTimeout(() => focusables()[0]?.focus(), 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsBookingOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      // LE PIÈGE. Sans lui, la tabulation sort de la fenêtre et parcourt la
      // page restée vivante derrière le voile, y compris l'iframe du
      // calendrier, sans que rien ne le montre à l'écran.
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !bookingRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(enter);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      bookingOpenerRef.current?.focus?.();
      bookingOpenerRef.current = null;
    };
  }, [isBookingOpen]);

  const openBooking = () => {
    // L'élément actif AU MOMENT DU CLIC, avant que React ne rende la fenêtre.
    bookingOpenerRef.current = document.activeElement as HTMLElement | null;
    setIsBookingOpen(true);
    // Reset funnel state so each opening starts fresh
    setBookingPhase("slots");
    setBookingSlot(null);
    setBookingReady(false);
    setBookingFading(false);
  };

  /* Une heure cliquée dans la grille → l'embed Cal.com, ouvert sur ce jour-là.
     L'écran de chargement est RACCOURCI de 900 ms à 350 ms : il séparait deux
     écrans de lecture (récap puis calendrier) et laissait le temps de souffler,
     alors qu'il s'intercale maintenant entre un clic et sa conséquence directe.
     Une seconde et demie d'attente après un clic sur « 09:30 » se lit comme une
     panne, pas comme une transition. */
  const handlePickSlot = (slot: Slot) => {
    setBookingSlot(slot);
    setBookingPhase("calendar");
    setBookingReady(false);
    setBookingFading(false);
    setTimeout(() => {
      setBookingFading(true);
      setTimeout(() => setBookingReady(true), 300);
    }, 350);
  };

  // Retour à la grille depuis le calendrier. Il n'y a plus de flèche « précédent »
  // dans la colonne de droite (elle appartenait au questionnaire) : c'est le
  // créneau rappelé au-dessus de l'embed qui porte le retour.
  const handleSlotBack = () => {
    setBookingPhase("slots");
    setBookingSlot(null);
  };

  /* La note passée à Cal.com. Elle ne porte plus le contexte métier (il n'est
     plus demandé) mais LE CRÉNEAU CHOISI ICI, et c'est le point important :
     l'embed Cal ne peut être ouvert que sur un JOUR, pas sur une heure précise
     (sa config accepte `date` et `month`, pas d'horaire). Écrire l'heure dans
     les notes est ce qui permet de rattraper un visiteur qui, arrivé dans Cal,
     cliquerait une autre heure que celle qu'il vient de choisir. */
  const bookingNotes = bookingSlot
    ? lang === "fr"
      ? `Créneau choisi sur le site : ${bookingSlot.dayLabel} à ${bookingSlot.time}`
      : `Slot picked on the website: ${bookingSlot.dayLabel} at ${bookingSlot.time}`
    : "";



  const [page, setPage] = useState<Page>(() => getPageFromPath(window.location.pathname));
  const [notFoundKey, setNotFoundKey] = useState(0);

  /* ── LE TITRE ET LA DESCRIPTION SUIVENT LA PAGE ─────────────────────────
     Réécrits à chaque changement de page ET de langue. Le titre d'accueil est
     suffixé du nom du produit, les autres le sont aussi : « Tarifs » seul, dans
     un onglet ou un historique, n'apprend rien. La page d'accueil ne se suffixe
     pas deux fois, son titre porte déjà « Ora ».
     Le lien canonique suit la même route, sinon les quinze URL déclareraient
     toutes la racine comme canonique et Google les fondrait en une. */
  useEffect(() => {
    const meta = PAGE_META[page];
    const base = meta.title[lang];
    document.title = page === "home" ? `${base} | Ora Solution` : `${base} | Ora`;

    const setTag = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (!el) {
        el = document.createElement(selector.startsWith("link") ? "link" : "meta");
        if (selector.startsWith("link")) (el as HTMLLinkElement).rel = "canonical";
        else (el as HTMLMetaElement).name = "description";
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setTag('meta[name="description"]', "content", meta.desc[lang]);
    setTag('link[rel="canonical"]', "href", SITE + PAGE_TO_PATH[page]);
  }, [page, lang]);

  // Handle browser back / forward
  useEffect(() => {
    const onPopState = () => {
      const newPage = getPageFromPath(window.location.pathname);
      if (newPage === "not-found") setNotFoundKey((k) => k + 1);
      setPage(newPage);
      const lenis = (window as any).__lenis;
      if (lenis) {
        // Ensure Lenis isn't left stopped by Hero's scroll-lock state machine
        lenis.start();
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (target: Page) => {
    // Hidden pages always resolve to 404, even if a stray link points to them.
    if (target === "not-found" || HIDDEN_PAGES.has(target)) {
      setNotFoundKey((k) => k + 1);
      setPage("not-found");
      window.history.pushState({}, "", PAGE_TO_PATH["not-found"]);
      const lenis = (window as any).__lenis;
      if (lenis) { lenis.start(); lenis.scrollTo(0, { immediate: true }); }
      else window.scrollTo({ top: 0 });
      return;
    }
    if (target === page) return;
    setPage(target);
    window.history.pushState({}, "", PAGE_TO_PATH[target]);
    const lenis = (window as any).__lenis;
    if (lenis) {
      // Ensure Lenis isn't left stopped by Hero's scroll-lock state machine
      lenis.start();
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  // ── Nav ribbon → homepage sections (animated scroll, no hard redirect) ────
  // Two events flow in:
  //   • `ora:goto-industry` {id}  — Solutions menu: select a branch + scroll to
  //     the IndustrySelector (it owns the animated scroll on `ora:select-industry`).
  //   • `ora:goto-section`  {id}  — any other nav link: animated scroll to a
  //     section by element id.
  // If we're not on the homepage, we switch to it first and replay once mounted.
  const pendingNavRef = useRef<{ kind: "industry" | "section"; id: string } | null>(null);

  const fireNav = (kind: "industry" | "section", id: string) => {
    if (kind === "industry") {
      window.dispatchEvent(new CustomEvent("ora:select-industry", { detail: { id } }));
    } else {
      animatedScrollToId(id);
    }
  };

  useEffect(() => {
    const route = (kind: "industry" | "section", id?: string) => {
      if (!id) return;
      if (page === "home") fireNav(kind, id);
      else {
        pendingNavRef.current = { kind, id };
        navigateTo("home");
      }
    };
    const onIndustry = (e: Event) => route("industry", (e as CustomEvent).detail?.id);
    const onSection = (e: Event) => route("section", (e as CustomEvent).detail?.id);
    window.addEventListener("ora:goto-industry", onIndustry);
    window.addEventListener("ora:goto-section", onSection);
    return () => {
      window.removeEventListener("ora:goto-industry", onIndustry);
      window.removeEventListener("ora:goto-section", onSection);
    };
  }, [page]);

  // Once the homepage is back and mounted, replay a pending nav action.
  useEffect(() => {
    if (page !== "home" || !pendingNavRef.current) return;
    const { kind, id } = pendingNavRef.current;
    pendingNavRef.current = null;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => fireNav(kind, id)),
    );
    return () => cancelAnimationFrame(raf);
  }, [page]);

  /* THÈME VERROUILLÉ EN CLAIR (client 2026-08-18 : « enlève la possibilité de
     passer le site en nuit jour »). Ce n'est plus un état : plus de bascule
     dans la barre, plus de suivi de `prefers-color-scheme`, plus de lecture ni
     d'écriture de la clé 'ora-theme-v2'. La classe `.light` est posée par le
     script d'index.html, avant React, donc il n'y a rien à synchroniser ici.
     ⚠ LE TYPE RESTE LARGE, à dessein. `theme` descend en prop dans une
     quarantaine de composants qui testent `theme === "dark"` ; annoter la
     constante `"light"` littéral ferait de chacun de ces tests une comparaison
     que TypeScript juge impossible, et le build tomberait en cascade. On garde
     l'union : le jour où la bascule revient, cette ligne redevient un useState
     et rien d'autre ne bouge.
     L'assertion `as` n'est pas cosmétique : sur un `const` initialisé par un
     littéral, TypeScript rétrécit le type au littéral même quand l'union est
     annotée, et les `theme === "dark"` de ce fichier deviennent alors des
     erreurs « comparaison impossible ». L'assertion garde l'union. */
  const theme = "light" as "light" | "dark";

  const benefitsRef = useRef<HTMLElement | null>(null);
  const [_benefitsPhase, setBenefitsPhase] = useState<"problem" | "solution">("problem");




  /* Les deux effets de thème sont partis avec la bascule : l'un reposait
     `.light`/`.dark` à chaque changement d'état, l'autre écoutait
     `prefers-color-scheme` pour suivre le système en direct. Sans état à
     suivre ni préférence à honorer, ils n'avaient plus qu'à retirer et
     remettre la même classe. */

  // Benefits phase swap (problem -> solution) — rAF throttled
  const benefitsPhaseRef = useRef<"problem" | "solution">("problem");
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const section = benefitsRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      const start = viewportH * 0.8;
      const end = viewportH * 0.2;
      const raw = (start - rect.top) / (rect.height + start - end);
      const p = Math.min(1, Math.max(0, raw));

      const nextPhase: "problem" | "solution" = p > 0.4 ? "solution" : "problem";
      if (nextPhase !== benefitsPhaseRef.current) {
        benefitsPhaseRef.current = nextPhase;
        setBenefitsPhase(nextPhase);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // How it works timeline progress (fills the center line as you scroll) — rAF throttled





  return (
    <div
      className={`min-h-screen text-[#111827] dark:text-white transition-colors duration-300 ease-in-out ${theme === "light"
        ? "bg-[#ffffff]"
        : "bg-background"
        }`}
    >
      <style>{bubbleStyles}</style>

      {/* Global nav is hidden on the standalone client download page */}
      {page !== "telechargement" && (
        <Navigation
          theme={theme}
          onBookCall={() => openBooking()}
          currentPage={page}
          onNavigate={navigateTo}
        />
      )}

      {/* Le repli est VIDE, à dessein : les pages arrivent en quelques dizaines
          de millisecondes sur une connexion normale, et un écran de chargement
          qui clignote se remarque plus que l'attente qu'il masque. La barre de
          navigation, elle, est déjà montée au-dessus. */}
      <Suspense fallback={<div className="min-h-screen" />}>
      {page === "not-found" ? (
        <NotFoundPage key={notFoundKey} theme={theme} onNavigate={navigateTo} />
      ) : page === "for-business" ? (
        <ForBusinessPage theme={theme} openBooking={openBooking} />
      ) : page === "ora-experience" ? (
        <OraExperiencePage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "solution-template" ? (
        <SolutionTemplatePage theme={theme} openBooking={openBooking} />
      ) : page === "solution-expertise-comptable" ? (
        <SolutionExpertiseComptablePage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "solution-audit" ? (
        <SolutionAuditPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "solution-fonds-investissement" ? (
        <SolutionFondsInvestissementPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "solution-banque-affaires" ? (
        <SolutionBanqueAffairesPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "confidentialite" ? (
        <ConfidentialitePage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "pricing" ? (
        <PricingPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "mentions-legales" ? (
        <MentionsLegalesPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "politique-confidentialite" ? (
        <PolitiqueConfidentialitePage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "cgu" ? (
        <CGUPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "espace-client" ? (
        <EspaceClientPage theme={theme} onNavigate={navigateTo} openBooking={openBooking} />
      ) : page === "demo" ? (
        <DemoPage theme={theme} openBooking={openBooking} onNavigate={navigateTo} />
      ) : page === "telechargement" ? (
        <DownloadPage
          theme={theme}
          openBooking={openBooking}
          onNavigate={navigateTo}
        />
      ) : (
      <>

      {/* Right-edge scroll-spy nav removed at the client's request. */}

      {/* HERO — black section at the very top. Scroll-driven product demo
          (sticky scrub, fake Ora app + animated cursor) under the headline via
          OraHeroDemo. Swap back to <OraGallery> for the 6-video curved
          carousel once the real clips are ready. */}
      {/* Hero = démo scrollée RÉTABLIE (client 2026-07-29), mais elle OUVRE
          désormais sur l'interface du logiciel Ora, plus sur Excel. Le
          noircissement de fin de démo est conservé tel quel. */}
      <OraHeroDemo theme={theme} openBooking={openBooking} />

      {/* ExcelReveal — le défilement de phrases sur fond noir (« Votre temps
          est votre actif le plus précieux ») — RETIRÉ (client 2026-08-11 :
          « supprime la partie avec le texte / fond noir qui s'affiche et
          passe directement à Concrètement, ce qu'Ora peut automatiser »). Le
          composant et son wrapper `data-hero-bg` sont partis avec ; la
          bascule blanc→noir qu'OraHeroDemo pilotait sur ce wrapper (client
          2026-08-03) est retirée avec, voir OraHeroDemo.tsx. Le composant
          ExcelReveal.tsx reste dans le dépôt si on souhaite le remonter. */}

      {/* ── AUTOMATISATIONS, onglets pilotés au défilement ─────────────
          Réplique du bloc attio.com fourni en capture le 2026-08-12 : grand
          titre à deux encres, cadre à filets, colonne d'onglets à gauche
          portant les modules réels du logiciel. Le bloc s'épingle et les
          onglets avancent au défilement (client 2026-08-12).
          REMONTÉE ICI, au-dessus des deux encadrés plateforme + assistant
          (client 2026-08-12) : elle vivait sous la grille bento.
          ⚠ La zone de droite est VOLONTAIREMENT VIDE, le client la remplira
          lui-même. Voir l'en-tête d'AutomationTabs.tsx. */}
      <AutomationTabs theme={theme} openBooking={openBooking} />

      {/* ── « AUTOMATISEZ DE BOUT EN BOUT » A ÉTÉ RETIRÉE ────────────────
          Client 2026-08-15 : « enlève cette partie-là », le titre géant en
          trois lignes, les pastilles de formats, « Une seule chaîne, du
          document brut au livrable final » et son bouton compris.
          Le bloc disait ce que la section à onglets juste au-dessus dit déjà,
          en plus long : elle s'ouvre sur « Vos fichiers entrent, vos livrables
          sortent », elle montre les modules un par un, et ses pastilles de
          formats sont désormais en pied de son propre cadre. Deux annonces
          l'une derrière l'autre repoussaient la grille des cas d'usage d'un
          écran entier sans rien lui ajouter.
          Le conteneur `relative` part avec : il ne servait qu'à épingler les
          cartes empilées, retirées le 2026-08-14. La grille suit donc
          directement la section à onglets, et récupère dans son propre
          rembourrage haut l'air que ce conteneur lui donnait. */}

      {/* FEATURES — use-cases. Suit directement le CTA « Réserver un appel »
          de fin de hero, désormais clair (plus de bascule au noir).
          Padding généreux : donne à « Concrètement, ce qu'Ora peut
          automatiser » de l'air, comme avant. */}
      {/* FOND BLANC (client 2026-08-11 : « repasse le background en blanc »).
          Annule le #f5f7fd, un blanc très légèrement bleuté demandé le
          2026-08-07 pour que les cartes blanches de la grille se détachent du
          fond. On revient donc au #ffffff de la charte, qui n'était plus une
          exception à CLAUDE.md : les cartes ne se distinguent désormais que par
          leur liseré et leur ombre. Si elles paraissent trop fondues, épaissir
          leur liseré plutôt que reteinter la section. */}
      {/* ⚠ LE GRAND VIDE DU HAUT EST TOMBÉ (client 2026-08-15 : « remonte, mets
          moins d'espace »). Il valait 22 à 26 vh, soit près d'un quart d'écran,
          et il se justifiait tant que la section s'ouvrait sur son propre titre
          (« Concrètement, ce qu'Ora peut automatiser ») : il fallait de l'air
          au-dessus de ce titre. Le titre est parti le 2026-08-14, c'est
          désormais « Automatisez de bout en bout » qui coiffe la grille depuis
          le bloc du dessus — et deux blocs qui forment une seule idée ne se
          séparent pas par un quart d'écran de blanc. */}
      {/* ⚠ FOND `#fcfbf7` ET NON BLANC (audit du 2026-08-15). La charte prévoit
          DEUX fonds clairs qui alternent d'une section à l'autre, et le blanc
          cassé n'était employé nulle part : la page enchaînait sept sections
          claires en blanc pur, sans le rythme que cette alternance existe
          justement pour créer. Une section sur deux passe donc en blanc cassé,
          en commençant ici. Les cartes blanches de la grille y gagnent en plus
          un fond dont elles se détachent, ce qui était une demande du
          2026-08-07 réglée à l'époque en teintant le fond en bleu. */}
      {/* ⚠ BLANC PUR, ET C'EST UN ÉCART À LA RÈGLE D'ALTERNANCE (client
          2026-08-21 : « put the background of this part blank as it was
          before »). La section portait `#fcfbf7`, le blanc cassé chaud de la
          charte, et c'était son tour dans l'alternance de CLAUDE.md.
          Ce qui a été confondu, et qu'il faut garder en tête : les CARTES de
          cette grille sont blanches depuis toujours ; c'est le fond DERRIÈRE
          elles qui était crème. À deux blancs si proches, l'écart ne se voyait
          qu'aux bords des cartes, ce qui donnait l'impression d'un liseré sale
          plutôt que d'une alternance.
          Conséquence à surveiller : la section qui suit ouvre elle aussi sur du
          clair, l'alternance saute donc sur ce couple. Si le rythme des fonds
          est repris un jour, c'est ici qu'il faudra rétablir `#fcfbf7`. */}
      {/* ══ FUSIONNÉE AVEC LA SECTION AUTOMATISATION ═══════════════════════
          Client 2026-08-29 : « merge la partie automatisation avec les deux
          encadrés d'en dessous pour n'en faire qu'une seule partie commune ».

          Elles n'en faisaient déjà qu'une SUR LE FOND : la grille a perdu son
          propre titre le 2026-08-14, précisément parce qu'elle passe sous celui
          de l'automatisation (« deux titres à la suite disaient la même
          chose »). Ce qui restait, c'était une COUTURE VISUELLE : le cadre à
          filets d'AutomationTabs se refermait, 112 px de blanc, puis la grille
          repartait sans cadre, à une autre largeur.

          Trois choses la referment, et aucune ne touche aux composants :
            · le pas du haut tombe de 112 à 0 — les deux blocs se touchent ;
            · la grille reçoit LE MÊME cadre que les onglets, `max-w-[86rem]`
              avec ses filets verticaux, si bien que les deux traits courent
              sans interruption du titre jusqu'au bas de la grille ;
            · un filet horizontal marque la jointure : ce n'est plus une fin de
              section suivie d'un début, c'est un changement de mouvement à
              l'intérieur d'une même colonne.
          Le rembourrage latéral passe de la section au cadre, sinon il se
          compterait deux fois et la grille rentrerait de 48 px sur les onglets. */}
      <section id="features" className="relative pt-0 pb-0 bg-white dark:bg-black md:dark:bg-background">
        {/* Ambient blue/pink tints — pure radial gradients, NO blur filter
            (same perf rule as the experience section). The section is very
            tall, so blobs are sprinkled along it. Every ellipse fades to
            transparent BEFORE the edges (center ± 0.7×radius within 0-100%)
            so no hard line forms against adjacent sections. Content wrappers
            below are position:relative so they paint above this layer. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(34% 16% at 6% 5%, rgba(59,130,246,0.30) 0%, transparent 72%), radial-gradient(34% 16% at 94% 5%, rgba(59,130,246,0.30) 0%, transparent 72%), radial-gradient(50% 12% at 45% 28%, rgba(59,130,246,0.22) 0%, transparent 70%), radial-gradient(45% 12% at 85% 32%, rgba(59,130,246,0.22) 0%, transparent 70%), radial-gradient(55% 13% at 15% 58%, rgba(59,130,246,0.28) 0%, transparent 70%), radial-gradient(50% 12% at 50% 75%, rgba(59,130,246,0.20) 0%, transparent 70%), radial-gradient(45% 10% at 80% 88%, rgba(236,72,153,0.08) 0%, transparent 70%)"
                : "radial-gradient(34% 16% at 6% 5%, rgba(59,130,246,0.28) 0%, transparent 72%), radial-gradient(34% 16% at 94% 5%, rgba(59,130,246,0.28) 0%, transparent 72%), radial-gradient(50% 12% at 45% 28%, rgba(59,130,246,0.20) 0%, transparent 70%), radial-gradient(45% 12% at 85% 32%, rgba(59,130,246,0.21) 0%, transparent 70%), radial-gradient(55% 13% at 15% 58%, rgba(59,130,246,0.26) 0%, transparent 70%), radial-gradient(50% 12% at 50% 75%, rgba(59,130,246,0.18) 0%, transparent 70%), radial-gradient(45% 10% at 80% 88%, rgba(236,72,153,0.08) 0%, transparent 70%)",
            // Fade the tint layer in/out at the very top and bottom so its
            // edges never form a hard horizontal line against the adjacent
            // white sections (hero above, next section below).
            // Fade the tint in much lower so the top of this section stays
            // clean white — seamless with the white demo section above it (no
            // visible demarcation line).
            maskImage:
              "linear-gradient(to bottom, transparent 0, transparent 360px, #000 620px, #000 calc(100% - 200px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, transparent 360px, #000 620px, #000 calc(100% - 200px), transparent 100%)",
          }}
        />
        {/* Use cases — grille bento clonée sur stripe.com, en pervenche
            (UseCasesBento). Défilement normal : le mur de dézoom est parti
            avec l'ancien composant UseCases. `openBooking` alimente le CTA
            du panneau de présentation (la flèche de la carte FEC). */}
        <div className="px-6 md:px-12">
          <div className="mx-auto max-w-[86rem] border-x border-t border-[#0a2540]/[0.10] px-6 pt-16 dark:border-white/10 md:px-10 md:pt-24">
            <UseCasesBento openBooking={openBooking} />
          </div>
        </div>

        {/* Problem — « Votre Excel vous coûte plus que du temps » : masqué
            pour l'instant (à replacer ailleurs / en FAQ plus tard). Réactiver :
            décommenter cette ligne.
        <ProblemSection /> */}

        {/* Finance use-cases — masqué pour l'instant. Réactiver : décommenter
            l'import en haut, ce bloc, et l'entrée "cas-usage" dans SectionNav.
        <FinanceUseCases openBooking={openBooking} /> */}

        {/* ValuePropsFlip (FEC Studio) moved into the stacking wrapper below so
            the feature cards can rise up and cover it, one by one. */}
      </section>


      {/* ── PRÊT POUR L'ENTREPRISE — masqué pour l'instant. Réactiver :
          décommenter l'import en haut, ce bloc, et l'entrée "enterprise"
          dans SectionNav.
      <EnterpriseReady /> */}

      <AtlasShowcase openBooking={openBooking} />

      {/* La démo de l'assistant (ORA_demo_Assistant_six_usages) vivait ici,
          entre Atlas et le téléchargement, le temps d'une passe. Client
          2026-08-19 : « il faut que la vidéo soit juste en dessous de » la
          rangée des cinq capacités — elle est donc DANS AtlasShowcase, entre
          la scène d'ouverture et le carrousel, sur le noir continu. */}

      {/* ── « ORA SE TÉLÉCHARGE EN UN CLIC » ─────────────────────────────
          REMONTÉE ICI le 2026-08-15 (client : « mets juste en dessous la partie
          Ora se télécharge en un clic »), collée au bloc d'orchestration qui
          ferme AtlasShowcase et qui vient de repasser sur fond clair.
          Elle a voyagé quatre fois : au-dessus de la grille, dessous, en pied
          de page juste avant la FAQ, et ici. Cette place-ci a sa logique : les
          deux blocs parlent de MISE EN PLACE, l'un chez vous (le système
          d'orchestration), l'autre sur votre poste (le téléchargement), et ils
          se lisent d'affilée. Les fonds s'alternent comme le veut CLAUDE.md,
          `#fcfbf7` pour l'orchestration, blanc pur ici.
          ⚠ Hors de toute autre section : elle porte son propre
          `px-6 md:px-12`, imbriquée elle rentrerait deux fois. */}
      <PlatformShowcase openBooking={openBooking} />

      {/* La section « Nos technologies » (moteur déterministe / RPA natif /
          modèles locaux) a été retirée : le sujet RPA sera traité plus tard,
          ailleurs. Le composant reste dans OraTechnologies.tsx, prêt à être
          remonté ici le jour où on en reparle. */}

      {/* L'expérience Ora (carousel) + l'offre « tout inclus » ont été
          retirés pour l'instant. La section Industries prend leur place,
          juste après Atlas, sur fond sombre. */}

      {/* ── INDUSTRIES ───────────────────────────────────────────────── */}
      {/* Pick a field → see concrete automation examples → jump to the
          dedicated solution page.
          TEMPORAIREMENT MASQUÉ (pas fini) — repasser `false` à `true`. */}
      {false && <IndustrySelector theme={theme} openBooking={openBooking} />}

      {/* ── « VOS DONNÉES VOUS APPARTIENNENT » A ÉTÉ RETIRÉE ─────────────
          Client 2026-08-15 : « supprime la partie données vous appartiennent ».
          C'était PrivacyShowcase : la scène animée au défilement (le cadenas
          qui se ferme, le nuage qui arrive) et ses trois cartes de confiance.
          ⚠ LE SUJET N'EST PAS PERDU, et c'est ce qui rend le retrait tenable :
          « Contrôle total », juste en dessous, dit la même chose en six
          colonnes de texte, et la mention du traitement local court déjà dans
          les fiches des cartes et dans la FAQ. Les deux sections étaient
          collées depuis le 2026-08-05 précisément parce qu'elles se
          répétaient. PrivacyShowcase.tsx reste dans le dépôt, non monté. */}

      {/* ── CONTRÔLE TOTAL ───────────────────────────────────────────── */}
      {/* Réplique de la section monday.com du même nom, capture fournie : grand
          titre à gauche, six entrées sur trois colonnes, ni cartes ni aplats.
          DÉPLACÉE ici le 2026-08-05, juste sous « Vos données vous
          appartiennent » (elle était après la FAQ). Les deux sections disent la
          même chose sous deux formes, l'une en trois cartes chiffrées, l'autre
          en six colonnes de texte : les coller met le développement au contact
          de son titre, au lieu de le renvoyer en fin de page après une FAQ qui
          coupait le fil. C'est aussi pour ça que ControlShowcase porte
          désormais le MÊME fond que PrivacyShowcase, blanc pur ou noir pur : les
          deux doivent se lire comme une seule surface, sans couture. */}
      <ControlShowcase theme={theme} />

      {/* La section « Accompagnement » (SupportShowcase) qui vivait ici a été
          RETIRÉE le 2026-08-11 : le nouvel encadré « plateforme », monté plus
          haut avant « Concrètement, ce qu'Ora peut automatiser », reprend le
          même panneau, et le client a tranché contre le doublon.
          SupportShowcase.tsx reste dans le dépôt, non monté ; il porte le
          discours sur la prise en main et les rendez-vous week-ends compris,
          à replacer si on veut le rétablir. */}

      {/* ── FAQ — preempts finance/procurement objections ────────────── */}
      <FAQ />

      {/* ── CTA FINAL (Monday-style) ─────────────────────────────────── *
       *  Closing section : thin two-line headline (2nd line brand        *
       *  gradient), dual CTA, subtle grid + floating decorative cards.    *
       *  TEMPORAIREMENT MASQUÉ — repasser `false` à `true` pour réactiver. *
       * ───────────────────────────────────────────────────────────────── */}
      {false && (
      <section className="relative overflow-hidden px-6 md:px-12 pt-40 md:pt-56 pb-24 md:pb-32 min-h-[70vh] flex items-center bg-white dark:bg-black md:dark:bg-black">
        {/* Subtle grid, fading at the edges */}
        <div
          className="cta-grid absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(to right, ${
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.045)"
            } 1px, transparent 1px), linear-gradient(to bottom, ${
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.045)"
            } 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />

        {/* Ambient glow — pure radial gradient (no blur filter, which is
            expensive to repaint while scrolling and caused jank). */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[560px] rounded-full pointer-events-none"
          aria-hidden
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 72%)"
                : "radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 72%)",
          }}
        />

        {/* Floating decorative cards — desktop only */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none" aria-hidden>
          {[
            { pos: "top-[14%] left-[6%]",      delay: "0s",   icon: Zap,             label: t({ fr: "Automatisation lancée", en: "Workflow started" }) },
            { pos: "top-[18%] right-[7%]",     delay: "1.4s", icon: BarChart3,       label: t({ fr: "Rapport généré", en: "Report generated" }) },
            { pos: "bottom-[16%] left-[10%]",  delay: "2.1s", icon: FileSpreadsheet, label: t({ fr: "Excel mis à jour", en: "Excel updated" }) },
            { pos: "bottom-[14%] right-[9%]",  delay: "0.7s", icon: Mail,            label: t({ fr: "Envoi automatique", en: "Auto-sent" }) },
          ].map((c) => {
            const CardIcon = c.icon;
            return (
              <div
                key={c.pos}
                className={`cta-float absolute ${c.pos} rounded-2xl border shadow-lg px-4 py-3 flex items-center gap-3 ${
                  theme === "dark" ? "bg-white/[0.05] border-white/10" : "bg-white border-gray-200/70"
                }`}
                style={{ animationDelay: c.delay, willChange: "transform" }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-blue-500/25 to-teal-500/25"
                      : "bg-gradient-to-br from-blue-100 to-teal-100"
                  }`}
                >
                  <CardIcon className={`w-4 h-4 ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`} strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[11px] font-inter font-semibold tracking-tight ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                    {c.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#0d9488]" />
                    <div className={`h-1.5 w-6 rounded-full ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FadeInOnScroll>
            <h2 className="font-poppins font-light tracking-[-0.04em] leading-[1.06] text-4xl md:text-6xl text-[#111827] dark:text-white">
              <span className="block">
                {t({ fr: "Prenez une longueur d'avance sur", en: "Move faster than the competition with" })}
              </span>
              <span className="block text-brand-gradient">
                {t({ fr: "vos concurrents grâce à l'automatisation.", en: "automated Excel workflows." })}
              </span>
            </h2>
          </FadeInOnScroll>

          <FadeInOnScroll delay={120}>
            <p className="mt-7 mx-auto font-inter text-base md:text-lg leading-[1.7] max-w-xl text-gray-500 dark:text-gray-400">
              {t({
                fr: "Un appel simple, sans jargon. Vous nous décrivez votre quotidien, on identifie ce qu'Ora peut automatiser. Vous repartez avec un plan concret.",
                en: "A simple call, no jargon. You walk us through your day-to-day, we identify what Ora can automate. You leave with a concrete plan.",
              })}
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={220}>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={openBooking}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-inter font-semibold text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 bg-gradient-to-r from-[#3b82f6] to-[#0d9488] shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.5)]"
              >
                {t({ fr: "Réserver mon appel", en: "Get started" })}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-[3px] transition-transform duration-150" />
              </button>
              <button
                onClick={() => navigateTo("for-business")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-inter font-semibold border transition-all duration-150 hover:-translate-y-px active:translate-y-0 border-gray-300 text-[#111827] hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]"
              >
                {t({ fr: "Voir nos solutions", en: "View solutions" })}
              </button>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={300}>
            <p className="mt-5 text-[12px] text-gray-400 dark:text-gray-600">
              {t({ fr: "Gratuit · 30 minutes · Sans engagement", en: "Free · 30 minutes · No commitment" })}
            </p>
          </FadeInOnScroll>
        </div>
      </section>
      )}

      {/* ── CTA FINAL (provisoire) — un seul bouton centré, collé à la phrase
          "Ora, c'est automatiser sans renoncer à vos données" du pont. ──── */}
      {/* ⚠ CE BLOC N'AVAIT AUCUN TEXTE (audit du 2026-08-15) : un bouton nu au
          milieu d'une section vide, en dernier appel du site. Il était collé à
          une « phrase du pont » qui a été retirée depuis, et personne ne l'a
          remplacée. Deux encres comme partout ailleurs, et la promesse est
          celle de la modale, mot pour mot — le lecteur qui clique doit retrouver
          exactement ce qu'on vient de lui annoncer.
          ⚠ LE LIBELLÉ ANGLAIS ÉTAIT « Get started », déjà porté par le bouton du
          hero, qui mène AILLEURS (la démo en ligne). Deux boutons identiques en
          anglais pour deux destinations, sur la même page. */}
      {/* BLANC FRANC (client 2026-08-18 : « fais un background full white »).
          Le blanc cassé #fcfbf7 tenait ici son tour d'alternance, mais c'est le
          dernier appel du site : le bouton bleu y gagne le fond le plus neutre
          possible, et la bande blanche le détache de la section qui précède. */}
      {/* ⚠ LA PHRASE A ÉTÉ RETIRÉE (client 2026-08-19 : « remove the phrase
          Une demi-heure, sur vos propres fichiers… »). Elle disait, en deux
          encres : « Une demi-heure, sur vos propres fichiers. On regarde ce
          qui se répète chez vous, et on vous dit ce qu'Ora reprend. »
          ⚠ ET CELA REMET LE BLOC DANS L'ÉTAT QUE L'AUDIT DU 2026-08-15
          AVAIT SIGNALÉ : un bouton nu au milieu d'une section vide, en
          dernier appel du site. C'était la raison d'être de la phrase.
          Laissé ainsi À LA DEMANDE EXPRESSE DU CLIENT ; si le vide gêne un
          jour, la phrase est ici, mot pour mot, prête à revenir.
          Le pas du haut passe de pt-16/pt-8 à pt-24/pt-20 : sans titre,
          l'ancien blanc laissait le bouton coller au bord de section.
          ⚠ FUSION 2026-08-23 : cette branche avait REMIS EN FORME cette phrase
          pour le téléphone (seconde encre détachée à 15 px). La suppression de
          main est plus récente ET c'est une demande explicite du client : elle
          l'emporte, et la mise en forme part avec la phrase. Le rythme
          vertical est celui de main, calibré pour un bloc SANS titre — celui
          de cette branche (pt-12/pt-8) l'était pour un bloc qui en avait un.
          Ce qui survit de la branche : la gouttière de téléphone (px-5) et le
          bouton réduit sous md. Un appel de 48 px de haut en 18 px de corps
          sur une colonne de 350, c'est exactement ce que le client a renvoyé
          deux fois (« the buttons are way too big », 20/08 ; « bien plus petit
          et discret », 23/08). Les valeurs `md:` sont celles de main au
          pixel. */}
      <section className="relative px-5 md:px-12 pt-24 md:pt-20 pb-44 md:pb-56 bg-white dark:bg-black md:dark:bg-black">
        <div className="mx-auto max-w-[46rem] text-center">
          <button
            onClick={openBooking}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-[16px] font-inter font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 bg-[#3b82f6] hover:bg-[#2563eb] shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.55)] md:gap-3 md:px-12 md:py-6 md:text-xl"
          >
            {t({ fr: "Réserver mon appel", en: "Book my call" })}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" />
          </button>
        </div>
      </section>

      </>
      )}
      </Suspense>

      {/* Booking modal — portal, visible on all pages */}
      {isBookingOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 backdrop-blur-xl px-4 max-md:py-6 max-md:overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsBookingOpen(false); }}
        >
          {/* `role="dialog"` + `aria-modal` + `aria-labelledby` : sans eux, un
              lecteur d'écran annonce un groupe anonyme et continue d'exposer la
              page derrière. Le titre référencé est celui de la colonne de
              gauche, qui change avec la phase — c'est donc lui qui nomme la
              fenêtre à chaque étape, sans texte de plus à maintenir. */}
          <div
            ref={bookingRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="relative w-full max-w-3xl"
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl rounded-[28px] bg-white dark:bg-black md:dark:bg-black">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                aria-label={t({ fr: "Fermer", en: "Close" })}
                className="absolute right-5 top-5 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-5">
                {/* ══ LA COLONNE DE GAUCHE, REFAITE LE 2026-08-15 ═══════════
                    Client : « la partie appel est un peu bullshit et pas au
                    niveau design de ce que l'on fait ». Deux choses sautent.

                    1. L'APLAT BLEU. Un dégradé saturé sur deux cinquièmes de la
                       fenêtre, avec du texte blanc dessus, c'est la grammaire
                       des modales SaaS de 2019 ; ce n'est plus celle du site,
                       qui tient partout sur du blanc cassé, des filets d'un
                       pixel et UN accent bleu. La colonne prend donc le fond de
                       section de la charte (#fcfbf7 en clair, #111827 en
                       sombre) et un filet pour la séparer.
                    2. LES TROIS LIGNES DE RÉASSURANCE (horloge « 30 min ·
                       Gratuit », coche « Plan sur mesure », bouclier « Données
                       privées »), en pastilles blanches translucides. Elles
                       disaient trois généralités que n'importe quel éditeur
                       pourrait écrire, et c'est exactement ce que « bullshit »
                       désigne. À leur place : LE RAIL D'ÉTAPES, repris du rail
                       de la section à onglets — même graisse, même repère bleu,
                       même effacement des entrées inactives. Il fait un vrai
                       travail, dire où l'on en est et ce qui reste, là où les
                       pastilles n'en faisaient aucun.
                    Le « 30 min, gratuit, sans engagement » n'est pas perdu : il
                    passe en pied de colonne, en petit, une fois. */}
                <div className="md:col-span-2 flex flex-col justify-between overflow-hidden rounded-t-[26px] border-b border-[#0a2540]/[0.08] bg-[#fcfbf7] p-6 dark:border-white/10 dark:bg-[#111827] md:min-h-0 md:rounded-l-[26px] md:rounded-tr-none md:border-b-0 md:border-r md:p-8">
                  <div>
                    <img src="/logos/logo-color-dark.png" alt="Ora" className="h-7 w-auto dark:hidden" />
                    <img src="/logos/logo-color-light.png" alt="Ora" className="hidden h-7 w-auto dark:block" />

                    {/* Titre en Instrument Sans, comme tous les grands titres du
                        site depuis le 2026-08-12. Le Poppins semi-gras d'avant
                        appartenait à une autre génération de la page. */}
                    <h3 id="booking-title" className="mt-6 font-instrument text-[1.5rem] font-normal leading-[1.14] tracking-[-0.025em] text-[#111827] dark:text-white md:text-[1.7rem]">
                      {bookingPhase === "slots"
                        ? t({ fr: "Réservez un créneau.", en: "Book a slot." })
                        : t({ fr: "Confirmez votre créneau.", en: "Confirm your slot." })}
                    </h3>
                    {/* ⚠ PAS DE PROMESSE ICI, et c'est délibéré (client
                        2026-08-19 : « beaucoup plus straight to the point »).
                        Les deux phrases d'avant vendaient l'appel une seconde
                        fois — « on arrive avec un plan adapté à votre métier »
                        — alors que le visiteur qui a ouvert cette fenêtre est
                        déjà convaincu : il cherche une heure, pas un argument.
                        Ne reste que ce qui l'aide à choisir, la durée. */}
                    <p className="mt-3 font-inter text-[13.5px] leading-relaxed text-[#5b6577] dark:text-gray-400">
                      {bookingPhase === "slots"
                        ? t({
                            fr: "Choisissez une heure, c'est tout. 30 minutes en visio.",
                            en: "Pick a time, that's it. 30 minutes over video.",
                          })
                        : t({
                            fr: "Dernière étape : votre nom et votre e-mail.",
                            en: "Last step: your name and your email.",
                          })}
                    </p>
                  </div>

                  {/* LE RAIL D'ÉTAPES. Trois entrées, jamais cliquables : c'est
                      un repère, pas une navigation — revenir en arrière se fait
                      par la flèche de la colonne de droite, qui, elle, sait
                      quel état rétablir. Le filet vertical porte le repère bleu,
                      exactement comme dans AutomationTabs. */}
                  <div className="relative mt-8 hidden md:block">
                    <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-[#0a2540]/[0.10] dark:bg-white/10" />
                    <ul className="space-y-4">
                      {BOOKING_STEPS.map((st, i) => {
                        const idx = bookingPhase === "slots" ? 0 : 1;
                        const on = i === idx;
                        const done = i < idx;
                        return (
                          <li key={st.en} className="relative pl-4">
                            {on && (
                              <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] bg-[#3b82f6]" />
                            )}
                            <span
                              className={`block font-inter text-[13.5px] leading-tight transition-colors duration-200 ${
                                on
                                  ? "font-semibold text-[#111827] dark:text-white"
                                  : done
                                    ? "font-medium text-[#8b95a7] dark:text-gray-400"
                                    : "font-medium text-[#7a8496] dark:text-white/25"
                              }`}
                            >
                              {t(st)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-8 font-inter text-[11.5px] text-[#6b7688] dark:text-gray-500">
                      {t({ fr: "30 min, gratuit, sans engagement.", en: "30 min, free, no commitment." })}
                    </p>
                  </div>
                </div>

                {/* RIGHT — 2 phases: slots → calendar */}
                <div className="md:col-span-3 relative">
                  {bookingPhase === "slots" && <SlotPicker onPick={handlePickSlot} />}

                  {bookingPhase === "calendar" && (
                    <>
                      {/* Short loading transition between result and calendar */}
                      {!bookingReady && (
                        <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-black md:dark:bg-black ${bookingFading ? "booking-loading-screen fade-out" : ""}`}>
                          <OraLogoSpinner gradientId="g-booking" size={64} />
                          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                            {t({ fr: "Préparation de votre créneau...", en: "Preparing your slot..." })}
                          </p>
                        </div>
                      )}

                      <div
                        className={`p-2 md:p-3 overflow-y-auto transition-opacity duration-500 max-h-[68vh] md:max-h-[80vh] ${bookingReady ? "opacity-100" : "opacity-0"}`}
                      >
                        {/* LE CRÉNEAU CHOISI, RAPPELÉ ET REPRENABLE. Sans cette
                            barre, le visiteur passe d'une grille où il vient de
                            cliquer « 09:30 » à un calendrier Cal.com qui affiche
                            son propre mois : rien ne lui confirme que son choix
                            a été retenu, et rien ne lui permet d'en changer sans
                            fermer la fenêtre. C'est aussi le seul retour arrière
                            du parcours depuis que la flèche du questionnaire est
                            partie. */}
                        {bookingSlot && (
                          <div className="mb-2 flex items-center justify-between gap-3 rounded-[10px] border border-[#0a2540]/[0.10] bg-[#fcfbf7] px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                            <p className="font-inter text-[13px] leading-tight text-[#42506b] dark:text-gray-300">
                              <span className="font-semibold text-[#111827] first-letter:uppercase dark:text-white">
                                {bookingSlot.dayLabel}
                              </span>{" "}
                              {t({ fr: "à", en: "at" })} {bookingSlot.time}
                            </p>
                            <button
                              type="button"
                              onClick={handleSlotBack}
                              className="shrink-0 font-inter text-[13px] font-semibold text-[#3b82f6] transition-colors duration-150 hover:text-[#2563eb]"
                            >
                              {t({ fr: "Changer", en: "Change" })}
                            </button>
                          </div>
                        )}

                        {CAL_LINK ? (
                          <Cal
                            calLink={CAL_LINK}
                            style={{ width: "100%", height: "100%", overflow: "auto" }}
                            config={{
                              layout: "month_view" as const,
                              theme: theme === "dark" ? "dark" : "light",
                              lang: lang,
                              // ⚠ `date` + `month` OUVRENT CAL SUR LE JOUR CHOISI.
                              // L'embed n'accepte pas d'horaire, seulement une
                              // journée : l'heure exacte part dans `notes`
                              // (voir bookingNotes). Sans ces deux clés, Cal
                              // rouvrirait sur le mois courant et le clic que le
                              // visiteur vient de faire dans la grille ne
                              // servirait à rien.
                              ...(bookingSlot
                                ? { date: bookingSlot.iso, month: bookingSlot.iso.slice(0, 7) }
                                : {}),
                              notes: bookingNotes,
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
                            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                              <Clock className="w-7 h-7 text-blue-500" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {t({ fr: "Réservation bientôt disponible", en: "Booking coming soon" })}
                            </h4>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                              {t({
                                fr: "Notre système de prise de rendez-vous est en cours de configuration.",
                                en: "Our scheduling system is being set up right now.",
                              })}
                            </p>
                          </div>
                        )}

                        {/* Le même bouton qu'à l'étape du choix, pour qui
                            arrive ici et change d'avis. Composant partagé :
                            deux copies auraient divergé au premier mot. */}
                        <ContactDirect />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>,
        document.body
      )}


      {/* FOOTER — visible on all pages except the standalone download page */}
      {page !== "telechargement" && (
        <FadeInOnScroll>
          <OraFooter
            onNavigate={navigateTo}
            onBookCall={openBooking}
            theme={theme}
          />
        </FadeInOnScroll>
      )}

      <Analytics />
    </div>
  );
};

export default App;

