"""真正正式遊戲的翻冊／入帳／畫質／繪製次數；SwiftShader並非iPhone幀率。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy,json,os,re,statistics
ROOT=Path(__file__).resolve().parents[2]
BASE=os.getenv('CODEX_BASE','http://127.0.0.1:5176/')
LABEL=os.getenv('CODEX_LABEL','after')
CASES=json.loads(os.getenv('CODEX_CASES','["ordinary","premium","wish","ten","pages"]'))
OUT=Path(os.getenv('CODEX_OUT',str(ROOT/'production/qa/evidence/redesign/codex-quality'/LABEL)));OUT.mkdir(parents=True,exist_ok=True)
FIXTURES=json.loads((ROOT/'.local-online/codex-quality/fixtures.json').read_text())
DPR=float(os.getenv('CODEX_DPR','2'))
WIDTH,HEIGHT,TOP,BOTTOM=json.loads(os.getenv('CODEX_VIEWPORT','[390,844,47,34]'))
VIDEO=os.getenv('CODEX_VIDEO','0')=='1'
MODE=os.getenv('CODEX_MODE','normal')
INIT='''(()=>{const q=window.codexQa={draws:0,total:0,frames:[],idleDraws:0};
for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C)for(const key of ['drawArrays','drawElements']){
 const f=C.prototype[key];C.prototype[key]=function(...args){if(this.canvas.closest('[data-subject="codex"]')){q.draws++;q.total++;}else if(this.canvas.classList.contains('ink-codex-canvas'))q.idleDraws++;return f.apply(this,args)}}
let prev=0;requestAnimationFrame(function sample(t){const phase=document.querySelector('[data-subject="codex"]')?.dataset.phase;
if(prev&&phase)q.frames.push({phase,dt:t-prev,draws:q.draws,dpr:Number(document.querySelector('[data-subject]')?.dataset.renderDpr||1)});prev=t;q.draws=0;requestAnimationFrame(sample)});
})();'''
report={'base':BASE,'productionBuild':True,'actualIOS':False,'renderer':'Chromium SwiftShader software GPU','dpr':DPR,'cases':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for name in CASES:
  fixture=copy.deepcopy(next(f for f in FIXTURES if f['name']==name))
  context=browser.new_context(viewport={'width':WIDTH,'height':HEIGHT},device_scale_factor=DPR,is_mobile=True,has_touch=True,reduced_motion='reduce' if MODE=='reduce' else 'no-preference',**({'record_video_dir':str(ROOT/'.local-online/codex-quality/video'/LABEL),'record_video_size':{'width':390,'height':844}} if VIDEO else {}))
  context.route('**/*.supabase.co/**',lambda r:r.abort());context.route('**/fonts.googleapis.com/**',lambda r:r.abort());context.route('**/fonts.gstatic.com/**',lambda r:r.abort())
  def css(route):
   response=route.fetch();body=response.text()
   for edge,value in [('top',TOP),('bottom',BOTTOM),('left',0),('right',0)]:body=re.sub(r'env\(safe-area-inset-'+edge+r'(?:,\s*[^)]+)?\)',f'{value}px',body)
   route.fulfill(response=response,body=body)
  context.route('**/*.css',css)
  held=[]
  if MODE=='late':context.route('**/ink/art/gacha/*.webp*',lambda r:held.append(r))
  if MODE=='missing':context.route('**/ink/art/gacha/*.webp*',lambda r:r.fulfill(status=404,body='missing fixture'))
  context.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';if(!localStorage.getItem('codex-fixture')){
localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('codex-fixture','1');}
window.webkit={messageHandlers:{bridge:{postMessage(){}}}};})();''')
  context.add_init_script(INIT)
  if MODE=='no-webgl':context.add_init_script("const oldGetContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return String(type).includes('webgl')?null:oldGetContext.call(this,type,...a)}")
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='domcontentloaded');page.get_by_role('button',name=re.compile('^續寫前緣')).click()
  page.locator('.ink-quick').wait_for()
  if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
  main_style=page.locator('.ink-quick .ink-badge-label').first.evaluate('e=>({font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight})')
  page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click()
  if fixture['banner']=='zhenben':page.get_by_role('tab',name='珍本奇功').click()
  page.wait_for_timeout(750);page.screenshot(path=str(OUT/f'{name}-idle.png'))
  page.get_by_role('button',name=re.compile('^抽十次' if fixture['n']==10 else '^抽一次')).evaluate('e=>{e.click();e.click()}')
  if MODE=='no-webgl':
   page.get_by_role('dialog').wait_for()
   page.screenshot(path=str(OUT/f'{name}-fallback.png'))
   page.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).click()
  else:
   stage=page.locator('[data-subject="codex"]');stage.wait_for(timeout=60000)
   page.evaluate('window.previousCodexCanvas=document.querySelector("[data-subject] canvas");window.previousCodexGl=previousCodexCanvas.getContext("webgl2")')
   if MODE=='contextlost':page.evaluate('document.querySelector("[data-subject] canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
   if MODE=='skip':
    page.evaluate("document.querySelector('[data-subject] button[class*=skip]')?.click()")
   if MODE=='contextlost':
    dialog=page.get_by_role('dialog');dialog.wait_for();page.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).click()
   else:
    if MODE=='normal':
     page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="bursting"',timeout=60000)
     page.wait_for_timeout(220);page.screenshot(path=str(OUT/f'{name}-opening.png'))
    page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=90000)
    page.wait_for_timeout(1400 if LABEL.startswith('before') else 400);page.screenshot(path=str(OUT/f'{name}-result.png'))
    if MODE=='late':
     before=page.evaluate('window.codexQa.total')
     for route in held:route.continue_()
     page.wait_for_timeout(1500)
     assert page.evaluate('window.codexQa.total')>before
     settled=page.evaluate('window.codexQa.total');page.wait_for_timeout(500)
     assert page.evaluate('window.codexQa.total')==settled
     page.screenshot(path=str(OUT/f'{name}-textures-arrived.png'))
  actual=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
  for key in ['jade','gacha','manuals','pages']:assert actual.get(key)==fixture['expected'].get(key),(name,key,actual.get(key),fixture['expected'].get(key))
  q=page.evaluate('window.codexQa');stats={}
  for phase in sorted(set(f['phase']for f in q['frames'])):
   frames=[f for f in q['frames']if f['phase']==phase];ds=[f['draws']for f in frames];dt=sorted(f['dt']for f in frames)
   stats[phase]={'samples':len(frames),'drawsMedian':statistics.median(ds),'frameMsMedian':statistics.median(dt),'frameMsP95':dt[min(len(dt)-1,int(len(dt)*.95))],'dprMin':min(f['dpr'] for f in frames),'dprMax':max(f['dpr'] for f in frames)}
  data={'name':name,'mode':MODE,'mainButtonStyle':main_style,'stats':stats,'actualJade':actual['jade'],'coreResultMatches':True,'errors':errors}
  if MODE not in ['contextlost','no-webgl']:
   if not LABEL.startswith('before'):
    assert stage.get_attribute('data-render-dpr')==str(int(min(2,DPR))),stage.get_attribute('data-render-dpr')
    assert page.evaluate('window.previousCodexGl.getContextAttributes().antialias')
    assert stage.locator('[data-card]').first.evaluate('e=>getComputedStyle(e).fontFamily')==main_style['font']
   assert stage.locator('[data-card]').count()==fixture['n']
   page.evaluate("const e=document.querySelector('[data-subject] [class*=reveal]');if(e)e.scrollTop=e.scrollHeight")
   claim=stage.get_by_role('button',name=re.compile('^完成(?:入藏)?$'))
   hit=claim.evaluate('''e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {y:r.y,bottom:r.bottom,height:r.height,width:r.width,hit:!!hit&&e.contains(hit)};}''')
   assert hit['height']>=44 and hit['width']>=44 and hit['hit'] and hit['y']>=0 and hit['bottom']<=HEIGHT-BOTTOM+1,hit
   data['claimTouchTarget']=hit
   if HEIGHT<=600:
    for i in range(fixture['n']):
     card=stage.locator('[data-card]').nth(i);card.click()
     assert card.get_attribute('aria-pressed')=='true'
    page.evaluate("const e=document.querySelector('[data-subject] [class*=reveal]');e.scrollTop=e.scrollHeight")
    page.screenshot(path=str(OUT/f'{name}-actions.png'))
    data['allCardsSelectable']=True
   data['resultFont']=stage.locator('[data-card]').first.evaluate('e=>getComputedStyle(e).fontFamily')
   stage.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).evaluate('e=>{e.click();e.click();e.click()}')
  page.locator('.ink-codex-last').wait_for(state='visible',timeout=30000)
  assert page.locator('.ink-hud,.ink-bottom-dock').count()==0
  again=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
  for key in ['jade','gacha','manuals','pages']:assert again.get(key)==actual.get(key),(name,'claim repeated',key)
  data['repeatedClaimNoDebit']=True
  if not LABEL.startswith('before') and MODE!='no-webgl':
   page.wait_for_function('!window.previousCodexCanvas.isConnected&&window.previousCodexGl.isContextLost()')
   data['oldContextReleased']=True
  assert not errors,(name,errors)
  if VIDEO:data['video']=str(page.video.path())
  report['cases'].append(data);(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  context.unroute_all(behavior='wait');context.close();print('PASS',name,MODE,flush=True)
 browser.close()
