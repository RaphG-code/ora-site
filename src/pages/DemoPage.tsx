import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Download, Lock, RefreshCcw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import AutomationCarousel, { SelectedAutomationCard } from "@/components/demo/AutomationCarousel";
import ComingSoonModal from "@/components/demo/ComingSoonModal";
import DropZone from "@/components/demo/DropZone";
import FormModal from "@/components/demo/FormModal";
import PreviewWindow from "@/components/demo/PreviewWindow";
import RunView from "@/components/demo/RunView";
import SentView from "@/components/demo/SentView";
import DeliveryView from "@/components/demo/DeliveryView";
import OraWorkbench from "@/components/demo/workbench/OraWorkbench";
import { getAutomation } from "@/components/demo/data";
import {
  DemoApiError,
  claimDemoJob,
  createDemoJob,
  getJobPreview,
  getJobStatus,
  type DemoJob,
  type DemoLead,
  type JobStatus,
  type PreviewData,
} from "@/components/demo/demoApi";

// Online demo funnel (/demo), preview-first flow:
//   pick automation -> drop file -> anonymous run -> Excel-window preview
//   -> "download" opens the lead form popup (claim: credit + magic link)
//   -> check-your-inbox -> magic link -> delivery (/demo?ml=<job_id>).
//
// The page talks to ora-demo-service (or its browser mock, see demoApi.ts).

type Props = {
  theme: "light" | "dark";
  openBooking: () => void;
  onNavigate: (page: "home" | "politique-confidentialite") => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Ronds animés du fond. Deux disques flous, deux trajectoires fermées de
 *  durées différentes : ils ne repassent jamais en phase, donc le mouvement ne
 *  se lit jamais comme une boucle. `blur` + `transform` uniquement, tout est
 *  composité par le GPU. Coupés en mouvement réduit. */
const DEMO_ORB_CSS = `
.demo-orb{position:absolute;left:50%;border-radius:9999px;filter:blur(78px);will-change:transform}
.demo-orb-a{top:-180px;width:660px;height:660px;margin-left:-330px;
  background:radial-gradient(circle at 50% 50%,rgba(59,130,246,.30),rgba(59,130,246,0) 68%);
  animation:demoOrbA 24s ease-in-out infinite}
.demo-orb-b{top:150px;width:520px;height:520px;margin-left:-260px;
  background:radial-gradient(circle at 50% 50%,rgba(13,148,136,.22),rgba(13,148,136,0) 68%);
  animation:demoOrbB 31s ease-in-out infinite}
.dark .demo-orb-a{background:radial-gradient(circle at 50% 50%,rgba(59,130,246,.34),rgba(59,130,246,0) 68%)}
.dark .demo-orb-b{background:radial-gradient(circle at 50% 50%,rgba(13,148,136,.26),rgba(13,148,136,0) 68%)}
@keyframes demoOrbA{
  0%{transform:translate3d(-140px,0,0) scale(1)}
  30%{transform:translate3d(90px,60px,0) scale(1.14)}
  62%{transform:translate3d(160px,-40px,0) scale(.94)}
  100%{transform:translate3d(-140px,0,0) scale(1)}}
@keyframes demoOrbB{
  0%{transform:translate3d(180px,40px,0) scale(1.06)}
  35%{transform:translate3d(-120px,-30px,0) scale(.9)}
  70%{transform:translate3d(-40px,90px,0) scale(1.18)}
  100%{transform:translate3d(180px,40px,0) scale(1.06)}}
@media (prefers-reduced-motion:reduce){.demo-orb{animation:none}}
`;

function readMagicLinkParam(): string | null {
  return new URLSearchParams(window.location.search).get("ml");
}

/** Sur-titre discret. Les pastilles bleues cernées ont été retirées (client
 *  2026-07-30) : elles alourdissaient chaque écran. Reste une ligne de texte
 *  espacée, qui laisse le titre porter seul. */
function StepBadge({ label }: { label: string }) {
  return (
    <span className="font-inter text-[11.5px] font-medium uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
      {label}
    </span>
  );
}

/** Horizontal 3-step trail (Choose · Drop · Download) shown at the top of the
 *  funnel stage — replaces the isolated "Étape N" badge so the visitor sees
 *  the WHOLE journey and where they stand in it (layout redesign 2026-07-28). */
function StepTrail({ active, labels }: { active: 1 | 2 | 3; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-5">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < active;
        const current = n === active;
        return (
          <div key={label} className="flex items-center gap-3 md:gap-5">
            {i > 0 && <span aria-hidden className="h-px w-9 bg-gray-200 md:w-16 dark:bg-white/10" />}
            <span className="inline-flex items-center gap-2.5">
              {/* Monochrome : l'étape courante est simplement la plus contrastée.
                  Le bleu était réservé aux boutons, en mettre ici brouillait la
                  hiérarchie de la page. */}
              <span
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full font-inter text-[11px] font-semibold transition-colors duration-300 ${
                  current
                    ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827]"
                    : done
                      ? "bg-gray-200 text-gray-500 dark:bg-white/15 dark:text-gray-300"
                      : "border border-gray-200 text-gray-300 dark:border-white/15 dark:text-gray-600"
                }`}
              >
                {n}
              </span>
              <span
                className={`font-inter text-[13px] transition-colors duration-300 ${
                  current
                    ? "font-semibold text-[#111827] dark:text-white"
                    : "font-medium text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DemoPage({ theme, openBooking, onNavigate }: Props) {
  const { t } = useLang();
  const dk = theme === "dark";
  // EXCEPTION assumée à l'alternance de CLAUDE.md sur cette page (client
  // 2026-07-30) : le beige #fcfbf7 est refusé ici, et l'alternance de fonds
  // aussi. UN SEUL fond, blanc pur, du haut de la page jusqu'en bas. Le relief
  // ne vient plus des bandes de couleur mais des ombres portées des cartes.
  const bg = dk ? "#111827" : "#ffffff";

  // Magic-link landing (delivery space) vs the funnel itself.
  const [mlJobId, setMlJobId] = useState<string | null>(() => readMagicLinkParam());

  const [phase, setPhase] = useState<"funnel" | "processing" | "preview" | "sent">("funnel");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Annonce d'ouverture de la web app (client 2026-08-03). Tant qu'elle n'est pas
  // ouverte, choisir une automatisation n'enclenche PAS le parcours de test : on
  // affiche la date et le compte à rebours. `setSelectedKey` reste en place, il
  // suffira de rebrancher `onSelect` dessus le jour de l'ouverture.
  const [annonce, setAnnonce] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [job, setJob] = useState<DemoJob | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lead, setLead] = useState<DemoLead | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number>(0);

  const previewFetched = useRef(false);
  const automation = getAutomation(selectedKey);

  const scrollTop = useCallback(() => {
    const lenis = (window as any).__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0 });
  }, []);

  // Keep the delivery view in sync with browser back/forward on /demo?ml=...
  useEffect(() => {
    const onPop = () => setMlJobId(readMagicLinkParam());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The magic-link redirect appends the Supabase session as a URL fragment
  // (#access_token=...). It is not used yet: scrub it so the token never
  // lingers in the address bar or browser history. When download-auth
  // enforcement lands, capture the session here before scrubbing.
  useEffect(() => {
    if (mlJobId && window.location.hash.includes("access_token")) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search
      );
    }
  }, [mlJobId]);

  // If the visitor switches automation, drop a file that is no longer valid.
  useEffect(() => {
    if (!automation || !file) return;
    const ext = (file.name.toLowerCase().match(/\.[^.]+$/) ?? [""])[0];
    if (!automation.accepts.includes(ext)) setFile(null);
  }, [automation, file]);

  // Poll the job while processing; swap to the preview once it completes.
  useEffect(() => {
    if (phase !== "processing" || !job) return;
    let cancelled = false;
    let timer: number | undefined;
    const tick = async () => {
      try {
        const s = await getJobStatus(job.jobId);
        if (cancelled) return;
        setStatus(s);
        if (s.status === "done") {
          if (s.previewReady && !previewFetched.current) {
            previewFetched.current = true;
            try {
              const p = await getJobPreview(job.jobId);
              if (!cancelled) setPreview(p);
            } catch {
              // Preview unavailable: the fallback card still allows claiming.
            }
          }
          if (!cancelled) {
            setPhase("preview");
            scrollTop();
          }
          return;
        }
        if (s.status === "running") timer = window.setTimeout(tick, 800);
      } catch {
        if (!cancelled) timer = window.setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [phase, job, scrollTop]);

  const handleLaunch = async () => {
    if (!file || !automation || launching) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const created = await createDemoJob({ file, automationKey: automation.key });
      previewFetched.current = false;
      setPreview(null);
      setJob(created);
      setStatus(null);
      setPhase("processing");
      scrollTop();
    } catch (err) {
      if (err instanceof DemoApiError && err.code === "rate_limited") {
        setLaunchError(t({
          fr: "Limite d'essais atteinte pour aujourd'hui depuis votre connexion. Revenez demain, ou réservez une démo complète.",
          en: "Daily trial limit reached from your connection. Come back tomorrow, or book a full demo.",
        }));
      } else if (err instanceof DemoApiError && err.code === "file_too_large") {
        setLaunchError(t({
          fr: "Fichier trop volumineux (50 Mo maximum).",
          en: "File too large (50 MB max).",
        }));
      } else {
        setLaunchError(t({
          fr: "Le service de démonstration est injoignable. Réessayez dans un instant.",
          en: "The demo service is unreachable. Try again in a moment.",
        }));
      }
    } finally {
      setLaunching(false);
    }
  };

  const handleClaim = async (submitted: DemoLead) => {
    if (!job || claiming) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await claimDemoJob(job.jobId, submitted);
      setLead(submitted);
      setCreditsLeft(res.creditsLeft);
      setModalOpen(false);
      setPhase("sent");
      scrollTop();
    } catch (err) {
      if (err instanceof DemoApiError && err.code === "no_credits") {
        setClaimError(t({
          fr: "Cette adresse a épuisé ses 5 fichiers offerts. Réservez une démo pour aller plus loin.",
          en: "This address has used its 5 free files. Book a demo to go further.",
        }));
      } else {
        setClaimError(t({
          fr: "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez.",
          en: "Submission failed. Check your connection and try again.",
        }));
      }
    } finally {
      setClaiming(false);
    }
  };

  const openDelivery = (jobId: string) => {
    window.history.pushState({}, "", `/demo?ml=${jobId}`);
    setMlJobId(jobId);
    scrollTop();
  };

  const restart = () => {
    window.history.pushState({}, "", "/demo");
    setMlJobId(null);
    setPhase("funnel");
    setSelectedKey(null);
    setFile(null);
    setLaunchError(null);
    setJob(null);
    setStatus(null);
    setPreview(null);
    setModalOpen(false);
    setClaimError(null);
    setLead(null);
    previewFetched.current = false;
    scrollTop();
  };

  // ── Magic-link landing: the delivery space ────────────────────────────────
  if (mlJobId) {
    return (
      <div className="min-h-screen px-6 pb-24 pt-36 md:px-12" style={{ backgroundColor: bg }}>
        <DeliveryView jobId={mlJobId} openBooking={openBooking} onRestart={restart} />
      </div>
    );
  }

  // ── Processing screen: anonymous run in progress ──────────────────────────
  if (phase === "processing" && job && automation) {
    const failed = status?.status === "error";
    return (
      <div className="min-h-screen px-6 pb-24 pt-36 md:px-12" style={{ backgroundColor: bg }}>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <StepBadge label={t({ fr: "Lancement réussi", en: "Run started" })} />
          <h1 className="mt-6 font-instrument text-[clamp(2.1rem,4vw,3.2rem)] font-normal leading-[1.05] tracking-[-0.04em] text-[#111827] dark:text-white">
            {t({ fr: "Ora travaille pour vous", en: "Ora is working for you" })}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-inter text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
            {t({
              fr: "Quelques instants : l'aperçu de votre fichier s'affichera automatiquement.",
              en: "A few moments: the preview of your file will appear automatically.",
            })}
          </p>
        </div>
        {status && <RunView automation={automation} job={job} status={status} />}
        {failed && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-7 py-3.5 font-inter text-[15px] font-semibold text-white shadow-[0_2px_12px_rgba(59,130,246,0.30)] transition-all duration-150 hover:-translate-y-px hover:bg-[#2563eb] active:translate-y-0"
            >
              <RefreshCcw size={16} />
              {t({ fr: "Réessayer avec un autre fichier", en: "Try again with another file" })}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Preview: the Excel window + the download CTA ──────────────────────────
  if (phase === "preview" && job && automation) {
    return (
      <div className="min-h-screen px-6 pb-24 pt-36 md:px-12" style={{ backgroundColor: bg }}>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <StepBadge label={t({ fr: "Traitement terminé", en: "Run complete" })} />
          <h1 className="mt-6 font-instrument text-[clamp(2.1rem,4vw,3.2rem)] font-normal leading-[1.05] tracking-[-0.04em] text-[#111827] dark:text-white">
            {t({ fr: "Votre fichier est prêt", en: "Your file is ready" })}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-inter text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
            {t({
              fr: "Parcourez l'aperçu ci-dessous, feuille par feuille. Le fichier complet (tableaux croisés dynamiques vivants, graphiques natifs, formules) vous attend au téléchargement.",
              en: "Browse the preview below, sheet by sheet. The full file (live pivot tables, native charts, formulas) awaits at download.",
            })}
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {preview ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <PreviewWindow preview={preview} />
            </motion.div>
          ) : (
            <div className="mx-auto max-w-xl rounded-[24px] border border-gray-200/60 bg-white p-10 text-center dark:border-white/[0.06] dark:bg-white/[0.02]">
              <p className="font-inter text-[14.5px] leading-relaxed text-gray-500 dark:text-gray-400">
                {t({
                  fr: "L'aperçu n'est pas disponible pour ce fichier, mais votre résultat est bien prêt au téléchargement.",
                  en: "No preview is available for this file, but your result is ready to download.",
                })}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setClaimError(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-8 py-4 font-inter text-[15.5px] font-semibold text-white shadow-[0_2px_12px_rgba(59,130,246,0.30)] transition-all duration-150 hover:-translate-y-px hover:bg-[#2563eb] hover:shadow-[0_4px_24px_rgba(59,130,246,0.40)] active:translate-y-0"
            >
              <Download size={17} />
              {t({ fr: "Télécharger le fichier complet", en: "Download the full file" })}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-inter text-[12.5px] text-gray-400 dark:text-gray-500">
              <Lock size={13} />
              {t({
                fr: "Gratuit : 5 fichiers offerts par adresse email, lien envoyé par email.",
                en: "Free: 5 files per email address, link sent by email.",
              })}
            </p>
          </div>
        </div>

        <FormModal
          open={modalOpen}
          submitting={claiming}
          error={claimError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleClaim}
          onOpenPrivacy={() => onNavigate("politique-confidentialite")}
        />
      </div>
    );
  }

  // ── Email sent: the magic link gates the download ─────────────────────────
  if (phase === "sent" && job && lead) {
    return (
      <div className="min-h-screen px-6 pb-24 pt-36 md:px-12" style={{ backgroundColor: bg }}>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <StepBadge label={t({ fr: "Dernière étape", en: "Final step" })} />
          <h1 className="mt-6 font-instrument text-[clamp(2.1rem,4vw,3.2rem)] font-normal leading-[1.05] tracking-[-0.04em] text-[#111827] dark:text-white">
            {t({ fr: "Votre fichier arrive", en: "Your file is on its way" })}
          </h1>
        </div>
        <SentView
          email={lead.email}
          creditsLeft={creditsLeft}
          onResend={async () => {
            await claimDemoJob(job.jobId, lead);
          }}
          onSimulateMagicLink={() => openDelivery(job.jobId)}
        />
      </div>
    );
  }

  // ── The funnel ────────────────────────────────────────────────────────────
  const stepLabels = [
    t({ fr: "Choisissez", en: "Choose" }),
    t({ fr: "Déposez", en: "Drop" }),
    t({ fr: "Téléchargez", en: "Download" }),
  ];
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: bg }}>
      <style>{DEMO_ORB_CSS}</style>
      {/* HERO — refonte minimaliste (client 2026-07-30). Trois partis pris :
          fond blanc pur, aucune pastille cernée, et le TITRE porte seul. La
          fonte d'affichage est celle de la page d'accueil (Instrument Sans en
          graisse normale), pas Poppins : c'est la même exception documentée
          que pour « Automatisez de bout en bout ». Beaucoup d'air au-dessus,
          une seule couleur d'accent, et la ligne de réassurance reprend le
          séparateur ✦ de la page d'accueil. */}
      {/* Ronds bleus vivants, posés DERRIÈRE le hero ET la carte (client
          2026-07-30 : « ça fait trop flat, peut-être un rond bleu qui
          s'anime »). Deux disques très flous qui dérivent et respirent
          lentement, l'un bleu, l'autre teal, en décalage de phase : le fond
          blanc bouge en permanence sans jamais devenir un décor. Couche
          purement décorative, hors du flux et non cliquable. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[1180px] overflow-hidden">
        <span className="demo-orb demo-orb-a" />
        <span className="demo-orb demo-orb-b" />
      </div>

      <section className="relative px-6 pb-14 pt-36 text-center md:px-12 md:pb-16 md:pt-44">
        <div className="relative mx-auto max-w-4xl">
          <span className="font-inter text-[11.5px] font-medium uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
            {t({ fr: "Démo interactive", en: "Interactive demo" })}
          </span>

          <h1 className="mt-6 font-instrument text-[clamp(2.5rem,6vw,4.75rem)] font-normal leading-[1.02] tracking-[-0.04em] text-[#111827] dark:text-white">
            <span className="block">{t({ fr: "Testez Ora sur", en: "Try Ora on" })}</span>
            <span className="block text-brand-gradient">
              {t({ fr: "vos propres fichiers.", en: "your own files." })}
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[34rem] font-instrument text-[clamp(1rem,1.5vw,1.25rem)] font-normal leading-normal text-gray-500 dark:text-gray-400">
            {t({
              fr: "Choisissez une automatisation, déposez un fichier, regardez le résultat. Directement dans votre navigateur.",
              en: "Pick an automation, drop a file, watch the result. Right in your browser.",
            })}
          </p>

          <p className="mt-8 font-instrument text-[14.5px] font-normal text-gray-400 dark:text-gray-500">
            {t({
              fr: "Fichiers jamais stockés ✦ Sans installation ✦ Résultat instantané",
              en: "Files never stored ✦ No install ✦ Instant results",
            })}
          </p>
        </div>
      </section>

      {/* STEPS 1 + 2 share one stage. Ordre imposé par le client (2026-07-30) :
          la CARTE arrive directement sous le paragraphe du hero, sans titre
          intercalé, et le fil « Choisissez / Déposez / Téléchargez » se place
          EN DESSOUS. « Quelle tâche voulez-vous automatiser ? » et son
          sous-titre ont été retirés : le paragraphe du hero dit déjà
          « choisissez une automatisation », et l'étape 1 du fil s'appelle
          « Choisissez ». C'était le « trop de texte pour rien ».
          Fond identique au hero : plus de bande grise, la page est blanche de
          bout en bout, et ce sont les OMBRES des cartes qui donnent le relief. */}
      {/* ── Workbench, CHANTIER EN COURS ────────────────────────────────────
          Réplique interactive du logiciel (Excel + panneau Ora) destinée à
          remplacer l'entonnoir ci-dessous. Visible en local uniquement le temps
          de la construction : le mode réel et la capture d'e-mail ne sont pas
          encore branchés, donc rien de tout ça ne doit atteindre le site. */}
      {import.meta.env.DEV && (
        <section className="relative px-6 pb-16 md:px-12">
          <div className="mx-auto max-w-[1400px]">
            <OraWorkbench file={file} />
          </div>
        </section>
      )}

      <section className="relative px-6 pb-16 pt-0 md:px-12 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait" initial={false}>
            {!automation ? (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <AutomationCarousel onSelect={() => setAnnonce(true)} />
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <SelectedAutomationCard
                  automation={automation}
                  onChange={() => {
                    setSelectedKey(null);
                    setFile(null);
                    setLaunchError(null);
                  }}
                />

                <div className="mt-8">
                  <DropZone automation={automation} file={file} onFile={setFile} />
                </div>

                {/* Launch: the run starts anonymously, the form comes at
                    download time, after the preview. */}
                <AnimatePresence>
                  {file && (
                    <motion.div
                      key="launch"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="mt-8 text-center"
                    >
                      <button
                        type="button"
                        disabled={launching}
                        onClick={handleLaunch}
                        className={`inline-flex items-center gap-2 rounded-full px-8 py-4 font-inter text-[15.5px] font-semibold text-white transition-all duration-150 ${
                          launching
                            ? "cursor-wait bg-[#3b82f6]/70"
                            : "bg-[#3b82f6] shadow-[0_2px_12px_rgba(59,130,246,0.30)] hover:-translate-y-px hover:bg-[#2563eb] hover:shadow-[0_4px_24px_rgba(59,130,246,0.40)] active:translate-y-0"
                        }`}
                      >
                        {launching
                          ? t({ fr: "Envoi du fichier...", en: "Uploading..." })
                          : t({ fr: "Lancer l'automatisation", en: "Run the automation" })}
                        <ArrowRight size={17} />
                      </button>
                      {launchError && (
                        <p className="mx-auto mt-4 max-w-md font-inter text-[13px] font-medium text-red-500">
                          ✗ {launchError}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Le fil du parcours, EN DESSOUS de la carte : la carte est ce que
              le visiteur vient voir, le fil n'est qu'un repère de progression.
              Détaché par un filet, pour qu'il ne flotte pas dans le vide. */}
          <div className="mx-auto mt-14 max-w-2xl border-t border-gray-100 pt-10 md:mt-20 md:pt-12 dark:border-white/[0.06]">
            <StepTrail active={automation ? 2 : 1} labels={stepLabels} />
          </div>
        </div>
      </section>

      {annonce && <ComingSoonModal onClose={() => setAnnonce(false)} onBookCall={openBooking} />}
    </div>
  );
}
