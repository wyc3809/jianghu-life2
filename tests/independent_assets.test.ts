import{afterEach,describe,it,expect,vi}from'vitest';
import{readFileSync}from'node:fs';
import{IndependentTextures}from'../src/appearance/independent/assets';
import{INDEPENDENT_INDEX}from'../src/appearance/independent/frames';
function fixture(size=256){
 const made:{width:number;height:number}[]=[];
 vi.stubGlobal('window',{});vi.stubGlobal('Image',class{naturalWidth=size;naturalHeight=size;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_:string){queueMicrotask(()=>this.onload?.());}});
 vi.stubGlobal('document',{createElement:()=>{const c={width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(16)}),putImageData(){}})};made.push(c);return c;}});
 const fetch=vi.fn(async(url:string)=>({ok:true,json:async()=>JSON.parse(readFileSync('public/'+decodeURIComponent(url.replace(/^\//,'')),'utf8'))}));vi.stubGlobal('fetch',fetch);return{made,fetch};
}
afterEach(()=>vi.unstubAllGlobals());
describe('獨立動作的手機素材生命週期',()=>{
 it('test_independent_assets_反覆換武學_超出32段就真正釋放舊Canvas而不只移除索引',async()=>{
  const{made}=fixture(),s=new IndependentTextures(),a={head:'bamboo',outfit:'traveller',tone:'ink'},ids=Object.keys(INDEPENDENT_INDEX.clips).filter(id=>!id.startsWith('_')).slice(0,33);
  for(const id of ids)await s.prepareClip(a,id);
  expect(s.stats().failures).toBe(0);expect(s.stats().clips).toBe(32);expect(made[0].width).toBe(0);expect(made[0].height).toBe(0);expect(s.getClip(a,ids.at(-1)!)).toBeDefined();
 });
 it('test_independent_assets_大圖及換頭_按解碼像素守預算並釋放連續上身快取',async()=>{
  const{made}=fixture(4096),s=new IndependentTextures(),a={head:'bamboo',outfit:'traveller',tone:'jade'};
  await s.prepareClip(a,'art_river_fist');await s.prepareClip(a,'art_stone_palm');expect(s.stats().clips).toBe(1);expect(s.stats().pixels).toBeLessThanOrEqual(24_000_000);expect(made[0].width).toBe(0);
  const start=made.length;for(const head of['bamboo','topknot','master','silver','bun'])await s.prepareUpper({...a,head});expect(s.stats().uppers).toBe(4);expect(made[start].width).toBe(0);
 });
 it('test_independent_assets_缺圖冷卻_連續繪製不反覆下載或改用別門身份',async()=>{
  const{fetch}=fixture(),s=new IndependentTextures(),a={head:'bun',outfit:'scholar',tone:'sand'};fetch.mockImplementation(async()=>{throw Error('失圖測試')});await s.prepareClip(a,'art_rain_sword');
  for(let i=0;i<20;i++)expect(s.getClip(a,'art_rain_sword')).toBeUndefined();expect(fetch).toHaveBeenCalledTimes(1);expect(s.stats().failures).toBe(1);expect(s.stats().clips).toBe(0);
 });
});
