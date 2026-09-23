/**
 * 交手對峙舞台：主角剪影（左，面右）對敵人剪影（右，面左）。
 * 素材：public/ink/art/sil/（C 款剪影）＋ public/ink/spar/fx-splash.webp（墨濺，CSS mask 染朱砂）。
 * 動畫全由 CSS：待機呼吸、出招前衝、中招後仰＋震、暴擊墨濺、敗者沉墨淡出。
 * 觸發來源＝交手特效佇列（core/life/combatInkFx.ts），唔讀寫遊戲狀態。
 */
import type { InkCombatFx } from '@core/life/combatInkFx';
import { heroSilhouetteUrl, foeSilhouetteUrl } from '../../ui/inkSilhouettes';

type Props = {
  sectId: string | null | undefined;
  foeName: string;
  boss: boolean;
  /** 本輪交手特效（由 useInkCombatFxQueue 提供） */
  fx: InkCombatFx[];
  foeDown: boolean;
  playerDown: boolean;
};

export function InkDuelStage({ sectId, foeName, boss, fx, foeDown, playerDown }: Props) {
  const foeHit = fx.find((f) => f.side === 'foe' && (f.kind === 'hp' || f.kind === 'crit'));
  const playerHit = fx.find((f) => f.side === 'player' && (f.kind === 'hp' || f.kind === 'danger'));
  const crit = fx.find((f) => f.kind === 'crit' || f.kind === 'danger');

  return (
    <div className={`ink-duel${boss ? ' ink-duel--boss' : ''}`} aria-hidden>
      <span className="ink-duel__ground" />
      {/* key 用特效 id：每次命中都重播一次動畫 */}
      <span
        key={`pl-${foeHit?.id ?? ''}-${playerHit?.id ?? ''}`}
        className={`ink-duel__fighter ink-duel__fighter--hero${foeHit ? ' is-striking' : ''}${
          playerHit ? ' is-hit' : ''
        }${playerDown ? ' is-down' : ''}`}
      >
        <img src={heroSilhouetteUrl(sectId)} alt="" draggable={false} />
      </span>
      <span
        key={`foe-${foeHit?.id ?? ''}-${playerHit?.id ?? ''}`}
        className={`ink-duel__fighter ink-duel__fighter--foe${playerHit ? ' is-striking' : ''}${
          foeHit ? ' is-hit' : ''
        }${foeDown ? ' is-down' : ''}`}
      >
        <img src={foeSilhouetteUrl(foeName, boss)} alt="" draggable={false} />
      </span>
      {crit && (
        <span
          key={crit.id}
          className={`ink-duel__splash ink-duel__splash--${crit.side === 'player' ? 'hero' : 'foe'}`}
        />
      )}
    </div>
  );
}
