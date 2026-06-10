Param()
if (-not $env:CF_API_TOKEN -or -not $env:CF_PAGES_PROJECT) {
  Write-Error "CF_API_TOKEN and CF_PAGES_PROJECT must be set in the environment"
  Write-Host "Usage: $env:CF_API_TOKEN=...; $env:CF_PAGES_PROJECT=...; ./scripts/publish-pages.ps1"
  exit 1
}

Write-Host "Building..."
npm ci
npm run build

Write-Host "Publishing to Cloudflare Pages project: $($env:CF_PAGES_PROJECT)"
npx @cloudflare/wrangler pages publish dist --project-name $env:CF_PAGES_PROJECT --branch main --commit-hash $(git rev-parse --short HEAD)

Write-Host "Publish finished"
