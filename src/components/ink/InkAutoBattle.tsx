import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CombatReplay, CombatReplayHit } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves } from '@data/skills/volumes';
import { InkBrushBar } from './InkBrush';
import { inkArtUrl } from '../../ui/inkAssets';
import { playInkBlade, playInkDefeat, playInkHit, playInkMiss, playInkVictory } from '../../audio/inkAudio';

/** 每招演出幾耐（ms）——測試參數 */
export const AUTO_HIT_MS = 620;

type Props = {
  replay: CombatReplay;
  /** 演完（或者撳跳過） */
  onDone: () => void;
  reduceMotion?: boolean;
};

/**
 * 自動戰鬥演出（玩家決定 2026-10-07）：
 * 上面雙方氣血；中間打鬥場（命中出筆觸特效＋傷害數字）；下面主修外功七卷——
 * 已得嘅卷亮起，逐招輪到嗰卷發光；未得嘅卷灰住。
 */
export function InkAutoBattle({ replay, onDone, reduceMotion }: Props) {
  const hits = useMemo(
    () => replay.rounds.flatMap((r) => r.hits.map((h) => ({ ...h, round: r.round }))),
    [replay],
  );
  const [idx, setIdx] = useState(-1);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduceMotion) {
      setIdx(hits.length - 1);
      const t = window.setTimeout(finish, 900);
      return () => window.clearTimeout(t);
    }
    if (idx >= hits.length - 1) {
      if (replay.outcome === 'won' || replay.outcome === 'resolve') playInkVictory();
      else if (replay.outcome === 'lost') playInkDefeat();
      const t = window.setTimeout(finish, 1100);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIdx((i) => i + 1), idx < 0 ? 450 : AUTO_HIT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, hits.length, reduceMotion]);

  const cur: (CombatReplayHit & { round: number }) | undefined = hits[idx];
  useEffect(() => {
    if (!cur || reduceMotion) return;
    if (cur.damage <= 0) playInkMiss();
    else if (cur.side === 'player') playInkBlade();
    else playInkHit();
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const playerHp = cur ? cur.playerHp : replay.startPlayerHp;
  const foeHp = cur ? cur.foeHp : replay.startFoeHp;
  const owned = new Set(replay.vols ?? []);
  const moves = replay.artId ? artVolumeMoves(replay.artId) : [];
  const artName = replay.artId ? getSkillDef(replay.artId)?.name : undefined;
  const slash = inkArtUrl('art/ui/slash-stroke.webp');

  return createPortal(
    <div className="ink-auto" role="dialog" aria-modal="true" aria-label={`自動交手：${replay.title}`}>
      <div className="ink-auto-card">
        <header className="ink-auto-head">
          <span className="ink-auto-kicker">自動交手 · 第 {cur?.round ?? 1} 回合</span>
          <h3>{replay.title}</h3>
          <button type="button" className="ink-auto-skip" onClick={finish}>
            跳過 ›
          </button>
        </header>

        <div className="ink-auto-vitals">
          <div className="ink-auto-side is-foe">
            <span className="ink-auto-name">{replay.foeName}</span>
            <InkBrushBar pct={(foeHp / Math.max(1, replay.foeMaxHp)) * 100} tone="cinnabar" />
            <span className="ink-auto-hp">
              {Math.round(foeHp)}／{replay.foeMaxHp}
            </span>
          </div>
        </div>

        <div className={`ink-auto-arena${cur ? ` is-${cur.side}` : ''}`}>
          <span className="ink-auto-fighter is-foe" aria-hidden>
            敵
          </span>
          <span className="ink-auto-fighter is-player" aria-hidden>
            {replay.playerName.slice(0, 1)}
          </span>
          {cur && (
            <div key={idx} className={`ink-auto-hit is-${cur.side}${cur.damage <= 0 ? ' is-miss' : ''}`}>
              {cur.damage > 0 && <img className="ink-auto-slash" src={slash} alt="" draggable={false} />}
              <span className="ink-auto-move">
                {cur.side === 'player' && cur.vol ? `卷${VOLUME_NUMERALS[cur.vol - 1]}・` : ''}
                {cur.moveName}
              </span>
              <span className="ink-auto-dmg">{cur.damage > 0 ? `－${cur.damage}` : '落空'}</span>
            </div>
          )}
        </div>

        <div className="ink-auto-vitals">
          <div className="ink-auto-side is-player">
            <span className="ink-auto-name">{replay.playerName}</span>
            <InkBrushBar pct={(playerHp / Math.max(1, replay.playerMaxHp)) * 100} tone="ink" />
            <span className="ink-auto-hp">
              {Math.round(playerHp)}／{replay.playerMaxHp}
            </span>
          </div>
        </div>

        {replay.artId ? (
          <div className="ink-auto-vols" aria-label={`${artName} 七卷`}>
            <p className="ink-auto-vols-title">
              {artName} · 已得 {owned.size}／{VOLUME_COUNT} 卷
            </p>
            <ol>
              {Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).map((v) => {
                const on = owned.has(v);
                const active = cur?.side === 'player' && cur.vol === v;
                return (
                  <li key={v} className={`ink-auto-vol${on ? ' is-on' : ''}${active ? ' is-active' : ''}`}>
                    <b>卷{VOLUME_NUMERALS[v - 1]}</b>
                    <span>{on ? moves[v - 1]?.name.replace(/^.*·/, '') : '未得'}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <p className="ink-note">未學外功——只可以用基本攻擊。</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
