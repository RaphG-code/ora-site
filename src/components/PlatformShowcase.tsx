import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import DownloadShowcase from "./DownloadShowcase";

/**
 * PlatformShowcase — l'encadré « plateforme » posé juste AVANT
 * « Concrètement, ce qu'Ora peut automatiser » (client 2026-08-11).
 *
 * LA RÉFÉRENCE est une capture fournie par le client (carte Euria) : un grand
 * cadre à coins très arrondis, une pastille blanche portant l'icône du produit
 * et son nom, un titre large en graisse normale, un bouton plein, et un PANNEAU
 * d'application. Le cadre contient DownloadShowcase, le panneau de la page de
 * téléchargement, RÉUTILISÉ et non recopié : c'est un composant autonome
 * dimensionné en `cqw`, il garde donc ses proportions exactes une fois réduit.
 *
 * ⚠ ILS ÉTAIENT DEUX. L'encadré « Assistant », en dégradé bleu, se tenait à
 * droite de celui-ci. Le 2026-08-14 le client a décidé de faire porter
 * l'assistant par Atlas (« mon but est de faire passer notre super assistant
 * comme le dénommé Atlas ») et de retirer celui-ci : tant qu'un « Assistant »
 * anonyme subsistait ici, le nom Atlas ne pouvait pas prendre. Son panneau, son
 * orbe et son dégradé vivent maintenant dans AssistantPanel.tsx, monté par
 * AtlasShowcase. L'encadré restant passe donc en PLEINE LARGEUR, discours à
 * gauche et panneau à droite : empilé, son panneau de 440 px aurait flotté au
 * milieu de 1376 px de blanc.
 *
 * ⚠ Cette section a REMPLACÉ la section « Accompagnement » (SupportShowcase),
 * créée plus tôt le même jour : elle montrait déjà DownloadShowcase, et le
 * client a tranché pour éviter le doublon. SupportShowcase.tsx reste dans le
 * dépôt, non monté, avec son discours sur les rendez-vous week-ends compris.
 */

interface PlatformShowcaseProps {
  /* ⚠ `onNavigate` A ÉTÉ RETIRÉ le 2026-08-26 : son unique usage était
     `onNavigate("demo")`, le bouton vers la web app, et il n'y a plus de
     navigation depuis ce bloc. Le remettre demanderait de le repasser depuis
     App.tsx (`navigateTo`). */
  /** Ouvre la modale de réservation : la seule sortie du bloc désormais. */
  openBooking: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
} as const;

/* LE BLEU DE LA RÉFÉRENCE (client 2026-08-11 : « la couleur a bien plus de
   nuances de bleu, je veux qu'elle soit exactement la même »). Relevé à l'œil
   sur la capture Euria, en TROIS calques et non un seul dégradé linéaire :
   c'est ce qui produit les « nuances » demandées.
     · le linéaire porte la montée générale, blanc bleuté en haut vers le bleu
       franc en bas ;
     · le premier radial pose le foyer saturé du coin bas gauche, le point le
       plus dense de la référence ;
     · le second réchauffe le coin bas droit, plus clair que le gauche.
   Un seul linéaire donnait la bande plate que le client a refusée.
   Si vous avez les hex exacts de la capture, ce sont les trois seules valeurs
   à remplacer. */
/* ⚠ LE CADRE BLEU DE LA RÉFÉRENCE A DÉMÉNAGÉ. Il portait l'encadré
   « Assistant », parti dans la section Atlas le 2026-08-14 (le client veut que
   l'assistant s'appelle Atlas et nulle part autre chose). Son dégradé, ses
   trois calques et la note qui explique comment ils ont été relevés vivent
   désormais dans AssistantPanel.tsx, sous le nom ASSISTANT_SHELL_LIGHT. Rien
   n'en est recopié ici : il ne reste qu'un seul encadré, et il est blanc. */

function Shell({
  name,
  title,
  note,
  cta,
  onCta,
  children,
}: {
  name: string;
  title: string;
  note?: string;
  cta: string;
  onCta: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      /* EMPILÉ SOUS 768 (2026-08-22, « minimaliste et bien fait pour mobile ») :
         à gauche un DISCOURS — nom, titre, bouton, et une note de 135 signes —
         à droite une maquette. Sur deux colonnes de téléphone la note tombait
         dans 153 px, cinq lignes à 11 px, et la maquette dans 145. Ce n'est pas
         « un design côte à côte », c'est du texte à côté d'une preuve : le
         texte prend la largeur, la maquette la reprend en dessous. */
      className="relative overflow-hidden rounded-[18px] p-5 md:rounded-[26px] md:p-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-7 md:gap-5 lg:gap-14"
    >
      {/* Encadré BLANC (client 2026-08-11). En mode sombre il ne peut pas
          rester blanc : il prend l'encre de section la plus claire de la
          charte, pour continuer de se détacher du noir. */}
      <div aria-hidden className="absolute inset-0 bg-white dark:bg-[#111827]" />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[26px] ring-1 ring-inset ring-[#0a2540]/[0.10] dark:ring-white/10"
      />

      <div className="relative">
        {/* Pastille + nom du produit, comme la référence. */}
        <div className="flex items-center gap-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white shadow-[0_2px_8px_-2px_rgba(10,37,64,0.18)] md:h-12 md:w-12 md:rounded-[14px] dark:bg-white/10">
            <img src="/logos/icon-color.png" alt="" aria-hidden className="h-6 w-auto select-none" draggable={false} />
          </span>
          <span className="font-instrument font-normal text-[1.15rem] md:text-[1.75rem] tracking-[-0.02em] text-[#111827] dark:text-white">
            {name}
          </span>
        </div>

        <h3 className="mt-4 max-w-[18ch] font-instrument font-normal text-[1.5rem] md:mt-6 md:text-[2rem] leading-[1.12] tracking-[-0.025em] text-[#111827] dark:text-white">
          {title}
        </h3>

        {/* Bouton à petit rayon, comme la référence : c'est ce qui le distingue
            des pilules employées partout ailleurs sur le site.
            IL EST SEUL depuis le 2026-08-15 (client : « uniquement le bouton
            essayer dans le navigateur »). La rangée à deux chemins posée le
            matin même — bouton de téléchargement plus lien d'essai — est
            retombée à un seul appel : plus d'arbitrage à faire pour le
            visiteur, donc plus besoin de départager un bouton et un lien. */}
        <button
          type="button"
          onClick={onCta}
          className="group mt-5 inline-flex items-center gap-2 rounded-[7px] bg-[#3b82f6] px-5 py-2.5 font-inter font-semibold text-[14px] text-white transition-colors duration-150 hover:bg-[#2563eb] md:mt-7 md:gap-2.5 md:px-5 md:py-3 md:text-[14.5px]"
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>

        {note && (
          <p className="mt-3 max-w-[46ch] font-inter text-[13.5px] leading-[1.55] text-[#5b6577] md:mt-4 md:max-w-[34ch] md:leading-relaxed dark:text-gray-400">
            {note}
          </p>
        )}
      </div>

      {/* LE PANNEAU PASSE À DROITE, et ce n'est pas un caprice de mise en
          page : l'encadré était la moitié d'une paire, il est désormais SEUL
          et pleine largeur (l'assistant est parti dans Atlas). Empilé, son
          panneau de 440 px aurait flotté au milieu d'un cadre de 1376 de large
          avec un demi-écran de blanc de chaque côté. Côte à côte, le discours
          tient la colonne gauche et la preuve la droite. */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function PlatformShowcase({ openBooking }: PlatformShowcaseProps) {
  const { t } = useLang();

  return (
    <section id="plateforme" data-nav-shy className="relative px-5 md:px-12 py-14 md:py-28 bg-white dark:bg-black">
      {/* LARGEUR ALIGNÉE SUR LA SECTION DU DESSUS (client 2026-08-14 : « il
          faudrait qu'il soit un peu plus large pour avoir plus de cohérence
          visuelle avec la partie au-dessus »). AutomationTabs pose son cadre à
          86rem sous le même rembourrage de section : à 86rem ici, les bords
          gauche et droit des deux blocs tombent au même pixel, et l'œil lit une
          colonne continue au lieu de deux blocs de largeurs voisines mais
          différentes — le pire des deux mondes.
          Ce 68rem venait du 2026-08-11 (« les encadrés sont plus longs et moins
          larges ») et répondait à un autre problème, celui de cadres trop
          trapus : il est réglé depuis, le panneau de gauche étant plafonné à
          400 px, ce qui donne sa hauteur à la paire quelle que soit sa largeur.
          Une seule valeur à changer si le résultat paraît trop large. */}
      <div className="mx-auto max-w-[86rem]">
        {/* ── Téléchargement et prise en main ─────────────────────────────────
            Titre COURT : il ne porte que le téléchargement. La prise en main,
            l'autre message demandé par le client, passe dans la note sous le
            bouton. En mettant les deux dans le titre il tombait sur quatre
            lignes et allongeait le cadre de 80 px. */}
        <Shell
          name={t({ fr: "Ora", en: "Ora" })}
          title={t({
            fr: "Ora se télécharge en un clic.",
            en: "Ora downloads in one click.",
          })}
          /* ⚠ « macOS aujourd'hui, Windows en cours » ET NON « Mac et Windows »
             (audit du 2026-08-15). La FAQ de la même page dit, elle,
             « disponible sur macOS aujourd'hui, avec Windows en cours de
             déploiement » : deux sections de la même page se contredisaient à
             quatre écrans d'écart, et c'est la version optimiste qui était en
             haut. Sur un achat qui passe par une DSI, une disponibilité annoncée
             puis démentie coûte plus que l'absence de Windows. */
          note={t({
            fr: "macOS aujourd'hui, Windows en cours de déploiement. On vous accompagne ensuite à la prise en main, rendez-vous ouverts week-ends compris.",
            en: "macOS today, Windows rolling out. We then walk you through your first runs, with slots open on weekends too.",
          })}
          /* ── UN SEUL CHEMIN : L'ESSAI EN LIGNE ─────────────────────────────
             Client 2026-08-15, sixième passe : « enlève le télécharger
             l'application et fais en sorte de mettre uniquement le bouton
             essayer dans le navigateur ». Le lien secondaire posé le matin même
             devient donc LE bouton, et le téléchargement disparaît d'ici.
             La page /telechargement/ora-app n'est pas supprimée pour autant :
             elle reste servie et joignable par lien direct, elle n'est
             simplement plus annoncée sur l'accueil. `onNavigate` garde
             « telechargement » dans son type pour cette raison. */
          /* ⚠ LE CTA NE MÈNE PLUS À LA WEB APP (client 2026-08-26 : « enlève
             tous les boutons qui relient vers la web app »). Il ouvrait
             /demo — l'essai en ligne — depuis le 2026-08-15. Il ouvre
             maintenant la réservation, comme tous les appels du site.
             Le pavé ci-dessus reste vrai pour le TÉLÉCHARGEMENT : la page
             /telechargement/ora-app existe toujours et n'est simplement pas
             annoncée ici. La page /demo, elle, reste servie et joignable par
             lien direct — seuls les boutons qui y menaient sont retirés. */
          cta={t({ fr: "Réserver un appel", en: "Book a call" })}
          onCta={openBooking}
        >
          {/* UN SEUL panneau, celui que le client a nommé (« celui avec bilan
              développé, qui reprenait la balance ») : c'est DownloadShowcase,
              la demande adressée au logiciel. Les deux côte à côte tombaient à
              246 px de large sur grand écran et 130 px sur téléphone, où plus
              rien ne se lisait. Pour remonter le second, réimporter
              DeliverablesShowcase depuis ./DeliverablesShowcase.
              PLAFONNÉ à 440 px : le panneau est carré, donc chaque pixel de
              largeur en plus est un pixel de hauteur en plus. À pleine largeur
              il portait le cadre à 959 px de haut pour 532 de large, bien
              au-delà des proportions de la référence.
              Relevé de 400 à 440 le 2026-08-14 avec l'élargissement du bloc :
              le cadre ayant gagné 145 px de large, le panneau y flottait dans
              un blanc trop grand. Les 40 px se paient en hauteur sur les DEUX
              cadres, qui sont étirés à la même mesure. */}
          <div className="mx-auto w-full max-w-[440px]">
            <DownloadShowcase />
          </div>
        </Shell>

      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Le panneau de l'assistant
   Transposition du panneau de la référence. Cotes en `cqw` comme les deux
   autres panneaux du site (1cqw = 1 % de la largeur du panneau) : il se réduit
   exactement comme eux, sans point de rupture à régler.
   ────────────────────────────────────────────────────────────────────────── */
