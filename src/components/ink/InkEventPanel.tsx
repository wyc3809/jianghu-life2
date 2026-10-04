import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { inkCardIn, inkPopIn, inkRevealChars } from '../../ui/inkMotion';
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
/** 拉扯阻力：最大拉距同漸重系數（拉 ~110px 先到門檻 90） */
const SWIPE_MAX_PULL = 210;
const SWIPE_PULL_K = 190;

type Side = 'left' | 'right';

/**
 * 事件掃卡（二選一）：左掃＝甲、右掃＝乙；卡底兩個按鈕同鍵盤（←／→）亦可以揀。
 * 拉動時：
 * - 墨染漸色：拉向嗰邊嘅選項由淡墨漸漸染色（左墨青、右朱砂），另一邊褪淡；卡邊同色墨暈化開
 * - 拉扯紙張力：越拉越重（阻力漸增），卡被扯斜；過門檻輕震、提示放大，鬆手即選
 * 直向拖照常捲動內文；只有橫向意圖明確先當掃卡。
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
    const p = Math.max(-1, Math.min(1, dx / SWIPE_COMMIT_PX));
    el.style.transition = animate
      ? `transform ${reduce ? 1 : 360}ms cubic-bezier(0.2, 0.85, 0.25, 1.25)`
      : 'none';
    // 紙被扯：跟手平移、向拉嗰邊傾斜、少少斜拉變形
    el.style.transform = dx
      ? reduce
        ? `translateX(${dx}px)`
        : `translateX(${dx}px) rotate(${dx * 0.045}deg) skewX(${-p * 2.4}deg) scale(${1 - Math.abs(p) * 0.015})`
      : '';
    // --swipe 寫落成個面板：卡、提示、卡底兩個選項一齊跟住染色
    const host = el.parentElement ?? el;
    host.style.setProperty('--swipe', p.toFixed(3));
    host.classList.toggle('is-armed-left', p <= -1);
    host.classList.toggle('is-armed-right', p >= 1);
    // 彈返原位時顏色跟住慢慢褪（--swipe 已用 @property 註冊，可以過渡）
    host.classList.toggle('is-snapping', animate);
  };

  const commit = useCallback(
    (side: Side) => {
      if (flying) return;
      const el = cardRef.current;
      haptic('medium');
      setFlying(side);
      if (el) {
        (el.parentElement ?? el).style.setProperty('--swipe', side === 'left' ? '-1' : '1');
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
    // 拉扯阻力：越拉越重（指數收斂，最多約 210px）；過勞：拖唔郁幾多
    const eased = opts.blocked
      ? dx * 0.18
      : Math.sign(dx) * SWIPE_MAX_PULL * (1 - Math.exp(-Math.abs(dx) / SWIPE_PULL_K));
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
  /** 冇得揀／一笑置之：label 顯示喺結果 */
  onDismiss: (label?: string) => void;
};

/** 左右兩格：甲（左掃）、乙（右掃） */
type Slot = { key: string; label: string; pick: () => void };

const IGNORE_LABEL = '一笑置之';

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
  const choiceLabel = (ch: GameEvent['choices'][number]) => displayChoiceText(ch.text, ch.id);
  // 二選一：得一個選項就左邊補「一笑置之」（冇任何效果）
  const slots: Slot[] =
    eligibleChoices.length >= 2
      ? eligibleChoices.slice(0, 2).map((ch) => ({ key: ch.id, label: choiceLabel(ch), pick: () => onChoose(ch.id) }))
      : eligibleChoices.length === 1
        ? [
            { key: '__ignore', label: IGNORE_LABEL, pick: () => onDismiss(IGNORE_LABEL) },
            { key: eligibleChoices[0]!.id, label: choiceLabel(eligibleChoices[0]!), pick: () => onChoose(eligibleChoices[0]!.id) },
          ]
        : [];
  const canSwipe = choicesReady && slots.length === 2;
  const swipe = useSwipeCard({
    enabled: canSwipe,
    blocked: lowActionPoints,
    onCommit: (side) => slots[side === 'left' ? 0 : 1]?.pick(),
  });

  // anime.js：新事件 → 卡面由墨點展開、標題逐字落筆；選項解鎖 → 兩粒掣錯開彈出
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    inkCardIn(scrollRef.current);
    return inkRevealChars(titleRef.current, { delay: 200, step: 70 }) ?? undefined;
  }, [pendingEvent.id]);
  useEffect(() => {
    if (choicesReady) inkPopIn(rowRef.current?.children, { step: 110, y: 16 });
  }, [choicesReady, pendingEvent.id]);

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
            {/* 墨染：拉向嗰邊，卡邊暈出同色墨 */}
            <span className="ink-swipe-wash" aria-hidden />
            <span className="ink-swipe-hint ink-swipe-hint--left" aria-hidden>
              <b>甲</b>
              {slots[0]!.label}
            </span>
            <span className="ink-swipe-hint ink-swipe-hint--right" aria-hidden>
              <b>乙</b>
              {slots[1]!.label}
            </span>
          </>
        )}
      <div className="ink-event-scroll" ref={scrollRef}>
        {eventBannerSrc && <InkEventBanner src={eventBannerSrc} />}
        <p className="ink-event-year">
          {state.year}年{month}月 · {c.age}歲
          {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
        </p>
        <h3 ref={titleRef}>{pendingEvent.title}</h3>
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
        {slots.length === 2 && (
          <div className="ink-swipe-row" ref={rowRef}>
            {slots.map((slot, i) => (
              <button
                key={slot.key}
                type="button"
                className={`ink-choice ink-choice--swipe ink-choice--${i === 0 ? 'left' : 'right'}`}
                style={{ ['--i' as string]: i }}
                disabled={!choicesReady || lowActionPoints || !!swipe.flying}
                aria-disabled={lowActionPoints}
                aria-label={`${i === 0 ? '甲（左掃）' : '乙（右掃）'}：${slot.label}`}
                onClick={() => {
                  if (lowActionPoints) return;
                  swipe.commit(i === 0 ? 'left' : 'right');
                }}
              >
                <span className="ink-choice-ink" aria-hidden />
                {i === 0 && <span className="ink-swipe-arrow" aria-hidden>‹</span>}
                <span className="ink-choice-mark">{i === 0 ? '甲' : '乙'}</span>
                <span className="ink-swipe-text">{slot.label}</span>
                {i === 1 && <span className="ink-swipe-arrow" aria-hidden>›</span>}
              </button>
            ))}
          </div>
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
