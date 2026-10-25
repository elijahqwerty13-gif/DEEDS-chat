import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Conversation, User } from '../types';
import { sounds } from '../utils/soundEffects';

interface CallModalProps {
  type: 'audio' | 'video';
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  type: initialType,
  conversation,
  currentUser,
  onClose,
}) => {
  const [callType, setCallType] = useState<'audio' | 'video'>(initialType);
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLocalCameraActive, setIsLocalCameraActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play ringtone on mount while ringing
  useEffect(() => {
    let ringtoneHandler: { stop: () => void } | null = null;

    if (callState === 'ringing') {
      ringtoneHandler = sounds.playRingtone();

      // Automatically connect call after 3.2 seconds
      const timer = setTimeout(() => {
        if (ringtoneHandler) ringtoneHandler.stop();
        sounds.playTap();
        setCallState('connected');
      }, 3200);

      return () => {
        if (ringtoneHandler) ringtoneHandler.stop();
        clearTimeout(timer);
      };
    }
  }, [callState]);

  // Call duration counter once connected
  useEffect(() => {
    let interval: number;
    if (callState === 'connected') {
      interval = window.setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Request real user webcam for picture-in-picture if video call
  useEffect(() => {
    if (callType === 'video' && isVideoEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setIsLocalCameraActive(true);
        })
        .catch(() => {
          // Fallback if camera is unavailable or denied in iframe
          setIsLocalCameraActive(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callType, isVideoEnabled]);

  const handleEndCall = () => {
    sounds.playHangup();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const recipientAvatar =
    conversation.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4 animate-in fade-in duration-200 select-none text-white"
    >
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-5xl h-[92vh]' : 'max-w-md h-[640px]'
        } max-h-[96vh] rounded-3xl bg-[#050f0c] border border-emerald-500/30 overflow-hidden shadow-2xl flex flex-col transition-all duration-300`}
      >
        {/* Top Floating Security & Status Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/70 border border-emerald-500/30 backdrop-blur-md text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 backdrop-blur-md text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* =========================================================================
            STATE 1: RINGING STATE
        ========================================================================= */}
        {callState === 'ringing' && (
          <div className="flex-1 flex flex-col items-center justify-between py-16 px-6 relative overflow-hidden">
            {/* Ambient Background Wave */}
            <div className="absolute inset-0 bg-radial from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col items-center text-center z-10 mt-6">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                Deeds {callType === 'video' ? 'Video Call' : 'Voice Call'}
              </span>
              <h2 className="text-xl font-bold text-white">{conversation.name}</h2>
              <p className="text-xs text-slate-400 mt-1 animate-pulse">Ringing...</p>
            </div>

            {/* Glowing Avatar with Sonar Rings */}
            <div className="relative my-8 z-10 flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20 animate-ping [animation-duration:2.5s]" />
              <div className="absolute w-36 h-36 rounded-full border border-emerald-500/40 animate-pulse" />
              <img
                src={recipientAvatar}
                alt={conversation.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400 shadow-2xl relative z-10"
              />
            </div>

            {/* Bottom Actions: Quick Connect / Decline */}
            <div className="w-full flex flex-col items-center gap-3 z-10">
              <p className="text-[11px] text-slate-500">Connecting automatically in seconds...</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setCallState('connected');
                  }}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  Answer Now
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
                  title="Decline"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: CONNECTED / IN-CALL STATE
        ========================================================================= */}
        {callState === 'connected' && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* ----------------- VIDEO CALL VIEW ----------------- */}
            {callType === 'video' ? (
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {/* Main Remote Video Screen */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={recipientAvatar}
                    alt={conversation.name}
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  {/* Subtle vignette scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                  {/* Remote Participant Label */}
                  <div className="absolute bottom-24 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">{conversation.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">1080p HD</span>
                  </div>
                </div>

                {/* Local Camera Pip (Picture-in-Picture) */}
                <div className="absolute top-16 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl bg-slate-900 border-2 border-emerald-500/50 overflow-hidden shadow-2xl z-30">
                  {isVideoEnabled ? (
                    isLocalCameraActive ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-950/70 flex flex-col items-center justify-center p-2 text-center">
                        <img
                          src={currentUser.avatarUrl}
                          alt="You"
                          className="w-12 h-12 rounded-full object-cover border border-emerald-400 mb-1"
                        />
                        <span className="text-[10px] text-emerald-300 font-medium">You (HD)</span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                      <span>Camera Off</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ----------------- VOICE CALL VIEW ----------------- */
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 relative bg-gradient-to-b from-[#061410] via-[#040e0b] to-[#020705]">
                <div className="flex flex-col items-center text-center z-10 mb-8">
                  <h2 className="text-xl font-bold text-white">{conversation.name}</h2>
                  <p className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {formatTime(callSeconds)}
                  </p>
                </div>

                {/* Central Pulsing Avatar */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute w-44 h-44 rounded-full border border-emerald-500/25 animate-pulse" />
                  <img
                    src={recipientAvatar}
                    alt={conversation.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-2xl relative z-10"
                  />
                </div>

                {/* Audio Waveform Equalizer */}
                <div className="flex items-center gap-1 h-8 my-6">
                  {[20, 50, 80, 100, 75, 45, 90, 60, 85, 40, 70, 95, 30].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${500 + (i % 3) * 200}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Call Duration for Video Mode */}
            {callType === 'video' && (
              <div className="absolute top-16 left-4 z-20 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-mono text-emerald-300">
                {formatTime(callSeconds)}
              </div>
            )}

            {/* =========================================================================
                BOTTOM CALL CONTROL TOOLBAR
            ========================================================================= */}
            <div className="px-6 py-4 bg-[#050f0c]/90 border-t border-emerald-500/20 backdrop-blur-xl flex items-center justify-around z-30">
              {/* Mic Toggle */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsMuted(!isMuted);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-900 text-slate-200 hover:text-white border border-white/10 hover:border-emerald-500/40'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle (Switch between Video & Voice Call) */}
              <button
                onClick={() => {
                  sounds.playTap();
                  if (callType === 'audio') {
                    setCallType('video');
                    setIsVideoEnabled(true);
                  } else {
                    setIsVideoEnabled(!isVideoEnabled);
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  !isVideoEnabled || callType === 'audio'
                    ? 'bg-slate-900 text-slate-400 border border-white/10'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
                title="Toggle camera"
              >
                {isVideoEnabled && callType === 'video' ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsSpeakerOn(!isSpeakerOn);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isSpeakerOn
                    ? 'bg-slate-900 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-white/10'
                }`}
                title="Toggle speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* End Call Button (Big Red Pill) */}
              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95 shrink-0"
                title="End call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
