import type { GearCombatBonus, GearDef, GearSpecialEffect } from './catalog';

/**
 * 手機可改嘅裝備補丁——同 core/life/eventOverrides.ts 走一樣嘅設計：
 * 精簡欄位、存本地、getGearDef 讀取時透明套用（真係影響戰鬥數值，唔止預覽）。
 */
const LS_KEY = 'jianghu_gear_overrides_v1';

export type GearPatch = {
  name?: string;
  description?: string;
  attack?: number;
  defense?: number;
  maxHpBonus?: number;
  maxQiBonus?: number;
  martialBonus?: number;
  combat?: GearCombatBonus;
  special?: GearSpecialEffect;
};

export type GearOverrideStore = {
  version: 1;
  updatedAt: number;
  patches: Record<string, GearPatch>;
};

let memory: GearOverrideStore = { version: 1, updatedAt: 0, patches: {} };
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function subscribeGearOverrides(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getGearOverrideStore(): GearOverrideStore {
  return memory;
}

export function getGearPatch(id: string): GearPatch | undefined {
  loadGearOverrides();
  return memory.patches[id];
}

export function listPatchedGearIds(): string[] {
  return Object.keys(memory.patches);
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memory));
  } catch {
    /* quota / private mode */
  }
}

export function loadGearOverrides(): GearOverrideStore {
  if (loaded) return memory;
  loaded = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GearOverrideStore;
      if (parsed?.version === 1 && parsed.patches && typeof parsed.patches === 'object') {
        memory = {
          version: 1,
          updatedAt: Number(parsed.updatedAt) || Date.now(),
          patches: parsed.patches,
        };
      }
    }
  } catch {
    memory = { version: 1, updatedAt: 0, patches: {} };
  }
  return memory;
}

function sanitizeCombat(c: GearCombatBonus | undefined): GearCombatBonus | undefined {
  if (!c || typeof c !== 'object') return undefined;
  const out: GearCombatBonus = {};
  for (const k of ['hitBonus', 'evasion', 'reflect', 'pierce', 'lifesteal', 'bleedChance'] as const) {
    if (typeof c[k] === 'number' && Number.isFinite(c[k])) out[k] = c[k];
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeSpecial(s: GearSpecialEffect | undefined): GearSpecialEffect | undefined {
  if (!s || typeof s !== 'object') return undefined;
  if (!s.kind || !['burst', 'stun_proc', 'revive'].includes(s.kind)) return undefined;
  if (typeof s.name !== 'string' || !s.name.trim()) return undefined;
  const out: GearSpecialEffect = { kind: s.kind, name: s.name, description: s.description ?? '' };
  if (typeof s.chance === 'number' && Number.isFinite(s.chance)) out.chance = Math.min(1, Math.max(0, s.chance));
  if (typeof s.power === 'number' && Number.isFinite(s.power)) out.power = s.power;
  return out;
}

function sanitizePatch(patch: GearPatch): GearPatch {
  const out: GearPatch = {};
  if (typeof patch.name === 'string' && patch.name.trim()) out.name = patch.name;
  if (typeof patch.description === 'string') out.description = patch.description;
  for (const k of ['attack', 'defense', 'maxHpBonus', 'maxQiBonus', 'martialBonus'] as const) {
    if (typeof patch[k] === 'number' && Number.isFinite(patch[k])) out[k] = Math.round(patch[k]!);
  }
  const combat = sanitizeCombat(patch.combat);
  if (combat) out.combat = combat;
  const special = sanitizeSpecial(patch.special);
  if (special) out.special = special;
  return out;
}

function isEmptyPatch(p: GearPatch): boolean {
  return (
    p.name === undefined &&
    p.description === undefined &&
    p.attack === undefined &&
    p.defense === undefined &&
    p.maxHpBonus === undefined &&
    p.maxQiBonus === undefined &&
    p.martialBonus === undefined &&
    !p.combat &&
    !p.special
  );
}

export function saveGearPatch(gearId: string, patch: GearPatch): void {
  loadGearOverrides();
  const clean = sanitizePatch(patch);
  if (isEmptyPatch(clean)) {
    delete memory.patches[gearId];
  } else {
    memory.patches[gearId] = clean;
  }
  memory.updatedAt = Date.now();
  persist();
  emit();
}

export function removeGearPatch(gearId: string): void {
  loadGearOverrides();
  delete memory.patches[gearId];
  memory.updatedAt = Date.now();
  persist();
  emit();
}

export function clearAllGearPatches(): void {
  memory = { version: 1, updatedAt: Date.now(), patches: {} };
  persist();
  emit();
}

/** 測試用：模擬重新載入頁面 */
export function resetGearOverrideRuntime(): void {
  memory = { version: 1, updatedAt: 0, patches: {} };
  loaded = false;
}

export function importGearOverrideStore(raw: unknown): { ok: true; count: number } | { ok: false; error: string } {
  try {
    const parsed = raw as GearOverrideStore;
    if (!parsed || parsed.version !== 1 || typeof parsed.patches !== 'object') {
      return { ok: false, error: '格式不正確（需要 version:1 + patches）' };
    }
    const next: Record<string, GearPatch> = {};
    for (const [id, p] of Object.entries(parsed.patches)) {
      if (!id || !p || typeof p !== 'object') continue;
      const clean = sanitizePatch(p);
      if (!isEmptyPatch(clean)) next[id] = clean;
    }
    memory = { version: 1, updatedAt: Date.now(), patches: next };
    persist();
    emit();
    return { ok: true, count: Object.keys(next).length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '匯入失敗' };
  }
}

export function exportGearOverrideStore(): string {
  loadGearOverrides();
  return JSON.stringify(memory, null, 2);
}

/** 套用補丁去底本裝備定義（唔改稀有度／槽位／兵器種類，只改數值同文案） */
export function applyGearPatch(def: GearDef, patch: GearPatch | undefined): GearDef {
  if (!patch) return def;
  const next: GearDef = { ...def };
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.attack !== undefined) next.attack = patch.attack;
  if (patch.defense !== undefined) next.defense = patch.defense;
  if (patch.maxHpBonus !== undefined) next.maxHpBonus = patch.maxHpBonus;
  if (patch.maxQiBonus !== undefined) next.maxQiBonus = patch.maxQiBonus;
  if (patch.martialBonus !== undefined) next.martialBonus = patch.martialBonus;
  if (patch.combat) next.combat = { ...def.combat, ...patch.combat };
  if (patch.special) next.special = { ...def.special, ...patch.special };
  return next;
}

/** 從現有裝備抽出可編輯草稿（方便表單預填） */
export function draftPatchFromGear(def: GearDef): GearPatch {
  const existing = getGearPatch(def.id);
  return {
    name: existing?.name ?? def.name,
    description: existing?.description ?? def.description,
    attack: existing?.attack ?? def.attack,
    defense: existing?.defense ?? def.defense,
    maxHpBonus: existing?.maxHpBonus ?? def.maxHpBonus,
    maxQiBonus: existing?.maxQiBonus ?? def.maxQiBonus,
    martialBonus: existing?.martialBonus ?? def.martialBonus,
    combat: existing?.combat ?? def.combat,
    special: existing?.special ?? def.special,
  };
}
