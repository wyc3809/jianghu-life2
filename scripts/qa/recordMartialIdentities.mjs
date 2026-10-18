/** 實際產品呈現器，固定步進錄製；輸出影片時間正確，唔以截圖耗時當裝置 FPS。 */
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const out = path.resolve('production/qa/evidence/redesign/martial-identities');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding'] });
const base = process.env.QA_BASE_URL || 'http://localhost:5188/';
const arts = ['art_river_fist','sl_luohan_fist','pr_mountain_split','art_stone_palm','art_wind_chase','tm_flying_needle',
  'art_rain_sword','pr_wind_thread','art_thunder_blade','art_spear_cloud','art_weiqi_trap',
  'art_iron_body','pr_diamond_body','qg_broken_bridge','pr_cloud_step'];
const support = new Set(arts.slice(11));
const report = { seed:42, viewport:{width:390,height:844}, dpr:2, timing:'產品引擎固定步進24fps錄影；唔係裝置性能量測',
  resumedAfterCapture:!!process.env.QA_REMAINING_ONLY, previousAttempts:['開發熱更新曾中斷第一輪錄影；未當通過。','完成15門正常、慢速及切換片後，單一墨色情境30秒未出現舞台；該次未當通過。隔離開發依賴快取後重跑。'],cases:[], errors:[] };
const groups = [arts.filter((_,i)=>i%3===0),arts.filter((_,i)=>i%3===1),arts.filter((_,i)=>i%3===2)];

async function record(id, suffix='', params='') {
  const context = await b.newContext({ viewport:report.viewport, deviceScaleFactor:2 });
  const page = await context.newPage();
  await page.addInitScript(()=>performance.setResourceTimingBufferSize(5000));
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{ if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${base}?martial-preview=1&clean=1&art=${id}${support.has(id)?'&pose=1':''}${params}`,{waitUntil:'networkidle'});
  await page.bringToFront();
  try { await page.waitForFunction(()=>window.__martialBattleStage,{},{timeout:60000,polling:100}); }
  catch(e) { console.log('舞台未就緒',id,errors); throw e; }
  await page.waitForTimeout(1500);
  const info = await page.evaluate(({id,isSupport})=>{
    const stage=window.__martialBattleStage;
    window.qaAdvance=stage.update.bind(stage);window.qaDraw=stage.render.bind(stage);
    stage.update=()=>{};stage.render=()=>{};
    if(!isSupport) for(let n=0;n<600&&stage.attackT===null;n++)window.qaAdvance(1/60);
    else stage.inspectMartialPose(id,0);
    window.qaDraw();
    return { assets:[...stage.martialAssets.keys()], asset:stage.martialAssets.get(id)?.guard?'同類靜態後備':'專屬圖集',
      resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/martial/')).map(r=>({url:r.name.split('/').at(-1),bytes:r.transferSize})),
      activeArt:stage.martialId };
  },{id,isSupport:support.has(id)});
  const dir=`/tmp/martial-record/${id}${suffix}`;fs.mkdirSync(dir,{recursive:true});
  const slow=suffix.includes('slow');const frames=slow?120:72;
  const start=performance.now();
  for(let n=0;n<frames;n++){
    await page.evaluate(({id,isSupport,n,slow})=>{
      const st=window.__martialBattleStage;
      if(isSupport) st.inspectMartialPose(id,((n/24)*(slow?.25:1))%1.1);
      else {window.qaAdvance(1/48*(slow?.25:1));window.qaAdvance(1/48*(slow?.25:1));}
      window.qaDraw();
    },{id,isSupport:support.has(id),n,slow});
    if(n===5)await page.screenshot({path:`${out}/${id}${suffix}.png`});
    await page.screenshot({path:`${dir}/${String(n).padStart(4,'0')}.jpg`,type:'jpeg',quality:85});
  }
  execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','24','-i',`${dir}/%04d.jpg`,'-vf','scale=390:844','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',`${out}/${id}${suffix}.mp4`]);
  report.cases.push({id,suffix,frames,controlledSeconds:frames/24,renderAndCaptureWallMs:Math.round(performance.now()-start),...info,errors});
  report.errors.push(...errors);
  fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2)+'\n');
  await context.close();
  console.log('錄影完成',id,suffix);
}
if(!process.env.QA_REMAINING_ONLY){
  await Promise.all(groups.map(async group=>{for(const id of group)await record(id);}));
  await record('art_river_fist','-slow');
  await record('art_river_fist','-rotation','&rotation=1');
}
if(!process.env.QA_MATRIX_ONLY)for(const id of ['art_river_fist','sl_luohan_fist','pr_mountain_split','art_rain_sword','pr_wind_thread'])await record(id,'-mono','&effects=off&mono=1');

// 真正兩瀏覽器、三個手機 viewport；減少動態及素材全404後備。
for(const engine of ['chromium','webkit']){
  // 用同一個已安裝WebKit執行檔；user-space libGLES由LD_LIBRARY_PATH提供，唔依賴系統ldconfig快取。
  const browser=engine==='chromium'?b:await webkit.launch({executablePath:webkit.executablePath()});
  for(const width of [320,390,420]){
    const c=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});
    const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
    await p.goto(`${base}?martial-preview=1&art=art_stone_palm&clean=1`,{waitUntil:'networkidle'});
    await p.bringToFront();await p.waitForFunction(()=>window.__martialBattleStage,null,{polling:100});await p.waitForTimeout(1600);
    const check=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,quiet:window.__martialBattleStage.quiet,assets:[...window.__martialBattleStage.martialAssets.keys()]}));
    await p.screenshot({path:`${out}/${engine}-${width}-reduced.png`});report.cases.push({engine,width,check,errors});report.errors.push(...errors);
    fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2)+'\n');await c.close();
  }
  if(engine==='webkit')await browser.close();
}
const fail=await b.newContext({viewport:report.viewport,deviceScaleFactor:2});
const fp=await fail.newPage();await fp.route('**/ink/art/martial/**',route=>route.fulfill({status:404,body:''}));
await fp.goto(`${base}?martial-preview=1&art=art_stone_palm&clean=1`,{waitUntil:'networkidle'});
await fp.bringToFront();await fp.waitForFunction(()=>window.__martialBattleStage,null,{polling:100});const fallback=await fp.evaluate(()=>{
  const s=window.__martialBattleStage;const a=s.martialAssets.get('art_stone_palm');return {guard:a?.guard,embedded:a?.atlas.src.startsWith('data:image/'),family:'palm'};
});report.cases.push({case:'全部武學網絡素材404',fallback});await fp.screenshot({path:`out/fallback.png`.replace('out',out)});await fail.close();
fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2)+'\n');
await b.close();if(report.errors.length)process.exitCode=1;
