import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, FolderClosed } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * AtlasLiveAsk — l'animation de la moitié droite du bloc « Atlas en clair »,
 * calquée sur le hero DataSnipper (captures client des 2026-08-22) : trois
 * scènes qui SE REMPLACENT — la saisie, la recherche, le résultat — jamais
 * deux à l'écran.
 *
 * ⚠ TROISIÈME PASSE DE RENDU (client : « l'animation doit être bien plus
 * fluide, rapide, dynamique, animée »). Ce qui a changé, et pourquoi :
 *
 *   · LES RESSORTS REMPLACENT LES COURBES. Les entrées sont des springs
 *     Framer (raideur ~460, amortissement ~34) : le léger dépassement puis le
 *     rappel est précisément ce que l'œil lit comme « animé », là où une
 *     courbe CSS, même expo, se lit comme « déplacé ». Framer est déjà dans le
 *     bundle, ça ne coûte pas un octet de plus.
 *   · LES SCÈNES SE CROISENT, elles ne se succèdent plus. AnimatePresence
 *     monte l'entrante pendant que la sortante joue ses 200 ms de sortie —
 *     les phases mortes `aOut` / `bOut` / `cOut` du state machine ont disparu
 *     avec, le cycle y gagne ~750 ms sans rien accélérer d'autre.
 *   · CHAQUE SCÈNE CASCADE EN INTERNE (staggerChildren 70 ms) : la bulle
 *     claque, la pastille suit, le rail d'étapes ferme la marche. Un bloc qui
 *     apparaît d'une pièce est une image ; une cascade est une animation.
 *   · LES COCHES « POPPENT » : scale 0,4 → 1,15 → 1 au passage au vert, et la
 *     ligne se redresse d'un cran. Même pop sur les pastilles de statut du
 *     résultat.
 *
 * Tout reste transform + opacité : les ressorts de Framer écrivent des
 * transforms, le compositeur déplace des couches, rien n'est repeint.
 *
 * ⚠ AUCUN CONTENU NEUF, inchangé depuis la première passe : la question est
 * l'`ask` validé de la scène bouclage (Nexio SAS, donnée de démonstration
 * établie), les étapes reformulent ATLAS_CAPS, le résultat nomme des TYPES de
 * pièces au vocabulaire des maquettes du site. Les coches sont au vert de
 * statut des scènes (#0f9d76), jamais en sarcelle (aplat interdit).
 *
 * Garde-fous : IntersectionObserver + `active` (la scène cachée par le
 * sélecteur d'arguments coupe ses minuteurs), `prefers-reduced-motion` →
 * état final statique sans boucle, `aria-hidden` (simulation décorative, le
 * propos est dans la colonne de gauche).
 */

/**
 * ⚠ LA QUESTION CHANGE AVEC L'ARGUMENT ENCADRÉ (client 2026-08-23 : « crée une
 * distinction entre passage d'animation en animation ») : les arguments 0, 1,
 * 2 et 7 partagent la même boucle, mais chacun tape SA question — ce sont les
 * demandes déjà validées des scènes Atlas (les `ask` de USE_CASES), pas des
 * rédactions nouvelles.
 * ⚠ Deux libellés sont LÉGÈREMENT RACCOURCIS par rapport à l'ask d'origine
 * (« D'où vient la marge affichée dans le reporting de juin ? » → « D'où vient
 * la marge du reporting de juin ? ») : mesuré, la version longue dépassait la
 * largeur du champ de saisie à côté du bouton — et la règle « on doit voir
 * toute la barre » prime (demande du 2026-08-22).
 * La pastille finale de la variante 1 reprend « Chaîne remontée », le libellé
 * exact de la pastille de la scène contrôle. */
const VARIANTES: Record<number, { q: { fr: string; en: string }; chip: { fr: string; en: string } }> = {
  0: {
    q: { fr: "Où en est le bouclage de Nexio SAS ?", en: "Where does the Nexio SAS closing stand?" },
    chip: { fr: "4 pièces validées, 1 en attente", en: "4 documents validated, 1 pending" },
  },
  1: {
    q: { fr: "D'où vient la marge du reporting de juin ?", en: "Where does the June margin come from?" },
    chip: { fr: "Chaîne remontée, sources reliées", en: "Chain traced back, sources linked" },
  },
  2: {
    q: { fr: "Où en est l'équipe cette semaine ?", en: "Where does the team stand this week?" },
    chip: { fr: "4 pièces validées, 1 en attente", en: "4 documents validated, 1 pending" },
  },
  7: {
    q: { fr: "Qui a touché à ce fichier, et quand ?", en: "Who touched this file, and when?" },
    chip: { fr: "4 pièces validées, 1 en attente", en: "4 documents validated, 1 pending" },
  },
};

const STEPS: { fr: string; en: string }[] = [
  { fr: "Recherche dans vos dossiers", en: "Searching your files" },
  { fr: "Lecture des pièces du dossier", en: "Reading the file's documents" },
  { fr: "Contrôle de ce qui reste à valider", en: "Checking what is left to validate" },
  { fr: "Écriture du journal", en: "Writing the log" },
];

const RESULT_ROWS: { label: { fr: string; en: string }; open?: boolean }[] = [
  { label: { fr: "FEC 2025", en: "2025 FEC file" } },
  { label: { fr: "Balance générale", en: "General balance" } },
  { label: { fr: "Relevés bancaires T4", en: "Q4 bank statements" }, open: true },
  { label: { fr: "Grand livre", en: "General ledger" } },
  { label: { fr: "Liasse fiscale", en: "Tax package" } },
];

/* Après `result`, trois temps nouveaux (client 2026-08-22 : « un bouton
   Ouvrir, et quand on clique dessus le document s'ouvre ») : `vise` — la
   souris rejoint le bouton Ouvrir de la pièce en attente ; `clicO` — l'appui ;
   `doc` — le document ouvert, tenu à l'écran, puis la boucle repart. */
type Phase = "typing" | "typed" | "thinking" | "steps" | "result" | "vise" | "clicO" | "doc";

/** ⚠ LE POINT DE DÉPART CHANGE AVEC LA VARIANTE (client 2026-08-26 : « deux
 *  animations de suite ne doivent pas commencer exactement de la même manière,
 *  sinon l'utilisateur pense que ça bugue »). Les arguments 0, 1 et 2 se
 *  suivent et partagent cette boucle : s'ils ouvraient tous sur la même carte
 *  de saisie vide, chaque passage ressemblait à une remise à zéro ratée.
 *  Chacun entre donc AILLEURS dans le cycle — la saisie, la recherche déjà
 *  lancée, le résultat posé — et la boucle continue son tour normalement
 *  depuis là. L'argument 7 rouvre sur la saisie : ses voisins sont d'autres
 *  animations, aucune confusion possible. */
const DEPARTS: Record<number, Phase> = { 0: "typing", 1: "thinking", 2: "result", 7: "typing" };

/** Le ressort d'entrée commun : vif, un soupçon de dépassement. */
const SPRING = { type: "spring", stiffness: 460, damping: 34, mass: 0.9 } as const;

/** Une scène : entre par le bas en ressort, sort vite et net par le haut. */
const sceneVariants = {
  initial: { opacity: 0, y: 22, scale: 0.965 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SPRING, staggerChildren: 0.07 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.985,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

/** Un élément d'une scène, dans la cascade interne. */
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function AtlasLiveAsk({
  active = true,
  variante = 0,
}: {
  active?: boolean;
  /** L'argument encadré (0, 1, 2 ou 7) : il choisit la question et la
   *  pastille finale. Le composant est REMONTÉ à chaque changement (clé dans
   *  AtlasShowcase), l'état repart donc de zéro tout seul. */
  variante?: number;
}) {
  const { t } = useLang();
  const V = VARIANTES[variante] ?? VARIANTES[0];
  const depart = DEPARTS[variante] ?? "typing";
  const question = t(V.q);
  const rootRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);
  const [running, setRunning] = useState(false);
  // L'état initial suit le point de départ : entrer sur la recherche ou le
  // résultat suppose la question déjà posée (et les étapes déjà cochées).
  const [phase, setPhase] = useState<Phase>(depart);
  const [chars, setChars] = useState(depart === "typing" ? 0 : question.length);
  const [doneSteps, setDoneSteps] = useState(depart === "result" ? STEPS.length : 0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ⚠ REPRISE À ZÉRO AU RETOUR (client 2026-08-22 : « à chaque fois que l'on
     revient sur l'animation, elle doit reprendre de zéro ») : dès que la scène
     redevient visible ET sélectionnée, tout l'état repart au début — plus de
     reprise en cours de cycle, qui faisait retomber le visiteur au milieu
     d'une histoire commencée sans lui. */
  useEffect(() => {
    if (running && active) {
      setChars(depart === "typing" ? 0 : question.length);
      setDoneSteps(depart === "result" ? STEPS.length : 0);
      setPhase(depart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active]);

  /* L'enchaînement. Plus de phases de sortie : AnimatePresence joue les
     croisements, les minuteurs ne rythment que le CONTENU. */
  useEffect(() => {
    if (reduced || !running || !active) return;
    let timer: ReturnType<typeof setInterval | typeof setTimeout>;

    if (phase === "typing") {
      if (chars < question.length) {
        timer = setInterval(
          () => setChars((c) => Math.min(c + 1, question.length)),
          12,
        );
      } else {
        setPhase("typed");
      }
    } else if (phase === "typed") {
      timer = setTimeout(() => setPhase("thinking"), 260);
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("steps"), 380);
    } else if (phase === "steps") {
      if (doneSteps < STEPS.length) {
        timer = setInterval(
          () => setDoneSteps((n) => Math.min(n + 1, STEPS.length)),
          220,
        );
      } else {
        timer = setTimeout(() => setPhase("result"), 200);
      }
    } else if (phase === "result") {
      timer = setTimeout(() => setPhase("vise"), 480);
    } else if (phase === "vise") {
      timer = setTimeout(() => setPhase("clicO"), 520);
    } else if (phase === "clicO") {
      timer = setTimeout(() => setPhase("doc"), 160);
    } else {
      timer = setTimeout(() => {
        setChars(0);
        setDoneSteps(0);
        setPhase("typing");
      }, 1700);
    }
    return () => clearTimeout(timer as ReturnType<typeof setTimeout>);
  }, [phase, chars, doneSteps, running, active, reduced, question.length]);

  const typedAll = chars >= question.length;
  const scene: "A" | "B" | "C" =
    phase === "typing" || phase === "typed" ? "A" : phase === "thinking" || phase === "steps" ? "B" : "C";

  /* ── LA SOURIS (client 2026-08-22 : « pour le premier design, rajoute la
     souris qui bouge ») ─────────────────────────────────────────────────────
     Elle SUIT LE GESTE au lieu de le mimer à côté : pendant la frappe elle
     patiente sous le champ, à mi-phrase elle glisse sur « Demander à Atlas »,
     l'appuie (le tassement du bouton est déjà câblé sur la phase `typed`),
     puis pendant la recherche elle DESCEND le long des étapes au fil des
     coches — c'est la posture exacte de la capture DataSnipper, le pointeur
     posé contre l'étape en cours. Elle s'efface sur le résultat.
     Ses cibles sont calculées dans le repère de la scène (largeur mesurée au
     ResizeObserver : le bouton est ancré à DROITE, les étapes à GAUCHE, un
     500 px codé en dur raterait les deux dès que la colonne se resserre).
     Les constantes verticales suivent la géométrie des scènes centrées dans
     les 360 px du conteneur — décoratif, mais accordé. */
  const sourisRef = useRef<HTMLDivElement>(null);
  const [larg, setLarg] = useState(500);
  useEffect(() => {
    const el = sourisRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLarg(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let cible = { x: larg - 60, y: 254, o: 0.9 };
  if (scene === "A" && chars > 6) cible = { x: larg - 94, y: 199, o: 1 };
  else if (scene === "B") cible = { x: 66, y: 191 + Math.min(doneSteps, 3) * 30 + 14, o: 1 };
  else if (phase === "result") cible = { x: larg - 110, y: 300, o: 0.95 };
  else if (phase === "vise" || phase === "clicO") cible = { x: larg - 92, y: 218, o: 1 };
  else if (phase === "doc") cible = { x: larg - 150, y: 292, o: 0.9 };

  /* ── LA PASTILLE D'AGENT, partagée par les scènes B et C ──────────────────
     ⚠ PASSÉE EN BLANC le 2026-08-22 (client : « inspire-toi plus des designs
     que je t'ai envoyés ») : sur les captures DataSnipper, l'avatar d'agent
     est un DISQUE BLANC et le libellé une pilule BLANCHE à texte sombre, avec
     un ANNEAU qui tourne — pas trois points. Repris tel quel, dans la
     grammaire maison : l'étincelle ✦ au dégradé de marque dans le disque, et
     l'anneau en encre sur la pilule. */
  const agentChip = (answered: boolean) => (
    <motion.div variants={itemVariants} className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[16px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]">
        <span className="text-brand-gradient">✦</span>
      </span>
      <span className="inline-flex items-center gap-2.5 rounded-[12px] bg-white px-4 py-2.5 font-inter text-[13.5px] font-medium text-[#111827] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]">
        {answered ? (
          <>
            <motion.span
              initial={{ scale: 0.4 }}
              animate={{ scale: [0.4, 1.15, 1] }}
              transition={{ duration: 0.35, times: [0, 0.6, 1] }}
            >
              <Check className="h-3.5 w-3.5 text-[#0f9d76]" strokeWidth={3} />
            </motion.span>
            {t(V.chip)}
          </>
        ) : (
          <>
            {/* L'anneau de la référence : un cercle à secteur manquant qui
                tourne, en encre sur blanc. */}
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#111827]/15 border-t-[#111827]" />
            {t({ fr: "Atlas parcourt le dossier", en: "Atlas is going through the file" })}
          </>
        )}
      </span>
    </motion.div>
  );

  /* En mouvement réduit : l'état final, posé, immobile — aucune boucle. */
  if (reduced) {
    return (
      <div ref={rootRef} aria-hidden className="relative w-full">
        <div className="relative mx-auto w-full max-w-[500px]">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[15px] text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #0d9488)" }}
            >
              ✦
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 font-inter text-[13.5px] text-white/85">
              <Check className="h-3.5 w-3.5 text-[#2ec79a]" strokeWidth={3} />
              {t(V.chip)}
            </span>
          </div>
          <div className="mt-4 rounded-[16px] bg-white px-4 py-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] md:px-5">
            {RESULT_ROWS.map((r, i) => (
              <ResultRow key={r.label.en} r={r} bord={i > 0} t={t} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} aria-hidden className="relative w-full">
      <div className="relative grid min-h-[360px]">
        <AnimatePresence>
          {scene === "A" && (
            <motion.div
              key="A"
              variants={sceneVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="col-start-1 row-start-1 w-full max-w-[500px] self-center justify-self-center"
            >
              <div className="rounded-[16px] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
                <div className="flex items-center gap-2">
                  <img
                    src="/logos/icon-color.png"
                    alt=""
                    className="h-[18px] w-auto select-none"
                    draggable={false}
                  />
                  <span className="font-inter text-[14px] font-semibold text-[#111827]">Atlas</span>
                  <span className="text-[12px] text-[#3b82f6]">✦</span>
                </div>
                <div className="mt-3.5 flex items-center gap-3 rounded-[10px] border border-[#3b82f6]/30 py-2.5 pl-4 pr-2.5">
                  <span className="min-w-0 flex-1 truncate font-inter text-[14px] text-[#111827]">
                    {question.slice(0, chars)}
                    {!typedAll && (
                      <span className="ml-[1px] inline-block h-[14px] w-[2px] translate-y-[2px] animate-pulse bg-[#3b82f6]" />
                    )}
                  </span>
                  {/* L'appui du bouton : un ressort raide, le tassement rappelle
                      le clic de la référence sans faux curseur. */}
                  <motion.span
                    animate={phase === "typed" ? { scale: 0.94 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 700, damping: 26 }}
                    className={`shrink-0 rounded-[8px] px-3.5 py-2 font-inter text-[13px] font-semibold text-white transition-colors duration-150 ${
                      phase === "typed" ? "bg-[#2563eb]" : "bg-[#3b82f6]"
                    }`}
                  >
                    {t({ fr: "Demander à Atlas", en: "Ask Atlas" })}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}

          {scene === "B" && (
            <motion.div
              key="B"
              variants={sceneVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="col-start-1 row-start-1 w-full max-w-[500px] self-center justify-self-center"
            >
              <motion.div variants={itemVariants} className="flex items-start justify-end gap-3">
                <div className="max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-white px-4 py-3 font-inter text-[14px] leading-snug text-[#111827] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]">
                  {question}
                </div>
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3b82f6] font-inter text-[13px] font-semibold text-white">
                  C
                </span>
              </motion.div>

              <div className="mt-6">{agentChip(false)}</div>

              <motion.ul
                variants={itemVariants}
                className="relative mt-5 ml-[17px] space-y-3 border-l border-white/[0.10] pl-6"
              >
                {STEPS.map((s, i) => {
                  const done = i < doneSteps;
                  return (
                    <motion.li
                      key={s.en}
                      animate={done ? { opacity: 1, x: 0 } : { opacity: 0.3, x: -4 }}
                      transition={SPRING}
                      className="flex items-center gap-3"
                    >
                      <motion.span
                        animate={
                          done
                            ? { scale: [0.4, 1.18, 1], backgroundColor: "#0f9d76", borderColor: "rgba(15,157,118,0)" }
                            : { scale: 1, backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(255,255,255,0.25)" }
                        }
                        transition={done ? { duration: 0.32, times: [0, 0.6, 1] } : { duration: 0.15 }}
                        className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border"
                      >
                        {done && <Check className="h-[10px] w-[10px] text-white" strokeWidth={3.2} />}
                      </motion.span>
                      <span className="font-inter text-[13.5px] text-white/70">{t(s)}</span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </motion.div>
          )}

          {scene === "C" && (
            <motion.div
              key="C"
              variants={sceneVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="col-start-1 row-start-1 w-full max-w-[500px] self-center justify-self-center"
            >
              {agentChip(true)}
              <motion.div
                variants={itemVariants}
                className="relative mt-4 rounded-[16px] bg-white px-4 pb-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] md:px-5"
              >
                {/* L'ENCADRÉ DU DOSSIER (client 2026-08-22 : « indique par un
                    petit encadré que c'est le dossier du client Nexio ») : en
                    tête de carte, dossier + nom, séparé des pièces par un
                    filet. C'est la réponse à « de quel dossier parle-t-on ». */}
                <div className="flex items-center gap-2 border-b border-[#0a2540]/[0.07] py-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#0a2540]/[0.14] bg-[#f7f9fd] px-2 py-[3px] font-inter text-[11.5px] font-semibold text-[#111827]">
                    <FolderClosed className="h-3 w-3 text-[#3b82f6]" strokeWidth={2.2} />
                    {t({ fr: "Dossier Nexio SAS", en: "Nexio SAS file" })}
                  </span>
                  <span className="font-inter text-[11.5px] text-[#6b7688]">
                    {t({ fr: "5 pièces", en: "5 documents" })}
                  </span>
                </div>
                {RESULT_ROWS.map((r, i) => (
                  <motion.div
                    key={r.label.en}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: 0.06 + i * 0.05 }}
                  >
                    <ResultRow
                      r={r}
                      bord={i > 0}
                      t={t}
                      pop={0.14 + i * 0.05}
                      ouvrir={r.open}
                      presse={phase === "clicO"}
                    />
                  </motion.div>
                ))}

                {/* LE DOCUMENT OUVERT : une petite fenêtre qui jaillit de la
                    carte au clic sur « Ouvrir » — l'« ultra simple » demandé :
                    un clic, le document est là. Elle porte le titre de la
                    pièce et le rappel du dossier ; le corps est un aperçu en
                    barres, c'est un document vu de loin, pas un contenu à
                    lire. */}
                <AnimatePresence>
                  {phase === "doc" && (
                    <motion.div
                      key="doc"
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }}
                      exit={{ opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.18 } }}
                      className="absolute inset-x-3 top-12 z-10 rounded-[14px] bg-white p-4 shadow-[0_34px_80px_-24px_rgba(0,0,0,0.8)] ring-1 ring-[#0a2540]/[0.10]"
                    >
                      <div className="flex items-center gap-2.5 border-b border-[#0a2540]/[0.07] pb-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#f3e6c4] text-[#a8781c]">
                          <FileText className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-inter text-[13.5px] font-semibold text-[#111827]">
                            {t({ fr: "Relevés bancaires T4", en: "Q4 bank statements" })}
                          </span>
                          <span className="block truncate font-inter text-[11.5px] text-[#6b7688]">
                            {t({ fr: "Dossier Nexio SAS", en: "Nexio SAS file" })}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[#e7effd] px-2 py-0.5 font-inter text-[10.5px] font-semibold text-[#2563eb]">
                          {t({ fr: "Ouvert", en: "Open" })}
                        </span>
                      </div>
                      <div className="space-y-2.5 pt-3">
                        {["82%", "64%", "91%", "48%"].map((w, i) => (
                          <motion.span
                            key={w}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...SPRING, delay: 0.1 + i * 0.05 }}
                            className="block h-[7px] rounded-[4px] bg-[#eaeff7]"
                            style={{ width: w }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* La souris, par-dessus les scènes, dans le même repère centré. */}
        <div className="pointer-events-none absolute inset-0 z-20 flex justify-center">
          <div ref={sourisRef} className="relative h-full w-full max-w-[500px]">
            <motion.div
              className="absolute left-0 top-0"
              animate={{ x: cible.x, y: cible.y, opacity: cible.o }}
              transition={{ type: "spring", stiffness: 230, damping: 26 }}
            >
              <motion.span
                className="block"
                animate={phase === "typed" || phase === "clicO" ? { scale: 0.78 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 800, damping: 22 }}
                style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.45))" }}
              >
                <svg width="21" height="23" viewBox="0 0 21 23" fill="none">
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* Le décor (deux lueurs de marque + facette diagonale) a déménagé le
   2026-08-23 dans AtlasShowcase, DERRIÈRE les cinq scènes : porté ici, il
   disparaissait avec la scène à chaque bascule d'argument. */

/** Une pièce du résultat : nom, et statut en pastille qui « poppe ». */
function ResultRow({
  r,
  bord,
  t,
  pop,
  ouvrir = false,
  presse = false,
}: {
  r: (typeof RESULT_ROWS)[number];
  bord: boolean;
  t: (m: { fr: string; en: string }) => string;
  pop?: number;
  /** Affiche le bouton « Ouvrir » (la pièce en attente, cible de la souris). */
  ouvrir?: boolean;
  /** L'appui du bouton, synchronisé au clic de la souris (phase `clicO`). */
  presse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${bord ? "border-t border-[#0a2540]/[0.06]" : ""}`}>
      {r.open ? (
        <span className="h-[15px] w-[15px] shrink-0 rounded-full shadow-[inset_0_0_0_2px_#e0b64b]" />
      ) : (
        <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full bg-[#d8f0e4]">
          <Check className="h-[9px] w-[9px] text-[#0f9d76]" strokeWidth={3.2} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-inter text-[13.5px] font-medium text-[#111827]">
        {t(r.label)}
      </span>
      <motion.span
        initial={pop !== undefined ? { scale: 0.5, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 24, delay: pop ?? 0 }}
        className={`shrink-0 rounded-full px-2.5 py-1 font-inter text-[11.5px] font-semibold ${
          r.open ? "bg-[#f3e6c4] text-[#8a6d1f]" : "bg-[#d8f0e4] text-[#0f9d76]"
        }`}
      >
        {r.open ? t({ fr: "En attente", en: "Pending" }) : t({ fr: "Validé", en: "Validated" })}
      </motion.span>
      {ouvrir && (
        <motion.span
          animate={presse ? { scale: 0.9 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 700, damping: 24 }}
          className={`inline-flex shrink-0 items-center rounded-[8px] px-3 py-1.5 font-inter text-[12px] font-semibold text-white transition-colors duration-150 ${
            presse ? "bg-[#2563eb]" : "bg-[#3b82f6]"
          }`}
        >
          {t({ fr: "Ouvrir", en: "Open" })}
        </motion.span>
      )}
    </div>
  );
}
