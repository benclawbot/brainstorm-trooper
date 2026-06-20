$ErrorActionPreference = 'Stop'

$envFile = Join-Path $HOME '.hermes\.env'
if (-not (Test-Path -LiteralPath $envFile)) {
  throw "MiniMax environment file not found: $envFile"
}

$keyLine = Get-Content -LiteralPath $envFile |
  Where-Object { $_ -match '^MINIMAX_API_KEY=' } |
  Select-Object -First 1

if (-not $keyLine) {
  throw "MINIMAX_API_KEY is not configured in $envFile"
}

$env:MINIMAX_API_KEY = ($keyLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($env:MINIMAX_API_KEY)) {
  throw "MINIMAX_API_KEY is empty in $envFile"
}

Set-Location -LiteralPath $PSScriptRoot
npm run dev
