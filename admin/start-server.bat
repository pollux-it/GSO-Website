@echo off
title GSO Admin Server
cd /d "C:\Users\U\.gemini\antigravity\scratch\GSO Website\admin"
echo.
echo ========================================
echo   GSO Vehicle Entry System - Admin
echo ========================================
echo.
echo Starting server...
echo.

:: Kill any existing node process on port 3000
taskkill /F /IM node.exe >nul 2>&1

:: Wait a moment
timeout /t 1 /nobreak >nul

:: Start the server
start /b npm start

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open browser
echo Opening admin panel in browser...
start http://localhost:3000

echo.
echo Server is running at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server, or close this window.
echo.

:: Keep the window open
cmd /k
