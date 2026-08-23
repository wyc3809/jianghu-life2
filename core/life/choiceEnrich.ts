import type { EventChoice, EventOutcome, GameEffect, GameEvent } from '@interfaces/lifeEngine';
import { narrateCombat, narratePractice, narrateSocial } from './sceneCopy';

/** 選擇姿態：影響三分支權重（順遂／波折／事與願違） */
export type ChoiceStance = 'aggressive' | 'virtuous' | 'cunning' | 'cautious' | 'neutral';

/** 場景調性：決定風險分支敘事與傷害量級，避免打坐寫成抄件談判 */
export type SceneTone = 'practice' | 'combat' | 'social';

const STANCE_WEIGHTS: Record<ChoiceStance, { fair: number; mixed: number; ill: number }> = {
  // 越衝動，好壞越難預料——背不出「標準答案」
  aggressive: { fair: 34, mixed: 36, ill: 30 },
  virtuous: { fair: 40, mixed: 38, ill: 22 },
  cunning: { fair: 38, mixed: 34, ill: 28 },
  cautious: { fair: 44, mixed: 38, ill: 18 },
  neutral: { fair: 40, mixed: 38, ill: 22 },
};

export function inferChoiceStance(text: string): ChoiceStance {
  const t = text;
  if (/戰|拼|衝|硬闖|拔刀|動手|對決|比武|殺|搶|上台|攀崖|夜探|突襲|破車|應戰|硬/.test(t)) {
    return 'aggressive';
  }
  if (/助|救|義|交還|調停|護送|施捨|代付|保護|勸|收留|溫柔|恭敬|組織|挺身|義務/.test(t)) {
    return 'virtuous';
  }
  if (/暗|偷|騙|賣|撈|佔|訛|私下|趁亂|易服|拆讀|假裝沒|封口|黑譜收下|邪/.test(t)) {
    return 'cunning';
  }
  if (/避|觀望|退去|不介入|離開|繞道|另尋|等待|默默|冷眼|婉拒|保持|抽身|只看|遠觀|改日|歇手|休息/.test(t)) {
    return 'cautious';
  }
  return 'neutral';
}

export function inferSceneTone(base: GameEffect[], choiceText: string, eventTags: string[] = []): SceneTone {
  if (
    eventTags.includes('practice_wander') ||
    base.some((e) => e.type === 'practice') ||
    /運功|打坐|苦練|淬體|鍛造|尋訪|修煉|調息|樁功|藥浴|開爐|靜室/.test(choiceText)
  ) {
    return 'practice';
  }
  if (
    eventTags.includes('combat') ||
    eventTags.includes('boss') ||
    eventTags.includes('road') ||
    /戰|刀|殺|對決|比武|拔刀|動手|應戰|突襲/.test(choiceText)
  ) {
    return 'combat';
  }
  return 'social';
}

function cloneEffects(effects: GameEffect[]): GameEffect[] {
  return structuredClone(effects);
}

function isNumericGain(eff: GameEffect): boolean {
  if (eff.type === 'money' || eff.type === 'health' || eff.type === 'reputation' || eff.type === 'martial') {
    return eff.amount > 0;
  }
  if (eff.type === 'qi' || eff.type === 'maxQi' || eff.type === 'maxHealth') return eff.amount > 0;
  return false;
}

function isNumericLoss(eff: GameEffect): boolean {
  if (eff.type === 'money' || eff.type === 'health' || eff.type === 'reputation' || eff.type === 'martial') {
    return eff.amount < 0;
  }
  return false;
}

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

function stripIrreversible(effects: GameEffect[]): GameEffect[] {
  return effects.filter(
    (e) =>
      e.type !== 'learnSkill' &&
      e.type !== 'joinSect' &&
      e.type !== 'leaveSect' &&
      e.type !== 'die' &&
      e.type !== 'lover' &&
      e.type !== 'grantGear' &&
      e.type !== 'practice',
  );
}

function hasPractice(effects: GameEffect[]): boolean {
  return effects.some((e) => e.type === 'practice');
}

function narrateOnly(effects: GameEffect[]): GameEffect | undefined {
  return effects.find((e) => e.type === 'narrate');
}

function actLabel(choiceText: string): string {
  return choiceText.replace(/[。．！？!?、，,\s]/g, '') || '此舉';
}

/** 修煉／鍛造／尋訪：敘事貼合本業，氣血代價遠低於江湖衝突 */
function practiceFair(act: string, seed: string): GameEffect[] {
  return [{ type: 'narrate', text: narratePractice('fair', act, seed) }];
}

function practiceMixed(act: string, seed: string): GameEffect[] {
  return [{ type: 'qi', amount: -4 }, { type: 'narrate', text: narratePractice('mixed', act, seed) }];
}

function practiceIll(act: string, seed: string): GameEffect[] {
  return [
    { type: 'health', amount: -3 },
    { type: 'qi', amount: -8 },
    { type: 'narrate', text: narratePractice('ill', act, seed) },
  ];
}

function combatFair(act: string, seed: string): GameEffect[] {
  return [{ type: 'health', amount: -2 }, { type: 'narrate', text: narrateCombat('fair', act, seed) }];
}

function combatMixed(act: string, seed: string): GameEffect[] {
  return [
    { type: 'health', amount: -5 },
    { type: 'martial', amount: 1 },
    { type: 'narrate', text: narrateCombat('mixed', act, seed) },
  ];
}

function combatIll(act: string, seed: string): GameEffect[] {
  return [
    { type: 'health', amount: -8 },
    { type: 'money', amount: -4 },
    { type: 'narrate', text: narrateCombat('ill', act, seed) },
  ];
}

function socialFair(stance: ChoiceStance, act: string, seed: string): GameEffect[] {
  if (stance === 'aggressive') return combatFair(act, seed);
  if (stance === 'virtuous') {
    return [{ type: 'money', amount: -2 }, { type: 'narrate', text: narrateSocial('fair', act, seed) }];
  }
  if (stance === 'cunning') {
    return [{ type: 'reputation', amount: -1 }, { type: 'narrate', text: narrateSocial('fair', act, seed) }];
  }
  return [{ type: 'narrate', text: narrateSocial('fair', act, seed) }];
}

function socialMixed(stance: ChoiceStance, act: string, seed: string): GameEffect[] {
  if (stance === 'aggressive') return combatMixed(act, seed);
  if (stance === 'virtuous') {
    return [
      { type: 'money', amount: -5 },
      { type: 'reputation', amount: 1 },
      { type: 'narrate', text: narrateSocial('mixed', act, seed) },
    ];
  }
  if (stance === 'cunning') {
    return [
      { type: 'money', amount: 4 },
      { type: 'reputation', amount: -1 },
      { type: 'narrate', text: narrateSocial('mixed', act, seed) },
    ];
  }
  if (stance === 'cautious') {
    return [{ type: 'attr', delta: { wuXing: 1 } }, { type: 'narrate', text: narrateSocial('mixed', act, seed) }];
  }
  return [{ type: 'money', amount: 2 }, { type: 'narrate', text: narrateSocial('mixed', act, seed) }];
}

function socialIll(stance: ChoiceStance, act: string, seed: string): GameEffect[] {
  if (stance === 'aggressive') return combatIll(act, seed);
  if (stance === 'virtuous') {
    return [
      { type: 'money', amount: -6 },
      { type: 'reputation', amount: 1 },
      { type: 'narrate', text: narrateSocial('ill', act, seed) },
    ];
  }
  if (stance === 'cunning') {
    return [
      { type: 'money', amount: -5 },
      { type: 'reputation', amount: -2 },
      { type: 'attr', delta: { danShi: 1 } },
      { type: 'narrate', text: narrateSocial('ill', act, seed) },
    ];
  }
  if (stance === 'cautious') {
    return [{ type: 'reputation', amount: -1 }, { type: 'narrate', text: narrateSocial('ill', act, seed) }];
  }
  return [
    { type: 'health', amount: -4 },
    { type: 'money', amount: -3 },
    { type: 'narrate', text: narrateSocial('ill', act, seed) },
  ];
}

function fairCost(stance: ChoiceStance, choiceText: string, tone: SceneTone, seed: string): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceFair(act, seed);
  if (tone === 'combat') return combatFair(act, seed);
  return socialFair(stance, act, seed);
}

function mixedExtras(stance: ChoiceStance, choiceText: string, tone: SceneTone, seed: string): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceMixed(act, seed);
  if (tone === 'combat') return combatMixed(act, seed);
  return socialMixed(stance, act, seed);
}

function illExtras(stance: ChoiceStance, choiceText: string, tone: SceneTone, seed: string): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceIll(act, seed);
  if (tone === 'combat') return combatIll(act, seed);
  return socialIll(stance, act, seed);
}

function buildFairEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
  seed: string,
): GameEffect[] {
  const core = scaleEffects(cloneEffects(base), 1);
  const costs = fairCost(stance, choiceText, tone, seed);
  // 已有敘事／修煉效果時，只疊數值代價，唔再硬塞第二段跑題正文
  const skipNarrate = Boolean(narrateOnly(core) || hasPractice(core));
  return [...core, ...costs.filter((e) => e.type !== 'narrate' || !skipNarrate)];
}

function buildMixedEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
  seed: string,
): GameEffect[] {
  // 修煉機緣：保留半成修煉效果，另加貼題小波折，唔改寫成市井衝突
  if (tone === 'practice' && hasPractice(base)) {
    const practice = base.filter((e) => e.type === 'practice');
    const extras = mixedExtras(stance, choiceText, tone, seed);
    return [...practice, ...extras];
  }
  const safe = stripIrreversible(base);
  const gains = scaleEffects(
    safe.filter((e) => e.type === 'narrate' || isNumericGain(e) || e.type === 'nature' || e.type === 'attr' || e.type === 'world'),
    0.55,
  );
  const losses = scaleEffects(safe.filter(isNumericLoss), 1.05);
  return [...gains.filter((e) => e.type !== 'narrate'), ...losses, ...mixedExtras(stance, choiceText, tone, seed)];
}

function buildIllEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
  seed: string,
): GameEffect[] {
  // 修煉事與願違：唔執行本次修煉，只留岔氣代價（貼題）
  if (tone === 'practice' && hasPractice(base)) {
    return illExtras(stance, choiceText, tone, seed);
  }
  const safe = stripIrreversible(base);
  const inverted = safe
    .filter((e) => e.type !== 'narrate')
    .map((eff) => {
      if (
        eff.type === 'money' ||
        eff.type === 'health' ||
        eff.type === 'reputation' ||
        eff.type === 'martial' ||
        eff.type === 'qi'
      ) {
        if (eff.amount > 0) return { ...eff, amount: -Math.max(1, Math.round(eff.amount * 0.45)) };
        if (eff.amount < 0) return { ...eff, amount: Math.round(eff.amount * 1.1) };
      }
      return eff;
    });
  return [...inverted, ...illExtras(stance, choiceText, tone, seed)];
}

/**
 * 為單一選擇生成「順遂／波折／事與願違」三分支。
 * 每分支都按常理含正負取捨；權重依姿態浮動，難以背出唯一正解。
 */
export function enrichChoiceWithRisk(
  choice: EventChoice,
  _negative?: EventChoice['outcomes'][number]['effects'],
  _badChance = 0.18,
  eventTags: string[] = [],
  eventId = '',
): EventChoice {
  const stance = inferChoiceStance(choice.text);
  const weights = STANCE_WEIGHTS[stance];
  const base = choice.outcomes[0]?.effects ?? [{ type: 'narrate' as const, text: '事畢。' }];
  const tone = inferSceneTone(base, choice.text, eventTags);
  // seed 帶埋 eventId：唔同事件即使揀同一句按鈕字，抽到嘅句庫索引都會唔同，
  // 避免大量事件共用同一套按鈕模板時，波折／事與願違文案逐字相同。
  const seed = `${eventId}:${choice.id}`;

  const outcomes: EventOutcome[] = [
    {
      id: `${choice.id}_fair`,
      label: '順遂',
      weight: weights.fair,
      effects: buildFairEffects(base, stance, choice.text, tone, seed),
    },
    {
      id: `${choice.id}_mixed`,
      label: '波折',
      weight: weights.mixed,
      effects: buildMixedEffects(base, stance, choice.text, tone, seed),
    },
    {
      id: `${choice.id}_ill`,
      label: '事與願違',
      weight: weights.ill,
      effects: buildIllEffects(base, stance, choice.text, tone, seed),
    },
  ];

  return { ...choice, outcomes };
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
  const choices = [...event.choices];
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

export function withRiskAndThree(
  event: GameEvent,
  negativeFactory?: (
    choiceId: string,
    choiceText?: string,
    eventTitle?: string,
  ) => EventChoice['outcomes'][number]['effects'],
  badChance = 0.18,
): GameEvent {
  const base = ensureThreeChoices(event);
  const tags = event.tags ?? [];
  return {
    ...base,
    choices: base.choices.map((ch) => {
      // 純填充選項（事件選項不足 3 個時自動補上）冇實質內容，維持單一安全結果，
      // 唔強行套風險分支——否則會借用通用句庫，喺大量事件之間逐字重複。
      if (ch.id.startsWith('fallback_')) return ch;
      const enriched = enrichChoiceWithRisk(ch, undefined, badChance, tags, event.id);
      if (!negativeFactory) return enriched;
      const extra = negativeFactory(ch.id, ch.text, event.title);
      const ill = enriched.outcomes.find((o) => o.id?.endsWith('_ill'));
      if (ill && extra?.length) {
        const tone = inferSceneTone(ch.outcomes[0]?.effects ?? [], ch.text, tags);
        // 修煉事件：negativeFactory 常帶市井打架敘事，改用貼題 ill，只吸收其非敘事數值並壓低
        if (tone === 'practice') {
          const softNums = extra
            .filter((e) => e.type !== 'narrate')
            .map((e) => {
              if (e.type === 'health' && e.amount < 0) {
                return { ...e, amount: Math.max(e.amount, -4) };
              }
              if (e.type === 'money' && e.amount < 0) {
                return { ...e, amount: Math.max(e.amount, -3) };
              }
              return e;
            });
          ill.effects = [
            ...illExtras(inferChoiceStance(ch.text), ch.text, tone, `${event.id}:${ch.id}`),
            ...softNums,
          ];
          return enriched;
        }
        // narrate 唔再由 negativeFactory 提供（文案改由句庫組合生成，避免逐字
        // 重複）；negativeFactory 只用嚟按檔案調較數值代價，敘事一律保留原生成
        const narr = extra.find((e) => e.type === 'narrate');
        const extraNums = extra.filter((e) => e.type !== 'narrate');
        if (extraNums.length || narr) {
          const keepNarr = narr ?? ill.effects.find((e) => e.type === 'narrate');
          ill.effects = [
            ...ill.effects.filter((e) => e.type !== 'narrate'),
            ...(keepNarr ? [keepNarr] : []),
            ...extraNums,
          ];
        }
      }
      return enriched;
    }),
  };
}

/** 結算時微抖數值，進一步避免「同一選擇永遠同一數字」 */
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
