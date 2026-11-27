import { useState, type ComponentProps } from 'react';
import { InkJianghuComicScene } from './InkJianghuComicScene';
import { InkSectFounderPanel } from './InkSectFounderPanel';
import { InkSectMembership } from './InkPracticePanel';

type Props = ComponentProps<typeof InkSectFounderPanel> &
  Pick<ComponentProps<typeof InkSectMembership>, 'busy' | 'onPractice'> & {
    onWar?: () => void;
  };

export function InkJianghuSectPanel({ state, day, busy, onPractice, onWar, onFound, onRecruit, onTeach }: Props) {
  const [founding, setFounding] = useState(false);
  const sect = state.character.sectId ? state.sects[state.character.sectId] : null;

  return <section className="ink-panel ink-tab-pane" aria-label="門派">
    <h3>門派</h3>
    <InkJianghuComicScene kind="sect" />
    <nav className="ink-jianghu-sect-menu" aria-label="門派事務">
      <button type="button" className="ink-btn ink-btn--quiet" aria-pressed={!founding} onClick={() => setFounding(false)}>拜師與門務</button>
      <button type="button" className="ink-btn ink-btn--quiet" aria-pressed={founding} onClick={() => setFounding(true)}>
        {state.foundedSect ? '自立門戶' : '開宗立派'}
      </button>
      {onWar && <button type="button" className="ink-btn ink-btn--quiet" onClick={onWar}>門派會武</button>}
    </nav>
    {founding ? <InkSectFounderPanel state={state} day={day} onFound={onFound} onRecruit={onRecruit} onTeach={onTeach} /> : <>
      <h4>{sect?.name ?? '擇門拜師'}</h4>
      <InkSectMembership state={state} day={day} busy={busy} onPractice={onPractice} />
    </>}
  </section>;
}
