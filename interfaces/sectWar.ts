import type { CharacterAppearance } from "./appearance";
import type { CombatReplay, LifeCharacter, LifeGameState } from "./lifeEngine";
import type { SectBattleEntrant, SectBattleSide } from "./sectBattle";
import type { SectReplayTape } from "./sectTape";
export interface SectWarMember {
  id: string;
  sectId: string;
  name: string;
  appearance: CharacterAppearance;
  joinedAt: number;
  lastSelectionAt: number;
}
export interface SectWarTeam {
  term: number;
  members: string[];
  lockedAt: number;
}
export interface SectWarMatch {
  id: string;
  term: number;
  sides: [string, string];
  at: number;
  winner: SectBattleSide | null;
  remaining: [number, number];
  duration: number;
}
export interface SectWarWorld {
  revision: number;
  payload: {
    term: number;
    members: Record<string, SectWarMember>;
    ranks: Record<string, string[]>;
    teams: Record<string, SectWarTeam>;
    matches: SectWarMatch[];
  };
}
export interface SectWarSnapshot {
  serverNow: number;
  term: number;
  nextCutoff: number;
  me: SectWarMember | null;
  members: SectWarMember[];
  ranks: Record<string, string[]>;
  teams: Record<string, SectWarTeam>;
  matches: SectWarMatch[];
}
export interface SectWarReport extends SectWarMatch {
  timeline?: SectReplayTape;
  engineVersion: number;
  seed: number;
  roster: SectBattleEntrant[];
  fingerprint: string;
}
export interface SectSelectionResult {
  kind: "selection";
  replay: CombatReplay;
  character: LifeCharacter;
  before: number;
  after: number;
}
export interface SectWarReceipt {
  user_id: string;
  request_id: string;
  input: string;
  result: unknown;
}
export interface SectWarRepository {
  load(): Promise<SectWarWorld>;
  profiles(ids: string[]): Promise<Record<string, LifeGameState>>;
  receipt(user: string, id: string): Promise<SectWarReceipt | null>;
  report(id: string): Promise<SectWarReport | null>;
  save(
    world: SectWarWorld,
    expected: number,
    report: SectWarReport | null,
    receipt: SectWarReceipt | null,
  ): Promise<boolean>;
}
