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
  claimFamilyMilestones,
  recordLife,
  toggleFamilyArt,
  unlockArt,
  type MeritGain,
} from '@core/life/ancestry';
import { useLifeStore } from './lifeStore';
import { loadAncestry, persistAncestry } from './ancestryMeta';

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
    const gained = claimFamilyMilestones(meta, life);
    if (!gained.length) return;
    persistAncestry(meta);
    set({ meta, milestoneToast: gained.map((m) => `${m.label} · 祖蔭＋${m.merit}`) });
    queueCloudSync(life);
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
}));
