import { recomputeCapBonuses } from '@core/life/equipment';
import { setPresetMartialSlot, ensureCombatPreset, setDuelGear } from '@core/life/loadoutPresets';
import { syncCollectionVolumes, collectionVolumes } from '@core/life/volumes';
import { getSkillDef } from '@data/skills/catalog';
import { useAncestryStore } from '../ancestryStore';
import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { equipGear, resolveGearCompare as resolveGearCompareAction } from '@core/life/equipment';
import { sanitizePlayerLine } from '@core/life/playerText';
import { ensureNewbieReward, startNewbieTrial } from '@core/life/goals';
import { NEWBIE_TRIAL } from '@data/redesign/newbie';
import { getGearDef } from '@data/equipment/catalog';
import { newbieActive } from '@core/life/goals';
import { setMainArt } from '@core/life/schools';
import type { SkillKind } from '@data/skills/catalog';
import type { LifeStore } from '../lifeStore';

export function createCharacterSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<LifeStore, 'equipOwned' | 'prepareNewbieEquipment' | 'resolveGearCompare' | 'startNewbieTrial' | 'setMainArt' | 'setMartialSlot'> {
  return {
    prepareNewbieEquipment: () => {
      const { state } = get();
      if (!state || !state.character.alive || state.phase !== 'playing' || state.pendingCombat || !newbieActive(state)) return;
      const next = produce(state, draft => { ensureNewbieReward(draft); });
      if (next === state) return;
      void save(next); set({ state: next });
    },
    setMartialSlot: (slot, skillId, preset = 'normal') => {
      const { state, combatReplay } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive || state.pendingCombat || combatReplay) return false;
      const meta = useAncestryStore.getState().meta;
      let ok = false;
      const next = produce(state, draft => {
        const c = draft.character;
        if (skillId && !c.skills.includes(skillId)) {
          if (!meta.manuals?.[skillId] || !getSkillDef(skillId)) return;
          const vols = collectionVolumes(meta, skillId);
          if (vols.length) c.volumes = { ...c.volumes, [skillId]: vols };
          c.skills.push(skillId);
          c.skillRanks[skillId] ??= 0;
          c.skillProgress[skillId] ??= 0;
        }
        ok = setPresetMartialSlot(draft, slot, skillId, preset);
        if (ok) {
          syncCollectionVolumes(c, meta);
          if (skillId && meta.manuals?.[skillId]) {
            c.manualStars = { ...c.manualStars, [skillId]: meta.manuals[skillId].stars };
            recomputeCapBonuses(c);
          }
        }
      });
      if (!ok) return false;
      void save(next);
      set({ state: next });
      return true;
    },
    setMainArt: (kind: SkillKind, skillId: string) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive || state.pendingCombat || get().combatReplay) return;
      let ok = false;
      const next = produce(state, (draft) => {
        ok = setMainArt(draft, kind, skillId);
      });
      if (!ok) return;
      void save(next);
      set({ state: next });
    },

    startNewbieTrial: () => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || state.pendingCombat) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = startNewbieTrial(draft);
      });
      if (!logs.length) return;
      void save(next);
      set({ state: next, flashLines: [], lastResult: null });
    },

    equipOwned: (gearId: string, preset = 'normal') => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return;
      if (state.pendingCombat) return;
      let msg = '';
      const next = produce(state, (draft) => {
        const before = getGearDef(draft.character.equipment.weapon ?? '')?.attack ?? 0;
        const recordGuide = preset === 'normal' && newbieActive(draft) && draft.character.flags.newbie_trial_won
          && gearId === NEWBIE_TRIAL.rewardGearId && draft.character.equipment.weapon !== gearId;
        if (gearId === NEWBIE_TRIAL.rewardGearId) ensureNewbieReward(draft);
        ensureCombatPreset(draft.character);
        if (preset === 'duel') msg = setDuelGear(draft.character, gearId) ? '已更新對戰裝備。' : '未能更換對戰裝備。';
        else msg = equipGear(draft, gearId);
        if (recordGuide && draft.character.equipment.weapon === gearId) draft.character.flags.newbie_weapon_attack_before = before;
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
