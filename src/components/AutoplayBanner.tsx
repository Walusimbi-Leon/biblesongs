import { Volume2, Play } from 'lucide-react';

interface AutoplayBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function AutoplayBanner({ isVisible, onDismiss }: AutoplayBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      id="autoplay-fallback-banner"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-5 py-3.5 text-slate-950 shadow-2xl shadow-amber-500/40 border border-amber-300 ring-2 ring-amber-400/50 cursor-pointer animate-bounce hover:scale-105 transition-transform"
      onClick={onDismiss}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-amber-400">
        <Volume2 className="h-5 w-5 animate-pulse" />
      </div>
      <div className="text-left">
        <h4 className="font-bold text-sm leading-tight">Tap to start continuous audio</h4>
        <p className="text-xs text-slate-900/80">Browser requires a touch to begin live playback</p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-400 shadow hover:bg-slate-900 cursor-pointer"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        Play
      </button>
    </div>
  );
}
