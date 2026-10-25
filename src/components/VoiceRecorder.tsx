import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface VoiceRecorderProps {
  onSend: (duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sounds.playRecordStart();
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = () => {
    sounds.playSent();
    onSend(Math.max(1, seconds));
  };

  const handleCancel = () => {
    sounds.playTap();
    onCancel();
  };

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full h-12 px-4 rounded-full bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-md animate-in fade-in duration-200">
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        title="Discard voice note"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <Mic className="w-4 h-4 text-emerald-400" />
        </div>
        
        {/* Animated Soundwave bars */}
        <div className="flex items-center gap-1 h-5">
          {[40, 80, 60, 100, 70, 90, 50, 80, 45, 65, 85].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-400 rounded-full animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>

        <span className="text-xs font-mono font-medium text-emerald-300">
          {formatTime(seconds)}
        </span>
      </div>

      {/* Send voice note button */}
      <button
        onClick={handleSend}
        className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
        title="Send voice note"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
};
