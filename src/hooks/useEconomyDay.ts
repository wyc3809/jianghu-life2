import { useEffect, useState } from 'react';
import { economyDay, untilEconomyDayReset } from '@core/life/economyDay';

export function useEconomyDay(): string {
  const [day, setDay] = useState(economyDay);

  useEffect(() => {
    let timer: number;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = Date.now();
      setDay(economyDay(now));
      timer = window.setTimeout(refresh, Math.min(untilEconomyDayReset(now), 60_000));
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return day;
}
