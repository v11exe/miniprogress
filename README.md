# miniprogress

miniprogress is a tiny, sleek, lowercase progress tracker for exams, seasons, habits, projects, books, coursework, and any small checklist that feels better with a satisfying progress bar.

the app is Vite + React + TypeScript. progress lists, checklist completion, selected list, theme, progress bar styles, and scheduled auto-complete dates stay in `localStorage`.

## v1.3

v1.3 adds:

- responsive polish across phone, tablet, laptop, and desktop sizes so the `miniprogress` title and cards do not crush or overflow on narrow screens
- Party.js-style micro celebrations: short green completion bursts, a subtle progress bar pulse, percentage pop, and quiet background-click bursts only when the focused list is complete
- reduced-motion support that disables particles and keeps only a minimal visual state
- preset sharing that shares the goal structure, not personal completion state
- Cloudflare KV short links at `/p/:id` through Pages Functions
- no-server fallback sharing through `/import#data=...` encoded links
- manual share codes with the `mp1_` prefix
- `.miniprogress.json` export/import
- polished share and import preview screens
- import validation with safe schema, size, label, icon, item-count, bar-style, and ISO-date limits
- scheduled-goal-aware imports: goals with past `autoCompleteAt` values are completed immediately and shown in the preview

## sharing methods

miniprogress v1.3 supports four ways to move a preset between devices or people:

1. **short link** — creates a Cloudflare KV-backed link like `/p/abc123xyz`.
2. **encoded fallback link** — copies a static link like `/import#data=...`; this works without any server or KV binding.
3. **share code** — copies compact text beginning with `mp1_` for manual paste import.
4. **json file** — exports `miniprogress-[preset-name].json` and imports it from the import screen.

if short-link creation fails because KV is not configured, the app shows `short link unavailable` and keeps encoded links, share codes, and file export available.

## local dev

```bash
npm install
npm run dev
```

then open the local Vite URL, usually:

```text
http://127.0.0.1:5173/
```

## scripts

```bash
npm run dev
npm run test
npm run build
npm run preview
```

## cloudflare pages

use these Cloudflare Pages settings:

```text
framework preset: vite
build command: npm run build
build output directory: dist
node version: 20+
```

the production build emits static files into `dist`, suitable for GitHub + Cloudflare Pages.

## cloudflare kv short links

Cloudflare Pages Functions are included for short-link sharing:

- `POST /api/share` validates a `SharedPreset`, stores it in KV, and returns `{ id, url }`.
- `GET /api/preset/:id` reads the preset from KV for `/p/:id` imports.

create a KV namespace in Cloudflare and bind it with this exact name:

```text
PRESETS_KV
```

`wrangler.toml` includes placeholder IDs only:

```toml
[[kv_namespaces]]
binding = "PRESETS_KV"
id = "replace-with-production-kv-id"
preview_id = "replace-with-preview-kv-id"
```

replace those placeholders in your Cloudflare settings or local Wrangler config. do not commit real secrets. stored presets use a 365-day TTL.

## fallback behaviour

KV is an enhancement, not a hard dependency. the frontend continues to work as a static/local app when `PRESETS_KV` is absent or `/api/share` fails. encoded links, share codes, json export, paste import, and file import still work.

## responsive testing note

v1.3 was checked against the target viewport set: 320×568, 360×640, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900, and 1920×1080. the layout uses `svh`, safe-area padding, `clamp()` sizing, internal scrolling for expanded goal/import areas, and viewport-bounded popovers.

## development self-check

visit:

```text
/goal
```

the `/goal` page lists the v1.3 acceptance criteria and renders every progress bar style at 64% for quick visual checking.
