import { inkArtUrl } from '../../ui/inkAssets';

type Props = {
  src: string;
  label?: string;
  size: number;
  tone?: 'brown' | 'slate' | 'jade' | 'red';
  className?: string;
};

/** 菱形器物牌章；文字用真實字體，細數值圖示沿用旁邊嘅文字標籤。 */
export function InkBadge({ src, label, size, tone = 'slate', className = '' }: Props) {
  return (
    <span className={`ink-icon ink-badge ${label ? 'ink-badge--labelled' : 'ink-badge--compact'} ${className}`}
      style={{ width: size, height: size }} aria-hidden="true">
      <img className="ink-badge-base" src={inkArtUrl(`art/badges/${tone}.webp`)} alt="" draggable={false} />
      <img className="ink-badge-object" src={src} alt="" decoding="async" draggable={false} />
      {label && <span className={`ink-badge-label${label.length > 3 ? ' is-long' : ''}`}>{label}</span>}
    </span>
  );
}
