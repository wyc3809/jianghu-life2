/**
 * 祖祠：花祖蔭點（天賦加點、家傳武學）。規則見 design/gdd/ancestral-merit.md。
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { talentCost } from '@core/life/ancestry';
import { ART_UNLOCK_COST, SECOND_SLOT_COST, TALENT_MAX_LEVEL, TALENT_STEP } from '@data/ancestry/tuning';
import { getSkillDef } from '@data/skills/catalog';
import { useAncestryStore } from '../../store/ancestryStore';

export function InkAncestryPanel({ onClose }: { onClose: () => void }) {
  const meta = useAncestryStore((s) => s.meta);
  const buyTalent = useAncestryStore((s) => s.buyTalent);
  const unlockArt = useAncestryStore((s) => s.unlockArt);
  const buySecondSlot = useAncestryStore((s) => s.buySecondSlot);
  const toggleFamilyArt = useAncestryStore((s) => s.toggleFamilyArt);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const arts = meta.artsSeen.map((id) => ({ id, def: getSkillDef(id) })).filter((a) => a.def);

  return createPortal(
    <div className="ink-modal" role="dialog" aria-modal="true" aria-label="祖祠" onClick={onClose}>
      <div className="ink-modal-card ink-ancestry" onClick={(e) => e.stopPropagation()}>
        <header className="ink-ancestry-head">
          <h3>祖祠</h3>
          <p className="ink-ancestry-points">
            祖蔭 <b>{meta.points}</b> 點
            <span>
              歷 {meta.lives} 世 · 共得 {meta.earnedTotal}
            </span>
          </p>
        </header>

        <section aria-label="天賦加點">
          <p className="ink-ancestry-label">天賦 · 每級開局＋{TALENT_STEP}</p>
          {wuxiaAttributeKeys.map((k) => {
            const lv = meta.talents[k] ?? 0;
            const maxed = lv >= TALENT_MAX_LEVEL;
            const cost = talentCost(lv);
            return (
              <div key={k} className="ink-ancestry-row">
                <span className="ink-ancestry-name">{wuxiaAttributeLabels[k]}</span>
                <span className="ink-ancestry-pips" aria-label={`${lv}／${TALENT_MAX_LEVEL} 級`}>
                  {Array.from({ length: TALENT_MAX_LEVEL }, (_, i) => (
                    <i key={i} className={i < lv ? 'is-on' : undefined} />
                  ))}
                </span>
                <span className="ink-ancestry-bonus">{lv ? `＋${lv * TALENT_STEP}` : ''}</span>
                <button
                  type="button"
                  className="ink-btn ink-btn--quiet ink-ancestry-buy"
                  disabled={maxed || meta.points < cost}
                  onClick={() => buyTalent(k)}
                >
                  {maxed ? '已滿' : `加 · ${cost}`}
                </button>
              </div>
            );
          })}
        </section>

        <section aria-label="家傳武學">
          <p className="ink-ancestry-label">
            家傳武學 · 已選 {meta.familyArts.length}／{meta.familySlots}
            {meta.familySlots < 2 && (
              <button
                type="button"
                className="ink-btn ink-btn--quiet ink-ancestry-slot"
                disabled={meta.points < SECOND_SLOT_COST}
                onClick={() => buySecondSlot()}
              >
                開第二格 · {SECOND_SLOT_COST}
              </button>
            )}
          </p>
          {arts.length === 0 ? (
            <p className="ink-note">武學譜未有記載——今世學到嘅武學，死後會記入譜中，下一世可以解鎖。</p>
          ) : (
            arts.map(({ id, def }) => {
              const unlocked = meta.unlockedArts.includes(id);
              const chosen = meta.familyArts.includes(id);
              return (
                <div key={id} className={`ink-ancestry-row${chosen ? ' is-chosen' : ''}`}>
                  <span className="ink-ancestry-name ink-ancestry-art">{def!.name}</span>
                  {unlocked ? (
                    <button
                      type="button"
                      className={`ink-btn ${chosen ? 'ink-btn--primary' : 'ink-btn--quiet'} ink-ancestry-buy`}
                      aria-pressed={chosen}
                      disabled={!chosen && meta.familyArts.length >= meta.familySlots}
                      onClick={() => toggleFamilyArt(id)}
                    >
                      {chosen ? '家傳中' : '定為家傳'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ink-btn ink-btn--quiet ink-ancestry-buy"
                      disabled={meta.points < ART_UNLOCK_COST}
                      onClick={() => unlockArt(id)}
                    >
                      解鎖 · {ART_UNLOCK_COST}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </section>

        <p className="ink-note ink-note--center">祖蔭跨世永存；下一世開局自動受用。</p>
        <button ref={closeRef} type="button" className="ink-btn ink-btn--ghost" onClick={onClose}>
          掩門
        </button>
      </div>
    </div>,
    document.body,
  );
}
