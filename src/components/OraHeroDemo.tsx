import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import OraAppScene, { OA_ASPECT } from "./OraAppScene";
import InViewVideo from "./InViewVideo";
import OraHeroMobile from "./OraHeroMobile";
import AppTablePanel from "./AppTablePanel";
import OraHomeMockup from "./OraHomeMockup";

/**
 * OraHeroDemo — scroll-driven product demo in the hero (Bending-Spoons style).
 * A tall wrapper pins a full-viewport scene; the scroll progress scrubs the
 * app's REAL journey, replicated from actual screenshots of Ora and of the
 * real Excel side-by-side layout (v2 flow, 2026-07-20 — the longer v1
 * login→accueil flow lives in git history and in memory):
 *
 *   1. Excel — the real FEC workbook alone, centred, with an « Ora » tab in
 *      the ribbon (replica of the real Excel add-in). The cursor clicks it.
 *   2. Dual view — the Ora panel docks on the right, Excel slides left:
 *      straight onto the automation page, no login/onboarding.
 *   3. « Lancer » on FEC Studio → the real config MODAL opens (MISSION seuil,
 *      CONTRÔLES, BALANCES toggles) — the cursor flips three toggles then
 *      clicks « Lancer maintenant »
 *   4. The JOURNAL logs the run; the loading card flips to a green-check
 *      success; the FEC workbook is replaced by the generated audit workbook,
 *      and the cursor browses its SHEET TABS.
 *
 * Brand marks use the real logo assets from /public/logos. Cursor click
 * targets are MEASURED at runtime (offsetLeft chains) so the tip lands
 * exactly on buttons/toggles/tabs. Imperative scrub: one
 * `scrollYProgress.on("change")` writes every style. Classes are prefixed
 * `.hd-`. prefers-reduced-motion → final state. Swap back to <OraGallery>
 * for the 6-video carousel when the real clips arrive.
 */

/** ── LE DÉZOOM AU DÉFILEMENT, ÉTEINT LE 2026-08-28 ────────────────────────
 *  Un seul interrupteur pour toute la scène épinglée. Voir le pavé à l'endroit
 *  où il est lu, plus bas dans le rendu : il dit ce qui part avec, et pourquoi
 *  le bloc est masqué plutôt que jeté. */
const DEZOOM_AU_SCROLL = false;

/** ── LA VIDÉO DU HERO ─────────────────────────────────────────────────────
 *  ora-1.mp4, le film du produit, déjà joignable depuis la section
 *  « automatisation » par le lien « Voir la démo en vidéo ».
 *
 *  ⚠ 22,3 Mo, ET C'EST LE POINT FAIBLE DE CE BLOC. Dans la fenêtre
 *  d'agrandissement d'AutomationTabs le clip n'est monté qu'au clic, donc rien
 *  ne part tant que personne ne le demande. Ici il est au PREMIER ÉCRAN : il
 *  se télécharge pour tout visiteur de l'accueil, y compris ceux qui ne le
 *  regarderont pas. Le poster et `preload="metadata"` sauvent l'AFFICHAGE, pas
 *  le transfert — dès que l'IntersectionObserver lance la lecture, le fichier
 *  part en entier.
 *  Si le temps de chargement de l'accueil devient un sujet, c'est la première
 *  ligne à rouvrir : ré-encoder ora-1 à quelques mégaoctets, ou monter un clip
 *  court pour cette place. */
const HERO_VIDEO = "/ora-1.mp4";

/** ── LA RÉPLIQUE DANS LE HERO ─────────────────────────────────────────────
 *  ⚠ L'ARITHMÉTIQUE QUI COMMANDE TOUT LE BLOC, et qu'il faut avoir en tête
 *  avant d'y toucher. Client 2026-08-29 : titre sur DEUX lignes et bien plus
 *  gros, réplique PLUS GRANDE, mise en page façon Stripe. Les trois ne tiennent
 *  pas ensemble dans deux demi-colonnes, et voici pourquoi :
 *    · « plus d'analyse, plus de conseil. » fait 31 signes. Sur UNE ligne à la
 *      taille S, il lui faut ~31 x 0,47 x S pixels. À 54 px, 787 px de colonne
 *      de texte — soit 59 % du conteneur de 1344. Descendre sous cette largeur
 *      renvoie le titre à trois lignes, ce qui était le défaut à corriger.
 *    · il reste donc ~48 % au visuel une fois le débord d'écran compté, alors
 *      que l'empreinte complète de la scène (fenêtre + pastilles) fait 1626 px.
 *  Tout montrer ET grossir est impossible : c'est l'un ou l'autre.
 *
 *  LA RÉPONSE N'EST PAS DE TRANCHER, C'EST DE RENDRE DE LA PLACE. Sortir le
 *  titre de la paire (voir le pavé de la bande) fait passer la colonne du
 *  visuel de 450 à ~1000 px. La scène peut alors rester ENTIÈRE, pastilles
 *  comprises, et grossir quand même : la fenêtre passe de 535 à ~700 px de
 *  large à 1440, soit +30 %.
 *
 *  ⚠ UN CADRAGE À ÉCHELLE FIXE A ÉTÉ ESSAYÉ ET RETIRÉ. À 0,64 la fenêtre
 *  atteignait 755 px, mais les trois pastilles de sortie se faisaient trancher
 *  par le bord de l'écran en lamelles de quelques pixels — pas un cadrage, des
 *  débris. Et une échelle fixe ne peut pas convenir à toutes les largeurs : ce
 *  qui tient à 1440 déborde à 1280 et flotte à 1728. Le mode AJUSTÉ recalcule
 *  l'échelle par colonne, il s'adapte donc tout seul (0,52 à 1280, 0,59 à
 *  1440, 0,69 à 1728) et ne coupe jamais rien.
 *
 *  ⚠ LES 70 % / 13 % NE SONT PAS UN CENTRAGE. Les pastilles débordent de la
 *  fenêtre de 188 px à gauche et 258 px à droite (mesuré en page, pas déduit
 *  du CSS : la lecture des ancrages donnait 181 et 229, et les 29 px d'écart
 *  suffisaient à faire dépasser la page). Il faut donc 11,2 % de la cellule à
 *  gauche et 15,3 % à droite ; on en réserve 13 et 17, pour que le flottement
 *  perpétuel des pastilles ne vienne pas clignoter en bord de page. */

interface OraHeroDemoProps {
  theme: "light" | "dark";
  openBooking: () => void;
}

const W = 1040, H = 640;

/** Emplacement de la réplique du logiciel Ora dans le repère de la scène
 *  (elle ouvre la démo, avant le passage de relais vers Excel + panneau). */
const APP_LEFT = 155, APP_TOP = 66, APP_W = 730, APP_H = 512;

/** Fin de l'INTRO, en TEMPS DE DÉMO (l'échelle remappée du récit, pas la
 *  course d'épinglage). Hors démo, le temps de récit est FIGÉ à cette valeur :
 *  la scène montre en permanence l'état « réplique en pleine vue ».
 *
 *  ⚠ L'INTRO N'EST PLUS SCROLLÉE (client 2026-08-13 : « on descend et c'est
 *  nous qui allons vers la réplication, pas la réplication qui vient à
 *  nous »). Le titre vit désormais HORS de la scène épinglée, en flux normal :
 *  il sort par le haut en défilant, la réplique arrive à taille constante, et
 *  l'épinglage ne commence qu'une fois la scène posée en haut d'écran. Les
 *  segments 0→0,125 du récit (fondu du titre, repli, remontée) ne pilotent
 *  plus rien de visible ; ils ne subsistent que dans l'échelle de remap()
 *  pour ne pas décaler tous les jalons du récit qui suivent. V_HOLD, qui
 *  portait la part d'intro de la course, est parti avec. */
const V_INTRO = 0.125;

/* ── LE MUR DU DÉZOOM (client 2026-08-08, réplique de monday.com) ────────────
 * « Quand on arrive à l'endroit de la réplique, un dézoom avec d'autres
 * encadrés ensuite qui défilent quand l'utilisateur scroll vers le bas », puis,
 * capture de la page d'accueil monday à l'appui : « créer trois colonnes avec
 * plusieurs lignes où ça défile, même si c'est une réplication des mêmes
 * encadrés ».
 *
 * Le mur est une GRILLE 3 × 3 ALIGNÉE EN BANDES, comme la page monday : trois
 * colonnes, trois lignes, les hauts de cartes alignés par ligne (align-items:
 * start), PAS de maçonnerie décalée — une version à cinq colonnes étagées a
 * été montrée au client le jour même, verdict : « le bazar absolu ». Les neuf
 * cellules répètent trois designs — la réplique du logiciel (copies via
 * OraHomeMockup, le même écran d'accueil en fenêtre), le panneau « Bilan
 * développé et SIG », le panneau sombre « Rapprochement bancaire » — la
 * duplication est explicitement actée (« je n'ai pas assez de designs,
 * duplique simplement »). La cellule CENTRALE est un TROU : c'est la réplique
 * VIVANTE du hero qui vient s'y loger en rétrécissant, au pixel près, puis
 * grille et réplique se traversent d'un seul bloc.
 *
 * ⚠ LES CELLULES SONT RÉDUITES PAR transform: scale, JAMAIS PAR zoom. La
 * première version zoomait, et Chromium (mes vérifications) rendait juste —
 * mais Safari (le navigateur du client) déchirait le mur : fragments de
 * cartes, pastilles à taille naturelle flottant hors de leur fenêtre, vides.
 * Le zoom de WebKit est notoirement fragile sur les descendants positionnés
 * en absolu. transform ne participe pas à la mise en page, donc chaque
 * cellule reçoit AUSSI sa hauteur calculée (hauteur naturelle × échelle),
 * écrite par fit() — c'est le prix de la fiabilité, et il est mesuré, pas
 * supposé.
 *
 * La chorégraphie, en fractions de la course d'épinglage de 200 vh (le
 * cadenceur fait 300 vh, moins l'écran épinglé). L'INTRO N'EN FAIT PLUS
 * PARTIE (client 2026-08-13) : la course ne commence qu'une fois la scène
 * posée en haut d'écran, le titre étant sorti par le haut en flux normal.
 *   · 0 → DZ_START (20 vh)       le BATTEMENT : la réplique est posée, la
 *                                notification d'invitation s'allume — c'est
 *                                sa fenêtre de clic, passé DZ_START elle
 *                                s'éteint, le mur prend la place ;
 *   · DZ_START → DZ_END (88 vh)  le DÉZOOM : la réplique rétrécit vers son
 *                                trou pendant que les colonnes convergent des
 *                                bords et que la grille se révèle ;
 *   · DZ_END → 1 (92 vh)         la TRAVERSÉE : tout le mur remonte, les
 *                                lignes suivantes défilent dans le cadre,
 *                                puis l'épinglage se libère et le mur sort
 *                                naturellement avec la page.
 * Les proportions relatives dézoom / traversée sont celles d'avant la
 * refonte (70 / 110 vh sur 260) ; seule l'intro de 69 vh a disparu de la
 * course. Si la hauteur du cadenceur change, ces trois fractions se
 * recalculent ensemble.
 *
 * La géométrie de la grille n'est PAS codée en dur : les cellules ont des
 * hauteurs naturelles différentes (c'est la maçonnerie), donc la position du
 * trou et la course de traversée sont MESURÉES (voir wallGeomRef) à chaque
 * redimensionnement, jamais supposées.
 *
 * Le dézoom ne vit QUE dans le parcours sans démo : dès que la démo est lancée
 * (`lance`), le cadenceur passe à 800 vh, remap() reprend la main et tout ce
 * bloc est inerte — la grille reste à opacité zéro. */
const DZ_START = 0.10;
const DZ_END = 0.54;
/* ── LE CONTRE-DÉFILEMENT (client 2026-08-08 au soir) ────────────────────────
 * « Quand l'utilisateur scroll vers le bas, la colonne du milieu descend et
 * celles de gauche et de droite remontent. » C'est le mouvement signature du
 * mur monday, et il remplace la traversée d'un seul bloc.
 *
 * Il démarre À L'INTÉRIEUR du dézoom, pas après lui, et c'est le cœur de la
 * demande « rends l'animation plus smooth » : l'ancienne traversée partait de
 * DZ_END avec une vitesse non nulle — une couture visible entre deux phases.
 * Ici la progression est une accélération douce (q², dérivée nulle au départ)
 * ouverte AVANT la fin du dézoom : les colonnes s'ébranlent pendant que le mur
 * finit de se poser, aucune rupture de vitesse nulle part. Et elle ne
 * décélère PAS à l'arrivée : à la libération de l'épinglage, le défilement de
 * page prend le relais d'un mouvement encore vivant, sans temps mort.
 * (0,34 depuis la refonte du 2026-08-13 : même profondeur RELATIVE dans le
 * dézoom qu'avant — il s'ouvrait à 55 % du segment DZ, il s'y ouvre encore.) */
const TRAV_START = 0.34;
/** Largeur d'une cellule du mur (et donc de la fenêtre applicative à
 *  l'arrivée du dézoom), en fraction du viewport. À 0,30 sur TROIS colonnes,
 *  la grille fait ~94 % de l'écran : pleine largeur à un liseré près, sans
 *  fond perdu — les colonnes tranchées de l'essai précédent participaient au
 *  « bazar » relevé par le client. */
const WALL_APP_W = 0.30;
/** Gouttières de la grille, colonnes et lignes, en pixels ÉCRAN. */
const WALL_GAP = 28;
/** Largeur NATURELLE des cellules (les panneaux s'y composent avant le zoom
 *  qui les amène à la largeur de cellule). Le TROU de la réplique suit le même
 *  zoom : sa hauteur naturelle est 640 × APP_H / APP_W, si bien qu'à l'écran il
 *  fait exactement la taille de la fenêtre applicative réduite. */
const WALL_SIDE_NAT = APP_W;

/** Position de repos du curseur, en bas à gauche de la fenêtre du logiciel :
 *  il est visible dès la première image et son trajet vers la carte « Ouvrir
 *  un fichier » traverse l'écran en diagonale, donc il se remarque. */
const REST_CUR = { x: 330, y: 498 };

/** Carte bleue « Ouvrir un fichier », dans le repère de la scène (la réplique
 *  du logiciel a sa propre mise à l'échelle interne, ces valeurs sont donc
 *  posées à la main comme les cibles du curseur).
 *  Recalé au bord près (client 2026-08-01) : ces valeurs tombaient 7,7 unités
 *  trop haut et 1,1 trop court. L'ancien repère de clic étant un halo blanc
 *  diffus de 34 px, l'écart ne se voyait pas ; le liseré fin qui l'a remplacé
 *  doit épouser exactement le tracé de la carte, sinon il la coupe en haut et
 *  laisse un vide en bas. Mesuré en direct contre `.oa-open`. */
/*  REMESURÉ le 2026-08-12 : la réplication est passée à DEUX cartes bleues
 *  côte à côte (« Ouvrir un fichier » et « Assistant »), donc la première ne
 *  fait plus toute la largeur. 538 → 265 de large, 55 → 58 de haut ; la
 *  position, elle, n'a pas bougé. Sans ce recalage le liseré de clic couvrait
 *  les deux cartes.
 *  Relevé en direct contre .oa-open, ramené dans le repère de .hd-stage. */
const OPEN_CARD = { left: 328, top: 197, width: 265, height: 58 };

const HD_CSS = `
/* ══ Hero scroll-demo — faithful Ora app + real Excel, scroll-driven ══ */
/* ── Sélecteur de fichier de l'ouverture ── */
.hd-picker{position:absolute;z-index:8;left:520px;top:322px;width:420px;
  transform:translate(-50%,-50%);opacity:0;border-radius:14px;background:#fff;overflow:hidden;
  box-shadow:0 2px 8px rgba(15,23,42,.18),0 40px 80px -24px rgba(15,23,42,.6)}
.hd-pkhead{position:relative;height:36px;display:flex;align-items:center;justify-content:center;
  background:#f7f7f8;border-bottom:1px solid #ececef;font-size:12px;font-weight:600;color:#3f4652}
.hd-pkdots{position:absolute;left:12px;top:12px;display:flex;gap:6px}
.hd-pkdots i{width:9px;height:9px;border-radius:50%;display:block;background:#d8dade}
.hd-pkpath{display:flex;align-items:center;gap:7px;padding:10px 14px 8px;font-size:11px;
  font-weight:600;color:#8b909b}
.hd-pkrow{display:flex;align-items:center;gap:10px;padding:9px 14px;transition:background .18s ease}
.hd-pkrow .ic{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;
  background:#e9f7ee;color:#177245;flex-shrink:0}
.hd-pkrow b{font-size:12.5px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.hd-pkrow .sz{margin-left:auto;font-size:10.5px;color:#9aa0aa;flex-shrink:0}
.hd-pkfoot{display:flex;justify-content:flex-end;gap:9px;padding:11px 14px;border-top:1px solid #f1f2f4}
.hd-pkcancel{font-size:12px;font-weight:600;color:#6b7280;padding:6px 13px;border-radius:8px;
  border:1px solid #e6e7ea}
.hd-pkok{font-size:12px;font-weight:600;color:#fff;padding:6px 15px;border-radius:8px;background:#2f6ff0}

.hd-stagebox{position:relative;flex:1;min-height:0;width:100%}
/* ── La grille du mur (dézoom, 2026-08-08) ──
   Ancrée au CENTRE du sticky et pilotée image par image par apply(), dans le
   même repère écran que la scène — jamais par une animation CSS, qui ne
   pourrait pas suivre une géométrie recalculée au scroll. Elle naît invisible :
   c'est le moteur qui l'allume pendant le dézoom, et lui seul.
   pointer-events:none : ce sont des décors dans le mur, leurs vrais
   exemplaires interactifs vivent plus bas dans les cartes de StackingCards.
   La largeur des cellules et leur zoom sont écrits par fit() à chaque
   redimensionnement : la cellule se compose à ${WALL_SIDE_NAT}px puis est
   zoomée à la largeur de colonne — zoom et non transform, parce que le zoom
   participe à la MISE EN PAGE, donc les colonnes s'empilent juste.
   (Pas de backticks dans ce bloc : il vit dans un template literal.) */
.hd-wallgrid{position:absolute;left:50%;top:50%;z-index:9;opacity:0;
  pointer-events:none;will-change:transform,opacity;
  display:grid;grid-template-columns:repeat(3,auto);align-items:start;
  gap:${WALL_GAP}px}
/* Largeur et hauteur des cellules écrites par fit() : transform ne participe
   pas à la mise en page, la hauteur visuelle (naturelle x échelle) doit donc
   être posée sur la boîte pour que les lignes de la grille se dimensionnent
   juste. will-change : chaque cellule porte le translateY du
   contre-défilement, image par image. */
.hd-wallcell{position:relative;will-change:transform;border-radius:14px}
/* ── SURVOL DES CARTES DU MUR (client 2026-08-09) ──
   « Quand on survole un des encadrés, il s'agrandit, légèrement entouré d'un
   bleu très fin, pour comprendre que l'on a passé le curseur dessus. »
   Trois points qui expliquent la forme de ces trois règles :
   · La grille est pointer-events:none (ce sont des décors). Le survol ne
     s'ouvre QUE sur la classe .hot, posée par le moteur une fois le
     contre-défilement arrivé à son terme — survoler un mur encore en
     mouvement n'aurait aucun sens, et la cible se déroberait sous le curseur.
   · Le TROU est exclu : il est vide et posé PAR-DESSUS la réplique vivante,
     lui rendre le pointeur intercepterait le survol du vrai logiciel.
   · L'agrandissement passe par la propriété scale, PAS par transform : le
     moteur écrit un transform translateY sur chaque cellule à chaque image,
     une règle CSS de transform serait donc écrasée aussitôt. scale est une
     propriété indépendante, elle se compose avec le transform en ligne au
     lieu de le remplacer. Effet de bord assumé : le translateY se
     trouve multiplié par l'échelle, ce qui décale la carte de trois ou
     quatre pixels — ça se lit comme la légère élévation d'un survol, et non
     comme un défaut.
   La boîte de la cellule épouse déjà exactement celle de la carte (fit() lui
   écrit la taille visuelle), le liseré tombe donc pile sur le tracé. */
.hd-wallgrid.hot .hd-wallcell:not([data-hd="wall-hole"]){pointer-events:auto}
/* La scène (.hd-stagebox, z-10) recouvre la grille (z-9) sur toute la hauteur
   du bloc épinglé : sans cette règle elle avalait chaque survol avant qu'il
   n'atteigne une cellule, et rien ne se passait. Elle ne contient AUCUN
   élément interactif — la réplique du logiciel est un visuel, le bouton
   d'invitation vit à part en z-40 — donc lui retirer le pointeur ne coûte
   rien. Scopé à la phase où le mur est survolable, pour ne rien changer au
   reste du parcours. */
.hd-sticky.wallhot .hd-stagebox{pointer-events:none}
.hd-wallcell{transition:scale .42s cubic-bezier(.16,1,.3,1)}
/* Liseré bleu RETIRÉ (client 2026-08-09, deuxième passe : « enlève l'idée d'un
   encadré bleu, fais plutôt en sorte que juste il s'agrandisse légèrement »).
   L'ombre portée qui l'accompagnait part avec : la carte porte déjà la sienne,
   la doubler au survol rajoutait le relief que le client ne veut pas. Il ne
   reste que l'échelle. */
.hd-wallgrid.hot .hd-wallcell:not([data-hd="wall-hole"]):hover{scale:1.03;z-index:4}
@media (prefers-reduced-motion:reduce){
  .hd-wallgrid.hot .hd-wallcell:not([data-hd="wall-hole"]):hover{scale:1}
}
/* Pendant le dézoom, les pastilles flottantes de la réplique (déposé / rendu)
   s'effacent : posées AUTOUR de la fenêtre, elles débordent largement de sa
   boîte et, une fois le tout réduit, elles mordaient sur les panneaux voisins.
   En important, et c'est nécessaire : leur entrée est une animation CSS à
   remplissage persistant (oaIn ... both), qui gagnerait sur un style en ligne —
   seule une déclaration importante passe au-dessus d'une animation dans la
   cascade. */
.hd-sticky.walling .oa-chip{opacity:0!important;transition:opacity .35s ease!important}
/* Le halo bleu de la scène s'efface aussi : plus large que la fenêtre, il
   débordait du trou une fois la réplique réduite et salissait la cellule du
   dessous. Dans le mur, la réplique est une cellule comme les autres. */
.hd-sticky.walling .hd-blob{opacity:0;transition:opacity .35s ease}
/* Arrivée « bas vers le haut » (client 2026-08-01) : la réplique du logiciel
   MONTE depuis le bas jusqu'à sa place, au lieu d'apparaître en fondu sur
   place.
   Le déplacement vit sur une couche INTERNE, jamais sur .hd-stagebox : le
   moteur de scrub mesure cette boîte au pixel près (getBoundingClientRect,
   pour centerDelta et dyRest), un transform dessus fausserait le cadrage de
   toute la scène. La couche est en position:absolute;inset:0, donc elle a
   exactement la même boîte que la stagebox : les left:50%/top:50% de
   .hd-stage se résolvent à l'identique, et stagePos() s'arrête à .hd-stage,
   donc les cibles du curseur ne bougent pas non plus.
   La montée se termine sur translateY(0) : le cadrage final est au pixel
   celui que calcule apply(). Le débordement bas est rogné par
   l'overflow-hidden du sticky, donc la fenêtre monte bien depuis sous le pli. */
.hd-stagerise{position:absolute;inset:0;
  animation:hdStageRise 1100ms cubic-bezier(.22,1,.36,1) 420ms both}
@keyframes hdStageRise{
  from{opacity:0;transform:translate3d(0,120px,0)}
  to{opacity:1;transform:translate3d(0,0,0)}}
@media (prefers-reduced-motion:reduce){.hd-stagerise{animation:none}}
.hd-stage{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;
  transform-origin:center center;
  /* will-change AJOUTÉ (client 2026-08-10 : « le dézoom doit se faire comme
     dans du beurre »). La scène reçoit un scale à CHAQUE image de la course
     (intro, plongeons caméra, dézoom) ; sans couche composée, le navigateur
     ré-enregistrait la peinture de toute la réplique à chaque changement —
     c'est le gros du « ça accroche » ressenti au dézoom. Promue en couche,
     l'échelle se joue au compositeur : la texture existante est étirée
     pendant le geste et re-rastérisée au repos (netteté inchangée à l'arrêt,
     vérifiée par capture). */
  will-change:transform;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#111827;-webkit-font-smoothing:antialiased}
/* ── LE ROND DE FOND DU HERO ────────────────────────────────────────────
   ⚠ IL AVAIT DISPARU AVEC LE DEZOOM. La classe hd-blob ne vit que dans la
   scene epinglee, eteinte le 2026-08-28 : le rond bleute qui derivait derriere
   la replique est parti avec elle, sans que rien ne le signale. Client
   2026-08-29 : « garde le design de fond de la replication ».
   (PAS D'ACCENT GRAVE DANS CE BLOC : template literal. Un seul referme la
   chaine et le fichier ne compile plus.)
   Meme degrade et meme derive que hd-blob, mais pose en POURCENTAGES : il
   doit suivre une rangée qui change de largeur avec l'écran, là où l'original
   était calé au pixel dans une scène de 1040 de large. */
.hd-heroglow{position:absolute;z-index:0;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 38% 30%,#ffffff,#eef2fb 70%,#e0e7f6);
  animation:hdBlobFloat 16s ease-in-out infinite alternate}
.dark .hd-heroglow{background:radial-gradient(circle at 38% 30%,rgba(255,255,255,.10),rgba(255,255,255,.035) 60%,transparent 75%)}
@media (prefers-reduced-motion:reduce){.hd-heroglow{animation:none}}

.hd-blob{position:absolute;z-index:0;left:420px;top:70px;width:590px;height:590px;border-radius:50%;
  background:radial-gradient(circle at 38% 30%,#ffffff,#eef2fb 70%,#e0e7f6);
  animation:hdBlobFloat 16s ease-in-out infinite alternate}
.dark .hd-blob{background:radial-gradient(circle at 38% 30%,rgba(255,255,255,.10),rgba(255,255,255,.035) 60%,transparent 75%)}
/* Dérive lente du rond (client 2026-07-28 : « le rond derrière s'anime ») —
   translation + léger gonflement, aller-retour continu. */
@keyframes hdBlobFloat{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(-42px,26px,0) scale(1.05)}
  100%{transform:translate3d(24px,-18px,0) scale(0.97)}}
/* Ligne de marque : logo + texte en dégradé dont la teinte GLISSE lentement
   (l'effet monday.com — le changement est continu mais presque subliminal).
   hue-rotate sur le conteneur : le dégradé du texte ET le logo dérivent
   ensemble. */
.hd-brandline{display:inline-flex;align-items:center;gap:10px;
  animation:hdBrandHue 9s ease-in-out infinite alternate}
@keyframes hdBrandHue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(-45deg)}}
@media (prefers-reduced-motion:reduce){
  .hd-blob{animation:none}
  .hd-brandline{animation:none}}
/* ── macOS window chrome ── */
.hd-win{position:absolute;border-radius:12px;background:#fff;overflow:hidden;
  box-shadow:0 1px 2px rgba(15,23,42,.10),0 24px 60px -18px rgba(15,23,42,.28),0 60px 120px -40px rgba(15,23,42,.20)}
.dark .hd-win{box-shadow:0 1px 2px rgba(0,0,0,.45),0 30px 80px -20px rgba(0,0,0,.65),0 70px 150px -40px rgba(0,0,0,.55)}
.hd-titlebar{position:relative;display:flex;align-items:center;height:34px;flex-shrink:0;
  background:linear-gradient(#fbfbfa,#f4f4f3);border-bottom:1px solid #e6e6e3}
.hd-lights{display:flex;gap:7px;padding:0 12px}
.hd-lights span{width:11px;height:11px;border-radius:50%}
.hd-lights .r{background:#ff5f57;border:.5px solid #e0443e}
.hd-lights .y{background:#febc2e;border:.5px solid #d89c22}
.hd-lights .g{background:#28c840;border:.5px solid #1eaa33}
.hd-tbtitle{position:absolute;left:0;right:0;text-align:center;font-size:11.5px;font-weight:600;color:#4b5563}
/* ── Ora full window (login / welcome / accueil) ── */
.hd-app{display:flex;flex:1;min-height:0}
.hd-side{width:126px;flex-shrink:0;background:#fff;border-right:1px solid #eeedeb;
  display:flex;flex-direction:column;padding:12px 9px}
.hd-sidelogo{display:flex;align-items:center;padding:2px 4px 12px}
.hd-sidelogo img{height:22px;width:auto;display:block;margin-left:-2px}
.hd-sidelabel{font-size:8px;font-weight:700;letter-spacing:.09em;color:#9ca3af;text-transform:uppercase;padding:0 6px 7px}
.hd-sideitem{position:relative;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:500;color:#4b5563;
  border-radius:8px;padding:7px 9px;margin-bottom:3px}
.hd-sideitem.on{background:#eaf1fe;color:#2563eb;font-weight:600}
.hd-sideitem.on::after{content:'';position:absolute;right:-9px;top:6px;bottom:6px;width:3px;border-radius:99px;background:#3b82f6}
.hd-sidecard{margin-top:auto;background:#fbfaf8;border:1px solid #eeedeb;border-radius:10px;padding:10px 9px;text-align:center}
.hd-sidecard .ic{width:20px;height:20px;margin:0 auto 6px;border-radius:6px;background:#eaf1fe;color:#3b82f6;display:grid;place-items:center}
.hd-sidecard .t{font-size:9px;font-weight:700;color:#111827}
.hd-sidecard .d{font-size:7.5px;line-height:1.4;color:#9ca3af;margin-top:3px}
.hd-content{position:relative;flex:1;min-width:0;background:#fcfbf7;display:flex;flex-direction:column}
.hd-topbar{display:flex;align-items:center;gap:6px;height:38px;flex-shrink:0;padding:0 14px;
  background:#fff;border-bottom:1px solid #f0efec}
.hd-pagetitle{font-size:12.5px;font-weight:700;color:#111827}
.hd-pills{margin-left:auto;display:flex;align-items:center;gap:6px}
.hd-pillbtn{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid #e5e7eb;
  border-radius:99px;font-size:8.5px;font-weight:600;color:#374151;background:#fff}
.hd-pillbtn .n{display:inline-grid;place-items:center;min-width:12px;height:12px;border-radius:99px;
  background:#3b82f6;color:#fff;font-size:7px;font-weight:700;padding:0 3px}
.hd-avatar{width:20px;height:20px;border-radius:50%;background:#3b82f6;color:#fff;font-size:9px;font-weight:700;
  display:grid;place-items:center}
.hd-body{flex:1;min-height:0;padding:13px 16px;overflow:hidden}
.hd-h1{font-family:Poppins,'Inter',sans-serif;font-size:19px;font-weight:700;letter-spacing:-.02em;color:#111827}
.hd-date{font-size:9.5px;color:#6b7280;margin-top:2px}
.hd-banner{display:flex;align-items:center;gap:11px;background:#3b82f6;border-radius:13px;
  padding:12px 14px;margin-top:11px;box-shadow:0 8px 22px -10px rgba(59,130,246,.5)}
.hd-banner .ic{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.18);color:#fff;
  display:grid;place-items:center;flex-shrink:0}
.hd-banner .t{font-size:12px;font-weight:700;color:#fff}
.hd-banner .s{font-size:9px;color:rgba(255,255,255,.85);margin-top:2px}
.hd-banner .arrow{margin-left:auto;color:#fff}
.hd-seclabel{font-size:8px;font-weight:700;letter-spacing:.09em;color:#9ca3af;text-transform:uppercase;margin:12px 2px 7px}
.hd-quick{display:flex;gap:7px}
.hd-qcard{flex:1;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #eeedeb;
  border-radius:11px;padding:9px 9px;min-width:0}
.hd-qcard .ic{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;flex-shrink:0}
.hd-qcard .ic.blue{background:#eaf1fe;color:#3b82f6}
.hd-qcard .ic.purple{background:#f3e8ff;color:#8b5cf6}
.hd-qcard .t{font-size:9px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-qcard .s{font-size:7.5px;color:#9ca3af;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-row{position:relative;display:flex;align-items:center;gap:9px;background:#fff;border:1px solid #eeedeb;
  border-radius:11px;padding:9px 11px;margin-bottom:7px}
.hd-row .nm{font-size:10.5px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-row .mt{font-size:8.5px;color:#9ca3af;margin-top:1px}
.hd-status{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:600;
  color:#4b5563;white-space:nowrap}
.hd-status .dot{width:5px;height:5px;border-radius:50%;background:#f59e0b}
.hd-fico{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;flex-shrink:0;font-size:7px;font-weight:800}
.hd-fico.x{background:#e7f6ef;color:#1d7044}
.hd-fico.t{background:#f3f4f6;color:#4b5563}
.hd-fico.p{background:#fdecec;color:#dc2626}
.hd-flash{position:absolute;inset:0;border-radius:11px;background:rgba(59,130,246,.12);
  box-shadow:inset 0 0 0 2px #3b82f6;pointer-events:none;opacity:0}
/* ── Docked Ora panel (right, dual view) ── */
.hd-panel{left:656px;top:16px;width:368px;height:608px;display:flex;flex-direction:column;opacity:0}
.hd-ptop{display:flex;align-items:center;height:30px;flex-shrink:0;padding:0 12px;background:#fff;border-bottom:1px solid #f0efec}
.hd-ptop .t{font-size:11px;font-weight:700}
.hd-pbody{flex:1;min-height:0;background:#fcfbf7;padding:10px 12px;overflow:hidden;position:relative}
.hd-tabsbar{display:flex;align-items:center;gap:5px;height:24px;flex-shrink:0;padding:0 12px;
  background:#fff;border-bottom:1px solid #f0efec}
.hd-tabslabel{font-size:6.5px;font-weight:700;letter-spacing:.09em;color:#9ca3af;text-transform:uppercase}
.hd-tab{display:inline-flex;align-items:center;gap:4px;height:16px;padding:0 6px;border-radius:6px;
  font-size:7.5px;font-weight:600;white-space:nowrap}
.hd-tab.on{background:#eaf1fe;border:1px solid #bfdbfe;color:#2563eb}
.hd-tab.off{color:#6b7280}
.hd-back{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:600;color:#6b7280;margin-bottom:7px}
.hd-backicons{margin-left:auto;display:flex;gap:4px}
.hd-iconbtn{width:17px;height:17px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;color:#3b82f6;
  display:grid;place-items:center}
.hd-fileicons{margin-left:auto;display:flex;gap:4px}
.hd-rowactions{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.hd-rowactions .hd-lancer{margin-left:0}
.hd-star{color:#c6cbd3;display:grid;place-items:center}
.hd-filehead{display:flex;align-items:center;gap:8px}
.hd-filehead .nm{font-size:11px;font-weight:700;letter-spacing:-.01em;color:#111827}
.hd-filehead .mt{display:flex;align-items:center;gap:5px;font-size:8px;color:#9ca3af;margin-top:2px}
.hd-badge-todo{display:inline-flex;align-items:center;gap:3px;font-size:7.5px;font-weight:600;color:#4b5563;background:#f3f4f6;border-radius:99px;padding:1.5px 6px}
.hd-badge-todo .dot{width:4px;height:4px;border-radius:50%;background:#f59e0b}
.hd-badge-ok{display:inline-flex;align-items:center;gap:3px;font-size:7.5px;font-weight:700;color:#059669;
  background:#e7f6ef;border-radius:99px;padding:1.5px 6px}
.hd-sendrow{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #eeedeb;border-radius:10px;
  padding:6px 9px;margin-top:8px}
.hd-sendrow .lbl{font-size:8px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-sendrow .lbl b{font-weight:700}
.hd-sendbtn{margin-left:auto;display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 9px;
  border-radius:7px;background:#3b82f6;color:#fff;font-size:8px;font-weight:700;flex-shrink:0;
  box-shadow:0 2px 8px rgba(59,130,246,.30)}
.hd-chips{display:flex;align-items:center;gap:3px;margin-top:8px;flex-wrap:nowrap}
.hd-chip{display:inline-flex;align-items:center;gap:3px;font-size:7px;font-weight:600;color:#4b5563;
  background:#fff;border:1px solid #e5e7eb;border-radius:99px;padding:3px 6px;white-space:nowrap}
.hd-chip .n{color:#9ca3af;font-weight:700}
.hd-search{display:flex;align-items:center;height:24px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;
  padding:0 8px;gap:6px;color:#9ca3af;font-size:8px;margin-top:7px}
.hd-sugglabel{display:flex;align-items:center;gap:4px;font-size:7px;font-weight:700;letter-spacing:.09em;
  color:#6b7280;text-transform:uppercase;margin:8px 2px 6px}
.hd-sugglabel svg{color:#3b82f6}
.hd-playic{width:19px;height:19px;border-radius:6px;border:1px solid;display:grid;place-items:center;flex-shrink:0}
.hd-playic.blue{border-color:#bfdbfe;color:#3b82f6;background:#fff}
.hd-playic.purple{border-color:#e9d5ff;color:#8b5cf6;background:#fff}
.hd-playic.green{border-color:#bbe7cf;color:#059669;background:#fff}
.hd-hero-sugg{position:relative;display:flex;align-items:center;gap:7px;background:#eff6ff;border:1px solid #bfdbfe;
  border-radius:10px;padding:6px 8px;margin-bottom:5px}
.hd-hero-sugg .t{font-size:8.5px;font-weight:700;color:#111827}
.hd-hero-sugg .r{font-size:7.5px;color:#6b7280;margin-top:1px}
.hd-sugg{position:relative;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #eeedeb;
  border-radius:10px;padding:6px 8px;margin-bottom:5px}
.hd-sugg .t{font-size:8.5px;font-weight:700;color:#111827;display:flex;align-items:center;gap:4px}
.hd-sugg .d{font-size:7.5px;line-height:1.35;color:#6b7280;margin-top:1px}
.hd-tag{font-size:6px;font-weight:800;letter-spacing:.05em;border-radius:4px;padding:1px 4px}
.hd-tag.finance{background:#f3e8ff;color:#7c3aed}
.hd-tag.qualite{background:#e7f6ef;color:#059669}
.hd-tag.audit{background:#eaf1fe;color:#2563eb}
.hd-lancer{position:relative;display:inline-flex;align-items:center;gap:3px;font-size:7.5px;font-weight:700;
  border-radius:7px;padding:4px 8px;margin-left:auto;flex-shrink:0;white-space:nowrap;
  background:#3b82f6;color:#fff;box-shadow:0 2px 8px rgba(59,130,246,.28)}
.hd-lancer .hd-flash{border-radius:7px}
.hd-journal{flex-shrink:0;border-top:1px solid #f0efec;background:#fff;padding:5px 12px 7px}
.hd-jhead{display:flex;align-items:center;gap:5px;font-size:7px;font-weight:700;letter-spacing:.09em;
  color:#6b7280;text-transform:uppercase}
.hd-jhead .st{font-weight:600;letter-spacing:0;text-transform:none;color:#9ca3af}
.hd-jhead .chev{margin-left:auto;color:#c6cbd3}
.hd-jlines{margin-top:3px}
.hd-jline{display:flex;align-items:center;gap:5px;font-size:7.5px;color:#374151;padding:1.5px 0;opacity:0}
.hd-jline svg{color:#059669;flex-shrink:0}
/* ── FEC Studio config modal (over the panel) ── */
.hd-modal{position:absolute;left:14px;right:14px;top:52px;z-index:7;background:#fff;border-radius:14px;
  box-shadow:0 24px 60px -18px rgba(15,23,42,.35);padding:12px 13px 11px;opacity:0;transform-origin:center 30%}
.hd-mhead{display:flex;align-items:flex-start;gap:8px}
.hd-mhead .ic{width:24px;height:24px;border-radius:8px;background:#eaf1fe;color:#3b82f6;display:grid;place-items:center;flex-shrink:0}
.hd-mhead .t{font-size:10px;font-weight:700;color:#111827}
.hd-mhead .s{font-size:7.5px;color:#6b7280;margin-top:1px}
.hd-mhead .x{margin-left:auto;color:#9ca3af;font-size:10px}
.hd-mprofiles{display:flex;gap:5px;margin-top:8px}
.hd-mprofile{display:inline-flex;align-items:center;gap:3px;font-size:7px;font-weight:600;color:#4b5563;
  border:1px solid #e5e7eb;border-radius:99px;padding:3px 7px}
.hd-mprofile.b{color:#3b82f6;border-color:#93c5fd;border-style:dashed}
.hd-msec{font-size:7px;font-weight:700;letter-spacing:.09em;color:#374151;text-transform:uppercase;
  margin:9px 0 5px;display:flex;align-items:center;gap:4px}
.hd-msec .link{margin-left:auto;color:#3b82f6;font-weight:600;letter-spacing:0;text-transform:none}
.hd-mfieldlabel{font-size:6.5px;font-weight:700;letter-spacing:.07em;color:#9ca3af;text-transform:uppercase;margin-bottom:3px}
.hd-minput{display:flex;align-items:center;height:22px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;
  padding:0 8px;font-size:7px;color:#9ca3af;white-space:nowrap;overflow:hidden}
.hd-minput .stp{margin-left:auto;color:#c6cbd3;flex-shrink:0;display:grid;place-items:center}
.hd-mrow{position:relative;display:flex;align-items:center;justify-content:space-between;padding:3.5px 0}
.hd-mrow .l{font-size:7.5px;font-weight:700;letter-spacing:.06em;color:#6b7280;text-transform:uppercase}
.hd-toggle{position:relative;width:26px;height:14px;border-radius:99px;background:#e5e7eb;flex-shrink:0}
.hd-toggle .track{position:absolute;inset:0;border-radius:99px;background:#3b82f6;opacity:0}
.hd-toggle .knob{position:absolute;left:2px;top:2px;width:10px;height:10px;border-radius:50%;background:#fff;
  box-shadow:0 1px 3px rgba(15,23,42,.25)}
.hd-mfoot{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:10px}
.hd-mcancel{font-size:8px;font-weight:600;color:#4b5563;border:1px solid #e5e7eb;border-radius:99px;padding:5px 10px}
.hd-mrun{position:relative;display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;color:#fff;
  background:#3b82f6;border-radius:99px;padding:5px 11px;box-shadow:0 3px 10px rgba(59,130,246,.35)}
.hd-mrun .hd-flash{border-radius:99px}
/* ── Real Excel windows (left) ── */
.hd-xw{left:16px;top:30px;width:620px;height:580px;display:flex;flex-direction:column;opacity:0}
.hd-xtitle{display:flex;align-items:center;height:30px;flex-shrink:0;background:linear-gradient(#fbfbfa,#f4f4f3);
  border-bottom:1px solid #e6e6e3;padding:0 10px;gap:8px}
.hd-xtitle .hd-lights{padding:0}
.hd-xauto{display:flex;align-items:center;gap:4px;font-size:7px;color:#6b7280}
.hd-xauto .sw{width:16px;height:9px;border-radius:99px;background:#d1d5db;position:relative}
.hd-xauto .sw::after{content:'';position:absolute;left:1.5px;top:1.5px;width:6px;height:6px;border-radius:50%;background:#fff}
.hd-xname{position:absolute;left:0;right:0;text-align:center;font-size:10px;font-weight:600;color:#374151;pointer-events:none}
.hd-xribbontabs{display:flex;align-items:center;gap:11px;height:24px;flex-shrink:0;background:#fff;
  padding:0 12px;border-bottom:1px solid #ececec;font-size:8.5px;color:#4b5563}
.hd-xribbontabs .rt{padding:3px 0}
.hd-xribbontabs .rt.on{color:#217346;font-weight:700;box-shadow:inset 0 -2px 0 #217346}
.hd-xribbontabs .rt.ora{position:relative;display:inline-flex;align-items:center;gap:3px;color:#2563eb;font-weight:700}
.hd-xribbontabs .rt.ora .hd-flash{border-radius:5px;inset:-2px -4px}
.hd-xribbontabs .share{margin-left:auto;display:inline-flex;align-items:center;gap:3px;background:#217346;color:#fff;
  border-radius:6px;padding:2.5px 8px;font-size:7.5px;font-weight:700}
.hd-xribbontabs .comments{display:inline-flex;align-items:center;gap:3px;border:1px solid #e5e7eb;border-radius:6px;
  padding:2.5px 7px;font-size:7.5px;font-weight:600;color:#4b5563}
.hd-xribbon{display:flex;align-items:center;gap:10px;height:30px;flex-shrink:0;background:#fff;
  padding:0 12px;border-bottom:1px solid #e2e2e2;color:#6b7280}
.hd-xgroup{display:flex;align-items:center;gap:5px;font-size:6.5px;border-right:1px solid #efefef;padding-right:10px}
.hd-xgroup svg{color:#374151}
.hd-xfx{display:flex;align-items:center;height:22px;flex-shrink:0;border-bottom:1px solid #d7d7d7;
  font-size:9px;color:#3f3f3f;background:#fff}
.hd-xfx .nb{width:44px;text-align:center;border-right:1px solid #d7d7d7;font-weight:600;line-height:22px}
.hd-xfx .fx{width:22px;text-align:center;border-right:1px solid #d7d7d7;color:#9a9a9a;font-style:italic;
  font-family:Georgia,serif;line-height:22px}
.hd-xsheet{flex:1;min-height:0;overflow:hidden;background:#fff;position:relative}
.hd-xgrid{display:grid;font-size:8px;align-content:start}
.hd-xL{background:#f6f6f6;color:#7a7a7a;text-align:center;font-weight:600;padding:2.5px 0;
  border-right:1px solid #dedede;border-bottom:1px solid #d0d0d0;font-size:7.5px}
.hd-xN{background:#f6f6f6;color:#7a7a7a;text-align:center;font-weight:600;padding:4.5px 0;
  border-right:1px solid #dedede;border-bottom:1px solid #ededed;font-size:7.5px}
.hd-xH{background:#fff;color:#111;font-weight:700;padding:4.5px 5px;
  border-right:1px solid #ececec;border-bottom:1.5px solid #9a9a9a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xC{background:#fff;color:#333;padding:4.5px 5px;border-right:1px solid #ececec;border-bottom:1px solid #ececec;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xC.num{text-align:right;font-variant-numeric:tabular-nums}
.hd-xC.sel{box-shadow:inset 0 0 0 2px #217346}
.hd-xT{background:#f4f6f4;color:#111;font-weight:700;padding:4.5px 5px;border-right:1px solid #ececec;
  border-top:2px solid #217346;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xT.num{text-align:right;font-variant-numeric:tabular-nums}
.hd-xtabs{display:flex;align-items:center;height:22px;flex-shrink:0;background:#f7f7f7;border-top:1px solid #d7d7d7;
  padding:0 8px;gap:2px;font-size:8px;color:#4b5563}
.hd-xtab{position:relative;display:inline-flex;align-items:center;height:22px;padding:0 9px;white-space:nowrap}
.hd-xtab.on{background:#fff;font-weight:700;color:#217346;box-shadow:inset 0 2px 0 #217346}
.hd-xtabplus{margin-left:4px;color:#9ca3af}
.hd-xstatus{display:flex;align-items:center;height:18px;flex-shrink:0;background:#f7f7f7;border-top:1px solid #e2e2e2;
  padding:0 10px;font-size:7px;color:#6b7280}
.hd-xstatus .z{margin-left:auto}
.hd-xflash{position:absolute;inset:0;background:rgba(33,115,70,.12);box-shadow:inset 0 0 0 1.5px #217346;
  pointer-events:none;opacity:0}
/* ── Generated audit workbook (FEC Studio output): blue headers, title row,
     tighter rows, embedded chart sheet ── */
.hd-hidden{display:none!important}
.hd-xw2 .hd-xC,.hd-xw2 .hd-xN,.hd-xw2 .hd-xHb,.hd-xw2 .hd-xT{padding-top:3px;padding-bottom:3px;font-size:7.5px}
.hd-xw2 .hd-xtab{font-size:7px;padding:0 6px}
.hd-xTitle{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:4px 6px 4px 5px;
  font-weight:700;color:#111;font-size:9px;border-bottom:1px solid #ececec;white-space:nowrap;overflow:hidden}
.hd-xTitle .meta{font-weight:600;color:#8a8f98;font-size:7px;flex-shrink:0}
.hd-xHb{background:#4a86d6;color:#fff;font-weight:700;padding:4.5px 6px;
  border-right:1px solid #6ea0e0;border-bottom:1px solid #3a76c6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xHb.num{text-align:right}
/* Monthly sheet with an embedded bar chart */
.hd-xmonth{flex:1;min-height:0;padding:9px 11px;display:flex;flex-direction:column;background:#fff;overflow:hidden}
.hd-xmtitle{display:flex;align-items:baseline;justify-content:space-between;font-weight:700;font-size:9.5px;color:#111;margin-bottom:8px}
.hd-xmtitle .meta{font-weight:600;font-size:7px;color:#8a8f98}
.hd-xmbody{flex:1;min-height:0;display:flex;gap:12px}
.hd-xmtable{width:146px;flex-shrink:0;border:1px solid #e4e4e4;border-radius:2px;overflow:hidden;align-self:flex-start}
.hd-xmtable .r{display:grid;grid-template-columns:1fr 1fr 1fr;font-size:7px;border-bottom:1px solid #f1f1f1}
.hd-xmtable .r:last-child{border-bottom:none}
.hd-xmtable .r.h{background:#4a86d6;color:#fff;font-weight:700}
.hd-xmtable .r>span{padding:2.6px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xmtable .r>span.num{text-align:right;font-variant-numeric:tabular-nums}
.hd-xmchart{flex:1;min-width:0;border:1px solid #e4e4e4;border-radius:2px;padding:8px 12px 5px;display:flex;flex-direction:column}
.hd-xmchart .ct{font-size:8.5px;font-weight:700;color:#333;text-align:center;margin-bottom:5px}
.hd-xmchart svg{flex:1;width:100%;min-height:0}
.hd-xmleg{display:flex;justify-content:center;gap:14px;font-size:7px;color:#555;margin-top:4px}
.hd-xmleg i{display:inline-block;width:8px;height:8px;border-radius:1px;margin-right:4px;vertical-align:middle}
/* ── Loading popup: FEC Studio 4-step progress (replica of the real app) ── */
.hd-loading{position:absolute;left:26px;right:26px;top:120px;z-index:8;background:#fff;border-radius:16px;
  box-shadow:0 24px 60px -18px rgba(15,23,42,.38);padding:18px 18px 14px;opacity:0;text-align:center;
  transform-origin:center center}
.hd-loading .lgwrap{width:34px;height:34px;margin:0 auto 10px}
.hd-loading .lgwrap img{width:100%;height:100%;object-fit:contain;display:block}
.hd-loading .t{font-size:11px;font-weight:800;letter-spacing:-.01em;color:#111827;margin-bottom:13px}
.hd-loading .step{text-align:left;margin-bottom:11px}
.hd-loading .step:last-of-type{margin-bottom:2px}
.hd-loading .step .head{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.hd-loading .step .ic{position:relative;width:13px;height:13px;flex-shrink:0}
.hd-loading .step .ic .ck{position:absolute;inset:0;color:#3b82f6;display:grid;place-items:center;opacity:0}
.hd-loading .step .ic .dt{position:absolute;left:3px;top:3px;width:7px;height:7px;border-radius:50%;background:#3b82f6;opacity:.35}
.hd-loading .step .lbl{font-size:9.5px;font-weight:600;color:#9ca3af}
.hd-loading .step .bar{height:5px;border-radius:99px;background:#eaf1fd;overflow:hidden}
.hd-loading .step .barfill{display:block;height:100%;border-radius:99px;background:#3b82f6;
  transform-origin:left center;transform:scaleX(0)}
.hd-loading .cancel{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:600;color:#6b7280;margin-top:11px}
/* ── Result arrival glow (makes the generated workbook POP) ── */
.hd-xwglow{position:absolute;inset:0;border-radius:12px;pointer-events:none;opacity:0;z-index:5;
  box-shadow:0 0 0 3px rgba(59,130,246,.55),0 0 46px 8px rgba(59,130,246,.35)}
/* ── generated-file pill / cursor / captions ── */
.hd-pill{position:absolute;left:460px;top:150px;z-index:8;display:flex;align-items:center;gap:8px;background:#fff;
  border-radius:11px;padding:8px 12px;box-shadow:0 12px 34px -10px rgba(15,23,42,.30);opacity:0}
.dark .hd-pill{box-shadow:0 12px 34px -10px rgba(0,0,0,.45)}
.hd-pill .fico{width:26px;height:26px;border-radius:7px;background:#e7f6ef;color:#1d7044;display:grid;place-items:center;
  font-size:8px;font-weight:800;flex-shrink:0}
.hd-pill .t1{font-size:10.5px;font-weight:700;color:#111827}
.hd-pill .t2{font-size:9px;color:#9ca3af;margin-top:1px}
.hd-cursor{position:absolute;z-index:12;left:0;top:0;width:52px;height:52px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.40))}
.hd-ripple{position:absolute;z-index:11;width:32px;height:32px;margin:-16px 0 0 -16px;border-radius:50%;
  border:2px solid #3b82f6;background:rgba(59,130,246,.18);opacity:0;pointer-events:none}
/* ── Immersive dark takeover at zoom moments ── */
.hd-sticky{transition:background-color .5s ease}
.hd-sticky.immersive{background-color:#070b14}
/* End-of-demo hand-off to the always-black text section: pure black. */
.hd-sticky.endblack{background-color:#000!important}
.hd-blob{transition:opacity .5s ease}
.hd-sticky.immersive .hd-blob{opacity:0}
/* ── Aurora veil — premium-SaaS light washes (Stripe/Linear style) ──
   Pure radial-gradients, NO blur filter (expensive to repaint while
   scrolling). Ellipses of brand light at 10-16% that drift with the scrub.
   Fades out with the headline when the demo goes immersive. */
.hd-aurora{transition:opacity .5s ease}
.hd-sticky.immersive .hd-aurora{opacity:0}
.hd-aw{position:absolute;pointer-events:none;border-radius:50%}
.hd-aw.a1{background:radial-gradient(closest-side,rgba(59,130,246,.14),rgba(59,130,246,.05) 55%,transparent 100%)}
.hd-aw.a2{background:radial-gradient(closest-side,rgba(96,165,250,.12),rgba(96,165,250,.04) 55%,transparent 100%)}
.hd-aw.a3{background:radial-gradient(closest-side,rgba(59,130,246,.08),transparent 72%)}
.dark .hd-aw.a1{background:radial-gradient(closest-side,rgba(59,130,246,.17),rgba(59,130,246,.06) 55%,transparent 100%)}
.dark .hd-aw.a2{background:radial-gradient(closest-side,rgba(96,165,250,.13),rgba(96,165,250,.05) 55%,transparent 100%)}
.dark .hd-aw.a3{background:radial-gradient(closest-side,rgba(59,130,246,.09),transparent 72%)}
.hd-sticky.immersive .hd-win{box-shadow:0 1px 2px rgba(0,0,0,.5),0 34px 90px -20px rgba(0,0,0,.75),0 80px 160px -40px rgba(0,0,0,.65)}
.hd-headline{transition:opacity .5s ease}
.hd-sticky.immersive .hd-headline{opacity:0!important}
.hd-cap>span{transition:color .5s ease,background-color .5s ease,box-shadow .5s ease}
.hd-sticky.immersive .hd-cap>span:first-child{background:rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(255,255,255,.22);color:#fff}
.hd-sticky.immersive .hd-cap>span:last-child{color:#d1d5db}
/* ── Persistent scroll cue: the demo is driven by scrolling, not clicks ── */
/* ══ Notification d'invitation ════════════════════════════════════════════
   Client 2026-08-03, troisième passe : « bien plus minimaliste, bien plus petit
   et discret ». Ma version précédente faisait 330 x 224 px avec liseré de
   marque, étiquette et gros bouton bleu : jugée moche, à raison, elle écrasait
   la scène. On revient donc EXACTEMENT au gabarit des pastilles flottantes de la
   réplique (fiche blanche, icône teintée, titre puis sous-titre gris), avec pour
   seule marque d'interactivité un chevron et une teinte bleue sur l'icône.
   Deux couches : .hd-invanchor ne porte que la position et l'opacité, .hd-invite
   l'apparence et le flottement, sinon les deux se disputeraient transform. La
   fuite du curseur, elle, passe par translate, propriete distincte, donc les
   trois se composent sans conflit. */
/* En absolute et NON en fixed (correctif client 2026-08-03 : « le bouton réapparaît
   à des endroits où il n'est pas censé être »). En fixed, l'élément n'était plus
   solidaire de la page : il restait collé au viewport et suivait le lecteur
   partout. Et masquer par calcul ne suffisait pas, car le moteur ne tourne que
   sur les CHANGEMENTS de progression du scroll : une fois le hero traversé, la
   progression est bloquée à 1, plus aucun changement n'est émis, donc la dernière
   opacité écrite restait en place indéfiniment.
   En absolute dans le bloc épinglé, la notification part avec lui, quoi qu'il
   arrive. Les coordonnées écrites par le moteur restent valables : le bloc est
   collé en top-0 et fait la hauteur de l'écran, ses coordonnées locales sont
   donc celles du viewport pendant tout l'épinglage, seul moment où elle
   s'affiche. */
.hd-invanchor{position:absolute;z-index:40;transform:translate(-100%,-100%);
  opacity:0;pointer-events:none;transition:opacity 480ms ease}
.hd-invite{display:flex;align-items:center;gap:11px;
  padding:11px 13px 11px 12px;border-radius:15px;background:#fff;text-align:left;
  box-shadow:0 18px 40px -14px rgba(15,23,42,.34),0 3px 10px -4px rgba(15,23,42,.14),
             0 0 0 1px rgba(15,23,42,.05);
  animation:hdInviteFloat 6s ease-in-out infinite alternate;
  transition:box-shadow .2s ease,translate .18s ease-out}
.hd-invite:hover{box-shadow:0 24px 52px -14px rgba(15,23,42,.42),0 4px 12px -4px rgba(15,23,42,.18),
             0 0 0 1px rgba(59,130,246,.4)}
.hd-invite .ic{width:34px;height:34px;flex-shrink:0;border-radius:10px;display:grid;place-items:center;
  background:linear-gradient(135deg,#e8f0ff,#d7e5ff);color:#2f6ff0}
.hd-invite b{display:block;font-size:13px;font-weight:700;color:#111827;white-space:nowrap}
.hd-invite .sub{display:block;margin-top:2px;font-size:11.5px;color:#8b909b;white-space:nowrap}
.hd-invite .go{margin-left:4px;flex-shrink:0;color:#c3c6cd;transition:color .2s ease}
.hd-invite:hover .go{color:#2f6ff0}
@keyframes hdInviteFloat{from{transform:translate3d(0,0,0)}to{transform:translate3d(-4px,6px,0)}}
@media (prefers-reduced-motion:reduce){.hd-invite{animation:none}}
.dark .hd-invite{background:#0f172a;
  box-shadow:0 18px 40px -14px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.10)}
.dark .hd-invite b{color:#fff}
.dark .hd-invite .ic{background:rgba(59,130,246,.18);color:#8ab4ff}

/* ══ Fondu du bas de la scène ══════════════════════════════════════════════
   Client 2026-08-03 : « le rond est toujours coupé net en bas par une bande
   blanche, et l'ombre derrière la réplique s'arrête net aussi ».
   Ce n'etait pas une couleur de fond mais le BORD BAS du bloc épinglé, qui est en
   overflow-hidden : le rond et l'ombre portée de la fenêtre y étaient tranchés
   net, ce qui dessinait une ligne franche en travers de la page.
   Ce voile les dissout dans le blanc sur 230 px, donc plus aucune ligne de coupe.
   C'est le même principe que le masque en dégradé utilisé pendant le récit
   complet, en version fixe et bien moins coûteuse.
   Il n'est rendu que si la démo n'est PAS lancée : pendant le récit, la scène
   finit par passer au noir et c'est son masque qui s'en occupe. */
/* 150 px et une montée tardive : à 230 px avec un palier à 62 %, le voile
   délavait les tuiles ACCÈS RAPIDE alors que la réplique est encore le visuel
   principal. Il ne doit dissoudre que les tout derniers pixels, là où le rond et
   l'ombre se faisaient trancher. */
.hd-bottomfade{position:absolute;left:0;right:0;bottom:0;height:150px;z-index:15;
  pointer-events:none;
  background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,.22) 55%,rgba(255,255,255,.72) 82%,#fff 100%)}
.dark .hd-bottomfade{background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.22) 55%,rgba(0,0,0,.72) 82%,#000 100%)}

.hd-scrollcue{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;
  padding:7px 13px;border-radius:99px;background:rgba(17,24,39,.05);transition:background-color .5s ease}
/* display:none porté PAR CE MÊME bloc : la classe utilitaire hidden de
   Tailwind a la même spécificité mais est déclarée plus haut dans le document,
   donc le display:flex de .hd-scrollcue la gagnait. */
.hd-scrollcue.off{display:none}
.hd-scrollcue .chev{color:#6b7280;animation:hdCueBounce 1.4s ease-in-out infinite;transition:color .5s ease}
.hd-scrollcue .txt{font-size:11px;font-weight:600;color:#6b7280;transition:color .5s ease;white-space:nowrap}
.hd-scrollcue .track{display:block;width:110px;height:3px;border-radius:99px;background:rgba(17,24,39,.12);overflow:hidden;transition:background-color .5s ease}
.hd-scrollcue .fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#0d9488);
  transform-origin:left center;transform:scaleX(0)}
@keyframes hdCueBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){.hd-scrollcue .chev{animation:none}}
.hd-sticky.immersive .hd-scrollcue{background:rgba(255,255,255,.10)}
.hd-sticky.immersive .hd-scrollcue .chev,.hd-sticky.immersive .hd-scrollcue .txt{color:#cbd5e1}
.hd-sticky.immersive .hd-scrollcue .track{background:rgba(255,255,255,.15)}
.hd-cap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;opacity:0}
`;

// ── Real FEC data (from the actual demo workbook) ───────────────────────────
const FEC_COLS = ["JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "PieceRef", "Debit", "Credit"];
const FEC_GRID = "22px .85fr .75fr .8fr .85fr .8fr 1.25fr .75fr .8fr .8fr";
const FEC_ROWS: string[][] = [
  ["VE", "Ventes", "00001", "20241104", "411000", "Clients", "FA0001", "3621,47", "0,00"],
  ["VE", "Ventes", "00001", "20241104", "707000", "Ventes de marchandises", "FA0001", "0,00", "3017,89"],
  ["VE", "Ventes", "00001", "20241104", "44571000", "TVA collectée", "FA0001", "0,00", "603,58"],
  ["BQ", "Banque", "00002", "20241215", "512000", "Banque", "FA0001", "3621,47", "0,00"],
  ["BQ", "Banque", "00002", "20241215", "411000", "Clients", "FA0001", "0,00", "3621,47"],
  ["VE", "Ventes", "00003", "20240324", "411000", "Clients", "FA0002", "3325,75", "0,00"],
  ["VE", "Ventes", "00003", "20240324", "707000", "Ventes de marchandises", "FA0002", "0,00", "2771,46"],
  ["VE", "Ventes", "00003", "20240324", "44571000", "TVA collectée", "FA0002", "0,00", "554,29"],
  ["VE", "Ventes", "00004", "20240219", "411000", "Clients", "FA0003", "384,92", "0,00"],
  ["VE", "Ventes", "00004", "20240219", "707000", "Ventes de marchandises", "FA0003", "0,00", "320,77"],
  ["VE", "Ventes", "00004", "20240219", "44571000", "TVA collectée", "FA0003", "0,00", "64,15"],
  ["BQ", "Banque", "00005", "20240315", "512000", "Banque", "FA0003", "384,92", "0,00"],
  ["BQ", "Banque", "00005", "20240315", "411000", "Clients", "FA0003", "0,00", "384,92"],
  ["VE", "Ventes", "00006", "20240417", "411000", "Clients", "FA0004", "361,01", "0,00"],
  ["VE", "Ventes", "00006", "20240417", "707000", "Ventes de marchandises", "FA0004", "0,00", "300,84"],
  ["VE", "Ventes", "00006", "20240417", "44571000", "TVA collectée", "FA0004", "0,00", "60,17"],
];

// ── Generated audit workbook sheets (real FEC Studio output) ────────────────
const BG_META = "FEC 2025 · 48 512 écritures";
const BG_COLS = ["Compte", "Intitulé", "Mouvements débit", "Mouvements crédit", "Solde débiteur", "Solde créditeur"];
const BG_ROWS: string[][] = [
  ["101000", "Capital social", "", "800 000,00", "", "800 000,00"],
  ["106100", "Réserve légale", "", "64 000,00", "", "64 000,00"],
  ["164000", "Emprunts auprès des établissements de crédit", "96 000,00", "380 000,00", "", "284 000,00"],
  ["211000", "Terrains", "120 000,00", "", "120 000,00", ""],
  ["213000", "Constructions", "486 000,00", "", "486 000,00", ""],
  ["281300", "Amortissements des constructions", "", "142 400,00", "", "142 400,00"],
  ["401000", "Fournisseurs", "842 310,45", "897 465,20", "", "55 154,75"],
  ["411000", "Clients", "1 264 890,30", "1 121 545,10", "143 345,20", ""],
  ["421000", "Personnel - rémunérations dues", "359 400,00", "389 350,00", "", "29 950,00"],
  ["431000", "Sécurité sociale", "268 015,00", "292 380,00", "", "24 365,00"],
  ["445660", "TVA déductible sur ABS", "98 764,10", "96 214,10", "2 550,00", ""],
  ["445710", "TVA collectée", "188 940,00", "204 148,00", "", "15 208,00"],
  ["512000", "Banque BNP Paribas", "1 087 620,15", "998 435,60", "89 184,55", ""],
  ["530000", "Caisse", "12 480,00", "11 940,00", "540,00", ""],
  ["601100", "Achats de marchandises", "486 220,00", "", "486 220,00", ""],
  ["613200", "Locations immobilières", "50 400,00", "", "50 400,00", ""],
  ["641100", "Salaires bruts", "459 000,00", "", "459 000,00", ""],
  ["645000", "Charges sociales", "192 780,00", "", "192 780,00", ""],
  ["661100", "Intérêts des emprunts", "14 820,00", "", "14 820,00", ""],
  ["706000", "Prestations de services", "", "598 400,00", "", "598 400,00"],
  ["707000", "Ventes de marchandises", "", "892 610,00", "", "892 610,00"],
];
const BG_TOTAL = ["", "TOTAUX", "6 027 439,00", "6 888 888,00", "2 044 839,75", "2 906 087,75"];

const BA_META = "au 31/12/2025";
const BA_COLS = ["Compte", "Client", "Total", "Non échu", "0-30 j", "31-60 j", "61-90 j", "> 90 j"];
const BA_ROWS: string[][] = [
  ["411DURA", "DURAND SAS", "28 800,00", "19 200,00", "9 600,00", "", "", ""],
  ["411MART", "MARTIN & CIE", "21 360,00", "21 360,00", "", "", "", ""],
  ["411PETI", "PETIT SARL", "14 880,00", "7 440,00", "", "7 440,00", "", ""],
  ["411LEGR", "LEGRAND SA", "9 120,00", "", "", "", "4 560,00", "4 560,00"],
  ["411BOIS", "BOISSEAU SARL", "6 200,00", "", "3 100,00", "3 100,00", "", ""],
  ["411HAVR", "TRANSPORTS DU HAVRE", "4 980,00", "4 980,00", "", "", "", ""],
];
const BA_TOTAL = ["", "TOTAUX", "85 340,00", "52 980,00", "12 700,00", "10 540,00", "4 560,00", "4 560,00"];

// Balance mensuelle — data behind the embedded bar chart (k€).
const BM_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const BM_DEBIT = [512, 468, 534, 498, 546, 588, 452, 398, 610, 642, 574, 690];
const BM_CREDIT = [486, 502, 548, 472, 560, 572, 468, 412, 588, 620, 560, 672];
const BM_MAX = 720;

// JOURNAL lines during the FEC Studio run.
const J_LINES = [
  "Lecture du FEC : 398 412 lignes",
  "Contrôles de structure : 18/18 conformes",
  "Balance générale construite",
  "Balance âgée créances & dettes",
  "Classeur d'audit généré",
];

// 0→1 ramp of v across [a, b] (clamped).
const seg = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Adoucit une progression 0→1 (cubique in-out) : départ et arrivée
 *  progressifs au lieu du démarrage/arrêt net de `seg`. Utilisé sur les
 *  transitions d'ouverture du hero. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ── Heavy-scroll zones ──────────────────────────────────────────────────────
// [demo-space end, weight]: higher weight = more physical scroll is needed to
// cross that part of the demo, so key moments feel "heavy" (the user slows
// down on them) while transitions stay light.
const ZONES: { to: number; w: number }[] = [
  // Ouverture (client 2026-07-29, 2e passe) : le geste « j'ouvre un fichier »
  // est le premier récit du site, il doit se LIRE. Avant, tout l'enchaînement
  // curseur → sélecteur → choix du classeur tenait dans 8 % du scroll : la
  // souris se téléportait et le sélecteur clignotait. Ces zones sont donc
  // devenues les plus lourdes de la démo.
  { to: 0.07, w: 0.8 },  // le titre s'efface
  { to: 0.12, w: 1.0 },  // son espace se replie, le logiciel remonte
  { to: 0.17, w: 2.2 },  // la souris glisse vers « Ouvrir un fichier » + clic
  { to: 0.22, w: 1.8 },  // le sélecteur de fichier s'ouvre
  { to: 0.285, w: 2.2 }, // la souris descend sur le classeur + clic
  { to: 0.38, w: 1.2 },  // passage de relais vers Excel + panneau Ora
  { to: 0.545, w: 0.6 }, // lecture du panneau Ora avant le premier geste
  { to: 0.60, w: 2.2 },  // « Lancer » + the modal opens (zoom)
  { to: 0.71, w: 3.2 },  // the three toggles + « Lancer maintenant » (heaviest)
  { to: 0.84, w: 1.6 },  // journal run + loading card + green-check success
  { to: 0.90, w: 1.3 },  // workbook swap
  { to: 1.0, w: 1.8 },   // sheet browsing
];
const ZONE_TABLE = (() => {
  let from = 0, cum = 0;
  const rows = ZONES.map((z) => {
    const cost = (z.to - from) * z.w;
    const row = { from, to: z.to, cum0: cum, cost };
    cum += cost;
    from = z.to;
    return row;
  });
  return { rows, total: cum };
})();
// Maps RAW scroll progress (linear) to DEMO time (weighted).
const remap = (r: number) => {
  const target = Math.min(1, Math.max(0, r)) * ZONE_TABLE.total;
  for (const row of ZONE_TABLE.rows) {
    if (target <= row.cum0 + row.cost || row.to === 1) {
      const t = row.cost > 0 ? (target - row.cum0) / row.cost : 1;
      return row.from + (row.to - row.from) * Math.min(1, Math.max(0, t));
    }
  }
  return 1;
};
// Piecewise-linear keyframe interpolation.
const kf = (v: number, times: number[], vals: number[]) => {
  if (v <= times[0]) return vals[0];
  for (let i = 1; i < times.length; i++) {
    if (v <= times[i]) {
      const t = (v - times[i - 1]) / (times[i] - times[i - 1]);
      return vals[i - 1] + (vals[i] - vals[i - 1]) * t;
    }
  }
  return vals[vals.length - 1];
};

// Simplified Excel ribbon groups (silhouette only, like the real ribbon).
function XRibbon() {
  return (
    <div className="hd-xribbon">
      {["Presse-papiers", "Police", "Alignement", "Numérique", "Cellules", "Édition"].map((g) => (
        <span key={g} className="hd-xgroup">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
          {g}
        </span>
      ))}
    </div>
  );
}

// Excel window chrome shared by both workbooks. `oraTarget` marks THIS
// window's « Ora » ribbon tab as the cursor's click target (excel1 only).
function XChrome({ name, cell, formula, oraTarget }: { name: string; cell: string; formula: string; oraTarget?: boolean }) {
  return (
    <>
      <div className="hd-xtitle">
        <div className="hd-lights"><span className="r" /><span className="y" /><span className="g" /></div>
        <span className="hd-xauto"><span className="sw" />Enregistrement automatique</span>
        <span className="hd-xname">{name}</span>
      </div>
      <div className="hd-xribbontabs">
        {["Accueil", "Insertion", "Mise en page", "Formules", "Données", "Révision", "Affichage"].map((rt, i) => (
          <span key={rt} className={`rt${i === 0 ? " on" : ""}`}>{rt}</span>
        ))}
        <span className="rt ora" {...(oraTarget ? { "data-cur": "oratab" } : {})}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" /></svg>
          Ora
          {oraTarget && <span className="hd-flash" data-hd="oratab-flash" />}
        </span>
        <span className="comments">Commentaires</span>
        <span className="share">Partager</span>
      </div>
      <XRibbon />
      <div className="hd-xfx">
        <span className="nb">{cell}</span>
        <span className="fx">fx</span>
        <span style={{ paddingLeft: 8, color: "#555", fontSize: 8.5 }}>{formula}</span>
      </div>
    </>
  );
}

// One sheet of the generated audit workbook: title row (bold + right meta),
// a blue header row (FEC Studio style), the data, then a TOTAUX row.
function TableSheet({
  sheet, hidden, title, meta, cols, rows, total, gridCols, firstNum,
}: {
  sheet: number; hidden?: boolean; title: string; meta: string;
  cols: string[]; rows: string[][]; total?: string[]; gridCols: string; firstNum: number;
}) {
  return (
    <div className={`hd-xgrid${hidden ? " hd-hidden" : ""}`} data-sheet={sheet} style={{ gridTemplateColumns: gridCols }}>
      <div className="hd-xL" />
      {cols.map((_, i) => <div key={`l${i}`} className="hd-xL">{String.fromCharCode(65 + i)}</div>)}
      <div className="hd-xN">1</div>
      <div className="hd-xTitle" style={{ gridColumn: `span ${cols.length}` }}>
        <span>{title}</span><span className="meta">{meta}</span>
      </div>
      <div className="hd-xN">2</div>
      {cols.map((h, i) => <div key={`h${i}`} className={`hd-xHb${i >= firstNum ? " num" : ""}`}>{h}</div>)}
      {rows.map((row, r) => (
        <div key={r} style={{ display: "contents" }}>
          <div className="hd-xN">{r + 3}</div>
          {row.map((cell, ci) => <div key={ci} className={`hd-xC${ci >= firstNum ? " num" : ""}`}>{cell}</div>)}
        </div>
      ))}
      {total && (
        <div style={{ display: "contents" }}>
          <div className="hd-xN">{rows.length + 3}</div>
          {total.map((cell, ci) => <div key={ci} className={`hd-xT${ci >= firstNum ? " num" : ""}`}>{cell}</div>)}
        </div>
      )}
    </div>
  );
}

// ── HeroAurora — scroll-driven brand-light veil ─────────────────────────────
// The premium-SaaS background treatment: three huge, ultra-soft washes of
// brand light (blue / teal / sky) that drift slowly as the demo is scrubbed.
// No geometry, no blur filters — just pure gradients moving on transform
// (GPU-cheap). Hidden below md, faded out in immersive mode via `.hd-aurora`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- gardé pour restauration
export function HeroAurora({ progress }: { progress: MotionValue<number> }) {
  const y1 = useTransform(progress, [0, 1], ["5vh", "-14vh"]);
  const y2 = useTransform(progress, [0, 1], ["-4vh", "10vh"]);
  const x2 = useTransform(progress, [0, 1], ["0vw", "-6vw"]);
  const y3 = useTransform(progress, [0, 1], ["8vh", "-6vh"]);

  return (
    <div aria-hidden className="hd-aurora pointer-events-none absolute inset-0 z-0 hidden md:block">
      {/* Blue wash — top-left, drifts up as you scroll */}
      <motion.div
        className="hd-aw a1 w-[72rem] h-[52rem] -left-[22rem] -top-[16rem]"
        style={{ y: y1, willChange: "transform" }}
      />
      {/* Light-blue wash — right side, drifts down + inward */}
      <motion.div
        className="hd-aw a2 w-[60rem] h-[46rem] -right-[20rem] top-[6%]"
        style={{ y: y2, x: x2, willChange: "transform" }}
      />
      {/* Wide blue wash — grounding the bottom of the hero */}
      <motion.div
        className="hd-aw a3 w-[80rem] h-[36rem] left-1/2 -bottom-[10rem]"
        style={{ x: "-50%", y: y3, willChange: "transform" }}
      />

    </div>
  );
}

export default function OraHeroDemo({ theme, openBooking }: OraHeroDemoProps) {
  const { t } = useLang();
  void theme;

  const wrapRef = useRef<HTMLDivElement>(null);
  /** Le CADENCEUR : l'élément dont la hauteur porte la course d'épinglage.
   *  Depuis la sortie du titre (2026-08-13) ce n'est plus le wrapper entier —
   *  le titre en flux normal en fait partie — mais un bloc dédié qui ne
   *  contient QUE la scène épinglée : la progression 0→1 démarre ainsi
   *  exactement à l'épinglage, quel que soit le nombre de lignes du titre. */
  const rideRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const capsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const inviteRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef(-1);

  const fitScaleRef = useRef(1);
  const lastVRef = useRef(0);
  /** Largeur de boîte du dernier fit() COMPLET — le ResizeObserver ne rejoue
   *  le chemin lourd que si elle change (voir le pavé dans fit()). */
  const fitWRef = useRef(0);
  const applyRef = useRef<(v: number) => void>(() => {});
  /** Géométrie MESURÉE de la grille du mur, en coordonnées locales de la
   *  grille (indépendantes de ses transforms, qui ne sont que des
   *  translations) : centre du trou, dimensions, et course de traversée.
   *  Recalculée par fit() à chaque redimensionnement — les cellules ont des
   *  hauteurs naturelles, rien ici ne peut être supposé. */
  const wallGeomRef = useRef<{ holeCx: number; holeCy: number; gridW: number; gridH: number; travel: number } | null>(null);
  // Cursor click targets, measured at runtime in STAGE coordinates.
  const targetsRef = useRef<Record<string, { x: number; y: number }>>({
    // Cibles de l'ouverture. Codées en dur : elles visent la réplique du
    // logiciel, qui a sa propre mise à l'échelle interne, donc la mesure
    // automatique par offsetParent y serait fausse.
    // `openfile` RECALÉ le 2026-08-12 avec OPEN_CARD : la carte bleue ayant
    // perdu la moitié de sa largeur (voir le pavé d'OPEN_CARD), son centre
    // passe de x 597 à 460, et de y 217 à 226. Sans ça le curseur cliquait à
    // côté, sur la carte « Assistant » voisine.
    openfile: { x: 460, y: 226 }, pickrow: { x: 520, y: 322 },
    oratab: { x: 600, y: 96 }, lancerfec: { x: 940, y: 300 }, loadc: { x: 856, y: 330 },
    tg1: { x: 850, y: 330 }, tg2: { x: 850, y: 360 }, tg3: { x: 850, y: 390 },
    run: { x: 940, y: 470 }, tab2: { x: 180, y: 590 }, tab3: { x: 300, y: 590 },
    modalc: { x: 840, y: 320 }, result: { x: 326, y: 320 },
  });

  // Scroll scrub: 0 → 1 across the tall wrapper.
  // Cible = le CADENCEUR, pas le wrapper : 0 pile au moment où la scène
  // s'épingle (pendant toute l'approche, la progression reste bloquée à 0).
  const { scrollYProgress } = useScroll({ target: rideRef, offset: ["start start", "end end"] });
  // ── Démo scrollée sur OPT-IN (client 2026-08-03) ─────────────────────────
  // Par défaut le récit ne se joue PAS : la scène reste à son état de repos, le
  // curseur simulé n'apparaît pas, et la page défile normalement. Une pastille
  // flottante propose de le lancer. Un clic, et on retrouve exactement le
  // comportement d'avant.
  const [demoOn, setDemoOn] = useState(false);
  // Passe à vrai la PREMIÈRE fois que la notification se montre. Sert à déclencher
  // le petit blocage de scroll, dans un effet React plutôt que dans le moteur :
  // le nettoyage de l'effet garantit alors que Lenis est toujours relancé.
  const invitedRef = useRef(false);
  // Le moteur de scrub vit dans un effet à dépendances vides : il lit donc
  // l'état via une ref, sinon il resterait sur la valeur du premier rendu.
  const demoOnRef = useRef(false);
  demoOnRef.current = demoOn;

  const [reduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // ── Allumage de la notification ──────────────────────────────────────────
  // Il n'y a plus de blocage ici. Le lenis.stop() qui s'y trouvait a été retiré
  // (client 2026-08-03 : « il ne faudrait pas que le scroll soit bloqué quand le
  // bouton s'affiche mais ralenti, sinon on dirait que le site bugue »), et avec
  // lui tout son appareillage : compteur d'insistance, maintien minimum de 1,8 s,
  // minuterie de secours à 6 s, relance de Lenis au nettoyage. Autant de
  // machinerie qui n'existait que pour rattraper le blocage, et dont chaque
  // branche était une occasion de laisser le défilement à l'arrêt.
  //
  // La lourdeur est désormais purement géométrique : le battement (0 →
  // DZ_START de la course d'épinglage) laisse le temps de voir la
  // notification avant que le dézoom ne s'engage. La page continue de
  // défiler, l'ascenseur avance, la scène patiente. C'est le comportement
  // attendu d'une section épinglée, pas celui d'une page figée.
  //
  // Ne reste donc que l'allumage, franc et immédiat.
  //
  // ── ET IL EST DEVENU IMPÉRATIF (2026-08-10, « le dézoom doit se faire comme
  // dans du beurre ») ────────────────────────────────────────────────────────
  // L'allumage vivait dans un useEffect déclenché par un setState posé depuis
  // le moteur de scrub. Or ce composant porte l'arbre le plus lourd du site
  // (réplique complète du logiciel, classeur Excel, douze cellules de mur) :
  // ce re-rendu intégral, dont RIEN dans le JSX ne dépendait — l'état
  // n'était lu par aucun rendu — coûtait 85 à 93 ms d'une seule image,
  // mesurés PILE à l'armement de la notification (vRaw ≈ 0,27), soit juste
  // avant le dézoom. C'était le vrai « ça accroche » du début de dézoom.
  // Le moteur écrit désormais les deux propriétés lui-même, au même endroit
  // où il posait le setState ; `invitedRef` reste le garde-fou une-seule-fois.

  // La « bascule du fond au noir » qui vivait ici (client 2026-08-03) est
  // retirée avec ExcelReveal (client 2026-08-11 : « supprime la partie avec
  // le texte / fond noir »). Elle ne peignait le blanc→noir de la bande CTA
  // et de [data-hero-bg] que pour préparer un raccord SANS COUTURE avec la
  // section ExcelReveal, alors intégralement noire, juste en dessous. Cette
  // section n'existe plus : la garder aurait fait clignoter un bandeau noir
  // au sommet du viewport juste avant la section « Concrètement, ce qu'Ora
  // peut automatiser », qui est claire. La bande CTA est maintenant blanche
  // en permanence (voir son className plus bas), donc rien à orchestrer.


  // ── La notification fuit légèrement le curseur ────────────────────────────
  // Client 2026-08-03 : « comme les autres petits encadrés, qu'ils soient
  // légèrement en train de bouger, comme s'ils voulaient nous fuir ». Même
  // mécanisme que les pastilles de OraAppScene, y compris le recours à la
  // propriété `translate` plutôt qu'à `transform`, déjà occupée par le
  // flottement : les deux se composent alors sans s'écraser.
  // Une différence assumée : la fuite s'ARRÊTE dès que le curseur est sur la
  // carte. Elle taquine à distance, mais ne se dérobe pas au moment de cliquer.
  useEffect(() => {
    if (demoOn || reduced) return;
    const carte = inviteRef.current?.querySelector<HTMLElement>(".hd-invite");
    if (!carte) return;
    const RAYON = 190, POUSSEE = 16;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = carte.getBoundingClientRect();
      const surLaCarte =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (surLaCarte) { carte.style.translate = ""; return; }
      const dx = r.left + r.width / 2 - e.clientX;
      const dy = r.top + r.height / 2 - e.clientY;
      const d = Math.hypot(dx, dy);
      if (d > RAYON || d < 1) { carte.style.translate = ""; return; }
      const f = (1 - d / RAYON) * POUSSEE;
      carte.style.translate = `${(dx / d) * f}px ${(dy / d) * f}px`;
    };
    const clear = () => { carte.style.translate = ""; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", clear);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", clear);
      clear();
    };
  }, [demoOn, reduced]);

  // Fit the 1040×640 stage inside the box + measure the cursor's click targets.
  useEffect(() => {
    const box = boxRef.current, stage = stageRef.current;
    if (!box || !stage) return;
    const stagePos = (el: HTMLElement) => {
      let x = 0, y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== stage) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };
    // `force` : le chargement des fontes change les métriques du texte (donc
    // la hauteur du titre et les cibles du curseur) sans changer la largeur —
    // ces appels-là doivent traverser le chemin lourd malgré la garde.
    const fit = (force = false) => {
      const s = Math.min(box.clientWidth / W, box.clientHeight / H);
      fitScaleRef.current = s;
      // ── Chemin COURT quand seule la hauteur a bougé ───────────────────────
      // Posé le 2026-08-13 pour tuer le saccadé d'ouverture : le repli du
      // titre (alors DANS la scène) redimensionnait la stagebox à chaque
      // image et le ResizeObserver rejouait TOUT ce fit() — douze cellules du
      // mur réécrites et remesurées, rects de la grille, chaînes offsetLeft
      // des cibles. Le titre est depuis sorti de la scène (même jour), mais
      // la garde RESTE : rien ici ne dépend de la hauteur de la boîte (les
      // cibles vivent dans le repère fixe 1040×640, la géométrie du mur ne
      // dépend que de la largeur du viewport), donc un redimensionnement
      // vertical de fenêtre n'a toujours besoin que de l'échelle ci-dessus.
      const wNow = box.clientWidth;
      if (!force && fitWRef.current !== 0 && Math.abs(wNow - fitWRef.current) < 0.5) {
        applyRef.current(lastVRef.current);
        return;
      }
      fitWRef.current = wNow;
      const next: Record<string, { x: number; y: number }> = { ...targetsRef.current };
      for (const key of Object.keys(next)) {
        const el = stage.querySelector<HTMLElement>(`[data-cur="${key}"]`);
        if (el) {
          const p = stagePos(el);
          next[key] = { x: p.x + el.offsetWidth / 2, y: p.y + el.offsetHeight / 2 };
        }
      }
      targetsRef.current = next;
      // ── Géométrie du mur ──────────────────────────────────────────────────
      // 1. L'échelle des cellules : composées à WALL_SIDE_NAT px, affichées à
      //    la largeur de colonne (WALL_APP_W × viewport), par transform: scale
      //    — JAMAIS par zoom, qui déchirait le mur sous Safari (voir le pavé de
      //    DZ_START). transform ne participant pas à la mise en page, la boîte
      //    de chaque cellule reçoit sa taille VISUELLE (naturelle × échelle),
      //    sans quoi les lignes de la grille se dimensionneraient sur les
      //    hauteurs naturelles. offsetHeight ignore les transforms : relire la
      //    hauteur naturelle reste juste à chaque passage, fit() est
      //    idempotent.
      // 2. Le relevé : centre du trou et dimensions, via les rects — grille et
      //    trou partagent les mêmes transforms d'ancêtres (des translations
      //    seules), la différence de rects y est donc insensible.
      // 3. L'origine de transformation de la grille est posée SUR LE TROU :
      //    l'entrée en scale du dézoom converge alors autour de la réplique,
      //    qui ne bouge pas d'un pixel pendant que le mur se resserre.
      // 4. La course de traversée : ce qu'il reste de grille sous le trou,
      //    moins la demi-fenêtre qui est déjà visible à l'arrivée du dézoom.
      const grid = stickyRef.current?.querySelector<HTMLElement>('[data-hd="wall-grid"]');
      const hole = grid?.querySelector<HTMLElement>('[data-hd="wall-hole"]');
      if (grid && hole) {
        const cellW = WALL_APP_W * window.innerWidth;
        const k = cellW / WALL_SIDE_NAT;
        for (const cell of grid.querySelectorAll<HTMLElement>(".hd-wallcell")) {
          cell.style.width = `${cellW}px`;
          const inner = cell.firstElementChild as HTMLElement | null;
          if (!inner) {
            // Le TROU, taillé sur les proportions de ce qui est RÉELLEMENT
            // peint (OA_ASPECT, la fenêtre) et non sur celles de sa boîte hôte
            // APP_W x APP_H. La boîte est plus haute que la fenêtre : la scène
            // s'y ajuste en largeur et laisse une bande vide sous elle. Le trou
            // héritait de cette bande, la réplique flottait donc dans une
            // cellule trop haute et paraissait plus petite que ses voisines.
            cell.style.height = `${cellW * OA_ASPECT}px`;
            continue;
          }
          inner.style.width = `${WALL_SIDE_NAT}px`;
          inner.style.height = "auto";
          inner.style.transform = `scale(${k})`;
          inner.style.transformOrigin = "top left";
          cell.style.height = `${inner.offsetHeight * k}px`;
        }
        const gr = grid.getBoundingClientRect();
        const hr = hole.getBoundingClientRect();
        const holeCx = hr.left + hr.width / 2 - gr.left;
        const holeCy = hr.top + hr.height / 2 - gr.top;
        grid.style.transformOrigin = `${holeCx}px ${holeCy}px`;
        // La RANGÉE DE QUEUE ne compte pas dans la course (client 2026-08-09) :
        // elle existe précisément pour déborder sous le pli et se faire
        // dissoudre par le fondu du bas. Si sa hauteur entrait dans `travel`,
        // les colonnes latérales remonteraient d'autant plus loin et elle
        // sortirait par le haut : le bas du mur redeviendrait celui d'avant.
        // On retranche donc la plus haute cellule de queue et sa gouttière —
        // `travel` garde ainsi EXACTEMENT la valeur qu'il avait à neuf cellules.
        const tails = [...grid.querySelectorAll<HTMLElement>(".hd-wallcell.tail")];
        const tailBand = tails.length
          ? Math.max(...tails.map((c) => parseFloat(c.style.height) || 0)) + WALL_GAP
          : 0;
        wallGeomRef.current = {
          holeCx,
          holeCy,
          gridW: gr.width,
          gridH: gr.height,
          travel: Math.max(0, gr.height - tailBand - holeCy - window.innerHeight / 2),
        };
      }
      applyRef.current(lastVRef.current);
    };
    // Enveloppe explicite : ResizeObserver passe ses entrées en premier
    // argument, qui serait pris pour `force` et court-circuiterait la garde.
    const ro = new ResizeObserver(() => fit());
    ro.observe(box);
    fit(true);
    (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.then(() => fit(true));
    return () => ro.disconnect();
  }, []);

  // ── Imperative scrub: one subscription writes every element's style. ──
  useEffect(() => {
    const stage = stageRef.current, caps = capsRef.current, hint = hintRef.current, box = boxRef.current;
    if (!stage || !caps || !hint || !box) return;
    const q = (sel: string) => stage.querySelector<HTMLElement>(sel);
    const el = {
      oratabFlash: q('[data-hd="oratab-flash"]'), panel: q('[data-hd="panel"]'),
      appscene: q('[data-hd="appscene"]'),
      // La FENÊTRE peinte, à distinguer de sa boîte hôte : c'est elle que le
      // verrouillage ci-dessous doit caler sur le trou, la boîte étant plus
      // haute qu'elle (voir OA_ASPECT).
      appwin: q('[data-hd="appscene"]')?.querySelector<HTMLElement>(".oa-win") ?? null,
      picker: q('[data-hd="picker"]'), pickveil: q('[data-hd="pickveil"]'),
      pickrow: q('[data-hd="pickrow"]'), openFlash: q('[data-hd="openflash"]'),
      fecFlash: q('[data-hd="fec-flash"]'),
      modal: q('[data-hd="modal"]'),
      runFlash: q('[data-hd="run-flash"]'),
      toggles: [1, 2, 3].map((i) => ({
        track: q(`[data-hd="tg${i}-track"]`), knob: q(`[data-hd="tg${i}-knob"]`),
      })),
      jstatus: q('[data-hd="jstatus"]'), jcount: q('[data-hd="jcount"]'),
      jlines: [...stage.querySelectorAll<HTMLElement>("[data-jline]")],
      excel1: q('[data-hd="excel1"]'), excel2: q('[data-hd="excel2"]'),
      loading: q('[data-hd="loading"]'),
      loadsteps: [...stage.querySelectorAll<HTMLElement>("[data-loadstep]")],
      xwglow: q('[data-hd="xwglow"]'),
      sheets: [...stage.querySelectorAll<HTMLElement>("[data-sheet]")],
      xtabs: [...stage.querySelectorAll<HTMLElement>("[data-xtab]")],
      pill: q('[data-hd="pill"]'),
      cursor: q('[data-hd="cursor"]'), ripple: q('[data-hd="ripple"]'),
      caps: [...caps.querySelectorAll<HTMLElement>(".hd-cap")],
      cuefill: hint.querySelector<HTMLElement>('[data-hd="cuefill"]'),
      invite: stickyRef.current?.querySelector<HTMLElement>('[data-hd="invite"]') ?? null,
      // La grille du mur vit dans le STICKY, pas dans la scène : elle ne doit
      // pas hériter de la mise à l'échelle de .hd-stage, le moteur lui écrit
      // sa propre géométrie en repère écran.
      wallGrid: stickyRef.current?.querySelector<HTMLElement>('[data-hd="wall-grid"]') ?? null,
      wallCells: [...(stickyRef.current?.querySelectorAll<HTMLElement>(".hd-wallcell") ?? [])],
      wallHole: stickyRef.current?.querySelector<HTMLElement>('[data-hd="wall-hole"]') ?? null,
    };
    // Colonne de chaque cellule, relevée UNE FOIS sur son `data-col`. Le
    // contre-défilement la déduisait de l'index (i % 3), ce qui n'est vrai que
    // pour une grille remplie en ordre de lecture : la rangée de queue est
    // placée explicitement en colonnes 1 et 3, et sa seconde cellule aurait été
    // prise pour la colonne centrale — elle serait descendue au lieu de monter.
    const wallCols = el.wallCells.map((c) => Number(c.dataset.col ?? 0));
    // Every click moment (progress time + target key) — drives the cursor
    // dip, the ripple pulse and the vibration feedback.
    /** Hauteur de la notification, mesurée une seule fois. */
    let inviteH = 0;
    /** Correction du verrouillage trou↔réplique (voir le pavé « VERROUILLAGE
     *  PAR RÉTROACTION » plus bas). PERSISTANTE d'une image à l'autre : le
     *  résidu est mesuré en DÉBUT d'image sur une mise en page déjà propre,
     *  puis intégré ici — au lieu de l'ancien cycle écrire→mesurer→réécrire
     *  qui forçait une mise en page synchrone à chaque image du dézoom. */
    const wallFix = { x: 0, y: 0, armed: false };

    const CLICKS: { t: number; k: string }[] = [
      // Ouverture : clic sur « Ouvrir un fichier », puis sélection du classeur
      // dans le sélecteur, puis le récit d'automatisation.
      { t: 0.165, k: "openfile" }, { t: 0.27, k: "pickrow" },
      { t: 0.578, k: "lancerfec" },
      { t: 0.641, k: "tg1" }, { t: 0.658, k: "tg2" }, { t: 0.675, k: "tg3" },
      { t: 0.70, k: "run" }, { t: 0.935, k: "tab2" }, { t: 0.962, k: "tab3" },
    ];
    // Cibles posées sur un fond BLEU (grande carte d'ouverture et boutons
    // d'action) : l'onde de clic y passe en blanc. Les autres tombent sur des
    // surfaces claires et gardent l'onde bleue de la marque.
    const ON_BLUE = new Set(["openfile", "lancerfec", "run"]);

    const apply = (vIn: number) => {
      const lance = demoOnRef.current;
      const vRaw = vIn;
      lastVRef.current = vRaw;
      // Heavy-scroll remap: raw scroll (linear) → demo time (weighted zones).
      // Démo NON lancée : le temps de récit est FIGÉ à V_INTRO — l'état
      // « réplique en pleine vue », constant. L'intro n'est plus scrollée
      // (client 2026-08-13, « c'est nous qui allons vers la réplication ») :
      // le titre défile en flux normal au-dessus du cadenceur, et la course
      // d'épinglage ne porte plus que battement, dézoom et traversée, tous
      // pilotés par vRaw plus bas. Le récit, lui, ne démarre jamais sans
      // invitation.
      const v = lance ? remap(vRaw) : V_INTRO;
      const T = targetsRef.current;
      // The stage slightly grows and the title-to-demo gap opens with scroll.
      // Intro boost (client 2026-07-28) : au repos, le classeur Excel est
      // affiché ~15 % plus grand pour que ses textes soient lisibles ; le
      // surplus se résorbe AVANT le premier plongeon caméra (v=0.155), donc
      // toute l'animation scrollée garde exactement ses tailles d'avant.
      // Layout d'ouverture façon monday.com (client 2026-07-28) : au repos le
      // logiciel est affiché quasi pleine largeur, posé BAS — on n'en voit que
      // le haut.
      // Les segments v 0-0,115 (fondu du titre, repli de son espace) ont
      // DISPARU le 2026-08-13 avec la sortie du titre hors de la scène : hors
      // démo v est figé à V_INTRO, et en démo ces jalons du récit passent
      // sans rien piloter de visible. `grow` reste : hors démo il vaut une
      // constante (léger surplus de lisibilité au repos), en démo il se
      // résorbe au fil du récit comme avant.
      const grow = 1 + 0.04 * seg(v, 0, 0.30);
      // Passage de relais logiciel → Excel. Déclaré ici car la mise à
      // l'échelle de la scène (plus bas) en dépend : au repos la réplique du
      // logiciel est agrandie, puis on revient au cadrage du récit.
      const handoff = ease(seg(v, 0.30, 0.38));
      // Zoom 0 supprimé : il plongeait sur le clic de l'onglet Ora, geste
      // retiré de l'ouverture (vue double d'emblée, client 2026-07-28).
      // Camera zooms. Zoom 1 (×2.0): the FEC Studio moment — « Lancer » click
      // then the toggle run, focus FIXED on the modal centre (no side swing).
      // Zoom 2 (×1.32): the RESULT — engages as the audit workbook lands and
      // stays on for the sheet browsing, framed on the sheet + its tabs (the
      // ribbon may crop, the content is the star). Windows are disjoint.
      const Z1 = 2.0, Z2 = 1.2;
      const zt1 = seg(v, 0.545, 0.575) * (1 - seg(v, 0.70, 0.74));
      // Success-recap zoom: dive on the popup as the green check lands and the
      // list of what was built appears; release before the result close-up.
      const ztS = seg(v, 0.803, 0.825) * (1 - seg(v, 0.838, 0.858));
      const zt2 = seg(v, 0.86, 0.895);
      const rc = T.result ?? { x: 326, y: 320 };
      const cams = [
        { t: zt1, z: Z1, f: T.modalc ?? { x: 520, y: 320 } },
        { t: ztS, z: 1.6, f: T.loadc ?? { x: 856, y: 330 } },
        // Centre the RESULT on the whole Excel+panel pair (stage centre x=520),
        // not on the Excel window alone (x≈326) — otherwise the pair sits off
        // to the right. Keep the measured vertical centre.
        { t: zt2, z: Z2, f: { x: 520, y: rc.y } },
      ];
      const cam = cams.reduce((a, b) => (b.t > a.t ? b : a));
      const zt = cam.t, Z = cam.z;
      // Result close-up: centred EXACTLY on the workbook (dead centre of the
      // viewport), zoom sized so the whole window incl. sheet tabs stays in
      // frame.
      const focus = cam.f;
      const zoom = 1 + (Z - 1) * zt;
      // ── Taille de la réplique du logiciel au repos ──
      // Elle est pilotée par la LARGEUR (client 2026-07-29 : « ~65 % de la
      // largeur d'écran », référence monday.com). Auparavant la scène se calait
      // sur la HAUTEUR disponible : sur un grand écran large et court, il
      // restait peu de hauteur sous le titre, donc tout rétrécissait et la
      // fenêtre paraissait minuscule. On vise donc directement la largeur de
      // la fenêtre applicative (APP_W dans le repère de la scène), et on
      // revient à l'échelle du récit au fur et à mesure du passage de relais.
      const boxR = box.getBoundingClientRect();
      // ── Résidu du verrouillage, lu en DÉBUT d'image ───────────────────────
      // La mise en page reflète ici les écritures de l'image PRÉCÉDENTE, déjà
      // digérées par le navigateur : ces deux lectures ne déclenchent donc
      // aucun recalcul forcé, contrairement à l'ancienne mesure faite juste
      // après les écritures. La correction converge en une image ou deux (le
      // décalage qu'elle rattrape est quasi constant : hauteurs de cellules,
      // polices), pendant que la grille est encore à peine visible.
      if (wallFix.armed) {
        const arP = (el.appwin ?? el.appscene)?.getBoundingClientRect();
        const hrP = el.wallHole?.getBoundingClientRect();
        if (arP && hrP) {
          wallFix.x += arP.left + arP.width / 2 - (hrP.left + hrP.width / 2);
          wallFix.y += arP.top + arP.height / 2 - (hrP.top + hrP.height / 2);
        }
      }
      const fitS = fitScaleRef.current || 1;
      const restTarget = (0.72 * box.clientWidth) / APP_W;
      // Jamais plus petit que le cadrage normal, et plafonné pour qu'un écran
      // très large et très court ne parte pas dans un zoom absurde.
      // Le plafond MORD sur la plupart des écrans (au repos, le titre occupe
      // presque toute la hauteur, donc `fitS` est minuscule et le rapport
      // explose) : c'est LUI, et non le 0,72 ci-dessus, qui fixe la taille de
      // la réplique à l'ouverture. Relevé de 3 à 3,45 puis à 4,05 (client
      // 2026-07-29 : « légèrement plus grande », puis « encore un peu »).
      const restK = Math.min(4.05, Math.max(1, restTarget / fitS));
      const rest = 1 - handoff;
      const S = fitS * grow * zoom * (1 + (restK - 1) * rest);
      // Centre the focus in the VIEWPORT (not just the stage box): compensate
      // the vertical offset between the stage box centre and the screen centre.
      // La bande des légendes est RÉSERVÉE (client 2026-07-30) : en visant le
      // milieu du plein écran, la scène agrandie descendait forcément sur
      // « Explorez votre classeur, feuille par feuille » et la phrase se
      // retrouvait par-dessus le bas de la fenêtre Excel. On vise donc le
      // milieu de l'espace RESTANT au-dessus des légendes.
      let centerDelta = 0;
      if (window.innerHeight > 0) {
        const capsTop = caps.getBoundingClientRect().top;
        const freeBottom = capsTop > 0 ? capsTop : window.innerHeight;
        centerDelta = boxR.top + boxR.height / 2 - freeBottom / 2;
      }
      const dx = (520 - focus.x) * zt;
      const dy = ((320 - focus.y) - centerDelta / S) * zt;
      // Au repos, la fenêtre agrandie est posée BAS : son bord haut se cale
      // juste sous le bloc titre et le bas déborde sous le pli (rogné par
      // l'overflow du sticky), exactement comme le visuel de monday.com.
      let dyRest = 0;
      if (rest > 0 && S > 0) {
        const appTopScreen = boxR.top + boxR.height / 2 + (APP_TOP - H / 2) * S;
        dyRest = ((boxR.top + 8 - appTopScreen) / S) * rest;
      }
      // ── LE DÉZOOM VERS LE MUR (2026-08-08, voir le pavé de DZ_START) ──────
      // Pendant le dézoom, `v` est plafonné à V_INTRO : S, dx et dyRest sont
      // donc CONSTANTS, et le dézoom n'a qu'à interpoler par-dessus. Trois
      // gestes, tous portés par la même progression :
      //   · l'échelle glisse de sa valeur de repos vers celle du mur — la
      //     cible est exprimée en largeur de fenêtre applicative à l'écran,
      //     donc stable quelle que soit la taille du viewport ;
      //   · dyRest s'efface : posée basse au repos, la réplique remonte se
      //     CENTRER, position de cellule du mur ;
      //   · sur les derniers 30 vh, toute la rangée dérive vers le haut — la
      //     dérive est exprimée en pixels ÉCRAN puis reconvertie dans le
      //     repère de la scène (division par l'échelle), sans quoi elle
      //     rétrécirait avec la réplique.
      // `lance` coupe tout : démo lancée, remap() possède la course entière.
      const dz = lance ? 0 : ease(seg(vRaw, DZ_START, DZ_END));
      let S2 = S;
      let dyR = dyRest;
      /** Descente de la colonne CENTRALE (et donc de la réplique vivante, qui
       *  en est une cellule) pendant le contre-défilement, en pixels écran. */
      let driftPx = 0;
      /** Remontée des colonnes LATÉRALES, en pixels écran (valeur négative). */
      let sidePx = 0;
      if (dz > 0) {
        const SWall = (WALL_APP_W * window.innerWidth) / APP_W;
        S2 = S + (SWall - S) * dz;
        dyR = dyRest * (1 - dz);
        // ── Le contre-défilement (voir le pavé de TRAV_START) ───────────────
        // q² : dérivée nulle au départ (aucune couture avec le dézoom en
        // cours), pleine vitesse à l'arrivée (le défilement de page prend un
        // relais vivant à la libération). Les courses sont MESURÉES : celle
        // des latérales part de la hauteur de grille sous le trou (fit), la
        // centrale descend d'un peu plus de la moitié — bornée pour que la
        // réplique reste dans le cadre jusqu'à la libération.
        const q = seg(vRaw, TRAV_START, 1);
        const trav = q * q;
        const vhNow = window.innerHeight;
        const sideRun = (wallGeomRef.current?.travel ?? 0.3 * vhNow) + 0.15 * vhNow;
        const midRun = Math.min(0.6 * sideRun, 0.3 * vhNow);
        driftPx = trav * midRun;
        sidePx = -trav * sideRun;
      }
      // Les pastilles flottantes s'effacent dès que le dézoom s'engage (voir la
      // règle .walling) ; classList.toggle est sans coût quand rien ne change.
      stickyRef.current?.classList.toggle("walling", dz > 0.1);
      // Le survol des cartes ne s'ouvre qu'une fois le contre-défilement
      // terminé : jusque-là le mur glisse encore et la cible se déroberait
      // sous le curseur. Voir la règle .hd-wallgrid.hot.
      const wallHot = !lance && vRaw > 0.985;
      el.wallGrid?.classList.toggle("hot", wallHot);
      stickyRef.current?.classList.toggle("wallhot", wallHot);
      stage.style.transform = `translate(-50%, -50%) scale(${S2}) translate(${dx}px, ${dy + dyR + driftPx / S2}px)`;

      // ── La grille du mur ──────────────────────────────────────────────────
      // Pilotée dans le repère ÉCRAN, ancrée au centre du sticky (et non du
      // viewport : après la libération de l'épinglage le sticky remonte avec la
      // page, et le mur doit remonter avec lui, d'un bloc). Le principe tient
      // en une phrase : le TROU de la grille est amené exactement sous la
      // réplique vivante — même centre, même taille — et c'est donc la grille
      // qui vient au logiciel, jamais l'inverse.
      if (el.wallGrid) {
        if (dz <= 0.001) {
          el.wallGrid.style.opacity = "0";
          // Grille éteinte : la correction repart de zéro. Elle reconvergera
          // en une ou deux images au prochain dézoom — pendant que la grille
          // est encore quasi invisible — et on ne rejoue jamais une correction
          // datant d'une géométrie d'avant (redimensionnement, polices).
          wallFix.x = 0;
          wallFix.y = 0;
          wallFix.armed = false;
        } else {
          const g = wallGeomRef.current;
          const stickyR = stickyRef.current?.getBoundingClientRect();
          const ancX = stickyR ? stickyR.left + stickyR.width / 2 : window.innerWidth / 2;
          const ancY = stickyR ? stickyR.top + stickyR.height / 2 : window.innerHeight / 2;
          const cxScene = boxR.left + boxR.width / 2;
          const cyScene = boxR.top + boxR.height / 2;
          if (g) {
            // ── Le contre-défilement, colonne par colonne, ÉCRIT D'ABORD ───
            // La colonne vient de `wallCols`, relevée sur les `data-col` au
            // montage (et non de l'index, voir le commentaire là-bas). La
            // centrale (et le trou avec elle) descend de driftPx — la même
            // valeur que la scène, donc la réplique et sa colonne bougent d'un
            // seul tenant — pendant que les latérales remontent de sidePx. Le
            // cadre de la grille, lui, reste fixe.
            el.wallCells.forEach((cell, i) => {
              cell.style.transform = `translateY(${wallCols[i] === 1 ? driftPx : sidePx}px)`;
            });
            // Cible du cadre : la position DE REPOS de la fenêtre applicative
            // (sans le contre-défilement — la cellule-trou le porte déjà).
            const tx = cxScene - ancX - (g.holeCx - g.gridW / 2);
            const ty = cyScene + (2 + dy + dyR) * S2 - ancY - (g.holeCy - g.gridH / 2);
            // La CONVERGENCE est un simple scale : l'origine de transformation
            // est posée sur le TROU (voir fit), donc la réplique ne bouge pas
            // d'un pixel pendant que les huit voisines se resserrent vers
            // elle. ADOUCI le 2026-08-08 au soir (« rends l'animation plus
            // smooth ») : 1,05 au lieu de 1,07, et le fondu étalé sur presque
            // tout le dézoom (0,05 → 0,85) au lieu d'un allumage pressé.
            const sIn = 1 + 0.05 * (1 - dz);
            // ── VERROUILLAGE PAR RÉTROACTION, à cheval sur deux images ─────
            // La chaîne analytique ci-dessus accumule les à-peu-près de toute
            // la pile de transforms (un décalage constant de 6 à 14 px selon
            // la fenêtre a été mesuré, dont l'origine variait avec la hauteur
            // des cellules chargée tardivement — polices, logos). Plutôt que
            // de courir après chaque terme : on écrit AVEC la correction
            // courante, et le résidu encore visible est mesuré au début de
            // l'image SUIVANTE (voir wallFix, en tête d'apply) puis intégré.
            // Même exactitude par construction — le résidu tend vers zéro —
            // mais plus aucune lecture après écriture : l'ancienne version
            // mesurait juste après avoir écrit, ce qui forçait le navigateur à
            // refaire la mise en page à CHAQUE image du dézoom, en plein
            // milieu du geste (retouché le 2026-08-10, « comme dans du
            // beurre »).
            el.wallGrid.style.opacity = String(seg(dz, 0.05, 0.85));
            el.wallGrid.style.transform =
              `translate(-50%,-50%) translate(${tx + wallFix.x}px, ${ty + wallFix.y}px) scale(${sIn})`;
            wallFix.armed = true;
          }
        }
      }

      // ── Notification d'invitation ────────────────────────────────────────
      // Elle est ancrée au coin HAUT-DROIT de la réplique, dans le repère de la
      // scène, donc elle suit la fenêtre du logiciel quand celle-ci monte et
      // grandit. La scène étant posée en `left:50% top:50%` puis
      // `translate(-50%,-50%) scale(S) translate(dx,dy)`, un point (sx, sy) du
      // repère tombe à l'écran en centre_de_la_boite + (point - centre_de_la_scene
      // + décalage) * S.
      // Sa TAILLE, en revanche, ne suit pas l'échelle : c'est un élément
      // cliquable, il doit rester lisible et d'une taille constante.
      if (el.invite) {
        const cx = boxR.left + boxR.width / 2;
        const cy = boxR.top + boxR.height / 2;
        // S2/dyR et non S/dyRest : l'ancre suit la position RÉELLE à l'écran,
        // dézoom compris, pour que la carte ne dérive pas pendant son fondu.
        const ax = cx + (APP_LEFT + APP_W - 520 + dx) * S2;
        const ay = cy + (APP_TOP - 320 + dy + dyR) * S2;
        // Hauteur lue UNE fois, pas à chaque image.
        if (!inviteH) inviteH = el.invite.offsetHeight;
        // L'ancre est en translate(-100%,-100%) : `top` est donc le BAS de la
        // carte. On le borne pour qu'elle ne passe jamais sous la barre de
        // navigation fixe (68 px) : à la fin de l'intro la réplique remonte très
        // haut, et une carte de 200 px posée au-dessus de son bord sortirait de
        // l'écran par le haut.
        const basMin = 68 + 16 + inviteH;
        el.invite.style.left = `${Math.round(ax)}px`;
        el.invite.style.top = `${Math.round(Math.max(basMin, ay - 14))}px`;
        // Visible seulement une fois l'intro jouée, et jamais si la démo tourne.
        // 0,92 : le temps de démo vaut alors V_INTRO x 0,92 = 0,115, soit la fin
        // exacte du repli du titre, donc l'instant où la réplique achève sa montée
        // et où on la voit ENTIÈRE. C'est l'endroit désigné par le client sur sa
        // capture, et c'est là que le scroll se bloque.
        //
        // BORNE HAUTE SUPPRIMÉE (client 2026-08-03 : « le bouton s'allume un peu
        // puis repart »). La fenêtre allait de 0,92 à 0,999, soit à peine 40 px de
        // scroll : l'inertie de Lenis la traversait avant même que le blocage
        // n'ait pris effet, donc le moteur remettait l'opacité à zéro dans la
        // foulée. D'où l'allumage suivi de l'extinction.
        // Elle n'a plus d'utilité depuis que l'ancre est en `absolute` dans le
        // bloc épinglé : la notification s'en va avec le hero, elle ne peut plus
        // fuir sur le reste du site. Reste le garde-fou géométrique, et
        // l'effacement volontaire à la libération du blocage.
        const sceneVisible = boxR.bottom > 0 && boxR.top < window.innerHeight;
        // Le seuil suit désormais la fin de l'intro, donc l'entrée dans le palier :
        // la notification apparaît à l'instant précis où la réplique achève sa
        // montée et où on la voit entière, l'endroit désigné par le client sur sa
        // capture. Une marge de 0,02 avant, pour qu'un défilement rapide ne puisse
        // pas enjamber le seuil sans l'armer.
        // BORNE HAUTE RÉTABLIE avec le mur (2026-08-08), pour une autre raison
        // que celle qui l'avait fait retirer : la fenêtre de l'invitation est
        // désormais le BATTEMENT (11 vh), et passé DZ_START la réplique
        // rétrécit vers le mur — une carte d'invitation collée à une fenêtre en
        // plein dézoom se lirait comme un débris. Elle s'éteint donc au seuil,
        // et se rallume si l'on remonte : la fenêtre est symétrique.
        // Fenêtre d'invitation : de l'approche (vRaw reste à 0 tant que la
        // scène n'est pas épinglée) jusqu'à l'entrée du dézoom. Plus de borne
        // basse : l'intro scrollée qui la justifiait a disparu, la réplique
        // est invitable dès qu'elle est en vue.
        const montre = !lance && vRaw < DZ_START + 0.02 && sceneVisible;
        // Le moteur possède l'opacité DANS LES DEUX SENS depuis le 2026-08-13.
        // L'ancien schéma (« le moteur n'éteint que hors zone, l'allumage est
        // armé une seule fois ») datait du temps où un effet React possédait
        // l'allumage ; devenu impératif, il laissait un trou : ressortir de la
        // fenêtre puis y REVENIR laissait la notification éteinte pour
        // toujours. Étroite et en milieu de course, la fenêtre cachait ce
        // trou ; couvrant désormais l'approche entière, elle l'exposait au
        // premier aller-retour de molette.
        // Le garde-fou une-seule-fois ne pose plus que la TRANSITION, avant la
        // première écriture d'opacité pour que l'allumage initial fonde aussi.
        if (montre && !invitedRef.current) {
          invitedRef.current = true;
          el.invite.style.transition = "opacity 340ms ease";
        }
        el.invite.style.opacity = montre ? "1" : "0";
        el.invite.style.pointerEvents = montre ? "auto" : "none";
      }
      // Base ramenée de 14 à 2 px le 2026-08-13, même chasse au vide : hors
      // démo `v` est figé, ce terme vaut donc une constante qui s'ajoutait au
      // retrait du bloc épinglé. La part variable ne bouge pas, elle sert au
      // récit.
      box.style.marginTop = `${2 + 26 * seg(v, 0, 0.30)}px`;
      // End-of-demo hand-off: fade the whole scene to pure black over the last
      // stretch of scroll (the software stays visible, just darkened) so it
      // flows seamlessly into the always-black text-reveal section below.
      // ONE clean light→black passage only: the demo stays LIGHT through all
      // the zoom moments (no repeated dark flashes).
      // Assombrissement final : réservé au récit complet. Démo non lancée, le
      // temps est plafonné à V_INTRO, donc ce segment vaut zéro et la scène reste
      // blanche de bout en bout. C'est le choix du client (2026-08-03) : le noir
      // n'arrive qu'APRÈS le bouton de clôture, et la coupure du rond par le bord
      // bas de la scène est assumée.
      const endDark = seg(v, 0.92, 0.99);
      const immersive = endDark > 0.12;
      const sticky = stickyRef.current;
      if (sticky) {
        sticky.classList.toggle("immersive", immersive);
        sticky.classList.toggle("endblack", endDark > 0.5);
      }
      const section = sticky ? sticky.closest("section") : null;
      if (section) {
        if (immersive) section.setAttribute("data-nav-dark", "");
        else section.removeAttribute("data-nav-dark");
      }
      // LE TITRE N'EST PLUS PILOTÉ ICI (client 2026-08-13). Il vit en flux
      // normal AU-DESSUS du cadenceur et sort par le haut en défilant — le
      // moteur n'écrit plus ni son opacité, ni sa hauteur, ni son transform.
      // C'était la double peine du saccadé d'ouverture : une écriture de
      // hauteur par image (reflow), qui redimensionnait la stagebox, dont le
      // ResizeObserver rejouait fit(). headlineRef ne sert plus qu'à
      // l'animation d'entrée Framer du JSX.

      // 1 · OUVERTURE EN VUE DOUBLE (client 2026-07-28) : le classeur et le
      //     panneau Ora sont côte à côte DÈS LA PREMIÈRE IMAGE. On voit le
      //     produit tout de suite (Excel = le repère, Ora = le logiciel) au
      //     lieu d'un tableur immobile sur lequel il fallait cliquer un onglet
      //     que personne ne connaît. Le clic sur l'onglet et le plongeon
      //     caméra qui l'accompagnait ont été retirés.
      if (el.oratabFlash) el.oratabFlash.style.opacity = "0";
      // PASSAGE DE RELAIS (client 2026-07-29) : la scène s'ouvre sur
      // l'INTERFACE DU LOGICIEL Ora, puis celle-ci s'efface et cède la place
      // au duo Excel + panneau qui porte tout le récit d'automatisation
      // (FEC Studio, bascules, résultat) — exactement comme avant.
      // Le relais (déclaré plus haut) n'a lieu qu'APRÈS le geste complet :
      // clic sur « Ouvrir un fichier », sélecteur, choix du classeur. Sans
      // cette scène, le passage du logiciel à Excel n'avait aucun sens
      // (client 2026-07-29).
      // Voile sombre + sélecteur de fichier par-dessus l'interface
      // La carte bleue s'illumine sous le clic, PUIS le sélecteur monte : les
      // deux gestes sont séparés dans le temps, on comprend la cause et l'effet.
      if (el.openFlash) {
        el.openFlash.style.opacity = String(seg(v, 0.160, 0.170) * (1 - seg(v, 0.170, 0.215)));
      }
      // Ouverture ADOUCIE et étalée : le sélecteur monte de 14 px en grandissant
      // au lieu d'apparaître d'un bloc (client 2026-07-29).
      const pickIn = ease(seg(v, 0.172, 0.222));
      const pick = pickIn * (1 - ease(seg(v, 0.285, 0.325)));
      if (el.picker) {
        el.picker.style.opacity = String(pick);
        el.picker.style.transform =
          `translate(-50%,-50%) translateY(${14 * (1 - pickIn)}px) scale(${0.93 + 0.07 * pick})`;
      }
      if (el.pickveil) el.pickveil.style.opacity = String(pick * 0.55);
      // La ligne choisie s'allume au SURVOL du curseur, puis se verrouille au clic
      if (el.pickrow) {
        el.pickrow.style.background =
          pick > 0 && v >= 0.268 ? "#dbe7ff" : pick > 0 && v >= 0.245 ? "#f2f5fb" : "transparent";
      }
      if (el.appscene) {
        el.appscene.style.opacity = String(1 - handoff);
        el.appscene.style.transform = `scale(${1 - 0.06 * handoff})`;
        el.appscene.style.pointerEvents = "none";
      }
      if (el.panel) {
        el.panel.style.opacity = String(handoff);
        el.panel.style.transform = `translateX(${26 * (1 - handoff)}px)`;
      }
      if (el.excel1) {
        el.excel1.style.opacity = String(handoff * (1 - seg(v, 0.78, 0.83)));
        // -194px = la place de gauche de la vue double, tenue d'emblée.
        el.excel1.style.transform = `translateX(${-194 - 26 * (1 - handoff) - 80 * seg(v, 0.78, 0.83)}px)`;
      }
      // 3 · FEC Studio modal (snappy open, rapid-fire toggles, quick close)
      if (el.fecFlash) el.fecFlash.style.opacity = String(seg(v, 0.568, 0.583) * (1 - seg(v, 0.583, 0.63)));
      const modalIn = seg(v, 0.585, 0.61) * (1 - seg(v, 0.705, 0.73));
      if (el.modal) {
        el.modal.style.opacity = String(modalIn);
        el.modal.style.transform = `scale(${0.96 + 0.04 * seg(v, 0.585, 0.61)})`;
      }
      // toggles flip in rapid succession under the cursor — exactly ON the
      // click beat (same instant as the cursor dip + ripple, no lag)
      const tgAt = [0.641, 0.658, 0.675];
      el.toggles.forEach((tg, i) => {
        const on = seg(v, tgAt[i], tgAt[i] + 0.008);
        if (tg.track) tg.track.style.opacity = String(on);
        if (tg.knob) tg.knob.style.transform = `translateX(${12 * on}px)`;
      });
      if (el.runFlash) el.runFlash.style.opacity = String(seg(v, 0.695, 0.71) * (1 - seg(v, 0.71, 0.755)));
      // 4 · JOURNAL run
      if (el.jstatus) {
        const next = v < 0.71 ? "Prêt." : v < 0.82 ? "En cours…" : "Terminé";
        if (el.jstatus.textContent !== next) el.jstatus.textContent = next;
      }
      if (el.jcount) {
        const n = String(Math.round(5 * seg(v, 0.715, 0.81)));
        if (el.jcount.textContent !== n) el.jcount.textContent = n;
      }
      el.jlines.forEach((l) => {
        const i = Number(l.dataset.jline);
        const o = seg(v, 0.715 + i * 0.018, 0.733 + i * 0.018);
        l.style.opacity = String(o);
        l.style.transform = `translateY(${4 * (1 - o)}px)`;
      });
      // 5 · loading beat: FEC Studio runs 4 steps (Préparation → Récupération →
      //     Exécution → Enregistrement) that fill one after another, each dot
      //     turning into a check when its bar completes; then the audit
      //     workbook lands.
      const loadIn = seg(v, 0.73, 0.755) * (1 - seg(v, 0.85, 0.88));
      if (el.loading) {
        el.loading.style.opacity = String(loadIn);
        el.loading.style.transform = `scale(${0.95 + 0.05 * seg(v, 0.73, 0.755)})`;
      }
      const lp = seg(v, 0.755, 0.82); // 0→1 across the 4 steps
      const nSteps = el.loadsteps.length || 4;
      el.loadsteps.forEach((step, i) => {
        const sp = Math.min(1, Math.max(0, (lp - i / nSteps) / (1 / nSteps)));
        const done = sp >= 0.999;
        const running = sp > 0 && !done;
        const fill = step.querySelector<HTMLElement>(".barfill");
        const ck = step.querySelector<HTMLElement>(".ck");
        const dt = step.querySelector<HTMLElement>(".dt");
        const lbl = step.querySelector<HTMLElement>(".lbl");
        if (fill) fill.style.transform = `scaleX(${sp})`;
        if (ck) ck.style.opacity = done ? "1" : "0";
        if (dt) dt.style.opacity = done ? "0" : running ? "1" : "0.35";
        if (lbl) lbl.style.color = done || running ? "#111827" : "#9ca3af";
      });
      // Punchy arrival: quick fade + ease-out rise-and-scale + a glow pulse.
      const wp = seg(v, 0.85, 0.90);
      const we = 1 - (1 - wp) * (1 - wp);
      if (el.excel2) {
        el.excel2.style.opacity = String(Math.min(1, wp * 1.8));
        el.excel2.style.transform = `translateY(${34 * (1 - we)}px) scale(${0.94 + 0.06 * we})`;
      }
      if (el.xwglow) el.xwglow.style.opacity = String(seg(v, 0.895, 0.915) * (1 - seg(v, 0.915, 0.96)));
      const sheetIdx = v < 0.94 ? 0 : v < 0.972 ? 1 : 2;
      el.sheets.forEach((s) => { s.classList.toggle("hd-hidden", Number(s.dataset.sheet) !== sheetIdx); });
      el.xtabs.forEach((tab) => { tab.classList.toggle("on", Number(tab.dataset.xtab) === sheetIdx); });
      if (el.pill) {
        const pp = seg(v, 0.89, 0.93);
        const pe = 1 - (1 - pp) * (1 - pp);
        el.pill.style.opacity = String(pp);
        el.pill.style.transform = `scale(${0.85 + 0.15 * pe})`;
      }
      // Cursor: measured targets; tip lands on them.
      if (el.cursor) {
        const TIP_X = 14.6, TIP_Y = 6.5;
        const tx = (k: string) => T[k].x - TIP_X;
        const ty = (k: string) => T[k].y - TIP_Y;
        // ── OUVERTURE : le trajet de la souris est le récit ──
        // Il est calculé À PART (et non par `kf`) pour être ADOUCI : le curseur
        // part du bas de la fenêtre du logiciel, remonte en diagonale vers la
        // carte « Ouvrir un fichier », clique, puis redescend sur le classeur
        // du sélecteur. Départ et arrivée progressifs (`ease`), donc on le voit
        // vraiment se déplacer au fur et à mesure du scroll — avant, tout le
        // trajet tenait dans quelques pixels de scroll et il se téléportait.
        let x: number, y: number;
        if (v < 0.42) {
          const a = REST_CUR, b = T.openfile, c = T.pickrow;
          const p1 = ease(seg(v, 0.095, 0.162)); // repos → « Ouvrir un fichier »
          const p2 = ease(seg(v, 0.228, 0.268)); // → la ligne du classeur
          const mx = a.x + (b.x - a.x) * p1, my = a.y + (b.y - a.y) * p1;
          x = mx + (c.x - mx) * p2 - TIP_X;
          y = my + (c.y - my) * p2 - TIP_Y;
        } else {
          const times = [0.42, 0.565, 0.60, 0.638, 0.655, 0.672, 0.695, 0.735, 0.91, 0.935, 0.962, 1];
          const keys = ["pickrow", "lancerfec", "lancerfec", "tg1", "tg2", "tg3", "run", "run", "tab2", "tab2", "tab3", "tab3"];
          x = kf(v, times, keys.map(tx));
          y = kf(v, times, keys.map(ty));
        }
        const cs = kf(
          v,
          [0, 0.157, 0.165, 0.173, 0.262, 0.27, 0.278, 0.570, 0.578, 0.586, 0.633, 0.641, 0.649, 0.650, 0.658, 0.666, 0.667, 0.675, 0.683, 0.692, 0.70, 0.708, 0.927, 0.935, 0.943, 0.954, 0.962, 0.970, 1],
          [1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 0.82, 1, 1, 1]
        );
        el.cursor.style.transform = `translate(${x}px, ${y}px) scale(${cs})`;
        // Pas de curseur simulé avant le lancement : un curseur figé au milieu
        // de la scène n'aurait aucun sens.
        el.cursor.style.opacity = lance ? "1" : "0";
      }
      // Click feedback: a ripple pulse at the click point + a short vibration
      // where the platform supports it (mobile; desktops ignore silently).
      if (el.ripple) {
        // Short + eased-out pulse: expands fast then dies, so it reads as a
        // snappy tap instead of a slow drifting ring.
        const active = CLICKS.find((c) => v >= c.t && v <= c.t + 0.014);
        if (active && T[active.k]) {
          const p = (v - active.t) / 0.014;
          const pe = 1 - (1 - p) * (1 - p);
          el.ripple.style.left = `${T[active.k].x}px`;
          el.ripple.style.top = `${T[active.k].y}px`;
          el.ripple.style.transform = `scale(${0.35 + 0.95 * pe})`;
          el.ripple.style.opacity = String((1 - pe) * 0.75);
          // L'onde s'accorde au fond qu'elle touche (client 2026-08-01) : une
          // onde bleue sur un bouton bleu ne se lisait pas, elle formait une
          // tache pâle. Blanche sur les surfaces bleues, bleue sur les
          // surfaces claires.
          const onBlue = ON_BLUE.has(active.k);
          el.ripple.style.borderColor = onBlue ? "rgba(255,255,255,.92)" : "#3b82f6";
          el.ripple.style.background = onBlue ? "rgba(255,255,255,.26)" : "rgba(59,130,246,.18)";
        } else {
          el.ripple.style.opacity = "0";
        }
      }
      let clickIdx = -1;
      for (let i = 0; i < CLICKS.length; i++) if (v >= CLICKS[i].t) clickIdx = i;
      if (clickIdx > lastClickRef.current && clickIdx >= 0 && v - CLICKS[clickIdx].t < 0.06) {
        try { (navigator as { vibrate?: (ms: number) => void }).vibrate?.(10); } catch { /* unsupported */ }
      }
      lastClickRef.current = clickIdx;
      // Captions
      const capOp = [
        // La première légende ne parle que du duo Excel + Ora : elle attend
        // donc que le passage de relais depuis l'interface soit fait.
        handoff * (1 - seg(v, 0.50, 0.55)),
        seg(v, 0.55, 0.60) * (1 - seg(v, 0.71, 0.75)),
        seg(v, 0.73, 0.78) * (1 - seg(v, 0.86, 0.90)),
        seg(v, 0.89, 0.94),
      ];
      el.caps.forEach((c, i) => { c.style.opacity = String(capOp[i] ?? 0); });
      // Scroll cue: the fill tracks the PHYSICAL scroll (linear), so the bar
      // moves steadily under the finger even inside heavy zones.
      if (el.cuefill) el.cuefill.style.transform = `scaleX(${Math.min(1, Math.max(0, vRaw))})`;
      hint.style.opacity = String(1 - seg(vRaw, 0.955, 0.995));
    };

    applyRef.current = apply;
    apply(reduced ? 1 : scrollYProgress.get());
    if (reduced) return;

    // ── « Comme dans du beurre » (client 2026-08-13) ─────────────────────────
    // La valeur AFFICHÉE ne saute plus sur la valeur de scroll : elle la
    // POURSUIT, image par image, avec un amorti exponentiel. Deux effets :
    //   · chaque cran de molette, au lieu d'un pas sec de scale, devient une
    //     rampe qui s'éteint sur ~un tiers de seconde — c'est précisément le
    //     « beurre » demandé, par-dessus le lissage que Lenis applique déjà ;
    //   · les événements de scroll ne pilotent plus apply() en direct : ils ne
    //     font que déplacer la cible, et UNE seule application par image est
    //     garantie par la boucle rAF, quel que soit le nombre d'événements.
    // TAU = 110 ms : assez long pour fondre les crans, assez court pour que la
    // scène ne paraisse pas traîner derrière le doigt. L'arrêt se décide en
    // PIXELS de course (< 0,4 px d'écart → on colle à la cible et on coupe la
    // boucle) : un epsilon sur la fraction dépendrait de la hauteur du
    // cadenceur, qui varie de 360 à 800 vh selon que la démo est lancée.
    const TAU = 110;
    let target = scrollYProgress.get();
    let shown = target;
    let raf = 0;
    let lastTs = 0;
    const tick = (ts: number) => {
      raf = 0;
      const dt = lastTs ? Math.min(64, ts - lastTs) : 16.7;
      lastTs = ts;
      shown += (target - shown) * (1 - Math.exp(-dt / TAU));
      const coursePx = (rideRef.current?.offsetHeight ?? 0) - window.innerHeight;
      if (Math.abs(target - shown) * Math.max(1, coursePx) < 0.4) shown = target;
      apply(shown);
      if (shown !== target) raf = requestAnimationFrame(tick);
      else lastTs = 0;
    };
    const chase = (v: number) => {
      target = v;
      if (!raf) { lastTs = 0; raf = requestAnimationFrame(tick); }
    };
    const unsub = scrollYProgress.on("change", chase);
    return () => {
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollYProgress, reduced]);

  return (
    <section data-nav-shy className="relative bg-white dark:bg-black">
      <style>{HD_CSS}</style>

      {/* ── Phones (< 768px) : hero RECOMPOSÉ ─────────────────────────────
          La scène scrollée ci-dessous est une scène de 1040×640 contenant une
          réplique de 1180×720. Tenir l'une ou l'autre dans une colonne de
          327 px donne une échelle de ~0,29, donc des typographies de 7 à
          13,5 px rendues entre 2 et 4 px : plus rien n'est lisible. Recadrer
          au lieu de réduire ne sauve rien non plus, la réplique ne reste
          lisible qu'à l'échelle 1 et il n'en tient alors que 28 % de la
          largeur. D'où une branche tactile distincte, comme le fait déjà
          OraExperienceCarousel. */}
      <div className="md:hidden">
        <OraHeroMobile openBooking={openBooking} />
      </div>

      {/* ── LE TITRE, EN FLUX NORMAL (client 2026-08-13) ─────────────────────
          « On descend et c'est NOUS qui allons vers la réplication du
          logiciel, pas la réplication qui vient à nous. Elle ne change pas de
          taille. »
          Le titre vivait DANS la scène épinglée : dès le premier cran, l'écran
          se figeait pendant qu'apply() fondait le titre et repliait sa hauteur
          — la réplique grossissait donc VERS le lecteur, et chaque image de
          repli redimensionnait la scène. Sorti de l'épinglage, il défile
          comme n'importe quel contenu ; la réplique approche à taille
          constante ; l'épinglage ne commence qu'au contact du haut d'écran
          (position:sticky nu, cadenceur dédié ci-dessous).
          `hidden md:block` : sur mobile, OraHeroMobile porte sa propre
          ouverture. */}
      <div ref={wrapRef} className="relative hidden md:block">
        {/* `pb-0` (client 2026-08-13 : « enlève l'espace entre la réplication
            et la phrase Testez Ora sur vos fichiers »). Les 40 px de marge
            basse s'ajoutaient aux 112 px de retrait du bloc épinglé : 185 px
            de vide mesurés entre la ligne et le haut de la fenêtre. */}
        {/* ⚠ LA MARGE DOUBLE À `lg` (48 → 80 px), et ce n'est pas du confort.
            Mesuré sur la capture Softriver ramenée à l'échelle : leur discours
            commence à ~96 px du bord sur un écran équivalent, contre 48 ici —
            le texte collait au bord deux fois plus près que la référence, ce
            qui est précisément ce qui se lit comme « proportions incohérentes
            par rapport à l'écran ».
            80 px n'est pas non plus un chiffre rond choisi au hasard : c'est la
            valeur qui aligne le bord gauche du texte sur celui de la PASTILLE
            du fichier déposé, en dessous (84 px mesurés). Les deux blocs du
            hero partagent donc une arête, au lieu de commencer chacun où sa
            propre mécanique le laissait tomber. */}
        {/* ⚠ `pb-0` EST DEVENU `lg:pb-16`. Le zéro venait de la scène
            épinglée : elle remontait de 40 px sous le titre, tout blanc entre
            les deux se voyait double. La scène est éteinte depuis le
            2026-08-28, plus rien ne remonte, et le hero se terminait donc au
            ras de la section suivante. Client 2026-08-29 : « ajoute de
            l'espace libre pour rendre le site plus minimaliste ». */}
        <div className="px-6 md:px-12 pt-24 md:pt-28 pb-0 lg:px-20 lg:pb-16">
          {/* DEUX COUCHES : l'enveloppe extérieure n'appartient PLUS au moteur
              de scroll (2026-08-13) — elle ne sert plus qu'à mesurer —, la
              couche intérieure porte l'animation d'arrivée Framer. */}
          <div
            ref={headlineRef}
            className="hd-headline relative z-10 max-w-[90rem] mx-auto"
          >
          {/* ══ CÔTE À CÔTE : LE DISCOURS À GAUCHE, LE PRODUIT À DROITE ═════
              Client 2026-08-28, captures Stripe et Softriver à l'appui : « une
              phrase à gauche et un design à droite… je veux arrêter avec la
              phrase, puis le bouton, puis la réplication du logiciel ».

              CE QUI CHANGE EST L'ARRANGEMENT, PAS LE CONTENU. Rien n'est
              réécrit : la ligne de marque, le titre à deux encres, la phrase,
              l'appel et la rangée de preuve sont les textes validés, déplacés.
              C'est le cœur de la demande — ce qui fatiguait n'était aucun de
              ces éléments, c'était de les recevoir l'un SOUS l'autre, centrés,
              avant de tomber sur la réplique du logiciel.

              CE QUI EST REPRIS DES DEUX RÉFÉRENCES, et rien d'autre :
                · le discours ALIGNÉ À GAUCHE et non centré, les deux le font ;
                · le titre à deux encres, déjà la grammaire du site, et déjà
                  celle de Stripe (début en encre pleine, suite en gris) ;
                · la rangée de preuve en BANDE sous les colonnes, comme la
                  bande de logos de Stripe. Elle était sous le bouton ; dans
                  une demi-colonne ses quatre mentions tombaient sur trois
                  lignes. Pleine largeur, elle tient sur une et ferme le hero.
              Ce qui n'est PAS repris : le second bouton que les deux
              références posent à côté du premier. Le site a UN appel, la
              réservation, et la concurrence de deux CTA est un défaut relevé
              à l'audit du 2026-08-15 puis corrigé le 2026-08-26. Ce n'est pas
              un oubli.

              ⚠ DEUX COLONNES À `lg` SEULEMENT, ET C'EST MESURÉ. HeroSideScene
              compose à 520 px de large puis se met à l'échelle de sa colonne.
              À `md` (768 px), une demi-colonne fait ~340 px, soit une échelle
              de 0,65 : les libellés de 7 à 13 px du classeur tombent entre 4,5
              et 8,5 px, c'est-à-dire exactement le calcul qui a imposé une
              branche mobile séparée. Entre md et lg on reste donc empilé et
              centré, la scène passant sous le discours à pleine largeur. */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-left"
          >
            {/* Ouverture calquée sur monday.com (client 2026-07-28) : ligne de
                marque en dégradé discret (comme « monday AI work platform »),
                titre massif en Poppins, sous-titre même famille, bouton court
                « Commencer » vers la démo web, légende dessous. */}
            {/* Même visage fin que monday.com : Instrument Sans en graisse
                normale (la face déjà utilisée pour « Automatisez de bout en
                bout » — exception documentée à la règle Poppins). */}
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
            {/* Échelle d'origine rétablie (client 2026-07-30) : le passage à
                7,5 vw / 6,5 rem, calqué sur « Automatisez de bout en bout »,
                rendait le titre trop massif ici. La FAMILLE est de toute façon
                déjà la même des deux côtés (Instrument Sans normale). */}
            {/* SECONDE LIGNE EN DÉGRADÉ DE MARQUE (client 2026-08-11 : « repasse
                cela en bleu »). Revient sur le choix du 2026-08-09 (les deux
                lignes en noir) : avec le nouveau titre en trois « plus »
                (2026-08-11), la première ligne pose l'idée et la seconde,
                colorée, porte la conséquence concrète — la couleur aide à
                distinguer les deux temps de la phrase au lieu de les fondre. */}
            {/* ⚠ `antialiased` N'EST PAS DÉCORATIF ICI, c'est le SEUL levier
                d'amaigrissement disponible sur cette phrase (client
                2026-08-14 : « fais en sorte que la police soit légèrement plus
                fine »). Instrument Sans N'A PAS de graisse sous 400 : mesuré
                en page, la phrase rendue en 200, 300, 350 et 400 fait
                exactement la même largeur, 559,09 px — le navigateur retombe
                sur la plus légère fonte disponible, et il ne sait pas
                synthétiser plus fin (seulement plus gras). `font-light` serait
                donc du code mort.
                `-webkit-font-smoothing: antialiased` fait passer le rendu du
                lissage sous-pixel au lissage en niveaux de gris, ce qui amincit
                réellement les fûts. L'effet est WebKit et macOS, donc VISIBLE
                CHEZ LE CLIENT qui navigue sous Safari, et sans effet sous
                Windows — une vraie graisse plus fine demanderait de changer de
                famille ou de charger la version variable d'Instrument Sans.
                Posé aussi sur le hero mobile : les deux doivent porter le même
                titre au traitement près. */}
            {/* ⚠ h1 ET NON h2 (audit du 2026-08-15). La page d'accueil n'avait
                AUCUN h1 : ni titre de document pour un lecteur d'écran, ni
                signal de titre pour un moteur. Pire, les deux seuls h1 de la
                page vivaient dans les fausses applications d'AtlasMockups et
                disaient « Bonjour Marie ». Le titre du hero est le titre de la
                page, il en porte donc le rang. Le hero mobile suit. */}
            {/* ⚠ DEUX LIGNES, ET LA TAILLE EST CALCULÉE POUR ÇA (client
                2026-08-29 : « que la phrase soit sur deux lignes, bien plus
                marquée, bien plus visible et impactante »).
                Les deux `block` en dessous posent DÉJÀ deux lignes ; ce qui
                en faisait trois, c'était la seconde qui débordait et se
                cassait toute seule. « plus d'analyse, plus de conseil. » fait
                31 signes, soit ~31 x 0,47 x taille en largeur : à 54 px il lui
                faut 787 px, et la colonne de texte en offre 829 à 1440. Le
                titre passe donc de 49 à 54 px ET de trois lignes à deux — les
                deux gains vont dans le même sens, une ligne de moins se lit
                comme plus assuré.
                ⚠ LA BORNE DE LARGEUR ET LE PLAFOND DE TAILLE SONT UN COUPLE,
                pas deux réglages. La seconde ligne tient si et seulement si
                31 x 0,47 x taille reste sous la largeur disponible :
                  · 68 rem (1 088 px) de largeur autorisent 74,7 px ;
                  · 4,6 rem (73,6 px) en demandent 1 072.
                Les deux valeurs se touchent presque, c'est voulu — le titre est
                aussi gros que le permet une seconde ligne insécable. Monter
                l'un sans l'autre le renvoie à trois lignes, ce qui était le
                défaut à corriger.
                ⚠ IL A ENCORE GRANDI le 2026-08-29 (66 → 74 px) parce que la
                réplique est passée EN DESSOUS : le titre ne partage plus sa
                ligne avec elle, il dispose donc de toute la largeur au lieu de
                992 px. C'est la même contrainte, appliquée à une place plus
                grande. La cadence pleine largeur reste inchangée sous lg. */}
            <h1 className="antialiased font-instrument font-normal text-[clamp(2.3rem,5.4vw,4.8rem)] tracking-[-0.035em] leading-[1.03] text-balance text-[#111827] dark:text-white mt-3 lg:mt-4 lg:max-w-[68rem] lg:text-[clamp(3.2rem,5.4vw,4.6rem)]">
              <span className="block">{t({ fr: "Plus de productivité,", en: "More productivity," })}</span>
              <span className="block text-brand-gradient">{t({ fr: "plus d'analyse, plus de conseil.", en: "more analysis, more advisory." })}</span>
            </h1>

            {/* LA PHRASE DIT « LOGICIEL » (client 2026-08-18 : « il faut qu'on
                comprenne que c'est un logiciel… on comprend en une phrase ce
                qu'on fait »). L'ancienne (« On s'occupe de vos tâches
                répétitives, vous excellez dans votre métier ») décrivait un
                bénéfice qu'une agence ou un cabinet externalisé pourrait
                revendiquer mot pour mot — rien ne disait qu'un PRODUIT existe.
                Le patron est celui des sites d'IA juridique : la catégorie,
                le travail repris, où repart le temps. Modifier ici = modifier
                OraHeroMobile, qui porte la même phrase au mot près. */}
            <p className="mt-5 max-w-[36rem] font-instrument font-normal text-[clamp(1rem,1.6vw,1.35rem)] leading-normal text-gray-500 dark:text-gray-400 lg:mt-6 lg:max-w-[44rem] lg:text-[1.25rem]">
              {t({
                fr: "Le logiciel qui reprend le répétitif comptable, pour rediriger votre temps vers le conseil.",
                en: "The software that takes over repetitive accounting work, redirecting your time to advisory.",
              })}
            </p>

            {/* ══ L'APPEL ET LA PREUVE SUR LA MÊME LIGNE ══════════════════════
                Client 2026-08-29, capture Softriver à l'appui. C'est leur geste
                le plus reconnaissable : le bouton ne se tient pas seul au-dessus
                d'une bande, il partage sa ligne avec les mentions de
                réassurance. On lit l'appel et ce qui le rend crédible d'un seul
                regard, au lieu de deux blocs empilés.
                MESURÉ AVANT DE LE POSER : le bouton fait ~240 px et les quatre
                mentions ~890, soit 1 170 px pour 1 344 disponibles à 1440 et
                1 184 à 1280. Ça tient sur une ligne jusqu'à 1280 ; en dessous
                le `flex-wrap` les renvoie sous le bouton sans rien casser.
                La bande centrée et son filet, posés la veille d'après Stripe,
                disparaissent avec : deux références ne se superposent pas, et
                c'est la plus récente qui tranche. */}
            <div className="mt-8 flex flex-col items-start gap-6 lg:mt-9 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-9 lg:gap-y-5">
            {/* ⚠ CE BOUTON MENAIT À LA WEB APP, il mène à la RÉSERVATION
                (client 2026-08-26 : « enlève tous les boutons qui relient vers
                la web app »). Il portait « Commencer » vers
                ora-solution.com/demo, en cible externe — donc le seul appel du
                hero SORTAIT DU SITE, alors que l'objectif déclaré est la prise
                de rendez-vous. CLAUDE.md signale cette concurrence de CTA
                depuis le 2026-08-15 ; elle est close.
                Le hero garde UN bouton, pas zéro : le supprimer laisserait la
                première page du site sans appel à l'action. */}
            <button
              type="button"
              onClick={openBooking}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-[#3b82f6] px-9 py-4 font-instrument text-[17px] font-medium text-white shadow-[0_14px_32px_-12px_rgba(59,130,246,0.6)] transition-colors duration-200 hover:bg-[#2563eb]"
            >
              {t({ fr: "Réserver un appel", en: "Book a call" })}
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            {/* ══ LA RANGÉE DE PREUVE ═════════════════════════════════════════
                Client 2026-08-21, capture Softriver à l'appui : « il faudrait
                faire un truc de social proof un peu comme 100 % EU, no LLM or
                american cloud ».

                Elle remplace la ligne de réassurance de monday.com (« Testez
                Ora sur vos fichiers ✦ Sans installation ✦ Directement dans
                votre navigateur »), qui vantait la commodité là où la capture
                de référence apporte de la CRÉDIBILITÉ. Les mots forts passent
                en encre pleine, comme Softriver met « delivered in 48 hours »
                en gras au milieu d'une phrase grise.

                ⚠ CHAQUE MENTION EST DÉJÀ ÉCRITE AILLEURS SUR LE SITE, et c'est
                la règle qui a présidé à leur choix. Rien n'est inventé ici :
                  · « Hébergé en Europe » et « Hors CLOUD Act » viennent mot
                    pour mot de la FAQ (« En Europe : Francfort et Genève, hors
                    de portée du CLOUD Act américain ») ;
                  · « Chiffré sur votre appareil » de PrivacyShowcase ;
                  · « Même fichier, même résultat » de la réponse FAQ sur les
                    chatbots et de la carte « Les mêmes chiffres ».

                ⚠ DEUX FORMULATIONS DEMANDÉES N'ONT PAS ÉTÉ REPRISES TELLES
                QUELLES, et les deux écarts sont volontaires :

                1. « 100 % EU » → « Hébergé en Europe ». Les serveurs sont à
                   Francfort ET Genève. Genève est en Suisse, qui n'est pas dans
                   l'Union européenne : « 100 % EU » serait factuellement faux
                   sur la moitié de l'hébergement. « Europe » est exact et dit
                   la même chose à un lecteur.

                2. « No LLM » n'est PAS affiché. Deux raisons distinctes.
                   D'abord ce serait un surengagement : la FAQ affirme que les
                   LIVRABLES CHIFFRÉS reposent sur des règles de calcul
                   explicites, pas qu'aucun modèle de langue n'existe dans le
                   produit — Atlas répond à des questions en français, ce qu'un
                   moteur de règles seul ne fait pas. Un « no LLM » en haut de
                   page serait plus large que ce que le site tient.
                   Ensuite c'est la position établie : la différence avec les
                   chatbots se dit de façon OBLIQUE partout, et frontale
                   uniquement dans la FAQ, où il y a la place d'expliquer.
                   « Même fichier, même résultat » est la forme oblique — elle
                   dit exactement ce qui manque à un LLM, sans le nommer et
                   sans rien promettre de plus que ce qui est vrai. */}
            {/* ⚠ ELLE EST SORTIE DE LA COLONNE DE GAUCHE (2026-08-28) et
                passe en BANDE pleine largeur sous les deux, comme la bande de
                logos de Stripe. Ses quatre mentions font ~890 px sur une
                ligne : dans une demi-colonne de 620 px elles tombaient sur
                trois lignes, ce qui rallongeait le discours de 60 px et
                déséquilibrait la paire. Elle garde son `justify-center` — le
                discours est à gauche, mais une bande de fermeture centrée est
                ce que font les deux références.
                ⚠ CE QUI LA SÉPARE DE LA DÉMO NE SE RÈGLE PAS ICI, et c'est
                contre-intuitif : raccourcir son pas du haut la remonte, mais
                remonte AUSSI tout ce qui suit, réplique comprise. L'écart du
                bas ne bouge donc pas d'un pixel. Mesuré : 56/47 px avant,
                40/48 px après — la bande s'est rapprochée du hero sans que la
                démo se rapproche d'elle, ce qui est exactement le but.
                Le seul levier sur l'écart du BAS est le `-mt-10` de la piste,
                et on n'y touche pas : il vient d'une demande explicite du
                2026-08-14 (« remonte un peu la réplication du logiciel »). Si
                la bande doit respirer davantage avant la démo, c'est cette
                valeur-là qu'il faut rouvrir, en connaissance de cause. */}
            {/* ⚠ NI FILET NI CENTRAGE (2026-08-29). Elle a été une bande
                centrée sous un trait pendant une passe, d'après Stripe ; elle
                revient AU FIL DU TEXTE, à la suite du bouton, d'après Softriver
                — voir le pavé de la rangée juste au-dessus. Le trait n'a plus
                de sens une fois la rangée à l'intérieur du discours : il
                séparait un bloc, il couperait maintenant une ligne. */}
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-instrument text-[14.5px] font-normal text-gray-400 dark:text-gray-500">
              {[
                { fort: { fr: "Hébergé en Europe", en: "Hosted in Europe" }, reste: { fr: "Francfort, Genève", en: "Frankfurt, Geneva" } },
                { fort: { fr: "Hors CLOUD Act", en: "Outside the CLOUD Act" }, reste: { fr: "américain", en: "" } },
                { fort: { fr: "Chiffré", en: "Encrypted" }, reste: { fr: "sur votre appareil", en: "on your device" } },
                { fort: { fr: "Même fichier, même résultat", en: "Same file, same result" }, reste: { fr: "", en: "" } },
              ].map((s, i) => (
                <li key={s.fort.en} className="flex items-center gap-5">
                  {/* Le séparateur est porté par l'entrée SUIVANTE : en
                      `flex-wrap`, un séparateur autonome se retrouverait seul
                      en tête de ligne au passage à la ligne. */}
                  {i > 0 && (
                    <span aria-hidden className="text-gray-300 dark:text-white/20">
                      ✦
                    </span>
                  )}
                  <span>
                    <span className="text-[#42506b] dark:text-gray-300">{t(s.fort)}</span>
                    {t(s.reste) ? ` ${t(s.reste)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            </div>
          </motion.div>
            {/* ── LA COLONNE DU PRODUIT : LA RÉPLIQUE, TAILLÉE PAR L'ÉCRAN ─
                Client 2026-08-28, capture monday.com à l'appui : « je voudrais
                simplement cette réplication du logiciel à droite du texte, en
                plus petit pour s'adapter ».

                C'EST LA MÊME SCÈNE QUE LA GRANDE RÉPLIQUE, OraAppScene, pas
                une maquette de plus : la même barre latérale, les mêmes douze
                modules, les mêmes pastilles. Un second dessin à tenir en
                parallèle aurait divergé au premier changement de produit.
                HeroSideScene, écrit le 2026-08-26 pour cette place, retourne
                donc au repos — il reste dans le dépôt, non monté, comme il
                l'était avant aujourd'hui.

                ⚠ ELLE EST TRANCHÉE PAR LE BORD DE L'ÉCRAN, comme le visuel
                de Stripe. La passe précédente montrait la scène entière, plus
                petite ; le client demande maintenant l'inverse — plus grande,
                dans une mise en page façon Stripe. C'est le même arbitrage
                pris dans l'autre sens, et il est détaillé au pavé de
                HERO_APP_SCALE : à 1440, tout montrer coûte 0,45 d'échelle et
                des libellés à 6 px ; trancher au bord de l'écran permet 0,56,
                soit 24 % de plus, et rend les intitulés lisibles.
                Ce qui reste à l'écran est le FLANC GAUCHE — pastille du
                fichier déposé, barre latérale, salutation, cartes bleues et
                les premières colonnes d'accès rapide. Les pastilles de sortie
                partent hors champ à droite : c'est le hors-champ lui-même qui
                dit qu'il y a davantage.

                ⚠ LA COUPE SE FAIT AU BORD DE L'ÉCRAN, PAS AU BORD DE LA
                COLONNE : sans ça la fenêtre serait tranchée par une marge
                invisible au milieu de la page, ce qui se lit comme un
                débordement raté et non comme un cadrage. Le `overflow-hidden`
                va avec, il empêche la scène de créer une barre de défilement
                horizontale.

                ⚠ ET LE DÉBORD NE PEUT PAS S'ÉCRIRE `calc(50% - 50vw)`, la
                recette habituelle du pleine-largeur. Sur un ÉLÉMENT DE GRILLE,
                le bloc conteneur est la ZONE DE GRILLE, pas le conteneur
                centré : les 50 % valaient donc 322 px (la moitié de la colonne)
                au lieu de 672, et la marge tombait à -398 px. Mesuré : la
                cellule faisait 1 042 px de large et poussait la page à
                1 790 px, soit 350 px de défilement horizontal parasite.
                Le débord est donc calculé DEPUIS LA FENÊTRE, sans pourcentage :
                48 px de rembourrage de section tant que l'écran est sous
                90 rem, et la moitié de ce qui dépasse au-delà. Vérifié à 1280
                (48), 1440 (48) et 1728 (144), débordement nul dans les trois.

                ⚠ `chips="none"`, ET LES DEUX MOITIÉS DE LA RAISON DIFFÈRENT.
                Les pastilles de SORTIE (rapport généré, lignes contrôlées,
                synthèse PDF) vivent au flanc DROIT de la scène : dans ce
                cadrage elles tombent entièrement dans la partie coupée, il n'y
                a rien à en tirer. Celle d'ENTRÉE, elle, survit à la coupe mais
                se pose MAL : sa position de mode rogné (`right: calc(100% -
                196px)`) la ramène par-dessus la barre latérale, où elle
                recouvre l'entrée « Accueil » — vérifié en capture, ça se lit
                comme un défaut d'empilement, pas comme une pastille.
                La référence n'en porte d'ailleurs aucune de ce genre : monday
                pose une capture propre avec un seul encart DANS la zone de
                travail. Une pastille correctement replacée serait un réglage à
                part, à faire dans OraAppScene ; en attendant, aucune.
                Pour les remettre : `chips="in"` (entrée seule) ou `"all"`. */}

            {/* ══ LA RÉPLIQUE, SOUS LE DISCOURS ET PLEINE LARGEUR ═════════════
                Client 2026-08-29 : « mets la réplication du logiciel en dessous
                de la phrase… il faut qu'elle prenne une bonne partie de la
                largeur de l'écran, sinon le texte en haut à gauche va faire
                bizarre ». La remarque commande tout le bloc, et elle est juste :
                un discours aligné à gauche ne se lit comme un parti pris que
                s'il est suivi d'un objet qui occupe VRAIMENT la largeur. À côté
                d'une colonne étroite, il n'a l'air que décentré.
                C'est la mise en page de Softriver : le discours cadré en haut à
                gauche, puis une rangée qui court d'un bord à l'autre.

                ⚠ CE QUE LE PASSAGE EN DESSOUS FAIT GAGNER. En colonne de
                droite, la scène disposait de ~1 000 px et sa fenêtre était
                rendue à 682 px. Sur toute la largeur elle en reçoit 1 440, et
                la fenêtre monte à ~1 008 px — 85 % de sa taille de composition
                contre 58 % avant. Les libellés se lisent enfin au lieu de se
                deviner, et rien n'est coupé.

                ⚠ PLAFOND À 1 626 px, qui est l'empreinte complète de la scène,
                pastilles comprises. Sans lui, un écran de 1 728 étirerait la
                fenêtre à 1 210 px, soit AU-DELÀ de ses 1 180 px de composition :
                on agrandirait un dessin au lieu de le montrer.

                ⚠ 16,5 % / 67 % CENTRE LA FENÊTRE, ET C'EST LE POINT DE CETTE
                PASSE. À 13/70 elle laissait 187 px de blanc à gauche et 245 à
                droite : 58 px d'écart, assez pour qu'on la lise comme posée de
                travers plutôt que cadrée. Le décentrement venait des pastilles
                elles-mêmes — elles débordent de 188 px à gauche mais de 258 à
                droite, donc réserver le strict nécessaire de chaque côté
                décale forcément la fenêtre. En réservant 16,5 % PARTOUT, le
                surplus va du côté qui en a le moins besoin et la fenêtre
                retombe au milieu (238 px de chaque côté, mesuré).
                Ça coûte 43 px de largeur de fenêtre (1 008 → 965). C'est le
                prix du centrage, et il est payé volontiers : une fenêtre de
                3 % plus étroite ne se voit pas, 58 px d'asymétrie se voient.

                ⚠ CE QUI RESTE IMPOSSIBLE, pour mémoire. La fenêtre ne peut pas
                dépasser ~72 % de l'écran tant que les quatre pastilles sont
                entières ET hors de l'interface : leur empreinte fait 1 626 px
                pour 1 180 de fenêtre, le rapport est fixe. Aller au-delà
                demande soit de les couper, soit de les faire mordre sur la
                barre latérale et sur la grille des modules — les deux ont été
                essayés et renvoyés. */}
            {/* ⚠ LA RANGÉE NE DÉBORDE PLUS JUSQU'AU BORD DE L'ÉCRAN, et c'est
                un renoncement volontaire. Bordée, elle plaçait la pastille du
                fichier à 11 px du bord gauche — l'alignement texte/pastille
                obtenu la veille (80 px de part et d'autre) sautait, et la marge
                gauche à 11 px répondait à une marge droite à 0. Rentrée dans le
                rembourrage de section, la rangée retrouve deux marges égales et
                le bord du texte. Elle occupe encore 89 % de l'écran à 1440,
                ce qui reste « une grande partie de la largeur ». */}
            {/* ⚠ LA RANGÉE RENTRE DANS LES MARGES, ET C'EST UN DEMI-TOUR
                ASSUMÉ. Elle débordait jusqu'aux deux bords de l'écran depuis la
                passe précédente, pour gagner les 160 px de rembourrage.
                Client 2026-08-29 : « resserre la vidéo sur la gauche et ajoute
                de l'espace libre pour rendre le site plus minimaliste ». Les
                deux demandes vont dans le même sens et contre le débord : une
                composition qui touche les deux bords ne peut pas respirer.
                Elle repart donc du bord gauche du TEXTE (80 px, l'alignement
                déjà acquis) et s'arrête avant le bord droit.

                ⚠ LE RETRAIT EST ASYMÉTRIQUE, ET C'EST LE « resserre sur la
                gauche ». `lg:pr-16` ajoute 64 px à droite et rien à gauche :
                la marge droite fait donc 144 px contre 80 à gauche. La paire
                est tirée vers la gauche, l'espace libre s'ouvre à droite, et
                le tout reste calé sur l'arête du discours au lieu de flotter
                au milieu.

                ⚠ CE QUE ÇA COÛTE, dit franchement : la fenêtre retombe de 578
                à ~487 px et la vidéo de 627 à ~528. C'est l'exact inverse de
                la demande précédente (« plus grands »), et c'est arithmétique
                — on ne peut pas à la fois occuper toute la largeur et laisser
                de l'espace libre. La dernière consigne tranche. */}
            {/* ⚠ LA RANGÉE RESTE DANS LES MARGES (client 2026-08-29 : « remets
                la marge des deux côtés »). Elle a débordé jusqu'aux bords de
                l'écran le temps d'une passe, pour gagner les 160 px de
                rembourrage ; la marge revient des deux côtés, à 80 px, ce qui
                réaligne le bord gauche des cadres sur celui du texte.
                Ça coûte ~50 px de largeur à chaque cadre. Le gain de la passe
                précédente n'est pas perdu pour autant : l'essentiel venait du
                retrait des pastilles, pas du débord. */}
            {/* `-mx-4` : 16 px repris sur chaque marge (80 → 64). Le bord des
                cadres déborde donc LÉGÈREMENT du bord du texte — un outdent de
                média, pas un désalignement : l'arête du discours reste à 80. */}
            <div className="mt-16 lg:-mx-4 lg:mt-24">
              {/* ⚠ LE PLAFOND EST REMONTÉ DE 1 626 À 2 400 px. Il valait
                  l'empreinte de la scène SEULE (fenêtre + pastilles) du temps
                  où elle occupait toute la rangée : au-delà, la fenêtre aurait
                  dépassé ses 1 180 px de composition et on aurait agrandi un
                  dessin. Depuis qu'elle partage la rangée avec la vidéo elle
                  n'en occupe plus que 40 %, si bien que la fenêtre ne
                  atteindrait 1 180 qu'à partir d'une rangée de 2 917 px. Le
                  vieux plafond ne protégeait donc plus rien : il bridait les
                  grands écrans pour rien (1 591 px utilisés sur 1 728). */}
              <div className="mx-auto max-w-[2400px]">
                {/* ══ DEUX CADRES CÔTE À CÔTE, DE MÊME HAUTEUR ═══════════════
                    Client 2026-08-29 : « mets la vidéo démo à côté de la
                    réplication du logiciel pour que ces deux encadrés prennent
                    une grande partie de la largeur ».

                    ⚠ LES DEUX CADRES FONT EXACTEMENT LA MÊME TAILLE, CÔTE À
                    CÔTE. Un COLLAGE SUPERPOSÉ a vécu une heure le 2026-08-30
                    (réplique 62 % en haut à gauche, vidéo 56 % décalée en bas
                    à droite, recouvrement de ~240 px — c'est le recouvrement
                    qui payait l'agrandissement, 813 et 735 px de large) et le
                    client l'a renvoyé le jour même : « je n'aime pas ».
                    NE PAS LE REPROPOSER ; son détail vit dans l'historique git
                    à cette date. Retour à la paire égale : deux colonnes 1fr,
                    même rapport, hauteurs égales toutes seules.

                    ⚠ LE RAPPORT EST PASSÉ DE 1180/720 À 1180/820 le 2026-08-30
                    (client : « plus large et surtout plus haut »). À largeur
                    de rangée bornée, la SEULE façon de gagner de la hauteur
                    sans toucher aux marges est d'allonger la boîte — et
                    d'accepter que les contenus, qui restent en 1,639, y soient
                    ROGNÉS :
                      · la réplique remplit la HAUTEUR et se rogne à droite
                        (~12 % de la scène : un bout de la troisième colonne
                        d'accès rapide). Ancrée à GAUCHE, c'est le flanc barre
                        latérale + salutation + cartes bleues qui reste — le
                        même choix que le panneau « Contrôles et suivi »
                        d'AutomationTabs, qui rogne la même scène dans un cadre
                        depuis le 2026-08-14 ;
                      · la vidéo, déjà en object-cover, rogne ~8 % de chaque
                        côté au lieu de 4.
                    C'est pour rendre ce rognage LISIBLE que la réplique gagne
                    un vrai cadre (liseré, coins, fond) identique à celui de la
                    vidéo : une fenêtre coupée au bord d'un cadre se lit comme
                    un cadrage ; coupée dans le vide, comme un bug — les deux
                    ont été constatés en capture sur les passes monday.

                    ⚠ `chips="in"` ICI, ET C'EST LA VIDÉO QUI L'IMPOSE. Les
                    trois pastilles de sortie vivent au flanc DROIT de la
                    réplique, c'est-à-dire exactement là où la vidéo se tient
                    désormais : elles lui passeraient dessus. Seule celle
                    d'entrée reste, à gauche, où rien ne la gêne — et c'est
                    aussi celle qui porte le propos, le fichier qu'on dépose.

                    ⚠ CE QUE LA PAIRE COÛTE À LA RÉPLIQUE, pour que ce soit
                    dit : seule et centrée elle affichait une fenêtre de 965 px ;
                    partagée avec la vidéo elle tombe à ~620. C'est mécanique,
                    deux objets dans la largeur d'un seul. Le gain est ailleurs,
                    la rangée montre deux preuves au lieu d'une. */}
                {/* ⚠ LES PASTILLES SONT RETIRÉES (client 2026-08-29 :
                    « supprime les petits encadrés qui gravitent autour du
                    design de réplication »), et c'est ce qui débloque la
                    taille. Elles coûtaient 38 % de la largeur de la colonne :
                    188 unités de débord à gauche et 258 à droite pour une
                    fenêtre de 1 180, qu'il fallait réserver sous peine de les
                    voir tranchées ou posées sur la vidéo. Sans elles, la
                    colonne vaut exactement sa fenêtre, et les ~460 px ainsi
                    rendus vont aux deux cadres.
                    Le rapport des colonnes suit : 1 pour la réplique contre
                    1,085 pour la vidéo, qui reste plus haute qu'elle.

                    ⚠ LE DÉCALAGE DE HAUTEUR EST ABANDONNÉ. Il avait été
                    introduit la veille pour débloquer une impasse de largeur
                    (une vidéo plus haute prend moins de large à surface égale) ;
                    la demande d'égalité stricte le rend caduc, et `items-start`
                    n'a plus rien à rattraper — les deux boîtes sont identiques,
                    elles s'alignent en haut ET en bas d'elles-mêmes. */}
                {/* ⚠ L'ÉCART TOMBE À 12 px (client 2026-08-29 : « il faut qu'elles
                    prennent plus de place en hauteur surtout »). C'est le seul
                    levier qui reste, et il faut dire pourquoi : à format fixe,
                    la hauteur d'un cadre EST sa largeur divisée par 1,639. Pour
                    gagner de la hauteur il faut donc gagner de la largeur, et
                    la largeur est bornée des deux côtés — par la marge de 80 px
                    qui aligne les cadres sur le texte (demandée la veille) et
                    par l'égalité stricte des deux boîtes (demandée aussi).
                    Ne reste que l'écart entre elles : 20 → 12 px rend 4 px de
                    largeur et 2 px de hauteur à chacune. Autant dire rien.
                    LES DEUX VRAIS LEVIERS, si la hauteur compte plus que le
                    reste : rendre la marge de 80 px (les cadres regagnent
                    ~50 px de large, soit 30 de haut), ou renoncer à l'égalité
                    pour recadrer la vidéo en 4/3 (elle gagnerait 100 px de
                    haut, la réplique rien). */}
                <div className="relative grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-3">
                  {/* ── LE ROND DE FOND, CENTRÉ ET EN DÉRIVE ─────────────────
                      Client 2026-08-29 : « le background du cercle doit bouger
                      et être au centre ».

                      ⚠ IL EST CENTRÉ PAR `left`, PAS PAR UN `transform`. La
                      recette habituelle — `left:50%` plus `translateX(-50%)` —
                      serait ÉCRASÉE ICI : `.hd-heroglow` porte une animation
                      dont chaque image écrit un `transform` (c'est elle qui le
                      fait dériver), et une animation en cours l'emporte sur le
                      transform en ligne. Le rond serait resté collé à droite,
                      sans erreur nulle part. On centre donc à la main :
                      `left = (100 - largeur) / 2`, soit 33 % pour 34 %.

                      ⚠ IL BOUGE DÉJÀ, ET IL BOUGEAIT DÉJÀ AVANT : `hdBlobFloat`
                      le promène de 42 px sur 16 secondes. Ce qui manquait,
                      c'est qu'on puisse le VOIR bouger — à 24 % de large et
                      posé derrière la réplique, il était intégralement masqué
                      par une fenêtre opaque. À 34 % et au centre, il déborde
                      des deux cadres par le haut et par le bas, et sa dérive
                      passe dans l'écart qui les sépare. */}
                  <div
                    aria-hidden
                    className="hd-heroglow hidden md:block"
                    style={{ left: "33%", top: "-18%", width: "34%", aspectRatio: "1" }}
                  />
                  <div
                    className="relative z-10 w-full overflow-hidden rounded-[14px] bg-[#fdfdfb] shadow-[0_24px_60px_-30px_rgba(10,37,64,0.45)] ring-1 ring-[#0a2540]/[0.10] dark:bg-[#111827] dark:ring-white/10"
                    style={{ aspectRatio: "1180 / 820" }}
                  >
                    {/* `h-full` + le rapport natif de la scène : la boîte
                        interne remplit la hauteur du cadre et déborde à droite,
                        où le cadre la tranche. Aucun nombre magique : la
                        largeur se déduit du rapport. */}
                    <div className="absolute left-0 top-0 h-full" style={{ aspectRatio: "1180 / 720" }}>
                      <OraAppScene chips="none" />
                    </div>
                  </div>

                  {/* La vidéo dans le cadre du site : coins arrondis, liseré
                      fin, ombre basse — le même habillage que le clip
                      d'AutomationTabs, pour que les deux se lisent comme le
                      même objet à deux endroits.
                      ⚠ POSTER OBLIGATOIRE. `preload="metadata"` ne charge que
                      l'en-tête : sans image d'attente le cadre reste NOIR le
                      temps que la vidéo arrive, et c'est le premier écran, sur
                      fond blanc. */}
                  <div
                    className="relative overflow-hidden rounded-[14px] bg-black shadow-[0_24px_60px_-30px_rgba(10,37,64,0.45)] ring-1 ring-[#0a2540]/[0.10] dark:ring-white/10"
                    style={{ aspectRatio: "1180 / 820" }}
                  >
                    <InViewVideo
                      src={HERO_VIDEO}
                      poster="/posters/ora-1.jpg"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LE CADENCEUR (client 2026-08-13) ─────────────────────────────
            Il ne contient QUE la scène épinglée : la progression 0→1 du
            moteur démarre pile à l'épinglage, quel que soit le nombre de
            lignes du titre au-dessus. 300 vh hors démo, soit 200 vh de
            course : ~20 vh de battement (la notification d'invitation),
            ~88 vh de dézoom, le reste en traversée du mur — les fractions
            DZ_START / DZ_END / TRAV_START se lisent sur CETTE course.
            800 vh dès que la démo est lancée, comme avant. */}
        {/* ⚠ LE `-mt-10` REMONTE LA RÉPLIQUE SANS TOUCHER À L'ÉPINGLAGE (client
            2026-08-14 : « remonte un peu la réplication du logiciel, il faut
            qu'il y ait moins d'espace entre la réplication et Testez Ora sur
            vos fichiers »). Mesuré avant : 109 px entre le bas de la ligne de
            réassurance et le haut de la scène, dont 88 de rembourrage haut de
            la boîte collante.
            CE REMBOURRAGE NE PEUT PAS BAISSER : c'est lui qui dégage la barre
            de navigation (68 px mesurés) quand la scène est épinglée, il ne
            reste que 20 px de garde. La marge négative agit ailleurs : elle
            remonte LA PISTE, donc l'état AVANT épinglage, et laisse l'état
            épinglé — `sticky top-0` plus les 88 px — au pixel près où il
            était. L'écart tombe à ~69 px. */}
        {/* ══ LE DÉZOOM AU DÉFILEMENT NE SE MONTE PLUS ══════════════════════
            Client 2026-08-28 : « supprime l'animation de dézoom au scroll qui
            fait que l'on voit plein d'encadrés ».

            CE QUI PART AVEC, et il faut le savoir avant de trancher : ce bloc
            ne portait pas que le dézoom. Il portait toute la scène épinglée —
            le classeur Excel avec l'onglet Ora, la vue à deux volets, la
            réplique du logiciel, PUIS le recul sur le mur de onze panneaux —
            plus la bande de légendes, le bouton « Lancer la démo » et
            l'indicateur de défilement. Le dézoom est le mouvement qui relie
            tout ça ; sans lui la scène n'a plus d'arc, et son écran d'arrivée
            (la réplique) est désormais dans le hero, à trois cents pixels
            au-dessus. Le tout descend donc ensemble.

            ⚠ MASQUÉ, PAS SUPPRIMÉ, et c'est le patron déjà en usage dans ce
            dépôt (le carrousel à onglets d'AtlasShowcase dort derrière un
            `false &&` depuis le 2026-08-05). Sept cents lignes de JSX et un
            moteur de défilement réglé au fil de six semaines ne se rejettent
            pas sur une passe de mise en page : les effets voient leurs refs à
            `null` et sortent immédiatement, le coût à l'exécution est nul, et
            la remise en route tient dans un seul mot.
            POUR LE RÉTABLIR : passer DEZOOM_AU_SCROLL à `true`. */}
        {DEZOOM_AU_SCROLL && (
        <>
        <div ref={rideRef} className={`relative md:-mt-10 ${demoOn ? "md:h-[800vh]" : "md:h-[300vh]"}`}>
        {/* `pb` réduit (client 2026-07-30) : descend la bande des légendes d'une
            quinzaine de pixels de plus, sans toucher l'indicateur de défilement
            qui reste ancré à 10 px du bas. */}
        {/* Retrait haut ramené de 112 à 88 px : c'est lui qui dégage la barre
            de navigation (68 px de haut, mesurés) quand la scène est épinglée,
            il ne peut donc pas descendre beaucoup plus bas — 88 laisse 20 px
            de garde. Le reste du vide venait de la marge basse du titre,
            passée à zéro juste au-dessus. */}
        <div ref={stickyRef} className="hd-sticky sticky top-0 flex h-screen flex-col overflow-hidden px-6 md:px-12 pt-20 md:pt-[88px] pb-10 md:pb-12">
          {/* Soft overhead light — dark mode only */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden dark:block"
            style={{ background: "radial-gradient(56% 44% at 50% -8%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.055) 40%, transparent 70%)" }}
          />

          {/* Stage (auto-fitted 1040×640 scene) */}
          {/* DEUX COUCHES SÉPARÉES : la boîte extérieure appartient au moteur
              de scroll (il la mesure et écrit son marginTop), la couche
              .hd-stagerise porte l'animation d'arrivée « bas vers le haut ».
              Un transform posé directement sur .hd-stagebox décalerait les
              mesures de cadrage. */}
          <div ref={boxRef} className="hd-stagebox relative z-10">
          <div className="hd-stagerise">
            <div ref={stageRef} className="hd-stage">
              <div className="hd-blob" />

              {/* ══ OUVERTURE : l'interface du logiciel Ora (client
                  2026-07-29). Elle occupe la scène au repos, puis s'efface
                  pour laisser le duo Excel + panneau dérouler le récit.
                  Posée dans le repère de la scène (1040×640) pour suivre
                  exactement la même mise à l'échelle que le reste. ══ */}
              <div
                data-hd="appscene"
                style={{
                  position: "absolute",
                  left: APP_LEFT,
                  top: APP_TOP,
                  width: APP_W,
                  height: APP_H,
                  zIndex: 6,
                  transformOrigin: "center center",
                }}
              >
                <OraAppScene />
              </div>

              {/* Repère de clic sur la carte « Ouvrir un fichier » : sans lui, le
                  sélecteur surgissait sans qu'on comprenne ce qui l'a déclenché.
                  Refait (client 2026-08-01 : « ce design de clic ne rend pas
                  bien », et surtout : ne pas toucher au design de la carte).
                  L'ancienne version posait un voile BLANC sur toute la carte
                  (opacité .34), un anneau blanc de 3 px et un halo bleu diffus
                  de 34 px : le bouton se délavait, son dégradé disparaissait et
                  l'ensemble ressemblait à une sélection ratée. Il ne reste qu'un
                  contour blanc fin, à l'INTÉRIEUR du tracé de la carte : aucun
                  voile, aucun halo qui déborde, donc les couleurs de la carte
                  sont intactes. */}
              <div
                data-hd="openflash"
                style={{
                  position: "absolute",
                  left: OPEN_CARD.left, top: OPEN_CARD.top,
                  width: OPEN_CARD.width, height: OPEN_CARD.height,
                  borderRadius: 9, zIndex: 7, opacity: 0, pointerEvents: "none",
                  boxShadow: "inset 0 0 0 2px rgba(255,255,255,.85)",
                }}
              />

              {/* ══ Sélecteur de fichier : il s'ouvre au clic sur « Ouvrir un
                  fichier » et c'est LUI qui explique le passage du logiciel à
                  Excel (client 2026-07-29). Placé dans le repère de la scène
                  (et non dans OraAppScene) pour que ses coordonnées soient
                  directement pilotables. ══ */}
              <div
                data-hd="pickveil"
                style={{
                  position: "absolute",
                  left: APP_LEFT, top: APP_TOP, width: APP_W, height: APP_H,
                  background: "rgba(15,23,42,1)", opacity: 0, zIndex: 7,
                  borderRadius: 14, pointerEvents: "none",
                }}
              />
              <div className="hd-picker" data-hd="picker">
                <div className="hd-pkhead">
                  <span className="hd-pkdots"><i /><i /><i /></span>
                  {t({ fr: "Choisir un fichier", en: "Choose a file" })}
                </div>
                <div className="hd-pkpath">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>
                  {t({ fr: "Dossiers clients", en: "Client folders" })}
                </div>
                {[
                  { n: "Balance_2025.xlsx", m: "412 Ko" },
                  // Un FEC est un fichier TEXTE, pas un classeur : l'extension
                  // .xlsx était une erreur métier (client 2026-07-30).
                  { n: "FEC_demo_2024_398k_lignes.txt", m: "18,4 Mo", sel: true },
                  { n: "Grand_livre_juin.xlsx", m: "2,1 Mo" },
                ].map((f) => (
                  <div
                    key={f.n}
                    className="hd-pkrow"
                    {...(f.sel ? { "data-hd": "pickrow" } : {})}
                  >
                    <span className="ic">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                    </span>
                    <b>{f.n}</b>
                    <span className="sz">{f.m}</span>
                  </div>
                ))}
                <div className="hd-pkfoot">
                  <span className="hd-pkcancel">{t({ fr: "Annuler", en: "Cancel" })}</span>
                  <span className="hd-pkok">{t({ fr: "Ouvrir", en: "Open" })}</span>
                </div>
              </div>

              {/* ══ Real Excel — the FEC workbook. Starts CENTRED (layout
                  left:210 so the measured Ora-tab click target matches the
                  untransformed position), then slides -194px to its dual-view
                  slot (left:16) when the panel docks. ══ */}
              <div className="hd-win hd-xw" data-hd="excel1" style={{ left: 210 }}>
                <XChrome name="FEC_demo_2024_398k_lignes" cell="N8" formula="" oraTarget />
                <div className="hd-xsheet">
                  <div className="hd-xgrid" style={{ gridTemplateColumns: FEC_GRID }}>
                    <div className="hd-xL" />
                    {FEC_COLS.map((_, i) => (
                      <div key={`L${i}`} className="hd-xL">{String.fromCharCode(65 + i)}</div>
                    ))}
                    <div className="hd-xN">1</div>
                    {FEC_COLS.map((h) => (
                      <div key={h} className="hd-xH">{h}</div>
                    ))}
                    {FEC_ROWS.map((row, r) => (
                      <div key={r} style={{ display: "contents" }}>
                        <div className="hd-xN">{r + 2}</div>
                        {row.map((cell, ci) => (
                          <div key={ci} className={`hd-xC${ci >= 7 ? " num" : ""}${r === 1 && ci === 8 ? " sel" : ""}`}>{cell}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hd-xtabs">
                  <span className="hd-xtab on">Sheet1</span>
                  <span className="hd-xtabplus">+</span>
                </div>
                <div className="hd-xstatus">Prêt · Accessibilité : vérification terminée<span className="z">100 %</span></div>
              </div>

              {/* ══ Real Excel — the generated AUDIT workbook (same slot) ══ */}
              <div className="hd-win hd-xw hd-xw2" data-hd="excel2" data-cur="result">
                <div className="hd-xwglow" data-hd="xwglow" />
                <XChrome name="FEC 2025 - studio.xlsx" cell="A1" formula="Balance générale · Exercice 2025" />
                <div className="hd-xsheet">
                  {/* Sheet 0 · Balance générale (real data) */}
                  <TableSheet
                    sheet={0} title="Balance générale · Exercice 2025" meta={BG_META}
                    cols={BG_COLS} rows={BG_ROWS} total={BG_TOTAL} firstNum={2}
                    gridCols="20px .62fr 2.1fr 1fr 1fr 1fr 1fr"
                  />
                  {/* Sheet 1 · Balance mensuelle — embedded bar chart */}
                  <div className="hd-xmonth hd-hidden" data-sheet={1}>
                    <div className="hd-xmtitle">
                      <span>Balance mensuelle · Exercice 2025</span>
                      <span className="meta">Mouvements par mois (k€)</span>
                    </div>
                    <div className="hd-xmbody">
                      <div className="hd-xmtable">
                        <div className="r h"><span>Mois</span><span className="num">Débit</span><span className="num">Crédit</span></div>
                        {BM_MONTHS.map((m, i) => (
                          <div className="r" key={m}><span>{m}</span><span className="num">{BM_DEBIT[i]}</span><span className="num">{BM_CREDIT[i]}</span></div>
                        ))}
                      </div>
                      <div className="hd-xmchart">
                        <div className="ct">Débit / Crédit par mois</div>
                        <svg viewBox="0 0 244 108" preserveAspectRatio="none">
                          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                            <line key={g} x1="0" x2="244" y1={98 - g * 90} y2={98 - g * 90} stroke="#eef0f2" strokeWidth="0.7" />
                          ))}
                          {BM_MONTHS.map((m, i) => {
                            const gx = i * 20 + 4;
                            const dh = (BM_DEBIT[i] / BM_MAX) * 90;
                            const ch = (BM_CREDIT[i] / BM_MAX) * 90;
                            return (
                              <g key={m}>
                                <rect x={gx} y={98 - dh} width="6.4" height={dh} fill="#4a86d6" />
                                <rect x={gx + 7.2} y={98 - ch} width="6.4" height={ch} fill="#2bb3a3" />
                                <text x={gx + 6.8} y="106" fontSize="3.6" textAnchor="middle" fill="#9098a2">{m}</text>
                              </g>
                            );
                          })}
                          <line x1="0" y1="98" x2="244" y2="98" stroke="#c9c9c9" strokeWidth="0.8" />
                        </svg>
                        <div className="hd-xmleg">
                          <span><i style={{ background: "#4a86d6" }} />Débit</span>
                          <span><i style={{ background: "#2bb3a3" }} />Crédit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Sheet 2 · Balance âgée (real data) */}
                  <TableSheet
                    sheet={2} hidden title="Balance âgée · créances clients (411)" meta={BA_META}
                    cols={BA_COLS} rows={BA_ROWS} total={BA_TOTAL} firstNum={2}
                    gridCols="20px .7fr 1.5fr 1fr 1fr .9fr .9fr .9fr .9fr"
                  />
                </div>
                <div className="hd-xtabs">
                  <span className="hd-xtabplus">+</span>
                  <span className="hd-xtab">FEC 2025</span>
                  <span className="hd-xtab">Paramètres</span>
                  <span className="hd-xtab">Contrôles</span>
                  <span className="hd-xtab on" data-xtab={0}>Balance générale</span>
                  <span className="hd-xtab" data-xtab={1} data-cur="tab2">Balance mensuelle</span>
                  <span className="hd-xtab">Balance journaux</span>
                  <span className="hd-xtab">Auxiliaires</span>
                  <span className="hd-xtab" data-xtab={2} data-cur="tab3">Balance âgée</span>
                </div>
                <div className="hd-xstatus">Prêt<span className="z">100 %</span></div>
              </div>

              {/* ══ Docked Ora panel (right, dual view) ══ */}
              <div className="hd-win hd-panel" data-hd="panel">
                <div className="hd-titlebar">
                  <div className="hd-lights"><span className="r" /><span className="y" /><span className="g" /></div>
                  <div className="hd-tbtitle">Ora</div>
                </div>
                <div className="hd-ptop">
                  <span className="t">Atlas</span>
                  <div className="hd-pills"><span className="hd-avatar">R</span></div>
                </div>
                <div className="hd-tabsbar">
                  <span className="hd-tabslabel">Classeurs ouverts</span>
                  <span className="hd-tab on">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /></svg>
                    FEC_demo_2024_398k_li…
                  </span>
                  <span className="hd-tab off">Ora_Prospects_…</span>
                </div>
                <div className="hd-pbody">
                  <div className="hd-back">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Dossier Client ABCD
                    <span className="hd-backicons">
                      <span className="hd-iconbtn">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></svg>
                      </span>
                      <span className="hd-iconbtn">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                      </span>
                    </span>
                  </div>
                  <div className="hd-filehead">
                    <span className="hd-fico x" style={{ width: 26, height: 26, fontSize: 7.5 }}>XLSX</span>
                    <div>
                      <div className="nm">FEC_demo_2024_398k_lignes (2)</div>
                      <div className="mt">
                        XLSX
                        <span className="hd-badge-todo"><span className="dot" />À faire</span>
                        <span className="hd-badge-ok">
                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          Approuvé
                        </span>
                      </div>
                    </div>
                    <span className="hd-fileicons">
                      <span className="hd-iconbtn" style={{ width: 20, height: 20, color: "#6b7280" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 3" /></svg>
                      </span>
                      <span className="hd-iconbtn" style={{ width: 20, height: 20, color: "#6b7280" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></svg>
                      </span>
                    </span>
                  </div>
                  <div className="hd-sendrow">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /></svg>
                    <span className="lbl">Ce classeur : <b>FEC_demo_2024_398k_lignes (2)</b></span>
                    <span className="hd-sendbtn">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
                      Envoyer
                    </span>
                  </div>
                  <div className="hd-chips">
                    <span className="hd-chip">☆ Favoris <span className="n">0</span></span>
                    <span className="hd-chip">Qualité <span className="n">11</span></span>
                    <span className="hd-chip">Audit <span className="n">12</span></span>
                    <span className="hd-chip">Finance <span className="n">7</span></span>
                    <span className="hd-chip">Export <span className="n">3</span></span>
                  </div>
                  <div className="hd-search">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
                    Rechercher une automatisation…
                  </div>
                  <div className="hd-sugglabel">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" /></svg>
                    Suggestions pour ce fichier
                  </div>
                  <div className="hd-hero-sugg">
                    <span className="hd-playic blue">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">FEC Studio — le dossier d'audit à la carte</div>
                      <div className="r">Déjà utilisée sur ce fichier</div>
                    </div>
                    <span className="hd-lancer" data-cur="lancerfec">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                      Lancer
                      <span className="hd-flash" data-hd="fec-flash" />
                    </span>
                  </div>
                  <div className="hd-hero-sugg">
                    <span className="hd-playic purple">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Balance âgée 30/60/90</div>
                      <div className="r">Correspond aux colonnes détectées</div>
                    </div>
                    <span className="hd-lancer">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                      Lancer
                    </span>
                  </div>
                  <div className="hd-hero-sugg">
                    <span className="hd-playic green">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Agréger des fichiers identiques</div>
                      <div className="r">Correspond aux colonnes détectées</div>
                    </div>
                    <span className="hd-lancer">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                      Lancer
                    </span>
                  </div>
                  <div className="hd-sugg">
                    <span className="hd-playic purple">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Balance âgée 30/60/90 <span className="hd-tag finance">Finance</span></div>
                      <div className="d">Ventile les encours par ancienneté et par tiers à partir des échéances.</div>
                    </div>
                    <span className="hd-rowactions">
                      <span className="hd-star">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></svg>
                      </span>
                      <span className="hd-lancer">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                        Lancer
                      </span>
                    </span>
                  </div>
                  <div className="hd-sugg">
                    <span className="hd-playic green">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Agréger des fichiers identiques <span className="hd-tag qualite">Qualité</span></div>
                      <div className="d">Empile des fichiers de même structure en un seul tableau, avec la trace du fichier…</div>
                    </div>
                    <span className="hd-rowactions">
                      <span className="hd-star">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></svg>
                      </span>
                      <span className="hd-lancer">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                        Lancer
                      </span>
                    </span>
                  </div>
                  <div className="hd-sugg">
                    <span className="hd-playic green">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Anonymiser des colonnes <span className="hd-tag qualite">Qualité</span></div>
                      <div className="d">Remplace les données nominatives par des pseudonymes stables avant de partager un…</div>
                    </div>
                    <span className="hd-rowactions">
                      <span className="hd-star">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></svg>
                      </span>
                      <span className="hd-lancer">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                        Lancer
                      </span>
                    </span>
                  </div>
                  <div className="hd-sugg">
                    <span className="hd-playic blue">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">Tests sur le journal <span className="hd-tag audit">Audit</span></div>
                      <div className="d">Batterie de revue d'écritures : week-end, montants ronds, fin de période.</div>
                    </div>
                    <span className="hd-rowactions">
                      <span className="hd-star">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></svg>
                      </span>
                      <span className="hd-lancer">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                        Lancer
                      </span>
                    </span>
                  </div>

                  {/* FEC Studio config modal — replica of the real app dialog */}
                  <div className="hd-modal" data-hd="modal" data-cur="modalc" style={{ top: 12 }}>
                    <div className="hd-mhead">
                      <span className="ic">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" /></svg>
                      </span>
                      <div>
                        <div className="t">FEC Studio — le dossier d'audit à la carte</div>
                        <div className="s">Renseignez les paramètres avant de lancer.</div>
                      </div>
                      <span className="x">✕</span>
                    </div>
                    <div className="hd-mprofiles">
                      <span className="hd-mprofile">🕘 Dernière config</span>
                      <span className="hd-mprofile b">💾 Enregistrer ce profil</span>
                    </div>
                    <div className="hd-msec"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg> Mission</div>
                    <div className="hd-mfieldlabel">Seuil de signification de la mission (€)</div>
                    <div className="hd-minput">
                      vide = suggestion NEP-320 (0,5 % du CA) — propagé à la revue…
                      <span className="stp">
                        <svg width="7" height="11" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4-4 4 4M2 13l4 4 4-4" /></svg>
                      </span>
                    </div>
                    <div className="hd-msec">Contrôles</div>
                    <div className="hd-mrow">
                      <span className="l">Contrôles du FEC</span>
                      <span className="hd-toggle"><span className="track" /><span className="knob" /></span>
                    </div>
                    <div className="hd-msec"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg> Balances <span className="link">Tout cocher</span></div>
                    <div className="hd-mrow">
                      <span className="l">Balance générale</span>
                      <span className="hd-toggle" data-cur="tg1"><span className="track" data-hd="tg1-track" /><span className="knob" data-hd="tg1-knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">Balance mensuelle</span>
                      <span className="hd-toggle" data-cur="tg2"><span className="track" data-hd="tg2-track" /><span className="knob" data-hd="tg2-knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">Balance par journal</span>
                      <span className="hd-toggle"><span className="track" /><span className="knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">Auxiliaires clients &amp; fournisseurs</span>
                      <span className="hd-toggle"><span className="track" /><span className="knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">Balance âgée (créances &amp; dettes)</span>
                      <span className="hd-toggle" data-cur="tg3"><span className="track" data-hd="tg3-track" /><span className="knob" data-hd="tg3-knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">À-nouveaux</span>
                      <span className="hd-toggle"><span className="track" /><span className="knob" /></span>
                    </div>
                    <div className="hd-mrow">
                      <span className="l">Comparatif N / N-1</span>
                      <span className="hd-toggle"><span className="track" /><span className="knob" /></span>
                    </div>
                    <div className="hd-mfoot">
                      <span className="hd-mcancel">Annuler</span>
                      <span className="hd-mrun" data-cur="run">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
                        Lancer maintenant
                        <span className="hd-flash" data-hd="run-flash" />
                      </span>
                    </div>
                  </div>

                  {/* Loading popup — FEC Studio, 4 steps filling in sequence
                      (Préparation → Récupération → Exécution → Enregistrement),
                      each with a dot (running) that becomes a check (done). */}
                  <div className="hd-loading" data-hd="loading" data-cur="loadc">
                    <div className="lgwrap"><img src="/logos/icon-color.png" alt="" /></div>
                    <div className="t">FEC Studio — le dossier d'audit à la carte</div>
                    {["Préparation", "Récupération du fichier", "Exécution", "Enregistrement"].map((label, i) => (
                      <div className="step" key={i} data-loadstep={i}>
                        <div className="head">
                          <span className="ic">
                            <span className="ck">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            </span>
                            <span className="dt" />
                          </span>
                          <span className="lbl">{label}</span>
                        </div>
                        <div className="bar"><span className="barfill" /></div>
                      </div>
                    ))}
                    <div className="cancel">✕ Annuler</div>
                  </div>
                </div>
                {/* JOURNAL */}
                <div className="hd-journal">
                  <div className="hd-jhead">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 17l6-6-6-6M12 19h8" /></svg>
                    Journal
                    <span className="st">· <span data-hd="jcount">0</span></span>
                    <span className="st" data-hd="jstatus">Prêt.</span>
                    <span className="chev">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                    </span>
                  </div>
                  <div className="hd-jlines">
                    {J_LINES.map((line, i) => (
                      <div key={i} className="hd-jline" data-jline={i}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generated-file pill */}
              <div className="hd-pill" data-hd="pill">
                <span className="fico">XLSX</span>
                <div>
                  <div className="t1">FEC 2025 - studio.xlsx</div>
                  <div className="t2">Généré par Ora · 7 feuilles</div>
                </div>
              </div>

              {/* Click ripple (feedback pulse at each click point) */}
              <div className="hd-ripple" data-hd="ripple" />

              {/* Cursor */}
              <svg className="hd-cursor" data-hd="cursor" viewBox="0 0 32 32">
                <path d="M9 4 L9 27 L14.6 21.6 L18 29.4 L22.4 27.4 L19 19.8 L26.6 19.8 Z" fill="#0b0b0f" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          </div>

          {/* ── LA GRILLE DU MUR (dézoom, 2026-08-08) ──
              Rendue en PERMANENCE, comme la notification : visibilité et
              géométrie sont écrites par le moteur image par image, jamais par
              un rendu React. Elle vit dans le sticky et non dans la scène —
              la scène porte l'échelle de la réplique, la grille reçoit la
              sienne. La cellule marquée wall-hole est le TROU : vide, aux
              proportions exactes de la fenêtre applicative, c'est la réplique
              VIVANTE qui vient s'y loger — le mur n'a donc jamais deux
              exemplaires animés du même écran côte à côte. Les exemplaires
              INTERACTIFS des panneaux restent ceux des cartes de StackingCards
              plus bas ; ceux-ci sont le mur. */}
          {/* GRILLE 3 × 3 ALIGNÉE depuis le 2026-08-08 au soir (client, capture
              monday à l'appui : « trois colonnes avec trois lignes, suis
              exactement l'organisation ») : neuf cellules en ordre de lecture,
              hauts de cartes alignés par ligne, aucun décalage — la version à
              cinq colonnes étagées a été jugée « le bazar absolu ». Le TROU est
              la cellule centrale, ligne 2 colonne 2, là où la réplique vivante
              atterrit. Aucun design n'est le voisin de son double, en ligne
              comme en colonne.
              Toutes les cellules sont en `still` : l'entrée au scroll ne peut
              pas fonctionner dans une scène épinglée (cellules restées
              invisibles chez le client), et neuf instances mesurantes
              coûteraient neuf lectures de mise en page par image. */}
          {/* ── LA RANGÉE DE QUEUE (client 2026-08-09) ──
              « On n'a qu'un encadré flouté, celui du milieu ; il faudrait la
              même chose sur les côtés. » Mesuré avant d'y toucher : le fondu du
              bas (.hd-bottomfade, 150 px) commençait EXACTEMENT là où les
              colonnes latérales s'arrêtaient — bas de leur dernière carte à
              529 px, haut du fondu à 530 px à la libération de l'épinglage —
              pendant que la colonne centrale, elle, le traversait de 318 px.
              Les côtés ne se dissolvaient donc pas : ils butaient net sur la
              ligne du fondu. D'où ces deux cellules SUPPLÉMENTAIRES, placées
              explicitement en colonnes 1 et 3 : leur haut tombe 27 px sous le
              début du fondu, contre 19 px pour la carte du milieu — les trois
              colonnes se dissolvent désormais au même endroit.
              Deux maquettes CLAIRES, comme celle du milieu : une carte sombre
              coupée par un fondu vers le blanc laisserait une barre franche.
              LES DOUBLONS SONT PARTIS (client 2026-08-18 : « des encadrés plus
              représentatifs de ce que fait le logiciel actuellement »). La
              queue répétait bilan et prévisionnel, déjà présents deux rangées
              plus haut dans les mêmes colonnes — c'était visible sur la
              capture du client. Deux panneaux d'EXÉCUTION sont entrés au mur
              (« Génération du livrable », « Extraction de relevés ») : fichier
              déposé, étapes horodatées, livrable en sortie. Le premier prend
              la TÊTE du mur (voir son commentaire) puisque la queue, à moitié
              dissoute par le fondu, ne montre jamais un panneau en entier ;
              la queue reçoit bilan et extraction. Les règles tiennent
              toujours : aucun sujet n'a son double pour voisin en ligne ni en
              colonne, et les deux cellules de queue sont claires, condition
              du fondu ci-dessus.
              ⚠ La rangée est EXCLUE du calcul de `travel` dans fit() : sans
              cela la grille plus haute allongeait d'autant la course des
              latérales, qui remontaient simplement plus loin — la queue serait
              sortie par le haut et rien n'aurait changé en bas. */}
          {/* ⚠ SEPT SUJETS AU LIEU DE TROIS (client 2026-08-15 : « des encadrés
              plus représentatifs de ce que l'on fait maintenant »). Le mur
              répétait sept fois deux panneaux, le bilan développé et une
              automatisation sur mesure, alors que la section à onglets en
              annonce six trois écrans plus bas. Les quatre manquants sont
              maintenant là — prévisionnel, évaluation, changement de structure,
              contrôles et suivi — dans le même gabarit et les mêmes couleurs
              (voir le pavé de CONTENUS dans AppTablePanel.tsx).
              LES TROIS RÈGLES DE PLACEMENT SONT INTACTES, et elles ne sont pas
              esthétiques : aucun panneau n'a son double pour voisin en ligne ni
              en colonne (deux jumeaux côte à côte se lisent comme un bogue de
              rendu) ; la rangée de queue reste CLAIRE, parce que le fondu du bas
              trancherait net sur un panneau noir ; et le trou garde sa place au
              centre, c'est lui qui reçoit la réplique vivante. */}
          <div data-hd="wall-grid" aria-hidden className="hd-wallgrid hidden md:grid">
            {/* « execution » EN TÊTE DE MUR et non en queue : la queue vit dans
                le fondu du bas, un panneau n'y est jamais vu qu'à moitié
                dissous. Or c'est LE panneau qui montre le logiciel en train de
                travailler — il prend la première cellule lue au dézoom. Le
                bilan descend en queue sans rien perdre : sa version complète
                et interactive est la carte « Des chiffres exacts » de
                StackingCards, trois écrans plus bas. */}
            <div className="hd-wallcell" data-col="0"><AppTablePanel variant="execution" still /></div>
            <div className="hd-wallcell" data-col="1"><AppTablePanel variant="surmesure" tone="dark" still /></div>
            <div className="hd-wallcell" data-col="2"><OraHomeMockup still /></div>
            <div className="hd-wallcell" data-col="0"><AppTablePanel variant="previsionnel" still /></div>
            <div data-hd="wall-hole" className="hd-wallcell" data-col="1" />
            <div className="hd-wallcell" data-col="2"><AppTablePanel variant="evaluation" tone="dark" still /></div>
            <div className="hd-wallcell" data-col="0"><AppTablePanel variant="controles" tone="dark" still /></div>
            <div className="hd-wallcell" data-col="1"><OraHomeMockup still /></div>
            <div className="hd-wallcell" data-col="2"><AppTablePanel variant="structure" still /></div>
            <div className="hd-wallcell tail" data-col="0" style={{ gridRow: 4, gridColumn: 1 }}>
              <AppTablePanel variant="bilan" still />
            </div>
            <div className="hd-wallcell tail" data-col="2" style={{ gridRow: 4, gridColumn: 3 }}>
              <AppTablePanel variant="extraction" still />
            </div>
          </div>

          {/* Step captions */}
          <div ref={capsRef} className="relative z-10 h-10 md:h-12 flex-shrink-0">
            {[
              t({ fr: "Ora s'ouvre à côté de votre classeur, dans Excel", en: "Ora opens beside your workbook, inside Excel" }),
              t({ fr: "Configurez FEC Studio en deux clics", en: "Configure FEC Studio in two clicks" }),
              t({ fr: "Ora construit le dossier d'audit", en: "Ora builds the audit workbook" }),
              t({ fr: "Explorez votre classeur, feuille par feuille", en: "Browse your workbook, sheet by sheet" }),
            ].map((label, i) => (
              <div key={i} className="hd-cap" style={{ opacity: i === 0 ? 1 : 0 }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/[0.06] ring-1 ring-gray-900/10 text-[13px] font-inter font-semibold text-gray-800 dark:bg-white/10 dark:ring-white/20 dark:text-white">{i + 1}</span>
                <span className="font-inter text-[15px] md:text-lg text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Scroll cue — PERSISTENT: chevron + demo progress bar, so the user
              understands the whole animation is driven by scrolling. */}
          {/* Fondu du bas de la scène : supprime la ligne de coupe du rond et de
              l'ombre sur le bord bas du bloc épinglé. Uniquement hors récit. */}
          {!demoOn && <div aria-hidden className="hd-bottomfade" />}

          {/* Notification d'invitation. Rendue en PERMANENCE : sa visibilité et
              sa position sont écrites par le moteur, ce qui évite un rendu React
              à chaque image de scroll. */}
          <div ref={inviteRef} data-hd="invite" className="hd-invanchor">
            <button
              type="button"
              onClick={() => setDemoOn(true)}
              className="hd-invite font-inter"
              aria-label={t({ fr: "Lancer la démonstration au défilement", en: "Start the scroll-driven demo" })}
            >
              <span className="ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7-11-7z" />
                </svg>
              </span>
              <span>
                <b>{t({ fr: "Lancer la démo", en: "Start the demo" })}</b>
                <span className="sub">{t({ fr: "Ora se pilote au défilement", en: "Ora drives itself as you scroll" })}</span>
              </span>
              <span className="go">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </button>
          </div>

          <div ref={hintRef} className={`hd-scrollcue pointer-events-none font-inter${demoOn ? "" : " off"}`}>
            <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            <span className="txt">{t({ fr: "Faites défiler", en: "Scroll" })}</span>
            <span className="track"><span className="fill" data-hd="cuefill" /></span>
          </div>
        </div>
        </div>
        </>
        )}
      </div>

      {/* ⚠ CET APPEL PART AVEC LA DÉMO, et pour une raison de rôle, pas de
          place : il est né « after the demo releases » — c'est la phrase même
          de son pavé d'origine, conservé ci-dessous. Il fermait les huit
          écrans de défilement de la scène épinglée en redonnant le bouton au
          lecteur qui venait de tout regarder.
          La démo éteinte, il n'a plus rien à fermer : il tombe à deux cents
          pixels sous le bouton du hero, mot pour mot le même libellé et la
          même couleur. Deux fois le même appel à un demi-écran d'intervalle,
          c'est le défaut de « deux CTA qui se disputent » relevé à l'audit du
          2026-08-15, en pire — ils ne se disputent même pas, ils se répètent.
          Il suit donc le même interrupteur : si la démo revient, il revient. */}
      {DEZOOM_AU_SCROLL && (
      <>
      {/* CTA — after the demo releases. FOND CLAIR (client 2026-08-11) : ce
          conteneur était un bandeau noir permanent, dont le seul rôle était
          d'enchaîner sans couture sur ExcelReveal, alors elle-même toujours
          noire, juste en dessous (historique dans App.tsx, au point d'où
          ExcelReveal a été retiré). ExcelReveal a disparu, la section
          suivante est claire (« Concrètement, ce qu'Ora peut automatiser ») :
          le bandeau suit donc le fond de la SECTION HERO elle-même (blanc en
          clair, noir en sombre), au lieu d'imposer sa propre couleur. Seul le
          bouton anime son entrée.
          `hidden md:flex` : sur mobile OraHeroMobile porte déjà son propre
          bouton de réservation. */}
      <div className="relative z-10 bg-white dark:bg-black pt-10 md:pt-12 pb-16 md:pb-24 px-6 md:px-12 hidden md:flex justify-center">
        <motion.button
          onClick={openBooking}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 24, mass: 0.6 }}
          className="group inline-flex items-center gap-3 px-12 py-6 rounded-full text-lg md:text-xl font-inter font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_18px_55px_rgba(59,130,246,0.6)] transition-[background-color,box-shadow] duration-300 ease-out"
        >
          {t({ fr: "Réserver un appel", en: "Book a call" })}
          <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </motion.button>
      </div>
      </>
      )}
    </section>
  );
}
