import React, { useState, useMemo } from 'react';
import { Music2, X, Search, Play, Volume2 } from 'lucide-react';
import { Song } from '../types';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor((ms || 210000) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function CatalogModal({
  isOpen,
  onClose,
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
}: CatalogModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Psalms', 'Song of Solomon'];

  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const matchCat =
        selectedCategory === 'All' ||
        song.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = search.toLowerCase().trim();
      if (!query) return matchCat;

      const matchSearch =
        song.title?.toLowerCase().includes(query) ||
        song.versionTitle?.toLowerCase().includes(query) ||
        song.category?.toLowerCase().includes(query);

      return matchCat && matchSearch;
    });
  }, [songs, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="catalog-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        id="catalog-drawer-panel"
        className="relative flex h-full w-full max-w-lg flex-col bg-[#0D0704]/98 border-l border-white/10 p-5 sm:p-6 shadow-2xl shadow-black text-white/90"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Music2 className="h-5 w-5" />
            <h2 className="text-base sm:text-lg font-light tracking-widest uppercase text-amber-100/90 font-sans">
              Song Catalog
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              {songs.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search song title or chapter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-white/[0.04] py-2.5 pl-10 pr-8 text-xs text-white placeholder-white/40 border border-white/10 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
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

        {/* Category Filter Pills */}
        <div className="mt-3 flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black font-semibold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-white/[0.04] text-white/60 border border-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Song List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 text-xs">
              <span>No songs match "{search}"</span>
            </div>
          ) : (
            filteredSongs.map(song => {
              const isCurrent = currentSong && (currentSong.id === song.id || currentSong.title === song.title);
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`group flex items-center justify-between rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isCurrent
                          ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
                          : 'bg-white/[0.05] text-white/60 group-hover:bg-amber-500/20 group-hover:text-amber-400'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Volume2 className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4
                        className={`text-sm font-light truncate ${
                          isCurrent
                            ? 'text-amber-300 font-medium'
                            : 'text-white/90 group-hover:text-amber-200'
                        } transition-colors`}
                        style={{ fontFamily: '"Georgia", serif' }}
                      >
                        {song.versionTitle || song.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span className="uppercase tracking-widest font-semibold text-amber-400/90">
                          {song.category}
                        </span>
                        <span>•</span>
                        <span>{song.artist || 'SGSS'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 font-mono text-xs text-white/40 ml-2">
                    {formatDuration(song.durationMs)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
