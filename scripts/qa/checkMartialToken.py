"""第51項：武學令完整六階演出、直接結果、減少動態及缺圖後備。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,statistics,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/martial-ui';BASE=os.getenv('TOKEN_BASE','http://127.0.0.1:5208/')
PROBE='''(()=>{window.glProbe={total:0,frames:{},frame:0};const raf=window.requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>{window.glProbe.frame=t;cb(t)});for(const T of [WebGLRenderingContext,WebGL2RenderingContext])for(const key of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=T.prototype[key];if(!original||original.__probe)continue;const wrap=function(...args){if(this.canvas.closest('[data-subject="token"]')){const p=window.glProbe;p.total++;p.frames[p.frame]=(p.frames[p.frame]||0)+1}return original.apply(this,args)};wrap.__probe=true;T.prototype[key]=wrap}})();'''
report=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for grade in [0,1,2,3,4,5]:
  print('TOKEN',grade,flush=True);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='no-preference',**({'record_video_dir':str(ROOT/'.local-online/martial-ui/after-video')} if grade==3 else {}));c.add_init_script(PROBE);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+f'?fx=highlight&mode=token&grade={grade}');root=page.locator('[data-subject=token]');root.wait_for(timeout=30000);page.wait_for_timeout(900)
  page.screenshot(path=str(OUT/f'after-token-{grade}-idle.png'));idle=page.evaluate('Object.values(glProbe.frames).filter(n=>n>0)');seen=[]
  for i in range(grade+1):
   page.locator('[data-phase="idle"]').wait_for(timeout=20000);page.mouse.click(195,350);page.wait_for_timeout(80);seen.append(root.get_attribute('data-phase'))
  page.locator('[data-phase="bursting"]').wait_for(timeout=15000);page.wait_for_timeout(160);page.screenshot(path=str(OUT/f'after-token-{grade}-transition.png'));page.locator('[data-phase="settle"]').wait_for(timeout=20000);page.screenshot(path=str(OUT/f'after-token-{grade}-result.png'));page.wait_for_timeout(1500);n=page.evaluate('glProbe.total');page.wait_for_timeout(600);assert page.evaluate('glProbe.total')==n,'settle kept rendering';assert not errors,errors
  report.append({'grade':grade,'DPR':2,'seenPhases':seen,'idleDrawCallsMedian':statistics.median(idle[2:]) if len(idle)>2 else idle,'settleStops':True,'pageerrors':errors})
  video=page.video;c.close()
  if grade==3 and video:(ROOT/'.local-online/martial-ui/after-token-video.txt').write_text(str(video.path()))
 b.close()
(OUT/'token-report.json').write_text(json.dumps({'actualIphone':False,'softwareChromium':True,'cases':report},ensure_ascii=False,indent=2));print('TOKEN_PASS',report)

# 短屏及後備不重播，畫布失效仍可查看同一份DOM結果。
edge=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for mode in ['skip','reduce','missing-jade','context-lost']:
  c=b.new_context(viewport={'width':320,'height':568},device_scale_factor=2,reduced_motion='reduce' if mode=='reduce' else 'no-preference');c.add_init_script(PROBE)
  if mode=='missing-jade':c.route('**/ink/art/token/jade.webp*',lambda r:r.abort())
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?fx=highlight&mode=token&grade=5');root=page.locator('[data-subject=token]');root.wait_for(timeout=30000);page.wait_for_timeout(300)
  if mode=='context-lost':page.locator('canvas').first.evaluate('e=>e.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
  elif mode=='reduce':
   for _ in range(6):
    page.locator('[data-phase=idle]').wait_for(timeout=15000);page.mouse.click(160,270);page.wait_for_timeout(150)
  else:page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>{es[0]?.click();es[0]?.click()}')
  page.locator('[data-phase=settle]').wait_for(timeout=20000);claim=page.locator('button[class*="claim"]');assert claim.is_enabled()
  # 示範頁底部的六個品階控制並非正式App操作，僅核對正式完成鍵邊界。
  assert claim.evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.width>=44&&r.height>=44}')
  page.screenshot(path=str(OUT/f'after-token-edge-{mode}.png'));assert not errors,errors
  edge.append({'mode':mode,'viewport':[320,568],'resultReached':True,'claimVisible':True,'pageerrors':errors});c.close()
 b.close()
(OUT/'token-edge-report.json').write_text(json.dumps(edge,ensure_ascii=False,indent=2));print('TOKEN_EDGES_PASS',len(edge))
