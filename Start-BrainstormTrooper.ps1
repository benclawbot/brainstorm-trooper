$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$viteCli = Join-Path $PSScriptRoot 'node_modules/vite/bin/vite.js'
if (-not (Test-Path -LiteralPath $viteCli)) {
    $npmCli = Join-Path (Split-Path $nodeExe) 'node_modules/npm/bin/npm-cli.js'
    & $nodeExe $npmCli ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
Write-Host 'Open http://127.0.0.1:3002 and choose Continue with ChatGPT.'
& $nodeExe $viteCli
