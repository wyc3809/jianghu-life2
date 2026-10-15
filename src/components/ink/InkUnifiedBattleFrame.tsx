/** 第26項：第二張參考嘅全屏戰鬥排版，俾演武台引擎放入同一個畫面。 */
import { useEffect, useRef, type ReactNode } from 'react';
import { InkBrushBar, clampPct } from './InkBrush';
import './unifiedBattle.css';

export interface BattleVitals {
  name: string;
  hp: number;
  maxHp: number;
}

type Props = {
  title: string;
  round: number;
  fast: boolean;
  onSpeed: () => void;
  onSkip: () => void;
  hero: BattleVitals;
  foe: BattleVitals;
  boss?: boolean;
  scene: ReactNode;
  callout?: ReactNode;
  skills?: ReactNode;
  notice?: ReactNode;
  entrance?: ReactNode;
  entering?: boolean;
  trait?: ReactNode;
};

function HealthRow({ vitals, enemy, boss }: { vitals: BattleVitals; enemy?: boolean; boss?: boolean }) {
  const current = Math.max(0, Math.round(vitals.hp));
  const max = Math.max(1, Math.round(vitals.maxHp));
  return <div className={`ink-unified-hp${enemy ? ' is-enemy' : ''}`} aria-label={`${vitals.name} 氣血 ${current}/${max}`}>
    <b>{boss && <small>首領</small>}{vitals.name}</b>
    <InkBrushBar pct={clampPct(current, max)} tone={enemy ? 'cinnabar' : 'ink'} />
    <span>{current}／{max}</span>
  </div>;
}

/** 相同血條／操作框架；戰鬥數字由呼叫方供應，唔喺UI計傷害。 */
export function InkUnifiedBattleFrame({ title, round, fast, onSpeed, onSkip, hero, foe, boss, scene, callout, skills, notice, entrance, entering = false, trait }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const shell = document.querySelector('.scroll-shell');
    const wasInert = shell?.hasAttribute('inert');
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    shell?.setAttribute('inert', '');
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      if (!wasInert) shell?.removeAttribute('inert');
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <section ref={rootRef} tabIndex={-1} className={`ink-unified-battle${entering ? ' is-entering' : ''}`} role="dialog" aria-modal="true" aria-busy={entering} aria-label={`自動交手：${title}`}>
    <div className="ink-unified-paper">
      <header className="ink-unified-header">
        <div className="ink-unified-controls">
          <span className="ink-unified-round">第 {round} 回合</span>
          <div>
            <button type="button" disabled={entering} className={fast ? 'is-fast' : ''} aria-pressed={fast} onClick={onSpeed}>加速 ×2</button>
            <button type="button" disabled={entering} onClick={onSkip}>跳過 ›</button>
          </div>
        </div>
        <div className="ink-unified-vitals" aria-label="雙方氣血比較">
          <HealthRow vitals={foe} enemy boss={boss} />
          <HealthRow vitals={hero} />
        </div>
        <p className="ink-unified-context">{title}</p>
        {trait && <div className="ink-unified-trait">{trait}</div>}
      </header>
      <div className="ink-unified-scene">
        {scene}
        {callout && <div className="ink-unified-callout" aria-live="polite">{callout}</div>}
        {notice && <div className="ink-unified-notice">{notice}</div>}
      </div>
      <footer className="ink-unified-footer">
        {skills}
      </footer>
    </div>
    {entrance}
  </section>;
}
