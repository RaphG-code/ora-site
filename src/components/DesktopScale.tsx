import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * DesktopScale — rend son contenu À LA LARGEUR DU BUREAU, puis le réduit
 * pour tenir dans la colonne du téléphone.
 *
 * POURQUOI (client 2026-08-19) : « je veux la même disposition et le même
 * layout que sur l'ordinateur, il faut juste réduire la taille de beaucoup
 * d'encadrés ». Les maquettes de logiciel du site (l'écran Prévisionnel, les
 * cartes de la grille, les fausses fenêtres d'Atlas) sont composées pour 400 à
 * 900 px : sous 400 px elles ne se réduisent pas, elles se CASSENT — les
 * colonnes se replient, les libellés se tronquent, les tableaux débordent. On
 * ne voit plus la même chose en plus petit, on voit autre chose.
 *
 * Ce composant tranche le problème par l'échelle et non par le point de
 * rupture : sous `upTo`, l'enfant est posé dans une boîte de `designWidth`
 * pixels — donc mis en page EXACTEMENT comme sur un écran large — puis passé
 * à `transform: scale()`. La composition est celle du bureau, au pixel près,
 * à la taille du téléphone.
 *
 * ── Ce qu'il faut savoir avant de s'en servir ─────────────────────────────
 *   · La hauteur est RÉSERVÉE à la valeur réduite (`height` posée sur la boîte
 *     extérieure) : sans elle, le flux garderait la hauteur naturelle et
 *     laisserait un grand vide sous la maquette, le transform ne rendant rien
 *     au calcul de mise en page.
 *   · Le TEXTE est réduit avec le reste. À 0,3 d'échelle un corps de 14 px
 *     tombe à 4 px : réservez ce composant aux maquettes DÉCORATIVES, celles
 *     qu'on regarde et qu'on ne lit pas ligne à ligne. Pour un bloc qui se lit,
 *     réduisez ses classes plutôt que de l'écraser ici.
 *   · Au-dessus de `upTo`, le composant est TRANSPARENT : ni transform, ni
 *     hauteur imposée, ni couche de composition. Le bureau ne bouge pas.
 *   · `overflow: hidden` sous `upTo` seulement : une maquette qui dépasse
 *     volontairement de son cadre (la carte flottante du Prévisionnel) garde
 *     son débord sur grand écran.
 *
 * Voisin de `ScaleToFit`, qui résout l'autre moitié du problème : lui mesure la
 * largeur NATURELLE d'un enfant déjà figé (les 1020 px des maquettes Atlas) et
 * ne descend jamais au-dessus de 1. Ici la largeur de mise en page est IMPOSÉE,
 * ce qui est le seul moyen d'obtenir la mise en page du bureau d'un enfant
 * fluide, qui se serait sinon replié tout seul.
 */
export default function DesktopScale({
  designWidth = 760,
  upTo = 768,
  className,
  children,
}: {
  /** Largeur de mise en page imposée sous `upTo`, en pixels CSS. */
  designWidth?: number;
  /** Au-dessus de cette largeur de fenêtre, le composant ne fait rien. */
  upTo?: number;
  className?: string;
  children: ReactNode;
}) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < upTo,
  );

  useEffect(() => {
    const read = () => setNarrow(window.innerWidth < upTo);
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, [upTo]);

  /* ⚠ AUCUNE ENVELOPPE AU-DESSUS DE `upTo`, et ce n'est pas une optimisation :
     c'est la seule façon de garantir que le bureau ne bouge pas. Une div
     intercalée, même sans style, CASSE les chaînes de `height: 100%` et le
     positionnement des enfants directs d'une grille — les cartes de la grille
     bento portent `h-full`, elles ne s'étiraient plus. Le fragment rend
     l'arbre du bureau identique au pixel près à ce qu'il était sans ce
     composant. */
  if (!narrow) return <>{children}</>;

  return (
    <ScaledBox designWidth={designWidth} className={className}>
      {children}
    </ScaledBox>
  );
}

/** La boîte réduite, montée uniquement sous `upTo` : elle seule porte les
 *  références, la mesure et le transform. */
function ScaledBox({
  designWidth,
  className,
  children,
}: {
  designWidth: number;
  className?: string;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; height?: number }>({ scale: 1 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;
    const compute = () => {
      const avail = outer.clientWidth;
      const natH = inner.offsetHeight;
      if (!avail || !natH) return;
      /* PLAFONNÉ À 1 : le composant FAIT ENTRER, il n'agrandit jamais. Sans le
         plafond, une colonne plus large que `designWidth` — une tablette à
         760 px sur une maquette composée pour 400 — grossissait la maquette au
         lieu de la laisser à sa taille, et le flou de rééchantillonnage se
         voyait sur les filets d'un pixel. */
      const scale = Math.min(1, avail / designWidth);
      setBox((b) =>
        b.scale === scale && b.height === natH * scale ? b : { scale, height: natH * scale },
      );
    };

    /* rAF pour lire les tailles après stabilisation de la mise en page, et
       pour fondre les rafales d'événements en un seul calcul. */
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    compute();
    const ro = new ResizeObserver(schedule);
    ro.observe(outer);
    ro.observe(inner);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [designWidth]);

  return (
    <div ref={outerRef} className={className} style={{ height: box.height, overflow: "hidden" }}>
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          transform: `scale(${box.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
