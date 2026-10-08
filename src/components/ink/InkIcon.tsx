import { inkIconUrl, type InkIconKey } from '../../ui/inkIcons';

type Props = {
  name: InkIconKey;
  /** 顯示尺寸（CSS px） */
  size: number;
  className?: string;
};

/** 統一 UI icon（位圖，裝飾用：文字標籤另外畀） */
export function InkIcon({ name, size, className }: Props) {
  return (
    <img
      className={className ? `ink-icon ${className}` : 'ink-icon'}
      src={inkIconUrl(name, size)}
      width={size}
      height={size}
      alt=""
      aria-hidden
      decoding="async"
      draggable={false}
    />
  );
}
