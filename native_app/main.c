#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <stdio.h>
#include <string.h>

// Default App URL for DEEDS CHAT
static const wchar_t* DEFAULT_APP_URL = L"https://ais-pre-mixt7zivclg5wbafshxqyr-224292306975.europe-west2.run.app";

// Helper: Check if file exists
static BOOL FileExists(const wchar_t* path) {
    DWORD dwAttrib = GetFileAttributesW(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

// Helper: Create Desktop Shortcut (.url format - 100% reliable without COM initialization issues)
static void CreateDesktopShortcut(const wchar_t* targetUrl) {
    wchar_t desktopPath[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktopPath))) {
        wchar_t shortcutFile[MAX_PATH];
        swprintf(shortcutFile, MAX_PATH, L"%s\\DEEDS CHAT.url", desktopPath);
        
        // Write internet shortcut file
        FILE* fp = _wfopen(shortcutFile, L"w");
        if (fp) {
            fwprintf(fp, L"[InternetShortcut]\n");
            fwprintf(fp, L"URL=%s\n", targetUrl);
            fwprintf(fp, L"IconIndex=0\n");
            fwprintf(fp, L"IconFile=%%SystemRoot%%\\system32\\shell32.dll\n");
            fclose(fp);
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

    // Create desktop shortcut for easy access
    CreateDesktopShortcut(appUrl);

    // Detect browser path to launch in standalone window mode (no address bar)
    wchar_t browserPath[MAX_PATH] = {0};
    wchar_t localApp[MAX_PATH];
    wchar_t programFiles[MAX_PATH];
    wchar_t programFilesX86[MAX_PATH];

    // Check LocalAppData
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localApp))) {
        wchar_t edgeLocal[MAX_PATH], chromeLocal[MAX_PATH], braveLocal[MAX_PATH];
        swprintf(edgeLocal, MAX_PATH, L"%s\\Microsoft\\Edge\\Application\\msedge.exe", localApp);
        swprintf(chromeLocal, MAX_PATH, L"%s\\Google\\Chrome\\Application\\chrome.exe", localApp);
        swprintf(braveLocal, MAX_PATH, L"%s\\BraveSoftware\\Brave-Browser\\Application\\brave.exe", localApp);

        if (FileExists(edgeLocal)) {
            wcscpy(browserPath, edgeLocal);
        } else if (FileExists(chromeLocal)) {
            wcscpy(browserPath, chromeLocal);
        } else if (FileExists(braveLocal)) {
            wcscpy(browserPath, braveLocal);
        }
    }

    // Check ProgramFiles and ProgramFiles (x86)
    if (browserPath[0] == 0) {
        const wchar_t* paths[] = {
            L"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            L"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            L"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            L"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            L"C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
            NULL
        };

        for (int i = 0; paths[i] != NULL; i++) {
            if (FileExists(paths[i])) {
                wcscpy(browserPath, paths[i]);
                break;
            }
        }
    }

    if (browserPath[0] != 0) {
        // Launch in standalone borderless desktop window
        wchar_t args[3000];
        swprintf(args, 3000, L"--app=\"%s\" --window-size=1280,820", appUrl);
        ShellExecuteW(NULL, L"open", browserPath, args, NULL, SW_SHOWNORMAL);
    } else {
        // Fallback: Open in default browser
        ShellExecuteW(NULL, L"open", appUrl, NULL, NULL, SW_SHOWNORMAL);
    }

    return 0;
}
