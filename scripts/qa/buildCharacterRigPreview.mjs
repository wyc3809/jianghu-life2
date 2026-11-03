/** 同一App元件的離線審閱副本；不代替App內測／TestFlight，不接核心或雲端。 */
import { build } from 'esbuild';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dir=path.join(root,'.local-online/rig-prototype'),out=path.join(root,'production/qa/evidence/redesign/character-rig-prototype');
await mkdir(dir,{recursive:true});await mkdir(out,{recursive:true});
const entry=path.join(dir,'preview-entry.tsx');await writeFile(entry,"import React from 'react';import{createRoot}from'react-dom/client';import CharacterRigLab from '../../src/prototypes/rigLab/CharacterRigLab';createRoot(document.getElementById('root')!).render(<CharacterRigLab onBack={()=>history.back()}/>);");
const bundle=await build({entryPoints:[entry],bundle:true,format:'iife',platform:'browser',target:'es2022',write:false,metafile:true,outfile:path.join(dir,'preview.js'),define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'true','import.meta.env.BASE_URL':'"/"','import.meta.env.VITE_CHARACTER_RIG_LAB':'"1"'},external:['/ink/*'],minify:true,jsx:'automatic',tsconfig:path.join(root,'tsconfig.json')});
const map=JSON.parse(await readFile('src/fx/actor/asset-map.json','utf8')),heads=JSON.parse(await readFile('src/appearance/asset-map.json','utf8')).heads,images={};
const paths=new Set([...Object.values(map).flatMap(o=>Object.values(o).map(d=>d.src)),...Object.values(heads),...['sword','blade','spear','staff'].map(k=>`ink/spar/weapon-${k}.webp`)]);
for(const src of paths)images[src]='data:image/webp;base64,'+(await readFile(path.join(root,'public',src))).toString('base64');
let css=(await readFile('src/components/ink/parchment-ui.css','utf8')).split('.ink-visually-hidden')[0];
css=css.replace("../../assets/fonts/parchment-brush.woff2",'data:font/woff2;base64,'+(await readFile('src/assets/fonts/parchment-brush.woff2')).toString('base64'));
css+='\n:root{--game-ui-font:"Noto Sans CJK TC","Microsoft JhengHei",sans-serif}body{margin:0;background:#f6efe0}button{font:inherit}\n'+bundle.outputFiles.find(f=>f.path.endsWith('.css')).text;
for(const match of [...css.matchAll(/url\(['"]?(\/ink\/[^)'" ]+)['"]?\)/g)]){const data='data:image/webp;base64,'+(await readFile(path.join(root,'public',match[1]))).toString('base64');css=css.replaceAll(match[1],data);}
const licenses={font:await readFile('public/ink/fonts/OFL-YujiBoku.txt','utf8')};
for(const input of Object.keys(bundle.metafile.inputs)){const found=input.match(/^(.*node_modules\/(?:@[^/]+\/[^/]+|[^/]+))\//);if(!found)continue;const pkg=path.resolve(root,found[1]);if(licenses[pkg])continue;for(const file of ['LICENSE','LICENSE.md','LICENSE.txt'])try{licenses[pkg]=await readFile(path.join(pkg,file),'utf8');break;}catch{}}
const legal=JSON.stringify(licenses).replaceAll('</script','<\\/script');
const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text.replaceAll('</script','<\\/script');
const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>人物動畫 · 同元件離線審閱</title><style>${css}</style></head><body><div id="root"></div><script type="application/json" id="preview-licenses">${legal}</script><script>window.__jianghuActorAssets=${JSON.stringify(images)};<\/script><script>${js}<\/script></body></html>`;
await writeFile(path.join(out,'playable.html'),html.replace(/^[\t ]+$/gm,''));console.log('RIG_PREVIEW_BYTES',Buffer.byteLength(html),'FULL_IMAGES',paths.size);
