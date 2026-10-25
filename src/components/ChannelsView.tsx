import React, { useState } from 'react';
import { Search, Cpu, Compass, HeartPulse, Utensils, Headphones, Gamepad2, Users, Check, Sparkles, MessageCircle } from 'lucide-react';
import { ChannelItem } from '../data/seedData';
import { sounds } from '../utils/soundEffects';

interface ChannelsViewProps {
  channels: ChannelItem[];
  onToggleJoin: (channelId: string) => void;
  onOpenChannelChat?: (channel: ChannelItem) => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  onToggleJoin,
  onOpenChannelChat,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'Headphones':
        return <Headphones className="w-5 h-5 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredChannels = channels.filter((c) => {
    if (activeTab === 'my' && !c.isJoined) return false;
    if (!searchQuery) return true;
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#050e0b] text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-emerald-500/15">
        <h2 className="text-lg font-bold tracking-tight text-white">Channels</h2>
        <button
          onClick={() => {
            sounds.playTap();
            setShowSearch(!showSearch);
          }}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-colors"
          title="Search channels"
        >
          <Search className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="px-4 py-2 bg-slate-900/40 border-b border-emerald-500/10">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-emerald-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            autoFocus
          />
        </div>
      )}

      {/* Segmented Filter: Discover vs My Channels */}
      <div className="flex items-center justify-center p-3">
        <div className="flex items-center p-1 rounded-full bg-slate-900/90 border border-emerald-500/20 w-full max-w-xs">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('discover');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('my');
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Channels
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="text-xs">No channels found</p>
          </div>
        ) : (
          filteredChannels.map((chan) => (
            <div
              key={chan.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 hover:border-emerald-500/20 transition-all group"
            >
              <div className="flex items-center gap-3 truncate">
                {/* Channel Icon Badge */}
                <div className="w-11 h-11 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  {getChannelIcon(chan.avatarIcon)}
                </div>

                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {chan.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {chan.memberCount} members · {chan.latestPost}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {chan.isJoined && onOpenChannelChat && (
                  <button
                    onClick={() => onOpenChannelChat(chan)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Open channel discussion"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    sounds.playTap();
                    onToggleJoin(chan.id);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    chan.isJoined
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-500/30 flex items-center gap-1'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {chan.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Joined
                    </>
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
