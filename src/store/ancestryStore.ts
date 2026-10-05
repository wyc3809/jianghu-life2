/**
 * 祖蔭（帳戶層、跨世永久）：localStorage `jianghu_ancestry_v1`，同人生存檔分開，
 * 「重新開始」都唔會清。私隱模式寫唔到就只留喺記憶體。
 * 規則：design/gdd/ancestral-merit.md；邏輯：core/life/ancestry.ts。
 */
import { queueCloudSync } from '../cloud/sync';
import { create } from 'zustand';
import { produce } from 'immer';
import type { AncestryMeta } from '@interfaces/ancestry';
import type { WuxiaAttribute } from '@interfaces/lifeEngine';
import {
  buySecondSlot,
  buyTalent,
  recordLife,
  toggleFamilyArt,
  unlockArt,
  type MeritGain,
} from '@core/life/ancestry';
import { useLifeStore } from './lifeStore';
import { loadAncestry, persistAncestry } from './ancestryMeta';
import { schedulePersist } from './persistSchedule';
import { settleLifeIntoAccount } from '@core/life/accountSettle';
import {
  exchangePages,
  grantTestPaidJade,
  pull,
  pulpManual,
  setWish,
  upgradeManual,
  type BannerId,
  type PullResult,
} from '@core/life/gacha';
import { getSkillDef } from '@data/skills/catalog';
import {
  chooseEncounterRoute,
  claimEncounter,
  dismissEncounterOffer,
  tickEncounter,
} from '@core/life/encounters';

export { loadAncestry };

interface AncestryStore {
  meta: AncestryMeta;
  /** 呢一世結算咗幾多（總結頁顯示） */
  award: MeritGain | null;
  panelOpen: boolean;
  /** 啱啱達成嘅家族里程碑（toast 用），例如「開枝散葉 · 祖蔭＋3」 */
  milestoneToast: string[];
  /** 檢查家族里程碑：首次達成即入祖蔭（帳戶層，同一個只領一次） */
  checkMilestones: () => void;
  clearMilestoneToast: () => void;
  /** 人生去到總結：結算一次（靠角色 flag 防重複） */
  awardCurrentLife: () => void;
  buyTalent: (attr: WuxiaAttribute) => void;
  unlockArt: (skillId: string) => void;
  buySecondSlot: () => void;
  toggleFamilyArt: (skillId: string) => void;
  setPanelOpen: (open: boolean) => void;
  /** 啱啱入帳嘅免費玉石（toast 用） */
  jadeToast: number;
  clearJadeToast: () => void;
  /** 抽卡；返回結果（玉石唔夠＝null） */
  gachaPull: (banner: BannerId, n: number) => PullResult[] | null;
  lastPull: PullResult[] | null;
  setWish: (banner: BannerId, artId: string) => void;
  upgradeManual: (artId: string) => void;
  pulpManual: (artId: string) => void;
  exchangePages: (artId: string) => void;
  /** 測試版：領付費玉石測試額度 */
  grantTestJade: () => void;
  /** 由家族收藏學一門秘笈（今世角色） */
  learnManual: (artId: string) => void;
  gachaOpen: boolean;
  setGachaOpen: (open: boolean) => void;
  /** 在線奇遇：定時叫（只喺開住遊戲時） */
  encounterTick: (now: number) => void;
  /** 奇遇彈窗開住（彈出／玩家撳返） */
  encounterOpen: boolean;
  setEncounterOpen: (open: boolean) => void;
  chooseEncounter: (routeId: string) => void;
  dismissEncounter: () => void;
  claimEncounter: () => string | null;
  /** 啱啱領到嘅傳承（彈窗顯示） */
  encounterReward: string | null;
  clearEncounterReward: () => void;
}

function mutate(get: () => AncestryStore, set: (p: Partial<AncestryStore>) => void, fn: (m: AncestryMeta) => boolean) {
  const next = structuredClone(get().meta);
  if (!fn(next)) return;
  persistAncestry(next);
  set({ meta: next });
  queueCloudSync(useLifeStore.getState().state);
}

export const useAncestryStore = create<AncestryStore>()((set, get) => ({
  meta: loadAncestry(),
  award: null,
  panelOpen: false,
  milestoneToast: [],
  checkMilestones: () => {
    const life = useLifeStore.getState().state;
    if (!life) return;
    const meta = structuredClone(get().meta);
    let result = { milestones: [] as { label: string; merit: number }[], jade: 0, metaChanged: false, lifeChanged: false };
    const next = produce(life, (draft) => {
      result = settleLifeIntoAccount(meta, draft);
    });
    if (result.metaChanged) {
      persistAncestry(meta);
      set({
        meta,
        ...(result.milestones.length
          ? { milestoneToast: result.milestones.map((m) => `${m.label} · 祖蔭＋${m.merit}`) }
          : {}),
        ...(result.jade >= 10 ? { jadeToast: get().jadeToast + result.jade } : {}),
      });
      queueCloudSync(life);
    }
    if (result.lifeChanged) {
      useLifeStore.setState({ state: next });
      schedulePersist(next, { immediate: false });
    }
  },
  clearMilestoneToast: () => set({ milestoneToast: [] }),
  awardCurrentLife: () => {
    const life = useLifeStore.getState().state;
    if (!life || life.phase !== 'summary' || life.character.flags.ancestry_awarded) return;
    const meta = structuredClone(get().meta);
    let gain: MeritGain = { total: 0, parts: [] };
    const next = produce(life, (draft) => {
      gain = recordLife(meta, draft);
    });
    persistAncestry(meta);
    set({ meta, award: gain });
    // produce 出嚟嘅物件係凍結嘅；importState 會跑遷移，交一份可改嘅副本
    useLifeStore.getState().importState(structuredClone(next));
  },
  buyTalent: (attr) => mutate(get, set, (m) => buyTalent(m, attr)),
  unlockArt: (id) => mutate(get, set, (m) => unlockArt(m, id)),
  buySecondSlot: () => mutate(get, set, (m) => buySecondSlot(m)),
  toggleFamilyArt: (id) => mutate(get, set, (m) => toggleFamilyArt(m, id)),
  setPanelOpen: (open) => set({ panelOpen: open }),
  jadeToast: 0,
  clearJadeToast: () => set({ jadeToast: 0 }),
  lastPull: null,
  gachaOpen: false,
  setGachaOpen: (open) => set({ gachaOpen: open, ...(open ? {} : { lastPull: null }) }),
  gachaPull: (banner, n) => {
    const next = structuredClone(get().meta);
    const res = pull(next, banner, n);
    if (!res) return null;
    persistAncestry(next);
    set({ meta: next, lastPull: res });
    queueCloudSync(useLifeStore.getState().state);
    get().checkMilestones(); // 即刻將升階鏡像去角色
    return res;
  },
  setWish: (banner, id) => mutate(get, set, (m) => setWish(m, banner, id)),
  upgradeManual: (id) => {
    mutate(get, set, (m) => upgradeManual(m, id));
    get().checkMilestones();
  },
  pulpManual: (id) => mutate(get, set, (m) => pulpManual(m, id)),
  exchangePages: (id) => mutate(get, set, (m) => exchangePages(m, id)),
  grantTestJade: () => mutate(get, set, (m) => grantTestPaidJade(m) > 0),
  encounterOpen: false,
  encounterReward: null,
  setEncounterOpen: (open) => set({ encounterOpen: open }),
  clearEncounterReward: () => set({ encounterReward: null }),
  encounterTick: (now) => {
    const life = useLifeStore.getState().state;
    const next = structuredClone(get().meta);
    const before = JSON.stringify(next.encounter ?? null);
    const r = tickEncounter(next, life, now);
    if (JSON.stringify(next.encounter ?? null) === before) return;
    persistAncestry(next);
    set({ meta: next, ...(r === 'offered' ? { encounterOpen: true } : {}) });
    if (r !== 'progress') queueCloudSync(life);
  },
  chooseEncounter: (routeId) => {
    const life = useLifeStore.getState().state;
    if (!life) return;
    mutate(get, set, (m) => chooseEncounterRoute(m, life, routeId, Date.now()));
  },
  dismissEncounter: () => {
    mutate(get, set, (m) => {
      dismissEncounterOffer(m, Date.now());
      return true;
    });
    set({ encounterOpen: false });
  },
  claimEncounter: () => {
    const next = structuredClone(get().meta);
    const id = claimEncounter(next, Date.now());
    if (!id) return null;
    persistAncestry(next);
    set({ meta: next, encounterReward: id, encounterOpen: true });
    queueCloudSync(useLifeStore.getState().state);
    return id;
  },
  learnManual: (id) => {
    const life = useLifeStore.getState().state;
    if (!life || life.phase !== 'playing' || !life.character.alive) return;
    if (!get().meta.manuals?.[id] || life.character.skills.includes(id) || !getSkillDef(id)) return;
    const next = produce(life, (draft) => {
      const c = draft.character;
      c.skills.push(id);
      c.skillRanks = { ...(c.skillRanks ?? {}), [id]: c.skillRanks?.[id] ?? 0 };
      c.skillProgress = { ...(c.skillProgress ?? {}), [id]: c.skillProgress?.[id] ?? 0 };
    });
    useLifeStore.setState({ state: next });
    schedulePersist(next, { immediate: true });
    get().checkMilestones();
  },
}));
