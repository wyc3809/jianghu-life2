/**
 * 成就動畫：頂部跌落一條紙籤（朱砂「成就」印＋逐字寫出名＋泥金掃光），停一陣再收起；
 * 多個成就逐個出。純展示，唔阻操作（pointer-events: none）。
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playInkAscend } from '../../audio/inkAudio';
import { shouldReduceInkMotion } from './sceneVariants';

/** 每條成就之間嘅間隔（ms），要同 CSS 嘅 --gap 一致 */
const GAP_MS = 1400;

export function InkAchievementToast({ names }: { names: string[] }) {
  useEffect(() => {
    if (!names.length) return;
    const reduce = shouldReduceInkMotion();
    // 每條落下時撥一下弦（震動由 playInkAscend 帶）
    const timers = names.map((_, i) => window.setTimeout(() => playInkAscend('title'), reduce ? 0 : i * GAP_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [names]);

  if (!names.length) return null;
  return createPortal(
    <div className="ink-achv-stack" aria-live="polite">
      {names.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className="ink-achv"
          role="status"
          style={{ ['--k' as string]: i, ['--gap' as string]: `${GAP_MS}ms` }}
          aria-label={`成就達成：${name}`}
        >
          <span className="ink-achv-seal" aria-hidden>
            成就
          </span>
          <span className="ink-achv-name" aria-hidden>
            {Array.from(name).map((ch, j) => (
              <i key={j} style={{ ['--j' as string]: j }}>
                {ch}
              </i>
            ))}
          </span>
        </div>
      ))}
    </div>,
    document.body,
  );
}
