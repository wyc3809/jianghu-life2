import { simulateSectBattle } from "@core/online/sectBattle";
import { sectReplayFingerprint } from "@core/online/sectWar";
import type { SectBattleEntrant } from "@interfaces/sectBattle";
import type { SectReplayTape } from "@interfaces/sectTape";
import { unpackSectReplay } from "@core/online/sectTape";
declare const self: {
  onmessage:
    | ((
        event: MessageEvent<{
          roster: SectBattleEntrant[];
          seed: number;
          fingerprint?: string;
          timeline?: SectReplayTape;
        }>,
      ) => void)
    | null;
  postMessage(value: unknown): void;
};
self.onmessage = (
  event: MessageEvent<{
    roster: SectBattleEntrant[];
    seed: number;
    fingerprint?: string;
    timeline?: SectReplayTape;
  }>,
) => {
  try {
    if (event.data.fingerprint && !event.data.timeline)
      throw new Error("正式戰報欠缺伺服器時間軸，請更新後重試。");
    const replay = event.data.timeline
      ? unpackSectReplay(event.data.timeline)
      : simulateSectBattle(event.data.roster, event.data.seed, true, true);
    if (
      event.data.fingerprint &&
      sectReplayFingerprint(replay) !== event.data.fingerprint
    )
      throw new Error("戰報版本不一致，請更新遊戲後重試。");
    self.postMessage({ replay });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "戰報未能展開。",
    });
  }
};
