/**
 * Cloudflare Worker for Bible Songs (SGSS)
 * Target: https://bible-songs.walusimbileon1.workers.dev/
 *
 * Pre-configured with the new Firebase Realtime Database:
 * Database: https://bible-songs-1-default-rtdb.firebaseio.com/bible
 * Auth Secret: QHqRoEfLKuZQ4ewhKliHHOsQg06a0nXY8Qk0eHGO
 */

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

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Leaderboard endpoint
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

    // 2. Chat endpoint (GET: last 400 messages, POST: append message without deletion)
    if (pathname === '/api/chat') {
      if (request.method === 'GET') {
        try {
          const res = await fetch(fbUrl('/chat'));
          const data = await res.json();
          let messages = data ? Object.values(data) : [];
          messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          const total = messages.length;
          // Return only last 400 messages to eliminate lag while preserving all in DB
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

          // Save to Firebase Realtime Database
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

    // 3. Register sequential listener (Listener S1, Listener S2... or keep Discord)
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

        // Initialize user in /users
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

    // 4. Presence and listening time heartbeat
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

        // Check previous beat in presence
        const prevRes = await fetch(fbUrl(`/presence/${safeSessionId}`));
        const prevData = await prevRes.json();

        if (prevData && prevData.lastBeat) {
          const deltaMs = now - prevData.lastBeat;
          if (deltaMs > 0 && deltaMs < 60_000) {
            const secondsToAdd = deltaMs / 1000;
            // Fetch and update user seconds
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

    // 5. Active listeners count and list (deduplicated by UID across multiple tabs)
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

    // Forward other requests (e.g., assets or sync) to default worker handling
    return new Response('Not found', { status: 404 });
  }
};
