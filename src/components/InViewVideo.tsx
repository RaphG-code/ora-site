import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type Props = {
  src: string;
  className?: string;
  style?: CSSProperties;
  /** Restart from frame 0 each time it scrolls into view. Default true. */
  resetOnEnter?: boolean;
  /** Fraction of the video that must be visible before it starts. Default 0.35. */
  threshold?: number;
  /**
   * Expands the observer's viewport so playback starts slightly BEFORE the
   * video scrolls fully into view. A positive bottom value (default 20%) makes
   * the video begin a touch early as the user approaches it.
   */
  rootMargin?: string;
  /**
   * Ref sortante vers l'élément `<video>`. Elle n'existe que pour
   * `VideoWithScrubber`, qui doit piloter la lecture depuis une barre rendue
   * EN DEHORS du cadre du clip. Rien d'autre n'a à s'en servir.
   */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /**
   * Image affichée AVANT la première frame décodée. Ajoutée le 2026-08-29 pour
   * le hero : `preload="metadata"` ne télécharge que l'en-tête, si bien que le
   * cadre restait NOIR le temps que la vidéo arrive — sur un fond blanc et au
   * premier écran, c'est un trou. Le poster est une jpg de quelques dizaines
   * de kilo-octets, il s'affiche immédiatement et cède la place à la vidéo.
   * Les fichiers vivent dans `public/posters/`, un par clip, extraits à
   * l'ffmpeg (voir les jpg déjà présents).
   */
  poster?: string;
};

/**
 * Muted, looping, inline video that only starts playing once it scrolls into
 * the viewport — and (by default) restarts from the beginning on entry, so the
 * user always catches the demo from frame 0 instead of mid-loop. Pauses when
 * scrolled out of view.
 *
 * Note: no `autoPlay` attribute — playback is driven by IntersectionObserver.
 * `muted` is kept because browsers require it for programmatic play() without
 * a user gesture.
 */
export default function InViewVideo({
  src,
  className,
  style,
  resetOnEnter = true,
  threshold = 0.35,
  rootMargin = "0px 0px 20% 0px",
  videoRef,
  poster,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ⚠ MOUVEMENT RÉDUIT : ON NE JOUE PAS (audit du 2026-08-15). Une vidéo
       muette EN BOUCLE est un mouvement qui ne s'arrête jamais et que le
       visiteur ne peut ni mettre en pause ni masquer — le clip n'a pas de
       contrôles, c'est un décor. C'est exactement le cas visé par le critère
       « Pause, Stop, Hide » au-delà de cinq secondes, et une boucle n'a pas de
       fin. On pose donc la première image et on s'arrête là : le lecteur voit
       de quoi il s'agit, rien ne bouge. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        /* métadonnées pas encore chargées, la première image suffit */
      }
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (resetOnEnter) {
            // Guard: setting currentTime before metadata loads can throw.
            try {
              el.currentTime = 0;
            } catch {
              /* metadata not ready yet — playback still starts from ~0 */
            }
          }
          // play() rejects if interrupted (e.g. quick scroll past); ignore.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [resetOnEnter, threshold, rootMargin]);

  return (
    <video
      /* Rappel React 19 : un ref-callback ne doit RIEN renvoyer, sinon la
         valeur est prise pour une fonction de nettoyage. D'où les accolades. */
      ref={(node) => {
        ref.current = node;
        if (videoRef) videoRef.current = node;
      }}
      src={src}
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
      className={className}
      style={style}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LA BARRE DE LECTURE, SOUS LE CLIP
   ──────────────────────────────────────────────────────────────────────────── */

type ScrubbedProps = Props & {
  /** Classes du CADRE du clip (arrondi, liseré, ombre, rapport d'image). */
  frameClassName?: string;
  frameStyle?: CSSProperties;
  /** Posé DANS le cadre, en surimpression : la pastille d'agrandissement. */
  children?: ReactNode;
  /** Classes de l'enveloppe cadre + barre. */
  wrapperClassName?: string;
  /** Le FOND SOUS LA BARRE, pas le thème du site (le site est verrouillé en
   *  clair) : `dark` sert au clip posé sur le noir d'Atlas, où le rail encre
   *  à 14 % serait invisible. Seul le rail change, le bleu tient sur les
   *  deux fonds. */
  tone?: "light" | "dark";
};

/**
 * Le clip du module, avec sa barre de lecture POSÉE SOUS LE CADRE — avancement,
 * bouton pause, et clic pour se placer où l'on veut.
 *
 * ⚠ LA BARRE ÉTAIT EN SURIMPRESSION SUR LE PIED DU CLIP jusqu'au 2026-08-18
 * (client : « fais une barre un peu comme eux, en dessous de la vidéo »). Posée
 * sur l'image, il lui fallait un dégradé sombre pour rester lisible sur
 * l'application blanche qu'on enregistre, et ce dégradé mangeait la dernière
 * ligne de la fenêtre filmée. Sous le cadre, elle n'a plus rien à masquer :
 * elle prend le fond de la section et les couleurs de la marque.
 *
 * ⚠ Volontairement réservée à ce clip. Les autres vidéos du site sont des
 * DÉCORS de quelques secondes en boucle ; leur poser une barre inviterait à
 * chercher un contenu qu'elles n'ont pas.
 */
export function VideoWithScrubber({
  frameClassName,
  frameStyle,
  children,
  wrapperClassName,
  tone = "light",
  ...videoProps
}: ScrubbedProps) {
  const video = useRef<HTMLVideoElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);

  /* ── POURQUOI L'AVANCEMENT N'EST PAS DANS UN useState ─────────────────────
     Il l'était jusqu'au 2026-08-18, alimenté par `timeupdate`. Deux défauts,
     et le client les a vus tous les deux (« que ça soit plus smooth ») :
     · `timeupdate` ne se déclenche que QUATRE FOIS PAR SECONDE. La tête
       avançait donc par sauts de 250 ms. La transition CSS de 100 ms posée
       dessus ne lissait rien, elle ajoutait juste un retard.
     · pendant un glissement, un aller-retour par React entre le doigt et le
       pixel se voit : la tête traînait derrière le curseur.
     L'avancement est donc peint DIRECTEMENT dans le DOM, une fois par frame.
     React ne garde que ce qui change rarement — l'état de pause, la valeur
     ARIA au pour cent près, et le fait qu'on soit en train de glisser.
     ⚠ Corollaire : `fill` et `knob` ne doivent JAMAIS recevoir de `style` lié
     à un état React. Un rendu réécrirait la position et ferait sauter la tête
     en arrière au milieu d'un glissement. */
  const [paused, setPaused] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [ariaNow, setAriaNow] = useState(0);

  const draggingRef = useRef(false);
  const pending = useRef(0);
  const seekRaf = useRef(0);

  const paint = (p: number) => {
    const pct = `${p * 100}%`;
    if (fill.current) fill.current.style.width = pct;
    if (knob.current) knob.current.style.left = pct;
  };

  /* La boucle ne tourne QUE pendant la lecture : à l'arrêt, hors écran ou en
     mouvement réduit, il n'y a pas de frame demandée. C'est ce qui rend le rAF
     acceptable sur une page qui fait déjà défiler deux scènes WebGL. */
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let raf = 0;

    const sync = () => {
      if (draggingRef.current || !(el.duration > 0)) return;
      const p = el.currentTime / el.duration;
      paint(p);
      const pct = Math.round(p * 100);
      setAriaNow((prev) => (prev === pct ? prev : pct));
    };

    const tick = () => {
      sync();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      setPaused(false);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      setPaused(true);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    el.addEventListener("play", start);
    el.addEventListener("pause", stop);
    /* `seeked` et `loadedmetadata` repeignent à l'arrêt : sans eux, un clic sur
       une vidéo en pause laisserait la tête à son ancienne position. */
    el.addEventListener("seeked", sync);
    el.addEventListener("loadedmetadata", sync);

    if (!el.paused) start();
    else setPaused(true);
    sync();

    return () => {
      el.removeEventListener("play", start);
      el.removeEventListener("pause", stop);
      el.removeEventListener("seeked", sync);
      el.removeEventListener("loadedmetadata", sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => () => {
    if (seekRaf.current) cancelAnimationFrame(seekRaf.current);
  }, []);

  const ratioAt = (clientX: number) => {
    const box = rail.current?.getBoundingClientRect();
    if (!box || !box.width) return 0;
    return Math.min(1, Math.max(0, (clientX - box.left) / box.width));
  };

  /* Le `currentTime` est écrit AU PLUS une fois par frame, jamais à chaque
     `pointermove` : un navigateur reçoit les mouvements par paquets (jusqu'à
     la fréquence de la souris, 120 Hz et plus), et repositionner un décodeur
     vidéo aussi souvent le fait bégayer. Le pixel, lui, suit le doigt
     immédiatement — c'est ce décalage assumé qui rend le glissement fluide. */
  const flushSeek = () => {
    seekRaf.current = 0;
    const el = video.current;
    if (el && el.duration > 0) el.currentTime = pending.current * el.duration;
    setAriaNow(Math.round(pending.current * 100));
  };
  const scheduleSeek = () => {
    if (!seekRaf.current) seekRaf.current = requestAnimationFrame(flushSeek);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = video.current;
    if (!el || !(el.duration > 0)) return;
    /* La capture est ce qui permet de sortir du rail sans perdre la main : on
       peut descendre le curseur sur la vidéo ou filer hors de la fenêtre, les
       `pointermove` continuent d'arriver ici jusqu'au relâchement.
       Sous try/catch : la capture lève si le pointeur n'est plus actif au
       moment de l'appel, et ce n'est pas une raison pour perdre le glissement
       — sans capture il reste bon tant que le curseur ne quitte pas le rail. */
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pas de capture, le glissement fonctionne quand même */
    }
    draggingRef.current = true;
    setDragging(true);
    pending.current = ratioAt(e.clientX);
    paint(pending.current);
    flushSeek();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pending.current = ratioAt(e.clientX);
    paint(pending.current);
    scheduleSeek();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* déjà relâchée */
    }
    if (seekRaf.current) {
      cancelAnimationFrame(seekRaf.current);
      seekRaf.current = 0;
    }
    flushSeek();
    /* On relance : lâcher la tête sur une image figée, sans rien qui
       l'explique, se lit comme un bug. */
    void video.current?.play().catch(() => {});
  };

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  const nudge = (seconds: number) => {
    const el = video.current;
    if (!el || !(el.duration > 0)) return;
    el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + seconds));
    paint(el.currentTime / el.duration);
    setAriaNow(Math.round((el.currentTime / el.duration) * 100));
  };

  return (
    <div className={wrapperClassName}>
      <div className={frameClassName} style={frameStyle}>
        {children}
        <InViewVideo {...videoProps} videoRef={video} />
      </div>

      {/* LA BARRE. Centrée et NETTEMENT plus étroite que le clip : pleine
          largeur sous un cadre de 880 px, elle pèserait autant que lui alors
          que c'est le clip le sujet. Les couleurs sont celles de la marque —
          le bleu #3b82f6 pour la partie lue, la tête et l'icône, et un gris
          d'encre translucide pour le rail non lu. */}
      <div className="mx-auto mt-6 flex w-full max-w-[520px] items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? "Lancer la vidéo" : "Mettre la vidéo en pause"}
          className="shrink-0 rounded-full text-[#3b82f6] transition-colors duration-150 hover:text-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/50 focus-visible:ring-offset-2"
        >
          {paused ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" />
            </svg>
          )}
        </button>

        {/* La piste. `role="slider"` avec ses trois valeurs : sans elles, un
            lecteur d'écran annonce un bloc sans nom ni position.
            LA ZONE DE PRISE FAIT 28 px DE HAUT pour un trait de 3 : c'est elle
            qu'on attrape, pas le rail. Un rail de 3 px n'est ni une cible
            atteignable ni quelque chose qu'on saisit à la souris.
            `touch-none` : sans lui, un glissement au doigt sur mobile est
            interprété comme un défilement de page et la tête ne suit pas.
            `select-none` : sans lui, un glissement rapide sélectionne le texte
            autour et le curseur passe en « barre d'insertion » en plein
            mouvement. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Avancement de la vidéo"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaNow}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); nudge(5); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-5); }
            else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
          }}
          className={`group flex h-7 flex-1 touch-none select-none items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/50 focus-visible:ring-offset-2 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Le rail s'épaissit au survol et pendant le glissement : la cible
              grandit sous le curseur au lieu de rester un cheveu de 3 px. */}
          <div
            ref={rail}
            className={`relative w-full rounded-full transition-[height] duration-150 ease-out ${
              tone === "dark" ? "bg-white/[0.22]" : "bg-[#0a2540]/[0.14] dark:bg-white/20"
            } ${dragging ? "h-[5px]" : "h-[3px] group-hover:h-[5px]"}`}
          >
            {/* ⚠ PAS DE `transition` SUR LA LARGEUR, ET PAS DE `style` PILOTÉ
                PAR REACT. La largeur est peinte à chaque frame par `paint()` ;
                une transition CSS par-dessus ajouterait un retard visible sous
                le doigt, et un `style` lié à un état ferait sauter la tête en
                arrière au premier rendu venu. */}
            <div
              ref={fill}
              className="absolute inset-y-0 left-0 w-0 rounded-full bg-[#3b82f6]"
            />
            {/* La tête reste visible en permanence, comme sur la référence :
                c'est elle qui dit que le trait se manipule. Elle grossit au
                survol et pendant le glissement — seule l'échelle est animée,
                jamais la position. */}
            <span
              ref={knob}
              aria-hidden
              className={`absolute left-0 top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3b82f6] shadow-[0_1px_4px_rgba(10,37,64,0.25)] transition-transform duration-150 ease-out ${
                dragging ? "scale-[1.35]" : "group-hover:scale-125"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
