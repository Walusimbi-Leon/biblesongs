import { useState } from 'react';
import { Music2, MessageSquare, Trophy, Users } from 'lucide-react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useCommunity } from './hooks/useCommunity';
import { Header } from './components/Header';
import { TurntableDeck } from './components/TurntableDeck';
import { AudioVisualizer } from './components/AudioVisualizer';
import { PlayerControls } from './components/PlayerControls';
import { CatalogModal } from './components/CatalogModal';
import { ChatDrawer } from './components/ChatDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ActiveListenersModal } from './components/ActiveListenersModal';
import { AutoplayBanner } from './components/AutoplayBanner';

export default function App() {
  const {
    mode,
    currentSong,
    nextSong,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    isBuffering,
    autoplayBlocked,
    allSongs,
    setVolume,
    toggleMute,
    togglePlayPause,
    seekTo,
    skipNext,
    skipPrev,
    playSongOnDemand,
    catchUpToLive,
    switchToOnDemand,
    dismissAutoplayGate,
  } = useAudioPlayer();

  const {
    currentUser,
    currentSessionId,
    setUserNameAndAvatar,
    listeners,
    listenerCount,
    messages,
    sendMessage,
    replyTo,
    setReplyTo,
    unreadCount,
    markChatOpen,
    leaderboard,
    totalListenersAllTime,
  } = useCommunity();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isListenersOpen, setIsListenersOpen] = useState(false);

  const handleToggleChat = () => {
    const nextState = !isChatOpen;
    setIsChatOpen(nextState);
    markChatOpen(nextState);
  };

  const handleStartChatWithUser = (userName: string) => {
    setIsListenersOpen(false);
    setIsChatOpen(true);
    markChatOpen(true);
    setReplyTo({ name: userName, text: 'Hello!' });
  };

  const displayTitle = currentSong?.versionTitle || currentSong?.title || 'SGSS Songs';
  const displaySubtitle = currentSong?.title || 'SGSS Audio Collection';

  return (
    <div
      id="sgss-songs-app"
      className="relative flex min-h-screen flex-col bg-[#0A0502] text-white font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-amber-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[700px] h-[700px] bg-amber-800/10 rounded-full blur-[150px]" />
        <div
          className={`absolute top-1/4 left-1/3 w-[450px] h-[450px] rounded-full blur-[140px] transition-all duration-1000 ${
            isPlaying ? 'bg-amber-600/15 opacity-80 scale-110' : 'bg-amber-950/10 opacity-30 scale-90'
          }`}
        />
      </div>

      {/* Sticky Header */}
      <Header
        mode={mode}
        onSelectMode={newMode => {
          if (newMode === 'live') {
            catchUpToLive();
            setIsCatalogOpen(false);
          } else if (newMode === 'ondemand') {
            switchToOnDemand();
          }
        }}
        listenerCount={listenerCount}
        unreadChatCount={unreadCount}
        onToggleChat={handleToggleChat}
        onToggleLeaderboard={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
        onToggleCatalog={() => setIsCatalogOpen(!isCatalogOpen)}
        onOpenListeners={() => setIsListenersOpen(!isListenersOpen)}
        isChatOpen={isChatOpen}
        isLeaderboardOpen={isLeaderboardOpen}
        isCatalogOpen={isCatalogOpen}
        isListenersOpen={isListenersOpen}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
          {/* Left Column: Visual Turntable & Audio Wave Visualizer */}
          <div className="w-full lg:w-[45%] flex flex-col items-center justify-center">
            <TurntableDeck
              song={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
            />
            <div className="w-full max-w-md px-4 mt-2 mb-1">
              <AudioVisualizer isPlaying={isPlaying} barCount={48} />
            </div>
          </div>

          {/* Right Column: Track Information & Player Controls */}
          <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Category / Artist Pill */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                {currentSong?.category || 'SGSS'}
              </span>
              <span className="text-xs text-amber-100/50 font-light tracking-wider">
                • {currentSong?.artist || 'SGSS'}
              </span>
            </div>

            {/* Song Title */}
            <h1
              id="song-display-title"
              className="text-3xl sm:text-5xl lg:text-6xl font-light italic mb-2 tracking-tight text-white/95 leading-[1.15]"
              style={{ fontFamily: '"Georgia", "Cinzel", serif' }}
            >
              {displayTitle}
            </h1>

            {/* Subtitle */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 sm:mb-8">
              <p className="text-base sm:text-lg text-amber-100/60 font-light tracking-wide">
                {displaySubtitle} • SGSS
              </p>
            </div>

            {/* Player Controls Deck */}
            <PlayerControls
              mode={mode}
              song={currentSong}
              nextSong={nextSong}
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              currentTime={currentTime}
              duration={duration}
              isBuffering={isBuffering}
              onTogglePlayPause={togglePlayPause}
              onSeek={seekTo}
              onSetVolume={setVolume}
              onToggleMute={toggleMute}
              onSkipNext={skipNext}
              onSkipPrev={skipPrev}
              onCatchUpToLive={catchUpToLive}
              onOpenCatalog={mode === 'ondemand' ? () => setIsCatalogOpen(true) : undefined}
            />

            {/* Mobile Bottom Quick Actions */}
            <div className="flex md:hidden items-center justify-center gap-2 mt-5 w-full">
              <button
                onClick={() => setIsListenersOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2.5 text-xs font-semibold text-emerald-300 border border-white/10 hover:bg-white/[0.06] cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>{listenerCount} Listening</span>
              </button>
              {mode === 'ondemand' && (
                <button
                  onClick={() => setIsCatalogOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2.5 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/[0.06] cursor-pointer"
                >
                  <Music2 className="h-3.5 w-3.5 text-amber-400" />
                  Songs
                </button>
              )}
              <button
                onClick={handleToggleChat}
                className="relative flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2.5 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/[0.06] cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                Chat
                {unreadCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black ml-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2.5 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/[0.06] cursor-pointer"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Rankings
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 sm:px-10 py-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] uppercase tracking-[0.25em] text-white/30">
        <span>© SGSS Songs</span>
        <span className="hidden md:inline">SGSS Audio Collection • 24/7 Continuous Radio</span>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/50 lowercase tracking-normal text-[11px] font-mono">
            live sync active
          </span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        songs={allSongs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onSelectSong={song => {
          playSongOnDemand(song);
          setIsCatalogOpen(false);
        }}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          markChatOpen(false);
        }}
        messages={messages}
        currentUser={currentUser}
        replyTo={replyTo}
        onSetReplyTo={setReplyTo}
        onSendMessage={sendMessage}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboard={leaderboard}
        totalListeners={totalListenersAllTime}
        currentUser={currentUser}
      />

      <ActiveListenersModal
        isOpen={isListenersOpen}
        onClose={() => setIsListenersOpen(false)}
        listeners={listeners}
        listenerCount={listenerCount}
        currentUser={currentUser}
        currentSessionId={currentSessionId}
        onStartChatWithUser={handleStartChatWithUser}
      />

      <AutoplayBanner
        isVisible={autoplayBlocked}
        onDismiss={dismissAutoplayGate}
      />
    </div>
  );
}
