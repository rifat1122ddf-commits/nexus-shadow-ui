@echo off
title NEXUS SHADOW — Server Uninstaller
cd /d "%~dp0"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

del "%STARTUP%\nexus-shadow.vbs" 2>nul
del "%~dp0start-bg.vbs" 2>nul

echo.
echo  [OK] Server removed from Windows Startup.
echo.
pause
