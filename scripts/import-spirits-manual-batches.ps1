# Importa destilados desde data/spirits-urls-manual.txt en lotes (Decántalo/Bodeboca con caché).
# Uso: .\scripts\import-spirits-manual-batches.ps1
# Requiere: HTML en .scrape-cache/spirits/ para sitios bloqueados.

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not $env:RATE_MS) { $env:RATE_MS = "2200" }
if (-not $env:SPIRITS_IMPORT_LIMIT) { $env:SPIRITS_IMPORT_LIMIT = "6000" }

$urlFile = Join-Path $root "data\spirits-urls-manual.txt"
if (-not (Test-Path $urlFile)) {
  Write-Error "Falta $urlFile"
  exit 1
}

$all = Get-Content $urlFile | Where-Object { $_.Trim() -ne "" -and $_ -notmatch '^\s*#' }
$batchSize = 40
New-Item -ItemType Directory -Force -Path (Join-Path $root "logs") | Out-Null

for ($i = 0; $i -lt $all.Count; $i += $batchSize) {
  $end = [Math]::Min($i + $batchSize - 1, $all.Count - 1)
  $chunk = $all[$i..$end]
  $batchNum = [int]($i / $batchSize) + 1
  Write-Host "=== Lote $batchNum — $($chunk.Count) URLs ==="
  $log = Join-Path $root "logs\import-manual-batch-$batchNum.log"
  npm run import:spirits -- --urls @chunk --limit 6000 2>&1 | Tee-Object -FilePath $log -Append
  Start-Sleep -Seconds 15
}

Write-Host "Manual batches done."
