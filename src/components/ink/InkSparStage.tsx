/**
 * 鎮居演武台（v4）：俠客斬敵人加修為。
 * 外觀跟遊戲狀態（門派服色、裝備兵器／護甲／飾物、境界敵人、傷勢流血、地點季節），
 * 畫面同節奏喺 src/spar/v4/（導演 director.ts、渲染 renderer.ts），動作表同參數喺 data/spar/。
 * 每擊命中照舊叫 store.sparStrike() 入修為；撳敵人即刻出手。
 */
import { useMemo, type ReactNode } from 'react';
import { useLifeStore } from '../../store/lifeStore';
import { SparView } from '../../spar/v4/SparView';
import { DEFAULT_LOOK, lookFromState } from '../../spar/v4/look';

interface Props {
  reduceMotion?: boolean;
  /** 浮層內容（例如季節・地點名），壓喺 canvas 之上 */
  overlay?: ReactNode;
}

const NO_CONDITIONS: { id: string; name: string; monthsLeft: number; severity: number }[] = [];

export function InkSparStage({ reduceMotion = false, overlay }: Props) {
  const state = useLifeStore((s) => s.state);
  const sparStrike = useLifeStore((s) => s.sparStrike);
  const conditions = useLifeStore((s) => s.state?.character.conditions ?? NO_CONDITIONS);
  // 外觀只喺有關欄位變先更新（修為入賬唔會令成個演武台重載）
  const lookKey = JSON.stringify(state ? lookFromState(state) : DEFAULT_LOOK);
  const look = useMemo(() => JSON.parse(lookKey) as typeof DEFAULT_LOOK, [lookKey]);

  return (
    <SparView look={look} reduceMotion={reduceMotion} onStrike={() => sparStrike()}>
      {overlay}
      {conditions.length > 0 && (
        <div className="ink-spar-conditions" aria-label="狀態">
          {conditions.map((cond) => (
            <span key={cond.id} className="ink-spar-condition-chip">
              {cond.name}·{cond.monthsLeft}月
            </span>
          ))}
        </div>
      )}
    </SparView>
  );
}
