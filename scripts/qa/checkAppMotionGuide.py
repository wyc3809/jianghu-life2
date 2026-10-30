"""第55項：真確認換裝、略過續接、兩配搭、演出背景恢復與裝置尺寸。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'h','exec'))
BASE=os.getenv('MOTION_BASE','http://127.0.0.1:5240/');OUT=ROOT/'production/qa/evidence/redesign/app-motion-guide';OUT.mkdir(parents=True,exist_ok=True)
fixtures=json.loads((ROOT/'.local-online/app-motion-guide/fixtures.json').read_text())
def snapshot(page):
 s=state(page);m=meta(page);return {'equipment':copy.deepcopy(s['character']['equipment']),'duel':copy.deepcopy(s['character'].get('combatLoadout')),'gear':copy.deepcopy(s['character']['gear']),'practice':s['practiceActionsLeft'],'jade':m['jade'],'pages':m['pages'],'manuals':m['manuals'],'guides':m.get('economy',{}).get('guides')}
def geometry(page):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'horizontal overflow'
 for target in ['.ink-newbie-guide','.ink-person-overview','.ink-person-sheet[open]']:
  for el in page.locator(target).all():
   if el.is_visible():assert el.evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}'),target+' outside screen'
 if page.locator('.ink-person-overview').count():assert page.locator('.ink-person-overview').evaluate('e=>e.scrollHeight<=e.clientHeight+1'),'person whole-page scrolling'
def resume(page):
 page.reload();tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(400)
 if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
report=[]
with sync_playwright() as p:
 for engine in json.loads(os.getenv('MOTION_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('MOTION_SIZES','[[320,568],[390,844],[430,932]]')):
   print('GUIDE',engine,w,h,flush=True);record=engine=='chromium' and w==390;f=fixtures['equip'];c,page,errors=start(b,w,h,video=record)
   geometry(page);assert page.locator('.ink-newbie-guide').count()==1
   if record:shot(page,'after-equip-home.png')
   tap(page,'前往人物');geometry(page);before=snapshot(page);assert before['equipment']['weapon']=='old-sword','navigation auto equipped'
   assert page.locator('[data-guide-target="true"]').count()==1
   if record:shot(page,'after-person.png')
   d=picker(page,'武器');geometry(page);assert d.locator('.ink-newbie-guide').count()==1
   select_item(page,'iron-blade');assert snapshot(page)==before;assert '4 → 10' in d.locator('.ink-equipment-compare').inner_text()
   if record:shot(page,'after-picker.png')
   close(page,'更換武器');assert snapshot(page)==before
   d=picker(page,'武器');select_item(page,'iron-blade');page.get_by_role('button',name='換上',exact=True).evaluate('e=>{e.click();e.click()}');stable(page)
   after=snapshot(page);assert after['equipment']['weapon']=='iron-blade';assert after['duel']==before['duel'];assert {k:v for k,v in after.items() if k!='equipment'}=={k:v for k,v in before.items() if k!='equipment'}
   assert '4 → 10' in page.locator('.ink-newbie-guide').inner_text();geometry(page)
   if record:shot(page,'after-ready.png')
   resume(page);nav(page,'人物');assert '4 → 10' in page.locator('.ink-newbie-guide').inner_text();assert snapshot(page)['equipment']['weapon']=='iron-blade'
   tap(page,'略過操作指引');assert not page.locator('.ink-newbie-guide').count();assert ch(page)['flags']['coach_done'] is True
   resume(page);nav(page,'人物');assert not page.locator('.ink-newbie-guide').count();tap(page,'返回鎮居');tap(page,'開啟設定');settings=page.get_by_role('dialog',name='設定');button=settings.get_by_role('button',name='顯示目前提示');button.scroll_into_view_if_needed();button.click();stable(page)
   assert ch(page)['flags']['coach_done'] is False;assert page.locator('.ink-newbie-guide').count()==1;geometry(page);assert meta(page)['economy']['guides']==before['guides'];assert not errors,errors
   report.append({'engine':engine,'viewport':[w,h],'guideVisibleAndOperable':True,'realCompareThenConfirm':True,'cancelNoMutation':True,'doubleConfirmOnce':True,'normalDuelSeparate':True,'reloadKeepsProgressAndSkip':True,'reviewNoRewardsOrProgressReset':True,'noPageErrors':True});video=page.video;c.close()
   if record and video:report[-1]['video']=video.path()
  for kind in ['trial','handoff','missing']:
   print('ENTRY',engine,kind,flush=True);f=fixtures[kind];c,page,errors=start(b,390,844)
   if kind=='trial':
    assert '武館陪練' in page.locator('.ink-newbie-guide').inner_text();geometry(page)
    if engine=='chromium':shot(page,'after-trial-home.png')
   elif kind=='handoff':
    assert ch(page)['equipment']['weapon']=='old-sword';tap(page,'前往人物換裝');assert ch(page)['equipment']['weapon']=='old-sword';assert state(page)['pendingGearCompare'] is None;assert page.locator('.ink-person-overview').count()
   else:
    assert 'iron-blade' not in ch(page)['gear'];before=snapshot(page);tap(page,'前往人物');assert ch(page)['gear'].count('iron-blade')==1;assert ch(page)['equipment']['weapon']=='old-sword';assert meta(page)['jade']==before['jade'];d=picker(page,'武器');select_item(page,'iron-blade');close(page,'更換武器');assert ch(page)['equipment']['weapon']=='old-sword'
   assert not errors,errors;report.append({'engine':engine,'entry':kind,'passed':True});c.close()
  b.close()
(OUT/'guide-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('GUIDE_PASS',len(report),flush=True)
