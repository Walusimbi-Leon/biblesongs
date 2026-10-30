export interface FirebaseChatMessage {
  id: string;
  text: string;
  ts: number;
  user: {
    uid: string;
    name: string;
    avatar: string;
  };
  replyTo?: {
    id: string;
    name: string;
    text: string;
  };
}

export interface FirebaseLeaderboardUser {
  uid: string;
  name: string;
  avatar: string;
  seconds: number;
  lastSeen?: number;
  firstSeen?: number;
  isDiscord?: boolean;
}

class FirebaseRealtimeDbSync {
  private databaseUrl: string;
  private authToken: string | null;
  private basePath: string;
  private isDeactivated = false;
  private lastWarningLog = 0;

  constructor() {
    let url = (process.env.FIREBASE_DATABASE_URL || 'https://bible-songs-1-default-rtdb.firebaseio.com').replace(/\/$/, '');
    if (url.endsWith('/bible')) {
      url = url.substring(0, url.length - '/bible'.length);
    }
    this.databaseUrl = url;
    this.authToken = process.env.FIREBASE_AUTH_TOKEN || process.env.FIREBASE_DATABASE_SECRET || 'QHqRoEfLKuZQ4ewhKliHHOsQg06a0nXY8Qk0eHGO';
    this.basePath = '/bible';
  }

  public getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  public isDatabaseDeactivated(): boolean {
    return this.isDeactivated;
  }

  private buildUrl(endpointPath: string): string {
    const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    const url = `${this.databaseUrl}${this.basePath}${cleanPath}.json`;
    if (this.authToken) {
      return `${url}?auth=${encodeURIComponent(this.authToken)}`;
    }
    return url;
  }

  private handleResponseStatus(status: number, endpoint: string, bodyText: string) {
    if (status === 423) {
      this.isDeactivated = true;
      const now = Date.now();
      if (now - this.lastWarningLog > 60_000) {
        console.warn(`[Firebase RTDB] Database at ${this.databaseUrl} is currently DEACTIVATED (HTTP 423).`);
        this.lastWarningLog = now;
      }
    } else if (status >= 200 && status < 300) {
      if (this.isDeactivated) {
        console.log(`[Firebase RTDB] Database at ${this.databaseUrl} is active and connected!`);
      }
      this.isDeactivated = false;
    } else {
      console.warn(`[Firebase RTDB] Request to ${endpoint} returned status ${status}: ${bodyText.slice(0, 120)}`);
    }
  }

  // 1. Fetch chat messages from /bible/chat
  public async fetchMessages(): Promise<FirebaseChatMessage[] | null> {
    try {
      const url = this.buildUrl('/chat');
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      this.handleResponseStatus(res.status, '/chat', text);

      if (!res.ok) return null;
      if (!text || text === 'null') return [];

      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.filter(Boolean);
      }
      if (typeof data === 'object') {
        return Object.values(data);
      }
      return [];
    } catch {
      return null;
    }
  }

  // 2. Save a chat message to /bible/chat/{id}
  public async saveMessage(msg: FirebaseChatMessage): Promise<boolean> {
    try {
      const safeId = encodeURIComponent(msg.id).replace(/\./g, '_');
      const url = this.buildUrl(`/chat/${safeId}`);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
        signal: AbortSignal.timeout(5000)
      });
      const text = await res.text();
      this.handleResponseStatus(res.status, `/chat/${safeId}`, text);
      return res.ok;
    } catch {
      return false;
    }
  }

  // 3. Fetch leaderboard users from /bible/users
  public async fetchLeaderboard(): Promise<FirebaseLeaderboardUser[] | null> {
    try {
      const url = this.buildUrl('/users');
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      this.handleResponseStatus(res.status, '/users', text);

      if (!res.ok) return null;
      if (!text || text === 'null') return [];

      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.filter(Boolean);
      }
      if (typeof data === 'object') {
        return Object.values(data);
      }
      return [];
    } catch {
      return null;
    }
  }

  // 4. Save or patch a leaderboard user to /bible/users/{uid}
  public async saveLeaderboardUser(user: FirebaseLeaderboardUser): Promise<boolean> {
    try {
      const safeUid = encodeURIComponent(user.uid).replace(/\./g, '_');
      const url = this.buildUrl(`/users/${safeUid}`);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        signal: AbortSignal.timeout(5000)
      });
      const text = await res.text();
      this.handleResponseStatus(res.status, `/users/${safeUid}`, text);
      return res.ok;
    } catch {
      return false;
    }
  }

  // 5. Update active presence to /bible/presence/{sessionId}
  public async updatePresence(sessionId: string, data: any): Promise<boolean> {
    try {
      const safeId = encodeURIComponent(sessionId).replace(/\./g, '_');
      const url = this.buildUrl(`/presence/${safeId}`);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000)
      });
      const text = await res.text();
      this.handleResponseStatus(res.status, `/presence/${safeId}`, text);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async deletePresence(sessionId: string): Promise<boolean> {
    try {
      const safeId = encodeURIComponent(sessionId).replace(/\./g, '_');
      const url = this.buildUrl(`/presence/${safeId}`);
      const res = await fetch(url, {
        method: 'DELETE',
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // 6. Fetch/save sequential listener number from /bible/meta/lastListenerNumber
  public async fetchLastListenerNumber(): Promise<number | null> {
    try {
      const url = this.buildUrl('/meta/lastListenerNumber');
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text || text === 'null') return 0;
      const num = parseInt(text, 10);
      return isNaN(num) ? 0 : num;
    } catch {
      return null;
    }
  }

  public async saveLastListenerNumber(num: number): Promise<boolean> {
    try {
      const url = this.buildUrl('/meta/lastListenerNumber');
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(num),
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const firebaseRtdb = new FirebaseRealtimeDbSync();
