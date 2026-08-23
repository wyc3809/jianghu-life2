import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { equipGear, resolveGearCompare as resolveGearCompareAction } from '@core/life/equipment';
import { sanitizePlayerLine } from '@core/life/playerText';
import type { LifeStore } from '../lifeStore';

export function createCharacterSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<LifeStore, 'equipOwned' | 'resolveGearCompare'> {
  return {
    equipOwned: (gearId: string) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return;
      if (state.pendingCombat) return;
      let msg = '';
      const next = produce(state, (draft) => {
        msg = equipGear(draft, gearId);
      });
      void save(next);
      set({
        state: next,
        sealText: '裝',
        flashLines: [],
        lastResult: {
          title: '整裝',
          choiceText: '換裝',
          feedback: sanitizePlayerLine(msg),
          deltas: [],
        },
      });
    },

    resolveGearCompare: (action: 'equip' | 'keep') => {
      const { state } = get();
      if (!state?.pendingGearCompare) return;
      let msg = '';
      const next = produce(state, (draft) => {
        msg = resolveGearCompareAction(draft, action);
      });
      void save(next);
      set({
        state: next,
        flashLines: msg ? [sanitizePlayerLine(msg)] : [],
      });
    },
  };
}
