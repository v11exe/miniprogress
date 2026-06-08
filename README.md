# miniprogress

miniprogress is a tiny, sleek progress tracker for exams, seasons, habits, projects, books, coursework, and any small checklist that feels better with a satisfying progress bar.

the app is static Vite + React + TypeScript. it uses `localStorage` only for progress lists, checklist completion, selected list, theme, progress bar styles, and scheduled auto-complete dates.

## v1.1

v1.1 adds:

- a transparent svg favicon with a white `mp` tab mark
- collapsed goals under the main progress bar
- a compact three-dot list menu with edit and delete
- edit mode for renaming, deleting, adding, and scheduling goals
- optional goal auto-complete with stored ISO date/time values
- safe v1.0 localStorage migration for `barStyle` and `autoCompleteAt`
- 10 selectable progress bar styles
- a progress bar picker in create mode and edit mode
- an updated `/goal` self-check page with all bar previews

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

## development self-check

visit:

```text
/goal
```

the `/goal` page lists the v1.1 acceptance criteria and renders every progress bar style at 64% for quick visual checking.
