import type { LifeGameState } from '@interfaces/lifeEngine';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: LifeGameState | null = null;

async function writeNow(state: LifeGameState): Promise<void> {
  pendingState = null;
  const { persistLife } = await import('@core/life/saveIndexedDb');
  await persistLife(state);
}

/** 延遲寫盤（戰鬥回合等熱路徑）；immediate 用於月結／抉擇／戰畢 */
export function schedulePersist(
  state: LifeGameState,
  opts?: { immediate?: boolean; delayMs?: number },
): void {
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
  const onHide = () => flushPersist();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
  return () => {
    window.removeEventListener('pagehide', onHide);
  };
}
