import { useMemo, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getGearDef, rarityLabel, type GearDef, type GearRarity, type GearSlot } from '@data/equipment/catalog';
import { displayGearName, listGearAffixes, formatAffixDisplay } from '@data/equipment/affixes';
import { previewEquipDelta } from '@core/life/equipment';
import { EQUIPMENT_LABEL, EQUIPMENT_RARITIES, equipmentArtUrl, equipmentCandidates, equipmentPiecePower, equipmentStatRows, type EquipmentSort } from '../../ui/personEquipment';
import { inkArtUrl } from '../../ui/inkAssets';
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
    setChooser(null); setDetails(false); grid.current?.scrollTo({ top: 0 });
  };
  const compareColumn = (def: GearDef | null | undefined, candidate: boolean) => <div className="ink-equipment-column">
    <h3>{candidate ? '選中裝備' : '目前裝備'}</h3>
    <div className="ink-equipment-column-body">
      {def ? <img src={equipmentArtUrl(def)} alt="" width="72" height="72" /> : <span className="ink-equipment-empty-art">空</span>}
      <div className="ink-equipment-column-values">
        <button type="button" className="ink-equipment-name" disabled={!def} title={def ? displayGearName(def) : undefined}
          aria-label={candidate ? '查看選中裝備詳情' : '查看目前裝備詳情'} onClick={() => {setDetails(true);setChooser(null);grid.current?.scrollTo({top:0});}}>
          {def ? displayGearName(def) : candidate ? '尚未選擇' : '空置'}
        </button>
        <dl className="ink-equipment-stat-deltas">{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{candidate ? row.after : row.before}{candidate && row.delta !== 0 && <span className={row.delta < 0 ? 'is-down' : 'is-up'}>{row.delta > 0 ? '+' : '−'}{Math.abs(row.delta)}</span>}</dd></div>)}</dl>
      </div>
    </div>
  </div>;
  return <InkPersonSheet title={`更換${EQUIPMENT_LABEL[slot]}`} onClose={onClose} className="ink-equipment-picker">
    <p className="ink-equipment-context ink-visually-hidden">{preset === 'normal' ? '普通配搭' : '對戰配搭'}，符合條件 {candidates.length} 件。點選下方裝備名稱可檢視完整屬性與詞綴。</p>
    <div className="ink-equipment-filters">
      <button type="button" aria-expanded={chooser === 'rarity'} onClick={() => {setDetails(false);setChooser(chooser === 'rarity' ? null : 'rarity');}}>{rarity === 'all' ? '全部品質' : rarityLabel[rarity]}<img src={inkArtUrl('art/parchment-ui/icon-caret.webp')} alt="" width="12" height="8" /></button>
      <button type="button" aria-expanded={chooser === 'sort'} onClick={() => {setDetails(false);setChooser(chooser === 'sort' ? null : 'sort');}}>{sort === 'power' ? '戰力優先' : sort === 'rarity' ? '品質優先' : '名稱排序'}<img src={inkArtUrl('art/parchment-ui/icon-caret.webp')} alt="" width="12" height="8" /></button>
    </div>
    <div className="ink-equipment-bag" ref={grid} role="region" aria-label="候選裝備">
      {chooser ? <div className="ink-equipment-options" aria-label={chooser === 'rarity' ? '品質篩選' : '裝備排序'}>
        {(chooser === 'rarity' ? [{ id: 'all', label: '全部品質' }, ...EQUIPMENT_RARITIES.map(id => ({ id, label: rarityLabel[id] }))] : [{ id: 'power', label: '戰力優先' }, { id: 'rarity', label: '品質優先' }, { id: 'name', label: '名稱排序' }]).map(item => <button type="button" key={item.id} aria-pressed={(chooser === 'rarity' ? rarity : sort) === item.id} onClick={() => chooseFilter(item.id)}>{item.label}</button>)}
      </div> : details ? <div className="ink-equipment-affixes">
        <button type="button" onClick={() => setDetails(false)}>返回裝備列表</button>
        {([current,selected].filter((def,index,all): def is GearDef => Boolean(def && all.findIndex(d=>d?.id===def.id)===index))).map(def => <article key={def.id}>
          <h3>{displayGearName(def)}</h3><p>{rarityLabel[def.rarity]} · 裝備戰力 {equipmentPiecePower(c,def)}</p><p>{def.description}</p><ul>{listGearAffixes(def).map((line,i)=><li key={i}>{formatAffixDisplay(line)}</li>)}</ul>
        </article>)}
        {preview && <p>此套裝備戰力 {preview.powerBefore} → {preview.powerAfter}</p>}
      </div> : <>
        <div className="ink-equipment-grid">
          {candidates.map(def => <button type="button" key={def.id} className={`ink-equipment-item is-${def.rarity}`} data-gear-id={def.id}
            aria-label={`預覽${displayGearName(def)}，${rarityLabel[def.rarity]}，裝備戰力${equipmentPiecePower(c,def)}${currentId === def.id ? '，目前已裝備' : ''}`} aria-pressed={selectedId === def.id} onClick={() => { setSelectedId(def.id); setDetails(false); }}>
            <img src={equipmentArtUrl(def)} alt="" width="96" height="72" /><strong>{displayGearName(def)}</strong><span>戰力 <b>{equipmentPiecePower(c,def)}</b></span>
          </button>)}
        </div>
        {!candidates.length && <p className="ink-equipment-empty">尚未持有符合條件的{EQUIPMENT_LABEL[slot]}。</p>}
      </>}
    </div>
    <section className="ink-equipment-compare" aria-label="換裝比較">
      {compareColumn(current,false)}<img className="ink-equipment-arrow" src={inkArtUrl('art/parchment-ui/icon-arrow.webp')} alt="更換為" width="34" height="34" />{compareColumn(selected,true)}
      <span className="ink-visually-hidden">{rows.map(row=>`${row.label} ${row.before} → ${row.after}`).join('，')}</span>
    </section>
    {error && <p className="ink-equipment-error" role="alert">{error}</p>}
    <button type="button" className="ink-equipment-confirm" disabled={busy || !changed} onClick={() => {
      if (gate.current || busy || !changed || !selectedId || !c.gear.includes(selectedId) || getGearDef(selectedId)?.slot !== slot) return;
      gate.current = true;
      if(onEquip(selectedId))onClose();else {gate.current=false;setError('未能更換裝備，請於交手結束後重試。');}
    }}>{selectedId === currentId && valid ? '目前已裝備' : '換上'}</button>
  </InkPersonSheet>;
}
