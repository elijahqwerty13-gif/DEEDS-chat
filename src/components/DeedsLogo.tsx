import React from 'react';

interface DeedsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

export const DeedsLogo: React.FC<DeedsLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  layout = 'vertical',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isHorizontal = layout === 'horizontal';

  return (
    <div
      className={`flex ${
        isHorizontal ? 'flex-row items-center gap-2.5' : 'flex-col items-center justify-center'
      } ${className}`}
    >
      {/* Glowing Leaf Circle Container */}
      <div
        className={`relative ${iconSizes[size]} rounded-full flex items-center justify-center p-[2px] transition-transform duration-300 hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.2), rgba(52, 211, 153, 0.9))',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.45), inset 0 0 15px rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="w-full h-full rounded-full bg-[#050f0c] flex items-center justify-center relative overflow-hidden">
          {/* Subtle radial emerald background glow */}
          <div className="absolute inset-0 bg-radial from-emerald-500/25 via-transparent to-transparent opacity-80" />
          
          {/* Custom Dual Leaf SVG Icon */}
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[65%] h-[65%] relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          >
            {/* Primary curved leaf */}
            <path
              d="M12 36C12 36 12 24 24 12C36 24 36 36 24 36C18 36 14 36 12 36Z"
              fill="url(#leaf-gradient-1)"
            />
            {/* Inner secondary leaf curve / vein */}
            <path
              d="M18 32C22 30 26 26 28 20C26 26 22 28 18 32Z"
              fill="#ffffff"
              opacity="0.85"
            />
            {/* Glowing Accent Sprout */}
            <path
              d="M24 12C28 16 32 21 33 27C31 23 28 19 24 12Z"
              fill="url(#leaf-gradient-2)"
            />
            <defs>
              <linearGradient id="leaf-gradient-1" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="0.6" stopColor="#10b981" />
                <stop offset="1" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="leaf-gradient-2" x1="24" y1="12" x2="33" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a7f3d0" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <div className={`${isHorizontal ? 'text-left' : 'mt-2 text-center'} select-none`}>
          <span className={`font-extrabold tracking-tight inline-flex items-center gap-1 ${textSizes[size]}`}>
            <span className="text-white">DEEDS</span>
            <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">CHAT</span>
          </span>
          {showTagline && (
            <p className="text-xs text-slate-400 font-medium tracking-wider mt-1">
              Connect · Share · Belong
            </p>
          )}
        </div>
      )}
    </div>
  );
};
