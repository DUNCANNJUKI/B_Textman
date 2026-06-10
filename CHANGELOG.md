# Changelog

## 2026-06-10 — Cleanup and hosting prep

- Removed embedded Kotlin reference implementation from `src/pages/AndroidClient.tsx` to fix build errors.
- Verified `npm run build` completes successfully and produced `dist/` output.
- Ran `npm run lint` (found existing TypeScript linting issues across the codebase; 98 errors, 19 warnings).
- Uploaded small release notes and pushed fixes to `main` (commit d75cdd0).

Notes:
- Cloudflare Pages deployment requires Cloudflare credentials (API token/account). I can run deployment if you provide them or configure secrets.
- CI (GitHub Actions) was triggered by the push; please check the repository Actions tab for live status.