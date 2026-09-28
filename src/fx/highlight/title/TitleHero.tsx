/**
 * 主頁 3D 斗笠劍客（lazy chunk）：宣紙上嘅淡墨環、泥金背光、腳下淡墨投影、3D 劍客、Canvas 墨點粒子；
 * 「開卷」時由 play 訊號觸發過場（蓄勢 → 拔劍一揮 → 墨環爆開 → 紙面化開），完咗叫 onPlayed。
 * 背景（宣紙、遠山、紙紋）由主頁本身畫，呢度只畫主角同光效，所以未載入時主頁照樣完整。
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { TitleDirector } from './titleDirector';
import styles from './title.module.css';

export interface TitleHeroProps {
  /** 由 0 開始；每加 1 播一次過場 */
  play: number;
  onPlayed: () => void;
  /** 第一幀畫好（主頁可以淡走靜態後備圖） */
  onReady?: () => void;
  reduceMotion: boolean;
  /** 示範頁截靜態圖：唔畫背光、墨環 */
  bare?: boolean;
  /** 主頁留畀主角嘅空位（標題同按鈕之間） */
  slotRef?: RefObject<HTMLElement | null>;
}

export default function TitleHero({ play, onPlayed, onReady, reduceMotion, bare, slotRef }: TitleHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const fxBackRef = useRef<HTMLCanvasElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const director = useRef<TitleDirector | null>(null);
  const playedRef = useRef(onPlayed);
  playedRef.current = onPlayed;

  useLayoutEffect(() => {
    const d = new TitleDirector(
      {
        root: rootRef.current!,
        world: worldRef.current!,
        gl: glRef.current!,
        fx: fxRef.current!,
        fxBack: fxBackRef.current!,
        shadow: shadowRef.current!,
        flash: flashRef.current!,
        wash: washRef.current!,
      },
      { reduceMotion, slot: () => slotRef?.current ?? null },
    );
    director.current = d;
    const ro = new ResizeObserver(() => d.resize());
    ro.observe(rootRef.current!);
    if (slotRef?.current) ro.observe(slotRef.current);
    onReady?.();
    return () => {
      ro.disconnect();
      d.dispose();
      director.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!play) return;
    director.current?.play(() => playedRef.current());
  }, [play]);

  // 過場中：撳任何位置或 Esc 即跳過
  useEffect(() => {
    if (!play) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') director.current?.skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play]);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${play ? styles.playing : ''} ${reduceMotion ? styles.reduce : ''}`}
      onPointerDown={play ? () => director.current?.skip() : undefined}
      aria-hidden
    >
      <div ref={worldRef} className={styles.world}>
        {!bare && (
          <>
            <div className={styles.backGlow} />
            <div className={`${styles.halo} ${styles.haloA}`} />
            <div className={`${styles.halo} ${styles.haloB}`} />
          </>
        )}
        {/* 亮紙閃光、墨環喺主角後面：只照亮紙，唔蓋主角 */}
        <div ref={flashRef} className={styles.flash} />
        <canvas ref={fxBackRef} className={styles.fx} />
        <div ref={shadowRef} className={styles.shadow} />
        <canvas ref={glRef} className={styles.gl} />
        <canvas ref={fxRef} className={styles.fx} />
      </div>
      <div ref={washRef} className={styles.wash} />
    </div>
  );
}
