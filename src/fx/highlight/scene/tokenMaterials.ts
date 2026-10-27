import * as THREE from 'three';
import { inkArtUrl } from '../../../ui/inkAssets';
import { chestMaterial } from './chestMaterials';

let jade: THREE.Texture | null = null;
const listeners=new Set<()=>void>();

/** 原創玉面圖片快取；遲到或缺圖只補畫，不重播學習或升階。 */
export function tokenJadeTexture(): THREE.Texture {
  if(jade)return jade;
  const notify=()=>listeners.forEach(listener=>listener());
  jade=typeof document==='undefined'?new THREE.Texture():new THREE.TextureLoader().load(inkArtUrl('art/token/jade.webp'),notify,undefined,()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#e1e7d7';ctx.fillRect(0,0,1,1);}
    if(jade){jade.image=canvas;jade.needsUpdate=true;}notify();
  });
  jade.colorSpace=THREE.SRGBColorSpace;jade.anisotropy=4;
  return jade;
}

/** 先載入小幅玉紋，金屬／繩絲沿用原有原創寶箱材質快取。 */
export function preloadTokenTexture():void { tokenJadeTexture(); }

/** 只有結果靜止時補畫；離場釋放監聽，不保留renderer。 */
export function watchTokenTexture(listener:()=>void):()=>void { listeners.add(listener);return()=>{listeners.delete(listener);}; }

/** 金屬柔光、玉石細紋及啞光繩絲，皆走硬件抗鋸齒單次渲染。 */
export function tokenMaterials() {
  return {
    metal:chestMaterial('metal','#fff2cf'),
    jade:new THREE.MeshPhongMaterial({color:'#f4f4e9',map:tokenJadeTexture(),shininess:35,specular:'#605e4d'}),
    relief:new THREE.MeshPhongMaterial({color:'#c5c6b8',shininess:48,specular:'#a6a38e'}),
    gem:new THREE.MeshPhongMaterial({color:'#e9ecdf',shininess:45,specular:'#8b8a6f'}),
    cord:chestMaterial('lining','#9c493b'),
  };
}
