import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * ComingSoonModal — annonce l'ouverture de la web app, avec un compte à rebours.
 *
 * Affichée au clic sur « Choisir cette automatisation » (client 2026-08-03) : la
 * réplique web du logiciel n'est pas encore ouverte, donc le parcours de test ne
 * doit pas se poursuivre. Le compteur descend jusqu'à la date d'ouverture.
 *
 * La cible porte son DÉCALAGE HORAIRE (+02:00, heure d'été de Paris) : sans lui,
 * la chaîne serait lue dans le fuseau du visiteur et le compte à rebours
 * afficherait une autre heure d'un pays à l'autre.
 * ⚠ LE JOUR DE LA SEMAINE SE VÉRIFIE À CHAQUE REPORT, il est écrit en dur dans
 * les deux traductions. Historique : 7 → 10 août (client 2026-08-07), puis
 * 10 → 20 août (client 2026-08-13). Le 20 août 2026 tombe un JEUDI, pas un
 * lundi : la mention est passée de « lundi » à « jeudi » des deux côtés. Un
 * simple report de quantième aurait laissé une annonce publique fausse, avec
 * un compte à rebours en direct pour la démentir.
 */
const OUVERTURE = new Date("2026-08-20T10:00:00+02:00");

/** Décompose l'écart restant. Jamais négatif : passé la date, tout est à zéro. */
function reste(cible: Date) {
  const ms = Math.max(0, cible.getTime() - Date.now());
  return {
    fini: ms === 0,
    jours: Math.floor(ms / 86400000),
    heures: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    secondes: Math.floor((ms % 60000) / 1000),
  };
}

export default function ComingSoonModal({
  onClose,
  onBookCall,
}: {
  onClose: () => void;
  /** Ouvre la modale de réservation. Optionnelle : sans handler, le bouton
   *  ferme simplement l'annonce plutôt que de mener hors du site. */
  onBookCall?: () => void;
}) {
  const { t } = useLang();
  const [c, setC] = useState(() => reste(OUVERTURE));

  // Un battement par seconde, c'est ce qui fait « défiler » le compteur.
  useEffect(() => {
    const id = window.setInterval(() => setC(reste(OUVERTURE)), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Échap pour fermer, et le corps ne défile plus derrière la fenêtre.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = avant;
    };
  }, [onClose]);

  const cases: { valeur: number; label: string }[] = [
    { valeur: c.jours, label: t({ fr: "jours", en: "days" }) },
    { valeur: c.heures, label: t({ fr: "heures", en: "hours" }) },
    { valeur: c.minutes, label: t({ fr: "minutes", en: "minutes" }) },
    { valeur: c.secondes, label: t({ fr: "secondes", en: "seconds" }) },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Voile. Un clic dessus ferme. */}
      <motion.div
        className="absolute inset-0 bg-[#0b1220]/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_100px_-24px_rgba(15,23,42,0.5)] dark:bg-[#0f172a]"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Liseré de marque */}
        <div aria-hidden className="h-1" style={{ background: "linear-gradient(90deg,#3b82f6,#0d9488)" }} />

        <button
          type="button"
          onClick={onClose}
          aria-label={t({ fr: "Fermer", en: "Close" })}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="px-7 pb-7 pt-8 md:px-9 md:pb-9">
          <span className="inline-flex items-center gap-2 font-inter text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-400">
            <i aria-hidden className="block h-[7px] w-[7px] rounded-full bg-emerald-500" />
            {t({ fr: "Bientôt disponible", en: "Coming soon" })}
          </span>

          <h3 className="mt-3 font-poppins text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#111827] md:text-[26px] dark:text-white">
            {t({
              fr: "Testez vos automatisations sans rien installer",
              en: "Test your automations with nothing to install",
            })}
          </h3>

          <p className="mt-3 font-inter text-[14.5px] leading-relaxed text-gray-600 dark:text-gray-300">
            {t({
              fr: "La web app qui réplique notre logiciel, pour vous permettre de tester l'automatisation sur vos propres fichiers sans téléchargement, sera disponible jeudi 20 août à 10 h 00.",
              en: "The web app that mirrors our software, so you can test the automation on your own files without downloading anything, opens on Thursday, 20 August at 10:00.",
            })}
          </p>

          {/* Compte à rebours */}
          {c.fini ? (
            <p className="mt-6 font-inter text-[15px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t({ fr: "C'est ouvert, rechargez la page.", en: "It is open, reload the page." })}
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-4 gap-2.5">
              {cases.map((b) => (
                <div
                  key={b.label}
                  className="rounded-[14px] bg-gray-50 py-3 text-center ring-1 ring-gray-100 dark:bg-white/[0.06] dark:ring-white/10"
                >
                  <div className="font-poppins text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111827] tabular-nums dark:text-white">
                    {String(b.valeur).padStart(2, "0")}
                  </div>
                  <div className="mt-1.5 font-inter text-[10.5px] font-semibold uppercase tracking-[0.07em] text-gray-400 dark:text-gray-500">
                    {b.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            {/* ⚠ CE BOUTON POINTAIT VERS LA WEB APP (client 2026-08-26 :
                « enlève tous les boutons qui relient vers la web app »). Il
                promettait d'ailleurs « Être prévenu à l'ouverture » tout en
                menant à ora-solution.com/demo, ce qui n'était pas une
                inscription. Il ouvre maintenant la réservation, la seule
                sortie du site, et son libellé dit ce qu'il fait. */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onBookCall?.();
              }}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3b82f6] font-inter text-[15px] font-semibold text-white transition-colors hover:bg-[#2563eb]"
            >
              {t({ fr: "Réserver un appel", en: "Book a call" })}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-full px-6 font-inter text-[15px] font-semibold text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:ring-white/15 dark:hover:bg-white/[0.06]"
            >
              {t({ fr: "Fermer", en: "Close" })}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
