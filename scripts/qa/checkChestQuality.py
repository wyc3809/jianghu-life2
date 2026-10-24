"""真實正式構建開箱：核心已入帳，跳過／缺圖／失去WebGL／連點只處理同一結果。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy,json,re,os
ROOT=Path(__file__).resolve().parents[2]
LABEL=os.getenv('CHEST_GAME_LABEL','game')
OUT=ROOT/'production/qa/evidence/redesign/chest-quality'/LABEL;OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('CHEST_GAME_BASE','http://127.0.0.1:5176/')
fixtures=json.loads((ROOT/'.local-online/chest-quality/fixtures.json').read_text())
cases=[(g,'skip')for g in range(6)]+[(1,'normal'),(5,'reduce'),(1,'missing'),(1,'late'),(1,'contextlost')]
cases=json.loads(os.getenv('CHEST_GAME_CASES',json.dumps(cases)))
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for grade,mode in cases:
  fixture=copy.deepcopy(fixtures[grade]);gear=fixture['gear']
  context=b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,is_mobile=True,has_touch=True,**({'record_video_dir':str(ROOT/'.local-online/chest-quality/game-video'),'record_video_size':{'width':393,'height':852}} if os.getenv('CHEST_GAME_VIDEO')=='1' else {}),reduced_motion='reduce' if mode=='reduce' else 'no-preference')
  context.route('**/*.supabase.co/**',lambda r:r.abort())
  context.route('**/fonts.googleapis.com/**',lambda r:r.abort())
  context.route('**/fonts.gstatic.com/**',lambda r:r.abort())
  def css(route):
   response=route.fetch();body=response.text()
   for edge,value in [('top',59),('bottom',34),('left',0),('right',0)]:body=re.sub(r'env\(safe-area-inset-'+edge+r'(?:,\s*[^)]+)?\)',f'{value}px',body)
   route.fulfill(response=response,body=body)
  context.route('**/*.css',css)
  if mode=='missing':context.route('**/ink/art/chest/*.webp*',lambda r:r.fulfill(status=404,body='missing fixture'))
  held=[]
  if mode=='late':context.route('**/ink/art/chest/*.webp*',lambda r:held.append(r))
  context.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';
   if(!localStorage.getItem('chest-fixture')){
    localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));
    localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));
    localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('chest-fixture','1');}
   window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
   window.backgroundDraws=0;window.nonFxDraws=0;
   for(const key of ['drawImage','clearRect']){const f=CanvasRenderingContext2D.prototype[key];CanvasRenderingContext2D.prototype[key]=function(...a){
    if(this.canvas.isConnected&&!this.canvas.closest('[data-subject]')){window.nonFxDraws++;if(document.documentElement.dataset.highlightActive==='1')window.backgroundDraws++;}return f.apply(this,a)}}
   window.chestDraws=0;for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C){
    for(const k of ['drawArrays','drawElements']){const f=C.prototype[k];C.prototype[k]=function(...a){window.chestDraws++;return f.apply(this,a)}}}
  })();''')
  page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='domcontentloaded')
  page.get_by_role('button',name=re.compile('^續寫前緣')).click()
  root=page.locator('[data-subject="chest"]');root.wait_for(timeout=60000)
  if mode in ['normal','reduce']:
   for _ in range(grade):
    page.mouse.click(195,350)
    if mode!='reduce':page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="upgrading"')
    page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="idle"',timeout=120000)
   page.mouse.click(195,350)
  elif mode=='contextlost':
   page.evaluate('document.querySelector("[data-subject] canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
   page.wait_for_timeout(700)
   print('CONTEXT_LOST_STATE',page.evaluate('({phase:document.querySelector("[data-subject]")?.dataset.phase,errors:[]})'),errors,flush=True)
  else:
   root.get_by_role('button',name=re.compile('跳過')).click()
  page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="settle"',timeout=120000)
  if mode=='late':
   for route in held:route.continue_()
   page.wait_for_load_state('networkidle')
   page.wait_for_timeout(500)
  assert gear['name'] in root.inner_text(),root.inner_text()
  # 等最後一幀清空粒子後，結果頁不再持續提交WebGL繪製。
  page.wait_for_timeout(450)
  before=page.evaluate('window.chestDraws');backgroundBefore=page.evaluate('window.backgroundDraws');page.wait_for_timeout(350)
  redraws=page.evaluate('window.chestDraws')-before
  backgroundDelta=page.evaluate('window.backgroundDraws')-backgroundBefore
  if LABEL!='game-before':
   assert redraws==0,(mode,redraws)
   assert backgroundDelta==0
   assert page.evaluate('document.documentElement.dataset.highlightActive')=='1'
  if LABEL=='game-before':
   page.wait_for_function('Array.from(document.querySelectorAll("[data-subject] h1 span")).every(e=>["none","blur(0px)"].includes(getComputedStyle(e).filter)&&getComputedStyle(e).opacity==="1")',timeout=120000)
   page.wait_for_timeout(1000)
  page.screenshot(path=str(OUT/f'grade-{grade}-{mode}.png'))
  page.get_by_role('button',name='領取',exact=True).evaluate('e=>{e.click();e.click();e.click()}')
  page.get_by_role('dialog',name='獲得新裝備',exact=True).wait_for(timeout=30000)
  page.wait_for_function('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.moments.length===0')
  state=page.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state')
  assert state['character']['gear'].count(gear['id'])==1
  assert state['character']['equipment']==fixture['state']['character']['equipment']
  assert state['pendingGearCompare']['gearId']==gear['id']
  page.get_by_role('button',name='先收好',exact=True).click()
  assert page.evaluate('document.documentElement.dataset.highlightActive') is None
  beforeResume=page.evaluate('window.nonFxDraws');page.wait_for_timeout(300)
  assert page.evaluate('window.nonFxDraws')>beforeResume
  page.reload(wait_until='domcontentloaded')
  page.get_by_role('button',name=re.compile('^續寫前緣')).click()
  page.locator('.scroll-shell--play').wait_for();page.wait_for_timeout(350)
  assert page.locator('[data-subject="chest"]').count()==0
  assert not errors,errors
  results.append({'grade':grade,'mode':mode,'gear':gear['name'],'settledDraws':redraws,'ownedCount':1,'autoEquipped':False,'replayOnReload':False,'backgroundDraws':backgroundDelta,'backgroundResumed':True,'video':str(page.video.path()) if page.video else None,'pageerrors':errors})
  print('CHEST_CASE_PASS',grade,mode,flush=True)
  (OUT/'partial.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
  context.unroute_all(behavior='wait');context.close()
 b.close()
(OUT/'report.json').write_text(json.dumps({'base':BASE,'productionBuild':True,'fixtureCoreGrantGear':True,'nativeMarkerAndCssSafeAreaSimulation':True,'actualIOS':False,'cases':results},ensure_ascii=False,indent=2)+'\n')
print('CHEST_GAME_PASS',len(results))
