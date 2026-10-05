import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillLabel } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { SCHOOLS, schoolsOfSkill } from '@data/redesign/schools';
import { MAIN_ART_KINDS, MAIN_ART_LABEL, describeSchoolBonus, mainArts, schoolTally } from '@core/life/schools';

const SCHOOL_NAME = Object.fromEntries(SCHOOLS.map((s) => [s.id, s.name]));

/** 武學頁頂：三主修＋流派協同（design/agreed-design-2026-10.md §3） */
export function InkMainArts({ state }: { state: LifeGameState }) {
  const c = state.character;
  const mains = mainArts(c);
  const tally = schoolTally(c);
  const active = tally.filter((t) => t.level !== 'none');
  const near = tally.filter((t) => t.level === 'none' && t.count === 1).slice(0, 3);
  return (
    <section className="ink-main-arts" aria-label="主修與流派">
      <p className="ink-main-arts-label">主修 · 每類一門，同派湊兩門小成、三門大成（裝備當一門）</p>
      <ul className="ink-main-slots">
        {MAIN_ART_KINDS.map((kind) => {
          const id = mains[kind];
          const schools = id ? schoolsOfSkill(getSkillDef(id)) : [];
          return (
            <li key={kind} className={`ink-main-slot${id ? '' : ' is-empty'}`}>
              <span className="ink-main-slot-kind">{MAIN_ART_LABEL[kind]}</span>
              <span className="ink-main-slot-name">{id ? skillLabel(id) : '未學'}</span>
              <span className="ink-main-slot-tags">
                {schools.map((s) => (
                  <i key={s} className={`ink-school-tag ink-school-tag--${s}`}>
                    {SCHOOL_NAME[s]}
                  </i>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      {active.length > 0 ? (
        <ul className="ink-school-active">
          {active.map((t) => (
            <li key={t.school.id} className={`ink-school-row is-${t.level}`}>
              <span className={`ink-school-seal ink-school-tag--${t.school.id}`}>{t.school.name}</span>
              <span className="ink-school-level">{t.level === 'major' ? '大成' : '小成'}</span>
              <span className="ink-school-bonus">
                {describeSchoolBonus(t.level === 'major' ? t.school.major : t.school.minor)}
                {t.gear ? `（含裝備「${getGearDef(t.gear)?.name ?? ''}」）` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ink-note">未成流派——將同派武學放入主修，或者換件同派裝備。</p>
      )}
      {near.length > 0 && (
        <p className="ink-note ink-school-near">
          差一門：{near.map((t) => `${t.school.name}（${t.school.blurb}）`).join('、')}
        </p>
      )}
    </section>
  );
}
