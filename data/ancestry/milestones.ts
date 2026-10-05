/**
 * 祖蔭家族里程碑（design/agreed-design-2026-10.md §4）：
 * 「首次完成重要家族里程碑即獲祖蔭，同一首次成就只領一次。」
 *
 * ⚠ 邊幾項算「重要家族里程碑」同每項幾多祖蔭，md 寫明「未確認」——
 *   下面全部係**測試參數**，等玩家睇圖再揀；改呢個檔就得，唔使改邏輯。
 *   祖蔭參考：一世結算上限 40 點、天賦第一級 3 點、解鎖家傳武學 8 點。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { MAX_SECT_STANDING } from '@data/content/packs';

export interface FamilyMilestone {
  id: string;
  label: string;
  /** 未達成時嘅提示 */
  hint: string;
  /** 首次達成得幾多祖蔭（測試參數） */
  merit: number;
  test: (s: LifeGameState) => boolean;
}

const gen = (s: LifeGameState) => Math.max(1, Number(s.character.flags.legacy_generation ?? 1));
const tier = (s: LifeGameState) => s.character.cultivation?.tier ?? 0;

export const FAMILY_MILESTONES: FamilyMilestone[] = [
  {
    id: 'fm_first_child',
    label: '開枝散葉',
    hint: '家族第一次有子女',
    merit: 3,
    test: (s) => (s.character.childrenCount ?? 0) >= 1,
  },
  {
    id: 'fm_gen3',
    label: '三世同譜',
    hint: '家族傳到第三代',
    merit: 5,
    test: (s) => gen(s) >= 3,
  },
  {
    id: 'fm_gen5',
    label: '五世其昌',
    hint: '家族傳到第五代',
    merit: 8,
    test: (s) => gen(s) >= 5,
  },
  {
    id: 'fm_tier6',
    label: '家門初顯',
    hint: '家族第一次有人修到第六境',
    merit: 3,
    test: (s) => tier(s) >= 5,
  },
  {
    id: 'fm_tier11',
    label: '一門宗師',
    hint: '家族第一次有人修到第十一境',
    merit: 6,
    test: (s) => tier(s) >= 10,
  },
  {
    id: 'fm_boss',
    label: '首斬強敵',
    hint: '家族第一次打贏首領生死戰',
    merit: 4,
    test: (s) => Number(s.character.flags.boss_wins ?? 0) >= 1,
  },
  {
    id: 'fm_sect_head',
    label: '執掌一派',
    hint: '家族第一次有人做到掌門',
    merit: 8,
    test: (s) => Boolean(s.character.sectId) && (s.character.sectStanding ?? 0) >= MAX_SECT_STANDING,
  },
  {
    id: 'fm_vault_10k',
    label: '家資萬兩',
    hint: '家族銀庫第一次累積到一萬兩',
    merit: 3,
    test: (s) => (s.character.money ?? 0) >= 10_000,
  },
];
