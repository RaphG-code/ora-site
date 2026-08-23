import { useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarClock, Download, Eye, EyeOff,
  FileSpreadsheet, FileText, LifeBuoy, Lock, LogOut, Mail, PauseCircle,
  PlayCircle, Users, Workflow,
} from "lucide-react";
import { useLang } from "../lib/i18n";

/**
 * EspaceClientPage — "Mon espace Ora", the client sign-in.
 * Premium split-screen: the form on the left, a brand panel on the right
 * (indigo card in the use-case-cards family, with the soft white round in
 * the corner).
 *
 * AUTH BYPASS, LOCAL DEV ONLY (client 2026-07-28): in `npm run dev`, any
 * credentials land on the placeholder in-page "space" view so the design can
 * be worked on. In the production build the form refuses access instead
 * ("réservé aux clients") until real authentication exists. Nothing is sent
 * anywhere and no session persists in either case.
 * The "not a client yet" block routes to the site's #1 action: booking.
 */

/* ══ Mise en scène de l'arrivée (client 2026-07-28) ══
   Tout entre en séquence au chargement — sinon « les gens ne comprennent pas
   qu'il y a quelque chose qui se passe ». Ordre : panneau de marque → titre →
   champs du formulaire → cartes flottantes. Ensuite, la page ne se fige
   jamais : les ronds dérivent largement et les cartes respirent. */
const EC_CSS = `
/* ── Arrivées ── */
@keyframes ecRise{from{opacity:0;transform:translate3d(0,22px,0)}
  to{opacity:1;transform:none}}
@keyframes ecPanelIn{from{opacity:0;transform:translate3d(46px,0,0) scale(.965)}
  to{opacity:1;transform:none}}
@keyframes ecCardIn{from{opacity:0;transform:translate3d(38px,18px,0) scale(.94)}
  to{opacity:1;transform:none}}
/* Les éléments animés partent invisibles : le mode both fige l'état initial
   pendant le délai, donc rien ne clignote avant son tour. */
.ec-rise{animation:ecRise 720ms cubic-bezier(.22,1,.36,1) both}
.ec-panel{animation:ecPanelIn 900ms cubic-bezier(.22,1,.36,1) both}

/* ── Ronds : dérive AMPLE et continue ── */
.ec-orb{animation:ecOrbFloat 14s ease-in-out infinite alternate}
.ec-orb2{animation:ecOrb2Float 17s ease-in-out infinite alternate}
/* Dérive AMPLE mais surtout latérale : le rond reste un accent de coin et ne
   remonte jamais assez pour effacer les cartes posées au-dessus de lui. */
@keyframes ecOrbFloat{
  0%{transform:translate3d(0,0,0) scale(1)}
  35%{transform:translate3d(-104px,-26px,0) scale(1.10)}
  70%{transform:translate3d(-58px,-46px,0) scale(1.02)}
  100%{transform:translate3d(64px,-14px,0) scale(.92)}}
@keyframes ecOrb2Float{
  0%{transform:translate3d(0,0,0) scale(1)}
  40%{transform:translate3d(92px,44px,0) scale(1.14)}
  75%{transform:translate3d(30px,84px,0) scale(1.02)}
  100%{transform:translate3d(-58px,58px,0) scale(.9)}}

/* ── Cartes flottantes : entrée décalée, puis respiration perpétuelle ── */
.ec-card{animation:ecCardIn 760ms cubic-bezier(.22,1,.36,1) both}
.ec-card .ec-cardin{display:block;animation:ecBob 7s ease-in-out infinite alternate}
.ec-card:nth-child(2) .ec-cardin{animation-duration:8.5s;animation-delay:-2s}
.ec-card:nth-child(3) .ec-cardin{animation-duration:9.5s;animation-delay:-4s}
@keyframes ecBob{from{transform:translate3d(0,-7px,0)}to{transform:translate3d(0,9px,0)}}

/* Point « en cours » qui pulse + barre de progression qui balaie */
.ec-dot{animation:ecPulse 1.9s ease-in-out infinite}
@keyframes ecPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.82)}}
.ec-bar{position:relative;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.22)}
.ec-bar i{position:absolute;inset:0;display:block;border-radius:999px;
  background:linear-gradient(90deg,rgba(255,255,255,.55),#fff);
  transform-origin:left center;animation:ecFill 3.4s cubic-bezier(.5,0,.3,1) infinite}
@keyframes ecFill{0%{transform:scaleX(.05)}70%{transform:scaleX(.86)}100%{transform:scaleX(.05)}}

/* Le bouton respire une fois l'entrée finie : la cible est évidente. */
.ec-cta{animation:ecCtaGlow 3.6s ease-in-out 2.2s infinite}
@keyframes ecCtaGlow{
  0%,100%{box-shadow:0 2px 12px rgba(59,130,246,.30)}
  50%{box-shadow:0 6px 26px rgba(59,130,246,.55)}}

@media (prefers-reduced-motion:reduce){
  .ec-orb,.ec-orb2,.ec-card,.ec-card .ec-cardin,.ec-rise,.ec-panel,
  .ec-dot,.ec-bar i,.ec-cta{animation:none}}
`;

type EspaceClientPageProps = {
  theme: "light" | "dark";
  onNavigate: (page: "home") => void;
  openBooking?: () => void;
};

export default function EspaceClientPage({ theme, onNavigate, openBooking }: EspaceClientPageProps) {
  const { t } = useLang();
  const [view, setView] = useState<"login" | "space">("login");
  const [userEmail, setUserEmail] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const logo = theme === "dark" ? "/logos/logo-color-light.png" : "/logos/logo-color-dark.png";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Bypass réservé au DÉVELOPPEMENT LOCAL (client 2026-07-28) : en local,
    // n'importe quels identifiants ouvrent l'espace de démonstration pour
    // pouvoir travailler le design. En production (`npm run build`), le
    // formulaire refuse toujours l'accès tant que la vraie authentification
    // n'existe pas. Aucune donnée ne quitte la page dans les deux cas.
    if (import.meta.env.DEV) {
      const email = (new FormData(e.currentTarget as HTMLFormElement).get("email") as string) || "";
      setUserEmail(email);
      setView("space");
      return;
    }
    setLoginError(
      t({
        fr: "L'accès à l'espace Ora est réservé aux clients. Contactez-nous pour ouvrir votre compte.",
        en: "Access to the Ora space is reserved for clients. Contact us to open your account.",
      }),
    );
  };

  // ── Demo dashboard (post-"login") ───────────────────────────────────
  if (view === "space") {
    return (
      <SpaceView
        userEmail={userEmail}
        onLogout={() => setView("login")}
        onNavigate={onNavigate}
        openBooking={openBooking}
      />
    );
  }

  const inputClass =
    "w-full h-11 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] pl-10 pr-3.5 font-inter text-[14px] text-[#111827] dark:text-white placeholder:text-gray-400 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-colors";

  return (
    <div className="min-h-screen flex bg-[#fcfbf7] dark:bg-black">
      {/* ── Left: sign-in form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-16">
        <style>{EC_CSS}</style>
        <div className="w-full max-w-[23rem] mx-auto">
          {/* Logo → home. Les délais échelonnent l'arrivée de haut en bas. */}
          <button
            onClick={() => onNavigate("home")}
            className="ec-rise block"
            style={{ animationDelay: "60ms" }}
            aria-label={t({ fr: "Retour à l'accueil", en: "Back home" })}
          >
            <img src={logo} alt="Ora" className="h-8 w-auto" />
          </button>

          <h1
            className="ec-rise mt-10 font-poppins font-semibold text-[1.75rem] tracking-[-0.02em] text-[#111827] dark:text-white"
            style={{ animationDelay: "140ms" }}
          >
            {t({ fr: "Mon espace Ora", en: "My Ora space" })}
          </h1>
          <p
            className="ec-rise mt-2 font-inter text-[14px] text-gray-500 dark:text-gray-400"
            style={{ animationDelay: "210ms" }}
          >
            {t({ fr: "Connectez-vous pour retrouver vos automatisations.", en: "Sign in to access your automations." })}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="ec-rise" style={{ animationDelay: "290ms" }}>
              <label htmlFor="ec-email" className="block font-inter text-[13px] font-semibold text-[#111827] dark:text-gray-200 mb-1.5">
                {t({ fr: "Email professionnel", en: "Work email" })}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="ec-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t({ fr: "vous@cabinet.fr", en: "you@firm.com" })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="ec-rise" style={{ animationDelay: "360ms" }}>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ec-pwd" className="block font-inter text-[13px] font-semibold text-[#111827] dark:text-gray-200">
                  {t({ fr: "Mot de passe", en: "Password" })}
                </label>
                <button type="button" className="font-inter text-[12.5px] font-medium text-[#3b82f6] hover:underline">
                  {t({ fr: "Mot de passe oublié ?", en: "Forgot password?" })}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="ec-pwd"
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={t({ fr: showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe", en: showPwd ? "Hide password" : "Show password" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ animationDelay: "430ms" }}
              className="ec-rise group relative w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] font-inter font-semibold text-[14.5px] text-white inline-flex items-center justify-center gap-2 hover:-translate-y-px active:translate-y-0 transition-all duration-150"
            >
              <span className="ec-cta absolute inset-0 rounded-xl" aria-hidden />
              {t({ fr: "Se connecter", en: "Sign in" })}
              <ArrowRight className="w-4 h-4 opacity-80 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            {loginError && (
              <p role="alert" className="font-inter text-[13px] font-medium leading-relaxed text-red-500">
                ✗ {loginError}
              </p>
            )}

          </form>

          {/* Not a client yet → the site's #1 action.
              Les deux portraits (client 2026-08-13 : « montrer qu'il y a un
              humain derrière ») accompagnent l'appel découverte dès l'écran de
              connexion — c'est celui que voient tous les visiteurs, connectés
              ou non. Mêmes fichiers que le bandeau de l'espace, en plus petit.
              ⚠ AGRANDIS DE 36 À 56 px le 2026-08-19 (client : « dans mon
              espace, agrandis la photo de nos deux têtes »). À 36 px les deux
              visages étaient à la limite du reconnaissable : la pile se lisait
              comme une pastille décorative, pas comme deux personnes, ce qui
              annulait la raison d'être même des portraits (« montrer qu'il y a
              un humain derrière »). Le chevauchement suit, de -8 à -12 px, et
              l'anneau de 2 à 3 px : à cette taille, un liseré de 2 px ne sépare
              plus assez nettement les deux têtes.
              Les fichiers source font 512 px, l'agrandissement ne coûte donc
              aucune netteté. */}
          <div
            className="ec-rise mt-9 pt-7 border-t border-gray-200/80 dark:border-white/[0.08]"
            style={{ animationDelay: "510ms" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 shrink-0">
                <img
                  src="/equipe/fondateur-1.png"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="h-14 w-14 rounded-full object-cover ring-[3px] ring-[#fcfbf7] dark:ring-black select-none"
                />
                <img
                  src="/equipe/fondateur-2.png"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="h-14 w-14 rounded-full object-cover ring-[3px] ring-[#fcfbf7] dark:ring-black select-none"
                />
              </div>
              <p className="font-inter text-[13.5px] leading-snug text-gray-500 dark:text-gray-400">
                {t({ fr: "Pas encore client ?", en: "Not a client yet?" })}{" "}
                <button
                  type="button"
                  onClick={openBooking ?? (() => onNavigate("home"))}
                  className="font-semibold text-[#3b82f6] hover:underline"
                >
                  {t({ fr: "Réservez un appel découverte", en: "Book a discovery call" })}
                </button>
                <span className="block text-[12.5px] text-gray-400 dark:text-gray-500">
                  {t({ fr: "Pour vous ou votre équipe, week-ends compris.", en: "For you or your team, weekends included." })}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("home")}
            style={{ animationDelay: "570ms" }}
            className="ec-rise mt-7 flex items-center gap-1.5 font-inter text-[13px] text-gray-500 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t({ fr: "Retour à l'accueil", en: "Back to home" })}
          </button>
        </div>
      </div>

      {/* ── Right: brand panel (desktop only). Starts below the fixed nav
          so the nav never sits on the indigo. ──────────────────────── */}
      <div className="hidden lg:flex w-[44%] p-4 pt-[84px]">
        <div className="ec-panel relative w-full rounded-[28px] overflow-hidden bg-[#5865E3] flex flex-col">
          {/* Soft white round, clipped into the bottom-right corner, kept
              well clear of the copy (use-case-cards family). Il DÉRIVE en
              continu (client 2026-07-28) : translation + léger gonflement,
              aller-retour lent. */}
          <div
            aria-hidden
            className="ec-orb pointer-events-none absolute -right-56 -bottom-[22rem] w-[34rem] h-[34rem] rounded-full"
            style={{ background: "radial-gradient(circle at 42% 40%,#ffffff,#eef3fc 62%,#e3eaf7)" }}
          />
          {/* Halo compagnon, en haut à gauche : dérive en sens inverse pour
              que le panneau respire sans jamais gêner le texte. */}
          <div
            aria-hidden
            className="ec-orb2 pointer-events-none absolute -left-40 -top-28 w-[26rem] h-[26rem] rounded-full"
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.20), rgba(255,255,255,0.06) 55%, transparent 72%)" }}
          />
          {/* Faint top light */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(80% 50% at 50% -10%, rgba(255,255,255,0.16) 0%, transparent 65%)" }}
          />

          <div className="relative p-10 xl:p-14">
            <h2
              className="ec-rise font-poppins font-semibold text-[2rem] xl:text-[2.4rem] leading-[1.15] tracking-[-0.02em] text-white max-w-md"
              style={{ animationDelay: "300ms" }}
            >
              {t({
                fr: "Toutes vos automatisations, au même endroit.",
                en: "All your automations, in one place.",
              })}
            </h2>
            <p
              className="ec-rise mt-4 font-inter text-[15px] leading-relaxed text-white/75 max-w-sm"
              style={{ animationDelay: "390ms" }}
            >
              {t({
                fr: "Votre espace client arrive bientôt : vos workflows, vos livrables et votre suivi, réunis.",
                en: "Your client space is coming soon: your workflows, deliverables and follow-up, together.",
              })}
            </p>

            {/* Aperçu vivant de l'espace : trois cartes de verre arrivent en
                cascade puis flottent en permanence, chacune sur son propre
                rythme. C'est ce qui donne envie d'entrer. Données fictives,
                même univers que la SpaceView (Groupe Méridian, Émeraude). */}
            <div className="mt-10 xl:mt-12 space-y-3.5 max-w-[22rem]">
              {[
                {
                  name: t({ fr: "Reporting mensuel", en: "Monthly reporting" }),
                  meta: t({ fr: "Groupe Méridian · livré ce matin", en: "Groupe Méridian · delivered this morning" }),
                  state: "done" as const,
                  delay: 620,
                },
                {
                  name: t({ fr: "Extraction PDF", en: "PDF extraction" }),
                  meta: t({ fr: "42 relevés bancaires", en: "42 bank statements" }),
                  state: "running" as const,
                  delay: 740,
                },
                {
                  name: t({ fr: "Pointage de comptes", en: "Account matching" }),
                  meta: t({ fr: "Dossier Émeraude · lundi 08:00", en: "Émeraude file · Monday 8:00 AM" }),
                  state: "scheduled" as const,
                  delay: 860,
                },
              ].map((card) => (
                <div key={card.name} className="ec-card" style={{ animationDelay: `${card.delay}ms` }}>
                  {/* Verre teinté indigo (et non blanc) : les cartes restent
                      lisibles même quand le rond blanc passe derrière elles. */}
                  <div className="ec-cardin rounded-2xl border border-white/20 bg-[#4650cf]/70 px-4 py-3.5 shadow-[0_14px_34px_-16px_rgba(15,23,42,.55)] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                        {card.state === "done" ? (
                          <FileSpreadsheet className="h-4 w-4" />
                        ) : card.state === "running" ? (
                          <Workflow className="h-4 w-4" />
                        ) : (
                          <CalendarClock className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-inter text-[13.5px] font-semibold text-white">{card.name}</p>
                        <p className="truncate font-inter text-[11.5px] text-white/65">{card.meta}</p>
                      </div>
                      {card.state === "done" && (
                        <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 font-inter text-[10.5px] font-semibold text-white">
                          {t({ fr: "Prêt", en: "Ready" })}
                        </span>
                      )}
                      {card.state === "running" && (
                        <span className="ec-dot h-2 w-2 shrink-0 rounded-full bg-white" />
                      )}
                    </div>
                    {card.state === "running" && (
                      <span className="ec-bar mt-3 block h-1">
                        <i />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SpaceView — the demo dashboard shown after the temporary auth bypass.
//  Everything here is DEMO DATA (same fictional universe as the homepage
//  mockups: Groupe Méridian, dossier Émeraude, FEC Studio). A visible
//  "Espace de démonstration" badge makes that explicit. Replace with real
//  data when the backend exists.
// ─────────────────────────────────────────────────────────────────────────────

function SpaceView({
  userEmail,
  onLogout,
  onNavigate,
  openBooking,
}: {
  userEmail: string;
  onLogout: () => void;
  onNavigate: (page: "home") => void;
  openBooking?: () => void;
}) {
  const { t } = useLang();

  const kpis = [
    { label: t({ fr: "Automatisations actives", en: "Active automations" }), value: "4", icon: Workflow },
    { label: t({ fr: "Exécutions ce mois", en: "Runs this month" }), value: "128", icon: PlayCircle },
    { label: t({ fr: "Livrables générés", en: "Deliverables generated" }), value: "36", icon: FileText },
    { label: t({ fr: "Prochaine exécution", en: "Next run" }), value: t({ fr: "Demain 07:00", en: "Tomorrow 7:00" }), icon: CalendarClock },
  ];

  const automations = [
    {
      name: t({ fr: "Reporting mensuel · Groupe Méridian", en: "Monthly reporting · Groupe Méridian" }),
      meta: t({ fr: "Planifié · chaque 1er du mois · dernière exécution le 1 juil. à 07:00", en: "Scheduled · 1st of each month · last run Jul 1, 7:00 AM" }),
      status: "active" as const,
    },
    {
      name: t({ fr: "Extraction PDF · Relevés bancaires", en: "PDF extraction · Bank statements" }),
      meta: t({ fr: "À la demande · dernière exécution hier à 16:24", en: "On demand · last run yesterday, 4:24 PM" }),
      status: "active" as const,
    },
    {
      name: t({ fr: "Pointage de comptes · Dossier Émeraude", en: "Account matching · Émeraude file" }),
      meta: t({ fr: "Hebdomadaire · lundi 08:00 · dernière exécution le 20 juil.", en: "Weekly · Monday 8:00 AM · last run Jul 20" }),
      status: "active" as const,
    },
    {
      name: t({ fr: "FEC Studio · Exercice 2025", en: "FEC Studio · Fiscal year 2025" }),
      meta: t({ fr: "À la demande · dernière exécution le 12 juil.", en: "On demand · last run Jul 12" }),
      status: "paused" as const,
    },
  ];

  const deliverables = [
    { name: "Reporting_Méridian_juin.xlsx", date: t({ fr: "12 juil.", en: "Jul 12" }), size: "412 Ko", kind: "xlsx" as const },
    { name: "Synthese_IDF_062026.pdf", date: t({ fr: "12 juil.", en: "Jul 12" }), size: "86 Ko", kind: "pdf" as const },
    { name: "Pointage_Emeraude_S29.xlsx", date: t({ fr: "20 juil.", en: "Jul 20" }), size: "264 Ko", kind: "xlsx" as const },
    { name: "FEC_2025_controles.xlsx", date: t({ fr: "1 juil.", en: "Jul 1" }), size: "1,2 Mo", kind: "xlsx" as const },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbf7] dark:bg-black px-6 pt-28 md:pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-poppins font-semibold text-[1.9rem] md:text-[2.2rem] tracking-[-0.02em] text-[#111827] dark:text-white">
                {t({ fr: "Bonjour", en: "Hello" })}
              </h1>
              <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/70 dark:border-blue-400/20 px-3 py-1 font-inter text-[11.5px] font-semibold text-[#3b82f6]">
                {t({ fr: "Espace de démonstration", en: "Demo space" })}
              </span>
            </div>
            <p className="mt-2 font-inter text-[14.5px] text-gray-500 dark:text-gray-400">
              {userEmail
                ? t({ fr: `Connecté en tant que ${userEmail}. `, en: `Signed in as ${userEmail}. ` })
                : ""}
              {t({
                fr: "Les données affichées sont fictives, votre espace réel arrive bientôt.",
                en: "The data shown is fictional, your real space is coming soon.",
              })}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-inter font-semibold text-[13.5px] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/15 hover:bg-gray-100/70 dark:hover:bg-white/[0.06] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t({ fr: "Se déconnecter", en: "Sign out" })}
          </button>
        </div>

        {/* ── KPI row ────────────────────────────────────────────── */}
        <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                  <Icon className="w-4 h-4" />
                  <span className="font-inter text-[12px] font-semibold uppercase tracking-[0.06em]">{k.label}</span>
                </div>
                <div className="mt-2.5 font-poppins font-semibold text-[1.5rem] tracking-[-0.02em] text-[#111827] dark:text-white">
                  {k.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Rendez-vous : des humains, quand vous voulez ─────────────────
            Client 2026-08-13 : « crée la possibilité pour nos clients de
            prendre un rendez-vous quand ils veulent, pour eux ou pour leur
            équipe », avec « deux ronds [les deux portraits fournis] pour
            montrer qu'il y a un humain derrière ».
            PHASE DESIGN assumée : les deux boutons ouvrent le MÊME Cal.com
            (openBooking). Le jour où un créneau « équipe » distinct existe,
            seul le onClick du second bouton change.
            Les portraits vivent dans public/equipe/ (fournis le 2026-08-13,
            réduits à 512 px). AUCUN nom ni rôle affiché : rien d'inventé, les
            visages suffisent à dire l'humain. Le chevauchement est séparé par
            un anneau couleur de carte, la grammaire habituelle des piles
            d'avatars. */}
        <div className="mt-6 relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-6 md:p-7">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(55% 150% at 0% 50%, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 45%, transparent 72%)" }}
          />
          <div className="relative flex flex-wrap items-center gap-5 md:gap-7">
            <div className="flex -space-x-4 shrink-0">
              <img
                src="/equipe/fondateur-1.png"
                alt={t({ fr: "Membre de l'équipe Ora", en: "Ora team member" })}
                draggable={false}
                className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-full object-cover ring-4 ring-white dark:ring-black shadow-[0_6px_18px_-6px_rgba(15,23,42,0.35)] select-none"
              />
              <img
                src="/equipe/fondateur-2.png"
                alt={t({ fr: "Membre de l'équipe Ora", en: "Ora team member" })}
                draggable={false}
                className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-full object-cover ring-4 ring-white dark:ring-black shadow-[0_6px_18px_-6px_rgba(15,23,42,0.35)] select-none"
              />
            </div>
            <div className="min-w-[230px] flex-1">
              <h2 className="font-poppins font-semibold text-[1.15rem] md:text-[1.25rem] tracking-[-0.01em] text-[#111827] dark:text-white">
                {t({ fr: "Un rendez-vous quand vous voulez", en: "A meeting whenever you want" })}
              </h2>
              <p className="mt-1.5 max-w-[54ch] font-inter text-[13.5px] md:text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">
                {t({
                  fr: "Vous parlez à ceux qui construisent Ora, pas à un support anonyme. Choisissez votre créneau, week-ends compris.",
                  en: "You talk to the people building Ora, not an anonymous help desk. Pick your slot, weekends included.",
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={openBooking ?? (() => onNavigate("home"))}
                className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] px-5 py-2.5 font-inter font-semibold text-[13.5px] text-white shadow-[0_2px_10px_rgba(59,130,246,0.25)] transition-all duration-150 hover:-translate-y-px"
              >
                <CalendarClock className="w-4 h-4" />
                {t({ fr: "Réserver pour moi", en: "Book for me" })}
              </button>
              <button
                type="button"
                onClick={openBooking ?? (() => onNavigate("home"))}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/15 px-5 py-2.5 font-inter font-semibold text-[13.5px] text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Users className="w-4 h-4" />
                {t({ fr: "Pour mon équipe", en: "For my team" })}
              </button>
            </div>
          </div>
        </div>

        {/* ── Main grid: automations + right column ──────────────── */}
        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
          {/* Automations */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
              <h2 className="font-poppins font-semibold text-[1.1rem] tracking-[-0.01em] text-[#111827] dark:text-white">
                {t({ fr: "Mes automatisations", en: "My automations" })}
              </h2>
              <span className="font-inter text-[12.5px] text-gray-400">{automations.length}</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {automations.map((a) => (
                <li key={a.name} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 shrink-0">
                    <Workflow className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-inter font-semibold text-[14px] text-[#111827] dark:text-white truncate">{a.name}</div>
                    <div className="mt-0.5 font-inter text-[12.5px] text-gray-500 dark:text-gray-400 truncate">{a.meta}</div>
                  </div>
                  {a.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 font-inter text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t({ fr: "Actif", en: "Active" })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 font-inter text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                      <PauseCircle className="w-3.5 h-3.5" />
                      {t({ fr: "En pause", en: "Paused" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: deliverables + support */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                <h2 className="font-poppins font-semibold text-[1.1rem] tracking-[-0.01em] text-[#111827] dark:text-white">
                  {t({ fr: "Derniers livrables", en: "Latest deliverables" })}
                </h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {deliverables.map((d) => (
                  <li key={d.name} className="flex items-center gap-3 px-6 py-3.5">
                    {d.kind === "xlsx" ? (
                      <FileSpreadsheet className="w-[18px] h-[18px] text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-[18px] h-[18px] text-red-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-inter font-medium text-[13px] text-[#111827] dark:text-white truncate">{d.name}</div>
                      <div className="font-inter text-[11.5px] text-gray-400">{d.date} · {d.size}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={t({ fr: "Télécharger (démo)", en: "Download (demo)" })}
                      title={t({ fr: "Indisponible en démo", en: "Unavailable in demo" })}
                      className="p-1.5 rounded-md text-gray-300 dark:text-gray-600 cursor-not-allowed shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support / new automation → booking */}
            <div className="rounded-2xl border border-blue-200/60 dark:border-blue-400/20 bg-blue-50/60 dark:bg-blue-500/[0.07] p-6">
              <div className="flex items-center gap-2.5 text-[#3b82f6]">
                <LifeBuoy className="w-[18px] h-[18px]" />
                <h2 className="font-poppins font-semibold text-[1.05rem] tracking-[-0.01em] text-[#111827] dark:text-white">
                  {t({ fr: "Une automatisation à ajouter ?", en: "An automation to add?" })}
                </h2>
              </div>
              <p className="mt-2 font-inter text-[13.5px] leading-relaxed text-gray-600 dark:text-gray-300">
                {t({
                  fr: "Décrivez votre workflow à l'équipe Ora Engineering, on s'occupe du reste.",
                  en: "Describe your workflow to the Ora Engineering team, we handle the rest.",
                })}
              </p>
              <button
                type="button"
                onClick={openBooking ?? (() => onNavigate("home"))}
                className="group mt-4 inline-flex items-center gap-2 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] px-5 py-2.5 font-inter font-semibold text-[13.5px] text-white shadow-[0_2px_10px_rgba(59,130,246,0.25)] transition-all duration-150 hover:-translate-y-px"
              >
                {t({ fr: "Réserver un appel", en: "Book a call" })}
                <ArrowUpRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate("home")}
          className="mt-10 flex items-center gap-1.5 font-inter text-[13px] text-gray-500 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t({ fr: "Retour à l'accueil", en: "Back to home" })}
        </button>
      </div>
    </div>
  );
}
