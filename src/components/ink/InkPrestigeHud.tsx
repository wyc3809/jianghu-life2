import { useEffect, useRef, useState } from 'react';
import { jianghuPrestigeTier } from '@core/life/jianghuPrestige';

interface InkPrestigeHudProps {
  prestige: number;
  rank: number;
}

/** 右上角威望／排名牌：威望上升時彈出「+N」並短暫發亮，強化決定即時有回饋的感覺 */
export function InkPrestigeHud({ prestige, rank }: InkPrestigeHudProps) {
  const prevRef = useRef(prestige);
  const [pop, setPop] = useState<{ amount: number; id: number } | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = prestige;
    if (prestige <= prev) return;
    const amount = prestige - prev;
    setPop({ amount, id: prestige });
    setPulse(true);
    const popTimer = window.setTimeout(() => setPop(null), 1100);
    const pulseTimer = window.setTimeout(() => setPulse(false), 700);
    return () => {
      window.clearTimeout(popTimer);
      window.clearTimeout(pulseTimer);
    };
  }, [prestige]);

  const tier = jianghuPrestigeTier(prestige);

  return (
    <div className="ink-prestige-hud">
      <div className={`ink-prestige-main${pulse ? ' ink-prestige-main--pulse' : ''}`}>
        <span className="ink-prestige-label">江湖威望</span>
        <span className="ink-prestige-score">{prestige}</span>
        <span className="ink-prestige-tier">{tier}</span>
        {pop && (
          <span key={pop.id} className="ink-prestige-pop">
            +{pop.amount}
          </span>
        )}
      </div>
      <p className="ink-prestige-rank">江湖排名 第{rank}位</p>
    </div>
  );
}
