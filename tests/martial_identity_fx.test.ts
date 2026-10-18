import { describe, expect, it } from 'vitest';
import { martialFootwork } from '../src/fx/art/footwork';
import { MartialIdentityFx, type IdentityImpact } from '../src/fx/art/identityFx';

const image = (marker: string) => ({ marker }) as unknown as HTMLImageElement;
const impact = (changes: Partial<IdentityImpact> = {}): IdentityImpact => ({
  textures: { signature: image('掌瓣'), detail: image('纖維'), finish: image('餘韻') },
  hero: { x: 40, y: 100 }, target: { x: 150, y: 100 }, height: 80,
  premium: false, support: false, crit: false, killed: false, damage: 100, quiet: false, ...changes,
});
describe('全武學專屬位圖特效', () => {
  it('test_martial_footwork_tide_stays_grounded_cloud_rises_and_quiet_resets', () => {
    expect(martialFootwork('pr_tide_step', .5).dy).toBeLessThan(.02);
    expect(martialFootwork('pr_cloud_step', .5).dy).toBeGreaterThan(.6);
    expect(martialFootwork('pr_shadow_flash', .5).dy).toBe(0);
    for (const id of ['pr_cloud_step', 'pr_tide_step', 'qg_feiyan', 'art_nine_shadow']) {
      expect(martialFootwork(id, 0)).toEqual({ dx: 0, dy: 0 });
      expect(martialFootwork(id, 1)).toEqual({ dx: 0, dy: 0 });
      expect(martialFootwork(id, .4, true)).toEqual({ dx: 0, dy: 0 });
    }
  });
  it('test_martial_identity_fx_miss_and_reduced_motion_do_not_create_impacts', () => {
    const fx = new MartialIdentityFx();
    fx.impact(impact({ damage: 0, crit: true, killed: true }));
    fx.impact(impact({ quiet: true }));
    expect(fx.count).toBe(0);
  });
  it('test_martial_identity_fx_rare_regular_critical_finish_have_real_additional_layers', () => {
    const normal = new MartialIdentityFx(); normal.impact(impact());
    const rare = new MartialIdentityFx(); rare.impact(impact({ premium: true }));
    const critical = new MartialIdentityFx(); critical.impact(impact({ premium: true, crit: true }));
    const finish = new MartialIdentityFx(); finish.impact(impact({ premium: true, crit: true, killed: true }));
    expect([normal.count, rare.count, critical.count, finish.count]).toEqual([1, 3, 5, 7]);
  });
  it('test_martial_identity_fx_each_live_layer_keeps_its_own_image_after_art_changes', () => {
    const a = image('掌花'); const b = image('針線'); const fx = new MartialIdentityFx();
    fx.impact(impact({ textures: { signature: a } }));
    fx.impact(impact({ textures: { signature: b } })); fx.step(.08);
    const drawn: unknown[] = [];
    const ctx = { globalAlpha: 1, save() {}, restore() {}, translate() {}, rotate() {}, drawImage: (im: unknown) => drawn.push(im) } as unknown as CanvasRenderingContext2D;
    fx.draw(ctx); expect(drawn).toEqual([a, b]);
    for (let i = 0; i < 20; i++) fx.step(.1);
    expect(fx.count).toBe(0); drawn.length = 0; fx.draw(ctx); expect(drawn).toHaveLength(0);
  });
  it('test_martial_identity_fx_support_stays_on_self_and_never_uses_attack_finish', () => {
    const fx = new MartialIdentityFx(); fx.impact(impact({ support: true, damage: 0, premium: true, crit: true, killed: true })); fx.step(.2);
    const positions: number[] = [];
    const ctx = { globalAlpha: 1, save() {}, restore() {}, translate: (x: number) => positions.push(x), rotate() {}, drawImage() {} } as unknown as CanvasRenderingContext2D;
    fx.draw(ctx); expect(fx.count).toBe(3); expect(positions.every(x => Math.abs(x - 40) < 15)).toBe(true);
  });
  it('test_martial_identity_fx_particle_budget_and_clear_release_all_image_references', () => {
    const fx = new MartialIdentityFx(); for (let i = 0; i < 100; i++) fx.impact(impact({ premium: true, crit: true, killed: true }));
    expect(fx.count).toBe(40); fx.clear(); expect(fx.count).toBe(0);
  });
});
