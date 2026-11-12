import { InkModal } from './InkModal';
import { createPortal } from 'react-dom';
import type { OfflineGainInfo } from '../../store/lifeStore';

type Props = {
  gain: OfflineGainInfo;
  onClose: () => void;
};

function awayText(countedMs: number): string {
  const hours = countedMs / 3600000;
  if (hours < 1) return '離開江湖一陣';
  if (hours < 24) return `離開江湖約${Math.round(hours)}小時`;
  return `離開江湖約${Math.round(hours / 24)}日`;
}

/** 閉關所得：重回江湖時嘅離線修為收益彈窗 */
export function InkOfflineGainModal({ gain, onClose }: Props) {
  return createPortal(
    <InkModal className="ink-offline-modal" aria-label="閉關所得" onDismiss={onClose}>
      <div className="ink-offline-modal-backdrop" onClick={onClose} aria-hidden />
      <div className="ink-offline-modal-card">
        <p className="ink-offline-modal-kicker">{awayText(gain.countedMs)}</p>
        <h2 className="ink-offline-modal-title">閉關所得</h2>
        <div className="ink-offline-modal-body">
        <p className="ink-offline-modal-gain">
          修為
          <span className="ink-offline-modal-xp">＋{gain.xp.toLocaleString('zh-Hant')}</span>
        </p>
        {(gain.silver ?? 0) > 0 && (
          <p className="ink-offline-modal-reserve">
            待收成銀兩
            <span className="ink-offline-modal-reserve-num">＋{(gain.silver ?? 0).toLocaleString('zh-Hant')}</span>
          </p>
        )}
        {gain.reserveXp > 0 && (
          <p className="ink-offline-modal-reserve">
            其中入儲備
            <span className="ink-offline-modal-reserve-num">＋{gain.reserveXp.toLocaleString('zh-Hant')}</span>
          </p>
        )}
        {gain.timeCapped && (
          <p className="ink-offline-modal-note">離線收益最多累積48小時，超出部分不計。</p>
        )}
        {gain.tierCapped && (
          <p className="ink-offline-modal-note ink-offline-modal-note--cap">
            {gain.reserveCapped
              ? '修為與儲備均已滿。突破後，儲備修為將轉入新境界。'
              : '修為已達上限，多出部分存入儲備，突破後轉入新境界。'}
          </p>
        )}
        </div>
        <button type="button" className="ink-offline-modal-btn" onClick={onClose} autoFocus>
          領受
        </button>
      </div>
    </InkModal>,
    document.body,
  );
}
