import { useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import type { AncestryMeta } from '@interfaces/ancestry';
import { skillLabel } from '@data/skills/catalog';
import { codexCoverUrl } from '../../fx/highlight/codexAppearance';
import { martialArtView, martialCandidates, martialSlotArt, martialSlotKind } from '../../ui/martialView';
import { inkArtUrl } from '../../ui/inkAssets';
import { InkPersonSheet } from './InkPersonSheet';
import { InkMartialDetails } from './InkMartialDetails';
import './martial-screen.css';

type Props = {
  state: LifeGameState; collection: AncestryMeta; slot: number; preset: 'normal'|'duel'; busy: boolean;
  initialSelection?: string|null; onEquip: (id: string|null)=>boolean; onClose: ()=>void;
};

/** 揀選只預覽，確認才呼叫原學習／裝備核心；長詳情與名單只在冊頁內捲動。 */
export function InkMartialPicker({ state, collection, slot, preset, busy, initialSelection, onEquip, onClose }: Props) {
  const c=state.character,kind=martialSlotKind(slot),currentId=martialSlotArt(c,slot);
  const target=kind==='external'?`外功欄位${slot+1}`:kind==='internal'?'內功欄位':'身法欄位';
  const title=kind==='external'?'選擇外功':kind==='internal'?'選擇內功':'選擇身法';
  const [selectedId,setSelectedId]=useState<string|null>(initialSelection??currentId);
  const [rarity,setRarity]=useState<'all'|'ordinary'|'premium'>('all');
  const [detailId,setDetailId]=useState<string|null>(null),[error,setError]=useState('');
  const submitted=useRef(false),body=useRef<HTMLDivElement>(null);
  const all=martialCandidates(c,collection,slot),candidates=martialCandidates(c,collection,slot,rarity);
  const selected=all.find(v=>v.id===selectedId)??null,current=currentId?martialArtView(c,collection,currentId):null;
  const changed=Boolean(selected&&!selected.blocked&&selected.id!==currentId);
  const confirm=(id:string|null)=>{
    if(submitted.current||busy||(id!==null&&(!changed||!all.some(v=>v.id===id&&!v.blocked)))||(id===null&&!currentId))return;
    submitted.current=true;
    if(onEquip(id))onClose();else{submitted.current=false;setError('未能調整配搭，請於交手結束後重試。');}
  };
  const column=(view:ReturnType<typeof martialArtView>,candidate:boolean)=><div className="ink-martial-compare-column">
    <h4>{candidate?'選中武學':'目前武學'}</h4>
    <button type="button" disabled={!view} aria-label={candidate?'查看選中武學詳情':'查看目前武學詳情'} onClick={()=>{setDetailId(view!.id);body.current?.scrollTo({top:0});}}>
      {view&&<img src={codexCoverUrl(view.premium)} alt="" width="32" height="48"/>}
      <span><strong>{view?.def.name??(candidate?'尚未選擇':'空置')}</strong><small>{view?(kind==='external'?`${view.learned?view.usable:view.collected}卷 · 整套耗內${view.cost}`:view.rank):'—'}</small></span>
    </button>
  </div>;
  return <InkPersonSheet title={title} onClose={onClose} className="ink-martial-sheet">
    <p className="ink-martial-picker-context">{preset==='duel'?'對戰配搭':'普通配搭'} · {target} · 可跨流派配搭</p>
    <div className="ink-martial-filters" role="group" aria-label="武學品質篩選">{([['all','全部'],['ordinary','江湖'],['premium','珍本']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={rarity===id} onClick={()=>{setRarity(id);setDetailId(null);body.current?.scrollTo({top:0});}}>{label}</button>)}</div>
    <div className="ink-martial-picker-body" ref={body} role="region" aria-label="候選武學">
      {detailId?<><button type="button" className="ink-martial-detail-back" onClick={()=>setDetailId(null)}>返回武學列表</button><InkMartialDetails character={c} collection={collection} id={detailId}/></>:
      <div className="ink-martial-candidates">{candidates.map(view=><button key={view.id} type="button" data-art-id={view.id} data-premium={view.premium?'1':'0'} aria-pressed={selectedId===view.id} disabled={busy}
        aria-label={`預覽${view.def.name}，${view.premium?'珍本':'江湖'}${view.blocked?'，已裝備於其他欄位':''}`} onClick={()=>{setSelectedId(view.id);setError('');}}>
        <img src={codexCoverUrl(view.premium)} alt="" width="40" height="60"/>
        <strong>{view.def.name}</strong><span>{view.premium?'珍本':'江湖'} · {view.rank}</span>
        <small>{kind==='external'?`${view.learned?view.usable:view.collected}／7卷 · 耗內${view.cost}`:'獨立欄位'}</small>
        {view.occupied>=0&&<em>{view.occupied===slot?'目前已裝備':`已配外功${view.occupied+1}`}</em>}
      </button>)}{!candidates.length&&<p className="ink-martial-empty">尚無符合條件的武學，可前往秘笈閣取得。</p>}</div>}
    </div>
    <section className="ink-martial-compare" aria-label="武學比較">{column(current,false)}<img className="ink-martial-compare-arrow" src={inkArtUrl('art/parchment-ui/icon-arrow.webp')} alt="更換為" width="30" height="30"/>{column(selected,true)}</section>
    <p className="ink-martial-confirm-hint" role="status">{error|| (selected?.blocked?'此武學已配於其他欄位，請先卸下。':selected&&!selected.learned?'確認後習得並裝備；不消耗書頁。':'點選武學名稱可查看七卷與完整效果。')}</p>
    <div className="ink-martial-confirm-row">
      {currentId&&<button type="button" className="ink-martial-unequip" disabled={busy} onClick={()=>confirm(null)}>卸下</button>}
      <button type="button" className="ink-martial-confirm" disabled={busy||!changed} aria-label={selected?`裝備${skillLabel(selected.id)}至${target}`:'確認裝備'} onClick={()=>selected&&confirm(selected.id)}>{selected?.id===currentId?'目前已裝備':selected&&!selected.learned?'習得並裝備':'換上'}</button>
    </div>
  </InkPersonSheet>;
}
