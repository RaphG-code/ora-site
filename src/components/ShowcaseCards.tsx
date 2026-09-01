import { Suspense, lazy } from "react";
import RepelChips, { type Chip } from "./RepelChips";
import ValuationCard from "./ValuationCard";
import { useLang } from "@/lib/i18n";
import { useIsPhone } from "@/lib/useIsPhone";

/* ⚠ CHARGÉ À LA DEMANDE : voir le pavé jumeau dans UseCasesBento.tsx. three.js
   pèse 488 ko et ce décor n'est jamais au-dessus de la ligne de flottaison. */
const ParticleOrbGL = lazy(() => import("./ParticleOrbGL"));

/**
 * ShowcaseCards — les COPIES CONFORMES de trois cartes de la grille bento,
 * pour la section à onglets AutomationTabs (client 2026-08-13 : « je veux que
 * tu recopies exactement cette carte de design-là », « la carte avec le design
 * et background de la galaxie et les mêmes couleurs », « exactement le même
 * design que Bilan développé avec l'anneau de particules »).
 *
 * POURQUOI C'ÉTAIT UNE COPIE : le client avait exigé que la grille d'origine
 * reste « telle quelle » — refactorer UseCasesBento (2 300 lignes) pour en
 * extraire la coque des cartes aurait mis la grille en risque pour un bénéfice
 * nul à ses yeux. Les valeurs ci-dessous ont donc été RELEVÉES dans
 * UseCasesBento.tsx le 2026-08-13 : GRAIN, SKY_BILAN, SKY_EVALUATION,
 * SKY_EXTRACTION, AURA_FLOW / AURA_STEP / SILK_FADE / WAVE_PATH, BILAN_CHIPS,
 * STRUCTURE_CHIPS, la coque (rounded-[14px], ring, ombre, survol 1,012,
 * p-7/p-8, titre font-inter 1,3/1,5 rem encre #0a2540) et les invocations
 * ParticleOrbGL (anneau 760/7200 à top-52 %, galaxie 980/12000 à top-46 %).
 *
 * ✔ CE N'EST PLUS UNE COPIE, ET IL N'Y A PLUS RIEN À SYNCHRONISER (2026-08-13,
 * fin de journée). Le client a fait retirer de la grille les trois cartes dont
 * ces valeurs venaient (« elles ne servent plus à rien », les modules étant
 * désormais présentés par AutomationTabs) : ce fichier en est le SEUL
 * propriétaire. L'avertissement de report croisé qui tenait cette place n'a
 * plus d'objet. Les originaux et leurs pavés de réglage restent dans
 * l'historique git de UseCasesBento.tsx.
 *
 * DEUX ÉCARTS VOLONTAIRES avec l'original, et seulement deux :
 *   · pas de bouton d'agrandissement en haut à droite : ici les cartes sont
 *     des VISUELS, il n'y a pas de panneau de présentation à ouvrir — un
 *     bouton qui ne fait rien serait pire que pas de bouton ;
 *   · les dégradés SVG et les animations portent des noms PROPRES (acSilk*,
 *     acFlow, acWave) : les defs SVG sont globales à la page et les classes
 *     ucb-* n'existent que si la grille est montée — la section doit vivre
 *     seule.
 */

/* ── Constantes relevées dans UseCasesBento.tsx (2026-08-13) ──────────────── */

const INK = "#0a2540";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const BILAN_BLUE = { pale: "169,200,250", soft: "143,208,199", core: "147,184,248", mid: "176,205,249" } as const;

export const SHOWCASE_WASH_BILAN = [
  GRAIN,
  `radial-gradient(62% 32% at 22% 44%, rgba(${BILAN_BLUE.pale},0.3) 0%, rgba(${BILAN_BLUE.pale},0) 76%)`,
  `radial-gradient(58% 30% at 80% 58%, rgba(${BILAN_BLUE.soft},0.26) 0%, rgba(${BILAN_BLUE.soft},0) 76%)`,
  `radial-gradient(122% 62% at 50% 50%, rgba(${BILAN_BLUE.core},0.36) 0%, rgba(${BILAN_BLUE.mid},0.18) 54%, rgba(255,255,255,0) 88%)`,
].join(", ");

const SKY_EVALUATION = [
  GRAIN,
  "radial-gradient(100% 50% at 50% 50%, rgba(147,184,248,0.24) 0%, rgba(184,210,248,0.11) 52%, rgba(255,255,255,0) 86%)",
].join(", ");

const SKY_EXTRACTION = [
  GRAIN,
  "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.66) 16%, rgba(255,255,255,0.24) 32%, rgba(255,255,255,0) 46%)",
  "radial-gradient(56% 30% at 16% 56%, rgba(143,176,234,0.19) 0%, rgba(143,176,234,0) 78%)",
  "radial-gradient(72% 36% at 64% 64%, rgba(168,208,241,0.18) 0%, rgba(168,208,241,0) 80%)",
  "radial-gradient(122% 62% at 46% 60%, rgba(170,204,244,0.2) 0%, rgba(190,218,248,0.1) 54%, rgba(255,255,255,0) 88%)",
].join(", ");

const AURA_FLOW =
  "repeating-linear-gradient(205deg," +
  " rgba(29,78,216,0.22) 0px, rgba(59,130,246,0.19) 90px, rgba(163,196,251,0.16) 170px," +
  " rgba(147,186,250,0.18) 250px, rgba(88,149,247,0.21) 330px, rgba(35,88,222,0.22) 420px," +
  " rgba(29,78,216,0.22) 520px)";
const AURA_STEP = Math.round((520 / Math.cos((25 * Math.PI) / 180)) * 100) / 100;

const SILK_FADE =
  "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 20%," +
  " rgba(0,0,0,0.72) 54%, rgba(0,0,0,1) 82%, rgba(0,0,0,0.66) 100%)";

const WAVE_PATH =
  "M0,80 C100,20 200,140 300,80 C400,20 500,140 600,80" +
  " C700,20 800,140 900,80 C1000,20 1100,140 1200,80" +
  " L1200,130 C1100,190 1000,70 900,130 C800,190 700,70 600,130" +
  " C500,190 400,70 300,130 C200,190 100,70 0,130 Z";

/* Animations : mêmes durées et mêmes courbes que la grille, sous des noms
   propres. (Pas de backticks dans ce bloc : il vit dans un template literal.) */
const AC_CSS = `
@keyframes acFlow { from { transform: translateY(0); } to { transform: translateY(-${AURA_STEP}px); } }
.ac-flow { animation: acFlow 10s linear infinite; will-change: transform; }
@keyframes acWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ac-wave-a { animation: acWave 11s linear infinite; will-change: transform; }
.ac-wave-b { animation: acWave 16s linear infinite reverse; will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .ac-flow, .ac-wave-a, .ac-wave-b { animation: none !important; }
}
`;

/* Les nuages d'étiquettes, au libellé et à la position près. */
/* ⚠ SEMIS RESSERRÉ (client 2026-08-13 : « que les mots encadrés à l'intérieur
   soient un peu plus regroupés vers le centre, et fais plus ressortir le
   background blanc en haut et en bas »). Ce sont les positions de la grille,
   passées par une transformation unique et documentée pour rester vérifiables :
     x' = 50 + (x - 50) x 0,82     (resserrement vers l'axe)
     y' = y x 0,707 + 12,96        (la bande passe de 4-86 % à 16-74 %)
   Les 26 % de hauteur ainsi libérés, 16 en haut et 26 en bas, sont exactement
   le blanc demandé. La grille du bas, elle, garde son semis d'origine. */
const BILAN_CHIPS = (t: (m: { fr: string; en: string }) => string): Chip[] => [
  { label: t({ fr: "Marge brute", en: "Gross margin" }), x: 14.3, y: 16.0 },
  { label: t({ fr: "EBE", en: "EBITDA" }), x: 65.2, y: 17.4, tone: "blue" },
  { label: t({ fr: "Valeur ajoutée", en: "Value added" }), x: 34.0, y: 27.3 },
  { label: t({ fr: "BFR", en: "Working capital" }), x: 68.5, y: 33.0, tone: "teal" },
  { label: t({ fr: "CAF", en: "Cash flow" }), x: 16.0, y: 41.5, tone: "teal" },
  { label: t({ fr: "Résultat d'exploitation", en: "Operating profit" }), x: 43.9, y: 42.9 },
  { label: t({ fr: "Flux de trésorerie", en: "Cash flows" }), x: 19.3, y: 57.0, tone: "blue" },
  { label: t({ fr: "Trésorerie nette", en: "Net cash" }), x: 57.0, y: 58.4 },
  { label: t({ fr: "✦ Conseil : alléger le BFR", en: "✦ Tip: lighten the working capital" }), x: 24.2, y: 74.0, tone: "advice" },
];

/* ⚠ SEMIS REPRIS EN RANGÉES (client 2026-08-13 : « fais en sorte que tous les
   encadrés soient un minimum espacés, il y en a qui sont trop collés »). Le
   semis précédent était le semis de la grille passé par un resserrement
   homothétique — or la grille donne à cette carte TOUTE la largeur de la page,
   là où la section à onglets ne lui laisse qu'une demi-colonne (~420 px de
   nuage). Les étiquettes gardaient leurs écarts en POURCENTAGE, donc trois
   fois moins de pixels : « Optimisation rémunération dirigeant » (~273 px)
   chevauchait « SA », et « Micro-entreprise » le frôlait à 11 px.
   Les positions sont donc posées ici en fonction de la LARGEUR RÉELLE des
   libellés, en six rangées régulières de 16 à 74 % (les deux bandes blanches
   du fondu sont préservées) :
     · 11,6 % entre deux rangées, soit ~44 px pour une étiquette de 35 px de
       haut — 9 px d'air, jamais de contact ;
     · sur une même rangée, le voisin de droite démarre APRÈS la fin mesurée du
       précédent, avec au moins 30 px de marge ;
     · les deux longues étiquettes (la conseil et l'optimisation) ont leur
       rangée pour elles seules.
   La grille du bas garde son propre semis : elle n'a pas le problème. */
const STRUCTURE_CHIPS = (t: (m: { fr: string; en: string }) => string): Chip[] => [
  { label: t({ fr: "Holding", en: "Holding" }), x: 11.0, y: 16.0, tone: "blue" },
  { label: t({ fr: "SAS", en: "Inc." }), x: 66.0, y: 16.0 },
  { label: t({ fr: "SARL", en: "Ltd" }), x: 33.0, y: 27.6 },
  { label: t({ fr: "SCI", en: "Property SPV" }), x: 72.0, y: 27.6 },
  { label: t({ fr: "SASU", en: "LLC" }), x: 13.0, y: 39.2 },
  { label: t({ fr: "SA", en: "PLC" }), x: 57.0, y: 39.2 },
  { label: t({ fr: "Micro-entreprise", en: "Sole trader" }), x: 30.0, y: 50.8, tone: "blue" },
  { label: t({ fr: "Optimisation rémunération dirigeant", en: "Director pay optimisation" }), x: 9.0, y: 62.4, tone: "blue" },
  { label: t({ fr: "✦ Comparatif avant / après", en: "✦ Before / after comparison" }), x: 26.0, y: 74.0, tone: "advice" },
];

/** Fondu vertical du décor : blanc franc sur les deux bords, pleine matière au
 *  centre. Il borne le décor à la même bande que le semis d'étiquettes. */
export const SHOWCASE_FADE_TB =
  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 9%, #000 18%," +
  " #000 76%, rgba(0,0,0,0.35) 89%, transparent 100%)";

/* ── La coque commune ─────────────────────────────────────────────────────── */

function CardShell({
  title,
  wash,
  children,
  art,
}: {
  title: string;
  wash: string;
  children?: React.ReactNode;
  art?: React.ReactNode;
}) {
  return (
    <div className="group relative h-full">
      {/* ⚠ `min-h` SANS PRÉFIXE, et c'est un correctif mesuré (client
          2026-08-20 : « you make them way smaller than they are on the
          website »). La hauteur était `md:min-h-[620px]`, donc absente sous
          768 px — or ces trois cartes ne vivent que dans AutomationTabs, à
          l'intérieur de `SwipeDeck` (`DesktopScale` avant le 2026-08-20), qui
          impose une LARGEUR de bureau mais ne peut rien pour les media
          queries : elles sont évaluées contre la FENÊTRE, pas contre le
          conteneur. Sur téléphone la carte perdait donc
          sa hauteur de design, `RepelChips` (h-full) s'effondrait avec elle, et
          le nuage d'étiquettes se repliait sur le titre — une languette de
          40 px au lieu de la carte. Sans préfixe, la hauteur vaut partout : le
          bureau ne bouge pas (md: s'appliquait déjà au-dessus de 768) et la
          version réduite garde ses proportions. */}
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[14px] p-7 ring-1 ring-[#0a2540]/[0.08] shadow-[0_2px_10px_-6px_rgba(10,37,64,0.14)] transform-gpu transition-[transform,box-shadow] duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012] group-hover:ring-[#3b82f6]/55 group-hover:shadow-[0_18px_44px_-22px_rgba(10,37,64,0.26)] min-h-[620px] md:p-8"
        style={{ background: "#ffffff" }}
      >
        {/* BANDES BLANCHES EN HAUT ET EN BAS (client 2026-08-13). Le même
            fondu vertical est posé DEUX FOIS, et il le faut : la nappe et le
            décor WebGL sont deux couches distinctes, un masque sur la seule
            nappe laisserait l'anneau et la galaxie déborder dans le blanc.
            Le fondu s'ouvre à 16 % et se referme à 78 %, la bande exacte que
            le semis d'étiquettes occupe désormais. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: wash, maskImage: SHOWCASE_FADE_TB, WebkitMaskImage: SHOWCASE_FADE_TB }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ maskImage: SHOWCASE_FADE_TB, WebkitMaskImage: SHOWCASE_FADE_TB }}
        >
          {art}
        </div>
        {/* ⚠ `max-md:pr-32` : la pastille d'agrandissement du panneau vit HORS
            de la boîte mise à l'échelle, elle garde donc ses 28 px réels
            pendant que la carte est réduite à ~0,34. Ses 28 px couvrent alors
            ~106 px de l'espace de la carte, quand `pr-14` n'en dégage que 56 :
            le titre passait sous le bouton (vu en capture le 2026-08-21).
            La réserve est posée en `max-md:` parce qu'au-dessus l'échelle vaut
            1 et que `pr-14` suffit — le bureau ne bouge pas. */}
        <h3
          className="relative pr-14 max-md:pr-32 font-inter text-[1.3rem] font-normal leading-[1.15] tracking-[-0.025em] md:text-[1.5rem]"
          style={{ color: INK }}
        >
          {title}
        </h3>
        {/* ⚠ LES NUAGES D'ÉTIQUETTES SONT EN `absolute inset-0`, PAS EN
            `h-full` (correctif du 2026-08-20). Ce conteneur porte `items-center`
            — ses enfants ne s'étirent donc pas — et sa propre hauteur vient de
            `flex-1`. Sous `DesktopScale`, la chaîne de résolution des hauteurs
            en POURCENTAGE se rompait : `height: 100%` retombait à 0, les neuf
            étiquettes s'empilaient toutes à `top: 0` et la carte se lisait
            comme une languette. Une ENVELOPPE `absolute inset-0` prend la boîte
            du parent sans passer par un pourcentage, et le `h-full` du nuage
            résout alors contre elle.
            ⚠ L'enveloppe est nécessaire : passer `absolute inset-0` directement
            en `className` à RepelChips ne marche pas, il pose déjà `relative`
            sur sa racine et les deux règles de position se battent — `relative`
            l'emporte, et le nuage retombe à zéro. Essayé, mesuré, et cela
            cassait aussi le bureau. */}
        <div className="relative flex h-[280px] w-full flex-1 items-center justify-center md:h-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Les trois cartes ─────────────────────────────────────────────────────── */

/** « Bilan développé » : l'anneau de particules WebGL derrière le nuage des
 *  SIG. Anneau à 760 / 7200, centré à 52 % — les valeurs de la grille. */
export function BilanShowcaseCard() {
  const { t } = useLang();
  const phone = useIsPhone();
  return (
    <CardShell
      title={t({ fr: "Bilan développé", en: "Detailed balance sheet" })}
      wash={SHOWCASE_WASH_BILAN}
      art={
        <Suspense fallback={null}>
          <ParticleOrbGL
            size={760}
            /* ⚠ LE DÉCOR TOURNE MAINTENANT SUR TÉLÉPHONE (client 2026-08-21 :
               « add the background animation behind the things so we have
               little particles »). Il portait `hidden md:block` depuis
               l'origine — la carte réduite se lisait donc comme un cadre vide
               avec des étiquettes, ce qui explique pour partie le « c'est
               catastrophique » de la veille.
               LE SEMIS EST ALLÉGÉ, PAS LA TAILLE : à l'échelle du téléphone
               l'anneau fait ~290 px à l'écran, et 7 200 points s'y empilent en
               bouillie autant qu'ils coûtent. Un tiers suffit à dessiner la
               même couronne. La taille reste 760 pour que la géométrie du
               bureau soit conservée au pixel après mise à l'échelle. */
            count={phone ? 2400 : 7200}
            className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2"
          />
        </Suspense>
      }
    >
      <div className="absolute inset-0">
        <RepelChips chips={BILAN_CHIPS(t)} className="h-full w-full" />
      </div>
    </CardShell>
  );
}

/** « Conseillez la bonne structure, chiffres à l'appui » : la galaxie à trois
 *  bras derrière les formes juridiques. 980 / 12000, centrée à 46 %. */
export function StructureShowcaseCard() {
  const { t } = useLang();
  const phone = useIsPhone();
  return (
    <CardShell
      title={t({
        fr: "Conseillez la bonne structure, chiffres à l'appui",
        en: "Advise the right legal structure, with the figures to back it",
      })}
      wash={SKY_EXTRACTION}
      art={
        <Suspense fallback={null}>
          <ParticleOrbGL
            variant="galaxy"
            arms={3}
            size={980}
            /* Voir le pavé de BilanShowcaseCard : le décor tourne désormais sur
               téléphone, avec un semis allégé. La galaxie garde ses trois bras
               et sa dispersion — c'est la DENSITÉ qui tombe, pas la forme. */
            count={phone ? 3600 : 12000}
            radius={0.42}
            scatterPower={6.4}
            /* Points un cheveu plus gros sous 768 : après mise à l'échelle
               (~0,4), un point de 3,4 px tombe à 1,4 px et la galaxie se
               dissout en voile gris. */
            pointSize={phone ? 4.6 : 3.4}
            motion={0.15}
            className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
          />
        </Suspense>
      }
    >
      <div className="absolute inset-0">
        <RepelChips chips={STRUCTURE_CHIPS(t)} className="h-full w-full" />
      </div>
    </CardShell>
  );
}

/** « Évaluation financière » : la carte-objet ValuationCard sur la nappe
 *  périodique diluée et ses deux rubans de soie — l'aura de la grille, masque
 *  ovale compris. */
export function ValuationShowcaseCard() {
  const { t } = useLang();
  return (
    <CardShell
      title={t({ fr: "Évaluation financière", en: "Business valuation" })}
      wash={SKY_EVALUATION}
      art={
        <>
          <style>{AC_CSS}</style>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              maskImage: "radial-gradient(88% 62% at 58% 44%, #000 0%, rgba(0,0,0,0.78) 52%, transparent 90%)",
              WebkitMaskImage: "radial-gradient(88% 62% at 58% 44%, #000 0%, rgba(0,0,0,0.78) 52%, transparent 90%)",
            }}
          >
            <div
              className="ac-flow absolute left-0 w-full"
              style={{ top: -AURA_STEP, height: `calc(100% + ${AURA_STEP * 3}px)`, background: AURA_FLOW }}
            />
            <div className="absolute -inset-[30%] rotate-[-42deg]">
              <div className="absolute inset-0" style={{ maskImage: SILK_FADE, WebkitMaskImage: SILK_FADE }}>
                <svg className="ac-wave-a absolute left-0 top-[28%] h-[44%] w-[200%]" viewBox="0 0 1200 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="acSilkA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
                      <stop offset="28%" stopColor="#93c5fd" stopOpacity="0.55" />
                      <stop offset="52%" stopColor="#bfdbfe" stopOpacity="0.8" />
                      <stop offset="76%" stopColor="#93c5fd" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={WAVE_PATH} fill="url(#acSilkA)" opacity="0.75" />
                </svg>
              </div>
            </div>
            <div className="absolute -inset-[30%] rotate-[-34deg]">
              <div className="absolute inset-0" style={{ maskImage: SILK_FADE, WebkitMaskImage: SILK_FADE }}>
                <svg className="ac-wave-b absolute left-0 top-[38%] h-[38%] w-[200%]" viewBox="0 0 1200 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="acSilkB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
                      <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.45" />
                      <stop offset="54%" stopColor="#93c5fd" stopOpacity="0.7" />
                      <stop offset="78%" stopColor="#60a5fa" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={WAVE_PATH} fill="url(#acSilkB)" opacity="0.56" />
                </svg>
              </div>
            </div>
          </div>
        </>
      }
    >
      <ValuationCard />
    </CardShell>
  );
}
