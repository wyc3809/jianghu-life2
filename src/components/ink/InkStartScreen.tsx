import { useEffect } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';

type Props = {
  onStart: () => void;
  onContinue: () => void;
  onReincarnate: () => void;
  startReady: boolean;
  resumeHint?: string;
  onSeedDebug?: () => void;
  onOpenEditor?: () => void;
};

/** 已確認青綠暖金漫畫晨景作開卷封面；不放人物立繪，標題及操作仍為真正DOM。 */
export function InkStartScreen({ onStart, onContinue, onReincarnate, startReady, resumeHint, onSeedDebug, onOpenEditor }: Props) {
  return (
    <div className="scroll-shell ink-enter ink-start">
      <div className="ink-start-bg" aria-hidden>
        <img src={inkArtUrl('art/theme/town-manhua.webp')} alt="" decoding="async" />
      </div>
      <header className="ink-hero">
        <p className="ink-eyebrow">武俠人生</p>
        <h1 className="ink-brand">江湖一生</h1>
        <span className="ink-start-rule" aria-hidden />
        <p className="ink-tagline">習武、闖蕩、快意江湖</p>
      </header>

      <div className="ink-start-keyart">
        <section className="ink-verse" aria-label="卷首"><p>少年起於千燈鎮</p></section>
      </div>

      <div className="ink-cta-stack">
        {resumeHint && (
          <button
            type="button"
            className="ink-btn ink-btn--primary"
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
            resumeHint ? 'ink-btn ink-btn--ghost' : 'ink-btn ink-btn--primary'
          }
          disabled={!startReady}
          onClick={resumeHint ? onReincarnate : onStart}
        >
          {resumeHint ? '轉世' : '開卷'}
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
        onReady(true, c.name);
      } else if (save?.state.phase === 'summary') {
        onReady(true, '本世已結束 · 查看總結');
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
