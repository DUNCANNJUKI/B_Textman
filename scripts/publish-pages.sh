#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CF_API_TOKEN-}" ] || [ -z "${CF_PAGES_PROJECT-}" ]; then
  echo "CF_API_TOKEN and CF_PAGES_PROJECT must be set in the environment"
  echo "Usage: CF_API_TOKEN=... CF_PAGES_PROJECT=... ./scripts/publish-pages.sh"
  exit 1
fi

echo "Building..."
npm ci
npm run build

echo "Publishing to Cloudflare Pages project: $CF_PAGES_PROJECT"
npx @cloudflare/wrangler pages publish dist --project-name "$CF_PAGES_PROJECT" --branch main --commit-hash "${GITHUB_SHA-$(git rev-parse --short HEAD)}"

echo "Publish finished"
