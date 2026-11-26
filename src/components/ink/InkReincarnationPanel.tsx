import { useState } from 'react';
import { createPortal } from 'react-dom';
import { REINCARNATION_DAYS, reincarnationStatus } from '@core/life/reincarnation';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { useLifeStore } from '../../store/lifeStore';
import { InkModal } from './InkModal';
import './ink-reincarnation.css';

export function InkReincarnationPanel({ state, onClose }: { state: LifeGameState; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const replaying = useLifeStore(s => Boolean(s.combatReplay));
  const status = reincarnationStatus(state);
  const canProceed = !replaying && (status.canReincarnate || status.canStartAfterEnding);
  const restart = status.canStartAfterEnding;
  const action = restart ? '另開一世' : '轉世';
  const nextBonus = restart ? status.bonus : status.nextBonus;

  function proceed() {
    const store = useLifeStore.getState();
    const success = restart ? store.startAfterEnding() : store.reincarnate();
    if (success) onClose();
    else setConfirm(false);
  }

  return createPortal(
    <InkModal className="ink-modal" aria-label="轉世" onDismiss={onClose}>
      <div className="ink-modal-card ink-reincarnation-card">
        <h2>{confirm ? `確認${action}` : '轉世'}</h2>
        <dl className="ink-reincarnation-progress">
          <div><dt>境界</dt><dd>{status.currentTier}／{status.requiredTier}或以上{status.tierMet && ' · 已達成'}</dd></div>
          <div><dt>本世遊玩日數</dt><dd>{status.days}／{REINCARNATION_DAYS} 日</dd></div>
          <div><dt>已轉世</dt><dd>{status.count} 次</dd></div>
        </dl>
        <p>香港時間每日凌晨四時換日。進入本世遊玩才記一日，日數可分開累積。</p>
        <p>下世根骨、悟性、福緣、魅力及膽識各＋{nextBonus}。</p>
        {restart && <p>本世已結束，可另開一世。已取得的轉世加成會保留。</p>}
        {(status.busy || replaying) && <p>請先結束目前交手。</p>}
        {confirm && <p>新一世將覆寫本機人物存檔。境界、演武、隨身裝備及銀兩會重新開始，帳戶收藏保留。</p>}
        <div className="ink-reincarnation-actions">
          <button type="button" className="ink-btn ink-btn--ghost" autoFocus
            onClick={confirm ? () => setConfirm(false) : onClose}>{confirm ? '返回' : '收起'}</button>
          <button type="button" className="ink-btn ink-btn--primary" disabled={!canProceed}
            onClick={confirm ? proceed : () => setConfirm(true)}>
            {confirm ? `確定${action}` : action}
          </button>
        </div>
      </div>
    </InkModal>,
    document.body,
  );
}
