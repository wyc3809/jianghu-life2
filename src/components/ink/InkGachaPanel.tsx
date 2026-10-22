import { Suspense, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import {
  GACHA_COST_PER_PULL,
  GACHA_ART_RATE,
  GACHA_PAGES_PER_PULL,
  GACHA_WISH_PITY,
  MANUAL_MAX_STARS,
  PAGES_PER_DUPLICATE,
  PAGES_PER_EXCHANGE,
  TEST_PAID_JADE_GRANT,
} from '@data/redesign/testParams';
import { VOLUME_COUNT, hasVolumes, volumeLabel } from '@data/skills/volumes';
import { collectionVolumes } from '@core/life/volumes';
import { equippedMartialArts } from '@core/life/martialLoadout';
import { activeSchoolGachaPool, schoolGachaPools } from '@core/life/schoolGachaPools';
import { primarySchoolOfSkill, SCHOOLS, type SchoolId } from '@data/redesign/schools';
import { BANNERS, FREE_POOL, bannerState, spendableJade, wishPool, type BannerId } from '@core/life/gacha';
import { useAncestryStore } from '../../store/ancestryStore';
import { useLifeStore } from '../../store/lifeStore';
import { playInkTap } from '../../audio/inkAudio';
import { CodexStageLazy, type HighlightConfig } from '../../fx/highlight';
import { InkIcon } from './InkIcon';
import { gachaHighlight } from '../../fx/highlight/fromGame';
import { codexCoverUrl } from '../../fx/highlight/codexAppearance';
import { InkSchoolTabs, InkSkillSchools } from './InkSchoolTabs';
import { GachaSheet, InkGachaReveal } from './InkGachaReveal';
import './gachaCodex.css';

type Props = { state: LifeGameState; onEquipRequest: (id: string) => void };

const BANNER_IDS: BannerId[] = ['jianghu', 'zhenben'];
/**
 * 秘笈閣：玉石（免費／付費測試額度分開記帳）、兩個卡池、心願保底、
 * 家族秘笈收藏（升階／轉書頁／學習）、書頁兌換（design/agreed-design-2026-10.md §3.1、§3.2）。
 * 放喺「江湖」分頁；抽卡結果用線裝秘笈啟封（HighlightFx codex），玩法結算沿用現行核心。
 */
export function InkGachaPanel({ state, onEquipRequest }: Props) {
  const meta = useAncestryStore((s) => s.meta);
  const lastPull = useAncestryStore((s) => s.lastPull);
  const lastPullSource = useAncestryStore((s) => s.lastPullSource);
  const gachaPull = useAncestryStore((s) => s.gachaPull);
  const setWish = useAncestryStore((s) => s.setWish);
  const selectPool = useAncestryStore((s) => s.selectSchoolPool);
  const upgrade = useAncestryStore((s) => s.upgradeManual);
  const pulp = useAncestryStore((s) => s.pulpManual);
  const exchange = useAncestryStore((s) => s.exchangePages);
  const grantTest = useAncestryStore((s) => s.grantTestJade);
  const learn = useAncestryStore((s) => s.learnManual);
  const combatBusy = useLifeStore((s) => Boolean(s.state?.pendingCombat || s.combatReplay));
  const [banner, setBanner] = useState<BannerId>('jianghu');
  const [view, setView] = useState<'draw' | 'shelf'>('draw');
  const [swap, setSwap] = useState('');
  const [fx, setFx] = useState<HighlightConfig | null>(null);
  const [sheet, setSheet] = useState<'info' | 'catalog' | 'wish' | 'results' | 'school' | null>(null);
  const pullGate = useRef(false);
  const closeFx = () => { setFx(null); pullGate.current = false; };
  const [shelfSchool, setShelfSchool] = useState<SchoolId | 'all'>('all');

  const jade = meta.jade ?? { free: 0, paidTest: 0 };
  const b = bannerState(structuredClone(meta), banner);
  const pool = activeSchoolGachaPool(meta, banner);
  const school = SCHOOLS.find(school => school.id === pool.school)!;
  const schoolPacks = schoolGachaPools(banner, pool.school);
  const resultPool = lastPullSource ? schoolGachaPools(lastPullSource.banner).find(p => p.id === lastPullSource.poolId) : undefined;
  const canPay = (n: number) => spendableJade(meta, banner) >= GACHA_COST_PER_PULL * n;
  const manuals = meta.manuals ?? {};
  const shelf = useMemo(
    () =>
      Object.entries(manuals).sort(
        (a, b2) => Number(Boolean(getSkillDef(b2[0])?.premium)) - Number(Boolean(getSkillDef(a[0])?.premium)),
      ),
    [manuals],
  );
  const swapOptions = FREE_POOL.filter((id) => !manuals[id]);
  const visibleShelf = shelf.filter(([id]) => shelfSchool === 'all' || primarySchoolOfSkill(getSkillDef(id)) === shelfSchool);
  const known = new Set(state.character.skills);
  const equippedArts = equippedMartialArts(state.character);
  const canEquip = state.phase === 'playing' && state.character.alive && !combatBusy;

  // 結果只導向人物武學頁；玩家指定欄位之後先學習及裝備。
  const equipControl = (id: string, ready = true, className = '') => {
    if (!getSkillDef(id)) return null;
    const equipped = equippedArts.includes(id);
    return <div className={`ink-pull-equip ${className}`}>
      <span className="ink-pull-replaces">{equipped ? '已裝備，可前往調整' : '前往人物頁選擇裝備欄位'}</span>
      <button type="button" className="ink-btn ink-btn--quiet ink-pull-equip-btn"
        disabled={!canEquip || !ready || !manuals[id]}
        aria-label={`馬上裝備：${skillLabel(id)}`} onClick={() => { closeFx(); onEquipRequest(id); playInkTap(); }}>馬上裝備</button>
    </div>;
  };

  const doPull = (n: number) => {
    if (pullGate.current || combatBusy || state.phase !== 'playing' || !state.character.alive) return;
    pullGate.current = true;
    const res = gachaPull(banner, n);
    if (!res) { pullGate.current = false; return; }
    playInkTap();
    const cfg = gachaHighlight(res, skillLabel, id => {
      const def = getSkillDef(id), flow = SCHOOLS.find(s => s.id === primarySchoolOfSkill(def));
      return `${skillKindLabel(def!.kind)} · ${flow?.name ?? ''} · ${def?.flavor ?? ''}`;
    }, useAncestryStore.getState().meta.jade ?? jade);
    if (cfg) setFx(cfg); else pullGate.current = false;
  };

  return (
    <section id="ink-gacha" className={`ink-panel ink-gacha ink-codex-page is-${banner}`} aria-label="秘笈閣">
      <header className="ink-codex-heading">
        <div><small>藏天下武學</small><h3>秘笈閣</h3></div>
        <div className="ink-codex-heading-actions">
          <button type="button" onClick={() => setSheet('info')} aria-label="卡池詳情">池規</button>
          <button type="button" onClick={() => setView(view === 'shelf' ? 'draw' : 'shelf')} aria-pressed={view === 'shelf'}>家族收藏 <b>{shelf.length}</b><small>書頁 {(meta.pages ?? 0).toLocaleString('zh-Hant')}頁</small></button>
        </div>
      </header>
      <div className="ink-codex-wallet" aria-label="玉石餘額">
        <span><InkIcon name="jade" size={18} />免費 <b>{jade.free.toLocaleString('zh-Hant')}</b></span>
        <span><InkIcon name="jade-paid" size={18} />付費測試 <b>{jade.paidTest.toLocaleString('zh-Hant')}</b></span>
        <button type="button" aria-label={`領測試額度＋${TEST_PAID_JADE_GRANT}`} onClick={grantTest}>＋</button>
      </div>
      {view === 'draw' && <>
        <div className="ink-codex-banners" role="tablist" aria-label="卡池">
          {BANNER_IDS.map(id => <button key={id} type="button" role="tab" aria-selected={banner === id} onClick={() => setBanner(id)}>
            <strong>{BANNERS[id].name}</strong><small>{id === 'jianghu' ? '免費玉石可用' : '僅限付費玉石'}</small>
          </button>)}
        </div>
        <div className="ink-codex-volume">
          <button className="ink-codex-school-picker" type="button" aria-label="選擇抽卡流派" onClick={() => setSheet('school')}>{school.name} ⌄</button>
          {schoolPacks.length > 1 ? <select aria-label="選擇流派小冊" value={pool.id} onChange={e => selectPool(banner, e.target.value)}>
            {schoolPacks.map(pack => <option key={pack.id} value={pack.id}>第{pack.part}冊</option>)}
          </select> : <span>第{pool.part}冊</span>}
          <button type="button" onClick={() => setSheet('catalog')}>本冊 {pool.arts.length} 門 ›</button>
        </div>
        <div className="ink-codex-theatre">
          <div className="ink-codex-poem" aria-hidden><span>一卷藏山海</span><span>落墨見真章</span></div>
          {!fx && <Suspense fallback={<img className="ink-codex-static" src={codexCoverUrl(banner === 'zhenben')} alt={banner === 'zhenben' ? '珍本金封秘笈' : '江湖青封秘笈'} />}>
            <CodexStageLazy premium={banner === 'zhenben'} />
          </Suspense>}
          <span className="ink-codex-edition">{banner === 'zhenben' ? '珍本藏卷' : '江湖藏卷'}<small>第{pool.part}冊 · {pool.arts.length}門</small></span>
          <span className="ink-codex-theatre-note">{school.focus}</span>
        </div>
        <button type="button" className={`ink-codex-wish${b.wish ? ' has-wish' : ''}`} onClick={() => setSheet('wish')} aria-label={`心願：${b.wish ? skillLabel(b.wish) : '未選擇'}`}>
          <span className="ink-codex-wish-seal">願</span>
          <span><small>心願武學</small><strong>{b.wish ? skillLabel(b.wish) : '選擇一門心願武學'} ›</strong></span>
          <span className="ink-codex-pity"><b>{b.sinceWish}<small>／{GACHA_WISH_PITY}</small></b><small>{b.wish ? `再抽${Math.max(0, GACHA_WISH_PITY - b.sinceWish)}次必出` : '選定後套用保底'}</small></span>
          <i className="ink-codex-pity-track" style={{ '--pity': `${Math.min(100,b.sinceWish/GACHA_WISH_PITY*100)}%` } as CSSProperties} aria-hidden />
        </button>
        <p className="ink-codex-probability">一般抽取：武功 {GACHA_ART_RATE*100}% · 書頁 {(1-GACHA_ART_RATE)*100}%（{GACHA_PAGES_PER_PULL}頁）</p>
        <div className="ink-codex-pulls">
          {[1,10].map(n => <button key={n} type="button" disabled={!canPay(n) || !!fx || combatBusy} onClick={() => doPull(n)}>
            <span>{n === 1 ? '抽一次' : '抽十次'}</span><small><InkIcon name={banner === 'zhenben' ? 'jade-paid' : 'jade'} size={18} />{GACHA_COST_PER_PULL*n} 玉石</small>
          </button>)}
        </div>
        <p className="ink-codex-fineprint">{banner === 'jianghu' ? '優先使用免費玉石 · 本池不產出珍本' : '使用付費測試玉石 · 測試版不收取真實款項'}</p>
        {lastPull?.length ? <button type="button" className="ink-codex-last" onClick={() => setSheet('results')}>上次抽取 {lastPull.length} 份 · 查看結果 ›</button> : null}
      </>}
        {view === 'shelf' && (
          <>
            <button type="button" className="ink-btn ink-btn--quiet ink-gacha-back" onClick={() => setView('draw')}>
              ← 返去抽秘笈
            </button>
            <p className="ink-gacha-note">
              外功分七卷（一卷＝一招），抽中外功時出一卷；重複卷可以升階（每階效果＋10%，最多 {MANUAL_MAX_STARS} 階）或者轉書頁（每卷 {PAGES_PER_DUPLICATE} 頁）。收藏跨代保留，每代都可以由收藏學返。書頁即秘笈碎片，可由抽取取得，或將重複秘笈手動轉化。
            </p>
            <div className="ink-pages">
              <span>
                書頁 <b>{(meta.pages ?? 0).toLocaleString('zh-Hant')}</b>／{PAGES_PER_EXCHANGE}
              </span>
              <select value={swap} onChange={(e) => setSwap(e.target.value)} aria-label="選擇兌換武學">
                <option value="">選擇一門江湖武學兌換</option>
                {swapOptions.map((id) => (
                  <option key={id} value={id}>
                    {skillLabel(id)}
                  </option>
                ))}
              </select>
              <button type="button" className="ink-btn ink-btn--quiet" disabled={!swap || (meta.pages ?? 0) < PAGES_PER_EXCHANGE} onClick={() => { exchange(swap); setSwap(''); }}>
                兌換
              </button>
            </div>
            <InkSchoolTabs value={shelfSchool} onChange={setShelfSchool} allowAll label="收藏流派分類" />
            {shelf.length === 0 ? (
              <p className="ink-note">尚無收藏，可前往「抽秘笈」獲取武學。</p>
            ) : (
              <ul className="ink-shelf">
                {visibleShelf.map(([id, e]) => {
                  const def = getSkillDef(id);
                  return (
                    <li key={id} className={`ink-shelf-row${def?.premium ? ' is-premium' : ''}`}>
                      <div className="ink-shelf-main">
                        <span className="ink-shelf-name">{skillLabel(id)}</span>
                        <InkSkillSchools id={id} />
                        <span className="ink-shelf-meta">
                          {def ? skillKindLabel(def.kind) : ''}
                          {def?.premium ? ' · 珍本' : ''}
                          {hasVolumes(id) ? ` · ${collectionVolumes(meta, id).length}／${VOLUME_COUNT} 卷` : ''} · {'★'.repeat(e.stars)}
                          {'☆'.repeat(MANUAL_MAX_STARS - e.stars)}
                          {e.copies > 0 ? ` · 重複 ${e.copies} 本` : ''}
                        </span>
                      </div>
                      <div className="ink-shelf-actions">
                        {!known.has(id) && (
                          <button type="button" className="ink-btn ink-btn--primary" onClick={() => learn(id)}>
                            學習
                          </button>
                        )}
                        <button type="button" className="ink-btn ink-btn--quiet" disabled={e.copies < 1 || e.stars >= MANUAL_MAX_STARS} onClick={() => upgrade(id)}>
                          升階
                        </button>
                        <button type="button" className="ink-btn ink-btn--quiet" disabled={e.copies < 1} onClick={() => pulp(id)}>
                          轉書頁
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {shelf.length > 0 && visibleShelf.length === 0 && <p className="ink-note">此流派尚無藏本，可前往對應流派卡池獲取。</p>}
          </>
        )}
      {sheet && <GachaSheet title={sheet === 'info' ? '卡池詳情' : sheet === 'catalog' ? '本冊可得武學' : sheet === 'wish' ? '心願祈福' : sheet === 'school' ? '六派藏卷' : '上次入藏'} onClose={() => setSheet(null)}>
        {sheet === 'info' && <>
          {BANNER_IDS.map(id => <p key={id}><b>{BANNERS[id].name}</b>：{BANNERS[id].blurb}</p>)}
          <p>每抽 {GACHA_COST_PER_PULL} 玉石；設定心願後 {GACHA_WISH_PITY} 抽內必出心願。外功分七卷，抽中外功時出一卷。</p>
          <p>非保底抽取：{GACHA_ART_RATE*100}%武功、{(1-GACHA_ART_RATE)*100}%書頁；每份書頁＋{GACHA_PAGES_PER_PULL}頁，抽中後直接入帳。抽到書頁同樣推進心願保底，第{GACHA_WISH_PITY}抽必出已設定嘅心願。</p>
          <p>書頁即秘笈碎片，累積{PAGES_PER_EXCHANGE}頁可到家族收藏兌換一般江湖武功，不能兌換珍本。十連按十抽依次結算；未觸及心願保底時，唔保證有武功。</p>
          <p>更換流派／小冊保留保底；心願不在新冊時須重新選擇。武學可跨派裝備。</p>
          <p>付費玉石為模擬測試額度，不收取真實款項。</p>
          <button className="ink-btn" type="button" onClick={grantTest}>領測試額度＋{TEST_PAID_JADE_GRANT}</button>
        </>}
        {sheet === 'school' && <><InkSchoolTabs value={pool.school} label="抽卡流派" onChange={id => { if (id !== 'all') { selectPool(banner,schoolGachaPools(banner,id)[0]!.id); setSheet(null); } }} /><p>流派限定本冊抽取範圍，裝備可自由跨派配搭。</p></>}
        {sheet === 'catalog' && <><p>{school.name} · 第{pool.part}冊 · {pool.arts.length}門</p><p>{school.blurb}</p>
          <ul className="ink-codex-catalog">{pool.arts.map(id => <li key={id} data-premium={getSkillDef(id)?.premium ? '1' : undefined}><strong>{skillLabel(id)}</strong><small>{skillKindLabel(getSkillDef(id)!.kind)} · {getSkillDef(id)?.premium ? '珍本' : '江湖'}{primarySchoolOfSkill(getSkillDef(id)) !== pool.school ? ' · 兼修配套' : ''}</small><InkSkillSchools id={id} /></li>)}</ul>
        </>}
        {sheet === 'wish' && <><p>選擇本冊心願；現有保底進度保留。</p><div className="ink-codex-wish-options">{wishPool(banner,meta).map(id => <button key={id} type="button" data-premium={getSkillDef(id)?.premium ? '1' : undefined} aria-pressed={b.wish === id} onClick={() => { setWish(banner,id); setSheet(null); }}><strong>{skillLabel(id)}</strong><small>{skillKindLabel(getSkillDef(id)!.kind)}</small></button>)}</div></>}
        {sheet === 'results' && <>
          <p aria-label="抽取結果來源">上次抽取：{resultPool ? `${SCHOOLS.find(s => s.id === resultPool.school)?.name} · ${BANNERS[resultPool.banner].name} 第${resultPool.part}冊` : '秘笈入藏'}{resultPool && resultPool.id !== pool.id ? '（目前已切換小冊）' : ''}</p>
          <ul className="ink-pull-results" aria-label="抽卡結果">{lastPull?.map((r,i) => r.kind === 'pages'
            ? <li key={`pages-${i}`} className="ink-pull-card" data-reward-kind="pages"><strong className="ink-pull-name">書頁 ×{r.pages}</strong><span>秘笈碎片 · 已入帳{r.pages}頁</span><p>到家族收藏累積{PAGES_PER_EXCHANGE}頁可兌換一般江湖武功。</p></li>
            : <li key={`${r.id}-${i}`} className={`ink-pull-card${r.isPremium ? ' is-premium' : ''}${r.isWish ? ' is-wish' : ''}`} data-reward-kind="art">
              <strong className="ink-pull-name">{r.vol ? volumeLabel(r.id,r.vol) : skillLabel(r.id)}</strong><InkSkillSchools id={r.id} /><span>{skillKindLabel(getSkillDef(r.id)!.kind)} · {r.isPremium ? '珍本' : '江湖'} · {r.isNew ? '新得' : '重複'}{r.isWish ? ' · 心願' : ''}</span>{equipControl(r.id)}
            </li>)}</ul>
        </>}
      </GachaSheet>}
      {fx && <InkGachaReveal config={fx} onDone={closeFx} renderAction={(card,ready) => {
        const result = lastPull?.[fx.rewards.findIndex(reward => reward.id === card.id)];
        if (!result) return null;
        if (result.kind === 'pages') return <div className="ink-pull-equip ink-pull-equip--reveal">
          <span className="ink-pull-replaces">書頁已入帳 · {PAGES_PER_EXCHANGE}頁可換一般江湖武功</span>
          <button type="button" className="ink-btn ink-btn--quiet ink-pull-equip-btn" disabled={!ready}
            onClick={() => { closeFx(); setView('shelf'); }}>查看書頁兌換</button>
        </div>;
        return equipControl(result.id,ready,'ink-pull-equip--reveal');
      }} />}
    </section>
  );
}
