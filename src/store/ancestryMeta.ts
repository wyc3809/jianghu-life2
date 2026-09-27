/**
 * 祖蔭讀寫（localStorage `jianghu_ancestry_v1`）。獨立檔，免得 lifeStore ↔ ancestryStore 循環引用。
 */
import type { AncestryMeta } from '@interfaces/ancestry';
import { emptyAncestry, parseAncestry } from '@core/life/ancestry';

const KEY = 'jianghu_ancestry_v1';

export function loadAncestry(): AncestryMeta {
  try {
    return parseAncestry(localStorage.getItem(KEY));
  } catch {
    return emptyAncestry();
  }
}

export function persistAncestry(meta: AncestryMeta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    /* 私隱模式：只留記憶體 */
  }
}
