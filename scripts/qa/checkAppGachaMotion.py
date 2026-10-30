"""真核心單抽／十連、背景暫停、收束與領取恢復；不連玩家帳戶。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'h','exec'))
BASE=os.getenv('MOTION_BASE','http://127.0.0.1:5240/');OUT=ROOT/'production/qa/evidence/redesign/app-motion-guide';OUT.mkdir(parents=True,exist_ok=True)
fs=json.loads((ROOT/'.local-online/codex-quality/fixtures.json').read_text());report=[]
PROBE='''(()=>{window.gachaMotion={gl:0,idle:0};for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C)for(const key of ['drawArrays','drawElements']){const old=C.prototype[key];C.prototype[key]=function(...a){if(this.canvas.closest('[data-subject="codex"]'))gachaMotion.gl++;if(this.canvas.classList.contains('ink-codex-canvas'))gachaMotion.idle++;return old.apply(this,a)}}})();'''
def hide(page,value):page.evaluate('v=>{Object.defineProperty(document,"hidden",{configurable:true,value:v});document.dispatchEvent(new Event("visibilitychange"));}',value)
def same(page):
 actual=meta(page)
 for key in ['jade','gacha','manuals','pages']:assert actual.get(key)==f['expected'].get(key),(key,actual.get(key),f['expected'].get(key))
with sync_playwright() as p:
 for engine in json.loads(os.getenv('MOTION_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for name in ['ordinary','ten']:
   print('GACHA_MOTION',engine,name,flush=True);f=next(v for v in fs if v['name']==name);c,page,errors=start(b,390,844);page.evaluate(PROBE);page.emulate_media(reduced_motion='no-preference')
   page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click()
   if f['banner']=='zhenben':tap(page,'珍本奇功',False)
   page.locator('.ink-codex-canvas').wait_for();page.wait_for_timeout(300);tap(page,'卡池詳情');page.wait_for_timeout(300);n=page.evaluate('gachaMotion.idle');page.wait_for_timeout(650);assert page.evaluate('gachaMotion.idle')==n,'idle book draws behind native sheet'
   close(page,'卡池詳情');page.wait_for_timeout(400);assert page.evaluate('gachaMotion.idle')>n,'idle book did not resume'
   page.get_by_role('button',name=re.compile('^抽十次' if name=='ten' else '^抽一次')).evaluate('e=>{e.click();e.click()}')
   root=page.locator('[data-subject="codex"]');root.wait_for(timeout=60000);same(page);hide(page,True);phase=root.get_attribute('data-phase');page.wait_for_timeout(300);n=page.evaluate('gachaMotion.gl');page.wait_for_timeout(650);assert page.evaluate('gachaMotion.gl')==n;assert root.get_attribute('data-phase')==phase; same(page)
   hide(page,False)
   if name=='ten':page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>{es[0]?.click();es[0]?.click()}')
   page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=90000);assert root.locator('[data-card]').count()==f['n'];assert root.get_attribute('data-render-dpr')=='2';same(page)
   page.wait_for_timeout(300);n=page.evaluate('gachaMotion.gl');page.wait_for_timeout(650);assert page.evaluate('gachaMotion.gl')==n
   if engine=='chromium':page.screenshot(path=str(OUT/f'after-gacha-{name}.png'))
   claim=root.get_by_role('button',name=re.compile('^完成(?:入藏)?$'));claim.evaluate('e=>{e.click();e.click()}');hide(page,True);page.wait_for_timeout(800);assert root.count()==1 and root.get_attribute('data-phase')=='claiming','background claim finished';same(page)
   hide(page,False);root.wait_for(state='detached',timeout=15000);same(page)
   page.reload();tap(page,re.compile('^續寫前緣'),False);same(page);assert not errors,errors
   report.append({'engine':engine,'case':name,'backgroundPhaseHeld':True,'idleStopsBehindSheet':True,'resumedFromSameResult':True,'doubleDrawAndSkipNoReroll':True,'realCoreResultMatches':True,'claimPausesAndResumes':True,'reloadNoExtraDebitOrReward':True,'actualIphone':False,'errors':errors});c.close()
  b.close()
(OUT/'gacha-motion-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('GACHA_MOTION_PASS',len(report),flush=True)
