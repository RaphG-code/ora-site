# CLAUDE.md

## Project Goals

**Current Milestones:** This project is a website to sell an Excel workflows automation app running on Python called `Ora`

**Website scope:**
- Homepage welcoming the client, presenting the service
- Solutions page presenting the product in more details
- Pricing page to know a bit more about the product
- The main objective of this website is to push the viewer to book a call to discover the product : it must contain a book a call window

---

## Running the App

**Tech stack:** React 19 + TypeScript, Vite 7, Tailwind CSS 3, Framer Motion 12, Three.js, Lenis (smooth scroll), Lucide React, @calcom/embed-react

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |

> `dev` lance Vite via `node --max-http-header-size=65536` au lieu du binaire
> `vite` nu. C'est un correctif, pas une préférence : le navigateur accumule les
> cookies de TOUS les projets servis sur `localhost`, et une fois l'en-tête
> au-delà des 16 Ko admis par défaut par Node, le serveur répond **431 Request
> Header Fields Too Large** sur chaque module. La page part alors en dizaines
> d'erreurs au lieu de se charger (constaté le 2026-08-12 sous Safari). Ne pas
> revenir à `"dev": "vite"`. Si le problème réapparaît malgré ce flag, vider les
> cookies `localhost` dans le navigateur.

---

## Design Style Guide

**Visual style:**
- Clean, minimal and modern interface
- Intuitive and clean UI following modern tech SaaS design standards

**Typography — THREE display faces, and each has a territory.** The style guide
long claimed Poppins everywhere; the code says otherwise, and this section was
rewritten on 2026-08-15 to match what is actually shipped.

| Face | Where it is used | Tailwind |
|---|---|---|
| **Instrument Sans** | Every large display heading: hero, section h2, panel leads, the booking window. Weight 400, tight tracking. | `font-instrument` |
| **Inter** | All body copy, UI labels, buttons, card titles in the bento grid. | `font-inter` |
| **Poppins** | Legacy headings not yet migrated (FAQ, some mockup titles) and the mockup chrome. **Do not add new ones.** | `font-poppins` |
| **Figtree** | The navigation bar only. | `font-figtree` |

- Always set the face explicitly on the element. The global CSS sets a default
  on heading tags, but Tailwind utility ordering makes that unreliable.
- **Never `font-light` (300) on a heading.** It is not in the brand spec.
- CTAs and buttons: `font-inter font-semibold`.
- Instrument Sans has **no weight below 400** — measured, `font-light` on it is
  dead code, the browser never synthesises a lighter face. To thin it, the only
  lever is `-webkit-font-smoothing: antialiased`, and it is WebKit-only.

**Writing style — em dashes (`—`) are forbidden in UI copy.**
- Never use `—` in visible text (labels, descriptions, subtitles, CTAs, body copy).
- Replace with: a period, a comma, a colon, or restructure the sentence.
- The only tolerated exception is inside code comments, never in rendered content.

**Color palette:**

| Name | Hex | Usage |
|---|---|---|
| Blue | `#3b82f6` | THE accent. Every primary CTA, every active state, every marker. |
| Blue hover | `#2563eb` | The hover of every filled CTA. One value, no exceptions. |
| Teal | `#0d9488` | Gradient end only. Never a flat fill. |
| Dark background | `#111827` | Dark mode, primary section bg |
| Dark background alt | `#0f172a` | Dark mode, alternate section bg |
| Light background | `#fcfbf7` | Light mode, primary section bg (warm off-white) |
| Light background alt | `#ffffff` | Light mode, alternate section bg |
| Ink strong | `#42506b` | Body copy on light |
| Ink muted | `#5b6577` | Secondary copy on light |
| Ink faint | `#6b7688` | Eyebrows, captions, de-emphasised halves of two-ink headings |

> **One blue, and one hover.** The site carried four blues for the same role
> (`#3b82f6`, `#0a66f5`, `#6161FF` in the persistent navigation, `#2563eb`) and
> three different hovers off the same base. They were unified on 2026-08-15.
> Adding a new blue is a regression, not a decision.

> **Nothing below `#6b7688` on a light background.** The greys that preceded it
> (`#c4cad6`, `#9aa4b5`, `#9aa3b2`) measured between 1.6:1 and 2.5:1 — the
> tabbed section's own navigation was effectively invisible. If a text needs to
> recede further than `#6b7688`, make it smaller or shorter, not paler.

Brand gradient: `linear-gradient(to right, #3b82f6, #0d9488)`

**Section background alternation rule — it is a rule, and it was not applied.**
Until 2026-08-15 `#fcfbf7` appeared nowhere: the homepage ran seven consecutive
light sections in pure white. Alternate strictly, section by section.

**Section background alternation rule:**
Pages alternate between two backgrounds to create visual rhythm. Use these exact values — never use other dark shades (e.g. `#020617`, `#0a0a0a`) for section backgrounds.

| Mode | Section A (primary) | Section B (contrast) |
|---|---|---|
| Light | `#fcfbf7` | `#ffffff` |
| Dark | `#111827` | `#0f172a` |

In JSX: `bg = dk ? "#111827" : "#fcfbf7"` and `bgContrast = dk ? "#0f172a" : "#ffffff"`

> `tailwind.config.cjs` carries all of the above as tokens (`brand-blue`,
> `brand-blue-hover`, `bg-light`, `bg-dark-alt`, `ink-strong`, `ink-muted`,
> `ink-faint`). Prefer the token over the raw hex in new code.

**Logo assets** — all files in `public/logos/`:

| File | Description | Use when |
|---|---|---|
| `logo-dark.png` | Full logo — dark navy, transparent/white bg | Light mode |
| `logo-white.png` | Full logo — white/cream | Dark mode |
| `logo-color-light.png` | Full logo — blue-teal gradient icon + dark text | Light mode, colored sections |
| `logo-color-dark.png` | Full logo — blue-teal gradient icon + ghosted text | Dark mode hero sections |
| `icon-dark.png` | Icon only — dark navy, no text | Favicon, compact nav, mobile |
| `icon-light.png` | Icon only — white/cream, no text | Favicon, compact nav, mobile |
| `icon-color.png` | Icon only — blue-teal gradient icon, no text | Favicon, compact nav, mobile |

**Theming — LE SITE EST VERROUILLÉ EN CLAIR (2026-08-18).**

Le site ne bascule plus jour/nuit. Demande du client : « enlève la possibilité
de passer le site en nuit jour ». Trois choses ont disparu ensemble, et il faut
les rétablir ensemble si la bascule revient un jour :

| Où | Ce qui a été retiré |
|---|---|
| `index.html` | Le script d'amorçage lisait `localStorage` puis `prefers-color-scheme`. Il pose maintenant `.light`, point. |
| `App.tsx` | `theme` n'est plus un `useState` mais la constante `"light" as "light" \| "dark"`. Les deux `useEffect` de thème (pose de classe, écoute du système) sont partis. |
| `Navigation.tsx`, `DownloadPage.tsx` | Le bouton soleil/lune et la prop `onToggleTheme`. |

- Tailwind reste en `darkMode: "class"`, et `<html>` porte toujours `.light`.
- **Les classes `dark:` restent partout dans le JSX, à dessein.** Elles ne
  coûtent rien tant que `.dark` n'est jamais posée, et les retirer toucherait
  des centaines de lignes pour zéro effet visible. Ne pas lancer ce nettoyage.
- **Ne pas annoter `const theme: "light" | "dark" = "light"`.** Sur un `const`
  initialisé par un littéral, TypeScript rétrécit quand même au littéral et
  chaque `theme === "dark"` du fichier devient une erreur « comparaison
  impossible ». L'assertion `as` est ce qui garde l'union.
- La clé localStorage `"ora-theme-v2"` n'est plus ni lue ni écrite. La clé
  `"theme"` (ancienne) ne doit toujours jamais être relue.
- Logo : `logo-color-dark.png` (le variant clair ne sert plus que sur les
  sections sombres, via la détection `overDark` de la barre).

**Languages:**
- UI-facing strings: **French** (labels, buttons, dialogs, log messages) with an **English** version
- Code, comments, variable names, function names: **English**

**Log message format:**
- `✓ Success message` — success
- `✗ Error message` — error
- `⚠ Warning message` — warning

---

## Mobile — LA COMPOSITION DU BUREAU, EN PLUS PETIT (2026-08-23)

⚠ SEPT ARBITRAGES SUCCESSIFS. Lire les sept avant de toucher au mobile — chacun
a renvoyé le précédent, et le SEPTIÈME fait loi.
  1. 2026-08-19 : « je veux la même disposition et layout que sur l'ordinateur,
     il faut juste réduire la taille de beaucoup d'encadrés ». Livré : grilles
     du bureau tenues à largeur de téléphone, rembourrages compactés.
  2. 2026-08-20 (matin) : « everything is compacted, there's no spaces between
     each part, we don't really understand what we are doing ». Livré :
     empilement sur une colonne, texte à 14 px, gros rembourrages.
  3. 2026-08-20 (après-midi), sur cette version empilée : « the buttons are way
     too big […] the size of the boxes is way too big, and they are not the
     same as on the website version […] for budget tracking, cost price, VAT
     and account matching, put them side by side, left to right, as they are on
     the website on the computer version […] except for Atlas, which is done
     right ».
  4. 2026-08-21 (matin), sur une passe de bureau réduit : « c'est
     catastrophique ce qu'on a » — d'où le prototype de maquettes à taille
     réelle qu'on faisait glisser (`SwipeDeck`).
  5. 2026-08-21 (après-midi), sur ce prototype : « it's better, definitely, but
     […] the user on a phone won't scroll right and left, they just won't have
     their design or the whole thing to see at once […] when there is a true
     design side by side, put them side by side so small ». `SwipeDeck`
     supprimé, tout entre dans l'écran par `DesktopScale`.
  6. 2026-08-22 : « prends exemple de DataSnipper (pour leur version mobile) et
     essaye de faire un site mobile aussi minimaliste et bien fait pour mobile,
     sans inventer d'autre design à part si il le faut ». Aucune identité
     nouvelle : mêmes polices, mêmes encres, mêmes composants. Ce qui changeait
     était la DISCIPLINE — une hiérarchie de titres au lieu d'un pavé, une
     seule chose à la fois, et le texte suivi sorti des demi-colonnes.
     (⚠ datasnipper.com est bloqué par la politique de sortie réseau de la
     session : la référence n'a pas pu être inspectée.)
  7. **2026-08-23, ET C'EST LA VERSION EN VIGUEUR.** Trois demandes, dont deux
     renvoient l'arbitrage 6 :
     · « le bouton commencer est bien trop large, fais en sorte qu'il soit bien
       plus petit et discret » — l'appel pleine largeur du hero, tiré des
       captures DataSnipper la veille, est renvoyé. Pastille de 148 × 38 px,
       corps de 13,5 px, SANS ombre portée.
     · « pour prévisionnel j'aimerais que tu répliques sur mobile exactement le
       même encadré que je t'envoie » (capture du panneau du BUREAU).
     · « pour les autres designs avec l'explication j'aimerais qu'ils soient
       côte à côte, par exemple pour bilan développé, Conseillez la bonne
       structure, évaluation financière […] également pour [contrôles et
       suivi] […] j'aimerais que tu fasses comme pour le deuxième screen et que
       le tout soit côte à côte comme sur le second screen » — l'empilement du
       geste 2 de l'arbitrage 6 est renvoyé. **Les rangées texte + maquette
       redeviennent côte à côte à TOUTES les largeurs.**

**Ce que l'arbitrage 7 garde de l'arbitrage 6, et ce qu'il renvoie :**
· **GARDÉ — le chapô se détache du titre sous 768.** Le site compose ses titres
  en une phrase à deux encres (`<span>` foncé + `<span>` gris dans le même
  corps) : c'est la figure du bureau et elle tient en deux lignes. Sur 350 px la
  même figure fait sept lignes à 27 px où rien ne dit où finit le titre — c'est
  littéralement le reproche « we even have words that are the same ». Le second
  `<span>` prend donc `max-md:mt-3 max-md:block max-md:font-inter
  max-md:text-[0.95rem] max-md:leading-[1.55] max-md:tracking-normal`, et le
  titre tombe à 1,45 rem. Le bureau ne bouge pas d'un pixel.
· **RENVOYÉ — « le texte suivi ne partage pas une rangée avec une maquette ».**
  L'arbitrage 6 empilait ces rangées sous `md` au nom de la ligne de lecture ;
  l'argument tient toujours (une demi-colonne de téléphone donne 125 à 155 px
  utiles), et le client l'a tranché DANS L'AUTRE SENS le 2026-08-23 : c'est la
  COMPOSITION qui prime. Les quatre rangées d'`AutomationTabs` sont donc côte à
  côte partout, et le prix est payé en CORPS, jamais en contenu — rien n'est
  coupé. **Le plancher de 14 px ne vaut plus dans une demi-colonne de
  téléphone** ; l'échelle y est 12 à 13 px pour un titre, 10,5 à 11,5 px pour
  une phrase. Il vaut toujours en PLEINE largeur (chapôs, listes, pied de page).
  Ce qu'on fait pour limiter la casse : rembourrages à `p-3` au lieu de `p-5`,
  gouttière à 10 px, et une répartition qui favorise le texte quand la cellule
  voisine est un décor (`grid-cols-[1fr_1.25fr]` sur la rangée « Bilan »).
· **RENVOYÉ — « une composition rognée est une composition de BUREAU ».** La
  scène du logiciel de « Contrôles et suivi » est de nouveau ROGNÉE par le bord
  de sa demi-colonne sur téléphone, comme sur la capture du bureau. Ce qui
  change d'un palier à l'autre est l'ÉCHELLE, pas le cadrage : `readCrop()` rend
  0,82 au-dessus de 1024, 0,62 entre 768 et 1024, 0,42 en dessous, de sorte que
  la part de fenêtre visible reste comparable (430 px de scène à 390 px d'écran,
  contre 222 si l'échelle du bureau était gardée). Réduite, la scène devient
  plus COURTE que la colonne voisine : elle est alors centrée verticalement, la
  marge négative valant la moitié de la hauteur réellement peinte.
  ⚠ La carte « Gagnez des heures » d'`UseCasesBento`, elle, garde son rendu
  ENTIER sous 768 (`useIsPhone`) : là c'est une carte pleine largeur et non une
  demi-colonne, le rognage y montrait le tiers gauche coupé au milieu d'un mot.

LA SYNTHÈSE, ET C'EST ELLE QUI FAIT LOI : **la COMPOSITION est celle du bureau
(côte à côte, en grille), les TAILLES sont réduites, et il y a de l'ESPACE.**
Aucun des deux extrêmes ne passe — ni le bureau écrasé sans air (1), ni la
colonne unique en gros caractères (2).

⚠ **« Côte à côte » se lit à l'échelle de L'ENTRÉE, pas de la rangée**
(client 2026-08-23, sur le bloc « Ce qu'Atlas sait faire » : « il faut que le
layout ressemble plutôt à cela », captures du bureau à l'appui). Le bloc était
cité ici comme LE modèle validé, à deux colonnes et tuiles de 62 px — et c'est
lui que le client a renvoyé. Ce qui fait la référence n'est pas le NOMBRE de
colonnes, c'est la PROPORTION d'une entrée : une tuile franche, le bénéfice sur
une ou deux lignes à côté d'elle, la catégorie en dessous, et de l'air. Deux
entrées de front sur 390 px détruisent cette proportion — 165 px par entrée,
dont 62 de tuile, laissaient 91 px au titre, soit CINQ lignes de trois mots.
Le bloc passe donc à UNE colonne sous `md` : la proportion du bureau, à
l'échelle du téléphone.
⚠ MESURES REPRISES APRÈS LA FUSION DE LA PR nº 40 (2026-08-23). Cette
correction avait été écrite contre l'ancien bloc, noir, à tuiles de dégradé et
icône. `main` a refondu la section entre-temps — fond blanc, vignettes muettes
d'`AtlasSlideVisual`, titres en Instrument Sans — et sa version répondait DÉJÀ
à la demande : `grid` sans `grid-cols` de base, donc une colonne sous `md`.
C'est elle qui est en place, et ses valeurs font foi : entrée de 342 px à
390 px d'écran, vignette de 104 px, titre de 18 px sur 218 px, deux lignes.
Le raisonnement ci-dessus reste la RÈGLE ; les chiffres de l'ancien correctif
(tuile 84, titre 15 px) ne décrivent plus rien dans le code.
La règle générale : quand une case de grille est déjà un couple
image + texte, c'est CE couple qu'il faut garder côte à côte ; empiler deux
cases de front par-dessus revient à diviser par deux la largeur du texte, et
c'est le texte qui paie. Compter les caractères par ligne avant de doubler une
colonne (l'anglais est plus court que le français : mesurer les deux).

**Les quatre règles, dans cet ordre :**

1. **Une valeur mobile ne doit JAMAIS fuir au-dessus de `md`.** Toute classe
   ajoutée pour le téléphone porte soit un `md:` équivalant à la valeur
   d'origine, soit le préfixe `max-md:`. Le piège se referme sur les
   utilitaires Tailwind qui posent DEUX propriétés : `text-xl`, `text-3xl`,
   `text-sm` posent une taille **et** une hauteur de ligne. Les remplacer par
   une taille arbitraire (`text-[1.05rem]`) supprime la hauteur de ligne dont
   héritait le `md:` — c'est ce qui a rallongé `/cgu` de 78 px sur le bureau.
   Contrôle chiffré : l'accueil à 1440 × 900 se mesure à 17 879 ± 5 px (le ± 5
   est le bruit du harnais, mesuré sur trois lectures du même commit).
2. **Une grille de contenu garde ses colonnes sur téléphone SI ses cellules
   sont des DESSINS.** `grid-cols-2` sans préfixe, `gap-4`, `p-4` d'intérieur.
   ⚠ **AMENDÉE LE 2026-08-22, et c'est la version qui vaut** (arbitrage 6) :
   dès qu'une cellule porte du TEXTE SUIVI, elle passe en pleine largeur sous
   `sm`. Le seuil n'est plus « ~100 px utiles » mais la LIGNE DE LECTURE : sous
   ~30 signes par ligne un paragraphe ne se lit plus, il se déchiffre. Mesuré
   avant correction : 11 px dans 133 px de colonne, soit 23 signes, sur les six
   fiches des pages Solution ; 10,5 px dans 125 px, neuf lignes, sur la carte
   « Un bilan personnalisé ». Le corps plancher du texte suivi sur téléphone
   est **14 px**, jamais 10 ou 11.
   ⚠⚠ **AMENDÉE UNE SECONDE FOIS LE 2026-08-23 (arbitrage 7), ET CETTE
   AMENDE-CI PRIME.** Elle ne vaut plus pour les rangées d'`AutomationTabs` :
   le client les veut CÔTE À CÔTE à toutes les largeurs, texte compris, et
   c'est la composition qui l'emporte sur la ligne de lecture. Le plancher de
   14 px ne tient donc que pour le texte de PLEINE largeur ; en demi-colonne de
   téléphone, l'échelle est 12–13 px pour un titre et 10,5–11,5 px pour une
   phrase. Les six fiches des pages Solution, les témoignages et le pied de page
   n'étaient PAS visés par la demande : ils restent pleine largeur et à 14 px.
   Ne pas généraliser l'un à l'autre sans redemander.
   ⚠ Deux pièges mesurés à 320 px, tous deux dans des cartes `flex` icône +
   texte : un enfant de flex garde `min-width: auto` et refuse de descendre
   sous son mot le plus long (`min-w-0` sur le bloc de texte), et à deux
   colonnes une pastille de 36 px ne laisse que 50 px au libellé (l'icône passe
   au-dessus sous `xs`, plus `break-words` en filet).
3. **Les maquettes se mettent à l'échelle, elles ne se replient pas.**
   `DesktopScale` rend l'enfant à une largeur de bureau imposée puis le réduit ;
   il vaut aussi en demi-colonne, c'est ainsi que les cartes du bureau tiennent
   côte à côte sur un téléphone. ⚠ Il impose une LARGEUR, pas un contexte de
   media query : les `md:` de l'enfant restent évalués contre la FENÊTRE. Toute
   dimension structurelle de l'enfant doit donc être SANS préfixe — c'est ce qui
   manquait à `min-h-[620px]` dans ShowcaseCards, dont les cartes s'effondraient
   en languette sur téléphone. Et les hauteurs en pourcentage ne résolvent pas
   sous transform : les nuages d'étiquettes prennent une enveloppe
   `absolute inset-0`, jamais `h-full`.
   ⚠ **Quand l'enfant est une maquette FLUIDE, la largeur imposée ne suffit
   pas** (trouvé le 2026-08-23 sur `PrevisionnelStudio`). Ses `sm:`/`md:`/`lg:`
   répondaient tous NON dans 920 px de mise en page posés sur un écran de
   390 px : la maquette se composait large AVEC ses replis de téléphone — barre
   latérale escamotée, colonne « en direct » absente, carte du livrable remise
   dans le flux. Ni le bureau, ni le téléphone : une troisième mise en page que
   personne n'avait dessinée. Le patron est un **drapeau `wide`** qui donne
   l'autre branche de chaque classe repliée (une table `c = { aside: wide ? …
   : … }` en littéraux entiers, Tailwind ne concatène pas), levé par l'appelant
   quand `DesktopScale` est en service et LUI SEULEMENT — sur le bureau il doit
   rester baissé, sinon on paie ses effets de bord (la cale de 24 px du
   Prévisionnel a allongé l'accueil de 26 px avant d'être conditionnée).
   Les container queries diraient la même chose sans branche JS ; le projet est
   en Tailwind 3.4 sans le greffon.
   ⚠ **Ce qui déborde par POSITION ABSOLUE est tranché.** `DesktopScale` borne
   sa boîte à la hauteur MESURÉE de l'enfant (`offsetHeight`), or un élément
   absolu n'y compte pas : la carte flottante du Prévisionnel, à `-bottom-6`,
   perdait son pied sous l'`overflow: hidden`. Le débord se RÉSERVE par une cale
   de la même hauteur en fin d'enfant, la carte passant alors à `bottom-0`.
4. **Vérifier, pas supposer.** Avant de pousser : mesurer la hauteur de CHAQUE
   route à 1440 × 900 avant et après (tolérance : le bruit ci-dessus), et
   vérifier `scrollWidth === clientWidth` à 320, 390, 430, 768, 1024 et 1440.

**La section à onglets sur téléphone** (AutomationTabs) : le rail vertical est
`hidden lg:block` ; sous `lg`, une bande de pastilles horizontale, COLLANTE sous
la nav (`top-[68px]`, hauteur mesurée de la barre), suit l'onglet actif et
s'auto-défile pour le garder visible. C'est le SEUL défilement horizontal que la
page conserve, et c'est une navigation, pas un design.

**⚠ RIEN NE SE FAIT GLISSER (client 2026-08-21).** Une passe du 2026-08-20 avait
rendu les maquettes à leur largeur de bureau dans des bandes défilantes
(`SwipeDeck`, supprimé). Verdict : « the user on a phone won't scroll right and
left, they just won't have their design or the whole thing to see at once ». La
règle est donc : **toute maquette entre ENTIÈRE dans la largeur disponible**, par
`DesktopScale` (largeur de mise en page imposée puis `transform: scale()`,
plafonné à 1). Et **là où le bureau est vraiment en deux colonnes, le téléphone
l'est aussi**, en réduit : « when there is a true design side by side, put them
side by side so small ». Les quatre panneaux concernés portent donc des grilles
SANS préfixe (`grid-cols-[1fr_1.15fr]`, `grid-cols-2`…), pas `lg:`.

**Les décors animés tournent aussi sur téléphone** (même demande) : `ParticleOrbGL`
portait `hidden md:block` dans ShowcaseCards, la carte réduite se lisait donc
comme un cadre vide. Le semis est ALLÉGÉ, pas supprimé — un tiers des points, via
`useIsPhone` (`src/lib/useIsPhone.ts`). Un crochet et pas une classe `md:` parce
que `hidden` monte le composant et paie le contexte WebGL quand même.

**Deux pièges de la mise à l'échelle, tous deux mesurés :**
· Les media queries s'évaluent contre la FENÊTRE, jamais contre la boîte réduite.
  Une hauteur `md:min-h-[620px]` disparaissait donc sous 768 et la carte
  s'effondrait en languette de 40 px. Toute dimension de design d'un enfant de
  `DesktopScale` se pose SANS préfixe.
· Ce qui vit hors de la boîte réduite garde sa taille réelle. La pastille
  d'agrandissement (28 px) couvre ~106 px de l'espace d'une carte à l'échelle
  0,34, quand son titre n'en réservait que 56 : d'où `max-md:pr-32` sur les
  titres de `CardShell`.

**Le hero mobile n'a QU'UN bouton**, « Commencer », et il est PETIT — pastille
de 148 × 38 px, corps de 13,5 px, sans ombre portée (client 2026-08-23 : « le
bouton commencer est bien trop large, fais en sorte qu'il soit bien plus petit
et discret »). ⚠ Le bloc pleine largeur de 50 px tiré des captures DataSnipper
la veille est RENVOYÉ : ne pas le remettre. « Discret » visait autant le halo
que la géométrie, d'où la disparition de l'ombre bleue.
Le pavé noir « Réserver un appel » qui le suivait a été retiré (client, point 3 : « why did you add the
Book a Call button? there is already a button for it ») : le bureau ne porte
pas d'équivalent à cet endroit, et la prise de rendez-vous reste atteignable
par la barre de navigation et par le CTA de fin de page.

**⚠ AVANT DE TRANCHER UN CONFLIT « main contre la branche », REGARDER LA BASE
DE FUSION.** La règle « une décision du client portée par main prime un choix
de style de cette branche » a servi trois fois, et la troisième elle a failli
faire l'inverse de ce qu'il fallait. À la fusion nº 42, git a signalé un
conflit entre le `md:grid-cols-*` de main et le `grid-cols-*` sans préfixe de
la branche sur les trois rangées « texte + maquette ». Prendre le côté de main,
comme les deux fois précédentes, aurait annulé la demande expresse du client du
23/08 (le côte à côte). Or `git diff <base> origin/main` sur ces lignes montrait
que main n'y avait changé QUE la marge (`mt-9 md:mt-11` → `mt-14 md:mt-20`) :
les préfixes `md:` étaient inchangés depuis la base. main n'avait rien arbitré ;
git ne signalait un conflit que parce que les deux modifications tombaient sur
la même ligne.
**Un conflit git n'est pas une opposition de décisions.** Tant qu'on n'a pas
comparé les deux côtés à la BASE, on ne sait pas lequel a décidé quoi — ni même
si quelqu'un a décidé. Le côté d'en face peut n'être que l'état d'avant.

**Quand deux décisions client portent sur des choses différentes, elles se
composent — on n'en sacrifie pas une.** Toujours à la fusion nº 42, l'appel du
hero mobile : main en change la DESTINATION (26/08, le lien vers la web app est
retiré du site entier), la branche en tient la GÉOMÉTRIE (23/08, « bien plus
petit et discret »). Aucune des deux ne parle de l'autre. Résultat : le bouton
de main, à la taille de la branche. Le bloc de 52 px que portait main n'était
pas une re-décision contre le 23/08, c'était l'état d'avant — même piège que
ci-dessus.

**La rangée de preuve sous le bouton est EMPILÉE, et c'est un second renvoi**
(fusion de `main`, PR nº 41, 2026-08-26). Trois mentions en colonne, corps de
13,5 px : « Hébergé en Europe, hors CLOUD Act », « Chiffré sur votre appareil »,
« Même fichier, même résultat ». Cette branche l'avait passée en rangée qui se
replie (`flex-wrap`, 12,5 px) pour gagner de la hauteur sous le titre ; le
libellé de `main` est bien plus long et la replie n'est plus tenable. Mesurée à
390 px, la première mention fait à elle seule **297 px** : en `flex-wrap` elle
se couperait au milieu, ce que le commentaire du fichier interdit. ⚠ Ne pas la
remettre en rangée. Et 13,5 px n'est PAS une valeur de bureau qui déborde :
`OraHeroMobile.tsx` ne sert que le téléphone, la valeur y a été posée pour lui.
⚠ **Trois mentions, pas quatre.** La quatrième pousserait la réplique du
logiciel hors du premier écran — à trois, elle commence à 469 px sur un écran
de 844.

**Paliers :** `xs` = 400 px a été ajouté (rien n'existait sous `sm` = 640, or
320 → 430 px sépare un iPhone SE d'un 15 Pro Max). La carte `screens` est
déclarée EN ENTIER dans `theme` et non dans `theme.extend` : sous `extend` un
palier neuf est ajouté en fin de liste, ses règles sortent après celles de
`md`, et à 800 px `xs:` écrasait `md:`. Ne pas remettre `screens` sous
`extend`.

**Le hero monte la MÊME réplique du logiciel que le bureau.** `OraHeroDemo`
reste `hidden md:block` et `OraHeroMobile` prend sa place — la démo du bureau
est une scène épinglée sur 300 à 800 vh, la porter telle quelle rallongerait la
page de plusieurs écrans. Mais la fenêtre du logiciel qu'on y voit est
`OraAppScene`, le composant du bureau, à son état de repos : même barre
latérale, même grille de douze modules, mêmes pastilles flottantes.

- ⚠ **Ne pas recomposer cette réplique à la largeur du téléphone.** Une version
  recomposée a tenu cette place jusqu'au 2026-08-19, avec un bon argument (la
  scène fait 1180 × 720 avec des corps de 7 à 13,5 px ; à l'échelle du
  téléphone ils tombent à 2-4 px). Le client l'a renvoyée : « la réplication
  layout du software n'est pas exactement la même que celle qu'on a sur la
  version ordinateur du site ». **La fidélité prime sur la lisibilité du texte
  de la maquette.** C'est une décision, pas un oubli.
- **La largeur à donner est celle de la SCÈNE, pas de la composition.** Les
  pastilles sont ancrées aux bords de la scène et débordent des deux côtés ;
  mesurée, la composition entière fait ~1,33 fois la scène. Donner toute la
  largeur à la scène pousse les pastilles hors de l'écran et rend la page
  glissante latéralement.
- **La scène n'est montée que sous 768 px** (`onPhone` dans `OraHeroMobile`).
  Son conteneur est `md:hidden`, donc sur ordinateur elle serait dans le DOM
  sans jamais être peinte, avec son écouteur `pointermove` qui mesure cinq
  pastilles à chaque mouvement de souris.

---

## Platform Compatibility

**Target:** macOS and Windows (both required)

**Rule:** Any new system-level integration must include a Windows fallback. Never add macOS-only code without a platform check.

---

## Pages

**Page routing:**
- The app uses a simple state-based router in `App.tsx` — no React Router. Pages are managed via `const [page, setPage] = useState<Page>("home")`.
- The `Page` type lives in `App.tsx`: `type Page = "home" | "for-business" | "not-found" | ...`
- **Default rule: any new page that has no design or implementation yet MUST redirect to the `"not-found"` page (404).** In `Navigation.tsx`, link it via `onNavigate("not-found")`. Only replace this once the real page is built.
- The 404 page lives at `src/pages/NotFoundPage.tsx`. It features an animated Ora logo (bars wind into a spinning ring, then return) and a "Retour à l'accueil" button.
- To add a real page: (1) add its key to the `Page` type in `App.tsx`, (2) create `src/pages/YourPage.tsx`, (3) add a render branch in the page conditional in `App.tsx`, (4) update the nav link from `"not-found"` to the new page key.

**Footer:**
- The footer (`src/components/Footer.tsx` → `src/components/ui/footer.tsx`) is rendered **outside** the page conditional in `App.tsx` — it appears on **all pages** by default.
- It receives `onNavigate`, `onBookCall`, and `theme` props from `App.tsx`.

---

## Products and UX Guidelines

**Core UX principles:**
- Intuitive design
- Make it easy to use and push the viewer to book a call

**Key conventions:**
- Animations use Framer Motion; Three.js is reserved for the galaxy/hero background
- Smooth scroll is handled globally by Lenis — don't add competing scroll logic
- Components are `.tsx`, co-located global styles go in `src/index.css` as Tailwind utilities

**Animated multi-line headings (Framer Motion + AnimatePresence):**

To animate a rotating word/phrase on a second line, centered relative to the first line, use two stacked `block` spans inside a `text-center` h1. Do NOT use `inline-grid` with invisible spacers — it creates a box sized to the widest phrase that breaks alignment with sibling lines.

```tsx
<h1 className="... text-center">
  <span className="block">Ligne fixe</span>
  <span className="block relative pb-3" style={{ clipPath: "inset(0 -9999px)" }}>
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        className="inline-block text-brand-gradient whitespace-nowrap"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {phrases[index]}
      </motion.span>
    </AnimatePresence>
  </span>
</h1>
```

- `inline-block` (pas `block`) sur la `motion.span` — **critique** : avec `block`, l'élément prend la largeur du conteneur, pas la largeur du texte. Combiné à `background-clip: text` (utilisé par `.text-brand-gradient`), les caractères qui débordent à droite sont **transparents** (text-fill-color: transparent, sans fond derrière eux) et semblent coupés. `inline-block` dimensionne l'élément au texte exact → dégradé appliqué sur toute la phrase.
- `clipPath: "inset(0 -9999px)"` sur le conteneur (à la place de `overflow-hidden`) — clippe uniquement en vertical (masque le `y: ±40` de l'animation) sans clipper horizontalement, ce qui permettrait à un texte long de déborder dans le conteneur parent `overflow-hidden`.
- `whitespace-nowrap` empêche le retour à la ligne sur les phrases longues.
- `mode="wait"` garantit que l'exit se termine avant l'enter (pas de chevauchement).

---

## Repository Etiquette

**Branching:**
- Always create a feature branch before starting major changes
- NEVER commit directly to main
- Branch naming: `feature/description` or `fix/description`

**Git workflow and major changes:**
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Develop and commit on the feature branch
3. Test locally before pushing
4. Push the branch: `git push -u origin feature/your-feature-name`
5. Create a PR to merge into `main`
6. Use the `/update-docs-and-commit` slash command for commits — this ensures docs are updated alongside code changes

**Commits:**
- Write clear commit messages describing the changes
- Keep commits focused on a single change

**Pull requests:**
- Create PRs for all changes to `main`
- NEVER force push to `main`
- Include description of what changed and why

---

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

---

## Documentation

- [Changelog](CHANGELOG.md) — Version history
- [Inspirations](public/inspirations/) — Website design references / screenshots
- Update docs after major milestones and feature additions

---

## Known gaps (audit of 2026-08-15)

Recorded so they are not rediscovered from scratch. Everything else in that
audit was fixed the same day.

**Blocking, needs the client:**
- **No proof.** Not one customer name, logo, testimonial or case study on the
  whole site. Every name on screen (Nexio, Almadis, Ravel) and every figure is
  demo data. The site asks a finance director for 30 minutes with nothing a
  third party can verify. This is the single biggest conversion gap.
- **No price anchor.** The only mention is "abonnement annuel et
  accompagnement" in the FAQ: no range, no unit, no floor. `/pricing` is in
  `HIDDEN_PAGES` and 404s, while the FAQ points at a quote.
- **`public/demo-automatisation.mp4` is untracked** (9.5 MB, referenced by
  `AutomationTabs.tsx:97`). The "Bilan développé" panel is **empty in
  production** until it is committed.
- **`public/ora_pdf_extract_v3.mp4` is 889 MB**, untracked and referenced
  nowhere; it is what makes `public/` weigh 1 GB. ~40 MB of *tracked* mp4s are
  also unreferenced.

**Known and deliberate, for now:**
- **The ICP split is not honoured in the copy.** The site addresses accounting
  firms structurally, not just lexically: "le FEC légal **de vos clients**",
  "le bilan **de votre client**", "la synthèse **de mission**". A controlling
  team has none of those. `AutomationTabs.tsx:311` already documents the fix
  for the headline; it was never applied anywhere else.
- **Two CTAs compete.** The hero's first button ("Commencer") leaves for an
  external self-serve demo, while the stated objective is booking a call.
  Five booking triggers, two self-serve paths, no hierarchy between them.
- **~300 hard-coded French strings** in the mockups (`AtlasMockups.tsx`,
  the hero wall, `OraHomeMockup`). An English visitor watches a French demo
  for two screens.
- **Per-page social previews need pre-rendering.** `PAGE_META` in `App.tsx`
  sets title/description/canonical per route, and Google runs the JS. LinkedIn,
  Slack and iMessage do not: they all read `index.html`. Fixing it means SSG.
- **The Cal.com iframe has no `title`** and its loading overlay has no
  `role="status"`.
