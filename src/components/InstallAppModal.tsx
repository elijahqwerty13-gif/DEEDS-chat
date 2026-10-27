import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  Check,
  ExternalLink,
  Laptop,
  Apple,
  RefreshCw,
  Info,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { DeedsLogo } from './DeedsLogo';
import { sounds } from '../utils/soundEffects';
import {
  downloadWindowsExecutable,
  downloadWindowsAppInstaller,
  downloadWindowsShortcut,
  getAppUrl,
  getFullDownloadUrl,
} from '../utils/downloadDesktopApp';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  onInstallClick: () => void;
  onAppDownloaded?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  isAndroid,
  onInstallClick,
  onAppDownloaded,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'pc' | 'ios'>('pc');
  const [copiedLink, setCopiedLink] = useState(false);
  const [androidGuidance, setAndroidGuidance] = useState(false);

  const appUrl = getAppUrl();
  const exeUrl = getFullDownloadUrl('/downloads/DeedsChat.exe');
  const batUrl = getFullDownloadUrl('/downloads/DeedsChat-Windows-Setup.bat');

  // Auto-select platform based on client device
  useEffect(() => {
    if (isAndroid) {
      setSelectedPlatform('android');
    } else if (isIOS) {
      setSelectedPlatform('ios');
    } else {
      setSelectedPlatform('pc');
    }
  }, [isAndroid, isIOS, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async (urlToCopy: string, label: string) => {
    sounds.playTap();
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedLink(true);
      setDownloadSuccess(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedLink(false);
        setDownloadSuccess(null);
      }, 4000);
    } catch {
      setDownloadSuccess(`Link: ${urlToCopy}`);
    }
  };

  const handleAndroidInstallClick = () => {
    sounds.playTap();
    if (isInstallable) {
      onInstallClick();
    } else {
      // In preview iframe or when BeforeInstallPrompt is deferred, show immediate instructions
      setAndroidGuidance(true);
      setDownloadSuccess('Follow the 2 simple steps below to install on your Android phone!');
      setTimeout(() => setDownloadSuccess(null), 5000);
    }
  };

  const notifyDownloadStarted = (fileName: string) => {
    sounds.playSent();
    try {
      localStorage.setItem('deeds_app_downloaded', 'true');
    } catch {
      // safe ignore
    }
    onAppDownloaded?.();
    setDownloadSuccess(`Downloading ${fileName}... If blocked by browser, click "Copy Link" to paste directly!`);
    setTimeout(() => setDownloadSuccess(null), 8000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto animate-in fade-in duration-200 select-none text-white"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#06120e] border border-emerald-500/30 p-6 shadow-2xl text-white my-auto overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-1 mb-5">
          <DeedsLogo size="md" showText={true} />
          <h3 className="text-lg font-bold text-white mt-2">Download DEEDS CHAT</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Free standalone application for Windows PC and Android phones.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center p-1 rounded-full bg-slate-950/80 border border-emerald-500/25 mb-5">
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedPlatform('pc');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'pc'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Windows PC</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setSelectedPlatform('android');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Phone</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setSelectedPlatform('ios');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedPlatform === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* Feedback message upon download */}
        {downloadSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{downloadSuccess}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: WINDOWS PC
        ========================================================================= */}
        {selectedPlatform === 'pc' && (
          <div className="space-y-3.5 text-left">
            {/* Top Primary Action: Direct Standalone .exe Program */}
            <div className="p-4 rounded-2xl bg-emerald-950/50 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/15 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">Windows Standalone Client (.exe)</h4>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black font-mono tracking-wide shadow-sm">
                  STANDALONE .EXE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                64-bit Windows launcher (<code className="text-emerald-300 font-mono">DeedsChat.exe</code>). Launches in a dedicated borderless window with its own isolated profile, no browser address bars, and no merging into existing Chrome tabs.
              </p>

              {/* Direct Download Link + Copy Link Fallback */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={exeUrl}
                  download="DeedsChat.exe"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => notifyDownloadStarted('DeedsChat.exe')}
                  className="flex-1 py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download DeedsChat.exe</span>
                </a>

                <button
                  onClick={() => handleCopyLink(exeUrl, 'DeedsChat.exe Direct Link')}
                  className="py-3 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-semibold border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy direct download link"
                >
                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Link</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Compatible with all Windows 10 & 11 PCs (Edge, Chrome, Brave)</span>
              </p>
            </div>

            {/* Secondary Action: Windows Setup Script (.bat) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-white">Desktop Shortcut Script (.bat)</h5>
                <p className="text-[10px] text-slate-400">Creates desktop icon and launches standalone app</p>
              </div>
              <a
                href={batUrl}
                download="DeedsChat-Windows-Setup.bat"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => notifyDownloadStarted('DeedsChat-Windows-Setup.bat')}
                className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .bat
              </a>
            </div>

            {/* Open in Full Browser Window (Outside Iframe) */}
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-xs text-emerald-400 border border-emerald-500/25 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Browser Tab (Enables 1-Click Browser Install)</span>
            </a>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ANDROID PHONE
        ========================================================================= */}
        {selectedPlatform === 'android' && (
          <div className="space-y-3.5 text-left">
            {/* Primary Action: Direct One-Click Install */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 shadow-xl shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">One-Click Android App Install</h4>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black font-mono tracking-wide">
                  FREE PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                Installs DEEDS CHAT directly to your Android home screen and app launcher. Runs full-screen with custom app icons, fast launch, and offline caching.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAndroidInstallClick}
                  className="flex-1 py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Install on Android Phone</span>
                </button>

                <button
                  onClick={() => handleCopyLink(appUrl, 'Android App Link')}
                  className="py-3 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-semibold border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy link to open on phone"
                >
                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy App Link</span>
                </button>
              </div>
            </div>

            {/* Fallback steps for Android Chrome / Brave / Edge / Samsung Internet */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Info className="w-3.5 h-3.5" />
                <span>How to Install on Your Android Phone:</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Open <strong>Chrome</strong> or <strong>Edge</strong> on your Android phone and visit this app URL.
                </li>
                <li>
                  Tap the <strong>3-dots menu (⋮)</strong> at the top right of Chrome.
                </li>
                <li>
                  Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </li>
                <li>
                  Tap <strong>"Install"</strong> to confirm. The DEEDS CHAT icon will appear in your phone's app list!
                </li>
              </ol>

              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Chrome Tab Now</span>
              </a>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: IPHONE / IPAD (IOS)
        ========================================================================= */}
        {selectedPlatform === 'ios' && (
          <div className="space-y-3.5 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Apple className="w-4 h-4" />
                <span>On iPhone / iPad (Safari):</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Open this page in <strong>Safari</strong> on your iPhone or iPad.
                </li>
                <li>
                  Tap the <Share2 className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />{' '}
                  <strong>Share</strong> button on the bottom toolbar.
                </li>
                <li>
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />{' '}
                  <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner. The DEEDS CHAT icon will appear on your home screen!
                </li>
              </ol>

              <button
                onClick={() => handleCopyLink(appUrl, 'DEEDS CHAT App Link')}
                className="w-full mt-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy App Link to Open in Safari</span>
              </button>
            </div>
          </div>
        )}

        {/* How Updates Work Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/15 flex items-start gap-2.5 text-left">
          <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-emerald-300">Automatic Updates:</strong> DEEDS CHAT updates automatically in the background every time you open or refresh the application.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">PWA & Standalone Client v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
