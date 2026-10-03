@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js com npm e necessario para iniciar o frontend.
  echo Instale-o em https://nodejs.org/ e execute este arquivo novamente.
  exit /b 1
)

echo Frontend disponivel em http://localhost:5500
call npx --yes serve frontend --listen 5500
