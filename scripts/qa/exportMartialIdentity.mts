/** 真實啟用目錄審核；未製作卡只係方向，唔等於已有動畫。 */
import fs from 'node:fs';
import { SKILL_DEFS } from '../../data/skills/catalog';
import { MARTIAL_CATALOG_RAW } from '../../data/content/packs';
import { MARTIAL_POSES } from '../../src/fx/art/martialPoses';
import directions from '../../design/art/martial-identities/directions.json';
const dir = 'production/qa/evidence/redesign/martial-identities';
const representativePeers: Record<string,string> = {
  art_river_fist:'sl_luohan_fist', sl_luohan_fist:'art_river_fist', pr_mountain_split:'sl_luohan_fist',
  art_stone_palm:'art_cold_palm', art_wind_chase:'art_bridge_step', tm_flying_needle:'wg_embroidery_needle',
  art_rain_sword:'pr_wind_thread', pr_wind_thread:'art_rain_sword', art_thunder_blade:'td_thunder_combo',
  art_spear_cloud:'pr_heaven_spear', art_iron_body:'pr_diamond_body', pr_diamond_body:'art_iron_body',
  qg_broken_bridge:'pr_cloud_step', pr_cloud_step:'qg_broken_bridge', art_weiqi_trap:'th_finger_flick',
};
fs.mkdirSync(dir, { recursive: true });
const anchors = JSON.parse(fs.readFileSync('public/ink/art/martial/anchors.json', 'utf8')) as Record<string, { frameCount: number }>;
const originalIds = new Set(Object.keys(representativePeers));
const cards = Object.values(SKILL_DEFS).map(d => {
  const authored = (directions as Record<string, string[]>)[d.id];
  if (!authored && d.kind === 'external') throw new Error(`未有外功識別卡：${d.id}`);
  const family = authored?.[0] ?? (d.kind === 'internal' ? 'internal' : 'step');
  const action = authored?.[1] ?? `${d.kind === 'internal' ? '兩掌收至丹田，按' : '鬆架側立，按'}「${d.flavor}」製作獨立${d.kind === 'internal' ? '運氣手法' : '步線及重心轉移'}；節奏與逐門關鍵姿勢待細化`;
  const prototype = MARTIAL_POSES.find(p => p.id === d.id);
  const peerFamily = ({ kick:'step', hook:'blade', halberd:'spear', whip:'staff', bow:'dart', mechanism:'needle', flute:'sword', weiqi:'finger' } as Record<string,string>)[family!];
  const sameFamily = (p: typeof d) => ((directions as Record<string, string[]>)[p.id]?.[0] ?? (p.kind === 'internal' ? 'internal' : p.kind === 'qinggong' ? 'step' : null));
  const peer = Object.values(SKILL_DEFS).find(p => p.id !== d.id && sameFamily(p) === family)
    ?? Object.values(SKILL_DEFS).find(p => p.id !== d.id && sameFamily(p) === peerFamily);
  return { id: d.id, name: d.name, kind: d.kind, rarity: d.premium ? '珍本' : '一般',
    source: { flavor: d.flavor, weaponKind: d.weaponKind ?? null, move: d.move, passive: d.passive }, family,
    opening: action.split('，')[0], action: action.split('；')[0], rhythm: action.split('；')[1],
    signature: authored?.[2] ?? `${d.name}嘅描述意象；未完成獨立視覺設計`,
    recovery: prototype ? '按圖集第六至八格收勢，還原起手重心' : '待逐門設計收勢；唔以通用揮擊當完成',
    closestPeer: representativePeers[d.id] ?? peer?.id ?? null, coverage: prototype && anchors[d.id] ? '全目錄獨立素材已接入，待玩家逐門動態確認' : '設計草案／未製作素材',
    directionApproved: originalIds.has(d.id),
    animationId: prototype ? d.id : null,
    assets: prototype ? { atlas: `public/ink/art/martial/${d.id}.webp`, anchors: `public/ink/art/martial/anchors.json#${d.id}`,
      source: 'design/art/martial-identities/source/', contactStatus: '透明輪廓接觸端點候選，待逐門人工校正',
      effects: (d.premium ? ['signature', 'detail', 'finish'] : ['signature']).map(layer => `${d.id}-fx-${layer}.webp`),
      runtime: d.kind === 'external' ? '共用2D引擎原有攻擊事件' : '共用2D引擎真實受擊／落空回應；唔新增攻擊' } : null,
    frameCount: [d.id, ...(prototype?.critRecovery ? [d.id + '-crit', d.id + '-kill'] : prototype?.premium ? [d.id + '-detail'] : [])].reduce((n, id) => n + (anchors[id]?.frameCount ?? 0), 0),
    identityEffects: (d.premium ? ['signature', 'detail', 'finish'] : ['signature']).map(layer => `public/ink/art/martial/${d.id}-fx-${layer}.webp`),
    variants: prototype?.critRecovery ? ['主招', '真實暴擊後專屬收勢', '真實擊倒後專屬收勢'] : prototype ? ['主招'] : [],
    acceptance: '未驗收，唔視為商業完成品' };
});
const aliases = MARTIAL_CATALOG_RAW.skills.filter(d => d.legacyAliasOf).map(d => ({ id: d.id, canonical: d.legacyAliasOf }));
const summary = { canonical: cards.length, external: cards.filter(d => d.kind === 'external').length,
  internal: cards.filter(d => d.kind === 'internal').length, qinggong: cards.filter(d => d.kind === 'qinggong').length,
  common: cards.filter(d => d.rarity === '一般').length, premium: cards.filter(d => d.rarity === '珍本').length,
  prototypes: MARTIAL_POSES.length, directionApproved: originalIds.size, frames: cards.reduce((n, c) => n + c.frameCount, 0), identityEffects: cards.reduce((n, c) => n + c.identityEffects.length, 0), productionAccepted: 0, notProduced: cards.filter(c => !anchors[c.id]).length, aliases: aliases.length };
fs.writeFileSync(`${dir}/catalog-audit.json`, JSON.stringify({ summary, aliases, cards }, null, 2) + '\n');
let md = '# 全武學動畫識別卡及覆蓋審核\n\n由啟用目錄產生；一般／珍本來自正式 `premium`，唔以卷數、熟練或揭曉色代替稀有度。\n\n';
md += `共 ${summary.canonical} 門：外功 ${summary.external}、內功 ${summary.internal}、身法 ${summary.qinggong}；一般 ${summary.common}、珍本 ${summary.premium}。舊名 ${summary.aliases} 個唔重複計。全目錄已接入 ${summary.prototypes} 門、未製作 ${summary.notProduced} 門，共 ${summary.frames} 格及 ${summary.identityEffects} 張專屬效果。玩家已確認首批 ${summary.directionApproved} 門嘅美術方向並授權全量擴展；全目錄成品仍待動態驗收，唔當商業完成認證。\n\n`;
md += '## 舊名\n\n' + aliases.map(d => `- \`${d.id}\` → \`${d.canonical}\``).join('\n') + '\n\n';
md += '## 逐門識別卡\n\n每門有獨立圖集、逐格出圖提示及按真實結果選取嘅收勢；全部共用產品呈現器。近似武學提供隱去標籤同關閉特效影片，等玩家確認辨識度。\n\n';
for (const c of cards) md += `### ${c.name} · ${c.rarity} · \`${c.id}\`\n\n- 類型／持武：${c.kind}／${c.family}；依據：${c.source.flavor}\n- 起手：${c.opening}\n- 主動作：${c.action}\n- 節奏：${c.rhythm}\n- 招牌：${c.signature}\n- 收勢：${c.recovery}\n- 最近似：\`${c.closestPeer}\`；${c.coverage}，${c.frameCount} 格；${c.acceptance}。\n\n`;
fs.writeFileSync('production/武學動畫識別卡.md', md.trimEnd() + '\n');
console.log(JSON.stringify(summary));
