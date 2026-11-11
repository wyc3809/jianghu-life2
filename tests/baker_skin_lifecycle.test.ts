import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

describe('離線換頭貼圖共用來源生命週期',()=>{
 it('test_baker_skin_手臂與拳頭共用region_只釋放舊貼圖且新面孔仍可畫',async()=>{
  const source=readFileSync('scripts/art/bake_independent_motions.py','utf8');
  const start=source.indexOf('window.skin=async'),end=source.indexOf('\nwindow.upper=',start);
  expect(start).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);
  const textures:{disposed:boolean;disposeCount:number;dispose:()=>void}[]=[];
  class Texture {
   disposed=false;disposeCount=0;
   constructor(){textures.push(this);}
   dispose(){this.disposed=true;this.disposeCount++;}
  }
  const old=new Texture(),page={texture:old},arm={texture:old,page},body={texture:old,page};
  const context=vm.createContext({window:{},outfit:'traveller',Image:class{src='';naturalWidth=20;naturalHeight=20;decode(){return Promise.resolve();}},document:{createElement:()=>({getContext:()=>({drawImage(){},clearRect(){}})})},spine:{GLTexture:Texture},player:{context:{},skeleton:{data:{defaultSkin:{getAttachments:()=>[{attachment:{region:arm}},{attachment:{region:body}},{attachment:{region:arm}}]}}}}});
  vm.runInContext(source.slice(start,end),context);
  await vm.runInContext("window.skin('bamboo',[0,0,10,10])",context);
  expect(old.disposeCount).toBe(1);expect(arm.texture).toBe(textures[1]);expect(body.texture).toBe(textures[1]);expect(textures[1].disposed).toBe(false);
  await vm.runInContext("window.skin('silver',[0,0,10,10])",context);
  expect(textures[1].disposeCount).toBe(1);expect(textures[2].disposed).toBe(false);expect(page.texture).toBe(textures[2]);
 });
});
