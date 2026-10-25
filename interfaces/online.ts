import type { CombatReplay, LifeCharacter } from './lifeEngine';

export type OnlineAccountId = string;
export interface OnlinePlayer {
  id: OnlineAccountId;
  character: LifeCharacter;
  rank: number;
  protectedUntil: number;
  onlineUntil: number;
  busy: string | null;
  rewardAt: number;
  offlineAccruedMs: number;
  pendingOnline: number;
  pendingOffline: number;
  onlineRemainder: number;
  offlineRemainder: number;
  silver: number;
  /** 服務端累計已派免費玉石，帳戶以來源高水位收據接收。 */
  jadeEarnedTotal?: number;
  jadeDay?: { day: string; attackWins: number; defendWins: number; opponents: string[] };
}
export interface OnlineBattle {
  id: string;
  attacker: OnlineAccountId;
  defender: OnlineAccountId;
  winner: OnlineAccountId | null;
  startedAt: number;
  endsAt: number;
  settledAt: number | null;
  before: Record<OnlineAccountId, number>;
  after: Record<OnlineAccountId, number> | null;
  replays: Record<OnlineAccountId, CombatReplay>;
  characters: Record<OnlineAccountId, LifeCharacter>;
  jadeAwards?: Record<OnlineAccountId, number>;
}
export interface OnlineWorld {
  version: 1;
  revision: number;
  players: Record<OnlineAccountId, OnlinePlayer>;
  battles: OnlineBattle[];
}
export interface OnlinePeer {
  id: OnlineAccountId;
  name: string;
  rank: number;
  online: boolean;
  protectedUntil: number;
  busy: string | null;
}
export interface OnlineSnapshot {
  population?: number;
  room?: { id: string; invite?: string; waiting: boolean };
  serverNow: number;
  revision: number;
  me: OnlinePlayer;
  peers: OnlinePeer[];
  battles: OnlineBattle[];
  confirmedRequests: string[];
  params: {
    protectionMs: number;
    onlineSilverPerMinute: number;
    offlineSilverPerMinute: number;
    offlineCapMs: number;
  };
}
