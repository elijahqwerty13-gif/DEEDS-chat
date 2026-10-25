import React, { useState, useRef } from 'react';
import { X, Users, Check, Camera, Upload } from 'lucide-react';
import { User } from '../types';
import { sounds } from '../utils/soundEffects';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableFriends: User[];
  onCreateGroup: (name: string, description: string, memberIds: string[], avatarUrl?: string) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  availableFriends,
  onCreateGroup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80');

  const handleGroupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    sounds.playTap();

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      if (data) {
        setAvatarUrl(data);
        sounds.playSent();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    sounds.playTap();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sounds.playSent();
    onCreateGroup(name.trim(), description.trim(), selectedIds, avatarUrl);
    setName('');
    setDescription('');
    setSelectedIds([]);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[#071310] border border-emerald-500/25 p-5 shadow-2xl text-white my-auto flex flex-col h-[560px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden py-3">
          {/* Hidden file input for native PC file explorer */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGroupAvatarSelect}
          />

          {/* Avatar & Name Input */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="relative shrink-0 group cursor-pointer"
              onClick={() => {
                sounds.playTap();
                fileInputRef.current?.click();
              }}
              title="Click to select group icon from your PC"
            >
              <img
                src={avatarUrl}
                alt="Group avatar"
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30 group-hover:brightness-90 transition-all"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playTap();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-transform active:scale-95"
                title="Browse PC"
              >
                <Camera className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Group Name (e.g. Design Team)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Topic or description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-emerald-500/20 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 mb-3"
          />

          {/* Members Checklist */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
              <span>Select Members ({selectedIds.length})</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.length === availableFriends.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(availableFriends.map((f) => f.id));
                  }
                }}
                className="text-emerald-400 hover:underline text-[11px]"
              >
                {selectedIds.length === availableFriends.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {availableFriends.map((friend) => {
                const isSelected = selectedIds.includes(friend.id);
                return (
                  <button
                    type="button"
                    key={friend.id}
                    onClick={() => toggleSelect(friend.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors border text-left ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/40 border-transparent text-slate-300 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-medium text-white truncate">{friend.displayName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 mt-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};
