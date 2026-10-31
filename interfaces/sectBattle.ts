import type { LifeGameState } from './lifeEngine';
import type { CharacterAppearance } from './appearance';

export type SectBattleSide = 0 | 1;
export interface SectBattleEntrant { id: string; side: SectBattleSide; rank: number; state: LifeGameState }
export interface SectBattleFigure {
  appearance?: CharacterAppearance;
  id: string; side: SectBattleSide; rank: number; name: string; artId: string;
  x: number; y: number; face: number; hp: number; maxHp: number; qi: number; maxQi: number;
  pose: 'idle' | 'walk' | 'attack' | 'hurt' | 'down'; poseAt: number; target: string | null;
}
export interface SectBattleEvent {
  at: number; actor: string; target: string; skillId: string; vol?: number; name: string;
  damage: number; splash: boolean; miss?: boolean; x: number; y: number;
}
export interface SectBattleFrame { at: number; figures: SectBattleFigure[] }
export interface SectBattleReplay {
  seed: number; duration: number; winner: SectBattleSide | null; frames: SectBattleFrame[];
  events: SectBattleEvent[]; remaining: [number, number];
}
