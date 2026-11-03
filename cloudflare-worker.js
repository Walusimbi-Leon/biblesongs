/**
 * Cloudflare Worker for Bible Songs (SGSS)
 * Target: https://bible-songs.walusimbileon1.workers.dev/
 *
 * Pre-configured with Firebase Realtime Database:
 * Database: https://bible-songs-1-default-rtdb.firebaseio.com/bible
 * Auth Secret: QHqRoEfLKuZQ4ewhKliHHOsQg06a0nXY8Qk0eHGO
 */

import songsData from './server/data/songs.json';

const FIREBASE_DB = 'https://bible-songs-1-default-rtdb.firebaseio.com/bible';
const FIREBASE_SECRET = 'QHqRoEfLKuZQ4ewhKliHHOsQg06a0nXY8Qk0eHGO';

function fbUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${FIREBASE_DB}${cleanPath}.json?auth=${encodeURIComponent(FIREBASE_SECRET)}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}

function isDiscordUser(uid, avatar) {
  if (uid && /^\d{17,20}$/.test(uid)) return true;
  if (avatar && (avatar.includes('discordapp') || avatar.includes('discord.com'))) return true;
  return false;
}

// Build song lookup map for streaming
const songMap = new Map();
if (songsData && Array.isArray(songsData.rotation)) {
  for (const s of songsData.rotation) {
    if (s.id) songMap.set(s.id, s);
    if (s.title) songMap.set(s.title, s);
    if (s.versionTitle) songMap.set(s.versionTitle, s);
    if (Array.isArray(s.versions)) {
      for (const v of s.versions) {
        if (v.id) songMap.set(v.id, v);
        if (v.title) songMap.set(v.title, v);
      }
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Synchronized Playback State API
    if (pathname === '/api/sync') {
      const now = Date.now();
      const epoch = songsData.epoch || 1788247920000;
      const cycleMs = songsData.cycleMs || 41204184;
      const rotation = songsData.rotation || [];

      const cycleOffset = ((now - epoch) % cycleMs + cycleMs) % cycleMs;
      let accumulated = 0;
      let current = null;
      let nextSong = null;

      for (let i = 0; i < rotation.length; i++) {
        const s = rotation[i];
        const dur = s.durationMs || 210000;
        if (accumulated + dur >= cycleOffset) {
          current = {
            index: i,
            id: s.id,
            offsetMs: Math.max(0, cycleOffset - accumulated),
            durationMs: dur,
            song: s
          };
          nextSong = rotation[(i + 1) % rotation.length];
          break;
        }
        accumulated += dur;
      }

      if (!current && rotation.length > 0) {
        current = {
          index: 0,
          id: rotation[0].id,
          offsetMs: 0,
          durationMs: rotation[0].durationMs || 210000,
          song: rotation[0]
        };
        nextSong = rotation[1] || rotation[0];
      }

      return jsonResponse({
        epoch,
        cycleMs,
        now,
        loop: Math.floor((now - epoch) / cycleMs),
        current,
        next: nextSong,
        rotation,
        count: rotation.length
      });
    }

    // 2. Leaderboard endpoint
    if (pathname === '/api/leaderboard') {
      try {
        const res = await fetch(fbUrl('/users'));
        const data = await res.json();
        const users = data ? Object.values(data) : [];
        users.sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
        return jsonResponse({ leaderboard: users, total: users.length });
      } catch (err) {
        return jsonResponse({ error: 'Failed to fetch leaderboard', leaderboard: [], total: 0 }, 500);
      }
    }

    // 3. Chat endpoint (GET: last 400 messages, POST: append message without deletion)
    if (pathname === '/api/chat') {
      if (request.method === 'GET') {
        try {
          const res = await fetch(fbUrl('/chat'));
          const data = await res.json();
          let messages = data ? Object.values(data) : [];
          messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          const total = messages.length;
          if (messages.length > 400) {
            messages = messages.slice(-400);
          }
          return jsonResponse({ messages, total });
        } catch {
          return jsonResponse({ messages: [], total: 0 });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, text, ts, user, replyTo } = body || {};
          if (!text || typeof text !== 'string' || !text.trim()) {
            return jsonResponse({ error: 'Text is required' }, 400);
          }
          const msgId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const msg = {
            id: msgId,
            text: text.trim().slice(0, 500),
            ts: ts || Date.now(),
            user: {
              uid: user?.uid || 'g-s1',
              name: user?.name || 'Listener S1',
              avatar: user?.avatar || ''
            },
            replyTo: replyTo && replyTo.name ? {
              id: replyTo.id,
              name: replyTo.name,
              text: (replyTo.text || '').slice(0, 100)
            } : undefined
          };

          await fetch(fbUrl(`/chat/${encodeURIComponent(msgId).replace(/\./g, '_')}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
          });
          return jsonResponse({ ok: true, message: msg });
        } catch (err) {
          return jsonResponse({ error: 'Failed to post message' }, 500);
        }
      }
    }

    // 4. Register sequential listener (Listener S1, Listener S2... or keep Discord)
    if (pathname === '/api/register-listener' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { uid, name, avatar } = body || {};

        if (isDiscordUser(uid, avatar)) {
          return jsonResponse({
            uid,
            name: name || 'Discord Listener',
            avatar: avatar || '',
            isDiscord: true
          });
        }

        if (uid && /^g-s\d+$/i.test(uid)) {
          return jsonResponse({
            uid,
            name: name || uid.replace('g-s', 'Listener S'),
            avatar: avatar || '',
            isDiscord: false
          });
        }

        // Fetch and increment lastListenerNumber
        const numRes = await fetch(fbUrl('/meta/lastListenerNumber'));
        const rawNum = await numRes.text();
        const currentNum = parseInt(rawNum, 10) || 0;
        const nextNum = currentNum + 1;

        await fetch(fbUrl('/meta/lastListenerNumber'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextNum)
        });

        const assignedUid = `g-s${nextNum}`;
        const assignedName = `Listener S${nextNum}`;

        await fetch(fbUrl(`/users/${assignedUid}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: assignedUid,
            name: assignedName,
            avatar: avatar || '',
            seconds: 0,
            lastSeen: Date.now(),
            firstSeen: Date.now()
          })
        });

        return jsonResponse({
          uid: assignedUid,
          name: assignedName,
          avatar: avatar || '',
          listenerNumber: nextNum,
          isDiscord: false
        });
      } catch (err) {
        return jsonResponse({ error: 'Failed to register listener' }, 500);
      }
    }

    // 5. Presence and listening time heartbeat (with strict null-safety check)
    if (pathname === '/api/presence' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { sessionId, uid, name, avatar, gone } = body || {};
        if (!sessionId) {
          return jsonResponse({ error: 'Missing sessionId' }, 400);
        }

        const safeSessionId = encodeURIComponent(sessionId).replace(/\./g, '_');
        const now = Date.now();

        if (gone) {
          await fetch(fbUrl(`/presence/${safeSessionId}`), { method: 'DELETE' });
          return jsonResponse({ ok: true, gone: true });
        }

        const effectiveUid = uid || 'g-s1';
        const isDiscord = isDiscordUser(effectiveUid, avatar);
        const effectiveName = (name && name.trim()) || (isDiscord ? 'Discord User' : 'Listener S1');
        const safeUid = encodeURIComponent(effectiveUid).replace(/\./g, '_');

        // Check previous beat in presence with safe null guard
        const prevRes = await fetch(fbUrl(`/presence/${safeSessionId}`));
        const prevData = await prevRes.json();

        if (prevData && prevData.lastBeat) {
          const deltaMs = now - prevData.lastBeat;
          if (deltaMs > 0 && deltaMs < 60_000) {
            const secondsToAdd = deltaMs / 1000;
            const uRes = await fetch(fbUrl(`/users/${safeUid}`));
            const uData = await uRes.json();
            const currentSeconds = (uData && typeof uData.seconds === 'number') ? uData.seconds : 0;

            await fetch(fbUrl(`/users/${safeUid}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...(uData || {}),
                uid: effectiveUid,
                name: effectiveName,
                avatar: avatar || (uData ? uData.avatar : '') || '',
                seconds: currentSeconds + secondsToAdd,
                lastSeen: now
              })
            });
          }
        }

        // Save session presence
        await fetch(fbUrl(`/presence/${safeSessionId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: effectiveUid,
            name: effectiveName,
            avatar: avatar || '',
            lastBeat: now
          })
        });

        return jsonResponse({ ok: true, active: true });
      } catch (err) {
        return jsonResponse({ error: 'Presence update error' }, 500);
      }
    }

    // 6. Active listeners count and list (deduplicated by UID across multiple tabs)
    if (pathname === '/api/listeners') {
      try {
        const res = await fetch(fbUrl('/presence'));
        const data = await res.json();
        const now = Date.now();
        const userMap = new Map();

        if (data && typeof data === 'object') {
          for (const [sessId, sess] of Object.entries(data)) {
            if (sess && now - (sess.lastBeat || 0) <= 45_000) {
              const u = userMap.get(sess.uid);
              if (!u) {
                userMap.set(sess.uid, {
                  sessionId: sessId,
                  uid: sess.uid,
                  name: sess.name,
                  avatar: sess.avatar || '',
                  lastBeat: sess.lastBeat,
                  tabCount: 1
                });
              } else {
                u.tabCount += 1;
              }
            }
          }
        }

        const list = Array.from(userMap.values());
        return jsonResponse({ listeners: list, count: list.length });
      } catch {
        return jsonResponse({ listeners: [], count: 0 });
      }
    }

    // 7. Audio streaming proxy with HTTP range support
    if (pathname.startsWith('/stream/')) {
      try {
        const songId = decodeURIComponent(pathname.replace('/stream/', ''));
        const song = songMap.get(songId);
        const songUrl = song?.url || (song?.versions && song.versions[0]?.url);

        if (!songUrl) {
          return new Response('Song not found', { status: 404, headers: corsHeaders() });
        }

        const clientRange = request.headers.get('Range') || request.headers.get('range');
        const reqHeaders = {};
        if (clientRange) {
          reqHeaders['Range'] = clientRange;
        }

        const upstream = await fetch(songUrl, {
          headers: reqHeaders,
          redirect: 'follow'
        });

        const respHeaders = new Headers(corsHeaders());
        respHeaders.set('Content-Type', 'audio/mpeg');
        respHeaders.set('Accept-Ranges', 'bytes');
        respHeaders.set('Cache-Control', 'public, max-age=86400');

        const cl = upstream.headers.get('content-length');
        if (cl) respHeaders.set('Content-Length', cl);
        const cr = upstream.headers.get('content-range');
        if (cr) respHeaders.set('Content-Range', cr);

        return new Response(upstream.body, {
          status: upstream.status,
          headers: respHeaders
        });
      } catch (err) {
        return new Response('Stream error', { status: 500, headers: corsHeaders() });
      }
    }

    // 8. Static assets delegation (Vite SPA frontend: HTML, CSS, JS, images, icons)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
