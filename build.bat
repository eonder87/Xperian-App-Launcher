@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\" (
    call npm install
    if errorlevel 1 exit /b 1
)

call npm run dist
if errorlevel 1 exit /b 1

if exist "data\" xcopy "data" "dist\data\" /E /I /Y >nul
if errorlevel 1 exit /b 1

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0code\clean-dist.ps1"
