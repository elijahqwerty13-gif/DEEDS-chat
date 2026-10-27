#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <stdio.h>
#include <string.h>
#include <wchar.h>

// Default App URL for DEEDS CHAT (Active live instance with standalone parameters)
static const wchar_t* DEFAULT_APP_URL = L"https://ais-dev-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app?app=true&standalone=true";

// Helper: Check if file exists
static BOOL FileExists(const wchar_t* path) {
    if (!path || path[0] == 0) return FALSE;
    DWORD dwAttrib = GetFileAttributesW(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

// Helper: Clean surrounding quotes from registry string
static void StripQuotes(wchar_t* str) {
    if (!str || str[0] == 0) return;
    size_t len = wcslen(str);
    if (str[0] == L'"') {
        if (len > 1 && str[len - 1] == L'"') {
            str[len - 1] = 0;
            len--;
        }
        wmemmove(str, str + 1, len);
    }
}

// Helper: Query browser executable from Windows Registry App Paths
static BOOL GetBrowserFromRegistry(HKEY rootKey, const wchar_t* exeName, wchar_t* outPath, DWORD maxLen) {
    wchar_t subKey[MAX_PATH];
    swprintf(subKey, MAX_PATH, L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\%s", exeName);
    
    HKEY hKey;
    if (RegOpenKeyExW(rootKey, subKey, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        DWORD dwType = REG_SZ;
        DWORD dwSize = maxLen * sizeof(wchar_t);
        LONG res = RegQueryValueExW(hKey, NULL, NULL, &dwType, (LPBYTE)outPath, &dwSize);
        RegCloseKey(hKey);
        if (res == ERROR_SUCCESS && outPath[0] != 0) {
            StripQuotes(outPath);
            if (FileExists(outPath)) {
                return TRUE;
            }
        }
    }
    return FALSE;
}

// Helper: Find Edge, Chrome, or Chromium browser executable
static BOOL LocateChromiumBrowser(wchar_t* browserPath, DWORD maxLen) {
    browserPath[0] = 0;

    // 1. Try Windows Registry (Edge is default on Windows 10/11)
    if (GetBrowserFromRegistry(HKEY_LOCAL_MACHINE, L"msedge.exe", browserPath, maxLen)) return TRUE;
    if (GetBrowserFromRegistry(HKEY_CURRENT_USER, L"msedge.exe", browserPath, maxLen)) return TRUE;
    if (GetBrowserFromRegistry(HKEY_LOCAL_MACHINE, L"chrome.exe", browserPath, maxLen)) return TRUE;
    if (GetBrowserFromRegistry(HKEY_CURRENT_USER, L"chrome.exe", browserPath, maxLen)) return TRUE;
    if (GetBrowserFromRegistry(HKEY_LOCAL_MACHINE, L"brave.exe", browserPath, maxLen)) return TRUE;

    // 2. Try Standard Program Files (x86) and Program Files
    wchar_t pf[MAX_PATH] = {0};
    wchar_t pfx86[MAX_PATH] = {0};
    wchar_t localApp[MAX_PATH] = {0};

    GetEnvironmentVariableW(L"ProgramFiles(x86)", pfx86, MAX_PATH);
    GetEnvironmentVariableW(L"ProgramFiles", pf, MAX_PATH);
    SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localApp);

    const wchar_t* candidateDirs[] = { pfx86, pf, localApp, L"C:\\Program Files (x86)", L"C:\\Program Files" };
    const wchar_t* browserRelPaths[] = {
        L"\\Microsoft\\Edge\\Application\\msedge.exe",
        L"\\Google\\Chrome\\Application\\chrome.exe",
        L"\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        NULL
    };

    for (int b = 0; browserRelPaths[b] != NULL; b++) {
        for (int d = 0; d < 5; d++) {
            if (candidateDirs[d] && candidateDirs[d][0] != 0) {
                wchar_t testPath[MAX_PATH];
                swprintf(testPath, MAX_PATH, L"%s%s", candidateDirs[d], browserRelPaths[b]);
                if (FileExists(testPath)) {
                    wcsncpy(browserPath, testPath, maxLen);
                    return TRUE;
                }
            }
        }
    }

    return FALSE;
}

// Setup Desktop presence: Delete misleading .url file, copy self as DEEDS CHAT.exe
static void SetupDesktopApp(void) {
    wchar_t desktopPath[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktopPath))) {
        // Delete old internet shortcut if present so user doesn't open a browser tab
        wchar_t oldUrlShortcut[MAX_PATH];
        swprintf(oldUrlShortcut, MAX_PATH, L"%s\\DEEDS CHAT.url", desktopPath);
        DeleteFileW(oldUrlShortcut);

        // Copy current running exe to Desktop as "DEEDS CHAT.exe"
        wchar_t currentExe[MAX_PATH];
        if (GetModuleFileNameW(NULL, currentExe, MAX_PATH) > 0) {
            wchar_t destExe[MAX_PATH];
            swprintf(destExe, MAX_PATH, L"%s\\DEEDS CHAT.exe", desktopPath);
            // Only copy if not already running directly from Desktop
            if (_wcsicmp(currentExe, destExe) != 0) {
                CopyFileW(currentExe, destExe, FALSE);
            }
        }
    }
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    wchar_t appUrl[2048];
    wcscpy(appUrl, DEFAULT_APP_URL);

    // If an argument is passed (e.g. custom URL), use it
    int argc = 0;
    LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);
    if (argc > 1 && argv != NULL) {
        if (wcsstr(argv[1], L"http://") || wcsstr(argv[1], L"https://")) {
            wcsncpy(appUrl, argv[1], 2047);
        }
    }
    if (argv) LocalFree(argv);

    // Install standalone icon on Desktop
    SetupDesktopApp();

    // Prepare isolated User Data Directory (%LOCALAPPDATA%\DeedsChat\AppData)
    // CRITICAL: Providing a dedicated user-data-dir prevents Chromium from delegating
    // to an existing, already-running Chrome/Edge browser session (which opens as a new tab).
    // Instead, it FORCES a completely independent, standalone app window to open.
    wchar_t userDataDir[MAX_PATH] = {0};
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, userDataDir))) {
        wcscat(userDataDir, L"\\DeedsChat");
        CreateDirectoryW(userDataDir, NULL);
        wcscat(userDataDir, L"\\AppData");
        CreateDirectoryW(userDataDir, NULL);
    }

    // Locate browser
    wchar_t browserPath[MAX_PATH] = {0};
    BOOL foundBrowser = LocateChromiumBrowser(browserPath, MAX_PATH);

    if (foundBrowser && browserPath[0] != 0) {
        // Build dedicated standalone application command line
        // --app="URL" : Runs as an application window (no address bar, no tabs, no toolbars)
        // --user-data-dir="DIR" : Forces an isolated instance so it NEVER merges into an open browser tab
        // --new-window : Forces creation of a dedicated top-level window
        // --window-size=1280,820 : Ideal responsive desktop size for DEEDS CHAT
        wchar_t cmdLine[4096];
        if (userDataDir[0] != 0) {
            swprintf(cmdLine, 4096,
                L"\"%s\" --app=\"%s\" --user-data-dir=\"%s\" --new-window --window-size=1280,820 --app-id=\"DeedsChatDesktop\"",
                browserPath, appUrl, userDataDir);
        } else {
            swprintf(cmdLine, 4096,
                L"\"%s\" --app=\"%s\" --new-window --window-size=1280,820 --app-id=\"DeedsChatDesktop\"",
                browserPath, appUrl);
        }

        STARTUPINFOW si;
        PROCESS_INFORMATION pi;
        ZeroMemory(&si, sizeof(si));
        si.cb = sizeof(si);
        ZeroMemory(&pi, sizeof(pi));

        if (CreateProcessW(NULL, cmdLine, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return 0;
        }

        // Fallback: ShellExecute with app parameter
        wchar_t fallbackArgs[3000];
        if (userDataDir[0] != 0) {
            swprintf(fallbackArgs, 3000, L"--app=\"%s\" --user-data-dir=\"%s\" --new-window --window-size=1280,820", appUrl, userDataDir);
        } else {
            swprintf(fallbackArgs, 3000, L"--app=\"%s\" --new-window --window-size=1280,820", appUrl);
        }
        HINSTANCE hRes = ShellExecuteW(NULL, L"open", browserPath, fallbackArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) {
            return 0;
        }
    }

    // Ultimate fallback if no chromium browser detected
    ShellExecuteW(NULL, L"open", appUrl, NULL, NULL, SW_SHOWNORMAL);
    return 0;
}
