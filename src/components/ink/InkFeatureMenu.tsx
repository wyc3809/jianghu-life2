import { InkIcon } from './InkIcon';
import type { InkIconKey } from '../../ui/inkIcons';
import './jianghu.css';

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

export type JianghuView = 'main' | 'online' | 'gacha' | 'huashan' | 'founder' | 'nature';

/** 江湖總目錄只呈現入口；原有功能保留喺各自內容頁。 */
export function InkJianghuHub({ online, onOpen }: { online: boolean; onOpen: (view: JianghuView) => void }) {
  const entries: InkFeatureEntry<JianghuView>[] = [
    ...(online ? [{ id: 'online' as const, title: '江湖風雲', icon: 'banner' as const, hint: '共用江湖 · 離線亦可應戰' }] : []),
    { id: 'gacha', title: '秘笈閣', icon: 'book', hint: '尋訪武學 · 定向小冊與心願' },
    { id: 'huashan', title: '華山論劍', icon: 'swords', hint: '持帖赴會 · 八強逐招論劍' },
    { id: 'founder', title: '開宗立派', icon: 'house', hint: '開山收徒 · 傳承門中武學' },
    { id: 'nature', title: '心性', icon: 'fan', hint: '仁義邪俠 · 細看行走江湖嘅心性' },
  ];
  return <section className="ink-panel ink-jianghu-hub ink-tab-pane" aria-label="江湖列表" id="ink-jianghu-menu">
    <h3>江湖</h3><p className="ink-note ink-jianghu-intro">行走江湖，各有去處。</p>
    <InkFeatureMenu label="江湖功能" entries={entries} onOpen={onOpen} />
  </section>;
}
