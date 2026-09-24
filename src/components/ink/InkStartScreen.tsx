import { useEffect } from 'react';
import { inkAiUrl } from '../../ui/inkAiCatalog';

type Props = {
  onStart: () => void;
  onContinue: () => void;
  resumeHint?: string;
  onSeedDebug?: () => void;
  onOpenEditor?: () => void;
};

/**
 * 開卷首屏：夜嶺風雲滿底 + 古銅印 + 金字品牌 + 金線 + 卷首三句 + CTA。
 * 深色系獨立配色（見 styles.css .ink-start 段），唔影響入面宣紙主題。
 */
export function InkStartScreen({ onStart, onContinue, resumeHint, onSeedDebug, onOpenEditor }: Props) {
  return (
    <div className="scroll-shell ink-enter ink-start">
      <div className="ink-start-bg" aria-hidden>
        <img src={inkAiUrl('backdrop-title-night')} alt="" decoding="async" />
      </div>
      <header className="ink-hero">
        <img
          className="ink-start-seal"
          src={inkAiUrl('seal-bronze-title')}
          alt=""
          aria-hidden
          decoding="async"
        />
        <p className="ink-eyebrow">水墨江湖 · 一生一卷</p>
        <h1 className="ink-brand">江湖一生</h1>
        <span className="ink-gold-rule" aria-hidden />
        <p className="ink-tagline">一筆成江湖，留白即命運</p>
      </header>

      <section className="ink-verse" aria-label="卷首">
        <p>千燈一別，歲月如刀</p>
        <p>奇遇路遇，皆在翻頁之間</p>
        <p>落筆為生，蓋印為定</p>
      </section>

      <div className="ink-cta-stack">
        {resumeHint && (
          <button
            type="button"
            className="ink-btn ink-btn--primary ink-btn--scroll"
            onClick={() => {
              onContinue();
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
            onStart();
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
