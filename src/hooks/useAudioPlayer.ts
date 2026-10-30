import { useState, useEffect, useRef, useCallback } from 'react';
import { Song, PlayerMode, AudioSyncData } from '../types';
import { FALLBACK_SONGS, INITIAL_EPOCH, INITIAL_CYCLE_MS } from '../constants/fallbackSongs';

export function useAudioPlayer() {
  const [mode, setMode] = useState<PlayerMode>('live');
  const [syncData, setSyncData] = useState<AudioSyncData | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>(FALLBACK_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(() => FALLBACK_SONGS[0] || null);
  const [nextSong, setNextSong] = useState<Song | null>(() => FALLBACK_SONGS[1] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(210);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('sgss-vol') || localStorage.getItem('bible-vol');
    return saved ? Number(saved) : 80;
  });
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSongIdRef = useRef<string | null>(null);
  const currentSongRef = useRef(currentSong);
  const modeRef = useRef<PlayerMode>('live');
  const onDemandIndexRef = useRef(0);
  const onEndedRef = useRef<() => void>(() => {});
  const fallbackTriedRef = useRef(false);
  const volumeRef = useRef(volume);
  const pendingSeekSecRef = useRef<number | null>(null);

  modeRef.current = mode;
  currentSongRef.current = currentSong;
  volumeRef.current = volume;

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => {
      setIsBuffering(false);
      if (pendingSeekSecRef.current !== null && pendingSeekSecRef.current > 0) {
        const seek = pendingSeekSecRef.current;
        pendingSeekSecRef.current = null;
        try {
          audio.currentTime = seek;
        } catch {
          // Ignore
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      if (pendingSeekSecRef.current !== null && pendingSeekSecRef.current > 0) {
        const seek = pendingSeekSecRef.current;
        pendingSeekSecRef.current = null;
        try {
          audio.currentTime = seek;
        } catch {
          // Ignore
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (modeRef.current === 'ondemand') {
        onEndedRef.current();
      } else {
        // In live mode, natural song completion -> advance to next live song
        onEndedRef.current();
      }
    };

    const handleError = (e: any) => {
      console.warn('[AudioSync] Audio playback error:', e);
      if (!fallbackTriedRef.current && currentSongRef.current?.url) {
        console.log('[AudioSync] Attempting fallback to direct mp3 url:', currentSongRef.current.url);
        fallbackTriedRef.current = true;
        audio.src = currentSongRef.current.url;
        audio.play().then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }).catch(() => {
          setIsBuffering(false);
          setIsPlaying(false);
        });
      } else {
        setIsBuffering(false);
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Calculate live song at a given timestamp
  const calculateLiveSong = useCallback((timestamp = Date.now(), data = syncData) => {
    if (!data || !data.songIds.length) return null;
    const offsetInCycle = ((timestamp - data.epoch) % data.cycleMs + data.cycleMs) % data.cycleMs;
    let accumulated = 0;

    for (let i = 0; i < data.songIds.length; i++) {
      const songId = data.songIds[i];
      const song = data.byId[songId];
      const dur = song.durationMs || 210000;
      if (accumulated + dur >= offsetInCycle) {
        return {
          index: i,
          id: songId,
          offsetMs: Math.max(0, offsetInCycle - accumulated),
          durationMs: dur,
          song,
        };
      }
      accumulated += dur;
    }

    const lastId = data.songIds[data.songIds.length - 1];
    return {
      index: data.songIds.length - 1,
      id: lastId,
      offsetMs: 0,
      durationMs: data.byId[lastId].durationMs || 210000,
      song: data.byId[lastId],
    };
  }, [syncData]);

  // Fetch sync data from server
  const fetchSync = useCallback(async () => {
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const byId: Record<string, Song> = {};
      data.rotation.forEach((s: Song) => {
        byId[s.id] = s;
      });
      const parsed: AudioSyncData = {
        epoch: data.epoch,
        cycleMs: data.cycleMs,
        songIds: data.rotation.map((s: Song) => s.id),
        byId,
        rotation: data.rotation,
      };
      setSyncData(parsed);
      setAllSongs(data.rotation);
      return parsed;
    } catch (err) {
      console.warn('[AudioSync] using fallback rotation schedule', err);
      const fallbackList = FALLBACK_SONGS;
      const totalDur = fallbackList.reduce((sum, s) => sum + (s.durationMs || 210000), 0);
      const byId: Record<string, Song> = {};
      fallbackList.forEach(s => { byId[s.id] = s; });
      const parsed: AudioSyncData = {
        epoch: INITIAL_EPOCH,
        cycleMs: totalDur || INITIAL_CYCLE_MS,
        songIds: fallbackList.map(s => s.id),
        byId,
        rotation: fallbackList,
      };
      setSyncData(parsed);
      return parsed;
    }
  }, []);

  useEffect(() => {
    fetchSync();
  }, [fetchSync]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchSync();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchSync]);

  // Play a live sync song
  const playLiveSong = useCallback((liveItem: { index: number; id: string; offsetMs: number; durationMs: number; song: Song }) => {
    const audio = audioRef.current;
    if (!audio) return;
    fallbackTriedRef.current = false;
    const startSec = Math.max(0, Math.floor(liveItem.offsetMs / 1000));

    currentSongIdRef.current = liveItem.id;
    setCurrentSong(liveItem.song);
    setDuration(liveItem.durationMs / 1000);

    const streamUrl = `/stream/${encodeURIComponent(liveItem.id)}`;
    pendingSeekSecRef.current = startSec;
    audio.src = streamUrl;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setAutoplayBlocked(false);
          setIsPlaying(true);
          if (startSec > 0 && Math.abs(audio.currentTime - startSec) > 3) {
            try {
              audio.currentTime = startSec;
            } catch {
              // Ignore
            }
          }
        })
        .catch(err => {
          console.warn('[AudioSync] Autoplay prevented by browser:', err.message);
          setAutoplayBlocked(true);
        });
    }
  }, []);

  // Continuous live tick loop
  useEffect(() => {
    if (mode !== 'live' || !syncData) return;

    const tick = () => {
      const live = calculateLiveSong(Date.now(), syncData);
      if (!live) return;

      const nextIdx = (live.index + 1) % syncData.songIds.length;
      const nextId = syncData.songIds[nextIdx];
      setNextSong(syncData.byId[nextId] || null);

      const audio = audioRef.current;

      // Check if song changed
      if (currentSongIdRef.current !== live.id) {
        // If the audio is currently playing and near the very end (within 4 seconds), let it finish naturally
        if (
          audio &&
          !audio.paused &&
          !audio.ended &&
          audio.duration > 0 &&
          audio.currentTime < audio.duration - 3.5
        ) {
          return;
        }
        playLiveSong(live);
        return;
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mode, syncData, calculateLiveSong, playLiveSong]);

  // Play on-demand song
  const playSongOnDemand = useCallback((song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;
    fallbackTriedRef.current = false;
    pendingSeekSecRef.current = 0;
    setMode('ondemand');
    setCurrentSong(song);
    currentSongIdRef.current = song.id;

    const idx = allSongs.findIndex(s => s.id === song.id || s.title === song.title || s.versionTitle === song.versionTitle);
    if (idx !== -1) {
      onDemandIndexRef.current = idx;
      const nextIdx = (idx + 1) % allSongs.length;
      setNextSong(allSongs[nextIdx]);
    }

    setCurrentTime(0);
    setDuration((song.durationMs || 210000) / 1000);
    audio.src = `/stream/${encodeURIComponent(song.id)}`;
    audio.play().then(() => {
      setAutoplayBlocked(false);
      setIsPlaying(true);
    }).catch(() => {
      setAutoplayBlocked(true);
    });
  }, [allSongs]);

  // Catch up to live stream
  const catchUpToLive = useCallback(() => {
    setMode('live');
    if (!syncData) return;
    const live = calculateLiveSong(Date.now(), syncData);
    if (live) {
      playLiveSong(live);
    }
  }, [syncData, calculateLiveSong, playLiveSong]);

  // Handle natural end in live and ondemand
  const handleSongEnded = useCallback(() => {
    if (modeRef.current === 'ondemand') {
      const nextIdx = (onDemandIndexRef.current + 1) % allSongs.length;
      playSongOnDemand(allSongs[nextIdx]);
    } else {
      // In live mode, calculate current live song and transition smoothly
      if (syncData) {
        const live = calculateLiveSong(Date.now(), syncData);
        if (live) {
          playLiveSong(live);
        }
      }
    }
  }, [allSongs, playSongOnDemand, syncData, calculateLiveSong, playLiveSong]);

  onEndedRef.current = handleSongEnded;

  // Switch to on-demand without interrupting current song
  const switchToOnDemand = useCallback(() => {
    setMode('ondemand');
    if (currentSong) {
      const idx = allSongs.findIndex(s => s.id === currentSong.id || s.title === currentSong.title);
      if (idx !== -1) {
        onDemandIndexRef.current = idx;
        const nextIdx = (idx + 1) % allSongs.length;
        setNextSong(allSongs[nextIdx]);
      }
    }
  }, [currentSong, allSongs]);

  // Seek
  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && mode === 'ondemand') {
      try {
        audio.currentTime = seconds;
        setCurrentTime(seconds);
      } catch {
        // Ignore
      }
    }
  }, [mode]);

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (mode === 'live') return;
      audio.pause();
      setIsPlaying(false);
    } else {
      if (mode === 'live' && syncData) {
        const live = calculateLiveSong(Date.now(), syncData);
        if (live) {
          playLiveSong(live);
          return;
        }
      }
      audio.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(() => {
        setAutoplayBlocked(true);
      });
    }
  }, [isPlaying, mode, syncData, calculateLiveSong, playLiveSong]);

  // Skip Next (on-demand)
  const skipNext = useCallback(() => {
    if (mode === 'live') return;
    const nextIdx = (onDemandIndexRef.current + 1) % allSongs.length;
    playSongOnDemand(allSongs[nextIdx]);
  }, [mode, allSongs, playSongOnDemand]);

  // Skip Prev (on-demand)
  const skipPrev = useCallback(() => {
    if (mode === 'live') return;
    const audio = audioRef.current;
    if (audio && (audio.currentTime || 0) > 3) {
      try {
        audio.currentTime = 0;
        setCurrentTime(0);
        return;
      } catch {
        // Ignore
      }
    }
    const prevIdx = (onDemandIndexRef.current - 1 + allSongs.length) % allSongs.length;
    playSongOnDemand(allSongs[prevIdx]);
  }, [mode, allSongs, playSongOnDemand]);

  // Volume
  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolumeState(clamped);
    localStorage.setItem('sgss-vol', String(clamped));
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (modeRef.current === 'live' && isPlaying) return;
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(volumeRef.current + 5);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(volumeRef.current - 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, toggleMute, setVolume, isPlaying]);

  return {
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
    dismissAutoplayGate: togglePlayPause,
  };
}
