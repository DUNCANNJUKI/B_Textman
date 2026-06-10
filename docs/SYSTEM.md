System Overview — B Textman
===========================

This document summarizes the architecture, runtime components, and deployment flow for the repository.

1) High-level architecture
--------------------------
- Frontend: Vite + React SPA (TypeScript) living in `src/`. Built artifacts are produced in `dist/`.
- Backend: Supabase (managed Postgres, Edge Functions). Server-side functions are located under `supabase/functions/` and are intended to be deployed to Supabase via the Supabase CLI.
- Migrations: SQL files under `supabase/migrations/` that should be applied in CI or via Supabase migration tooling.

2) Components and responsibilities
---------------------------------
- `src/`: UI, routing, assets, hooks, and pages.
- `supabase/functions/`: Edge Functions (server-side logic) — these run in Supabase's serverless environment.
- `supabase/migrations/`: SQL schema changes and seeds.
- `Dockerfile`: Production multi-stage build to create an `nginx` image that serves `dist`.
- `Dockerfile.dev` and `docker-compose.yml`: Local development containers including optional `postgres` and `redis` services.
- `.github/workflows/`: CI workflows for building and publishing the site, and optional migration/function deployment.

3) Environment variables and secrets
----------------------------------
- Client (frontend, safe to expose):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- Server / CI (must be protected):
  - `SUPABASE_SERVICE_ROLE_KEY` (service role key)
  - `SUPABASE_DB_URL` (database connection URL)
  - `SUPABASE_ACCESS_TOKEN` (Supabase CLI token)
  - `SUPABASE_PROJECT_REF` (project ref used in CI)
  - `CF_API_TOKEN`, `CF_PAGES_PROJECT` (Cloudflare Pages publish)

4) Deployment flow (recommended)
--------------------------------
1. Developer pushes to `main` (or opens PR). CI runs lint, type-check, and `npm run build`.
2. CI uploads `dist` artifact and — if configured — runs Supabase migrations and deploys functions using the Supabase CLI (requires protected secrets).
3. CI publishes `dist` to the selected static host (Cloudflare Pages via `wrangler pages publish` in the included workflow).

5) Docker-based production deploy (optional)
-------------------------------------------
- Build the multi-stage Docker image (builder installs dependencies and runs the build, then nginx serves `dist`).
- Use a container registry to store the image and run in your container platform (Azure Container Instances, AWS ECS, DigitalOcean App Platform, etc.).

6) PM2 usage (for VM/container)
-------------------------------
- Use `ecosystem.config.js` to run `npm run preview` under `pm2` for a simple VM-based host that runs Node to serve the static files. This is useful for private or legacy deployments where you need a persistent server process.

7) Troubleshooting tips
------------------------
- Build fails in Docker builder: ensure the builder installs devDependencies (this repo's `Dockerfile` now uses `npm ci` in the builder stage).
- Large bundle warnings: the build may produce large JS chunks; consider code-splitting or tuning `build.rollupOptions.output.manualChunks` in `vite.config.ts`.
- Windows Docker bind-mounts: `docker-compose.yml` uses bind mounts for development; on Windows prefer named volumes or build inside the container to avoid file-permissions issues.

8) Useful commands
------------------
- Dev server:
  - `npm ci && npm run dev`
- Build:
  - `npm ci && npm run build`
- Docker build:
  - `docker build -t bspot-network:local .`
- Publish to Cloudflare Pages locally (wrangler):
  - `wrangler pages publish dist --project-name <project>`

9) Where changes live
----------------------
- Edit UI and components in `src/`.
- Add or update server logic in `supabase/functions/` and migrations in `supabase/migrations/`.
- Update deployment behavior in `docs/DEPLOYMENT.md`, `Dockerfile`, and workflow files under `.github/workflows/`.

If you want I can also generate a short `CONTRIBUTING.md` and a checklist for releasing a new version.
