import { getSkillDef } from '@data/skills/catalog';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves } from '@data/skills/volumes';

type Props = {
  artId?: string;
  volumes: number[];
  rotation: { id: string; vols: number[] }[];
  activeVolume?: number;
};

/** 第26項原型：沿用第二張圖嘅外功／七卷，隨出招轉換，而唔改可用招式。 */
export function InkBattleArts({ artId, volumes, rotation, activeVolume }: Props) {
  const artName = artId ? getSkillDef(artId)?.name : undefined;
  if (!artId) return <div className="ink-unified-art"><p className="ink-unified-art-title">未學外功 · 基本攻擊</p></div>;
  const owned = new Set(volumes);
  const moves = artVolumeMoves(artId);
  return <div className="ink-unified-art" aria-label={`${artName} 七卷`}>
    {rotation.length > 1 && <div className="ink-unified-art-rotation" aria-label="武功輪替">
      {rotation.map(art => <span key={art.id} className={art.id === artId ? 'is-on' : ''}>{getSkillDef(art.id)?.name}</span>)}
    </div>}
    <p className="ink-unified-art-title">{artName} · 已得 {owned.size}／{VOLUME_COUNT} 卷</p>
    <ol className="ink-unified-volumes">
      {Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).map(volume => <li key={volume} className={`${owned.has(volume) ? 'is-owned' : ''}${activeVolume === volume ? ' is-active' : ''}`}>
        <b>卷{VOLUME_NUMERALS[volume - 1]}</b>
        <span>{owned.has(volume) ? moves[volume - 1]?.name : '未得'}</span>
      </li>)}
    </ol>
  </div>;
}
