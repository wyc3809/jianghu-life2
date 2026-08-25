import { useEffect, useRef, useState } from 'react';
import { PRESTIGE_TIERS, jianghuPrestigeTier, nextPrestigeTier } from '@core/life/jianghuPrestige';
import { useSkipJsAnimation } from '../../hooks/useStillMode';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import { barOffset } from './inkStillClass';

interface InkPrestigeHudProps {
  prestige: number;
  rank: number;
}

const RULE_LEN = 100;

function currentTierMin(prestige: number): number {
  let min = PRESTIGE_TIERS[0]!.min;
  for (const t of PRESTIGE_TIERS) {
    if (prestige < t.min) break;
    min = t.min;
  }
  return min;
}

/** 右上角威望／排名令牌：威望上升時彈出「+N」並短暫發亮，強化決定即時有回饋的感覺 */
export function InkPrestigeHud({ prestige, rank }: InkPrestigeHudProps) {
  const prevRef = useRef(prestige);
  const [pop, setPop] = useState<{ amount: number; id: number } | null>(null);
  const [pulse, setPulse] = useState(false);
  const skipAnim = useSkipJsAnimation();

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = prestige;
    if (prestige <= prev || skipAnim) return;
    const amount = prestige - prev;
    setPop({ amount, id: prestige });
    setPulse(true);
    const popTimer = window.setTimeout(() => setPop(null), 1100);
    const pulseTimer = window.setTimeout(() => setPulse(false), 700);
    return () => {
      window.clearTimeout(popTimer);
      window.clearTimeout(pulseTimer);
    };
  }, [prestige, skipAnim]);

  const tier = jianghuPrestigeTier(prestige);
  const next = nextPrestigeTier(prestige);
  const floor = currentTierMin(prestige);
  const ruleProgress = next ? ((prestige - floor) / (next.min - floor)) * 100 : 100;
  const ruleOff = barOffset(RULE_LEN, ruleProgress, 100);

  return (
    <div className="ink-prestige-hud">
      <div className={`ink-prestige-main${pulse ? ' ink-prestige-main--pulse' : ''}`}>
        <span className="ink-prestige-seal">
          <img src={inkAiUrl('seal-cinnabar-fate')} alt="" aria-hidden decoding="async" />
        </span>
        <span className="ink-prestige-body">
          <span className="ink-prestige-line">
            <span className="ink-prestige-label">江湖威望</span>
            <span className="ink-prestige-score">{prestige}</span>
          </span>
          <span className="ink-prestige-tier">{tier}</span>
          <svg className="ink-prestige-rule-svg" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden>
            <line className="ink-prestige-rule-track" x1="0" y1="2" x2="100" y2="2" pathLength={RULE_LEN} />
            <line
              className="ink-prestige-rule-fill"
              x1="0"
              y1="2"
              x2="100"
              y2="2"
              pathLength={RULE_LEN}
              style={{ ['--len' as string]: RULE_LEN, ['--off' as string]: ruleOff }}
            />
          </svg>
        </span>
        {pop && (
          <span key={pop.id} className="ink-prestige-pop">
            +{pop.amount}
          </span>
        )}
      </div>
      <p className="ink-prestige-rank">
        <img className="ink-prestige-rank-motif" src={inkAiUrl('motif-jade')} alt="" aria-hidden decoding="async" />
        江湖排名 第{rank}位
      </p>
    </div>
  );
}
