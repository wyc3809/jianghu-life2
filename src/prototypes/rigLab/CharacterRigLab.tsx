import { useEffect, useRef, useState } from 'react';
import { APPEARANCE_HEADS, APPEARANCE_OUTFITS, APPEARANCE_TONES, type CharacterAppearance } from '@interfaces/appearance';
import { HEAD_LABELS, OUTFIT_LABELS, TONE_LABELS } from '@data/appearances';
import { ActorAnimator } from '../../fx/actor/animator';
import { loadActorAssets, type ActorAssets } from '../../fx/actor/assets';
import { drawActor } from '../../fx/actor/renderer';
import type { ActorAction, ActorGrip } from '../../fx/actor/poses';
import { createVisualLoop, watchVisualActivity } from '../../ui/visualActivity';
import './rig-lab.css';
const ACTIONS:readonly [ActorAction,string][]=[['idle','待機'],['walk','走路'],['run','跑步'],['attack','出招'],['hurt','受擊'],['knockback','擊退'],['down','倒地'],['getup','起身']];
const WEAPONS:Record<string,string>={none:'徒手',sword:'劍',blade:'刀',spear:'槍',staff:'棍'};
const GRIPS:Record<ActorGrip,string>={unarmed:'徒手',one:'單手持握',two:'雙手持握',back:'背負'};
type Picker='head'|'outfit'|'tone'|'weapon'|'grip';
interface LabStats {action:string;time:number;step:number;invalid:number;errors:readonly string[];drawMs:number}
/** App開發／內測用真骨架驗收入口；沒有核心動作、獎勵或存檔寫入。 */
export default function CharacterRigLab({onBack}:{onBack?:()=>void}={}){
 const [animator]=useState(()=>new ActorAnimator()),[assets,setAssets]=useState<ActorAssets|null>(null),[loadError,setLoadError]=useState(''),[attempt,setAttempt]=useState(0);
 const [appearance,setAppearance]=useState<CharacterAppearance>({head:'topknot',outfit:'traveller',tone:'ink'});
 const [weapon,setWeapon]=useState('none'),[grip,setGrip]=useState<ActorGrip>('unarmed'),[face,setFace]=useState<1|-1>(1),[debug,setDebug]=useState(false),[paused,setPaused]=useState(false),[speed,setSpeed]=useState(1);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.inkMotion==='reduce');
 const [tab,setTab]=useState<'actions'|'appearance'|'checks'>('actions'),[picker,setPicker]=useState<Picker|null>(null);
 const [stats,setStats]=useState<LabStats>({action:'idle',time:0,step:0,invalid:0,errors:[],drawMs:0});
 const canvas=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDialogElement>(null),loop=useRef<ReturnType<typeof createVisualLoop>|null>(null),drawRef=useRef(()=>{}),active=useRef(true);
 const config=useRef({appearance,weapon,grip,face,debug,paused,reduced,speed});config.current={appearance,weapon,grip,face,debug,paused,reduced,speed};
 const refresh=()=>{const c=config.current;animator.setActive(active.current&&!c.paused&&!c.reduced);loop.current?.setActive(active.current&&!c.paused&&!c.reduced);};
 useEffect(()=>{let alive=true;setLoadError('');void loadActorAssets().then(a=>{if(alive)setAssets(a);}).catch(e=>{if(alive)setLoadError(e.message);});return()=>{alive=false;};},[attempt]);
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(m.matches||document.documentElement.dataset.inkMotion==='reduce');m.addEventListener('change',update);const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-ink-motion']});return()=>{m.removeEventListener('change',update);observer.disconnect();};},[]);
 useEffect(()=>{
  if(!assets||!canvas.current)return;
  const el=canvas.current,ctx=el.getContext('2d')!;let width=390,height=400,dpr=2,published=0;
  const draw=()=>{
   const started=performance.now(),c=config.current,f=animator.frame;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   const landing=Math.max(0,Math.min(1,-f.pose.rotations.pelvis/90)),pan=landing*(c.grip==='back'&&['spear','staff'].includes(c.weapon)?100:c.weapon==='none'?35:65);
   const floor=height-35,scale=Math.min(330,(height-55)*400/440,(width-28)*400/530)/400;
   // 原宣紙場景加細地線；世界地標隨鏡頭移動，實測支撐腳而非用腳步圖扮走路。
   ctx.strokeStyle='#9d9077';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,floor);ctx.lineTo(width-12,floor);ctx.stroke();
   for(let i=-8;i<9;i++){const x=width/2+(i*50-(f.pose.root.x%50)+pan)*scale*c.face;ctx.fillStyle='#b8aa91';ctx.fillRect(x,floor+1,1,5);}
   drawActor(ctx,assets,f,{x:width/2+pan*scale*c.face,y:floor,height:scale*400,face:c.face,appearance:c.appearance,weapon:c.weapon,grip:c.grip,debug:c.debug});
   if(started-published>100||c.paused||c.reduced){published=started;setStats({action:f.action,time:f.time,step:f.step,invalid:animator.invalidFrames,errors:f.violations,drawMs:performance.now()-started});}
  };
  drawRef.current=draw;
  const resize=()=>{const r=el.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);draw();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  loop.current=createVisualLoop((_now,dt)=>{animator.advance(dt*config.current.speed);draw();});
  const unwatch=watchVisualActivity(value=>{active.current=value;refresh();},{element:el,dialogs:true});refresh();
  if(import.meta.env.DEV)Object.assign(window,{__characterRigLab:{animator,draw,assets,get config(){return config.current;}}});
  return()=>{loop.current?.dispose();loop.current=null;unwatch();observer.disconnect();drawRef.current=()=>{};if(import.meta.env.DEV)delete (window as unknown as {__characterRigLab?:unknown}).__characterRigLab;};
 },[assets,animator]);
 useEffect(()=>{animator.setReduced(reduced);refresh();drawRef.current();},[paused,reduced,assets]);
 useEffect(()=>{animator.setGrip(grip);drawRef.current();},[appearance,weapon,grip,face,debug,speed,animator]);
 useEffect(()=>{if(picker)dialog.current?.showModal();else dialog.current?.close();},[picker]);
 function play(action:ActorAction){animator.play(action);drawRef.current();}
 function choose(value:string){if(!picker)return;if(['head','outfit','tone'].includes(picker))setAppearance(a=>({...a,[picker]:value}));if(picker==='weapon'){setWeapon(value);setGrip(value==='none'?'unarmed':['spear','staff'].includes(value)?'two':'one');}if(picker==='grip')setGrip(value as ActorGrip);setPicker(null);}
 const choices=picker==='head'?APPEARANCE_HEADS.map(id=>[id,HEAD_LABELS[id]]):picker==='outfit'?APPEARANCE_OUTFITS.map(id=>[id,OUTFIT_LABELS[id]]):picker==='tone'?APPEARANCE_TONES.map(id=>[id,TONE_LABELS[id]]):picker==='weapon'?Object.entries(WEAPONS):Object.entries(GRIPS).filter(([id])=>weapon==='none'?id==='unarmed':id==='one'||id==='back'||id==='two'&&['spear','staff'].includes(weapon));
 const titles:Record<Picker,string>={head:'選擇頭部',outfit:'選擇衣著',tone:'選擇配色',weapon:'選擇兵器',grip:'選擇持握'};
 const selected=picker?['head','outfit','tone'].includes(picker)?appearance[picker as keyof CharacterAppearance]:picker==='weapon'?weapon:grip:'';
 const phase=stats.action==='attack'?(stats.time<.25?'蓄勢':stats.time<.65?'出招':'收招'):'';
 const locked=['down','grounded','getup'].includes(stats.action);
 const actionName=phase||(ACTIONS.find(a=>a[0]===stats.action)?.[1]??'伏地');
 return <main className="rig-lab" aria-label="角色動畫驗收" data-action={stats.action} data-step={stats.step}>
  <header className="rig-lab-header"><button onClick={onBack??(()=>location.assign(import.meta.env.BASE_URL))} aria-label="返回遊戲">‹ 返回</button><h1>人物動畫</h1><span>內測原型</span></header>
  <p className="rig-lab-caption">{HEAD_LABELS[appearance.head]} · {OUTFIT_LABELS[appearance.outfit]}<span>{actionName} · {stats.time.toFixed(2)}秒</span></p>
  <section className="rig-lab-stage" aria-label="單角色骨架場景"><canvas ref={canvas} aria-label="可操作的水墨骨架人物"/>{!assets&&<div role="status">{loadError||'正在準備人物'}{loadError&&<button onClick={()=>setAttempt(v=>v+1)}>重試</button>}</div>}{assets?.simplified&&<small className="rig-lab-fallback">使用同造型縮圖後備</small>}</section>
  <div className="rig-lab-transport" aria-label="播放控制">
   <button onClick={()=>setPaused(v=>!v)} disabled={reduced}>{paused?'繼續':'暫停'}</button>
   <button onClick={()=>{setPaused(true);animator.step();drawRef.current();}} aria-label="前進一幀">逐幀</button>
   <button onClick={()=>setSpeed(v=>v===1?.5:v===.5?.25:1)} aria-label="播放速度">{speed}×</button>
   <button onClick={()=>setFace(v=>v===1?-1:1)} aria-label="左右轉向">轉向</button>
   <button onClick={()=>setDebug(v=>!v)} aria-pressed={debug}>骨架</button>
   <button onClick={()=>{animator.reset();animator.setGrip(grip);drawRef.current();}}>重置</button>
  </div>
  <nav className="rig-lab-tabs" aria-label="驗收內容">{([['actions','動作'],['appearance','造型'],['checks','檢查']] as const).map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  <section className="rig-lab-panel">
   {tab==='actions'&&<><div className="rig-lab-actions">{ACTIONS.map(([id,label])=><button key={id} aria-pressed={stats.action===id} disabled={!assets||id==='down'&&['down','grounded'].includes(stats.action)||locked&&!['getup','down','hurt','knockback'].includes(id)||['down','grounded'].includes(stats.action)&&['hurt','knockback'].includes(id)||id==='getup'&&stats.action!=='grounded'&&!(stats.action==='down'&&stats.time>=.85)} onClick={()=>play(id)}>{label}</button>)}<button disabled={!assets||locked} onClick={()=>{animator.inspect('attack',.12);setPaused(true);drawRef.current();}}>蓄勢</button><button disabled={!assets||locked} onClick={()=>{animator.inspect('attack',.8);setPaused(true);drawRef.current();}}>收招</button></div><p>{reduced?'減少動態：按動作查看固定姿勢，可逐幀檢視。':paused?'已暫停，可逐幀檢查接點。':'出招包含蓄勢與收招；倒地後可選起身。'}</p></>}
   {tab==='appearance'&&<div className="rig-lab-choices">{([['head',HEAD_LABELS[appearance.head]],['outfit',OUTFIT_LABELS[appearance.outfit]],['tone',TONE_LABELS[appearance.tone]],['weapon',WEAPONS[weapon]],['grip',GRIPS[grip]]]as const).map(([id,value])=><button key={id} aria-label={`${titles[id].replace('選擇','')}：${value}`} onClick={()=>setPicker(id)}>{titles[id].replace('選擇','')}<strong>{value}</strong></button>)}</div>}
   {tab==='checks'&&<div className="rig-lab-checks"><p role="status">累計異常：<strong>{stats.invalid}</strong> · 固定步：{stats.step}</p><p>{stats.errors.join('、')||'接點、骨長、角度及地面檢查已啟用。'}</p><p>本次繪圖 {stats.drawMs.toFixed(2)} ms · 1/60 秒求解</p><p>此頁不寫入存檔或結算戰鬥。真機效能與動作品質另行驗收。</p></div>}
  </section>
  <dialog className="rig-lab-dialog" ref={dialog} onCancel={()=>setPicker(null)} aria-label={picker?titles[picker]:'選擇造型'}><header><h2>{picker?titles[picker]:''}</h2><button onClick={()=>setPicker(null)} aria-label="關閉選擇">×</button></header><div>{choices.map(([id,label])=><button key={id} aria-pressed={selected===id} onClick={()=>choose(id)}>{label}</button>)}</div></dialog>
 </main>;
}
