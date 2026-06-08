$ErrorActionPreference = "Stop"

$distPath = Join-Path $PSScriptRoot "..\dist"
$manifestPath = Join-Path $distPath "manifest.json"

if (-not (Test-Path $manifestPath)) {
  throw "Build output is missing dist\manifest.json. Run npm run build first."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$zipName = "despoilerize-v$($manifest.version)-chrome-web-store.zip"
$zipPath = Join-Path $PSScriptRoot "..\$zipName"

if (Test-Path $zipPath) {
  Remove-Item $zipPath
}

Compress-Archive -Path (Join-Path $distPath "*") -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Created $zipName"
