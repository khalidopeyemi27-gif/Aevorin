@echo off
title AEVORIN v0.1 Alpha — Writing Engine
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║              A E V O R I N   v0.1                    ║
echo  ║                                                      ║
echo  ║      The Professional Operating System for Authors   ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────────────────────
:: Step 1: Check Node.js
:: ─────────────────────────────────────────────────────────
echo  [1/4] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  ERROR: Node.js is not installed.                    ║
    echo  ║                                                      ║
    echo  ║  AEVORIN requires Node.js 18+ to run.               ║
    echo  ║                                                      ║
    echo  ║  Download it from:                                   ║
    echo  ║  https://nodejs.org/en/download                      ║
    echo  ║                                                      ║
    echo  ║  After installing, restart this launcher.            ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo         Node.js %NODE_VER% detected. OK.
echo.

:: ─────────────────────────────────────────────────────────
:: Step 2: Start Backend Server
:: ─────────────────────────────────────────────────────────
echo  [2/4] Starting AEVORIN Core Engine...
start /min "AEVORIN Backend" cmd /c "cd /d %~dp0 && node backend/server.js"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: Verify backend is responding
echo  [3/4] Verifying engine connection...
curl -s http://localhost:5000/api/status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo         Waiting for engine startup...
    timeout /t 3 /nobreak >nul
    curl -s http://localhost:5000/api/status >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  WARNING: Backend may still be starting.
        echo           The browser will open — refresh if needed.
        echo.
    ) else (
        echo         Core Engine connected. OK.
    )
) else (
    echo         Core Engine connected. OK.
)
echo.

:: ─────────────────────────────────────────────────────────
:: Step 3: Start Frontend Dev Server
:: ─────────────────────────────────────────────────────────
echo  [4/4] Starting AEVORIN Writing Interface...
start /min "AEVORIN Frontend" cmd /c "cd /d %~dp0client && npx vite --port 5180 --strictPort --host"

:: Wait for Vite to initialize
timeout /t 4 /nobreak >nul

:: ─────────────────────────────────────────────────────────
:: Step 4: Open Browser
:: ─────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║        AEVORIN is ready.                             ║
echo  ║                                                      ║
echo  ║        Opening browser to:                           ║
echo  ║        http://localhost:5180                          ║
echo  ║                                                      ║
echo  ║        Keep this window open while writing.          ║
echo  ║        Close this window to shut down AEVORIN.       ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

start "" http://localhost:5180

echo  Press any key to stop AEVORIN...
pause >nul

:: ─────────────────────────────────────────────────────────
:: Cleanup: Kill backend and frontend processes
:: ─────────────────────────────────────────────────────────
echo.
echo  Shutting down AEVORIN...
taskkill /fi "WINDOWTITLE eq AEVORIN Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq AEVORIN Frontend" /f >nul 2>&1
echo  AEVORIN stopped. Goodbye.
timeout /t 2 /nobreak >nul
