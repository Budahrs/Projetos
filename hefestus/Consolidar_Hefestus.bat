@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Consolidar_Hefestus.ps1"
echo.
pause
