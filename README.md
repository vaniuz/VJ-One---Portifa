# VJ One

Cinematic film portfolio for luxury villas and real estate. Next.js App Router,
statically prerendered, deployed on Vercel.

## Prerequisites

- Node.js `>=22.13.0`

## Quick start

```bash
npm install
npm run dev
```

Runs on <http://localhost:3000>. To reach it from a phone on the same Wi-Fi:

```bash
npm run dev -- -H 0.0.0.0
```

Then open `http://<your-lan-ip>:3000` on the phone.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build into `.next/`
- `npm start` — serve the production build
- `npm run lint` — ESLint

## Deployment

Vercel, with the default Next.js preset. No custom Build Command or Output
Directory is needed — `next build` writes `.next/`, which is what Vercel
expects.

The single route `/` prerenders as static content, so there is no server
runtime to pay for.

## Layout

```
app/
  layout.tsx          metadata, fonts, pre-paint intro flags
  page.tsx            server component + JSON-LD
  site.config.ts      all copy, links and media paths
  globals.css         the whole stylesheet
  components/         Experience, Preloader, Backdrop, Reel, Viewer, …
  lib/                gsap setup, Lenis hook
public/media/         the films
```

Content and behaviour are documented in [CONTENT.md](./CONTENT.md).

## Note on the videos

`public/media/` is about 62 MB and is committed to the repository. That is
workable but not ideal — a video portfolio would be better served from object
storage or a CDN, with `site.config.ts` pointing at those URLs. See CONTENT.md
for the encoding rules if you replace the files.
