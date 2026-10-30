import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Radio,
  Disc3,
} from 'lucide-react';
import { Song, PlayerMode } from '../types';

interface PlayerControlsProps {
  mode: PlayerMode;
  song: Song | null;
  nextSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onCatchUpToLive: () => void;
  onOpenCatalog?: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function PlayerControls({
  mode,
  song,
  nextSong,
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  isBuffering,
  onTogglePlayPause,
  onSeek,
  onSetVolume,
  onToggleMute,
  onSkipNext,
  onSkipPrev,
  onCatchUpToLive,
  onOpenCatalog,
}: PlayerControlsProps) {
  const effectiveVolume = isMuted ? 0 : volume;
  const isLive = mode === 'live';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  return (
    <div id="player-controls-container" className="w-full flex flex-col items-center gap-5 sm:gap-6 select-none">
      {/* Mode Status & Return to Live Bar */}
      <div className="w-full flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 border border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-xs">
          {isLive ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </span>
              <span className="font-semibold text-emerald-300 tracking-wide">Live Stream</span>
              <span className="hidden sm:inline text-white/40 tracking-wider text-[11px] uppercase">
                • Continuous Worldwide Broadcast
              </span>
            </>
          ) : (
            <>
              <Disc3 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span className="font-semibold text-amber-300 tracking-wide">On-Demand Track</span>
              <span className="hidden sm:inline text-white/40 tracking-wider text-[11px] uppercase">
                • Full Playback Control
              </span>
            </>
          )}
        </div>

        {!isLive && (
          <button
            id="controls-return-live-btn"
            onClick={onCatchUpToLive}
            className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <Radio className="h-3 w-3" />
            <span>Return to Live</span>
          </button>
        )}
      </div>

      {/* Scrubber Progress Bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="relative flex items-center">
          <input
            id="track-scrubber"
            type="range"
            min={0}
            max={duration || 210}
            step={0.5}
            value={currentTime}
            disabled={isLive}
            onChange={handleScrubberChange}
            className={`w-full h-1.5 rounded-full appearance-none bg-white/10 ${
              isLive ? 'cursor-default opacity-75' : 'cursor-pointer hover:h-2 transition-all'
            }`}
            style={{
              background: `linear-gradient(to right, #d97706 0%, #fbbf24 ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-white/40 tracking-wider px-0.5">
          <span>{formatTime(currentTime)}</span>
          {isBuffering && (
            <span className="text-amber-400 animate-pulse font-sans font-medium text-[10px] tracking-widest uppercase">
              Tuning SGSS stream...
            </span>
          )}
          {isLive && (
            <span className="text-emerald-400/80 font-sans font-medium text-[10px] tracking-wider uppercase hidden sm:inline">
              Live Broadcast
            </span>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport Buttons */}
      <div className="w-full flex items-center justify-center gap-8 sm:gap-10 my-2">
        {/* Skip Previous */}
        <button
          id="controls-skip-prev"
          onClick={isLive ? undefined : onSkipPrev}
          disabled={isLive}
          title={isLive ? 'Previous track is only available in On-Demand mode' : 'Previous Song'}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all bg-white/[0.02] ${
            isLive
              ? 'border-white/10 text-white/20 cursor-not-allowed opacity-35'
              : 'border-white/20 text-white/70 hover:border-amber-400 hover:text-amber-400 hover:scale-105 active:scale-95 cursor-pointer'
          }`}
        >
          <SkipBack className="h-5 w-5 fill-current" />
        </button>

        {/* Big Play / Pause / Live Button */}
        <button
          id="controls-play-pause-btn"
          onClick={isLive && isPlaying ? undefined : onTogglePlayPause}
          disabled={isLive && isPlaying}
          title={
            isLive && isPlaying
              ? 'Live songs stream continuously. Switch to On-Demand or use Mute.'
              : isPlaying
              ? 'Pause'
              : 'Play'
          }
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all ${
            isLive && isPlaying
              ? 'bg-white text-black shadow-[0_0_35px_rgba(245,158,11,0.3)] cursor-not-allowed select-none opacity-95'
              : 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 cursor-pointer'
          }`}
        >
          {isPlaying ? (
            isLive ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Radio className="h-7 w-7 text-black animate-pulse" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-black mt-0.5">
                  LIVE
                </span>
              </div>
            ) : (
              <Pause className="h-8 w-8 fill-current text-black" />
            )
          ) : (
            <Play className="h-8 w-8 fill-current text-black ml-1" />
          )}
        </button>

        {/* Skip Next */}
        <button
          id="controls-skip-next"
          onClick={isLive ? undefined : onSkipNext}
          disabled={isLive}
          title={isLive ? 'Next track is only available in On-Demand mode' : 'Next Song'}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all bg-white/[0.02] ${
            isLive
              ? 'border-white/10 text-white/20 cursor-not-allowed opacity-35'
              : 'border-white/20 text-white/70 hover:border-amber-400 hover:text-amber-400 hover:scale-105 active:scale-95 cursor-pointer'
          }`}
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </div>

      {/* Up Next Preview Card */}
      <div className="w-full bg-white/[0.03] backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/[0.05]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-white/30">
            Up Next
          </span>
          {!isLive && onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
            >
              Browse All
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Disc3 className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span
                className="text-sm font-medium text-white/90 truncate"
                title={nextSong?.versionTitle || nextSong?.title || 'Upcoming SGSS Song'}
              >
                {nextSong?.versionTitle || nextSong?.title || 'Upcoming SGSS Song...'}
              </span>
              <span className="text-[11px] text-white/40 truncate">
                {nextSong ? `${nextSong.category} • SGSS` : 'Next in scheduled broadcast'}
              </span>
            </div>
          </div>

          {!isLive && (
            <button
              onClick={onSkipNext}
              className="shrink-0 text-xs text-amber-400 hover:text-amber-300 border border-white/10 rounded-full px-3 py-1 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Play Next
            </button>
          )}
        </div>
      </div>

      {/* Bottom Volume Controls & Hotkeys Hint */}
      <div className="w-full flex items-center justify-between gap-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button
            id="controls-mute-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            className="text-white/40 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {effectiveVolume === 0 ? (
              <VolumeX className="h-4 w-4 text-amber-400" />
            ) : effectiveVolume < 50 ? (
              <Volume1 className="h-4 w-4 text-white/60" />
            ) : (
              <Volume2 className="h-4 w-4 text-white/60" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Vol</span>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={100}
              value={effectiveVolume}
              onChange={e => onSetVolume(Number(e.target.value))}
              className="w-20 sm:w-28 h-1 rounded-full appearance-none bg-white/10 cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${effectiveVolume}%, rgba(255, 255, 255, 0.1) ${effectiveVolume}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
            <span className="font-mono text-[10px] text-white/40 w-6 text-right">
              {effectiveVolume}%
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px] text-white/30">
          <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">M</kbd> Mute</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">↑/↓</kbd> Volume</span>
        </div>
      </div>
    </div>
  );
}
