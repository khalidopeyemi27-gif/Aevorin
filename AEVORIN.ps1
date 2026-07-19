# ──────────────────────────────────────────────────────────
# AEVORIN v0.1 Alpha — PowerShell Launcher
# The Professional Operating System for Authors
# ──────────────────────────────────────────────────────────

$ErrorActionPreference = "SilentlyContinue"
$Host.UI.RawUI.WindowTitle = "AEVORIN v0.1 Alpha — Writing Engine"

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                      ║" -ForegroundColor Cyan
    Write-Host "  ║              A E V O R I N   v0.1                    ║" -ForegroundColor Cyan
    Write-Host "  ║                                                      ║" -ForegroundColor Cyan
    Write-Host "  ║      The Professional Operating System for Authors   ║" -ForegroundColor Cyan
    Write-Host "  ║                                                      ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

Write-Banner

# ── Step 1: Check Node.js ─────────────────────────────────
Write-Host "  [1/4] Checking Node.js installation..." -ForegroundColor Yellow

$nodeVersion = $null
try {
    $nodeVersion = & node --version 2>$null
} catch {}

if (-not $nodeVersion) {
    Write-Host ""
    Write-Host "  ERROR: Node.js is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "  AEVORIN requires Node.js 18+ to run." -ForegroundColor White
    Write-Host "  Download: https://nodejs.org/en/download" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  After installing, restart this launcher." -ForegroundColor White
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}

# Parse major version
$majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($majorVersion -lt 18) {
    Write-Host ""
    Write-Host "  WARNING: Node.js $nodeVersion detected." -ForegroundColor Yellow
    Write-Host "  AEVORIN recommends Node.js 18+." -ForegroundColor Yellow
    Write-Host "  Update: https://nodejs.org/en/download" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "        Node.js $nodeVersion detected. OK." -ForegroundColor Green
Write-Host ""

# ── Step 2: Resolve Paths ─────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendEntry = Join-Path $scriptDir "backend\server.js"
$clientDir = Join-Path $scriptDir "client"

if (-not (Test-Path $backendEntry)) {
    Write-Host "  ERROR: backend\server.js not found." -ForegroundColor Red
    Write-Host "  Make sure this script is in the AEVORIN root folder." -ForegroundColor White
    Read-Host "  Press Enter to exit"
    exit 1
}

# ── Step 3: Start Backend ─────────────────────────────────
Write-Host "  [2/4] Starting AEVORIN Core Engine..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "node" -ArgumentList $backendEntry -WindowStyle Minimized -PassThru

Start-Sleep -Seconds 3

# ── Step 4: Verify Backend ────────────────────────────────
Write-Host "  [3/4] Verifying engine connection..." -ForegroundColor Yellow

$connected = $false
for ($i = 0; $i -lt 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/status" -Method Get -TimeoutSec 2
        if ($response.status -eq "online") {
            $connected = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($connected) {
    Write-Host "        Core Engine connected. OK." -ForegroundColor Green
} else {
    Write-Host "        WARNING: Engine may still be starting. Refresh browser if needed." -ForegroundColor Yellow
}
Write-Host ""

# ── Step 5: Start Frontend ────────────────────────────────
Write-Host "  [4/4] Starting AEVORIN Writing Interface..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npx" -ArgumentList "vite --port 5180 --strictPort --host" -WorkingDirectory $clientDir -WindowStyle Minimized -PassThru

Start-Sleep -Seconds 4

# ── Step 6: Open Browser ──────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║                                                      ║" -ForegroundColor Green
Write-Host "  ║        AEVORIN is ready.                             ║" -ForegroundColor Green
Write-Host "  ║                                                      ║" -ForegroundColor Green
Write-Host "  ║        Opening browser to:                           ║" -ForegroundColor Green
Write-Host "  ║        http://localhost:5180                          ║" -ForegroundColor Green
Write-Host "  ║                                                      ║" -ForegroundColor Green
Write-Host "  ║        Keep this window open while writing.          ║" -ForegroundColor Green
Write-Host "  ║        Press Enter to shut down AEVORIN.             ║" -ForegroundColor Green
Write-Host "  ║                                                      ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:5180"

Read-Host "  Press Enter to stop AEVORIN"

# ── Cleanup ───────────────────────────────────────────────
Write-Host ""
Write-Host "  Shutting down AEVORIN..." -ForegroundColor Yellow

if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
}
if ($frontendProcess -and -not $frontendProcess.HasExited) {
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}

# Kill any lingering node processes on port 5000
$portProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $portProcess) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Write-Host "  AEVORIN stopped. Goodbye." -ForegroundColor Cyan
Start-Sleep -Seconds 2
