import { Suspense, useMemo, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import {
  GACHA_COST_PER_PULL,
  GACHA_WISH_PITY,
  MANUAL_MAX_STARS,
  PAGES_PER_DUPLICATE,
  PAGES_PER_EXCHANGE,
  TEST_PAID_JADE_GRANT,
} from '@data/redesign/testParams';
import { VOLUME_COUNT, hasVolumes, volumeLabel } from '@data/skills/volumes';
import { collectionVolumes } from '@core/life/volumes';
import { BANNERS, FREE_POOL, bannerState, spendableJade, wishPool, type BannerId } from '@core/life/gacha';
import { useAncestryStore } from '../../store/ancestryStore';
import { playInkWin, playInkTap } from '../../audio/inkAudio';
import { HighlightFxLazy, canUseWebGL, type HighlightConfig } from '../../fx/highlight';
import { InkIcon } from './InkIcon';
import { gachaHighlight } from '../../fx/highlight/fromGame';

type Props = { state: LifeGameState };

const BANNER_IDS: BannerId[] = ['jianghu', 'zhenben'];
/** 掛軸舞台入面嘅未知人影（用演武台剪影，淡墨） */
const STAGE_SILS = ['enemy-nvcike', 'enemy-daoke', 'enemy-toutuo', 'enemy-tiemian'];

/** 直排字：逐字疊（唔用 writing-mode，部分手機字型冇直排字距會疊字） */
function VerticalText({ text }: { text: string }) {
  return (
    <>
      {(text.match(/\d+|./gu) ?? []).map((ch, i) => (
        <span key={i} aria-hidden>
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * 秘笈閣：玉石（免費／付費測試額度分開記帳）、兩個卡池、心願保底、
 * 家族秘笈收藏（升階／轉書頁／學習）、書頁兌換（design/agreed-design-2026-10.md §3.1、§3.2）。
 * 放喺「江湖」分頁；抽卡結果用同每月學武學一樣嘅武學令演出（HighlightFx token）。
 */
export function InkGachaPanel({ state }: Props) {
  const meta = useAncestryStore((s) => s.meta);
  const lastPull = useAncestryStore((s) => s.lastPull);
  const gachaPull = useAncestryStore((s) => s.gachaPull);
  const setWish = useAncestryStore((s) => s.setWish);
  const upgrade = useAncestryStore((s) => s.upgradeManual);
  const pulp = useAncestryStore((s) => s.pulpManual);
  const exchange = useAncestryStore((s) => s.exchangePages);
  const grantTest = useAncestryStore((s) => s.grantTestJade);
  const learn = useAncestryStore((s) => s.learnManual);
  const [banner, setBanner] = useState<BannerId>('jianghu');
  const [view, setView] = useState<'draw' | 'shelf'>('draw');
  const [swap, setSwap] = useState('');
  const [fx, setFx] = useState<HighlightConfig | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const jade = meta.jade ?? { free: 0, paidTest: 0 };
  const b = bannerState(structuredClone(meta), banner);
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
  const known = new Set(state.character.skills);

  const doPull = (n: number) => {
    const res = gachaPull(banner, n);
    if (!res) return;
    const cfg = canUseWebGL()
      ? gachaHighlight(res, skillLabel, (id) => getSkillDef(id)?.flavor, useAncestryStore.getState().meta.jade ?? jade)
      : null;
    if (cfg) setFx(cfg);
    else if (res.some((r) => r.isWish || r.isPremium)) playInkWin();
    else playInkTap();
  };

  return (
    <section id="ink-gacha" className={`ink-panel ink-gacha ink-gacha--stage is-${banner}`} aria-label="秘笈閣">
        {/* 頂欄（參考漢家江湖祈福，直版）：題字｜卡池詳情、家族收藏｜玉石 */}
        <header className="ink-gacha-top">
          <h3 className="ink-gacha-title">秘笈閣</h3>
          <div className="ink-gacha-tools">
            <button type="button" className={`ink-gacha-tool${showInfo ? ' is-on' : ''}`} aria-expanded={showInfo} onClick={() => setShowInfo((v) => !v)}>
              <InkIcon name="scroll" size={30} />
              <span>卡池詳情</span>
            </button>
            <button
              type="button"
              className={`ink-gacha-tool${view === 'shelf' ? ' is-on' : ''}`}
              aria-pressed={view === 'shelf'}
              onClick={() => setView(view === 'shelf' ? 'draw' : 'shelf')}
            >
              <InkIcon name="book" size={30} />
              <span>家族收藏 {Object.keys(manuals).length}</span>
            </button>
          </div>
          <div className="ink-gacha-wallet">
            <span className="ink-gacha-coin" aria-label={`免費玉石 ${jade.free}`}>
              <InkIcon name="jade" size={24} />
              <b>{jade.free.toLocaleString('zh-Hant')}</b>
              <small>免費玉石</small>
            </span>
            <span className="ink-gacha-coin is-paid" aria-label={`付費玉石（測試額度） ${jade.paidTest}`}>
              <InkIcon name="jade-paid" size={24} />
              <b>{jade.paidTest.toLocaleString('zh-Hant')}</b>
              <small>付費 · 測試額度</small>
              <button type="button" className="ink-gacha-plus" onClick={grantTest} title={`領測試額度＋${TEST_PAID_JADE_GRANT.toLocaleString('zh-Hant')}`} aria-label={`領測試額度＋${TEST_PAID_JADE_GRANT.toLocaleString('zh-Hant')}`}>
                ＋
              </button>
            </span>
          </div>
        </header>

        {showInfo && (
          <div className="ink-gacha-info">
            {BANNER_IDS.map((id) => (
              <p key={id}>
                <b>{BANNERS[id].name}</b>：{BANNERS[id].blurb}
              </p>
            ))}
            <p>
              每抽 {GACHA_COST_PER_PULL} 玉石；揀咗心願之後 {GACHA_WISH_PITY} 抽內必出心願。外功分七卷，每抽出一卷。
            </p>
            <p className="ink-gacha-test-note">測試版：唔收真錢；付費玉石只係模擬額度，同日後正式購買分開記帳。</p>
            <button type="button" className="ink-jade-grant" onClick={grantTest}>
              領測試額度＋{TEST_PAID_JADE_GRANT.toLocaleString('zh-Hant')}
            </button>
          </div>
        )}

        {view === 'draw' && (
          <>
            <div className="ink-pool-list" role="tablist" aria-label="卡池">
              {BANNER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={banner === id}
                  className={`ink-pool-card${banner === id ? ' is-on' : ''}${id === 'zhenben' ? ' is-premium' : ''}`}
                  onClick={() => setBanner(id)}
                >
                  <InkIcon name={id === 'zhenben' ? 'jade-paid' : 'scroll'} size={44} />
                  <span className="ink-pool-name">{BANNERS[id].name}</span>
                  <small>{BANNERS[id].blurb}</small>
                </button>
              ))}
            </div>

            <div className="ink-gacha-stage">
              <div className="ink-hang-scrolls" aria-hidden>
                {STAGE_SILS.map((sil, i) => (
                  <div key={sil} className="ink-hang" style={{ ['--i' as string]: i }}>
                    <img src={`${import.meta.env.BASE_URL || '/'}ink/spar/sil/${sil}.webp`} alt="" decoding="async" draggable={false} />
                    <b>？</b>
                  </div>
                ))}
              </div>
              <h4 className="ink-pool-calli" aria-label={BANNERS[banner].name}>
                <VerticalText text={BANNERS[banner].name} />
              </h4>
              <p className="ink-pool-tagline">
                <VerticalText text={BANNERS[banner].blurb.split(' · ')[1] ?? BANNERS[banner].blurb} />
              </p>

              <label className={`ink-wish-card${b.wish ? ' has-wish' : ''}`}>
                <span className="ink-wish-head">心願祈福</span>
                <span className="ink-wish-sil">
                  <img src={`${import.meta.env.BASE_URL || '/'}ink/spar/sil/hero-idle.webp`} alt="" aria-hidden decoding="async" draggable={false} />
                </span>
                <span className="ink-wish-name">{b.wish ? skillLabel(b.wish) : '未選擇'}</span>
                <span className="ink-wish-pity">
                  <span className="ink-pity-bar" style={{ ['--fill' as string]: `${(b.sinceWish / GACHA_WISH_PITY) * 100}%` }} />
                  <span className="ink-pity-text">
                    保底 {b.sinceWish}／{GACHA_WISH_PITY}
                  </span>
                </span>
                <select aria-label="心願" value={b.wish ?? ''} onChange={(e) => setWish(banner, e.target.value)}>
                  <option value="" disabled>
                    揀一門心願武學
                  </option>
                  {wishPool(banner).map((id) => (
                    <option key={id} value={id}>
                      {skillLabel(id)}（{skillKindLabel(getSkillDef(id)!.kind)}）
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="ink-pity-line">
              {b.wish ? (
                <>
                  此池再抽 <em>{GACHA_WISH_PITY - b.sinceWish}</em> 次必出心願
                </>
              ) : (
                '未揀心願（揀咗先開始計保底）'
              )}
            </p>

            <div className="ink-pull-row ink-pull-row--stage">
              <button type="button" className="ink-pull" disabled={!canPay(1)} onClick={() => doPull(1)}>
                <span className="ink-pull-calli">抽一次</span>
                <span className="ink-pull-cost">
                  <InkIcon name={banner === 'zhenben' ? 'jade-paid' : 'jade'} size={20} />
                  {GACHA_COST_PER_PULL}
                </span>
              </button>
              <button type="button" className="ink-pull ink-pull--ten" disabled={!canPay(10)} onClick={() => doPull(10)}>
                <span className="ink-pull-calli">抽十次</span>
                <span className="ink-pull-cost">
                  <InkIcon name={banner === 'zhenben' ? 'jade-paid' : 'jade'} size={20} />
                  {GACHA_COST_PER_PULL * 10}
                </span>
              </button>
            </div>
            {banner === 'jianghu' && <p className="ink-gacha-note">先扣免費玉石，唔夠先扣付費；呢個池唔會出珍本奇功。</p>}

            {lastPull && lastPull.length > 0 && (
              <ul className="ink-pull-results" aria-label="抽卡結果">
                {lastPull.map((r, i) => (
                  <li key={`${r.id}-${i}`} className={`ink-pull-card${r.isPremium ? ' is-premium' : ''}${r.isWish ? ' is-wish' : ''}`} style={{ ['--i' as string]: i }}>
                    <span className="ink-pull-name">{r.vol ? volumeLabel(r.id, r.vol) : skillLabel(r.id)}</span>
                    <span className="ink-pull-kind">{skillKindLabel(getSkillDef(r.id)!.kind)}</span>
                    <span className="ink-pull-tags">
                      {r.isWish && <i className="t-wish">心願</i>}
                      {r.isPremium && <i className="t-premium">珍本</i>}
                      <i className={r.isNew ? 't-new' : 't-dup'}>{r.isNew ? '新' : '重複'}</i>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {view === 'shelf' && (
          <>
            <button type="button" className="ink-btn ink-btn--quiet ink-gacha-back" onClick={() => setView('draw')}>
              ← 返去抽秘笈
            </button>
            <p className="ink-gacha-note">
              外功分七卷（一卷＝一招），每抽出一卷；重複卷可以升階（每階效果＋10%，最多 {MANUAL_MAX_STARS} 階）或者轉書頁（每卷 {PAGES_PER_DUPLICATE} 頁）。收藏跨代保留，每代都可以由收藏學返。
            </p>
            <div className="ink-pages">
              <span>
                書頁 <b>{(meta.pages ?? 0).toLocaleString('zh-Hant')}</b>／{PAGES_PER_EXCHANGE}
              </span>
              <select value={swap} onChange={(e) => setSwap(e.target.value)} aria-label="揀兌換武學">
                <option value="">揀一門江湖武學兌換</option>
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
            {shelf.length === 0 ? (
              <p className="ink-note">收藏仲係空嘅——去「抽秘笈」試吓。</p>
            ) : (
              <ul className="ink-shelf">
                {shelf.map(([id, e]) => {
                  const def = getSkillDef(id);
                  return (
                    <li key={id} className={`ink-shelf-row${def?.premium ? ' is-premium' : ''}`}>
                      <div className="ink-shelf-main">
                        <span className="ink-shelf-name">{skillLabel(id)}</span>
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
                            學
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
          </>
        )}
      {fx && (
        <Suspense fallback={null}>
          <HighlightFxLazy config={fx} onDone={() => setFx(null)} />
        </Suspense>
      )}
    </section>
  );
}
