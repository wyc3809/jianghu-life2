"""第56項：每個畫面提示只自動展示一次；真存檔重開與手動重看。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('ONCE_BASE','http://127.0.0.1:5242/jianghu-life2/')
OUT=ROOT/os.getenv('ONCE_OUT','production/qa/evidence/redesign/guide-once');OUT.mkdir(parents=True,exist_ok=True)
fixtures=json.loads((ROOT/'.local-online/app-motion-guide/fixtures.json').read_text())
baseline=os.getenv('ONCE_BASELINE')=='1';report=[]
def resume(page):
 page.reload();tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(600)
 if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
def guide(page,yes):
 assert page.locator('.ink-newbie-guide').count()==int(yes)
 if yes:assert page.locator('.ink-newbie-guide').evaluate(VISIBLE)
def review(page):
 tap(page,'開啟設定');b=page.get_by_role('dialog',name='設定').get_by_role('button',name='顯示目前提示');b.scroll_into_view_if_needed();b.click();stable(page)
def invariant(page):
 s=state(page);m=meta(page)
 return {k:copy.deepcopy(v) for k,v in {'gear':s['character']['gear'],'money':s['character']['money'],'duel':s['character']['combatLoadout'],'practice':s['practiceActionsLeft'],'jade':m['jade'],'pages':m['pages'],'guides':m.get('economy',{}).get('guides')}.items()}
with sync_playwright() as p:
 for engine in json.loads(os.getenv('ONCE_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('ONCE_SIZES','[[320,568],[390,844]]')):
   print('ONCE',engine,w,h,flush=True);f=fixtures['equip'];c,page,errors=start(b,w,h);before=invariant(page)
   guide(page,True)
   if not baseline:
    review(page);guide(page,True);assert ch(page)['flags']['coach_seen_equip_home'] is True
   tap(page,'前往人物');guide(page,True);assert page.locator('[data-guide-target="true"]').count()==1
   tap(page,'返回鎮居');nav(page,'人物')
   if baseline:
    guide(page,True);shot(page,'before-reenter.png');report.append({'engine':engine,'viewport':[w,h],'version':'EA0.98.0','reentryRepeatsHintAndHighlight':True});c.close();break
   guide(page,False);assert not page.locator('[data-guide-target="true"]').count()
   if engine=='chromium' and w==390:shot(page,'after-reenter.png')
   d=picker(page,'武器');assert d.locator('.ink-newbie-guide').count()==1;select_item(page,'iron-blade');assert '4 → 10' in d.locator('.ink-equipment-compare').inner_text();close(page,'更換武器')
   d=picker(page,'武器');assert not d.locator('.ink-newbie-guide').count();assert not d.locator('[data-guide-target="true"]').count();select_item(page,'iron-blade');tap(page,'換上');guide(page,True);assert '4 → 10' in page.locator('.ink-newbie-guide').inner_text()
   if engine=='chromium' and w==390:shot(page,'first-ready.png')
   tap(page,'返回鎮居');guide(page,False);resume(page);guide(page,False);nav(page,'人物');guide(page,False);assert ch(page)['equipment']['weapon']=='iron-blade';assert invariant(page)==before
   tap(page,'返回鎮居');review(page);guide(page,True);assert invariant(page)==before
   tap(page,'略過操作指引');guide(page,False);resume(page);guide(page,False);assert ch(page)['flags']['coach_done'] is True;assert invariant(page)==before
   assert not errors,errors;report.append({'engine':engine,'viewport':[w,h],'firstVisibleUntilLeave':True,'reentryNoHintOrHighlight':True,'pickerFirstOnly':True,'readyOnceAcrossHomeAndPerson':True,'reloadNoHint':True,'manualReviewOnly':True,'skipPersists':True,'noExtraRewardsOrDebit':True,'pageerrors':errors});c.close()
  if not baseline:
   f=fixtures['trial'];c,page,errors=start(b,390,844);guide(page,True);resume(page);guide(page,False);assert page.get_by_role('button',name='應戰',exact=True).is_enabled();assert not ch(page)['flags'].get('newbie_trial_won');assert not errors;report.append({'engine':engine,'entry':'trial','reloadDoesNotRepeat':True,'taskStillAvailable':True});c.close()
   # 舊鎮居提示同樣只展示一次，完成或略過紀錄亦不重設。
   f=copy.deepcopy(fixtures['trial']);f['state']['character']['flags']['newbie_done']=True;c,page,errors=start(b,390,844);assert page.locator('.ink-coach').count()==1;resume(page);assert not page.locator('.ink-coach').count();assert not errors;report.append({'engine':engine,'entry':'legacy','reloadDoesNotRepeat':True});c.close()
  b.close()
(OUT/('baseline-report.json' if baseline else 'report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('ONCE_PASS',len(report),flush=True)
