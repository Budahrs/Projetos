@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Criar_Atalho_Axiom_Studio.ps1"
if errorlevel 1 (echo ERRO ao criar o atalho.) else (echo Pronto: atalhos criados na Area de Trabalho.)
timeout /t 4 >nul
