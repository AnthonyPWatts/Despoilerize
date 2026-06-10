$ErrorActionPreference = "Stop"

$distPath = Join-Path $PSScriptRoot "..\dist"
$manifestPath = Join-Path $distPath "manifest.json"

if (-not (Test-Path $manifestPath)) {
  throw "Build output is missing dist\manifest.json. Run npm run build first."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$releaseVersion = [regex]::Match($manifest.version, "^\d+\.\d+").Value
if (-not $releaseVersion) {
  throw "Manifest version '$($manifest.version)' is not a major.minor.patch version."
}

$releaseDir = Join-Path $PSScriptRoot "..\Releases\v$releaseVersion"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

$zipName = "despoilerize-v$($manifest.version)-chrome-web-store.zip"
$zipPath = Join-Path $releaseDir $zipName

if (Test-Path $zipPath) {
  Remove-Item $zipPath
}

Compress-Archive -Path (Join-Path $distPath "*") -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Created $zipPath"
