import { useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  canFoundSect,
  canRecruitDisciple,
  FOUND_SECT_COST,
  RECRUIT_COST,
} from '@core/life/foundedSect';
import { rankName } from '@core/life/martialRanks';

type Props = {
  state: LifeGameState;
  onFound: (sectName: string) => void;
  onRecruit: () => void;
  onTeach: (discipleId: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  training: '在門受教',
  graduated: '學成出師',
  left: '離門而去',
  died: '已然身故',
};

export function InkSectFounderPanel({ state, onFound, onRecruit, onTeach }: Props) {
  const [draftName, setDraftName] = useState('');
  const sect = state.foundedSect;
  const foundGate = canFoundSect(state);
  const recruitGate = canRecruitDisciple(state);

  return (
    <section className="ink-panel ink-sect-founder-panel ink-tab-pane" aria-label="開宗立派">
      <h3>開宗立派</h3>

      {!sect && (
        <>
          <p className="ink-note">
            武學、名望俱足，年歲既長，可自立門戶，收徒傳功，另闢一支傳承（需銀両 {FOUND_SECT_COST} 兩）。
          </p>
          <label className="ink-field">
            <span>門號</span>
            <input
              type="text"
              placeholder={`如：${state.character.name}門`}
              value={draftName}
              maxLength={12}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="ink-btn ink-btn--primary"
            disabled={!foundGate.ok}
            onClick={() => onFound(draftName)}
          >
            開山立派
          </button>
          {!foundGate.ok && <p className="ink-note ink-sect-founder-hint">{foundGate.reason}</p>}
        </>
      )}

      {sect && (
        <>
          <p className="ink-note">
            <strong>{sect.name}</strong>　開山於{sect.foundedYear}年　門派聲望 {sect.fame}
          </p>
          <button
            type="button"
            className="ink-btn ink-btn--primary"
            disabled={!recruitGate.ok}
            onClick={onRecruit}
          >
            收徒（銀両 {RECRUIT_COST} 兩）
          </button>
          {!recruitGate.ok && <p className="ink-note ink-sect-founder-hint">{recruitGate.reason}</p>}

          {sect.disciples.length > 0 && (
            <ul className="ink-disciple-list">
              {sect.disciples.map((d) => (
                <li key={d.id} className="ink-disciple-card">
                  <p className="ink-disciple-name">
                    {d.name}　<span className="ink-disciple-status">{STATUS_LABEL[d.status]}</span>
                  </p>
                  <p className="ink-note">
                    資質 {d.aptitude}　忠誠 {d.loyalty}　階位「{rankName(d.rank)}」
                  </p>
                  {d.status === 'training' && (
                    <button
                      type="button"
                      className="ink-btn ink-btn--quiet"
                      onClick={() => onTeach(d.id)}
                    >
                      親自指點
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
