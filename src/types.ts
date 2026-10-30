export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  url: string;
  versionTitle?: string;
  variant?: number;
  durationMs: number;
  primaryId?: string;
  versions?: Array<{
    id: string;
    url: string;
    title: string;
    variant: number;
  }>;
}

export type PlayerMode = 'live' | 'ondemand';

export interface LeaderboardUser {
  uid: string;
  name: string;
  avatar: string;
  seconds: number;
  lastSeen?: number;
  isDiscord?: boolean;
}

export interface ChatUser {
  uid: string;
  name: string;
  avatar: string;
  isDiscord?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  ts: number;
  user: ChatUser;
  replyTo?: {
    id?: string;
    name: string;
    text: string;
  };
}

export interface ActiveListener {
  sessionId: string;
  name: string;
  avatar: string;
  uid?: string;
  tabCount?: number;
  joinedAt?: number;
}

export interface AudioSyncData {
  epoch: number;
  cycleMs: number;
  songIds: string[];
  byId: Record<string, Song>;
  rotation: Song[];
}
