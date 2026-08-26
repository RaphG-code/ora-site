import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CalendarClock, Check, FolderClosed, Landmark, PiggyBank, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * AtlasLiveNotify — l'animation de la capacité « Signale ce qui impacte un
 * dossier » : le flux des notifications qu'Atlas remonte au cabinet.
 *
 * ⚠ QUATRIÈME PASSE (client 2026-08-22) : « il faut que ce soit des
 * informations qui font gagner ou économiser de l'argent au client, ou un
 * danger réglementaire. Dans l'encadré, un bouton Envoyer, une souris qui
 * clique dessus, et l'encadré passe en vert comme validé. »
 *
 * LE SCÉNARIO PAR CYCLE (2,6 s) : une notification arrive en blanc, avec son
 * bouton « Envoyer » — la SOURIS glisse jusqu'au bouton, l'appuie, et la carte
 * bascule en vert « Envoyé » : le cabinet vient de transmettre l'information à
 * son client. Les cartes validées descendent dans la pile, encore vertes. La
 * boucle raconte donc le geste du produit : Atlas détecte, le cabinet
 * transmet, le client y gagne — c'est exactement le « rediriger votre temps
 * vers le conseil » du hero, joué en boucle.
 *
 * ⚠ LE CONTENU DIT L'ARGENT SANS JAMAIS CHIFFRER. Règle maison (mémoire
 * copywriting) : pas de chiffres inventés. Les notifications nomment des TYPES
 * de gains (« Dispositif d'aide mobilisable », « Crédit d'impôt non
 * réclamé ») et de dangers (« Échéance déclarative proche », « Nouvelle
 * obligation de facturation ») — jamais un montant, jamais un texte de loi,
 * jamais une date réelle. Nexio SAS et Almadis restent les noms de
 * démonstration établis.
 *
 * LA SOURIS : un pointeur SVG animé au ressort (Framer), qui vit dans le
 * repère de la pile. Sa cible est FIXE — le bouton de la carte de tête est
 * toujours à la même place, en haut à droite de la pile — donc tout est
 * transform, rien n'est mesuré ni repeint. Le clic est un tassement
 * (scale 0,8) synchronisé avec l'appui du bouton.
 *
 * Garde-fous inchangés : IntersectionObserver + `active`, mouvement réduit →
 * trois cartes validées posées sans souris ni boucle, `aria-hidden`.
 */

/**
 * ⚠ CHAQUE NOTIFICATION EST RATTACHÉE À UN CLIENT ET À SON SECTEUR (client
 * 2026-08-22, cinquième passe : « il faudrait que les encadrés soient reliés à
 * des clients, pour faire comprendre que notre système est assez intelligent
 * pour comprendre qu'une nouvelle peut impacter un client par rapport à son
 * secteur d'activité — opportunité d'investissement, de recrutement, de
 * subvention ou autres »). La seconde ligne de chaque carte fait ce lien :
 * « ↳ {client} · {secteur} » — la nouvelle en haut, le client qu'elle touche
 * en dessous, et le secteur dit POURQUOI le rapprochement s'est fait.
 *
 * Les SECTEURS sont ceux du sélecteur de métier du Prévisionnel (maquette
 * établie : bâtiment et artisanat, restauration, transport et logistique,
 * commerce de détail…). Les CLIENTS sont les noms de démonstration du site :
 * Nexio SAS, Almadis, Groupe Méridian, Dossier Émeraude. Rien de neuf, tout
 * est déjà à l'écran ailleurs. Et toujours AUCUN montant, AUCUNE date : des
 * types d'opportunités et de risques, c'est la règle maison. */
const FEED: {
  icon: typeof Bell;
  tag: { fr: string; en: string };
  title: { fr: string; en: string };
  client: string;
  secteur: { fr: string; en: string };
  tone: "gain" | "risque" | "regle";
}[] = [
  {
    icon: PiggyBank,
    tag: { fr: "Subvention", en: "Subsidy" },
    title: { fr: "Aide à l'embauche mobilisable", en: "Hiring support available" },
    client: "Almadis",
    secteur: { fr: "Bâtiment et artisanat", en: "Construction and trades" },
    tone: "gain",
  },
  {
    icon: CalendarClock,
    tag: { fr: "Risque", en: "Risk" },
    title: { fr: "Échéance déclarative proche", en: "Filing deadline approaching" },
    client: "Groupe Méridian",
    secteur: { fr: "Restauration", en: "Food service" },
    tone: "risque",
  },
  {
    icon: TrendingUp,
    tag: { fr: "Investissement", en: "Investment" },
    title: { fr: "Soutien à l'investissement matériel", en: "Equipment investment support" },
    client: "Nexio SAS",
    secteur: { fr: "Transport et logistique", en: "Transport and logistics" },
    tone: "gain",
  },
  {
    icon: Landmark,
    tag: { fr: "Réglementaire", en: "Regulatory" },
    title: { fr: "Nouvelle obligation de facturation", en: "New invoicing obligation" },
    client: "Dossier Émeraude",
    secteur: { fr: "Commerce de détail", en: "Retail" },
    tone: "regle",
  },
];

const TONES = {
  gain: { chip: "bg-[#d8f0e4] text-[#0f9d76]", ico: "bg-[#d8f0e4] text-[#0f9d76]" },
  risque: { chip: "bg-[#f7d9d5] text-[#b4544a]", ico: "bg-[#f7d9d5] text-[#b4544a]" },
  regle: { chip: "bg-[#e7effd] text-[#2563eb]", ico: "bg-[#e7effd] text-[#3b82f6]" },
} as const;

const STEP = 88;
const CARD_H = 76;
const SHOWN = 3;

/** Le tempo du cycle : arrivée, trajet de la souris, clic, validation.
 *  Resserré une seconde fois le 2026-08-22 (« plus rapide et bien plus
 *  smooth ») : 1,6 s le cycle, clic à 0,52 s, validation à 0,65 s. */
const CYCLE = 1600;
const T_CLIC = 520;
const T_VALIDE = 650;

/* ⚠ Plus de phase « repos » en bas de pile (client : « il ne faut pas que la
   souris revienne à chaque fois plus bas ») : entre deux clics, la souris
   reste À CÔTÉ du bouton, en léger retrait — le petit écart puis le retour
   sur la cible suffisent à lire le geste, sans le grand aller-retour. */
type CursorPhase = "attente" | "aller" | "clic";

export default function AtlasLiveNotify({ active = true }: { active?: boolean }) {
  const { t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [items, setItems] = useState<{ id: number; k: number; sent: boolean }[]>([]);
  const [souris, setSouris] = useState<CursorPhase>("attente");

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
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = onScreen && active && !reduced;

  /* ⚠ LE DRAPEAU DE VIE, et il est indispensable : au moment où `running`
     bascule, un tir d'intervalle DÉJÀ EN FILE peut s'exécuter APRÈS le
     nettoyage de l'effet — clearInterval n'y peut rien, la tâche est déjà
     partie. Ce tir poussait une carte dont les minuteurs venaient d'être
     annulés : une carte ZOMBIE, figée sur « Envoyer », qui survivait au vidage
     et polluait la reprise à zéro (vu à la trace : 1 carte, opacité 0,
     immobile pendant toute l'absence). Chaque tir consulte le drapeau AU
     MOMENT où il s'exécute : un tir posthume ne pousse rien. */
  const vivant = useRef(false);

  useEffect(() => {
    vivant.current = running;
    if (!running) return;
    /* ⚠ REPRISE À ZÉRO AU RETOUR (même demande que la boucle voisine) : la
       pile se vide et la souris se replace avant que le flux ne reparte — le
       visiteur qui revient voit l'histoire depuis le début. */
    setItems([]);
    setSouris("attente");
    const timers: ReturnType<typeof setTimeout>[] = [];
    /* Un cycle : la carte arrive, la souris part, clique, la carte se valide.
       L'identifiant est tiré HORS des updaters — leçon StrictMode de la passe
       précédente, les updaters restent purs. */
    const cycle = () => {
      if (!vivant.current) return;
      const id = nextId.current++;
      setItems((prev) => [{ id, k: id % FEED.length, sent: false }, ...prev].slice(0, SHOWN + 1));
      setSouris("aller");
      timers.push(setTimeout(() => setSouris("clic"), T_CLIC));
      timers.push(
        setTimeout(() => {
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, sent: true } : it)));
          setSouris("attente");
        }, T_VALIDE),
      );
    };
    const premier = setTimeout(cycle, 150);
    const iv = setInterval(cycle, CYCLE);
    return () => {
      clearTimeout(premier);
      clearInterval(iv);
      timers.forEach(clearTimeout);
      /* Vidage AUSSI au départ : la pile est invisible à cet instant (fondu
         de sortie), la vider ne coûte rien à l'œil et garantit un retour
         propre quel que soit l'ordre des bascules visibilité / sélection. */
      setItems([]);
      setSouris("attente");
    };
  }, [running]);

  /* En mouvement réduit : trois cartes validées, posées, pas de souris. */
  const affiches = reduced
    ? FEED.slice(0, SHOWN).map((_, i) => ({ id: i, k: i, sent: true }))
    : items;

  return (
    <div ref={rootRef} aria-hidden className="w-full">
      {/* ⚠ L'ENTRÉE ET LE GLISSEMENT DES CARTES SONT PASSÉS SUR RESSORT
          FRAMER (seconde passe « plus smooth ») : à 1,6 s de cycle, une carte
          entre pendant que les autres glissent encore — un ressort REPREND LA
          VITESSE en cours quand sa cible change, là où une transition CSS
          repart de la position figée. C'est ce raccord de vitesse qui fait le
          moelleux à cadence rapide. L'overshoot des keyframes d'entrée est
          devenu inutile : le ressort dépasse et se rattrape tout seul. */}
      <style>{`
        @keyframes anBellRing {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-16deg); }
          45% { transform: rotate(11deg); }
          70% { transform: rotate(-6deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      <div className="flex items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-white"
          style={{ background: "linear-gradient(135deg, #3b82f6, #0d9488)" }}
        >
          <span
            key={affiches[0]?.id ?? "vide"}
            className="grid place-items-center"
            style={{
              animation: reduced ? undefined : "anBellRing 0.45s ease-out both",
              transformOrigin: "50% 15%",
            }}
          >
            <Bell className="h-[17px] w-[17px]" strokeWidth={2} />
          </span>
        </span>
        <span className="inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 font-inter text-[13.5px] text-white/85">
          {t({ fr: "Atlas veille sur vos dossiers", en: "Atlas watches over your files" })}
        </span>
      </div>

      <div className="relative mt-5" style={{ height: (SHOWN - 1) * STEP + CARD_H }}>
        {affiches.map((it, i) => {
          const d = FEED[it.k];
          const Icon = d.icon;
          const tone = TONES[d.tone];
          const sortante = i >= SHOWN;
          return (
            <motion.div
              key={it.id}
              initial={reduced ? false : { y: -28, opacity: 0, scale: 0.94 }}
              animate={{
                y: Math.min(i, SHOWN) * STEP + (sortante ? 16 : 0),
                opacity: sortante ? 0 : 1,
                scale: sortante ? 0.96 : 1,
              }}
              transition={{ type: "spring", stiffness: 430, damping: 32, mass: 0.9 }}
              className="absolute inset-x-0 top-0"
              style={{ zIndex: 10 - i }}
            >
              {/* LA CARTE. Blanche à l'arrivée ; VALIDÉE une fois envoyée —
                  fond vert d'eau, liseré vert : le vert de statut des scènes,
                  jamais la sarcelle de marque en aplat. */}
              <div
                className={`flex items-center gap-3.5 rounded-[14px] px-4 transition-colors duration-200 ${
                  it.sent
                    ? "bg-[#f0faf5] shadow-[0_18px_44px_-18px_rgba(0,0,0,0.5),inset_0_0_0_1.5px_rgba(15,157,118,0.35)]"
                    : "bg-white shadow-[0_18px_44px_-18px_rgba(0,0,0,0.65)]"
                }`}
                style={{ height: CARD_H }}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${tone.ico}`}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-inter text-[13.5px] font-semibold text-[#111827]">
                      {t(d.title)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-inter text-[10.5px] font-semibold ${tone.chip}`}
                    >
                      {t(d.tag)}
                    </span>
                  </span>
                  {/* LE LIEN VERS LE CLIENT (client 2026-08-22, sixième
                      passe : « un petit encadré réservé au nom du client, et
                      des liens comme des tirets entre l'info et le client
                      concerné ») : une ligne en TIRETS part de sous le titre
                      et aboutit à un ENCADRÉ — pastille bordée, icône dossier,
                      nom en encre, secteur en gris. Le pointillé dit « ceci a
                      été rapproché de », l'encadré dit « ce client-là ». */}
                  <span className="mt-1.5 flex min-w-0 items-center">
                    <span
                      aria-hidden
                      className="ml-1 h-0 w-6 shrink-0 border-t-2 border-dashed border-[#c9d2e0]"
                    />
                    <span className="ml-1.5 inline-flex min-w-0 items-center gap-1.5 rounded-[7px] border border-[#0a2540]/[0.14] bg-[#f7f9fd] px-2 py-[3px] font-inter text-[11.5px]">
                      <FolderClosed className="h-3 w-3 shrink-0 text-[#3b82f6]" strokeWidth={2.2} />
                      <span className="truncate">
                        <span className="font-semibold text-[#111827]">{d.client}</span>
                        <span className="text-[#6b7688]">{" · "}{t(d.secteur)}</span>
                      </span>
                    </span>
                  </span>
                </span>
                {/* LE BOUTON. « Envoyer » en bleu de charte ; l'appui est un
                    tassement au ressort, synchronisé avec le clic de la
                    souris ; « Envoyé » en vert une fois la carte validée. */}
                <motion.span
                  animate={
                    !it.sent && i === 0 && souris === "clic" ? { scale: 0.9 } : { scale: 1 }
                  }
                  transition={{ type: "spring", stiffness: 700, damping: 24 }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-inter text-[12px] font-semibold transition-colors duration-300 ${
                    it.sent ? "bg-[#d8f0e4] text-[#0f9d76]" : "bg-[#3b82f6] text-white"
                  }`}
                >
                  {it.sent && <Check className="h-3 w-3" strokeWidth={3.2} />}
                  {it.sent
                    ? t({ fr: "Envoyé", en: "Sent" })
                    : t({ fr: "Envoyer", en: "Send" })}
                </motion.span>
              </div>
            </motion.div>
          );
        })}

        {/* ── LA SOURIS ─────────────────────────────────────────────────────
            Ancrée à droite de la pile, à l'aplomb du bouton de la carte de
            tête : sa cible ne bouge jamais, elle n'anime que son `y` (et un
            soupçon de `x`), au ressort. Le clic est un tassement bref.
            `drop-shadow` : sans ombre, un pointeur blanc disparaît sur les
            cartes blanches. */}
        {!reduced && (
          <motion.div
            className="pointer-events-none absolute right-[44px] top-0 z-20"
            animate={
              souris === "attente"
                ? { y: 52, x: 22, opacity: 0.95 }
                : { y: 34, x: 0, opacity: 1 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 27 }}
          >
            <motion.span
              className="block"
              animate={souris === "clic" ? { scale: 0.78 } : { scale: 1 }}
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
        )}
      </div>
    </div>
  );
}
