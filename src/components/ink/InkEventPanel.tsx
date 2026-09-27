import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { InkEventBanner } from './InkDecor';
import { pickAiEventBanner, aiEventBannerUrl } from '../../ui/inkAiCatalog';
import { displayChoiceText } from '@core/life/playerText';
import { EVENT_ACTION_POINT_COST, hasEnoughActionPoints } from '@core/life/actionPoints';
import { haptic } from '../../ui/haptics';
import { shouldReduceInkMotion } from './sceneVariants';

/** 放手過呢個距離（px）或者甩得夠快（px/ms）就確認 */
const SWIPE_COMMIT_PX = 90;
const SWIPE_COMMIT_VELOCITY = 0.55;
/** 開始判定為橫拖嘅最少位移 */
const SWIPE_INTENT_PX = 8;
const FLY_MS = 260;

type Side = 'left' | 'right';

/**
 * 事件掃卡：左掃＝甲（第一個選項）、右掃＝乙（第二個）；第三個以後喺卡底做按鈕。
 * 直向拖照常捲動內文；只有橫向意圖明確先當掃卡。按鈕同鍵盤（←／→）都可以揀。
 */
function useSwipeCard(opts: { enabled: boolean; blocked: boolean; onCommit: (side: Side) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; t: number; active: boolean; dx: number } | null>(null);
  const [flying, setFlying] = useState<Side | null>(null);
  const crossed = useRef(false);

  const setDx = (dx: number, animate: boolean) => {
    const el = cardRef.current;
    if (!el) return;
    const reduce = shouldReduceInkMotion();
    el.style.transition = animate ? `transform ${reduce ? 1 : 320}ms cubic-bezier(0.2, 0.85, 0.25, 1.15)` : 'none';
    el.style.transform = dx ? `translateX(${dx}px) rotate(${reduce ? 0 : dx * 0.05}deg)` : '';
    el.style.setProperty('--swipe', String(Math.max(-1, Math.min(1, dx / SWIPE_COMMIT_PX))));
  };

  const commit = useCallback(
    (side: Side) => {
      if (flying) return;
      const el = cardRef.current;
      haptic('medium');
      setFlying(side);
      if (el) {
        const reduce = shouldReduceInkMotion();
        el.style.transition = `transform ${reduce ? 1 : FLY_MS}ms cubic-bezier(0.5, 0, 0.75, 0.2), opacity ${reduce ? 1 : FLY_MS}ms`;
        el.style.transform = `translateX(${side === 'left' ? -120 : 120}vw) rotate(${reduce ? 0 : side === 'left' ? -18 : 18}deg)`;
        el.style.opacity = '0.2';
      }
      window.setTimeout(() => opts.onCommit(side), shouldReduceInkMotion() ? 0 : FLY_MS - 40);
    },
    [flying, opts],
  );

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!opts.enabled || flying || e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, active: false, dx: 0 };
    crossed.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < SWIPE_INTENT_PX || Math.abs(dx) < Math.abs(dy) * 1.2) {
        if (Math.abs(dy) > SWIPE_INTENT_PX) drag.current = null; // 直向＝捲動，放棄
        return;
      }
      d.active = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // 過勞：拖唔郁幾多（阻尼）
    const eased = opts.blocked ? dx * 0.18 : Math.abs(dx) > 160 ? Math.sign(dx) * (160 + (Math.abs(dx) - 160) * 0.35) : dx;
    d.dx = eased;
    d.t = e.timeStamp;
    const over = Math.abs(eased) >= SWIPE_COMMIT_PX;
    if (over !== crossed.current) {
      crossed.current = over;
      if (over) haptic('light');
    }
    setDx(eased, false);
  };
  const onPointerEnd = (e: ReactPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.active) return;
    const dt = Math.max(1, e.timeStamp - d.t + 16);
    const v = Math.abs(d.dx) / dt;
    if (!opts.blocked && (Math.abs(d.dx) >= SWIPE_COMMIT_PX || (Math.abs(d.dx) > 40 && v > SWIPE_COMMIT_VELOCITY))) {
      commit(d.dx < 0 ? 'left' : 'right');
    } else {
      setDx(0, true);
    }
  };

  return {
    cardRef,
    flying,
    commit,
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
  };
}

type Props = {
  state: LifeGameState;
  pendingEvent: GameEvent;
  choicesReady: boolean;
  eligibleChoices: GameEvent['choices'];
  onChoose: (choiceId: string) => void;
  onDismiss: () => void;
};

export function InkEventPanel({
  state,
  pendingEvent,
  choicesReady,
  eligibleChoices,
  onChoose,
  onDismiss,
}: Props) {
  const c = state.character;
  const month = state.month ?? 1;
  const bannerKind = pickAiEventBanner({
    title: pendingEvent.title,
    body: pendingEvent.body,
    tags: pendingEvent.tags,
  });
  const eventBannerSrc = aiEventBannerUrl(bannerKind);
  const eventBodyParas = pendingEvent.body
    ? pendingEvent.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];
  const lowActionPoints = !hasEnoughActionPoints(state, EVENT_ACTION_POINT_COST);
  const swipeChoices = eligibleChoices.slice(0, 2);
  const extraChoices = eligibleChoices.slice(2);
  const canSwipe = choicesReady && swipeChoices.length === 2;
  const swipe = useSwipeCard({
    enabled: canSwipe,
    blocked: lowActionPoints,
    onCommit: (side) => {
      const ch = swipeChoices[side === 'left' ? 0 : 1];
      if (ch) onChoose(ch.id);
    },
  });
  const choiceLabel = (ch: GameEvent['choices'][number]) => displayChoiceText(ch.text, ch.id);

  return (
    <section
      className="ink-panel ink-event ink-event--focus"
      aria-label="待決之事"
      onKeyDown={(e) => {
        if (!canSwipe || lowActionPoints) return;
        if (e.key === 'ArrowLeft') swipe.commit('left');
        else if (e.key === 'ArrowRight') swipe.commit('right');
      }}
    >
      <div
        ref={swipe.cardRef}
        className={`ink-swipe-card${canSwipe ? ' is-swipeable' : ''}${lowActionPoints ? ' is-blocked' : ''}`}
        style={{ '--swipe': 0 } as CSSProperties}
        {...swipe.handlers}
      >
        {canSwipe && (
          <>
            <span className="ink-swipe-hint ink-swipe-hint--left" aria-hidden>
              <b>甲</b>
              {choiceLabel(swipeChoices[0]!)}
            </span>
            <span className="ink-swipe-hint ink-swipe-hint--right" aria-hidden>
              <b>乙</b>
              {choiceLabel(swipeChoices[1]!)}
            </span>
          </>
        )}
      <div className="ink-event-scroll">
        {eventBannerSrc && <InkEventBanner src={eventBannerSrc} />}
        <p className="ink-event-year">
          {state.year}年{month}月 · {c.age}歲
          {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
        </p>
        <h3 className="ink-write-in">{pendingEvent.title}</h3>
        {eventBodyParas.map((para, i) => (
          <p
            key={`${pendingEvent.id}-p${i}`}
            className="ink-event-body ink-write-in"
            style={{ ['--i' as string]: i }}
          >
            {para}
          </p>
        ))}
      </div>
      </div>
      <div
        className={`ink-choice-list ink-choice-list--dock${choicesReady ? ' ink-choice-list--reveal' : ' ink-choice-list--await'}`}
      >
        {canSwipe ? (
          <>
            <div className="ink-swipe-row">
              {swipeChoices.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`ink-choice ink-choice--swipe ink-choice--${i === 0 ? 'left' : 'right'}`}
                  style={{ ['--i' as string]: i }}
                  disabled={lowActionPoints || !!swipe.flying}
                  aria-disabled={lowActionPoints}
                  aria-label={`${i === 0 ? '甲（左掃）' : '乙（右掃）'}：${choiceLabel(ch)}`}
                  onClick={() => {
                    if (lowActionPoints) return;
                    swipe.commit(i === 0 ? 'left' : 'right');
                  }}
                >
                  {i === 0 && <span className="ink-swipe-arrow" aria-hidden>‹</span>}
                  <span className="ink-choice-mark">{i === 0 ? '甲' : '乙'}</span>
                  <span className="ink-swipe-text">{choiceLabel(ch)}</span>
                  {i === 1 && <span className="ink-swipe-arrow" aria-hidden>›</span>}
                </button>
              ))}
            </div>
            {extraChoices.map((ch, k) => (
              <button
                key={ch.id}
                type="button"
                className="ink-choice ink-choice--extra"
                style={{ ['--i' as string]: k + 2 }}
                disabled={lowActionPoints || !!swipe.flying}
                aria-disabled={lowActionPoints}
                onClick={() => {
                  if (lowActionPoints) return;
                  onChoose(ch.id);
                }}
              >
                <span className="ink-choice-mark">{['丙', '丁'][k] ?? '註'}</span>
                {choiceLabel(ch)}
              </button>
            ))}
          </>
        ) : (
          eligibleChoices.map((ch, i) => (
            <button
              key={ch.id}
              type="button"
              className="ink-choice"
              style={{ ['--i' as string]: i }}
              disabled={lowActionPoints}
              aria-disabled={lowActionPoints}
              onClick={() => {
                if (lowActionPoints) return;
                onChoose(ch.id);
              }}
            >
              <span className="ink-choice-mark">{['甲', '乙', '丙', '丁'][i] ?? '註'}</span>
              {choiceLabel(ch)}
            </button>
          ))
        )}
        {eligibleChoices.length === 0 && (
          <button type="button" className="ink-choice" onClick={() => onDismiss()}>
            <span className="ink-choice-mark">避</span>
            暫避鋒芒（此刻無可行之選）
          </button>
        )}
      </div>
      {lowActionPoints && (
        <p className="ink-ap-hint" role="status">
          過勞未歇——疲勞回落後先可以再選（約數十秒）。
        </p>
      )}
    </section>
  );
}
