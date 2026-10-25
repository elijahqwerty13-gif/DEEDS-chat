import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  Users,
  Image as ImageIcon,
  Bell,
  VolumeX,
  Pin,
  Lock,
  UserX,
  Trash2,
  Palette,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Conversation, User } from '../types';
import { sounds } from '../utils/soundEffects';

interface InfoDrawerProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onToggleMute: () => void;
  onChangeWallpaper: (wallpaper: 'emerald-mesh' | 'obsidian' | 'cyber-grid' | 'midnight') => void;
  onClearChat: () => void;
}

export const InfoDrawer: React.FC<InfoDrawerProps> = ({
  conversation,
  currentUser,
  onClose,
  onStartAudioCall,
  onStartVideoCall,
  onToggleMute,
  onChangeWallpaper,
  onClearChat,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'wallpaper'>('info');

  return (
    <div className="w-80 h-full bg-[#050e0b] border-l border-emerald-500/15 flex flex-col text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/10">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          {conversation.type === 'group' ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-emerald-500/10 text-center">
        <img
          src={conversation.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
          alt={conversation.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/40 shadow-xl shadow-emerald-950/30 mb-3"
        />
        <h2 className="text-base font-bold text-white">{conversation.name}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {conversation.type === 'group'
            ? `${conversation.members.length} members`
            : conversation.members.find((m) => m.id !== currentUser.id)?.email || 'Deeds Member'}
        </p>

        {/* Action Buttons: Voice Call, Video Call, Mute */}
        <div className="flex items-center justify-center gap-4 mt-4 w-full">
          <button
            onClick={() => {
              sounds.playTap();
              onStartAudioCall();
            }}
            className="flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/40 border border-emerald-500/20 text-slate-200 hover:text-emerald-300 transition-all text-xs font-medium"
          >
            <Phone className="w-4 h-4 text-emerald-400 mb-1" />
            <span>Audio</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onStartVideoCall();
            }}
            className="flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/40 border border-emerald-500/20 text-slate-200 hover:text-emerald-300 transition-all text-xs font-medium"
          >
            <Video className="w-4 h-4 text-emerald-400 mb-1" />
            <span>Video</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onToggleMute();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl border text-xs font-medium transition-all ${
              conversation.isMuted
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/80 hover:bg-slate-900 border-white/5 text-slate-200'
            }`}
          >
            {conversation.isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400 mb-1" />
            ) : (
              <Bell className="w-4 h-4 text-slate-400 mb-1" />
            )}
            <span>{conversation.isMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>
      </div>

      {/* Description / About */}
      {conversation.description && (
        <div className="p-4 border-b border-emerald-500/10">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            About / Description
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">{conversation.description}</p>
        </div>
      )}

      {/* Group Members List (if group) */}
      {conversation.type === 'group' && (
        <div className="p-4 border-b border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Members ({conversation.members.length})
            </h4>
          </div>

          <div className="space-y-2">
            {conversation.members.map((member) => {
              const isAdmin = conversation.adminIds?.includes(member.id);
              const isYou = member.id === currentUser.id;

              return (
                <div key={member.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={member.avatarUrl}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-500/20"
                    />
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate">
                        {member.displayName} {isYou && '(You)'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wallpaper Themes */}
      <div className="p-4 border-b border-emerald-500/10">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          Chat Wallpaper
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'emerald-mesh', label: 'Emerald Mesh', bg: 'bg-[#040908] border-emerald-500/40' },
            { id: 'obsidian', label: 'Deep Obsidian', bg: 'bg-[#030605] border-slate-700' },
            { id: 'cyber-grid', label: 'Cyber Grid', bg: 'bg-[#040b08] border-emerald-500/30' },
            { id: 'midnight', label: 'Midnight', bg: 'bg-[#02070e] border-cyan-800' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                sounds.playTap();
                onChangeWallpaper(item.id as 'emerald-mesh' | 'obsidian' | 'cyber-grid' | 'midnight');
              }}
              className={`p-2 rounded-xl text-left text-xs transition-all border ${item.bg} ${
                conversation.wallpaper === item.id
                  ? 'ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'hover:opacity-80'
              }`}
            >
              <span className="font-medium text-white block">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Encryption & Security Note */}
      <div className="p-4 border-b border-emerald-500/10">
        <div className="flex items-start gap-2.5 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block">End-to-End Privacy</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Messages and calls are secured with authentic user-session tokens and Supabase Row Level
              Security.
            </p>
          </div>
        </div>
      </div>

      {/* Destructive Actions */}
      <div className="p-4 space-y-2 mt-auto">
        <button
          onClick={() => {
            sounds.playTap();
            onClearChat();
          }}
          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/50 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Chat History</span>
        </button>
      </div>
    </div>
  );
};
