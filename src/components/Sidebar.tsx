import React, { useState } from 'react';
import {
  Search,
  Plus,
  QrCode,
  Pin,
  VolumeX,
  MessageSquare,
  Users,
  Compass,
  Settings,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Conversation, User } from '../types';
import { sounds } from '../utils/soundEffects';

interface SidebarProps {
  currentUser: User;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  activeNavTab: 'chats' | 'contacts' | 'channels' | 'settings';
  onChangeNavTab: (tab: 'chats' | 'contacts' | 'channels' | 'settings') => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  onOpenFindFriends: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  activeNavTab,
  onChangeNavTab,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  onOpenFindFriends,
}) => {
  const [chatFilter, setChatFilter] = useState<'all' | 'groups' | 'channels'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    // Tab filter
    if (chatFilter === 'groups' && conv.type !== 'group') return false;
    if (chatFilter === 'channels') return false; // Handled in Channels tab

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = conv.name?.toLowerCase().includes(q);
      const msgMatch = conv.lastMessage?.text?.toLowerCase().includes(q);
      const memberMatch = conv.members?.some((m) =>
        m.displayName.toLowerCase().includes(q)
      );
      return nameMatch || msgMatch || memberMatch;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#050e0b] border-r border-emerald-500/15 text-white select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/10">
        <div className="flex items-center gap-2.5">
          {/* User Avatar with online green status dot */}
          <button
            onClick={onOpenSettings}
            className="relative transition-transform active:scale-95"
            title="Profile & Settings"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#050e0b]" />
          </button>

          {/* Logo Title */}
          <div className="flex items-center font-extrabold text-base tracking-tight">
            <span className="text-white">DEEDS </span>
            <span className="text-emerald-400 ml-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              CHAT
            </span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => {
              sounds.playTap();
              onOpenFindFriends();
            }}
            className="p-2 rounded-full text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Scan QR / Find Friends"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setShowPlusMenu(!showPlusMenu);
            }}
            className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            title="New Chat or Group"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Plus Dropdown Menu */}
          {showPlusMenu && (
            <div
              className="absolute right-0 top-11 w-44 rounded-2xl bg-[#091713] border border-emerald-500/30 p-1.5 shadow-2xl z-40 text-xs animate-in fade-in duration-150"
              onClick={() => setShowPlusMenu(false)}
            >
              <button
                onClick={onOpenFindFriends}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors text-left"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>New Contact</span>
              </button>
              <button
                onClick={onOpenNewGroup}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors text-left"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>New Group</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search chats, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-full bg-slate-900/90 border border-emerald-500/20 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
      </div>

      {/* 3. FILTER TABS: [Chats] [Groups] [Channels] */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <button
          onClick={() => {
            sounds.playTap();
            setChatFilter('all');
            onChangeNavTab('chats');
          }}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            chatFilter === 'all' && activeNavTab === 'chats'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          Chats
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setChatFilter('groups');
            onChangeNavTab('chats');
          }}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            chatFilter === 'groups'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          Groups
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setChatFilter('channels');
            onChangeNavTab('channels');
          }}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            activeNavTab === 'channels'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          Channels
        </button>
      </div>

      {/* 4. CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const lastMsg = conv.lastMessage;

            return (
              <button
                key={conv.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectConversation(conv.id);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left ${
                  isActive
                    ? 'bg-emerald-950/60 border border-emerald-500/40 shadow-sm'
                    : 'hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {/* Avatar with optional group badge or online indicator */}
                <div className="relative shrink-0">
                  <img
                    src={conv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                    alt={conv.name || 'Chat'}
                    className="w-12 h-12 rounded-full object-cover border border-emerald-500/20"
                  />
                  {conv.type === 'direct' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#050e0b]" />
                  )}
                  {conv.type === 'group' && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-[9px] text-emerald-400">
                      👥
                    </span>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-white truncate">{conv.name}</h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {conv.updatedAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      {lastMsg?.type === 'image' && '📷 Image'}
                      {lastMsg?.type === 'voice' && '🎤 Voice message'}
                      {lastMsg?.type === 'text' && lastMsg.text}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isMuted && <VolumeX className="w-3 h-3 text-slate-500" />}
                      {conv.isPinned && <Pin className="w-3 h-3 text-emerald-400" />}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm shadow-emerald-500/40">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 5. BOTTOM NAVIGATION BAR (Chats, Contacts, Channels, Settings) */}
      <div className="grid grid-cols-4 items-center h-16 border-t border-emerald-500/15 bg-[#040b08]/90 backdrop-blur-md px-2">
        <button
          onClick={() => {
            sounds.playTap();
            onChangeNavTab('chats');
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeNavTab === 'chats' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Chats</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            onChangeNavTab('contacts');
            onOpenFindFriends();
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeNavTab === 'contacts' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Contacts</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            onChangeNavTab('channels');
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeNavTab === 'channels' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Channels</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            onOpenSettings();
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeNavTab === 'settings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};
