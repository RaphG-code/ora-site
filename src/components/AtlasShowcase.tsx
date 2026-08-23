import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileOutput,
  FolderSearch,
  GitCompare,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  Search,
  ShieldCheck,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { MockupHome, MockupManager } from "./AtlasMockups";
import InViewVideo, { VideoWithScrubber } from "./InViewVideo";
import ScaleToFit from "./ScaleToFit";
// ⚠ `AtlasSlideVisual` n'est plus MONTÉ ici depuis que la grille a remplacé le
// carrousel (2026-08-19), mais son type l'est : le champ `visual` de USE_CASES
// le garde, et c'est ce qui permettra de remonter les six scènes sans les
// réécrire. Le composant lui-même reste intact dans AtlasSlideVisual.tsx.
import { type AtlasVisual } from "./AtlasSlideVisual";
import Typewriter from "./Typewriter";

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

/** La rangée qui ferme la scène d'ouverture, sous l'horizon. Cinq capacités,
 *  dites en une ligne chacune : c'est un ourlet, pas un argumentaire. */
const SKY_FOOT: { icon: LucideIcon; label: { fr: string; en: string } }[] = [
  { icon: Search, label: { fr: "Cherche dans vos dossiers", en: "Searches your own files" } },
  { icon: Waypoints, label: { fr: "Relie chaque fichier à ses sources", en: "Links every file to its sources" } },
  { icon: ListChecks, label: { fr: "Montre ce qui reste à valider", en: "Shows what is left to validate" } },
  { icon: History, label: { fr: "Garde le journal de chaque geste", en: "Keeps a log of every action" } },
  { icon: ShieldCheck, label: { fr: "Ne sort jamais de chez vous", en: "Never leaves your machines" } },
];

/** ── CE QU'ON PEUT DEMANDER À ATLAS ────────────────────────────────────────
 *  Une vue = un titre à gauche, une SCÈNE à droite (AtlasSlideVisual).
 *  Les six sont volontairement de NATURES DIFFÉRENTES (retrouver, contrôler,
 *  produire, suivre, tracer, comparer) : c'est ce qui montre l'étendue, là où
 *  six variantes de la même question ne montreraient qu'une fonction.
 *
 *  ⚠ `answer` ET `sources` ONT ÉTÉ RETIRÉS le 2026-08-15, avec le panneau
 *  d'assistant qui les affichait. Ils faisaient répondre Atlas en langage
 *  naturel et citer ses fichiers, c'est-à-dire qu'ils montraient une fonction
 *  qui n'existe pas dans le logiciel (voir le pavé d'AtlasSlideVisual.tsx). Les
 *  garder en données non rendues n'aurait servi à rien : ce qui doit rester
 *  lisible d'une vue, c'est son titre et sa phrase, et ils sont là. Leur texte
 *  est dans l'historique git de ce fichier à cette date.
 *
 *  ⚠ « SUIVI CLIENT » A ÉTÉ RETIRÉ le même jour, une vue après avoir été
 *  ajouté. La fonctionnalité n'est pas construite : c'est l'item n°1 du
 *  reste-à-faire côté logiciel, bloqué par une décision produit. Toute cette
 *  passe consiste à cesser d'annoncer ce qui n'existe pas ; garder l'onglet
 *  avec une pastille « Bientôt » aurait réintroduit le problème en miniature,
 *  et invité la question « et les six autres ? ». Il y a un visuel prêt pour
 *  lui (suivi-client-abstrait.html) : le remettre, c'est réécrire cette entrée
 *  et remettre `Contact` dans les imports. */
type UseCase = {
  /** L'icône de l'onglet. Elle n'illustre pas la scène, elle aide à retrouver
   *  un onglet du regard une fois qu'on en a essayé trois. */
  icon: LucideIcon;
  tag: { fr: string; en: string };
  /** LE TITRE, en deux encres, PROPRE À CHAQUE VUE (client 2026-08-15 :
   *  « que la phrase Posez votre question change en fonction du choix de
   *  l'utilisateur dans la barre d'options »). `a` est la question qu'on se
   *  pose, en blanc ; `b` est ce qu'Atlas en fait, en gris. */
  head: { a: { fr: string; en: string }; b: { fr: string; en: string } };
  line: { fr: string; en: string };
  /** La scène rendue à droite. */
  visual: AtlasVisual;
  /** La demande écrite dans la carte blanche de la scène. Les doubles crochets
   *  marquent la référence mise en bleu : `[[Nexio SAS]]`, ou `[[f:Modèle]]`
   *  quand elle porte l'icône de fichier. Voir renderAsk. */
  ask: { fr: string; en: string };
  /** Ce que la scène MONTRE, pour un lecteur d'écran : elle n'est faite que de
   *  blocs vides, il n'y a rien à y lire. */
  alt: { fr: string; en: string };
};

const USE_CASES: UseCase[] = [
  {
    icon: FolderSearch,
    tag: { fr: "Bouclage", en: "Closing" },
    head: {
      a: { fr: "Où en est ce dossier ?", en: "Where does this file stand?" },
      b: { fr: "Atlas fait le tour des pièces.", en: "Atlas goes through the documents." },
    },
    line: {
      fr: "Retrouvez une pièce sans rouvrir dix dossiers.",
      en: "Find a document without reopening ten folders.",
    },
    visual: "bouclage",
    ask: {
      fr: "Où en est le bouclage de [[Nexio SAS]] ?",
      en: "Where does the [[Nexio SAS]] closing stand?",
    },
    alt: {
      fr: "Une liste de cinq pièces : quatre cochées, une encore ouverte.",
      en: "A list of five documents: four ticked, one still open.",
    },
  },
  {
    icon: Waypoints,
    tag: { fr: "Contrôle", en: "Control" },
    head: {
      a: { fr: "D'où sort ce chiffre ?", en: "Where does this figure come from?" },
      b: { fr: "Atlas remonte la chaîne.", en: "Atlas walks back up the chain." },
    },
    line: {
      fr: "Remontez un chiffre jusqu'à sa source.",
      en: "Trace a figure back to its source.",
    },
    visual: "controle",
    ask: {
      fr: "D'où vient la marge affichée dans le [[f:reporting de juin]] ?",
      en: "Where does the margin in the [[f:June reporting]] come from?",
    },
    alt: {
      fr: "Une source, un retraitement et le chiffre affiché, reliés par un fil.",
      en: "A source, a rework step and the resulting figure, linked by a thread.",
    },
  },
  {
    icon: FileOutput,
    tag: { fr: "Livrables", en: "Deliverables" },
    head: {
      a: { fr: "Il vous faut un livrable ?", en: "Need a deliverable?" },
      b: { fr: "Atlas le monte sur vos modèles.", en: "Atlas builds it on your templates." },
    },
    line: {
      fr: "Montez un livrable à partir de ce qui existe déjà.",
      en: "Build a deliverable from what already exists.",
    },
    visual: "livrables",
    ask: {
      fr: "Montez la synthèse du comité sur [[f:Modèle comité]], à partir du dernier [[f:reporting validé]]",
      en: "Build the committee summary on [[f:Committee template]], from the last [[f:approved reporting]]",
    },
    alt: {
      fr: "Deux documents existants en arrière-plan, le livrable monté devant.",
      en: "Two existing documents behind, the built deliverable in front.",
    },
  },
  {
    icon: Users,
    tag: { fr: "Suivi d'équipe", en: "Team tracking" },
    head: {
      a: { fr: "Qui attend quoi ?", en: "Who is waiting on what?" },
      b: { fr: "Atlas fait le point pour vous.", en: "Atlas takes stock for you." },
    },
    line: {
      fr: "Voyez qui attend quoi, sans faire le tour des bureaux.",
      en: "See who is waiting on what, without touring the desks.",
    },
    visual: "equipe",
    ask: {
      fr: "Où en est [[l'équipe]] cette semaine ?",
      en: "Where does [[the team]] stand this week?",
    },
    alt: {
      fr: "Quatre couloirs d'avancement, un par personne.",
      en: "Four progress lanes, one per person.",
    },
  },
  {
    icon: History,
    tag: { fr: "Traçabilité", en: "Audit trail" },
    head: {
      a: { fr: "Qui a touché à quoi ?", en: "Who touched what?" },
      b: { fr: "Atlas garde le journal.", en: "Atlas keeps the log." },
    },
    line: {
      fr: "Sachez qui a modifié quoi, et quand.",
      en: "Know who changed what, and when.",
    },
    visual: "tracabilite",
    ask: {
      fr: "Qui a touché à ce [[fichier]], et quand ?",
      en: "Who touched this [[file]], and when?",
    },
    alt: {
      fr: "Un fil vertical et cinq événements datés, qui s'efface vers le bas.",
      en: "A vertical thread with five dated events, fading downwards.",
    },
  },
  {
    icon: GitCompare,
    tag: { fr: "Comparaison", en: "Comparison" },
    head: {
      a: { fr: "Deux périodes à comparer ?", en: "Two periods to compare?" },
      b: { fr: "Atlas monte le comparatif.", en: "Atlas builds the comparison." },
    },
    line: {
      fr: "Comparez deux périodes sans reconstruire un tableau.",
      en: "Compare two periods without rebuilding a table.",
    },
    visual: "comparaison",
    ask: {
      fr: "Qu'est-ce qui a bougé entre les [[deux versions]] ?",
      en: "What moved between the [[two versions]]?",
    },
    alt: {
      fr: "Deux panneaux jumeaux, une seule ligne diffère.",
      en: "Two twin panels, a single row differs.",
    },
  },
];

/**
 * LE GRAIN DES TUILES. Un `feTurbulence` rendu une fois en data-URI, répété en
 * fond : c'est ce qui donne aux tuiles de la référence OpenAI leur matière
 * diffuse plutôt qu'un aplat de dégradé propre.
 *
 * Pourquoi un data-URI et pas un `<svg>` avec un `<filter>` posé sur l'élément :
 * un filtre SVG appliqué à un nœud du DOM est recalculé par le navigateur à
 * chaque repeinture de ce nœud. Six tuiles filtrées dans une section qui défile
 * au-dessus d'une pile de cartes épinglées, c'était le poste de dessin le plus
 * cher de la page. En image de fond, le bruit est rastérisé UNE fois et
 * simplement recopié.
 *
 * ⚠ Les `#` doivent rester encodés en `%23` dans l'URI (`url(%23n)` et non
 * `url(#n)`) : un `#` nu ouvre un fragment d'URL et le filtre n'est jamais
 * trouvé, la tuile se rend alors en dégradé nu, sans erreur en console.
 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='170' height='170' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * LES SIX FONDS DE TUILE, un par usage, dans l'ordre de USE_CASES.
 *
 * Chacun est en DEUX couches : un halo blanc en haut à gauche, puis le dégradé
 * de la charte. Le halo est ce qui fait la lumière douce de la référence — sans
 * lui un dégradé linéaire se lit comme un aplat de PowerPoint.
 *
 * ⚠ AUCUNE TEINTE HORS CHARTE ICI. La salle de presse OpenAI enchaîne des
 * roses, des oranges et des verts ; reprendre ce nuancier casserait la règle
 * « un seul bleu » de CLAUDE.md et ferait six couleurs de marque là où le site
 * en a deux. Les six tuiles se distinguent donc par la COMBINAISON, le SENS et
 * l'ANGLE du dégradé, pas par la teinte : bleu (#3b82f6), bleu foncé (#2563eb)
 * et sarcelle (#0d9488), rien d'autre.
 *
 * ⚠ ET AUCUNE NE FINIT SUR UNE ENCRE SOMBRE. Deux d'entre elles descendaient
 * vers #0f172a (le fond de section alterné de la charte). Mesuré à l'écran :
 * posées sur le NOIR de cette section, leur moitié basse se confondait avec le
 * fond et la tuile perdait deux de ses bords — elle ne se lisait plus comme un
 * objet mais comme une tache éclairée par le haut. Sur fond noir, une tuile
 * doit rester lumineuse d'un bout à l'autre.
 */
const TILE_ART = [
  "radial-gradient(120% 95% at 22% 18%, rgba(255,255,255,0.42), transparent 62%), linear-gradient(145deg, #3b82f6, #0d9488)",
  "radial-gradient(120% 95% at 78% 20%, rgba(255,255,255,0.38), transparent 60%), linear-gradient(200deg, #0d9488, #2563eb)",
  "radial-gradient(130% 100% at 30% 82%, rgba(255,255,255,0.34), transparent 64%), linear-gradient(125deg, #2563eb, #3b82f6)",
  "radial-gradient(118% 92% at 72% 80%, rgba(255,255,255,0.40), transparent 60%), linear-gradient(20deg, #0d9488, #3b82f6)",
  "radial-gradient(125% 95% at 75% 78%, rgba(255,255,255,0.36), transparent 62%), linear-gradient(135deg, #3b82f6, #2563eb)",
  "radial-gradient(120% 95% at 26% 24%, rgba(255,255,255,0.40), transparent 60%), linear-gradient(175deg, #2563eb, #0d9488)",
];

type TabId = "galaxy" | "dashboard" | "manager";

type Tab = {
  id: TabId;
  icon: LucideIcon;
  /** Solid color for the circular icon badge (Monday-style). */
  iconBg: string;
  label: string;
};

export default function AtlasShowcase({ openBooking }: { openBooking: () => void }) {
  const { t } = useLang();
  // Tab state for the lower demo area (pills above the Atlas video). Galaxy
  // shows the video; the other tabs reuse their mockups. The top mockup is no
  // longer tabbed — it always shows the interactive galaxy.
  const [bottomTab, setBottomTab] = useState<TabId>("galaxy");

  /* ── L'ÉTAT DU CARROUSEL DES USAGES A ÉTÉ RETIRÉ (2026-08-19) ────────────
   * Il vivait ici : `slide`, `dir`, la fonction `go`, la vue courante `uc`, et
   * un effet qui recentrait la barre d'onglets défilante sur l'onglet actif.
   * Les six usages sont désormais rendus TOUS ENSEMBLE, en grille façon salle
   * de presse OpenAI (voir le bloc plus bas) : plus rien à l'écran ne dépend
   * d'un index, il n'y a donc plus d'index à tenir.
   * `slideVariants` et `cardVariants`, en bas de fichier, sont partis avec. */

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

  const tabs: Tab[] = [
    {
      id: "galaxy",
      icon: Globe,
      iconBg: "bg-pink-500",
      label: t({
        fr: "Visualisez vos dossiers comme une galaxie",
        en: "See your folders as a galaxy",
      }),
    },
    {
      id: "dashboard",
      icon: LayoutDashboard,
      iconBg: "bg-blue-500",
      label: t({
        fr: "Pilotez votre activité en un coup d'œil",
        en: "Steer your work at a glance",
      }),
    },
    {
      id: "manager",
      icon: Users,
      iconBg: "bg-emerald-500",
      label: t({
        fr: "Coordonnez vos équipes en temps réel",
        en: "Coordinate your teams in real time",
      }),
    },
  ];

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
        <div ref={skyWrapRef} className="relative h-[145vh] md:h-[200vh]">
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

            {/* ── LA RANGÉE DE PIED, reprise de la capture attio ─────────────
                Client 2026-08-15 : « qu'on voie qu'il y a des écritures juste
                en dessous ». C'est la fonction exacte de cette bande dans la
                référence : elle borde l'horizon par le bas et dit au lecteur
                que la page continue. Elle est POSÉE SUR LE CORPS NOIR de la
                planète, ce qui n'est pas un hasard — c'est la seule surface
                vraiment noire de la scène, donc la seule où un texte blanc
                tienne sans halo derrière lui.
                Les filets verticaux ne séparent que sur grand écran : à trois
                colonnes sur téléphone ils redécouperaient des cellules déjà
                étroites. Les deux dernières entrées y sont d'ailleurs
                masquées, faute de largeur pour cinq libellés. */}
            <div
              className="absolute inset-x-0 bottom-0 z-10 border-t border-white/[0.13]"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.55))" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-5">
                {SKY_FOOT.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label.en}
                      /* ⚠ LES CINQ SONT VISIBLES SUR TÉLÉPHONE (audit du
                         2026-08-15). Les deux dernières étaient masquées sous
                         md « faute de largeur », et l'une d'elles est « Ne sort
                         jamais de chez vous » : on retirait donc au visiteur
                         mobile l'argument de confidentialité, qui est le
                         différenciateur du produit. Une grille 2 colonnes sur
                         téléphone les loge toutes, et le filet passe de vertical
                         à horizontal pour séparer les rangées. */
                      className={`flex flex-col gap-2 px-3 py-3 md:gap-3 md:px-6 md:py-6 ${
                        i > 1 ? "border-t border-white/[0.13] md:border-t-0" : ""
                      } ${i % 2 === 1 ? "border-l border-white/[0.13] md:border-l" : ""} ${
                        i > 0 ? "md:border-l md:border-white/[0.13]" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 text-white/55 md:h-[18px] md:w-[18px]" strokeWidth={1.6} />
                      <span className="font-inter text-[11.5px] leading-snug text-white/55 md:text-[13px]">
                        {t(f.label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

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
          53 secondes qui racontent quelque chose, donc AVEC la barre — même
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
      <section
        data-nav-dark
        data-nav-shy
        className="relative z-[20] bg-black px-5 md:px-12 pt-6 md:pt-16 pb-2 md:pb-4"
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

    <section
      data-nav-dark
      data-nav-shy
      className="relative z-[20] pt-8 md:pt-14 pb-16 md:pb-32 px-5 md:px-12 overflow-hidden"
      style={{
        // ── NOIR PLEIN, PARTOUT (client 2026-08-15 : « mets en noir le fond de
        // toute cette partie-là »). Un dégradé radial bleu nuit ouvrait la
        // section (#0f1424 au sommet sur grand écran, #0a0a0a sur téléphone) :
        // il faisait une couture visible juste sous la scène d'ouverture, qui,
        // elle, est en noir absolu. Les deux blocs se lisent maintenant comme
        // une seule surface. Le drapeau `isMobile` qui départageait les deux
        // rampes est parti avec, il ne servait plus qu'à ça.
        background: "#000",
        // ── FLUIDITÉ DE LA REMONTÉE (client 2026-08-05 : « la remontée de la
        // partie Atlas est un peu buggée, fluidifie-la ») ──────────────────
        // La section n'est pas animée : elle défile normalement et passe
        // PAR-DESSUS la pile de cartes épinglées grâce à son `z-20`. C'est donc
        // au navigateur de la redessiner à chaque image du scroll, et c'était
        // cher : gradient radial plein écran, halo, cadre, et la simulation
        // Atlas entière dessous.
        //   · `translateZ(0)` la promeut en COUCHE de composition. Le
        //     rideau devient un simple déplacement de couche au lieu d'une
        //     repeinture, ce qui est exactement le mouvement recherché.
        //   · `contain: paint` promet au navigateur que rien ne déborde de la
        //     boîte — vrai, `overflow-hidden` est déjà là — donc il peut élaguer
        //     tout le dessin hors cadre au lieu de l'évaluer.
        // L'ombre portée haute, elle, est passée en calque (voir juste après) :
        // en `box-shadow` de 72 px de flou sur un bloc pleine largeur, elle
        // était re-floutée à chaque image, et c'était le poste le plus lourd.
        transform: "translateZ(0)",
        contain: "paint",
      }}
    >
      {/* L'ombre du bord haut a été RETIRÉE avec le fond dégradé : c'était un
          voile marine (#020617 à 42 %) qui creusait la jointure avec la scène
          d'ouverture. Sur deux blocs désormais noirs à l'identique, elle ne
          faisait plus qu'une bande grise en travers de la page. */}
      {/* Scroll-triggered stagger entrance: each major block fades up
          when the section enters the viewport. `once: true` means the
          animation plays a single time (no replay when scrolling back).
          `margin: "-80px"` triggers slightly before the section is fully
          in view so the entrance feels anticipatory, not delayed. */}
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
        }}
      >
        {/* ══ ATLAS EST L'ASSISTANT (client 2026-08-14) ══════════════════════
            « Mon but est de faire passer notre super assistant comme le
            dénommé Atlas, donc merge cette partie dedans. » L'assistant vivait
            dans un encadré générique de la section plateforme, sans nom ; il
            est ici, et l'encadré d'origine a été retiré. Tant qu'un
            « Assistant » anonyme subsistait ailleurs, le nom ne pouvait pas
            prendre.

            LE TITRE EST LA PHRASE DÉJÀ VALIDÉE de l'encadré assistant
            (« Posez votre question, l'assistant cherche dans vos dossiers »),
            coupée en deux encres, « l'assistant » devenant « Atlas ». Rien
            n'est réécrit : c'est la même promesse, elle porte juste un nom.
            La pastille « Atlas » qui coiffait ce bloc est partie avec
            l'ouverture : le mot fait désormais dix centimètres de haut trois
            écrans plus haut, le répéter en petit n'apprendrait rien.

            ⚠ LE BLOC EST DEVENU UN CARROUSEL le 2026-08-15 (client : « une
            organisation où on a une phrase d'écrite, on a un encadré, on peut
            switcher d'encadré de droite à gauche, avec plein d'utilisations
            possibles d'Atlas »). Le titre ne bouge pas, il pose la promesse ;
            ce qui change sous lui, c'est la DEMANDE, et le panneau la joue.
            Le paragraphe explicatif qui vivait ici est parti : six exemples
            concrets disent la même chose que lui, en le montrant.

            ⚠ LES COMMANDES ONT ÉTÉ REFAITES le même jour, seconde passe
            (client : « ce n'est pas clair que l'on peut passer d'un encadré à
            un autre »). Le premier jet mettait deux flèches et six points sous
            la phrase, DANS LA COLONNE DE GAUCHE : rien ne les rattachait
            visuellement au panneau de droite, et six points gris ne disent pas
            ce qu'il y a dans les six vues. Trois changements, tous dans le sens
            de rendre le choix explicite :
              1. UNE BARRE D'ONGLETS NOMMÉS coiffe le bloc, un onglet par usage,
                 avec son icône. On lit d'un coup ce qu'Atlas sait faire et on
                 clique là où on veut aller. C'est aussi ce qui remplace la
                 pastille de catégorie, qui répétait l'onglet actif.
              2. LES FLÈCHES PASSENT SUR LE PANNEAU, à cheval sur ses flancs.
                 Une flèche posée SUR l'objet dit qu'elle déplace cet objet-là.
              3. UN COMPTEUR « n / 6 » sous le panneau, qui dit combien il en
                 reste. */}
        {/* ══ LES USAGES, EN GRILLE ══════════════════════════════════════════
            Client 2026-08-19, capture de la salle de presse OpenAI à l'appui :
            « pour les fonctionnalités d'Atlas, je préférais que tu me fasses
            une organisation un peu comme OpenAI, niveau du layout ». La
            référence : deux colonnes, une tuile carrée à gauche de chaque
            entrée, le titre et sa catégorie à droite, beaucoup de blanc.

            ⚠ CE BLOC REMPLACE LE CARROUSEL du 2026-08-15 (barre de six
            onglets, titre qui changeait avec l'onglet, panneau AtlasSlideVisual
            à droite, flèches à cheval sur ses flancs, compteur « n / 6 »). Ce
            qui se perd et ce qui se gagne, pour que la décision soit relisible :
              · PERDU : les six scènes jouées. Elles montraient Atlas EN TRAIN
                de répondre. `AtlasSlideVisual.tsx` et `ScaleToFit` restent dans
                le dépôt, intacts et plus montés ici — remonter le carrousel,
                c'est ressortir ce bloc de l'historique git de ce fichier.
                La perte est amortie : la vidéo de démonstration juste au-dessus
                montre le vrai logiciel en mouvement, ce qu'aucune scène
                dessinée ne faisait.
              · GAGNÉ : les six usages sont lisibles D'UN COUP. Le carrousel en
                montrait un à la fois et demandait cinq clics pour faire le tour,
                ce que personne ne fait sur une page de vente.

            LE TITRE DE CHAQUE ENTRÉE EST `line`, PAS `head`. `head` est une
            question en deux encres (« Où en est ce dossier ? » / « Atlas fait
            le tour des pièces. ») : elle marchait en 3 rem au-dessus d'un
            panneau, elle fait deux phrases empilées dans une case de grille.
            `line` est déjà le bénéfice en une ligne (« Retrouvez une pièce sans
            rouvrir dix dossiers »), c'est exactement le rôle du titre chez
            OpenAI. `tag` devient la catégorie en dessous, à la place de la date
            de la référence : nous n'avons pas de date à mettre là, et en
            inventer une serait un faux. `head`, `ask` et `alt` ne sont plus
            lus ici ; ils restent dans USE_CASES pour le jour où le carrousel
            revient. */}
        <motion.div variants={fadeInUp}>
          <div className="max-w-[42ch]">
            <h3 className="font-instrument text-[clamp(1.5rem,3.7vw,3.2rem)] font-normal leading-[1.07] tracking-[-0.03em] text-white">
              {t({ fr: "Ce qu'Atlas sait faire.", en: "What Atlas can do." })}
            </h3>
            <p className="mt-4 font-inter text-[14.5px] leading-relaxed text-white/50 md:mt-5 md:text-[18px] md:leading-[1.55]">
              {t({
                fr: "Six demandes du quotidien, posées en français, traitées sur vos propres fichiers.",
                en: "Six everyday requests, asked in plain words, answered on your own files.",
              })}
            </p>
          </div>

          {/* LA GRILLE. Deux colonnes à partir de md, UNE SEULE en dessous.
              ⚠ Le bloc était à deux colonnes à TOUTES les largeurs, et le
              client l'a renvoyé le 2026-08-23, captures du bureau à l'appui :
              « il faut que le layout ressemble plutôt à cela pour la partie
              ce qu'Atlas sait faire ». Ce qui fait la référence, ce n'est pas
              le NOMBRE de colonnes, c'est la PROPORTION de chaque entrée : une
              tuile franche, le bénéfice en une ou deux lignes à côté, la
              catégorie en dessous, et de l'air. Sur deux colonnes de téléphone
              cette proportion est détruite — mesuré à 390 px : 165 px par
              entrée, dont 62 de tuile et 12 de gouttière, soit 91 px pour le
              titre, qui tombait en CINQ lignes de trois mots. Une colonne rend
              252 px au titre, qui reprend ses deux lignes, et la tuile passe de
              62 à 84 px pour retrouver le rapport tuile / texte du bureau.
              Le seuil est `md` et non `sm` : entre 640 et 767 la grille à deux
              colonnes ne laissait que 146 px au titre, soit trois lignes — le
              même défaut en moins voyant.
              `gap-x-16` est large à dessein — c'est la gouttière de la
              référence, et c'est elle qui empêche de lire la grille en rangées
              horizontales au lieu de six entrées distinctes. Elle n'a plus
              d'effet sous md, où il n'y a qu'une colonne. */}
          <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 md:mt-16 md:grid-cols-2 md:gap-x-16 md:gap-y-12">
            {USE_CASES.map((u, i) => {
              const Icon = u.icon;
              return (
                <article key={u.tag.en} className="flex items-center gap-4 md:gap-7">
                  {/* LA TUILE. Un dégradé de la charte, un voile de bruit, et
                      l'icône de l'usage au centre.
                      · Le dégradé est TOUJOURS pris dans la palette (bleu,
                        bleu foncé, sarcelle, encre). La référence enchaîne des
                        roses, des oranges et des verts ; six teintes libres
                        ici casseraient la règle « un seul bleu » de la charte
                        et feraient un nuancier au milieu d'une page noire.
                        Les six tuiles varient donc par la COMBINAISON et le
                        sens du dégradé, pas par la teinte.
                      · LE BRUIT (`NOISE`, un feTurbulence en data-URI) est ce
                        qui donne le grain diffus de la référence. En
                        `mix-blend-overlay`, il assombrit et éclaircit le
                        dégradé par petites touches au lieu de poser un gris
                        par-dessus.
                      · L'ICÔNE est un ajout à la référence, dont les tuiles
                        sont purement décoratives. Ici elle identifie l'usage
                        et reprend celle qui coiffait l'onglet du carrousel :
                        c'est ce qui reste du repère visuel qu'il donnait.
                      `aria-hidden` sur les deux calques : ils ne portent aucune
                      information que le titre à côté ne donne déjà. */}
                  <div
                    className="relative aspect-square w-[84px] shrink-0 overflow-hidden rounded-[12px] sm:w-[132px] md:w-[150px] md:rounded-[14px] lg:w-[168px]"
                    style={{ backgroundImage: TILE_ART[i % TILE_ART.length] }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-[0.38] mix-blend-overlay"
                      style={{ backgroundImage: NOISE, backgroundSize: "170px 170px" }}
                    />
                    <Icon
                      aria-hidden
                      className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 text-white/90"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* `min-w-0` : sans lui, la colonne de texte d'une grille
                      refuse de descendre sous la largeur de son plus long mot
                      et pousse la tuile hors de la case sur les petits écrans. */}
                  <div className="min-w-0">
                    <h4 className="font-inter text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-white md:text-[19px]">
                      {t(u.line)}
                    </h4>
                    <p className="mt-1.5 font-inter text-[12px] leading-tight text-white/40 md:mt-3 md:text-[13.5px]">
                      {t(u.tag)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Le bouton était dans la colonne de gauche du carrousel, sous le
              titre qui changeait. Il ferme maintenant la grille : on lit les
              six usages, puis on prend rendez-vous. Blanc plein — sur une
              section noire c'est le seul contraste qui tienne le rôle de bouton
              principal. */}
          <button
            type="button"
            onClick={openBooking}
            className="group mt-9 inline-flex items-center gap-2.5 rounded-[8px] bg-white px-[18px] py-2.5 font-inter text-[13.5px] font-semibold text-[#0b1020] transition-colors duration-150 hover:bg-white/85 md:mt-16 md:px-5 md:py-3 md:text-[14.5px]"
          >
            {t({ fr: "Réserver un appel", en: "Book a call" })}
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* ── LA RÉPLIQUE DU LOGICIEL A ÉTÉ RETIRÉE ─────────────────────────
            Client 2026-08-15, capture de l'encadré à l'appui : « retire
            l'encadré du screen que je t'envoie ». C'était la réplique fidèle
            d'Atlas (AtlasSimulation dans son cadre bleu et son halo), page
            « Votre Atlas » avec ses projets épinglés. Elle avait déjà voyagé la
            veille, du haut de la section vers son pied.
            Ce qu'elle disait est désormais dit deux fois plus haut, et mieux :
            le carrousel montre Atlas EN TRAIN DE RÉPONDRE, sur six demandes
            différentes ; la réplique, elle, ne montrait qu'un écran d'accueil
            immobile. Le bloc « Création de système d'orchestration » ferme donc
            la section.
            AtlasSimulation, ScaleToFit et le brief restent en place : remonter
            la réplique, c'est réécrire ces trente lignes, pas la reconstruire
            (voir l'historique git de ce fichier). */}

        {/* Lower tabbed demo (TabPills + 3 video/mockup carousel) — hidden for
            now at the client's request. Flip `false` to `true` to restore. */}
        {false && (
        <motion.div className="mt-14 md:mt-16" variants={fadeInUp}>
          <TabPills tabs={tabs} active={bottomTab} onSelect={setBottomTab} />

          <div className="relative max-w-5xl mx-auto">
            {/* No surrounding frame — the cards float directly (Bubble-style),
                lifted only by a soft ambient glow behind the active card. */}
            <div
              aria-hidden
              className="absolute -inset-8 -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(48% 58% at 50% 50%, rgba(96,165,250,0.22) 0%, rgba(56,189,248,0.10) 46%, transparent 76%)",
              }}
            />
            {/* Stage — Bubble-style carousel with NO frame: the active card is
                centred, neighbours peek on the sides, clipped only by the
                section's own overflow. */}
            <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
                {tabs.map((tab, i) => {
                  const activeI = tabs.findIndex((t) => t.id === bottomTab);
                  const offset = i - activeI;
                  const isActive = offset === 0;
                  // Coverflow WITHOUT wrap-around: only the IMMEDIATE neighbours
                  // peek. So the first tab shows just a right peek, the last just
                  // a left peek, and the middle ("Pilotez") shows both.
                  const isPeek = offset === 1 || offset === -1;
                  // Horizontal track: each card sits one ~104% "step" left/right
                  // of centre, so cards slide in from the correct side.
                  const x = `${-50 + offset * 104}%`;
                  return (
                    <motion.div
                      key={tab.id}
                      className="absolute top-1/2 left-1/2 w-[74%] rounded-2xl overflow-hidden ring-1 ring-black/[0.06] bg-white shadow-[0_24px_56px_-22px_rgba(8,12,28,0.55)]"
                      style={{
                        aspectRatio: "16 / 10",
                        zIndex: isActive ? 3 : 2,
                      }}
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : isPeek ? 0.5 : 0,
                        scale: isActive ? 1 : 0.72,
                        x,
                        y: "-50%",
                        filter: isActive ? "blur(0px)" : "blur(3px)",
                      }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {tab.id === "galaxy" ? (
                        <InViewVideo
                          src="/ora_atlas.mp4"
                          className="absolute inset-0 w-full h-full object-cover block"
                        />
                      ) : (
                        // Mockups are taller than the 16/10 card: anchor to the
                        // top so the meaningful header + cards show (cropped at
                        // the bottom, like a windowed screenshot).
                        /* `aria-hidden` + `inert` : ces maquettes sont du
                           DÉCOR, et elles contiennent huit boutons qui ne font
                           rien (cloche, messages, filtres de la fausse
                           application). Sans cela, un visiteur au clavier
                           traverse huit arrêts dans une capture d'écran, et un
                           lecteur d'écran énumère une interface qui n'existe
                           pas. */
                        <div aria-hidden inert className="absolute inset-x-0 top-0">
                          <ScaleToFit>
                            {tab.id === "dashboard" ? <MockupHome /> : <MockupManager />}
                          </ScaleToFit>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
          </div>
        </motion.div>
        )}
      </motion.div>
    </section>

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

/** Horizontal row of feature tab pills (icon badge + label). Shared by the
    interactive mockup (top) and the demo-video area (below the paragraph). */
function TabPills({
  tabs,
  active,
  onSelect,
}: {
  tabs: Tab[];
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <div className="flex justify-center mb-10 md:mb-14">
      {/* One unified rounded selector (Bubble-style): the active tab is an
          outlined pill, the others are plain text inside the same track. */}
      <div className="inline-flex flex-wrap justify-center items-center gap-1.5 p-1.5 rounded-full border border-white/[0.12] bg-white/[0.03]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? "border border-white/70 bg-white/[0.07]"
                  : "border border-transparent hover:bg-white/[0.05]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tab.iconBg}`}
              >
                <Icon className="w-[15px] h-[15px] text-white" strokeWidth={2.25} />
              </div>
              <span
                className={`font-poppins font-semibold text-[13px] md:text-[14px] leading-snug whitespace-nowrap transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/55 hover:text-white/80"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* `slideVariants` et `cardVariants` vivaient ici : les deux glissades du
   carrousel des usages, l'une pour la phrase, l'autre pour le panneau. Elles
   sont parties avec lui le 2026-08-19, la grille n'ayant rien à faire glisser
   d'un côté à l'autre. */

/** Fade-up entrance — used by every staggered child in the section. */
const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};
