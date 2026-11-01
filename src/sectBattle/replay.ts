import type {
  SectBattleEntrant,
  SectBattleReplay,
} from "@interfaces/sectBattle";
import { Capacitor } from "@capacitor/core";
import workerUrl from "./replay.worker?worker&url";
import type { SectReplayTape } from "@interfaces/sectTape";
/** 只重建已鎖種子／快照的畫面時間軸；背景工作不結算名次或派獎。 */
export function buildWarReplay(
  roster: SectBattleEntrant[],
  seed: number,
  fingerprint?: string,
  timeline?: SectReplayTape,
): { promise: Promise<SectBattleReplay>; cancel: () => void } {
  let worker: Worker | null = null,
    blob: string | null = null,
    stopped = false,
    stop = () => {};
  const promise = new Promise<SectBattleReplay>((resolve, reject) => {
    const dispose = () => {
      worker?.terminate();
      if (blob) {
        URL.revokeObjectURL(blob);
        blob = null;
      }
    };
    const timer = setTimeout(() => {
      stopped = true;
      dispose();
      reject(new Error("展開戰報逾時，請稍後重試。"));
    }, 15000);
    stop = () => {
      stopped = true;
      clearTimeout(timer);
      dispose();
      reject(new DOMException("已離開會武", "AbortError"));
    };
    void (async () => {
      try {
        if (Capacitor.isNativePlatform() && import.meta.env.PROD) {
          const response = await fetch(workerUrl);
          if (!response.ok) throw new Error("工作程式未能載入");
          const script = await response.text();
          if (stopped) return;
          blob = URL.createObjectURL(
            new Blob([script], { type: "text/javascript" }),
          );
          worker = new Worker(blob);
        } else
          worker = new Worker(new URL("./replay.worker.ts", import.meta.url), {
            type: "module",
          });
        if (stopped) {
          dispose();
          return;
        }
        worker.onmessage = (e) => {
          clearTimeout(timer);
          dispose();
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.replay);
        };
        worker.onerror = () => {
          clearTimeout(timer);
          dispose();
          reject(new Error("未能展開戰報，請更新遊戲後重試。"));
        };
        worker.postMessage({ roster, seed, fingerprint, timeline });
      } catch {
        clearTimeout(timer);
        dispose();
        reject(new Error("未能準備會武演出，請重新開啟遊戲。"));
      }
    })();
  });
  return { promise, cancel: () => stop() };
}
