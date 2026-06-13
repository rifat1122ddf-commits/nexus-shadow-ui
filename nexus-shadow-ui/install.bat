@echo off
title NEXUS SHADOW — Server Installer
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   NEXUS SHADOW — SERVER INSTALLER    ║
echo  ╚══════════════════════════════════════╝
echo.

:: Create Startup folder shortcut
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SCRIPT_DIR=%~dp0"

:: Create VBS script for silent background launch
echo Set WshShell = CreateObject("WScript.Shell") > "%SCRIPT_DIR%\start-bg.vbs"
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%" >> "%SCRIPT_DIR%\start-bg.vbs"
echo WshShell.Run "node server.js", 0, False >> "%SCRIPT_DIR%\start-bg.vbs"

:: Create Startup VBS
echo Set WshShell = CreateObject("WScript.Shell") > "%STARTUP%\nexus-shadow.vbs"
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%" >> "%STARTUP%\nexus-shadow.vbs"
echo WshShell.Run "node server.js", 0, False >> "%STARTUP%\nexus-shadow.vbs"

echo  [OK] Server added to Windows Startup
echo  [OK] Server will auto-start on every boot
echo.
echo  To start NOW: double-click "start-server.bat"
echo  To uninstall: double-click "uninstall.bat"
echo.
pause
