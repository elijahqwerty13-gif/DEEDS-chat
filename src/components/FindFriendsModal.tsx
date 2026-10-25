import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, Check, Users, Clock, Mail } from 'lucide-react';
import { FriendRequest, User } from '../types';
import { sounds } from '../utils/soundEffects';

interface FindFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedUsers: User[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  onSendRequest: (email: string, user?: User) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}

export const FindFriendsModal: React.FC<FindFriendsModalProps> = ({
  isOpen,
  onClose,
  suggestedUsers,
  sentRequests,
  receivedRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [showSentRequests, setShowSentRequests] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleAdd = (user: User) => {
    sounds.playTap();
    setAddedIds((prev) => ({ ...prev, [user.id]: true }));
    onSendRequest(user.email, user);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() || !searchEmail.includes('@')) return;
    sounds.playSent();
    onSendRequest(searchEmail.trim());
    setSearchEmail('');
  };

  // Filter suggested users based on search query
  const filteredUsers = suggestedUsers.filter((u) => {
    if (!searchEmail) return true;
    const q = searchEmail.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
  });

  const isExactEmailSearch =
    searchEmail.includes('@') &&
    !suggestedUsers.some((u) => u.email.toLowerCase() === searchEmail.toLowerCase());

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[#071310] border border-emerald-500/25 p-5 shadow-2xl text-white my-auto flex flex-col h-[600px] max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-emerald-500/10">
          <button
            onClick={() => {
              if (showSentRequests) {
                setShowSentRequests(false);
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-white">
            {showSentRequests ? 'Sent Requests' : 'Find Friends'}
          </h2>
        </div>

        {showSentRequests ? (
          /* SENT & RECEIVED REQUESTS VIEW */
          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            {receivedRequests.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  Received Requests ({receivedRequests.length})
                </h4>
                <div className="space-y-2">
                  {receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={req.senderAvatar}
                          alt={req.senderName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{req.senderName}</p>
                          <p className="text-[11px] text-slate-400">{req.senderEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onAcceptRequest(req.id)}
                          className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onDeclineRequest(req.id)}
                          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pending Outgoing Requests ({sentRequests.length})
              </h4>
              {sentRequests.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No pending sent requests.</p>
              ) : (
                <div className="space-y-2">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/40 border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                          {req.receiverEmail.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{req.receiverEmail}</p>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending invite
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Waiting
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MAIN FIND FRIENDS VIEW */
          <div className="flex-1 flex flex-col overflow-hidden py-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by email address"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </form>

            {/* Connect Banner Card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-white">Connect with friends</h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Find and add people using their exact email addresses.
                </p>
              </div>
            </div>

            {/* Custom Email Invite Row if typed */}
            {isExactEmailSearch && (
              <div className="mb-3 p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-white truncate">{searchEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shrink-0"
                >
                  Send Invite
                </button>
              </div>
            )}

            {/* Suggested Friends List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-[11px] font-medium text-slate-400 px-1 mb-1">Suggested Contacts</p>
              {filteredUsers.map((user) => {
                const isAdded =
                  addedIds[user.id] ||
                  sentRequests.some((r) => r.receiverEmail === user.email);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-emerald-500/20"
                      />
                      <div className="truncate">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {user.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(user)}
                      disabled={isAdded}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        isAdded
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-default flex items-center gap-1'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added
                        </>
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* View Sent Requests Footer */}
            <button
              onClick={() => {
                sounds.playTap();
                setShowSentRequests(true);
              }}
              className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 hover:text-emerald-400 transition-colors px-1"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>View Sent & Incoming Requests</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {sentRequests.length + receivedRequests.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
