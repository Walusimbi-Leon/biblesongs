import { Disc3, Radio } from 'lucide-react';
import { Song } from '../types';

interface TurntableDeckProps {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export function TurntableDeck({ song, isPlaying, currentTime, duration }: TurntableDeckProps) {
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const progressDeg = Math.round(progressRatio * 360);
  const displayTitle = song?.versionTitle || song?.title || 'SGSS Songs';

  return (
    <div id="turntable-deck" className="relative flex items-center justify-center p-2 sm:p-6 select-none">
      {/* Outer ambient glow */}
      <div
        className={`pointer-events-none absolute -inset-4 rounded-full blur-3xl transition-all duration-1000 ${
          isPlaying
            ? 'bg-amber-500/20 opacity-70 scale-105'
            : 'bg-amber-600/10 opacity-30 scale-95'
        }`}
      />

      {/* Main deck enclosure */}
      <div className="relative flex aspect-square w-full max-w-[330px] sm:max-w-[400px] items-center justify-center rounded-3xl bg-gradient-to-b from-[#180e07] via-[#0d0703] to-[#120a05] p-5 sm:p-7 shadow-2xl shadow-black/90 border border-white/10 ring-1 ring-amber-500/10">
        {/* Subtle deck ambient light */}
        <div
          className={`absolute inset-4 rounded-full transition-all duration-1000 blur-2xl ${
            isPlaying ? 'bg-amber-500/15 opacity-100 scale-105' : 'bg-amber-900/10 opacity-40 scale-95'
          }`}
        />

        {/* Circular progress outer border ring */}
        <div
          className="relative flex aspect-square w-full items-center justify-center rounded-full p-2 transition-all shadow-inner"
          style={{
            background: `conic-gradient(#f59e0b ${progressDeg}deg, rgba(255, 255, 255, 0.06) ${progressDeg}deg)`,
          }}
        >
          {/* Inner turntable platter */}
          <div className="relative flex aspect-square w-full items-center justify-center rounded-full bg-[#070301] p-2 shadow-2xl ring-1 ring-white/10">
            {/* Rotating Vinyl Record */}
            <div
              id="vinyl-record"
              className={`relative flex aspect-square w-full items-center justify-center rounded-full shadow-2xl overflow-hidden animate-vinyl ${
                isPlaying ? '' : 'animate-vinyl-paused'
              }`}
              style={{
                background: `
                  radial-gradient(circle at center, transparent 26%, rgba(10, 5, 2, 0.96) 27%),
                  repeating-radial-gradient(circle at center, #160c06 0, #0a0502 2px, #160c06 4px, #0a0502 6px)
                `,
              }}
            >
              {/* Radial reflection sheen */}
              <div
                className="absolute inset-0 rounded-full opacity-40 pointer-events-none"
                style={{
                  background:
                    'conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.08) 0deg, transparent 60deg, rgba(255,255,255,0.2) 120deg, transparent 180deg, rgba(255,255,255,0.08) 240deg, transparent 300deg, rgba(255,255,255,0.2) 360deg)',
                }}
              />

              {/* Center Vinyl Label */}
              <div className="relative flex h-[38%] w-[38%] items-center justify-center rounded-full bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 p-1.5 shadow-lg shadow-black/70 ring-2 ring-amber-300/40">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-amber-300/40 bg-[#0d0704]/90 p-2 text-center shadow-inner">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <Disc3 className="h-3 w-3 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
                  </div>
                  <span
                    className="font-serif text-[10px] sm:text-xs font-bold tracking-wider text-amber-100 uppercase line-clamp-1 mt-0.5"
                    title={displayTitle}
                  >
                    {displayTitle.slice(0, 14)}
                  </span>
                  <span className="text-[8px] font-bold text-amber-300 tracking-widest uppercase">
                    SGSS
                  </span>
                  {/* Spindle hole */}
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#0a0502] border-2 border-amber-400/80 shadow-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Turntable Tonearm */}
        <div
          id="turntable-tonearm"
          className="pointer-events-none absolute -top-1 right-2 sm:right-4 h-44 sm:h-56 w-24 transition-transform duration-700 ease-out"
          style={{
            transformOrigin: '62px 26px',
            transform: isPlaying ? 'rotate(22deg)' : 'rotate(3deg)',
          }}
        >
          {/* Base pivot */}
          <div className="absolute top-2 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-900 via-[#1f1008] to-[#0a0502] shadow-lg ring-1 ring-amber-500/40">
            <div className="h-4 w-4 rounded-full bg-amber-400/90 shadow-inner" />
          </div>
          {/* Pivot counterweight */}
          <div className="absolute top-0 right-5 h-4 w-7 rounded-sm bg-gradient-to-r from-amber-950 via-[#3a2213] to-amber-950 shadow" />
          {/* Metal arm */}
          <div className="absolute top-6 right-8 h-32 sm:h-40 w-1.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 shadow-md" />
          {/* Stylus headshell cartridge */}
          <div className="absolute bottom-2 sm:bottom-4 right-7 h-7 w-3.5 origin-top rotate-[-18deg] rounded-sm bg-gradient-to-b from-amber-500 via-amber-600 to-[#120a05] shadow-md ring-1 ring-amber-300/60">
            <div
              className={`absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full transition-colors ${
                isPlaying ? 'bg-amber-300 shadow-sm shadow-amber-300' : 'bg-amber-800'
              }`}
            />
          </div>
        </div>

        {/* Live broadcast badge in corner */}
        <div className="absolute bottom-4 left-6 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-[#0a0502]/80 px-3 py-1 border border-white/10 backdrop-blur-sm shadow-sm">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/90 font-medium">
              SGSS
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0a0502]/60 px-2.5 py-1 text-[10px] font-medium text-white/40 border border-white/[0.06]">
            <Radio className="h-3 w-3 text-amber-400/80" />
            24/7 STREAM
          </span>
        </div>
      </div>
    </div>
  );
}
