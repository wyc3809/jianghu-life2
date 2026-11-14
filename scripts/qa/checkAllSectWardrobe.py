"""十派672個實際Canvas、30組手機衣櫥、入派入口及保存回退；隔離雲端。"""
from pathlib import Path
import os
os.environ.setdefault('WARDROBE_OUT','.local-online/all-sect-uniforms/screens')
parent=Path(__file__).resolve().with_name('checkWardrobe.py')
exec(compile(parent.read_text().split('\nwith sync_playwright() as pw:')[0],str(parent),'exec'))
sects=json.loads((ROOT/'content/sects/sects.json').read_text())['sects']
all_rows=[];all_checks=[];entry_checks=[]
def checkpoint():
 (OUT.parent/'browser-progress.json').write_text(json.dumps({'figures':all_rows,'checks':all_checks,'joinEntries':entry_checks,'complete':False},ensure_ascii=False,indent=2)+'\n')
def change_identity(page,sect,rank=7):
 page.evaluate('''async v=>{const store=await window.__wardrobeStore();const old=store.getState().state;store.setState({state:{...old,character:{...old.character,sectId:v.sect,sectStanding:v.rank}}})}''',{'sect':sect,'rank':rank})
def canvas_ready(page,selector,costume,head=None):
 page.wait_for_function('''v=>{const e=document.querySelector(v.selector);return e?.dataset.artStyle==='manhua'&&e.dataset.renderedAppearance?.endsWith(':'+v.costume)&&(!v.head||e.dataset.renderedAppearance.startsWith(v.head+':'))}''',arg={'selector':selector,'costume':costume,'head':head},polling=40)
def safe_layout(page,dialog):
 assert dialog.get_by_role('button',name='換上',exact=True).evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}')
 assert dialog.evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
def reload_saved(page,costume):
 page.wait_for_function('''id=>JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.appearance.costume===id''',arg=costume)
 page.reload();tap(page,re.compile('^續寫前緣'),False)
 if page.get_by_role('button',name='領受',exact=True).count():tap(page,'領受')
 ready(page,costume)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,p,errors=boot(b);nav(p,'人物');before=resources(p)
 for sect in sects:
  change_identity(p,sect['id'])
  for head in heads:
   for rank in range(8):
    costume=f"uniform-{sect['id'][5:]}-{rank}"
    assert p.evaluate('''async a=>{const store=await window.__wardrobeStore();return store.getState().setAppearance({...store.getState().state.character.appearance,...a})}''',{'head':head,'costume':costume})
    canvas_ready(p,'.ink-person-figure',costume,head)
    metric=p.locator('.ink-person-figure').evaluate('''e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let n=0,edge=0,hash=2166136261;for(let y=0;y<e.height;y++)for(let x=0;x<e.width;x++)if(d[(y*e.width+x)*4+3]>32){n++;const i=(y*e.width+x)*4;for(let k=0;k<3;k++)hash=Math.imul(hash^d[i+k],16777619)>>>0;if(x<2||y<2||x>=e.width-2||y>=e.height-2)edge++}return {pixels:n,edge,hash,style:e.dataset.artStyle}}''')
    assert metric['pixels']>1000 and metric['edge']==0 and metric['style']=='manhua',(head,costume,metric)
    all_rows.append({'head':head,'costume':costume,**metric})
    if head in ['silver','bun'] and rank==7:shot(p,f'{head}-{costume}')
  checkpoint();print('FIGURES',sect['name'],len(all_rows),flush=True)
 for head in heads:
  for costume in ['fashion-night','fashion-feast','fashion-snow','fashion-gold']:
   assert p.evaluate('''async a=>{const store=await window.__wardrobeStore();return store.getState().setAppearance({...store.getState().state.character.appearance,...a})}''',{'head':head,'costume':costume})
   canvas_ready(p,'.ink-person-figure',costume,head)
   metric=p.locator('.ink-person-figure').evaluate('''e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let hash=2166136261;for(let i=0;i<d.length;i++)hash=Math.imul(hash^d[i],16777619)>>>0;return {hash,style:e.dataset.artStyle}}''')
   all_rows.append({'head':head,'costume':costume,**metric})
 assert len(all_rows)==672 and len({r['hash'] for r in all_rows})==672
 assert resources(p)==before;assert not errors,errors;c.close()
 for w,h in [[320,568],[390,844],[430,932]]:
  for i,sect in enumerate(sects):
   key=sect['id'][5:];own=f'uniform-{key}-1';higher=f'uniform-{key}-7'
   c,p,errors=boot(b,w,h,rank=1,sect=sect['id']);nav(p,'人物');before=resources(p)
   d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click()
   group=d.get_by_role('group',name='門派制服目錄');assert group.get_by_role('button').count()==10
   assert group.get_by_role('button',name=sect['name'],exact=True).get_attribute('aria-pressed')=='true'
   assert group.evaluate('''e=>{const r=e.getBoundingClientRect(),s=e.querySelector('[aria-pressed=true]').getBoundingClientRect();return s.left>=r.left-1&&s.right<=r.right+1}'''),(sect['id'],w,'selected sect not visible')
   d.get_by_role('button',name=f"預覽{sect['name']}・掌門",exact=True).click();canvas_ready(p,'.ink-appearance-preview canvas',higher)
   assert d.get_by_role('button',name='換上',exact=True).is_disabled();assert data(p)['character']['appearance'].get('costume') is None;safe_layout(p,d)
   if w==320 and key=='wugen':shot(p,'locked-wugen-320')
   other=sects[(i+1)%len(sects)];group.get_by_role('button',name=other['name'],exact=True).click()
   canvas_ready(p,'.ink-appearance-preview canvas',f"uniform-{other['id'][5:]}-0")
   assert d.get_by_role('button',name='換上',exact=True).is_disabled()
   assert not p.evaluate('''async id=>{const store=await window.__wardrobeStore();return store.getState().setAppearance({...store.getState().state.character.appearance,costume:id})}''',f"uniform-{other['id'][5:]}-0")
   p.keyboard.press('Escape');assert data(p)['character']['appearance'].get('costume') is None
   d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click();d.get_by_role('button',name=f"預覽{sect['name']}・外門弟子",exact=True).click();canvas_ready(p,'.ink-appearance-preview canvas',own)
   if w==390:shot(p,f'{key}-uniform-picker')
   assert d.get_by_role('button',name='換上',exact=True).is_enabled();d.get_by_role('button',name='換上',exact=True).click();ready(p,own)
   d=opened(p);d.get_by_role('tab',name='時裝',exact=True).click();d.get_by_role('button',name='雪山裘衣',exact=True).click();d.get_by_role('button',name='換上',exact=True).click();ready(p,'fashion-snow')
   d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click();d.get_by_role('button',name=f"預覽{sect['name']}・外門弟子",exact=True).click();d.get_by_role('button',name='換上',exact=True).click();ready(p,own)
   reload_saved(p,own);assert data(p)['character']['appearance']['fashion']=='fashion-snow'
   p.evaluate('''async()=>{const store=await window.__wardrobeStore();const old=store.getState().state;const next={...old,character:{...old.character,sectStanding:0}};store.setState({state:next});const {schedulePersist}=await import('/src/store/persistSchedule.ts');schedulePersist(next,{immediate:true})}''')
   ready(p,'fashion-snow')
   p.reload();tap(p,re.compile('^續寫前緣'),False)
   if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
   ready(p,'fashion-snow');assert resources(p)==before;assert not errors,errors
   all_checks.append({'sect':sect['id'],'viewport':[w,h],'tenSectPreviewEntries':True,'higherRankAndOtherSectCannotSave':True,'previewCancelNoSave':True,'qualifiedUniformConfirmAndReload':True,'lastFashionRetained':True,'simulatedDemotionFallbackAndReload':True,'resourcesUnchanged':True,'pageerrors':errors});c.close()
   checkpoint();print('WARDROBE',w,sect['name'],flush=True)
 # 無門派可看齊目錄，但不能將預覽制服寫成真身份或保存。
 c,p,errors=boot(b,sect=None,rank=0);nav(p,'人物');d=opened(p);d.get_by_role('tab',name='門派服',exact=True).click()
 for sect in sects:
  d.get_by_role('group',name='門派制服目錄').get_by_role('button',name=sect['name'],exact=True).click()
  canvas_ready(p,'.ink-appearance-preview canvas',f"uniform-{sect['id'][5:]}-0")
  assert d.get_by_role('button',name='換上',exact=True).is_disabled()
 p.keyboard.press('Escape');assert data(p)['character']['sectId'] is None
 tap(p,'返回鎮居');nav(p,'修煉');tap(p,'門派')
 for sect in sects:
  btn=p.locator('.ink-practice-grid').get_by_role('button').filter(has=p.locator('strong',has_text=re.compile('^'+re.escape(sect['name'])+'$')))
  assert btn.count()==1 and btn.is_visible();entry_checks.append({'sect':sect['id'],'joinEntryPresent':True,'copy':btn.inner_text()})
 shot(p,'ten-sect-join-entries');assert not errors,errors;c.close();b.close()
(OUT.parent/'browser.json').write_text(json.dumps({'figures':all_rows,'checks':all_checks,'joinEntries':entry_checks,'unsectedPreviewCannotSave':True,'cloudBlocked':True,'actualIphone':False},ensure_ascii=False,indent=2)+'\n')
print('ALL_SECT_WARDROBE_PASS',len(all_rows),len(all_checks),len(entry_checks),flush=True)
