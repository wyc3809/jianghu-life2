import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_VERSION_LABEL } from '../../version';
import { haptic, hapticsSupported, isHapticsEnabled, setHapticsEnabled } from '../../ui/haptics';
import { InkCloudSection } from './InkCloudSection';
import { getAudioMix, setAudioMix, playInkTap, type AudioMix } from '../../audio/inkAudio';

type Props = {
  open: boolean;
  onClose: () => void;
  /** 混音設定改咗（遙測用） */
  onAudioChange?: (mix: AudioMix) => void;
  onOpenBoard: () => void;
};

type Channel = 'music' | 'sfx';

/** 一條聲道：名、開關、音量拉桿（0–100） */
function AudioChannelRow({
  label,
  hint,
  on,
  level,
  onToggle,
  onLevel,
}: {
  label: string;
  hint?: string;
  on: boolean;
  level: number;
  onToggle: () => void;
  onLevel: (v: number) => void;
}) {
  return (
    <div className={`ink-audio-row${on ? '' : ' is-off'}`}>
      <div className="ink-audio-row-head">
        <span className="ink-audio-row-label">{label}</span>
        <button
          type="button"
          className={`ink-audio-switch${on ? ' is-on' : ''}`}
          aria-pressed={on}
          aria-label={`${label}${on ? '開' : '關'}`}
          onClick={onToggle}
        >
          {on ? '開' : '關'}
        </button>
      </div>
      <div className="ink-audio-row-slider">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={level}
          disabled={!on}
          aria-label={`${label}音量`}
          onChange={(e) => onLevel(Number(e.target.value))}
          style={{ ['--vol' as string]: `${level}%` }}
        />
        <span className="ink-audio-row-num">{level}</span>
      </div>
      {hint && <p className="ink-audio-row-hint">{hint}</p>}
    </div>
  );
}

export function InkSettingsPanel({
  open,
  onClose,
  onAudioChange,
  onOpenBoard,
}: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [mix, setMix] = useState<AudioMix>(getAudioMix);
  const update = (patch: Partial<AudioMix>, ch: Channel) => {
    const next = setAudioMix(patch);
    setMix(next);
    onAudioChange?.(next);
    if (ch === 'sfx') playInkTap();
  };

  useEffect(() => {
    if (!open) return;
    const dialog=dialogRef.current!;
    const previous=document.activeElement as HTMLElement|null;
    dialog.showModal();
    closeRef.current?.focus();
    return () => { dialog.close(); previous?.focus({preventScroll:true}); };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="ink-modal ink-settings-dialog"
      aria-modal="true"
      aria-label="設定"
      onCancel={event => { event.preventDefault(); onClose(); }}
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
            <img src={`${import.meta.env.BASE_URL}ink/art/parchment-ui/icon-close.webp`} alt="" width="22" height="22" />收起
          </button>
        </header>

        <section className="ink-settings-block" aria-label="聲音">
          <p className="ink-settings-label">聲音</p>
          <AudioChannelRow
            label="音樂"
            hint="目前尚未提供配樂，可預先設定音量。"
            on={mix.musicOn}
            level={mix.musicLevel}
            onToggle={() => update({ musicOn: !mix.musicOn }, 'music')}
            onLevel={(v) => update({ musicLevel: v }, 'music')}
          />
          <AudioChannelRow
            label="音效"
            on={mix.sfxOn}
            level={mix.sfxLevel}
            onToggle={() => update({ sfxOn: !mix.sfxOn }, 'sfx')}
            onLevel={(v) => update({ sfxLevel: v }, 'sfx')}
          />
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
    </dialog>,
    document.body,
  );
}
