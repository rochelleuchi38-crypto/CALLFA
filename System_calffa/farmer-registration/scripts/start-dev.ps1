<#
Start both services and frontend for local development on Windows (PowerShell).

This script opens three new PowerShell windows:
- ML API (python) on default port 5001
- Node backend on default port 5000 (backend will proxy to ML_API_URL)
- Frontend (Vite) dev server

Usage: run from the repo root (or double-click the file in Explorer):
  ./scripts/start-dev.ps1

You can set ports by editing the variables below if required.
#>

# ensure we are running from script folder root
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot = Split-Path -Parent $Root

$ApiDir = Join-Path $RepoRoot 'api'
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'farmer-registration'

# Default ports and urls
$MLPort = 5001
$BackendPort = 5000
$FrontendPort = 5173
$MLUrl = "http://127.0.0.1:$MLPort"

Write-Host "Starting development services:" -ForegroundColor Cyan
Write-Host "- ML API (Flask) -> $MLUrl" -ForegroundColor Yellow
Write-Host "- Backend -> http://127.0.0.1:$BackendPort (ML_API_URL=$MLUrl)" -ForegroundColor Yellow
Write-Host "- Frontend -> http://127.0.0.1:$FrontendPort" -ForegroundColor Yellow

function Start-WindowedProcess($cwd, $command) {
    # Launch each service in a new PowerShell window
    $escapedCmd = $command -replace '"','\"'
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location -Path '$cwd'; $escapedCmd"
}

# Start ML API
Start-WindowedProcess $ApiDir "`$env:PORT='$MLPort'; python app.py"

# Start backend and tell it where the ML API is
Start-WindowedProcess $BackendDir "`$env:ML_API_URL='$MLUrl'; npm run start"

# Start frontend (Vite)
Start-WindowedProcess $FrontendDir "npm run dev"

Write-Host "Launched processes — check the new windows for logs." -ForegroundColor Green
