"""青雲首批：完整立繪、真衣櫥操作、資格、身份變更回退及存檔；雲端隔離。"""
from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('WARDROBE_BASE','http://127.0.0.1:5300/');OUT=ROOT/os.getenv('WARDROBE_OUT','.local-online/sect-fashion/screens');OUT.mkdir(parents=True,exist_ok=True)
seed=copy.deepcopy(fixtures['full']);rows=[];checks=[]
heads=['bamboo','topknot','master','silver','ponytail','loose','bun','short']
costumes=[f'uniform-qingyun-{i}' for i in range(8)]+['fashion-night','fashion-feast','fashion-snow','fashion-gold']
STORE_SETUP=r'''window.__wardrobeStore=async()=>{if(window.__wardrobeStateHook)return window.__wardrobeStateHook;const source=await(await fetch('/src/components/ink/InkPlayScreen.tsx')).text();const path=source.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];return window.__wardrobeStateHook=(await import(path)).useLifeStore}'''
def boot(browser,w=390,h=844,rank=7,sect='sect_qingyun'):
 fixtures['full']=copy.deepcopy(seed);fixtures['full']['state']['character'].update(sectId=sect,sectStanding=rank)
 c,p,errors=start(browser,w,h);c.add_init_script(STORE_SETUP);p.evaluate(STORE_SETUP);return c,p,errors
def shot(page,name):page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=92)
def opened(page):
 tap(page,'造型');d=page.get_by_role('dialog',name='衣著與造型');d.wait_for();return d
def ready(page,costume):
 page.wait_for_function("id=>document.querySelector('.ink-person-figure')?.dataset.renderedAppearance.endsWith(':'+id)",arg=costume,polling=30)
def style(page):return page.locator('.ink-person-figure').get_attribute('data-rendered-appearance')
def resources(page):
 s=data(page);m=page.evaluate("JSON.parse(localStorage.getItem('jianghu_ancestry_v1'))")
 return {'equipment':s['character']['equipment'],'duel':s['character']['combatLoadout'],'attributes':s['character']['attributes'],'jade':m['jade'],'pages':m['pages']}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,p,errors=boot(b);nav(p,'人物');before=resources(p)
 for head in heads:
  for costume in costumes:
   assert p.evaluate("async a=>{const useLifeStore=await window.__wardrobeStore();const value={...useLifeStore.getState().state.character.appearance,...a};return useLifeStore.getState().setAppearance(value)}",{'head':head,'costume':costume})
   ready(p,costume)
   p.wait_for_function("head=>document.querySelector('.ink-person-figure')?.dataset.renderedAppearance.startsWith(head+':')",arg=head)
   metric=p.locator('.ink-person-figure').evaluate('''e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let n=0,edge=0,hash=2166136261;for(let y=0;y<e.height;y++)for(let x=0;x<e.width;x++)if(d[(y*e.width+x)*4+3]>32){n++;const i=(y*e.width+x)*4;for(let k=0;k<3;k++)hash=Math.imul(hash^d[i+k],16777619)>>>0;if(x<2||y<2||x>=e.width-2||y>=e.height-2)edge++}return {pixels:n,edge,hash,style:e.dataset.artStyle}}''')
   assert metric['pixels']>1000 and metric['edge']==0 and metric['style']=='manhua',(head,costume,metric)
   rows.append({'head':head,'costume':costume,**metric})
   if (head=='silver' and costume in ['uniform-qingyun-0','uniform-qingyun-7','fashion-feast','fashion-snow']) or (head=='bun' and costume=='uniform-qingyun-7'):shot(p,head+'-'+costume)
 assert len({r['hash'] for r in rows})==96
 assert resources(p)==before;assert not errors,errors;c.close()
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=boot(b,w,h,rank=1);nav(p,'人物');before=resources(p)
  d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click();d.get_by_role('button',name='預覽青雲・掌門',exact=True).click()
  d.locator('.ink-appearance-preview canvas').wait_for();p.wait_for_timeout(250)
  assert d.get_by_role('button',name='換上',exact=True).is_disabled()
  assert data(p)['character']['appearance'].get('costume') is None
  assert d.get_by_role('button',name='換上',exact=True).evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}')
  assert d.evaluate('e=>e.scrollHeight<=e.clientHeight+1'),(w,h,'dialog overflow')
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if w==320:shot(p,'locked-320')
  d.get_by_role('button',name='預覽青雲・外門弟子',exact=True).click();d.get_by_role('button',name='換上',exact=True).click();ready(p,'uniform-qingyun-1')
  d=opened(p);d.get_by_role('tab',name='時裝',exact=True).click();d.get_by_role('button',name='朱霞宴服',exact=True).click();p.wait_for_timeout(250)
  if w==390:shot(p,'fashion-picker')
  assert data(p)['character']['appearance']['costume']=='uniform-qingyun-1';p.keyboard.press('Escape');ready(p,'uniform-qingyun-1')
  d=opened(p);d.get_by_role('tab',name='時裝',exact=True).click();d.get_by_role('button',name='朱霞宴服',exact=True).click();d.get_by_role('button',name='換上',exact=True).click();ready(p,'fashion-feast')
  d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click();d.get_by_role('button',name='預覽青雲・外門弟子',exact=True).click()
  if w==390:shot(p,'uniform-picker')
  d.get_by_role('button',name='換上',exact=True).click();ready(p,'uniform-qingyun-1')
  p.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.appearance.costume==='uniform-qingyun-1'")
  p.reload();tap(p,re.compile('^續寫前緣'),False)
  if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
  ready(p,'uniform-qingyun-1');assert data(p)['character']['appearance']['fashion']=='fashion-feast'
  # 以隔離測試身份模擬離派，走正式保存排程，核對顯示回退與重開。
  p.evaluate("async()=>{const useLifeStore=await window.__wardrobeStore();const old=useLifeStore.getState().state;const next={...old,character:{...old.character,sectId:null}};useLifeStore.setState({state:next});const {schedulePersist}=await import('/src/store/persistSchedule.ts');schedulePersist(next,{immediate:true})}")
  ready(p,'fashion-feast')
  assert not p.evaluate("async()=>{const useLifeStore=await window.__wardrobeStore();const a=useLifeStore.getState().state.character.appearance;return useLifeStore.getState().setAppearance({...a,costume:'uniform-qingyun-7'})}")
  p.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.sectId===null")
  p.reload();tap(p,re.compile('^續寫前緣'),False)
  if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
  ready(p,'fashion-feast');assert resources(p)==before;assert not errors,errors
  checks.append({'viewport':[w,h],'lockedPreviewNoSave':True,'qualifiedUniformConfirm':True,'fashionPreviewCancel':True,'lastFashionRetained':True,'reloadKeptUniform':True,'simulatedDepartureFallbackAndReload':True,'forgedUniformRejected':True,'resourcesUnchanged':True,'pageerrors':errors});c.close()
 b.close()
(OUT.parent/'browser.json').write_text(json.dumps({'figures':rows,'checks':checks,'cloudBlocked':True,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('WARDROBE_BROWSER_PASS',len(rows),len(checks),flush=True)
