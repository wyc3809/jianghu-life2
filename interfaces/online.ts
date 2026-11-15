import type { CharacterAppearance } from './appearance';
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
  live?: { joined: boolean; red: boolean };
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
  mode?: 'red';
  hitMs?: number;
  jadeAwards?: Record<OnlineAccountId, number>;
}
export interface OnlineWorld {
  version: 1;
  revision: number;
  players: Record<OnlineAccountId, OnlinePlayer>;
  battles: OnlineBattle[];
}
export interface OnlinePeer {
  live?: { joined:boolean; red:boolean };
  appearance?: CharacterAppearance;
  id: OnlineAccountId;
  name: string;
  rank: number;
  online: boolean;
  protectedUntil: number;
  busy: string | null;
}
export interface OnlineSnapshot {
  population?: number;
  liveBattles?: {id:string;attacker:string;defender:string;startedAt:number;endsAt:number;names:string[]}[];
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
