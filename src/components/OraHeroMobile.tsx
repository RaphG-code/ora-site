import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Bell, Check, ChevronRight, FileText, Globe, Plus, Sparkles,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * OraHeroMobile — the hero for phones (< 768px), rendered instead of the
 * scroll-driven <OraHeroDemo> scene.
 *
 * Why a separate component rather than scaling the desktop scene down: the
 * desktop scene is a fixed 1040x640 stage holding a 1180x720 replica of the
 * app. Fitting either into a 327px-wide phone column gives a scale of ~0.29,
 * which renders the app's 7-13.5px type at 2-4px. Cropping instead of scaling
 * does not save it: the replica's type only stays legible at scale ~1, and at
 * that scale a 327px window shows 28% of the interface width, i.e. a fragment
 * with no meaning.
 *
 * So the app is RECOMPOSED at phone width: same story, same copy, same
 * colours as OraAppScene, laid out full-width so every line is legible. Same
 * approach as OraExperienceCarousel, which already ships a distinct touch
 * branch instead of shrinking its desktop one.
 *
 * No simulated mouse cursor and no scroll scrub here: both are desktop
 * grammar. The story reads top to bottom, in one normal scroll.
 */

/** Files of the « Reprendre » list, same set as OraAppScene. */
const FILES: { name: string; meta: string; kind: "xlsx" | "txt"; state: "run" | "todo" }[] = [
  { name: "01_grand_livre_client_a_nettoyer", meta: "XLSX · il y a 7 h", kind: "xlsx", state: "run" },
  { name: "demo_petit_5k_2024_N_studio (2)", meta: "XLSX · il y a 7 h", kind: "xlsx", state: "todo" },
  { name: "FEC_demo_2024_398k_lignes (2)", meta: "XLSX · 20 juil.", kind: "xlsx", state: "todo" },
];

/**
 * Arrivée au MONTAGE, pas au `whileInView`. Deux raisons : c'est le hero, donc
 * tout est vu tout de suite ou presque, et surtout un `whileInView` qui ne
 * partirait pas laisserait le bloc à `opacity: 0`, c'est-à-dire un hero vide.
 * Même patron que le titre du hero desktop (OraHeroDemo).
 */
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function OraHeroMobile({ openBooking }: { openBooking: () => void }) {
  const { t } = useLang();

  /** Quick-access tiles: stacked full width instead of a 3-column grid. */
  const quick = [
    {
      icon: <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      tint: "bg-[#e8f0ff] text-[#2f6ff0]",
      title: t({ fr: "Nouveau projet", en: "New project" }),
      sub: "Deal PE, audit, M&A...",
    },
    {
      icon: <Globe className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      tint: "bg-[#f0ecfe] text-[#7c53e8]",
      title: t({ fr: "Tous les Atlas", en: "All Atlas" }),
      sub: t({ fr: "Liste de vos projets", en: "Your projects" }),
    },
    {
      icon: <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      tint: "bg-[#fef3e2] text-[#d97a06]",
      title: "Ora Engineering",
      sub: t({ fr: "Automatisation sur-mesure", en: "Custom automation" }),
    },
  ];

  /** What Ora gives back, told as a list instead of chips floating over the UI. */
  const outputs = [
    {
      icon: <BarChart3 className="h-[17px] w-[17px]" strokeWidth={2.2} />,
      tint: "bg-[#e8f0ff] text-[#2f6ff0]",
      title: t({ fr: "Reporting généré", en: "Report generated" }),
      sub: t({ fr: "Mis en forme, prêt à envoyer", en: "Formatted, ready to send" }),
    },
    {
      icon: <Check className="h-[17px] w-[17px]" strokeWidth={2.6} />,
      tint: "bg-[#f0ecfe] text-[#7c53e8]",
      title: t({ fr: "398 000 lignes contrôlées", en: "398,000 rows checked" }),
      sub: t({ fr: "Écritures atypiques repérées", en: "Unusual entries flagged" }),
    },
    {
      icon: <FileText className="h-[17px] w-[17px]" strokeWidth={2.2} />,
      tint: "bg-[#fef3e2] text-[#d97a06]",
      title: t({ fr: "Synthèse PDF", en: "PDF summary" }),
      sub: t({ fr: "Livrable final, en un clic", en: "Final deliverable, one click" }),
    },
  ];

  return (
    <div className="relative px-5 pt-24 pb-16">
      {/* Soft brand glow behind the phone card.
          ⚠ `max-w-full` : le commentaire d'origine la disait « clipped by the
          parent section », ce qui était faux — mesuré à 375 px, ce disque de
          420 px atteignait x = 398 et participait au débordement horizontal de
          la page. Rien ne la rognait. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] -z-10 h-[420px] w-[420px] max-w-full -translate-x-1/2 rounded-full opacity-70 dark:opacity-40"
        style={{ background: "radial-gradient(circle at 40% 35%, #ffffff, #eef2fb 62%, transparent 74%)" }}
      />

      {/* ── Titre ─────────────────────────────────────────────────────── */}
      <motion.div {...rise(0)} className="text-center">
        <span className="inline-flex items-center gap-2 font-instrument font-medium text-[15px] tracking-[-0.01em]">
          <img
            src="/logos/icon-color.png"
            alt=""
            aria-hidden
            className="h-[1.2em] w-auto select-none"
            draggable={false}
          />
          <span className="text-brand-gradient">
            {t({ fr: "Ora Solution en action", en: "Ora Solution in action" })}
          </span>
        </span>

        {/* Same face as the desktop hero (Instrument Sans, documented
            exception to the Poppins rule) so both read as one identity. */}
        {/* `antialiased` : même amaigrissement que le hero desktop, et pour la
            même raison — Instrument Sans n'a pas de graisse sous 400, le
            lissage en niveaux de gris est le seul levier. Voir le pavé dans
            OraHeroDemo.tsx. */}
        {/* h1 : c'est le titre de la page sur téléphone, le hero desktop
            étant masqué sous md. Voir le pavé d'OraHeroDemo. */}
        <h1 className="antialiased mt-3 font-instrument font-normal text-[clamp(2.05rem,9.4vw,2.9rem)] leading-[1.06] tracking-[-0.035em] text-[#111827] dark:text-white">
          {/* Seconde ligne en dégradé de marque (client 2026-08-11 : « repasse
              cela en bleu »), au mot et au traitement près comme le hero
              desktop, sinon mobile et desktop ne montrent plus le même
              titre. */}
          <span className="block">{t({ fr: "Plus de productivité,", en: "More productivity," })}</span>
          <span className="block text-brand-gradient">
            {t({ fr: "plus d'analyse, plus de conseil.", en: "more analysis, more advisory." })}
          </span>
        </h1>

        {/* Même phrase que le hero desktop, au mot près (voir le pavé
            d'OraHeroDemo : elle nomme le LOGICIEL, client 2026-08-18). */}
        <p className="mt-3.5 font-instrument font-normal text-[16.5px] leading-[1.45] text-gray-500 dark:text-gray-400">
          {t({
            fr: "Le logiciel qui reprend le répétitif comptable, pour rediriger votre temps vers le conseil.",
            en: "The software that takes over repetitive accounting work, redirecting your time to advisory.",
          })}
        </p>

        {/* Touch target kept at 52px tall. */}
        <a
          href="https://ora-solution.com/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[#3b82f6] px-8 font-inter font-semibold text-[16.5px] text-white shadow-[0_14px_32px_-12px_rgba(59,130,246,0.6)] active:bg-[#2f6fe0]"
        >
          {t({ fr: "Commencer", en: "Get started" })}
          <ArrowRight className="h-[18px] w-[18px]" />
        </a>

        {/* ⚠ MÊME RANGÉE DE PREUVE QUE LE HERO DE BUREAU (2026-08-21), au mot
            près : les deux doivent dire la même chose, c'est le même écran vu
            sur deux tailles. Voir le pavé de OraHeroDemo pour le détail des
            arbitrages — notamment pourquoi « 100 % EU » est devenu « Hébergé en
            Europe » (Genève n'est pas dans l'Union) et pourquoi « no LLM » n'y
            figure pas.
            Empilée et non sur une ligne : à cette largeur, la liste à « ✦ » du
            bureau se coupait n'importe où. La quatrième mention est donc
            abandonnée ici — quatre lignes de réassurance repousseraient la
            réplique du logiciel hors du premier écran. */}
        <ul className="mt-4 flex flex-col items-center gap-1.5 font-inter text-[13.5px] text-gray-400 dark:text-gray-500">
          {[
            t({ fr: "Hébergé en Europe, hors CLOUD Act", en: "Hosted in Europe, outside the CLOUD Act" }),
            t({ fr: "Chiffré sur votre appareil", en: "Encrypted on your device" }),
            t({ fr: "Même fichier, même résultat", en: "Same file, same result" }),
          ].map((line) => (
            <li key={line} className="flex items-center gap-1.5">
              <Check className="h-[13px] w-[13px] shrink-0 text-emerald-500" strokeWidth={3} />
              {line}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── La réplique du logiciel, recomposée à la largeur du téléphone ── */}
      <motion.div
        {...rise(0.08)}
        className="mt-10 overflow-hidden rounded-[20px] bg-white ring-1 ring-black/[0.06] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] dark:ring-white/10"
      >
        {/* Barre de fenêtre */}
        <div className="flex items-center gap-2 border-b border-[#ececef] bg-[#f7f7f8] px-3.5 py-2.5">
          <span className="flex gap-1.5">
            <i className="block h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
            <i className="block h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
            <i className="block h-[9px] w-[9px] rounded-full bg-[#28c840]" />
          </span>
          <span className="flex-1 text-center font-inter text-[12px] font-semibold text-[#3f4652]">Ora</span>
          <span className="w-[38px]" />
        </div>

        {/* En-tête applicatif */}
        <div className="flex items-center gap-2 border-b border-[#f0f0f2] px-4 py-3">
          <img src="/logos/logo-color-dark.png" alt="Ora" className="h-[19px] w-auto" draggable={false} />
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[#e6e7ea] px-2.5 py-1 font-inter text-[11.5px] font-semibold text-[#4b5160]">
            <Bell className="h-[13px] w-[13px]" strokeWidth={2.2} />
            <span className="inline-grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#2f6ff0] px-1 font-inter text-[10px] font-bold text-white">
              1
            </span>
          </span>
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#2f6ff0] font-inter text-[12.5px] font-bold text-white">
            T
          </span>
        </div>

        <div className="bg-[#fdfdfb] px-4 pb-5 pt-4">
          <p className="font-poppins text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[#111827]">
            {t({ fr: "Heureux de vous revoir", en: "Good to see you again" })}
          </p>
          <p className="mt-1 font-inter text-[12px] text-[#8b909b]">
            {t({ fr: "Mercredi 29 juillet", en: "Wednesday, July 29" })}
          </p>

          {/* Grande carte bleue, pleine largeur : le geste central du produit. */}
          <div
            className="mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3.5"
            style={{
              background: "linear-gradient(100deg,#2f6ff0,#3f7bf5 55%,#5b8cf8)",
              boxShadow: "0 16px 34px -16px rgba(47,111,240,.75)",
            }}
          >
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] bg-white/[0.22] text-white">
              <FileText className="h-[19px] w-[19px]" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <b className="block font-inter text-[15.5px] font-bold text-white">
                {t({ fr: "Ouvrir un fichier", en: "Open a file" })}
              </b>
              <span className="mt-0.5 block font-inter text-[12.5px] leading-snug text-white/[0.86]">
                {t({
                  fr: "Excel ou CSV, lancez vos automatisations en un clic",
                  en: "Excel or CSV, run your automations in one click",
                })}
              </span>
            </span>
          </div>

          <p className="mt-5 font-inter text-[10px] font-bold uppercase tracking-[0.11em] text-[#a0a4ad]">
            {t({ fr: "Accès rapide", en: "Quick access" })}
          </p>
          <div className="mt-2.5 flex flex-col gap-2">
            {quick.map((q) => (
              <div
                key={q.title}
                className="flex items-center gap-3 rounded-[13px] border border-[#eceef1] bg-white px-3.5 py-3"
              >
                <span className={`grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[10px] ${q.tint}`}>
                  {q.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block font-inter text-[13.5px] font-bold text-[#111827]">{q.title}</b>
                  <span className="block font-inter text-[11.5px] text-[#8b909b]">{q.sub}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#c3c6cd]" strokeWidth={2.2} />
              </div>
            ))}
          </div>

          <p className="mt-5 font-inter text-[10px] font-bold uppercase tracking-[0.11em] text-[#a0a4ad]">
            {t({ fr: "Reprendre", en: "Resume" })}
          </p>
          <div className="mt-2.5 overflow-hidden rounded-[13px] border border-[#eceef1] bg-white">
            {FILES.map((f, i) => (
              <div
                key={f.name}
                className={`flex items-center gap-3 px-3.5 py-2.5${i > 0 ? " border-t border-[#f4f5f7]" : ""}`}
              >
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] bg-[#e9f7ee] text-[#177245]">
                  <FileText className="h-[14px] w-[14px]" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-inter text-[12.5px] font-semibold text-[#111827]">{f.name}</b>
                  <span className="block font-inter text-[10.5px] text-[#9aa0aa]">{f.meta}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-inter text-[10.5px] font-semibold ${
                    f.state === "run" ? "bg-[#eaf1ff] text-[#2f6ff0]" : "bg-[#f3f4f6] text-[#7b8190]"
                  }`}
                >
                  {f.state === "run" ? t({ fr: "En cours", en: "Running" }) : t({ fr: "À faire", en: "To do" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── L'histoire entrée → sortie, en liste plutôt qu'en pastilles
             flottantes (elles se chevauchaient et devenaient illisibles). ── */}
      <motion.div {...rise(0.14)} className="mt-9">
        <p className="font-inter text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
          {t({ fr: "Vous déposez", en: "You drop in" })}
        </p>
        <div className="mt-2.5 flex items-center gap-3 rounded-[14px] bg-white px-3.5 py-3 ring-1 ring-black/[0.05] shadow-[0_8px_24px_-14px_rgba(15,23,42,0.3)] dark:bg-white/[0.04] dark:ring-white/10">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#e9f7ee] text-[#177245]">
            <FileText className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <b className="block font-inter text-[13.5px] font-bold text-[#111827] dark:text-white">
              balance_2025.xlsx
            </b>
            <span className="block font-inter text-[11.5px] text-gray-500 dark:text-gray-400">
              {t({ fr: "Déposé dans Ora", en: "Dropped into Ora" })}
            </span>
          </span>
        </div>

        <div className="my-3 flex justify-center" aria-hidden>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none" className="text-gray-300 dark:text-gray-600">
            <path d="M8 1v20m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="font-inter text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
          {t({ fr: "Ora vous rend", en: "Ora hands back" })}
        </p>
        <div className="mt-2.5 flex flex-col gap-2">
          {outputs.map((o) => (
            <div
              key={o.title}
              className="flex items-center gap-3 rounded-[14px] bg-white px-3.5 py-3 ring-1 ring-black/[0.05] shadow-[0_8px_24px_-14px_rgba(15,23,42,0.3)] dark:bg-white/[0.04] dark:ring-white/10"
            >
              <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] ${o.tint}`}>
                {o.icon}
              </span>
              <span className="min-w-0">
                <b className="block font-inter text-[13.5px] font-bold text-[#111827] dark:text-white">{o.title}</b>
                <span className="block font-inter text-[11.5px] text-gray-500 dark:text-gray-400">{o.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA de conversion : le but du site reste la prise de rendez-vous. */}
      <motion.button
        {...rise(0.2)}
        onClick={openBooking}
        className="mt-9 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-[#111827] px-8 font-inter font-semibold text-[16.5px] text-white active:bg-[#0b1220] dark:bg-white dark:text-[#111827]"
      >
        {t({ fr: "Réserver un appel", en: "Book a call" })}
        <ArrowRight className="h-[18px] w-[18px]" />
      </motion.button>
    </div>
  );
}
