$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not $env:OPENAI_API_KEY -and -not (Test-Path '.env.local')) {
  Write-Host 'Set OPENAI_API_KEY or create .env.local to enable AI features.'
}
npm run dev
