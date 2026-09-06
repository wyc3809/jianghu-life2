import type { EventChoice, GameEffect, GameEvent } from '@interfaces/lifeEngine';

/**
 * 選擇結算輔助。
 *
 * 核心玩法轉向（2026-08）：選擇唔再自動派生「順遂／波折／事與願違」三支，
 * 結果一律係事件作者寫定嘅結局——好嘅事件點都係好。
 * 呢個檔案淨返：填充選項、數值微抖兩樣。
 */

function scaleAmount(n: number, factor: number): number {
  if (!n) return 0;
  const scaled = Math.round(n * factor);
  if (scaled === 0) return n > 0 ? 1 : -1;
  return scaled;
}

function scaleEffects(effects: GameEffect[], factor: number): GameEffect[] {
  return effects.map((eff) => {
    if (
      eff.type === 'money' ||
      eff.type === 'health' ||
      eff.type === 'reputation' ||
      eff.type === 'martial' ||
      eff.type === 'qi' ||
      eff.type === 'maxQi' ||
      eff.type === 'maxHealth'
    ) {
      return { ...eff, amount: scaleAmount(eff.amount, factor) };
    }
    if (eff.type === 'nature' || eff.type === 'attr' || eff.type === 'world') {
      const delta: Record<string, number> = {};
      for (const [k, v] of Object.entries(eff.delta ?? {})) {
        if (typeof v === 'number') delta[k] = scaleAmount(v, factor);
      }
      return { ...eff, delta } as GameEffect;
    }
    return eff;
  });
}

/**
 * 填充選項（事件選項不足 3 個時自動補上）嘅安全結果句庫——帶 {title} 佔位，
 * 按事件 id 分散抽選模板之餘，再嵌入事件標題本身，令唔同事件（標題必然不同）
 * 唔會抽出逐字相同嘅句子。
 */
const FALLBACK_LINES = [
  '「{title}」這一事，你沒有深陷其中，只把經過記在心裡。',
  '「{title}」這一樁，你退開半步，任它與你擦身而過。',
  '「{title}」你沒接這個茬，轉身去做別的事。',
  '「{title}」終究不歸你管，你隨它去了。',
  '「{title}」你按下心裡那點好奇，沒有多問。',
  '「{title}」你把這樁事留給有緣人，自己先走。',
  '「{title}」你想了想，還是沒有出手。',
  '「{title}」這一遭，你選擇袖手，圖個清靜。',
  '「{title}」你繞開了這個麻煩，腳步沒停。',
  '「{title}」你把這事記在心底，暫且擱下。',
];

function fallbackHash(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function ensureThreeChoices(event: GameEvent): GameEvent {
  const choices: EventChoice[] = [...event.choices];
  while (choices.length < 3) {
    const idx = choices.length;
    const template =
      FALLBACK_LINES[fallbackHash(`${event.id}:fallback_${idx}`) % FALLBACK_LINES.length]!;
    const line = template.replace(/\{title\}/g, event.title);
    choices.push({
      id: `fallback_${idx}`,
      text: idx === 1 ? '另謀他法' : '抽身離開',
      outcomes: [
        {
          effects: [{ type: 'narrate', text: line }],
        },
      ],
    });
  }
  return { ...event, choices: choices.slice(0, 3) };
}

/**
 * 舊制會幫每個選擇派生「順遂／波折／事與願違」三支；依家只保留作者寫定嘅結局，
 * 手寫多分支事件（比武、BOSS 戰）原樣保留。negativeFactory／badChance 已廢，
 * 留名兼容舊呼叫。
 */
export function withRiskAndThree(
  event: GameEvent,
  _negativeFactory?: (
    choiceId: string,
    choiceText?: string,
    eventTitle?: string,
  ) => EventChoice['outcomes'][number]['effects'],
  _badChance = 0.18,
): GameEvent {
  return ensureThreeChoices(event);
}

/** 結算時微抖數值，令「同一選擇」嘅數字唔會永遠一模一樣（唔會由正轉負） */
export function jitterEffectsForRoll(effects: GameEffect[], roll01: number): GameEffect[] {
  const factor = 0.88 + roll01 * 0.24; // ~0.88–1.12（比舊 0.82–1.18 溫和）
  return scaleEffects(effects, factor).map((eff) => {
    if (eff.type === 'learnSkill' || eff.type === 'joinSect' || eff.type === 'die' || eff.type === 'flag') {
      return eff;
    }
    // 氣血傷害額外封頂，避免微抖把小傷打成致命
    if (eff.type === 'health' && eff.amount < 0) {
      return { ...eff, amount: Math.max(eff.amount, -12) };
    }
    return eff;
  });
}
