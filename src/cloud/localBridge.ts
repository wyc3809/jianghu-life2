/** 雲端 ↔ 本機存檔之間嘅橋：讀本機存檔時間、將雲端存檔寫返落本機 */
import type { LifeGameState } from '@interfaces/lifeEngine';

const ANCESTRY_KEY = 'jianghu_ancestry_v1';

export async function readLocalSavedAt(): Promise<number | null> {
  const { loadLifeSave } = await import('@core/life/saveIndexedDb');
  const save = await loadLifeSave();
  return save?.savedAt ?? null;
}

export async function writeLocal(life: LifeGameState | null, ancestry: string | null): Promise<void> {
  if (life) {
    const [{ persistLife }, { migrateLifeState }] = await Promise.all([
      import('@core/life/saveIndexedDb'),
      import('@core/life/gameState'),
    ]);
    await persistLife(migrateLifeState(life));
  }
  if (ancestry) {
    try {
      localStorage.setItem(ANCESTRY_KEY, ancestry);
    } catch {
      /* 私隱模式 */
    }
  }
}
