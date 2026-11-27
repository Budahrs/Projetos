@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Axiom Studio - servidor
rem Uso: Iniciar_Axiom_Studio.bat            -> abre o editor
rem      Iniciar_Axiom_Studio.bat heartpulse -> abre o arquivo final HeartPulse NOC (dist\HeartPulse_NOC.html)
set "PAGE="
if /i "%~1"=="heartpulse" set "PAGE=heartpulse"

if not exist "requirements.txt" (
  echo ERRO: requirements.txt nao encontrado nesta pasta.
  pause
  exit /b 1
)

rem Um .venv copiado de outro computador aponta para um Python que nao existe aqui. Se estiver quebrado,
rem ele e renomeado (nada e apagado) e um novo e criado.
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import sys" >nul 2>nul
  if errorlevel 1 (
    echo O ambiente virtual existente nao funciona neste computador. Recriando...
    if exist ".venv_quebrado" rmdir /s /q ".venv_quebrado"
    ren ".venv" ".venv_quebrado"
  )
)

if not exist ".venv\Scripts\python.exe" (
  call :achar_python
  if not defined PYEXE (
    echo ERRO: Python 3.10 ou superior nao encontrado. Instale em python.org ^(marque "Add Python to PATH"^) e tente novamente.
    pause
    exit /b 1
  )
  echo Criando ambiente virtual com: !PYEXE!
  "!PYEXE!" -m venv .venv
  if errorlevel 1 (
    echo ERRO: nao foi possivel criar o ambiente virtual.
    pause
    exit /b 1
  )
)

rem Instala dependencias apenas quando requirements mudou (inicio bem mais rapido).
powershell -NoProfile -Command "if((Test-Path '.venv\.deps_ok') -and ((Get-Item '.venv\.deps_ok').LastWriteTime -ge (Get-Item 'requirements.txt').LastWriteTime)){exit 0}else{exit 1}"
if errorlevel 1 (
  echo Instalando dependencias do Axiom Studio...
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo ERRO: falha ao instalar dependencias.
    pause
    exit /b 1
  )
  echo ok> ".venv\.deps_ok"
)

rem Capturas VNC reais (opcional): vncdotool fica em requirements-vnc.txt
if exist "requirements-vnc.txt" if not exist ".venv\.vnc_ok" (
  echo Instalando suporte opcional a capturas VNC...
  ".venv\Scripts\python.exe" -m pip install -r requirements-vnc.txt && echo ok> ".venv\.vnc_ok"
)

rem Se o servidor ja esta rodando, so abre a janela.
powershell -NoProfile -Command "try{(Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:5000/api/health).StatusCode|Out-Null;exit 0}catch{exit 1}"
if not errorlevel 1 goto :abrir

start "Axiom Studio - servidor" /min ".venv\Scripts\python.exe" main.py
echo Aguardando o servidor...
powershell -NoProfile -Command "$ok=$false;1..40|%%{try{Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:5000/api/health|Out-Null;$ok=$true;break}catch{Start-Sleep -Milliseconds 500}};if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
  echo ERRO: o servidor nao respondeu. Rode ".venv\Scripts\python.exe main.py" para ver a mensagem.
  pause
  exit /b 1
)

:abrir
rem Janela de aplicativo (sem barra de abas) no Edge ou Chrome; se nenhum existir, usa o navegador padrao.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://127.0.0.1:5000/%PAGE%';$a=@('--app='+$u,'--window-size=1600,900');try{Start-Process msedge -ArgumentList $a -ErrorAction Stop}catch{try{Start-Process chrome -ArgumentList $a -ErrorAction Stop}catch{Start-Process $u}}"
exit /b 0

:achar_python
rem Procura um Python 3 que funcione: AXIOM_PYTHON, py launcher, PATH e as pastas padrao de instalacao.
set "PYEXE="
if defined AXIOM_PYTHON if exist "%AXIOM_PYTHON%" set "PYEXE=%AXIOM_PYTHON%"
if not defined PYEXE (
  for /f "delims=" %%P in ('py -3 -c "import sys;print(sys.executable)" 2^>nul') do if not defined PYEXE set "PYEXE=%%P"
)
if not defined PYEXE (
  for /f "delims=" %%P in ('python -c "import sys;print(sys.executable)" 2^>nul') do if not defined PYEXE set "PYEXE=%%P"
)
if not defined PYEXE (
  for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*" "%ProgramFiles%\Python3*" "C:\Python3*") do (
    if exist "%%~D\python.exe" set "PYEXE=%%~D\python.exe"
  )
)
exit /b 0
