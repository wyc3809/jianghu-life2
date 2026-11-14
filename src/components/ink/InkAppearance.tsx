import { inkSurfaceIn } from '../../ui/inkMotion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { appearanceOf, readAppearance, appearanceKey, APPEARANCE_HEADS, APPEARANCE_OUTFITS, APPEARANCE_TONES, type CharacterAppearance } from '@interfaces/appearance';
import { HEAD_LABELS, OUTFIT_LABELS, TONE_LABELS, APPEARANCE_COLOURS } from '@data/appearances';
import { loadAppearanceAssets } from '../../appearance/assets';
import { drawAppearance, type AppearancePose } from '../../appearance/model';
import { appearanceBodyFrame, appearanceComposition } from '../../appearance/pose';
import { spineAppearanceBounds } from '../../appearance/spine/frames';
import { InkPersonSheet } from './InkPersonSheet';
import { inkArtUrl } from '../../ui/inkAssets';
import './appearance.css';
import { loadManhuaFigure, drawManhuaFigure } from '../../appearance/manhua/figures';
import { SECT_UNIFORM_GROUPS,uniformsForSect,FREE_FASHIONS,costumeLabel } from '@data/wardrobe';
import { canWearCostume,type CostumeIdentity } from '@interfaces/costumes';

/** 靜態頭像／全身立繪同樣由角色造型組合，沒有獨立的預設男俠圖。 */
export function AppearanceCanvas({ appearance, mode='figure', pose='idle', className='', label='人物造型' }: {
  appearance: CharacterAppearance; mode?:'figure'|'portrait';pose?:AppearancePose;className?:string;label?:string;
}) {
  const ref=useRef<HTMLCanvasElement>(null),key=appearanceKey(appearance);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let cancelled=false;const target=ref.current;if(!target)return;
    const paint=async()=>{try{
      const illustration=await loadManhuaFigure(appearance).catch(()=>null);if(cancelled)return;
      if(illustration){
        const box=target.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height),dpr=Math.min(2,devicePixelRatio||1);
        target.width=Math.round(w*dpr);target.height=Math.round(h*dpr);
        const ctx=target.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
        drawManhuaFigure(ctx,illustration,appearance,w,h,mode==='portrait');target.dataset.artStyle='manhua';target.dataset.renderedAppearance=key;setFailed(false);return;
      }
      const assets=await loadAppearanceAssets();
      await assets.spine?.prepare(appearance,pose==='seated'?'seated':'idle');if(cancelled)return;
      const box=target.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height),dpr=Math.min(2,devicePixelRatio||1);
      target.width=Math.round(w*dpr);target.height=Math.round(h*dpr);const ctx=target.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const side=Math.min(w,h);
      if(mode==='portrait')drawAppearance(ctx,assets,readAppearance(appearance),{x:w*.47,y:side*3+(h-side)*.5,height:side*3,pose:'idle',reduced:true,quality:'portrait'});
      else {
        // 人物頁／衣櫥等比例容納整張靜態立繪，保留頭頂與雙靴；戰鬥仍沿用固定身高。
        const a=readAppearance(appearance),im=assets.heads[a.head],p=appearanceComposition(a,appearanceBodyFrame(pose,0,true),im.naturalWidth/im.naturalHeight);
        const bounds=assets.spine?spineAppearanceBounds(a,pose):null;
        const left=bounds?.left??Math.min(p.body.x,p.neck.x+p.head.x),right=bounds?.right??Math.max(p.body.x+p.body.width,p.neck.x+p.head.x+p.head.width);
        const top=bounds?.top??Math.min(p.body.y,p.neck.y+p.head.y),bottom=bounds?.bottom??Math.max(p.body.y+p.body.height,p.neck.y+p.head.y+p.head.height);
        const scale=Math.min(w*.94/(right-left),h*.9/(bottom-top));
        drawAppearance(ctx,assets,a,{x:w*.5-(left+right)*.5*scale,y:h*.95-bottom*scale,height:400*scale,pose,reduced:true,quality:'portrait'});
      }
      target.dataset.artStyle='legacy-fallback';target.dataset.renderedAppearance=key;setFailed(false);
    }catch{if(!cancelled)setFailed(true);}};
    void paint();const observer=new ResizeObserver(()=>void paint());observer.observe(target);
    return()=>{cancelled=true;observer.disconnect();};
  },[key,mode,pose]);
  return <canvas ref={ref} className={`ink-appearance-canvas ${className}`} aria-label={failed?'人物造型暫未載入':label} role="img" data-appearance={key}/>;
}

/** 頭像保留原有器物菱形牌章；真正人物外觀由同一資料繪畫。 */
export function AppearanceBadge({ character,size=60,className='' }:{character:{appearance?:unknown;gender?:string}&CostumeIdentity;size?:number;className?:string}) {
  return <span className={`ink-appearance-badge ${className}`} style={{width:size,height:size}} aria-hidden="true">
    <img src={inkArtUrl('art/badges/slate.webp')} alt=""/><AppearanceCanvas appearance={appearanceOf(character)} mode="portrait"/>
  </span>;
}

/** 本窗只預覽；確認才保存，取消不換裝、不改能力或收費。 */
export function InkAppearancePicker({ appearance,onConfirm,onClose,busy=false,sectId=null,sectStanding=0 }:{appearance:CharacterAppearance;onConfirm(value:CharacterAppearance):boolean;onClose():void;busy?:boolean}&CostumeIdentity) {
  const [draft,setDraft]=useState(()=>readAppearance(appearance)),[tab,setTab]=useState<'head'|'outfit'|'tone'|'uniform'|'fashion'>('head');
  const [error,setError]=useState('');const gate=useRef(false),sectsRef=useRef<HTMLDivElement>(null);
  const [uniformSect,setUniformSect]=useState(()=>SECT_UNIFORM_GROUPS.some(s=>s.id===sectId)?sectId!:'sect_qingyun');
  useEffect(()=>{
    if(tab!=='uniform')return;
    const row=sectsRef.current,active=row?.querySelector<HTMLButtonElement>('[aria-pressed=true]');
    if(!row||!active)return;
    const outer=row.getBoundingClientRect(),selected=active.getBoundingClientRect();
    row.scrollLeft+=selected.left-outer.left-(outer.width-selected.width)/2;
  },[tab,uniformSect]);
  const identity={sectId,sectStanding},allowed=!draft.costume||canWearCostume(identity,draft.costume);
  const choicesRef=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>inkSurfaceIn(choicesRef.current),[tab,uniformSect]);
  const name=draft.costume?costumeLabel(draft.costume):OUTFIT_LABELS[draft.outfit];
  return <InkPersonSheet title="衣著與造型" onClose={onClose} className="ink-appearance-sheet">
    <div className="ink-appearance-preview"><AppearanceCanvas appearance={draft} label={`${HEAD_LABELS[draft.head]}、${name}${draft.costume?'':`、${TONE_LABELS[draft.tone]}`}`}/></div>
    <div className="ink-appearance-tabs" role="tablist" aria-label="造型分類">{([{key:'head',label:'造型'},{key:'outfit',label:'衣著'},{key:'tone',label:'配色'},{key:'uniform',label:'門派服'},{key:'fashion',label:'時裝'}] as const).map(item=><button type="button" role="tab" key={item.key} aria-selected={tab===item.key} onClick={()=>{setTab(item.key);setError('');}}>{item.label}</button>)}</div>
    <div className="ink-appearance-choices" ref={choicesRef} role="region" aria-label="可選造型">
      {tab==='head'&&APPEARANCE_HEADS.map(head=><button type="button" key={head} aria-label={HEAD_LABELS[head]} aria-pressed={draft.head===head} onClick={()=>setDraft({...draft,head})}><AppearanceCanvas appearance={{...draft,head}} mode="portrait"/><span>{HEAD_LABELS[head]}</span></button>)}
      {tab==='outfit'&&APPEARANCE_OUTFITS.map(outfit=><button type="button" key={outfit} aria-label={OUTFIT_LABELS[outfit]} aria-pressed={!draft.costume&&draft.outfit===outfit} onClick={()=>setDraft({...draft,outfit,costume:undefined,fashion:undefined})}><AppearanceCanvas appearance={{...draft,outfit,costume:undefined}}/><span>{OUTFIT_LABELS[outfit]}</span></button>)}
      {tab==='tone'&&(draft.costume?<p className="ink-appearance-empty">{name}使用固定配色；常服可自由配色。</p>:APPEARANCE_TONES.map(tone=><button type="button" key={tone} aria-label={TONE_LABELS[tone]} aria-pressed={draft.tone===tone} onClick={()=>setDraft({...draft,tone})}><i style={{backgroundColor:`rgb(${APPEARANCE_COLOURS[tone].join(',')})`}} aria-hidden="true"/><span>{TONE_LABELS[tone]}</span></button>))}
      {tab==='uniform'&&<>
        <div className="ink-appearance-sects" role="group" aria-label="門派制服目錄" ref={sectsRef}>
          {SECT_UNIFORM_GROUPS.map(sect=><button type="button" key={sect.id} aria-pressed={uniformSect===sect.id} onClick={()=>{setUniformSect(sect.id);setDraft(current=>({...current,costume:uniformsForSect(sect.id)[0].id}));setError('');}}>{sect.name}</button>)}
        </div>
        <p className="ink-appearance-group-label">{SECT_UNIFORM_GROUPS.find(s=>s.id===uniformSect)?.name} · {uniformSect===sectId?'按職位開放':sectId?'其他門派，只供預覽':'入派後按職位開放'}</p>
        {uniformsForSect(uniformSect).map(item=><button type="button" key={item.id} aria-label={`預覽${item.name}`} aria-pressed={draft.costume===item.id} onClick={()=>setDraft({...draft,costume:item.id})}><AppearanceCanvas appearance={{...draft,costume:item.id}}/><span>{item.rankName}</span>{!canWearCostume(identity,item.id)&&<small>{uniformSect===sectId?`需${item.rankName}`:'只供預覽'}</small>}</button>)}
      </>}
      {tab==='fashion'&&FREE_FASHIONS.map(item=><button type="button" key={item.id} aria-label={item.name} aria-pressed={draft.costume===item.id} onClick={()=>setDraft({...draft,costume:item.id,fashion:item.id})}><AppearanceCanvas appearance={{...draft,costume:item.id}}/><span>{item.name}</span><small>免費時裝</small></button>)}
    </div>
    <p className="ink-appearance-note">{!allowed?`${name}：尚未達到入派或職位要求。`:tab==='uniform'?'可穿本門已達職位的制服。':tab==='fashion'?'時裝免費，隨時更換。':''}</p>
    {error&&<p role="alert">{error}</p>}
    <button type="button" className="ink-btn ink-btn--primary" disabled={busy||!allowed} onClick={()=>{
      if(gate.current||busy)return;gate.current=true;
      if(onConfirm(readAppearance(draft)))onClose();else{gate.current=false;setError('此刻無法更換造型，請於交手結束後重試。');}
    }}>換上</button>
  </InkPersonSheet>;
}
