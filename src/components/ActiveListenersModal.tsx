import { Users, X, Radio, MessageSquare, Sparkles } from 'lucide-react';
import { ActiveListener, ChatUser } from '../types';

interface ActiveListenersModalProps {
  isOpen: boolean;
  onClose: () => void;
  listeners: ActiveListener[];
  listenerCount: number;
  currentUser: ChatUser;
  currentSessionId: string;
  onStartChatWithUser: (userName: string) => void;
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || 'G').length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 75%, 68%)`;
}

function formatListeningDuration(joinedAt?: number): string {
  if (!joinedAt) return 'Listening now';
  const elapsedSec = Math.max(1, Math.floor((Date.now() - joinedAt) / 1000));
  if (elapsedSec < 60) return `${elapsedSec}s`;
  if (elapsedSec < 3600) return `${Math.floor(elapsedSec / 60)}m`;
  return `${(elapsedSec / 3600).toFixed(1)}h`;
}

export function ActiveListenersModal({
  isOpen,
  onClose,
  listeners,
  listenerCount,
  currentUser,
  onStartChatWithUser,
}: ActiveListenersModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="active-listeners-modal-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        id="active-listeners-modal-panel"
        className="relative flex h-full w-full max-w-md flex-col bg-[#0D0704]/98 border-l border-white/10 p-5 sm:p-6 shadow-2xl shadow-black text-white/90"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Users className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-light tracking-widest uppercase text-amber-100/90 font-sans">
              Active Listeners
            </h2>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {listenerCount} {listenerCount === 1 ? 'Listener' : 'Listeners'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/50 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            Unique listener profiles tuned in
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-300 font-medium">
            Live Sync
          </span>
        </div>

        {/* Listeners List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {listeners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/40 text-xs">
              <Radio className="h-8 w-8 text-white/20 animate-pulse mb-2" />
              <span>Connecting to live listener stream...</span>
            </div>
          ) : (
            listeners.map((listener, idx) => {
              const isMe = listener.uid === currentUser.uid;
              const tabCount = (listener as any).tabCount || 1;
              const color = getAvatarColor(listener.name);

              return (
                <div
                  key={listener.uid || listener.sessionId || idx}
                  className={`flex items-center justify-between rounded-2xl p-3 border transition-all ${
                    isMe
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Avatar */}
                    {listener.avatar ? (
                      <img
                        src={listener.avatar}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-amber-500/30 shrink-0"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black ring-1 ring-white/10 shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {(listener.name || 'G')[0].toUpperCase()}
                      </div>
                    )}

                    {/* Name & Badges */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-light text-white text-xs sm:text-sm truncate"
                          style={{ fontFamily: '"Georgia", serif' }}
                        >
                          {listener.name}
                        </span>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-bold text-black uppercase">
                            You
                          </span>
                        )}
                        {isMe && tabCount > 1 && (
                          <span className="shrink-0 rounded-full bg-white/10 text-white/70 px-1.5 py-0.2 text-[9px] font-mono">
                            {tabCount} tabs open
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                          Listening live
                        </span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/40 font-mono">
                          {formatListeningDuration((listener as any).joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action: Send message in chat */}
                  {!isMe && (
                    <button
                      onClick={() => onStartChatWithUser(listener.name)}
                      title={`Message @${listener.name} in chat`}
                      className="flex h-8 items-center gap-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/20 hover:text-amber-300 text-white/50 px-2.5 text-xs transition-colors border border-white/10 cursor-pointer shrink-0 ml-2"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span className="hidden xs:inline text-[10px]">Chat</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span className="flex items-center gap-1 text-amber-300/80">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Time counted in Hall of Fame
          </span>
          <span className="font-mono text-[10px]">Updates live every 3s</span>
        </div>
      </div>
    </div>
  );
}
