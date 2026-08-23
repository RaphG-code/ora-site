import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";

/**
 * OraAppScene — l'interface RÉELLE du logiciel Ora, en plein cadre, comme
 * visuel de hero (client 2026-07-28, référence monday.com : « directement une
 * interface de logiciel », plus l'Excel avec l'extension à côté).
 *
 * Réplique fidèle de la capture fournie par le client (écran « Accueil ») :
 * barre latérale Ora + Navigation + carte Ora Engineering, en-tête Messages /
 * Notifications / avatar, accueil « Heureux de vous revoir », grande carte
 * bleue « Ouvrir un fichier », ACCÈS RAPIDE à trois cartes, et la liste
 * REPRENDRE avec ses badges d'état.
 *
 * Deux enrichissements par rapport à la capture, dans l'esprit du hero de
 * monday.com :
 *   · les tuiles d'icônes prennent des teintes distinctes (bleu / violet /
 *     ambre) au lieu du bleu uniforme, ce qui donne le relief coloré ;
 *   · des pastilles flottantes racontent l'histoire ENTRÉE → SORTIE : un
 *     fichier .xlsx entre dans l'application, puis les livrables générés
 *     apparaissent un par un. C'est ce qui fait comprendre en trois secondes
 *     qu'on dépose un Excel et qu'Ora en produit quelque chose.
 *
 * Même patron que les autres visuels du site : scène fixe de 1180×720 mise à
 * l'échelle par un ResizeObserver, classes préfixées `.oa-`.
 */

const W = 1180, H = 720;
/** Proportions RÉELLEMENT peintes par la fenêtre (.oa-win remplit la scène).
 *  Exporté parce que le mur du dézoom d'OraHeroDemo doit tailler le trou de la
 *  réplique à ces proportions-là : il le taillait sur la boîte hôte (730 x 512,
 *  APP_W x APP_H), plus haute que la fenêtre, ce qui laissait 39 px de vide
 *  sous elle et la faisait paraître plus petite que ses voisines du mur. */
export const OA_ASPECT = H / W;

/** ACCÈS RAPIDE — les MODULES RÉELS du logiciel, relevés un par un sur la
 *  capture de l'application. Rien d'inventé : libellés, sous-titres, couleurs
 *  d'icône et ORDRE viennent de l'écran d'accueil réel.
 *
 *  PASSÉ DE SIX À DOUZE le 2026-08-12, sur une nouvelle capture (client :
 *  « recopie pour la réplication du logiciel le second screen »). Douze tuiles
 *  remplissent exactement les quatre rangs que laisse la fenêtre de 720 px une
 *  fois posés l'en-tête, la salutation et les deux cartes bleues, comme sur la
 *  capture. La liste « Reprendre » qui suivait est partie avec : elle n'est
 *  plus à l'écran dans l'application, la grille occupe sa place.
 *
 *  ⚠ Ce tableau alimente AUSSI le hero de la page d'accueil, qui monte la même
 *  scène. C'est voulu : les deux endroits montrent le même logiciel. */
/* ⚠ LES TITRES SONT TRADUITS DEPUIS LE 2026-08-19 (client : « pour la partie
 *  de réplication du logiciel tout en haut, traduis les modules en anglais pour
 *  la version anglaise »). Ils étaient les DERNIERS textes français en dur de
 *  la scène : tout le reste — salutation, deux cartes bleues, encart Ora
 *  Engineering, sous-titres des douze tuiles — passait déjà par `t()`. Un
 *  visiteur anglophone lisait donc douze intitulés français au-dessus de douze
 *  sous-titres anglais, ce qui se lit comme un défaut, pas comme du bilingue.
 *
 *  LES FORMULATIONS ANGLAISES SONT REPRISES D'AILLEURS DANS LE DÉPÔT, pas
 *  réinventées : « Structure change », « Business valuation », « Budget
 *  tracking », « Detailed balance sheet », « Letters and certificates » et
 *  « Engagement letter » viennent d'AutomationTabs, « New project » et
 *  « All Atlas » de OraHeroMobile, « Property forecast » de PrevisionnelMockup.
 *  Le même module doit porter le même nom d'un bout à l'autre du site.
 *
 *  ⚠ CONTRAINTE DE LARGEUR : `.oa-qcard b` est en `nowrap` + `ellipsis`, un
 *  titre trop long est COUPÉ sans avertissement. Les douze traductions sont
 *  toutes plus courtes ou égales à leur original français (mesuré en
 *  caractères), aucune ne rallonge la tuile. « Bilan développé et SIG » devient
 *  « Detailed balance sheet » sans le SIG : le sous-titre dit déjà « how profit
 *  forms », qui est précisément ce que les SIG décrivent. */
const QUICK: {
  title: { fr: string; en: string };
  sub: { fr: string; en: string };
  tone: string;
  icon: "bank" | "swap" | "scale" | "pie" | "gauge" | "plus" | "arb" | "farm" | "penDoc" | "mission" | "bulb" | "globe";
}[] = [
  { title: { fr: "Prévisionnel immobilier", en: "Property forecast" }, sub: { fr: "Dossier banque en 5 min", en: "Bank file in 5 min" }, tone: "emerald", icon: "bank" },
  { title: { fr: "Changement de structure", en: "Structure change" }, sub: { fr: "Comparatif avant / après", en: "Before / after comparison" }, tone: "amber", icon: "swap" },
  { title: { fr: "Évaluation d'entreprise", en: "Business valuation" }, sub: { fr: "Cinq approches combinées", en: "Five combined approaches" }, tone: "rose", icon: "scale" },
  { title: { fr: "Bilan développé et SIG", en: "Detailed balance sheet" }, sub: { fr: "Le bilan et la formation du résultat", en: "The balance sheet and how profit forms" }, tone: "violet", icon: "pie" },
  { title: { fr: "Suivi budgétaire", en: "Budget tracking" }, sub: { fr: "Réalisé contre budget", en: "Actual versus budget" }, tone: "blue", icon: "gauge" },
  { title: { fr: "Arbitrages de fin d'année", en: "Year-end trade-offs" }, sub: { fr: "Prime, dividendes, ou le bon équilibre", en: "Bonus, dividends, or the right balance" }, tone: "violet", icon: "arb" },
  { title: { fr: "Prévisionnel agricole", en: "Farm forecast" }, sub: { fr: "Le plan d'exploitation, prêt pour la banque", en: "The farm plan, ready for the bank" }, tone: "emerald", icon: "farm" },
  { title: { fr: "Courriers et attestations", en: "Letters and certificates" }, sub: { fr: "CA et revenus lus dans le FEC", en: "Revenue and income read from the FEC" }, tone: "blue", icon: "penDoc" },
  { title: { fr: "Lettre de mission", en: "Engagement letter" }, sub: { fr: "Le contrat chiffré depuis les vôtres", en: "The priced engagement letter, from yours" }, tone: "amber", icon: "mission" },
  { title: { fr: "Revue d'opportunités", en: "Opportunity review" }, sub: { fr: "Aides et dispositifs 2026, chiffrés", en: "2026 schemes and grants, quantified" }, tone: "amber", icon: "bulb" },
  { title: { fr: "Nouveau projet", en: "New project" }, sub: { fr: "Deal PE, audit, M&A...", en: "PE deal, audit, M&A..." }, tone: "blue", icon: "plus" },
  { title: { fr: "Tous les Atlas", en: "All Atlas" }, sub: { fr: "Liste de vos projets", en: "All your projects" }, tone: "violet", icon: "globe" },
];

const OA_CSS = `
/* ══ Interface Ora — visuel de hero ══ */
.oa-media{position:relative;width:100%;height:100%}
.oa-stage{position:absolute;left:50%;top:0;width:${W}px;height:${H}px;transform-origin:top center;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#111827;-webkit-font-smoothing:antialiased;text-align:left}

/* Fenêtre macOS */
.oa-win{position:absolute;inset:0;border-radius:18px;overflow:hidden;background:#fff;display:flex;
  flex-direction:column;
  box-shadow:0 2px 6px rgba(15,23,42,.10),0 40px 90px -30px rgba(15,23,42,.42),0 0 0 1px rgba(15,23,42,.05)}
.oa-title{height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  background:#f7f7f8;border-bottom:1px solid #ececef;font-size:12.5px;font-weight:600;color:#3f4652}
.oa-dots{position:absolute;left:14px;top:13px;display:flex;gap:7px}
.oa-dots i{width:11px;height:11px;border-radius:50%;display:block}
.oa-body{flex:1;display:flex;min-height:0}

/* ── Barre latérale ── */
.oa-side{width:250px;flex-shrink:0;background:#fbfbfc;border-right:1px solid #eeeef1;
  display:flex;flex-direction:column;padding:18px 14px}
.oa-brand{display:flex;align-items:center;gap:8px;padding:2px 6px 20px}
.oa-brand img{height:26px;width:auto}
.oa-navlabel{font-size:9.5px;font-weight:700;letter-spacing:.11em;color:#a0a4ad;padding:0 8px 8px}
.oa-navitem{display:flex;align-items:center;gap:11px;height:40px;padding:0 10px;border-radius:9px;
  font-size:13.5px;font-weight:600;color:#5b616e;position:relative}
.oa-navitem.on{background:#eaf1ff;color:#1c60e8}
.oa-navitem.on::after{content:"";position:absolute;right:8px;top:11px;bottom:11px;width:3px;
  border-radius:2px;background:#1c60e8}
.oa-eng{margin-top:auto;border:1px solid #edeef1;border-radius:14px;padding:16px 14px;text-align:center;
  background:#fff}
.oa-eng .ic{width:38px;height:38px;border-radius:11px;margin:0 auto 10px;display:grid;place-items:center;
  background:linear-gradient(135deg,#eef2ff,#e0e7ff);color:#4f46e5}
.oa-eng b{display:block;font-size:12.5px;font-weight:700;color:#111827}
.oa-eng p{margin-top:5px;font-size:10.5px;line-height:1.5;color:#8b909b}

/* ── Colonne principale ── */
.oa-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#fdfdfb}
.oa-top{height:60px;flex-shrink:0;display:flex;align-items:center;gap:10px;padding:0 26px;
  border-bottom:1px solid #f0f0f2}
.oa-top .h{font-size:15px;font-weight:700;color:#111827;margin-right:auto}
.oa-pillbtn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:999px;
  border:1px solid #e6e7ea;background:#fff;font-size:12.5px;font-weight:600;color:#4b5160}
.oa-badge{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#2f6ff0;color:#fff;
  font-size:10px;font-weight:700;display:inline-grid;place-items:center}
.oa-avatar{width:32px;height:32px;border-radius:50%;background:#2f6ff0;color:#fff;display:grid;
  place-items:center;font-size:13px;font-weight:700}
.oa-scroll{flex:1;min-height:0;padding:26px 30px 0;overflow:hidden}
.oa-hello{font-size:29px;font-weight:700;letter-spacing:-.02em;color:#111827}
.oa-date{margin-top:5px;font-size:12.5px;color:#8b909b}

/* DEUX cartes bleues côte à côte (capture du 2026-08-12) : « Ouvrir un
   fichier » et « Assistant ». Auparavant une seule carte pleine largeur.
   ⚠ Changer cette rangée déplace la carte « Ouvrir un fichier », dont la
   géométrie est recopiée en dur dans OraHeroDemo (constante OPEN_CARD) pour y
   poser le repère de clic du curseur. Toute retouche ici impose de remesurer
   la carte .oa-open et de reporter les quatre valeurs là-bas.
   (Pas de backticks dans ce bloc : il vit dans un template literal.) */
.oa-openrow{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.oa-open{display:flex;align-items:center;gap:14px;border-radius:14px;padding:17px 18px;
  background:linear-gradient(100deg,#2f6ff0,#3f7bf5 55%,#5b8cf8);
  box-shadow:0 16px 34px -16px rgba(47,111,240,.75)}
/* La seconde carte penche vers l'indigo du lanceur d'assistant, pour que les
   deux se distinguent au premier coup d'œil sans sortir du bleu. */
.oa-open.assist{background:linear-gradient(100deg,#2b62e8,#3a6ff2 55%,#4f7df6)}
.oa-open .ic{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.22);color:#fff;
  display:grid;place-items:center;flex-shrink:0}
.oa-open .tx{min-width:0}
.oa-open b{display:block;font-size:16px;font-weight:700;color:#fff}
.oa-open span{display:block;margin-top:3px;font-size:12px;line-height:1.35;color:rgba(255,255,255,.86)}
.oa-open .arw{margin-left:auto;color:#fff;flex-shrink:0}

.oa-sec{margin-top:20px;font-size:9.5px;font-weight:700;letter-spacing:.11em;color:#a0a4ad}
/* ACCÈS RAPIDE — tuiles colorées (enrichissement monday) */
.oa-quick{margin-top:11px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.oa-qcard{display:flex;align-items:center;gap:12px;border:1px solid #eceef1;border-radius:13px;
  padding:14px 15px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.oa-qcard .ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.oa-qcard .ic.blue{background:linear-gradient(135deg,#e8f0ff,#d7e5ff);color:#2f6ff0}
.oa-qcard .ic.violet{background:linear-gradient(135deg,#f0ecfe,#e5dcfd);color:#7c53e8}
.oa-qcard .ic.amber{background:linear-gradient(135deg,#fef3e2,#fde7c8);color:#d97a06}
.oa-qcard .ic.emerald{background:linear-gradient(135deg,#e6f7ee,#d3f0e0);color:#12855a}
.oa-qcard .ic.rose{background:linear-gradient(135deg,#fdeaee,#fbd9e0);color:#d6416a}
/* Coupe à l'ellipse, comme l'application : « Changement de structure » y est
   rendu « Changement de struct... » sur la capture du client. */
.oa-qcard b{display:block;font-size:13px;font-weight:700;color:#111827;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oa-qcard span{display:block;margin-top:2px;font-size:11px;color:#8b909b;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oa-qcard .arw{margin-left:auto;color:#c3c6cd;flex-shrink:0}

/* La section REPRENDRE et ses styles (.oa-list, .oa-row, .oa-tag) sont partis
   le 2026-08-12 avec la nouvelle capture : la grille ACCÈS RAPIDE passe à
   douze tuiles et occupe toute la hauteur restante, exactement comme dans
   l'application. Ils sont récupérables dans l'historique git. */

/* ══ Le lanceur « Assistant » ══════════════════════════════════════════════
   Client 2026-08-11 : « un petit encadré en bas de la réplication avec écrit
   assistant », capture à l'appui — un carré à grand rayon, indigo plein, une
   étincelle blanche pleine.
   LA COULEUR suit le bouton « Réserver un appel » de la barre de
   navigation (« j'aime beaucoup la couleur du bouton Réserver un appel »).
   Elle n'est pas reprise du bleu #3b82f6 du reste de l'interface, et c'est
   volontaire : dans l'application ce lanceur est l'action vivante, il doit se
   détacher du chrome.
   IL VIT DANS .oa-win, pas à côté : c'est un élément de l'interface répliquée,
   pas une pastille flottante. Donc il est rogné par l'overflow de la fenêtre,
   il rétrécit avec elle pendant le dézoom du hero, et il n'a pas besoin de la
   règle qui éteint .oa-chip quand le mur se referme. */
.oa-assist{position:absolute;z-index:6;right:22px;bottom:20px;
  display:inline-flex;align-items:center;gap:11px;
  padding:9px 16px 9px 9px;border-radius:16px;background:#3b82f6;
  box-shadow:0 2px 6px rgba(49,49,150,.20),0 16px 34px -14px rgba(49,49,150,.55)}
.oa-assist .ic{width:34px;height:34px;border-radius:11px;flex-shrink:0;
  display:grid;place-items:center;background:rgba(255,255,255,.16);color:#fff}
.oa-assist b{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;letter-spacing:-.01em}

/* ══ Pastilles flottantes : l'histoire ENTRÉE → SORTIE ══ */
/* Deux couches distinctes, et pas une seule : .oa-chip ne porte que la position
   et le recul devant le curseur (propriété "translate"), .oa-fl porte le décor
   de la carte et le flottement (propriété "transform"). Sur un élément unique,
   l'arrivée, le flottement et le recul se disputeraient la même propriété
   "transform", et le flottement déplacerait le CONTENU à l'intérieur d'une
   carte immobile au lieu de faire léviter la carte. */
.oa-chip{position:absolute;z-index:5;
  transition:translate 650ms cubic-bezier(.22,1,.36,1)}
.oa-chip>.oa-fl{margin-top:0;border-radius:15px;padding:14px 18px;background:#fff;
  box-shadow:0 2px 6px rgba(15,23,42,.10),0 20px 44px -18px rgba(15,23,42,.5)}
.oa-chip .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.oa-chip b{display:block;font-size:15px;font-weight:700;color:#111827;white-space:nowrap}
.oa-chip span{display:block;margin-top:3px;font-size:12.5px;color:#8b909b;white-space:nowrap}
.oa-chip .ic.x{background:#e9f7ee;color:#177245}
.oa-chip .ic.blue{background:#eaf1ff;color:#2f6ff0}
.oa-chip .ic.violet{background:#f0ecfe;color:#7c53e8}
.oa-chip .ic.amber{background:#fef3e2;color:#d97a06}
/* Les pastilles DÉBORDENT sur les côtés de la fenêtre (comme monday.com) :
   elles ne doivent jamais recouvrir le contenu de l'interface. */
/* Le fichier qui ENTRE, à gauche, en face de la carte « Ouvrir un fichier » */
/* Ancrées sur les BORDS de la fenêtre (et non par un décalage fixe) : les
   étiquettes ayant été agrandies, un décalage en pixels les faisait mordre sur
   l'interface dès que le texte était un peu long. */
/* Décalage NÉGATIF (client 2026-07-30) : les pastilles mordent légèrement sur
   la fenêtre au lieu d'être posées strictement à côté. Elles se lisent alors
   comme flottant AU-DESSUS du logiciel, pas comme une colonne collée au bord.
   Le chevauchement reste faible et varie d'une pastille à l'autre, pour que le
   bord droit ne forme pas une ligne droite. */
.oa-chip.in{right:calc(100% - 34px);top:150px}
/* Les livrables qui SORTENT, à droite */
.oa-chip.out1{left:calc(100% - 46px);top:250px}
.oa-chip.out2{left:calc(100% - 18px);top:374px}
.oa-chip.out3{left:calc(100% - 58px);top:498px}

/* ── Arrivée puis flottement perpétuel ── */
.oa-armed .oa-chip{opacity:0}
/* Entrée : la pastille monte et se déplie. Elle porte sur .oa-chip pendant que
   le flottement porte sur .oa-fl, les deux transformes ne se marchent donc pas
   dessus et se composent pendant l'arrivée. */
@keyframes oaIn{from{opacity:0;transform:translate3d(0,26px,0) scale(.92)}to{opacity:1;transform:none}}
/* Flottement « nuage » : une boucle FERMÉE (0 % = 100 %) parcourue en continu,
   donc sans "alternate" : la pastille dérive au lieu de faire un aller-retour
   de métronome. Deux tracés et quatre durées différentes : les pastilles ne
   repassent jamais en phase, ce qui casse l'impression de mouvement mécanique. */
@keyframes oaFloatA{
  0%{transform:translate3d(-17px,-19px,0) rotate(-1.5deg)}
  27%{transform:translate3d(14px,-8px,0) rotate(1deg)}
  52%{transform:translate3d(22px,18px,0) rotate(1.6deg)}
  78%{transform:translate3d(-8px,12px,0) rotate(-.5deg)}
  100%{transform:translate3d(-17px,-19px,0) rotate(-1.5deg)}}
@keyframes oaFloatB{
  0%{transform:translate3d(19px,16px,0) rotate(1.3deg)}
  31%{transform:translate3d(-11px,5px,0) rotate(-.9deg)}
  58%{transform:translate3d(-22px,-18px,0) rotate(-1.5deg)}
  82%{transform:translate3d(7px,-9px,0) rotate(.6deg)}
  100%{transform:translate3d(19px,16px,0) rotate(1.3deg)}}
/* Les pastilles arrivent APRÈS l'interface (client 2026-07-30) : la scène
   elle-même monte en place via .hd-stagerise de 420 à 1520 ms, donc entrer trop
   tôt revenait à entrer pendant que le logiciel n'était pas encore là.
   Cadence RESSERRÉE (client 2026-07-30 : « c'est un peu trop lent ») : premier
   départ ramené de 1500 à 1050 ms, décalage entre pastilles de 220 à 150 ms et
   entrée de 700 à 500 ms. La dernière est posée à 2 s au lieu de 2,86 s, tout
   en laissant l'interface s'installer la première. */
.oa-in .oa-chip{animation:oaIn 500ms cubic-bezier(.22,1,.36,1) both}
.oa-in .oa-chip.in{animation-delay:1050ms}
.oa-in .oa-chip.out1{animation-delay:1200ms}
.oa-in .oa-chip.out2{animation-delay:1350ms}
.oa-in .oa-chip.out3{animation-delay:1500ms}
/* Amplitude TRIPLÉE et cycles raccourcis (client 2026-07-30 : « qu'elles
   bougent plus, même sans le curseur »).
   Délais NÉGATIFS, et c'est le point important : un délai positif laissait la
   pastille immobile après son entrée, puis le flottement démarrait sur sa
   première image, très loin de la position de repos — d'où le sursaut au bout
   de deux secondes. En négatif, le flottement tourne DÉJÀ pendant que la
   pastille apparaît : elle arrive en mouvement et il n'y a plus aucune rupture.
   Quatre valeurs sans rapport entre elles, pour que les pastilles ne soient
   jamais en phase. */
.oa-in .oa-chip .oa-fl{animation:oaFloatA 8s ease-in-out -1.3s infinite}
.oa-in .oa-chip.out1 .oa-fl{animation-name:oaFloatB;animation-duration:9.5s;animation-delay:-5.2s}
.oa-in .oa-chip.out2 .oa-fl{animation-duration:11s;animation-delay:-3.1s}
.oa-in .oa-chip.out3 .oa-fl{animation-name:oaFloatB;animation-duration:12.5s;animation-delay:-8.4s}
/* Trait pointillé entre le fichier entrant et la carte « Ouvrir un fichier » */
.oa-armed .oa-flow{opacity:0}
/* Le trait pointillé précède de peu la pastille entrante qu'il relie. */
.oa-in .oa-flow{animation:oaIn 450ms ease-out 900ms both}
.oa-flow{position:absolute;z-index:4;left:-8px;top:222px;width:288px;height:2px;
  background:repeating-linear-gradient(90deg,#b9c7de 0 7px,transparent 7px 13px)}

/* ── Variante ROGNÉE (carte de la grille bento) ──
   Hors du hero, la scène n'a plus de marge à sa gauche : la pastille entrante,
   qui déborde de 216 px, sortirait de la carte et se ferait trancher net. Elle
   est donc RAMENÉE SUR la barre latérale — elle y flotte au-dessus du logiciel
   au lieu d'être posée à côté, ce qui est la même lecture. Le trait pointillé
   raccourcit d'autant pour continuer de relier la pastille à la carte
   « Ouvrir un fichier », dont le bord gauche est à 280 px. */
.oa-crop .oa-chip.in{right:calc(100% - 196px)}
.oa-crop .oa-flow{left:152px;width:128px}

@media (prefers-reduced-motion:reduce){
  .oa-armed .oa-chip,.oa-armed .oa-flow{opacity:1}
  .oa-in .oa-chip,.oa-in .oa-flow,.oa-in .oa-chip .oa-fl{animation:none}}
`;

/* ── Petites icônes en ligne (aucune dépendance) ── */
const IcoDoc = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
);
const IcoArrow = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
const IcoPlus = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const IcoGlobe = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" /></svg>
);
const IcoSparkle = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>
);
const IcoHome = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 21v-7h6v7" /></svg>
);
const IcoChat = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4a8.4 8.4 0 0 1-3.8-.9L3 20.5l1.5-4.4A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" /></svg>
);
const IcoBell = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
const IcoCheck = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const IcoChart = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
/* Icônes des modules réels, calquées sur celles de l'application. */
const IcoBank = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-5 9 5" /><path d="M5 9v8M10 9v8M14 9v8M19 9v8" /><path d="M3 20h18" /></svg>
);
const IcoSwap = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></svg>
);
const IcoScale = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16M7 20h10" /><path d="M4 8h16" /><path d="m4 8-2.5 5a3 3 0 0 0 5 0z" /><path d="m20 8-2.5 5a3 3 0 0 0 5 0z" /></svg>
);
const IcoPie = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15.5 3.6A9 9 0 0 1 20.4 8.5L12 12z" /></svg>
);
const IcoGauge = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15 9-4 4" /></svg>
);
/* Les six modules ajoutés le 2026-08-12 avec la nouvelle capture. Mêmes cotes
   et même graisse de trait que les cinq ci-dessus, pour que la grille reste
   homogène. */
const IcoArb = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="8" r="3.4" /><circle cx="17" cy="16" r="3.4" /><path d="M13.4 8H20l-2-2M10.6 16H4l2 2" /></svg>
);
const IcoFarm = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="17" r="3.5" /><circle cx="18" cy="17.5" r="2.5" /><path d="M3 17V8h5l2.5 5H15" /><path d="M10 8h5v5" /></svg>
);
const IcoPenDoc = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12V8l-5-5H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="M14 3v5h5" /><path d="m20.5 14.5-5 5L13 20l.5-2.5 5-5z" /></svg>
);
const IcoMission = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" /><path d="M9 8h8M9 12h8M9 16h4" /></svg>
);
const IcoBulb = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" /></svg>
);
const QUICK_ICON = {
  bank: IcoBank, swap: IcoSwap, scale: IcoScale, pie: IcoPie, gauge: IcoGauge, plus: IcoPlus,
  arb: IcoArb, farm: IcoFarm, penDoc: IcoPenDoc, mission: IcoMission, bulb: IcoBulb, globe: IcoGlobe,
} as const;

type SceneProps = {
  playing?: boolean;
  /** ÉCHELLE FIXE au lieu de « faire tenir dans le cadre » (client 2026-08-07 :
   *  « répliquer le design du logiciel du haut de la page dans l'encadré, avec
   *  exactement la même netteté »).
   *
   *  C'est LE point de la demande, et il tient en une phrase : la netteté ne
   *  vient pas du rendu, elle vient de l'échelle. La scène est composée à
   *  1180×720 avec des corps de texte réels (13 à 29 px) ; la faire tenir dans
   *  une carte de 840 px la ramène à 0,58, soit du 7,5 px à l'écran — flou par
   *  construction. À l'échelle 1 les mêmes 13 px restent 13 px, et c'est la
   *  CARTE qui rogne ce qui dépasse, comme la fenêtre débordante de Stripe.
   *
   *  Non renseigné : comportement d'origine, la scène tient entière. */
  cropScale?: number;
  /** Pastilles flottantes à garder. Rognée, la scène n'a plus de place à
   *  droite : les trois livrables sortants tomberaient hors carte, seule
   *  l'entrée reste visible. */
  chips?: "all" | "in" | "none";
};

export default function OraAppScene({ playing = true, cropScale, chips: chipMode = "all" }: SceneProps) {
  const { t } = useLang();
  const mediaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current, stage = stageRef.current;
    if (!media || !stage) return;
    const fit = () => {
      if (cropScale) {
        // Calée à GAUCHE et non centrée : c'est le flanc gauche du logiciel
        // (barre latérale, accueil, grande carte bleue) qui doit rester à
        // l'écran, le reste sort par la droite de la carte.
        stage.style.left = "0";
        stage.style.transformOrigin = "top left";
        stage.style.transform = `scale(${cropScale})`;
        return;
      }
      const s = Math.min(media.clientWidth / W, media.clientHeight / H);
      stage.style.transform = `translateX(-50%) scale(${s})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(media);
    fit();
    return () => ro.disconnect();
  }, [cropScale]);

  // ── Les pastilles fuient légèrement le curseur ───────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chips = Array.from(stage.querySelectorAll<HTMLElement>(".oa-chip"));
    if (!chips.length) return;

    /** Rayon d'influence et recul maximal, en pixels d'ÉCRAN. */
    const RADIUS = 200, PUSH = 26;

    // Centres au repos, en coordonnées de scène, relevés sur la MISE EN PAGE
    // (`offset*`) : insensibles au flottement comme au recul déjà appliqué.
    // Mesurer le centre réel ferait boucler l'effet — la pastille s'éloigne,
    // donc son centre s'éloigne, donc la poussée retombe, et elle oscille.
    let bases = chips.map(() => ({ x: 0, y: 0 }));
    const measure = () => {
      bases = chips.map((c) => ({
        x: c.offsetLeft + c.offsetWidth / 2,
        y: c.offsetTop + c.offsetHeight / 2,
      }));
    };
    measure();
    // La largeur des pastilles dépend du texte : elle bouge encore quand les
    // polices finissent de charger.
    document.fonts?.ready.then(measure).catch(() => {});

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      const s = r.width / W;
      if (!s) return;
      chips.forEach((chip, i) => {
        const dx = r.left + bases[i].x * s - e.clientX;
        const dy = r.top + bases[i].y * s - e.clientY;
        const d = Math.hypot(dx, dy);
        if (d > RADIUS || d < 1) { chip.style.translate = ""; return; }
        // Le recul est posé DANS la scène, qui est mise à l'échelle : sans la
        // division, la fuite paraîtrait de plus en plus faible en rétrécissant.
        const f = ((1 - d / RADIUS) * PUSH) / s;
        chip.style.translate = `${(dx / d) * f}px ${(dy / d) * f}px`;
      });
    };
    const clear = () => chips.forEach((c) => { c.style.translate = ""; });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("pointerleave", clear);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", measure);
      document.removeEventListener("pointerleave", clear);
      clear();
    };
  }, []);

  return (
    <>
      <style>{OA_CSS}</style>
      <div
        className={`oa-media oa-armed${playing ? " oa-in" : ""}${cropScale ? " oa-crop" : ""}`}
        ref={mediaRef}
      >
        <div className="oa-stage" ref={stageRef}>
          <div className="oa-win">
            {/* Barre de titre macOS */}
            <div className="oa-title">
              <div className="oa-dots">
                <i style={{ background: "#ff5f57" }} />
                <i style={{ background: "#febc2e" }} />
                <i style={{ background: "#28c840" }} />
              </div>
              Ora
            </div>

            <div className="oa-body">
              {/* ── Barre latérale ── */}
              <div className="oa-side">
                <div className="oa-brand">
                  <img src="/logos/logo-color-dark.png" alt="Ora" />
                </div>
                <div className="oa-navlabel">NAVIGATION</div>
                <div className="oa-navitem on"><IcoHome /> {t({ fr: "Accueil", en: "Home" })}</div>
                <div className="oa-navitem"><IcoGlobe s={17} /> Atlas</div>
                <div className="oa-eng">
                  <span className="ic"><IcoSparkle s={19} /></span>
                  <b>Ora Engineering</b>
                  <p>
                    {t({
                      fr: "Besoin d'une automatisation ? Décrivez-la, on vous livre un script sur mesure sous 48 h.",
                      en: "Need an automation? Describe it, we deliver a custom script within 48 h.",
                    })}
                  </p>
                </div>
              </div>

              {/* ── Colonne principale ── */}
              <div className="oa-main">
                <div className="oa-top">
                  <span className="h">{t({ fr: "Accueil", en: "Home" })}</span>
                  <span className="oa-pillbtn"><IcoChat /> Messages</span>
                  <span className="oa-pillbtn"><IcoBell /> Notifications <span className="oa-badge">1</span></span>
                  <span className="oa-avatar">T</span>
                </div>

                <div className="oa-scroll">
                  {/* Salutation et date relevées sur la capture du 2026-08-12. */}
                  <div className="oa-hello">{t({ fr: "Ravi de vous accueillir, Test", en: "Glad to have you, Test" })}</div>
                  <div className="oa-date">{t({ fr: "Mercredi 12 août", en: "Wednesday, August 12" })}</div>

                  {/* DEUX cartes bleues, comme l'application. La PREMIÈRE reste
                      la cible du curseur du hero : ne pas inverser l'ordre sans
                      remesurer OPEN_CARD dans OraHeroDemo. */}
                  <div className="oa-openrow">
                    <div className="oa-open">
                      <span className="ic"><IcoDoc s={21} /></span>
                      <div className="tx">
                        <b>{t({ fr: "Ouvrir un fichier", en: "Open a file" })}</b>
                        <span>{t({ fr: "Excel ou CSV → lancez vos automatisations en un clic", en: "Excel or CSV → run your automations in one click" })}</span>
                      </div>
                      <span className="arw"><IcoArrow s={21} /></span>
                    </div>
                    <div className="oa-open assist">
                      <span className="ic"><IcoSparkle s={21} /></span>
                      <div className="tx">
                        <b>{t({ fr: "Assistant", en: "Assistant" })}</b>
                        <span>{t({ fr: "Votre journée, vos priorités, et l'analyse d'un document", en: "Your day, your priorities, and a document reviewed" })}</span>
                      </div>
                      <span className="arw"><IcoArrow s={21} /></span>
                    </div>
                  </div>

                  {/* ACCÈS RAPIDE */}
                  <div className="oa-sec">{t({ fr: "ACCÈS RAPIDE", en: "QUICK ACCESS" })}</div>
                  <div className="oa-quick">
                    {QUICK.map((q) => {
                      const Ico = QUICK_ICON[q.icon];
                      return (
                        /* Clé sur `title.en` et non sur le titre traduit : une
                           clé React qui change avec la langue force le
                           démontage puis le remontage des douze tuiles à
                           chaque bascule FR/EN, au lieu d'une simple mise à
                           jour de texte. */
                        <div className="oa-qcard" key={q.title.en}>
                          <span className={`ic ${q.tone}`}><Ico /></span>
                          <div style={{ minWidth: 0 }}>
                            <b>{t(q.title)}</b>
                            <span>{t(q.sub)}</span>
                          </div>
                          <span className="arw"><IcoArrow s={15} /></span>
                        </div>
                      );
                    })}
                  </div>

                  {/* La section REPRENDRE est partie le 2026-08-12 : la grille
                      ACCÈS RAPIDE passe à douze tuiles et prend toute la
                      hauteur restante, comme dans l'application. */}
                </div>
              </div>
            </div>

            {/* Lanceur « Assistant », posé en bas à droite de la fenêtre comme
                dans l'application. Étincelle PLEINE (et non le tracé de
                IcoSparkle réutilisé ailleurs) : la capture fournie montre un
                glyphe plein, qui tient mieux à cette taille. */}
            <div className="oa-assist" aria-hidden>
              <span className="ic">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.6l1.95 5.63L19.4 10l-5.45 1.77L12 17.4l-1.95-5.63L4.6 10l5.45-1.77z" />
                  <path d="M18.7 14.2l.78 2.22 2.12.78-2.12.78-.78 2.22-.78-2.22-2.12-.78 2.12-.78z" />
                  <circle cx="5.4" cy="17.6" r="1.5" />
                </svg>
              </span>
              <b>{t({ fr: "Assistant", en: "Assistant" })}</b>
            </div>
          </div>

          {/* ══ L'histoire : un Excel entre, des livrables sortent ══ */}
          {chipMode !== "none" && <div className="oa-flow" />}
          {chipMode !== "none" && (
          <div className="oa-chip in">
            <span className="oa-fl" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ic x"><IcoDoc s={19} /></span>
              <span>
                <b>balance_2025.xlsx</b>
                <span>{t({ fr: "Déposé dans Ora", en: "Dropped into Ora" })}</span>
              </span>
            </span>
          </div>
          )}
          {chipMode === "all" && (
          <>
          <div className="oa-chip out1">
            <span className="oa-fl" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ic blue"><IcoChart s={19} /></span>
              <span>
                <b>{t({ fr: "Reporting généré", en: "Report generated" })}</b>
                <span>{t({ fr: "Mis en forme, prêt à envoyer", en: "Formatted, ready to send" })}</span>
              </span>
            </span>
          </div>
          <div className="oa-chip out2">
            <span className="oa-fl" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ic violet"><IcoCheck s={19} /></span>
              <span>
                <b>{t({ fr: "398 000 lignes contrôlées", en: "398,000 rows checked" })}</b>
                <span>{t({ fr: "Écritures atypiques repérées", en: "Unusual entries flagged" })}</span>
              </span>
            </span>
          </div>
          <div className="oa-chip out3">
            <span className="oa-fl" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ic amber"><IcoDoc s={19} /></span>
              <span>
                <b>{t({ fr: "Synthèse PDF", en: "PDF summary" })}</b>
                <span>{t({ fr: "Livrable final, en un clic", en: "Final deliverable, one click" })}</span>
              </span>
            </span>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
}
