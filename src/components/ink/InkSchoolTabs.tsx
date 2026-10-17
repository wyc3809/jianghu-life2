import { SCHOOLS, primarySchoolOfSkill, schoolsOfSkill, type SchoolId } from '@data/redesign/schools';
import { getSkillDef } from '@data/skills/catalog';
import type { InkIconKey } from '../../ui/inkIcons';
import { InkIcon } from './InkIcon';

const ICONS: Record<SchoolId, InkIconKey> = {
  xueren: 'blood', lianhuan: 'swords', pojia: 'banner', zhidi: 'qi', jingang: 'censer', qingling: 'fan',
};

type Props = {
  value: SchoolId | 'all';
  onChange: (school: SchoolId | 'all') => void;
  allowAll?: boolean;
  counts?: Partial<Record<SchoolId, number>>;
  label?: string;
};

/** 六派用同款器物位圖＋文字；全部只用喺武學列表，抽卡一定先選一派。 */
export function InkSchoolTabs({ value, onChange, allowAll, counts, label = '流派分類' }: Props) {
  return <div className={`ink-school-tabs${allowAll ? ' has-all' : ''}`} role="group" aria-label={label}>
    {allowAll && <button type="button" aria-label="全部" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
      <InkIcon name="scroll" size={20} /><strong>全部</strong><small className="ink-school-focus">六派總覽</small>
    </button>}
    {SCHOOLS.map(school => <button type="button" key={school.id} className={`ink-school-choice ink-school-tag--${school.id}`}
      aria-label={`選${school.name}流派`} aria-pressed={value === school.id} onClick={() => onChange(school.id)}>
      <InkIcon name={ICONS[school.id]} size={20} /><strong>{school.name}</strong><small className="ink-school-focus">{school.focus}</small>{counts?.[school.id] !== undefined && <small>{counts[school.id]}</small>}
    </button>)}
  </div>;
}

/** 統一武學主流派標籤；人物配搭時另列原本嘅兼修適性。 */
export function InkSkillSchools({ id, related = false }: { id: string; related?: boolean }) {
  const def = getSkillDef(id), primary = primarySchoolOfSkill(def);
  const ids = [primary, ...(related ? schoolsOfSkill(def).filter(school => school !== primary) : [])].filter(Boolean) as SchoolId[];
  return <span className="ink-skill-schools">
    {ids.map(school => <i key={school} className={`ink-school-tag ink-school-tag--${school}${school === primary ? ' is-primary' : ''}`}
      aria-label={`${school === primary ? '主流派' : '兼修'} ${SCHOOLS.find(s => s.id === school)?.name}`}>
      {SCHOOLS.find(s => s.id === school)?.name}
    </i>)}
  </span>;
}
