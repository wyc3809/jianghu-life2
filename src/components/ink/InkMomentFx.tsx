/**
 * 特效時刻：學新武學／武學升階／稱號晉升嘅全屏儀式。
 * 資料來源：state.moments（core/life/moments.ts 入隊）；播完或撳一下 → onDone（store.ackMoment）。
 * 動畫全由 CSS（styles.css「特效時刻」段）；減少動態時靜態顯示、較快收起。
 */
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { LifeMoment } from "@interfaces/lifeEngine";
import { inkArtUrl, sealUrlForText } from "../../ui/inkAssets";
import { shouldReduceInkMotion } from "./sceneVariants";

const COPY: Record<LifeMoment["kind"], { kicker: string; seal: string }> = {
  learn: { kicker: "武學入懷", seal: "武" },
  rank: { kicker: "武學精進", seal: "煉" },
  title: { kicker: "江湖有名", seal: "晉" },
};

/** 自動收起時間（ms）；低階稱號較短，免得頻密打斷 */
function lifeMs(m: LifeMoment, reduce: boolean): number {
  if (reduce) return 1600;
  if (m.kind === "title" && m.tier <= 2) return 2200;
  return 2900;
}

function mainText(m: LifeMoment): string {
  return m.kind === "title" ? m.label : m.name;
}

function subText(m: LifeMoment): string | null {
  if (m.kind === "rank") return `進至 · ${m.rankName}`;
  if (m.kind === "title") return "江湖上開始有人如此稱你";
  return "秘笈到手，招式初成";
}

export function InkMomentFx({
  moment,
  onDone,
}: {
  moment: LifeMoment;
  onDone: () => void;
}) {
  const reduce = shouldReduceInkMotion();
  // 撳一下同自動收起可能同時觸發：只准結束一次，否則會一次過跳走兩個時刻
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);
  useEffect(() => {
    const t = window.setTimeout(finish, lifeMs(moment, reduce));
    return () => window.clearTimeout(t);
  }, [moment, finish, reduce]);

  const copy = COPY[moment.kind];
  const sub = subText(moment);
  return createPortal(
    <div
      className={`ink-moment ink-moment--${moment.kind}`}
      role="button"
      tabIndex={0}
      aria-live="polite"
      aria-label={`${copy.kicker}：${mainText(moment)}${sub ? `，${sub}` : ""}。點擊繼續`}
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
      }}
    >
      <div className="ink-moment__stage" aria-hidden>
        {moment.kind === "rank" && (
          <img
            className="ink-moment__halo"
            src={inkArtUrl("art/ui/ink-halo-a.webp")}
            alt=""
            draggable={false}
          />
        )}
        {/* 學武：紙卷；稱號：題簽；升階：淨係墨環 */}
        {moment.kind !== "rank" && <span className="ink-moment__paper" />}
        <p className="ink-moment__kicker">{copy.kicker}</p>
        {/* 逐字直排（唔用 writing-mode：部分瀏覽器字型直書度量唔穩） */}
        <p className="ink-moment__name">
          {Array.from(mainText(moment)).map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
        {sub && <p className="ink-moment__sub">{sub}</p>}
        {sealUrlForText(copy.seal) && (
          <img
            className="ink-moment__seal"
            src={sealUrlForText(copy.seal)!}
            alt=""
            draggable={false}
          />
        )}
      </div>
      <p className="ink-moment__hint" aria-hidden>
        點擊繼續
      </p>
    </div>,
    document.body,
  );
}
