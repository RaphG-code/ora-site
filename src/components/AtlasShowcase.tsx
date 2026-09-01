import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useScroll, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ListChecks,
  ScanSearch,
  Search,
  Send,
  ShieldCheck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { VideoWithScrubber } from "./InViewVideo";
import AtlasSlideVisual, { type AtlasVisual } from "./AtlasSlideVisual";
import Typewriter from "./Typewriter";
import AtlasLiveAsk from "./AtlasLiveAsk";
import AtlasLiveNotify from "./AtlasLiveNotify";
import { AtlasLiveDocs, AtlasLiveJour, AtlasLiveRelance } from "./AtlasLiveScenes";

/**
 * AtlasShowcase — la section Atlas, refondue le 2026-08-14 pour qu'ATLAS SOIT
 * L'ASSISTANT (client : « mon but est de faire passer notre super assistant
 * comme le dénommé Atlas, donc merge cette partie dedans »).
 *
 * DEUX ÉTAGES, et il n'en reste que deux à dessein (voir plus bas) :
 *   0. SON NOM. Une SCÈNE ÉPINGLÉE : l'écran se bloque, la traînée d'étoile et
 *      le mot « Atlas » s'installent, puis la planète se lève par le bas et une
 *      phrase s'écrit toute seule sur son corps. Elle est dans sa PROPRE
 *      section, faute de quoi l'épinglage n'aurait pas eu lieu (voir le pavé à
 *      l'ouverture du rendu).
 *   1. CE QU'ON LUI DEMANDE. Un carrousel de sept usages : la barre des
 *      options en haut, le titre à deux encres qui change avec elle, et le
 *      une SCÈNE par usage (AtlasSlideVisual), qui montre le résultat.
 *
 * DEUX ÉTAGES SONT TOMBÉS le 2026-08-15, dans cet ordre : la réplique du
 * logiciel (AtlasSimulation dans son cadre bleu), puis le bloc « Création de
 * système d'orchestration » et sa carte des accès. Les deux montraient des
 * écrans immobiles là où le carrousel montre Atlas EN TRAIN de répondre. Les
 * pavés de leurs emplacements gardent le détail et la date.
 *
 * Le carrousel à onglets du bas (TabPills + trois maquettes) reste masqué
 * derrière un `false &&` depuis le 2026-08-05.
 */

/* ── LE HORIZON D'ATLAS ────────────────────────────────────────────────────
 * Transposition du hero attio fourni le 2026-08-14 (« essaye de faire quelque
 * chose de très similaire au screen pour le design ») : un noir profond, un
 * surtitre gris, UN SEUL MOT en très grand, et sous lui le limbe d'une planète
 * dont le bord s'allume en arc-en-ciel.
 *
 * COMMENT L'ARC EST FAIT, et pourquoi comme ça : ce n'est pas une image, c'est
 * un disque NOIR posé sur un disque en dégradé CONIQUE. Le conique est le seul
 * dégradé CSS dont la couleur tourne autour d'un centre — c'est ce qu'il faut
 * pour une couleur qui court le long d'un arc. Le disque noir, deux pixels plus
 * petit, l'occulte partout sauf sur son pourtour : il reste un liseré,
 * exactement comme un soleil derrière une planète.
 *
 * ⚠ DU BLEU QUI BOUGE, PLUS DE JAUNE (client 2026-08-14, seconde passe : « ne
 * mets pas de lignes jaunes dans l'orbite de la planète, je veux une
 * alternance de bleu très très légèrement en vert, et surtout du bleu qui
 * bouge »). Deux conséquences sur la construction :
 *   1. LA RAMPE EST PÉRIODIQUE. Elle ne va plus d'une couleur à l'autre d'un
 *      bord à l'autre : elle répète TROIS FOIS le même cycle bleu profond →
 *      bleu vif → bleu clair → une pointe de turquoise, sur les 360°. C'est ce
 *      qui permet de la faire tourner sans jamais montrer de raccord.
 *   2. LA COULEUR TOURNE, PAS LE CADRE. `.at-spin` porte la rampe et tourne
 *      lentement ; ses parents portent les masques et ne bougent pas. Le fondu
 *      des extrémités reste donc collé à l'horizon pendant que les bleus
 *      défilent dessous — c'est ce décalage qui donne l'aurore.
 * Le vert est TRÈS en retrait, une seule butée de turquoise par cycle, à peine
 * 8 % du tour : « très très légèrement », pris au mot.
 *
 * TROIS COUCHES, chacune un masque, imbriquées pour les composer sans avoir à
 * recourir à `mask-composite` (mal supporté) :
 *   · `.at-bloomfade` > `.at-bloomring` > `.at-spin` : la lueur. Le premier
 *     masque éteint les extrémités près de l'horizontale, le second découpe un
 *     anneau à bords fondus ;
 *   · `.at-linefade` > `.at-spin` : le liseré net, occulté par `.at-body` ;
 *   · `.at-body` : le corps, un noir à peine dégradé (plus clair au sommet).
 * Les coniques partent `from 270deg` : dans ce repère, 0° tombe à GAUCHE du
 * disque, 90° au SOMMET et 180° à droite.
 *
 * ⚠ AUCUN `filter: blur` ICI, ET C'EST MESURÉ. La première version floutait le
 * conique pour obtenir la lueur. Or ce disque fait 178 % de la largeur de
 * l'écran, soit ~2 560 px de côté sur un écran de 1 440 : six millions et demi
 * de pixels à flouter. Le rendu hors écran n'en finissait pas — deux minutes
 * sans rendre la main sur une simple capture, c'est-à-dire un coût que la
 * machine du visiteur aurait payé aussi. Le dégradé est donc découpé en anneau
 * à bords fondus par un MASQUE radial : le navigateur ne fait que peindre un
 * dégradé, il n'a rien à re-rastériser. La rotation, elle, est un `transform`,
 * donc une affaire de compositeur et non de peinture.
 *
 * Les hachures verticales du fond viennent aussi de la capture : un
 * `repeating-linear-gradient` à 4 % de blanc, éteint en haut et en bas par un
 * masque pour ne pas trancher net sur le noir de la section. */
const ATLAS_CSS = `
@keyframes atlasStar{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.atlas-star{animation:atlasStar 4.5s ease-in-out infinite;will-change:transform}

/* PAS DE PROPRIETE position ICI. La scene porte la classe Tailwind sticky, et
   cette feuille-ci est injectee APRES celle de Tailwind : a specificite egale
   (une classe contre une classe), c'est la derniere qui gagne. Un
   position:relative ecrit ici desepinglait donc la scene EN SILENCE — la
   planete defilait au lieu de se lever, et rien dans le DOM ne le montrait.
   Le controle qui l'a revele : relever le position CALCULE de la scene, il
   doit dire sticky. (Pas d'accent grave dans ce bloc : template literal.) */
.at-sky{overflow:hidden;background:#000}
/* ── LA PLAQUE BLEUE QUI ACCUEILLE LES SCENES ANIMEES (2026-08-29) ──────────
   Client : les animations jouees jusqu'ici sur le noir doivent se faire DANS
   le cadre bleu des vignettes. Or elles ont ete dessinees pour un fond noir :
   cinq motifs utilitaires y posent du blanc translucide (libelles d'etapes,
   pilules fantomes, filets) qui devient invisible sur une plaque claire.
   Plutot que de retoucher trois fichiers de scenes qui servent aussi
   ailleurs, la plaque REMAPPE ces cinq motifs par selecteurs d'attribut :
   la classe utilitaire reste dans le JSX, seule sa couleur change ici.
   (Pas d'accent grave dans ce bloc : template literal.)
   ⚠ FRAGILE PAR NATURE : si une scene introduit un sixieme motif sur-noir,
   il faudra l'ajouter ici. Le controle : chaque texte de scene doit rester
   lisible en capture sur la plaque. */
.at-plate [class*="text-white/85"]{color:#111827!important}
.at-plate [class*="text-white/70"]{color:#42506b!important}
.at-plate [class*="border-white/"]{border-color:rgba(10,37,64,.16)!important}
.at-plate [class*="bg-white/[0.06]"]{background:#fff!important}

/* ── LA TRANSFORMATION SQUELETTE → CONTENU (2026-08-30, seconde passe) ─────
   Client, apres l'envol en cascade : « des elements qui se transforment sous
   nos yeux, sinon ca ne fait juste pas de sens ». Il a raison sur le fond :
   des blocs qui s'envolent RACONTENT un depart, pas une transformation.

   Ce que la vignette EST rend la transformation possible : un SQUELETTE de la
   scene — les memes cartes blanches, aux memes places, avec des barres vides
   la ou la scene a du texte. Le morphing juste est donc une MISE AU POINT :
     · la vignette grossit d'un souffle (1 → 1,03) et se dissout dans un flou
       de 9 px — ses barres perdent leurs bords, deviennent de la matiere ;
     · la scene vivante emerge du meme centre, du meme flou, en net —
       la matiere reprend forme, avec du texte la ou il y avait des barres.
   Les deux courbes se croisent a mi-course : il y a toujours quelque chose de
   visible, jamais deux choses nettes. L'oeil lit UN objet qui gagne du detail,
   pas deux images echangees.

   ⚠ LES DEUX ANIMATIONS DOIVENT RESTER JUMELLES : meme duree a 40 ms pres,
   memes courbes douces (pas de ressort ici, le ressort vit DANS la scene qui
   demarre ses cascades internes au meme moment). Si l'une change, changer
   l'autre, sinon on retombe sur un fondu qui « ne fait pas de sens ».
   Le flou est borne a un element de ~560 px, une fois, hors defilement : cout
   raisonnable, rien a voir avec les flous plein ecran interdits ailleurs.
   (Pas d'accent grave dans ce bloc : template literal.) */
.at-fige-sortie .av-stage{animation:atFigeFond 430ms cubic-bezier(.4,0,.2,1) both;will-change:opacity,filter,transform}
@keyframes atFigeFond{
  0%{opacity:1;filter:blur(0);transform:scale(1)}
  100%{opacity:0;filter:blur(9px);transform:scale(1.03)}}
.at-scene-entre{animation:atSceneNette 470ms cubic-bezier(.22,1,.36,1) both}
@keyframes atSceneNette{
  0%{opacity:0;filter:blur(9px);transform:scale(.972)}
  60%{opacity:1}
  100%{opacity:1;filter:blur(0);transform:scale(1)}}
@media (prefers-reduced-motion:reduce){
  .at-fige-sortie .av-stage{animation:none;opacity:0}
  .at-scene-entre{animation:none}}

.at-lines{position:absolute;inset:0;
  background:repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 78px);
  -webkit-mask-image:linear-gradient(180deg, transparent 0%, #000 22%, #000 72%, transparent 100%);
  mask-image:linear-gradient(180deg, transparent 0%, #000 22%, #000 72%, transparent 100%)}

.at-planet{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;
  will-change:transform,opacity}

/* Le fondu des extrémités : opaque sur la calotte, éteint avant l'horizontale.
   Il ne tourne pas — c'est lui qui tient l'arc en place. */
.at-limbfade{position:absolute;border-radius:50%;
  -webkit-mask-image:conic-gradient(from 270deg, transparent 0deg, #000 26deg, #000 154deg, transparent 180deg, transparent 360deg);
  mask-image:conic-gradient(from 270deg, transparent 0deg, #000 26deg, #000 154deg, transparent 180deg, transparent 360deg)}
.at-bloomfade{inset:-2.4%;opacity:.8}
.at-linefade{inset:0}

/* L'anneau à bords fondus de la lueur. */
.at-bloomring{position:absolute;inset:0;border-radius:50%;
  -webkit-mask-image:radial-gradient(closest-side, transparent 0 90%, rgba(0,0,0,.45) 95%, #000 97.6%, rgba(0,0,0,.25) 99%, transparent 100%);
  mask-image:radial-gradient(closest-side, transparent 0 90%, rgba(0,0,0,.45) 95%, #000 97.6%, rgba(0,0,0,.25) 99%, transparent 100%)}

/* LA COULEUR QUI TOURNE. Deux vitesses, et des durées PREMIÈRES ENTRE ELLES
   (38 s et 61 s) : la lueur et le liseré ne se resynchronisent qu'au bout de
   trente-neuf minutes, on ne surprend donc jamais la boucle. */
@keyframes atSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.at-spin{position:absolute;inset:0;border-radius:50%;
  animation:atSpin 38s linear infinite;will-change:transform}
.at-spin-slow{animation-duration:61s;animation-direction:reverse}

.at-body{position:absolute;inset:2px;border-radius:50%;
  background:radial-gradient(120% 96% at 50% 6%, #0d1017 0%, #06070b 44%, #000 100%)}

@media (prefers-reduced-motion:reduce){.atlas-star,.at-spin{animation:none}}
`;

/** LA RAMPE DU LIMBE, périodique : trois cycles identiques sur les 360°, pour
 *  qu'une rotation ne montre jamais de raccord. Un cycle = bleu profond, bleu
 *  de marque, bleu clair, un éclat presque blanc, puis LA pointe de turquoise
 *  (#3ad0dd, la seule note verte, tenue sur 8° d'un cycle de 120 ; un
 *  premier essai à #2fd8c4 virait franchement au vert sur le flanc droit) et retour au
 *  bleu profond. Aucun jaune, aucun ambre : ils ont été renvoyés. */
const CYCLE = [
  "#12329c 0deg",
  "#1d4ed8 16deg",
  "#3b82f6 34deg",
  "#7db9fb 52deg",
  "#dbeeff 66deg",
  "#8fd8f6 78deg",
  "#3ad0dd 86deg",
  "#1f7ae6 100deg",
  "#12329c 120deg",
].join(", ");

const LIMB =
  "conic-gradient(from 270deg at 50% 50%, " +
  CYCLE + ", " +
  CYCLE.replace(/(\d+)deg/g, (_m, d) => `${Number(d) + 120}deg`) + ", " +
  CYCLE.replace(/(\d+)deg/g, (_m, d) => `${Number(d) + 240}deg`) +
  ")";

/** Les phrases qui s'écrivent sur la planète, sous le mot « Atlas ». Trois, et
 *  dans cet ordre : ce qu'il EST, ce qu'il FAIT, ce qui le distingue. Chacune
 *  tient sur une ligne à la mesure fixée (46 caractères) : une phrase qui
 *  passerait à la ligne en cours de frappe ferait sauter tout le bloc d'un
 *  demi-pouce au milieu de l'animation. */
const ATLAS_LINES: { fr: string; en: string }[] = [
  {
    fr: "Atlas est l'assistant qui connaît vos dossiers.",
    en: "Atlas is the assistant that knows your files.",
  },
  {
    fr: "Vous lui parlez, il cherche dans vos fichiers.",
    en: "You ask, it searches through your own files.",
  },
  {
    fr: "Il répond en nommant les documents qu'il a ouverts.",
    en: "It answers, and names the documents it opened.",
  },
];

/**
 * LES CINQ CAPACITÉS D'ATLAS.
 *
 * ⚠ ELLES ONT CHANGÉ DE PLACE ET DE FORME le 2026-08-20. C'était `SKY_FOOT` :
 * une rangée horizontale de cinq cellules, posée en ourlet sous l'horizon de la
 * planète, une ligne chacune, sans description. Elles alimentent maintenant la
 * LISTE du bloc « Atlas en clair » (patron repris de la page Signals d'attio,
 * fournie par le client), et l'ourlet a été retiré : garder les deux aurait
 * fait dire exactement la même chose à un écran d'intervalle.
 *
 * Les cinq libellés sont INCHANGÉS, au mot près — ils sont validés depuis le
 * 2026-08-15 et l'un d'eux porte le différenciateur du produit. Ce qui est
 * nouveau, c'est la ligne d'appui : le format attio donne à chaque entrée un
 * titre court et deux lignes sous lui, et cinq titres nus feraient une colonne
 * squelettique face à la moitié droite restée vide.
 *
 * ⚠ AUCUNE DES DESCRIPTIONS N'INVENTE QUOI QUE CE SOIT. Chacune reformule ce
 * que le site dit déjà ailleurs : les six usages de la grille pour les quatre
 * premières, la section confidentialité pour la dernière (« Traitement 100 %
 * local, vos données restent chez vous »). Pas un chiffre, pas un nom de
 * client, pas une promesse nouvelle.
 */
const ATLAS_CAPS: {
  icon: LucideIcon;
  label: { fr: string; en: string };
  desc: { fr: string; en: string };
  /** LA GLOSE, sous l'animation de droite. La liste dit ce qu'Atlas FAIT,
   *  la glose dit ce que le client Y GAGNE : jamais deux fois le même texte à
   *  deux colonnes d'écart. Aucune n'invente de chiffre ni de promesse. */
  apport: { fr: string; en: string };
}[] = [
  {
    icon: Search,
    label: { fr: "Cherche dans vos dossiers", en: "Searches your own files" },
    desc: {
      fr: "Posez la question en français. Atlas ouvre vos fichiers, pas un moteur de recherche.",
      en: "Ask in plain words. Atlas opens your files, not a search engine.",
    },
    apport: {
      fr: "Vous arrêtez de fouiller vos dossiers. La réponse arrive avec le fichier qui la porte, et le temps passé à chercher vous revient.",
      en: "You stop digging through folders. The answer arrives with the file that holds it, and the time spent searching comes back to you.",
    },
  },
  {
    icon: Waypoints,
    label: { fr: "Relie chaque fichier à ses sources", en: "Links every file to its sources" },
    desc: {
      fr: "Chaque chiffre garde le chemin qui y mène, du livrable jusqu'à la pièce d'origine.",
      en: "Every figure keeps the path that leads to it, from the deliverable to the source document.",
    },
    apport: {
      fr: "Un chiffre contesté se justifie sans rouvrir le dossier : le chemin jusqu'à la pièce d'origine est déjà écrit, vous n'avez plus à le refaire.",
      en: "A disputed figure is justified without reopening the file: the path back to the source document is already written, you no longer rebuild it.",
    },
  },
  {
    icon: ListChecks,
    label: { fr: "Montre ce qui reste à valider", en: "Shows what is left to validate" },
    desc: {
      fr: "Ce qui est bouclé, ce qui attend, ce qui bloque, sans faire le tour des dossiers.",
      en: "What is closed, what is waiting, what is stuck, without touring the folders.",
    },
    apport: {
      fr: "Vous savez où en est chaque dossier sans faire le tour de l'équipe, et vous arbitrez sur un état à jour plutôt que sur une impression.",
      en: "You know where every file stands without touring the team, and you decide on an up-to-date picture rather than an impression.",
    },
  },
  {
    /* ⚠ CETTE ENTRÉE A CHANGÉ DE SUJET le 2026-08-22, sur demande explicite du
       client : « au lieu de Garde le journal de chaque geste, je veux plutôt
       quelque chose comme notification d'information réglementaire ou autres
       impactant le dossier client ». Le journal n'a pas disparu du site — il
       vit toujours dans les usages (« Atlas garde le journal », scène
       traçabilité) et dans les panneaux — il a cédé SA PLACE DANS CETTE LISTE
       à la veille qui notifie.
       ⚠ C'est une promesse produit INTRODUITE PAR LE CLIENT, pas reformulée
       depuis le site : elle n'existait nulle part ailleurs avant cette
       demande. La description reste prudente — elle cite des TYPES
       d'événements (échéance, information réglementaire), aucun texte de loi,
       aucune date. */
    icon: Bell,
    label: { fr: "Signale ce qui impacte un dossier", en: "Flags what impacts a file" },
    desc: {
      fr: "Information réglementaire, échéance, pièce ajoutée : la notification arrive, le dossier client concerné avec elle.",
      en: "A regulatory update, a deadline, a new document: the notification lands, with the client file concerned.",
    },
    apport: {
      fr: "La veille ne repose plus sur votre mémoire. Ce qui change vous trouve, déjà rattaché au dossier client que cela concerne.",
      en: "Keeping watch no longer rests on your memory. What changes finds you, already tied to the client file it concerns.",
    },
  },
  /* ⚠ TROIS CAPACITÉS AJOUTÉES le 2026-08-23 (client, capture du hub du
     logiciel à l'appui : « mets des caractéristiques d'ici qui sont plus
     pertinentes, ne remplace pas celles déjà présentes, et crée pour chacune
     une animation »). Les textes reprennent QUASI MOT POUR MOT les tuiles du
     vrai logiciel — c'est la copie produit du client, pas une rédaction :
     « Analyser un document », « Relances de pièces », « Ma journée ».
     « Veille du millésime » n'a pas été reprise : « Signale ce qui impacte un
     dossier » couvre déjà ce terrain, la doubler ferait deux entrées pour la
     même promesse. « Ne sort jamais de chez vous » reste la fermeture. */
  {
    icon: ScanSearch,
    label: { fr: "Lit les documents qu'on lui dépose", en: "Reads the documents you drop in" },
    desc: {
      fr: "Une plaquette ou un dossier déposé : soldes, points clés et pistes de mission se lisent immédiatement.",
      en: "Drop in a brochure or a file: balances, key points and engagement leads read out immediately.",
    },
    apport: {
      fr: "Vous déposez le document, vous récupérez sa lecture. Vous entrez en rendez-vous avec les points clés, pas avec une pile à dépouiller.",
      en: "You drop the document in and get its reading back. You walk into the meeting with the key points, not a stack to work through.",
    },
  },
  {
    icon: Send,
    label: { fr: "Relance les pièces manquantes", en: "Chases missing documents" },
    desc: {
      fr: "Qui doit quoi, pour quand : les pièces manquantes sont relancées avant qu'elles ne bloquent.",
      en: "Who owes what, by when: missing documents are chased before they block the file.",
    },
    apport: {
      fr: "Les relances partent sans que vous y pensiez. Le dossier avance pendant que vous travaillez sur autre chose, et plus rien ne dort faute d'une pièce.",
      en: "The chasers go out without you thinking about it. The file moves forward while you work on something else, and nothing stalls for a missing document.",
    },
  },
  {
    icon: CalendarCheck,
    label: { fr: "Prépare votre journée", en: "Prepares your day" },
    desc: {
      fr: "Échéances en retard et du jour, dossiers dormants, échecs à reprendre : le point, chaque matin.",
      en: "Overdue and today's deadlines, dormant files, failures to retry: the rundown, every morning.",
    },
    apport: {
      fr: "Votre matinée commence par une liste prête, pas par un inventaire. Vous choisissez par quoi commencer au lieu de reconstituer ce qui reste.",
      en: "Your morning starts with a ready list, not an inventory. You choose what to start with instead of piecing together what is left.",
    },
  },
  {
    icon: ShieldCheck,
    label: { fr: "Ne sort jamais de chez vous", en: "Never leaves your machines" },
    desc: {
      fr: "Traitement local. Vos fichiers restent sur vos postes, y compris pendant l'analyse.",
      en: "Local processing. Your files stay on your machines, including during analysis.",
    },
    apport: {
      fr: "Rien ne part en ligne pour qu'Atlas fonctionne. Vous adoptez l'assistant sans toucher à vos règles de confidentialité ni déplacer une donnée client.",
      en: "Nothing goes online for Atlas to work. You adopt the assistant without touching your confidentiality rules or moving a single client record.",
    },
  },
];

/** ── LE VISUEL DE CHAQUE ARGUMENT ─────────────────────────────────────────
 *  Client 2026-08-29 : « mets ces encadrés à droite de la phrase qui est
 *  sélectionnée », en désignant les vignettes illustrées de « Ce qu'Atlas sait
 *  faire ». La colonne de droite montre donc, pour l'argument encadré, la scène
 *  correspondante d'AtlasSlideVisual.
 *
 *  ⚠ SIX SCÈNES POUR HUIT ARGUMENTS : deux se répètent forcément. Elles sont
 *  placées le plus loin possible l'une de l'autre dans la série (2 et 5, 3 et
 *  7) pour qu'on ne voie jamais la même deux fois de suite en défilant.
 *  Le rapprochement est fait sur le SUJET de la scène, pas sur son titre :
 *  « équipe » montre des statuts, ce qui vaut aussi bien pour ce qui reste à
 *  valider que pour les pièces qu'on relance.
 *
 *  ⚠ DEPUIS LE 2026-08-29 ELLE NE CHOISIT PLUS UNE VIGNETTE MAIS UN DÉGRADÉ
 *  DE PLAQUE : le client remet les scènes ANIMÉES dans le cadre bleu. La carte
 *  sert donc à garder la variété de fonds de la série des vignettes (deux
 *  finissent turquoise, deux plongent au bleu profond) sans monter les
 *  vignettes elles-mêmes. Les dégradés sont recopiés d'AV_CSS au caractère
 *  près — si AtlasSlideVisual les retouche un jour, recopier ici. */
const CAP_VISUELS: AtlasVisual[] = [
  "bouclage",     // Cherche dans vos dossiers
  "controle",     // Relie chaque fichier à ses sources
  "equipe",       // Montre ce qui reste à valider
  "tracabilite",  // Signale ce qui impacte un dossier
  "livrables",    // Lit les documents qu'on lui dépose
  "equipe",       // Relance les pièces manquantes
  "comparaison",  // Prépare votre journée
  "tracabilite",  // Ne sort jamais de chez vous
];

/** Les fonds de plaque, recopiés d'AV_CSS (AtlasSlideVisual) au caractère
 *  près. Voir le pavé de CAP_VISUELS. */
const PLATE_FONDS: Record<AtlasVisual, string> = {
  bouclage:
    "radial-gradient(86% 70% at 30% 88%, rgba(255,255,255,.62) 0%, rgba(216,244,235,.42) 32%, rgba(255,255,255,0) 64%)," +
    "linear-gradient(172deg,#eff5ff 0%,#dde9fd 18%,#b0cdf8 42%,#6ba2ef 68%,#4aa8cd 87%,#63c8a8 100%)",
  controle:
    "radial-gradient(88% 74% at 26% 84%, rgba(255,255,255,.72) 0%, rgba(214,244,234,.5) 30%, rgba(255,255,255,0) 62%)," +
    "linear-gradient(172deg,#eef4ff 0%,#dce8fd 17%,#aecbf8 41%,#5f9bee 66%,#43a5cf 85%,#5ac5a6 100%)",
  livrables:
    "linear-gradient(178deg,#eef4ff 0%,#dbe7fd 24%,#a8c6f8 52%,#4a86f2 80%,#1a56db 100%)",
  equipe:
    "linear-gradient(178deg,#eef4ff 0%,#dbe7fd 22%,#a8c6f8 50%,#4a86f2 79%,#1a56db 100%)",
  tracabilite:
    "linear-gradient(174deg,#f2f6ff 0%,#dfe9fd 20%,#b6d0f9 44%,#7aa9f1 68%,#3f7fe8 88%,#1f5fdd 100%)",
  comparaison:
    "radial-gradient(84% 68% at 72% 86%, rgba(255,255,255,.58) 0%, rgba(214,244,234,.40) 34%, rgba(255,255,255,0) 66%)," +
    "linear-gradient(174deg,#eff5ff 0%,#dce8fd 20%,#aecbf8 44%,#679fee 70%,#45a6cd 88%,#5fc7a7 100%)",
};

/* ── LE SENS DU GESTE (2026-08-29) ────────────────────────────────────────
 * MESURÉ : à la remontée, aucune perte de performance (16,8 ms de moyenne des
 * deux côtés, zéro image au-delà de 30 ms). Le défaut était une FAUTE DE
 * DIRECTION : la scène sortante partait toujours par le haut et l'entrante
 * venait toujours du bas. À la descente ça accompagne le geste ; à la remontée
 * la même animation joue à contresens du doigt. C'est ce désaccord qu'on lit
 * comme « pas fluide », et il ne peut se voir QU'EN REMONTANT.
 * `sens` ne retourne que les composantes VERTICALES. Le décalage horizontal
 * reste indexé sur l'argument : c'est lui qui garantit que deux scènes
 * consécutives n'entrent jamais du même côté.
 *
 * ⚠ IL PASSE PAR LE `custom` D'ANIMATEPRESENCE, ET C'EST OBLIGATOIRE. Un objet
 * `exit` écrit en clair est FIGÉ au rendu où l'élément a été créé : la scène
 * qui sort emporterait le sens de l'ANCIEN geste, et le premier changement de
 * direction — le seul moment où l'œil regarde — sortirait du mauvais côté.
 *
 * ⚠ NOMS DISTINCTS DE CEUX DES SCÈNES (avant/pose/apres et non
 * initial/enter/exit) : les scènes d'AtlasLive* posent leur label à la main,
 * la propagation s'arrête donc là ; mais si l'une l'oubliait, un nom commun
 * ferait jouer la mauvaise variante à ses enfants. */
type SensScene = { sens: number; i: number };
const SCENE_VARIANTS: Variants = {
  avant: ({ sens, i }: SensScene) => ({
    opacity: 0,
    scale: 0.97,
    x: [0, 44, -44][i % 3],
    y: sens * (i % 3 === 0 ? 26 : 8),
  }),
  pose: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 32, mass: 0.9 },
  },
  apres: ({ sens }: SensScene) => ({
    opacity: 0,
    y: sens * -20,
    scale: 0.985,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
};

export default function AtlasShowcase({ openBooking }: { openBooking: () => void }) {
  const { t } = useLang();

  /* ── LA MONTÉE DE LA PLANÈTE, ÉCRITE AU DÉFILEMENT ────────────────────────
   * Client 2026-08-14 : « une animation où l'écran se bloque et il y a
   * l'animation de la planète qui s'affiche ». L'écran est bloqué par le
   * `sticky` de la scène ; ce qui suit est la course qui se joue pendant ce
   * blocage.
   * Écouteur nu plutôt que Framer Motion : c'est une valeur écrite sur DEUX
   * styles en ligne, à chaque image de défilement, sur une page dont le
   * défilement est déjà piloté sur le thread principal par Lenis. Un moteur
   * d'animation n'apporterait rien et coûterait sa boucle.
   * Le calcul est bordé en rAF (une lecture de mise en page par image au pire)
   * et un IntersectionObserver sert d'INTERRUPTEUR : hors écran, on ne mesure
   * rien du tout. Même patron que useEnterOnScroll, mêmes raisons.
   */
  const skyWrapRef = useRef<HTMLDivElement>(null);
  const planetRef = useRef<HTMLDivElement>(null);
  const skyTypeRef = useRef<HTMLDivElement>(null);
  const skyLineRef = useRef<HTMLDivElement>(null);

  /* riseRef / riseY (le rideau blanc au défilement) et l'état du carrousel du
     bas (bottomTab) vivaient ici : partis avec la section blanche le
     2026-08-30. */

  /* ── L'ENCADRÉ DES CAPACITÉS, PILOTÉ AU DÉFILEMENT ────────────────────────
   * Client 2026-08-22 : « l'écran est figé au scroll, et c'est l'encadré qui
   * entoure la partie de gauche qui descend au scroll, les animations de
   * droite qui changent. Pour l'instant travaille uniquement sur l'encadré. »
   *
   * Le bloc « Atlas en clair » devient une SCÈNE ÉPINGLÉE : la section fait
   * 300 vh, son contenu est `sticky` en haut d'écran, et les 200 vh de course
   * se découpent en cinq segments — un par capacité. Le cadre lumineux glisse
   * d'une entrée à l'autre au fil du défilement.
   *
   * ⚠ ÉPINGLAGE PAR `position: sticky` NU, PAS PAR LE MOTEUR DE LA PLANÈTE.
   * Ce fichier porte déjà une scène épinglée artisanale (la planète, avec son
   * cadenceur rAF), et son pavé documente sa fragilité. Ici rien de tout ça :
   * un sticky de base, un `useScroll` de Framer pour l'index, et c'est tout.
   * Les deux mécanismes ne partagent aucun état.
   *
   * ⚠ ÉPINGLÉ SUR md+ SEULEMENT. Sur téléphone, la colonne d'animations est
   * masquée : épingler une liste de texte seule pendant 200 vh serait du
   * défilement volé sans contrepartie. Le rail ne prend sa hauteur qu'à
   * partir de md, en dessous la section défile normalement.
   *
   * L'ENCADRÉ EST MESURÉ, PAS CALCULÉ : à chaque changement d'index (et à
   * chaque redimensionnement, via ResizeObserver), on relit `offsetTop` et
   * `offsetHeight` de l'entrée active. Les cinq entrées n'ont pas la même
   * hauteur — leurs descriptions font une ou deux lignes selon la langue — et
   * un pas fixe dériverait dès la deuxième. La transition CSS (380 ms,
   * expo-out maison) fait le glissement d'une position mesurée à l'autre.
   *
   * `activeCap` est aussi ce qui pilotera les animations de droite : une par
   * capacité, à venir — c'est la moitié « pour l'instant » de la demande. */
  const capTrackRef = useRef<HTMLElement>(null);
  const capListRef = useRef<HTMLUListElement>(null);
  const [activeCap, setActiveCap] = useState(0);
  /* ── DEUX INDEX, ET C'EST TOUT LE CORRECTIF DE FLUIDITÉ (2026-08-28) ──────
   * MESURÉ AVANT DE TOUCHER À QUOI QUE CE SOIT, à la molette : SEPT MONTAGES
   * DE SCÈNE en 250 ms à la descente, QUATORZE à la remontée (l'index
   * oscillait aux frontières). Chaque scène d'AtlasLive* est une machine à
   * états complète — minuteries, IntersectionObserver, ressorts, des centaines
   * de nœuds. En traverser sept au vol, c'est les construire toutes pour n'en
   * voir aucune.
   *   · `activeCap` suit le doigt SANS DÉLAI : il porte l'encadré et
   *     l'accordéon, c'est-à-dire le retour visuel du défilement.
   *   · `sceneCap` ne bouge QU'À L'ARRÊT : il monte l'animation et sa glose.
   *     Un coup de molette ne monte donc plus qu'UNE scène. */
  const [sceneCap, setSceneCap] = useState(0);
  /** 1 en descendant, -1 en remontant. Voir le pavé de SCENE_VARIANTS. */
  const [sens, setSens] = useState(1);
  const [capFrame, setCapFrame] = useState({ top: 0, height: 0 });
  const { scrollYProgress: capProgress } = useScroll({
    target: capTrackRef,
    offset: ["start start", "end end"],
  });

  /* ⚠ ZONE MORTE AUX FRONTIÈRES. `Math.floor(v * 8)` nu bascule au millième
     près : arrêté PILE sur une frontière — ce qui arrive à chaque fin de
     course inertielle — l'index faisait l'aller-retour, et chaque aller-retour
     remontait une scène. On ne quitte l'argument courant qu'une fois la
     frontière franchie de 15 % de segment, soit ~49 px, invisible à l'usage.
     ⚠ ET ON N'ÉCRIT L'ÉTAT QU'AU CHANGEMENT : le handler tire à chaque image,
     l'ancienne version appelait donc setState soixante fois par seconde pour
     la même valeur. */
  useEffect(() => {
    const N = ATLAS_CAPS.length;
    const MARGE = 0.15;
    let courant = 0;
    return capProgress.on("change", (v) => {
      const brut = Math.max(0, Math.min(N - 1e-4, v * N));
      const vise = Math.floor(brut);
      if (vise === courant) return;
      const frontiere = vise > courant ? courant + 1 : courant;
      if (Math.abs(brut - frontiere) < MARGE) return;
      courant = vise;
      setActiveCap(vise);
    });
  }, [capProgress]);

  /* ⚠ 140 ms, ET LE NOMBRE N'EST PAS LIBRE : plus LONG que l'intervalle entre
     deux franchissements pendant un coup de molette (~30 ms mesurés), sinon
     les scènes intermédiaires passent quand même ; plus COURT que ce qui se
     remarque à l'arrêt, où deux arguments sont séparés de plusieurs secondes.
     Au montage `sceneCap === activeCap` : la première scène est là tout de
     suite, l'entrée dans la section ne passe pas par l'attente. */
  /* ── LE TEMPS FIGÉ DE LA PLAQUE (2026-08-30) ─────────────────────────────
   * Client : « on part du design de l'encadré, une demi-seconde de latence,
   * et les éléments s'animent tout d'un coup ». À chaque argument, la plaque
   * ouvre donc sur la VIGNETTE FIXE (le design d'origine de l'encadré), la
   * tient 650 ms, puis la scène vivante prend le relais — et comme les scènes
   * entrent en ressort avec leurs cascades internes, le passage se lit
   * exactement comme « les éléments se mettent à bouger ».
   * 650 ms : assez long pour que l'image fixe soit VUE comme une image (sous
   * ~400 ms elle se lirait comme un raté de chargement), assez court pour ne
   * pas faire attendre l'animation promise. */
  const [vif, setVif] = useState(false);
  /* `sortie` arme l'animation de réveil sur la vignette ; `figeOn` la garde
   * montée le temps que ses blocs finissent de décoller (560 ms + cascade).
   * Trois temps, donc : figé (0-650), réveil (650-1300, scène déjà montée
   * dessous), vivant (vignette démontée — il ne restait d'elle que son fond,
   * identique à celui de la plaque). */
  const [sortie, setSortie] = useState(false);
  const [figeOn, setFigeOn] = useState(true);
  useEffect(() => {
    setVif(false);
    setSortie(false);
    setFigeOn(true);
    const t1 = window.setTimeout(() => {
      setVif(true);
      setSortie(true);
    }, 650);
    const t2 = window.setTimeout(() => setFigeOn(false), 1120);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [sceneCap]);

  /* La largeur RÉELLE de la plaque, pour mettre la vignette figée à son
   * échelle : AtlasSlideVisual compose à 1000 x 880 en dur, et la plaque va
   * de ~360 px (md) à 560 (xl). Un ResizeObserver, comme partout ailleurs. */
  const plateRef = useRef<HTMLDivElement>(null);
  const [plateW, setPlateW] = useState(560);
  useEffect(() => {
    const el = plateRef.current;
    if (!el) return;
    const mesure = () => setPlateW(el.clientWidth || 560);
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(el);
    return () => ro.disconnect();
    /* ⚠ `sceneCap` DANS LES DÉPENDANCES, et ce n'est pas une erreur : la
       plaque vit sous un AnimatePresence clé sur l'argument, elle est donc
       DÉMONTÉE ET REMONTÉE à chaque bascule. Un observer posé une fois
       resterait accroché au nœud détaché de la première plaque et ne
       mesurerait plus jamais rien. */
  }, [sceneCap]);

  useEffect(() => {
    if (sceneCap === activeCap) return;
    const t = window.setTimeout(() => {
      // Les deux dans le même tour : React les groupe, la scène entrante et la
      // sortante lisent donc le même sens, celui du geste qui vient de finir.
      setSens(activeCap > sceneCap ? 1 : -1);
      setSceneCap(activeCap);
    }, 140);
    return () => window.clearTimeout(t);
  }, [activeCap, sceneCap]);

  /* ⚠ `querySelectorAll("li")` ET SURTOUT PAS `ul.children[activeCap]` :
     l'encadré est LUI-MÊME le premier enfant de la liste, tout serait décalé
     d'une entrée.
     ⚠ LA GARDE D'ÉGALITÉ N'EST PAS DÉCORATIVE : l'observateur se déclenche à
     chaque image pendant que l'accordéon s'ouvre, mais aussi sur des
     changements de LARGEUR qui ne déplacent pas l'entrée. Sans elle, chacun de
     ces appels rendait tout AtlasShowcase pour reposer les deux mêmes nombres. */
  const mesurerCadre = useCallback(() => {
    const ul = capListRef.current;
    if (!ul) return;
    const li = ul.querySelectorAll("li")[activeCap] as HTMLElement | undefined;
    if (!li) return;
    // 6 px de débord vertical : l'encadré respire autour de l'entrée.
    const top = li.offsetTop - 6;
    const height = li.offsetHeight + 12;
    setCapFrame((prev) => (prev.top === top && prev.height === height ? prev : { top, height }));
  }, [activeCap]);

  useEffect(() => mesurerCadre(), [mesurerCadre]);

  /* ⚠ L'OBSERVATEUR EST CRÉÉ UNE FOIS, PAS À CHAQUE ARGUMENT. Il dépendait de
     `activeCap` : un coup de molette le démontait et le remontait sept fois, et
     un ResizeObserver qui s'attache déclenche une mesure à chaque fois. */
  const mesureRef = useRef(mesurerCadre);
  useEffect(() => {
    mesureRef.current = mesurerCadre;
  }, [mesurerCadre]);
  useEffect(() => {
    const ul = capListRef.current;
    if (!ul) return;
    const ro = new ResizeObserver(() => mesureRef.current());
    ro.observe(ul);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = skyWrapRef.current;
    const planet = planetRef.current;
    const type = skyTypeRef.current;
    const line = skyLineRef.current;
    if (!wrap || !planet || !type || !line) return;

    // Mouvement réduit : on pose l'état final et on n'écoute rien.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      planet.style.transform = "translateX(-50%)";
      line.style.opacity = "1";
      return;
    }

    let raf = 0;
    let live = false;
    // ⚠ EASE-IN-OUT, ET PAS EASE-OUT. Le premier jet utilisait 1-(1-x)³ :
    // la planète avait fait 93 % du chemin à 45 % de la course, si bien que la
    // moitié du blocage d'écran se passait sans que rien ne bouge. Une courbe
    // symétrique répartit le mouvement sur toute la course — c'est ce qu'on
    // demande à un écran qu'on immobilise exprès.
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    const apply = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const course = r.height - window.innerHeight;
      const p = course > 0 ? Math.min(1, Math.max(0, -r.top / course)) : 1;

      // LA PLANÈTE monte sur les trois quarts de la course, puis se tient.
      const e = ease(Math.min(1, p / 0.88));
      planet.style.transform = `translateX(-50%) translateY(${((1 - e) * 34).toFixed(2)}%)`;
      planet.style.opacity = (0.08 + 0.92 * e).toFixed(3);

      // LE TEXTE arrive le premier, sur le premier quart : le lecteur lit le
      // mot pendant que l'astre se lève derrière.
      const tp = Math.min(1, p / 0.24);
      type.style.opacity = tp.toFixed(3);
      type.style.transform = `translateY(${((1 - tp) * 22).toFixed(2)}px)`;

      // LA PHRASE SUR LA PLANÈTE arrive EN DERNIER, à partir de 45 % de la
      // course. C'est délibéré : elle est posée sur le corps de l'astre, et
      // l'astre n'est pas encore monté à cet endroit-là au début. Apparue
      // plus tôt, elle flotterait sur du ciel noir puis se ferait recouvrir.
      const lp = Math.min(1, Math.max(0, (p - 0.45) / 0.22));
      line.style.opacity = lp.toFixed(3);
    };

    const onScroll = () => {
      if (!live || raf) return;
      raf = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        live = entry.isIntersecting;
        if (live) apply();
      },
      { rootMargin: "30% 0px 30% 0px" },
    );
    io.observe(wrap);

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
    };
  }, []);


  return (
    <>
      <style>{ATLAS_CSS}</style>

      {/* ══ L'OUVERTURE : UNE SCÈNE ÉPINGLÉE ═══════════════════════════════
          Client 2026-08-14, seconde passe : « on a la partie noire qui arrive
          et on a une animation où l'écran se bloque et il y a l'animation de
          la planète qui s'affiche. »
          C'est donc UNE SECTION À PART, et ce n'est pas un choix esthétique :
          la section Atlas porte `overflow-hidden` (plus `contain: paint`), et
          un ancêtre en overflow caché fait de lui-même le conteneur de
          défilement d'un `position: sticky` — l'épinglage n'aurait tout
          simplement pas eu lieu. Elle a donc son propre bloc, hors de cette
          contrainte, et la section suivante garde son rognage intact.
          La piste fait 200 vh : 100 vh d'écran figé plus 100 vh de course, la
          durée de la montée. */}
      <section
        id="atlas"
        data-nav-dark
        data-nav-shy
        className="relative z-[20] bg-black"
      >
        <div ref={skyWrapRef} className="relative h-[200vh]">
          <div className="at-sky sticky top-0 h-screen">
            <div aria-hidden className="at-lines" />

            {/* LA PLANÈTE. Diamètre à 150 % de la largeur de l'écran : elle
                doit sortir des deux côtés, sans quoi on lit un cercle et non
                un horizon. Son sommet est calé à 60 % de la hauteur, ce qui
                laisse le tiers de ciel noir que montre la capture entre le mot
                et l'arc.
                ⚠ RAMENÉE DE 178 À 150 % le 2026-08-15 (client : « que la
                planète soit un peu plus petite et qu'on voie qu'il y a des
                écritures juste en dessous »). À 178 %, l'arc était si tendu
                qu'il ne restait rien sous lui : la rangée de capacités qui
                ferme la scène, juste après, n'aurait pas eu de place. Un
                disque plus petit courbe davantage et dégage ce pied d'écran.
                SA MONTÉE EST ÉCRITE AU DÉFILEMENT, dans l'effet plus bas :
                elle entre par le bas et vient se poser. */}
            <div
              ref={planetRef}
              aria-hidden
              className="at-planet"
              style={{ width: "150%", aspectRatio: "1 / 1", top: "60%" }}
            >
              <div className="at-limbfade at-bloomfade">
                <div className="at-bloomring">
                  <div className="at-spin" style={{ background: LIMB }} />
                </div>
              </div>
              <div className="at-limbfade at-linefade">
                <div className="at-spin at-spin-slow" style={{ background: LIMB }} />
              </div>
              <div className="at-body" />
            </div>

            {/* Le pied du ciel se fond dans le noir de la section suivante :
                sans ce fondu, la fin du bloc noir se lisait comme une couture
                horizontale en travers de la page. Le noir est désormais celui
                de la section d'après (client 2026-08-15 : tout ce passage est
                sur fond noir), le fondu ne fait donc plus que tasser les
                hachures verticales avant la coupure. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 md:h-32"
              style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
            />

            {/* ⚠ LA RANGÉE DE PIED A ÉTÉ RETIRÉE le 2026-08-20. C'était un
                ourlet de cinq cellules posé sur le corps noir de la planète,
                repris de la capture attio du 2026-08-15 (« qu'on voie qu'il y
                a des écritures juste en dessous »). Les cinq capacités qu'elle
                portait vivent maintenant dans le bloc « Atlas en clair » juste
                sous cette section, en liste et avec une ligne d'appui chacune
                (voir ATLAS_CAPS). Les garder aux deux endroits aurait fait
                lire la même chose deux fois à un écran d'intervalle.
                Ce que l'ourlet faisait en plus, et qu'il ne faut pas perdre :
                il DISAIT QUE LA PAGE CONTINUE sous l'horizon. C'est désormais
                le bloc suivant qui s'en charge, en commençant haut et clair.
                Le dégradé de fondu vers le noir, juste au-dessus, reste : il
                appartient à l'horizon, pas à la rangée. */}

            <div ref={skyTypeRef} className="relative z-10 px-6 pt-[16vh] text-center md:px-12 md:pt-[19vh]">
              {/* LA PETITE ÉTOILE FILANTE EST REVENUE (client, même passe :
                  « tu as retiré l'espèce de petite étoile filante, elle rendait
                  très très bien, donc garde-la »). Elle avait sauté avec le
                  bloc à deux colonnes ; elle reprend sa place au-dessus du
                  surtitre, centrée, avec son flottement CSS. */}
              <img
                src="/logos/star-trail.png"
                alt=""
                aria-hidden
                draggable={false}
                className="atlas-star mx-auto mb-6 h-14 w-auto select-none object-contain md:h-16"
              />
              <p className="font-inter text-[clamp(0.95rem,1.5vw,1.3rem)] text-white/45">
                {t({ fr: "Vos dossiers, en orbite.", en: "Your folders, in orbit." })}
              </p>
              <h2 className="mt-2 font-poppins font-medium text-white text-[clamp(3.6rem,13vw,11rem)] leading-[0.94] tracking-[-0.045em]">
                Atlas
              </h2>
            </div>

            {/* ── LA PHRASE QUI S'ÉCRIT SUR LA PLANÈTE ──────────────────────
                Client 2026-08-15 : « dans la planète, en dessous d'Atlas, écris
                une phrase en gris qui s'écrit toute seule pour comprendre
                l'assistant. » Le mot « Atlas » nomme, il n'explique pas : trois
                écrans plus loin le lecteur découvrait seulement qu'Atlas est un
                assistant. La phrase le dit ici, à l'endroit où la question se
                pose.
                ⚠ ELLE EST POSÉE SUR LE CORPS DE L'ASTRE, à 72 % de la hauteur,
                et pas sous le titre : entre le titre et l'arc il n'y a que du
                ciel, et le fondu des hachures y passe. Le corps est le seul
                noir franc de la scène, donc le seul endroit où un gris tienne
                sans halo derrière lui. Elle reste au-dessus de la rangée de
                pied, qui commence plus bas.
                Son opacité est écrite au défilement comme le reste de la scène
                (voir l'effet plus haut) : elle ne s'allume qu'une fois la
                planète montée sous elle. */}
            <div
              ref={skyLineRef}
              style={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-[72%] z-10 px-8 text-center"
            >
              {/* ⚠ MESURE EN PIXELS, PAS EN `ch`, ET C'EST UN CORRECTIF. Un
                  `max-w-[56ch]` posé ici se résolvait à 379 px MESURÉS, là où
                  le calcul de coin de table en donnait 560 : l'unité `ch` vaut
                  la largeur du glyphe « 0 » de la police RÉELLEMENT appliquée,
                  et elle ne suit ni la mesure en caractères d'une phrase
                  proportionnelle ni le corps fixé par le `clamp`. La plus
                  longue des trois phrases demande ~400 px : elle passait donc à
                  la ligne, et un retour à la ligne EN COURS DE FRAPPE fait
                  sauter le bloc d'une ligne au milieu de l'animation, sur une
                  scène par ailleurs parfaitement immobile. 620 px laissent la
                  marge qu'il faut, y compris à la version anglaise. */}
              <p className="mx-auto max-w-[620px] font-inter text-[clamp(0.95rem,1.35vw,1.15rem)] leading-relaxed text-white/45">
                <Typewriter phrases={ATLAS_LINES.map((l) => t(l))} typeMs={44} holdMs={2600} />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ATLAS EN CLAIR, PATRON ATTIO ═══════════════════════════════════
          Client 2026-08-20, capture de la page Signals d'attio à l'appui :
          « pour cette partie, utilise un type de layout comme ça. N'essaie pas
          de répliquer leur animation à droite. Laisse un espace blanc, on verra
          ce qu'on met dedans. »

          CE QUI EST REPRIS DE LA RÉFÉRENCE, et rien d'autre :
            · la page coupée en DEUX MOITIÉS par un filet vertical, le propos à
              gauche, la scène à droite ;
            · la pastille de section au-dessus du titre ;
            · le titre en DEUX ENCRES, la seconde phrase en gris — c'est déjà la
              grammaire de titre du site, elle tombe juste ;
            · sous le bouton, une LISTE d'entrées séparées par des filets, titre
              court et une ligne d'appui.
          Ce qui n'est PAS repris : l'animation de droite, sur consigne. La
          moitié droite est laissée VIDE, en noir, et c'est un emplacement
          réservé, pas un oubli — voir le pavé qui la marque plus bas.

          ⚠ ELLE EST VIDE MAIS ELLE OCCUPE LA PLACE. Le filet vertical et la
          hauteur minimale sont là pour que la composition à deux colonnes se
          lise DÈS MAINTENANT : sans eux, la colonne de gauche s'étalerait sur
          toute la largeur et il faudrait tout recaler le jour où le visuel
          arrive. Sur téléphone, la moitié droite disparaît entièrement — une
          zone vide de 500 px de haut sur un écran de portable, c'est un bug aux
          yeux du visiteur, pas une réserve.

          Le fond reste NOIR, dans la continuité de la scène de la planète
          au-dessus et de la vidéo en dessous : les trois blocs se lisent comme
          une seule surface depuis le 2026-08-15. */}
      {/* LE RAIL D'ÉPINGLAGE : 360 vh sur md+ (100 d'écran + 260 de course,
          soit ~32 vh de défilement par capacité, huit capacités depuis le
          2026-08-23), hauteur libre sur téléphone où rien n'est épinglé.
          Voir le pavé de `capTrackRef` en tête de composant. */}
      <section
        ref={capTrackRef}
        data-nav-dark
        data-nav-shy
        className="relative z-[20] bg-black md:h-[360vh]"
      >
        {/* L'ÉCRAN FIGÉ : sticky nu, contenu centré verticalement. `h-screen`
            et non `min-h-screen` — la boîte épinglée doit faire exactement un
            écran, c'est le contenu qui se centre dedans. */}
        <div className="md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-center">
        {/* Les DEUX mises en page dev / production (RESERVE_VISUAL) ont vécu
            ici du 21 au 22 août, le temps que le visuel de droite existe.
            Retour à un seul chemin de rendu : deux colonnes, partout. */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 border-white/[0.10] md:grid-cols-2 md:border-x lg:grid-cols-[1fr_1.05fr]">
          {/* ── LA MOITIÉ GAUCHE : le propos ───────────────────────────────
              Les pas verticaux tombent à md : le centrage vertical de l'écran
              épinglé fait le travail que faisaient pt-28 / pb-24 en flux.
              ⚠ TOUT EST COMPACTÉ D'UN CRAN sur md (py-8, liste mt-10, entrées
              py-[18px]) : mesuré à 900 px de haut, la colonne en cadence de
              flux faisait ~1 130 px — le titre passait sous la barre de
              navigation et la cinquième entrée sortait de l'écran. Une scène
              épinglée doit tenir ENTIÈRE dans l'écran qui la fige, c'est tout
              son contrat. Le pt-16 asymétrique laisse la place de la barre de
              navigation, fixe par-dessus. */}
          <div className="px-6 pb-16 pt-20 md:px-10 md:pb-8 md:pt-16 lg:px-14">
            {/* La pastille. Bleu de la charte à faible opacité sur le noir,
                le seul accent de tout le bloc. */}
            <span className="inline-flex items-center rounded-[7px] bg-[#3b82f6]/[0.16] px-2.5 py-1 font-inter text-[12.5px] font-semibold tracking-[-0.01em] text-[#8ab4fa]">
              Atlas
            </span>

            {/* LE TITRE, en deux encres. La première phrase est la promesse
                déjà validée de la scène d'ouverture (« Atlas est l'assistant
                qui connaît vos dossiers ») ; la seconde, en gris, dit ce qui en
                découle. Rien de neuf n'est promis ici. */}
            {/* ⚠ LE CORPS DU TITRE EST DESCENDU (3,4 → 2,7 rem au plafond) le
                2026-08-22, en même temps que l'épinglage : à 3,4 rem le titre
                seul mangeait 173 px et la colonne débordait de l'écran figé
                des deux côtés, mesuré. C'est le prix de la scène épinglée — un
                écran figé doit contenir tout son propos. */}
            <h2 className="mt-6 font-instrument text-[clamp(2rem,2.9vw,2.7rem)] font-normal leading-[1.06] tracking-[-0.03em] md:mt-5">
              <span className="text-white">
                {t({
                  fr: "L'assistant qui connaît vos dossiers.",
                  en: "The assistant that knows your files.",
                })}
              </span>{" "}
              <span className="text-white/40">
                {t({
                  fr: "Il les a lus, il sait où regarder.",
                  en: "It has read them, it knows where to look.",
                })}
              </span>
            </h2>

            {/* Bouton cerclé, comme le « See more » de la référence : sur ce
                bloc c'est la liste qui doit tenir le regard, pas le bouton. Le
                bouton plein blanc reste celui de la grille, deux écrans plus
                bas, qui ferme la démonstration. */}
            <button
              type="button"
              onClick={openBooking}
              className="group mt-9 inline-flex items-center gap-2.5 rounded-full border border-white/25 px-5 py-2.5 font-inter text-[14px] font-semibold text-white transition-colors duration-150 hover:border-white/50 hover:bg-white/[0.06] md:mt-6"
            >
              {t({ fr: "Réserver un appel", en: "Book a call" })}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            {/* ── LA LISTE DES CINQ CAPACITÉS ────────────────────────────────
                Filets ENTRE les entrées et pas autour : `first:border-t-0`
                évite le double filet sous le bouton, `last:pb-0` évite le vide
                sous la dernière. C'est le détail qui distingue une liste d'une
                pile de cartes.
                L'icône est en tête de ligne, alignée sur la première ligne du
                titre (`mt-0.5`) et non centrée sur le bloc : les descriptions
                font une ou deux lignes selon la langue, un centrage ferait
                danser les icônes d'une entrée à l'autre. */}
            {/* `relative` : l'encadré actif est positionné dans le repère de
                cette liste, aux coordonnées mesurées de l'entrée courante. */}
            <ul ref={capListRef} className="relative mt-14 md:mt-8">
              {/* ── L'ENCADRÉ ACTIF ──────────────────────────────────────────
                  Un seul élément, qui GLISSE d'une entrée à l'autre (la
                  transition porte sur top et height) plutôt que cinq encadrés
                  qui s'allument : c'est le mouvement qui dit « on est passé à
                  l'argument suivant ». Débord horizontal de 16 px pour ne pas
                  coller au texte ; caché sous md, où rien n'est épinglé. */}
              {/* ⚠ SUR RESSORT depuis le 2026-08-22 (client : « les déplacements
                  d'encadré doivent être plus fluides, smooth et nets ») : la
                  transition CSS sur top/height donnait un glissement correct
                  mais sec — un ressort Framer (raideur 380, amortissement 36,
                  quasi sans dépassement) suit le défilement avec l'inertie
                  d'un objet qui pèse, et s'arrête net sans osciller. */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -left-4 -right-4 hidden rounded-[14px] border border-white/[0.22] bg-white/[0.04] md:block"
                animate={{ top: capFrame.top, height: capFrame.height }}
                transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
              />
              {/* ⚠ LA LISTE EST EN ACCORDÉON SUR L'ÉCRAN ÉPINGLÉ (2026-08-23) :
                  seule l'entrée ACTIVE déploie sa description, les autres ne
                  montrent que leur titre. Ce n'est pas un choix de style, c'est
                  LA condition de l'ajout des trois capacités : huit entrées à
                  descriptions ouvertes font ~990 px, l'écran épinglé en offre
                  900 — le contrat « tout le propos tient dans l'écran » sautait.
                  Repliées, les huit tiennent large, et le dépliement suit
                  l'encadré (le ResizeObserver du cadre remesure tout seul).
                  Sur téléphone, PAS d'accordéon : rien n'y est épinglé, toutes
                  les descriptions restent ouvertes — d'où les deux <p>, l'un
                  `md:hidden` (toujours ouvert), l'autre animé sur md. */}
              {ATLAS_CAPS.map((c, i) => {
                const Icon = c.icon;
                const ouverte = i === activeCap;
                return (
                  <li
                    key={c.label.en}
                    className="flex gap-4 border-t border-white/[0.10] py-6 first:border-t-0 first:pt-0 last:pb-0 md:py-[13px] md:last:pb-[13px]"
                  >
                    <Icon
                      aria-hidden
                      className={`mt-0.5 h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${
                        ouverte ? "md:text-white/80 text-white/45" : "text-white/45"
                      }`}
                      strokeWidth={1.6}
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-inter text-[15.5px] font-semibold leading-snug tracking-[-0.01em] transition-colors duration-300 md:text-[16px] ${
                          ouverte ? "text-white" : "text-white md:text-white/60"
                        }`}
                      >
                        {t(c.label)}
                      </h3>
                      <p className="mt-2 max-w-[46ch] font-inter text-[14px] leading-[1.55] text-white/45 md:hidden">
                        {t(c.desc)}
                      </p>
                      <motion.div
                        className="hidden overflow-hidden md:block"
                        initial={false}
                        animate={{ height: ouverte ? "auto" : 0, opacity: ouverte ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }}
                      >
                        <p className="mt-1.5 max-w-[46ch] pb-0.5 font-inter text-[13.5px] leading-[1.45] text-white/45">
                          {t(c.desc)}
                        </p>
                      </motion.div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── LA MOITIÉ DROITE : L'ANIMATION DE L'ARGUMENT ACTIF ──────────
              L'emplacement réservé du 2026-08-20 reçoit ses visuels : la boucle
              AtlasLiveAsk (question tapée → étapes → résultat, façon
              DataSnipper), et depuis le 2026-08-22 la PREMIÈRE animation par
              argument — AtlasLiveNotify, le flux de notifications, qui prend
              l'écran quand l'encadré de gauche est sur « Signale ce qui
              impacte un dossier » (activeCap === 3).
              Les deux vivent dans la même cellule de grille et se croisent en
              fondu de 500 ms ; la scène masquée reçoit `active={false}` et
              coupe ses minuteurs — pas de boucle qui mouline en coulisse.
              Les trois autres arguments montrent la boucle AtlasLiveAsk en
              attendant leurs propres scènes.
              `hidden md:grid` : sur téléphone les deux colonnes s'empilent, et
              une simulation en boucle sous la liste allongerait l'écran pour un
              décor. */}
          {/* ⚠ CINQ ANIMATIONS depuis le 2026-08-23, une par famille
              d'arguments, toutes dans la même cellule et croisées en fondu de
              350 ms. La carte des correspondances :
                0-2 (chercher, relier, valider) → la boucle AtlasLiveAsk ;
                3 (signale)                     → le flux AtlasLiveNotify ;
                4 (lit les documents)          → AtlasLiveDocs ;
                5 (relance les pièces)         → AtlasLiveRelance ;
                6 (prépare la journée)         → AtlasLiveJour ;
                7 (ne sort jamais)             → la boucle AtlasLiveAsk, qui
                  finit sur le dossier ouvert — l'écran le plus « chez vous »
                  des cinq, à défaut d'une scène dédiée à la confidentialité.
              Chaque scène masquée reçoit `active={false}` : minuteurs coupés,
              reprise à zéro au retour. */}
          <div className="hidden border-l border-white/[0.10] md:grid md:items-center md:px-6 md:py-16 lg:px-8">
            {/* ⚠ `relative` : c'est le repère de la glose, posée en ABSOLU sous
                la scène. En flux elle comptait dans la boîte centrée et tirait
                l'animation 48 px trop haut (centre de carte à 402 px pour une
                colonne centrée à 450, mesuré). Hors flux, la boîte ne fait plus
                que la hauteur de la scène, qui retrouve le centre exact. */}
            <div className="relative">
            <div className="relative grid">
              {/* LE DÉCOR, UNIQUE ET PARTAGÉ (2026-08-23) : il vivait dans
                  AtlasLiveAsk et disparaissait donc avec elle à chaque bascule
                  d'argument — le fond clignotait. Posé ICI, derrière les cinq
                  scènes, il ne bouge plus jamais : les cartes se croisent sur
                  un fond stable, et c'est ce qui rend les bascules douces. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-6 -inset-y-10"
                style={{
                  background:
                    "radial-gradient(55% 45% at 72% 22%, rgba(13,148,136,0.12) 0%, transparent 68%), radial-gradient(50% 42% at 22% 78%, rgba(59,130,246,0.10) 0%, transparent 66%), linear-gradient(115deg, transparent 48%, rgba(255,255,255,0.02) 48%)",
                }}
              />
              {/* ⚠ UNE SEULE SCÈNE MONTÉE, CLÉE SUR L'ARGUMENT (2026-08-23,
                  client : « crée une distinction entre passage d'animation en
                  animation ») : à CHAQUE changement d'encadré — même entre deux
                  arguments servis par la même boucle — la scène sortante glisse
                  et s'éteint, l'entrante monte en ressort, et le remontage
                  remet l'état à zéro sans mécanique supplémentaire. L'ancienne
                  pile de cinq scènes en opacité ne marquait RIEN entre les
                  arguments 0, 1, 2 et 7. Le décor, lui, reste posé derrière :
                  c'est lui qui donne la continuité pendant que les scènes
                  changent. */}
              {/* `custom` EST PORTÉ DEUX FOIS : sur AnimatePresence il alimente
                  la scène QUI SORT (déjà retirée de l'arbre, elle n'a plus que
                  celui-ci), sur la motion.div celle qui ENTRE. */}
              <AnimatePresence custom={{ sens, i: sceneCap }}>
                {/* L'ENTRÉE CHANGE DE CÔTÉ avec l'argument : deux scènes
                    consécutives n'arrivent jamais du même côté. Le VERTICAL,
                    lui, suit le sens du défilement. */}
                <motion.div
                  key={sceneCap}
                  custom={{ sens, i: sceneCap }}
                  variants={SCENE_VARIANTS}
                  initial="avant"
                  animate="pose"
                  exit="apres"
                  className="col-start-1 row-start-1 self-center"
                >
                  {/* ══ LES SCÈNES ANIMÉES, DANS LE CADRE BLEU ══════════════
                      Client 2026-08-29 : « les animations qui étaient avant sur
                      un fond noir doivent se faire dans le cadre bleu, et
                      agrandis-le légèrement en largeur ». Les vignettes fixes
                      auront tenu une passe : c'est bien la plaque des vignettes
                      qui reste (même rayon de 36 px, mêmes dégradés, choisis
                      par argument via CAP_VISUELS pour garder la variété de la
                      série), mais elle accueille les CINQ SCÈNES VIVANTES.

                      ⚠ `.at-plate` N'EST PAS DÉCORATIF : c'est l'ancre du remap
                      d'encres défini dans ATLAS_CSS. Les scènes ont été
                      dessinées pour le noir — libellés d'étapes en blanc à
                      70 %, pilules fantômes en blanc à 6 % — et seraient
                      illisibles sur bleu clair sans lui. Le retirer casse la
                      lisibilité SANS erreur nulle part.

                      ⚠ LES OMBRES DES CARTES restent celles du fond noir
                      (rgba(0,0,0,.7)) : sur la plaque claire elles se rendent
                      un cran plus lourdes que sur les vignettes. Assumé — les
                      adoucir demanderait de forker les cinq scènes, et c'est
                      précisément ce que le remap évite.

                      PLUS LARGE, PAR LES DEUX BOUTS : la plaque tient toute la
                      colonne (max 560 px contre 470 à la vignette) ET la
                      colonne elle-même s'élargit d'un cran (px-8 → px-6 à md,
                      lg:px-12 → lg:px-8 sur le conteneur parent). Le rembourrage
                      interne (p-6/p-8) laisse ~500 px utiles : la largeur
                      naturelle des scènes, aucune mise à l'échelle. */}
                  <div
                    ref={plateRef}
                    className="at-plate relative flex min-h-[440px] w-full max-w-[560px] items-center justify-center overflow-hidden rounded-[36px] p-6 md:p-8"
                    style={{ background: PLATE_FONDS[CAP_VISUELS[sceneCap]] }}
                  >
                    {/* La scène vivante N'EST MONTÉE qu'à la fin du temps figé :
                        montée cachée, ses minuteries tourneraient déjà et elle
                        entrerait en cours de route au lieu de démarrer. */}
                    {/* L'enveloppe at-scene-entre porte la moitié « mise au
                        point » du morphing : la scène émerge du même flou que
                        la vignette qui se dissout au-dessus d'elle. */}
                    {vif && (
                      <div className="at-scene-entre flex w-full items-center justify-center">
                        {sceneCap === 3 ? (
                          <AtlasLiveNotify />
                        ) : sceneCap === 4 ? (
                          <AtlasLiveDocs />
                        ) : sceneCap === 5 ? (
                          <AtlasLiveRelance />
                        ) : sceneCap === 6 ? (
                          <AtlasLiveJour />
                        ) : (
                          <AtlasLiveAsk variante={sceneCap} />
                        )}
                      </div>
                    )}

                    {/* ── LA VIGNETTE FIGÉE, PAR-DESSUS ──────────────────────
                        Le « design d'origine de l'encadré » que demande le
                        client : la vignette de la grille, à l'échelle de la
                        plaque, tenue 650 ms puis fondue en 300 ms pendant que
                        la scène entre en ressort dessous.
                        ⚠ ELLE COUVRE LA PLAQUE ENTIÈRE (inset-0, hors du
                        rembourrage) : son propre fond est LE MÊME dégradé que
                        la plaque (PLATE_FONDS est recopié d'AV_CSS), la
                        jointure est donc invisible et le fondu ne fait bouger
                        que les cartes blanches — pas le fond. */}
                    {/* Plus de fondu plat : à `sortie`, la classe at-fige-sortie
                        lance le décollage par élément défini dans ATLAS_CSS, et
                        la vignette reste montée jusqu'à la fin de la cascade.
                        Une fois ses blocs partis il ne reste d'elle que son
                        dégradé, identique à celui de la plaque : le démontage
                        est invisible. */}
                    {figeOn && (
                      <div
                        className={`absolute inset-0 overflow-hidden rounded-[36px]${sortie ? " at-fige-sortie" : ""}`}
                      >
                        <div
                          className="absolute left-0 top-0 h-[880px] w-[1000px] origin-top-left"
                          style={{ transform: `scale(${plateW / 1000})` }}
                        >
                          <AtlasSlideVisual
                            visual={CAP_VISUELS[sceneCap]}
                            ask=""
                            label={t(ATLAS_CAPS[sceneCap].label)}
                            textless
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── LA GLOSE, SOUS L'ANIMATION ───────────────────────────────
                Client 2026-08-28 : une petite description en gris sous
                l'animation, qui s'écrit au fur et à mesure et dit ce que le
                client Y GAGNE (la liste de gauche dit ce qu'Atlas FAIT).

                ⚠ `key={sceneCap}` : à chaque changement d'argument le composant
                est REMONTÉ, la frappe repart donc de zéro en même temps que la
                scène entre. `sceneCap` et non `activeCap` : la glose appartient
                à l'animation, elle doit se poser avec elle — branchée sur
                l'index immédiat elle repartait sept fois par coup de molette.

                ⚠ `loop={false}` : elle s'écrit UNE FOIS et reste. Le mode par
                défaut l'effacerait au bout de 2,2 s.

                ⚠ `min-h-[4.5em]` : la boîte tient déjà la hauteur du texte
                complet pendant la frappe, sinon la colonne remonterait d'une
                ligne en cours de route. Mesuré : les 16 textes (8 fr + 8 en)
                font tous exactement 63 px, l'animation ne bouge jamais.

                ⚠ `top-full` l'ancre au BAS DE LA SCÈNE : les scènes vont de 283
                à 366 px de haut, une glose à hauteur fixe se décollerait de la
                plus courte.

                FRAPPE À 11 ms ET 90 ms D'ATTENTE (défauts : 52 et 420). À
                34 ms, 5,2 s pour 140 signes — plus longtemps qu'on ne reste sur
                un argument, donc la moitié des visiteurs ne la voyaient jamais
                en entier. Mesurée à 1,95 s. */}
            <p className="absolute inset-x-0 top-full mt-8 min-h-[4.5em] max-w-[54ch] font-inter text-[13.5px] leading-[1.5] text-white/45 lg:text-[14px]">
              <Typewriter
                key={sceneCap}
                phrases={[t(ATLAS_CAPS[sceneCap].apport)]}
                typeMs={11}
                startMs={90}
                loop={false}
              />
            </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ── LA DÉMO DE L'ASSISTANT ──────────────────────────────────────────
          Client 2026-08-19 : « il faut que la vidéo soit juste en dessous de »
          la rangée des cinq capacités — l'ourlet qui ferme la scène de la
          planète, juste au-dessus. L'enregistrement ORA_demo_Assistant_six_
          usages montre l'assistant en situation sur six demandes : la version
          RÉELLE de ce que le carrousel simule plus bas. Il avait d'abord été
          posé après tout Atlas, sur fond clair ; il est remonté ici.
          SUR LE NOIR, et ce n'est pas un choix libre : la scène d'ouverture et
          le carrousel se lisent comme une seule surface noire depuis le
          2026-08-15, une bande claire entre les deux la couperait en travers.
          D'où `tone="dark"` sur la barre de lecture (rail blanc translucide,
          le rail encre serait invisible ici) et le liseré blanc à 10 % à la
          place de l'ombre, qu'un fond noir avale de toute façon.
          56 secondes qui racontent quelque chose, donc AVEC la barre — même
          règle que le clip du module dans AutomationTabs. Lu par InViewVideo :
          MUET (sa piste audio n'est pas jouée, condition de l'autoplay), en
          boucle, piloté au défilement, reprise à zéro à chaque entrée.
          LARGEUR : `max-w-7xl`, la MÊME que le carrousel juste en dessous
          (l:807). Client 2026-08-19 : « plus de place en longueur et en
          largeur » — le cadre est passé de 980 px à 1280 px, et le rapport
          16/9 verrouillé fait suivre la hauteur (551 → 720 px). Reprendre la
          largeur du carrousel plutôt qu'un nombre libre aligne les deux blocs
          sur les mêmes bords, à toutes les tailles d'écran : ils se lisent
          comme une seule colonne sur le noir continu. Si le carrousel change
          de largeur un jour, celle-ci doit suivre.
          Le pas au-dessus est retombé de pt-24 à pt-16 : à 720 px de haut, la
          vidéo ne tient plus dans une fenêtre de portable avec l'ancien blanc. */}
      {/* Le pas du haut est remonté de pt-16 à pt-28 le 2026-08-22 (client :
          « fais un plus grand espace entre cette partie et celle juste en
          dessous ») : l'animation AtlasLiveAsk vit désormais au-dessus, elle a
          besoin d'air avant que la vidéo n'enchaîne. */}
      <section
        data-nav-dark
        data-nav-shy
        className="relative z-[20] bg-black px-6 md:px-12 pt-20 md:pt-28 pb-2 md:pb-4"
      >
        <div className="mx-auto w-full max-w-7xl">
          <VideoWithScrubber
            src="/ORA_demo_Assistant_six_usages.mp4"
            tone="dark"
            frameClassName="relative overflow-hidden rounded-[12px] ring-1 ring-white/10"
            frameStyle={{ aspectRatio: "1920 / 1080" }}
            className="block h-full w-full object-cover"
          />
        </div>
      </section>

    {/* ══ « CE QU'ATLAS SAIT FAIRE » A ÉTÉ RETIRÉE (2026-08-30) ═══════════
        Client : « supprime cette partie du site maintenant du coup ». Le
        « du coup » dit la raison : depuis que les six vignettes illustrent
        l'écran épinglé argument par argument (l'image figée qui s'éveille),
        cette section blanche les remontrait TOUTES trois écrans plus bas —
        la page aurait dit deux fois la même chose, dans le même ordre.
        Sont partis avec elle : la grille des six usages, son bouton, le
        rideau blanc arrondi qui montait au défilement (riseY), et le
        carrousel à onglets du bas qui dormait derrière un false && depuis le
        2026-08-05. Le passage vers la section suivante se fait en coupe
        franche noir → blanc, comme partout ailleurs sur le site.
        USE_CASES est parti aussi : l'écran épinglé choisit ses vignettes par
        CAP_VISUELS et ses textes par ATLAS_CAPS, il n'en dépendait pas. Ses
        six fiches (tag, titre en deux encres, ligne, ask balisé) étaient de la
        copie VALIDÉE : historique git de ce fichier à cette date pour les
        récupérer. */}

    {/* ══ « CRÉATION DE SYSTÈME D'ORCHESTRATION » A ÉTÉ RETIRÉE ═══════════
        Client 2026-08-15 : « enlève cette partie-là », titre, phrase et carte
        des accès comprise (« Accès au dossier Nexio », l'invitation par e-mail
        et les quatre personnes avec leurs droits).
        Le bloc n'avait vécu qu'une passe sur fond clair. Ce qu'il portait est
        dit ailleurs et mieux : le carrousel montre Atlas EN TRAIN de chercher
        dans les dossiers, et la section à onglets porte déjà le sur-mesure
        (« Automatisations », Ora Engineering). Sa section blanche part avec
        lui : elle n'existait que pour lui, et la page enchaîne désormais le
        noir d'Atlas sur « Ora se télécharge en un clic ».
        Sont partis avec : FileChipStrip (les pastilles de formats) et le
        conteneur d'entrée Framer de cette section. La carte des accès est dans
        l'historique git de ce fichier, à la date du 2026-08-15.
        AtlasShowcase rend donc TROIS sections : la scène épinglée, la démo de
        l'assistant, et le carrousel. */}

    </>
  );
}


/* `slideVariants` et `cardVariants` vivaient ici : les deux glissades du
   carrousel des usages, l'une pour la phrase, l'autre pour le panneau. Elles
   sont parties avec lui le 2026-08-19, la grille n'ayant rien à faire glisser
   d'un côté à l'autre. */

