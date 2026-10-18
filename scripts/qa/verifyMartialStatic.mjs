/** 核對開發服同Pages子路徑真正收到嘅圖片bytes，避免SPA HTML冒充200圖片。 */
import fs from 'node:fs';import crypto from 'node:crypto';
const dir='public/ink/art/martial';const names=fs.readdirSync(dir).filter(n=>n.endsWith('.webp'));const cases=[];
for(const base of ['http://127.0.0.1:5188/','http://127.0.0.1:5190/jianghu-life2/']){
 for(let i=0;i<names.length;i+=8)await Promise.all(names.slice(i,i+8).map(async name=>{
  const expected=fs.readFileSync(`${dir}/${name}`);const r=await fetch(base+'ink/art/martial/'+encodeURIComponent(name));const actual=Buffer.from(await r.arrayBuffer());const type=r.headers.get('content-type');const passed=r.status===200&&type?.includes('image/webp')&&expected.equals(actual);cases.push({base,name,status:r.status,type,passed,bytes:actual.length,sha256:crypto.createHash('sha256').update(actual).digest('hex')});
 }));
}
const result={images:names.length,cases:cases.length,passed:cases.every(c=>c.passed),errors:cases.filter(c=>!c.passed),checks:cases};fs.writeFileSync('production/qa/evidence/redesign/martial-identities-full/static-paths.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({images:result.images,cases:result.cases,passed:result.passed,errors:result.errors}));if(!result.passed)process.exitCode=1;
