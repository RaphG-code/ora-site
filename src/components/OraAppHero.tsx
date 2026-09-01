import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import OraAppScene from "./OraAppScene";

/**
 * OraAppHero — ouverture de la landing, calquée sur monday.com (client
 * 2026-07-28) : ligne de marque, titre massif, sous-titre, bouton « Commencer »
 * et sa ligne de réassurance, puis UN grand visuel produit posé bas, dont on ne
 * voit que le haut.
 *
 * Le visuel est l'interface RÉELLE du logiciel Ora (voir OraAppScene), et non
 * plus un Excel avec l'extension à côté : le client veut qu'on voie son
 * logiciel tout de suite. La démo scrollée précédente (Excel → onglet Ora →
 * FEC Studio) reste dans OraHeroDemo.tsx, prête à être remontée.
 */

export default function OraAppHero({
  theme,
  onBookCall,
}: {
  theme: "light" | "dark";
  /** Optionnelle : ce composant n'est monté nulle part aujourd'hui. Sans
   *  handler, le bouton ne fait rien plutôt que de sortir du site. */
  onBookCall?: () => void;
}) {
  const { t } = useLang();
  const dk = theme === "dark";

  return (
    <section className="relative overflow-hidden px-6 md:px-12 pt-28 md:pt-32">
      {/* Ligne de marque : logo + texte dont la teinte GLISSE lentement
          (effet monday.com, continu mais presque subliminal). Ces règles
          vivaient dans OraHeroDemo, elles suivent le composant. */}
      <style>{`
.hd-brandline{display:inline-flex;align-items:center;gap:10px;
  animation:hdBrandHue 9s ease-in-out infinite alternate}
@keyframes hdBrandHue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(-45deg)}}
@media (prefers-reduced-motion:reduce){.hd-brandline{animation:none}}
`}</style>
      <motion.div
        className="relative z-10 text-center max-w-[90rem] mx-auto"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="hd-brandline font-instrument font-medium text-[clamp(1rem,1.5vw,1.3rem)] tracking-[-0.01em]">
          <img
            src="/logos/icon-color.png"
            alt=""
            aria-hidden
            className="h-[1.25em] w-auto select-none"
            draggable={false}
          />
          <span className="text-brand-gradient">
            {t({ fr: "Ora Solution en action", en: "Ora Solution in action" })}
          </span>
        </span>

        <h1 className="font-instrument font-normal text-[clamp(2.3rem,5.4vw,4.8rem)] tracking-[-0.035em] leading-[1.03] text-[#111827] dark:text-white mt-3">
          <span className="block">{t({ fr: "Moins de saisie.", en: "Less data entry." })}</span>
          <span className="block text-brand-gradient">
            {t({ fr: "Plus d'analyse et de conseil.", en: "More analysis and advisory." })}
          </span>
        </h1>

        <p className="mt-3 mx-auto max-w-[36rem] font-instrument font-normal text-[clamp(1rem,1.6vw,1.35rem)] leading-normal text-gray-500 dark:text-gray-400">
          {t({
            fr: "On s'occupe de vos tâches répétitives, vous excellez dans votre métier.",
            en: "We handle the repetitive tasks, so you excel at what you do.",
          })}
        </p>

        {/* ⚠ CE COMPOSANT N'EST MONTÉ NULLE PART (vérifié le 2026-08-26 : aucun
            import ailleurs dans src/). Son bouton « Commencer » vers
            ora-solution.com/demo est tout de même retiré, pour qu'un remontage
            futur ne réintroduise pas le lien vers la web app que le client a
            fait supprimer du site ce jour-là. */}
        <button
          type="button"
          onClick={onBookCall}
          className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-[#3b82f6] px-9 py-4 font-instrument text-[17px] font-medium text-white shadow-[0_14px_32px_-12px_rgba(59,130,246,0.6)] transition-colors duration-200 hover:bg-[#2563eb]"
        >
          {t({ fr: "Réserver un appel", en: "Book a call" })}
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>

        {/* Même famille que le titre + l'étoile ✦ en séparateur (monday.com) */}
        <p className="mt-4 font-instrument font-normal text-[14.5px] text-gray-400 dark:text-gray-500">
          {t({
            fr: "Testez Ora sur vos fichiers ✦ Sans installation ✦ Directement dans votre navigateur",
            en: "Try Ora on your own files ✦ No install ✦ Right in your browser",
          })}
        </p>
      </motion.div>

      {/* Le logiciel, posé bas : on n'en voit que le haut, le reste passe sous
          le pli (référence monday.com). La hauteur est volontairement plus
          grande que ce qui est visible. */}
      {/* Hauteur généreuse : la scène se cale sur la LARGEUR disponible, donc
          le logiciel s'affiche en grand. Le bas passe naturellement sous le
          pli, on n'en voit que le haut (référence monday.com). */}
      <div className="relative z-10 mx-auto mt-12 md:mt-16 w-full max-w-[1500px] h-[420px] md:h-[860px]">
        <OraAppScene />
      </div>

      {/* Raccord vers la section noire qui suit : sans ce dégradé, la couture
          blanche → noire est brutale. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 md:h-56"
        style={{
          background: `linear-gradient(to bottom, transparent, ${dk ? "#000" : "#000"} 92%)`,
        }}
      />
    </section>
  );
}
