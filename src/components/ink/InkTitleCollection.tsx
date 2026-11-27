import { useState } from 'react';
import { equippedTitles, titleCollection, titleTierColorClass, TITLE_SLOT_LIMIT, type TitleBonus } from '@core/life/titles';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { useLifeStore } from '../../store/lifeStore';
import './title-collection.css';

function bonusText(bonus: TitleBonus | undefined): string {
  if (!bonus) return '';
  const { attack, defense, hitBonus, evasion } = bonus;
  return [
    attack && `攻擊 +${attack}`,
    defense && `防禦 +${defense}`,
    hitBonus && `命中 +${Math.round(hitBonus * 100)}%`,
    evasion && `閃避 +${Math.round(evasion * 100)}%`,
  ].filter(Boolean).join(' · ');
}

export function InkTitleCollection({ state, busy }: { state: LifeGameState; busy: boolean }) {
  const [showLocked, setShowLocked] = useState(false);
  const setTitles = useLifeStore(s => s.setTitles);
  const collection = titleCollection(state);
  const equipped = equippedTitles(state).map(title => title.id);
  const earnedCount = collection.filter(title => title.unlocked).length;
  const rows = collection.filter(title => title.unlocked !== showLocked);

  return (
    <section className="ink-title-collection" aria-labelledby="player-titles-heading">
      <header className="ink-title-heading">
        <h2 id="player-titles-heading">稱號</h2>
        <span aria-live="polite">已裝備 {equipped.length}／{TITLE_SLOT_LIMIT}</span>
      </header>
      <p>主稱號顯示於角色名旁。已裝備稱號會在多人名冊展示，並提供戰鬥加成。</p>
      <ol className="ink-title-slots" aria-label="稱號裝備次序">
        {Array.from({ length: TITLE_SLOT_LIMIT }, (_, slot) => {
          const title = collection.find(item => item.id === equipped[slot]);
          return <li key={slot}>
            <span>{slot === 0 ? '主稱號' : `稱號 ${slot + 1}`}</span>
            <strong className={title && titleTierColorClass(title.tier)}>{title?.label ?? '未裝備'}</strong>
            {title && <button type="button" disabled={busy} onClick={() => setTitles(equipped.filter(id => id !== title.id))} aria-label={`卸下${title.label}`}>卸下</button>}
          </li>;
        })}
      </ol>
      <div className="ink-title-filters" role="group" aria-label="稱號篩選">
        <button type="button" aria-pressed={!showLocked} onClick={() => setShowLocked(false)}>已取得（{earnedCount}）</button>
        <button type="button" aria-pressed={showLocked} onClick={() => setShowLocked(true)}>未取得（{collection.length - earnedCount}）</button>
      </div>
      {!rows.length && <p>{showLocked ? '已集齊全部稱號。' : '尚未取得稱號。可查看各稱號的解鎖條件。'}</p>}
      <ul className="ink-title-catalogue">
        {rows.map(title => {
          const selected = equipped.includes(title.id);
          const bonus = bonusText(title.bonus);
          return <li key={title.id}>
            <div>
              <strong className={titleTierColorClass(title.tier)}>{title.label}</strong>
              <p>{title.requirement}</p>
              {bonus && <small>{bonus}</small>}
            </div>
            {title.unlocked && (
              selected ? <span>已裝備</span> : (
                <button type="button" aria-label={`裝備${title.label}`} disabled={busy || equipped.length >= TITLE_SLOT_LIMIT}
                  onClick={() => setTitles([...equipped, title.id])}>裝備</button>
              )
            )}
          </li>;
        })}
      </ul>
    </section>
  );
}
