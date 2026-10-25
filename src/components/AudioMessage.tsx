import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface AudioMessageProps {
  duration?: number; // duration in seconds
  timestamp: string;
  isOutgoing: boolean;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  duration = 12,
  timestamp,
  isOutgoing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const animRef = useRef<number | null>(null);

  // 24 waveform bar height percentages to create an authentic audio waveform
  const barHeights = [
    30, 45, 75, 90, 60, 40, 65, 85, 100, 70, 50, 80, 95, 60, 45, 80, 90, 65, 40, 55, 75, 60, 40, 25,
  ];

  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now() - progress * duration * 1000;
      const step = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress >= 1) {
          setIsPlaying(false);
          setProgress(0);
        } else {
          animRef.current = requestAnimationFrame(step);
        }
      };

      animRef.current = requestAnimationFrame(step);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    sounds.playTap();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    const newProg = index / barHeights.length;
    setProgress(newProg);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentSeconds = Math.floor(progress * duration);

  return (
    <div className="flex flex-col gap-1 w-64 select-none">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
            isOutgoing
              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-md shadow-emerald-950/40'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-black/40'
          }`}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Waveform Bars */}
        <div className="flex-1 flex items-center gap-[2.5px] h-8 cursor-pointer py-1">
          {barHeights.map((h, i) => {
            const barFraction = i / barHeights.length;
            const isPlayed = progress >= barFraction;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSeek(i)}
                className="group flex items-center h-full px-[0.5px] bg-transparent border-0 cursor-pointer"
                title={`Seek to ${formatTime((i / barHeights.length) * duration)}`}
              >
                <div
                  className={`w-[3px] rounded-full transition-colors duration-100 ${
                    isPlayed
                      ? isOutgoing
                        ? 'bg-white'
                        : 'bg-emerald-400'
                      : isOutgoing
                      ? 'bg-emerald-200/40 group-hover:bg-emerald-200/60'
                      : 'bg-slate-600/60 group-hover:bg-slate-500'
                  }`}
                  style={{ height: `${Math.max(15, h)}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Timestamp and Duration */}
      <div className="flex items-center justify-between text-[11px] px-1 font-mono">
        <span className={isOutgoing ? 'text-emerald-100/80' : 'text-slate-400'}>
          {isPlaying ? formatTime(currentSeconds) : formatTime(duration)}
        </span>
        <span className={isOutgoing ? 'text-emerald-100/70' : 'text-slate-500'}>
          {timestamp}
        </span>
      </div>
    </div>
  );
};
