import { useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import { VOLUME_COUNT, hasVolumes, volumeLabel } from '@data/skills/volumes';
import { MANUAL_MAX_STARS, PAGES_PER_DUPLICATE, PAGES_PER_EXCHANGE, TEST_SILVER_SINKS } from '@data/redesign/testParams';
import { SCHOOLS, primarySchoolOfSkill, type SchoolId } from '@data/redesign/schools';
import { FREE_POOL, manualUpgradeCost, silverPagesLeft } from '@core/life/gacha';
import { collectionVolumes } from '@core/life/volumes';
import { useAncestryStore } from '../../store/ancestryStore';
import { codexCoverUrl } from '../../fx/highlight/codexAppearance';
import { InkIcon } from './InkIcon';
import { InkSchoolTabs, InkSkillSchools } from './InkSchoolTabs';
import { InkMartialDetails } from './InkMartialDetails';
import { GachaSheet } from './InkGachaReveal';
import './martial-screen.css';

/** 家藏先看藏本；兌換、規則及養成分開點入，預覽不扣資源。 */
export function InkGachaCollection({ state, onDraw }: { state: LifeGameState; onDraw: () => void }) {
  const meta = useAncestryStore(s => s.meta);
  const exchange = useAncestryStore(s => s.exchangePages);
  const buySilverPages = useAncestryStore(s => s.buySilverPages);
  const upgrade = useAncestryStore(s => s.upgradeManual);
  const pulp = useAncestryStore(s => s.pulpManual);
  const learn = useAncestryStore(s => s.learnManual);
  const [sheet, setSheet] = useState<'exchange' | 'rules' | 'filter' | 'detail' | null>(null);
  const [school, setSchool] = useState<SchoolId | 'all'>('all');
  const [detail, setDetail] = useState('');
  const [swap, setSwap] = useState('');
  const [volume, setVolume] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [receipt, setReceipt] = useState('');
  const submit = useRef(false);
  const manuals = meta.manuals ?? {};
  const pages = meta.pages ?? 0;
  const shelf = Object.entries(manuals).sort(([a], [b]) => Number(Boolean(getSkillDef(b)?.premium)) - Number(Boolean(getSkillDef(a)?.premium)) || skillLabel(a).localeCompare(skillLabel(b), 'zh-Hant'));
  const visible = shelf.filter(([id]) => school === 'all' || primarySchoolOfSkill(getSkillDef(id)) === school);
  const swapOptions = FREE_POOL.filter(id => hasVolumes(id) ? collectionVolumes(meta, id).length < VOLUME_COUNT : !manuals[id]);
  const missing = Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).filter(v => !collectionVolumes(meta, swap).includes(v));
  const canExchange = swapOptions.includes(swap) && (!hasVolumes(swap) || missing.includes(volume)) && pages >= PAGES_PER_EXCHANGE;
  const silverLeft = silverPagesLeft(meta, Date.now());
  const book = manuals[detail];
  const upgradeCost = manualUpgradeCost(meta, detail);
  const openExchange = () => { setSwap(''); setVolume(0); setChoosing(false); setReceipt(''); submit.current = false; setSheet('exchange'); };
  const confirmExchange = () => {
    if (submit.current || !canExchange) return;
    submit.current = true;
    const label = hasVolumes(swap) ? volumeLabel(swap, volume) : skillLabel(swap);
    exchange(swap, hasVolumes(swap) ? volume : undefined);
    // 核心為唯一結算來源；只有真入藏才顯示收據，不假裝發獎成功。
    if (useAncestryStore.getState().meta !== meta && (hasVolumes(swap) ? collectionVolumes(useAncestryStore.getState().meta, swap).includes(volume) : Boolean(useAncestryStore.getState().meta.manuals?.[swap]))) {
      setReceipt(`${label}已入藏`); setSwap(''); setVolume(0);
    } else { submit.current = false; }
  };
  return <div className="ink-codex-collection">
    <div className="ink-codex-collection-tools">
      <button type="button" onClick={openExchange}><InkIcon name="scroll" size={28}/><span><strong>書頁兌換</strong><small>{pages.toLocaleString('zh-Hant')} 頁 · 每次 {PAGES_PER_EXCHANGE} 頁</small></span><span aria-hidden="true">›</span></button>
      <button type="button" onClick={() => setSheet('rules')}><InkIcon name="fan" size={24}/><span>入藏說明</span></button>
    </div>
    <div className="ink-codex-collection-heading"><strong>家族藏本 <b>{visible.length}</b></strong><button type="button" onClick={() => setSheet('filter')}>流派：{school === 'all' ? '全部' : SCHOOLS.find(s => s.id === school)?.name} ⌄</button></div>
    <div className="ink-codex-collection-list">
      {visible.length ? <ul className="ink-codex-library-grid">{visible.map(([id, entry]) => {
        const def = getSkillDef(id);
        return <li key={id}><button type="button" data-manual-id={id} data-premium={def?.premium ? '1' : '0'} aria-label={`查看藏本${skillLabel(id)}`} onClick={() => { setDetail(id); setSheet('detail'); }}>
          <img src={codexCoverUrl(Boolean(def?.premium))} alt="" width="48" height="72"/><strong>{skillLabel(id)}</strong>
          <span>{def?.premium ? '珍本' : '江湖'} · {def ? skillKindLabel(def.kind) : '武學'}{hasVolumes(id) ? ` · ${collectionVolumes(meta, id).length}／7卷` : ''}</span>
          <small>藏本 {entry.stars}／{MANUAL_MAX_STARS} 階{state.character.skills.includes(id) ? ' · 已學' : ' · 未學'}</small>
        </button></li>;
      })}</ul> : <div className="ink-codex-empty"><InkIcon name="scroll" size={48}/><h4>{shelf.length ? '此流派尚無藏本' : '尚無家族藏本'}</h4><p>抽取所得與書頁兌換的秘笈，均在此保留。</p><button type="button" className="ink-btn" onClick={shelf.length ? () => setSchool('all') : onDraw}>{shelf.length ? '查看全部藏本' : '返回抽取'}</button></div>}
    </div>
    {sheet === 'filter' && <GachaSheet title="收藏流派" onClose={() => setSheet(null)}><InkSchoolTabs value={school} allowAll label="收藏流派分類" onChange={id => { setSchool(id); setSheet(null); }}/></GachaSheet>}
    {sheet === 'rules' && <GachaSheet title="入藏說明" onClose={() => setSheet(null)}>
      <h4>卷次與傳承</h4><p>外功分七卷，一卷為一招。收藏跨代保留，後世可從家藏重新學習。已得卷次與本代已學卷次分開顯示。</p>
      <h4>書頁與重複</h4><p>重複秘笈自動轉為 {PAGES_PER_DUPLICATE} 書頁。書頁為通用兌換材料，與人物頁指定武學的殘譜分開計算。舊存檔保留的重複本，可在藏本詳情轉頁。</p>
      <h4>藏本升階</h4><p>依次消耗100／200／300書頁，每階效果增加10%，最多 {MANUAL_MAX_STARS} 階。實際費用在藏本詳情顯示。</p>
    </GachaSheet>}
    {sheet === 'detail' && book && <GachaSheet title={skillLabel(detail)} onClose={() => setSheet(null)} footer={<div className="ink-codex-manual-actions">
      {!state.character.skills.includes(detail) && <button type="button" className="ink-btn ink-btn--primary" onClick={() => learn(detail)}>學習</button>}
      <button type="button" className="ink-btn" disabled={upgradeCost === null || pages < (upgradeCost ?? Infinity)} onClick={() => upgrade(detail)}>{upgradeCost === null ? '藏本已滿階' : `升階 · ${upgradeCost}頁`}</button>
      <button type="button" className="ink-btn" disabled={book.copies < 1} onClick={() => pulp(detail)}>舊重複本轉頁{book.copies ? ` · ${book.copies}本` : ''}</button>
      <p>現有書頁 {pages.toLocaleString('zh-Hant')} 頁{upgradeCost !== null && pages < upgradeCost ? ` · 尚欠 ${upgradeCost - pages} 頁升階` : ''}</p>
    </div>}><InkSkillSchools id={detail}/><InkMartialDetails character={state.character} collection={meta} id={detail}/></GachaSheet>}
    {sheet === 'exchange' && <GachaSheet title={choosing ? '選擇兌換武學' : '書頁兌換'} onClose={() => setSheet(null)} footer={!choosing && <div className="ink-codex-exchange-confirm">
      <p role="status">{receipt || (!swap ? '先選擇武學，再確認兌換。' : pages < PAGES_PER_EXCHANGE ? `尚欠 ${PAGES_PER_EXCHANGE - pages} 書頁` : `本次使用 ${PAGES_PER_EXCHANGE} 書頁`)}</p>
      <button type="button" className="ink-btn ink-btn--primary" disabled={!canExchange || Boolean(receipt)} onClick={confirmExchange}>確認兌換</button>
    </div>}>
      {choosing ? <><button type="button" className="ink-btn" onClick={() => setChoosing(false)}>返回書頁兌換</button><p>只列尚未集齊的江湖武學，珍本不在兌換範圍。</p><div className="ink-codex-exchange-options">{swapOptions.map(id => <button type="button" key={id} data-exchange-art={id} aria-pressed={swap === id} onClick={() => { setSwap(id); setVolume(Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).find(v => !collectionVolumes(meta, id).includes(v)) ?? 0); setChoosing(false); setReceipt(''); submit.current = false; }}><strong>{skillLabel(id)}</strong><small>{skillKindLabel(getSkillDef(id)!.kind)}{hasVolumes(id) ? ` · 已得 ${collectionVolumes(meta, id).length}／7卷` : ' · 整門兌換'}</small></button>)}</div>{!swapOptions.length && <p>江湖武學已全數入藏。</p>}</> : <>
        <p className="ink-codex-resource">現有書頁 <strong>{pages.toLocaleString('zh-Hant')}</strong> · 每次 {PAGES_PER_EXCHANGE} 頁</p>
        <button type="button" className="ink-codex-exchange-choose" onClick={() => { setChoosing(true); setReceipt(''); }}>選擇兌換武學 <strong>{swap ? skillLabel(swap) : '尚未選擇'} ›</strong></button>
        {hasVolumes(swap) && <div className="ink-codex-exchange-volumes" role="group" aria-label="選擇兌換卷次">{Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).map(v => <button type="button" key={v} disabled={!missing.includes(v)} aria-pressed={volume === v} onClick={() => setVolume(v)}>{volumeLabel(swap, v)}<small>{missing.includes(v) ? volume === v ? '已選擇' : '未得' : '已入藏'}</small></button>)}</div>}
        <p>每次自選一卷未持有的外功；內功及身法按整門兌換。已收錄的卷不會重複扣頁。</p>
        <section className="ink-codex-silver"><h4>銀兩換書頁</h4><p>今世銀兩 {state.character.money.toLocaleString('zh-Hant')} 兩 · 今日餘 {silverLeft} 次</p><button type="button" className="ink-btn" disabled={silverLeft <= 0 || state.character.money < TEST_SILVER_SINKS.pagesSilverCost} onClick={buySilverPages}>{silverLeft <= 0 ? '今日已換完' : `${TEST_SILVER_SINKS.pagesSilverCost}兩換${TEST_SILVER_SINKS.pagesPerExchange}頁`}</button>{silverLeft > 0 && state.character.money < TEST_SILVER_SINKS.pagesSilverCost && <small>尚欠 {TEST_SILVER_SINKS.pagesSilverCost - state.character.money} 兩</small>}</section>
      </>}
    </GachaSheet>}
  </div>;
}
