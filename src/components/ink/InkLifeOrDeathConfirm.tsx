import { createPortal } from 'react-dom';
import type { PendingCombat } from '@interfaces/lifeEngine';
import { sealUrlForText } from '../../ui/inkAssets';

type Props = {
  combat: PendingCombat;
  onConfirm: () => void;
  onDecline: () => void;
};

/**
 * 生死戰確認：明確標示嘅重大生死戰，開打前一定要玩家主動確認風險
 * （design/agreed-design-2026-10.md §2）。普通戰敗只會撤退受傷；呢場輸咗會死。
 */
export function InkLifeOrDeathConfirm({ combat, onConfirm, onDecline }: Props) {
  const seal = sealUrlForText('危');
  return createPortal(
    <div className="ink-modal ink-lod" role="alertdialog" aria-modal="true" aria-labelledby="ink-lod-title">
      <div className="ink-modal-card ink-lod-card">
        {seal && <img className="ink-lod-seal" src={seal} alt="" draggable={false} />}
        <p className="ink-lod-kicker">生死戰</p>
        <h3 id="ink-lod-title" className="ink-lod-title">{combat.title}</h3>
        <p className="ink-lod-foe">對手：{combat.foe.name}</p>
        <ul className="ink-lod-rules">
          <li className="is-danger">此戰輸咗，角色會死，一生就此終結。</li>
          <li>平時嘅戰敗只會撤退受傷；只有呢類標明嘅生死戰先會喪命。</li>
          <li>未出手之前可以退避，唔會受傷，亦唔使打。</li>
        </ul>
        <div className="ink-lod-actions">
          <button type="button" className="ink-lod-btn ink-lod-btn--fight" onClick={onConfirm}>
            明白風險 · 應戰
          </button>
          <button type="button" className="ink-lod-btn" onClick={onDecline} autoFocus>
            暫且退避
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
