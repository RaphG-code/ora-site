import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { VideoWithScrubber } from "./InViewVideo";
import OraAppScene from "./OraAppScene";
import { useLang } from "@/lib/i18n";
import { animatedScrollToId } from "@/lib/scrollTo";
import { BilanShowcaseCard, StructureShowcaseCard, ValuationShowcaseCard } from "./ShowcaseCards";
import Typewriter from "./Typewriter";
import PrevisionnelStudio from "./PrevisionnelStudio";
import { FileChipStrip } from "./StackingCards";
import { ZoomButton, ZoomOverlay } from "./PanelZoom";
import DesktopScale from "./DesktopScale";

/**
 * AutomationTabs — la section « à la attio » (client 2026-08-12, captures
 * attio.com fournies : bloc « The intelligent system that never sleeps »).
 *
 * CE QUI EST REPRIS de la référence :
 *   · un grand titre à DEUX ENCRES, la première phrase en noir et la suite en
 *     gris clair ;
 *   · un cadre à filets fins, ouvert en bas ;
 *   · une COLONNE D'ONGLETS VERTICALE à gauche : l'entrée active en noir, les
 *     autres presque effacées, un court segment bleu sur le filet en face de
 *     l'active ;
 *   · à droite, LES PANNEAUX DES MODULES, un par onglet.
 *
 * ── DÉFILEMENT CLASSIQUE + RAIL ÉPINGLÉ (client 2026-08-13) ─────────────────
 * « Il faut que dans cette partie le scroll vers le bas fasse défiler de
 * manière classique, mais que la partie de droite. »
 * L'ancienne version (2026-08-12) épinglait TOUT le bloc et découpait la
 * course en segments : le contenu ne bougeait pas, seuls les textes
 * changeaient. C'est le contraire du modèle attio, et le client l'a renvoyée.
 * Désormais :
 *   · la colonne de droite est un FLUX NORMAL : les panneaux sont empilés et
 *     défilent avec la page, comme n'importe quel contenu ;
 *   · la colonne de gauche est UN RAIL COLLANT (position:sticky) : elle reste
 *     en place pendant que les panneaux passent ;
 *   · l'onglet actif SUIT le panneau qui traverse une ligne de repère posée à
 *     42 % de l'écran, via un écouteur de défilement nu (le useScroll de
 *     Framer ne propageait rien ici, vérifié le 2026-08-12) ; l'état n'est
 *     écrit qu'au changement d'index, jamais à chaque image ;
 *   · cliquer un onglet fait défiler la page jusqu'au panneau, par
 *     animatedScrollToId : le même Lenis que la navigation du site, donc la
 *     même sensation. Poser l'état à la main serait écrasé par le premier
 *     événement de défilement venu.
 * Sous lg, le rail disparaît : chaque panneau porte déjà son titre, la liste
 * ferait doublon sur une colonne de téléphone. À sa place, une bande
 * d'onglets horizontale COLLANTE sous la barre de navigation (voir son pavé).
 *
 * LES PANNEAUX (refonte 2026-08-13, seconde passe le même jour) :
 *   · les zones de contenu sont des CADRES GRISÉS PLEINE LARGEUR : elles
 *     courent d'un filet à l'autre, sans marge blanche latérale ni coin
 *     arrondi — « comble les espaces blancs de gris exactement comme sur le
 *     screen ». Le gris est borné par un filet en haut (sous le texte du
 *     panneau) et par le filet du panneau suivant en bas.
 *   · « Prévisionnel » : la maquette de l'écran « Prévisionnel d'activité »
 *     du logiciel et sa carte flottante (PrevisionnelStudio).
 *   · « Bilan développé » est LE SEUL à porter l'enregistrement d'écran
 *     (client : « mets la vidéo uniquement pour bilan imagé » — Bilan imagé
 *     est le nom du module équivalent chez RCA, et le clip fourni montre
 *     précisément le module Bilan développé et SIG). Le clip repart de zéro à
 *     chaque arrivée du lecteur sur le panneau (InViewVideo).
 *   · « Changement de structure » : cadre coupé en deux par un filet,
 *     l'invite de saisie factice à gauche, et à droite LE DESIGN DE LA CARTE
 *     « Conseillez la bonne structure » du bas de page, compacté — galaxie
 *     WebGL + nuage d'étiquettes qui fuient le curseur (l'orbital à pastilles
 *     de la première passe a été renvoyé : « je n'aime pas du tout »).
 *   · « Évaluation d'entreprise » : LE DESIGN DE LA CARTE « Évaluation
 *     financière » du bas de page — la carte-objet ValuationCard, posée au
 *     centre de son cadre gris.
 *   · Ces reprises sont les MÊMES COMPOSANTS que la grille bento
 *     (ParticleOrbGL, RepelChips, ValuationCard), pas des copies : les deux
 *     étages ne peuvent pas diverger. Seuls les nuages d'étiquettes sont des
 *     semis locaux, repositionnés pour une demi-colonne.
 *   · « Contrôles et suivi » RÉUNIT quatre modules (suivi budgétaire, coût de
 *     revient, TVA, pointage des comptes) qui avaient chacun leur onglet et
 *     leur panneau vide. Un seul cadre, les quatre titres et leurs phrases
 *     d'origine : le client a demandé le regroupement pour n'avoir qu'un
 *     design à tenir au lieu de quatre écrans à tourner.
 *   · « Automatisations » garde sa liste : il n'a pas une démo à montrer mais
 *     une étendue à énumérer, et il renvoie vers Ora Engineering. Il se
 *     distingue DANS LE RAIL (✦, filet pointillé, glose) et nulle part
 *     ailleurs : la version à nappe bleue et bouton dégradé de son panneau a
 *     été renvoyée le jour de sa livraison.
 *
 * ⚠ DETTE CONNUE : le renvoi « Ora Engineering » ouvre la prise de
 * rendez-vous, faute d'encadré dédié sur la landing (supprimé le 2026-07-30,
 * voir UseCases.tsx). Le jour où il existe, repointer ce bouton.
 */

interface AutomationTabsProps {
  theme: "light" | "dark";
  /** Sert au renvoi « Ora Engineering » du panneau Automatisations. */
  openBooking: () => void;
}

/** L'enregistrement d'écran du module Bilan développé (fourni le 2026-08-13,
 *  Built-in Retina Display.mp4, 1660 x 1080). */
const DEMO_CLIP = "/demo-automatisation.mp4";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
} as const;

/** L'échelle du rognage du bureau. Sert aussi de seuil : `crop !== CROP_DESK`
 *  vaut « la fenêtre fait moins de 1024 px », c'est-à-dire « DesktopScale est
 *  en service ». Voir le pavé de `readCrop`. */
const CROP_DESK = 0.82;

/* ── L'ÉCHELLE DE LA SCÈNE ROGNÉE (« Contrôles et suivi ») ──────────────────
   La scène du logiciel est composée à 1180 × 720 et TRANCHÉE par le bord de sa
   demi-colonne : c'est le procédé de la carte « Gagnez des heures », et c'est
   ce que montre la capture du bureau fournie par le client. Ce qui change d'une
   largeur d'écran à l'autre, c'est la part de fenêtre qui reste à l'écran.
   Le bureau montre ~650 px de scène dans 530 px de colonne (0,82). Une
   demi-colonne de téléphone en fait 181 : à 0,82 on n'y verrait plus que la
   barre latérale, et le lecteur ne reconnaîtrait pas le logiciel. Les paliers
   ci-dessous gardent à peu près le MÊME CADRAGE — barre latérale, salutation,
   grande carte bleue — en réduisant l'échelle au lieu de rogner davantage.
   C'est la consigne du client, mot pour mot : la composition du bureau, en plus
   petit. Mesuré à 390 px : 430 px de scène visibles, contre 222 à 0,82.
   Hors du composant : la fonction ne lit que `window`, et l'y laisser
   obligerait l'effet à la déclarer en dépendance pour rien. */
const readCrop = () => {
  const w = typeof window === "undefined" ? 1280 : window.innerWidth;
  return w >= 1024 ? CROP_DESK : w >= 768 ? 0.62 : 0.42;
};

export default function AutomationTabs({ theme, openBooking }: AutomationTabsProps) {
  const { t } = useLang();
  const dk = theme === "dark";
  const [active, setActive] = useState(0);
  /* L'index du panneau agrandi, ou null. Un seul état pour toute la section :
     deux fenêtres ouvertes en même temps n'ont pas de sens, et le porter par
     panneau obligerait à six états parallèles. */
  const [zoom, setZoom] = useState<number | null>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  /* La rangée de pastilles de la bande mobile : l'auto-défilement de la bande
     vers la pastille active a besoin d'atteindre ses enfants. */
  const stripRef = useRef<HTMLDivElement>(null);
  /* L'échelle du rognage de la scène « Contrôles et suivi » — voir `readCrop`.
     ⚠ UNE SEULE INSTANCE D'OraAppScene, d'où cette lecture en JS plutôt qu'un
     couple de blocs masqués en CSS : deux blocs, ce seraient deux contextes
     WebGL et deux écouteurs `pointermove` pour une seule image visible. */
  const [crop, setCrop] = useState(readCrop);
  useEffect(() => {
    const read = () => setCrop(readCrop());
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  /* La phrase de tête de chaque panneau suit la grammaire de la référence :
     un début en noir qui nomme le résultat, une suite en gris qui dit
     comment. `media` désigne le contenu du panneau ; le type est posé à la
     main, sinon TypeScript infère une union depuis les entrées et refuse les
     champs absents. */
  const ITEMS: {
    tab: string;
    lead: string;
    rest: string;
    media?: "previsionnel" | "video" | "structure" | "valuation";
    /** Les modules réunis sous un seul onglet (« Contrôles et suivi »). */
    modules?: { title: string; lead: string; rest: string }[];
    examples?: string[];
    engineering?: boolean;
  }[] = [
    {
      tab: t({ fr: "Prévisionnel", en: "Forecasting" }),
      lead: t({ fr: "Le dossier banque, monté seul.", en: "The bank file, built on its own." }),
      rest: t({
        fr: "Hypothèses, plan de trésorerie et comptes prévisionnels sortent d'un même jeu de chiffres, prêts à défendre.",
        en: "Assumptions, cash plan and forecast accounts come out of one set of figures, ready to defend.",
      }),
      media: "previsionnel",
    },
    {
      tab: t({ fr: "Bilan développé", en: "Detailed balance sheet" }),
      lead: t({ fr: "Le bilan, et la formation du résultat.", en: "The balance sheet, and how profit forms." }),
      rest: t({
        fr: "Les soldes intermédiaires de gestion se déduisent du FEC, ligne à ligne, sans reprise manuelle.",
        en: "Interim management balances derive from the FEC, line by line, with no manual rework.",
      }),
      media: "video",
    },
    {
      tab: t({ fr: "Changement de structure", en: "Structure change" }),
      lead: t({ fr: "L'avant et l'après, côte à côte.", en: "Before and after, side by side." }),
      rest: t({
        fr: "Chaque scénario juridique et fiscal est chiffré sur les mêmes bases, donc comparable d'un coup d'œil.",
        en: "Every legal and tax scenario is priced on the same basis, so it compares at a glance.",
      }),
      media: "structure",
    },
    {
      tab: t({ fr: "Évaluation d'entreprise", en: "Business valuation" }),
      lead: t({ fr: "Cinq approches, une fourchette.", en: "Five approaches, one range." }),
      rest: t({
        fr: "Les méthodes tournent ensemble sur le même dossier et la synthèse expose l'écart entre elles.",
        en: "The methods run together on the same file and the summary shows the spread between them.",
      }),
      media: "valuation",
    },
    {
      // ── QUATRE ONGLETS EN UN (client 2026-08-13) ────────────────────────
      // « Suivi budgétaire », « Coût de revient », « TVA » et « Pointage des
      // comptes » avaient chacun leur onglet et leur panneau, tous les quatre
      // VIDES, en attente d'un enregistrement d'écran. C'était quatre écrans
      // à tourner et quatre décors à dessiner pour quatre hauteurs de vide, et
      // le client a tranché : « qu'on réunisse les designs, ça fera moins long
      // sur le site, moins de design à faire, pour être plus efficace sur les
      // choses qui comptent vraiment. »
      //
      // L'INTITULÉ n'est pas « Autres », et c'est délibéré : le fourre-tout de
      // la section existe déjà et s'appelle « Automatisations ». Deux paniers
      // génériques à quatre lignes d'écart, l'un juste au-dessus de l'autre,
      // n'apprendraient rien au lecteur. « Contrôles et suivi » nomme ce que
      // les quatre ont en commun — le travail récurrent sur la compta, celui
      // qui revient à chaque période — et reprend un mot du chapeau de la
      // section (« Vos contrôles tournent »). Un seul libellé à changer si le
      // client préfère autre chose.
      //
      // Le panneau ÉNUMÈRE les quatre : chacun garde le titre et la phrase qui
      // avaient été écrits et validés pour son onglet, rien n'est réécrit ni
      // perdu. Ce sont les mêmes textes, dans une seule boîte.
      tab: t({ fr: "Contrôles et suivi", en: "Checks and tracking" }),
      lead: t({ fr: "Le travail qui revient à chaque période.", en: "The work that comes back every period." }),
      rest: t({
        fr: "Les mêmes contrôles, sur les mêmes bases, d'un exercice à l'autre, sans ressaisir la balance à chaque fois.",
        en: "The same checks, on the same basis, from one year to the next, with no rekeying of the balance.",
      }),
      modules: [
        {
          title: t({ fr: "Suivi budgétaire", en: "Budget tracking" }),
          lead: t({ fr: "Le réalisé contre le budget.", en: "Actual against budget." }),
          rest: t({
            fr: "Les écarts sont repérés et documentés au fil des mois, sans ressaisir la balance à chaque période.",
            en: "Variances are flagged and documented month after month, with no rekeying of the balance.",
          }),
        },
        {
          title: t({ fr: "Coût de revient", en: "Cost price" }),
          lead: t({ fr: "Ce que chaque produit coûte vraiment.", en: "What each product really costs." }),
          rest: t({
            fr: "Charges directes et indirectes réparties sur vos propres clés, du FEC jusqu'au prix de revient unitaire.",
            en: "Direct and indirect costs allocated on your own keys, from the FEC through to unit cost price.",
          }),
        },
        {
          title: t({ fr: "TVA", en: "VAT" }),
          lead: t({ fr: "Les déclarations face à la compta.", en: "Returns against the ledger." }),
          rest: t({
            fr: "Le rapprochement se fait ligne à ligne et les écarts ressortent documentés, prêts à justifier.",
            en: "Reconciliation runs line by line and gaps come out documented, ready to justify.",
          }),
        },
        {
          title: t({ fr: "Pointage des comptes", en: "Account matching" }),
          lead: t({ fr: "Les comptes pointés, ligne à ligne.", en: "Accounts matched, line by line." }),
          rest: t({
            fr: "Les lettrages se font sur les mêmes bases d'un exercice à l'autre, et ce qui reste ouvert est justifié.",
            en: "Matching runs on the same basis from one year to the next, and whatever stays open is justified.",
          }),
        },
      ],
    },
    {
      // Le fourre-tout assumé, seul panneau à porter une liste : il dit que la
      // liste n'est pas fermée, et il ouvre sur Ora Engineering.
      tab: t({ fr: "Automatisations", en: "Automations" }),
      lead: t({ fr: "Et tout le reste, sur mesure.", en: "And everything else, made to measure." }),
      rest: t({
        fr: "Les traitements qui n'entrent dans aucune case se décrivent, puis se rejouent d'un clic.",
        en: "The routines that fit no box get described once, then replay in one click.",
      }),
      examples: [
        t({ fr: "Formatage pour logiciel métier", en: "Formatting for your production software" }),
        t({ fr: "Balances et auxiliaires générés depuis le FEC", en: "Balances and sub-ledgers generated from the FEC" }),
        t({ fr: "Reporting mensuel, le même livrable chaque mois", en: "Monthly reporting, the same deliverable every month" }),
        t({ fr: "Courriers et attestations chiffrés depuis vos données", en: "Letters and certificates priced from your own data" }),
        t({ fr: "Lettre de mission", en: "Engagement letter" }),
      ],
      engineering: true,
    },
  ];

  const N = ITEMS.length;

  // ── L'onglet actif suit le panneau sous la ligne de repère ────────────────
  // Ligne à 42 % de l'écran : l'actif est le DERNIER panneau dont le haut est
  // passé au-dessus d'elle. Écouteur nu, écriture au changement seulement.
  useEffect(() => {
    const lire = () => {
      const ligne = window.innerHeight * 0.42;
      let i = 0;
      for (let k = 0; k < N; k++) {
        const el = panelsRef.current[k];
        if (el && el.getBoundingClientRect().top <= ligne) i = k;
      }
      setActive((prev) => (prev === i ? prev : i));
    };
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    window.addEventListener("resize", lire);
    return () => {
      window.removeEventListener("scroll", lire);
      window.removeEventListener("resize", lire);
    };
  }, [N]);

  /* ── La bande mobile suit l'onglet actif ──────────────────────────────────
     Sans cela, dès le troisième panneau la pastille active vit HORS CHAMP à
     droite : la bande collante affiche alors six pastilles éteintes, autant
     dire rien. On centre la pastille active à chaque changement.
     `scrollTo` sur la bande, PAS `scrollIntoView` sur la pastille : ce dernier
     fait aussi défiler la PAGE pour amener l'élément dans la fenêtre, et il se
     battrait avec Lenis à chaque changement d'actif. */
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !chip) return;
    const parent = strip.parentElement as HTMLElement; // le conteneur défilant
    parent.scrollTo({
      left: chip.offsetLeft - (parent.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  const rule = dk ? "border-white/10" : "border-[#0a2540]/[0.10]";
  /* ── LA NAPPE GRISE, ET SON UNIQUE VALEUR ────────────────────────────────
     Relevée sur la capture attio : un gris à peine posé, SANS coin ni liseré
     propres — ses bords sont les filets de la section, elle court d'un bord à
     l'autre.

     ⚠ DEUX PASSES LE 2026-08-14, et elles ne disent pas la même chose.
       1. « Prends exemple de leur gris qui est moins agressif » (capture
          attio). Le gris d'alors, #f6f7f8, était un gris FROID : son bleu
          dépasse son rouge de deux points. Posé entre des blancs chauds (la
          charte du site est en #fcfbf7) et sous des textes marine, un gris
          bleuté se lit comme une teinte et non comme du papier. Passé en
          neutre à peine chaud, et d'un cheveu plus dense : #f3f3f2.
       2. « Allège le gris, il faut qu'il soit plus light, par exemple dans le
          changement de structure, pareil dans prévisionnel, pareil dans
          contrôles et suivi. » Le pas de la passe 1 allait dans le mauvais
          sens sur la DENSITÉ : ce que le client voulait, c'était moins de
          matière, pas seulement moins de bleu. La teinte neutre est gardée,
          la densité tombe : #f8f8f7, soit un tiers de l'écart au blanc en
          moins. La nappe se lit encore comme une zone (2,5 % d'écart de
          clarté avec le blanc, largement visible) sans jamais peser.
       Les trois panneaux cités passent tous par cette constante, comme les
       trois autres : c'est la seule ligne à changer pour toute la section. */
  const zone = "bg-[#f8f8f7] dark:bg-white/[0.04]";

  return (
    <section
      id="automatisations"
      data-nav-shy
      className="relative px-5 md:px-12 pt-16 md:pt-32 pb-0 bg-white dark:bg-black"
    >
      <div className={`mx-auto max-w-[86rem] border-x ${rule}`}>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          /* CHAPÔ DÉTACHÉ SOUS 768 (client 2026-08-22 : « un site mobile aussi
             minimaliste et bien fait »). Sur le bureau, titre et chapô sont une
             SEULE phrase composée, deux encres dans le même corps — c'est la
             figure de la page et elle tient en deux lignes. Sur un téléphone la
             même figure devient un pavé de sept lignes à 27 px où rien ne
             hiérarchise : le lecteur ne sait plus ce qui est le titre. Ce n'est
             pas une redite du bureau, c'est la même phrase remise en ordre pour
             une colonne de 350 px — titre à 23 px, chapô détaché à 15 px. */
          className="px-5 md:px-10 pb-6 md:pb-20 font-instrument font-normal tracking-[-0.03em] leading-[1.14] text-[1.45rem] md:text-[clamp(1.7rem,3.9vw,3.3rem)]"
        >
          {/* ⚠ TITRE REPRIS le 2026-08-15 (client : « trouve une phrase plus
              générique qui permet de comprendre immédiatement ce que l'on fait
              à Ora, sans changer la longueur ni la police ni la couleur »).
              L'ancien disait « Un logiciel, tous vos livrables. Le FEC entre.
              Vos contrôles tournent. Le dossier ressort prêt à envoyer, aux
              couleurs du cabinet. » Deux mots le fermaient :
                · FEC, qui ne parle qu'aux cabinets comptables. Or c'est le
                  PREMIER titre que lit un visiteur de la page, direction
                  financière comprise, et un sigle métier au premier écran fait
                  passer le produit pour un outil de niche ;
                · « aux couleurs du cabinet », même problème.
              Le nouveau dit le mouvement, pas le métier : ce qui entre, ce qui
              sort, et ce qu'Ora fait entre les deux. Longueur tenue au
              caractère près (127 avant, 122 après, les deux encres cumulées),
              graisse, famille et les deux encres inchangées. */}
          <span className="text-[#111827] dark:text-white">
            {t({ fr: "Vos fichiers entrent, vos livrables sortent.", en: "Your files go in, your deliverables come out." })}
          </span>{" "}
          <span className="text-[#6b7688] max-md:mt-3 max-md:block max-md:font-inter max-md:text-[0.95rem] max-md:leading-[1.55] max-md:tracking-normal dark:text-gray-500">
            {t({
              fr: "Ora enchaîne tout le travail répétitif qui va de la donnée brute au document final.",
              en: "Ora runs the whole repetitive chain, from raw data to finished document.",
            })}
          </span>
        </motion.h2>

        {/* ── LE RAIL, VERSION TÉLÉPHONE (audit du 2026-08-15, rétabli et
            rendu COLLANT le 2026-08-20) ──────────────────────────────────────
            Le rail de gauche est masqué sous lg. Le contenu survivait, mais un
            visiteur sur téléphone ou sur tablette ne voyait JAMAIS l'inventaire
            des modules ni l'entrée « Automatisations, tout ce qui n'entre dans
            aucune case » : il découvrait les panneaux un par un en défilant,
            sans jamais savoir combien il en restait. C'est la plus grosse perte
            de contenu mobile de la page.
            Une bande horizontale défilante le rend, dans la seule forme qui
            tienne sur 375 px. Les débords négatifs annulent le rembourrage de
            section pour que la bande file d'un bord à l'autre, comme la barre
            d'onglets du carrousel d'Atlas.
            ⚠ Une passe du 2026-08-19 l'avait remplacée par le rail du bureau
            compressé dans une colonne de 6,75 rem, panneaux écrasés à côté ; le
            client l'a renvoyée le 2026-08-20 (« everything is compacted, no
            spaces, we don't understand what we are doing »). La bande revient,
            et elle devient COLLANTE : la section fait plus de six écrans de
            téléphone, sans repère fixe on ne sait jamais où l'on en est.
            `top-[68px]` est la hauteur mesurée de la barre de navigation
            (l'overlay du menu mobile s'ouvre à ce même 68px, Navigation.tsx) ;
            z-30 passe sous la nav (z-50) et sur les panneaux. Le fond opacifié
            est indispensable : sans lui les panneaux défilent au travers. */}
        {/* FONDU DE BORD À DROITE (2026-08-22) : la bande est plus large que
            l'écran par construction — six modules ne tiennent pas sur 390 px et
            c'est une NAVIGATION, elle a le droit de filer. Ce qui n'allait pas,
            c'est qu'elle se terminait par une pastille TRANCHÉE NET au bord,
            qui se lit comme une casse de mise en page et non comme « ça
            continue ». Un dégradé de 40 px vers le fond de la bande dit la
            suite. Il est posé sur le conteneur COLLANT et non dans le
            défileur : dans le défileur il glisserait avec les pastilles. */}
        <div className={`sticky top-[68px] z-30 -mx-5 border-t bg-white/95 px-5 backdrop-blur-md lg:hidden dark:bg-black/90 ${rule}`}>
          <div className="relative">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <div ref={stripRef} className="flex w-max gap-2 py-3">
              {ITEMS.map((it, i) => {
                const on = i === active;
                return (
                  <button
                    key={it.tab}
                    type="button"
                    onClick={() => animatedScrollToId(`autotab-${i}`, -132)}
                    aria-pressed={on}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-inter text-[12.5px] ring-1 transition-colors duration-150 ${
                      on
                        ? "bg-[#f4f7fd] font-semibold text-[#111827] ring-[#3b82f6]/40 dark:bg-white/[0.08] dark:text-white dark:ring-white/20"
                        : "font-medium text-[#5b6577] ring-[#0a2540]/[0.10] dark:text-gray-400 dark:ring-white/10"
                    }`}
                  >
                    {it.engineering && (
                      <span aria-hidden className="text-brand-gradient leading-none">
                        ✦
                      </span>
                    )}
                    {it.tab}
                  </button>
                );
              })}
            </div>
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -right-5 w-10 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80"
          />
          </div>
        </div>

        <div className={`grid border-t ${rule} lg:grid-cols-[minmax(0,22rem)_1fr]`}>
          {/* ── Le rail d'onglets, épinglé pendant que la droite défile ───── */}
          <div className={`hidden lg:block lg:border-r ${rule}`}>
            {/* ⚠ RAIL RESSERRÉ le 2026-08-20 (client, capture attio à l'appui :
                « leurs entrées sont bien plus petites et plus minimalistes que
                sur mon site… c'est moins agressif pour les yeux »). Les
                libellés faisaient 20 px sur téléphone et 23 px à partir de md,
                en Instrument Sans : à cette taille une liste de six entrées se
                lit comme six titres, pas comme une navigation. Ils passent à
                15/16 px en Inter, et l'interligne suit (space-y-4/5 → 2/2.5).
                POURQUOI INTER ET NON INSTRUMENT SANS : la charte range les
                grands titres d'affichage en Instrument Sans et les LIBELLÉS
                D'INTERFACE en Inter. À 20 px on pouvait plaider le titre ; à
                15 px c'est une navigation, donc Inter. Ce n'est pas en
                contradiction avec la grille d'Atlas passée à Instrument Sans le
                même jour : là-bas ce sont des titres de 21 px. */}
            <ul className="sticky top-28 space-y-2 py-14 pl-6 md:pl-10 pr-6 md:space-y-2.5">
              {/* Le filet vertical qui porte le repère bleu, doublant le bord
                  gauche de la liste comme sur la référence. */}
              <span aria-hidden className={`absolute inset-y-14 -left-0 w-px ${dk ? "bg-white/10" : "bg-[#0a2540]/[0.10]"}`} style={{ left: 0 }} />
              {ITEMS.map((it, i) => {
                const on = i === active;
                return (
                  /* « AUTOMATISATIONS » SE DÉTACHE DE LA LISTE (client
                     2026-08-13 : « fais en sorte qu'automatisation ici soit un
                     élément de design qui le distingue des autres »). Il n'est
                     pas un module de plus : c'est la porte ouverte sur tout ce
                     que la liste ne nomme pas. Il est donc traité en PIED DE
                     LISTE — un blanc, un filet, une étincelle au dégradé de la
                     marque et une glose en dessous. La grammaire de la
                     référence reste intacte (actif en encre, le reste
                     effacé) : c'est le RANG de l'entrée qui change, pas son
                     état. */
                  <li key={it.tab} className={`relative ${it.engineering ? "mt-5 border-t border-dashed pt-5 md:mt-6 md:pt-6 " + (dk ? "border-white/15" : "border-[#0a2540]/[0.13]") : ""}`}>
                    {on && (
                      <motion.span
                        aria-hidden
                        layoutId="autotabs-marker"
                        className="absolute -left-6 md:-left-10 top-0 h-full w-[2px] bg-[#3b82f6]"
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => animatedScrollToId(`autotab-${i}`, -132)}
                      aria-pressed={on}
                      /* La graisse porte l'état actif à la place du seul
                         contraste d'encre : à 15 px, l'écart entre #111827 et
                         #7a8496 ne suffit plus à repérer l'entrée courante d'un
                         coup d'œil, alors qu'il suffisait à 23 px. */
                      className={`flex items-center gap-2 py-1 text-left font-inter text-[15px] tracking-[-0.01em] transition-colors duration-200 md:text-[16px] ${
                        on
                          ? "font-semibold text-[#111827] dark:text-white"
                          : "font-normal text-[#7a8496] hover:text-[#5b6577] dark:text-white/30 dark:hover:text-white/55"
                      }`}
                    >
                      {/* LE ✦, ET PAS UNE ICÔNE (client 2026-08-13, deuxième
                          passe : la pastille au dégradé portant l'étincelle
                          de lucide est remplacée par ce seul glyphe). C'est
                          déjà la marque de la maison : les étiquettes de
                          conseil des cartes le portent (« ✦ Conseil : alléger
                          le BFR », « ✦ Comparatif avant / après »). Il garde
                          le dégradé de la marque, en texte cette fois, et
                          `leading-none` l'assoit sur la ligne du libellé. */}
                      {it.engineering && (
                        <span aria-hidden className="shrink-0 text-brand-gradient text-[1.15em] leading-none">
                          ✦
                        </span>
                      )}
                      {it.tab}
                    </button>
                    {it.engineering && (
                      /* ALIGNÉE SOUS LE LIBELLÉ, sans nombre magique : la
                          glose reprend la largeur du ✦ et l'écart du bouton
                          en les redessinant, invisibles, devant elle. Le
                          retrait fixe de la version précédente était calé sur
                          la pastille de 28 px ; il aurait fallu le remesurer
                          à chaque changement de glyphe ou de graisse. */
                      <span className="mt-1 flex gap-2 font-inter text-[12px] leading-snug text-[#6b7688] dark:text-gray-500">
                        {/* Le gabarit invisible SUIT la taille du libellé : il
                            redessine le ✦ et l'écart du bouton pour aligner la
                            glose dessous sans nombre magique. Il a donc dû
                            passer de 1,25/1,45 rem à 15/16 px avec lui, sinon
                            la glose se décalait de six pixels vers la droite. */}
                        <span aria-hidden className="invisible shrink-0 font-inter text-[15px] leading-none md:text-[16px]">
                          <span className="text-[1.15em]">✦</span>
                        </span>
                        {t({ fr: "Tout ce qui n'entre dans aucune case", en: "Everything that fits no box" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Les panneaux, en flux normal ────────────────────────────────
              Les zones de contenu sont PLEINE LARGEUR : le gris court du
              filet du rail au bord droit du cadre, sans marge blanche ni coin
              arrondi (client 2026-08-13, capture attio à l'appui). Le texte
              du panneau garde ses marges ; la zone grise est bornée par un
              filet en haut et par le filet du panneau suivant en bas. */}
          {/* ⚠ `min-w-0` SUR LA COLONNE ET SUR CHAQUE PANNEAU, et c'est un
              correctif mesuré (audit du 2026-08-15). Un enfant de grille garde
              `min-width: auto`, c'est-à-dire qu'il REFUSE de descendre sous la
              largeur minimale de son contenu. Sous lg la grille tombe à une
              colonne, et la maquette Prévisionnel qu'un panneau contient a une
              largeur minimale supérieure à un écran de téléphone : la colonne
              se calait donc à 398 px dans un viewport de 375, et c'est ce
              débordement-là qui faisait scroller la page latéralement de 48 px.
              `max-w-[920px]` ne pouvait rien y faire, un maximum ne force pas un
              minimum à céder. */}
          <div className="min-w-0">
            {ITEMS.map((it, i) => (
              <div
                key={it.tab}
                id={`autotab-${i}`}
                ref={(el) => { panelsRef.current[i] = el; }}
                className={`min-w-0 ${i > 0 ? `border-t ${rule}` : ""}`}
              >
                {/* MÊME RÈGLE QUE LE TITRE DE SECTION sur téléphone : la
                    seconde encre passe à la ligne, dans le corps du texte
                    courant. Mesuré avant : « Le fichier bancaire, monté tout
                    seul. Hypothèses, plan de trésorerie… » tenait sur SIX
                    lignes à 21 px, titre et chapô indistincts. */}
                <p className="max-w-[46ch] px-5 pt-8 md:px-12 md:pt-16 font-instrument font-normal text-[1.2rem] md:text-[1.7rem] leading-[1.28] tracking-[-0.02em]">
                  <span className="text-[#111827] dark:text-white">{it.lead}</span>{" "}
                  <span className="text-[#6b7688] max-md:mt-2.5 max-md:block max-md:font-inter max-md:text-[0.95rem] max-md:leading-[1.55] max-md:tracking-normal dark:text-gray-500">{it.rest}</span>
                </p>

                {it.media === "previsionnel" ? (
                  /* PRÉVISIONNEL : la maquette de l'écran « Prévisionnel
                     d'activité » et sa carte flottante (voir
                     PrevisionnelStudio). La nappe grise est plus haute que
                     partout ailleurs — pb-20/pb-24 — parce que la carte
                     flottante déborde SOUS la fenêtre : la borner au même
                     rembourrage que les autres la ferait mordre sur le filet
                     du panneau suivant. */
                  <div className={`group/panel relative mt-8 md:mt-11 border-t ${rule} ${zone} px-5 pb-12 pt-6 md:px-12 md:pb-24 md:pt-12`}>
                    <ZoomButton
                      onClick={() => setZoom(i)}
                      label={t({ fr: "Agrandir", en: "Enlarge" })}
                    />
                    {/* 920 px : la largeur de mise en page pour laquelle
                        PrevisionnelStudio est composé (son `max-w-[920px]`).
                        ⚠ `wide` EST INDISPENSABLE ICI (client 2026-08-23 :
                        « pour prévisionnel j'aimerais que tu répliques sur
                        mobile exactement le même encadré que je t'envoie »).
                        `DesktopScale` impose bien 920 px de LARGEUR DE BOÎTE,
                        mais les points de rupture de Tailwind interrogent la
                        FENÊTRE : dans 920 px posés sur un écran de 390, `sm:`,
                        `md:` et `lg:` répondent tous non, et la maquette se
                        composait avec ses replis de téléphone — barre latérale
                        escamotée, colonne « en direct » absente, carte du
                        livrable remise dans le flux. Ni le bureau, ni le
                        téléphone : une troisième mise en page. `wide` fixe
                        l'état large, et la réduction fait le reste.
                        ⚠ LE DRAPEAU EST LEVÉ SOUS 1024 SEULEMENT, et le seuil
                        est celui de `DesktopScale` au-dessus, pas un hasard :
                        `crop !== CROP_DESK` VAUT `innerWidth < 1024`, c'est-à-
                        dire exactement « la boîte de 920 px est en place ».
                        Au-dessus, les points de rupture répondent déjà oui et
                        le drapeau serait presque sans effet — PRESQUE : il pose
                        aussi la cale de 24 px qui réserve le débord de la carte
                        flottante, inutile hors `DesktopScale` puisque rien n'y
                        rogne, et qui allongeait la page du bureau d'autant
                        (17 878 → 17 904 px, mesuré). Le bureau ne bouge pas.
                        Voir le pavé de PrevisionnelStudio. */}
                    <DesktopScale designWidth={920} upTo={1024}>
                      <PrevisionnelStudio wide={crop !== CROP_DESK} />
                    </DesktopScale>
                  </div>
                ) : it.media === "video" ? (
                  /* L'ENREGISTREMENT D'ÉCRAN, DANS SON CADRE, SUR DU BLANC.
                     Deux passes le 2026-08-14 : le clip est d'abord passé en
                     pleine page (« qu'elle prenne l'intégralité de sa partie
                     et qu'elle ne soit pas entourée de gris »), puis rendu à
                     son cadre (« remets la vidéo comme elle était avant, sans
                     pour autant remettre un fond gris derrière »).
                     La demande constante des deux passes, c'est LE GRIS, pas
                     le cadre : le clip retrouve donc ses 880 px, ses coins
                     arrondis, son liseré et son ombre — mais son conteneur
                     n'a plus de nappe, il est sur le blanc de la section. Les
                     deux cartes qui suivent gardent la leur : ce sont elles
                     qui en ont besoin, étant blanches.
                     LES 43 px DE ROGNAGE SONT MESURÉS, PAS ESTIMÉS : clip
                     décodé sur canvas, luminance des lignes du haut relevée à
                     2 s, 20 s et 40 s — la bande noire fait exactement 40 px
                     sur 1080 aux trois instants. On en rogne 43, soit 3 px de
                     marge. Le conteneur porte un rapport plus large que le
                     clip (1660/1037 contre 1660/1080) et la vidéo le remplit
                     en object-cover ancré en BAS : le cadrage se fait par le
                     haut. Première version à 65 px : elle coupait le bandeau
                     supérieur de l'application, vu tout de suite par le
                     client. Un futur clip sans bande : rapport 1660 / 1080 et
                     retirer object-bottom. */
                  <div className={`mt-8 md:mt-11 border-t ${rule}`}>
                    {/* LE REMBOURRAGE EST ICI, sur un bloc à lui, et pas sur
                        le conteneur du panneau : la nappe grise des deux
                        cartes qui suivent doit courir d'un filet à l'autre,
                        or un rembourrage posé plus haut la bordait de blanc
                        sur les côtés. */}
                    <div className="px-4 py-6 md:px-12 md:py-12">
                    {/* REPRISE À ZÉRO À CHAQUE ARRIVÉE (client 2026-08-13 :
                        « quand l'utilisateur arrive sur Bilan développé, que
                        la vidéo reprenne à zéro depuis le début à chaque
                        fois »). En `autoPlay`, le clip démarrait au
                        chargement de la page et tournait en boucle bien
                        avant qu'on n'arrive à ce panneau : le lecteur
                        tombait au milieu d'une démonstration déjà
                        commencée. InViewVideo pilote la lecture par
                        IntersectionObserver, remet `currentTime` à 0 en
                        entrant et met en pause en sortant, ce qui économise
                        au passage un décodage vidéo permanent sur une page
                        qui fait déjà tourner deux scènes WebGL.
                        LE CADRE EST PASSÉ EN PROP (client 2026-08-18) : la
                        barre de lecture est désormais SOUS le clip, elle ne
                        peut donc plus vivre dans un cadre `overflow-hidden` au
                        rapport figé. C'est VideoWithScrubber qui rend les
                        deux, l'un au-dessus de l'autre. */}
                    {/* ⚠ LA PASTILLE EST SORTIE DE LA VIDÉO le 2026-08-21
                        (client : « tu as mis cette flèche sur la vidéo, il faut
                        la mettre à côté »). Elle était posée EN SURIMPRESSION
                        sur le coin haut-droit du clip, comme sur les autres
                        panneaux — sauf qu'ici le clip est un enregistrement
                        d'écran : la pastille recouvrait une partie de
                        l'interface filmée, et rien ne distinguait un bouton du
                        site d'un bouton de l'application enregistrée.
                        Elle vit maintenant sur une ligne À ELLE, au-dessus du
                        clip, alignée à droite sur le même axe de 880 px : elle
                        reste visiblement rattachée à la vidéo sans mordre
                        dessus. Le `group/panel` migre avec elle sur le
                        conteneur commun, sinon le survol du clip n'allumerait
                        plus la pastille, qui n'en est plus une descendante. */}
                    <div className="group/panel mx-auto w-full max-w-[880px]">
                      <div className="mb-3 flex justify-end">
                        <ZoomButton
                          onClick={() => setZoom(i)}
                          label={t({ fr: "Agrandir la vidéo", en: "Enlarge the video" })}
                          inline
                        />
                      </div>
                      <VideoWithScrubber
                        src={DEMO_CLIP}
                        frameClassName="relative overflow-hidden rounded-[12px] ring-1 ring-[#0a2540]/[0.10] shadow-[0_24px_60px_-30px_rgba(10,37,64,0.45)] dark:ring-white/10"
                        frameStyle={{ aspectRatio: "1660 / 1037" }}
                        className="block h-full w-full object-cover object-bottom"
                      />
                    </div>
                    </div>
                    {/* SOUS la vidéo (client 2026-08-13, troisième passe) :
                        deux cartes — à gauche LA CARTE « Bilan développé » de
                        la grille, copie conforme avec son anneau de
                        particules ; à droite un texte. Le texte est la copie
                        déjà validée de cette même carte (sa fiche du panneau
                        de présentation), pas une rédaction nouvelle.
                        LA NAPPE GRISE EST ICI ET NULLE PART AILLEURS dans ce
                        panneau : le clip est sur le blanc de la section, ces
                        deux cartes blanches ont besoin d'un fond pour s'en
                        détacher. */}
                    <div className={`border-t ${rule} ${zone} px-3 py-6 md:px-12 md:py-12`}>
                    {/* ⚠ CÔTE À CÔTE À TOUTES LES LARGEURS, et c'est le retour
                        de l'arbitrage du 22/08 (client 2026-08-23 : « pour les
                        autres designs avec l'explication j'aimerais qu'ils
                        soient côte à côte, par exemple pour bilan développé »).
                        La passe du 22/08 les avait EMPILÉS sous 768, au nom de
                        la lisibilité : une demi-colonne de 125 px écrasait le
                        texte à 10,5 px sur neuf lignes. L'argument tient
                        toujours, et le client l'a tranché dans l'autre sens —
                        c'est la COMPOSITION qui prime, et elle est la même que
                        sur le bureau, en plus petit.
                        Ce qu'on fait pour limiter la casse, faute de pouvoir
                        élargir un téléphone : la nappe rend 16 px de
                        rembourrage (px-4 → px-3), l'écart entre colonnes tombe
                        de 16 à 10, et la rangée n'est plus à parts égales —
                        1 / 1,25 en faveur du TEXTE, la carte étant un décor qui
                        se regarde et non une chose qui se lit. Colonne de
                        texte mesurée à 390 px : 154 px utiles au lieu de 125. */}
                    <div className="mx-auto grid w-full max-w-[880px] grid-cols-[1fr_1.25fr] gap-2.5 md:grid-cols-2 md:gap-5 [&>*]:min-w-0">
                      <DesktopScale designWidth={400} upTo={1024} className="self-center">
                        <BilanShowcaseCard />
                      </DesktopScale>
                      {/* BLANC FRANC, SANS NAPPE (client 2026-08-13 : « il
                          faut que cet encadré soit full blanc »). La nappe
                          bleutée de la carte voisine y avait été posée le
                          matin même pour apparier les deux ; le client l'a
                          renvoyée. C'est le CONTRASTE qui est voulu : à
                          gauche le décor, à droite la lecture, sur un fond
                          net. Le liseré et l'ombre restent identiques, la
                          paire tient par eux.
                          LE SURVOL DE SA VOISINE, MOT POUR MOT (client
                          2026-08-14 : « applique ce contour léger bleu quand on
                          passe notre curseur au-dessus de bilan personnalisé »).
                          Les valeurs sont celles de CardShell dans
                          ShowcaseCards.tsx, recopiées et non approchées : même
                          agrandissement de 1,012, même liseré #3b82f6 à 55 %,
                          même ombre, même durée de 620 ms sur la même courbe.
                          Deux cartes côte à côte qui ne réagiraient pas
                          exactement pareil se verraient tout de suite.
                          `group` est posé sur CETTE carte et pas sur la rangée :
                          survoler l'une ne doit pas allumer l'autre. */}
                      <div className="group relative">
                      {/* L'ÉCHELLE DE TÉLÉPHONE DE LA DEMI-COLONNE. Titre 13,
                          texte 11, puces 10,5 : c'est le prix du côte à côte
                          demandé, et il est payé en corps, pas en contenu —
                          rien n'est coupé, la fiche dit toujours la même chose.
                          Le rembourrage tombe de 20 à 12 px pour rendre 16 px
                          de largeur au texte. */}
                      <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-[#0a2540]/[0.08] shadow-[0_2px_10px_-6px_rgba(10,37,64,0.14)] transform-gpu transition-[transform,box-shadow] duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012] group-hover:ring-[#3b82f6]/55 group-hover:shadow-[0_18px_44px_-22px_rgba(10,37,64,0.26)] p-3 md:p-8">
                        <h3 className="relative font-inter text-[13px] font-normal leading-[1.15] tracking-[-0.025em] text-[#0a2540] md:text-[1.5rem]">
                          {t({ fr: "Un bilan personnalisé", en: "A balance sheet of your own" })}
                        </h3>
                        <p className="relative mt-2 font-inter text-[11px] leading-[1.45] text-[#5b6577] md:mt-4 md:text-[15.5px] md:leading-relaxed">
                          {t({
                            fr: "Le bilan de votre client se regarde au lieu de se dérouler : marge, EBE, CAF, BFR et flux posés en grandes masses, avec la lecture qui va avec.",
                            en: "Your client's balance sheet is looked at rather than scrolled: margin, EBITDA, cash flow and working capital laid out as big blocks, with the reading to go with them.",
                          })}
                        </p>
                        <ul className="relative mt-2.5 space-y-1.5 md:mt-5 md:space-y-2.5">
                          {[
                            t({ fr: "Les SIG en un coup d'œil : marge, valeur ajoutée, EBE, CAF", en: "Key indicators at a glance: margin, value added, EBITDA, cash flow" }),
                            t({ fr: "BFR et flux de trésorerie mis en regard du bilan", en: "Working capital and cash flows set against the balance sheet" }),
                            t({ fr: "Traitement 100 % local, vos fichiers ne quittent pas votre poste", en: "100% local processing, your files never leave your machine" }),
                          ].map((li) => (
                            <li key={li} className="flex gap-1.5 font-inter text-[10.5px] leading-[1.45] text-[#42506b] md:gap-2.5 md:text-[14px]">
                              <span aria-hidden className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#3b82f6] md:mt-[7px] md:h-1.5 md:w-1.5" />
                              {li}
                            </li>
                          ))}
                        </ul>
                      </div>
                      </div>
                    </div>
                    </div>
                  </div>
                ) : it.media === "structure" ? (
                  /* CHANGEMENT DE STRUCTURE : nappe grise coupée en deux par
                     un filet. À gauche l'invite de saisie — un DÉCOR
                     (aria-hidden, aucun champ réel), elle évoque le geste, la
                     vraie saisie vit dans le logiciel. À droite, LA CARTE
                     « Conseillez la bonne structure, chiffres à l'appui » de
                     la grille, COPIE CONFORME (galaxie, nuage d'étiquettes,
                     nappes, coque — voir ShowcaseCards) : la version
                     compactée de la deuxième passe a été renvoyée par le
                     client, « l'encadré est bien trop petit pour répliquer ».
                     La colonne de droite est élargie (1,15 fr) et la carte
                     garde sa hauteur de grille (620 px). */
                  <div className={`group/panel relative mt-8 md:mt-11 border-t ${rule} ${zone} grid grid-cols-[1fr_1.15fr]`}>
                    <ZoomButton
                      onClick={() => setZoom(i)}
                      label={t({ fr: "Agrandir", en: "Enlarge" })}
                    />
                    {/* CENTRÉ VERTICALEMENT (client 2026-08-13) : la carte de
                        droite fait 620 px, ce bloc en faisait 200 et restait
                        collé en haut. `justify-center` sur une colonne flex
                        le pose au milieu de la hauteur que la carte impose.
                        CÔTE À CÔTE À TOUTES LES LARGEURS : voir le pavé de la
                        rangée « Bilan ». L'empilement du 22/08 est renvoyé par
                        le client le 23/08, la composition du bureau reprend, et
                        le filet redevient vertical à toutes les largeurs. La
                        cellule de gauche étant du texte, elle passe à
                        l'échelle de téléphone — 11,5 px — et rend 8 px de
                        rembourrage. */}
                    <div className={`flex min-w-0 flex-col justify-center p-3 md:p-10 border-r ${rule}`}>
                      <p className="font-inter text-[11.5px] md:text-[16.5px] leading-snug">
                        <span className="font-semibold text-[#111827] dark:text-white">
                          {t({ fr: "Vous décrivez le changement.", en: "You describe the change." })}
                        </span>
                        <span className="mt-1.5 block text-[#8b95a7] dark:text-gray-400">
                          {t({
                            fr: "SARL vers SAS, passage en holding : le scénario tient en une phrase.",
                            en: "SARL to SAS, moving to a holding: the scenario fits in one sentence.",
                          })}
                        </span>
                      </p>
                      {/* Le champ s'écrit tout seul (client 2026-08-13). Reste
                          un DÉCOR : aria-hidden, aucun input réel, la vraie
                          saisie vit dans le logiciel. `min-w-0` sur le
                          conteneur du texte, sinon la phrase en cours de
                          frappe pousse la pastille bleue hors du champ. */}
                      <div aria-hidden className="mt-4 md:mt-16 flex items-center gap-1.5 md:gap-3 rounded-full bg-white py-1.5 pl-3 pr-1.5 md:py-2.5 md:pl-5 md:pr-2.5 ring-1 ring-[#0a2540]/[0.10] dark:bg-[#111827] dark:ring-white/10">
                        <span className="min-w-0 flex-1 truncate font-inter text-[10px] md:text-[13.5px] text-[#5b6577] dark:text-gray-300">
                          <Typewriter
                            phrases={[
                              t({
                                fr: "Comment optimiser la rémunération du dirigeant",
                                en: "How to optimise the director's pay",
                              }),
                            ]}
                          />
                        </span>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#3b82f6] text-white md:h-8 md:w-8">
                          <ArrowRight className="h-3 w-3 md:h-4 md:w-4" strokeWidth={2.2} />
                        </span>
                      </div>
                    </div>

                    {/* `min-w-0` : voir le pavé de la colonne des panneaux.
                        Ces deux cellules portent une carte de la grille bento à
                        sa taille de grille ; sans lui, la cellule se cale sur la
                        largeur minimale de la carte et déborde du téléphone. */}
                    <div className="flex min-w-0 items-center overflow-hidden p-2 md:p-8">
                      <DesktopScale designWidth={430} upTo={1024}>
                        <StructureShowcaseCard />
                      </DesktopScale>
                    </div>
                  </div>
                ) : it.media === "valuation" ? (
                  /* ÉVALUATION D'ENTREPRISE : LA CARTE « Évaluation
                     financière » de la grille, copie conforme et ENTIÈRE —
                     coque blanche, nappe, rubans de soie, carte-objet — posée
                     sur la nappe grise (« je veux même tout l'encadré »). */
                  <div className={`group/panel relative mt-8 md:mt-11 border-t ${rule} ${zone} grid grid-cols-[1.15fr_1fr]`}>
                    <ZoomButton
                      onClick={() => setZoom(i)}
                      label={t({ fr: "Agrandir", en: "Enlarge" })}
                    />
                    {/* `min-w-0` : voir le pavé de la colonne des panneaux.
                        Ces deux cellules portent une carte de la grille bento à
                        sa taille de grille ; sans lui, la cellule se cale sur la
                        largeur minimale de la carte et déborde du téléphone. */}
                    <div className="flex min-w-0 items-center overflow-hidden p-2 md:p-8">
                      <DesktopScale designWidth={430} upTo={1024}>
                        <ValuationShowcaseCard />
                      </DesktopScale>
                    </div>
                    {/* À DROITE, les questions auxquelles la valorisation
                        répond, écrites l'une après l'autre (client
                        2026-08-13). Ce sont des QUESTIONS, pas des résultats :
                        annoncer un chiffre qui s'écrit tout seul laisserait
                        croire à un calcul en direct. */}
                    {/* CÔTE À CÔTE À TOUTES LES LARGEURS : voir le pavé de la
                        rangée « Bilan ». Le filet redevient vertical, la
                        colonne passe à l'échelle de téléphone. */}
                    <div className={`flex min-w-0 flex-col justify-center border-l ${rule} p-3 md:p-10`}>
                      <p className="font-inter text-[9px] leading-tight md:text-[13px] md:leading-normal font-semibold uppercase tracking-[0.14em] text-[#6b7688]">
                        {t({ fr: "Ce que la synthèse répond", en: "What the summary answers" })}
                      </p>
                      {/* min-h : la place réservée à la frappe, faute de quoi
                          la colonne se remonte à chaque phrase plus courte. La
                          demi-colonne de téléphone ramenant les questions à
                          TROIS lignes (la plus longue fait 47 signes dans
                          140 px), la réserve passe de 2,6 à 3,9 em — la même
                          qu'en colonne de bureau, où elle vaut trois lignes
                          d'un corps plus grand dans une colonne plus large. */}
                      <p className="mt-2 min-h-[3.9em] font-instrument text-[13px] font-normal leading-[1.3] tracking-[-0.02em] text-[#111827] md:mt-5 md:min-h-[3.9em] md:text-[1.5rem] md:leading-[1.35] dark:text-white">
                        <Typewriter
                          phrases={[
                            t({ fr: "Combien vaut cette entreprise, et pourquoi ?", en: "What is this business worth, and why?" }),
                            t({ fr: "Quelle méthode tire la valeur vers le haut ?", en: "Which method pulls the value up?" }),
                            t({ fr: "Quel écart entre les cinq approches ?", en: "How far apart are the five approaches?" }),
                            t({ fr: "Que répondre si le client conteste le chiffre ?", en: "What to answer if the client disputes the figure?" }),
                          ]}
                        />
                      </p>
                      <p className="mt-2.5 max-w-[38ch] font-inter text-[11px] leading-[1.45] text-[#5b6577] md:mt-6 md:text-[14.5px] md:leading-relaxed dark:text-gray-400">
                        {t({
                          fr: "Chaque réponse est adossée à des multiples et des comparables explicites, pas à une moyenne opaque.",
                          en: "Every answer rests on explicit multiples and comparables, not an opaque average.",
                        })}
                      </p>
                    </div>
                  </div>
                ) : it.modules ? (
                  /* « CONTRÔLES ET SUIVI » : les quatre modules à gauche, et à
                     droite LE LOGICIEL, rogné (client 2026-08-14 : « une
                     réplication de logiciel mais où l'on voit qu'un bout de cet
                     encadré de réplication, comme pour l'encadré Gagnez des
                     heures »).
                     C'est LE MÊME COMPOSANT que la grande carte citée,
                     OraAppScene, et c'est tout l'intérêt : rendu à l'échelle
                     réelle puis TRANCHÉ par le bord du cadre, il garde la
                     netteté du hero là où une maquette remise à l'échelle
                     l'aurait perdue.
                     ⚠ CE QUI RESTE À L'ÉCRAN est le flanc gauche : barre
                     latérale, salutation, et la PREMIÈRE COLONNE de la grille
                     « Accès rapide ». « Suivi budgétaire » vit en deuxième
                     colonne et tombe donc hors du rognage. Pour le faire
                     entrer il faudrait soit descendre l'échelle à ~0,54 (le
                     texte perdrait la netteté qui fait tout l'intérêt du
                     procédé), soit décaler la scène de 260 px vers la gauche
                     et trancher la barre latérale, donc perdre l'angle de la
                     fenêtre — précisément ce que montre la carte citée en
                     référence. On garde l'angle : le propos est de laisser
                     voir un bout de logiciel, pas de faire lire une tuile.
                     `overflow-hidden` est ICI et pas ailleurs : sans lui la
                     fenêtre sortirait de la nappe et passerait par-dessus le
                     filet du panneau suivant. */
                  <div className={`mt-8 md:mt-11 border-t ${rule} ${zone} grid grid-cols-[1fr_1.08fr] overflow-hidden`}>
                    {/* ⚠ CÔTE À CÔTE À TOUTES LES LARGEURS (client 2026-08-23,
                        capture du bureau à l'appui : « j'aimerais que tu fasses
                        comme pour le deuxième screen et que le tout soit côte à
                        côte »). C'est le troisième aller-retour sur cette
                        rangée, et la décision est arrêtée : les quatre modules
                        à gauche, la fenêtre du logiciel à droite, à toutes les
                        largeurs. L'empilement du 22/08 est renvoyé.
                        Le coût est connu et payé en corps : 12 px pour les
                        titres, 11 px pour les phrases, dans 150 px utiles à
                        390 px d'écran. Le rembourrage tombe de 20 à 12 px et
                        l'interligne des rangées de 16 à 12 pour rendre au texte
                        ce que la scission lui prend. */}
                    <ul className={`min-w-0 border-r px-3 py-5 ${rule} md:px-10 md:py-12`}>
                      {it.modules.map((m) => (
                        <li key={m.title} className={`border-t ${rule} py-3 first:border-t-0 first:pt-0 last:pb-0 md:py-5`}>
                          {/* `md:` sur l'interlignage : sans préfixe il fuyait
                              au-dessus de md et raccourcissait les quatre
                              titres de 4 px chacun — 16 px de moins sur la page
                              du bureau, relevés à la mesure. */}
                          <p className="font-inter text-[12px] font-semibold leading-tight text-[#111827] md:text-[15.5px] md:leading-normal dark:text-white">
                            {m.title}
                          </p>
                          <p className="mt-1 font-inter text-[11px] leading-[1.45] md:mt-1.5 md:text-[14.5px] md:leading-relaxed">
                            <span className="text-[#42506b] dark:text-gray-300">{m.lead}</span>{" "}
                            <span className="text-[#8b95a7] dark:text-gray-500">{m.rest}</span>
                          </p>
                        </li>
                      ))}
                    </ul>

                    {/* ⚠ UN SEUL CADRE, ET UNE SEULE INSTANCE D'OraAppScene.
                        La fenêtre est TRANCHÉE par le bord de la demi-colonne à
                        toutes les largeurs, comme sur la capture du bureau ; ce
                        qui change d'un palier à l'autre, c'est l'échelle, de
                        sorte que le cadrage reste à peu près le même — barre
                        latérale, salutation, grande carte bleue. Voir le pavé
                        de `readCrop`.
                        L'ANCRAGE VERTICAL SUIT L'ÉCHELLE. Sur le bureau la
                        scène réduite fait 590 px de haut, plus que la cellule :
                        elle est calée en haut et débordée par le bas, c'est le
                        cadrage d'origine, il ne bouge pas. Réduite, elle
                        devient PLUS COURTE que la colonne des quatre modules —
                        302 px contre ~560 — et calée en haut elle laisserait
                        250 px de nappe grise vide sous elle. Elle est donc
                        centrée sur la hauteur de la cellule, la marge négative
                        compensant la hauteur réellement peinte (la boîte, elle,
                        fait toujours 720 px : `transform-origin: top left`).
                        `chips="none"` : les pastilles flottantes racontent
                        l'entrée d'un fichier et la sortie des livrables. C'est
                        le propos de la GRANDE CARTE, pas celui de ce panneau. */}
                    <div aria-hidden className="relative overflow-hidden">
                      <div
                        className="absolute left-2 h-[720px] w-[1180px] md:left-6 lg:left-10"
                        style={
                          crop === CROP_DESK
                            ? { top: 44 }
                            : { top: "50%", marginTop: -(720 * crop) / 2 }
                        }
                      >
                        <OraAppScene cropScale={crop} chips="none" />
                      </div>
                    </div>
                  </div>
                ) : it.examples ? (
                  /* LE FOURRE-TOUT, DANS SES COULEURS D'ORIGINE. Une passe du
                     2026-08-13 lui avait donné une nappe bleue, des exemples en
                     pastilles et un bouton au dégradé de marque, pour le
                     distinguer des autres panneaux ; le client l'a renvoyée le
                     jour même (« remets les couleurs comme avant, ne rajoute
                     pas du bleu, ne rajoute pas un bouton Ora Engineering comme
                     ça, ça ne va pas du tout »). Retour donc à la liste sur
                     fond de section, filets fins, et au renvoi Ora Engineering
                     en lien dans la phrase. Ce qui distingue l'onglet reste
                     ENTIER dans le rail (le ✦, le filet pointillé, la glose) :
                     c'est là qu'il avait été demandé, et il n'a pas bougé. */
                  <div className="px-5 pb-10 md:px-12 md:pb-16 mt-7 md:mt-11">
                    {/* UNE COLONNE SOUS 640 : sept intitulés de traitement, dont
                        « Lettres et attestations tarifées à partir de vos propres
                        données ». Sur deux colonnes de 165 px ils passaient à
                        trois lignes chacun, et la dernière rangée restait à
                        moitié vide. Une colonne, une ligne par traitement : la
                        liste redevient une liste. */}
                    <ul className="grid grid-cols-1 gap-x-5 sm:grid-cols-2 sm:gap-x-10">
                      {it.examples.map((ex) => (
                        <li
                          key={ex}
                          className={`border-t ${rule} py-3 font-inter text-[14px] leading-[1.45] text-[#42506b] md:py-3 md:text-[14.5px] dark:text-gray-400`}
                        >
                          {ex}
                        </li>
                      ))}
                    </ul>
                    {it.engineering && (
                      /* LE BANDEAU DE FORMATS EN PIED, À DROITE (client
                         2026-08-15 : « mets [les pastilles Excel, PowerPoint,
                         PDF, CSV] en bas à droite de la partie
                         automatisation »). Il vivait dans l'en-tête
                         « Automatisez de bout en bout », retiré le même jour ;
                         il se retrouve ici, au pied du dernier panneau, c'est-
                         à-dire au pied du cadre entier.
                         La place a un sens : ce panneau est le fourre-tout, et
                         les pastilles disent exactement ce que la liste ne peut
                         pas énumérer, les FORMATS qu'Ora sait prendre et rendre.
                         Elles ferment donc la section sur une ouverture.
                         `items-end` et non `items-center` : la phrase fait deux
                         lignes, les pastilles une seule ; alignées par le bas,
                         elles s'assoient sur la même ligne de base que la
                         dernière ligne de texte. */
                      <div className="mt-6 flex items-end justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-5 sm:mt-7 sm:gap-10">
                        <p className="max-w-[52ch] font-inter text-[14px] leading-[1.5] text-[#5b6577] md:text-[14.5px] md:leading-relaxed dark:text-gray-400">
                          {t({
                            fr: "Votre traitement n'est pas dans la liste ? Décrivez-le à ",
                            en: "Your routine is not on the list? Describe it to ",
                          })}
                          <button
                            type="button"
                            onClick={openBooking}
                            className="font-semibold text-[#2f6ff0] underline decoration-[#2f6ff0]/30 underline-offset-[3px] transition-colors hover:text-[#1d4ed8] hover:decoration-[#1d4ed8]/60"
                          >
                            Ora Engineering
                          </button>
                          {t({ fr: ", on vous le livre sur mesure.", en: ", we build it for you." })}
                        </p>
                        <div className="shrink-0">
                          <FileChipStrip />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* VIDE, à dessein : hauteur réservée en attendant
                     l'enregistrement d'écran du module. */
                  <div aria-hidden className="mt-8 h-[140px] md:mt-12 md:h-[280px]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LA FENÊTRE D'AGRANDISSEMENT ────────────────────────────────────
          Elle rend LE MÊME composant que le panneau, pas une copie : la
          maquette Prévisionnel, la carte structure et la carte d'évaluation
          sont dimensionnées en `cqw` ou par leur conteneur, elles occupent donc
          la largeur qu'on leur donne sans réglage. Le clip, lui, garde son
          cadre et son rapport.
          `zoom` porte l'index du panneau : c'est lui qui donne le titre de la
          fenêtre, donc son nom accessible. */}
      {zoom !== null && ITEMS[zoom] && (
        /* Le panneau reçoit la copie DÉJÀ ÉCRITE de l'onglet : `lead` est la
           phrase-bénéfice, `rest` le paragraphe, `examples` la liste à coches
           quand elle existe (seul « Automatisations » en a une aujourd'hui).
           Rien n'est rédigé pour la fenêtre : elle montre en grand ce que le
           panneau dit déjà en petit. */
        <ZoomOverlay
          title={ITEMS[zoom].tab}
          lead={ITEMS[zoom].lead}
          desc={ITEMS[zoom].rest}
          checks={ITEMS[zoom].examples}
          onBook={openBooking}
          bookLabel={t({ fr: "Réserver un appel", en: "Book a call" })}
          seeLabel={
            ITEMS[zoom].media === "video"
              ? t({ fr: "Voir la démo", en: "Watch the demo" })
              : t({ fr: "Voir l'aperçu", en: "See the preview" })
          }
          onClose={() => setZoom(null)}
        >
          {ITEMS[zoom].media === "previsionnel" ? (
            <PrevisionnelStudio />
          ) : ITEMS[zoom].media === "video" ? (
            <VideoWithScrubber
              src={DEMO_CLIP}
              frameClassName="relative overflow-hidden rounded-[12px] ring-1 ring-[#0a2540]/[0.10] dark:ring-white/10"
              frameStyle={{ aspectRatio: "1660 / 1037" }}
              className="block h-full w-full object-cover object-bottom"
            />
          ) : ITEMS[zoom].media === "structure" ? (
            <StructureShowcaseCard />
          ) : ITEMS[zoom].media === "valuation" ? (
            <ValuationShowcaseCard />
          ) : null}
        </ZoomOverlay>
      )}
    </section>
  );
}
