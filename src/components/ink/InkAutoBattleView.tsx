import type { CombatReplay } from '@interfaces/lifeEngine';
import { InkAutoBattle } from './InkAutoBattle';
import { useLifeStore } from '../../store/lifeStore';
import { seasonToInk } from './sceneVariants';
import { motionReduced } from '../../ui/inkMotion';

type Props = { replay: CombatReplay; onDone: () => void; reduceMotion?: boolean };

/** 江湖普通／首領／論劍重播統一用演武2D、頂部雙方血條同墨暈揭幕。 */
export function InkAutoBattleView({ replay, onDone, reduceMotion = false }: Props) {
  const month = useLifeStore(s => s.state?.month ?? 1);
  const season = seasonToInk(month);
  return <InkAutoBattle replay={replay} onDone={onDone} unified season={season}
    reduceMotion={reduceMotion || motionReduced()}
    battleBackdropSrc={`${import.meta.env.BASE_URL || '/'}ink/art/battle-preview/${season}.webp`} />;
}
