import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LE CHOIX DU CRÉNEAU : un calendrier, quatre heures, un raccourci        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Client 2026-08-19 : « juste réserve un créneau, quatre créneaux par jour, un
 * jour sur deux ». Première version : une liste de cinq jours, quatre heures
 * chacun, les MÊMES heures tous les jours.
 *
 * Client 2026-08-20, trois reproches précis :
 *   1. « je voudrais qu'ils aient le calendrier où ils peuvent choisir une date
 *      à laquelle ils veulent leur rendez-vous » → la liste devient un VRAI
 *      CALENDRIER mensuel. On choisit d'abord un jour, puis une heure.
 *   2. « ce n'est pas le même créneau tous les jours à la même heure » → les
 *      quatre heures CHANGENT d'un jour à l'autre (voir DAY_PATTERNS).
 *   3. « on est trop disponibles, ils n'y verront aucune valeur » → c'est la
 *      raison d'être de tout ce fichier. Un agenda qui offre tout, tout le
 *      temps, dit que le temps de celui qui le propose ne vaut rien.
 * Et une demande neuve : « un bouton où on peut cliquer sur le rendez-vous le
 * plus proche possible » → PREMIER CRÉNEAU DISPONIBLE, en tête d'écran.
 *
 * ══ ⚠ CE QUE CE FICHIER NE PEUT PAS CORRIGER ═══════════════════════════════
 * Le client signale « un créneau disponible toutes les 15 minutes ». Ce n'est
 * PAS cet écran : c'est la grille de Cal.com, affichée à l'étape suivante, dans
 * son iframe. Elle vient du réglage « time-slot interval » du type d'événement
 * Cal (onglet *Limits & buffers* du tableau de bord Cal), et AUCUN paramètre
 * d'embed ne permet de la surcharger depuis le site : la documentation Cal
 * n'expose que `date` et `month`, jamais un horaire précis, et il n'existe pas
 * de moyen de sauter la grille pour aller droit au formulaire.
 * Tant que ce réglage Cal n'est pas changé, le visiteur choisira ici une heure
 * puis en verra vingt autres dans l'iframe. Les deux doivent dire la même
 * chose ; la moitié du travail est côté Cal, pas ici.
 */

/**
 * LES QUATRE HEURES, DIFFÉRENTES D'UN JOUR À L'AUTRE.
 *
 * Quatre grilles qui tournent, indexées par la position du jour dans la série.
 * Chacune garde DEUX heures le matin et DEUX l'après-midi (l'en-tête de
 * colonnes s'appuie dessus, voir plus bas), mais aucune ne répète les horaires
 * de la précédente.
 *
 * ⚠ POURQUOI UN CYCLE ET NON UN TIRAGE ALÉATOIRE. Un `Math.random()` donnerait
 * des heures différentes à chaque rendu : le visiteur qui change de mois et
 * revient verrait un autre agenda, et deux onglets ouverts se contrediraient.
 * Un cycle indexé sur la position du jour donne toujours le même résultat pour
 * le même jour, ce qu'un agenda doit faire.
 *
 * ⚠ CES HEURES SONT UNE GRILLE D'AFFICHAGE. Elles doivent correspondre à la
 * disponibilité réglée dans Cal.com, sinon le visiteur choisit ici un horaire
 * que Cal refuse ensuite. Voir le pavé d'ouverture.
 */
const DAY_PATTERNS = [
  ["09:00", "10:30", "14:00", "16:00"],
  ["09:30", "11:15", "15:00", "17:00"],
  ["08:45", "11:00", "13:45", "16:30"],
  ["10:00", "11:30", "14:30", "17:15"],
] as const;

/** « Un jour sur deux ». Les week-ends sont sautés sans consommer le pas. */
const DAY_STEP = 2;

/** Une douzaine de jours ouverts, soit environ quatre semaines de calendrier :
 *  assez pour que le mois suivant ait de quoi s'afficher, assez peu pour que
 *  l'agenda reste visiblement contraint. */
const OPEN_DAYS = 12;

export type Slot = {
  /** `YYYY-MM-DD`, le format attendu par la config `date` de l'embed Cal.com. */
  iso: string;
  /** `HH:MM`, tel qu'affiché sur la pastille. */
  time: string;
  /** Le jour, déjà mis en toutes lettres dans la langue courante. */
  dayLabel: string;
};

function toIso(d: Date): string {
  // Pas de `toISOString()` : il convertit en UTC et, pour un visiteur à l'est
  // de Greenwich, minuit local devient la veille 22 h. La date envoyée à
  // Cal.com serait alors décalée d'un jour.
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Les jours OUVERTS, à partir de demain, un sur deux, week-ends exclus.
 *
 * On part de demain et jamais d'aujourd'hui : proposer 09:00 à quelqu'un qui
 * lit la page à 14 h est une case morte.
 *
 * Le week-end ne consomme pas le pas : on avance d'un jour à la fois jusqu'à
 * retomber en semaine, PUIS on applique le pas. Sans cette distinction, un pas
 * de 2 tombant un vendredi sauterait au dimanche puis au mardi, et la série
 * perdrait le lundi sans raison.
 */
function buildOpenDays(): { iso: string; date: Date; times: readonly string[] }[] {
  const out: { iso: string; date: Date; times: readonly string[] }[] = [];
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  cur.setDate(cur.getDate() + 1);

  // Garde-fou : douze jours ouvrés un sur deux tiennent dans ~40 itérations.
  let guard = 0;
  while (out.length < OPEN_DAYS && guard++ < 120) {
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }
    out.push({
      iso: toIso(cur),
      date: new Date(cur),
      times: DAY_PATTERNS[out.length % DAY_PATTERNS.length],
    });
    cur.setDate(cur.getDate() + DAY_STEP);
  }
  return out;
}

export default function SlotPicker({ onPick }: { onPick: (slot: Slot) => void }) {
  const { t, lang } = useLang();
  const locale = lang === "en" ? "en-GB" : "fr-FR";

  /* `useMemo` sans dépendance : la grille est calculée à l'ouverture de la
     modale et ne bouge plus tant qu'elle est ouverte. Sans lui, chaque rendu
     rappellerait `new Date()` et un visiteur qui laisse la fenêtre ouverte à
     cheval sur minuit verrait l'agenda se décaler sous ses yeux. */
  const days = useMemo(buildOpenDays, []);
  const byIso = useMemo(() => new Map(days.map((d) => [d.iso, d])), [days]);

  const [selectedIso, setSelectedIso] = useState<string>(days[0]?.iso ?? "");
  /* Le mois affiché, porté à part du jour choisi : on doit pouvoir feuilleter
     octobre sans perdre le créneau déjà retenu en septembre. */
  const [cursor, setCursor] = useState<Date>(() => {
    const d = days[0]?.date ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const selected = byIso.get(selectedIso) ?? days[0];

  // Bornes de feuilletage : on ne laisse pas sortir de la plage qui contient
  // des jours ouverts. Un mois vide serait une impasse silencieuse.
  const firstMonth = days.length ? new Date(days[0].date.getFullYear(), days[0].date.getMonth(), 1) : cursor;
  const lastMonth = days.length
    ? new Date(days[days.length - 1].date.getFullYear(), days[days.length - 1].date.getMonth(), 1)
    : cursor;
  const canPrev = cursor > firstMonth;
  const canNext = cursor < lastMonth;

  /* LA MATRICE DU MOIS. On commence la semaine le LUNDI (`(dow + 6) % 7`) :
     `getDay()` rend 0 pour dimanche, ce qui est la convention américaine et
     décalerait toute la grille d'une case en France. */
  const cells = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7;
    const total = new Date(y, m + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= total; d++) out.push(new Date(y, m, d));
    return out;
  }, [cursor]);

  const dayLabelOf = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  const pick = (iso: string, time: string) => {
    const day = byIso.get(iso);
    if (!day) return;
    onPick({ iso, time, dayLabel: dayLabelOf(day.date) });
  };

  const weekdays =
    lang === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "M", "J", "V", "S", "D"];

  return (
    /* ⚠ `pt-14` ET NON `pt-5` : le bouton de fermeture de la modale est en
       `absolute right-5 top-5`, donc POSÉ SUR cette colonne, et il mordait de
       24 px mesurés sur le coin droit du raccourci « Au plus tôt ». Le
       raccourci étant pleine largeur, aucune marge droite ne le sauvait sans
       le décentrer ; le descendre sous la croix est la seule solution qui
       garde sa pleine largeur. Toute la colonne descend avec lui. */
    <div className="flex max-h-[68vh] flex-col overflow-y-auto px-5 pb-5 pt-14 md:max-h-[80vh] md:px-7">
      {/* ── LE RACCOURCI (client 2026-08-20 : « un bouton où on peut cliquer
          sur le rendez-vous le plus proche possible ») ────────────────────
          En TÊTE d'écran et non en pied : c'est le chemin le plus court vers
          la conversion, il ne doit pas se mériter après un défilement. Il
          court-circuite calendrier ET heures d'un seul clic.
          Il annonce le créneau qu'il va prendre, il ne dit pas seulement
          « au plus tôt » : un bouton qui engage sans dire quoi ne se clique
          pas. */}
      {days.length > 0 && (
        <button
          type="button"
          onClick={() => pick(days[0].iso, days[0].times[0])}
          className="group mb-5 flex w-full items-center gap-3 rounded-[10px] border border-[#3b82f6]/25 bg-[#3b82f6]/[0.06] px-4 py-3 text-left transition-colors duration-150 hover:border-[#3b82f6]/45 hover:bg-[#3b82f6]/[0.10] dark:border-[#3b82f6]/30 dark:bg-[#3b82f6]/[0.10]"
        >
          <Zap className="h-4 w-4 shrink-0 text-[#3b82f6]" strokeWidth={2} aria-hidden />
          <span className="min-w-0">
            <span className="block font-inter text-[13.5px] font-semibold leading-tight text-[#111827] dark:text-white">
              {t({ fr: "Au plus tôt", en: "Soonest available" })}
            </span>
            <span className="mt-0.5 block font-inter text-[12.5px] leading-tight text-[#5b6577] first-letter:uppercase dark:text-gray-400">
              {dayLabelOf(days[0].date)} {t({ fr: "à", en: "at" })} {days[0].times[0]}
            </span>
          </span>
        </button>
      )}

      {/* ── LE CALENDRIER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="font-inter text-[14px] font-semibold capitalize text-[#111827] dark:text-white">
          {cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            disabled={!canPrev}
            aria-label={t({ fr: "Mois précédent", en: "Previous month" })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#42506b] transition-colors duration-150 hover:bg-[#0a2540]/[0.06] disabled:pointer-events-none disabled:opacity-30 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            disabled={!canNext}
            aria-label={t({ fr: "Mois suivant", en: "Next month" })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#42506b] transition-colors duration-150 hover:bg-[#0a2540]/[0.06] disabled:pointer-events-none disabled:opacity-30 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekdays.map((w, i) => (
          <span
            key={`${w}${i}`}
            className="py-1 text-center font-inter text-[11px] font-semibold text-[#6b7688] dark:text-gray-500"
          >
            {w}
          </span>
        ))}

        {cells.map((d, i) => {
          if (!d) return <span key={`vide-${i}`} aria-hidden />;
          const iso = toIso(d);
          const open = byIso.has(iso);
          const on = iso === selectedIso;
          return (
            <button
              key={iso}
              type="button"
              disabled={!open}
              onClick={() => setSelectedIso(iso)}
              aria-pressed={on}
              /* ⚠ LES JOURS FERMÉS RESTENT VISIBLES, simplement éteints, et ce
                 n'est pas un détail d'accessibilité : c'est l'argument. Un
                 agenda où trois jours sur quatre sont pris se lit comme un
                 agenda occupé. Les masquer donnerait un mois à trous, qui se
                 lit comme un bug. */
              className={`aspect-square rounded-[8px] font-inter text-[13px] tabular-nums transition-colors duration-150 ${
                on
                  ? "bg-[#3b82f6] font-semibold text-white"
                  : open
                    ? "font-semibold text-[#111827] hover:bg-[#0a2540]/[0.07] dark:text-white dark:hover:bg-white/10"
                    : "cursor-default font-normal text-[#c8cedb] dark:text-white/20"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* ── LES QUATRE HEURES DU JOUR CHOISI ──────────────────────────────
          L'en-tête « Matin / Après-midi » coiffe les deux moitiés de la rangée,
          ce qui n'est vrai que parce que chaque grille de DAY_PATTERNS range
          deux heures le matin puis deux l'après-midi. Passer à six créneaux, ou
          à une grille trois/un, demanderait de revoir cet en-tête. */}
      {selected && (
        <div className="mt-6 border-t border-[#0a2540]/[0.08] pt-5 dark:border-white/10">
          <p className="font-inter text-[13.5px] font-semibold text-[#111827] first-letter:uppercase dark:text-white">
            {dayLabelOf(selected.date)}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { fr: "Matin", en: "Morning" },
              { fr: "Après-midi", en: "Afternoon" },
            ].map((c) => (
              <span
                key={c.en}
                className="font-inter text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7688] dark:text-gray-500"
              >
                {t(c)}
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-4 gap-2">
            {selected.times.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => pick(selected.iso, time)}
                className="rounded-[8px] border border-[#0a2540]/[0.12] bg-white py-2.5 font-inter text-[13.5px] font-semibold tabular-nums text-[#42506b] transition-colors duration-150 hover:border-[#3b82f6] hover:bg-[#3b82f6] hover:text-white dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-[#3b82f6] dark:hover:bg-[#3b82f6] dark:hover:text-white"
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
