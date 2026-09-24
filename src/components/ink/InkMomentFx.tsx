/**
 * 特效時刻：學新武學／武學升階／稱號晉升／受傷／醫殘嘅全屏儀式。
 * 資料來源：state.moments（core/life/moments.ts 入隊）；播完或撳一下 → onDone（store.ackMoment）。
 * 動畫全由 CSS（styles.css「特效時刻」「部位傷勢」段）；減少動態時靜態顯示、較快收起。
 * 輕傷唔開全屏，只喺頂部落一滴墨＋一行字（唔打斷節奏）；傷殘要撳先收。
 */
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LifeMoment } from '@interfaces/lifeEngine';
import { INJURY_PART_LABEL } from '@data/injuries/tuning';
import { injuryEffectText } from '@core/life/injuryMath';
import { inkArtUrl, sealUrlForText } from '../../ui/inkAssets';
import { heroSilhouetteUrl } from '../../ui/inkSilhouettes';
import { INJURY_ANCHOR } from './InkInjuryCard';
import { shouldReduceInkMotion } from './sceneVariants';

type View = {
  /** 版式：紙卷／墨環／題簽／受傷剪影／頂部小條 */
  variant: 'learn' | 'rank' | 'title' | 'wound' | 'toast';
  kicker: string;
  name: string;
  sub: string | null;
  seal: string;
  /** 自動收起（ms）；null＝要撳先收 */
  lifeMs: number | null;
};

function viewOf(m: LifeMoment): View {
  switch (m.kind) {
    case 'learn':
      return {
        variant: 'learn',
        kicker: '武學入懷',
        name: m.name,
        sub: '秘笈到手，招式初成',
        seal: '武',
        lifeMs: 2900,
      };
    case 'rank':
      return {
        variant: 'rank',
        kicker: '武學精進',
        name: m.name,
        sub: `進至 · ${m.rankName}`,
        seal: '煉',
        lifeMs: 2900,
      };
    case 'title':
      // 低階稱號較短，免得頻密打斷
      return {
        variant: 'title',
        kicker: '江湖有名',
        name: m.label,
        sub: '江湖上開始有人如此稱你',
        seal: '晉',
        lifeMs: m.tier <= 2 ? 2200 : 2900,
      };
    case 'injury': {
      const part = INJURY_PART_LABEL[m.part];
      const effect = injuryEffectText({ part: m.part, tier: m.tier, monthsLeft: null, cause: '' });
      if (m.tier === 'light') {
        return { variant: 'toast', kicker: '輕傷', name: part, sub: effect, seal: '', lifeMs: 1800 };
      }
      if (m.tier === 'heavy') {
        return { variant: 'wound', kicker: '身受重傷', name: `${part}重傷`, sub: effect, seal: '傷', lifeMs: 1800 };
      }
      return {
        variant: 'wound',
        kicker: '落下殘疾',
        name: `${part}傷殘`,
        sub: `永久 · ${effect}`,
        seal: '殘',
        lifeMs: null,
      };
    }
    case 'cure':
      return {
        variant: 'learn',
        kicker: '殘疾轉機',
        name: '筋骨重續',
        sub: `${INJURY_PART_LABEL[m.part]}轉為重傷，仍需調養`,
        seal: '癒',
        lifeMs: 2900,
      };
  }
}

type Props = { moment: LifeMoment; onDone: () => void; sectId?: string | null };

export function InkMomentFx({ moment, onDone, sectId }: Props) {
  const reduce = shouldReduceInkMotion();
  const view = viewOf(moment);
  // 撳一下同自動收起可能同時觸發：只准結束一次，否則會一次過跳走兩個時刻
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);
  useEffect(() => {
    if (view.lifeMs == null) return;
    const t = window.setTimeout(finish, reduce ? Math.min(1600, view.lifeMs) : view.lifeMs);
    return () => window.clearTimeout(t);
  }, [view.lifeMs, finish, reduce]);

  if (view.variant === 'toast') {
    return createPortal(
      <div className="ink-moment-toast" role="status" aria-live="polite">
        <span className="ink-moment-toast__dot" aria-hidden />
        <strong>{view.name}</strong>
        <em>{view.kicker}</em>
        <span>{view.sub}</span>
      </div>,
      document.body,
    );
  }

  const sealUrl = sealUrlForText(view.seal);
  const anchor = moment.kind === 'injury' ? INJURY_ANCHOR[moment.part] : null;
  return createPortal(
    <div
      className={`ink-moment ink-moment--${view.variant}${moment.kind === 'injury' ? ` ink-moment--${moment.tier}` : ''}`}
      role="button"
      tabIndex={0}
      aria-live="polite"
      aria-label={`${view.kicker}：${view.name}${view.sub ? `，${view.sub}` : ''}。點擊繼續`}
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish();
      }}
    >
      <div className="ink-moment__stage" aria-hidden>
        {view.variant === 'rank' && (
          <img className="ink-moment__halo" src={inkArtUrl('art/ui/ink-halo-a.webp')} alt="" draggable={false} />
        )}
        {/* 學武／醫殘：紙卷；稱號：題簽；升階：淨係墨環；受傷：剪影＋傷處濺墨 */}
        {(view.variant === 'learn' || view.variant === 'title') && <span className="ink-moment__paper" />}
        {view.variant === 'wound' && anchor && (
          <span className="ink-moment__wound">
            <img src={heroSilhouetteUrl(sectId)} alt="" draggable={false} />
            <span className="ink-moment__splat" style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }} />
          </span>
        )}
        <p className="ink-moment__kicker">{view.kicker}</p>
        {/* 逐字直排（唔用 writing-mode：部分瀏覽器字型直書度量唔穩） */}
        <p className="ink-moment__name">
          {Array.from(view.name).map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
        {view.sub && (
          <p className="ink-moment__sub">
            {/* 受傷：每項效果一行 */}
            {view.variant === 'wound'
              ? view.sub.split(/\s*[·・]\s*/).map((line) => <span key={line}>{line}</span>)
              : view.sub}
          </p>
        )}
        {sealUrl && <img className="ink-moment__seal" src={sealUrl} alt="" draggable={false} />}
      </div>
      <p className="ink-moment__hint" aria-hidden>
        點擊繼續
      </p>
    </div>,
    document.body,
  );
}
