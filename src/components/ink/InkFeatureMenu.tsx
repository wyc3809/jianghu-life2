import { InkIcon } from './InkIcon';
import type { InkIconKey } from '../../ui/inkIcons';
import './jianghu.css';
import { InkJianghuMap } from './InkJianghuMap';

export interface InkFeatureEntry<Id extends string> {
  id: Id;
  title: string;
  icon: InkIconKey;
  hint: string;
  badge?: string;
}

/** 沿用人物／修煉嘅器物牌章，先選功能再讀內容。 */
export function InkFeatureMenu<Id extends string>({ label, entries, onOpen }: {
  label: string; entries: InkFeatureEntry<Id>[]; onOpen: (id: Id) => void;
}) {
  return <nav className="ink-feature-menu" aria-label={label}><ul className="ink-bitlife-list ink-feature-list">
    {entries.map(entry => <li key={entry.id}><button type="button" className="ink-bitlife-row" aria-label={entry.title} onClick={() => onOpen(entry.id)}>
      <InkIcon name={entry.icon} label={entry.title} size={64} className="ink-row-badge" />
      <span className="ink-bitlife-row-text"><strong>{entry.title}</strong><span>{entry.hint}</span></span>
      {entry.badge && <span className="ink-feature-count">{entry.badge}</span>}
      <span className="ink-bitlife-chevron" aria-hidden="true">›</span>
    </button></li>)}
  </ul></nav>;
}

export type JianghuView = 'main' | 'online' | 'gacha' | 'huashan' | 'founder';

/** 地圖直接承接江湖分頁，功能沿用原有內容頁。 */
export function InkJianghuHub({ online, onOpen }: { online: boolean; onOpen: (view: JianghuView) => void }) {
  return <InkJianghuMap online={online} onOpen={onOpen} />;
}
