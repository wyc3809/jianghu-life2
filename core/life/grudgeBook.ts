import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';

const FLAG = 'grudge_book_json';

export type GrudgeKind = 'mercy' | 'blood' | 'stun' | 'favor' | 'debt';

export type GrudgeEntry = {
  id: string;
  name: string;
  kind: GrudgeKind;
  /** 1–5：恩怨深淺 */
  strength: number;
  monthsLeft: number;
  /** 到期時是否再啟戰端（記入當刻已暗中擲定） */
  willFight?: boolean;
};

function readBook(c: LifeGameState['character']): GrudgeEntry[] {
  const raw = c.flags[FLAG];
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as GrudgeEntry[];
    return Array.isArray(parsed) ? parsed.filter((g) => g && g.name) : [];
  } catch {
    return [];
  }
}

function writeBook(c: LifeGameState['character'], book: GrudgeEntry[]): void {
  const trimmed = book.slice(0, 12);
  if (!trimmed.length) {
    delete c.flags[FLAG];
    return;
  }
  c.flags[FLAG] = JSON.stringify(trimmed);
}

export function listGrudges(state: LifeGameState): GrudgeEntry[] {
  return readBook(state.character);
}

export function upsertGrudge(
  state: LifeGameState,
  entry: Omit<GrudgeEntry, 'id'> & { id?: string },
): void {
  const c = state.character;
  const book = readBook(c);
  const existing = book.find((g) => g.name === entry.name && g.kind === entry.kind);
  if (existing) {
    existing.strength = Math.min(5, existing.strength + 1);
    existing.monthsLeft = Math.max(existing.monthsLeft, entry.monthsLeft);
    if (entry.willFight) existing.willFight = true;
  } else {
    book.unshift({
      id: entry.id ?? `g_${entry.kind}_${book.length}_${entry.name.slice(0, 4)}`,
      name: entry.name,
      kind: entry.kind,
      strength: Math.max(1, Math.min(5, entry.strength)),
      monthsLeft: entry.monthsLeft,
      willFight: entry.willFight,
    });
  }
  writeBook(c, book);
}

/**
 * 戰後處置記入恩怨簿，並於當刻暗中擲定有無後續。
 * 回傳是否尚有下文（供處置文本落「待續」／「完滿」）。
 */
export function recordGrudgeFromDisposition(
  state: LifeGameState,
  disposition: 'kill' | 'release' | 'stun' | 'cripple',
  foeName: string,
): boolean {
  syncRngFromState(state);
  const rng = getRng();
  let followUp: boolean;
  if (disposition === 'release') {
    // 放走：或結一份人情（他日有贈），或留下一段舊怨（他日再戰）
    if (rng.chance(0.45)) {
      upsertGrudge(state, {
        name: foeName,
        kind: 'favor',
        strength: 2,
        monthsLeft: rng.nextInt(4, 10),
      });
      followUp = true;
    } else {
      const willFight = rng.chance(0.4);
      upsertGrudge(state, {
        name: foeName,
        kind: 'mercy',
        strength: 2,
        monthsLeft: rng.nextInt(4, 10),
        willFight,
      });
      followUp = willFight;
    }
  } else if (disposition === 'kill') {
    const willFight = rng.chance(0.42);
    upsertGrudge(state, {
      name: foeName,
      kind: 'blood',
      strength: 3,
      monthsLeft: rng.nextInt(5, 12),
      willFight,
    });
    followUp = willFight;
  } else {
    const willFight = rng.chance(0.35);
    upsertGrudge(state, {
      name: foeName,
      kind: 'stun',
      strength: 1,
      monthsLeft: rng.nextInt(3, 7),
      willFight,
    });
    followUp = willFight;
  }
  snapshotRng(state);
  return followUp;
}

/**
 * 每月暗中推進恩怨：到期者依記入時擲定的結果，或寫 pending 旗標再啟戰端，
 * 或悄無聲息地了結（人情回流只入賬，欠債暗損名望）。全程不落文字。
 * 實際開戰仍由 tryStartAftermathCombat 處理。
 */
export function tickGrudgeBook(state: LifeGameState): void {
  if (!state.character.alive) return;
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const book = readBook(c);
  if (!book.length) {
    snapshotRng(state);
    return;
  }
  const next: GrudgeEntry[] = [];

  for (const g of book) {
    const left = g.monthsLeft - 1;
    if (left > 0) {
      next.push({ ...g, monthsLeft: left });
      continue;
    }
    if (g.willFight) {
      if (!c.flags.pending_revenge_foe && !c.flags.pending_blood_foe) {
        c.flags[g.kind === 'blood' ? 'pending_blood_foe' : 'pending_revenge_foe'] = g.name;
      } else {
        // 已有約戰排期，順延數月
        next.push({ ...g, monthsLeft: rng.nextInt(2, 5) });
      }
    } else if (g.kind === 'favor') {
      c.money += 8 + g.strength * 6;
    } else if (g.kind === 'debt') {
      c.reputation = Math.max(0, c.reputation - g.strength);
    }
    // 其餘：舊事淡了，就此了結
  }

  writeBook(c, next);
  snapshotRng(state);
}

export function grudgeKindLabel(kind: GrudgeKind): string {
  if (kind === 'blood') return '血債';
  if (kind === 'mercy') return '舊怨';
  if (kind === 'favor') return '人情';
  if (kind === 'stun') return '未了';
  return '欠債';
}

/** 華山／敘事用：取最強可辨認恩怨名 */
export function topGrudgeNames(state: LifeGameState, n = 2): string[] {
  return listGrudges(state)
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n)
    .map((g) => g.name);
}
