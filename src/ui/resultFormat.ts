/**
 * 事件結果排版：將「經過」入面混埋嘅系統訊息（成就、威望、稱號、事件了結）抽出嚟做細籤，
 * 消長行解析成「名＋值＋升跌」細標籤。純函數，方便測試。
 */

export interface ResultNotice {
  /** 籤頭：成就／威望／稱號／了結 */
  label: string;
  /** 籤身（可空） */
  text: string;
}

/** 回傳 null＝呢句系統訊息直接唔顯示 */
const NOTICE_RULES: readonly [RegExp, (m: RegExpMatchArray) => ResultNotice | null][] = [
  [/^【成就】「(.+?)」記入卷首。?$/, (m) => ({ label: '成就', text: m[1]! })],
  [/^江湖威望大增——你已是「(.+?)」。?$/, (m) => ({ label: '威望', text: m[1]! })],
  [/^江湖上開始有人稱你「(.+?)」。?$/, (m) => ({ label: '稱號', text: m[1]! })],
  // 事件了結／待續：對玩家冇意義，唔顯示
  [/^【完滿】$/, () => null],
  [/^【待續】$/, () => null],
];

/** 段落切句：句號／嘆號／問號之後，或者「【」之前 */
function sentences(para: string): string[] {
  return para
    .split(/(?<=[。！？])\s*|\s+(?=【)|(?=【(?:成就|完滿|待續)】)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitFeedback(feedback: string): { story: string[]; notices: ResultNotice[] } {
  const story: string[] = [];
  const notices: ResultNotice[] = [];
  for (const para of feedback.split(/\n\n+/)) {
    const kept: string[] = [];
    for (const s of sentences(para)) {
      const rule = NOTICE_RULES.find(([re]) => re.test(s));
      if (rule) {
        const n = rule[1](s.match(rule[0])!);
        if (n) notices.push(n);
      }
      else kept.push(s);
    }
    if (kept.length) story.push(kept.join(''));
  }
  return { story, notices };
}

/** up＝好（墨綠）、down＝唔好（朱砂） */
export type DeltaTone = 'up' | 'down' | 'flat' | 'note';

export interface DeltaChip {
  label: string;
  value: string;
  tone: DeltaTone;
  /** 括號補充（例如「殺敵所得」） */
  note?: string;
  /** 原文（解析唔到就原樣顯示） */
  raw: string;
}

/** 越多越唔好嘅數值：升＝朱砂、跌＝墨（顏色跟好壞，唔跟方向） */
const BAD_WHEN_UP = /惡|邪|疲勞|傷|毒|仇|懸賞/;

function tone(label: string, up: boolean): DeltaTone {
  const good = BAD_WHEN_UP.test(label) ? !up : up;
  return good ? 'up' : 'down';
}

/** 「銀兩＋12」「名望-1」「俠↓↓」「修為＋2（殺敵所得）」→ 標籤 */
export function parseDelta(line: string): DeltaChip {
  const raw = line.trim();
  const noteMatch = raw.match(/[（(]([^）)]+)[）)]\s*$/);
  const body = noteMatch ? raw.slice(0, noteMatch.index).trim() : raw;
  const note = noteMatch?.[1];
  const num = body.match(/^(.+?)\s*([+＋\-－−])\s*(\d+(?:\.\d+)?)$/);
  if (num) {
    const up = num[2] === '+' || num[2] === '＋';
    return { label: num[1]!, value: `${up ? '+' : '−'}${num[3]}`, tone: tone(num[1]!, up), note, raw };
  }
  const arrows = body.match(/^(.+?)\s*([↑↓]+)$/);
  if (arrows) {
    return { label: arrows[1]!, value: arrows[2]!, tone: tone(arrows[1]!, arrows[2]!.startsWith('↑')), note, raw };
  }
  // 冇數值嘅（例如「獲得裝備：墨雨劍（絕品）」）：整句保留，長句當補充行
  return { label: raw, value: '', tone: raw.length > 6 || raw.includes('：') ? 'note' : 'flat', raw };
}
