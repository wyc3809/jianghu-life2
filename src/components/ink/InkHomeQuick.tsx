import type { LifeGameState } from '@interfaces/lifeEngine';
import { GACHA_COST_PER_PULL } from '@data/redesign/testParams';
import { encounterRoute } from '@core/life/encounters';
import { useAncestryStore } from '../../store/ancestryStore';
import type { InkIconKey } from '../../ui/inkIcons';
import { InkIcon } from './InkIcon';

export type QuickTarget = 'gacha' | 'encounter' | 'shrine' | 'huashan' | 'skills';

type Props = {
  state: LifeGameState;
  onOpen: (target: QuickTarget) => void;
};

type Entry = { id: QuickTarget; icon: InkIconKey; label: string; badge?: string | boolean; dim?: boolean };

/**
 * 主畫面功能入口（商業手遊式圓鈕列，紅點＝有嘢做）。
 * 只係捷徑：秘笈閣／論劍喺「江湖」分頁、武學喺「人物」分頁、祖祠開祖蔭面板。
 */
export function InkHomeQuick({ state, onOpen }: Props) {
  const meta = useAncestryStore((s) => s.meta);
  const jade = (meta.jade?.free ?? 0) + (meta.jade?.paidTest ?? 0);
  const e = meta.encounter;
  const route = e?.active ? encounterRoute(e.active.tpl, e.active.route) : undefined;
  const encDone = Boolean(e?.active && route && e.active.progress >= route.target);
  const entries: Entry[] = [
    { id: 'gacha', icon: 'book', label: '秘笈閣', badge: jade >= GACHA_COST_PER_PULL },
    {
      id: 'encounter',
      icon: 'pouch',
      label: '奇遇',
      badge: e?.offer ? '新' : encDone ? '領' : false,
      dim: !e?.offer && !e?.active,
    },
    { id: 'huashan', icon: 'swords', label: '論劍' },
    { id: 'skills', icon: 'scroll', label: '武學', badge: (state.character.skills?.length ?? 0) === 0 },
    { id: 'shrine', icon: 'tablet', label: '祖祠' },
  ];
  return (
    <nav className="ink-quick" aria-label="功能入口">
      {entries.map((x) => (
        <button
          key={x.id}
          type="button"
          className={`ink-quick-btn${x.dim ? ' is-dim' : ''}`}
          onClick={() => onOpen(x.id)}
          aria-label={x.label}
        >
          <InkIcon name={x.icon} size={50} className="ink-quick-icon" />
          <span className="ink-quick-label">{x.label}</span>
          {x.badge && <i className={`ink-quick-badge${typeof x.badge === 'string' ? ' has-text' : ''}`}>{typeof x.badge === 'string' ? x.badge : ''}</i>}
        </button>
      ))}
    </nav>
  );
}
