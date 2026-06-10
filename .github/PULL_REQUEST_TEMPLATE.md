## Summary

Brief description of the change and its purpose.

## Changes
- Fix Docker builder to install devDependencies
- Add Cloudflare Pages workflow
- Add CI workflow and Supabase deploy helpers
- Add PM2 ecosystem sample and docs
- Update deployment documentation and env examples

## Testing
- Built locally: `npm ci && npm run build` (confirm `dist/` created)
- Docker image: `docker build -t bspot-network:local .` (optional)

## Checklist
- [ ] I have reviewed the code and docs for accuracy
- [ ] I have added/update relevant environment variable docs
- [ ] CI passes on this branch

## Notes for reviewers
- This branch targets `main` and contains deployment and CI configuration. There may be merge conflicts in `README.md` or `LICENSE` if the remote `main` changed — please resolve as needed.
