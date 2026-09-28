import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import { inkArtUrl } from '../../ui/inkAssets';
import { canUseWebGL } from '../../fx/highlight';
import { TitleHeroLazy } from '../../fx/highlight/title';

type Props = {
  onStart: () => void;
  onContinue: () => void;
  resumeHint?: string;
  onSeedDebug?: () => void;
  onOpenEditor?: () => void;
};

const BRAND = '江湖一生';
/** 冇 WebGL／減少動態時嘅紙面化開秒數（同 3D 過場最後一段一樣） */
const FALLBACK_WASH_MS = 440;

function reduceMotionPref(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.inkMotion === 'reduce') return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 開卷首屏（宣紙水墨版）：霧山宣紙底＋四邊墨暈，中間 3D 斗笠劍客（lazy；載入前／冇 WebGL 用同一角度嘅靜態圖），
 * 題字逐字落墨，直排卷首三句，朱砂筆觸按鈕。
 * 撳「開卷／續寫」：3D 劍客蓄勢 → 拔劍一揮 → 墨環爆開 → 紙面化開，之後先入下一頁；過場中撳任何位置跳過。
 */
export function InkStartScreen({ onStart, onContinue, resumeHint, onSeedDebug, onOpenEditor }: Props) {
  const reduce = useMemo(reduceMotionPref, []);
  const webgl = useMemo(canUseWebGL, []);
  const [heroReady, setHeroReady] = useState(false);
  const [play, setPlay] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const onPlayed = useCallback(() => {
    const go = pending.current;
    pending.current = null;
    go?.();
  }, []);

  const leave = (go: () => void) => {
    if (leaving) return;
    if (reduce) {
      go();
      return;
    }
    setLeaving(true);
    pending.current = go;
    if (webgl && heroReady) {
      setPlay((n) => n + 1);
    } else {
      window.setTimeout(onPlayed, FALLBACK_WASH_MS);
    }
  };

  return (
    <div
      className={`scroll-shell ink-enter ink-start${leaving ? ' is-leaving' : ''}${heroReady ? ' is-hero-ready' : ''}`}
    >
      <div className="ink-start-bg" aria-hidden>
        <img src={inkAiUrl('backdrop-result-mist')} alt="" decoding="async" />
      </div>
      <div className="ink-start-stage" aria-hidden>
        {webgl && (
          <Suspense fallback={null}>
            <TitleHeroLazy
              play={play}
              onPlayed={onPlayed}
              onReady={() => setHeroReady(true)}
              reduceMotion={reduce}
              slotRef={slotRef}
            />
          </Suspense>
        )}
        {!(webgl && heroReady) && <div className="ink-start-wash" />}
      </div>

      <header className="ink-hero">
        <img className="ink-start-seal" src={inkArtUrl('art/seals/seal-sheng.webp')} alt="" aria-hidden decoding="async" />
        <p className="ink-eyebrow">水墨江湖 · 一生一卷</p>
        <h1 className="ink-brand" aria-label={BRAND}>
          {Array.from(BRAND).map((ch, i) => (
            <span key={i} aria-hidden style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
              {ch}
            </span>
          ))}
        </h1>
        <p className="ink-tagline">一筆成江湖，留白即命運</p>
      </header>


      {/* 主角空位：3D 劍客按呢格定位；載入前／冇 WebGL 喺度顯示同角度靜態圖 */}
      <div className="ink-start-slot" ref={slotRef}>
        <img
          className="ink-start-still"
          src={inkArtUrl('art/title/swordsman.webp')}
          alt=""
          aria-hidden
          decoding="async"
          draggable={false}
        />
        <section className="ink-verse ink-start-verse" aria-label="卷首">
          {['千燈一別，歲月如刀', '奇遇路遇，皆在翻頁之間', '落筆為生，蓋印為定'].map((line) => (
            <p key={line} aria-label={line}>
              {/* 直排：逗號改做空一格（逐字 span，唔靠 writing-mode 量高度） */}
              {Array.from(line).map((ch, i) =>
                ch === '，' ? (
                  <i key={i} aria-hidden className="ink-verse-gap" />
                ) : (
                  <span key={i} aria-hidden>
                    {ch}
                  </span>
                ),
              )}
            </p>
          ))}
        </section>
      </div>

      <div className="ink-cta-stack">
        {resumeHint && (
          <button
            type="button"
            className="ink-btn ink-btn--primary ink-btn--scroll"
            onClick={() => {
              leave(onContinue);
            }}
          >
            續寫前緣
            <span className="ink-btn-sub">{resumeHint}</span>
          </button>
        )}
        <button
          type="button"
          className={
            resumeHint ? 'ink-btn ink-btn--ghost ink-btn--scroll' : 'ink-btn ink-btn--primary ink-btn--scroll'
          }
          onClick={() => {
            leave(onStart);
          }}
        >
          {resumeHint ? '開卷新篇' : '開卷'}
        </button>
        {/* 開發工具：事件一覽／編輯器／定種子只喺開發版顯示 */}
        {import.meta.env.DEV && (
          <a className="ink-btn ink-btn--quiet" href={`${import.meta.env.BASE_URL}events.html`}>
            事件一覽 · 可分享下載
          </a>
        )}
        {import.meta.env.DEV && onOpenEditor && (
          <button
            type="button"
            className="ink-btn ink-btn--quiet"
            onClick={() => {
              onOpenEditor();
            }}
          >
            手機改內容 · 事件／裝備／結果
          </button>
        )}
        {import.meta.env.DEV && onSeedDebug && (
          <button
            type="button"
            className="ink-btn ink-btn--quiet"
            onClick={() => {
              onSeedDebug();
            }}
          >
            定種子 · 除錯
          </button>
        )}
      </div>
    </div>
  );
}

export function InkStartGate({
  onReady,
}: {
  onReady: (hasResume: boolean, hint?: string) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { loadLifeSave } = await import('@core/life/saveIndexedDb');
      const save = await loadLifeSave();
      if (cancelled) return;
      if (save?.state.character.alive && save.state.phase === 'playing') {
        const c = save.state.character;
        onReady(true, `${c.name} · ${c.age} 歲`);
      } else if (save?.state.phase === 'summary') {
        onReady(true, '前緣已盡 · 可掩卷或新開');
      } else {
        onReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return null;
}
