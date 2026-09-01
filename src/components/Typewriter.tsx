import { useEffect, useRef } from "react";

/**
 * Typewriter — une ou plusieurs phrases qui s'écrivent seules, puis
 * s'effacent et cèdent la place à la suivante (client 2026-08-13 : « crée une
 * phrase dedans qui s'écrit toute seule », « une animation avec des phrases
 * qui s'écrivent toutes seules »).
 *
 * ÉCRITURE IMPÉRATIVE, aucun rendu React par caractère. Un état React aurait
 * imposé un re-rendu tous les 55 ms, dans une section qui porte déjà deux
 * canvas WebGL et une vidéo : le composant écrit donc directement le
 * `textContent` d'un nœud tenu par ref. C'est la même règle que partout
 * ailleurs sur ce site (voir le moteur de scrub du hero, dont un setState par
 * image coûtait 85 ms).
 *
 * TROIS GARDE-FOUS :
 *   · IntersectionObserver — la boucle ne tourne QUE si le bloc est à l'écran.
 *     Sans lui, huit panneaux d'onglets feraient tourner leurs minuteries en
 *     permanence, très loin du regard.
 *   · prefers-reduced-motion — la première phrase est posée d'un coup et rien
 *     ne bouge. Une frappe simulée est exactement le genre de mouvement que ce
 *     réglage vise.
 *   · le nettoyage annule la minuterie en vol, sinon un démontage en pleine
 *     frappe laisserait un timer écrire dans un nœud détaché.
 *
 * Le CURSEUR est un pseudo-élément CSS animé, pas un caractère ajouté au
 * texte : ajouter un « | » au textContent le ferait entrer dans la sélection
 * et dans le presse-papier du visiteur.
 */

const TW_CSS = `
@keyframes twBlink { 0%, 45% { opacity: 1; } 55%, 100% { opacity: 0; } }
.tw-caret::after {
  content: "";
  display: inline-block;
  width: 1px;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: -0.16em;
  background: currentColor;
  animation: twBlink 1.06s steps(1, end) infinite;
}
@media (prefers-reduced-motion: reduce) { .tw-caret::after { animation: none; } }
`;

export default function Typewriter({
  phrases,
  className,
  /** Millisecondes par caractère à la frappe. */
  typeMs = 52,
  /** Pause une fois la phrase entière écrite. */
  holdMs = 2200,
  /** Millisecondes par caractère à l'effacement, plus rapide que la frappe. */
  eraseMs = 26,
  /** Pause écran vide avant la phrase suivante. */
  gapMs = 260,
  /**
   * Délai entre le moment où le bloc entre à l'écran et la première lettre.
   *
   * Les 420 ms d'origine sont un temps de RESPIRATION : sur une phrase-décor
   * qu'on regarde passer, partir à l'instant même où le bloc apparaît fait
   * rater le début de la frappe, l'œil n'est pas encore là. Sur une glose qu'on
   * doit LIRE, en revanche, ils sont du temps mort avant le temps mort.
   */
  startMs = 420,
  loop = true,
}: {
  phrases: string[];
  className?: string;
  typeMs?: number;
  holdMs?: number;
  eraseMs?: number;
  gapMs?: number;
  startMs?: number;
  /**
   * `loop={false}` : la DERNIÈRE phrase s'écrit et RESTE. Rien ne s'efface,
   * rien ne recommence.
   *
   * Ajouté le 2026-08-28 pour les gloses d'Atlas (client : « une petite
   * description qui s'écrit au fur et à mesure de l'animation »). La boucle
   * par défaut convient à une phrase-décor qu'on regarde passer — l'invite de
   * saisie d'AutomationTabs, les trois lignes de la planète. Elle ne convient
   * PAS à un texte qu'on doit LIRE : effacé toutes les 2,2 secondes, il n'est
   * jamais lu en entier. C'est la seule différence entre les deux usages, d'où
   * un drapeau et non un second composant.
   */
  loop?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Les phrases arrivent d'un `t()` : une nouvelle référence de tableau à
  // chaque rendu. On les compare par leur CONTENU, sinon l'effet se
  // relancerait à chaque rendu du parent et la frappe repartirait de zéro.
  // SÉPARATEUR NUL et non l'espace : les phrases en contiennent, découper
  // sur l'espace les casserait en mots.
  const key = phrases.join("\u0000");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const list = key.split("\u0000").filter(Boolean);
    if (!list.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = list[0];
      return;
    }

    let timer = 0;
    let i = 0;
    let n = 0;
    let erasing = false;
    let running = false;

    const step = () => {
      const phrase = list[i];
      if (!erasing) {
        n++;
        el.textContent = phrase.slice(0, n);
        if (n >= phrase.length) {
          // Sans boucle, la dernière phrase reste à l'écran : on ne programme
          // pas l'effacement, la minuterie s'arrête d'elle-même.
          if (!loop && i >= list.length - 1) return;
          erasing = true;
          timer = window.setTimeout(step, holdMs);
          return;
        }
        timer = window.setTimeout(step, typeMs);
        return;
      }
      n--;
      el.textContent = phrase.slice(0, Math.max(0, n));
      if (n <= 0) {
        erasing = false;
        // Une seule phrase : on la réécrit, ce qui fait respirer le champ au
        // lieu de le laisser figé.
        i = (i + 1) % list.length;
        timer = window.setTimeout(step, gapMs);
        return;
      }
      timer = window.setTimeout(step, eraseMs);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === running) return;
        running = entry.isIntersecting;
        if (running) {
          timer = window.setTimeout(step, startMs);
        } else {
          window.clearTimeout(timer);
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [key, typeMs, holdMs, eraseMs, gapMs, startMs, loop]);

  return (
    <>
      <style>{TW_CSS}</style>
      <span ref={ref} className={`tw-caret ${className ?? ""}`} />
    </>
  );
}
