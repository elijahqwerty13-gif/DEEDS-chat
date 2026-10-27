// Helper to generate and download native desktop application launchers for Windows PC and macOS

export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const base = `${origin}${path}`.replace(/\/+$/, '');
    return `${base}?app=true&standalone=true`;
  }
  return 'https://ais-dev-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app?app=true&standalone=true';
}

export function getFullDownloadUrl(relativeFile: string): string {
  if (typeof window !== 'undefined') {
    const cleanPath = relativeFile.startsWith('/') ? relativeFile : `/${relativeFile}`;
    return `${window.location.origin}${cleanPath}`;
  }
  return `https://ais-dev-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app${relativeFile}`;
}

// 0. Download Windows .exe Native Standalone Executable
export function downloadWindowsExecutable() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('deeds_app_downloaded', 'true');
    } catch {
      // safe ignore
    }
  }

  const fullUrl = getFullDownloadUrl('/downloads/DeedsChat.exe');
  
  // Use target="_blank" so sandboxed preview iframes don't block the download
  const a = document.createElement('a');
  a.href = fullUrl;
  a.download = 'DeedsChat.exe';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 1000);
}

// 1. Download Windows .bat Native App Setup Script
export function downloadWindowsAppInstaller() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('deeds_app_downloaded', 'true');
    } catch {
      // safe ignore
    }
  }

  // First try direct static file download (with target="_blank" for iframe safety)
  const fullUrl = getFullDownloadUrl('/downloads/DeedsChat-Windows-Setup.bat');
  const a = document.createElement('a');
  a.href = fullUrl;
  a.download = 'DeedsChat-Windows-Setup.bat';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 1000);
}

// 2. Download Windows .url Desktop Shortcut directly
export function downloadWindowsShortcut() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('deeds_app_downloaded', 'true');
    } catch {
      // safe ignore
    }
  }

  const fullUrl = getFullDownloadUrl('/downloads/DEEDS-CHAT.url');
  const a = document.createElement('a');
  a.href = fullUrl;
  a.download = 'DEEDS-CHAT.url';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 1000);
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
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    // CRITICAL: Do NOT revoke immediately - allow browser time to read blob
    URL.revokeObjectURL(downloadUrl);
  }, 60000);
}
