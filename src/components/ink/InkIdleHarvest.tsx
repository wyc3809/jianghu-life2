import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { effectiveCultivationRate } from '@core/life/cultivation';
import { idleSilverCap, idleSilverPending, idleSilverPerHour } from '@core/life/idleHarvest';
import { sparSavedStage, sparStageReward } from '@core/life/sparDuel';
import { InkIcon } from './InkIcon';
import './spar-home.css';

/** 演武台內只留入口；詳情沿用真實掛機數值及原有收成指令。 */
export function InkIdleHarvest({ state, onHarvest, busy }: {
  state: LifeGameState; onHarvest: () => void; busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const pending = Math.floor(idleSilverPending(state));
  const cap = idleSilverCap(state);
  const reward = sparStageReward(sparSavedStage(state));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [open]);

  return <>
    <button type="button" className="ink-spar-harvest-entry" aria-label="掛機收成" aria-haspopup="dialog"
      aria-controls={id} aria-expanded={open} onClick={() => setOpen(true)}>
      <InkIcon name="censer" size={36} />
      {pending > 0 && <i className="ink-spar-harvest-dot" aria-label={pending >= cap ? '收成已滿' : '有銀兩可收成'} />}
    </button>
    {createPortal(<dialog ref={dialogRef} id={id} className="ink-idle-dialog" aria-labelledby={`${id}-title`}
      onCancel={event => { event.preventDefault(); setOpen(false); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false);
      }}>
      <header><h2 id={`${id}-title`}>掛機收成</h2>
        <button type="button" className="ink-idle-close" aria-label="關閉掛機收成" onClick={() => setOpen(false)} autoFocus>收起</button>
      </header>
      <dl className="ink-idle-details">
        <div><dt><InkIcon name="censer" size={24} />掛機修為</dt><dd>＋{effectiveCultivationRate(state).toFixed(2)}<small>／秒</small></dd></div>
        <div><dt><InkIcon name="silver" size={24} />掛機銀兩</dt><dd>＋{idleSilverPerHour(state).toFixed(1)}<small>／時</small></dd></div>
        <div><dt><InkIcon name="swords" size={24} />演武每關</dt><dd><span>銀兩＋{reward.silver}</span><span>修為＋{reward.xp}</span></dd></div>
      </dl>
      <div className="ink-idle-pending"><span>待收成銀兩{pending >= cap && <em>已滿</em>}</span>
        <strong>{pending.toLocaleString('zh-Hant')}<small>／{cap.toLocaleString('zh-Hant')}</small></strong>
      </div>
      <p className="ink-idle-note">銀兩按下收成先入袋，最多累積48小時。</p>
      <button type="button" className="ink-idle-collect" disabled={busy || pending < 1}
        onClick={onHarvest} aria-label={`收成銀兩 ${pending}`}>{pending > 0 ? '收成入袋' : '暫無銀兩可收成'}</button>
    </dialog>, document.body)}
  </>;
}
