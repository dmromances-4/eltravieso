# Portadas de recetas — preflight + piloto + batch auto
# Uso: powershell -ExecutionPolicy Bypass -File scripts/run-recipe-covers-batch.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== 1. Preflight ===" -ForegroundColor Cyan
npm run check:recipe-covers -- --quick
if ($LASTEXITCODE -ne 0) {
  Write-Host "Preflight falló. Añade GEMINI_API_KEY + PEXELS o UNSPLASH en .env.local" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== 2. Auditoría ===" -ForegroundColor Cyan
npm run audit:recipe-covers

Write-Host "`n=== 3. Piloto discover-only (20) ===" -ForegroundColor Cyan
npm run generate:recipe-images -- --discover-only --limit 20

Write-Host "`n=== 4. Batch auto en background ===" -ForegroundColor Cyan
npm run generate:recipe-images:bg

Write-Host "`nMonitor: npm run generate:recipe-images:status"
Write-Host "Log: .scrape-cache/recipe-covers/batch.log"
