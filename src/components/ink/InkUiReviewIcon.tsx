import type { CSSProperties } from 'react';
import type { InkIconKey } from '../../ui/inkIcons';
import { InkIcon } from './InkIcon';

const positions: Partial<Record<InkIconKey, [number, number]>> = {
  book: [0, 0], pouch: [50, 0], swords: [100, 0],
  scroll: [0, 100], tablet: [50, 100], silver: [100, 100],
};

/** AI位圖樣板：只替換裝飾圖示，原有按鈕名稱同功能不變。 */
export function InkUiReviewIcon({ name, size, className }: { name: InkIconKey; size: number; className?: string }) {
  const position = positions[name];
  if (!position) return <InkIcon name={name} size={size} className={className} />;
  return <span aria-hidden="true" className={`ink-review-icon ${className ?? ''}`} style={{
    width: size, height: size,
    backgroundImage: `url(${import.meta.env.BASE_URL}ink/art/ui-review/icons.webp)`,
    backgroundSize: '300% 200%', backgroundPosition: `${position[0]}% ${position[1]}%`,
  } as CSSProperties} />;
}
