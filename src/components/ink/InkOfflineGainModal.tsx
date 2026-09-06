import { createPortal } from 'react-dom';
import type { OfflineGainInfo } from '../../store/lifeStore';

type Props = {
  gain: OfflineGainInfo;
  onClose: () => void;
};

function awayText(countedMs: number): string {
  const hours = countedMs / 3600000;
  if (hours < 1) return '離開江湖一陣';
  if (hours < 24) return `離開江湖約${Math.round(hours)}個時辰`;
  return `離開江湖約${Math.round(hours / 24)}日`;
}

/** 閉關所得：重回江湖時嘅離線修為收益彈窗 */
export function InkOfflineGainModal({ gain, onClose }: Props) {
  return createPortal(
    <div className="ink-offline-modal" role="dialog" aria-modal="true" aria-label="閉關所得">
      <div className="ink-offline-modal-backdrop" onClick={onClose} aria-hidden />
      <div className="ink-offline-modal-card">
        <p className="ink-offline-modal-kicker">{awayText(gain.countedMs)}</p>
        <h2 className="ink-offline-modal-title">閉關所得</h2>
        <p className="ink-offline-modal-gain">
          修為
          <span className="ink-offline-modal-xp">＋{gain.xp.toLocaleString('zh-Hant')}</span>
        </p>
        {gain.timeCapped && (
          <p className="ink-offline-modal-note">離開太耐，超出上限嘅修持已白白流走。</p>
        )}
        {gain.tierCapped && (
          <p className="ink-offline-modal-note ink-offline-modal-note--cap">
            修為已至瓶頂——翻頁衝關，先可以繼續精進。
          </p>
        )}
        <button type="button" className="ink-offline-modal-btn" onClick={onClose} autoFocus>
          領受
        </button>
      </div>
    </div>,
    document.body,
  );
}
