import { Radio, Disc3, Music2, MessageSquare, Trophy, Users, Heart } from 'lucide-react';
import { PlayerMode } from '../types';

interface HeaderProps {
  mode: PlayerMode;
  onSelectMode: (mode: PlayerMode) => void;
  listenerCount: number;
  unreadChatCount: number;
  onToggleChat: () => void;
  onToggleLeaderboard: () => void;
  onToggleCatalog: () => void;
  onOpenListeners: () => void;
  isChatOpen: boolean;
  isLeaderboardOpen: boolean;
  isCatalogOpen: boolean;
  isListenersOpen: boolean;
}

export function Header({
  mode,
  onSelectMode,
  listenerCount,
  unreadChatCount,
  onToggleChat,
  onToggleLeaderboard,
  onToggleCatalog,
  onOpenListeners,
  isChatOpen,
  isLeaderboardOpen,
  isCatalogOpen,
  isListenersOpen,
}: HeaderProps) {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0A0502]/85 backdrop-blur-xl transition-colors"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
            <svg viewBox="0 0 24 24" fill="black" className="w-5 h-5">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0A0502]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-base sm:text-xl font-light tracking-widest uppercase text-amber-100/95 font-sans">
                SGSS <span className="font-semibold text-amber-400">SONGS</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 sm:px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">24/7 Live</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-100/50 tracking-wide font-light hidden sm:block">
              Continuous Worldwide Stream • SGSS Collection
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/[0.03] p-0.5 sm:p-1 border border-white/10 shadow-inner backdrop-blur-md">
          <button
            id="mode-btn-live"
            onClick={() => onSelectMode('live')}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-widest font-medium transition-all cursor-pointer ${
              mode === 'live'
                ? 'bg-amber-500 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
            <span>Live</span>
          </button>
          <button
            id="mode-btn-catalog"
            onClick={() => onSelectMode('ondemand')}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-widest font-medium transition-all cursor-pointer ${
              mode === 'ondemand'
                ? 'bg-amber-500 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Disc3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">On-Demand</span>
            <span className="sm:hidden">Demand</span>
          </button>
        </div>

        {/* Right Action Icons & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Listeners Pill */}
          <button
            id="active-listeners-pill"
            onClick={onOpenListeners}
            title={`${listenerCount} active ${listenerCount === 1 ? 'listener' : 'listeners'} tuned in. Click to view all.`}
            className={`hidden sm:flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer border ${
              isListenersOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.03] text-amber-100/90 border-white/10 hover:border-amber-400/40 hover:bg-white/[0.08]'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">{listenerCount}</span>
            <span className="text-white/50 text-[11px]">Listening</span>
          </button>

          {/* Catalog Button */}
          {mode === 'ondemand' && (
            <button
              id="nav-catalog-btn"
              onClick={onToggleCatalog}
              title="Browse all 160 SGSS Songs"
              className={`relative flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-medium transition-all border cursor-pointer ${
                isCatalogOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.03] text-white/70 border-white/10 hover:border-amber-400/40 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Music2 className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Songs</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                160
              </span>
            </button>
          )}

          {/* Chat Button */}
          <button
            id="nav-chat-btn"
            onClick={onToggleChat}
            title="Community Chat"
            className={`relative flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-medium transition-all border cursor-pointer ${
              isChatOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.03] text-white/70 border-white/10 hover:border-amber-400/40 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Chat</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-extrabold text-black shadow-sm">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Rankings Button */}
          <button
            id="nav-leaderboard-btn"
            onClick={onToggleLeaderboard}
            title="Top Listeners Rankings & Hall of Fame"
            className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-medium transition-all border cursor-pointer ${
              isLeaderboardOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.03] text-white/70 border-white/10 hover:border-amber-400/40 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Rankings</span>
          </button>

          {/* Support Developer Button */}
          <a
            id="nav-support-developer-btn"
            href="https://donate-to-sgss.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="Support Developer — Donate to SGSS"
            className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-semibold transition-all border cursor-pointer bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-500/35 hover:border-amber-400 hover:from-amber-500/30 hover:to-amber-600/30 hover:text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] active:scale-95"
          >
            <Heart className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Support Developer</span>
            <span className="sm:hidden">Support</span>
          </a>
        </div>
      </div>
    </header>
  );
}
