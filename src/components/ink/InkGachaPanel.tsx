import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { BANNERS, FREE_POOL, bannerState, spendableJade, wishPool, type BannerId } from '@core/life/gacha';
import { useAncestryStore } from '../../store/ancestryStore';
import { playInkWin, playInkTap } from '../../audio/inkAudio';

type Props = { state: LifeGameState; onClose: () => void };

const BANNER_IDS: BannerId[] = ['jianghu', 'zhenben'];

/**
 * 秘笈閣：玉石（免費／付費測試額度分開記帳）、兩個卡池、心願保底、
 * 家族秘笈收藏（升階／轉書頁／學習）、書頁兌換（design/agreed-design-2026-10.md §3.1、§3.2）。
 */
export function InkGachaPanel({ state, onClose }: Props) {
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
    if (res) {
      if (res.some((r) => r.isWish || r.isPremium)) playInkWin();
      else playInkTap();
    }
  };

  return createPortal(
    <div className="ink-modal" role="dialog" aria-modal="true" aria-label="秘笈閣" onClick={onClose}>
      <div className="ink-modal-card ink-gacha" onClick={(e) => e.stopPropagation()}>
        <header className="ink-gacha-head">
          <h3>秘笈閣</h3>
          <button type="button" className="ink-icon-btn" onClick={onClose} aria-label="關閉">
            收
          </button>
        </header>

        <div className="ink-jade-row">
          <div className="ink-jade">
            <span className="ink-jade-label">免費玉石</span>
            <b>{jade.free.toLocaleString('zh-Hant')}</b>
          </div>
          <div className="ink-jade ink-jade--paid">
            <span className="ink-jade-label">付費玉石 · 測試額度</span>
            <b>{jade.paidTest.toLocaleString('zh-Hant')}</b>
          </div>
          <button type="button" className="ink-jade-grant" onClick={grantTest}>
            領測試額度＋{TEST_PAID_JADE_GRANT.toLocaleString('zh-Hant')}
          </button>
        </div>
        <p className="ink-gacha-test-note">測試版：唔收真錢；付費玉石只係模擬額度，同日後正式購買分開記帳。</p>

        <div className="ink-gacha-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'draw'} className={view === 'draw' ? 'is-on' : ''} onClick={() => setView('draw')}>
            抽秘笈
          </button>
          <button type="button" role="tab" aria-selected={view === 'shelf'} className={view === 'shelf' ? 'is-on' : ''} onClick={() => setView('shelf')}>
            家族收藏 {Object.keys(manuals).length}
          </button>
        </div>

        {view === 'draw' && (
          <>
            <div className="ink-banner-tabs">
              {BANNER_IDS.map((id) => (
                <button key={id} type="button" className={`ink-banner-tab${banner === id ? ' is-on' : ''}${id === 'zhenben' ? ' is-premium' : ''}`} onClick={() => setBanner(id)}>
                  <span>{BANNERS[id].name}</span>
                  <small>{BANNERS[id].blurb}</small>
                </button>
              ))}
            </div>

            <label className="ink-wish">
              <span>心願</span>
              <select value={b.wish ?? ''} onChange={(e) => setWish(banner, e.target.value)}>
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
            <div className="ink-pity">
              <span className="ink-pity-bar" style={{ ['--fill' as string]: `${(b.sinceWish / GACHA_WISH_PITY) * 100}%` }} />
              <span className="ink-pity-text">
                {b.wish
                  ? `保底 ${b.sinceWish}／${GACHA_WISH_PITY} · 再抽 ${GACHA_WISH_PITY - b.sinceWish} 次必出心願`
                  : '未揀心願（揀咗先開始計保底）'}
              </span>
            </div>

            <div className="ink-pull-row">
              <button type="button" className="ink-pull" disabled={!canPay(1)} onClick={() => doPull(1)}>
                抽一次<small>{GACHA_COST_PER_PULL} 玉石</small>
              </button>
              <button type="button" className="ink-pull ink-pull--ten" disabled={!canPay(10)} onClick={() => doPull(10)}>
                抽十次<small>{GACHA_COST_PER_PULL * 10} 玉石</small>
              </button>
            </div>
            {banner === 'jianghu' && <p className="ink-gacha-note">先扣免費玉石，唔夠先扣付費；呢個池唔會出珍本奇功。</p>}

            {lastPull && lastPull.length > 0 && (
              <ul className="ink-pull-results" aria-label="抽卡結果">
                {lastPull.map((r, i) => (
                  <li key={`${r.id}-${i}`} className={`ink-pull-card${r.isPremium ? ' is-premium' : ''}${r.isWish ? ' is-wish' : ''}`} style={{ ['--i' as string]: i }}>
                    <span className="ink-pull-name">{skillLabel(r.id)}</span>
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
            <p className="ink-gacha-note">
              重複本可以升階（每階效果＋10%，最多 {MANUAL_MAX_STARS} 階）或者轉書頁（每本 {PAGES_PER_DUPLICATE} 頁）。收藏跨代保留，每代都可以由收藏學返。
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
                          {def?.premium ? ' · 珍本' : ''} · {'★'.repeat(e.stars)}
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
      </div>
    </div>,
    document.body,
  );
}
