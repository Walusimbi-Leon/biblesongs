import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveListener, ChatMessage, ChatUser, LeaderboardUser } from '../types';

function getTabSessionId(): string {
  let sid = sessionStorage.getItem('sgss-tab-session-id');
  if (!sid) {
    sid = 'tab_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('sgss-tab-session-id', sid);
  }
  return sid;
}

function detectDiscordUser(): ChatUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const uid =
      searchParams.get('uid') ||
      searchParams.get('user_id') ||
      searchParams.get('discord_id') ||
      hashParams.get('uid');
    const name =
      searchParams.get('name') ||
      searchParams.get('username') ||
      hashParams.get('name') ||
      hashParams.get('username');
    const avatar =
      searchParams.get('avatar') ||
      searchParams.get('avatar_url') ||
      hashParams.get('avatar');

    // Discord snowflake UID (17-20 digits) or avatar from Discord CDN
    if (uid && (/^\d{17,20}$/.test(uid) || (avatar && avatar.includes('discord')))) {
      const user: ChatUser = {
        uid,
        name: name || `DiscordUser-${uid.slice(-4)}`,
        avatar: avatar || '',
      };
      localStorage.setItem('sgss-uid', user.uid);
      localStorage.setItem('sgss-username', user.name);
      if (user.avatar) localStorage.setItem('sgss-avatar', user.avatar);
      return user;
    }

    // Check if already stored as Discord user
    const savedUid = localStorage.getItem('sgss-uid');
    const savedName = localStorage.getItem('sgss-username');
    const savedAvatar = localStorage.getItem('sgss-avatar') || '';
    if (savedUid && (/^\d{17,20}$/.test(savedUid) || savedAvatar.includes('discord'))) {
      return {
        uid: savedUid,
        name: savedName || `DiscordUser-${savedUid.slice(-4)}`,
        avatar: savedAvatar,
      };
    }
  } catch {
    // Ignore URL parse errors
  }

  return null;
}

function getStoredBrowserUser(): ChatUser | null {
  if (typeof window === 'undefined') return null;
  const uid = localStorage.getItem('sgss-uid');
  const name = localStorage.getItem('sgss-username');
  const avatar = localStorage.getItem('sgss-avatar') || '';

  // Valid sequential Listener S user: e.g. g-s1, g-s2...
  if (uid && /^g-s\d+$/i.test(uid) && name) {
    return { uid, name, avatar };
  }

  // Custom user name explicitly set by user:
  const customName = localStorage.getItem('sgss-custom-name');
  if (uid && customName && /^g-s\d+$/i.test(uid)) {
    return { uid, name: customName, avatar };
  }

  return null;
}

export function useCommunity() {
  const [currentUser, setCurrentUser] = useState<ChatUser>(() => {
    // 1. Check for Discord user first
    const discordUser = detectDiscordUser();
    if (discordUser) return discordUser;

    // 2. Check for existing assigned Listener S browser user
    const existing = getStoredBrowserUser();
    if (existing) return existing;

    // 3. Temporary placeholder while registering sequential identifier
    return {
      uid: '',
      name: 'Connecting...',
      avatar: '',
    };
  });

  const [listeners, setListeners] = useState<ActiveListener[]>([]);
  const [listenerCount, setListenerCount] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [totalListenersAllTime, setTotalListenersAllTime] = useState<number>(219);
  const [replyTo, setReplyTo] = useState<{ id?: string; name: string; text: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const tabSessionIdRef = useRef<string>(getTabSessionId());
  const isChatOpenRef = useRef<boolean>(false);
  const lastReadTimestampRef = useRef<number>(Date.now());
  const currentUserRef = useRef<ChatUser>(currentUser);
  currentUserRef.current = currentUser;

  // Register browser user if not yet registered
  const registerUserIfNeeded = useCallback(async () => {
    const discord = detectDiscordUser();
    if (discord) {
      setCurrentUser(discord);
      return discord;
    }

    const existing = getStoredBrowserUser();
    if (existing) {
      setCurrentUser(existing);
      return existing;
    }

    try {
      const res = await fetch('/api/register-listener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: localStorage.getItem('sgss-avatar') || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assigned: ChatUser = {
          uid: data.uid,
          name: data.name,
          avatar: data.avatar || '',
        };
        localStorage.setItem('sgss-uid', assigned.uid);
        localStorage.setItem('sgss-username', assigned.name);
        setCurrentUser(assigned);
        return assigned;
      }
    } catch (err) {
      console.warn('[Community] Failed to register listener sequence:', err);
    }

    // Fallback if offline
    const fallbackUser: ChatUser = {
      uid: 'g-s1',
      name: 'Listener S1',
      avatar: '',
    };
    localStorage.setItem('sgss-uid', fallbackUser.uid);
    localStorage.setItem('sgss-username', fallbackUser.name);
    setCurrentUser(fallbackUser);
    return fallbackUser;
  }, []);

  const setUserNameAndAvatar = useCallback((newName: string, newAvatar?: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    localStorage.setItem('sgss-custom-name', trimmed);
    localStorage.setItem('sgss-username', trimmed);
    if (newAvatar !== undefined) {
      localStorage.setItem('sgss-avatar', newAvatar);
    }

    const updated: ChatUser = {
      ...currentUserRef.current,
      name: trimmed,
      avatar: newAvatar !== undefined ? newAvatar : currentUserRef.current.avatar,
    };
    setCurrentUser(updated);

    // Announce update to server
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tabSessionIdRef.current,
        uid: updated.uid,
        name: updated.name,
        avatar: updated.avatar,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.listeners) {
          setListeners(data.listeners);
          setListenerCount(data.count ?? data.listeners.length);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch unique active listeners
  const fetchListeners = useCallback(async () => {
    try {
      const res = await fetch('/api/listeners', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.listeners)) {
        setListeners(data.listeners);
        setListenerCount(data.count ?? data.listeners.length);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Send presence heartbeat
  const sendPresence = useCallback(async (isLeaving = false) => {
    try {
      const u = currentUserRef.current;
      if (!u.uid) return;

      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLeaving
            ? { sessionId: tabSessionIdRef.current, gone: true }
            : {
                sessionId: tabSessionIdRef.current,
                uid: u.uid,
                name: u.name,
                avatar: u.avatar,
              }
        ),
      });

      if (res.ok && !isLeaving) {
        const data = await res.json();
        if (data.listeners) {
          setListeners(data.listeners);
          setListenerCount(data.count ?? data.listeners.length);
        }
      }
    } catch {
      // Ignore network errors in presence ping
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
        setTotalListenersAllTime(data.total || data.leaderboard.length);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch chat (fetches last 400 messages for fast response and no lag)
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?limit=400', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMessage[] = data.messages || [];
      setMessages(msgs);

      if (isChatOpenRef.current) {
        lastReadTimestampRef.current = Date.now();
        setUnreadCount(0);
      } else {
        const myUid = currentUserRef.current.uid;
        const newOnes = msgs.filter(m => m.user?.uid !== myUid && m.ts > lastReadTimestampRef.current).length;
        setUnreadCount(Math.min(newOnes, 99));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Send chat message
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      text: trimmed,
      ts: Date.now(),
      user: currentUserRef.current,
      replyTo: replyTo ? { ...replyTo } : undefined,
    };

    lastReadTimestampRef.current = Date.now();
    setMessages(prev => [...prev, newMsg]);
    setReplyTo(null);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
      fetchChat();
    } catch (err) {
      console.warn('[Community] failed to post message', err);
    }
  }, [replyTo, fetchChat]);

  const markChatOpen = useCallback((open: boolean) => {
    isChatOpenRef.current = open;
    if (open) {
      lastReadTimestampRef.current = Date.now();
      setUnreadCount(0);
    }
  }, []);

  // Listen to cross-tab storage changes so all tabs in the same browser profile stay 100% in sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgss-username' || e.key === 'sgss-uid' || e.key === 'sgss-avatar') {
        const uid = localStorage.getItem('sgss-uid') || currentUserRef.current.uid;
        const name = localStorage.getItem('sgss-username') || currentUserRef.current.name;
        const avatar = localStorage.getItem('sgss-avatar') || '';
        setCurrentUser({ uid, name, avatar });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Setup intervals
  useEffect(() => {
    registerUserIfNeeded().then(() => {
      sendPresence(false).then(() => fetchListeners());
    });
    fetchLeaderboard();
    fetchChat();

    // Fast polling (3s listeners, 4s chat, 15s presence, 20s leaderboard)
    const listenersInterval = setInterval(fetchListeners, 3000);
    const presenceInterval = setInterval(() => sendPresence(false), 15000);
    const chatInterval = setInterval(fetchChat, 4000);
    const leaderboardInterval = setInterval(fetchLeaderboard, 20000);

    const handleBeforeUnload = () => {
      const payload = JSON.stringify({ sessionId: tabSessionIdRef.current, gone: true });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/presence', new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      clearInterval(listenersInterval);
      clearInterval(chatInterval);
      clearInterval(leaderboardInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [registerUserIfNeeded, sendPresence, fetchListeners, fetchLeaderboard, fetchChat]);

  return {
    currentUser,
    currentSessionId: tabSessionIdRef.current,
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
    refreshListeners: fetchListeners,
  };
}
