import {
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  Croissant,
  FileSpreadsheet,
  Globe,
  HardHat,
  Home,
  Laptop,
  MessageCircle,
  Moon,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useEnterOnScroll } from "@/lib/useEnterOnScroll";

/**
 * PrevisionnelStudio — le visuel du panneau « Prévisionnel » de la section à
 * onglets (client 2026-08-13 : « en dessous de “Le dossier banque, monté seul”
 * crée un design inspiré des deux screens que je t'envoie, carte blanche »).
 *
 * LES DEUX RÉFÉRENCES, ET CE QUI EST PRIS À CHACUNE :
 *   · la CAPTURE DU VRAI LOGICIEL (écran « Prévisionnel d'activité ») donne
 *     tout le contenu : la sidebar, le fil d'Ariane, le bloc de titre à icône,
 *     la barre des six étapes (Le métier, Le réel, Le cadre, Les activités, Le
 *     financement, Dossier), la grille des métiers avec ses sous-titres, et les
 *     deux panneaux « en direct » de la colonne de droite. AUCUN libellé n'est
 *     inventé : ils sont relevés sur la capture, y compris les phrases d'attente
 *     (« Le dossier apparaîtra ici dès vos premiers chiffres »). C'est la règle
 *     de la maison sur ces maquettes, et c'est aussi la seule façon d'éviter de
 *     promettre une fonction qui n'existe pas.
 *   · la CAPTURE ATTIO donne la MISE EN SCÈNE : une fenêtre posée à plat sur la
 *     nappe grise, et une CARTE FLOTTANTE qui déborde de son bord droit et
 *     recouvre un coin du contenu. C'est ce recouvrement qui fait lire les deux
 *     plans, l'application dessous et le livrable dessus.
 *
 * La carte flottante porte le livrable, et rien d'autre : hypothèses, plan de
 * trésorerie, comptes prévisionnels. Ce sont MOT POUR MOT les trois pièces
 * annoncées par le texte du panneau juste au-dessus — la maquette illustre la
 * phrase, elle n'ajoute pas une promesse de plus. Pas un chiffre non plus : un
 * montant qui s'afficherait ici serait inventé.
 *
 * PAS DE SCÈNE À ÉCHELLE FIXE ici (le patron `.pv-stage` / ResizeObserver des
 * maquettes de la grille bento). Ces maquettes-là vivent dans une carte étroite
 * où il faut faire tenir 1040 px de décor ; ce panneau-ci a presque toute la
 * largeur de la page, et une mise en page Tailwind normale y donne du texte à
 * sa vraie taille, donc lisible, et un vrai comportement sous lg. C'est le
 * patron d'OraHomeMockup, la maquette la plus proche par la taille.
 *
 * Sous md la carte flottante cesse de flotter et passe SOUS la fenêtre : à
 * 375 px de large, un panneau posé par-dessus ne recouvrirait pas un coin, il
 * recouvrirait l'écran.
 */

/** Les six étapes du module, dans l'ordre de la capture. La première est
 *  l'étape courante : c'est elle que la grille des métiers illustre. */
const STEPS = (t: (m: { fr: string; en: string }) => string) => [
  t({ fr: "Le métier", en: "The trade" }),
  t({ fr: "Le réel", en: "The actuals" }),
  t({ fr: "Le cadre", en: "The frame" }),
  t({ fr: "Les activités", en: "The activities" }),
  t({ fr: "Le financement", en: "Funding" }),
  t({ fr: "Dossier", en: "File" }),
];

/** Les neuf métiers de la capture, libellé et sous-titre compris. `on` marque
 *  celui que la capture montre sélectionné. */
/* ⚠ LA COULEUR EST REVENUE (client 2026-08-15 : « c'est pas mal mais rajoute
   des couleurs »). La refonte attio du matin avait tout passé en gris sur le
   principe qu'attio tient son interface sur un gris et un seul accent. C'est
   vrai d'attio, et c'était un contresens ici : dans le VRAI logiciel, chaque
   métier porte sa pastille de couleur, et c'est elle qui permet de retrouver
   une ligne du regard dans une liste de neuf. La grammaire attio est conservée
   partout ailleurs — filets d'un pixel, lignes plutôt que cartes, un seul bleu
   d'accent sur la ligne choisie ; seules les pastilles reprennent leurs
   teintes, en aplat très pâle avec un liseré assorti. */
const TRADES = (t: (m: { fr: string; en: string }) => string) => [
  {
    icon: Scissors as LucideIcon,
    tint: "bg-rose-50 text-rose-500 ring-rose-100",
    title: t({ fr: "Coiffure et beauté", en: "Hair and beauty" }),
    sub: t({ fr: "fauteuils et postes : occupation, masse salariale, point mort", en: "chairs and stations: occupancy, payroll, break-even" }),
  },
  {
    icon: UtensilsCrossed as LucideIcon,
    tint: "bg-orange-50 text-orange-500 ring-orange-100",
    title: t({ fr: "Restauration", en: "Restaurants" }),
    sub: t({ fr: "couverts et ticket moyen : coût matière, masse salariale, EBE", en: "covers and average spend: food cost, payroll, EBITDA" }),
  },
  {
    icon: Laptop as LucideIcon,
    tint: "bg-indigo-50 text-indigo-500 ring-indigo-100",
    title: t({ fr: "Logiciel par abonnement", en: "Subscription software" }),
    sub: t({ fr: "abonnés et marge brute : le point d'équilibre que la banque lit", en: "subscribers and gross margin: the break-even the bank reads" }),
  },
  {
    icon: Croissant as LucideIcon,
    tint: "bg-amber-50 text-amber-500 ring-amber-100",
    title: t({ fr: "Boulangerie et pâtisserie", en: "Bakery and pastry" }),
    sub: t({ fr: "jours d'ouverture et ticket moyen : coût matière, point mort", en: "opening days and average spend: food cost, break-even" }),
    on: true,
  },
  {
    icon: ShoppingBag as LucideIcon,
    tint: "bg-violet-50 text-violet-500 ring-violet-100",
    title: t({ fr: "Commerce de détail", en: "Retail" }),
    sub: t({ fr: "CA au m² et marge commerciale : les ratios du détail", en: "revenue per m² and trading margin: the retail ratios" }),
  },
  {
    icon: HardHat as LucideIcon,
    tint: "bg-yellow-50 text-yellow-600 ring-yellow-100",
    title: t({ fr: "Bâtiment et artisanat", en: "Building and trades" }),
    sub: t({ fr: "heures facturées par compagnon : facturation, masse salariale", en: "billed hours per worker: invoicing, payroll" }),
  },
  {
    icon: Truck as LucideIcon,
    tint: "bg-sky-50 text-sky-500 ring-sky-100",
    title: t({ fr: "Transport et logistique", en: "Transport and logistics" }),
    sub: t({ fr: "kilomètres et coûts roulants : le CA par véhicule", en: "mileage and running costs: revenue per vehicle" }),
  },
  {
    icon: Briefcase as LucideIcon,
    tint: "bg-emerald-50 text-emerald-500 ring-emerald-100",
    title: t({ fr: "Conseil et libéral", en: "Consulting and professions" }),
    sub: t({ fr: "jours facturés par consultant : staffing et EBE", en: "billed days per consultant: staffing and EBITDA" }),
  },
  {
    icon: Wrench as LucideIcon,
    tint: "bg-red-50 text-red-500 ring-red-100",
    title: t({ fr: "Garage automobile", en: "Car workshop" }),
    sub: t({ fr: "atelier et pièces : facturation, achats, point mort", en: "workshop and parts: invoicing, purchases, break-even" }),
  },
];

/** Rampe d'entrée commune : même courbe et même durée que les autres
 *  maquettes, seul le retard change d'un élément à l'autre. */
const rise = (hidden: boolean, armed: boolean, delay: number, dy = 22) => ({
  opacity: hidden ? 0 : 1,
  transform: hidden ? `translate3d(0,${dy}px,0)` : "translate3d(0,0,0)",
  transition: armed
    ? `transform 760ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 520ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
    : undefined,
  willChange: armed ? ("transform, opacity" as const) : undefined,
});

/**
 * ── `wide` : LA COMPOSITION DU BUREAU, IMPOSÉE ────────────────────────────
 * Client 2026-08-23 : « pour prévisionnel j'aimerais que tu répliques sur
 * mobile exactement le même encadré que je t'envoie », capture du panneau du
 * bureau à l'appui — barre latérale, colonne « en direct » et carte flottante
 * comprises.
 *
 * Le panneau est déjà rendu dans une boîte de 920 px par `DesktopScale`, qui la
 * réduit ensuite à la largeur du téléphone. Mais les points de rupture de
 * Tailwind interrogent la FENÊTRE, pas la boîte : dans 920 px de mise en page
 * posés sur un écran de 390, `sm:`, `md:` et `lg:` répondent tous NON. La
 * maquette se composait donc en 920 px de large AVEC ses replis de téléphone —
 * pas de barre latérale, pas de panneaux « en direct », carte du livrable
 * remise dans le flux. C'est-à-dire ni la composition du bureau, ni celle du
 * téléphone : une troisième, que personne n'avait dessinée.
 *
 * `wide` court-circuite les points de rupture et fixe l'état large. Il ne
 * remplace pas les classes `sm:`/`md:`/`lg:`, il en donne l'AUTRE branche :
 * hors `DesktopScale` (le zoom plein écran, un usage futur) la maquette garde
 * son comportement fluide d'origine, replis compris.
 *
 * Les container queries auraient dit la même chose sans branche JS — le projet
 * est en Tailwind 3.4 sans le greffon, ce serait une dépendance de plus pour
 * un seul composant.
 */
export default function PrevisionnelStudio({ wide = false }: { wide?: boolean }) {
  const { t } = useLang();
  const { ref, hidden, armed } = useEnterOnScroll<HTMLDivElement>();
  const steps = STEPS(t);
  const trades = TRADES(t);

  /* Les deux branches côte à côte, une clé par endroit où la mise en page se
     replie. Écrites en littéraux entiers : Tailwind lit le fichier, il ne
     concatène pas de fragments. */
  const c = {
    win: wide ? "mr-[74px]" : "md:mr-[74px]",
    aside: wide ? "flex w-[164px]" : "hidden sm:flex sm:w-[128px] lg:w-[164px]",
    engCard: wide ? "block" : "hidden lg:block",
    topbar: wide ? "px-5" : "px-4 md:px-5",
    topIconSm: wide ? "block" : "hidden sm:block",
    topIconMd: wide ? "block" : "hidden md:block",
    body: wide ? "px-6 py-5" : "px-4 py-4 md:px-6 md:py-5",
    modIcon: wide ? "h-10 w-10" : "h-9 w-9 md:h-10 md:w-10",
    modGlyph: wide ? "h-[18px] w-[18px]" : "h-4 w-4 md:h-[18px] md:w-[18px]",
    modTitle: wide ? "text-[19px]" : "text-[17px] md:text-[19px]",
    modSub: wide ? "text-[11.5px]" : "text-[10.5px] md:text-[11.5px]",
    steps: wide ? "grid-cols-6" : "grid-cols-3 sm:grid-cols-6",
    stepLabel: wide ? "text-[11px]" : "text-[10.5px] md:text-[11px]",
    split: wide ? "grid-cols-[1fr_202px]" : "lg:grid-cols-[1fr_202px]",
    lede: wide ? "text-[11px]" : "text-[10.5px] md:text-[11px]",
    trades: wide ? "grid-cols-2 gap-x-6" : "sm:grid-cols-2 sm:gap-x-6",
    tradeRule: wide ? "[&:nth-child(2)]:border-t-0" : "sm:[&:nth-child(2)]:border-t-0",
    tradeTitle: wide ? "text-[11.5px]" : "text-[11px] md:text-[11.5px]",
    tradeSub: wide ? "text-[9.5px]" : "text-[9px] md:text-[9.5px]",
    live: wide ? "flex flex-col gap-3" : "hidden lg:flex lg:flex-col lg:gap-3",
    /* La carte flottante. `bottom-0` et non `-bottom-6` dans la branche
       large : `DesktopScale` borne sa boîte à la hauteur MESURÉE de l'enfant,
       or un élément en position absolue ne compte pas dans cette hauteur — les
       24 px de débord se faisaient trancher par son `overflow: hidden`. Le
       débord est donc RÉSERVÉ par la cale de 24 px posée en fin de composant :
       la carte descend d'autant sous le pied de la fenêtre, exactement comme
       le `-bottom-6` du bureau, et la boîte le sait. */
    card: wide
      ? "absolute bottom-0 right-0 w-[320px]"
      : "relative mt-4 w-full md:absolute md:-bottom-6 md:right-0 md:mt-0 md:w-[292px] lg:w-[320px]",
  };

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[920px]">
      {/* La lueur de la référence attio, DERRIÈRE la fenêtre : un radial pur,
          sans `filter: blur` — même règle de performance que partout ailleurs
          sur ce site, un dégradé se peint une fois, un flou se re-rastérise. */}
      {/* ⚠ `inset-x-0` ET NON `-inset-x-10` (audit du 2026-08-15). Les 40 px de
          débord de chaque côté faisaient la page la plus large que le viewport :
          mesuré à 375 px, cette lueur atteignait x = 439 pour un
          clientWidth de 375, et c'est elle qui donnait son scrollWidth à la page
          entière. Le téléphone scrollait donc latéralement de 64 px. La lueur ne
          perd rien à s'arrêter au bord : elle est éteinte bien avant. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.05) 45%, rgba(255,255,255,0) 78%)",
        }}
      />

      {/* ── La fenêtre de l'application ──────────────────────────────────────
          Marge droite réservée sous md+ : c'est par là que la carte flottante
          déborde, comme le panneau de courriel de la référence attio. */}
      <div
        style={rise(hidden, armed, 60, 30)}
        className={`flex overflow-hidden rounded-[14px] bg-white ring-1 ring-[#0a2540]/[0.09] shadow-[0_30px_72px_-34px_rgba(10,37,64,0.5)] ${c.win}`}
      >
        {/* ── Sidebar, comme dans l'app ── */}
        <aside className={`shrink-0 flex-col border-r border-[#0a2540]/[0.07] px-3 py-4 ${c.aside}`}>
          <div className="flex items-center gap-1.5 px-1">
            <img src="/logos/icon-color.png" alt="" className="h-[18px] w-auto" draggable={false} />
            <span className="font-poppins text-[15px] font-semibold tracking-[-0.02em] text-[#111827]">Ora</span>
          </div>
          <div className="mt-5 px-1 font-inter text-[8.5px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            {t({ fr: "Navigation", en: "Navigation" })}
          </div>
          {/* L'ENTRÉE ACTIVE PORTE UN FOND, PAS UNE GRAISSE. C'est la grammaire
              attio : le rang se dit par une nappe très pâle et un filet, la
              graisse restant la même d'une ligne à l'autre. */}
          <div className="mt-2 flex items-center gap-2 rounded-[7px] bg-[#f4f7fd] px-2 py-1.5 font-inter text-[11.5px] font-medium text-[#111827] ring-1 ring-[#3b82f6]/15">
            <Home className="h-3.5 w-3.5 text-[#3b82f6]" strokeWidth={1.9} />
            {t({ fr: "Accueil", en: "Home" })}
          </div>
          <div className="mt-0.5 flex items-center gap-2 rounded-[7px] px-2 py-1.5 font-inter text-[11.5px] font-medium text-gray-500">
            <Globe className="h-3.5 w-3.5" strokeWidth={1.9} />
            Atlas
          </div>
          {/* La carte Ora Engineering, en pied de sidebar comme dans l'app.
              Alignée à gauche et sans pastille de couleur : centrée, elle
              faisait bloc publicitaire au milieu d'une colonne de navigation. */}
          <div className={`mt-auto rounded-[10px] border border-[#0a2540]/[0.07] px-2.5 py-2.5 ${c.engCard}`}>
            <div className="flex items-center gap-1.5 font-inter text-[10px] font-semibold text-[#111827]">
              <Sparkles className="h-3 w-3 text-[#3b82f6]" strokeWidth={2} />
              Ora Engineering
            </div>
            <div className="mt-1 font-inter text-[9px] leading-snug text-gray-400">
              {t({
                fr: "Besoin d'une automatisation ? Décrivez-la, on vous livre un script sur mesure sous 48 h.",
                en: "Need an automation? Describe it, we ship you a custom script within 48 h.",
              })}
            </div>
          </div>
        </aside>

        {/* ── La colonne de contenu ── */}
        <div className="min-w-0 flex-1">
          {/* Bandeau du haut. Les pilules à liseré des messages et des
              notifications sont tombées : attio n'encadre pas ses commandes de
              barre, il pose des icônes nues et laisse le filet du bandeau faire
              la séparation. Le compteur devient un POINT, pas un jeton chiffré. */}
          <div className={`flex items-center justify-between gap-3 border-b border-[#0a2540]/[0.07] py-2.5 ${c.topbar}`}>
            <div className="flex items-center gap-1.5 font-inter text-[11.5px] text-gray-400">
              <span>{t({ fr: "Accueil", en: "Home" })}</span>
              <ChevronRight className="h-3 w-3" strokeWidth={2} />
              <span className="font-medium text-[#111827]">
                {t({ fr: "Prévisionnel d'activité", en: "Business forecast" })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Moon className={`h-3.5 w-3.5 text-gray-400 ${c.topIconSm}`} strokeWidth={1.9} />
              <MessageCircle className={`h-3.5 w-3.5 text-gray-400 ${c.topIconMd}`} strokeWidth={1.9} />
              <span className={`relative ${c.topIconSm}`}>
                <Bell className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.9} />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#3b82f6] ring-2 ring-white" />
              </span>
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#111827] font-inter text-[9.5px] font-semibold text-white">
                C
              </span>
            </div>
          </div>

          <div className={c.body}>
            {/* Bloc de titre du module. Le fil d'Ariane est remonté dans le
                bandeau, à la place qu'il occupe chez attio : deux repères de
                navigation empilés à trois centimètres l'un de l'autre se
                répétaient. */}
            <div className="flex items-center gap-3">
              <span className={`grid shrink-0 place-items-center rounded-[10px] bg-[#f4f7fd] ring-1 ring-[#3b82f6]/20 ${c.modIcon}`}>
                <Store className={`text-[#3b82f6] ${c.modGlyph}`} strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <div className={`font-poppins font-semibold tracking-[-0.025em] text-[#111827] ${c.modTitle}`}>
                  {t({ fr: "Prévisionnel d'activité", en: "Business forecast" })}
                </div>
                <div className={`mt-0.5 truncate font-inter text-gray-400 ${c.modSub}`}>
                  {t({ fr: "Le plan du métier, ses indicateurs, prêt pour la banque", en: "The trade's plan, its indicators, ready for the bank" })}
                </div>
              </div>
            </div>

            {/* ── LES SIX ÉTAPES, SUR UN FILET CONTINU ───────────────────────
                La version précédente donnait à chaque étape son propre trait de
                2 px avec un blanc entre deux : six segments détachés se lisent
                comme six onglets, pas comme un parcours. Le filet court
                désormais d'un bord à l'autre (1 px gris), et seule l'étape
                courante l'épaissit en bleu — c'est la barre de progression
                d'attio, et elle dit d'un coup d'œil où l'on en est. */}
            <div className={`mt-5 grid ${c.steps}`}>
              {steps.map((s, i) => (
                <div key={s} style={rise(hidden, armed, 240 + i * 55, 10)} className="pr-3">
                  <span
                    className={`block rounded-full ${
                      i === 0 ? "h-[2px] bg-[#3b82f6]" : "h-px bg-[#0a2540]/[0.12]"
                    }`}
                  />
                  <span
                    className={`mt-2 block truncate font-inter ${c.stepLabel} ${
                      i === 0 ? "font-semibold text-[#111827]" : "font-medium text-gray-400"
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>

            <div className={`mt-6 grid gap-5 ${c.split}`}>
              {/* ── L'ÉTAPE COURANTE : LE CHOIX DU MÉTIER ────────────────────
                  ⚠ NEUF CARTES SONT DEVENUES NEUF LIGNES, et c'est le cœur de
                  la refonte demandée (client 2026-08-15 : « quelque chose de
                  plus SaaS moderne inspiré d'attio.com »). Neuf encadrés à
                  liseré, chacun avec son titre et ses deux lignes de glose,
                  faisaient un mur de boîtes : à cette taille on ne lisait ni
                  les titres ni les sous-titres, on voyait une texture.
                  Attio ne met pas ses enregistrements en cartes, il les met en
                  LIGNES séparées par des filets d'un pixel, avec une icône
                  monochrome à gauche et le détail en gris à droite. C'est ce
                  qui est repris : deux colonnes de lignes, un seul accent bleu
                  sur la ligne choisie, et le reste en gris.
                  ⚠ RIEN N'EST AJOUTÉ AU LOGICIEL. Pas de champ de recherche, pas
                  de filtre, pas de compteur : ce sont les libellés de la capture
                  et rien d'autre, comme partout dans ce fichier. Une commande
                  inventée ici deviendrait une promesse à tenir. */}
              <div>
                <div className="font-inter text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  {t({ fr: "Le métier", en: "The trade" })}
                </div>
                <p className={`mt-2 max-w-[54ch] font-inter leading-relaxed text-gray-500 ${c.lede}`}>
                  {t({
                    fr: "Choisissez le métier du client : il règle le vocabulaire du dossier et les indicateurs que le financeur lit en premier.",
                    en: "Choose the client's trade: it sets the file's vocabulary and the indicators the lender reads first.",
                  })}
                </p>

                <div className={`mt-3 grid ${c.trades}`}>
                  {trades.map((m, i) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.title}
                        style={rise(hidden, armed, 420 + i * 40, 12)}
                        /* Le filet est posé EN HAUT de chaque ligne, et retiré
                           sur la première de chaque colonne : en bas, la
                           dernière ligne de la colonne courte laisserait un
                           trait qui ne sépare rien. */
                        className={`flex items-center gap-2.5 border-t border-[#0a2540]/[0.07] py-2 first:border-t-0 ${c.tradeRule} ${
                          m.on ? "-mx-2 rounded-[8px] border-transparent bg-[#f4f7fd] px-2" : ""
                        }`}
                      >
                        <span
                          /* La pastille porte la teinte du métier. Sur la ligne
                             CHOISIE elle passe au bleu de marque : l'accent doit
                             rester unique et lisible, une pastille ambre sous un
                             liseré bleu se lirait comme deux sélections. */
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] ring-1 ${
                            m.on ? "bg-white text-[#3b82f6] ring-[#3b82f6]/30" : m.tint
                          }`}
                        >
                          <Icon className="h-3 w-3" strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate font-inter leading-tight ${c.tradeTitle} ${
                              m.on ? "font-semibold text-[#111827]" : "font-medium text-[#42506b]"
                            }`}
                          >
                            {m.title}
                          </div>
                          {/* Une seule ligne, tronquée. La glose complète tenait
                              sur trois lignes de 9 px : illisible, et c'est elle
                              qui faisait la texture. Elle donne ici le registre
                              du métier, pas sa fiche. */}
                          <div className={`truncate font-inter leading-snug text-gray-400 ${c.tradeSub}`}>
                            {m.sub}
                          </div>
                        </div>
                        {m.on && (
                          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#3b82f6]">
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Les deux panneaux « en direct » de la colonne de droite ──
                  Cachés sous lg : ils occupent la place exacte où la carte
                  flottante vient se poser, et sur une colonne de téléphone les
                  deux se retrouveraient l'un sous l'autre à dire la même
                  chose.
                  ⚠ LES CADRES POINTILLÉS SONT DEVENUS DES SQUELETTES. Quatre
                  rectangles en tirets se lisent comme un gabarit inachevé, une
                  maquette qu'on aurait oublié de finir. Un squelette en aplats
                  gris très pâles dit la même chose — « ça se remplira ici » —
                  dans la langue des interfaces modernes. */}
              <div className={c.live}>
                <div
                  style={rise(hidden, armed, 520, 14)}
                  className="rounded-[10px] border border-[#0a2540]/[0.07] p-3"
                >
                  <div className="font-inter text-[8.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {t({ fr: "La présentation, en direct", en: "The deck, live" })}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    {[0, 1, 2, 3].map((k) => (
                      <span key={k} className="block h-[30px] rounded-[6px] bg-[#0a2540]/[0.045]" />
                    ))}
                  </div>
                  <div className="mt-2.5 font-inter text-[9px] leading-snug text-gray-400">
                    {t({ fr: "Le dossier apparaîtra ici dès vos premiers chiffres.", en: "The file will appear here as soon as you enter your first figures." })}
                  </div>
                </div>

                <div
                  style={rise(hidden, armed, 580, 14)}
                  className="rounded-[10px] border border-[#0a2540]/[0.07] p-3"
                >
                  <div className="flex items-center justify-between gap-2 font-inter text-[8.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {t({ fr: "Le dossier, en direct", en: "The file, live" })}
                    {/* Le point qui respire : le seul mouvement continu de la
                        maquette. Il dit « ça calcule » sans afficher un chiffre
                        qu'il faudrait inventer. */}
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b82f6] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                    </span>
                  </div>
                  {/* Trois barres de squelette avant la phrase : elles donnent
                      au panneau la même matière qu'à son voisin, sans quoi
                      celui-ci n'était qu'un cadre autour d'un paragraphe. */}
                  <div className="mt-2.5 space-y-1.5">
                    <span className="block h-1.5 w-full rounded-full bg-[#0a2540]/[0.045]" />
                    <span className="block h-1.5 w-4/5 rounded-full bg-[#0a2540]/[0.045]" />
                    <span className="block h-1.5 w-3/5 rounded-full bg-[#0a2540]/[0.045]" />
                  </div>
                  <div className="mt-2.5 font-inter text-[9px] leading-snug text-gray-400">
                    {t({
                      fr: "Les chiffres se calculent dès votre première saisie, et se recalculent à chaque modification.",
                      en: "Figures are computed from your first entry, and recomputed on every change.",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LA CARTE FLOTTANTE (référence attio) ─────────────────────────────
          Le livrable, posé par-dessus le coin bas-droit de la fenêtre et
          débordant de son bord. Les trois pièces énumérées sont celles du
          texte du panneau, mot pour mot.
          ⚠ LE VERT A ÉTÉ RETIRÉ DE TOUT CE QUI N'EST PAS UN STATUT. La carte
          portait une pastille de fichier vert d'eau et trois coches vertes :
          quatre verts et un bleu sur un objet de 320 px, là où attio tient
          toute son interface sur un gris et UN accent. Il ne reste de vert que
          le point de la pastille « Prêt à défendre », où il dit un état. */}
      <div
        style={rise(hidden, armed, 760, 26)}
        /* CALÉE BAS-DROITE, ET DÉBORDANTE PAR LE BAS (`-bottom-6`) : posée plus
           haut, elle recouvrait entièrement le panneau « Le dossier, en
           direct » de la colonne de droite et n'en laissait dépasser qu'un
           bord de cadre vide. Elle descend donc sous le pied de la fenêtre,
           comme le panneau de courriel de la référence attio : le panneau
           reprend son titre, et le débordement fait lire les deux plans. La
           nappe grise du panneau réserve la place en dessous (pb-24). */
        className={`z-10 rounded-[12px] bg-white p-4 ring-1 ring-[#0a2540]/[0.09] shadow-[0_26px_60px_-24px_rgba(10,37,64,0.4)] ${c.card}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#f4f7fd] ring-1 ring-[#3b82f6]/20">
            <FileSpreadsheet className="h-4 w-4 text-[#3b82f6]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <div className="font-inter text-[12.5px] font-semibold leading-tight text-[#111827]">
              {t({ fr: "Dossier prévisionnel", en: "Forecast file" })}
            </div>
            <div className="mt-0.5 font-inter text-[10px] text-gray-400">
              {t({ fr: "Un seul jeu de chiffres", en: "One single set of figures" })}
            </div>
          </div>
        </div>

        {/* Les trois pièces, en LIGNES à filets comme la liste des métiers :
            les deux objets de la maquette parlent ainsi la même langue. */}
        <ul className="mt-3">
          {[
            t({ fr: "Hypothèses", en: "Assumptions" }),
            t({ fr: "Plan de trésorerie", en: "Cash plan" }),
            t({ fr: "Comptes prévisionnels", en: "Forecast accounts" }),
          ].map((li, i) => (
            <li
              key={li}
              style={rise(hidden, armed, 900 + i * 110, 8)}
              className="flex items-center gap-2.5 border-t border-[#0a2540]/[0.07] py-2 font-inter text-[11.5px] text-[#42506b] first:border-t-0"
            >
              <Check className="h-3 w-3 shrink-0 text-[#3b82f6]" strokeWidth={2.6} />
              {li}
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-[#0a2540]/[0.07] pt-3">
          <span className="font-inter text-[9.5px] text-gray-400">Business_plan.xlsx</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 font-inter text-[9.5px] font-medium text-[#42506b] ring-1 ring-[#0a2540]/[0.09]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t({ fr: "Prêt à défendre", en: "Ready to defend" })}
          </span>
        </div>
      </div>

      {/* LA CALE DU DÉBORD, branche large seulement. Voir `c.card` : la carte
          est en position absolue, elle ne pousse rien, et `DesktopScale` borne
          sa boîte à la hauteur mesurée de l'enfant. Sans ces 24 px de hauteur
          déclarée, le pied de la carte — nom du fichier et pastille « Prêt à
          défendre » — passait sous le couteau de l'`overflow: hidden`. Sur le
          bureau la cale n'existe pas : `-bottom-6` y déborde librement sur la
          nappe grise, dont le `pb-24` réserve déjà la place. */}
      {wide && <div aria-hidden className="h-6" />}
    </div>
  );
}
