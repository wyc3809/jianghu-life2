import { describe, expect, it } from 'vitest';
import { emptyAncestry } from '../core/life/ancestry';
import { addFreeJade, pull } from '../core/life/gacha';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { startCombat, confirmLifeOrDeath } from '../core/life/combat';
import { runAutoCombat } from '../core/life/autoCombat';
import { simulateContestDuel } from '../core/life/duelSim';
import { snapshotContestantFromLife } from '../core/life/huashan';
import {
  addCollectionVolume,
  collectionVolumes,
  grantVolume,
  ownedVolumes,
  syncCollectionVolumes,
} from '../core/life/volumes';
import { VOLUME_COUNT, artVolumeMoves, hasVolumes, volumeOfMoveId } from '../data/skills/volumes';
import { SKILL_DEFS, getSkillDef } from '../data/skills/catalog';
import VOLUMES_JSON from '../content/martial/volumes.json';
import { GACHA_COST_PER_PULL } from '../data/redesign/testParams';

const ART = 'art_river_fist';

function fightLife(seed: number, vols: number[]) {
  initRng(seed);
  const s = createNewLife({ seed, skipCoach: true });
  if (!s.character.skills.includes(ART)) s.character.skills.push(ART);
  s.character.mainArts = { ...(s.character.mainArts ?? {}), external: ART };
  vols.forEach((v) => grantVolume(s.character, ART, v));
  startCombat(s, { source: 'event', title: '試招', foeName: '山賊', foePower: 'normal', rewardOnWin: {}, rewardOnLose: {} });
  return s;
}

describe('外功七卷（data/skills/volumes.ts）', () => {
  it('test_external_art_has_seven_distinct_volumes_and_vol1_is_original_move', () => {
    const moves = artVolumeMoves(ART);
    expect(moves).toHaveLength(VOLUME_COUNT);
    expect(moves[0]!.id).toBe(getSkillDef(ART)!.move!.id);
    expect(new Set(moves.map((m) => m.id)).size).toBe(VOLUME_COUNT);
    expect(new Set(moves.map((m) => m.name)).size).toBe(VOLUME_COUNT);
    expect(volumeOfMoveId(moves[4]!.id)).toEqual({ skillId: ART, vol: 5 });
  });

  it('test_every_external_art_has_seven_named_volumes_of_2_to_4_chars', () => {
    const arts = Object.values(SKILL_DEFS).filter((d) => hasVolumes(d.id));
    expect(arts.length).toBeGreaterThan(60);
    for (const d of arts) {
      const names = artVolumeMoves(d.id).map((m) => m.name);
      expect((VOLUMES_JSON.volumes as Record<string, string[]>)[d.id], d.id).toHaveLength(VOLUME_COUNT);
      for (const n of names) expect([...n].length, `${d.id} ${n}`).toBeGreaterThanOrEqual(2);
      for (const n of names) expect([...n].length, `${d.id} ${n}`).toBeLessThanOrEqual(4);
      expect(new Set(names).size, d.id).toBe(VOLUME_COUNT);
    }
  });

  it('test_internal_arts_are_not_split', () => {
    expect(hasVolumes('基礎吐納')).toBe(false);
    expect(artVolumeMoves('基礎吐納')).toEqual([]);
  });

  it('test_known_art_always_has_volume_one', () => {
    initRng(1);
    const s = createNewLife({ seed: 1, skipCoach: true });
    s.character.skills.push(ART);
    expect(ownedVolumes(s.character, ART)).toEqual([1]);
  });
});

describe('抽卡／收藏逐卷出', () => {
  it('test_pull_external_art_gives_one_volume_and_duplicate_volume_is_copy', () => {
    const m = emptyAncestry();
    addFreeJade(m, GACHA_COST_PER_PULL * 60);
    const res = pull(m, 'jianghu', 60)!;
    const ext = res.filter((r) => hasVolumes(r.id));
    expect(ext.length).toBeGreaterThan(0);
    for (const r of ext) expect(r.vol).toBeGreaterThanOrEqual(1);
    const id = ext[0]!.id;
    expect(collectionVolumes(m, id)).toContain(ext[0]!.vol);
    // 同一卷再入藏＝重複本
    const before = m.manuals![id]!.copies;
    expect(addCollectionVolume(m, id, ext[0]!.vol!)).toBe(false);
    expect(m.manuals![id]!.copies).toBe(before + 1);
  });

  it('test_legacy_collection_entry_counts_as_full_set', () => {
    const m = emptyAncestry();
    m.manuals = { [ART]: { stars: 0, copies: 0 } };
    expect(collectionVolumes(m, ART)).toHaveLength(VOLUME_COUNT);
  });

  it('test_collection_volumes_sync_to_current_character', () => {
    const m = emptyAncestry();
    addCollectionVolume(m, ART, 3);
    addCollectionVolume(m, ART, 6);
    initRng(2);
    const s = createNewLife({ seed: 2, skipCoach: true });
    if (!s.character.skills.includes(ART)) s.character.skills.push(ART);
    expect(syncCollectionVolumes(s.character, m)).toBe(true);
    expect(ownedVolumes(s.character, ART)).toEqual([1, 3, 6]);
    expect(syncCollectionVolumes(s.character, m)).toBe(false);
  });
});

describe('自動戰鬥（core/life/autoCombat.ts）', () => {
  it('test_one_volume_means_one_player_move_per_round', () => {
    const s = fightLife(7, []);
    const r = runAutoCombat(s)!;
    expect(r.rounds.length).toBeGreaterThan(0);
    for (const round of r.rounds) {
      expect(round.hits.filter((h) => h.side === 'player').length).toBeLessThanOrEqual(1);
    }
    expect(['resolve', 'won', 'lost']).toContain(r.outcome);
  });

  it('test_more_volumes_hit_more_and_finish_faster', () => {
    const one = runAutoCombat(fightLife(7, []))!;
    const all = runAutoCombat(fightLife(7, [2, 3, 4, 5, 6, 7]))!;
    const firstRoundHits = all.rounds[0]!.hits.filter((h) => h.side === 'player');
    expect(firstRoundHits.length).toBeGreaterThan(1);
    expect(firstRoundHits.map((h) => h.vol)).toEqual([...firstRoundHits.map((h) => h.vol)].sort());
    expect(all.rounds.length).toBeLessThanOrEqual(one.rounds.length);
    expect(all.vols).toHaveLength(VOLUME_COUNT);
  });

  it('test_auto_combat_rotates_one_art_per_round', () => {
    const s = fightLife(7, []);
    const second = Object.values(SKILL_DEFS).find((d) => hasVolumes(d.id) && d.id !== ART && !d.premium)!.id;
    s.character.skills.push(second);
    const r = runAutoCombat(s)!;
    expect(r.arts?.map((a) => a.id)).toEqual([ART, second]);
    const artOf = (round: number) => r.rounds[round - 1]!.hits.find((h) => h.side === 'player')?.skillId;
    expect(artOf(1)).toBe(ART);
    if (r.rounds.length >= 2) expect(artOf(2)).toBe(second);
    if (r.rounds.length >= 3) expect(artOf(3)).toBe(ART);
  });

  it('test_auto_combat_is_deterministic', () => {
    const a = runAutoCombat(fightLife(9, [2, 4]))!;
    const b = runAutoCombat(fightLife(9, [2, 4]))!;
    expect(JSON.stringify(a.rounds)).toBe(JSON.stringify(b.rounds));
  });

  it('test_life_or_death_needs_confirm_before_auto', () => {
    initRng(4);
    const s = createNewLife({ seed: 4, skipCoach: true });
    startCombat(s, {
      source: 'event',
      title: '生死戰',
      foeName: '魔頭',
      foePower: 'boss',
      lifeOrDeath: true,
      rewardOnWin: {},
      rewardOnLose: {},
    });
    expect(runAutoCombat(s)).toBeNull();
    confirmLifeOrDeath(s);
    expect(runAutoCombat(s)).not.toBeNull();
  });
});

describe('論劍自動比武', () => {
  it('test_duel_replay_shows_volume_moves_for_player', () => {
    const s = fightLife(11, [2, 3]);
    s.pendingCombat = null;
    const me = snapshotContestantFromLife(s);
    expect(me.autoArt).toBe(ART);
    const foe = { ...me, id: 'ghost', name: '幻影', isPlayer: false, autoVols: [1] };
    const r = simulateContestDuel({ title: '論劍', a: me, b: foe, seed: 5, aIsPlayer: true });
    const mine = r.replay.rounds.flatMap((x) => x.hits).filter((h) => h.side === 'player');
    expect(mine.some((h) => h.vol === 3)).toBe(true);
    expect(r.replay.outcome).toBe(r.winnerId === me.id ? 'won' : 'lost');
  });
});
