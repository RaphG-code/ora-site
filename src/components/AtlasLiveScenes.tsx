import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  Check,
  FileText,
  FolderClosed,
  Moon,
  RotateCcw,
  ScanSearch,
  Send,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * AtlasLiveScenes — les trois animations des capacités ajoutées le 2026-08-23.
 *
 * ⚠ SECONDE PASSE le même jour (client : « développe les animations, plus
 * complètes, plus d'éléments visuels, plus smooth, de meilleures transitions
 * entre les parties, des curseurs de souris qui bougent »). Chaque scène est
 * devenue une HISTOIRE EN DEUX TEMPS avec sa souris :
 *
 *   · DOCS — temps 1 : la souris FAIT GLISSER le fichier jusqu'à la zone de
 *     dépôt, qui s'allume à l'approche ; temps 2 : le document se lit (ligne
 *     de balayage), les extraits se cochent, la souris les suit.
 *   · RELANCE — la souris BALAYE d'abord les pièces manquantes une à une
 *     (le survol ambré suit), puis clique « Relancer tout » : chaque relance
 *     part avec son AVION qui s'envole de la ligne.
 *   · JOURNÉE — le point du matin s'assemble, puis la souris CLIQUE la ligne
 *     des échéances, qui SE DÉPLIE sur le détail des dossiers concernés.
 *
 * Les transitions entre temps passent par AnimatePresence (le patron
 * d'AtlasLiveAsk) : l'entrant monte pendant que le sortant s'efface, jamais de
 * trou. Le décor lumineux, lui, vit désormais DERRIÈRE les cinq scènes (dans
 * AtlasShowcase) : le fond ne bouge pas quand les scènes se croisent.
 *
 * MÊMES GARDE-FOUS que partout : IntersectionObserver + `active`, reprise à
 * zéro au retour, drapeau de vie contre les tirs posthumes, mouvement réduit →
 * état final posé, `aria-hidden`. Et AUCUN contenu inventé : textes des tuiles
 * du logiciel, noms de démonstration établis, types d'événements sans montant
 * ni date — les petits comptes (« 3 à traiter ») sont ceux d'une interface de
 * démonstration, comme les « 42 relevés » de l'espace client.
 */

const SPRING = { type: "spring", stiffness: 460, damping: 34, mass: 0.9 } as const;

/** Les variantes de TEMPS d'une scène (le patron d'AtlasLiveAsk). */
const partVariants = {
  initial: { opacity: 0, y: 22, scale: 0.965 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { ...SPRING, staggerChildren: 0.07 } },
  exit: { opacity: 0, y: -16, scale: 0.985, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const } },
};

function useScene<P extends string>(
  active: boolean,
  premiere: P,
  timeline: (phase: P, next: (p: P, apres: number) => void) => void,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const vivant = useRef(false);
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [phase, setPhase] = useState<P>(premiere);

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
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = onScreen && active && !reduced;

  useEffect(() => {
    vivant.current = running;
    if (running) setPhase(premiere);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    timeline(phase, (p, apres) => {
      timer = setTimeout(() => {
        if (vivant.current) setPhase(p);
      }, apres);
    });
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running]);

  return { rootRef, reduced, phase };
}

/** Le pointeur commun, avec son tassement de clic. */
function Souris({ presse }: { presse: boolean }) {
  return (
    <motion.span
      className="block"
      animate={presse ? { scale: 0.78 } : { scale: 1 }}
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
  );
}

/** La pastille d'agent commune (codes DataSnipper : disque et pilule blancs). */
function AgentChip({ icone, texte, fini }: { icone: React.ReactNode; texte: string; fini: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[16px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]">
        {icone}
      </span>
      <span className="inline-flex items-center gap-2.5 rounded-[12px] bg-white px-4 py-2.5 font-inter text-[13.5px] font-medium text-[#111827] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]">
        {fini ? (
          <motion.span
            initial={{ scale: 0.4 }}
            animate={{ scale: [0.4, 1.15, 1] }}
            transition={{ duration: 0.3, times: [0, 0.6, 1] }}
          >
            <Check className="h-3.5 w-3.5 text-[#0f9d76]" strokeWidth={3} />
          </motion.span>
        ) : (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#111827]/15 border-t-[#111827]" />
        )}
        {texte}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. LIT LES DOCUMENTS QU'ON LUI DÉPOSE — le glisser-déposer, puis la lecture.
   ═══════════════════════════════════════════════════════════════════════════ */

const DOC_EXTRAITS = [
  { fr: "Soldes lus", en: "Balances read" },
  { fr: "Points d'attention repérés", en: "Attention points spotted" },
  { fr: "Pistes de mission dégagées", en: "Engagement leads identified" },
];

type PhDocs = "prise" | "glisse" | "depose" | "arrive" | "scan" | "e1" | "e2" | "e3" | "fini";
const DOCS_ORDRE: PhDocs[] = ["prise", "glisse", "depose", "arrive", "scan", "e1", "e2", "e3", "fini"];

export function AtlasLiveDocs({ active = true }: { active?: boolean }) {
  const { t } = useLang();
  const { rootRef, reduced, phase } = useScene<PhDocs>(active, "prise", (ph, next) => {
    if (ph === "prise") next("glisse", 520);
    else if (ph === "glisse") next("depose", 720);
    else if (ph === "depose") next("arrive", 380);
    else if (ph === "arrive") next("scan", 520);
    else if (ph === "scan") next("e1", 850);
    else if (ph === "e1") next("e2", 320);
    else if (ph === "e2") next("e3", 320);
    else if (ph === "e3") next("fini", 420);
    else next("prise", 2200);
  });
  const etape = reduced ? DOCS_ORDRE.length - 1 : DOCS_ORDRE.indexOf(phase);
  const partDepot = !reduced && etape <= 2;
  const extraits = reduced ? 3 : Math.max(0, etape - 4);

  /* La souris du dépôt : elle TIENT le fichier. Positions dans le repère de la
     carte (~500 px de large) : prise en bas à droite, dépôt au centre de la
     zone. Pendant la lecture, elle suit les extraits qui se cochent. */
  const souris = partDepot
    ? phase === "prise"
      ? { x: 356, y: 208, o: 1 }
      : { x: 205, y: 96, o: 1 }
    : etape >= 5 && etape < 8
      ? { x: 240, y: 236 + Math.min(extraits, 2) * 33, o: 1 }
      : { x: 356, y: 260, o: 0.85 };

  return (
    <div ref={rootRef} aria-hidden className="relative w-full">
      <AgentChip
        icone={<ScanSearch className="h-[18px] w-[18px] text-[#3b82f6]" strokeWidth={2} />}
        texte={
          etape >= 8
            ? t({ fr: "Document lu", en: "Document read" })
            : partDepot
              ? t({ fr: "Déposez un document", en: "Drop a document in" })
              : t({ fr: "Atlas lit le document", en: "Atlas is reading the document" })
        }
        fini={etape >= 8}
      />

      <div className="relative mt-5 grid min-h-[300px]">
        <AnimatePresence>
          {partDepot ? (
            /* ── TEMPS 1 : LE DÉPÔT ─────────────────────────────────────── */
            <motion.div
              key="depot"
              variants={partVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="col-start-1 row-start-1 self-start"
            >
              <div className="rounded-[16px] bg-white p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
                {/* La zone : elle S'ALLUME quand le fichier approche. */}
                <motion.div
                  animate={
                    phase !== "prise"
                      ? { borderColor: "rgba(59,130,246,0.65)", backgroundColor: "rgba(59,130,246,0.06)" }
                      : { borderColor: "rgba(10,37,64,0.18)", backgroundColor: "rgba(247,249,253,1)" }
                  }
                  transition={{ duration: 0.25 }}
                  className="grid h-[168px] place-items-center rounded-[12px] border-[1.5px] border-dashed"
                >
                  <div className="text-center">
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-[10px] bg-[#e7effd] text-[#3b82f6]">
                      <ScanSearch className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <p className="mt-2.5 font-inter text-[13px] font-medium text-[#42506b]">
                      {t({ fr: "Glissez une plaquette ou un dossier", en: "Drag a brochure or a file" })}
                    </p>
                    <p className="mt-1 font-inter text-[11.5px] text-[#6b7688]">
                      {t({ fr: "PDF, Excel ou dossier complet", en: "PDF, Excel or a full folder" })}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Le fichier tenu par la souris : il voyage avec elle, puis se
                  POSE dans la zone au relâcher. */}
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-10"
                animate={
                  phase === "prise"
                    ? { x: 316, y: 186, scale: 1, opacity: 1 }
                    : phase === "glisse"
                      ? { x: 158, y: 74, scale: 1.04, opacity: 1 }
                      : { x: 172, y: 84, scale: 0.9, opacity: 0 }
                }
                transition={SPRING}
              >
                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 font-inter text-[12px] font-semibold text-[#111827] shadow-[0_14px_34px_-12px_rgba(0,0,0,0.6)] ring-1 ring-[#0a2540]/[0.10]">
                  <FileText className="h-3.5 w-3.5 text-[#3b82f6]" strokeWidth={2.2} />
                  plaquette_nexio.pdf
                </span>
              </motion.div>
            </motion.div>
          ) : (
            /* ── TEMPS 2 : LA LECTURE ───────────────────────────────────── */
            <motion.div
              key="lecture"
              variants={partVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="col-start-1 row-start-1 self-start"
            >
              <motion.div
                variants={{ initial: { opacity: 0, y: 14 }, enter: { opacity: 1, y: 0, transition: SPRING } }}
                className="relative overflow-hidden rounded-[16px] bg-white p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]"
              >
                <div className="flex items-center gap-3 border-b border-[#0a2540]/[0.07] pb-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#e7effd] text-[#3b82f6]">
                    <FileText className="h-[17px] w-[17px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-inter text-[13.5px] font-semibold text-[#111827]">
                      plaquette_nexio.pdf
                    </span>
                    <span className="block truncate font-inter text-[11.5px] text-[#6b7688]">
                      {t({ fr: "Déposé dans Atlas", en: "Dropped into Atlas" })}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-inter text-[10.5px] font-semibold transition-colors duration-300 ${
                      etape >= 8 ? "bg-[#d8f0e4] text-[#0f9d76]" : "bg-[#e7effd] text-[#2563eb]"
                    }`}
                  >
                    {etape >= 8 ? t({ fr: "Lu", en: "Read" }) : t({ fr: "Lecture", en: "Reading" })}
                  </span>
                </div>
                <div className="space-y-2.5 pt-3">
                  {["88%", "72%", "94%", "58%"].map((w) => (
                    <span key={w} className="block h-[7px] rounded-[4px] bg-[#eaeff7]" style={{ width: w }} />
                  ))}
                </div>
                {phase === "scan" && (
                  <motion.span
                    className="pointer-events-none absolute inset-x-0 h-16"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, rgba(59,130,246,0.14) 45%, rgba(59,130,246,0.22) 50%, rgba(59,130,246,0.14) 55%, transparent)",
                    }}
                    initial={{ top: -44 }}
                    animate={{ top: 190 }}
                    transition={{ duration: 0.85, ease: [0.45, 0, 0.55, 1] }}
                  />
                )}
              </motion.div>

              <ul className="mt-4 space-y-2.5">
                {DOC_EXTRAITS.map((e, i) => {
                  const on = i < extraits;
                  return (
                    <motion.li
                      key={e.en}
                      animate={on ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -6 }}
                      transition={SPRING}
                      className="flex items-center gap-2.5"
                    >
                      <motion.span
                        animate={
                          on
                            ? { scale: [0.4, 1.15, 1], backgroundColor: "#0f9d76" }
                            : { scale: 1, backgroundColor: "rgba(255,255,255,0.12)" }
                        }
                        transition={on ? { duration: 0.3, times: [0, 0.6, 1] } : { duration: 0.15 }}
                        className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full"
                      >
                        {on && <Check className="h-[9px] w-[9px] text-white" strokeWidth={3.2} />}
                      </motion.span>
                      <span className="font-inter text-[13.5px] text-white/70">{t(e)}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* La souris, par-dessus les deux temps. */}
        {!reduced && (
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-20"
            animate={{ x: souris.x, y: souris.y, opacity: souris.o }}
            transition={{ type: "spring", stiffness: 300, damping: 27 }}
          >
            <Souris presse={phase === "depose"} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. RELANCE LES PIÈCES MANQUANTES — le balayage, le clic, les avions.
   ═══════════════════════════════════════════════════════════════════════════ */

const RELANCE_ROWS: { label: { fr: string; en: string }; manquante?: boolean }[] = [
  { label: { fr: "Kbis à jour", en: "Company registration" }, manquante: true },
  { label: { fr: "Relevés bancaires T4", en: "Q4 bank statements" }, manquante: true },
  { label: { fr: "Balance générale", en: "General balance" } },
  { label: { fr: "Factures fournisseurs", en: "Supplier invoices" }, manquante: true },
];

type PhRel = "pose" | "s1" | "s2" | "s3" | "vise" | "clic" | "r1" | "r2" | "r3" | "fini";
const REL_ORDRE: PhRel[] = ["pose", "s1", "s2", "s3", "vise", "clic", "r1", "r2", "r3", "fini"];
/** Les ordonnées des lignes balayées (les trois manquantes : 0, 1, 3). */
const REL_SURVOL_Y = [72, 121, 219];

export function AtlasLiveRelance({ active = true }: { active?: boolean }) {
  const { t } = useLang();
  const { rootRef, reduced, phase } = useScene<PhRel>(active, "pose", (ph, next) => {
    if (ph === "pose") next("s1", 520);
    else if (ph === "s1") next("s2", 330);
    else if (ph === "s2") next("s3", 330);
    else if (ph === "s3") next("vise", 380);
    else if (ph === "vise") next("clic", 480);
    else if (ph === "clic") next("r1", 200);
    else if (ph === "r1") next("r2", 320);
    else if (ph === "r2") next("r3", 320);
    else if (ph === "r3") next("fini", 420);
    else next("pose", 2300);
  });
  const etape = reduced ? REL_ORDRE.length - 1 : REL_ORDRE.indexOf(phase);
  const survolees = Math.max(0, Math.min(3, etape));
  const relancees = reduced ? 3 : Math.max(0, etape - 5);

  const souris =
    etape >= 1 && etape <= 3
      ? { y: REL_SURVOL_Y[etape - 1], x: 8, o: 1 }
      : etape >= 4 && etape <= 8
        ? { y: 26, x: 0, o: 1 }
        : { y: 66, x: 26, o: 0.95 };

  return (
    <div ref={rootRef} aria-hidden className="w-full">
      <AgentChip
        icone={<Send className="h-4 w-4 text-[#3b82f6]" strokeWidth={2} />}
        texte={
          etape >= 9
            ? t({ fr: "3 relances parties", en: "3 chasers sent" })
            : etape >= 4
              ? t({ fr: "Relance en préparation", en: "Chasers being prepared" })
              : t({ fr: "Pièces manquantes repérées", en: "Missing documents spotted" })
        }
        fini={etape >= 9}
      />

      <motion.div
        initial={reduced ? false : { y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={SPRING}
        className="relative mt-5 rounded-[16px] bg-white px-4 pb-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] md:px-5"
      >
        <div className="flex items-center gap-2 border-b border-[#0a2540]/[0.07] py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#0a2540]/[0.14] bg-[#f7f9fd] px-2 py-[3px] font-inter text-[11.5px] font-semibold text-[#111827]">
            <FolderClosed className="h-3 w-3 text-[#3b82f6]" strokeWidth={2.2} />
            {t({ fr: "Dossier Almadis", en: "Almadis file" })}
          </span>
          <motion.span
            animate={phase === "clic" ? { scale: 0.9 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 700, damping: 24 }}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-inter text-[12px] font-semibold text-white transition-colors duration-150 ${
              phase === "clic" ? "bg-[#2563eb]" : "bg-[#3b82f6]"
            }`}
          >
            <Send className="h-3 w-3" strokeWidth={2.4} />
            {t({ fr: "Relancer tout", en: "Chase all" })}
          </motion.span>
        </div>

        {RELANCE_ROWS.map((r, i) => {
          const rang = RELANCE_ROWS.slice(0, i + 1).filter((x) => x.manquante).length;
          const faite = r.manquante && rang <= relancees;
          /* Le survol du balayage : la ligne sous la souris s'éclaire. */
          const survolee = !reduced && r.manquante && rang === survolees && etape >= 1 && etape <= 3;
          return (
            <motion.div
              key={r.label.en}
              initial={reduced ? false : { opacity: 0, x: -16 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: survolee ? "rgba(224,182,75,0.10)" : "rgba(255,255,255,0)",
              }}
              transition={{ ...SPRING, delay: reduced ? 0 : 0.08 + i * 0.05 }}
              className={`relative -mx-2 flex items-center gap-3 rounded-[8px] px-2 py-3 ${
                i > 0 ? "border-t border-[#0a2540]/[0.06]" : ""
              }`}
            >
              {r.manquante && !faite ? (
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
                key={faite ? "faite" : "attente"}
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 24 }}
                className={`shrink-0 rounded-full px-2.5 py-1 font-inter text-[11.5px] font-semibold ${
                  !r.manquante
                    ? "bg-[#d8f0e4] text-[#0f9d76]"
                    : faite
                      ? "bg-[#e7effd] text-[#2563eb]"
                      : "bg-[#f3e6c4] text-[#8a6d1f]"
                }`}
              >
                {!r.manquante
                  ? t({ fr: "Reçue", en: "Received" })
                  : faite
                    ? t({ fr: "Relancée", en: "Chased" })
                    : t({ fr: "Manquante", en: "Missing" })}
              </motion.span>
              {/* L'AVION : au passage en « Relancée », un petit envoi s'envole
                  de la ligne — la relance qui part, littéralement. */}
              {faite && !reduced && (
                <motion.span
                  className="pointer-events-none absolute right-4 top-1/2 text-[#3b82f6]"
                  initial={{ x: 0, y: -8, opacity: 1, rotate: 0 }}
                  animate={{ x: 74, y: -30, opacity: 0, rotate: 18 }}
                  transition={{ duration: 0.6, ease: [0.3, 0, 0.7, 0.4] }}
                >
                  <Send className="h-4 w-4" strokeWidth={2.2} />
                </motion.span>
              )}
            </motion.div>
          );
        })}

        {!reduced && (
          <motion.div
            className="pointer-events-none absolute right-[54px] top-0 z-20"
            animate={{ y: souris.y, x: souris.x, opacity: souris.o }}
            transition={{ type: "spring", stiffness: 320, damping: 27 }}
          >
            <Souris presse={phase === "clic"} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. PRÉPARE VOTRE JOURNÉE — le point s'assemble, la souris déplie le détail.
   ═══════════════════════════════════════════════════════════════════════════ */

const JOUR_ROWS: {
  icon: typeof Check;
  label: { fr: string; en: string };
  compte: { fr: string; en: string };
  tone: "amber" | "gris" | "rouge";
}[] = [
  {
    icon: CalendarCheck,
    label: { fr: "Échéances du jour", en: "Today's deadlines" },
    compte: { fr: "3 à traiter", en: "3 to handle" },
    tone: "amber",
  },
  {
    icon: Moon,
    label: { fr: "Dossiers dormants", en: "Dormant files" },
    compte: { fr: "2 sans activité", en: "2 inactive" },
    tone: "gris",
  },
  {
    icon: RotateCcw,
    label: { fr: "Échecs à reprendre", en: "Failures to retry" },
    compte: { fr: "1 automatisation", en: "1 automation" },
    tone: "rouge",
  },
];

/** Le détail déplié sous « Échéances du jour » : des TYPES d'échéances sur les
 *  dossiers de démonstration — pas de date, pas de montant. */
const JOUR_DETAIL = [
  { fr: "TVA · Nexio SAS", en: "VAT · Nexio SAS" },
  { fr: "Liasse fiscale · Almadis", en: "Tax package · Almadis" },
  { fr: "Paie · Groupe Méridian", en: "Payroll · Groupe Méridian" },
];

const JOUR_TONES = {
  amber: "bg-[#f3e6c4] text-[#8a6d1f]",
  gris: "bg-[#eaeff7] text-[#5b6577]",
  rouge: "bg-[#f7d9d5] text-[#b4544a]",
} as const;

type PhJour = "pose" | "l1" | "l2" | "l3" | "vise" | "clic" | "detail" | "fini";
const JOUR_ORDRE: PhJour[] = ["pose", "l1", "l2", "l3", "vise", "clic", "detail", "fini"];

export function AtlasLiveJour({ active = true }: { active?: boolean }) {
  const { t } = useLang();
  const { rootRef, reduced, phase } = useScene<PhJour>(active, "pose", (ph, next) => {
    if (ph === "pose") next("l1", 480);
    else if (ph === "l1") next("l2", 340);
    else if (ph === "l2") next("l3", 340);
    else if (ph === "l3") next("vise", 460);
    else if (ph === "vise") next("clic", 460);
    else if (ph === "clic") next("detail", 200);
    else if (ph === "detail") next("fini", 1500);
    else next("pose", 2100);
  });
  const etape = reduced ? JOUR_ORDRE.length - 1 : JOUR_ORDRE.indexOf(phase);
  const lignes = reduced ? 3 : Math.min(3, Math.max(0, etape));
  const deplie = reduced || etape >= 6;

  const souris =
    etape >= 4 && etape <= 6
      ? { y: 74, x: 0, o: 1 }
      : etape >= 7
        ? { y: 108, x: 22, o: 0.9 }
        : { y: 216, x: 26, o: 0.85 };

  return (
    <div ref={rootRef} aria-hidden className="w-full">
      <AgentChip
        icone={<CalendarCheck className="h-[18px] w-[18px] text-[#3b82f6]" strokeWidth={2} />}
        texte={
          etape >= 7
            ? t({ fr: "Journée prête", en: "Day is ready" })
            : t({ fr: "Atlas prépare votre journée", en: "Atlas is preparing your day" })
        }
        fini={etape >= 7}
      />

      <motion.div
        initial={reduced ? false : { y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={SPRING}
        className="relative mt-5 rounded-[16px] bg-white px-4 pb-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] md:px-5"
      >
        <div className="border-b border-[#0a2540]/[0.07] py-2.5">
          <span className="font-inter text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6b7688]">
            {t({ fr: "Ce matin", en: "This morning" })}
          </span>
        </div>
        {JOUR_ROWS.map((r, i) => {
          const on = i < lignes;
          const Icon = r.icon;
          const cible = i === 0 && !reduced && etape >= 4 && etape <= 5;
          return (
            <motion.div
              key={r.label.en}
              animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
              transition={SPRING}
              className={i > 0 ? "border-t border-[#0a2540]/[0.06]" : ""}
            >
              <motion.div
                animate={{ backgroundColor: cible ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0)" }}
                className="-mx-2 flex items-center gap-3 rounded-[8px] px-2 py-3"
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${JOUR_TONES[r.tone]}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate font-inter text-[13.5px] font-medium text-[#111827]">
                  {t(r.label)}
                </span>
                <motion.span
                  key={on ? "on" : "off"}
                  initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                  animate={on ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 24 }}
                  className={`shrink-0 rounded-full px-2.5 py-1 font-inter text-[11.5px] font-semibold ${JOUR_TONES[r.tone]}`}
                >
                  {t(r.compte)}
                </motion.span>
              </motion.div>

              {/* LE DÉTAIL DÉPLIÉ au clic sur la première ligne : les trois
                  échéances, chacune sur son dossier. La hauteur s'anime au
                  ressort — même mécanique que l'accordéon de gauche. */}
              {i === 0 && (
                <motion.div
                  className="overflow-hidden"
                  initial={false}
                  animate={{ height: deplie ? "auto" : 0, opacity: deplie ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                >
                  <div className="mb-2 ml-11 space-y-1.5 border-l-2 border-dashed border-[#e0b64b]/60 pl-3">
                    {JOUR_DETAIL.map((d, j) => (
                      <motion.div
                        key={d.en}
                        initial={reduced ? false : { opacity: 0, x: -10 }}
                        animate={deplie ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ ...SPRING, delay: deplie && !reduced ? 0.08 + j * 0.07 : 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#e0b64b]" />
                        <span className="truncate font-inter text-[12.5px] text-[#42506b]">{t(d)}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {!reduced && (
          <motion.div
            className="pointer-events-none absolute right-[64px] top-0 z-20"
            animate={{ y: souris.y, x: souris.x, opacity: souris.o }}
            transition={{ type: "spring", stiffness: 300, damping: 27 }}
          >
            <Souris presse={phase === "clic"} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
