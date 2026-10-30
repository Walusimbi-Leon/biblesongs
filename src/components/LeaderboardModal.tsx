import { useState, useMemo } from 'react';
import { Trophy, X, Clock, Search } from 'lucide-react';
import { ChatUser, LeaderboardUser } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardUser[];
  totalListeners: number;
  currentUser: ChatUser;
}

function formatLeaderboardTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  if (s >= 3600) {
    const hrs = (s / 3600).toFixed(1).replace(/\.0$/, '');
    return `${hrs} hours`;
  }
  if (s >= 60) {
    return `${Math.round(s / 60)} mins`;
  }
  return `${s} secs`;
}

function getInitial(name: string): string {
  return ((name || '?').trim().charAt(0) || '?').toUpperCase();
}

export function LeaderboardModal({
  isOpen,
  onClose,
  leaderboard,
  totalListeners,
  currentUser,
}: LeaderboardModalProps) {
  const [search, setSearch] = useState('');

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const query = search.toLowerCase().trim();
    return leaderboard.filter(u => u.name?.toLowerCase().includes(query));
  }, [leaderboard, search]);

  if (!isOpen) return null;

  return (
    <div
      id="leaderboard-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        id="leaderboard-drawer-panel"
        className="relative flex h-full w-full max-w-md flex-col bg-[#0D0704]/98 border-l border-white/10 p-5 sm:p-6 shadow-2xl shadow-black text-white/90"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Trophy className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-light tracking-widest uppercase text-amber-100/90 font-sans">
              Hall of Fame
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Listeners Banner */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/50 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            All-Time Listening Hours
          </span>
          <span className="font-semibold text-amber-300">
            {totalListeners} listeners
          </span>
        </div>

        {/* Search Listener Filter */}
        <div className="mt-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search ranked listener..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-white/[0.04] py-2 pl-10 pr-8 text-xs text-white placeholder-white/40 border border-white/10 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Rankings List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredLeaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/40 text-xs">
              <span>{search ? `No listeners match "${search}"` : 'Loading rankings...'}</span>
            </div>
          ) : (
            filteredLeaderboard.map((user, index) => {
              // Note: index in leaderboard is rank - 1
              const rank = index + 1;
              const isMe = user.uid === currentUser.uid;

              return (
                <div
                  key={user.uid || index}
                  className={`flex items-center justify-between rounded-2xl p-3 border transition-all ${
                    isMe
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Rank Badge */}
                    <div className="flex w-6 shrink-0 items-center justify-center font-bold text-sm">
                      {rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-xs text-white/40 font-mono">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-amber-500/30"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 text-xs font-bold text-amber-300 ring-1 ring-white/10">
                        {getInitial(user.name)}
                      </div>
                    )}

                    {/* Username & 'You' badge */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-light text-white text-xs sm:text-sm truncate"
                          style={{ fontFamily: '"Georgia", serif' }}
                        >
                          {user.name}
                        </span>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-bold text-black uppercase">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Spent */}
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-mono text-xs font-semibold text-amber-400">
                      {formatLeaderboardTime(user.seconds)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
