/**
 * 高光時刻（3D 結算演出）：寶箱／令牌／丹爐。
 * 五階段：預備 → 升級 → 蓄力 → 爆發 → 揭曉與結算（director.ts）。
 * 呢個檔案負責 DOM 圖層、HUD、標題、獎勵卡、資訊面板同領取飛幣；3D 同粒子交畀 Director。
 * 以 React.lazy 按需載入（Three.js／GSAP 唔入首屏）。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Director, type Phase } from './director';
import { GRADES } from './grades';
import { drawArt, iconDataUrl } from './icons';
import type { Grade, HighlightConfig, HighlightSubject, RewardCard } from './types';
import { isInkAudioMuted, toggleInkAudioMuted } from '../../audio/inkAudio';
import styles from './highlight.module.css';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@700;900&family=Lilita+One&display=swap';

function ensureFonts() {
  if (typeof document === 'undefined' || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = FONT_HREF;
  document.head.appendChild(l);
}

function reduceMotionPref(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.inkMotion === 'reduce') return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const SUBJECT_NAME: Record<HighlightSubject, string> = { chest: '寶箱', token: '武學令', cauldron: '丹爐' };

export interface HighlightFxProps {
  config: HighlightConfig;
  onDone: () => void;
  /** 示範頁：模式切換 */
  modes?: { value: HighlightSubject; label: string }[];
  onMode?: (m: HighlightSubject) => void;
}

/** 卡面 canvas（1.5 倍解像度） */
function CardArt({ card, size }: { card: RewardCard; size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const st = GRADES[card.grade];
    const cv = drawArt({
      kind: card.icon,
      pattern: card.pattern,
      bg: st.bgInner,
      fg: st.glow,
      cssSize: size,
      tint: card.icon === 'gem' ? st.main : undefined,
    });
    cv.style.width = `${size}px`;
    cv.style.height = `${size}px`;
    host.replaceChildren(cv);
  }, [card, size]);
  return <div ref={ref} className={styles.art} style={{ width: size, height: size }} aria-hidden />;
}

function Title({ text, gradeKey }: { text: string; gradeKey: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const chars = ref.current?.querySelectorAll('span');
    if (!chars?.length) return;
    // 逐字「砸」入：由大、由上、旋轉 → 落位回彈
    gsap.fromTo(
      chars,
      { scale: 2.8, y: -46, opacity: 0, rotation: () => gsap.utils.random(-25, 25) },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 0.5,
        ease: 'back.out(3.2)',
        stagger: 0.055,
        overwrite: true,
      },
    );
  }, [text, gradeKey]);
  return (
    <h1 ref={ref} className={styles.title} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={`${gradeKey}-${i}`} aria-hidden>
          {ch}
        </span>
      ))}
    </h1>
  );
}

export default function HighlightFx({ config, onDone, modes, onMode }: HighlightFxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const beamsRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const backGlowRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const coinPillRef = useRef<HTMLDivElement>(null);
  const gemPillRef = useRef<HTMLDivElement>(null);
  const coinValRef = useRef<HTMLSpanElement>(null);
  const gemValRef = useRef<HTMLSpanElement>(null);
  const director = useRef<Director | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [grade, setGrade] = useState<Grade>(0);
  const [revealed, setRevealed] = useState(false);
  const [muted, setMuted] = useState(isInkAudioMuted);
  const [panelIdx, setPanelIdx] = useState(0);
  /** 面板數字滾完之後，切換卡片直接顯示終值 */
  const [statsFinal, setStatsFinal] = useState(false);
  const reduce = useMemo(reduceMotionPref, []);
  const topGrade = config.targetGrade === 5;

  useEffect(ensureFonts, []);

  useLayoutEffect(() => {
    const d = new Director(
      {
        root: rootRef.current!,
        world: worldRef.current!,
        gl: glRef.current!,
        fx: fxRef.current!,
        flash: flashRef.current!,
        shadow: shadowRef.current!,
        beams: beamsRef.current!,
        curtain: curtainRef.current!,
        backGlow: backGlowRef.current!,
      },
      config,
      { onPhase: setPhase, onGrade: setGrade, onReveal: () => setRevealed(true), onDone },
      { reduceMotion: reduce },
    );
    director.current = d;
    const ro = new ResizeObserver(() => d.resize());
    ro.observe(rootRef.current!);
    return () => {
      ro.disconnect();
      d.dispose();
      director.current = null;
    };
    // config 變 → 由上層用 key 重新掛載
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------ 揭曉：卡片弧線飛出、面板數字滾動 ---
  useLayoutEffect(() => {
    if (!revealed) return;
    const d = director.current;
    const host = cardsRef.current;
    if (!d || !host) return;
    const cards = Array.from(host.querySelectorAll<HTMLElement>('[data-card]'));
    const b = d.burstScreen();
    const rootRect = rootRef.current!.getBoundingClientRect();
    const tl = gsap.timeline({ delay: topGrade ? 1.3 : 0.25 });
    cards.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const dx = b.x - (r.left - rootRect.left + r.width / 2);
      const dy = b.y - (r.top - rootRect.top + r.height / 2);
      const proxy = { t: 0 };
      gsap.set(el, { x: dx, y: dy, scale: 0.15, rotation: -40, opacity: 0 });
      tl.to(
        proxy,
        {
          t: 1,
          duration: 0.55,
          ease: 'power2.out',
          onStart: () => d.sfx.pop(),
          onUpdate: () => {
            // 二次貝塞爾：起點（爆點）→ 控制點（上方）→ 終點（0,0）
            const t = proxy.t;
            const cx = dx * 0.45;
            const cy = Math.min(dy, 0) - 170;
            const u = 1 - t;
            gsap.set(el, {
              x: u * u * dx + 2 * u * t * cx,
              y: u * u * dy + 2 * u * t * cy,
              scale: 0.15 + 0.95 * t,
              rotation: -40 * u,
              opacity: Math.min(1, t * 3),
            });
          },
        },
        i * 0.13,
      );
      // 落位超調＋晃動收尾
      tl.fromTo(el, { scale: 1.1 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.35)' }, i * 0.13 + 0.55);
      tl.fromTo(el, { rotation: 9 }, { rotation: 0, duration: 0.75, ease: 'elastic.out(1.4, 0.3)' }, i * 0.13 + 0.55);
      // 卡面大數字滾動
      const amt = el.querySelector<HTMLElement>('[data-amount]');
      const target = Number(amt?.dataset.amount ?? 0);
      if (amt && target) {
        const o = { v: 0 };
        tl.to(
          o,
          { v: target, duration: 0.6, ease: 'power2.out', onUpdate: () => (amt.textContent = `×${Math.round(o.v)}`) },
          i * 0.13 + 0.45,
        );
      }
      const badge = el.querySelector<HTMLElement>('[data-new]');
      if (badge)
        tl.fromTo(
          badge,
          { scale: 0, rotation: -40 },
          { scale: 1, rotation: 12, duration: 0.5, ease: 'back.out(3)' },
          i * 0.13 + 0.7,
        );
    });
    // 資訊面板：滑入，數字滾動，彈「▲+差值」
    const panel = panelRef.current;
    const endAt = cards.length * 0.13 + 0.7;
    if (panel) {
      tl.fromTo(
        panel,
        { y: 40, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' },
        endAt,
      );
      panel.querySelectorAll<HTMLElement>('[data-stat]').forEach((row, i) => {
        const val = row.querySelector<HTMLElement>('[data-val]')!;
        const up = row.querySelector<HTMLElement>('[data-up]');
        const from = Number(val.dataset.from);
        const to = Number(val.dataset.to);
        const o = { v: from };
        let lastTick = from;
        tl.to(
          o,
          {
            v: to,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: () => {
              const n = Math.round(o.v);
              val.textContent = String(n);
              if (Math.abs(n - lastTick) >= Math.max(1, (to - from) / 8)) {
                lastTick = n;
                d.sfx.tick();
              }
            },
          },
          endAt + 0.3 + i * 0.15,
        );
        if (up)
          tl.fromTo(
            up,
            { scale: 0, y: 8, opacity: 0 },
            { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(3)' },
            endAt + 0.9 + i * 0.15,
          );
      });
    }
    tl.call(() => {
      setStatsFinal(true);
      d.revealSettled();
    });
    return () => {
      tl.kill();
    };
  }, [revealed, topGrade]);

  // ------------------------------------------------ 結算：金幣／寶石沿貝塞爾飛入 HUD ---
  const claim = useCallback(() => {
    const d = director.current;
    if (!d || !d.beginClaim()) return;
    const root = rootRef.current!;
    const rootRect = root.getBoundingClientRect();
    const flights: Promise<void>[] = [];
    const vals: Record<'coin' | 'gem', { el: HTMLSpanElement | null; pill: HTMLDivElement | null; v: number }> = {
      coin: { el: coinValRef.current, pill: coinPillRef.current, v: config.balances.coin.value },
      gem: { el: gemValRef.current, pill: gemPillRef.current, v: config.balances.gem.value },
    };
    const cardEls = Array.from(cardsRef.current?.querySelectorAll<HTMLElement>('[data-card]') ?? []);
    config.rewards.forEach((card, ci) => {
      if (!card.flyTo || !card.amount) return;
      const slot = vals[card.flyTo];
      const from = cardEls[ci]?.getBoundingClientRect();
      const to = slot.pill?.getBoundingClientRect();
      if (!from || !to) return;
      const n = Math.max(4, Math.min(12, Math.round(card.amount / 15)));
      const share = card.amount / n;
      let given = 0;
      for (let i = 0; i < n; i++) {
        const img = document.createElement('img');
        img.src = iconDataUrl(card.flyTo === 'coin' ? 'coin' : 'gem', 30);
        img.className = styles.flyer;
        root.appendChild(img);
        const sx = from.left - rootRect.left + from.width / 2 + gsap.utils.random(-18, 18);
        const sy = from.top - rootRect.top + from.height / 2 + gsap.utils.random(-14, 14);
        const tx = to.left - rootRect.left + 16;
        const ty = to.top - rootRect.top + to.height / 2;
        // 三次貝塞爾：先向外彈開，再弧線飛上右上角
        const c1x = sx + gsap.utils.random(-120, 120);
        const c1y = sy + gsap.utils.random(-40, 60);
        const c2x = tx - 40;
        const c2y = ty + 160;
        const p = { t: 0 };
        flights.push(
          new Promise((resolve) => {
            gsap.to(p, {
              t: 1,
              duration: 0.75,
              delay: 0.12 + ci * 0.25 + i * 0.07,
              ease: 'power1.in',
              onUpdate: () => {
                const t = p.t;
                const u = 1 - t;
                const x = u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * tx;
                const y = u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ty;
                img.style.transform = `translate(${x - 15}px, ${y - 15}px) scale(${1 - 0.35 * t}) rotate(${t * 540}deg)`;
              },
              onComplete: () => {
                img.remove();
                given += 1;
                slot.v += given === n ? card.amount! - share * (n - 1) : share;
                if (slot.el) slot.el.textContent = Math.round(slot.v).toLocaleString();
                if (slot.pill)
                  gsap.fromTo(
                    slot.pill,
                    { scale: 1.28 },
                    { scale: 1, duration: 0.45, ease: 'elastic.out(1.3, 0.4)', overwrite: true },
                  );
                d.sfx.coin();
                resolve();
              },
            });
          }),
        );
      }
    });
    // 卡片收起
    gsap.to(cardEls, {
      scale: 0.8,
      opacity: 0,
      y: 30,
      duration: 0.35,
      delay: flights.length ? 0.6 : 0.05,
      stagger: 0.05,
      ease: 'power2.in',
    });
    void Promise.all(flights).then(() => gsap.delayedCall(0.45, () => d.finish()));
  }, [config]);

  // ------------------------------------------------ 輸入 ---
  const onStageTap = useCallback(() => director.current?.tap(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (director.current?.phase === 'settle') claim();
        else director.current?.tap();
      } else if (e.key === 'Escape') director.current?.skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [claim]);

  const st = GRADES[grade];
  const beforeReveal = !revealed;
  const titleText = beforeReveal
    ? (config.titles?.[grade] ?? `${SUBJECT_NAME[config.subject]} · ${st.name}`)
    : config.revealTitle;
  const panelCard = config.rewards[panelIdx] ?? config.rewards[0];
  const showSkip = phase === 'idle' || phase === 'upgrading' || phase === 'charging' || phase === 'bursting';

  return createPortal(
    <div
      ref={rootRef}
      className={styles.root}
      data-phase={phase}
      data-top={topGrade ? '1' : undefined}
      data-reduce={reduce ? '1' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`${SUBJECT_NAME[config.subject]}：${titleText}`}
      style={{ '--grade-name': `"${st.name}"` } as CSSProperties}
    >
      <div ref={worldRef} className={styles.world} onPointerDown={onStageTap}>
        <div className={styles.bg} />
        <div className={styles.rays} aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div ref={curtainRef} className={styles.curtain} aria-hidden>
          <i />
        </div>
        <div ref={backGlowRef} className={styles.backGlow} aria-hidden />
        <div ref={beamsRef} className={styles.beams} aria-hidden>
          {[-42, -28, -14, 0, 14, 28, 42].map((a, i) => (
            <i key={a} style={{ '--a': `${a}deg`, '--i': i } as CSSProperties} />
          ))}
          <b />
        </div>
        <div ref={shadowRef} className={styles.shadow} aria-hidden />
        <canvas ref={glRef} className={styles.gl} aria-hidden />
        <canvas ref={fxRef} className={styles.fx} aria-hidden />
        <div ref={flashRef} className={styles.flash} aria-hidden />
      </div>

      <header className={styles.hud}>
        {modes ? (
          <div className={styles.modes} role="tablist">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={m.value === config.subject}
                className={styles.mode}
                onClick={() => onMode?.(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : (
          <span className={styles.tag}>{SUBJECT_NAME[config.subject]}</span>
        )}
        <div className={styles.balances}>
          <div ref={coinPillRef} className={styles.pill} title={config.balances.coin.label}>
            <img src={iconDataUrl('coin', 22)} alt="" />
            <span ref={coinValRef}>{config.balances.coin.value.toLocaleString()}</span>
          </div>
          <div ref={gemPillRef} className={styles.pill} title={config.balances.gem.label}>
            <img src={iconDataUrl('gem', 22)} alt="" />
            <span ref={gemValRef}>{config.balances.gem.value.toLocaleString()}</span>
          </div>
          <button
            type="button"
            className={styles.mute}
            aria-pressed={muted}
            aria-label={muted ? '開聲' : '靜音'}
            onClick={() => setMuted(toggleInkAudioMuted())}
          >
            <span className={muted ? styles.muteOff : undefined}>♪</span>
          </button>
        </div>
      </header>

      <div className={styles.titleWrap}>
        <Title text={titleText} gradeKey={beforeReveal ? `g${grade}` : 'reveal'} />
        {!beforeReveal && config.revealSub && <p className={styles.sub}>{config.revealSub}</p>}
        {beforeReveal && config.titles?.[grade] && <p className={styles.gradeTag}>{st.name}</p>}
      </div>

      {phase === 'idle' && (
        <p className={styles.hint} aria-live="polite">
          點擊
        </p>
      )}
      {showSkip && (
        <button type="button" className={styles.skip} onClick={() => director.current?.skip()}>
          跳過 ›
        </button>
      )}

      {revealed && (
        <div className={styles.reveal}>
          {panelCard && (
            <div
              ref={panelRef}
              className={styles.panel}
              style={{ '--pc': GRADES[panelCard.grade].main } as CSSProperties}
            >
              <CardArt card={panelCard} size={78} />
              <div className={styles.panelBody}>
                <p className={styles.panelName}>{panelCard.name}</p>
                <p className={styles.panelGrade}>{GRADES[panelCard.grade].name}</p>
                {panelCard.blurb && <p className={styles.blurb}>{panelCard.blurb}</p>}
                {panelCard.stats?.map((s) => (
                  <div key={s.label} className={styles.stat} data-stat>
                    <span>{s.label}</span>
                    <b data-val data-from={s.from} data-to={s.to}>
                      {statsFinal ? s.to : s.from}
                    </b>
                    {s.to > s.from && (
                      <em data-up className={styles.up} style={statsFinal ? { opacity: 1 } : undefined}>
                        ▲+{s.to - s.from}
                      </em>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={cardsRef} className={styles.cards}>
            {config.rewards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                data-card
                className={styles.card}
                data-inlay={GRADES[card.grade].inlay}
                data-shine={card.grade >= 2 ? '1' : undefined}
                aria-pressed={i === panelIdx}
                style={{ '--cc': GRADES[card.grade].main, '--cg': GRADES[card.grade].glow } as CSSProperties}
                onClick={() => setPanelIdx(i)}
              >
                <i className={styles.inlay} data-pos="tl" />
                <i className={styles.inlay} data-pos="tr" />
                <i className={styles.inlay} data-pos="bl" />
                <i className={styles.inlay} data-pos="br" />
                {GRADES[card.grade].inlay === 'crown' && <i className={styles.crown} />}
                <CardArt card={card} size={64} />
                <span className={styles.cardName}>{card.name}</span>
                {card.amount ? (
                  <span className={styles.amount} data-amount={card.amount}>
                    ×0
                  </span>
                ) : null}
                {card.isNew && (
                  <span className={styles.newBadge} data-new>
                    NEW!
                  </span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className={styles.claim} disabled={phase !== 'settle'} onClick={claim}>
            領取
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
