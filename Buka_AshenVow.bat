@echo off
title Ashen Vow - 2D Dark Fantasy Action Metroidvania
color 0C
chcp 65001 >nul

echo ===============================================================================
echo                     ⚔️ SELAMAT DATANG DI ASHEN VOW ⚔️
echo              2D Dark-Fantasy Metroidvania & Action Combat
echo ===============================================================================
echo.

cd /d "%~dp0"
if exist "ashen-vow" (
    cd ashen-vow
)

echo [INFO] Memeriksa environment Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan di PATH! Silakan install Node.js.
    pause
    exit /b 1
)

echo [INFO] Memulai server lokal Ashen Vow di port 4300...
echo [INFO] Membuka browser ke http://localhost:4300 ...
start "" "http://localhost:4300"
node server.js

pause
