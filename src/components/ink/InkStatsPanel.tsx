import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels, natureKeys, natureLabels } from '@interfaces/lifeEngine';
import { ensureNature, dominantNature } from '@core/life/nature';
import { jianghuRank, jianghuRankTier } from '@core/life/jianghuRank';
import { useStillMode } from '../../hooks/useStillMode';
import { stillClassName } from './inkStillClass';
import { InkBrushBar, clampPct } from './InkBrush';
import { inkArtUrl } from '../../ui/inkAssets';
import styles from './InkStatsPanel.module.css';

/** 五維顯示上限（純顯示用標準化，唔影響數值判定） */
const ATTR_CAP = 100;
/** 心性四象圖顯示上限 */
const NATURE_CAP = 100;

const NATURE_AXIS: Record<(typeof natureKeys)[number], { x: number; y: number }> = {
  xia: { x: 75, y: 30 },
  e: { x: 108, y: 75 },
  xie: { x: 75, y: 118 },
  kuang: { x: 44, y: 75 },
};

function natureVertex(value: number, axis: { x: number; y: number }) {
  const t = Math.max(0, Math.min(1, value / NATURE_CAP));
  return { x: 75 + (axis.x - 75) * t, y: 75 + (axis.y - 75) * t };
}

type Props = {
  state: LifeGameState;
  onClose: () => void;
};

/**
 * 人物誌卷：山水橫幅 + 卷軸數值 UI。
 * 移植自水墨武俠 UI 套件 index.html #scene-stats，數值全部接返真實 game state。
 * 觸發時機：人物 tab 內按鈕開啟（見 InkPersonPanel.tsx）。
 */
export function InkStatsPanel({ state, onClose }: Props) {
  const still = useStillMode();
  const cls = (base: string, stillCls?: string) => stillClassName(base, stillCls, still);
  const c = state.character;
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  const sectName = c.sectId ? (state.sects[c.sectId]?.name ?? '無門無派') : '江湖散人';
  const rankLabel = jianghuRankTier(jianghuRank(state));

  const natureOrder: (typeof natureKeys)[number][] = ['xia', 'kuang', 'xie', 'e'];
  /** 四象多邊形：150 格座標 → 百分比，供 CSS clip-path 使用 */
  const toPct = (n: number) => `${((n / 150) * 100).toFixed(2)}%`;
  const vertices = (['xia', 'e', 'xie', 'kuang'] as const).map((k) => natureVertex(nature[k], NATURE_AXIS[k]));
  const polygon = `polygon(${vertices.map((v) => `${toPct(v.x)} ${toPct(v.y)}`).join(', ')})`;

  const cornerSrc = inkArtUrl('art/ui/corner-bracket.webp');

  return createPortal(
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.wrap}>
        <div className={styles.scroll}>
          <button type="button" className={styles.close} onClick={onClose}>
            掩卷
          </button>
          <div className={cls(styles.banner, styles.bannerStill)} aria-hidden />
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
            <span className={styles.headEn}>CHARACTER · SCROLL</span>
            <span className={styles.miniSeal}>墨</span>
          </header>

          <div className={cls(styles.meta, styles.metaStill)}>
            <span>
              姓名 <b>{c.name}</b>
            </span>
            <span>
              年歲 <b>{c.age}</b>
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

          <div className={cls(styles.attrGrid, styles.attrGridStill)}>
            {wuxiaAttributeKeys.map((k) => {
              const raw = c.attributes[k];
              return (
                <div className={styles.attr} key={k}>
                  <div className={styles.attrName}>{wuxiaAttributeLabels[k]}</div>
                  <div className={styles.attrVal}>
                    {raw}
                    <small> / {ATTR_CAP}</small>
                  </div>
                  <InkBrushBar
                    className={styles.attrBar}
                    pct={clampPct(raw, ATTR_CAP)}
                    tone="ink"
                    intro={!still}
                    delay={1.05}
                    duration={0.9}
                  />
                </div>
              );
            })}
          </div>

          <div className={cls(styles.nature, styles.natureStill)}>
            <div
              className={`${styles.chart} ${still ? styles.chartStill : ''}`}
              role="img"
              aria-label={`心性四象：${natureOrder.map((k) => `${natureLabels[k]}${nature[k]}`).join('、')}`}
            >
              {/* 外層深朱＝描邊，內層紙色淡染＝填色（同一多邊形，內層向中心縮 10%）；虛軸疊最上 */}
              <span className={styles.diaEdge} style={{ clipPath: polygon }} aria-hidden />
              <span className={styles.dia} style={{ clipPath: polygon }} aria-hidden />
              <img className={styles.grid} src={inkArtUrl('art/ui/nature-grid.webp')} alt="" draggable={false} />
              {vertices.map((v, i) => (
                <img
                  key={i}
                  className={styles.dot}
                  src={inkArtUrl('art/ui/ink-dot.webp')}
                  alt=""
                  draggable={false}
                  style={{ left: toPct(v.x), top: toPct(v.y) }}
                />
              ))}
              <span className={`${styles.nlbl} ${styles.nTop}`}>俠</span>
              <span className={`${styles.nlbl} ${styles.nBottom}`}>邪</span>
              <span className={`${styles.nlbl} ${styles.nLeft}`}>狂</span>
              <span className={`${styles.nlbl} ${styles.nRight}`}>惡</span>
            </div>
            <p className={styles.natureNote}>
              {natureOrder.map((k) => (
                <span key={k} className={`${styles.tag}${k === dominant ? ` ${styles.tagRed}` : ''}`}>
                  {natureLabels[k]} {nature[k]}
                </span>
              ))}
              <br />
              心性偏「{natureLabels[dominant]}」。
            </p>
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
