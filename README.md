B Textman — frontend SPA and Supabase functions

Overview
--------
This repository contains a Vite + React single-page application (SPA) and a set of Supabase Edge Functions + SQL migrations used by the backend. The frontend is built into a static `dist/` folder and can be hosted on static hosts (Cloudflare Pages, Vercel, Netlify, GitHub Pages) or served from a Docker + nginx image.

Quick links
- `src/` — frontend source code (React + TypeScript)
- `supabase/functions/` — server-side functions (deployed to Supabase)
- `supabase/migrations/` — SQL migrations
- `Dockerfile` — production multi-stage Dockerfile producing an nginx image
- `Dockerfile.dev` — development Dockerfile used by `docker-compose.yml`
- `docker-compose.yml` — local dev containers (postgres, redis, app)
- `ecosystem.config.js` — sample PM2 config for VM/container deployments
- `.env.example` — required environment variables template
- `docs/DEPLOYMENT.md` — deployment instructions and notes
- `.github/workflows/` — CI / deploy workflows (Cloudflare Pages, GitHub Pages, etc.)

Prerequisites
-------------
- Node.js 18+
- npm (or `pnpm` if you prefer; repo contains `pnpm-lock.yaml` but CI/workflows default to `npm ci`)
- Docker (optional, for building the production image locally)

Local development
-----------------
1. Install dependencies:

```bash
npm ci
```

2. Run the dev server (Vite):

```bash
npm run dev
# open http://localhost:8080
```

3. For backend functions and local Supabase, follow `supabase/` README and use `supabase start` if running locally.

Build & preview
-----------------
Create a production build:

```bash
npm ci
npm run build
```

Preview locally using Vite preview:

```bash
npm run preview
# by default it serves on port 5173; ecosystem.config.js shows an example running preview on 8080
```

Docker (production image)
-------------------------
Build the production nginx image (multi-stage):

```bash
docker build -t bspot-network:local .
docker run -p 8080:80 bspot-network:local
# open http://localhost:8080
```

Cloudflare Pages (recommended static host)
-----------------------------------------
- Build command: `npm ci && npm run build`
- Build output directory: `dist`
- Required Pages env vars (Production & Preview):

```env
VITE_SUPABASE_URL=https://rtgcrclgmvcmrjpvtpwm.supabase.co
VITE_SUPABASE_ANON_KEY=<PASTE_YOUR_ANON_PUBLIC_KEY>
NODE_ENV=production
VITE_DEV_MODE=false
```

CI & Deploy
-----------
- A GitHub Actions workflow is included at `.github/workflows/deploy-cloudflare-pages.yml` which uses `wrangler pages publish` to push `dist` to Cloudflare Pages. It requires two repository secrets: `CF_API_TOKEN` and `CF_PAGES_PROJECT`.
- The `ci-deploy.yml` workflow performs lint, type-check, build, optional Supabase migrations/functions deployment (requires Supabase secrets), and publishes `dist` to GitHub Pages when configured.

Supabase functions & migrations
-------------------------------
- This repository contains Supabase Edge Functions under `supabase/functions/` and migration SQL in `supabase/migrations/`.
- Deploy functions and migrations from CI using the Supabase CLI. Store the following secrets in your CI provider (do NOT expose them in frontend env):
	- `SUPABASE_ACCESS_TOKEN` — for `supabase` CLI authentication
	- `SUPABASE_PROJECT_REF` — project short ref (already present in `.env.example`)
	- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` — for server-side migration actions

Notes on PM2
-----------
- `pm2` is provided for running a Node process on a VM/container (not for Cloudflare Pages). For serving the static site on a VM you can run `npm run preview` under `pm2` using `ecosystem.config.js`.

Where to look next
------------------
- CI workflows: `.github/workflows/`
- Deployment docs: `docs/DEPLOYMENT.md`
- Env template: `.env.example`

Support
-------
If you want me to: run a Docker build locally, open a PR to merge the `deploy-configs` branch into `main`, or generate a Cloudflare `wrangler` token creation guide, tell me which and I will proceed.

