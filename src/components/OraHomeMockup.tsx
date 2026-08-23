import { ArrowRight, Bell, ExternalLink, FileSpreadsheet, FileText, Gauge, Globe, Home, Landmark, MessageCircle, PieChart, Play, Plus, Repeat, Scale, Sparkles } from "lucide-react";
import { useEnterOnScroll } from "@/lib/useEnterOnScroll";
import { useLang } from "@/lib/i18n";

/**
 * OraHomeMockup — réplique de l'écran d'ACCUEIL du vrai logiciel, v3 (client
 * 2026-08-04, troisième passe : « plus fidèle au logiciel, avec les modules
 * ajoutés présents, et une inspiration monday »).
 *
 * Fidélité au screenshot de l'app : la SIDEBAR revient (logo Ora, NAVIGATION,
 * Accueil actif avec son indicateur bleu, Atlas, carte Ora Engineering en
 * pied), « Ravi de vous accueillir, Camille », bannière bleue plate, tuiles blanches à
 * icône sur fond teinté doux avec flèche grise (le style exact des tuiles
 * « Accès rapide » de l'app, PAS des squircles en dégradé), lignes
 * « Reprendre » avec pastilles de statut et icônes d'action.
 * Les quatre tuiles sont les MODULES demandés : Bilan développé, Analyse FEC,
 * Modélisation financière, Analyse financière.
 * L'inspiration monday (screenshot de référence) : la pilule flottante avec
 * l'étincelle et le curseur noir posés PAR-DESSUS le panneau, qui arrivent
 * un temps après lui (même patron d'entrée que AtlasListMockup).
 * Aucun chiffre inventé : libellés repris de l'app ou descriptifs.
 */

/* Les HUIT vignettes de l'« Accès rapide », relevées sur la capture de l'app
 * fournie le 2026-08-06, avec leurs libellés, leurs sous-titres et la teinte de
 * leur pastille. Il y en avait quatre, sur deux colonnes ; le vrai écran en
 * montre huit sur trois colonnes, et c'est cette densité qui fait qu'on
 * reconnaît un logiciel et pas une illustration.
 * Aucun libellé n'est inventé : tous viennent de la capture. */
/* ⚠ TRADUITS LE 2026-08-19, en même temps que ceux d'OraAppScene (client :
 *  « traduis les modules en anglais pour la version anglaise »). Cette maquette
 *  n'était PAS visée par la demande — elle est bien plus petite — mais elle est
 *  montée dans le MUR du hero (OraHeroDemo), donc elle aussi « tout en haut »,
 *  et elle porte les mêmes intitulés. Les traduire d'un côté seulement aurait
 *  laissé les deux répliques du même logiciel se contredire dans un même écran.
 *  Mêmes formulations qu'OraAppScene, au mot près : un module porte le même nom
 *  partout sur le site. */
const MODULES = [
  { title: { fr: "Prévisionnel immobilier", en: "Property forecast" }, sub: { fr: "Dossier banque en 5 min", en: "Bank file in 5 min" }, icon: Landmark, iconCls: "bg-emerald-50 text-emerald-600" },
  { title: { fr: "Changement de structure", en: "Structure change" }, sub: { fr: "Comparatif avant / après", en: "Before / after comparison" }, icon: Repeat, iconCls: "bg-amber-50 text-amber-500" },
  { title: { fr: "Évaluation d'entreprise", en: "Business valuation" }, sub: { fr: "Cinq approches combinées", en: "Five combined approaches" }, icon: Scale, iconCls: "bg-rose-50 text-rose-500" },
  { title: { fr: "Bilan développé", en: "Detailed balance sheet" }, sub: { fr: "Le bilan en un coup d'œil", en: "The balance sheet at a glance" }, icon: PieChart, iconCls: "bg-violet-50 text-violet-600" },
  { title: { fr: "Suivi budgétaire", en: "Budget tracking" }, sub: { fr: "Réalisé contre budget", en: "Actual versus budget" }, icon: Gauge, iconCls: "bg-blue-50 text-blue-600" },
  { title: { fr: "Nouveau projet", en: "New project" }, sub: { fr: "Deal PE, audit, M&A...", en: "PE deal, audit, M&A..." }, icon: Plus, iconCls: "bg-sky-50 text-sky-600" },
  { title: { fr: "Tous les Atlas", en: "All Atlas" }, sub: { fr: "Liste de vos projets", en: "Your projects" }, icon: Globe, iconCls: "bg-violet-50 text-violet-600" },
  // « Ora Engineering » est un nom de produit : il ne se traduit pas.
  { title: { fr: "Ora Engineering", en: "Ora Engineering" }, sub: { fr: "Automatisation sur-mesure", en: "Custom automation" }, icon: Sparkles, iconCls: "bg-blue-50 text-blue-600" },
];

/** `plain` : SANS le cadre propre (coins, liseré, ombre) ni l'animation
 *  d'entrée — pour l'embarquer dans une enveloppe qui fournit déjà les deux,
 *  comme la fenêtre navigateur de la carte « Automatisation FEC »
 *  (UseCasesBento, 2026-08-06). Par défaut, rendu inchangé.
 *  `still` : garde le cadre mais SAUTE l'entrée au scroll — pour les copies du
 *  MUR du hero, dans une scène épinglée où ce mécanisme ne peut pas
 *  fonctionner (voir useEnterOnScroll). */
export default function OraHomeMockup({ plain = false, still = false }: { plain?: boolean; still?: boolean }) {
  const { ref, hidden, armed } = useEnterOnScroll<HTMLDivElement>(still);
  const { t } = useLang();

  return (
    <div ref={ref} className="relative w-full lg:h-full">
      <div
        style={
          plain
            ? undefined
            : {
                transform: hidden ? "translate3d(0,84px,0) scale(0.985)" : "translate3d(0,0,0) scale(1)",
                opacity: hidden ? 0 : 1,
                transition: armed
                  ? "transform 1100ms cubic-bezier(0.22,1,0.36,1) 160ms, opacity 620ms cubic-bezier(0.22,1,0.36,1) 160ms"
                  : undefined,
                willChange: armed ? "transform, opacity" : undefined,
              }
        }
        className={`w-full lg:h-full flex overflow-hidden bg-white${
          plain ? "" : " rounded-[16px] md:rounded-[20px] ring-1 ring-black/5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)]"
        }`}
      >
        {/* ── Sidebar, comme dans l'app ── */}
        <div className="hidden md:flex w-[128px] shrink-0 flex-col border-r border-gray-100 px-2.5 py-3">
          <div className="flex items-center gap-1.5 px-1">
            <img src="/logos/icon-color.png" alt="" className="h-4 w-auto" />
            <span className="font-poppins font-semibold text-[13px] tracking-[-0.02em] text-[#111827]">Ora</span>
          </div>
          <div className="mt-4 px-1 font-inter text-[8px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Navigation
          </div>
          <div className="relative mt-1.5 flex items-center gap-2 rounded-lg bg-blue-50 px-2 py-1.5 font-inter text-[10.5px] font-semibold text-blue-600">
            <Home className="h-3 w-3" />
            Accueil
            <span className="absolute right-1 top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-blue-600" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5 font-inter text-[10.5px] font-medium text-gray-500">
            <Globe className="h-3 w-3" />
            Atlas
          </div>
          {/* Carte Ora Engineering, en pied de sidebar comme dans l'app.
              MASQUÉE en mode `plain` : dans la fenêtre de la grille bento, elle
              tombe sous le bord de la carte, s'y fait trancher et passe en
              plus derrière la pilule flottante. Trois textes empilés au même
              endroit, tous coupés — c'est précisément ce qui donnait à la
              preview son air de brouillon. */}
          <div
            className={`mt-auto rounded-xl border border-gray-100 px-2 py-2.5 text-center ${
              plain ? "invisible" : ""
            }`}
          >
            <Sparkles className="mx-auto h-3.5 w-3.5 text-blue-600" />
            <div className="mt-1 font-inter text-[9px] font-semibold text-[#111827]">Ora Engineering</div>
            <div className="mt-0.5 font-inter text-[8px] leading-snug text-gray-400">
              Besoin d'une automatisation ? Décrivez-la, on vous livre un script sur mesure sous 48 h.
            </div>
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#fcfbf7] p-3.5 md:p-4">
          {/* Barre du haut */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-inter font-semibold text-[12px] text-[#111827]">Accueil</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/[0.06] px-2 py-1 font-inter text-[9.5px] font-medium text-gray-600">
                <MessageCircle className="h-2.5 w-2.5" />
                Messages
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/[0.06] px-2 py-1 font-inter text-[9.5px] font-medium text-gray-600">
                <Bell className="h-2.5 w-2.5" />
                Notifications
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 font-inter text-[7px] font-bold text-white">
                  1
                </span>
              </span>
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-blue-600 font-inter text-[9px] font-bold text-white">
                C
              </span>
            </div>
          </div>

          {/* Greeting, formulation de l'app */}
          <div className="mt-2.5 font-poppins font-semibold text-[17px] md:text-[19px] tracking-[-0.02em] text-[#111827]">
            Bienvenue, Camille
          </div>
          <div className="mt-0.5 font-inter text-[10px] text-gray-400">Mardi 4 août</div>

          {/* Bannière bleue plate, comme l'app */}
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-[#3b82f6] px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <FileText className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-inter font-semibold text-[11.5px] text-white">Ouvrir un fichier</div>
              <div className="font-inter text-[9.5px] text-white/80 truncate">
                Excel ou CSV → lancez vos automatisations en un clic
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white" />
          </div>

          {/* Accès rapide = les modules */}
          <div className="mt-3 font-inter text-[8.5px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Accès rapide
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  /* Clé sur `title.en` : une clé qui change avec la langue
                     ferait remonter les huit tuiles à chaque bascule FR/EN. */
                  key={m.title.en}
                  // Gabarit resserré depuis le passage à TROIS colonnes : à
                  // deux, chaque tuile avait la moitié de la largeur, elle en a
                  // maintenant le tiers. Sans ce resserrement le libellé se
                  // faisait tronquer dès « Prévisionnel immobilier ».
                  className="flex items-center gap-1.5 rounded-lg bg-white px-1.5 py-1.5 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${m.iconCls}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-inter font-semibold text-[8.5px] leading-tight text-[#111827] truncate">
                      {t(m.title)}
                    </div>
                    <div className="mt-px font-inter text-[7.5px] leading-tight text-gray-400 truncate">{t(m.sub)}</div>
                  </div>
                  <ArrowRight className="h-2.5 w-2.5 shrink-0 text-gray-300" />
                </div>
              );
            })}
          </div>

          {/* Reprendre, avec les icônes d'action de la ligne survolée */}
          <div className="mt-3 font-inter text-[8.5px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Reprendre
          </div>
          <div className="mt-1.5 flex-1 flex flex-col justify-between gap-1.5">
            <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {/* Nom de fichier CRÉDIBLE (client 2026-08-06 : « pas
                  “demo_petit_5k_N_studio”, mais “FEC 2024” ») : un FEC légal
                  est un .txt, l'icône suit. */}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-3 w-3 text-blue-600" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-inter font-semibold text-[10px] text-blue-600 truncate">
                  FEC_2024
                </div>
                <div className="mt-0.5 font-inter text-[8.5px] text-gray-400">TXT · il y a 1 j</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 font-inter text-[8.5px] font-medium text-gray-500">
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                À faire
              </span>
              <ExternalLink className="h-2.5 w-2.5 text-gray-400" />
              <Play className="h-2.5 w-2.5 text-gray-400" />
              <Globe className="h-2.5 w-2.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-inter font-semibold text-[10px] text-[#111827] truncate">
                  01_grand_livre_client_a_nettoyer
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-inter text-[8.5px] text-gray-400">
                  XLSX · il y a 1 j
                  {["Finance", "Données"].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-gray-500">
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 font-inter text-[8.5px] font-medium text-blue-600">
                <span className="h-1 w-1 rounded-full bg-blue-500" />
                En cours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Touche monday : pilule flottante + curseur, par-dessus le panneau,
          un temps après lui (même patron que AtlasListMockup). ── */}
      <div
        aria-hidden
        style={{
          transform: hidden ? "translate3d(0,26px,0) scale(0.94)" : "translate3d(0,0,0) scale(1)",
          opacity: hidden ? 0 : 1,
          transition: armed
            ? "transform 900ms cubic-bezier(0.22,1,0.36,1) 520ms, opacity 600ms cubic-bezier(0.22,1,0.36,1) 520ms"
            : undefined,
          willChange: armed ? "transform, opacity" : undefined,
        }}
        // En mode `plain` (la fenêtre de la grille bento), la pilule est
        // RESSERRÉE et ramenée vers la droite pour tenir tout entière sur la
        // colonne de navigation : à sa taille de la grande scène, son bord
        // droit mordait sur la colonne de contenu et tranchait le titre de
        // section « Reprendre » en plein mot.
        className={`pointer-events-none absolute z-10 flex items-center rounded-full bg-white shadow-[0_18px_44px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] ${
          plain
            ? "-left-5 md:-left-10 bottom-16 md:bottom-20 gap-2 pl-1.5 pr-3.5 py-1.5"
            : "-left-6 md:-left-14 bottom-16 md:bottom-20 gap-2.5 pl-2 pr-4 py-2"
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.05] ${
            plain ? "h-8 w-8" : "h-9 w-9 md:h-10 md:w-10"
          }`}
        >
          <img
            src="/logos/icon-color.png"
            alt=""
            className={`w-auto ${plain ? "h-4" : "h-[18px] md:h-5"}`}
          />
        </span>
        <span
          className={`font-inter font-medium text-[#111827] whitespace-nowrap ${
            plain ? "text-[11.5px]" : "text-[12px] md:text-[13px]"
          }`}
        >
          Génération du bilan développé
        </span>
      </div>
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        style={{
          opacity: hidden ? 0 : 1,
          transform: hidden ? "translate3d(0,18px,0)" : "translate3d(0,0,0)",
          transition: armed
            ? "transform 900ms cubic-bezier(0.22,1,0.36,1) 620ms, opacity 500ms cubic-bezier(0.22,1,0.36,1) 620ms"
            : undefined,
        }}
        // Le curseur suit la pilule : resserré et remonté avec elle en mode
        // `plain`, sinon il pointerait dans le vide.
        className={`pointer-events-none absolute z-20 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)] ${
          plain
            ? "left-11 md:left-14 bottom-10 md:bottom-12 h-7 w-7 md:h-8 md:w-8"
            : "left-14 md:left-20 bottom-9 md:bottom-11 h-8 w-8 md:h-10 md:w-10"
        }`}
      >
        <path
          d="M9 4 L9 27 L14.6 21.6 L18 29.4 L22.4 27.4 L19 19.8 L26.6 19.8 Z"
          fill="#0b0b0f"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
