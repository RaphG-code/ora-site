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

---

## Design Style Guide

**Visual style:**
- Clean, minimal and modern interface
- Intuitive and clean UI following modern tech SaaS design standards

**Typography:**
- **Headings (h1–h6):** `Poppins` — weights 500/600/700, tight tracking (`tracking-[-0.03em]`)
- **Body / UI:** `Inter` — weights 400/500/600
- Both loaded via Google Fonts in `index.html`
- Tailwind utilities: `font-poppins`, `font-inter`, `font-sans` (defaults to Inter)
- Utility class for brand gradient text: `text-brand-gradient`

**Color palette:**

| Name | Hex | Usage |
|---|---|---|
| Blue | `#3b82f6` | Primary accent, CTAs, gradient start |
| Teal | `#0d9488` | Secondary accent, gradient end |
| Dark background | `#111827` | Dark mode background |
| Light background | `#fcfbf7` | Light mode background (warm off-white) |

Brand gradient: `linear-gradient(to right, #3b82f6, #0d9488)`

> `tailwind.config.cjs` currently has older values (`#2563EB`, `#22d3ee`, `#020617`) — update these when doing the light/dark mode refactor.

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

**Theming — Light / Dark mode:**
- Tailwind is configured with `darkMode: "class"` — the `<html>` element receives `.dark` or `.light`
- Theme follows `prefers-color-scheme` automatically. No localStorage entry = toujours synchronisé avec le système, y compris les changements en live.
- An inline `<script>` in `<head>` (before React loads) applies the class immediately to avoid flash of wrong theme.
- Logo in dark mode: `logo-color-light.png`. Logo in light mode: `logo-color-dark.png`.
- **Ne jamais persister le thème en localStorage sauf si un vrai sélecteur de thème (auto/dark/light) est implémenté.** Le toggle provisoire dans la nav ne sauvegarde rien — session uniquement — pour ne pas bloquer la détection système.
- Clé `"ora-theme-v2"` réservée au futur sélecteur manuel. La clé `"theme"` (ancienne) ne doit jamais être relue — elle était auto-écrite par une version précédente et retourne `"light"` pour tous les anciens visiteurs.

**Languages:**
- UI-facing strings: **French** (labels, buttons, dialogs, log messages) with an **English** version
- Code, comments, variable names, function names: **English**

**Log message format:**
- `✓ Success message` — success
- `✗ Error message` — error
- `⚠ Warning message` — warning

---

## Platform Compatibility

**Target:** macOS and Windows (both required)

**Rule:** Any new system-level integration must include a Windows fallback. Never add macOS-only code without a platform check.

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
