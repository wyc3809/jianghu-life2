import { createPortal } from 'react-dom';

type Props = {
  lines: string[];
  onClose: () => void;
};

/** 後人接班：開局講清楚承接咗乜（design/agreed-design-2026-10.md §1） */
export function InkSuccessionModal({ lines, onClose }: Props) {
  return createPortal(
    <div className="ink-offline-modal" role="dialog" aria-modal="true" aria-label="家族傳承">
      <div className="ink-offline-modal-backdrop" onClick={onClose} aria-hidden />
      <div className="ink-offline-modal-card ink-succession-card">
        <p className="ink-offline-modal-kicker">家族傳承</p>
        <h2 className="ink-offline-modal-title">承祧</h2>
        <ul className="ink-succession-lines">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <button type="button" className="ink-offline-modal-btn" onClick={onClose} autoFocus>
          承接 · 入江湖
        </button>
      </div>
    </div>,
    document.body,
  );
}
