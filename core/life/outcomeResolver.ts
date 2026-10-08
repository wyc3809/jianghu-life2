import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { raiseBaseMaxQi } from './equipment';
import type { PackChoiceRaw, PackOutcomeOp } from './jianghuEventRepository';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export interface OutcomeResolveResult {
  logs: string[];
  deltas: string[];
  feedback: string;
  died: boolean;
  success: boolean;
}

const ATTR_PATH_LABEL: Record<string, string> = {
  courage: '膽識',
  perception: '悟性',
  intelligence: '悟性',
  charisma: '魅力',
};

const MEMORY_TAG_LINE: Record<string, string> = {
  acted_with_courage: '你記下這份挺身而出的江湖見聞。',
  chose_safety: '你記下這次抽身避禍的抉擇。',
  investigated: '你把查訪得來的細節默記於心。',
  followed_rules: '你把守規矩的這一遭記進心底。',
  informed_authority: '你把報官一事寫進自己的江湖簿。',
  trap_prepared: '你記下佈下的機關與後手。',
};

const ITEM_NAME: Record<string, string> = {
  clue_fragment: '線索殘片',
  letter: '無名密信',
  antidote: '解毒藥粉',
  herb: '草藥一包',
  token: '信物',
  map_scrap: '殘圖一角',
};

function pathTail(path: string): string {
  const parts = path.split('.').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function stringifyPackValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.tag === 'string') return obj.tag;
    if (typeof obj.item_id === 'string') return obj.item_id;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.id === 'string') return obj.id;
    if (typeof obj.text === 'string') return obj.text;
  }
  return '';
}

/**
 * OutcomeResolver：依序執行 pack outcomes（各自 chance），
 * 對應 Jianghu Random Events Pack v1 的 op/path/value。
 * 玩家可見字串一律中文，不泄漏路徑／旗標英文。
 */
export function resolvePackOutcomes(
  state: LifeGameState,
  choice: PackChoiceRaw,
): OutcomeResolveResult {
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const logs: string[] = [];
  const deltas: string[] = [];
  let died = false;
  let success = true;
  let skillFailed = false;

  const outcomes = choice.outcomes ?? [];
  for (const outcome of outcomes) {
    const chance = outcome.chance ?? 1;
    if (chance < 1 && !rng.chance(chance)) {
      if (outcome.op === 'skill_check') skillFailed = true;
      continue;
    }
    const line = applyPackOutcome(state, outcome);
    if (line.log) logs.push(line.log);
    if (line.delta) deltas.push(line.delta);
    if (line.failedCheck) {
      skillFailed = true;
      success = false;
    }
  }

  if (skillFailed) success = false;

  const rt = choice.result_text;
  const feedback =
    (typeof rt === 'string' ? rt : success ? rt?.success : rt?.failure) ||
    logs.find((l) => !/^(銀兩|氣血|名望|武學|內息|疲勞|膽識|悟性|魅力|根骨|福緣|人情)/.test(l)) ||
    logs[0] ||
    (success ? '你的選擇改變了事情的走向。' : '事情沒有完全按你的預期發展。');

  // 故事正文只用 result_text；數值／記憶行留在 logs／deltas，避免英文路徑滲進敘事
  if (typeof feedback === 'string' && feedback && !logs.includes(feedback)) {
    logs.unshift(feedback);
  }

  if (c.health <= 0) {
    c.alive = false;
    died = true;
  }

  snapshotRng(state);
  return { logs, deltas, feedback: String(feedback ?? '事已了結。'), died, success };
}

function applyPackOutcome(
  state: LifeGameState,
  outcome: PackOutcomeOp,
): { log?: string; delta?: string; failedCheck?: boolean } {
  const op = outcome.op ?? '';
  const path = String(outcome.path ?? '');
  const value = outcome.value;
  const c = state.character;

  switch (op) {
    case 'add': {
      const amount = Number(value ?? 0);
      if (!amount) return {};
      if (path.includes('wealth.coins')) {
        c.money += amount;
        c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
        const line = amount > 0 ? `銀兩＋${amount}` : `銀兩${amount}`;
        return { log: line, delta: line };
      }
      if (path.includes('health.hp')) {
        c.health = clamp(c.health + amount, 0, c.maxHealth);
        const line = `氣血${amount > 0 ? '＋' : ''}${amount}`;
        return { log: line, delta: line };
      }
      if (path.includes('health.fatigue') || path.includes('resources.time')) {
        c.actionPoints = clamp(c.actionPoints - Math.abs(amount), 0, 100);
        const line = `氣力－${Math.abs(amount)}`;
        return { log: line, delta: line };
      }
      if (path.includes('health.stress') || path.includes('emotions.stress')) {
        c.actionPoints = clamp(c.actionPoints - Math.ceil(Math.abs(amount) / 2), 0, 100);
        const dmg = Math.max(1, Math.floor(Math.abs(amount) / 3));
        c.health = clamp(c.health - dmg, 0, c.maxHealth);
        const line = `心神受擾（氣血－${dmg}）`;
        return { log: line, delta: line };
      }
      if (path.includes('emotions.calm') || path.includes('emotions.curiosity')) {
        c.qi = clamp(c.qi + Math.abs(amount), 0, c.maxQi);
        const line = `內息＋${Math.abs(amount)}`;
        return { log: line, delta: line };
      }
      if (path.includes('reputation')) {
        const rep = Math.sign(amount) * Math.max(1, Math.ceil(Math.abs(amount) / 2));
        c.reputation += rep;
        const line = `名望${rep > 0 ? '＋' : ''}${rep}`;
        return { log: line, delta: line };
      }
      if (path.includes('relationships')) {
        c.reputation += Math.sign(amount) || 1;
        return { log: '人情有變', delta: `名望${Math.sign(amount) > 0 ? '＋' : '－'}1` };
      }
      if (path.includes('attributes')) {
        const gain = Math.sign(amount) * Math.max(1, Math.ceil(Math.abs(amount) / 8));
        const key = pathTail(path);
        const label = ATTR_PATH_LABEL[key] ?? '武學';
        if (path.includes('perception') || path.includes('intelligence')) {
          c.attributes.wuXing = clamp(c.attributes.wuXing + gain, 1, 100);
        } else if (path.includes('charisma')) {
          c.attributes.meiLi = clamp(c.attributes.meiLi + gain, 1, 100);
        } else if (path.includes('courage')) {
          c.attributes.danShi = clamp(c.attributes.danShi + gain, 1, 100);
        } else {
          c.martial += Math.abs(gain);
        }
        const line = `${label}${gain > 0 ? '＋' : ''}${gain}`;
        return { log: line, delta: line };
      }
      if (path.includes('internal') || path.includes('qi')) {
        raiseBaseMaxQi(c, Math.max(1, Math.ceil(Math.abs(amount) / 2)));
        c.qi = clamp(c.qi + Math.abs(amount), 0, c.maxQi);
        return { log: `內力有進（上限 ${c.maxQi}）`, delta: `內息＋${Math.abs(amount)}` };
      }
      // 未知路徑：只做溫和回饋，不暴露英文 path
      c.martial += 1;
      return { log: '閱事有進', delta: '武學＋1' };
    }
    case 'set_flag': {
      const key = path || stringifyPackValue(value) || 'flag';
      c.flags[key] = true;
      state.worldFlags[key] = true;
      // 只記旗標，唔再顯示「記下此事」（玩家要求 2026-10-09）
      return {};
    }
    case 'create_memory': {
      const tag = stringifyPackValue(value);
      const text =
        MEMORY_TAG_LINE[tag] ||
        (typeof outcome.note === 'string' && outcome.note) ||
        '你記下了一段江湖見聞。';
      if (tag) c.flags[`memory_${tag}`] = true;
      return { log: text };
    }
    case 'add_item': {
      const raw = stringifyPackValue(value) || '江湖雜物';
      const name = ITEM_NAME[raw] || (/[\u4e00-\u9fff]/.test(raw) ? raw : '江湖雜物');
      c.flags[`item_${raw}`] = true;
      const line = `獲得：「${name}」`;
      return { log: line, delta: line };
    }
    case 'skill_check': {
      const note = typeof outcome.note === 'string' ? outcome.note : '';
      return { log: note || '你憑本事闖過這一關。' };
    }
    case 'roll_event': {
      const id = stringifyPackValue(value) || 'followup';
      c.flags[`followup_${id}`] = true;
      // 只記旗標，唔再顯示「後續」（玩家要求 2026-10-09）
      return {};
    }
    default:
      if (typeof outcome.note === 'string' && outcome.note) return { log: outcome.note };
      return {};
  }
}

// 「餘波」（事件後隨機得失）已按玩家要求刪除（2026-10-09）
