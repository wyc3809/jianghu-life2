import { useMemo, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getGearDef, rarityLabel, type GearRarity, type GearSlot } from '@data/equipment/catalog';
import { displayGearName, listGearAffixes, formatAffixDisplay } from '@data/equipment/affixes';
import { previewEquipDelta } from '@core/life/equipment';
import { EQUIPMENT_LABEL, EQUIPMENT_RARITIES, equipmentArtUrl, equipmentCandidates, equipmentStatRows, type EquipmentSort } from '../../ui/personEquipment';
import { InkPersonSheet } from './InkPersonSheet';

/** 揀選只預覽；確認才交回既有換裝指令，不派獎、不消耗或改動另一套配搭。 */
export function InkEquipmentPicker({ state, slot, preset, busy, onEquip, onClose }: {
  state: LifeGameState; slot: GearSlot; preset: 'normal' | 'duel'; busy: boolean; onEquip: (id: string) => boolean; onClose: () => void;
}) {
  const c = state.character, currentId = c.equipment?.[slot];
  const [selectedId, setSelectedId] = useState<string | null>(currentId ?? null);
  const [rarity, setRarity] = useState<GearRarity | 'all'>('all');
  const [sort, setSort] = useState<EquipmentSort>('power');
  const [chooser, setChooser] = useState<'rarity' | 'sort' | null>(null);
  const [details, setDetails] = useState(false);
  const [error, setError] = useState('');
  const gate = useRef(false), grid = useRef<HTMLDivElement>(null);
  const candidates = useMemo(() => equipmentCandidates(c, slot, rarity, sort), [c, slot, rarity, sort]);
  const current = currentId ? getGearDef(currentId) : null;
  const selected = selectedId && c.gear.includes(selectedId) ? getGearDef(selectedId) : null;
  const valid = Boolean(selected && selected.slot === slot);
  const changed = valid && selectedId !== currentId;
  const preview = valid ? previewEquipDelta(c, selectedId!) : null;
  const rows = equipmentStatRows(current, selected);
  const chooseFilter = (value: string) => {
    if (chooser === 'rarity') setRarity(value as GearRarity | 'all'); else setSort(value as EquipmentSort);
    setChooser(null); grid.current?.scrollTo({ top: 0 });
  };
  return <InkPersonSheet title={`更換${EQUIPMENT_LABEL[slot]}`} onClose={onClose} className="ink-equipment-picker">
    <div className="ink-equipment-context"><span>{preset === 'normal' ? '普通配搭' : '對戰配搭'}</span><span>{candidates.length} 件</span></div>
    <div className="ink-equipment-filters">
      <button type="button" aria-expanded={chooser === 'rarity'} onClick={() => setChooser(chooser === 'rarity' ? null : 'rarity')}>{rarity === 'all' ? '全部品質' : rarityLabel[rarity]} ▾</button>
      <button type="button" aria-expanded={chooser === 'sort'} onClick={() => setChooser(chooser === 'sort' ? null : 'sort')}>{sort === 'power' ? '戰意優先' : sort === 'rarity' ? '品質優先' : '名稱排序'} ▾</button>
    </div>
    <div className="ink-equipment-bag" ref={grid} role="region" aria-label="候選裝備">
      {chooser ? <div className="ink-equipment-options" aria-label={chooser === 'rarity' ? '品質篩選' : '裝備排序'}>
        {(chooser === 'rarity' ? [{ id: 'all', label: '全部品質' }, ...EQUIPMENT_RARITIES.map(id => ({ id, label: rarityLabel[id] }))] : [{ id: 'power', label: '戰意優先' }, { id: 'rarity', label: '品質優先' }, { id: 'name', label: '名稱排序' }]).map(item => <button type="button" key={item.id} aria-pressed={(chooser === 'rarity' ? rarity : sort) === item.id} onClick={() => chooseFilter(item.id)}>{item.label}</button>)}
      </div> : <>
        <div className="ink-equipment-grid">
          {candidates.map(def => <button type="button" key={def.id} className={`ink-equipment-item is-${def.rarity}`} data-gear-id={def.id}
            aria-label={`預覽${displayGearName(def)}`} aria-pressed={selectedId === def.id} onClick={() => { setSelectedId(def.id); setDetails(false); }}>
            <img src={equipmentArtUrl(def)} alt="" width="80" height="80" /><strong>{displayGearName(def)}</strong><span>{rarityLabel[def.rarity]}{currentId === def.id ? ' · 已裝備' : ''}</span>
          </button>)}
        </div>
        {!candidates.length && <p className="ink-equipment-empty">尚未持有符合條件的{EQUIPMENT_LABEL[slot]}。</p>}
        {selected && <div className="ink-equipment-affixes"><button type="button" aria-expanded={details} onClick={() => setDetails(!details)}>{details ? '收起詞綴' : '查看選中裝備詞綴'}</button>
          {details && <><h3>{displayGearName(selected)}</h3><p>{selected.description}</p><ul>{listGearAffixes(selected).map((line, i) => <li key={i}>{formatAffixDisplay(line)}</li>)}</ul></>}
        </div>}
      </>}
    </div>
    <section className="ink-equipment-compare" aria-label="換裝比較">
      <div className="ink-equipment-compare-names"><div><small>目前裝備</small><strong title={current ? displayGearName(current) : '空置'}>{current ? displayGearName(current) : '空置'}</strong></div><div><small>選中裝備</small><strong title={selected ? displayGearName(selected) : '尚未選擇'}>{selected ? displayGearName(selected) : '尚未選擇'}</strong></div></div>
      {valid ? <><dl className="ink-equipment-stat-deltas">{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.before} → {row.after} <span className={row.delta < 0 ? 'is-down' : row.delta > 0 ? 'is-up' : ''}>{row.delta ? `${row.delta > 0 ? '＋' : ''}${row.delta}` : '—'}</span></dd></div>)}</dl>
        {preview && <p className="ink-equipment-power">裝備戰意 {preview.powerBefore} → {preview.powerAfter}</p>}</> : <p>點選裝備查看比較，確認後才會換上。</p>}
    </section>
    {error && <p className="ink-equipment-error" role="alert">{error}</p>}
    <button type="button" className="ink-equipment-confirm" disabled={busy || !changed} onClick={() => {
      if (gate.current || busy || !changed || !selectedId || !c.gear.includes(selectedId) || getGearDef(selectedId)?.slot !== slot) return;
      gate.current = true;
      if(onEquip(selectedId))onClose();else {gate.current=false;setError('未能更換裝備，請於交手結束後重試。');}
    }}>{selectedId === currentId && valid ? '目前已裝備' : '換上'}</button>
  </InkPersonSheet>;
}
