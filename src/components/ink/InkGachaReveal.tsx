/** 抽卡高光載入／WebGL失敗時仍可讀完整結果；所有操作只呈現已入帳結果。 */
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HighlightFxLazy, canUseWebGL, type HighlightConfig, type RewardCard } from '../../fx/highlight';

type Props = { config: HighlightConfig; onDone: () => void; renderAction: (card: RewardCard, ready: boolean) => ReactNode };

class FxBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** 原生dialog提供焦點圍欄、Escape及關閉後焦點復原。 */
export function GachaSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!; const previous = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => { el.close(); previous?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className="ink-codex-sheet" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h3>{title}</h3><button type="button" aria-label={`關閉${title}`} onClick={onClose}>收起</button></header>
    <div className="ink-codex-sheet-body">{children}</div>
  </dialog>, document.body);
}

function FallbackReveal({ config, onDone, renderAction }: Props) {
  const [index, setIndex] = useState(0);
  const card = config.rewards[index]!;
  return <GachaSheet title={config.revealTitle} onClose={onDone}>
    <p className="ink-codex-receipt">已入家族收藏 · {config.rewards.length}卷</p>
    <div className="ink-codex-fallback-cards" role="group" aria-label="抽卡結果">
      {config.rewards.map((r, i) => <button key={r.id} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>
        <img src={`${import.meta.env.BASE_URL}ink/art/gacha/codex-cover.webp`} alt="" /><strong>{r.name}</strong><small>{r.identityLabel}</small>
      </button>)}
    </div>
    <section className="ink-codex-result-detail"><h4>{card.name}</h4><p>{card.identityLabel}</p><p>{card.blurb}</p></section>
    {renderAction(card, true)}
    <button className="ink-btn ink-btn--primary" type="button" onClick={onDone}>完成入藏</button>
  </GachaSheet>;
}

export function InkGachaReveal(props: Props) {
  const [simple, setSimple] = useState(!canUseWebGL());
  useEffect(() => {
    // Portal演出已遮滿畫面，暫停背後遊戲嘅繪製及焦點，離場完整復原。
    const root = document.getElementById('root');
    if (!root) return;
    const visibility = root.style.visibility, inert = root.inert;
    root.style.visibility = 'hidden'; root.inert = true;
    return () => { root.style.visibility = visibility; root.inert = inert; };
  }, []);
  const fallback = <FallbackReveal {...props} />;
  // Lazy chunk永遠未到亦可立即看結果；出錯後用同一份已確定結果。
  return simple ? fallback : <FxBoundary fallback={fallback}>
    <Suspense fallback={<GachaSheet title="秘笈已入藏" onClose={props.onDone}>
      <p>正在準備啟封演出</p><button type="button" className="ink-btn" onClick={() => setSimple(true)}>直接查看結果</button>
    </GachaSheet>}>
      <HighlightFxLazy config={props.config} onDone={props.onDone} renderRewardAction={props.renderAction} onUnavailable={() => setSimple(true)} />
    </Suspense>
  </FxBoundary>;
}
