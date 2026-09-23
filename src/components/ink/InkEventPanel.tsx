import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { InkEventBanner } from './InkDecor';
import { pickAiEventBanner, aiEventBannerUrl } from '../../ui/inkAiCatalog';
import { displayChoiceText } from '@core/life/playerText';
import { EVENT_ACTION_POINT_COST, hasEnoughActionPoints } from '@core/life/actionPoints';

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

  return (
    <section className="ink-panel ink-event ink-event--focus" aria-label="待決之事">
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
      <div
        className={`ink-choice-list ink-choice-list--dock${choicesReady ? ' ink-choice-list--reveal' : ' ink-choice-list--await'}`}
      >
        {eligibleChoices.map((ch, i) => (
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
            {displayChoiceText(ch.text, ch.id)}
          </button>
        ))}
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
