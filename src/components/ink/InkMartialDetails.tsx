import type { LifeCharacter } from '@interfaces/lifeEngine';
import type { AncestryMeta } from '@interfaces/ancestry';
import { skillKindLabel } from '@data/skills/catalog';
import { MANUAL_MAX_STARS } from '@data/redesign/testParams';
import { martialArtView } from '../../ui/martialView';
import { InkBrushBar } from './InkBrush';

/** 卷號不拆行，已學、已得及未得沿用真資料。 */
export function InkMartialVolumes({ character, collection, id }: { character: LifeCharacter; collection: AncestryMeta; id: string }) {
  const view=martialArtView(character,collection,id);
  if(!view?.volumes.length)return null;
  return <>
    <div className="ink-martial-volume-heading"><strong>七卷招式</strong><span>已學 {view.usable}／7 · 已得 {view.collected}／7</span></div>
    <ol className="ink-martial-volume-list" aria-label="七卷招式">{view.volumes.map(volume =>
      <li key={volume.number} data-volume={volume.number} data-status={volume.status}>
        <span className="ink-martial-volume-number">卷{volume.numeral}</span><strong>{volume.name}</strong><span>{volume.status}</span>
      </li>)}</ol>
  </>;
}

/** 真卷次與熟練資料；未得、家藏已得及本代已學各自標明。 */
export function InkMartialDetails({ character, collection, id }: { character: LifeCharacter; collection: AncestryMeta; id: string }) {
  const view = martialArtView(character, collection, id);
  if (!view) return null;
  return <article className="ink-martial-details" data-art-detail={id}>
    <h3>{view.def.name}</h3>
    <p>{view.premium ? '珍本' : '江湖'} · {skillKindLabel(view.def.kind)} · {view.rank}</p>
    {view.def.kind === 'external' && <p className="ink-martial-cost">整套起手耗內 <strong>{view.cost}</strong> · 卷數增加不加耗內</p>}
    {view.volumes.length > 0 && <>
      <InkMartialVolumes character={character} collection={collection} id={id}/>
      <p className="ink-note">每回合輪替一門外功，該門已學卷次依序連出。演武台不耗內。</p>
    </>}
    <h4>基礎效果</h4><p>{view.effects}</p>
    <h4>熟練階位</h4><p>{view.hint}</p>
    {view.progress !== null && <div role="progressbar" aria-label={`${view.def.name}熟練進度`} aria-valuenow={view.progress} aria-valuemin={0} aria-valuemax={100}>
      <InkBrushBar pct={view.progress} tone="cinnabar" /><span>{view.progress}%</span>
    </div>}
    <p>藏本升階 {view.stars}／{MANUAL_MAX_STARS} · 收藏與養成共用</p>
  </article>;
}
