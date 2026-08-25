import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import type { BreakthroughResult } from '@core/life/cultivation';
import { fullCatalog } from '@core/life/eventEngine';
import { subscribeEventOverrides } from '@core/life/eventOverrides';
import { clearLifeSave } from '@core/life/saveIndexedDb';
import { flushPersist, schedulePersist } from './persistSchedule';
import { type PracticeActionId } from '@core/life/actions';
import { type CombatFoeDisposition } from '@core/life/combat';
import { createCharacterSlice } from './slices/characterSlice';
import { createEventSlice } from './slices/eventSlice';
import { createCombatSlice } from './slices/combatSlice';
import { createProgressionSlice } from './slices/progressionSlice';

/** 隨手機覆寫熱更新；勿在模組頂層固定死引用 */
let CATALOG = fullCatalog();
subscribeEventOverrides(() => {
  CATALOG = fullCatalog();
});

export interface LastResult {
  title: string;
  feedback: string;
  deltas: string[];
  choiceText: string;
}

export interface LifeStore {
  state: LifeGameState | null;
  debugOpen: boolean;
  bootstrapped: boolean;
  sealText: string | null;
  flashLines: string[];
  lastResult: LastResult | null;
  creating: boolean;
  bootstrap: () => Promise<void>;
  beginCreate: () => void;
  cancelCreate: () => void;
  newLife: (opts?: import('@core/life/gameState').CreateLifeOptions | number) => void;
  /** 帶前世墨跡轉世 */
  reincarnate: () => void;
  continueLife: () => Promise<boolean>;
  advanceMonth: () => void;
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  /** 無可選抉擇時暫避 */
  dismissEvent: () => void;
  dismissCoach: () => void;
  practice: (actionId: PracticeActionId, opts?: { sectId?: string; artId?: string }) => void;
  combatMove: (moveId: string) => void;
  combatSetInternalMode: (modeId: string | null) => void;
  combatResolveFoe: (disposition: CombatFoeDisposition) => void;
  clearResult: () => void;
  setTab: (tab: NonNullable<LifeGameState['tab']>) => void;
  setDebugOpen: (open: boolean) => void;
  importState: (state: LifeGameState) => void;
  clearSeal: () => void;
  huashanStart: () => void;
  huashanFight: () => void;
  huashanDismissReport: () => void;
  huashanClose: () => void;
  /** 免費換裝（不耗修煉次數） */
  equipOwned: (gearId: string) => void;
  /** 「獲得新裝備」彈窗：換上或先收好 */
  resolveGearCompare: (action: 'equip' | 'keep') => void;
  foundSect: (sectName: string) => void;
  recruitDisciple: () => void;
  teachDisciple: (discipleId: string) => void;
  /** 放置修為：實時累積（deltaSeconds 由 UI 嘅 ticker 計出） */
  tickCultivation: (deltaSeconds: number) => void;
  /** 突破：修為滿咗先可以觸發 */
  attemptBreakthrough: () => void;
  /** 突破結果：驅動專屬彈窗＋升級動畫（null＝冇要顯示） */
  breakthroughResult: BreakthroughResult | null;
  clearBreakthroughResult: () => void;
  /** 上次讀檔嘅離線收益提示（null＝冇要顯示） */
  offlineGainXp: number | null;
  clearOfflineGain: () => void;
}

async function save(state: LifeGameState, immediate = true) {
  schedulePersist(state, { immediate });
}

export const useLifeStore = create<LifeStore>()(
  immer((set, get) => ({
    state: null,
    debugOpen: false,
    bootstrapped: false,
    sealText: null,
    flashLines: [],
    lastResult: null,
    creating: false,
    offlineGainXp: null,
    breakthroughResult: null,

    ...createProgressionSlice(set, get, save),
    ...createEventSlice(set, get, save),
    ...createCombatSlice(set, get, save),
    ...createCharacterSlice(set, get, save),
  })),
);

export async function resetLifeSave() {
  flushPersist();
  await clearLifeSave();
}

export { CATALOG as LIFE_CATALOG };
