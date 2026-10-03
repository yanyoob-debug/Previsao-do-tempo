@echo off
setlocal
cd /d "%~dp0"

start "Previsao do Tempo - Backend" cmd /k call "%~dp0iniciar-backend.bat"
start "Previsao do Tempo - Frontend" cmd /k call "%~dp0iniciar-frontend.bat"
