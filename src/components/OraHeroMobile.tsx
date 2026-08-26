import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";
import OraAppScene from "./OraAppScene";

/**
 * OraHeroMobile — le hero des téléphones (< 768 px), monté à la place de
 * <OraHeroDemo>, la scène pilotée au défilement.
 *
 * ── CE QU'IL PARTAGE AVEC LE BUREAU, ET C'EST L'ESSENTIEL ─────────────────
 * La réplique du logiciel est `OraAppScene`, LE MÊME COMPOSANT que monte le
 * hero du bureau : même fenêtre, même barre latérale, même grille de douze
 * modules, mêmes pastilles flottantes. Seule l'échelle change.
 *
 * ⚠ CE FICHIER A LONGTEMPS SOUTENU L'INVERSE, et l'argument est consigné ici
 * parce qu'il reviendra : la scène est composée à 1180 × 720 avec des corps de
 * 7 à 13,5 px ; ramenée à la largeur d'un téléphone elle tombe vers 0,25
 * d'échelle, donc 2 à 4 px à l'écran. Une réplique RECOMPOSÉE à la largeur du
 * téléphone tenait cette place, pour que chaque ligne reste lisible. Le client
 * l'a renvoyée le 2026-08-19 : « la réplication layout du software n'est pas
 * exactement la même que celle qu'on a sur la version ordinateur du site ». La
 * fidélité l'emporte donc sur la lisibilité du texte de la maquette, et c'est
 * une décision, pas un oubli. Ne pas revenir à une recomposition sans le
 * redemander.
 *
 * ── CE QUI RESTE PROPRE AU TÉLÉPHONE ──────────────────────────────────────
 * Pas de curseur simulé ni de défilement piloté : ce sont des grammaires de
 * bureau, et la scène épinglée du bureau court sur 300 à 800 vh, ce qui
 * rallongerait la page de plusieurs écrans. Ici la scène est posée en flux
 * normal, à son état de repos — exactement ce que montre le bureau avant que
 * le visiteur ne commence à défiler.
 */

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

export default function OraHeroMobile() {
  const { t } = useLang();

  /* ⚠ LA SCÈNE N'EST MONTÉE QUE SUR TÉLÉPHONE, et ce n'est pas une
     optimisation de confort. Ce composant vit dans un conteneur `md:hidden` :
     sur ordinateur il reste donc DANS LE DOM, simplement jamais peint. Sans
     cette porte, `OraAppScene` y ajouterait une quatrième instance — la page
     en monte déjà trois ailleurs — avec sa grille de douze modules et surtout
     son écouteur `pointermove`, qui mesure cinq pastilles à chaque mouvement
     de souris pour une scène invisible. La mise en page du bureau, elle, ne
     bougeait pas : `display: none` ne prend aucune place. */
  const [onPhone, setOnPhone] = useState(
    () => typeof window === "undefined" || window.innerWidth < 768,
  );
  useEffect(() => {
    const read = () => setOnPhone(window.innerWidth < 768);
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  return (
    <div className="relative px-5 pt-16 pb-8">
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
        {/* 9,4vw → 8,3vw (2026-08-22, captures DataSnipper fournies par le
            client). Le titre de référence tient en DEUX lignes ; le nôtre en
            faisait QUATRE à 37 px, soit 160 px du premier écran pour la seule
            accroche, et la réplique du logiciel se retrouvait sous la ligne de
            flottaison. À 32 px il tient en trois — la troisième est imposée par
            le `block` qui coupe après « Plus de productivité, », et ce
            découpage-là est repris du hero du bureau, il ne bouge pas. */}
        <h1 className="antialiased mt-3 font-instrument font-normal text-[clamp(1.9rem,8.3vw,2.65rem)] leading-[1.06] tracking-[-0.035em] text-[#111827] dark:text-white">
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
        <p className="mt-4 font-instrument font-normal text-[16.5px] leading-[1.45] text-gray-500 dark:text-gray-400">
          {t({
            fr: "Le logiciel qui reprend le répétitif comptable, pour rediriger votre temps vers le conseil.",
            en: "The software that takes over repetitive accounting work, redirecting your time to advisory.",
          })}
        </p>

        {/* ⚠ PETIT ET DISCRET, ET C'EST UN RETOUR EN ARRIÈRE ASSUMÉ (client
            2026-08-23 : « le bouton commencer est bien trop large, fais en
            sorte qu'il soit bien plus petit et discret »).
            La veille, la lecture des captures DataSnipper avait donné
            l'inverse : un BLOC pleine largeur de 50 px de haut, parce que la
            référence y pose son appel en pavé. Le client a tranché contre, et
            l'arbitrage est le sien — la pastille reprend donc sa place, plus
            courte encore qu'avant la passe (232 px pleins → ~150 px calés sur
            le libellé), plus basse (50 → 38 px), en corps de 13,5 px.
            L'OMBRE PORTÉE PART AVEC. Une nappe bleue de 32 px sous un bouton de
            38, c'est ce qui le faisait crier ; « discret » vise autant la halo
            que la géométrie. Le bleu d'aplat et la forme en pastille restent :
            ce sont les boutons d'Ora partout ailleurs. */}
        <a
          href="https://ora-solution.com/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full bg-[#3b82f6] px-5 font-inter font-semibold text-[13.5px] text-white active:bg-[#2f6fe0]"
        >
          {t({ fr: "Commencer", en: "Get started" })}
          <ArrowRight className="h-[15px] w-[15px]" />
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

      {/* ── LA RÉPLIQUE DU LOGICIEL, CELLE DU BUREAU ────────────────────────
             Client 2026-08-19 : « la réplication layout du software n'est pas
             exactement la même que celle qu'on a sur la version ordinateur ».
             C'est donc `OraAppScene`, LE MÊME COMPOSANT que monte le hero du
             bureau, et non plus une recomposition maison. Même fenêtre, même
             barre latérale, même grille de douze modules, mêmes pastilles
             flottantes qui racontent l'entrée d'un fichier et la sortie des
             livrables. Ce qui change entre les deux tailles d'écran est
             l'ÉCHELLE, et rien d'autre.

             ⚠ LA LARGEUR DONNÉE ICI EST CELLE DE LA SCÈNE, PAS CELLE DE LA
             COMPOSITION. Les pastilles sont ancrées aux BORDS de la scène et
             débordent des deux côtés (`right:calc(100% - 34px)` d'un côté,
             `left:calc(100% - 18px)` de l'autre, voir OA_CSS). Débord MESURÉ
             sur cette scène : 45 px à gauche et 56 px à droite pour une scène
             de 292, soit une composition de 393 px — 1,346 fois la scène.
             Donner toute la largeur à la scène ferait sortir les pastilles de
             l'écran. D'où le facteur : 0,74 × 1,346 = 0,996, la composition
             occupe donc tout juste le viewport, à quelque chose près.

             ⚠ IL N'Y A PLUS DE PLAFOND EN PIXELS, et c'est le correctif du
             2026-08-21 (client : « fais en sorte que la réplication du
             logiciel soit bien plus grande », capture à l'appui). La largeur
             était `min(292px, 74vw)` : au-delà de ~395 px de large, le `74vw`
             ne servait plus à rien et la scène restait figée à 292 px, îlot
             minuscule au milieu d'une page vide. C'est exactement ce que
             montrait la capture, prise vers 505 px (292 / 505 = 58 % de la
             largeur). Le facteur relatif, lui, était juste : il est gardé seul.
             Sur un téléphone de 390 px le rendu ne change pas d'un pixel — la
             scène y valait déjà 288 px, c'est-à-dire 74vw — et tout le gain va
             aux écrans plus larges, jusqu'aux 767 px où le hero du bureau
             prend le relais.

             Les débords négatifs annulent le rembourrage de section : la
             composition dispose de toute la largeur de l'écran, comme sur le
             bureau où elle déborde du conteneur du titre.

             LE BLOC « Vous déposez / Ora vous rend » EST PARTI AVEC. C'était
             la traduction en liste de ces mêmes pastilles, écrite quand la
             scène n'était pas montée ici ; les deux à la suite disaient deux
             fois la même chose, et le bureau ne montre que les pastilles. */}
      <motion.div {...rise(0.08)} className="-mx-5 mt-6 overflow-x-clip">
        {/* `translateX` : c'est la SCÈNE que `mx-auto` centre, or la
            composition est asymétrique — 45 px de débord à gauche contre 56 à
            droite. Centrer la scène décale donc la composition de 5,5 px vers
            la droite, et le bout de la pastille « Synthèse PDF » sortait de
            l'écran (mesuré : 3 px à 320, 8 px à 767). Le décalage vaut la
            moitié de l'écart, exprimé en pourcentage de la scène —
            (56 − 45) / 2 / 292 = 1,88 % — il suit donc l'échelle tout seul. */}
        <div
          className="relative mx-auto"
          style={{ width: "74vw", aspectRatio: "1180 / 720", transform: "translateX(-1.88%)" }}
        >
          {onPhone && <OraAppScene />}
        </div>
      </motion.div>

      {/* ⚠ PAS DE SECOND BOUTON ICI (client 2026-08-20 : « why did you add the
          Book a Call button? there is already a button for it »). Un pavé noir
          pleine largeur « Réserver un appel » suivait la réplique du logiciel ;
          il n'existe nulle part sur le bureau, dont le hero ne porte qu'un seul
          appel — « Commencer » — et dont le « Réserver un appel » bleu vit plus
          bas, après la démo, en `hidden md:flex`. Deux boutons pleine largeur
          empilés sur un même écran de téléphone se disputaient le clic.
          La prise de rendez-vous reste atteignable de partout : le bouton
          « Réserver un appel » de la barre de navigation, et le CTA de fin de
          page. Ne pas remettre un troisième chemin ici. */}
    </div>
  );
}
