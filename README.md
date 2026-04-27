# geohashim-landing

Marketing landing page for **geohashim.com** (apex domain), Ahmed Hashim's
personal brand. The product itself — **My Stream** — lives at
`feed.geohashim.com`. This repo is the static marketing site only; every
product CTA links out.

## Stack

- Ionic Angular (standalone) on Angular 20
- Tailwind CSS 3 layered on top of Ionic primitives
- `@angular/ssr` in **static prerender mode** — every route ships as
  pre-rendered HTML
- Amplify Gen 2 (`amplify/`) — minimal stub, no backend resources yet
- Deployed via AWS Amplify Hosting

## Routes

| Path        | Page                            |
| ----------- | ------------------------------- |
| `/`         | Landing                         |
| `/privacy`  | Privacy policy (placeholder)    |
| `/terms`    | Terms of service (placeholder)  |
| `/404`      | Not-found page (also wildcard)  |

All landing copy lives in [`src/app/content.ts`](src/app/content.ts). Edit
it there — templates pull strings from the typed `SITE` object.

## Local development

```bash
npm install
npm start                 # ng serve (Angular dev server)
# or
ionic serve               # Ionic CLI wrapper around the same
```

Open http://localhost:4200 (Angular) or http://localhost:8100 (Ionic).

## Production build (with prerender)

```bash
npm run build:web
```

This runs `ng build` (which prerenders `/`, `/privacy`, `/terms`, `/404`,
plus the wildcard fallback), then writes `www/sitemap.xml` and copies the
prerendered 404 to `www/404.html` for Amplify Hosting.

The output lands in `www/` and is the artifact Amplify Hosting publishes.

## Amplify Gen 2 sandbox

The `amplify/` directory is a **minimal Gen 2 stub** with no backend
resources defined. It's there so future auth/data/storage can be wired in
without re-scaffolding.

All AWS calls use the `hashim_guide` profile (region `us-east-1`):

```bash
npm run amplify:sandbox
# or directly:
npx ampx sandbox --profile hashim_guide
```

When you're done, tear it down:

```bash
npx ampx sandbox delete --profile hashim_guide
```

## Deploying to Amplify Hosting

1. Push this repo to GitHub.
2. In the AWS console (signed in with the `hashim_guide` profile), open
   **Amplify → Hosting** and connect the repo.
3. Amplify auto-detects `amplify.yml`. Confirm:
   - Build command: `npm run build:web`
   - Artifact base directory: `www`
4. Trigger the first build.

### Attaching the apex domain

The product subdomain `feed.geohashim.com` is already attached to a
**different** Amplify app — do **not** detach it.

1. In the new landing app: **Hosting → Custom domains → Add domain**.
2. Enter `geohashim.com`.
3. Amplify will:
   - Create a Route 53 hosted-zone record (or guide you through DNS at
     your registrar) for the **apex** (`A`/`ALIAS`) and `www`.
   - Provision an ACM cert in `us-east-1`.
4. **Do not include `feed.geohashim.com`** in this app's domain config —
   it stays owned by the My Stream app.
5. Verify with `dig geohashim.com` once DNS propagates.

All Amplify CLI commands in scripts and docs use `--profile hashim_guide`.

## Project layout

```
amplify/                    Gen 2 backend stub (no resources yet)
amplify.yml                 Hosting build spec
scripts/
  generate-sitemap.mjs      Post-build sitemap.xml writer
  copy-404.mjs              Copies prerendered 404/index.html to /404.html
src/
  app/
    content.ts              Single source of all landing copy
    app.routes.ts           Browser routes
    app.routes.server.ts    Prerender config
    core/                   SeoService, ThemeService
    layout/                 site-header, site-footer
    sections/               hero, features, how-it-works, testimonial, faq, cta-band
    pages/                  landing, privacy, terms, not-found
  styles/tailwind.css       @tailwind directives + custom @layer utilities
  robots.txt                Static, copied to www/ at build time
  index.html                Base meta, OG tags, font preconnect, theme bootstrap
  server.ts                 Express SSR entry (used only by prerender step)
tailwind.config.js
postcss.config.js
```

## Conventions

- **No analytics SDK** — there's a commented Plausible placeholder in
  `src/index.html`. Uncomment when you're ready to ship analytics.
- **No auth** on the marketing site.
- **Dark mode** is driven by `prefers-color-scheme` plus a header toggle
  that writes `localStorage['geohashim:theme']` (`light` | `dark` |
  `system`). The bootstrap script in `index.html` applies the class
  before first paint to avoid flashing.
