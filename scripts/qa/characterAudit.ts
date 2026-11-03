/** 隔離審查入口：只呼叫現有繪圖器，沒有存檔、戰果或新骨架實作。 */
import { loadAppearanceAssets } from '../../src/appearance/assets';
import { drawAppearance } from '../../src/appearance/model';
import { appearanceComposition, appearanceBodyFrame } from '../../src/appearance/pose';
import { loadWarAssets } from '../../src/sectBattle/assets';
import { drawWarCharacter } from '../../src/sectBattle/character';
const assets = await loadAppearanceAssets();
const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const ctx = canvas.getContext('2d')!;
const status = document.querySelector('#status')!;
const phases = ['idle', 'walk', 'attack', 'hurt', 'down'] as const;
let phase: typeof phases[number] = 'idle', origin = performance.now(), paused = false, fixed = 0, face = 1, head = 'topknot', family = 'sword', reduced = false;
let cycle = false;
const outfits = ['traveller', 'scholar', 'cloak'] as const;
const history: {phase:string;frame:string;t:number}[] = [];
function paint(t: number) {
  if (cycle) { const step = Math.floor(t / 1.4) % 5; phase = phases[step]; t %= 1.4; }
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,390,650);
  ctx.fillStyle='#e5dccb';ctx.fillRect(0,600,390,2);
  for (let i = 0; i < outfits.length; i++) {
    // 三套原圖相同高度參數；無另加移動、縮放、物理或動畫。
    drawAppearance(ctx, assets, {head:head as 'topknot',outfit:outfits[i],tone:'ink'}, {x:65+i*130,y:600,height:280,face,pose:phase,time:t,family,reduced});
    ctx.fillStyle='#292723';ctx.font='15px serif';ctx.fillText(outfits[i],10+i*130,630);
  }
  const frame=appearanceBodyFrame(phase,t,reduced);
  status.textContent=`${phase} → ${frame} · ${t.toFixed(3)}s · face ${face}`;
  if(history.at(-1)?.frame!==frame||history.at(-1)?.phase!==phase)history.push({phase,frame,t});
}
for(const label of [...phases,'循環','暫停','逐幀','轉向']){
  const b=document.createElement('button');b.textContent=label;document.querySelector('#controls')!.append(b);
  b.onclick=()=>{if(label==='循環'){cycle=true;origin=performance.now();paused=false;}else if(label==='暫停'){fixed=(performance.now()-origin)/1000;paused=!paused;if(!paused)origin=performance.now()-fixed*1000;}else if(label==='逐幀'){paused=true;fixed+=1/60;}else if(label==='轉向'){face*=-1;}else{phase=label as typeof phase;origin=performance.now();fixed=0;cycle=false;paused=false;}};
}
function loop(now:number){paint(paused?fixed:(now-origin)/1000);requestAnimationFrame(loop);}requestAnimationFrame(loop);
const audit={ready:true,history,assets,simplified:assets.simplified,
  set(v:{phase?:typeof phase;time?:number;face?:number;head?:string;family?:string;reduced?:boolean}){cycle=false;paused=true;phase=v.phase??phase;fixed=v.time??fixed;face=v.face??face;head=v.head??head;family=v.family??family;reduced=v.reduced??reduced;paint(fixed);},
  anchors(){return outfits.map(outfit=>phases.flatMap(p=>[0,.139,.141,.399,.401,.529,.531,1].map(t=>{const frame=appearanceBodyFrame(p,t,false);return{outfit,pose:p,t,frame,...appearanceComposition({head:'topknot',outfit,tone:'ink'},frame,assets.heads.topknot.naturalWidth/assets.heads.topknot.naturalHeight)};})));},
  async sheet(war=false){
    const c=document.createElement('canvas');c.width=1880;c.height=1000;const x=c.getContext('2d')!;x.fillStyle='#f5efe2';x.fillRect(0,0,c.width,c.height);x.fillStyle='#292723';x.font='24px serif';x.fillText(war?'主線已發布會武繪圖器（只讀對照）':'主線共用造型繪圖器 · 相同 height=280',18,30);
    const wa=war?await loadWarAssets():null;
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const p=(['idle','walk','attack','attack','hurt','down']as const)[col], t=[0,.2,.02,.2,.2,.5][col],a={head:'topknot' as const,outfit:outfits[row],tone:'ink' as const};
      const px=col*280+140,py=row*310+330;
      x.strokeStyle='#cbbfab';x.beginPath();x.moveTo(col*280,py);x.lineTo(col*280+280,py);x.stroke();
      if(wa)drawWarCharacter(x,wa,a,(['idle','walkA','windup','strikeA','hurt','down'] as const)[col],px,py,280,1,'sword');
      else drawAppearance(x,assets,a,{x:px,y:py,height:280,pose:p,time:t,family:'sword'});
      x.fillStyle='#292723';x.font='16px serif';x.fillText(`${outfits[row]} ${p} ${t}`,col*280+8,py+22);
    }return c.toDataURL('image/png');
  }
};
Object.assign(window,{__characterAudit:audit});
