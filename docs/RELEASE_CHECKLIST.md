Release & Deployment Checklist
=============================

Use this checklist when merging `deploy-configs` into `main` and deploying to production.

Pre-merge
- [ ] Review files changed in `deploy-configs` branch
- [ ] Resolve any merge conflicts (README, LICENSE)
- [ ] Ensure `package-lock.json` or `pnpm-lock.yaml` is the single lockfile used by your CI

CI / Secrets
- [ ] Add repository secrets:
  - `CF_API_TOKEN` (Cloudflare Pages publish token)
  - `CF_PAGES_PROJECT` (Cloudflare Pages project name)
  - `SUPABASE_ACCESS_TOKEN` (Supabase CLI token)
  - `SUPABASE_PROJECT_REF` (Supabase project ref)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `SUPABASE_DB_URL` (server-only)

Merge & Deploy
- [ ] Create PR from `deploy-configs` -> `main` and request review
- [ ] Merge when CI passes
- [ ] Confirm Cloudflare Pages build logs show successful build and publish

Post-deploy checks
- [ ] Verify site is live at Pages URL
- [ ] Test key user flows (login, messaging, device registration)
- [ ] Check Supabase functions and DB migrations ran successfully (if applied)
- [ ] Monitor logs and analytics for errors
