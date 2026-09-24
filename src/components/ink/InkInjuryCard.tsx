/**
 * 人物欄「傷勢」卡（design/gdd/injury-system.md §3.6）：
 * 左＝主角剪影＋四部位位圖墨點（輕＝宣紙色、重＝朱砂、殘＝朱砂斜劃＋「殘」印，印由 CSS 畫），右＝傷勢清單。
 * 全部位圖（ink-dot／slash-stroke 作 mask），唔用 SVG。
 */
import type { InjuryPart, LifeCharacter, LifeInjury } from '@interfaces/lifeEngine';
import { INJURY_PARTS, INJURY_PART_LABEL, INJURY_TIER_LABEL } from '@data/injuries/tuning';
import { injuryEffectText } from '@core/life/injuryMath';
import { heroSilhouetteUrl } from '../../ui/inkSilhouettes';

/** 部位喺剪影上嘅錨點（% of 圖框）；剪影姿勢相近，一套通用 */
export const INJURY_ANCHOR: Readonly<Record<InjuryPart, { x: number; y: number }>> = {
  head: { x: 34, y: 13 },
  torso: { x: 36, y: 42 },
  arm: { x: 64, y: 33 },
  leg: { x: 40, y: 88 },
};

function sortInjuries(list: readonly LifeInjury[]): LifeInjury[] {
  const rank = { crippled: 0, heavy: 1, light: 2 } as const;
  return [...list].sort(
    (a, b) => rank[a.tier] - rank[b.tier] || INJURY_PARTS.indexOf(a.part) - INJURY_PARTS.indexOf(b.part),
  );
}

export function InkInjuryCard({ character }: { character: LifeCharacter }) {
  const list = sortInjuries(character.injuries ?? []);
  if (!list.length) {
    return (
      <p className="ink-injury-none" aria-label="傷勢">
        <span className="ink-injury-none__k">傷勢</span>身無新傷
      </p>
    );
  }
  return (
    <section className="ink-injury" aria-label="傷勢">
      <div className="ink-injury__figure" aria-hidden>
        <img className="ink-injury__sil" src={heroSilhouetteUrl(character.sectId)} alt="" draggable={false} />
        {list.map((inj) => (
          <span
            key={inj.part}
            className={`ink-injury__mark ink-injury__mark--${inj.tier}`}
            style={{ left: `${INJURY_ANCHOR[inj.part].x}%`, top: `${INJURY_ANCHOR[inj.part].y}%` }}
          />
        ))}
      </div>
      <ul className="ink-injury__list">
        {list.map((inj) => (
          <li key={inj.part} className={`ink-injury__row ink-injury__row--${inj.tier}`}>
            <strong>
              {INJURY_PART_LABEL[inj.part]}
              <em>{INJURY_TIER_LABEL[inj.tier]}</em>
            </strong>
            <span>
              {inj.monthsLeft == null ? '永久 · 非奇遇難醫' : `尚餘 ${inj.monthsLeft} 月`} · {injuryEffectText(inj)}
            </span>
            <span className="ink-injury__cause">{inj.cause}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
