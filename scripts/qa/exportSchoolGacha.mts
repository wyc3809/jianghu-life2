/** 從正式資料輸出可審閱嘅103門流派名單及每冊範圍。 */
import fs from 'node:fs';
import { SKILL_DEFS, getSkillDef, skillKindLabel, skillLabel } from '../../data/skills/catalog';
import { SCHOOLS, schoolsOfSkill, primarySchoolOfSkill } from '../../data/redesign/schools';
import { MARTIAL_SCHOOL_GROUPS } from '../../data/redesign/martialSchools';
import { SCHOOL_GACHA_POOLS } from '../../core/life/schoolGachaPools';
import { MARTIAL_CATALOG_RAW } from '../../data/content/packs';
const names = Object.fromEntries(SCHOOLS.map(s => [s.id, s.name]));
const rows = Object.values(SKILL_DEFS).map(def => ({ id: def.id, name: def.name, kind: def.kind,
  school: primarySchoolOfSkill(def), affinities: schoolsOfSkill(def), premium: !!def.premium }));
const evidence = process.env.QA_EVIDENCE_DIR ?? 'production/qa/evidence/redesign/school-gacha';
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(`${evidence}/catalog.json`, JSON.stringify({ arts: rows, pools: SCHOOL_GACHA_POOLS }, null, 2));
const lines = ['# 現有武學流派對照（第28項A，待玩家睇圖）', '',
 '玩家已選A流派定向小卡池，並要求現有武學分流派。共103門真正武學：84門江湖、19門珍本；舊資料另有10筆名稱對照，唔重複當新武學。', '',
 '每門一個主流派，原有兼修適性保留。分類唔等於門派，仍可自由混搭；篩選按主流派，卡池會清楚列出兼修配套。', '',
 '天刀開山、羅漢拳以前冇分類，現分別歸摧鋒破陣、不動金剛，亦納入原本同派主修協同計數；加成數值、招式威力、耗內、主角氣血冇改。每冊6–8門係可調試作容量，未升版本／未上線。', '',
 '每抽60玉石、40抽心願保底、非心願珍本判定6%沿用；江湖冊唔出珍本，付費珍本冊出本派珍本或列明嘅江湖配套。換流派／小冊不清保底抽數，舊心願若不在新冊需重選；舊存檔第一次按舊心願選返相容冊。', '',
 'A方案收窄咗出貨名單，每門實際中選率會因本冊門數而提高；唔係所有單門概率不變。保留嘅係價格、保底、原有額外心願判定及非心願珍本判定；冇改成混合材料池。', ''];
for (const school of SCHOOLS) {
 const ids = MARTIAL_SCHOOL_GROUPS[school.id];
 lines.push(`## ${school.name}（${ids.length}門）`, '', school.blurb, '', '| 武學 | 類型 | 取得類別 | 兼修適性 | ID |', '|---|---|---|---|---|');
 for (const id of ids) { const def = getSkillDef(id)!; const other = schoolsOfSkill(def).filter(s => s !== school.id).map(s => names[s]);
 lines.push(`| ${def.name} | ${skillKindLabel(def.kind)} | ${def.premium ? '珍本／奇遇' : '江湖免費途徑'} | ${other.join('、') || '—'} | ${id} |`); }
 lines.push('');
 for (const pool of SCHOOL_GACHA_POOLS.filter(p => p.school === school.id)) {
  const list = pool.arts.map(id => `${skillLabel(id)}${getSkillDef(id)?.premium ? '〔珍本〕' : ''}${primarySchoolOfSkill(getSkillDef(id)) !== school.id ? '〔兼修配套〕' : ''}`);
  lines.push(`- ${pool.banner === 'jianghu' ? '江湖' : '珍本'}第${pool.part}冊（${pool.arts.length}門）：${list.join('、')}。`);
 }
 lines.push('');
}
lines.push('## 舊名相容', '', '以下10筆仍跟正式武學分同一流派，保留玩家舊記錄，唔要求重抽：', '', '| 舊ID | 對應武學 | 主流派 |', '|---|---|---|');
for (const raw of MARTIAL_CATALOG_RAW.skills as Array<{ id: string; legacyAliasOf?: string }>) {
  if (raw.legacyAliasOf) lines.push(`| ${raw.id} | ${skillLabel(raw.legacyAliasOf)} | ${names[primarySchoolOfSkill(getSkillDef(raw.id))!]} |`);
}
fs.writeFileSync('production/武學流派對照.md', lines.join('\n'));
console.log(JSON.stringify({arts:rows.length,free:rows.filter(r=>!r.premium).length,premium:rows.filter(r=>r.premium).length,packs:SCHOOL_GACHA_POOLS.length,groups:SCHOOLS.map(s=>({school:s.name,count:MARTIAL_SCHOOL_GROUPS[s.id].length}))}));
