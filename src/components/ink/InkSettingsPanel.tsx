import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { APP_VERSION_LABEL } from '../../version';

export type TextScale = 1 | 1.15 | 1.3;

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: 1, label: '標準' },
  { value: 1.15, label: '較大' },
  { value: 1.3, label: '最大' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  textScale: TextScale;
  onTextScale: (scale: TextScale) => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
};

export function InkSettingsPanel({
  open,
  onClose,
  textScale,
  onTextScale,
  audioMuted,
  onToggleAudio,
}: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="ink-modal"
      role="dialog"
      aria-modal="true"
      aria-label="設定"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ink-modal-card ink-settings-card">
        <header className="ink-settings-head">
          <h3>設定</h3>
          <button
            ref={closeRef}
            type="button"
            className="ink-icon-btn"
            onClick={onClose}
            title="關閉"
            aria-label="關閉設定"
          >
            收
          </button>
        </header>

        <section className="ink-settings-block" aria-label="字級">
          <p className="ink-settings-label">字級</p>
          <div className="ink-settings-seg" role="group" aria-label="字級">
            {TEXT_SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ink-settings-seg-btn${textScale === opt.value ? ' is-on' : ''}`}
                aria-pressed={textScale === opt.value}
                onClick={() => onTextScale(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="ink-settings-block" aria-label="音效">
          <p className="ink-settings-label">音效</p>
          <button
            type="button"
            className={`ink-settings-toggle${audioMuted ? '' : ' is-on'}`}
            aria-pressed={!audioMuted}
            onClick={onToggleAudio}
          >
            {audioMuted ? '靜音中 · 點此開聲' : '已開聲 · 點此靜音'}
          </button>
        </section>

        <footer className="ink-settings-foot">
          <p className="ink-settings-version" title={APP_VERSION_LABEL}>
            {APP_VERSION_LABEL}
          </p>
          <p className="ink-settings-note">江湖一生 · Early Access</p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
