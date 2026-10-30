"""開發版高光示範的前後台：量度RAF及draw，不將軟件GPU推作iPhone FPS。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,re
ROOT=Path(__file__).resolve().parents[2];BASE=os.getenv('MOTION_BASE','http://127.0.0.1:5240/');LABEL=os.getenv('MOTION_LABEL','after');OUT=ROOT/'production/qa/evidence/redesign/app-motion-guide';OUT.mkdir(parents=True,exist_ok=True)
PROBE='''(()=>{window.motionProbe={ticks:0,draws:0};const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>{if(cb.name==='bound tick')motionProbe.ticks++;cb(t)});
for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C)for(const key of ['drawArrays','drawElements']){const original=C.prototype[key];C.prototype[key]=function(...args){motionProbe.draws++;return original.apply(this,args)}}})();'''
def hidden(page,value):page.evaluate('v=>{Object.defineProperty(document,"hidden",{configurable:true,value:v});document.dispatchEvent(new Event("visibilitychange"));}',value)
records=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for subject in json.loads(os.getenv('MOTION_SUBJECTS','["chest","token","cauldron"]')):
  print('ANIMATION',LABEL,subject,flush=True);record=LABEL=='after' and subject=='chest';c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='no-preference',**({'record_video_dir':str(ROOT/'.local-online/app-motion-guide/video'),'record_video_size':{'width':390,'height':844}} if record else {}));c.add_init_script(PROBE)
  for pattern in ['**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(pattern,lambda r:r.abort())
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+f'?fx=highlight&mode={subject}&grade=0');root=page.locator('[data-subject]');root.wait_for(timeout=60000);page.wait_for_timeout(600)
  foreground_ticks=page.evaluate('motionProbe.ticks');assert foreground_ticks>0,'Director RAF probe did not observe active frames'
  hidden(page,True);page.wait_for_timeout(200);initial=page.evaluate('({...motionProbe})');page.wait_for_timeout(650);end=page.evaluate('({...motionProbe})');idle_hidden_ticks=end['ticks']-initial['ticks'];assert end['draws']==initial['draws'],'background GL draws'
  if LABEL=='before':assert idle_hidden_ticks>0,'baseline no longer reproduces polling'
  if LABEL=='after':assert idle_hidden_ticks==0,'hidden director kept requesting frames'
  hidden(page,False);page.wait_for_timeout(300);assert page.evaluate('motionProbe.draws')>end['draws'],'did not resume rendering'
  page.mouse.click(195,350);page.locator('[data-phase="charging"]').wait_for(timeout=20000);hidden(page,True);phase=root.get_attribute('data-phase');page.wait_for_timeout(900);paused=root.get_attribute('data-phase')
  if LABEL=='after':assert paused==phase,'hidden timeline advanced'
  hidden(page,False);page.locator('[data-phase="settle"]').wait_for(timeout=60000);page.wait_for_timeout(400);n=page.evaluate('motionProbe.draws');page.wait_for_timeout(650);assert page.evaluate('motionProbe.draws')==n,'settle continued drawing'
  if LABEL=='after':assert float(root.get_attribute('data-render-dpr'))==2
  page.screenshot(path=str(OUT/f'{LABEL}-{subject}-result.png'));assert not errors,errors
  records.append({'subject':subject,'foregroundRafCallbacksObserved':foreground_ticks,'hiddenIdleRafCallbacks':idle_hidden_ticks,'hiddenDraws':end['draws']-initial['draws'],'chargingPhaseBefore':phase,'chargingPhaseWhileHidden':paused,'resumedToResult':True,'settleStops':True,'actualIphone':False,'pageErrors':errors});video=page.video;c.close()
  if record and video:records[-1]['video']=video.path()
 if LABEL=='after':
  for subject in ['chest','token']:
   for mode in ['skip','reduce','context-lost']:
    print('EDGE',subject,mode,flush=True);c=b.new_context(viewport={'width':320,'height':568},device_scale_factor=2,reduced_motion='reduce' if mode=='reduce' else 'no-preference');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+f'?fx=highlight&mode={subject}&grade=5');page.locator('[data-subject]').wait_for(timeout=60000)
    if mode=='context-lost':page.locator('canvas').first.evaluate('e=>e.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
    else:page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>{es[0]?.click();es[0]?.click()}')
    page.locator('[data-phase="settle"]').wait_for(timeout=30000);assert page.locator('button[class*="claim"]').is_enabled();assert not errors,errors
    records.append({'subject':subject,'mode':mode,'sameResultAvailable':True,'pageErrors':errors});c.close()
 b.close()
(OUT/f'{LABEL}-animation-report.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));print('ANIMATION_PASS',LABEL,len(records),flush=True)
