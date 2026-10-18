import { describe, expect, it, vi } from 'vitest';
import { MARTIAL_POSES, martialPoseFor, sampleMartialPose, loadMartialAssets } from '../src/fx/art/martialPoses';
import { SparStage, type SparCombatHooks } from '../src/spar/engine';
import { WEAPON_SPRITES } from '../src/spar/rig';
import { SKILL_DEFS, canonicalSkillId } from '../data/skills/catalog';
import { MARTIAL_CATALOG_RAW } from '../data/content/packs';
import { createRng, withRng, getRng } from '../core/random';
import { choreoForArt } from '../src/fx/art/recipes';
import { makeMartialReplay } from '../src/prototypes/MartialIdentityPreview';
import directions from '../design/art/martial-identities/directions.json';

function engine(id: string, assets = false, miss = false) {
  const draws: unknown[][] = [];
  const ctx = new Proxy({ drawImage: (...args: unknown[]) => draws.push(args) }, { get: (t, p) => p in t ? t[p as keyof typeof t] : () => ({}) });
  const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement;
  const img = { width: 616, height: 788 } as HTMLImageElement;
  const atlas = { width: 4096, height: 352, marker: 'correct-actor' } as unknown as HTMLImageElement;
  const weapon = { width: 150, height: 700, marker: 'equipment-sword' } as unknown as HTMLImageElement;
  const events: string[] = [];
  const combat: SparCombatHooks = { nextArt: () => id, heroStrike: () => {
    events.push('hero'); return { dmg: miss ? 0 : 101, crit: false, heal: 0, killed: false };
  }, foeStrike: () => { events.push('foe'); return { dmg: 2, heroDown: false }; },
  nextFoe: () => ({ boss: false }), foeDefeated: () => ({ coins: 0 }), heroRecovered: () => {} };
  const stage = new SparStage({ canvas, images: { heroIdle: img, heroAttack: img, enemies: [img], splash: img }, combat });
  stage.resize(390, 240, 1); stage.setWeapon(WEAPON_SPRITES.sword, weapon);
  if (assets) stage.setMartialAssets(new Map([[canonicalSkillId(id), { atlas, guard: false, identityEffects: { signature: atlas, detail: atlas, finish: atlas } }]]));
  return { stage, events, draws, atlas, weapon };
}

describe('武學實體姿勢與核心隔離', () => {
  it('test_martial_poses_catalog_counts_and_all_identity_cards_match_real_ids', () => {
    const defs = Object.values(SKILL_DEFS);
    expect(defs).toHaveLength(103);
    expect(defs.filter(d => d.premium)).toHaveLength(19);
    expect(Object.keys(directions).sort()).toEqual(defs.map(d => d.id).sort());
    expect(MARTIAL_POSES).toHaveLength(103);
    expect(MARTIAL_POSES.map(d => d.id).sort()).toEqual(defs.map(d => d.id).sort());
    for (const pose of MARTIAL_POSES) {
      expect(pose.premium).toBe(Boolean(SKILL_DEFS[pose.id]?.premium));
      for (const n of pose.sequence) expect(n).toBeGreaterThanOrEqual(0);
      expect(pose.sequence.every(n => n < (pose.sequence.length > 8 ? 16 : 8))).toBe(true);
    }
  });
  it('test_martial_poses_all_legacy_aliases_share_canonical_identity', () => {
    for (const alias of MARTIAL_CATALOG_RAW.skills.filter(d => d.legacyAliasOf)) {
      expect(martialPoseFor(alias.id)).toBe(martialPoseFor(alias.legacyAliasOf));
      expect(choreoForArt(alias.id)).toBe(choreoForArt(alias.legacyAliasOf));
    }
  });
  it('test_martial_poses_sampling_never_consumes_core_rng_or_changes_before_contact', () => {
    const p = martialPoseFor('pr_mountain_split')!;
    const expected = withRng(createRng(42), () => getRng().nextFloat());
    const actual = withRng(createRng(42), () => {
      for (let t = 0; t < .36; t += .01) {
        expect(sampleMartialPose(p, t, .72, .36, { dmg: 100, crit: true, killed: true }))
          .toBe(sampleMartialPose(p, t, .72, .36, null));
      }
      return getRng().nextFloat();
    });
    expect(actual).toBe(expected);
  });
  it('test_martial_poses_enabled_assets_leave_every_settlement_and_enemy_action_unchanged', () => {
    for (const id of Object.values(SKILL_DEFS).filter(d => d.kind === 'external').map(d => d.id)) {
      const plain = engine(id); const updated = engine(id, true);
      for (let frame = 0; frame < 900; frame++) {
        plain.stage.update(1 / 60); updated.stage.update(1 / 60);
        expect(updated.events, `${id} frame${frame}`).toEqual(plain.events);
      }
      expect(updated.events).toContain('hero');
    }
  });
  it('test_martial_poses_unarmed_and_reduced_motion_never_draw_equipped_sword', () => {
    for (const id of MARTIAL_POSES.map(d => d.id)) for (const quiet of [false, true]) {
      const e = engine(id, true); e.stage.setQuiet(quiet);
      e.stage.inspectMartialPose(id, .4);
      const raw = e.stage as unknown as { drawWarrior(g: { k: number; groundY: number; heroX: number }): void };
      raw.drawWarrior({ k: .1, groundY: 220, heroX: 100 });
      expect(e.draws).toHaveLength(1);
      expect(e.draws[0]![0]).toBe(e.atlas);
      expect(e.draws.some(d => d[0] === e.weapon)).toBe(false);
    }
  });
  it('test_martial_poses_bow_release_and_long_palm_match_actual_contact_frame', () => {
    for (const [id, frame] of [['art_bow_star', 5], ['art_cold_palm', 4], ['tm_poison_dart', 4]] as const) {
      const def = martialPoseFor(id)!;
      expect(sampleMartialPose(def, .36, .72, .36)).toBe(frame);
      expect(sampleMartialPose(def, .375, .72, .36)).toBe(frame);
      expect(sampleMartialPose(def, .36, .72, .36, null, true)).toBe(frame);
    }
  });
  it('test_martial_poses_all_rare_external_recoveries_draw_correct_variant_without_equipment_overlay', () => {
    for (const def of MARTIAL_POSES.filter(d => d.critRecovery)) for (const killed of [false, true]) {
      const e = engine(def.id, true);
      const crit = { marker: '真暴擊收勢', width: 4096, height: 352 } as unknown as HTMLImageElement;
      const kill = { marker: '真擊倒收勢', width: 4096, height: 352 } as unknown as HTMLImageElement;
      e.stage.setMartialAssets(new Map([[def.id, { atlas: e.atlas, guard: false, variants: { crit, kill } }]]));
      e.stage.inspectMartialPose(def.id, .6, { dmg: 100, crit: true, killed, heal: 0 });
      const raw = e.stage as unknown as { drawWarrior(g: { k: number; groundY: number; heroX: number }): void };
      raw.drawWarrior({ k: .1, groundY: 220, heroX: 100 });
      expect(e.draws).toHaveLength(1); expect(e.draws[0]![0]).toBe(killed ? kill : crit);
      expect(e.draws.some(d => d[0] === e.weapon)).toBe(false);
    }
  });
  it('test_martial_poses_all_37_supports_follow_one_real_foe_event_without_extra_attack', () => {
    const supports = Object.values(SKILL_DEFS).filter(d => d.kind !== 'external');
    expect(supports).toHaveLength(37);
    for (const def of supports) {
      const e = engine('art_river_fist', true); e.stage.enterScene(); let calls = 0;
      e.stage.setQuiet(true); e.stage.setMartialAssets(new Map([[def.id, { atlas: e.atlas, guard: false }]]), [def.id]);
      const raw = e.stage as unknown as {
        combat: SparCombatHooks; enemies: unknown[]; supportPose: { id: string } | null;
        foeHits(enemy: unknown): void;
      };
      raw.combat.foeStrike = () => { calls++; return { dmg: def.kind === 'internal' ? 2 : 0, heroDown: false }; };
      raw.foeHits(raw.enemies[0]);
      expect(calls).toBe(1); expect(raw.supportPose?.id).toBe(def.id);
      expect(e.events).not.toContain('hero');
    }
  });
  it('test_martial_poses_miss_does_not_create_hurt_or_damage_floaters', () => {
    const e = engine('art_river_fist', true, true);
    for (let i = 0; i < 360; i++) e.stage.update(1 / 60);
    const raw = e.stage as unknown as { floaters: { kind: string }[] };
    expect(raw.floaters.filter(f => f.kind === 'dmg' || f.kind === 'crit')).toHaveLength(0);
  });
  it('test_martial_poses_other_rare_art_never_changes_active_effects_by_load_order', () => {
    const e = engine('sl_luohan_fist', true);
    const ordinary = { marker: '羅漢短勁' } as unknown as HTMLImageElement;
    const rare = { marker: '金剛運氣' } as unknown as HTMLImageElement;
    const raw = e.stage as unknown as { martialId: string; artSpriteImages(): { qi: HTMLImageElement } };
    for (const reverse of [false, true]) {
      const entries: [string, { atlas: HTMLImageElement; guard: boolean; effects: { qi: HTMLImageElement } }][] = [
        ['sl_luohan_fist', { atlas: e.atlas, guard: false, effects: { qi: ordinary } }],
        ['pr_diamond_body', { atlas: e.atlas, guard: false, effects: { qi: rare } }],
      ];
      e.stage.setMartialAssets(new Map(reverse ? entries.reverse() : entries));
      raw.martialId = 'sl_luohan_fist'; expect(raw.artSpriteImages().qi).toBe(ordinary);
      raw.martialId = 'pr_diamond_body'; expect(raw.artSpriteImages().qi).toBe(rare);
    }
  });
  it('test_martial_poses_replay_is_deterministic_and_volumes_do_not_invent_crit', () => {
    const first = makeMartialReplay(['art_river_fist']);
    expect(makeMartialReplay(['art_river_fist'])).toEqual(first);
    expect(first.rounds.flatMap(r => r.hits).some(h => h.vol && h.vol >= 5)).toBe(true);
    expect(first.rounds.flatMap(r => r.hits).some(h => h.crit)).toBe(false);
    const spar = makeMartialReplay(['pr_mountain_split'], 'spar');
    expect(spar.rounds.flatMap(r => r.hits).some(h => h.crit && h.vol === 1)).toBe(true);
    const finish = makeMartialReplay(['pr_mountain_split'], 'spar', 1);
    expect(finish.outcome).toBe('won');
    expect(finish.rounds.flatMap(r => r.hits).some(h => h.side === 'player' && h.foeHp === 0)).toBe(true);
  });
  it('test_martial_poses_atlas_failure_uses_same_art_guard_instead_of_wrong_weapon', async () => {
    const urls: string[] = [];
    class FakeImage {
      onload: (() => void) | null = null; onerror: ((e: Error) => void) | null = null;
      set src(url: string) { urls.push(url); queueMicrotask(() => url.endsWith('art_stone_palm.webp') ? this.onerror?.(new Error('測試404')) : this.onload?.()); }
    }
    vi.stubGlobal('Image', FakeImage);
    try {
      const assets = await loadMartialAssets(['art_stone_palm']);
      expect(assets.get('art_stone_palm')?.guard).toBe(true);
      expect(urls.some(url => url.endsWith('art_stone_palm-guard.webp'))).toBe(true);
      expect(urls.some(url => /sword|blade/.test(url))).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });
});
