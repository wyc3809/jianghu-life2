import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { jianghuRank, jianghuRankTier } from '@core/life/jianghuRank';
import { useStillMode } from '../../hooks/useStillMode';
import { stillClassName } from './inkStillClass';
import { InkBrushBar, clampPct } from './InkBrush';
import { inkArtUrl } from '../../ui/inkAssets';
import { AppearanceCanvas } from './InkAppearance';
import { appearanceOf } from '@interfaces/appearance';
import styles from './InkStatsPanel.module.css';

type Props = {
  state: LifeGameState;
  onClose: () => void;
};

/**
 * 人物誌卷：山水橫幅、身份及氣血內力。
 * 移植自水墨武俠 UI 套件 index.html #scene-stats，數值全部接返真實 game state。
 * 觸發時機：人物 tab 內按鈕開啟（見 InkPersonPanel.tsx）。
 */
export function InkStatsPanel({ state, onClose }: Props) {
  const still = useStillMode();
  const cls = (base: string, stillCls?: string) => stillClassName(base, stillCls, still);
  const c = state.character;
  const sectName = c.sectId ? (state.sects[c.sectId]?.name ?? '無門無派') : '江湖散人';
  const rankLabel = jianghuRankTier(jianghuRank(state));

  const cornerSrc = inkArtUrl('art/ui/corner-bracket.webp');

  return createPortal(
    <div className={`${styles.root} ink-stats-scroll`}>
      <div className={styles.bg} aria-hidden />
      <button type="button" className={styles.close} onClick={onClose}>
        關閉
      </button>
      <div className={styles.wrap}>
        <div className={styles.scroll}>
          <div className={cls(styles.banner, styles.bannerStill)} aria-hidden>
            <AppearanceCanvas className={`${styles.heroSil} ${still ? styles.heroSilStill : ''}`} appearance={appearanceOf(c)} mode="portrait"/>
          </div>
          <span className={`${styles.corner} ${styles.tl} ${still ? styles.cornerStill : ''}`} aria-hidden>
            <img src={cornerSrc} alt="" draggable={false} />
          </span>
          <span className={`${styles.corner} ${styles.tr} ${still ? styles.cornerStill : ''}`} aria-hidden>
            <img src={cornerSrc} alt="" draggable={false} />
          </span>
          <span className={`${styles.corner} ${styles.bl} ${still ? styles.cornerStill : ''}`} aria-hidden>
            <img src={cornerSrc} alt="" draggable={false} />
          </span>
          <span className={`${styles.corner} ${styles.br} ${still ? styles.cornerStill : ''}`} aria-hidden>
            <img src={cornerSrc} alt="" draggable={false} />
          </span>

          <header className={cls(styles.head, styles.headStill)}>
            <h2>人物誌</h2>
            <span className={styles.miniSeal}>墨</span>
          </header>

          <div className={cls(styles.meta, styles.metaStill)}>
            <span>
              姓名 <b>{c.name}</b>
            </span>
            <span>
              門派 <b>{sectName}</b>
            </span>
            <span>
              聲望 <b>{rankLabel}</b>
            </span>
          </div>

          <div className={cls(styles.vitals, styles.vitalsStill)}>
            <div className={styles.vital}>
              <span className={styles.vitalName}>氣血</span>
              <InkBrushBar
                className={styles.vitalBar}
                pct={clampPct(c.health, c.maxHealth)}
                tone="cinnabar"
                intro={!still}
                delay={0.9}
                duration={1.1}
              />
              <span className={styles.vitalVal}>
                {Math.round(c.health)} / {c.maxHealth}
              </span>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalName}>內力</span>
              <InkBrushBar
                className={styles.vitalBar}
                pct={clampPct(c.qi ?? 0, c.maxQi ?? 1)}
                tone="ink"
                intro={!still}
                delay={1}
                duration={1.1}
              />
              <span className={styles.vitalVal}>
                {Math.round(c.qi ?? 0)} / {c.maxQi ?? 0}
              </span>
            </div>
          </div>

          <footer className={cls(styles.foot, styles.footStill)}>
            <span>江 湖 一 生</span>
            <span>
              {state.year} 年 · {state.month} 月
            </span>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
