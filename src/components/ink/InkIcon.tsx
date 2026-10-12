import { inkIconUrl, type InkIconKey } from '../../ui/inkIcons';
import { InkBadge } from './InkBadge';

type Props = {
  name: InkIconKey;
  /** 顯示尺寸（CSS px） */
  size: number;
  label?: string;
  className?: string;
};
const LABELS: Record<InkIconKey, string> = {
  silver: '銀兩', jade: '玉石', 'jade-paid': '付費玉石', book: '秘笈', pouch: '奇遇',
  swords: '論劍', scroll: '武學', tablet: '祖祠', blood: '氣血', qi: '內力',
  tea: '疲勞', fan: '設定', house: '鎮居', hat: '人物', banner: '江湖', censer: '修煉',
};

/** 全遊戲統一菱形 icon；大入口整合名稱，小資源圖示配合既有文字。 */
export function InkIcon({ name, size, label, className }: Props) {
  const tone = ['house', 'book', 'tablet', 'censer'].includes(name) ? 'brown' : 'slate';
  return <InkBadge src={inkIconUrl(name, size)} label={label ?? (size >= 40 ? LABELS[name] : undefined)}
    size={size} tone={tone} className={className} />;
}
