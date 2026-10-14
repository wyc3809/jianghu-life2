// 配合npm run build:pages及VITE_BASE=/jianghu-life2/ npm run preview。
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5185/jianghu-life2/',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'開卷',exact:true}).waitFor({timeout:15000});
const names=fs.readdirSync('public/ink/spar/commercial').filter(x=>x.endsWith('.webp'));
const assets=await page.evaluate(async names=>{
 const results=[];
 for(let i=0;i<names.length;i+=10)results.push(...await Promise.all(names.slice(i,i+10).map(async name=>{
  const response=await fetch(`/jianghu-life2/ink/spar/commercial/${name}`);
  return {name,status:response.status,image:response.headers.get('content-type')?.includes('image/webp')};
 })));
 return results;
},names);
const report={url:page.url(),assets,errors,passed:errors.length===0&&assets.every(a=>a.status===200&&a.image)};
fs.writeFileSync('production/qa/evidence/redesign/spar-commercial/pages-paths.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,assets:assets.length,errors}));
await browser.close();if(!report.passed)process.exitCode=1;
