import { motion } from "framer-motion";
import {
  Ban,
  Eye,
  Laptop,
  Lock,
  Repeat,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * ControlShowcase — section de clôture « Contrôle total ».
 *
 * RÉPLIQUE ASSUMÉE de la section monday.com du même nom (capture fournie par le
 * client, 2026-08-05). Sa grammaire, reprise telle quelle :
 *   · un très grand titre noir, aligné à GAUCHE, cassé sur deux lignes, occupant
 *     la moitié gauche de l'écran et suivi d'un grand vide à droite ;
 *   · en dessous, six entrées sur trois colonnes et deux rangées ;
 *   · chaque entrée = une petite icône de contour à la couleur de marque, un
 *     titre en gras, un paragraphe gris. AUCUNE carte, aucun aplat, aucun
 *     liseré : c'est le blanc qui sépare, rien d'autre.
 *
 * ⚠ AUCUNE PREUVE FABRIQUÉE (règle projet). Les six entrées ne sont pas des
 * fonctionnalités inventées pour remplir la grille : chacune reprend un
 * engagement DÉJÀ formulé ailleurs sur le site, et rien de plus.
 *   · local, chiffrement, Suisse/Europe, cloisonnement, zéro entraînement
 *     → PrivacyShowcase et la carte « Local & sécurisé » de StackingCards ;
 *   · calcul déterministe et vérifiable ligne à ligne
 *     → la carte « Fiabilité & rapidité » de StackingCards et le manifeste noir
 *       d'ExcelReveal.
 * Ne rien ajouter ici qui ne soit pas déjà tenu ailleurs.
 */

interface ControlShowcaseProps {
  theme: "light" | "dark";
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
} as const;

type Item = { icon: LucideIcon; title: string; body: string };

export default function ControlShowcase({ theme }: ControlShowcaseProps) {
  const { t } = useLang();
  const dk = theme === "dark";

  const items: Item[] = [
    {
      icon: Laptop,
      title: t({ fr: "Traitement en local", en: "Local processing" }),
      body: t({
        fr: "Vos automatisations s'exécutent sur votre machine. Les fichiers que vous traitez ne quittent pas votre poste.",
        en: "Your automations run on your own machine. The files you process never leave your computer.",
      }),
    },
    {
      icon: Lock,
      title: t({ fr: "Chiffré avant l'envoi", en: "Encrypted before it is sent" }),
      body: t({
        fr: "Avec Atlas, notre orchestration de fichiers, vos données sont chiffrées sur votre appareil avant tout envoi. Nos serveurs ne stockent que de l'illisible.",
        en: "With Atlas, our file orchestration, your data is encrypted on your device before anything is sent. Our servers only ever store unreadable data.",
      }),
    },
    {
      icon: Eye,
      title: t({ fr: "Hébergement européen", en: "European hosting" }),
      body: t({
        fr: "Francfort et Genève, hors de portée du CLOUD Act américain. Aucune donnée ne transite par un hébergeur soumis au droit américain.",
        en: "Frankfurt and Geneva, out of reach of the US CLOUD Act. No data passes through a host subject to US law.",
      }),
    },
    {
      icon: Users,
      title: t({ fr: "Accès cloisonné", en: "Compartmentalised access" }),
      body: t({
        fr: "L'accès est cloisonné par organisation, par équipe et par utilisateur. Ce qui n'a pas été ouvert reste fermé, par défaut.",
        en: "Access is isolated per organisation, per team and per user. Whatever has not been opened stays closed, by default.",
      }),
    },
    {
      icon: Ban,
      title: t({ fr: "Aucun entraînement de modèle", en: "No model training" }),
      body: t({
        fr: "Vos fichiers servent à votre travail, à rien d'autre. Aucune donnée client n'a jamais été utilisée pour entraîner un modèle d'IA.",
        en: "Your files serve your work, nothing else. No client data has ever been used to train an AI model.",
      }),
    },
    {
      icon: Repeat,
      title: t({ fr: "Résultat reproductible", en: "Reproducible output" }),
      body: t({
        fr: "Des règles de calcul déterministes produisent votre livrable. Même fichier en entrée, même résultat en sortie, vérifiable ligne à ligne.",
        en: "Deterministic calculation rules produce your deliverable. Same file in, same result out, verifiable line by line.",
      }),
    },
  ];

  return (
    <section
      id="controle"
      data-nav-shy
      // MÊME FOND que PrivacyShowcase juste au-dessus, blanc pur en clair et
      // noir pur en sombre (client 2026-08-05 : « mets un fond blanc pour
      // Contrôle total et mets cette partie en dessous de Vos données vous
      // appartiennent »). Les deux sections ne doivent plus se lire comme deux
      // blocs empilés mais comme UNE surface continue, d'où l'abandon de
      // l'alternance #fcfbf7 / #0f172a : une couture de couleur entre elles
      // annulerait le rapprochement demandé.
      /* Fond DÉCLARÉ, et en blanc cassé : la section n'en portait aucun et
         héritait donc du blanc du corps de page. Elle prend sa place dans
         l'alternance de la charte (voir le pavé d'App.tsx sur #features).
         Le pavé historique qui demandait qu'elle porte « le MÊME fond que
         PrivacyShowcase » est caduc : cette section a été retirée le
         2026-08-15, il n'y a plus de couture à effacer. */
      className="relative px-5 md:px-12 pt-16 md:pt-32 pb-20 md:pb-40 bg-[#fcfbf7] dark:bg-black"
      style={{ background: dk ? "#000000" : "#ffffff" }}
    >
      <div className="relative max-w-7xl mx-auto">
        {/* Titre monday : très grand, à GAUCHE, cassé en deux lignes par des
            `block` explicites et non par le retour à la ligne naturel. La moitié
            droite reste vide, c'est ce déséquilibre qui fait la respiration de
            la section d'origine. `max-w-[10ch]` tient la casse quelle que soit
            la langue, sans quoi l'anglais (« Full control ») repasserait sur une
            seule ligne. */}
        {/* GRAISSE FINE (client 2026-08-11 : « des titres bien plus fins »).
            Instrument Sans en graisse normale, la face fine du site, au lieu de
            Poppins semibold — même bascule que « Vos données vous
            appartiennent » juste au-dessus, pour que les deux sections gardent
            une seule voix. Le CORPS ne bouge pas : la demande de rapetisser ne
            visait que l'autre titre.
            L'approche se relâche de -0,04 à -0,03 em : le serrage d'origine
            était calibré pour une semibold, il tasse une graisse normale. */}
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-instrument font-normal tracking-[-0.03em] leading-[0.95] text-[#111827] dark:text-white max-w-[10ch]"
          style={{ fontSize: "clamp(2.4rem, 8vw, 7rem)" }}
        >
          <span className="block">{t({ fr: "Contrôle", en: "Full" })}</span>
          <span className="block">{t({ fr: "total", en: "control" })}</span>
        </motion.h2>

        {/* Grille 3 × 2. `gap-y` bien plus grand que `gap-x` : chez monday ce
            sont les rangées qui respirent, les colonnes restent serrées. */}
        {/* Remonté de 20/28 à 10/14 (client 2026-08-11 : « les encadrés juste
            en dessous ») : le titre étant devenu fin, l'écart d'origine le
            laissait flotter seul en haut de section. */}
        {/* UNE COLONNE SOUS 640 (2026-08-22, « minimaliste et bien fait pour
            mobile »). Les six garanties ne sont pas des étiquettes mais des
            PHRASES de 90 à 145 signes ; sur deux colonnes de 165 px elles
            tombaient à 11,5 px et à 23 signes par ligne — moitié moins que le
            confort de lecture, mesuré sur les six. Une colonne, 15 px, une
            garantie à la fois : c'est la même grille qu'au-dessus de 640, avec
            une colonne de moins. */}
        <div className="mt-8 md:mt-14 grid grid-cols-1 gap-x-5 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 lg:gap-x-16 gap-y-7 sm:gap-y-8 md:gap-y-20">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                {...fadeUp}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  // Décalage par COLONNE et non par index : les trois entrées
                  // d'une même rangée arrivent en cascade de gauche à droite,
                  // puis la rangée suivante repart de la gauche.
                  delay: 0.06 * (i % 3),
                }}
                className="max-w-[34ch]"
              >
                <Icon
                  className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] text-blue-600 dark:text-blue-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="font-poppins font-semibold text-[16px] md:text-[18px] max-md:leading-tight tracking-[-0.01em] text-[#111827] dark:text-white mt-3 md:mt-5">
                  {it.title}
                </h3>
                {/* Le corps ne REDESCEND PAS au palier `sm` : à 767 px la
                    grille est déjà à deux colonnes de 344 px, et 11,5 px y
                    donnaient 55 signes par ligne — une ligne longue en petit
                    corps, le pire des deux mondes. Il tient 15 px jusqu'à `md`,
                    où la valeur du bureau reprend la main. */}
                <p className="font-inter mt-2 md:mt-3 text-[15px] leading-[1.55] md:text-[16px] md:leading-relaxed text-gray-600 dark:text-gray-400">
                  {it.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
