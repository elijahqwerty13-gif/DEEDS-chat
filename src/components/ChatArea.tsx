import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
  X,
  Reply,
  Pin,
  Trash2,
  Sparkles,
  Search,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { Conversation, Message, User, ReplyContext } from '../types';
import { AudioMessage } from './AudioMessage';
import { VoiceRecorder } from './VoiceRecorder';
import { sounds } from '../utils/soundEffects';

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  messages: Message[];
  onSendMessage: (
    text: string,
    type?: 'text' | 'image' | 'voice' | 'file',
    attachmentUrl?: string,
    attachmentName?: string,
    audioDuration?: number,
    replyTo?: ReplyContext
  ) => void;
  onBack?: () => void;
  onOpenInfo?: () => void;
  onImageClick?: (url: string, name?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onStartCall?: (type: 'audio' | 'video') => void;
}

const COMMON_EMOJIS = ['😊', '❤️', '👍', '🔥', '🎉', '☕', '😍', '😂', '🙌', '✨', '👏', '🚀'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  messages,
  onSendMessage,
  onBack,
  onOpenInfo,
  onImageClick,
  onDeleteMessage,
  onTogglePinMessage,
  onAddReaction,
  onStartCall,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [isSimulatedTyping, setIsSimulatedTyping] = useState(false);
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);
  const [callModal, setCallModal] = useState<'audio' | 'video' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isRecording]);

  // Handle incoming reply simulation when user sends a message
  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    sounds.playSent();
    onSendMessage(
      text,
      'text',
      undefined,
      undefined,
      undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text,
            type: replyingTo.type,
          }
        : undefined
    );
    setReplyingTo(null);

    // Simulate friend typing indicator & automated reply
    if (conversation.type === 'direct') {
      setTimeout(() => {
        setIsSimulatedTyping(true);
        setTimeout(() => {
          setIsSimulatedTyping(false);
          sounds.playReceived();
          onSendMessage(
            'Got it! Sounds great. Let me check the schedule right now! ✨',
            'text'
          );
        }, 2400);
      }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playTap();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const isImg = file.type.startsWith('image/');
      sounds.playSent();
      onSendMessage(
        file.name,
        isImg ? 'image' : 'file',
        dataUrl,
        file.name,
        undefined,
        replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.senderName,
              text: replyingTo.text,
              type: replyingTo.type,
            }
          : undefined
      );
      setReplyingTo(null);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  // Find pinned message if any
  const pinnedMessage = messages.find((m) => m.isPinned);

  // Filter messages by search if search bar is active
  const displayedMessages = inChatSearch.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(inChatSearch.toLowerCase())
      )
    : messages;

  // Background wallpaper styling
  const wallpaperClass =
    conversation.wallpaper === 'obsidian'
      ? 'wallpaper-obsidian'
      : conversation.wallpaper === 'cyber-grid'
      ? 'wallpaper-cyber-grid'
      : conversation.wallpaper === 'midnight'
      ? 'wallpaper-midnight'
      : 'wallpaper-emerald-mesh';

  return (
    <div className={`flex flex-col h-full ${wallpaperClass} text-white select-none relative overflow-hidden`}>
      {/* 1. TOP CHAT HEADER matching showcase screenshot */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#050e0b]/90 border-b border-emerald-500/15 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              onClick={() => {
                sounds.playTap();
                onBack();
              }}
              className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-colors"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Contact or Group Avatar */}
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-2.5 min-w-0 text-left transition-opacity hover:opacity-90"
          >
            <div className="relative shrink-0">
              <img
                src={conversation.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt={conversation.name}
                className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
              />
              {conversation.type === 'direct' && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#050e0b]" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{conversation.name}</h2>
              <p className="text-[11px] truncate flex items-center gap-1 font-medium">
                {isSimulatedTyping ? (
                  <span className="text-emerald-400 animate-pulse flex items-center gap-1">
                    typing
                    <span className="inline-block animate-bounce">.</span>
                    <span className="inline-block animate-bounce [animation-delay:150ms]">.</span>
                    <span className="inline-block animate-bounce [animation-delay:300ms]">.</span>
                  </span>
                ) : conversation.type === 'direct' ? (
                  <span className="text-emerald-400">online</span>
                ) : (
                  <span className="text-slate-400">{conversation.members.length} members</span>
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Top Header Action Buttons: Phone, Video, Search, Info */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              sounds.playTap();
              if (onStartCall) {
                onStartCall('audio');
              } else {
                setCallModal('audio');
              }
            }}
            className="p-2 rounded-full text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Audio call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              if (onStartCall) {
                onStartCall('video');
              } else {
                setCallModal('video');
              }
            }}
            className="p-2 rounded-full text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setShowSearch(!showSearch);
            }}
            className="p-2 rounded-full text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Search conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onOpenInfo?.();
            }}
            className="p-2 rounded-full text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Conversation info"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-slate-900/90 border-b border-emerald-500/20 flex items-center gap-2 z-10 animate-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Search in this chat..."
            value={inChatSearch}
            onChange={(e) => setInChatSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          {inChatSearch && (
            <button onClick={() => setInChatSearch('')} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Pinned Message Notice */}
      {pinnedMessage && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-emerald-950/60 border-b border-emerald-500/20 text-[11px] text-emerald-300 z-10">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white shrink-0">{pinnedMessage.senderName}:</span>
            <span className="truncate">{pinnedMessage.text}</span>
          </div>
          <button
            onClick={() => onTogglePinMessage?.(pinnedMessage.id)}
            className="text-slate-400 hover:text-white text-[10px] ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Notice Pill matching screenshot ("You created this group" or "Today") */}
        <div className="flex justify-center my-1">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-emerald-500/20 text-[11px] text-slate-300 font-medium shadow-sm backdrop-blur-md">
            {conversation.type === 'group' ? 'You created this group · Today' : 'Today'}
          </span>
        </div>

        {displayedMessages.map((msg) => {
          const isOutgoing = msg.senderId === currentUser.id || msg.senderName === 'You';
          const isActionMenuOpen = activeMessageActionId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group relative ${
                isOutgoing ? 'items-end' : 'items-start'
              }`}
            >
              {/* Group sender name & avatar */}
              {conversation.type === 'group' && !isOutgoing && (
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  {msg.senderAvatar && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-[11px] font-semibold text-emerald-400">
                    {msg.senderName}
                  </span>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className="relative max-w-[85%] sm:max-w-md group"
                onMouseEnter={() => setActiveMessageActionId(msg.id)}
                onMouseLeave={() => setActiveMessageActionId(null)}
              >
                {/* Replying quote badge if this message is a reply */}
                {msg.replyTo && (
                  <div
                    className={`text-[10px] p-2 rounded-t-xl border-b mb-[-6px] ${
                      isOutgoing
                        ? 'bg-emerald-950/80 border-emerald-400/30 text-emerald-200'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-semibold block text-emerald-400">
                      {msg.replyTo.senderName}
                    </span>
                    <span className="truncate block opacity-80">{msg.replyTo.text}</span>
                  </div>
                )}

                {/* Main Bubble Body */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg backdrop-blur-md transition-all ${
                    isOutgoing
                      ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white rounded-br-sm border border-emerald-400/30 shadow-emerald-900/20'
                      : 'bg-[#0b1714]/90 text-slate-100 rounded-bl-sm border border-emerald-500/20 shadow-black/40'
                  }`}
                >
                  {/* Type 1: Text */}
                  {msg.type === 'text' && (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  {/* Type 2: Voice Note */}
                  {msg.type === 'voice' && (
                    <AudioMessage
                      duration={msg.audioDuration || 12}
                      timestamp={msg.createdAt}
                      isOutgoing={isOutgoing}
                    />
                  )}

                  {/* Type 3: Image Attachment */}
                  {msg.type === 'image' && msg.attachmentUrl && (
                    <div className="flex flex-col gap-1.5">
                      <div
                        onClick={() => onImageClick?.(msg.attachmentUrl!, msg.attachmentName)}
                        className="rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:opacity-95 transition-opacity max-h-64"
                      >
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {msg.text && msg.text !== msg.attachmentName && (
                        <p className="text-xs mt-1">{msg.text}</p>
                      )}
                    </div>
                  )}

                  {/* Type 4: File Document */}
                  {msg.type === 'file' && (
                    <a
                      href={msg.attachmentUrl}
                      download={msg.attachmentName}
                      className="flex items-center gap-3 p-2 rounded-xl bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate text-left">
                        <p className="text-xs font-semibold truncate">{msg.attachmentName}</p>
                        <p className="text-[10px] opacity-70">{msg.attachmentSize || 'Document'}</p>
                      </div>
                    </a>
                  )}

                  {/* Bubble Footer: Timestamp & delivery ticks */}
                  {msg.type !== 'voice' && (
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none font-mono ${
                        isOutgoing ? 'text-emerald-100/80' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.createdAt}</span>
                      {isOutgoing && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200 stroke-[2.5]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Emoji Reactions Tally */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isOutgoing ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.reactions.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-[11px] shadow-sm"
                      >
                        <span>{r.emoji}</span>
                        {r.count > 1 && (
                          <span className="text-[9px] font-bold text-emerald-400 font-mono">
                            {r.count}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Action Bar on Hover/Tap */}
                {isActionMenuOpen && (
                  <div
                    className={`absolute -top-7 ${
                      isOutgoing ? 'right-0' : 'left-0'
                    } flex items-center gap-0.5 p-1 rounded-full bg-slate-900 border border-emerald-500/30 shadow-xl z-10 animate-in fade-in duration-100`}
                  >
                    {/* Quick Emojis */}
                    {['❤️', '👍', '🔥'].map((em) => (
                      <button
                        key={em}
                        onClick={() => {
                          sounds.playTap();
                          onAddReaction?.(msg.id, em);
                          setActiveMessageActionId(null);
                        }}
                        className="w-6 h-6 rounded-full hover:bg-emerald-500/20 flex items-center justify-center text-xs transition-transform active:scale-125"
                      >
                        {em}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        sounds.playTap();
                        setReplyingTo(msg);
                        setActiveMessageActionId(null);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        onTogglePinMessage?.(msg.id);
                        setActiveMessageActionId(null);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={msg.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-3 h-3" />
                    </button>

                    {isOutgoing && (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          onDeleteMessage?.(msg.id);
                          setActiveMessageActionId(null);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying-To Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-t border-emerald-500/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs truncate">
              <span className="font-semibold text-emerald-400 block">
                Replying to {replyingTo.senderName}
              </span>
              <span className="text-slate-400 truncate block">{replyingTo.text}</span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BOTTOM INPUT TOOLBAR matching screenshot */}
      <div className="p-3 bg-[#050e0b]/95 border-t border-emerald-500/15 backdrop-blur-xl relative z-20">
        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 p-3 rounded-2xl bg-[#091713] border border-emerald-500/30 shadow-2xl z-30 w-72 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">Emojis</span>
              <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    sounds.playTap();
                    setInputText((prev) => prev + emoji);
                  }}
                  className="w-9 h-9 rounded-xl hover:bg-emerald-500/20 flex items-center justify-center text-lg transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachment Menu Popup */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-12 p-2 rounded-2xl bg-[#091713] border border-emerald-500/30 shadow-2xl z-30 w-48 animate-in fade-in duration-150 text-xs">
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Photo or Video</span>
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Document</span>
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Voice Note Recorder Mode or Normal Text Input */}
        {isRecording ? (
          <VoiceRecorder
            onSend={(duration) => {
              setIsRecording(false);
              onSendMessage('Voice note', 'voice', undefined, undefined, duration);
            }}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            {/* Emoji Button */}
            <button
              onClick={() => {
                sounds.playTap();
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className="p-2 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Input Field with rounded pill */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 pl-4 pr-10 rounded-full bg-slate-900/90 border border-emerald-500/25 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
              />

              {/* Attachment Paperclip inside input right */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                }}
                className="absolute right-3 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Send or Voice Note Button */}
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 active:scale-95 shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsRecording(true);
                }}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 active:scale-95 shrink-0"
                title="Hold or tap to record voice note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Simulated Call Modal */}
      {callModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in"
        >
          <div className="relative w-full max-w-xs rounded-3xl bg-[#071310] border border-emerald-500/30 p-6 text-center text-white">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-emerald-400 animate-pulse"
            />
            <h3 className="text-base font-bold text-white">{conversation.name}</h3>
            <p className="text-xs text-emerald-400 mt-1">
              Calling ({callModal === 'video' ? 'Encrypted Video' : 'HD Audio'})...
            </p>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCallModal(null)}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg"
              >
                <Phone className="w-5 h-5 rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
