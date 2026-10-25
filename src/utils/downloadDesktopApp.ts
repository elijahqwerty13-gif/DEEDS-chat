// Helper to generate and download native desktop application launchers for Windows PC and macOS

export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.href.split('#')[0];
  }
  return 'https://ais-pre-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app';
}

// 0. Download Windows .exe Native Standalone Executable
export function downloadWindowsExecutable() {
  const a = document.createElement('a');
  a.href = '/downloads/DeedsChat.exe';
  a.download = 'DeedsChat.exe';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 1. Download Windows .bat Native App Setup Script with robust browser detection
export function downloadWindowsAppInstaller() {
  const url = getAppUrl();
  const scriptContent = `@echo off
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

set "APP_URL=${url}"
set "DESKTOP_DIR=%USERPROFILE%\\Desktop"

:: Search for available Chromium browsers to run in standalone borderless app mode
set "APP_EXE="

:: 1. Check Microsoft Edge installations
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "APP_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "APP_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%LocalAppData%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "APP_EXE=%LocalAppData%\\Microsoft\\Edge\\Application\\msedge.exe"
)

:: 2. Check Google Chrome installations
if not defined APP_EXE (
    if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
        set "APP_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
    ) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
        set "APP_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
    ) else if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
        set "APP_EXE=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
    )
)

:: 3. Check Brave Browser installations
if not defined APP_EXE (
    if exist "%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" (
        set "APP_EXE=%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
    ) else if exist "%LocalAppData%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" (
        set "APP_EXE=%LocalAppData%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
    )
)

:: Create Desktop shortcut
if defined APP_EXE (
    echo [+] Detected native app engine:
    echo     "!APP_EXE!"
    echo.
    :: Create Windows .lnk shortcut configured for borderless app window
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_DIR%\\DEEDS CHAT.lnk'); $s.TargetPath = '!APP_EXE!'; $s.Arguments = '--app=\"%APP_URL%\"'; $s.Description = 'DEEDS CHAT — Advanced Messaging'; $s.Save()" 2>nul
    echo [+] Native app shortcut created: "%DESKTOP_DIR%\\DEEDS CHAT.lnk"
)

:: Also create standard internet shortcut as universal fallback
(
echo [InternetShortcut]
echo URL=%APP_URL%
echo IconIndex=0
echo IconFile=%SystemRoot%\\system32\\shell32.dll
) > "%DESKTOP_DIR%\\DEEDS CHAT.url"
echo [+] Web shortcut created: "%DESKTOP_DIR%\\DEEDS CHAT.url"
echo.

:: Launch the application without triggering 'Windows cannot find msedge'
if defined APP_EXE (
    echo [+] Launching DEEDS CHAT in borderless standalone desktop window...
    start "" "!APP_EXE!" --app="%APP_URL%"
) else (
    echo [+] Launching DEEDS CHAT in default browser...
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
`;

  const blob = new Blob([scriptContent], { type: 'application/x-bat' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'DeedsChat-Windows-Setup.bat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

// 2. Download Windows .url Desktop Shortcut directly
export function downloadWindowsShortcut() {
  const url = getAppUrl();
  const content = `[InternetShortcut]
URL=${url}
IconIndex=0
IconFile=shell32.dll,13
`;

  const blob = new Blob([content], { type: 'application/internet-shortcut' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'DEEDS CHAT.url';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

// 3. Download macOS .command Launcher Script
export function downloadMacAppLauncher() {
  const url = getAppUrl();
  const scriptContent = `#!/bin/bash
# DEEDS CHAT macOS App Launcher
# Opens in standalone Chrome/Edge app window without browser toolbars

APP_URL="${url}"

if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="$APP_URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args --app="$APP_URL"
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -na "Brave Browser" --args --app="$APP_URL"
else
    open "$APP_URL"
fi
`;

  const blob = new Blob([scriptContent], { type: 'application/x-sh' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'DeedsChat-Mac-Launcher.command';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
