/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InfoDrawer } from './components/InfoDrawer';
import { AuthModal } from './components/AuthModal';
import { FindFriendsModal } from './components/FindFriendsModal';
import { NewGroupModal } from './components/NewGroupModal';
import { SettingsModal } from './components/SettingsModal';
import { ChannelsView } from './components/ChannelsView';
import { CallModal } from './components/CallModal';
import { MediaLightbox } from './components/MediaLightbox';
import { InstallAppModal } from './components/InstallAppModal';
import { DeedsLogo } from './components/DeedsLogo';
import {
  CURRENT_USER,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_CHANNELS,
  INITIAL_FRIEND_REQUESTS,
  SUGGESTED_FRIENDS,
  CONTACT_USERS,
  ChannelItem,
} from './data/seedData';
import { Conversation, Message, User, FriendRequest, ReplyContext } from './types';
import { sounds } from './utils/soundEffects';
import { usePWAInstall } from './utils/usePWAInstall';
import {
  initializeAuthSession,
  signOutUser,
  setStoredSessionUser,
} from './lib/authService';
import { getSupabaseClient } from './lib/supabase';
import {
  Smartphone,
  Monitor,
  Database,
  Sparkles,
  Download,
  Minus,
  Square,
  X,
  Maximize2,
  Minimize2,
  Lock,
  MoreVertical,
  Check,
} from 'lucide-react';

export default function App() {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);

  // Core state
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [channels, setChannels] = useState<ChannelItem[]>(INITIAL_CHANNELS);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS);

  // Client layout mode: 'desktop' or 'phone'
  const [clientMode, setClientMode] = useState<'desktop' | 'phone'>('desktop');
  const [isShowingMobileChat, setIsShowingMobileChat] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);

  // Navigation & selection
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv_sarah');
  const [activeNavTab, setActiveNavTab] = useState<'chats' | 'contacts' | 'channels' | 'settings'>('chats');

  // PWA install hook
  const { isInstallable, isStandalone, isIOS, isAndroid, triggerInstall } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [hasDownloadedApp, setHasDownloadedApp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const isStandaloneQuery =
      urlParams.get('app') === 'true' ||
      urlParams.get('standalone') === 'true' ||
      urlParams.get('mode') === 'desktop' ||
      window.location.search.includes('standalone=true') ||
      window.location.search.includes('app=true');
    const isStandaloneDisplay =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    const active =
      localStorage.getItem('deeds_app_downloaded') === 'true' ||
      isStandaloneQuery ||
      isStandaloneDisplay;

    if (active) {
      try {
        localStorage.setItem('deeds_app_downloaded', 'true');
      } catch {
        // safe ignore
      }
    }
    return active;
  });

  // Header 3-dot options menu
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Modals & Panels
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'welcome' | 'create' | 'login' | 'verify' | 'features' | 'forgot';
  }>({ isOpen: false, mode: 'welcome' });
  const [findFriendsOpen, setFindFriendsOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    type: 'audio' | 'video';
  }>({ isOpen: false, type: 'audio' });
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name?: string } | null>(null);

  // Network connectivity status for safe PWA offline mode
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore authenticated session on mount and listen to changes
  useEffect(() => {
    let isMounted = true;
    initializeAuthSession().then((user) => {
      if (isMounted && user) {
        setCurrentUser(user);
      }
    });

    const client = getSupabaseClient();
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (client) {
      const { data } = client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const email = session.user.email || '';
          const name = userMeta.full_name || email.split('@')[0] || 'User';
          const restored: User = {
            id: session.user.id,
            displayName: name,
            username: userMeta.username || name.toLowerCase().replace(/\s+/g, ''),
            email: email,
            avatarUrl: userMeta.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            statusBio: userMeta.status_bio || 'Available on DEEDS CHAT',
            onlineStatus: 'online',
            lastSeen: 'Active now',
            privacySettings: {
              lastSeenVisibility: 'everyone',
              readReceipts: true,
              profilePhotoVisibility: 'everyone',
            },
            isEmailVerified: !!session.user.email_confirmed_at,
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          if (isMounted) {
            setCurrentUser(restored);
            setStoredSessionUser(restored);
          }
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  // Responsive screen size listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setClientMode('phone');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messagesByConv[activeConversationId] || [] : [];

  // ==========================================
  // MESSAGE HANDLERS
  // ==========================================
  const handleSendMessage = (
    text: string,
    type: 'text' | 'image' | 'voice' | 'file' = 'text',
    attachmentUrl?: string,
    attachmentName?: string,
    audioDuration?: number,
    replyTo?: ReplyContext
  ) => {
    if (!activeConversationId) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderName: 'You',
      senderAvatar: currentUser.avatarUrl,
      text,
      type,
      attachmentUrl,
      attachmentName,
      audioDuration,
      status: 'read',
      replyTo,
      reactions: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }));

    // Update conversation last message & timestamp
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.createdAt,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setMessagesByConv((prev) => ({
      ...prev,
      [activeConversationId]: prev[activeConversationId].filter((m) => m.id !== messageId),
    }));
  };

  const handleTogglePinMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setMessagesByConv((prev) => ({
      ...prev,
      [activeConversationId]: prev[activeConversationId].map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      ),
    }));
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    setMessagesByConv((prev) => ({
      ...prev,
      [activeConversationId]: prev[activeConversationId].map((m) => {
        if (m.id !== messageId) return m;
        const existingIdx = m.reactions.findIndex((r) => r.emoji === emoji);
        let updatedReactions = [...m.reactions];

        if (existingIdx >= 0) {
          const userIdx = updatedReactions[existingIdx].userIds.indexOf(currentUser.id);
          if (userIdx >= 0) {
            updatedReactions[existingIdx].userIds.splice(userIdx, 1);
            updatedReactions[existingIdx].count -= 1;
            if (updatedReactions[existingIdx].count <= 0) {
              updatedReactions.splice(existingIdx, 1);
            }
          } else {
            updatedReactions[existingIdx].userIds.push(currentUser.id);
            updatedReactions[existingIdx].count += 1;
          }
        } else {
          updatedReactions.push({
            emoji,
            count: 1,
            userIds: [currentUser.id],
          });
        }

        return { ...m, reactions: updatedReactions };
      }),
    }));
  };

  // ==========================================
  // FRIEND & CONTACT HANDLERS
  // ==========================================
  const handleSendFriendRequest = (email: string, targetUser?: User) => {
    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      senderId: currentUser.id,
      senderEmail: currentUser.email,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      receiverId: targetUser?.id || `user_${Date.now()}`,
      receiverEmail: email,
      status: 'pending',
      createdAt: 'Just now',
    };
    setSentRequests((prev) => [newReq, ...prev]);
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const req = receivedRequests.find((r) => r.id === requestId);
    if (!req) return;

    sounds.playSent();
    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));

    // Create a new direct conversation with the friend
    const newConvId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      type: 'direct',
      name: req.senderName,
      avatarUrl: req.senderAvatar,
      description: `Connected via ${req.senderEmail}`,
      memberIds: [currentUser.id, req.senderId],
      members: [
        currentUser,
        {
          id: req.senderId,
          email: req.senderEmail,
          username: req.senderName.toLowerCase().replace(/\s+/g, ''),
          displayName: req.senderName,
          avatarUrl: req.senderAvatar,
          statusBio: 'Hey there! I am using Deeds Chat.',
          onlineStatus: 'online',
          lastSeen: 'Just now',
          privacySettings: { lastSeenVisibility: 'everyone', readReceipts: true, profilePhotoVisibility: 'everyone' },
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      wallpaper: 'emerald-mesh',
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
      lastMessage: {
        id: `msg_welcome_${Date.now()}`,
        conversationId: newConvId,
        senderId: req.senderId,
        senderName: req.senderName,
        text: 'Friend request accepted! Say hi 👋',
        type: 'text',
        status: 'read',
        reactions: [],
        createdAt: 'Just now',
      },
    };

    setConversations((prev) => [newConv, ...prev]);
    setMessagesByConv((prev) => ({
      ...prev,
      [newConvId]: [newConv.lastMessage!],
    }));
    setActiveConversationId(newConvId);
    setFindFriendsOpen(false);
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    sounds.playTap();
    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // ==========================================
  // GROUP CHAT CREATION
  // ==========================================
  const handleCreateGroup = (
    name: string,
    description: string,
    memberIds: string[],
    avatarUrl?: string
  ) => {
    const newId = `conv_group_${Date.now()}`;
    const selectedUsers = SUGGESTED_FRIENDS.filter((u) => memberIds.includes(u.id));

    const newGroup: Conversation = {
      id: newId,
      type: 'group',
      name,
      description,
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80',
      memberIds: [currentUser.id, ...memberIds],
      members: [currentUser, ...selectedUsers],
      adminIds: [currentUser.id],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      wallpaper: 'emerald-mesh',
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
      lastMessage: {
        id: `msg_ginit_${Date.now()}`,
        conversationId: newId,
        senderId: currentUser.id,
        senderName: 'You',
        text: 'You created this group',
        type: 'text',
        status: 'read',
        reactions: [],
        createdAt: 'Just now',
      },
    };

    setConversations((prev) => [newGroup, ...prev]);
    setMessagesByConv((prev) => ({
      ...prev,
      [newId]: [newGroup.lastMessage!],
    }));
    setActiveConversationId(newId);
  };

  // ==========================================
  // CHANNELS TOGGLE
  // ==========================================
  const handleToggleChannelJoin = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isJoined: !c.isJoined } : c))
    );
  };

  // ==========================================
  // CALL CONTROLS
  // ==========================================
  const startCall = (type: 'audio' | 'video') => {
    if (!activeConversation) return;
    setCallState({ isOpen: true, type });
  };

  // Fullscreen and window handlers
  const toggleFullscreen = () => {
    sounds.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K -> Find Friends / Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sounds.playTap();
        setFindFriendsOpen(true);
      }
      // Escape -> close any open modals
      if (e.key === 'Escape') {
        setFindFriendsOpen(false);
        setNewGroupOpen(false);
        setSettingsOpen(false);
        setInstallModalOpen(false);
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Screen resize listener for initial platform detection
  useEffect(() => {
    if (window.innerWidth < 768) {
      setClientMode('phone');
    }
  }, []);

  const handleInstallClick = async () => {
    sounds.playTap();
    const outcome = await triggerInstall();
    if (outcome === 'manual') {
      setInstallModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020605] text-slate-100 font-sans overflow-hidden select-none">
      {/* =========================================================================
          NATIVE CLIENT WINDOW TITLEBAR (Mac / Windows Desktop App Chrome)
      ========================================================================= */}
      <header className="h-11 bg-[#040c09] border-b border-emerald-500/20 px-3 flex items-center justify-between z-30 shrink-0 select-none shadow-sm">
        {/* Left: Window Controls + Logo and App Name attached near it */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 mr-1">
            <button
              onClick={() => {
                sounds.playTap();
                if (confirm('Close Deeds Chat application?')) {
                  window.close();
                }
              }}
              className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 border border-rose-600/50 transition-colors cursor-pointer"
              title="Close window"
            />
            <button
              onClick={() => {
                sounds.playTap();
                setIsWindowMinimized(!isWindowMinimized);
              }}
              className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 border border-amber-600/50 transition-colors cursor-pointer"
              title="Minimize window"
            />
            <button
              onClick={toggleFullscreen}
              className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/50 transition-colors cursor-pointer"
              title="Toggle fullscreen"
            />
          </div>

          <DeedsLogo size="sm" showText={true} layout="horizontal" />
        </div>

        {/* Right: 3-dot Menu containing all actions (Modes, Install, Showcase, Database, Fullscreen) */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.playTap();
              setHeaderMenuOpen(!headerMenuOpen);
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              headerMenuOpen
                ? 'text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
            title="Options & Menu"
            aria-label="Options & Menu"
            aria-expanded={headerMenuOpen}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          {headerMenuOpen && (
            <>
              {/* Invisible backdrop to dismiss menu on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setHeaderMenuOpen(false)}
              />

              <div className="absolute right-0 top-10 w-72 rounded-2xl bg-[#06120d]/95 backdrop-blur-xl border border-emerald-500/30 p-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-2">
                {/* Client Mode Switcher */}
                <div className="px-2 pt-1 pb-1">
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1.5">
                    Client View Mode
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setClientMode('desktop');
                        setHeaderMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        clientMode === 'desktop'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                      {clientMode === 'desktop' && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setClientMode('phone');
                        setHeaderMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        clientMode === 'phone'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Phone</span>
                      {clientMode === 'phone' && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-emerald-500/20" />

                {/* Primary Actions */}
                <div className="space-y-0.5">
                  {/* Install / App Status CTA */}
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      handleInstallClick();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-500/15 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {!hasDownloadedApp && !isStandalone ? 'Install DEEDS CHAT' : 'DEEDS CHAT App'}
                        </p>
                        <p className="text-[10px] text-slate-400">Windows PC (.exe) & Android</p>
                      </div>
                    </div>
                    {hasDownloadedApp || isStandalone ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-950 bg-emerald-400 px-2 py-0.5 rounded-full shadow-sm">
                        Install
                      </span>
                    )}
                  </button>

                  {/* Showcase Launcher */}
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setHeaderMenuOpen(false);
                      setAuthModalState({ isOpen: true, mode: 'welcome' });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-emerald-500/15 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Showcase & Onboarding</p>
                      <p className="text-[10px] text-slate-400">Welcome, verification & feature tour</p>
                    </div>
                  </button>

                  {/* Supabase Database Settings */}
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setHeaderMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-emerald-500/15 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Database & Cloud Sync</p>
                      <p className="text-[10px] text-slate-400">Supabase connection & live status</p>
                    </div>
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setHeaderMenuOpen(false);
                      toggleFullscreen();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-emerald-500/15 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-emerald-500/20 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
                      <p className="text-[10px] text-slate-400">Toggle borderless display mode</p>
                    </div>
                  </button>
                </div>

                <div className="h-px bg-emerald-500/20" />

                {/* Security Badge in Dropdown */}
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Encrypted Client v2.4</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Offline Status Indicator */}
      {!isOnline && (
        <div className="bg-amber-500/90 text-slate-950 font-semibold text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 z-40 animate-in fade-in shrink-0">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
          <span>Offline Mode — App shell cached. Reconnecting to chat servers when online...</span>
        </div>
      )}

      {/* Minimized Window Dock state */}
      {isWindowMinimized ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#020705]">
          <div className="p-6 rounded-3xl bg-[#05110d] border border-emerald-500/30 shadow-2xl flex flex-col items-center max-w-sm">
            <DeedsLogo size="lg" showText={true} className="mb-4" />
            <p className="text-xs text-slate-400 mb-4">Deeds Chat is minimized to dock.</p>
            <button
              onClick={() => {
                sounds.playTap();
                setIsWindowMinimized(false);
              }}
              className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25"
            >
              Restore Application
            </button>
          </div>
        </div>
      ) : (
        /* Main Application Workspace */
        <main className="flex-1 flex items-center justify-center overflow-hidden bg-[#020705] p-0 md:p-3">
          <div
            className={`flex overflow-hidden transition-all duration-300 ${
              clientMode === 'phone'
                ? 'w-full max-w-[390px] h-[98%] rounded-[42px] border-[5px] border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.2)] bg-[#050e0b] relative'
                : 'w-full h-full max-w-[1600px] rounded-2xl border border-emerald-500/20 shadow-2xl bg-[#050e0b]'
            }`}
          >
            {/* =========================================================================
                MODE 1: PHONE APP CLIENT (Native mobile phone view)
            ========================================================================= */}
            {clientMode === 'phone' ? (
              <div className="w-full h-full flex flex-col relative overflow-hidden">
                {/* Native Mobile Status Bar (Time, Dynamic Island, Battery) */}
                <div className="h-7 w-full bg-[#050e0b] flex items-center justify-between px-6 pt-1 text-[11px] text-slate-300 font-mono shrink-0 select-none">
                  <span>9:41</span>
                  <div className="w-24 h-4 bg-black rounded-full mx-auto border border-emerald-500/20" />
                  <span className="text-emerald-400 font-semibold">5G 100%</span>
                </div>

                {/* View Router for Phone App */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {activeNavTab === 'channels' ? (
                    <ChannelsView
                      channels={channels}
                      onToggleJoin={handleToggleChannelJoin}
                      onOpenChannelChat={() => setActiveNavTab('chats')}
                    />
                  ) : isShowingMobileChat && activeConversation ? (
                    <ChatArea
                      conversation={activeConversation}
                      currentUser={currentUser}
                      messages={activeMessages}
                      onSendMessage={handleSendMessage}
                      onBack={() => setIsShowingMobileChat(false)}
                      onOpenInfo={() => setInfoDrawerOpen(true)}
                      onImageClick={(url, name) => setLightboxImage({ url, name })}
                      onDeleteMessage={handleDeleteMessage}
                      onTogglePinMessage={handleTogglePinMessage}
                      onAddReaction={handleAddReaction}
                      onStartCall={startCall}
                    />
                  ) : (
                    <Sidebar
                      currentUser={currentUser}
                      conversations={conversations}
                      activeConversationId={activeConversationId}
                      onSelectConversation={(id) => {
                        setActiveConversationId(id);
                        setIsShowingMobileChat(true);
                      }}
                      activeNavTab={activeNavTab}
                      onChangeNavTab={setActiveNavTab}
                      onOpenNewChat={() => setFindFriendsOpen(true)}
                      onOpenNewGroup={() => setNewGroupOpen(true)}
                      onOpenSettings={() => setSettingsOpen(true)}
                      onOpenFindFriends={() => setFindFriendsOpen(true)}
                    />
                  )}
                </div>

                {/* Native Home Indicator Bar */}
                <div className="h-4 w-full bg-[#050e0b] flex items-center justify-center shrink-0">
                  <div className="w-32 h-1 bg-slate-600/70 rounded-full" />
                </div>
              </div>
            ) : (
              /* MODE 2: DESKTOP APP CLIENT (3-Column Native Client with Keyboard Nav) */
              <div className="w-full h-full flex overflow-hidden">
                {/* Column 1: Left Navigation Sidebar */}
                <div className="w-80 lg:w-96 h-full shrink-0">
                  {activeNavTab === 'channels' ? (
                    <ChannelsView
                      channels={channels}
                      onToggleJoin={handleToggleChannelJoin}
                    />
                  ) : (
                    <Sidebar
                      currentUser={currentUser}
                      conversations={conversations}
                      activeConversationId={activeConversationId}
                      onSelectConversation={(id) => {
                        setActiveConversationId(id);
                        setActiveNavTab('chats');
                      }}
                      activeNavTab={activeNavTab}
                      onChangeNavTab={setActiveNavTab}
                      onOpenNewChat={() => setFindFriendsOpen(true)}
                      onOpenNewGroup={() => setNewGroupOpen(true)}
                      onOpenSettings={() => setSettingsOpen(true)}
                      onOpenFindFriends={() => setFindFriendsOpen(true)}
                    />
                  )}
                </div>

                {/* Column 2: Center Active Chat Area */}
                <div className="flex-1 h-full min-w-0">
                  {activeConversation ? (
                    <ChatArea
                      conversation={activeConversation}
                      currentUser={currentUser}
                      messages={activeMessages}
                      onSendMessage={handleSendMessage}
                      onOpenInfo={() => setInfoDrawerOpen(!infoDrawerOpen)}
                      onImageClick={(url, name) => setLightboxImage({ url, name })}
                      onDeleteMessage={handleDeleteMessage}
                      onTogglePinMessage={handleTogglePinMessage}
                      onAddReaction={handleAddReaction}
                      onStartCall={startCall}
                    />
                  ) : (
                    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-[#050e0b]">
                      <DeedsLogo size="lg" showText={true} showTagline={true} className="mb-4" />
                      <p className="text-xs text-slate-400 max-w-sm mt-2">
                        Select a conversation or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400">Ctrl+K</kbd> to find friends.
                      </p>
                    </div>
                  )}
                </div>

                {/* Column 3: Right Detail Drawer */}
                {infoDrawerOpen && activeConversation && (
                  <div className="shrink-0 h-full animate-in slide-in-from-right duration-200">
                    <InfoDrawer
                      conversation={activeConversation}
                      currentUser={currentUser}
                      onClose={() => setInfoDrawerOpen(false)}
                      onStartAudioCall={() => startCall('audio')}
                      onStartVideoCall={() => startCall('video')}
                      onToggleMute={() => {
                        setConversations((prev) =>
                          prev.map((c) =>
                            c.id === activeConversation.id ? { ...c, isMuted: !c.isMuted } : c
                          )
                        );
                      }}
                      onChangeWallpaper={(wp) => {
                        setConversations((prev) =>
                          prev.map((c) =>
                            c.id === activeConversation.id ? { ...c, wallpaper: wp } : c
                          )
                        );
                      }}
                      onClearChat={() => {
                        setMessagesByConv((prev) => ({
                          ...prev,
                          [activeConversation.id]: [],
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* =========================================================================
          APPLICATION MODALS & SHEETS
      ========================================================================= */}

      {/* 1. Auth & Showcase Screens Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        defaultMode={authModalState.mode}
        onSuccess={(authenticatedUser) => {
          setCurrentUser(authenticatedUser);
          setStoredSessionUser(authenticatedUser);
          setAuthModalState({ ...authModalState, isOpen: false });
        }}
      />

      {/* 2. Find & Add Friends Modal */}
      <FindFriendsModal
        isOpen={findFriendsOpen}
        onClose={() => setFindFriendsOpen(false)}
        suggestedUsers={SUGGESTED_FRIENDS}
        sentRequests={sentRequests}
        receivedRequests={receivedRequests}
        onSendRequest={handleSendFriendRequest}
        onAcceptRequest={handleAcceptFriendRequest}
        onDeclineRequest={handleDeclineFriendRequest}
      />

      {/* 3. New Group Creation Modal */}
      <NewGroupModal
        isOpen={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        availableFriends={SUGGESTED_FRIENDS}
        onCreateGroup={handleCreateGroup}
      />

      {/* 4. Profile & Settings Modal with Supabase Integration */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          const next = { ...currentUser, ...updated };
          setCurrentUser(next);
          setStoredSessionUser(next);
        }}
        onSignOut={async () => {
          await signOutUser();
          setSettingsOpen(false);
          setAuthModalState({ isOpen: true, mode: 'login' });
        }}
        onOpenInstallModal={() => {
          setSettingsOpen(false);
          setInstallModalOpen(true);
        }}
      />

      {/* 5. Live Audio / Video Call Modal */}
      {callState.isOpen && activeConversation && (
        <CallModal
          type={callState.type}
          conversation={activeConversation}
          currentUser={currentUser}
          onClose={() => setCallState({ isOpen: false, type: 'audio' })}
        />
      )}

      {/* 6. Media Fullscreen Lightbox */}
      {lightboxImage && (
        <MediaLightbox
          url={lightboxImage.url}
          name={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* 7. Native PWA App Installation Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        onInstallClick={handleInstallClick}
        onAppDownloaded={() => setHasDownloadedApp(true)}
      />
    </div>
  );
}
