"""在固定軟體WebGL環境量度正常全流程；不把桌面FPS當成iPhone數據。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,statistics,time
BASE=os.getenv('CHEST_BASE','http://127.0.0.1:5180/')
MODE=os.getenv('CHEST_MODE','after')
DPR=float(os.getenv('CHEST_DPR','1'))
VIDEO=os.getenv('CHEST_VIDEO','0')=='1'
OUT=Path('production/qa/evidence/redesign/chest-quality')/MODE
OUT.mkdir(parents=True,exist_ok=True)
video=Path('.local-online/chest-quality/video')/MODE;video.mkdir(parents=True,exist_ok=True)
INIT='''(()=>{const q=window.qaFx={frames:[],draws:0,cpu:0,buffers:[]};
 const real=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>real(t=>{const s=performance.now();cb(t);q.cpu+=performance.now()-s});
 for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C){
  for(const key of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const fn=C.prototype[key];if(fn)C.prototype[key]=function(...a){q.draws++;return fn.apply(this,a)}}
  const fn=C.prototype.renderbufferStorageMultisample;if(fn)C.prototype.renderbufferStorageMultisample=function(...a){q.buffers.push(a.slice(1));return fn.apply(this,a)};
 }
 let prev=0;real(function sample(t){const phase=document.querySelector('[data-subject]')?.dataset.phase;
 if(prev&&phase)q.frames.push({phase,dt:t-prev,draws:q.draws,cpu:q.cpu});prev=t;q.draws=0;q.cpu=0;real(sample)});
})();'''
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for grade in json.loads(os.getenv('CHEST_GRADES','[1,5]')):
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=DPR,is_mobile=True,has_touch=True,**({'record_video_dir':str(video),'record_video_size':{'width':390,'height':844}} if VIDEO else {}))
  c.add_init_script(INIT)
  c.route('**/*.supabase.co/**',lambda r:r.abort())
  c.route('**/fonts.googleapis.com/**',lambda r:r.abort())
  c.route('**/fonts.gstatic.com/**',lambda r:r.abort())
  page=c.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+f'?fx=highlight&mode=chest&grade={grade}',wait_until='domcontentloaded')
  page.locator('[data-subject="chest"]').wait_for(timeout=60000)
  page.wait_for_timeout(1800)
  page.screenshot(path=str(OUT/f'grade-{grade}-idle.png'))
  for n in range(grade):
   page.locator('[data-subject="chest"]').wait_for(state='visible')
   page.mouse.click(195,350)
   page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="upgrading"')
   if n==0:
    page.wait_for_timeout(280);page.screenshot(path=str(OUT/f'grade-{grade}-spin.png'))
   page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="idle"',timeout=120000)
  page.mouse.click(195,350)
  page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="charging"')
  page.wait_for_timeout(350)
  page.screenshot(path=str(OUT/f'grade-{grade}-charge.png'))
  page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="settle"',timeout=60000)
  page.wait_for_timeout(900)
  page.screenshot(path=str(OUT/f'grade-{grade}-open.png'))
  q=page.evaluate('window.qaFx');stats={}
  for phase in sorted(set(f['phase'] for f in q['frames'])):
   frames=[f for f in q['frames'] if f['phase']==phase]
   def p95(k):return sorted(f[k] for f in frames)[min(len(frames)-1,int(len(frames)*.95))]
   stats[phase]={'frames':len(frames),'frameP50':statistics.median(f['dt'] for f in frames),'frameP95':p95('dt'),'cpuP95':p95('cpu'),'drawCallsMedian':statistics.median(f['draws'] for f in frames)}
  results.append({'grade':grade,'stats':stats,'buffers':q['buffers'],'errors':errors,'video':page.video.path() if page.video else None})
  c.close()
 b.close()
(OUT/'profile.json').write_text(json.dumps({'base':BASE,'device':f'Chromium mobile 390x844 DPR{DPR} SwiftShader, not iPhone','results':results},indent=2)+'\n')
print(json.dumps([{'grade':r['grade'],'stats':r['stats'],'errors':r['errors']} for r in results]))
