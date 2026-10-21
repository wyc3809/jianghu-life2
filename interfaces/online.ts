import type { CombatReplay, LifeCharacter } from './lifeEngine';

export type OnlineAccountId = 'river' | 'cloud';
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
