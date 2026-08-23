import type { ReactNode } from "react";

/**
 * AtlasSlideVisual — les six visuels du carrousel Atlas, un par usage.
 *
 * ── D'OÙ ILS VIENNENT ─────────────────────────────────────────────────────
 * Portés le 2026-08-15 depuis six pages HTML autoportées livrées par la session
 * « Copywriting Ora Solution »
 * (~/Desktop/All/ORA/Operationnal/ORA/Ora_V2/design-suivi-client/*-abstrait.html).
 * Les cotes, les dégradés et les ombres sont repris AU CHIFFRE PRÈS ; ce qui
 * change au portage est listé plus bas, et rien d'autre.
 *
 * ── CE QU'ILS REMPLACENT, ET POURQUOI ─────────────────────────────────────
 * Le carrousel montrait un seul et même panneau d'assistant : une question
 * tapée, une réponse en langage naturel, et les fichiers cités en pastilles.
 * La session qui a livré ces visuels signale que CET ASSISTANT N'EXISTE PAS
 * dans le logiciel — ce qui s'appelle « Assistant » y serait un hub à huit
 * tuiles, sans saisie libre, et il n'y aurait pas de recherche plein texte côté
 * utilisateur. Ces visuels évitent le piège par construction : ils ne montrent
 * JAMAIS un assistant qui parle, seulement le résultat. C'est la raison d'être
 * du remplacement, pas un changement d'habillage.
 * ⚠ La carte blanche porte encore une DEMANDE formulée en question. Le reste de
 * la section (titres, accroche, barre d'options) est en cours de réécriture
 * pour cesser de promettre une conversation ; si cette réécriture aboutit à
 * supprimer la question, c'est ici qu'il faudra changer les libellés.
 *
 * ── LES QUATRE CHANGEMENTS DU PORTAGE ─────────────────────────────────────
 *  1. `@font-face` RETIRÉ. Les fichiers d'origine auto-hébergeaient Inter et
 *     Poppins depuis un dossier `assets/` qui n'existe pas ici. Le site charge
 *     déjà les deux : on hérite.
 *  2. CLASSES PRÉFIXÉES `av-`. Les noms d'origine (.plate, .ask, .card, .row)
 *     entraient en collision avec le reste du bundle — .row et .card en
 *     particulier vivent déjà dans plusieurs maquettes.
 *  3. LE TEXTE VIENT DES DONNÉES, il n'est plus en dur. Chaque entrée de
 *     USE_CASES porte son `ask`, en français et en anglais. Recopier la phrase
 *     ici aurait figé la version française dans le visuel et laissé l'anglais
 *     faux, ce que la session qui les a livrés signalait elle-même.
 *  4. LE MOT BLEU EST BALISÉ DANS LA CHAÎNE, entre doubles crochets, au lieu
 *     d'être un `<span>` posé à la main : `[[Nexio SAS]]` pour un mot simple,
 *     `[[f:Modèle comité]]` quand la référence porte l'icône de fichier. C'est
 *     la seule forme qui survive à la traduction — la position du mot mis en
 *     valeur n'est pas la même d'une langue à l'autre.
 *
 * ── ÉCHELLE ───────────────────────────────────────────────────────────────
 * La scène fait 1000 x 880 en dur, comme les originaux, et c'est ScaleToFit qui
 * la réduit à la colonne disponible (transform: scale, jamais `zoom` — voir la
 * note de CLAUDE.md sur WebKit). Toutes les cotes internes restent donc en
 * pixels absolus, ce qui permet de les comparer ligne à ligne aux fichiers
 * d'origine le jour où l'un d'eux est retouché.
 */

export type AtlasVisual =
  | "bouclage"
  | "controle"
  | "livrables"
  | "equipe"
  | "tracabilite"
  | "comparaison";

/* Les dégradés de plaque diffèrent d'un visuel à l'autre — certains vont du
   bleu au turquoise, d'autres restent bleus de bout en bout, et deux portent en
   plus une lueur radiale. Ils sont recopiés tels quels : ce sont eux qui font
   que la série respire au lieu de se répéter. */
const AV_CSS = `
.av-stage{position:relative;width:1000px;height:880px;color:#111827;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased}
.av-stage *{margin:0;padding:0;box-sizing:border-box}

.av-plate{position:absolute;inset:0;border-radius:36px;overflow:hidden}
.av-plate-bouclage{background:
  radial-gradient(86% 70% at 30% 88%, rgba(255,255,255,.62) 0%, rgba(216,244,235,.42) 32%, rgba(255,255,255,0) 64%),
  linear-gradient(172deg,#eff5ff 0%,#dde9fd 18%,#b0cdf8 42%,#6ba2ef 68%,#4aa8cd 87%,#63c8a8 100%)}
.av-plate-controle{background:
  radial-gradient(88% 74% at 26% 84%, rgba(255,255,255,.72) 0%, rgba(214,244,234,.5) 30%, rgba(255,255,255,0) 62%),
  linear-gradient(172deg,#eef4ff 0%,#dce8fd 17%,#aecbf8 41%,#5f9bee 66%,#43a5cf 85%,#5ac5a6 100%)}
.av-plate-livrables{background:linear-gradient(178deg,#eef4ff 0%,#dbe7fd 24%,#a8c6f8 52%,#4a86f2 80%,#1a56db 100%)}
.av-plate-equipe{background:linear-gradient(178deg,#eef4ff 0%,#dbe7fd 22%,#a8c6f8 50%,#4a86f2 79%,#1a56db 100%)}
.av-plate-tracabilite{background:linear-gradient(174deg,#f2f6ff 0%,#dfe9fd 20%,#b6d0f9 44%,#7aa9f1 68%,#3f7fe8 88%,#1f5fdd 100%)}
.av-plate-comparaison{background:
  radial-gradient(84% 68% at 72% 86%, rgba(255,255,255,.58) 0%, rgba(214,244,234,.40) 34%, rgba(255,255,255,0) 66%),
  linear-gradient(174deg,#eff5ff 0%,#dce8fd 20%,#aecbf8 44%,#679fee 70%,#45a6cd 88%,#5fc7a7 100%)}

.av-inner{position:absolute;left:44px;top:44px;right:44px;bottom:0;
  border-radius:30px 30px 0 0;background:rgba(255,255,255,.40)}
.av-inner-livrables,.av-inner-equipe{background:rgba(255,255,255,.42)}

.av-ask{position:absolute;left:92px;top:96px;right:92px;background:#fff;border-radius:22px;
  padding:26px 32px;font-size:19.5px;line-height:1.6;letter-spacing:-.008em;
  box-shadow:0 2px 6px rgba(16,42,96,.10),0 24px 56px -18px rgba(16,42,96,.34)}
.av-ref{display:inline-flex;align-items:center;gap:6px;font-weight:700;color:#2563eb;white-space:nowrap}
.av-ref svg{flex:none;margin-bottom:-2px}

/* ══ BOUCLAGE : cinq pièces, quatre cochées, une encore ouverte ══ */
.av-list{position:absolute;left:200px;bottom:0;width:470px;height:520px;
  background:#fff;border-radius:22px 22px 0 0;padding:54px 38px;
  box-shadow:0 2px 8px rgba(16,42,96,.14),0 30px 70px -24px rgba(16,42,96,.44)}
.av-it{display:flex;align-items:center;gap:18px;margin-bottom:62px}
.av-it .av-mk{width:19px;height:19px;border-radius:50%;flex:none;display:grid;place-items:center}
.av-it.av-ok .av-mk{background:#d8f0e4;color:#0f9d76}
.av-it.av-open .av-mk{background:transparent;box-shadow:inset 0 0 0 2.2px #e0b64b}
.av-it .av-bar{height:9px;border-radius:5px;background:#eaeff7}
.av-it.av-open .av-bar{background:#f3e6c4}

/* ══ CONTRÔLE : source, retraitement, chiffre, reliés par un fil pointillé ══ */
.av-thread{position:absolute;left:0;top:0;width:870px;height:880px;pointer-events:none}
.av-lnk{position:absolute;border-radius:16px;background:#fff;
  box-shadow:0 1px 3px rgba(16,42,96,.12),0 16px 40px -16px rgba(16,42,96,.32)}
.av-lnk .av-rows{position:absolute;left:16px;right:16px;bottom:16px;display:flex;flex-direction:column;gap:7px}
.av-lnk .av-rows i{display:block;height:6px;border-radius:3px;background:#e6ecf6}
.av-lnk .av-cap{position:absolute;left:16px;top:14px;font-size:10px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;color:#9fb0c6}
.av-l1{left:76px;top:296px;width:186px;height:118px;opacity:.78}
.av-l2{left:322px;top:432px;width:206px;height:136px;opacity:.92}
.av-l3{left:576px;bottom:0;width:412px;height:392px;border-radius:18px 18px 0 0;overflow:hidden}
.av-l3 .av-band{padding:22px 26px 20px;
  background:linear-gradient(135deg,#3b82f6 0%,#2563eb 56%,#1d4ed8 100%)}
.av-band .av-k{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(255,255,255,.72)}
.av-band .av-t{margin-top:6px;color:#fff;font-size:25px;font-weight:600;
  font-family:Poppins,Inter,sans-serif;letter-spacing:-.015em}
.av-l3 .av-tbl{padding:22px 26px;display:flex;flex-direction:column;gap:13px}
.av-l3 .av-tbl i{display:block;height:8px;border-radius:4px;background:#e8edf6}
.av-l3 .av-hit{display:flex;align-items:center;gap:10px;margin:2px -10px;padding:9px 10px;
  border-radius:9px;background:#eef6f2;box-shadow:inset 0 0 0 1.5px #b7e2d1}
.av-l3 .av-hit i{flex:1;background:#a9dcc7}
.av-pill{position:absolute;display:inline-flex;align-items:center;gap:8px;
  background:#fff;border-radius:999px;padding:9px 16px;
  box-shadow:0 2px 5px rgba(16,42,96,.16),0 16px 34px -12px rgba(16,42,96,.42)}
.av-pill b{font-size:14.5px;font-weight:700;letter-spacing:-.01em}
.av-p-src{left:76px;top:238px;color:#0f9d76}
.av-p-fig{left:492px;bottom:402px;color:#2563eb}

/* ══ LIVRABLES : deux feuilles fantômes, le livrable net devant ══ */
.av-sheet{position:absolute;border-radius:16px;background:#fff;
  box-shadow:0 1px 3px rgba(16,42,96,.12),0 18px 44px -18px rgba(16,42,96,.34)}
.av-gh1{left:150px;bottom:0;width:300px;height:436px;transform:rotate(-7deg);
  transform-origin:bottom center;opacity:.5}
.av-gh2{left:214px;bottom:0;width:310px;height:486px;transform:rotate(-3.2deg);
  transform-origin:bottom center;opacity:.75}
.av-front{left:296px;bottom:0;width:452px;height:560px;border-radius:18px 18px 0 0;overflow:hidden;
  box-shadow:0 2px 8px rgba(16,42,96,.16),0 30px 70px -22px rgba(16,42,96,.46)}
.av-front .av-band{height:132px;padding:26px 28px;display:flex;flex-direction:column;justify-content:center;
  background:linear-gradient(135deg,#3b82f6 0%,#2563eb 52%,#1d4ed8 100%)}
.av-front .av-band .av-k{font-size:10.5px}
.av-front .av-band .av-t{margin-top:7px;font-size:27px}
.av-front .av-body{padding:26px 28px;display:flex;flex-direction:column;gap:12px}
.av-front .av-body i{display:block;height:8px;border-radius:4px;background:#e8edf6}
.av-front .av-body .av-duo{display:flex;gap:12px;margin-top:6px}
.av-front .av-body .av-duo span{flex:1;height:56px;border-radius:10px;background:#f1f5fc}
.av-tagm{position:absolute;left:604px;bottom:526px;display:inline-flex;align-items:center;gap:8px;
  background:#fff;border-radius:999px;padding:10px 18px;color:#2563eb;
  box-shadow:0 2px 5px rgba(16,42,96,.16),0 16px 34px -12px rgba(16,42,96,.42)}
.av-tagm b{font-size:15.5px;font-weight:700;letter-spacing:-.01em}

/* ══ SUIVI D'ÉQUIPE : quatre couloirs, un par personne ══ */
.av-lanes{position:absolute;left:200px;bottom:0;width:470px;height:520px;
  background:#fff;border-radius:22px 22px 0 0;padding:58px 38px;
  box-shadow:0 2px 8px rgba(16,42,96,.14),0 30px 70px -24px rgba(16,42,96,.44)}
.av-lane{display:flex;align-items:center;gap:18px;margin-bottom:76px}
.av-av{width:30px;height:30px;border-radius:50%;flex:none}
.av-trk{flex:1;height:10px;border-radius:6px;background:#eef1f7;overflow:hidden}
.av-trk span{display:block;height:100%;border-radius:6px;background:#c9d6ea}
.av-lane.av-now .av-trk span{background:#3b82f6}

/* ══ TRAÇABILITÉ : le fil du journal, cinq événements ══ */
.av-rail{position:absolute;left:265px;top:300px;bottom:0;width:2px;
  background:linear-gradient(#ffffff 0%, rgba(255,255,255,.62) 62%, rgba(255,255,255,0) 100%)}
.av-ev{position:absolute;left:257px;display:flex;align-items:center;gap:20px}
.av-ev .av-dot{width:19px;height:19px;border-radius:50%;flex:none;background:#fff;
  box-shadow:0 1px 3px rgba(16,42,96,.20)}
.av-ev.av-first .av-dot{background:#2563eb;
  box-shadow:0 0 0 5px rgba(255,255,255,.55),0 1px 3px rgba(16,42,96,.24)}
.av-ev .av-chip{height:44px;border-radius:12px;background:#fff;
  box-shadow:0 1px 3px rgba(16,42,96,.12),0 12px 30px -14px rgba(16,42,96,.34)}

/* ══ COMPARAISON : deux panneaux jumeaux, une seule ligne qui diffère ══ */
.av-pan{position:absolute;bottom:0;width:322px;height:412px;background:#fff;
  border-radius:20px 20px 0 0;padding:40px 30px;
  box-shadow:0 2px 8px rgba(16,42,96,.14),0 30px 70px -24px rgba(16,42,96,.42)}
.av-pL{left:92px} .av-pR{left:458px}
.av-row{height:11px;border-radius:6px;background:#eef1f7;margin-bottom:28px}
.av-row.av-del{background:#f7d9d5}
.av-row.av-add{background:#c9e9d8}
.av-seam{position:absolute;left:434px;bottom:0;width:2px;height:340px;border-radius:2px;
  background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.72))}

/* ══ LE MODE SANS TEXTE ═══════════════════════════════════════════════════
   Client 2026-08-19 : « pour ces encadres, je voudrais qu'il n'y ait pas de
   texte dedans, juste le design ». Il sert aux VIGNETTES de la grille, ou la
   planche est reduite a 0,25 : la phrase de la carte blanche s'y rend a 5 px
   et les petites capitales a 2,5 px. Ce n'est plus du texte, c'est du bruit
   gris qui salit une composition par ailleurs propre.

   ⚠ LE TEXTE N'EST PAS SUPPRIME, IL EST RENDU TRANSPARENT, et une barre est
   peinte par-dessus en ::after. C'est le seul moyen de ne RIEN deplacer :
   chaque libelle garde exactement la largeur et la hauteur qu'il occupait, donc
   la carte blanche garde sa hauteur (elle depend du nombre de lignes de la
   phrase, qui varie d'une scene a l'autre), le bandeau bleu garde la sienne, et
   les six scenes restent superposables a leur version en grand. Le supprimer
   ferait retomber toutes ces boites et il faudrait re-caler six compositions.

   Les barres reprennent la grammaire deja presente dans les scenes (.av-row,
   .av-bar, les <i> des tableaux) : meme rayon, memes gris. Le mode ne rajoute
   donc aucun vocabulaire visuel, il etend celui du dessin au texte.

   La largeur 100 % sur les barres des libelles a largeur automatique (.av-cap
   et les <b> des pastilles) : leur boite EST celle du texte, la barre epouse
   donc exactement son empreinte. Les deux libelles du bandeau sont des blocs
   pleine largeur, eux portent une largeur explicite.
   (Pas d'accent grave dans ce bloc : on est dans un template literal, une
   paire de backticks autour d'un bout de code le refermerait en silence.) */
.av-textless .av-ask,.av-textless .av-ask *{color:transparent}
.av-textless .av-ask{-webkit-user-select:none;user-select:none}
.av-textless .av-ask svg{display:none}
.av-textless .av-ask::after{content:"";position:absolute;left:32px;top:50%;
  transform:translateY(-50%);height:15px;width:56%;border-radius:99px;background:#e4eaf5}

.av-textless .av-cap,
.av-textless .av-band .av-k,
.av-textless .av-band .av-t,
.av-textless .av-pill b,
.av-textless .av-tagm b{position:relative;color:transparent;
  -webkit-user-select:none;user-select:none}
.av-textless .av-cap::after,
.av-textless .av-band .av-k::after,
.av-textless .av-band .av-t::after,
.av-textless .av-pill b::after,
.av-textless .av-tagm b::after{content:"";position:absolute;left:0;top:50%;
  transform:translateY(-50%);border-radius:99px}

.av-textless .av-cap::after{width:100%;height:7px;background:#d3dcea}
.av-textless .av-pill b::after{width:100%;height:9px;background:#dbe3f0}
.av-textless .av-tagm b::after{width:100%;height:9px;background:#dbe3f0}
.av-textless .av-band .av-k::after{width:62px;height:7px;background:rgba(255,255,255,.55)}
.av-textless .av-band .av-t::after{width:58%;height:15px;background:rgba(255,255,255,.9)}
`;

/** L'icône de fichier des références balisées `[[f:…]]`, et de deux pastilles. */
function FileIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function CheckIcon({ size = 11, width = 3.4 }: { size?: number; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Découpe la phrase sur les références balisées.
 *   « Où en est le bouclage de [[Nexio SAS]] ? »   → mot bleu simple
 *   « … sur [[f:Modèle comité]], à partir … »       → mot bleu + icône fichier
 * Le balisage vit DANS la chaîne traduisible, et c'est le point : en anglais la
 * référence ne tombe pas au même endroit de la phrase, un index posé à côté du
 * texte se désynchroniserait à la première retouche.
 */
function renderAsk(ask: string): ReactNode[] {
  return ask.split(/(\[\[.*?\]\])/g).filter(Boolean).map((part, i) => {
    const m = part.match(/^\[\[(f:)?(.*)\]\]$/);
    if (!m) return <span key={i}>{part}</span>;
    return (
      <span key={i} className="av-ref">
        {m[1] ? <FileIcon /> : null}
        {m[2]}
      </span>
    );
  });
}

/* ── LES SIX SCÈNES ────────────────────────────────────────────────────────
   Chacune est l'intérieur de la plaque, et rien d'autre : la plaque, le cadre
   clair et la carte de demande sont communs et vivent dans le rendu principal.
   Les libellés qui restent en dur ici (« Source », « Retraitement », « Votre
   modèle »…) sont des ÉTIQUETTES DE MAQUETTE, du même rang que les faux
   graphiques : elles nomment la mécanique montrée, pas une promesse produit.
   Si la section passe un jour en anglais pour de bon, ce sont elles qu'il
   faudra sortir en données, avec les six `ask`. */
const SCENES: Record<AtlasVisual, ReactNode> = {
  bouclage: (
    <div className="av-list">
      {[74, 58, null, 66, 74].map((w, i) => (
        <div key={i} className={`av-it ${w === null ? "av-open" : "av-ok"}`}>
          <span className="av-mk">{w === null ? null : <CheckIcon />}</span>
          <span className="av-bar" style={{ width: w === null ? "86%" : `${w}%` }} />
        </div>
      ))}
    </div>
  ),

  controle: (
    <>
      <svg className="av-thread" viewBox="0 0 870 880" fill="none">
        <defs>
          <linearGradient id="av-thread-g" x1="120" y1="360" x2="620" y2="700" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3fb894" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path
          d="M256 412 C 282 428, 300 434, 326 442"
          stroke="url(#av-thread-g)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1 11"
        />
        <path
          d="M524 556 C 546 566, 558 572, 582 580"
          stroke="url(#av-thread-g)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1 11"
        />
      </svg>

      <div className="av-lnk av-l1">
        <span className="av-cap">Source</span>
        <span className="av-rows">
          <i style={{ width: "92%" }} />
          <i style={{ width: "48%" }} />
        </span>
      </div>

      <div className="av-lnk av-l2">
        <span className="av-cap">Retraitement</span>
        <span className="av-rows">
          <i style={{ width: "74%" }} />
          <i style={{ width: "92%" }} />
          <i style={{ width: "48%" }} />
        </span>
      </div>

      <div className="av-lnk av-l3">
        <div className="av-band">
          <div className="av-k">Contrôle</div>
          <div className="av-t">La marge de juin</div>
        </div>
        <div className="av-tbl">
          <i style={{ width: "88%" }} />
          <div className="av-hit">
            <i />
          </div>
          <i style={{ width: "70%" }} />
          <i style={{ width: "42%" }} />
        </div>
      </div>

      <div className="av-pill av-p-src">
        <FileIcon size={15} />
        <b>Export de caisse</b>
      </div>
      <div className="av-pill av-p-fig">
        <CheckIcon size={15} width={2.6} />
        <b>Chaîne remontée</b>
      </div>
    </>
  ),

  livrables: (
    <>
      <div className="av-sheet av-gh1" />
      <div className="av-sheet av-gh2" />
      <div className="av-sheet av-front">
        <div className="av-band">
          <div className="av-k">Livrable</div>
          <div className="av-t">Synthèse de mission</div>
        </div>
        <div className="av-body">
          <i style={{ width: "92%" }} />
          <i style={{ width: "72%" }} />
          <i style={{ width: "44%" }} />
          <div className="av-duo">
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className="av-tagm">
        <FileIcon size={16} />
        <b>Votre modèle</b>
      </div>
    </>
  ),

  equipe: (
    <div className="av-lanes">
      {[
        { c: "#7c6df2", w: 82, now: false },
        { c: "#34c17b", w: 64, now: true },
        { c: "#ef7a72", w: 38, now: false },
        { c: "#3b82f6", w: 91, now: false },
      ].map((l, i) => (
        <div key={i} className={`av-lane ${l.now ? "av-now" : ""}`}>
          <span className="av-av" style={{ background: l.c }} />
          <span className="av-trk">
            <span style={{ width: `${l.w}%` }} />
          </span>
        </div>
      ))}
    </div>
  ),

  tracabilite: (
    <>
      <div className="av-rail" />
      {[
        { top: 292, w: 330, first: true },
        { top: 400, w: 248, first: false },
        { top: 508, w: 296, first: false },
        { top: 616, w: 214, first: false },
        { top: 724, w: 272, first: false },
      ].map((e, i) => (
        <div key={i} className={`av-ev ${e.first ? "av-first" : ""}`} style={{ top: e.top }}>
          <span className="av-dot" />
          <span className="av-chip" style={{ width: e.w }} />
        </div>
      ))}
    </>
  ),

  comparaison: (
    <>
      <div className="av-pan av-pL">
        <div className="av-row" style={{ width: "88%" }} />
        <div className="av-row av-del" style={{ width: "66%" }} />
        <div className="av-row" style={{ width: "78%" }} />
        <div className="av-row" style={{ width: "54%" }} />
      </div>
      <div className="av-seam" />
      <div className="av-pan av-pR">
        <div className="av-row" style={{ width: "88%" }} />
        <div className="av-row av-add" style={{ width: "78%" }} />
        <div className="av-row" style={{ width: "78%" }} />
        <div className="av-row" style={{ width: "54%" }} />
      </div>
    </>
  ),
};

export default function AtlasSlideVisual({
  visual,
  ask,
  label,
  textless = false,
}: {
  visual: AtlasVisual;
  /** La demande, balisée : voir renderAsk. */
  ask: string;
  /** Ce que la scène montre, pour qui ne la voit pas. */
  label: string;
  /**
   * Rend la scène SANS AUCUN TEXTE LISIBLE : chaque libellé devient une barre
   * grise, au vocabulaire des blocs vides déjà présents (voir `.av-textless`
   * dans AV_CSS). À réserver aux emplacements où la planche est trop réduite
   * pour que son texte se lise — les vignettes de la grille des usages, où le
   * facteur tombe à 0,25.
   * Le texte reste dans le DOM, seulement transparent : c'est ce qui garantit
   * que rien ne bouge par rapport à la version en grand.
   */
  textless?: boolean;
}) {
  return (
    <>
      <style>{AV_CSS}</style>
      {/* `role="img"` + une étiquette : la scène est une composition de blocs
          vides, elle n'a aucun texte à lire et un lecteur d'écran n'y
          trouverait rien. L'étiquette dit ce qu'elle montre, en une phrase. */}
      <div
        className={`av-stage${textless ? " av-textless" : ""}`}
        role="img"
        aria-label={label}
      >
        <div className={`av-plate av-plate-${visual}`}>
          <div className={`av-inner av-inner-${visual}`} />
          {SCENES[visual]}
        </div>
        {/* La carte de demande est SŒUR de la plaque et non sa fille : elle
            déborde volontairement du cadre clair par le haut, et la plaque est
            en overflow caché. */}
        <div className="av-ask">{renderAsk(ask)}</div>
      </div>
    </>
  );
}
