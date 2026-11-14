import catalog from './catalog.json';
import wardrobe from './wardrobe-catalog.json';
import { appearanceKey, readAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';

type Figure = { src:string; bounds:number[]; portrait:number[]; sha256:string };
const figures = catalog.figures as Record<string,Figure>;
const costumes = wardrobe.figures as Record<string,Figure>;
const specFor=(a:ReturnType<typeof readAppearance>):Figure=>a.costume?costumes[`${a.head}-${a.costume}`]:figures[`${a.head}-${a.outfit}`];
const cache = new Map<string,CanvasImageSource>();
const pending = new Map<string,Promise<CanvasImageSource>>();

/** 只調整綠色衣料；皮膚、霜髮、皮革及朱砂腰帶保留原色。 */
export function tintManhuaCloth(data:Uint8ClampedArray, colour:readonly number[],width=data.length/4):void {
  const height=data.length/4/width,stride=width+1,sums=new Float32Array((width+1)*(height+1));
  for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){
    const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    row+=data[i+3]&&g>=r-2&&g-b>=3&&g>=25?1:0;
    sums[(y+1)*stride+x+1]=sums[y*stride+x+1]+row;
  }}
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    if(!data[i+3]||r-g>10||g<25)continue;
    const x=i/4%width,y=Math.floor(i/4/width),radius=width>16?3:0;
    const l=Math.max(0,x-radius),t=Math.max(0,y-radius),right=Math.min(width,x+radius+1),bottom=Math.min(height,y+radius+1);
    const strength=(sums[bottom*stride+right]-sums[t*stride+right]-sums[bottom*stride+l]+sums[t*stride+l])/((right-l)*(bottom-t));
    if(!strength)continue;
    const light=(r*.2126+g*.7152+b*.0722)/100;
    for(let c=0;c<3;c++)data[i+c]=Math.round(data[i+c]*(1-strength)+Math.min(247,colour[c]*light)*strength);
  }
}

/** 每款完整立繪按需要載入；失敗移除排程，容許同身份後備及稍後重試。 */
export function loadManhuaFigure(value:unknown):Promise<CanvasImageSource>{
  const a=readAppearance(value),key=appearanceKey(a),existing=cache.get(key);
  if(existing){cache.delete(key);cache.set(key,existing);return Promise.resolve(existing);}
  const waiting=pending.get(key);if(waiting)return waiting;
  const task=(async()=>{
    const spec=specFor(a);if(!spec)throw Error('服飾素材尚未提供');
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const im=new Image(),timer=window.setTimeout(()=>{im.onload=im.onerror=null;reject(Error('立繪載入逾時'));},6000);
      im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(Error('立繪未能載入'));};
      im.src=`${import.meta.env.BASE_URL}${spec.src}?v=${spec.sha256.slice(0,12)}`;
    });
    let result:CanvasImageSource=image;
    if(!a.costume&&a.tone!=='jade'){
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);tintManhuaCloth(pixels.data,APPEARANCE_COLOURS[a.tone],canvas.width);ctx.putImageData(pixels,0,0);result=canvas;
    }
    cache.set(key,result);while(cache.size>16)cache.delete(cache.keys().next().value!);
    return result;
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
}

/** 完整圖等比例顯示；頭像只裁上半幅，不對頭身分件或改變雙腳比例。 */
export function drawManhuaFigure(ctx:CanvasRenderingContext2D,image:CanvasImageSource,value:unknown,w:number,h:number,portrait:boolean):void{
  const a=readAppearance(value),spec=specFor(a);
  if(portrait){const [x,y,cw,ch]=spec.portrait;const size=Math.min(w,h);ctx.drawImage(image,x,y,cw,ch,(w-size)/2,(h-size)/2,size,size);return;}
  const [left,top,right,bottom]=spec.bounds;
  const scale=Math.min(w*.94/(right-left),h*.9/(bottom-top));
  ctx.drawImage(image,w*.5-(left+right)*.5*scale,h*.95-bottom*scale,catalog.width*scale,catalog.height*scale);
}
