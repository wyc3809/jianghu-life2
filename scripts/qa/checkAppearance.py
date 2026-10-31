"""共用衣櫥：手機觸控、只預覽／真保存、跨頁造型、重開及後備。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('APPEARANCE_BASE','http://127.0.0.1:5251/')
OUT=ROOT/os.getenv('APPEARANCE_OUT','production/qa/evidence/redesign/appearance');OUT.mkdir(parents=True,exist_ok=True)
report=[]
def wardrobe(page):
 tap(page,'造型');d=page.get_by_role('dialog',name='衣著與造型',exact=True);d.wait_for()
 assert d.evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 for name in ['關閉衣著與造型','換上']:
  assert d.get_by_role('button',name=name,exact=True).evaluate(VISIBLE),(name,d.bounding_box())
 return d
def look(page,cls):return page.locator(cls+' canvas[data-appearance]').first.get_attribute('data-appearance')
with sync_playwright() as p:
 for engine in json.loads(os.getenv('APPEARANCE_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('APPEARANCE_SIZES','[[320,568],[390,844],[430,932]]')):
   print('APPEARANCE',engine,w,h,flush=True);f=copy.deepcopy(fixtures['full']);f['state']['character']['flags']['coach_done']=True
   c,page,errors=start(b,w,h,video=engine=='chromium' and w==390);nav(page,'人物');page.wait_for_timeout(400);main_geometry(page)
   before=snapshots(page);old=ch(page).get('appearance');d=wardrobe(page)
   d.get_by_role('button',name='霜髮劍客',exact=True).click();assert ch(page).get('appearance')==old;close(page,'衣著與造型');assert snapshots(page)==before
   d=wardrobe(page);d.get_by_role('button',name='霜髮劍客',exact=True).click();d.get_by_role('tab',name='衣著',exact=True).click();d.get_by_role('button',name='江湖長衫',exact=True).click();d.get_by_role('tab',name='配色',exact=True).click();d.get_by_role('button',name='青玉',exact=True).click()
   if engine=='chromium' and w==390:shot(page,'wardrobe-390.png')
   d.get_by_role('button',name='換上',exact=True).evaluate('e=>{e.click();e.click()}');stable(page);assert not page.locator('dialog[open]').count()
   expected={'head':'silver','outfit':'scholar','tone':'jade'};assert ch(page)['appearance']==expected;assert snapshots(page)==before;assert look(page,'.ink-person-stage')=='silver:scholar:jade';main_geometry(page)
   assert page.locator('.ink-person-seated-hero').evaluate('e=>{let d=e.getContext("2d").getImageData(0,0,e.width,e.height).data;for(let y=0;y<e.height;y++)for(let x of [0,1,e.width-2,e.width-1])if(d[(y*e.width+x)*4+3]>8)return false;return true}'),'seated body clipped at side'
   if engine=='chromium' and w==390:shot(page,'person-390.png')
   tap(page,'返回鎮居');assert look(page,'.ink-hud')=='silver:scholar:jade'
   if engine=='chromium' and w==390:shot(page,'home-390.png')
   page.reload();tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(500)
   if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
   nav(page,'人物');assert ch(page)['appearance']==expected;assert look(page,'.ink-person-stage')=='silver:scholar:jade';assert not errors,errors
   report.append({'engine':engine,'viewport':[w,h],'fixedMain':True,'sheetControls44Visible':True,'previewCancelNoMutation':True,'confirmOnly':True,'doubleConfirmNoDebit':True,'normalDuelEquipmentUnchanged':True,'hudMatchesPerson':True,'reloadPersists':True,'pageerrors':errors});v=page.video;c.close()
   if engine=='chromium' and w==390 and v:report[-1]['video']=v.path()
  # 所有新造型網絡圖失效，仍顯示同一款內嵌後備，不換人或黑影。
  f=copy.deepcopy(fixtures['full']);f['state']['character']['appearance']={'head':'bun','outfit':'traveller','tone':'cinnabar'};c,page,errors=start(b,390,844)
  c.route('**/ink/art/appearance/**',lambda r:r.abort());page.reload();tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(600)
  if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
  nav(page,'人物');page.wait_for_timeout(600);assert look(page,'.ink-person-stage')=='bun:traveller:cinnabar';assert page.locator('.ink-person-seated-hero').get_attribute('aria-label')=='盤坐調息的人物造型'
  assert page.locator('.ink-person-seated-hero').evaluate('e=>{let d=e.getContext("2d").getImageData(0,0,e.width,e.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>100)n++;return n>500}');assert not errors,errors;c.close();report.append({'engine':engine,'allAppearanceNetworkFailureSameIdentity':True})
  b.close()
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('APPEARANCE_PASS',len(report),flush=True)
