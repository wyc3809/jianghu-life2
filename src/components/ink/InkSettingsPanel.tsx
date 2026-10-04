import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_VERSION_LABEL } from '../../version';
import { haptic, hapticsSupported, isHapticsEnabled, setHapticsEnabled } from '../../ui/haptics';
import { InkCloudSection } from './InkCloudSection';

type Props = {
  open: boolean;
  onClose: () => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
  onOpenBoard: () => void;
};

export function InkSettingsPanel({
  open,
  onClose,
  audioMuted,
  onToggleAudio,
  onOpenBoard,
}: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);

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

        {hapticsSupported() && (
          <section className="ink-settings-block" aria-label="震動">
            <p className="ink-settings-label">震動</p>
            <button
              type="button"
              className={`ink-settings-toggle${hapticsOn ? ' is-on' : ''}`}
              aria-pressed={hapticsOn}
              onClick={() => {
                const next = !hapticsOn;
                setHapticsEnabled(next);
                setHapticsOn(next);
                if (next) haptic('medium');
              }}
            >
              {hapticsOn ? '震動開 · 點此關閉' : '震動關 · 點此開啟'}
            </button>
          </section>
        )}

        <InkCloudSection onOpenBoard={onOpenBoard} />

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
