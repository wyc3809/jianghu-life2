import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels, natureKeys, natureLabels } from '@interfaces/lifeEngine';
import { ensureNature, dominantNature } from '@core/life/nature';
import { jianghuRank, jianghuRankTier } from '@core/life/jianghuRank';
import { useStillMode } from '../../hooks/useStillMode';
import { stillClassName, barOffset } from './inkStillClass';
import styles from './InkStatsPanel.module.css';

const VITAL_BAR_LEN = 384;
const ATTR_BAR_LEN = 92;
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

  const hpOff = barOffset(VITAL_BAR_LEN, c.health, c.maxHealth);
  const qiOff = barOffset(VITAL_BAR_LEN, c.qi ?? 0, c.maxQi ?? 1);

  const natureOrder: (typeof natureKeys)[number][] = ['xia', 'kuang', 'xie', 'e'];
  const points = (['xia', 'e', 'xie', 'kuang'] as const)
    .map((k) => {
      const v = natureVertex(nature[k], NATURE_AXIS[k]);
      return `${v.x},${v.y}`;
    })
    .join(' ');

  return createPortal(
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.wrap}>
        <div className={styles.scroll}>
          <button type="button" className={styles.close} onClick={onClose}>
            掩卷
          </button>
          <div className={cls(styles.banner, styles.bannerStill)} aria-hidden />
          <span className={`${styles.corner} ${styles.tl} ${still ? styles.cornerStill : ''}`}>
            <svg viewBox="0 0 34 34">
              <path d="M32 2 H 6 V 32" />
            </svg>
          </span>
          <span className={`${styles.corner} ${styles.tr} ${still ? styles.cornerStill : ''}`}>
            <svg viewBox="0 0 34 34">
              <path d="M32 2 H 6 V 32" />
            </svg>
          </span>
          <span className={`${styles.corner} ${styles.bl} ${still ? styles.cornerStill : ''}`}>
            <svg viewBox="0 0 34 34">
              <path d="M32 2 H 6 V 32" />
            </svg>
          </span>
          <span className={`${styles.corner} ${styles.br} ${still ? styles.cornerStill : ''}`}>
            <svg viewBox="0 0 34 34">
              <path d="M32 2 H 6 V 32" />
            </svg>
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
              <svg viewBox="0 0 400 26" preserveAspectRatio="none">
                <path className={styles.rail} d="M8 13 H 392" />
                <path
                  className={`${styles.vitalFill} ${styles.hpFill} ${still ? styles.vitalFillStill : ''}`}
                  style={{ ['--len' as string]: VITAL_BAR_LEN, ['--off' as string]: hpOff }}
                  d="M8 13 H 392"
                />
              </svg>
              <span className={styles.vitalVal}>
                {Math.round(c.health)} / {c.maxHealth}
              </span>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalName}>內力</span>
              <svg viewBox="0 0 400 26" preserveAspectRatio="none">
                <path className={styles.rail} d="M8 13 H 392" />
                <path
                  className={`${styles.vitalFill} ${styles.qiFill} ${still ? styles.vitalFillStill : ''}`}
                  style={{ ['--len' as string]: VITAL_BAR_LEN, ['--off' as string]: qiOff }}
                  d="M8 13 H 392"
                />
              </svg>
              <span className={styles.vitalVal}>
                {Math.round(c.qi ?? 0)} / {c.maxQi ?? 0}
              </span>
            </div>
          </div>

          <div className={cls(styles.attrGrid, styles.attrGridStill)}>
            {wuxiaAttributeKeys.map((k) => {
              const raw = c.attributes[k];
              const off = barOffset(ATTR_BAR_LEN, raw, ATTR_CAP);
              return (
                <div className={styles.attr} key={k}>
                  <div className={styles.attrName}>{wuxiaAttributeLabels[k]}</div>
                  <div className={styles.attrVal}>
                    {raw}
                    <small> / {ATTR_CAP}</small>
                  </div>
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path className={styles.attrRail} d="M4 5 H 96" />
                    <path
                      className={`${styles.attrFill} ${still ? styles.attrFillStill : ''}`}
                      style={{ ['--len' as string]: ATTR_BAR_LEN, ['--off' as string]: off }}
                      d="M4 5 H 96"
                    />
                  </svg>
                </div>
              );
            })}
          </div>

          <div className={cls(styles.nature, styles.natureStill)}>
            <svg viewBox="0 0 150 150" aria-label="心性四象">
              <line className={styles.axis} x1={75} y1={8} x2={75} y2={142} />
              <line className={styles.axis} x1={8} y1={75} x2={142} y2={75} />
              <polygon className={styles.dia} points={points} />
              {(['xia', 'e', 'xie', 'kuang'] as const).map((k) => {
                const v = natureVertex(nature[k], NATURE_AXIS[k]);
                return <circle key={k} className={styles.dot} cx={v.x} cy={v.y} r={3} />;
              })}
              <text className={styles.nlbl} x={75} y={16} textAnchor="middle">
                俠
              </text>
              <text className={styles.nlbl} x={75} y={146} textAnchor="middle">
                邪
              </text>
              <text className={styles.nlbl} x={16} y={79} textAnchor="middle">
                狂
              </text>
              <text className={styles.nlbl} x={134} y={79} textAnchor="middle">
                惡
              </text>
            </svg>
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
