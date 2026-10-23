/** 第26項獨立預覽，唔接正式首領／存檔，玩家睇畫面先。 */
import { useMemo, useState } from 'react';
import { InkAutoBattle } from '../components/ink/InkAutoBattle';
import { makeBattlePreview, type BattlePreviewKind } from './battleFixtures';

export default function UnifiedBattlePreview() {
  const search = new URLSearchParams(location.search);
  const initial = search.get('kind');
  const [kind, setKind] = useState<BattlePreviewKind>(initial === 'event' || initial === 'event-boss' ? initial : 'spar');
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const replay = useMemo(() => makeBattlePreview(kind), [kind, attempt]);
  const replayAgain = () => { setFinished(false); setAttempt(n => n + 1); };
  const change = (next: BattlePreviewKind) => { setFinished(false); setKind(next); setAttempt(n => n + 1); };
  return <InkAutoBattle key={`${kind}-${attempt}`} replay={replay} unified reduceMotion={reduceMotion} season={kind === 'spar' ? 'autumn' : 'spring'} onDone={() => setFinished(true)}
    battleBackdropSrc={`${import.meta.env.BASE_URL || '/'}ink/art/battle-preview/${kind === 'spar' ? 'autumn' : 'spring'}.webp`}
    notice={finished ? <>
      <h2>{kind === 'spar' && replay.outcome === 'lost' ? '演武敗退' : replay.outcome === 'lost' ? '落敗' : replay.outcome === 'resolve' ? '交手結束 · 等待處置' : '勝出'}</h2>
      <p>{kind === 'spar' ? '演武勝出進入下一關，落敗同關重試。' : '交手完畢，返回江湖。'}</p>
      <button type="button" onClick={replayAgain}>重播此戰</button>
      <button type="button" onClick={() => change(kind === 'spar' ? 'event' : 'spar')}>{kind === 'spar' ? '查看江湖交手' : '查看演武首領'}</button>
      <p>畫面原型 · 不影響正式存檔或獎勵</p>
    </> : undefined}
  />;
}
