import type { CharacterAppearance } from '@interfaces/appearance';
import type { AppearanceAssets } from './assets';
import type { appearanceComposition } from './pose';

const heads=new WeakMap<AppearanceAssets,Map<string,HTMLCanvasElement>>();
const bridges=new WeakMap<AppearanceAssets,Map<string,HTMLCanvasElement>>();
const palettes=new WeakMap<AppearanceAssets,Map<string,number[]>>();
type Composition=ReturnType<typeof appearanceComposition>;

/** 只柔化頸底膚色；眼鼻、下顎、頭髮及鬍鬚保持原圖。 */
export function neckSkinOpacity(r:number,g:number,b:number,localY:number):number {
  if(r<140||g<100||b<75||r-g<=10||r-b<=23||g-b<=7)return 1;
  const t=Math.max(0,Math.min(1,(localY+13)/21));return 1-t*t*(3-2*t);
}

function palette(assets:AppearanceAssets,key:CharacterAppearance['head'],p:Composition):number[] {
  let cache=palettes.get(assets);if(!cache){cache=new Map();palettes.set(assets,cache);}const old=cache.get(key);if(old)return old;
  const im=assets.heads[key],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data,sum=[0,0,0];let count=0;
  for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
    const i=(yy*c.width+xx)*4,localY=p.head.y+yy/c.height*p.head.height,localX=p.head.x+xx/c.width*p.head.width;
    if(localY< -23||localY> -9||Math.abs(localX)>12||d[i+3]<180||d[i]<140||d[i]-d[i+1]<12||d[i]-d[i+2]<28)continue;
    for(let k=0;k<3;k++)sum[k]+=d[i+k];count++;
  }
  const result=count?sum.map(n=>n/count):[212,188,162];cache.set(key,result);return result;
}

/** 同一張頭只清理頸底一次，保留原臉與前景髮絲。 */
export function appearanceHead(assets:AppearanceAssets,a:CharacterAppearance,p:Composition):CanvasImageSource {
  if(!assets.neck)return assets.heads[a.head];
  let cache=heads.get(assets);if(!cache){cache=new Map();heads.set(assets,cache);}const key=`${a.head}:${a.outfit}`,old=cache.get(key);if(old)return old;
  const im=assets.heads[a.head],c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);const pixels=x.getImageData(0,0,c.width,c.height),d=pixels.data;
  for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
    const i=(yy*c.width+xx)*4,localY=p.head.y+yy/c.height*p.head.height,localX=p.head.x+xx/c.width*p.head.width;
    const skin=d[i]>=140&&d[i+1]>=100&&d[i+2]>=75&&d[i]-d[i+1]>10&&d[i]-d[i+2]>23&&d[i+1]-d[i+2]>7;
    d[i+3]*=neckSkinOpacity(d[i],d[i+1],d[i+2],localY);
    if(skin&&!insideOpening(a.outfit,localX,localY))d[i+3]*=Math.max(0,Math.min(1,(-localY-8)/10));
  }
  x.putImageData(pixels,0,0);cache.set(key,c);return c;
}

// 原圖領口內緣的世界座標；只用作裁切真實頸部位圖，沒有繪畫人物輪廓。
const OPENINGS={
  traveller:[[-14,-25],[-5,-27],[8,-25],[21,-20],[25,-15],[20,-10],[17,0],[13,10],[8,2],[4,-8],[-4,-18]],
  scholar:[[-11,-24],[-4,-26],[10,-24],[21,-20],[24,-16],[19,-11],[16,-3],[15,4],[12,7],[5,-6],[5,-10],[-7,-19]],
  cloak:[[-15,-25],[-4,-26],[10,-24],[23,-18],[25,-13],[20,-6],[16,1],[9,-1],[4,-10],[-5,-19]],
}satisfies Record<CharacterAppearance['outfit'],number[][]>;

function insideOpening(outfit:CharacterAppearance['outfit'],x:number,y:number):boolean {
  const points=OPENINGS[outfit];let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [xi,yi]=points[i],[xj,yj]=points[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}

/** 頸部填在衣領內；皮膚以原頭部取色，衣領前緣再遮擋，避免平切貼圖。 */
export function drawNeck(ctx:CanvasRenderingContext2D,assets:AppearanceAssets,a:CharacterAppearance,p:Composition):void {
  if(!assets.neck)return;
  const points=OPENINGS[a.outfit];
  ctx.save();ctx.translate(p.neck.x,p.neck.y);ctx.rotate(p.head.rotation);
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  {
    let cache=bridges.get(assets);if(!cache){cache=new Map();bridges.set(assets,cache);}let patch=cache.get(a.head);
    if(!patch){
      const image=assets.neck;patch=document.createElement('canvas');patch.width=image.naturalWidth;patch.height=image.naturalHeight;
      const x=patch.getContext('2d',{willReadFrequently:true})!;x.drawImage(image,0,0);const pixels=x.getImageData(0,0,patch.width,patch.height),d=pixels.data,col=palette(assets,a.head,p);
      for(let i=0;i<d.length;i+=4)for(let k=0;k<3;k++)d[i+k]=Math.min(255,d[i+k]*col[k]/[233,215,195][k]);
      x.putImageData(pixels,0,0);cache.set(a.head,patch);
    }
    ctx.drawImage(patch,-32,-46,67,65);
  }
  ctx.restore();
}
