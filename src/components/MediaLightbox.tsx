import React from 'react';
import { X, Download } from 'lucide-react';

interface MediaLightboxProps {
  url: string;
  name?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ url, name = 'Image', onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-slate-300 truncate max-w-[200px] sm:max-w-md">
          {name}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download={name}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={name}
          className="w-full h-full object-contain max-h-[85vh] select-none"
        />
      </div>
    </div>
  );
};
