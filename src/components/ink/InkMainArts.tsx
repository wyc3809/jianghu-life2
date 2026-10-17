import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { SCHOOLS, primarySchoolOfSkill } from '@data/redesign/schools';
import { describeSchoolBonus, schoolTally } from '@core/life/schools';
import { martialSlots } from '@core/life/martialLoadout';

type Props = {
  state: LifeGameState;
  selected: string | null;
  busy: boolean;
  onEquip: (slot: number, id: string | null) => void;
  onCancel: () => void;
};

/** 五格實戰武學：點選武學後，由玩家指定空格或替換目標。 */
export function InkMainArts({ state, selected, busy, onEquip, onCancel }: Props) {
  const slots = martialSlots(state.character);
  const active = schoolTally(state.character).filter(t => t.level !== 'none');
  const alreadyEquipped = selected !== null && slots.includes(selected);
  return (
    <section className="ink-main-arts ink-loadout" aria-label="武學裝備">
      <header className="ink-loadout-heading"><strong>實戰武學</strong><span>{slots.filter(Boolean).length}／5 門</span></header>
      <p className="ink-main-arts-label">最多裝備五門，外功、內功與身法均可自由配搭。<br />流派僅用於抽卡分類，不限制裝備。</p>
      {selected && <div className="ink-loadout-selection" role="status">
        <strong>{skillLabel(selected)}</strong>
        <p>{alreadyEquipped ? '此武學已裝備，可先卸下再調整欄位。' : slots.every(Boolean) ? '五格已滿，請選擇要替換的欄位。' : '請選擇下方欄位，確認後裝備。'}</p>
        <button className="ink-btn ink-btn--quiet" type="button" onClick={onCancel}>取消選擇</button>
      </div>}
      <ul className="ink-main-slots">
        {slots.map((id, index) => {
          const def = id ? getSkillDef(id) : undefined;
          const school = SCHOOLS.find(s => s.id === primarySchoolOfSkill(def));
          return <li key={index} className={`ink-main-slot ink-loadout-slot${id ? '' : ' is-empty'}`}>
            <span className="ink-main-slot-kind">{index + 1}</span>
            <div className="ink-loadout-slot-info"><strong className="ink-main-slot-name">{id ? skillLabel(id) : '空置欄位'}</strong>
              <small>{def ? `${skillKindLabel(def.kind)}${school ? ` · ${school.name}` : ''}` : '可裝備任何流派或類型的武學'}</small></div>
            <div className="ink-loadout-slot-actions">
              {selected && !alreadyEquipped ? <button type="button" className="ink-btn ink-btn--primary" disabled={busy}
                aria-label={`${id ? '替換' : '裝備'}${skillLabel(selected)}至欄位${index + 1}`} onClick={() => onEquip(index, selected)}>{id ? '替換' : '裝備'}</button>
                : id ? <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} aria-label={`卸下欄位${index + 1}：${skillLabel(id)}`} onClick={() => onEquip(index, null)}>卸下</button> : null}
            </div>
          </li>;
        })}
      </ul>
      {!selected && <p className="ink-note">在下方選擇武學，再指定裝備欄位。只有已裝備武學參與出招及被動加成。</p>}
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
