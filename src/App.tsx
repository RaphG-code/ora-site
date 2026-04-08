import { useEffect, useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom"; // used for booking modal
import Lenis from "lenis";
import ForBusinessPage from "./pages/ForBusinessPage";
// === Subtle "bubble" animation for HOW IT WORKS steps ===
const bubbleStyles = `
/* === Page loading screen === */
@keyframes loaderPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes loaderBar {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes loaderFadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; visibility: hidden; }
}
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
}
.dark .loading-screen {
  background: #0a0a0a;
}
.loading-screen.fade-out {
  animation: loaderFadeOut 0.6s ease-out forwards;
}
.loading-logo {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  animation: loaderPulse 1.8s ease-in-out infinite;
}
.loading-bar-track {
  margin-top: 1.5rem;
  width: 120px;
  height: 3px;
  border-radius: 3px;
  background: rgba(0,0,0,0.06);
  overflow: hidden;
}
.dark .loading-bar-track {
  background: rgba(255,255,255,0.08);
}
.loading-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #38bdf8, #3b82f6);
  transform-origin: left;
  animation: loaderBar 1.2s ease-out forwards;
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

/* === Booking orb — animated glowing planet === */
@keyframes orbFloat {
  0%   { transform: translate(-40%, -48%) rotate(0deg) scale(1); }
  10%  { transform: translate(-38%, -52%) rotate(3deg) scale(1.03); }
  20%  { transform: translate(-44%, -56%) rotate(1deg) scale(1.01); }
  30%  { transform: translate(-36%, -50%) rotate(-2deg) scale(1.04); }
  40%  { transform: translate(-42%, -58%) rotate(2.5deg) scale(0.98); }
  50%  { transform: translate(-35%, -54%) rotate(-1deg) scale(1.02); }
  60%  { transform: translate(-43%, -46%) rotate(3.5deg) scale(1.01); }
  70%  { transform: translate(-37%, -52%) rotate(-2.5deg) scale(1.03); }
  80%  { transform: translate(-44%, -50%) rotate(1.5deg) scale(0.99); }
  90%  { transform: translate(-39%, -55%) rotate(-1.5deg) scale(1.02); }
  100% { transform: translate(-40%, -48%) rotate(0deg) scale(1); }
}
@keyframes orbSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orbShimmer {
  0%   { opacity: 0.35; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  25%  { opacity: 0.7; transform: translate(-47%, -53%) rotate(90deg) scale(1.06); }
  50%  { opacity: 0.45; transform: translate(-53%, -47%) rotate(180deg) scale(1.02); }
  75%  { opacity: 0.65; transform: translate(-48%, -51%) rotate(270deg) scale(1.04); }
  100% { opacity: 0.35; transform: translate(-50%, -50%) rotate(360deg) scale(1); }
}
@keyframes orbRingPulse {
  0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  25% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.05) rotate(2deg); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.10) rotate(0deg); }
  75% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.03) rotate(-2deg); }
}
@keyframes orbHaze {
  0%, 100% { opacity: 0.2; transform: translate(-30%, -40%) scale(1); }
  20% { opacity: 0.45; transform: translate(-22%, -48%) scale(1.12); }
  40% { opacity: 0.55; transform: translate(-35%, -42%) scale(1.05); }
  60% { opacity: 0.3; transform: translate(-28%, -50%) scale(1.15); }
  80% { opacity: 0.5; transform: translate(-33%, -36%) scale(1.08); }
}
@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(12px, -8px) rotate(1deg); }
  50% { transform: translate(-4px, -16px) rotate(-1deg); }
  75% { transform: translate(8px, -4px) rotate(0.5deg); }
}
@keyframes orbGlint {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-48%, -52%) scale(1.15); }
}

.booking-orb-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.booking-orb {
  position: absolute;
  top: 58%;
  left: 18%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  will-change: transform;
  animation: orbFloat 14s ease-in-out infinite;
  background:
    radial-gradient(circle at 34% 30%,
      rgba(255,255,255,0.97) 0%,
      rgba(220,240,255,0.90) 12%,
      rgba(170,215,250,0.80) 28%,
      rgba(120,190,245,0.72) 48%,
      rgba(80,160,235,0.68) 68%,
      rgba(50,130,215,0.75) 90%);
  box-shadow:
    0 0 50px 12px rgba(180,220,255,0.30),
    0 0 100px 40px rgba(200,230,255,0.12),
    inset 0 0 60px 15px rgba(255,255,255,0.65);
}
/* Bright highlight crescent (top-left lit edge) */
.booking-orb::before {
  content: '';
  position: absolute;
  top: 3%;
  left: 6%;
  width: 58%;
  height: 58%;
  border-radius: 50%;
  background: radial-gradient(ellipse at 30% 28%,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,0.70) 20%,
    rgba(240,250,255,0.30) 45%,
    transparent 70%);
  filter: blur(2px);
}
/* Soft white atmospheric rim */
.booking-orb::after {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(ellipse at 75% 80%,
    rgba(200,230,255,0.20) 0%,
    rgba(220,240,255,0.10) 40%,
    transparent 70%);
  filter: blur(12px);
  animation: orbDrift 9s ease-in-out infinite;
}
/* Slow-spinning surface texture */
.booking-orb-surface {
  position: absolute;
  inset: 2%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 25% 70%, rgba(180,220,255,0.10) 0%, transparent 45%);
  animation: orbSpin 30s linear infinite;
}
/* Light sweep across surface */
.booking-orb-shimmer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 125%;
  height: 125%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(255,255,255,0.25) 8%,
    transparent 18%,
    rgba(255,255,255,0.15) 35%,
    transparent 48%,
    rgba(255,255,255,0.20) 62%,
    transparent 75%,
    rgba(220,240,255,0.12) 88%,
    transparent 100%);
  animation: orbShimmer 8s linear infinite;
}
/* Outer atmospheric ring */
.booking-orb-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 135%;
  height: 135%;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  box-shadow:
    0 0 35px 6px rgba(200,230,255,0.10),
    inset 0 0 25px 4px rgba(255,255,255,0.06);
  animation: orbRingPulse 6s ease-in-out infinite;
}
/* Bright glint spot */
.booking-orb-glint {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255,255,255,0.60) 0%,
    rgba(255,255,255,0.15) 40%,
    transparent 70%);
  filter: blur(6px);
  animation: orbGlint 4s ease-in-out infinite;
}
/* Haze / bloom behind orb */
.booking-orb-haze {
  position: absolute;
  top: 50%;
  left: 10%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  transform: translate(-30%, -40%);
  background: radial-gradient(circle,
    rgba(200,230,255,0.35) 0%,
    rgba(180,220,250,0.12) 50%,
    transparent 80%);
  filter: blur(45px);
  animation: orbHaze 10s ease-in-out infinite;
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
`;
import Cal from "@calcom/embed-react";
import { Card } from "./components/ui/card";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import {
  Clock,
  Shield,
  CheckCircle2,
  X,
  Zap,
  TrendingUp,
  ShieldCheck,
  Phone,
} from "lucide-react";

// ← Replace with your Cal.com username/event-slug once your account is set up
// Example: "raphael-gaugain/discovery-call"
const CAL_LINK = "raphael-gaugain-cfjl0b/discovery-call";

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


// === Feature row: animates in dark mode, always visible in light mode ===
const FeatureRow = ({
  children,
  isReversed,
}: {
  children: ReactNode;
  isReversed: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("feat-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`feat-row grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center${isReversed ? " feat-row-reversed" : ""}`}
    >
      {children}
    </div>
  );
};

const App = () => {
  // Smooth scroll with inertia (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.15,
      smoothWheel: true,
      wheelMultiplier: 1.0,
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

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingReady, setBookingReady] = useState(false);
  const [bookingFading, setBookingFading] = useState(false);
  const [bookingLang, setBookingLang] = useState<"en" | "fr">("en");
  const [langSwitching, setLangSwitching] = useState(false);

  const bookingT = {
    en: {
      title: "Book a discovery call",
      desc: "Tell us what you want to automate. We'll review your workflows and follow up with the next steps.",
      time: "30 min · Free · No commitment",
      blueprint: "Tailored automation blueprint",
      privacy: "Your data stays private",
      langLabel: "Language",
    },
    fr: {
      title: "Réservez un appel découverte",
      desc: "Dites-nous ce que vous souhaitez automatiser. Nous analyserons vos processus et reviendrons vers vous avec les prochaines étapes.",
      time: "30 min · Gratuit · Sans engagement",
      blueprint: "Plan d'automatisation sur mesure",
      privacy: "Vos données restent privées",
      langLabel: "Langue",
    },
  } as const;

  const bk = bookingT[bookingLang];

  const openBooking = () => {
    setIsBookingOpen(true);
    setBookingReady(false);
    setBookingFading(false);
    setLangSwitching(false);
    setTimeout(() => {
      setBookingFading(true);
      setTimeout(() => setBookingReady(true), 500);
    }, 1000);
  };

  const switchBookingLang = (code: "en" | "fr") => {
    if (code === bookingLang) return;
    setLangSwitching(true);
    setTimeout(() => {
      setBookingLang(code);
      setTimeout(() => setLangSwitching(false), 1400);
    }, 300);
  };

  // Orb escape effect — planet moves away from cursor
  const orbRef = useRef<HTMLDivElement | null>(null);
  const orbWrapRef = useRef<HTMLDivElement | null>(null);
  const orbOffset = useRef({ x: 0, y: 0 });

  const handleOrbMouseMove = (e: React.MouseEvent) => {
    const wrap = orbWrapRef.current;
    const orb = orbRef.current;
    if (!wrap || !orb) return;

    const rect = wrap.getBoundingClientRect();
    // Cursor position relative to the wrap center
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Orb center position (approximate)
    const orbCx = rect.width * 0.18;
    const orbCy = rect.height * 0.58;

    const dx = orbCx - cx;
    const dy = orbCy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only react when cursor is within 200px of orb center
    if (dist < 200) {
      const strength = (1 - dist / 200) * 40;
      const angle = Math.atan2(dy, dx);
      orbOffset.current = {
        x: Math.cos(angle) * strength,
        y: Math.sin(angle) * strength,
      };
    } else {
      orbOffset.current = { x: orbOffset.current.x * 0.9, y: orbOffset.current.y * 0.9 };
    }

    orb.style.translate = `${orbOffset.current.x}px ${orbOffset.current.y}px`;
  };

  const handleOrbMouseLeave = () => {
    const orb = orbRef.current;
    if (!orb) return;
    orbOffset.current = { x: 0, y: 0 };
    orb.style.transition = "translate 0.6s ease-out";
    orb.style.translate = "0px 0px";
    setTimeout(() => { if (orb) orb.style.transition = ""; }, 600);
  };
  // Smooth scroll helper used by CTA buttons
  const scrollToSection = (id: string) => {
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.scrollTo(`#${id}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };



  const [page, setPage] = useState<"home" | "for-business">("home");

  const navigateTo = (target: "home" | "for-business") => {
    if (target === page) return;
    setPage(target);
    const lenis = (window as any).__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0 });
  };

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("theme");
    return stored === "dark" ? "dark" : "light";
  });

  const benefitsRef = useRef<HTMLElement | null>(null);
  const [_benefitsPhase, setBenefitsPhase] = useState<"problem" | "solution">("problem");
  const howItWorksRef = useRef<HTMLElement | null>(null);
  const [_howItWorksProgress, setHowItWorksProgress] = useState(0); // 0..1
  const howItWorksCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [_activeHowItWorksStep, setActiveHowItWorksStep] = useState(0);

  // Track active card + shrink animation on scroll (pure DOM, no React re-renders)
  const activeStepRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const totalCards = 4;
    const compute = () => {
      raf = 0;
      const section = howItWorksRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const sectionHeight = section.scrollHeight || section.offsetHeight;
      const scrolled = vh - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
      const step = Math.min(totalCards - 1, Math.floor(progress * totalCards));

      // Only update React state when the step actually changes
      if (step !== activeStepRef.current) {
        activeStepRef.current = step;
        setActiveHowItWorksStep(step);
      }

      // Shrink effect — pure DOM manipulation, no React overhead
      const cards = howItWorksCardRefs.current;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const inner = el.firstElementChild as HTMLElement | null;
        if (!inner) continue;
        const nextEl = cards[i + 1];
        if (!nextEl) {
          inner.style.transform = "scale3d(1,1,1)";
          inner.style.borderRadius = "28px";
          continue;
        }
        const nextRect = nextEl.getBoundingClientRect();
        const stickyTop = vh * 0.2;
        const raw = Math.max(0, Math.min(1, 1 - (nextRect.top - stickyTop) / (vh * 0.6)));
        const t = 1 - Math.pow(1 - raw, 2);
        const s = 1 - t * 0.06;
        const radius = 28 + t * 16;
        inner.style.transform = `scale3d(${s},${s},1)`;
        inner.style.borderRadius = `${radius}px`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
    };
  }, []);




  // Handle light / dark theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  // Spotlight mouse tracking (RAF-throttled to avoid layout thrashing)
  useEffect(() => {
    const spotlight = document.getElementById("cursor-spotlight");
    if (!spotlight) return;

    let rafId = 0;
    let mx = 0;
    let my = 0;

    const tick = () => {
      rafId = 0;
      spotlight.style.transform = `translate3d(${mx}px,${my}px,0)`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      spotlight.style.opacity = "1";
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const handleMouseLeave = () => {
      spotlight.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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
  const howItWorksProgressRef = useRef(-1);
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const section = howItWorksRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      const start = viewportH * 0.85;
      const end = viewportH * 0.15;
      const raw = (start - rect.top) / (rect.height + start - end);
      const p = Math.min(1, Math.max(0, raw));

      if (Math.abs(p - howItWorksProgressRef.current) > 0.01) {
        howItWorksProgressRef.current = p;
        setHowItWorksProgress(p);
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





  return (
    <div
      className={`min-h-screen text-[#111827] dark:text-white transition-colors duration-300 ease-in-out ${theme === "light"
        ? "bg-[#fcfbf7]"
        : "bg-background"
        }`}
    >
      <style>{bubbleStyles}</style>

      {/* Spotlight */}
      <div id="cursor-spotlight" className="cursor-spotlight" />

      <Navigation
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onBookCall={() => openBooking()}
        currentPage={page}
        onNavigate={navigateTo}
      />

      {page === "for-business" ? (
        <ForBusinessPage theme={theme} openBooking={openBooking} />
      ) : (
      <>

      <Hero
        theme={theme}
        scrollToSection={scrollToSection}
        openBooking={openBooking}
      />

      {/* FEATURES — alternating video + text rows */}
      <section id="features" className="relative -mt-16 pt-24 md:pt-32 pb-36 md:pb-56 px-6 md:px-12 bg-white dark:bg-background">
        <div className="max-w-6xl mx-auto space-y-36 md:space-y-52">
          {[
            {
              tag: "Reporting",
              title: "Monthly reports, generated in seconds",
              desc: "Ora pulls data from your tools, cleans it, applies your logic, and delivers pixel-perfect reports — ready to share. No more late nights formatting spreadsheets before the board meeting.",
              icon: TrendingUp,
              grad: "linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 50%, #f5f0ff 100%)",
              video: "/Montlhy_Repor.mov",
            },
            {
              tag: "Reconciliation",
              title: "Match thousands of rows without lifting a finger",
              desc: "Bank statements vs. invoices, CRM exports vs. billing — Ora cross-references your data sources, flags mismatches, and produces a clean reconciliation file every time.",
              icon: ShieldCheck,
              grad: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
            },
            {
              tag: "Data processing",
              title: "Raw data in, structured output out",
              desc: "CSVs, PDFs, emails — whatever the source, Ora extracts, normalizes, and routes your data exactly where it needs to go. Your team reviews results, not rows.",
              icon: Zap,
              grad: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fdf2f8 100%)",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isReversed = idx % 2 !== 0;

            return (
              <FeatureRow key={idx} isReversed={isReversed}>
                {/* Text side */}
                <div className={isReversed ? "lg:order-2" : ""}>
                  <div className="feat-child flex items-center gap-2.5 mb-5" style={{ "--feat-delay": "0ms" } as React.CSSProperties}>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/[0.08] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-500 dark:text-blue-400">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="feat-child text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.15]" style={{ "--feat-delay": "90ms" } as React.CSSProperties}>
                    {item.title}
                  </h3>
                  <p className="feat-child mt-5 text-base md:text-lg leading-relaxed text-gray-500 dark:text-gray-400 max-w-lg" style={{ "--feat-delay": "170ms" } as React.CSSProperties}>
                    {item.desc}
                  </p>
                </div>

                {/* Video side */}
                <div className={`feat-child${isReversed ? " lg:order-1" : ""}`} style={{ "--feat-delay": "60ms" } as React.CSSProperties}>
                  <div
                    className="rounded-[24px] overflow-hidden border border-gray-200/60 dark:border-white/[0.06]"
                    style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)" }}
                  >
                    {(item as typeof item & { video?: string }).video ? (
                      <video
                        src={(item as typeof item & { video?: string }).video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full aspect-[16/10] object-cover"
                      />
                    ) : (
                      <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center">
                        <div className="relative z-10 flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 shadow-lg flex items-center justify-center cursor-pointer">
                            <svg className="w-6 h-6 text-blue-500 dark:text-blue-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Watch demo</span>
                        </div>
                        <div
                          className="absolute inset-0 opacity-60 dark:opacity-30"
                          style={{ background: item.grad }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </FeatureRow>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS — sticky stacking cards */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className="relative -mt-16 pt-0 pb-24 md:pb-32 px-6 md:px-12 bg-white dark:bg-background"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <FadeInOnScroll direction="up" delay={0}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                The Ora experience
              </h2>
            </FadeInOnScroll>
            <FadeInOnScroll direction="up" delay={150}>
              <p className="text-lg max-w-3xl mx-auto text-gray-500 dark:text-gray-300">
                A simple process from discovery to deployment.
              </p>
            </FadeInOnScroll>
          </div>
        </div>

        {/* Sticky stacking cards — each slides up over the previous */}
        <div className="relative" style={{ paddingBottom: "30vh" }}>
          {[
            {
              label: "Discovery call",
              desc: "We review your Excel processes, files, and bottlenecks with your team.",
              step: "Step 1",
            },
            {
              label: "Blueprint",
              desc: "We map triggers, inputs, outputs, edge cases — you validate the plan.",
              step: "Step 2",
            },
            {
              label: "Build & connect",
              desc: "We connect to your existing tools and test everything on real data.",
              step: "Step 3",
            },
            {
              label: "Launch & optimise",
              desc: "We deploy, monitor live usage, refine — then scale to new workflows.",
              step: "Step 4",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              ref={(el) => { howItWorksCardRefs.current[idx] = el; }}
              className="sticky"
              style={{
                top: "20vh",
                zIndex: 10 + idx,
                marginBottom: "12vh",
              }}
            >
              <div
                className="max-w-6xl mx-auto w-full rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] origin-center"
                style={{
                  background: "radial-gradient(circle at center, #1F5BFF 0%, #174AE6 55%, #123EC4 100%)",
                  willChange: "transform, border-radius",
                  transform: "translateZ(0)",
                  contain: "layout style paint",
                }}
              >
                <div className="text-center px-8 pt-7 pb-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">{card.step}</span>
                  <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold text-white">{card.label}</h3>
                  <p className="mt-1.5 text-sm md:text-base text-white/60 max-w-lg mx-auto">{card.desc}</p>
                </div>
                <div className="px-5 pb-4">
                  <div className="w-full aspect-[2.5/1] rounded-[18px] bg-black/20 border border-white/10 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <p className="text-white/30 text-xs">Video</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isBookingOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xl px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsBookingOpen(false); }}
        >
          {/* Ora loading splash */}
          {!bookingReady && (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-background ${bookingFading ? "loading-screen fade-out" : ""}`}>
              <span className="loading-logo text-gradient" style={{ fontSize: "3rem" }}>Ora</span>
              <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Preparing your booking...</p>
              <div className="loading-bar-track mt-5" style={{ width: "140px" }}>
                <div className="loading-bar-fill" />
              </div>
            </div>
          )}

          <div className={`relative w-full max-w-3xl transition-all duration-500 ${bookingReady ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <Card className="relative overflow-hidden border-0 shadow-2xl rounded-[28px] bg-white dark:bg-background">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="absolute right-5 top-5 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-5">
                {/* LEFT — Brand panel with glowing orb */}
                <div className="md:col-span-2 relative bg-gradient-to-br from-[#eaf4fd] via-[#d4ecfc] to-[#c0e2fa] p-6 md:p-7 flex flex-col justify-between text-gray-900 overflow-hidden min-h-[240px] md:min-h-0">
                  {/* Glowing planet orb */}
                  <div
                    className="booking-orb-wrap"
                    ref={orbWrapRef}
                    onMouseMove={handleOrbMouseMove}
                    onMouseLeave={handleOrbMouseLeave}
                    style={{ pointerEvents: "auto" }}
                  >
                    <div className="booking-orb-haze" />
                    <div className="booking-orb" ref={orbRef}>
                      <div className="booking-orb-surface" />
                      <div className="booking-orb-shimmer" />
                      <div className="booking-orb-glint" />
                      <div className="booking-orb-ring" />
                    </div>
                  </div>

                  {/* Content on top of orb */}
                  <div className="relative z-10">
                    <span className="text-3xl font-bold tracking-tight text-blue-primary">Ora</span>
                    <h3 className="mt-6 text-2xl md:text-3xl font-semibold leading-tight text-gray-900">
                      {bk.title}
                    </h3>
                    <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                      {bk.desc}
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm border border-blue-200/50">
                        <Clock className="w-4 h-4 text-blue-primary" />
                      </div>
                      <span className="text-sm text-gray-700">{bk.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm border border-blue-200/50">
                        <CheckCircle2 className="w-4 h-4 text-blue-primary" />
                      </div>
                      <span className="text-sm text-gray-700">{bk.blueprint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm border border-blue-200/50">
                        <Shield className="w-4 h-4 text-blue-primary" />
                      </div>
                      <span className="text-sm text-gray-700">{bk.privacy}</span>
                    </div>
                  </div>

                  {/* Language picker */}
                  <div className="relative z-10 mt-6">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-2">{bk.langLabel}</p>
                    <div className="flex gap-2">
                      {([
                        { code: "en", flag: "🇬🇧", label: "English" },
                        { code: "fr", flag: "🇫🇷", label: "Français" },
                      ] as const).map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => switchBookingLang(lang.code)}
                          className={[
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                            bookingLang === lang.code
                              ? "bg-white border-blue-300 text-gray-900 shadow-sm"
                              : "bg-white/40 border-transparent text-gray-500 hover:bg-white/70",
                          ].join(" ")}
                        >
                          <span className="text-sm leading-none">{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT — Cal.com embed */}
                <div className="md:col-span-3 relative p-2 md:p-3 overflow-y-auto" style={{ maxHeight: "80vh" }}>
                  {/* Ora logo overlay during language switch */}
                  {langSwitching && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-background rounded-r-[28px]">
                      <span className="text-gradient font-bold tracking-tight" style={{ fontSize: "2.5rem" }}>Ora</span>
                    </div>
                  )}
                  {CAL_LINK ? (
                    <Cal
                      key={bookingLang}
                      calLink={CAL_LINK}
                      style={{ width: "100%", height: "100%", overflow: "auto" }}
                      config={{
                        layout: "month_view" as const,
                        theme: theme === "dark" ? "dark" : "light",
                        lang: bookingLang,
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
                      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                        <Clock className="w-7 h-7 text-blue-500" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Booking coming soon
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        Our scheduling system is being set up. Please check back shortly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>,
        document.body
      )}

      {/* DISCOVER ORA */}
      <FadeInOnScroll>
        <div className="py-16 md:py-24 px-6 lg:px-10 bg-white dark:bg-[#020617]">
          <div className="max-w-5xl mx-auto">
            <div
              className="w-full rounded-[32px] flex items-center justify-center border border-gray-200/70 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.03]"
              style={{ minHeight: "420px" }}
            >
              <p className="text-2xl md:text-4xl font-light tracking-[-0.02em] text-center px-8 text-gray-400 dark:text-white/50">
                Discover Ora Unlimited Engineering Solution
              </p>
            </div>
          </div>
        </div>
      </FadeInOnScroll>

      {/* FOOTER */}
      <FadeInOnScroll>
        <footer className="py-12 px-6 md:px-12 bg-white dark:bg-black border-t border-border/20 text-gray-600 dark:text-gray-light">
          <div className="max-w-7xl mx-auto text-center">© 2026 Ora – Paris • Luxembourg</div>
        </footer>
      </FadeInOnScroll>

      {/* Floating phone button */}
      <button
        onClick={openBooking}
        aria-label="Book a call"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_4px_20px_rgba(14,165,233,0.4)] hover:shadow-[0_6px_28px_rgba(14,165,233,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
      >
        <Phone className="w-5 h-5" />
      </button>

      </>
      )}

    </div>
  );
};

export default App;

