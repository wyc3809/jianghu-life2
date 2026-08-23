import { describe, expect, it } from 'vitest';
import { getArcDef, listArcDefs, resolveArcVisitGo, resolveArcVisitSever } from '../core/life/arcs';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import starterNpcs from '../content/npcs/starter_npcs.json';

describe('lifeArcsCatalog', () => {
  const defs = listArcDefs();
  const starterIds = new Set((starterNpcs as { id: string }[]).map((n) => n.id));

  it('lists at least 33 arcs (3 original + 30 new) with unique ids', () => {
    expect(defs.length).toBeGreaterThanOrEqual(33);
    const ids = defs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every arc its own npc (no two arcs share an npcId)', () => {
    const npcIds = defs.map((d) => d.npcId);
    expect(new Set(npcIds).size).toBe(npcIds.length);
  });

  it('resolves every arc npcId to a registered starter npc', () => {
    const missing = defs.filter((d) => !starterIds.has(d.npcId)).map((d) => d.id);
    expect(missing).toEqual([]);
  });

  it('has beats.length matching maxBeats for every arc', () => {
    const mismatched = defs.filter((d) => d.beats.length !== d.maxBeats).map((d) => d.id);
    expect(mismatched).toEqual([]);
  });

  it('keeps every severAtBeats index inside the beat range', () => {
    const outOfRange = defs
      .filter((d) => (d.severAtBeats ?? []).some((b) => b < 0 || b >= d.maxBeats))
      .map((d) => d.id);
    expect(outOfRange).toEqual([]);
  });

  it('gives every arc a positive, well-formed reward', () => {
    for (const def of defs) {
      expect(def.reward.amount).toBeGreaterThan(0);
      expect(def.reward.label.length).toBeGreaterThan(0);
    }
  });

  it('lets every canStart run without throwing on a fresh life', () => {
    initRng(1);
    const state = createNewLife(1);
    for (const def of defs) {
      expect(() => def.canStart(state)).not.toThrow();
    }
  });

  it('plays a new arc (arc_li_escort) beat by beat to completion, applying reward each visit', () => {
    initRng(2);
    const state = createNewLife(2);
    const def = getArcDef('arc_li_escort')!;
    const startMartial = state.character.martial;
    state.lifeArc = {
      id: def.id,
      title: def.title,
      beat: 0,
      maxBeats: def.maxBeats,
      npcId: def.npcId,
      monthsLeft: 0,
    };
    for (let i = 0; i < def.maxBeats; i++) {
      const lines = resolveArcVisitGo(state);
      expect(lines.some((l) => l === def.reward.label)).toBe(true);
    }
    expect(state.character.martial).toBe(startMartial + def.maxBeats * def.reward.amount);
    expect(state.lifeArc).toBeUndefined();
    expect(state.character.flags.arc_done_arc_li_escort).toBe(true);
  });

  it('lets a new arc sever mid-story and mark itself done without granting further reward', () => {
    initRng(3);
    const state = createNewLife(3);
    const def = getArcDef('arc_shangguan_gamble')!;
    state.lifeArc = {
      id: def.id,
      title: def.title,
      beat: def.severAtBeats![0]!,
      maxBeats: def.maxBeats,
      npcId: def.npcId,
      monthsLeft: 0,
    };
    const lines = resolveArcVisitSever(state);
    expect(lines.some((l) => /勾了|疏遠|生分/.test(l))).toBe(true);
    expect(state.lifeArc).toBeUndefined();
    expect(state.character.flags.arc_done_arc_shangguan_gamble).toBe(true);
  });
});
