import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getBaseGearDef, getGearDef } from '../data/equipment/catalog';
import {
  clearAllGearPatches,
  draftPatchFromGear,
  exportGearOverrideStore,
  getGearPatch,
  importGearOverrideStore,
  listPatchedGearIds,
  removeGearPatch,
  resetGearOverrideRuntime,
  saveGearPatch,
} from '../data/equipment/overrides';

beforeEach(() => {
  resetGearOverrideRuntime();
  clearAllGearPatches();
});

afterEach(() => {
  clearAllGearPatches();
  resetGearOverrideRuntime();
});

describe('gear overrides: local patches transparently apply via getGearDef', () => {
  it('getGearDef returns the unmodified catalog entry with no patch saved', () => {
    const def = getGearDef('old-sword')!;
    expect(def.name).toBe('舊鐵劍');
    expect(def.attack).toBe(4);
  });

  it('saveGearPatch overrides name/description/stats, and getGearDef reflects it immediately', () => {
    saveGearPatch('old-sword', { name: '鏽鐵劍', attack: 99 });
    const def = getGearDef('old-sword')!;
    expect(def.name).toBe('鏽鐵劍');
    expect(def.attack).toBe(99);
    // 其餘欄位不變
    expect(def.slot).toBe('weapon');
    expect(def.rarity).toBe('common');

    // 底本定義（唔套用補丁）維持原樣，供編修器對照
    expect(getBaseGearDef('old-sword')!.name).toBe('舊鐵劍');
    expect(getBaseGearDef('old-sword')!.attack).toBe(4);
  });

  it('can patch the special effect on epic+ gear', () => {
    saveGearPatch('inkrain-sword', {
      special: { kind: 'burst', name: '改版劍雨', description: '改過嘅描述', chance: 0.5, power: 1 },
    });
    const def = getGearDef('inkrain-sword')!;
    expect(def.special?.name).toBe('改版劍雨');
    expect(def.special?.chance).toBe(0.5);
  });

  it('removeGearPatch reverts to the base definition', () => {
    saveGearPatch('old-sword', { name: '鏽鐵劍' });
    expect(getGearDef('old-sword')!.name).toBe('鏽鐵劍');
    removeGearPatch('old-sword');
    expect(getGearDef('old-sword')!.name).toBe('舊鐵劍');
  });

  it('listPatchedGearIds and clearAllGearPatches track and clear active patches', () => {
    saveGearPatch('old-sword', { attack: 10 });
    saveGearPatch('plain-robe', { defense: 20 });
    expect(listPatchedGearIds().sort()).toEqual(['old-sword', 'plain-robe']);
    clearAllGearPatches();
    expect(listPatchedGearIds()).toEqual([]);
    expect(getGearDef('old-sword')!.attack).toBe(4);
  });

  it('draftPatchFromGear prefills from the base def, then from any existing patch', () => {
    const freshDraft = draftPatchFromGear(getBaseGearDef('old-sword')!);
    expect(freshDraft.name).toBe('舊鐵劍');
    expect(freshDraft.attack).toBe(4);

    saveGearPatch('old-sword', { attack: 50 });
    const patchedDraft = draftPatchFromGear(getBaseGearDef('old-sword')!);
    expect(patchedDraft.attack).toBe(50);
    expect(patchedDraft.name).toBe('舊鐵劍'); // 未改嘅欄位仍係底本值
  });

  it('rejects an unknown special-effect kind and out-of-range chance', () => {
    saveGearPatch('inkrain-sword', {
      // @ts-expect-error 測試非法 kind 會被過濾
      special: { kind: 'not_a_kind', name: 'x', description: '' },
    });
    expect(getGearPatch('inkrain-sword')?.special).toBeUndefined();

    saveGearPatch('inkrain-sword', {
      special: { kind: 'burst', name: '測試', description: '', chance: 5 },
    });
    expect(getGearPatch('inkrain-sword')?.special?.chance).toBe(1); // 夾到 0-1
  });

  it('export/import round-trips the patch store', () => {
    saveGearPatch('old-sword', { attack: 77 });
    const exported = exportGearOverrideStore();
    clearAllGearPatches();
    expect(getGearDef('old-sword')!.attack).toBe(4);

    const res = importGearOverrideStore(JSON.parse(exported));
    expect(res.ok).toBe(true);
    expect(getGearDef('old-sword')!.attack).toBe(77);
  });

  it('importGearOverrideStore rejects a malformed payload', () => {
    const res = importGearOverrideStore({ nonsense: true });
    expect(res.ok).toBe(false);
  });
});
