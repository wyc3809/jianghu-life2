import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { SCHOOLS, primarySchoolOfSkill } from '@data/redesign/schools';
import { describeSchoolBonus, schoolTally } from '@core/life/schools';
import { martialSlots, supportMartialSlots, equippedMartialArts, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '@core/life/martialLoadout';
import { ownedVolumes } from '@core/life/volumes';
import { internalQiRegen } from '@core/life/martialTurn';
import { NATURAL_QI_REGEN_RATIO } from '@data/redesign/martialEconomyParams';

type Props = {
  state: LifeGameState;
  selected: string | null;
  busy: boolean;
  onEquip: (slot: number, id: string | null) => void;
  onCancel: () => void;
  onChoose: (slot: number) => void;
};

/** 五格外功加獨立內功及身法：點選武學後，由玩家指定空格或替換目標。 */
export function InkMainArts({ state, selected, busy, onEquip, onCancel, onChoose }: Props) {
  const slots = martialSlots(state.character);
  const support = supportMartialSlots(state.character);
  const selectedKind = selected ? getSkillDef(selected)?.kind : null;
  const active = schoolTally(state.character).filter(t => t.level !== 'none');
  const alreadyEquipped = selected !== null && equippedMartialArts(state.character).includes(selected);
  const regen = internalQiRegen(state.character);
  const amount = (value: number) => Number(value.toFixed(2)).toLocaleString('zh-Hant');
  return (
    <section className="ink-main-arts ink-loadout" aria-label="武學裝備">
      <header className="ink-loadout-heading"><strong>實戰配搭</strong><span>{slots.filter(Boolean).length}／5 門外功</span></header>
      <p className="ink-main-arts-label">外功五門、內功及身法各一門，可跨流派配搭。</p>
      <p className="ink-loadout-recovery">每回合自然回內 {amount(NATURAL_QI_REGEN_RATIO * 100)}%{regen.flat > 0 ? ` · 內功另回 ${amount(regen.flat)} 點` : regen.percent > 0 ? ` · 內功另回 ${amount(regen.percent * 100)}%` : ' · 未有內功回內加成'}</p>
      {selected && <div className="ink-loadout-selection" role="status">
        <strong>{skillLabel(selected)}</strong>
        <p>{alreadyEquipped ? '此武學已裝備，可先卸下再調整欄位。' : selectedKind !== 'external' ? `請在下方${selectedKind === 'internal' ? '內功' : '身法'}獨立欄位確認裝備。` : slots.every(Boolean) ? '外功五格已滿，請選擇要替換的欄位。' : '請選擇下方外功欄位，確認後裝備。'}</p>
        <button className="ink-btn ink-btn--quiet" type="button" onClick={onCancel}>取消選擇</button>
      </div>}
      {(selectedKind && selectedKind !== 'external' ? ['support', 'external'] as const : ['external', 'support'] as const).map(group => {
        const rows = group === 'external'
          ? slots.map((id, index) => ({ id, index, label: `${index + 1}`, kind: 'external' as const }))
          : [{ id: support.internal, index: INTERNAL_ART_SLOT, label: '內功', kind: 'internal' as const },
             { id: support.qinggong, index: QINGGONG_ART_SLOT, label: '身法', kind: 'qinggong' as const }];
        return <div key={group} className={`ink-loadout-${group}`}>
          {group === 'support' && <header className="ink-loadout-heading"><strong>內功與身法</strong><span>獨立欄位 · 不佔外功格數</span></header>}
          <ul className="ink-main-slots" aria-label={group === 'external' ? '五門外功' : '內功與身法獨立欄位'}>
            {rows.map(({id, index, label, kind}) => {
              const def = id ? getSkillDef(id) : undefined;
              const school = SCHOOLS.find(s => s.id === primarySchoolOfSkill(def));
              const target = kind === 'external' ? `欄位${index + 1}` : `${label}欄位`;
              const matches = selectedKind === kind;
              return <li key={index} className={`ink-main-slot ink-loadout-slot${id ? '' : ' is-empty'}`}>
                <span className="ink-main-slot-kind">{label}</span>
                <div className="ink-loadout-slot-info"><strong className="ink-main-slot-name">{id ? skillLabel(id) : `空置${kind === 'external' ? '欄位' : label}`}</strong>
                  <small>{def ? `${skillKindLabel(def.kind)}${school ? ` · ${school.name}` : ''}` : `選擇${kind === 'external' ? '外功' : label}裝入此格`}</small>
                  {id && kind === 'external' && <small>已得 {ownedVolumes(state.character, id).length}／7 卷 · 整套耗內 {def?.move?.qiCost ?? 0}</small>}</div>
                <div className="ink-loadout-slot-actions">
                  {!selected && <button type="button" className="ink-btn ink-btn--quiet" disabled={busy}
                    aria-label={`${id ? '更換' : '選擇'}${kind === 'external' ? `外功欄位${index + 1}` : `${label}欄位`}`} onClick={() => onChoose(index)}>{id ? '更換' : '選擇'}</button>}
                  {selected && matches && !alreadyEquipped ? <button type="button" className="ink-btn ink-btn--primary" disabled={busy}
                    aria-label={`${id ? '替換' : '裝備'}${skillLabel(selected)}至${target}`} onClick={() => onEquip(index, selected)}>{id ? '替換' : '裝備'}</button>
                    : id && (!selected || matches) ? <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} aria-label={`卸下${target}：${skillLabel(id)}`} onClick={() => onEquip(index, null)}>卸下</button> : null}
                </div>
              </li>;
            })}
          </ul>
        </div>;
      })}
      {!selected && <p className="ink-note">點選欄位的「選擇／更換」即可配搭；下方收藏保留完整武學詳情。</p>}
      {active.length > 0 && <details className="ink-loadout-synergy"><summary>配搭加成 · {active.length} 項生效</summary>
        <p className="ink-note">同派兩門小成、三門大成；同派裝備可計一門。此為額外加成，無須同派亦可裝備。</p>
        <ul className="ink-school-active">{active.map(t => <li key={t.school.id} className={`ink-school-row is-${t.level}`}>
          <span className={`ink-school-seal ink-school-tag--${t.school.id}`}>{t.school.name}</span>
          <span className="ink-school-level">{t.level === 'major' ? '大成' : '小成'}</span>
          <span className="ink-school-bonus">{describeSchoolBonus(t.level === 'major' ? t.school.major : t.school.minor)}{t.gear ? `（含裝備「${getGearDef(t.gear)?.name ?? ''}」）` : ''}</span>
        </li>)}</ul>
      </details>}
    </section>
  );
}
