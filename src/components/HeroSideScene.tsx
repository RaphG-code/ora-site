import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * HeroSideScene — le panneau produit de la COLONNE DE DROITE du hero.
 *
 * Client 2026-08-26, captures DataSnipper et Softriver à l'appui : « je
 * voudrais que tu répliques une interface de style côte à côte pour mon site ».
 * Les deux références partagent exactement le même squelette : le discours à
 * gauche (accroche, sous-titre, deux appels à l'action, rangée de preuve), et
 * à droite un PANNEAU PRODUIT QUI JOUE TOUT SEUL. Ce fichier est ce panneau ;
 * la colonne de gauche vit dans OraHeroDemo.
 *
 * ⚠ POURQUOI UNE SCÈNE NEUVE, et pas la réplique du logiciel déjà écrite.
 * La grande réplique scrollée d'OraHeroDemo fait 1040x640 et son récit est
 * PILOTÉ PAR LE DÉFILEMENT sur 300 vh — la déplacer dans une colonne de 560 px
 * casserait son moteur, et la réduire rendrait ses typographies de 7 à 13 px
 * illisibles (le même calcul qui a imposé une branche mobile distincte).
 * Elle reste donc où elle est, JUSTE EN DESSOUS : le hero ouvre sur une boucle
 * courte, le défilement livre ensuite la démo longue. C'est aussi la structure
 * de DataSnipper (panneau qui boucle en haut, produit détaillé plus bas).
 *
 * Le récit, en trois actes, dit le produit en sept secondes :
 *   1. LE FICHIER  — le classeur FEC s'ouvre, les écritures se remplissent.
 *   2. LE CLIC     — la souris rejoint « Bilan imagé » dans le ruban Ora et
 *                    clique ; les étapes du calcul défilent et passent au vert.
 *   3. LE LIVRABLE — le bilan sort du classeur en ressort, graphique compris.
 *
 * ⚠ MISE À L'ÉCHELLE PAR `transform: scale`, JAMAIS PAR `zoom`. La scène se
 * compose à une taille LOGIQUE fixe (SW x SH) puis est mise à l'échelle de la
 * colonne, mesurée au ResizeObserver. `zoom` déchire les mises en page WebKit
 * et le client navigue sous Safari ; `scale` est composité, donc gratuit.
 * La boîte extérieure porte l'`aspect-ratio` pour réserver la hauteur, que le
 * transform ne réserve pas.
 *
 * Garde-fous, identiques aux scènes Atlas : IntersectionObserver (hors écran,
 * les minuteurs s'arrêtent), `prefers-reduced-motion` → dernier acte figé sans
 * boucle, `aria-hidden` (simulation décorative, le propos est à gauche).
 */

/** Taille LOGIQUE de composition. Tout ce qui suit est écrit dans ce repère. */
const SW = 520;
const SH = 404;

/** Le classeur, et la carte du livrable qui en sort par le coin bas droit. */
const WIN = { x: 0, y: 0, w: 462, h: 334 };
const LIV = { w: 258, h: 198 };

/** Le ressort commun : vif, un soupçon de dépassement. Même famille que les
 *  scènes Atlas (raideur ~460, amortissement ~34) pour que les deux blocs du
 *  site aient la même « main ». */
const SPRING = { type: "spring", stiffness: 460, damping: 34, mass: 0.9 } as const;

type Acte = "fichier" | "vise" | "clic" | "calcul" | "livrable";

/** Durée de chaque acte, en millisecondes. */
const DUREE: Record<Acte, number> = {
  fichier: 1500,
  vise: 760,
  clic: 260,
  calcul: 1800,
  livrable: 2500,
};
const SUITE: Record<Acte, Acte> = {
  fichier: "vise",
  vise: "clic",
  clic: "calcul",
  calcul: "livrable",
  livrable: "fichier",
};

/** Les onglets du ruban du classeur. Le dernier est celui d'Ora, actif. */
const ONGLETS = [
  { fr: "Accueil", en: "Home" },
  { fr: "Données", en: "Data" },
  { fr: "Révision", en: "Review" },
];

/** Les boutons du ruban Ora. L'index 1 est la cible de la souris. */
const RUBAN = [
  { fr: "FEC Studio", en: "FEC Studio" },
  { fr: "Bilan imagé", en: "Visual balance sheet" },
  { fr: "Prévisionnel", en: "Forecast" },
];
const CIBLE = 1;

/** Les écritures du classeur. Données de démonstration déjà établies sur le
 *  site (Nexio SAS, exercice 2025), pas des chiffres neufs. */
const COLS = [
  { l: { fr: "Date", en: "Date" }, w: "0.82fr", n: false },
  { l: { fr: "Compte", en: "Account" }, w: "0.72fr", n: false },
  { l: { fr: "Libellé", en: "Label" }, w: "1.5fr", n: false },
  { l: { fr: "Débit", en: "Debit" }, w: "0.86fr", n: true },
  { l: { fr: "Crédit", en: "Credit" }, w: "0.86fr", n: true },
];
const LIGNES: string[][] = [
  ["03/01/25", "411000", "Facture Almadis", "12 480,00", ""],
  ["07/01/25", "512000", "Virement reçu", "", "8 950,00"],
  ["12/01/25", "606300", "Fournitures atelier", "1 274,50", ""],
  ["18/01/25", "401000", "Ravel & Fils", "", "5 320,00"],
  ["24/01/25", "445660", "TVA déductible", "2 496,00", ""],
  ["29/01/25", "706000", "Prestations janvier", "", "18 700,00"],
  ["04/02/25", "627000", "Frais bancaires", "168,20", ""],
];

/** Les étapes du calcul, cochées une à une pendant l'acte `calcul`. */
const ETAPES = [
  { fr: "Lecture du FEC", en: "Reading the FEC file" },
  { fr: "Rapprochement des comptes", en: "Reconciling accounts" },
  { fr: "Mise en forme du bilan", en: "Formatting the balance sheet" },
];

/** Le graphique du livrable : douze mois, en pourcentage de la hauteur. */
const BARRES = [52, 44, 61, 48, 66, 74, 41, 33, 78, 86, 69, 94];

export default function HeroSideScene() {
  const { t } = useLang();

  /* ── Mise à l'échelle : la scène logique dans la largeur réelle ────────── */
  const boiteRef = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);
  useLayoutEffect(() => {
    const el = boiteRef.current;
    if (!el) return;
    const mesure = () => setEchelle(el.clientWidth / SW);
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Marche / arrêt : hors écran, aucun minuteur ne tourne ─────────────── */
  const [vu, setVu] = useState(false);
  useEffect(() => {
    const el = boiteRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVu(e.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reduit =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── La machine à actes ────────────────────────────────────────────────── */
  const [acte, setActe] = useState<Acte>(reduit ? "livrable" : "fichier");
  const [etape, setEtape] = useState(0);

  useEffect(() => {
    if (reduit || !vu) return;
    let vivant = true;
    const minuteurs: number[] = [];

    /* L'acte `calcul` coche ses trois étapes pendant sa propre durée. */
    if (acte === "calcul") {
      setEtape(0);
      ETAPES.forEach((_, i) => {
        minuteurs.push(
          window.setTimeout(
            () => vivant && setEtape(i + 1),
            (DUREE.calcul / (ETAPES.length + 0.6)) * (i + 1),
          ),
        );
      });
    }

    minuteurs.push(
      window.setTimeout(() => vivant && setActe(SUITE[acte]), DUREE[acte]),
    );
    return () => {
      vivant = false;
      minuteurs.forEach(clearTimeout);
    };
  }, [acte, vu, reduit]);

  /* ── La souris : sa cible est MESURÉE sur le vrai bouton ──────────────────
     Écrire les coordonnées en dur les ferait dériver au premier changement de
     libellé (« Bilan imagé » est plus large en anglais). On lit donc la boîte
     réelle du bouton dans le repère logique de la scène. */
  const sceneRef = useRef<HTMLDivElement>(null);
  const cibleRef = useRef<HTMLButtonElement>(null);
  const [pointe, setPointe] = useState({ x: SW * 0.62, y: SH * 0.86 });

  useLayoutEffect(() => {
    if (acte !== "vise" && acte !== "clic" && acte !== "calcul") return;
    const scene = sceneRef.current;
    const btn = cibleRef.current;
    if (!scene || !btn) return;
    const a = scene.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    /* Le rectangle mesuré est déjà mis à l'échelle : on le ramène au repère
       logique en divisant par l'échelle courante. */
    setPointe({
      x: (b.left - a.left) / echelle + b.width / echelle / 2 - 3,
      y: (b.top - a.top) / echelle + b.height / echelle / 2 - 2,
    });
  }, [acte, echelle, t]);

  /* La souris n'est là que le temps d'aller cliquer : elle entre pour `vise`,
     appuie sur `clic`, et repart dès que le calcul est lancé. */
  const sourisVisible = acte === "vise" || acte === "clic";
  const repos = { x: SW * 0.66, y: SH * 0.9 };
  const posSouris = sourisVisible ? pointe : repos;

  return (
    <div
      ref={boiteRef}
      aria-hidden
      className="relative w-full select-none"
      style={{ aspectRatio: `${SW} / ${SH}` }}
    >
      {/* ── LE DÉCOR, DERRIÈRE LE PANNEAU ───────────────────────────────────
          Deux lueurs de marque très diluées, comme la facette bleue qui monte
          derrière le panneau de DataSnipper. Jamais un aplat de sarcelle : la
          charte réserve #0d9488 aux fins de dégradé. */}
      <div
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10"
        style={{
          background:
            "radial-gradient(58% 52% at 72% 18%, rgba(59,130,246,0.16), transparent 70%)," +
            "radial-gradient(50% 46% at 24% 88%, rgba(13,148,136,0.13), transparent 72%)",
        }}
      />

      <div
        ref={sceneRef}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: SW, height: SH, transform: `scale(${echelle})` }}
      >
        {/* ══ LE CLASSEUR ══════════════════════════════════════════════════ */}
        <motion.div
          className="absolute overflow-hidden rounded-[15px] bg-white"
          style={{
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            boxShadow:
              "0 1px 2px rgba(15,23,42,.08), 0 26px 60px -22px rgba(15,23,42,.34)",
            border: "1px solid rgba(15,23,42,.08)",
          }}
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING, delay: 0.05 }}
        >
          {/* Barre de titre */}
          <div className="flex h-[30px] items-center gap-2 border-b border-[#eceef2] bg-[#f8f9fb] px-3">
            <span className="flex gap-[5px]">
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <i
                  key={c}
                  className="block h-[7px] w-[7px] rounded-full"
                  style={{ background: c }}
                />
              ))}
            </span>
            <span className="ml-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#5b6577]">
              <i className="block h-[10px] w-[10px] rounded-[2px] bg-[#177245]" />
              {t({ fr: "FEC 2025 · Nexio SAS", en: "2025 FEC · Nexio SAS" })}
            </span>
          </div>

          {/* Ruban : les onglets Excel, puis l'onglet Ora actif et ses boutons */}
          <div className="border-b border-[#eceef2] bg-white px-3 pt-[5px]">
            <div className="flex items-center gap-3">
              {ONGLETS.map((o) => (
                <span
                  key={o.en}
                  className="pb-[5px] text-[10px] font-medium text-[#8b93a3]"
                >
                  {t(o)}
                </span>
              ))}
              <span className="relative pb-[5px] text-[10px] font-semibold text-[#3b82f6]">
                Ora
                <i className="absolute inset-x-0 -bottom-px block h-[2px] rounded-full bg-[#3b82f6]" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 border-b border-[#f1f2f5] bg-[#fbfcfe] px-3 py-[7px]">
            {RUBAN.map((b, i) => {
              const actif = i === CIBLE && acte !== "fichier";
              const presse = i === CIBLE && acte === "clic";
              return (
                <motion.button
                  key={b.en}
                  ref={i === CIBLE ? cibleRef : undefined}
                  type="button"
                  tabIndex={-1}
                  className="flex items-center gap-1.5 rounded-[7px] border px-2 py-[5px] text-[10px] font-semibold"
                  animate={{
                    scale: presse ? 0.95 : 1,
                    backgroundColor: actif ? "#eaf2fe" : "#ffffff",
                    borderColor: actif ? "rgba(59,130,246,.45)" : "#e7e9ee",
                    color: actif ? "#2563eb" : "#5b6577",
                  }}
                  transition={{ type: "spring", stiffness: 620, damping: 26 }}
                >
                  <i
                    className="block h-[11px] w-[11px] rounded-[3px]"
                    style={{
                      background:
                        i === CIBLE
                          ? "linear-gradient(135deg,#3b82f6,#0d9488)"
                          : "#dfe3ea",
                    }}
                  />
                  {t(b)}
                </motion.button>
              );
            })}
            <span className="ml-auto rounded-full bg-[#eef1f6] px-2 py-[3px] text-[9px] font-semibold text-[#6b7688]">
              {t({ fr: "48 512 écritures", en: "48,512 entries" })}
            </span>
          </div>

          {/* La feuille */}
          <div className="px-3 pt-2">
            <div
              className="grid gap-x-2 border-b border-[#eceef2] pb-[5px] text-[9px] font-semibold uppercase tracking-[0.04em] text-[#8b93a3]"
              style={{ gridTemplateColumns: COLS.map((c) => c.w).join(" ") }}
            >
              {COLS.map((c) => (
                <span key={c.l.en} className={c.n ? "text-right" : ""}>
                  {t(c.l)}
                </span>
              ))}
            </div>
            {LIGNES.map((r, i) => (
              <motion.div
                key={r[0] + r[1]}
                className="grid gap-x-2 border-b border-[#f4f5f8] py-[5px] text-[10px] text-[#42506b]"
                style={{ gridTemplateColumns: COLS.map((c) => c.w).join(" ") }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.16 + i * 0.045 }}
              >
                {r.map((v, j) => (
                  <span
                    key={j}
                    className={
                      COLS[j].n
                        ? "text-right tabular-nums font-medium"
                        : j === 1
                          ? "tabular-nums text-[#6b7688]"
                          : ""
                    }
                  >
                    {v || "·"}
                  </span>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Le voile du calcul : il assombrit à peine la feuille pendant que
              le bilan se construit, puis se retire avec le livrable. */}
          <AnimatePresence>
            {acte === "calcul" && (
              <motion.div
                className="absolute inset-x-0 bottom-0 top-[104px] bg-white/62 backdrop-blur-[1.5px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
            )}
          </AnimatePresence>

          {/* La carte de progression, pendant l'acte `calcul` */}
          <AnimatePresence>
            {acte === "calcul" && (
              <motion.div
                className="absolute left-1/2 top-[136px] w-[264px] -translate-x-1/2 rounded-[12px] border border-[#e7e9ee] bg-white p-3"
                style={{ boxShadow: "0 18px 40px -18px rgba(15,23,42,.35)" }}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={SPRING}
              >
                <p className="mb-2 text-[10.5px] font-semibold text-[#111827]">
                  {t({ fr: "Bilan imagé 2025", en: "2025 visual balance sheet" })}
                </p>
                <ul className="space-y-[7px]">
                  {ETAPES.map((e, i) => {
                    const fait = i < etape;
                    return (
                      <li
                        key={e.en}
                        className="flex items-center gap-2 text-[9.5px]"
                      >
                        {fait ? (
                          <motion.span
                            className="grid h-[13px] w-[13px] place-items-center rounded-full bg-[#0f9d76]"
                            initial={{ scale: 0.4 }}
                            animate={{ scale: [0.4, 1.15, 1] }}
                            transition={{ duration: 0.32 }}
                          >
                            <Check className="h-[8px] w-[8px] text-white" strokeWidth={3.4} />
                          </motion.span>
                        ) : (
                          <span className="grid h-[13px] w-[13px] place-items-center rounded-full border border-[#e2e5eb]">
                            <Loader2 className="h-[8px] w-[8px] animate-spin text-[#9aa3b2]" />
                          </span>
                        )}
                        <span className={fait ? "text-[#42506b]" : "text-[#8b93a3]"}>
                          {t(e)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[#eef1f6]">
                  <motion.i
                    className="block h-full rounded-full"
                    style={{ background: "linear-gradient(to right,#3b82f6,#0d9488)" }}
                    initial={{ width: "6%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: DUREE.calcul / 1000, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ══ LE LIVRABLE ══════════════════════════════════════════════════
            Il SORT du classeur par le coin bas droit et le recouvre, comme le
            document signé qui déborde du tableau chez DataSnipper. */}
        <AnimatePresence>
          {acte === "livrable" && (
            <motion.div
              className="absolute overflow-hidden rounded-[13px] border border-[#e7e9ee] bg-white"
              style={{
                right: 0,
                bottom: 4,
                width: LIV.w,
                height: LIV.h,
                boxShadow:
                  "0 2px 4px rgba(15,23,42,.06), 0 32px 64px -20px rgba(15,23,42,.42)",
              }}
              initial={{ opacity: 0, y: 26, scale: 0.92, rotate: -1.4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={SPRING}
            >
              <div className="flex items-center gap-2 border-b border-[#f1f2f5] px-3 py-[9px]">
                <motion.span
                  className="grid h-[16px] w-[16px] place-items-center rounded-full bg-[#0f9d76]"
                  initial={{ scale: 0.4 }}
                  animate={{ scale: [0.4, 1.18, 1] }}
                  transition={{ duration: 0.36, delay: 0.14 }}
                >
                  <Check className="h-[10px] w-[10px] text-white" strokeWidth={3.4} />
                </motion.span>
                <span className="text-[10.5px] font-semibold text-[#111827]">
                  {t({ fr: "Bilan imagé 2025", en: "2025 visual balance sheet" })}
                </span>
              </div>

              {/* Le graphique : douze mois qui poussent en cascade */}
              <div className="flex h-[104px] items-end gap-[5px] px-3 pt-3">
                {BARRES.map((h, i) => (
                  <motion.i
                    key={i}
                    className="block flex-1 rounded-[2px]"
                    style={{
                      background:
                        i >= BARRES.length - 3
                          ? "linear-gradient(to top,#3b82f6,#0d9488)"
                          : "#dbe6fb",
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ ...SPRING, delay: 0.18 + i * 0.028 }}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                {[
                  { fr: "Comptes rapprochés", en: "Accounts reconciled" },
                  { fr: "Prêt à signer", en: "Ready to sign" },
                ].map((c, i) => (
                  <motion.span
                    key={c.en}
                    className="rounded-full bg-[#eaf6f1] px-2 py-[3px] text-[9px] font-semibold text-[#0f7a5c]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.5 + i * 0.08 }}
                  >
                    {t(c)}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ LA SOURIS ════════════════════════════════════════════════════ */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-20"
          animate={{
            x: posSouris.x,
            y: posSouris.y,
            opacity: sourisVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 230, damping: 26 }}
        >
          <motion.span
            className="block"
            animate={{ scale: acte === "clic" ? 0.78 : 1 }}
            transition={{ type: "spring", stiffness: 800, damping: 22 }}
            style={{ filter: "drop-shadow(0 3px 8px rgba(15,23,42,0.35))" }}
          >
            <svg width="19" height="21" viewBox="0 0 21 23" fill="none">
              <path
                d="M3.5 1.5 L3.5 18 L8 14.2 L11 21 L14.3 19.4 L11.3 12.8 L17 12.3 Z"
                fill="#ffffff"
                stroke="#111827"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </motion.div>

        {/* L'onde du clic, sous la souris */}
        <AnimatePresence>
          {acte === "clic" && (
            <motion.span
              className="pointer-events-none absolute z-10 block rounded-full border-2 border-[#3b82f6]"
              style={{ left: pointe.x - 12, top: pointe.y - 12, width: 28, height: 28 }}
              initial={{ opacity: 0.7, scale: 0.35 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
