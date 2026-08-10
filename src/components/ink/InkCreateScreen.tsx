import { useState } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { useLifeStore } from '../../store/lifeStore';
import { LIFE_THEME_IDS, LIFE_THEMES, type LifeThemeId } from '@core/life/lifeVariance';

export function InkCreateScreen() {
  const newLife = useLifeStore((s) => s.newLife);
  const cancelCreate = useLifeStore((s) => s.cancelCreate);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [lifeTheme, setLifeTheme] = useState<LifeThemeId | 'fate'>('fate');

  return (
    <div className="scroll-shell ink-enter">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <h1 className="ink-brand" style={{ fontSize: '2.2rem' }}>
          立卷
        </h1>
        <p className="ink-tagline">出生地已定 · 千燈鎮</p>
        <p className="ink-rule" aria-hidden />
      </header>

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
        <label className="ink-field">
          <span>人生題眼</span>
          <select
            value={lifeTheme}
            onChange={(e) => setLifeTheme(e.target.value as LifeThemeId | 'fate')}
          >
            <option value="fate">天定（隨機）</option>
            {LIFE_THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {LIFE_THEMES[id].label} — {LIFE_THEMES[id].vow}
              </option>
            ))}
          </select>
        </label>
        <p className="ink-note">
          題眼會改你往後翻到的路：報仇多刀影，發財多市聲，避世多靜月。選項亦會關路，不只加減數。
        </p>
        <p className="ink-note">十六歲辭親出鎮。根骨福緣，落筆方見。</p>
      </section>

      <div className="ink-cta-stack">
        <button
          type="button"
          className="ink-btn ink-btn--primary"
          onClick={() => {
            newLife({
              name: name.trim() || undefined,
              gender,
              birthplace: '千燈鎮',
              lifeTheme,
            });
          }}
        >
          落筆開卷
        </button>
        <button
          type="button"
          className="ink-btn ink-btn--ghost"
          onClick={() => {
            cancelCreate();
          }}
        >
          回卷
        </button>
      </div>
    </div>
  );
}
