import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getGearDef, rarityLabel, RARITY_COLOR_CLASS } from '@data/equipment/catalog';
import { SLOT_LABEL, displayGearName } from '@data/equipment/affixes';
import { formatGearFullSummary } from '@data/equipment/catalog';
import { previewEquipDelta } from '@core/life/equipment';

type Props = {
  state: LifeGameState;
  onEquip: () => void;
  onKeep: () => void;
};

export function InkGearCompareModal({ state, onEquip, onKeep }: Props) {
  const gearId = state.pendingGearCompare?.gearId;
  if (!gearId) return null;
  const def = getGearDef(gearId);
  if (!def) return null;

  const c = state.character;
  const equippedId = c.equipment?.[def.slot] ?? null;
  const equippedDef = equippedId ? getGearDef(equippedId) : undefined;
  const preview = previewEquipDelta(c, gearId);

  return createPortal(
    <div className="ink-modal" role="dialog" aria-modal="true" aria-label="獲得新裝備">
      <div className="ink-modal-card ink-gear-compare-card">
        <header className="ink-settings-head">
          <h3>獲得新裝備</h3>
        </header>

        <p className="ink-gear-compare-slot">{SLOT_LABEL[def.slot]}</p>

        <div className="ink-gear-compare-cols">
          <div className="ink-gear-compare-col">
            <p className="ink-gear-compare-label">現有</p>
            {equippedDef ? (
              <>
                <strong className={`ink-gear-name ${RARITY_COLOR_CLASS[equippedDef.rarity]}`}>
                  {displayGearName(equippedDef)}
                </strong>
                <p className="ink-gear-meta">{rarityLabel[equippedDef.rarity]}</p>
                <p className="ink-gear-compare-summary">{formatGearFullSummary(equippedDef)}</p>
              </>
            ) : (
              <p className="ink-gear-empty">此槽尚空</p>
            )}
          </div>
          <div className="ink-gear-compare-col">
            <p className="ink-gear-compare-label">新獲</p>
            <strong className={`ink-gear-name ${RARITY_COLOR_CLASS[def.rarity]}`}>
              {displayGearName(def)}
            </strong>
            <p className="ink-gear-meta">{rarityLabel[def.rarity]}</p>
            <p className="ink-gear-compare-summary">{formatGearFullSummary(def)}</p>
          </div>
        </div>

        {preview && (
          <p className={`ink-gear-compare-delta${preview.powerDelta < 0 ? ' ink-gear-compare-delta--down' : ''}`}>
            {preview.summary}
          </p>
        )}

        <div className="ink-cta-stack">
          <button type="button" className="ink-btn ink-btn--primary" onClick={onEquip}>
            換上
          </button>
          <button type="button" className="ink-btn ink-btn--ghost" onClick={onKeep}>
            先收好
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
