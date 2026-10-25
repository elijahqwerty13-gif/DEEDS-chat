import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Edit3,
  Shield,
  Bell,
  UserX,
  HelpCircle,
  LogOut,
  Database,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
  Camera,
  Eye,
  Volume2,
  Download,
  Laptop,
  Upload,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { User, SupabaseConfig } from '../types';
import { sounds } from '../utils/soundEffects';
import { SUPABASE_SETUP_SQL } from '../utils/supabaseSql';
import { getSavedSupabaseConfig, saveSupabaseConfig, resetSupabaseClient } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updated: Partial<User>) => void;
  onSignOut: () => void;
  onOpenInstallModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSignOut,
  onOpenInstallModal,
}) => {
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'editProfile' | 'privacy' | 'notifications' | 'blocked' | 'supabase' | 'help'
  >('main');

  // File input ref for native PC file explorer dialog
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Edit Profile form state
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [statusBio, setStatusBio] = useState(currentUser.statusBio);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);

  // Sync state whenever currentUser changes
  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setUsername(currentUser.username);
    setStatusBio(currentUser.statusBio);
    setAvatarUrl(currentUser.avatarUrl);
    setAvatarError(null);
  }, [currentUser, isOpen]);

  // Handle image file picked from native file explorer
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose a valid image file (PNG, JPG, JPEG, WEBP, GIF)');
      sounds.playTap();
      return;
    }

    // Max 10MB file size limit
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Image is too large. Please select a photo under 10MB.');
      sounds.playTap();
      return;
    }

    setAvatarError(null);
    sounds.playTap();

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        sounds.playSent();
        // If the user changed the photo directly on the main view, persist immediately
        if (activeSubView === 'main') {
          onUpdateUser({ avatarUrl: dataUrl });
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input so same file can be re-selected if desired
  };

  // Privacy state
  const [lastSeenVis, setLastSeenVis] = useState(currentUser.privacySettings.lastSeenVisibility);
  const [readReceipts, setReadReceipts] = useState(currentUser.privacySettings.readReceipts);

  // Notifications state
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());

  // Supabase config state
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSavedSupabaseConfig());
  const [copiedSql, setCopiedSql] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSent();
    onUpdateUser({
      displayName,
      username,
      statusBio,
      avatarUrl,
    });
    setActiveSubView('main');
  };

  const handleSavePrivacy = () => {
    sounds.playTap();
    onUpdateUser({
      privacySettings: {
        ...currentUser.privacySettings,
        lastSeenVisibility: lastSeenVis,
        readReceipts,
      },
    });
    setActiveSubView('main');
  };

  const handleToggleSound = (enabled: boolean) => {
    sounds.setEnabled(enabled);
    setSoundEnabled(enabled);
    if (enabled) sounds.playTap();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    sounds.playTap();
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSupabase = () => {
    sounds.playTap();
    saveSupabaseConfig(supabaseConfig);
    resetSupabaseClient();
    setTestStatus('Configuration saved! Ready to connect.');
    setTimeout(() => setTestStatus(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[#071310] border border-emerald-500/25 p-5 shadow-2xl text-white my-auto flex flex-col h-[620px] max-h-[92vh]">
        {/* Hidden native system file picker for selecting images from PC file explorer */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={handleAvatarFileSelect}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
          <h2 className="text-base font-bold text-white">
            {activeSubView === 'main' && 'Profile & Settings'}
            {activeSubView === 'editProfile' && 'Edit Profile'}
            {activeSubView === 'privacy' && 'Privacy Settings'}
            {activeSubView === 'notifications' && 'Notifications'}
            {activeSubView === 'blocked' && 'Blocked Users'}
            {activeSubView === 'supabase' && 'Supabase Cloud Sync'}
            {activeSubView === 'help' && 'Help & Support'}
          </h2>
          <button
            onClick={() => {
              if (activeSubView !== 'main') {
                setActiveSubView('main');
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. MAIN PROFILE VIEW */}
        {activeSubView === 'main' && (
          <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center">
            {/* Avatar with emerald online dot and quick file explorer open */}
            <div
              onClick={() => {
                sounds.playTap();
                fileInputRef.current?.click();
              }}
              className="relative mb-2 group cursor-pointer"
              title="Click to change profile picture from your PC"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 group-hover:brightness-90 transition-all"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#071310]" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                fileInputRef.current?.click();
              }}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
            >
              <FolderOpen className="w-3 h-3 text-emerald-400" />
              Change Photo from PC
            </button>

            {avatarError && (
              <p className="text-[11px] text-rose-400 mb-2 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {avatarError}
              </p>
            )}

            <h3 className="text-base font-bold text-white">{currentUser.displayName}</h3>
            <p className="text-xs text-emerald-400 font-mono">@{currentUser.username}</p>
            <p className="text-xs text-slate-400 mt-1 italic text-center px-4">"{currentUser.statusBio}"</p>

            {/* Menu List matching screenshot */}
            <div className="w-full mt-5 space-y-1.5">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('editProfile');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('privacy');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Privacy Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('notifications');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('blocked');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <UserX className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Blocked Users</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  if (onOpenInstallModal) {
                    onOpenInstallModal();
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-300 block">
                      Install DEEDS CHAT
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Free install for Android Phone & Windows PC
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('supabase');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-300 block">
                      Supabase Cloud Sync
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {supabaseConfig.isConnected ? 'Connected to Project' : 'Free tier database setup'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubView('help');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Sign Out Button matching screenshot */}
            <div className="w-full mt-5">
              <button
                onClick={() => {
                  sounds.playTap();
                  onSignOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-full bg-transparent hover:bg-rose-500/10 text-emerald-400 hover:text-rose-400 border border-emerald-500/40 hover:border-rose-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* 2. EDIT PROFILE SUBVIEW */}
        {activeSubView === 'editProfile' && (
          <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="flex flex-col items-center">
              <div
                onClick={() => {
                  sounds.playTap();
                  fileInputRef.current?.click();
                }}
                className="relative mb-2 group cursor-pointer"
                title="Click to open file explorer and select photo"
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-xl shadow-emerald-950/40 group-hover:brightness-90 transition-all"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
                  <Upload className="w-5 h-5 mb-0.5" />
                  <span>Browse PC</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playTap();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg transition-transform active:scale-95"
                  title="Open File Explorer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Action buttons: Open local file explorer or reset */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <FolderOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                  Choose Photo from PC
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName || 'deeds'}`;
                    setAvatarUrl(defaultAvatar);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Reset to default avatar"
                >
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  Reset
                </button>
              </div>

              {avatarError ? (
                <p className="text-[11px] text-rose-400 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {avatarError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Opens Windows / system file explorer to upload photo
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">About / Status</label>
              <textarea
                rows={3}
                value={statusBio}
                onChange={(e) => setStatusBio(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* 3. PRIVACY SUBVIEW */}
        {activeSubView === 'privacy' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Who can see my Last Seen & Online
              </label>
              <div className="space-y-1.5">
                {(['everyone', 'friends', 'nobody'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLastSeenVis(opt)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs capitalize transition-colors ${
                      lastSeenVis === opt
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {lastSeenVis === opt && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <h4 className="text-xs font-medium text-white">Read Receipts</h4>
                  <p className="text-[11px] text-slate-400">Show double green checkmarks when read</p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSavePrivacy}
              className="w-full py-3 mt-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20"
            >
              Update Privacy
            </button>
          </div>
        )}

        {/* 4. NOTIFICATIONS SUBVIEW */}
        {activeSubView === 'notifications' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-medium text-white">In-App Chat Sounds</h4>
                  <p className="text-[11px] text-slate-400">Sent, received, and voice recording chimes</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => handleToggleSound(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 5. BLOCKED USERS */}
        {activeSubView === 'blocked' && (
          <div className="flex-1 overflow-y-auto py-6 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">You haven't blocked any users.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Blocked contacts will not be able to send you messages or view your online status.
            </p>
          </div>
        )}

        {/* 6. SUPABASE CLOUD SYNC & SQL SCRIPT SUBVIEW */}
        {activeSubView === 'supabase' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/25">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Zero-Cost Supabase Integration</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Connect your free Supabase project to synchronize real-time messaging, Row Level
                Security (RLS), and media across all your devices.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Step 1: Run Database Schema
                </label>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy SQL
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Copy this schema, paste into Supabase SQL Editor, and click "Run".
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) =>
                  setSupabaseConfigState({
                    ...supabaseConfig,
                    url: e.target.value,
                    isConnected: !!(e.target.value && supabaseConfig.anonKey),
                  })
                }
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJh..."
                value={supabaseConfig.anonKey}
                onChange={(e) =>
                  setSupabaseConfigState({
                    ...supabaseConfig,
                    anonKey: e.target.value,
                    isConnected: !!(supabaseConfig.url && e.target.value),
                  })
                }
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            {testStatus && <p className="text-xs text-emerald-400 text-center">{testStatus}</p>}

            <button
              type="button"
              onClick={handleSaveSupabase}
              className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20"
            >
              Save Credentials
            </button>
          </div>
        )}

        {/* 7. HELP & SUPPORT */}
        {activeSubView === 'help' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
              <h4 className="text-xs font-semibold text-emerald-400 mb-1">About Deeds Chat</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Deeds Chat is an advanced, ultra-responsive messaging application engineered with a
                dark glassmorphic UI, emerald accents, and end-to-end security models.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
              <h4 className="text-xs font-semibold text-white mb-1">Email Verification</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Accounts are registered via email with 6-digit verification codes. No phone number is
                ever required.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
              <h4 className="text-xs font-semibold text-white mb-1">Free Tier Guarantee</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All features utilize free-tier cloud architectures (Supabase Free PostgreSQL & Auth),
                ensuring zero cost for personal and community use.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
