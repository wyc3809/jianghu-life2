import { useMemo, useState } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { useLifeStore } from '../../store/lifeStore';
import { LIFE_THEMES } from '@core/life/lifeVariance';
import {
  ORIGIN_EVENTS,
  originRoundLabel,
  resolveOriginPicks,
  type OriginPick,
} from '@core/life/originChronicle';

type Step = 'identity' | 'origin' | 'seal';

export function InkCreateScreen() {
  const newLife = useLifeStore((s) => s.newLife);
  const cancelCreate = useLifeStore((s) => s.cancelCreate);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [step, setStep] = useState<Step>('identity');
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<OriginPick[]>([]);

  const event = ORIGIN_EVENTS[round];
  const preview = useMemo(
    () => (picks.length === ORIGIN_EVENTS.length ? resolveOriginPicks(picks) : null),
    [picks],
  );

  const startLife = (finalPicks: OriginPick[]) => {
    const result = resolveOriginPicks(finalPicks);
    newLife({
      name: name.trim() || undefined,
      gender,
      birthplace: '千燈鎮',
      lifeTheme: result.lifeTheme,
      originBonuses: {
        attributes: result.attributes,
        nature: result.nature,
        chronicle: result.chronicle,
      },
    });
  };

  const onPick = (choiceId: string) => {
    if (!event) return;
    const next = [...picks, { eventId: event.id, choiceId }];
    setPicks(next);
    if (round + 1 < ORIGIN_EVENTS.length) {
      setRound(round + 1);
      return;
    }
    setStep('seal');
  };

  return (
    <div className="scroll-shell ink-enter">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <h1 className="ink-brand" style={{ fontSize: '2.2rem' }}>
          立卷
        </h1>
        <p className="ink-tagline">
          {step === 'identity'
            ? '出生地已定 · 千燈鎮'
            : step === 'origin'
              ? originRoundLabel(round)
              : '少時已定 · 落筆出鎮'}
        </p>
        <p className="ink-rule" aria-hidden />
      </header>

      {step === 'identity' && (
        <>
          <section className="ink-panel">
            <label className="ink-field">
              <span>姓名</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="不書則天賜一名"
                maxLength={8}
              />
            </label>
            <label className="ink-field">
              <span>性別</span>
              <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </label>
            <p className="ink-note">
              接下來會翻過幾頁少時往事。你的抉擇會改寫出生時的根骨、心性，並定下此生題眼——不是下拉選單，而是你走過的路。
            </p>
          </section>
          <div className="ink-cta-stack">
            <button
              type="button"
              className="ink-btn ink-btn--primary"
              onClick={() => {
                setPicks([]);
                setRound(0);
                setStep('origin');
              }}
            >
              翻開少時
            </button>
            <button type="button" className="ink-btn ink-btn--ghost" onClick={() => cancelCreate()}>
              回卷
            </button>
          </div>
        </>
      )}

      {step === 'origin' && event && (
        <>
          <section className="ink-panel ink-event" aria-label="少時往事">
            <p className="ink-event-year">{originRoundLabel(round)}</p>
            <h3 className="ink-write-in">{event.title}</h3>
            <p className="ink-event-body ink-write-in">{event.body}</p>
            <div className="ink-choice-list ink-choice-list--reveal" style={{ marginTop: 14 }}>
              {event.choices.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  className="ink-choice"
                  style={{ ['--i' as string]: i }}
                  onClick={() => onPick(ch.id)}
                >
                  <span className="ink-choice-mark">{['甲', '乙', '丙', '丁', '戊', '己'][i] ?? '註'}</span>
                  {ch.text}
                </button>
              ))}
            </div>
          </section>
          <div className="ink-cta-stack">
            <button
              type="button"
              className="ink-btn ink-btn--ghost"
              onClick={() => {
                if (round === 0) {
                  setStep('identity');
                  setPicks([]);
                  return;
                }
                setRound(round - 1);
                setPicks((p) => p.slice(0, -1));
              }}
            >
              回上一頁
            </button>
          </div>
        </>
      )}

      {step === 'seal' && preview && (
        <>
          <section className="ink-panel">
            <h3 style={{ marginTop: 0, letterSpacing: '0.14em' }}>少時已落定</h3>
            <p className="ink-note">
              題眼將是「{LIFE_THEMES[preview.lifeTheme].label}」——{LIFE_THEMES[preview.lifeTheme].vow}
            </p>
            <ul className="ink-note" style={{ paddingLeft: '1.1em', margin: '8px 0 0' }}>
              {preview.chronicle.map((line) => (
                <li key={line}>{line.replace(/^【少時·.+?】/, '')}</li>
              ))}
            </ul>
            <p className="ink-note" style={{ marginTop: 12 }}>
              十六歲辭親出鎮。根骨福緣，已由少時抉擇改寫一寸。
            </p>
          </section>
          <div className="ink-cta-stack">
            <button
              type="button"
              className="ink-btn ink-btn--primary"
              onClick={() => startLife(picks)}
            >
              落筆開卷
            </button>
            <button
              type="button"
              className="ink-btn ink-btn--ghost"
              onClick={() => {
                setStep('origin');
                setRound(ORIGIN_EVENTS.length - 1);
                setPicks((p) => p.slice(0, -1));
              }}
            >
              重選末頁
            </button>
          </div>
        </>
      )}
    </div>
  );
}
