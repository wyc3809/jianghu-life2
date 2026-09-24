import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BreakthroughResult } from '@core/life/cultivation';
import { useStillMode } from '../../hooks/useStillMode';
import { stillClassName } from './inkStillClass';
import { inkArtUrl, sealUrlForText } from '../../ui/inkAssets';
import styles from './InkBreakthroughModal.module.css';

type Props = {
  result: BreakthroughResult;
  onClose: () => void;
};

/**
 * 修為突破：夜墨底嘅儀式時刻（與 InkMomentFx 同一套語言：墨環、直書大字、落印）。
 * 成功：雙墨環轉開、新境界逐字寫出、「晉」印壓落；失敗：墨環崩散、全畫面一震、「危」印。
 */
export function InkBreakthroughModal({ result, onClose }: Props) {
  const still = useStillMode();
  const cls = (base: string, stillCls?: string) => stillClassName(base, stillCls, still);
  const ok = result.success;
  const bigText = ok ? (result.newTierName ?? result.oldTierName) : '走火入魔';
  const seal = sealUrlForText(ok ? '晉' : '危');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className={`${styles.root} ${ok ? styles.rootSuccess : styles.rootFail}`}
      role="dialog"
      aria-modal="true"
      aria-label={ok ? `突破關口：${result.oldTierName}進至${bigText}` : '走火入魔'}
      onClick={onClose}
    >
      <div className={styles.grain} aria-hidden />
      <div className={`${styles.stage}${ok ? '' : ` ${cls(styles.shake, styles.shakeStill)}`}`}>
        <div className={styles.halos} aria-hidden>
          <img
            className={`${styles.halo} ${styles.haloA}`}
            src={inkArtUrl('art/ui/ink-halo-a.webp')}
            alt=""
            draggable={false}
          />
          <img
            className={`${styles.halo} ${styles.haloB}`}
            src={inkArtUrl('art/ui/ink-halo-b.webp')}
            alt=""
            draggable={false}
          />
        </div>
        <div className={styles.body}>
          <p className={styles.kicker}>{ok ? '打通任督二脈' : '內息逆行'}</p>
          <p className={styles.bigName} aria-hidden>
            {Array.from(bigText).map((ch, i) => (
              <span key={i} style={{ '--i': i } as React.CSSProperties}>
                {ch}
              </span>
            ))}
            {seal && <img className={styles.seal} src={seal} alt="" draggable={false} />}
          </p>
          <div className={styles.tierWrap}>
            <span className={styles.tierOld}>{result.oldTierName}</span>
            {ok && result.newTierName && (
              <>
                <span className={styles.tierArrow} aria-hidden>
                  ──
                </span>
                <span className={styles.tierNew}>{result.newTierName}</span>
              </>
            )}
          </div>
          <ul className={styles.deltas}>
            {ok ? (
              <>
                {typeof result.martialGain === 'number' && <li>武學＋{result.martialGain}</li>}
                <li>氣血上限、內力上限同步提升</li>
              </>
            ) : (
              <>
                {typeof result.hpLoss === 'number' && <li>氣血－{result.hpLoss}</li>}
                {typeof result.qiLoss === 'number' && <li>內力－{result.qiLoss}</li>}
                <li>落下內傷，需再修煉方可重闖此關</li>
              </>
            )}
          </ul>
          <button type="button" className={styles.ack} onClick={onClose}>
            {ok ? '合十 · 繼續前路' : '知曉 · 再圖後計'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
