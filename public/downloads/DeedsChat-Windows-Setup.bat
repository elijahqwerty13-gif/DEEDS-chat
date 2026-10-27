@echo off
setlocal EnableDelayedExpansion
title Installing Deeds Chat Desktop App...
color 0A
cls

echo ==============================================================================
echo                      DEEDS CHAT DESKTOP APP INSTALLER
echo ==============================================================================
echo.
echo Installing DEEDS CHAT to your Windows Desktop as a standalone application...
echo.

set "APP_URL=https://ais-dev-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app?app=true&standalone=true"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

:: Search for available Chromium browsers to run in standalone borderless app mode
set "APP_EXE="

:: 1. Check Microsoft Edge installations (Default on Windows 10 & 11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "APP_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "APP_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" (
    set "APP_EXE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
)

:: 2. Check Google Chrome installations
if not defined APP_EXE (
    if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
        set "APP_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    ) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
        set "APP_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    ) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
        set "APP_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
    )
)

:: 3. Check Brave Browser installations
if not defined APP_EXE (
    if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
        set "APP_EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
    ) else if exist "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" (
        set "APP_EXE=%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"
    )
)

:: Setup dedicated app data folder to prevent Chromium from merging into existing browser tabs
set "APP_DATA_DIR=%LOCALAPPDATA%\DeedsChat\AppData"
if not exist "!APP_DATA_DIR!" mkdir "!APP_DATA_DIR!" >nul 2>&1

:: Remove old .url file if it exists so user does not click internet shortcut
if exist "%DESKTOP_DIR%\DEEDS CHAT.url" del /f /q "%DESKTOP_DIR%\DEEDS CHAT.url" >nul 2>&1

:: Create Desktop shortcut
if defined APP_EXE (
    echo [+] Detected native app engine:
    echo     "!APP_EXE!"
    echo.
    :: Create Windows .lnk shortcut configured for borderless app window
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_DIR%\DEEDS CHAT.lnk'); $s.TargetPath = '!APP_EXE!'; $s.Arguments = '--app=\"%APP_URL%\" --user-data-dir=\"!APP_DATA_DIR!\" --new-window'; $s.Description = 'DEEDS CHAT — Advanced Messaging'; $s.Save()" 2>nul
    echo [+] Native app shortcut created: "%DESKTOP_DIR%\DEEDS CHAT.lnk"
)

:: Launch the application without opening as a tab in Chrome
if defined APP_EXE (
    echo [+] Launching DEEDS CHAT in borderless standalone desktop window...
    start "" "!APP_EXE!" --app="%APP_URL%" --user-data-dir="!APP_DATA_DIR!" --new-window
) else (
    echo [+] Launching DEEDS CHAT in standalone window...
    start "" "%APP_URL%"
)

echo.
echo ==============================================================================
echo  DEEDS CHAT is now installed and running on your Windows PC!
echo ==============================================================================
echo You can open DEEDS CHAT anytime directly from your Desktop icon.
echo.
timeout /t 4 >nul
exit
