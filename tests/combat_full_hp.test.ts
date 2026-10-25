import { describe, expect, it } from 'vitest';
import type { LifeGameState } from '../interfaces/lifeEngine';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { startCombat } from '../core/life/combat';
import { tickInjuries } from '../core/life/injuries';
import { SYSTEM_MOVES } from '../data/skills/catalog';
import { LEG_QI_DRAIN } from '../data/injuries/tuning';
import { initRng } from '../core/random';

function fresh(seed: number): LifeGameState {
  initRng(seed);
  const state = createNewLife(seed);
  state.moments = [];
  state.character.injuries = [];
  return state;
}

describe('江湖交手開場滿血（玩家 2026-10-14）', () => {
  it('test_combat_start_injured_character_fights_at_full_hp', () => {
    const state = fresh(11);
    state.character.health = 20;
    startCombat(state, { source: 'event', title: '試', foeName: '木人', foePower: 'weak' });
    const p = state.pendingCombat!.player;
    expect(p.hp).toBe(p.maxHp);
    expect(p.maxHp).toBeGreaterThanOrEqual(state.character.maxHealth);
  });

  it('test_combat_start_refills_qi_without_mutating_character', () => {
    const state = fresh(12);
    state.character.qi = 30;
    startCombat(state, { source: 'event', title: '試', foeName: '木人', foePower: 'weak' });
    expect(state.pendingCombat!.player.qi).toBe(state.pendingCombat!.player.maxQi);
    expect(state.character.qi).toBe(30);
  });
});

describe('體力（耐力）併入內力（玩家 2026-10-14）', () => {
  it('test_stamina_new_character_has_no_stamina_fields', () => {
    const c = fresh(13).character as unknown as Record<string, unknown>;
    expect('stamina' in c).toBe(false);
    expect('maxStamina' in c).toBe(false);
  });

  it('test_stamina_old_save_fields_removed_on_migrate', () => {
    const state = fresh(14);
    const raw = state.character as unknown as Record<string, unknown>;
    raw.stamina = 80;
    raw.maxStamina = 120;
    const migrated = migrateLifeState(state).character as unknown as Record<string, unknown>;
    expect('stamina' in migrated).toBe(false);
    expect('maxStamina' in migrated).toBe(false);
  });

  it('test_stamina_no_rest_stamina_system_move', () => {
    expect(SYSTEM_MOVES.some((m) => m.id === 'sys_rest_stamina')).toBe(false);
  });

  it('test_stamina_leg_injury_drains_qi_monthly', () => {
    const state = fresh(15);
    state.character.injuries = [{ part: 'leg', tier: 'heavy', monthsLeft: 3, cause: '試' }];
    const before = state.character.qi;
    tickInjuries(state);
    expect(state.character.qi).toBe(before - LEG_QI_DRAIN.heavy);
  });
});
