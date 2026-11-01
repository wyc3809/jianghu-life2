import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out='/workspace/deliverables/sect-war-revision';
await mkdir(out,{recursive:true});
const define={'process.env.NODE_ENV':'"production"','import.meta.env.PROD':'true','import.meta.env.DEV':'false','import.meta.env.BASE_URL':'""','import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""','import.meta.env.VITE_ONLINE_PUBLIC':'"0"','import.meta.url':'"https://review.invalid/"','import.meta.env':'{}'};
const worker=await build({entryPoints:['src/sectBattle/replay.worker.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,define});
const workerUrl='data:text/javascript;base64,'+Buffer.from(worker.outputFiles[0].contents).toString('base64');
const war=JSON.parse(await readFile('src/sectBattle/assets.json','utf8'));
const common=JSON.parse(await readFile('src/prototypes/sectBattle/assets.json','utf8'));
const appearance=JSON.parse(await readFile('src/appearance/asset-map.json','utf8'));
const paths=new Set();
function visit(v){if(typeof v==='string'&&v.startsWith('ink/'))paths.add(v);else if(v&&typeof v==='object')Object.values(v).forEach(visit);}
visit(war);visit(common);visit(appearance);
for(const kind of ['sword','blade','spear','staff','whip','bow','hidden'])paths.add('ink/spar/weapon-'+kind+'.webp');
const images={};for(const name of paths){try{images[name]='data:image/webp;base64,'+(await readFile(path.join(root,'public',name))).toString('base64');}catch{}}
const app=await build({stdin:{contents:`import React,{useState}from'react';import{createRoot}from'react-dom/client';import War from'./src/components/ink/InkSectWar';function Review(){const[open,setOpen]=useState(true);return open?React.createElement(War,{initialTrial:true,onBack:()=>setOpen(false)}):React.createElement('main',{style:{padding:30,fontFamily:'serif'}},React.createElement('h1',null,'門派會武 · 畫面驗收'),React.createElement('p',null,'未發布試演，只檢視畫面與操作，不連接帳戶或派發獎勵。'),React.createElement('button',{onClick:()=>setOpen(true),style:{padding:16}},'重新查看'));}createRoot(document.getElementById('root')).render(React.createElement(Review));`,resolveDir:root,sourcefile:'review-entry.tsx',loader:'tsx'},bundle:true,write:false,outdir:out,format:'iife',platform:'browser',target:'es2022',minify:true,define,loader:{'.webp':'dataurl','.woff2':'dataurl','.png':'dataurl','.jpg':'dataurl'},plugins:[{name:'inline-review-worker',setup(b){b.onResolve({filter:/^\/(ink|fonts)\//},a=>({path:path.join(root,'public',a.path.slice(1))}));b.onResolve({filter:/replay\.worker\?worker&url$/},()=>({path:'worker-url',namespace:'review'}));b.onLoad({filter:/.*/,namespace:'review'},()=>({contents:'export default '+JSON.stringify(workerUrl),loader:'js'}));}}]});
const js=app.outputFiles.find(f=>f.path.endsWith('.js')).text,css=app.outputFiles.find(f=>f.path.endsWith('.css')).text;
const html=`<!doctype html><html lang="zh-Hant"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>門派會武 · 未發布畫面驗收</title><style>html,body{margin:0;background:#f4ecdd}${css}</style><div id="root"></div><p style="position:fixed;bottom:2px;left:0;right:0;text-align:center;margin:0;z-index:99999;font:10px serif;color:#7a6b54;pointer-events:none">畫面驗收版・未發布</p><script>window.CapacitorCustomPlatform={name:'ios'};window.__sectPreviewAssets=${JSON.stringify(images)};window.__jianghuAppearanceAssets=window.__sectPreviewAssets;</script><script>${js.replaceAll('</script','<\\/script')}</script></html>`;
const licenses=(await Promise.all(['public/ink/fonts/OFL-YujiBoku.txt','public/ink/fonts/OFL-LXGW-WenKai-TC.txt'].map(p=>readFile(p,'utf8')))).join('\n\n');
await writeFile(path.join(out,'門派會武-畫面驗收.html'),html.replace('</html>','<script type="application/json" id="font-license-notices">'+JSON.stringify(licenses).replaceAll('</','<\\/')+'</script></html>'));
await writeFile(path.join(out,'FONT-LICENSES.txt'),licenses);
console.log('REVIEW_HTML',Buffer.byteLength(html),'bytes; real React component, real renderer, real worker, embedded assets; no cloud configuration');
