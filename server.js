import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import { firebaseRtdb } from "./server/firebaseRtdb.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "server/data/db.json");
const SONGS_FILE = path.resolve(__dirname, "server/data/songs.json");
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
function loadSongs() {
  let songsData2 = {
    epoch: 178824792e4,
    cycleMs: 41204184,
    rotation: []
  };
  if (fs.existsSync(SONGS_FILE)) {
    try {
      songsData2 = JSON.parse(fs.readFileSync(SONGS_FILE, "utf-8"));
    } catch (err) {
      console.error("Failed to load songs.json:", err);
    }
  }
  const songMap2 = /* @__PURE__ */ new Map();
  songsData2.rotation.forEach((s) => {
    songMap2.set(s.id, s);
    if (s.title) songMap2.set(s.title, s);
    if (s.versionTitle) songMap2.set(s.versionTitle, s);
  });
  return { songsData: songsData2, songMap: songMap2 };
}
let { songsData, songMap } = loadSongs();
let db = {
  lastListenerNumber: 0,
  leaderboard: [],
  messages: []
};
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    db = {
      lastListenerNumber: typeof raw.lastListenerNumber === "number" ? raw.lastListenerNumber : 0,
      leaderboard: raw.leaderboard || [],
      messages: raw.messages || []
    };
  } catch (err) {
    console.error("Failed to load db.json, using defaults:", err);
  }
}
let saveTimeout = null;
function saveDbDebounced() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save db.json:", err);
    }
  }, 1e3);
}
const activeSessions = /* @__PURE__ */ new Map();
function getActiveListenersList() {
  const now = Date.now();
  const userMap = /* @__PURE__ */ new Map();
  for (const [id, sess] of activeSessions.entries()) {
    if (now - sess.lastBeat <= 45e3) {
      const existing = userMap.get(sess.uid);
      if (!existing) {
        userMap.set(sess.uid, {
          sessionId: id,
          uid: sess.uid,
          name: sess.name,
          avatar: sess.avatar,
          lastBeat: sess.lastBeat,
          joinedAt: sess.joinedAt || sess.lastBeat,
          tabCount: 1
        });
      } else {
        existing.tabCount += 1;
        if (sess.lastBeat > existing.lastBeat) existing.lastBeat = sess.lastBeat;
        if (sess.joinedAt && sess.joinedAt < existing.joinedAt) existing.joinedAt = sess.joinedAt;
        if (sess.avatar && !existing.avatar) existing.avatar = sess.avatar;
      }
    } else {
      activeSessions.delete(id);
    }
  }
  return Array.from(userMap.values());
}
setInterval(() => {
  getActiveListenersList();
}, 1e4);
function isDiscordIdentifier(uid, avatar) {
  if (uid && /^\d{17,20}$/.test(uid)) return true;
  if (avatar && (avatar.includes("discordapp") || avatar.includes("discord.com"))) return true;
  return false;
}
function ensureListenerExists(uid, name, avatar) {
  let user = db.leaderboard.find((u) => u.uid === uid);
  const isDiscord = isDiscordIdentifier(uid, avatar);
  if (!user) {
    user = {
      uid,
      name: name || (isDiscord ? "Discord User" : "Listener S1"),
      avatar: avatar || "",
      seconds: 0,
      lastSeen: Date.now(),
      isDiscord: isDiscord || void 0
    };
    db.leaderboard.push(user);
    saveDbDebounced();
    firebaseRtdb.saveLeaderboardUser(user).catch(() => {
    });
  } else {
    let changed = false;
    if (isDiscord) {
      user.isDiscord = true;
      if (name && user.name !== name) {
        user.name = name;
        changed = true;
      }
    } else {
      if (name && user.name !== name && !name.startsWith("Listener S") && user.name.startsWith("Listener S")) {
        user.name = name;
        changed = true;
      } else if (name && user.name !== name && user.name.startsWith("Listener-") && name.startsWith("Listener S")) {
        user.name = name;
        changed = true;
      }
    }
    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      changed = true;
    }
    user.lastSeen = Date.now();
    if (changed) {
      saveDbDebounced();
      firebaseRtdb.saveLeaderboardUser(user).catch(() => {
      });
    }
  }
  return user;
}
function updateListenerTime(uid, name, avatar, secondsToAdd) {
  let user = db.leaderboard.find((u) => u.uid === uid);
  const isDiscord = isDiscordIdentifier(uid, avatar);
  if (!user) {
    user = {
      uid,
      name: name || (isDiscord ? "Discord User" : "Listener S1"),
      avatar: avatar || "",
      seconds: secondsToAdd,
      lastSeen: Date.now(),
      isDiscord: isDiscord || void 0
    };
    db.leaderboard.push(user);
  } else {
    user.seconds = (user.seconds || 0) + secondsToAdd;
    if (isDiscord && name && user.name !== name) {
      user.name = name;
    } else if (!isDiscord && name && !name.startsWith("Listener S") && user.name !== name) {
      user.name = name;
    }
    if (avatar) user.avatar = avatar;
    user.lastSeen = Date.now();
  }
  saveDbDebounced();
  firebaseRtdb.saveLeaderboardUser(user).catch(() => {
  });
}
async function syncWithFirebaseRealtimeDb() {
  try {
    const remoteMsgs = await firebaseRtdb.fetchMessages();
    if (remoteMsgs && remoteMsgs.length > 0) {
      const existingIds = new Set(db.messages.map((m) => m.id));
      let added = false;
      for (const m of remoteMsgs) {
        if (!existingIds.has(m.id)) {
          db.messages.push(m);
          existingIds.add(m.id);
          added = true;
        }
      }
      if (added) {
        db.messages.sort((a, b) => a.ts - b.ts);
        saveDbDebounced();
      }
    }
    const remoteUsers = await firebaseRtdb.fetchLeaderboard();
    if (remoteUsers && remoteUsers.length > 0) {
      let changed = false;
      for (const ru of remoteUsers) {
        const local = db.leaderboard.find((u) => u.uid === ru.uid);
        if (!local) {
          db.leaderboard.push(ru);
          changed = true;
        } else {
          if ((ru.seconds || 0) > (local.seconds || 0)) {
            local.seconds = ru.seconds;
            changed = true;
          }
          if (ru.name && ru.name !== local.name) {
            local.name = ru.name;
            changed = true;
          }
          if (ru.avatar && ru.avatar !== local.avatar) {
            local.avatar = ru.avatar;
            changed = true;
          }
        }
      }
      if (changed) {
        saveDbDebounced();
      }
    }
    const remoteLastNum = await firebaseRtdb.fetchLastListenerNumber();
    if (remoteLastNum !== null && remoteLastNum > (db.lastListenerNumber || 0)) {
      db.lastListenerNumber = remoteLastNum;
      saveDbDebounced();
    }
  } catch (err) {
  }
}
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(express.json());
  syncWithFirebaseRealtimeDb().catch(() => {
  });
  setInterval(() => {
    syncWithFirebaseRealtimeDb().catch(() => {
    });
  }, 15e3);
  app.get("/api/sync", (_req, res) => {
    const now = Date.now();
    const epoch = songsData.epoch || 178824792e4;
    const cycleMs = songsData.cycleMs || 41204184;
    const rotation = songsData.rotation || [];
    const cycleOffset = ((now - epoch) % cycleMs + cycleMs) % cycleMs;
    let accumulated = 0;
    let current = null;
    let nextSong = null;
    for (let i = 0; i < rotation.length; i++) {
      const s = rotation[i];
      const dur = s.durationMs || 21e4;
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
        durationMs: rotation[0].durationMs || 21e4,
        song: rotation[0]
      };
      nextSong = rotation[1] || rotation[0];
    }
    res.json({
      epoch,
      cycleMs,
      now,
      loop: Math.floor((now - epoch) / cycleMs),
      current,
      next: nextSong,
      rotation,
      count: rotation.length
    });
  });
  app.post("/api/register-listener", (req, res) => {
    try {
      const { uid, name, avatar } = req.body || {};
      if (isDiscordIdentifier(uid, avatar)) {
        ensureListenerExists(uid, name || "Discord Listener", avatar || "");
        return res.json({
          uid,
          name: name || "Discord Listener",
          avatar: avatar || "",
          isDiscord: true
        });
      }
      if (uid && /^g-s\d+$/i.test(uid)) {
        let user = db.leaderboard.find((u) => u.uid === uid);
        const resolvedName = name && !name.startsWith("Listener-") ? name : user ? user.name : name;
        ensureListenerExists(uid, resolvedName, avatar || "");
        return res.json({
          uid,
          name: resolvedName,
          avatar: avatar || "",
          isDiscord: false
        });
      }
      db.lastListenerNumber = (db.lastListenerNumber || 0) + 1;
      const assignedNum = db.lastListenerNumber;
      const assignedName = `Listener S${assignedNum}`;
      const assignedUid = `g-s${assignedNum}`;
      ensureListenerExists(assignedUid, assignedName, avatar || "");
      saveDbDebounced();
      firebaseRtdb.saveLastListenerNumber(assignedNum).catch(() => {
      });
      return res.json({
        uid: assignedUid,
        name: assignedName,
        avatar: avatar || "",
        listenerNumber: assignedNum,
        isDiscord: false
      });
    } catch (err) {
      console.error("Error in /api/register-listener:", err);
      res.status(500).json({ error: "Failed to register listener" });
    }
  });
  app.get("/api/listeners", (_req, res) => {
    const list = getActiveListenersList();
    res.json({
      listeners: list,
      count: list.length
    });
  });
  app.post("/api/presence", (req, res) => {
    try {
      const { sessionId, uid, name, avatar, gone } = req.body || {};
      if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }
      const now = Date.now();
      if (gone) {
        activeSessions.delete(sessionId);
        firebaseRtdb.deletePresence(sessionId).catch(() => {
        });
        const list2 = getActiveListenersList();
        return res.json({ ok: true, gone: true, listeners: list2, count: list2.length });
      }
      const effectiveUid = uid || `g-s1`;
      const isDiscord = isDiscordIdentifier(effectiveUid, avatar);
      const effectiveName = name && name.trim() || (isDiscord ? "Discord User" : "Listener S1");
      const effectiveAvatar = avatar || "";
      const session = activeSessions.get(sessionId);
      if (session && session.lastBeat) {
        const deltaMs = now - session.lastBeat;
        if (deltaMs > 0 && deltaMs < 6e4) {
          const secondsToAdd = deltaMs / 1e3;
          updateListenerTime(effectiveUid, effectiveName, effectiveAvatar, secondsToAdd);
        }
        session.lastBeat = now;
        session.name = effectiveName;
        session.avatar = effectiveAvatar;
        session.uid = effectiveUid;
      } else {
        activeSessions.set(sessionId, {
          sessionId,
          uid: effectiveUid,
          name: effectiveName,
          avatar: effectiveAvatar,
          lastBeat: now,
          joinedAt: now
        });
        ensureListenerExists(effectiveUid, effectiveName, effectiveAvatar);
      }
      firebaseRtdb.updatePresence(sessionId, {
        uid: effectiveUid,
        name: effectiveName,
        lastBeat: now
      }).catch(() => {
      });
      const list = getActiveListenersList();
      res.json({
        ok: true,
        active: true,
        listeners: list,
        count: list.length
      });
    } catch (err) {
      console.error("Error handling /api/presence:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.get("/api/leaderboard", (_req, res) => {
    const sorted = [...db.leaderboard].sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
    res.json({
      leaderboard: sorted,
      total: db.leaderboard.length
    });
  });
  app.get("/api/chat", (req, res) => {
    const limit = Math.min(400, parseInt(req.query.limit, 10) || 400);
    const messages = db.messages.slice(-limit);
    res.json({
      messages,
      total: db.messages.length
    });
  });
  app.post("/api/chat", (req, res) => {
    const { id, text, ts, user, replyTo } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    const msg = {
      id: id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      text: text.trim().slice(0, 500),
      ts: ts || Date.now(),
      user: {
        uid: user?.uid || "g-s1",
        name: user?.name || "Listener S1",
        avatar: user?.avatar || ""
      },
      replyTo: replyTo && replyTo.name ? {
        id: replyTo.id,
        name: replyTo.name,
        text: (replyTo.text || "").slice(0, 100)
      } : void 0
    };
    db.messages.push(msg);
    saveDbDebounced();
    firebaseRtdb.saveMessage(msg).catch(() => {
    });
    res.json({ ok: true, message: msg });
  });
  app.get("/stream/:id", async (req, res) => {
    try {
      const songId = decodeURIComponent(req.params.id);
      const song = songMap.get(songId);
      if (!song || !song.url) {
        return res.status(404).send("Song not found");
      }
      const clientRange = req.headers.range;
      const headersToSend = {};
      if (clientRange) {
        headersToSend["Range"] = clientRange;
      }
      const upstream = await fetch(song.url, {
        headers: headersToSend,
        redirect: "follow"
      });
      res.status(upstream.status);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const cl = upstream.headers.get("content-length");
      if (cl) res.setHeader("Content-Length", cl);
      const cr = upstream.headers.get("content-range");
      if (cr) res.setHeader("Content-Range", cr);
      if (!upstream.body) {
        return res.end();
      }
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.pipe(res);
      req.on("close", () => {
        nodeStream.destroy();
      });
    } catch (err) {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).send("Stream error");
      }
    }
  });
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (prod=${isProd})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
