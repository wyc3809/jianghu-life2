import { useState } from 'react';
import { SCHOOLS, type SchoolId } from '@data/redesign/schools';
import { InkSchoolTabs } from './InkSchoolTabs';
import { GachaSheet } from './InkGachaReveal';

/** 人物收藏以冊頁選流派，不更改秘笈閣及其他模式的分類操作。 */
export function InkPersonSchoolTabs({ value, onChange, allowAll, label = '流派分類' }: {
  value: SchoolId | 'all'; onChange: (school: SchoolId | 'all') => void; allowAll?: boolean; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value === 'all' ? '全部流派' : SCHOOLS.find(school => school.id === value)?.name;
  return <>
    <button type="button" className="ink-btn ink-btn--quiet ink-person-school-choice" aria-label={label} aria-haspopup="dialog" onClick={() => setOpen(true)}>{selected}<span aria-hidden="true">›</span></button>
    {open && <GachaSheet title={label} onClose={() => setOpen(false)}><InkSchoolTabs value={value} allowAll={allowAll} label={label} onChange={school => { onChange(school); setOpen(false); }} /></GachaSheet>}
  </>;
}
