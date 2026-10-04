/** 雲端 ↔ 本機存檔之間嘅橋：讀本機存檔時間、將雲端存檔寫返落本機 */
import type { LifeGameState } from '@interfaces/lifeEngine';

const ANCESTRY_KEY = 'jianghu_ancestry_v1';

export async function readLocalSavedAt(): Promise<number | null> {
  const { loadLifeSave } = await import('@core/life/saveIndexedDb');
  const save = await loadLifeSave();
  let ancestryAt = 0;
  try { ancestryAt = Number(localStorage.getItem('jianghu_ancestry_saved_at_v1')); } catch { /* unavailable */ }
  return Math.max(save?.savedAt ?? 0, Number.isFinite(ancestryAt) ? ancestryAt : 0) || null;
}

export async function writeLocal(life: LifeGameState | null, ancestry: string | null): Promise<void> {
  if (life) {
    const [{ persistLife }, { migrateLifeState }] = await Promise.all([
      import('@core/life/saveIndexedDb'),
      import('@core/life/gameState'),
    ]);
    await persistLife(migrateLifeState(life));
  }
  if (!life) {
    const { clearLifeSave } = await import('@core/life/saveIndexedDb');
    await clearLifeSave();
  }
  if (ancestry) {
    try {
      localStorage.setItem(ANCESTRY_KEY, ancestry);
      localStorage.setItem('jianghu_ancestry_saved_at_v1', String(Date.now()));
    } catch {
      /* 私隱模式 */
    }
  }
}
