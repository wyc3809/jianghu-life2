import { persistLife } from '@core/life/saveIndexedDb';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { flushCloudSync, queueCloudSync } from '../cloud/sync';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: LifeGameState | null = null;
let latestState: LifeGameState | null = null;

async function writeNow(state: LifeGameState): Promise<void> {
  pendingState = null;
  queueCloudSync(state);
  try {
    await persistLife(state);
  } catch {
    // 保留最新失敗進度，俾玩家重試；儲存層會通知介面。
    if (latestState === state && !pendingState) pendingState = state;
  }
}

/** 延遲寫盤（戰鬥回合等熱路徑）；immediate 用於月結／抉擇／戰畢 */
export function schedulePersist(
  state: LifeGameState,
  opts?: { immediate?: boolean; delayMs?: number },
): void {
  latestState = state;
  pendingState = state;
  if (opts?.immediate) {
    if (persistTimer != null) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    void writeNow(state);
    return;
  }
  if (persistTimer != null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (pendingState) void writeNow(pendingState);
  }, opts?.delayMs ?? 450);
}

/** 清檔後唔可以再重試之前嗰一世。 */
export function discardPendingPersist(): void {
  latestState = null;
  pendingState = null;
  if (persistTimer != null) clearTimeout(persistTimer);
  persistTimer = null;
}

/** 頁面隱藏／卸載前沖刷 */
export function flushPersist(): void {
  if (persistTimer != null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (pendingState) void writeNow(pendingState);
}

export function installPersistLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onHide = () => {
    flushPersist();
    flushCloudSync();
  };
  window.addEventListener('pagehide', onHide);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') onHide();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onHide);
  return () => {
    window.removeEventListener('pagehide', onHide);
    window.removeEventListener('online', onHide);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
