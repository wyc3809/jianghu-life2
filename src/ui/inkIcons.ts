/**
 * 統一 UI icon 登記（第 18 項：全遊戲 icon 同一套風格，寶箱開箱同級）。
 * 實體檔：`public/ink/art/icons/ui-<key>-<64|128>.webp`
 * 產生器：`scripts/art/build_ui_icons.py`（方案 B：設色＋閃光；AI 圖可同名同尺寸替換）
 * 風格參考：`design/art/ref/ui-style-ref.png`
 *
 * 全遊戲 UI icon 只經呢度攞，唔好喺元件直接寫路徑。
 */
import { inkArtUrl } from './inkAssets';

export type InkIconKey =
  | 'silver'
  | 'jade'
  | 'jade-paid'
  | 'book'
  | 'pouch'
  | 'swords'
  | 'scroll'
  | 'tablet'
  | 'blood'
  | 'qi'
  | 'tea'
  | 'fan'
  | 'house'
  | 'hat'
  | 'banner'
  | 'censer';

/** 顯示尺寸（CSS px）≤ 32 用 64px 圖，否則用 128px 圖（2x 螢幕都清） */
export const INK_ICON_SMALL_MAX_PX = 32;

/** icon key → WebP URL */
export function inkIconUrl(key: InkIconKey, displayPx = 48): string {
  const size = displayPx <= INK_ICON_SMALL_MAX_PX ? 64 : 128;
  return inkArtUrl(`art/icons/ui-${key}-${size}.webp`);
}

/** 結果頁增減 chip：標籤 → icon（冇對應就唔出 icon） */
const DELTA_ICONS: Readonly<Record<string, InkIconKey>> = {
  銀兩: 'silver',
  玉石: 'jade',
  氣血: 'blood',
  內力: 'qi',
  疲勞: 'tea',
  疲勞度: 'tea',
  武學: 'scroll',
  修為: 'censer',
  裝備: 'swords',
};

export function deltaIconKey(label: string): InkIconKey | undefined {
  return DELTA_ICONS[label];
}
