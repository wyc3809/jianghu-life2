#!/usr/bin/env node
/** 掃描事件敘事：空洞模板 + AI 套話禁詞；CI 可用 --fail */
import { readFileSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const fail = process.argv.includes('--fail');

/** 內容檔：禁止新模板與禁詞 */
const contentFiles = [
  'data/events/jianghuExtra100.ts',
  'data/events/ordinary.ts',
  'data/events/practiceWander.ts',
  'data/events/secretArts.ts',
  'data/events/jinyongTropes.ts',
  'data/events/roadEncounters.ts',
  'data/events/bossEncounters.ts',
  'data/events/narrateOverrides.ts',
  'data/events/playabilityPack.ts',
  'core/life/choiceEnrich.ts',
  'core/life/flavor.ts',
  'core/life/arcs.ts',
  'core/life/summary.ts',
  'core/life/eventEngine.ts',
  'core/life/outcomeResolver.ts',
];

/** catalog 允許模板（由 narrateOverrides 覆蓋），只報數 */
const catalogFile = 'data/events/catalog.ts';

const templateRe = /就「.+?」一事，你選擇「.+?」|這段經過像一頁墨跡/g;
const banRe =
  /局面鬆動|有得有失|立誓下回|像棋盤上多落了一子|命運的齒輪|機緣悄然降臨|機緣這回事，強求不得|有些機緣，不强求也罷|丟了機緣|這一課開了竅|琴棋書畫與武學一理|要用真功夫說話|開啟新的篇章|踏上新的征途|在這個關鍵時刻|不虛此行|一切才剛剛開始|故事才剛開始|命運眷顧|命運弄人|江湖路遠，且行且珍惜|江湖路遠，兩人近了一步|這一選擇改變了你的人生軌跡|活著，才有下一頁|熱鬧也是修行|運氣這東西，最會騙人|情絲悄然繫上|這一刻，只剩呼吸與步法|心性與根骨似被撥動|隱士之緣，強求不得/g;

let templateHits = 0;
let banHits = 0;
let hardFail = 0;

function scan(f, { allowTemplates = false } = {}) {
  let text = '';
  try {
    text = readFileSync(join(root, f), 'utf8');
  } catch {
    console.log(`${f}: (missing, skip)`);
    return;
  }
  const templates = text.match(templateRe) ?? [];
  const bans = text.match(banRe) ?? [];
  templateHits += templates.length;
  banHits += bans.length;
  if (allowTemplates) {
    // catalog 舊模板由 overrides／scrub 處理；禁詞只報數，唔作 hard-fail
  } else if (templates.length || bans.length) {
    hardFail += templates.length + bans.length;
  }
  console.log(
    `${f}: templates=${templates.length}${allowTemplates ? ' (allowed)' : ''} bans=${bans.length}${allowTemplates && bans.length ? ' (catalog report-only)' : ''}`,
  );
}

scan(catalogFile, { allowTemplates: true });
for (const f of contentFiles) scan(f);

console.log(`total templates: ${templateHits}`);
console.log(`total ban-words: ${banHits}`);
console.log(`hard-fail count: ${hardFail}`);

if (fail && hardFail > 0) {
  console.error('auditNarrate: FAIL — non-catalog templates or ban-words present');
  process.exit(1);
}
process.exit(0);