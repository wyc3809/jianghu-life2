import { useEffect, useRef, useState } from 'react';
import { appearanceOf, readAppearance, appearanceKey, APPEARANCE_HEADS, APPEARANCE_OUTFITS, APPEARANCE_TONES, type CharacterAppearance } from '@interfaces/appearance';
import { HEAD_LABELS, OUTFIT_LABELS, TONE_LABELS, APPEARANCE_COLOURS } from '@data/appearances';
import { loadAppearanceAssets } from '../../appearance/assets';
import { drawAppearance, type AppearancePose } from '../../appearance/model';
import { appearanceBodyFrame, appearanceComposition } from '../../appearance/pose';
import { InkPersonSheet } from './InkPersonSheet';
import { inkArtUrl } from '../../ui/inkAssets';
import './appearance.css';

/** 靜態頭像／盤坐立繪同樣由角色造型組合，沒有獨立的預設男俠圖。 */
export function AppearanceCanvas({ appearance, mode='figure', pose='idle', className='', label='人物造型' }: {
  appearance: CharacterAppearance; mode?:'figure'|'portrait';pose?:AppearancePose;className?:string;label?:string;
}) {
  const ref=useRef<HTMLCanvasElement>(null),key=appearanceKey(appearance);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let cancelled=false;const target=ref.current;if(!target)return;
    const paint=async()=>{try{
      const assets=await loadAppearanceAssets();if(cancelled)return;
      const box=target.getBoundingClientRect(),w=Math.max(1,box.width),h=Math.max(1,box.height),dpr=Math.min(2,devicePixelRatio||1);
      target.width=Math.round(w*dpr);target.height=Math.round(h*dpr);const ctx=target.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const side=Math.min(w,h);
      if(mode==='portrait')drawAppearance(ctx,assets,readAppearance(appearance),{x:w*.47,y:side*3+(h-side)*.5,height:side*3,pose:'idle',reduced:true});
      else {
        // 人物頁／衣櫥是靜態立繪：完整露出雙膝與雙靴；戰鬥仍沿用固定身高。
        const a=readAppearance(appearance),im=assets.heads[a.head],p=appearanceComposition(a,appearanceBodyFrame(pose,0,true),im.naturalWidth/im.naturalHeight);
        const left=Math.min(p.body.x,p.neck.x+p.head.x),right=Math.max(p.body.x+p.body.width,p.neck.x+p.head.x+p.head.width);
        const top=Math.min(p.body.y,p.neck.y+p.head.y),bottom=Math.max(p.body.y+p.body.height,p.neck.y+p.head.y+p.head.height);
        const scale=Math.min(w*.94/(right-left),h*.9/(bottom-top));
        drawAppearance(ctx,assets,a,{x:w*.5-(left+right)*.5*scale,y:h*.95-bottom*scale,height:400*scale,pose,reduced:true});
      }
      setFailed(false);
    }catch{if(!cancelled)setFailed(true);}};
    void paint();const observer=new ResizeObserver(()=>void paint());observer.observe(target);
    return()=>{cancelled=true;observer.disconnect();};
  },[key,mode,pose]);
  return <canvas ref={ref} className={`ink-appearance-canvas ${className}`} aria-label={failed?'人物造型暫未載入':label} role="img" data-appearance={key}/>;
}

/** 頭像保留原有器物菱形牌章；真正人物外觀由同一資料繪畫。 */
export function AppearanceBadge({ character,size=60,className='' }:{character:{appearance?:unknown;gender?:string};size?:number;className?:string}) {
  return <span className={`ink-appearance-badge ${className}`} style={{width:size,height:size}} aria-hidden="true">
    <img src={inkArtUrl('art/badges/slate.webp')} alt=""/><AppearanceCanvas appearance={appearanceOf(character)} mode="portrait"/>
  </span>;
}

/** 本窗只預覽；確認才保存，取消不換裝、不改能力或收費。 */
export function InkAppearancePicker({ appearance,onConfirm,onClose,busy=false }:{appearance:CharacterAppearance;onConfirm(value:CharacterAppearance):boolean;onClose():void;busy?:boolean}) {
  const [draft,setDraft]=useState(()=>readAppearance(appearance)),[tab,setTab]=useState<'head'|'outfit'|'tone'>('head');
  const [error,setError]=useState('');const gate=useRef(false);
  return <InkPersonSheet title="衣著與造型" onClose={onClose} className="ink-appearance-sheet">
    <div className="ink-appearance-preview"><AppearanceCanvas appearance={draft} label={`${HEAD_LABELS[draft.head]}、${OUTFIT_LABELS[draft.outfit]}、${TONE_LABELS[draft.tone]}`}/></div>
    <div className="ink-appearance-tabs" role="tablist" aria-label="造型分類">{([{key:'head',label:'造型'},{key:'outfit',label:'衣著'},{key:'tone',label:'配色'}] as const).map(item=><button type="button" role="tab" key={item.key} aria-selected={tab===item.key} onClick={()=>setTab(item.key)}>{item.label}</button>)}</div>
    <div className="ink-appearance-choices" role="region" aria-label="可選造型">
      {tab==='head'&&APPEARANCE_HEADS.map(head=><button type="button" key={head} aria-label={HEAD_LABELS[head]} aria-pressed={draft.head===head} onClick={()=>setDraft({...draft,head})}><AppearanceCanvas appearance={{...draft,head}} mode="portrait"/><span>{HEAD_LABELS[head]}</span></button>)}
      {tab==='outfit'&&APPEARANCE_OUTFITS.map(outfit=><button type="button" key={outfit} aria-label={OUTFIT_LABELS[outfit]} aria-pressed={draft.outfit===outfit} onClick={()=>setDraft({...draft,outfit})}><AppearanceCanvas appearance={{...draft,outfit}}/><span>{OUTFIT_LABELS[outfit]}</span></button>)}
      {tab==='tone'&&APPEARANCE_TONES.map(tone=><button type="button" key={tone} aria-label={TONE_LABELS[tone]} aria-pressed={draft.tone===tone} onClick={()=>setDraft({...draft,tone})}><i style={{backgroundColor:`rgb(${APPEARANCE_COLOURS[tone].join(',')})`}} aria-hidden="true"/><span>{TONE_LABELS[tone]}</span></button>)}
    </div>
    <p className="ink-appearance-note">造型可自由更換，不影響裝備與能力。</p>
    {error&&<p role="alert">{error}</p>}
    <button type="button" className="ink-btn ink-btn--primary" disabled={busy} onClick={()=>{
      if(gate.current||busy)return;gate.current=true;
      if(onConfirm(readAppearance(draft)))onClose();else{gate.current=false;setError('此刻無法更換造型，請於交手結束後重試。');}
    }}>換上</button>
  </InkPersonSheet>;
}
