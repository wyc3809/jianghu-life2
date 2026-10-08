import { useEffect, useRef, useState } from 'react';
import type { HuashanBracketState, LifeGameState } from '@interfaces/lifeEngine';
import { InkAutoBattleView } from './InkAutoBattleView';
import {
  bracketProgressLabel,
  buildBracketTree,
  canEnterHuashan,
  getHuashanSeasonKey,
  getPendingHuashanMatch,
  huashanSeasonLabel,
} from '@core/life/huashan';

type Props = {
  state: LifeGameState;
  onStart: () => void;
  onFight: () => void;
  onDismissReport: () => void;
  onCloseTournament: () => void;
};

function BracketTreeView({ bracket }: { bracket: HuashanBracketState }) {
  const tree = buildBracketTree(bracket);
  return (
    <div className="ink-bracket" aria-label="論劍括號">
      {tree.map((round) => (
        <div key={round.round} className="ink-bracket-round">
          <h4 className="ink-bracket-round-title">{round.label}</h4>
          <ul className="ink-bracket-matches">
            {round.matches.map((m) => (
              <li
                key={m.id}
                className={`ink-bracket-match${m.pending ? ' ink-bracket-match--pending' : ''}${
                  m.involvesPlayer ? ' ink-bracket-match--you' : ''
                }`}
              >
                <span className="ink-bracket-vs">
                  <em className={m.winnerName === m.aName ? 'ink-bracket-win' : undefined}>{m.aName}</em>
                  <span>對</span>
                  <em className={m.winnerName === m.bName ? 'ink-bracket-win' : undefined}>{m.bName}</em>
                </span>
                {m.pending && <span className="ink-bracket-tag">待戰</span>}
                {!m.pending && m.winnerName && (
                  <span className="ink-bracket-tag ink-bracket-tag--done">勝：{m.winnerName}</span>
                )}
                {!m.pending && !m.winnerName && !m.aName.includes('待定') && (
                  <span className="ink-bracket-tag">未開</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function InkHuashanPanel({
  state,
  onStart,
  onFight,
  onDismissReport,
  onCloseTournament,
}: Props) {
  const bracket = state.huashan;
  const season = getHuashanSeasonKey();
  const gate = canEnterHuashan(state);
  const pending = bracket ? getPendingHuashanMatch(bracket) : null;
  const lastLog = bracket?.lastDuelLog;
  const replay = bracket?.lastDuelReplay;
  // 論劍自動比武：每打完一場即刻播演出；之後可以重播
  const [watching, setWatching] = useState(false);
  const seenReplay = useRef(replay);
  useEffect(() => {
    if (replay && replay !== seenReplay.current) setWatching(true);
    seenReplay.current = replay;
  }, [replay]);

  return (
    <section className="ink-panel ink-huashan-panel ink-tab-pane" aria-label="華山論劍">
      <h3>華山論劍</h3>
      <p className="ink-note">
        每週一會，八強論劍。自動交手：雙方主修外功已得嘅卷逐招出手；其餘席位為江湖名手幻影。
      </p>
      <p className="ink-note ink-huashan-season">本期論劍：{huashanSeasonLabel(season)}</p>

      {!bracket && (
        <button
          type="button"
          className="ink-btn ink-btn--primary"
          disabled={!gate.ok}
          onClick={() => {
            onStart();
          }}
        >
          持帖報名
        </button>
      )}
      {!bracket && !gate.ok && <p className="ink-note ink-huashan-hint">{gate.reason}</p>}

      {bracket && (
        <>
          <p className="ink-note">
            <strong>{bracketProgressLabel(bracket)}</strong>
            {bracket.status === 'active' && pending && (
              <>
                {' '}
                · 對手「{pending.foe.name}」（武學 {pending.foe.martial}）
              </>
            )}
          </p>

          <BracketTreeView bracket={bracket} />

          {bracket.status === 'active' && pending && (
            <button
              type="button"
              className="ink-btn ink-btn--primary"
              onClick={() => {
                onFight();
              }}
            >
              赴戰
            </button>
          )}

          {watching && replay && <InkAutoBattleView replay={replay} onDone={() => setWatching(false)} />}

          {lastLog && lastLog.length > 0 && (
            <div className="ink-huashan-log">
              <h4 className="ink-subhead">交手紀要</h4>
              {replay && (
                <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setWatching(true)}>
                  重播上一場
                </button>
              )}
              <pre className="ink-epitaph-text ink-huashan-pre">{lastLog.join('\n')}</pre>
              <button
                type="button"
                className="ink-btn ink-btn--quiet"
                onClick={() => {
                  onDismissReport();
                }}
              >
                掩上紀要
              </button>
            </div>
          )}

          {bracket.status === 'completed' && (
            <button
              type="button"
              className="ink-btn ink-btn--ghost"
              onClick={() => {
                onCloseTournament();
              }}
            >
              離開論劍台
            </button>
          )}
        </>
      )}
    </section>
  );
}
