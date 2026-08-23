import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

/**
 * PanelZoom — le bouton d'agrandissement des panneaux de la section à onglets,
 * et la fenêtre qu'il ouvre.
 *
 * ── D'OÙ VIENT LE DESSIN ──────────────────────────────────────────────────
 * Client 2026-08-15, deux captures : la pastille au repos (aplat très pâle,
 * crochets colorés) et la même au survol (aplat plein, crochets blancs).
 * « Mets-le pour prévisionnel, bilan développé, changement de structure etc. »
 *
 * ⚠ LA COULEUR N'EST PAS CELLE DES CAPTURES, ET C'EST DÉLIBÉRÉ. Elles montrent
 * un indigo (~#4f39f6). Le même jour, l'audit a retiré du site les quatre bleus
 * concurrents dont un indigo #6161FF qui vivait dans la barre de navigation, et
 * CLAUDE.md porte désormais la règle « un seul bleu, un seul survol ». Poser un
 * indigo neuf ici rouvrirait exactement ce qui vient d'être fermé. La pastille
 * reprend donc la FORME, les deux états et les proportions des captures, dans le
 * bleu de marque. C'est un écart signalé au client, pas une inattention : si
 * l'indigo est voulu, il y a deux valeurs à changer dans ce fichier.
 *
 * ── CE QUE FAIT LE BOUTON ─────────────────────────────────────────────────
 * Il ouvre le visuel du panneau en grand. C'est la seule chose qu'une icône
 * d'agrandissement peut vouloir dire, et c'est déjà ce que fait son jumeau dans
 * la grille bento (`aria-label="En savoir plus"`, Maximize2) : deux affordances
 * identiques sur la même page doivent faire la même chose.
 *
 * La fenêtre reprend les quatre comportements que l'audit du jour a posés sur la
 * modale de réservation : Escape, focus qui entre et qui revient, verrou de
 * défilement, `role="dialog"`. Ils ne sont pas recopiés par goût de la symétrie,
 * c'est le minimum pour qu'une fenêtre modale soit utilisable au clavier.
 */

/** Les crochets des captures : deux coins en diagonale, sans flèches. */
function ExpandGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 4h6v6" />
      <path d="M10 20H4v-6" />
    </svg>
  );
}

/**
 * La pastille. Les deux états viennent des captures :
 *   · au repos  — aplat très pâle, crochets en bleu de marque ;
 *   · au survol — aplat plein en bleu de marque, crochets blancs.
 * Le survol est porté par le GROUPE du panneau (`group-hover/panel`) autant que
 * par la pastille elle-même : sur les captures, le second état correspond au
 * curseur « sur l'encadré », pas seulement sur les vingt-huit pixels du bouton.
 */
export function ZoomButton({
  onClick,
  label,
  inline = false,
}: {
  onClick: () => void;
  label: string;
  /**
   * `inline` sort la pastille du flux absolu : elle cesse d'être posée EN
   * SURIMPRESSION sur le coin du panneau et se pose là où on la met.
   *
   * Ajouté le 2026-08-21 pour le panneau vidéo (client : « tu as mis cette
   * flèche sur la vidéo, il faut la mettre à côté »). Sur les autres panneaux —
   * maquettes dessinées — la surimpression reste juste : rien de lisible n'est
   * recouvert. Sur un ENREGISTREMENT D'ÉCRAN, elle masquait une partie de
   * l'interface filmée, et surtout plus rien ne distinguait un bouton du site
   * d'un bouton de l'application enregistrée.
   */
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      /* FUSION 2026-08-23 : la pastille `inline` vient de main (PR nº 40), la
         réduction sur téléphone de cette branche. Les deux se composent sans
         se gêner — l'une porte le POSITIONNEMENT, l'autre la TAILLE. Le bureau
         garde ses valeurs au pixel : 32 px, rayon 9, calée à 16 px des bords. */
      className={`grid h-7 w-7 place-items-center rounded-[8px] bg-[#eef3ff] text-[#3b82f6] ring-1 ring-[#3b82f6]/15 transition-colors duration-150 group-hover/panel:bg-[#3b82f6] group-hover/panel:text-white group-hover/panel:ring-[#3b82f6] hover:bg-[#2563eb] hover:text-white hover:ring-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 md:h-8 md:w-8 md:rounded-[9px] dark:bg-white/[0.08] dark:text-white/70 dark:ring-white/10 ${
        inline ? "" : "absolute right-2 top-2 z-20 md:right-4 md:top-4"
      }`}
    >
      <ExpandGlyph />
    </button>
  );
}

export function ZoomOverlay({
  title,
  lead,
  desc,
  checks,
  onBook,
  bookLabel,
  seeLabel,
  onClose,
  children,
}: {
  title: string;
  /** La phrase-bénéfice du panneau, sous le titre. */
  lead?: string;
  /** Le paragraphe d'explication. */
  desc?: string;
  /** Les points à coche de la colonne droite. Absents sur la plupart des
   *  panneaux : voir le pavé ci-dessous. */
  checks?: string[];
  onBook?: () => void;
  bookLabel?: string;
  /** Libellé du bouton cerclé, qui descend au visuel. */
  seeLabel?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  /** Cible du bouton cerclé : la nappe qui porte le visuel, en pied. */
  const mediaRef = useRef<HTMLDivElement>(null);

  /* ══ ⚠ L'ANIMATION NE DÉMARRE QU'APRÈS LA PREMIÈRE PEINTURE ══════════════
     Client 2026-08-21 : « ça arrive avec de la latence, corrige ce bug »,
     à propos du panneau « Prévisionnel ».

     Mesuré au rAF, image par image : une image à 50 ms au milieu d'une série à
     17. C'est un accroc de trois images, court mais parfaitement visible parce
     qu'il tombe au DÉMARRAGE, quand l'œil suit l'objet qui monte.

     La cause n'est pas l'animation, c'est ce qu'elle transporte. Les visuels de
     ces fenêtres sont lourds — `PrevisionnelStudio` est une scène complète —
     et jusqu'ici ils étaient montés DANS LA MÊME IMAGE que le premier pas de
     l'animation. Le navigateur devait donc calculer une mise en page entière,
     rastériser des centaines de nœuds, ET faire avancer la translation, tout
     dans le même budget de 16 ms.

     `ready` sépare les deux temps :
       · image 1 — la fenêtre est montée, complète, mais laissée à y=440 et
         opacité 0. C'est là que se paie la mise en page coûteuse, hors champ ;
       · images suivantes — le contenu est déjà rastérisé, il ne reste qu'une
         translation de couche, que le compositeur fait sans repeindre.

     ⚠ DEUX rAF IMBRIQUÉS, ET PAS UN SEUL. Le premier rend la main après le
     calcul de style, le second seulement après que l'image a été PEINTE. Avec
     un seul, on redémarre encore pendant que le navigateur rastérise, et
     l'accroc revient — à moitié seulement, ce qui est le pire des cas parce
     qu'on croit avoir corrigé. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let deuxieme = 0;
    const premier = requestAnimationFrame(() => {
      deuxieme = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(premier);
      cancelAnimationFrame(deuxieme);
    };
  }, []);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const enter = window.setTimeout(
      () => boxRef.current?.querySelector<HTMLElement>("button")?.focus(),
      50,
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(enter);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);

  /* ══ LE PANNEAU DE PRÉSENTATION, PATRON STRIPE ═══════════════════════════
     Client 2026-08-21, capture du panneau « Utilisez le modèle de facturation
     de votre choix » à l'appui : « quand on clique dessus, il faut que le même
     écran apparaisse ».

     La fenêtre ne montrait que le visuel, en grand, sur un voile noir. Elle
     montre maintenant, comme la référence : le titre, la phrase-bénéfice, le
     paragraphe, deux boutons, la liste à coches en colonne droite, et le
     visuel en pied.

     ⚠ CE N'EST PAS UN NOUVEAU COMPOSANT. Le même panneau existe déjà dans la
     grille bento (`DetailPanel`, UseCasesBento), monté depuis le 2026-08-07 sur
     la MÊME capture Stripe. Il n'a pas pu être réutilisé tel quel : il est
     interne à UseCasesBento et typé sur la forme `BentoCase`. Les deux doivent
     donc rester cohérents à la main — si l'un change de dessin, l'autre suit.

     ⚠ LA COLONNE DE COCHES EST OPTIONNELLE, et pour l'instant elle est VIDE
     sur cinq des six onglets. Les entrées d'AutomationTabs ne portent que
     `tab`, `lead` et `rest` ; seul « Automatisations » a des `examples`.
     Inventer cinq listes d'arguments serait écrire de la promesse commerciale
     sans validation. En leur absence, la colonne de texte prend toute la
     largeur : le panneau reste équilibré, il est simplement moins fourni que
     la référence. */
  const hasChecks = !!checks?.length;

  /* ══ L'ARRIVÉE, DEPUIS LE BAS ════════════════════════════════════════════
     Client 2026-08-21 : « on ne la voit pas venir, on clique et elle est là.
     Je voudrais qu'elle monte depuis le bas, très vite, et surtout que ce soit
     fluide. »

     Deux mouvements, volontairement DÉSYNCHRONISÉS :
       · le voile monte en opacité en 160 ms, presque instantané — il doit
         couvrir la page AVANT que la feuille n'arrive, sinon on voit le panneau
         glisser devant une page encore nette et le regard reste sur la page ;
       · la feuille monte de 520 px en 400 ms.

     ⚠ LA COURBE FAIT TOUT LE TRAVAIL. `[0.16, 1, 0.3, 1]` est une expo-out :
     elle expédie les trois quarts de la distance dans le premier tiers du
     temps, puis freine longuement. C'est ce qui permet d'être à la fois RAPIDE
     (la feuille est en place en 400 ms) et DOUX (elle ne s'arrête pas net). Une
     durée courte avec une courbe linéaire ou `easeOut` donnerait un à-coup ;
     une courbe douce avec une durée longue donnerait de la lenteur. Les deux
     demandes du client ne sont conciliables que par la courbe.

     ⚠ 520 px ET NON `100%` : en pourcentage, la translation se calcule sur la
     HAUTEUR DE LA FEUILLE, qui varie du simple au double selon l'onglet (le
     panneau « Automatisations » porte cinq coches de plus). Les six fenêtres
     n'auraient pas la même vitesse apparente. Une distance fixe les aligne.

     `useReducedMotion` : un visiteur qui a demandé moins d'animations garde le
     fondu du voile, qui l'informe que la page est couverte, et perd la
     translation, qui est le mouvement qui gêne. */
  const reduce = useReducedMotion();

  return createPortal(
    <motion.div
      /* ══ ⚠ LE VOILE EST UN BLEU PÂLE OPAQUE, PLUS UN NOIR FLOUTÉ ══════════
         Client 2026-08-21 : « le fond est légèrement bleu, pas une espèce
         d'ombre noire », capture Stripe à l'appui. #e8eef6 est la valeur lue
         sur cet aplat — c'est déjà celle du panneau jumeau de la grille bento,
         posée le 2026-08-07 sur la même référence.

         ⚠ SEMI-TRANSPARENT, PAS OPAQUE (client 2026-08-21, seconde passe :
         « c'est trop bleu, on ne voit pas vraiment le site derrière, alors que
         ça doit être légèrement bleu, pas beaucoup »). Premier jet : #e8eef6 en
         aplat plein, qui masquait complètement la page. Le voile est maintenant
         ce même bleu à 68 % — la page reste lisible derrière, teintée.

         ⚠ ET SURTOUT, PAS DE `backdrop-blur` POUR AUTANT. C'est lui qui
         causait le lag signalé le même jour : un flou d'arrière-plan sur un
         élément PLEIN ÉCRAN oblige le navigateur à re-flouter toute la page
         derrière, à CHAQUE IMAGE, pendant que la feuille monte — et cette
         page-ci fait tourner deux scènes WebGL et plusieurs vidéos. Mesuré
         après retrait : intervalle moyen de 17,9 ms entre images, soit la
         cadence de l'écran, contre des sauts avant.
         La transparence, elle, ne coûte rien : c'est une simple composition.
         NE PAS REMETTRE `backdrop-blur` ICI, même « juste un peu » — si la page
         derrière paraît trop présente, c'est l'OPACITÉ qu'il faut monter. */
      className="fixed inset-0 z-[60] overflow-y-auto px-4 py-8 md:py-12"
      style={{ background: "rgba(226, 236, 250, 0.68)" }}
      /* ⚠ LE VOILE MONTE EN MÊME TEMPS QUE LA FEUILLE, plus avant elle
         (client 2026-08-21 : « au début c'est très bleu et on n'a pas de
         netteté sur ce qui est écrit derrière, ça se remplit d'un coup »).
         Il montait en 160 ms alors que la feuille met 520 ms : pendant les
         360 ms d'écart, l'écran était donc ENTIÈREMENT bleu, à pleine
         intensité, avec la page derrière déjà voilée et rien encore par-dessus.
         C'est ce moment-là qui se lit comme « très bleu » et « d'un coup ».
         Porté à 440 ms, il suit la montée : la page reste franchement lisible
         pendant que la feuille arrive, et le bleu n'atteint sa pleine valeur
         qu'au moment où la feuille en couvre déjà l'essentiel.
         `ready` le décale comme la feuille, pour que les deux partent
         exactement sur la même image. */
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        /* ⚠ LA COURBE EST PLUS CREUSÉE QU'AVANT, et la durée plus longue :
           `[0.19, 1, 0.22, 1]` sur 520 ms, contre `[0.16, 1, 0.3, 1]` sur
           400 ms (client : « ça ralentit légèrement tout à la fin, fais ça
           aussi »). Le DÉPART reste aussi rapide — l'expo-out expédie la
           moitié du chemin dans les 60 premières millisecondes — mais la queue
           s'allonge : les derniers pixels prennent maintenant près de 300 ms au
           lieu de 240. C'est ce freinage terminal qu'on lit comme de la
           fluidité, pas la durée totale.
           La distance descend de 520 à 440 px : moins de chemin à couvrir pour
           la même impression de montée, donc moins de travail par image. */
        initial={reduce ? { opacity: 0 } : { y: 440, opacity: 0 }}
        animate={
          ready
            ? { y: 0, opacity: 1 }
            : reduce
              ? { opacity: 0 }
              : { y: 440, opacity: 0 }
        }
        transition={{ duration: reduce ? 0.18 : 0.52, ease: [0.19, 1, 0.22, 1] }}
        /* `w-full` plafonné à 1120 px, la largeur du panneau jumeau de la grille
           bento : les deux fenêtres du site doivent faire la même taille. */
        className="relative mx-auto w-full max-w-[1120px]"
      >
        <div className="relative overflow-hidden rounded-[14px] bg-white p-7 shadow-[0_50px_130px_-45px_rgba(10,37,64,0.5)] md:p-14 dark:bg-[#111827]">
          {/* Carré pâle au coin, rayon court : le bouton de fermeture de la
              référence, et celui du panneau jumeau. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#e7effd] text-[#3b82f6] transition-colors hover:bg-[#d8e6fb] md:right-8 md:top-8 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
          >
            <X className="h-[19px] w-[19px]" aria-hidden />
          </button>

          <div className={`grid gap-8 ${hasChecks ? "md:grid-cols-[1.1fr_1fr] md:gap-14" : ""}`}>
            <div>
              <h2 className="pr-12 font-inter text-[1.9rem] font-normal leading-[1.12] tracking-[-0.025em] text-[#0a2540] md:pr-4 md:text-[2.6rem] dark:text-white">
                {title}
              </h2>
              {lead && (
                <p className="mt-5 max-w-[34rem] font-inter text-[17px] leading-[1.6] text-[#425466] md:text-[18px] dark:text-gray-300">
                  {lead}
                </p>
              )}
              {desc && (
                <p className="mt-3 max-w-[34rem] font-inter text-[15px] leading-[1.6] text-[#5b6577] md:text-[16px] dark:text-gray-400">
                  {desc}
                </p>
              )}

              {onBook && (
                /* DEUX boutons, comme la référence : un plein et un cerclé.
                   Angles COURTS et non pastilles — le reste du site est en
                   pastilles, ici on suit le panneau Stripe, et le panneau
                   jumeau de la grille bento fait déjà ce même écart.
                   Le second descend au visuel plutôt que de mener ailleurs :
                   sur une fenêtre modale, un bouton qui NAVIGUE ferait perdre
                   le contexte qu'on vient d'ouvrir. */
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBook();
                    }}
                    className="inline-flex items-center gap-2 rounded-[6px] bg-[#3b82f6] px-6 py-3.5 font-inter text-[15px] font-semibold text-white transition-colors hover:bg-[#2563eb]"
                  >
                    {bookLabel ?? "Réserver un appel"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="inline-flex items-center rounded-[6px] border border-[#d5e2f6] bg-white px-6 py-3.5 font-inter text-[15px] font-semibold text-[#3b82f6] transition-colors hover:bg-[#f4f8fe] dark:border-white/15 dark:bg-transparent dark:text-white/80 dark:hover:bg-white/[0.06]"
                  >
                    {seeLabel ?? "Voir l'aperçu"}
                  </button>
                </div>
              )}
            </div>

            {hasChecks && (
              /* `pr` : sans lui la première coche passe sous la croix. */
              <ul className="space-y-4 pr-12 md:pr-16 md:pt-2">
                {checks!.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-3 font-inter text-[15px] leading-snug text-[#425466] md:text-[16px] dark:text-gray-300"
                  >
                    <span className="mt-[3px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#e7effd] dark:bg-white/10">
                      <Check className="h-3 w-3 text-[#3b82f6]" strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* LE VISUEL EN PIED, sur la nappe dégradée de la référence. */}
          {/* ⚠ LE VISUEL N'EST MONTÉ QU'UNE FOIS LA FEUILLE PARTIE, et c'est
              la seconde moitié de la correction de latence.
              Gater l'ANIMATION derrière `ready` (voir plus haut) déplaçait
              l'accroc sans le supprimer : le calcul de mise en page du visuel —
              150 ms mesurées pour `PrevisionnelStudio` — se payait toujours,
              simplement AVANT le mouvement. Au clic, il ne se passait donc rien
              pendant un sixième de seconde, ce qui se ressent exactement comme
              la latence signalée.
              En différant le visuel lui-même, la première image ne contient
              plus qu'un titre, deux phrases et deux boutons : elle se calcule
              en quelques millisecondes, le voile et la feuille partent
              immédiatement, et la scène lourde se monte pendant la montée, où
              il reste du budget.
              `min-h` réserve la place pour que l'arrivée du visuel ne fasse pas
              grandir la feuille sous les yeux du visiteur. La valeur est
              volontairement généreuse : mieux vaut un peu de nappe vide pendant
              400 ms qu'un saut de mise en page. */}
          <div
            ref={mediaRef}
            className="mt-10 min-h-[38vh] rounded-[12px] p-3 md:mt-14 md:min-h-[46vh] md:p-6"
            style={{ background: "linear-gradient(135deg, #c3daf8 0%, #dfeafc 52%, #d9eeea 100%)" }}
          >
            {ready && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
