import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
  Laptop,
  Apple,
  RefreshCw,
  Info,
} from 'lucide-react';
import { DeedsLogo } from './DeedsLogo';
import { sounds } from '../utils/soundEffects';
import {
  downloadWindowsExecutable,
  downloadWindowsAppInstaller,
  downloadWindowsShortcut,
  downloadMacAppLauncher,
  getAppUrl,
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
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'pc' | 'ios'>('android');

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

  const handleDownloadExe = () => {
    sounds.playSent();
    downloadWindowsExecutable();
    localStorage.setItem('deeds_app_downloaded', 'true');
    onAppDownloaded?.();
    setDownloadSuccess('DeedsChat.exe downloaded! Run it directly on your Windows PC.');
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  const handleDownloadPC = () => {
    sounds.playSent();
    downloadWindowsAppInstaller();
    localStorage.setItem('deeds_app_downloaded', 'true');
    onAppDownloaded?.();
    setDownloadSuccess('DeedsChat-Windows-Setup.bat downloaded! Run it on your PC to install.');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleDownloadShortcut = () => {
    sounds.playSent();
    downloadWindowsShortcut();
    localStorage.setItem('deeds_app_downloaded', 'true');
    onAppDownloaded?.();
    setDownloadSuccess('DEEDS CHAT.url downloaded! Drag it to your PC Desktop.');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleOpenStandaloneWindow = () => {
    sounds.playTap();
    const url = getAppUrl();
    window.open(url, '_blank', 'popup=yes,width=1280,height=820,menubar=no,toolbar=no,location=no,status=no');
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
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-1 mb-5">
          <DeedsLogo size="md" showText={true} />
          <h3 className="text-lg font-bold text-white mt-2">Install DEEDS CHAT</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Free standalone app installation on Android phones and Windows PCs.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center p-1 rounded-full bg-slate-950/80 border border-emerald-500/25 mb-5">
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedPlatform('android');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
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
              setSelectedPlatform('pc');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
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
              setSelectedPlatform('ios');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
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
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: ANDROID PHONE
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
                Installs DEEDS CHAT directly to your Android home screen and app launcher. Runs full-screen with zero browser address bar, custom app icons, fast launch, and offline app shell caching.
              </p>
              <button
                onClick={() => {
                  sounds.playTap();
                  onInstallClick();
                }}
                className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Install on Android Phone Now
              </button>
            </div>

            {/* Fallback steps for Android Chrome / Brave / Edge / Samsung Internet */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Info className="w-3.5 h-3.5" />
                <span>Manual Step-by-Step for Android Browsers:</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Open <strong>Chrome</strong>, <strong>Brave</strong>, or <strong>Edge</strong> on your Android phone.
                </li>
                <li>
                  Tap the <strong>3-dots menu (⋮)</strong> in the top-right corner.
                </li>
                <li>
                  Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                </li>
                <li>
                  Tap <strong>"Install"</strong> to confirm. DEEDS CHAT will be added to your Android phone home screen!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: WINDOWS PC
        ========================================================================= */}
        {selectedPlatform === 'pc' && (
          <div className="space-y-3.5">
            {/* Top Action: Browser Native PWA Install */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 shadow-xl shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">Browser PWA App Install (Chrome & Edge)</h4>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black font-mono tracking-wide">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                Installs DEEDS CHAT as a native Windows desktop application via Chrome or Edge. Adds a desktop icon and taskbar pin with borderless native window.
              </p>
              <button
                onClick={() => {
                  sounds.playTap();
                  onInstallClick();
                }}
                className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Install DEEDS CHAT on Windows PC
              </button>
            </div>

            {/* Standalone .exe program */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-white">Windows Standalone Program (.exe)</h5>
                <p className="text-[10px] text-slate-400">Direct 64-bit DeedsChat.exe executable</p>
              </div>
              <button
                onClick={handleDownloadExe}
                className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .exe
              </button>
            </div>

            {/* Secondary Action: Windows Installer (.bat) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-white">Desktop Shortcut Setup (.bat)</h5>
                <p className="text-[10px] text-slate-400">Auto-detects browser and creates Desktop icon</p>
              </div>
              <button
                onClick={handleDownloadPC}
                className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .bat
              </button>
            </div>

            {/* Open borderless popup window */}
            <button
              onClick={handleOpenStandaloneWindow}
              className="w-full py-2.5 rounded-xl text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Or test as a borderless popup window now</span>
            </button>
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
            </div>
          </div>
        )}

        {/* How Updates Work Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/15 flex items-start gap-2.5 text-left">
          <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-emerald-300">How Updates Work:</strong> DEEDS CHAT uses an automated background Service Worker. Every time you open or refresh the app, it checks for updates without disrupting your active chat or signing you out. All future updates are 100% free and automatic.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">PWA & Standalone Client v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
