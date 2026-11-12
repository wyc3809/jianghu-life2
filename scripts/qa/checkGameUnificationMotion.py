"""第61項：即時動態偏好、保留同一戰鬥引擎、彈窗背後停畫及長篇結果操作。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkGameUnification.py').read_text().split('\nwith sync_playwright() as pw:')[0],'unification_helpers','exec'))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-webgl'])
 c,p,errors=start(b,w=320,h=568)
 try:
  p.emulate_media(reduced_motion='no-preference');p.wait_for_function("document.documentElement.dataset.inkMotion==='full'")
  p.wait_for_function('Boolean(window.__sparStage)',polling=100);p.evaluate('window.__originalStage=__sparStage');p.wait_for_timeout(200)
  before=p.evaluate('__homeDraws');p.wait_for_timeout(350);normal=p.evaluate('__homeDraws')-before;assert normal>0
  tap(p,'開啟設定');p.wait_for_timeout(150);before=p.evaluate('__homeDraws');p.wait_for_timeout(400);covered=p.evaluate('__homeDraws')-before;assert covered==0,covered
  p.emulate_media(reduced_motion='reduce');p.wait_for_function("document.documentElement.dataset.inkMotion==='reduce'&&__sparStage.quiet")
  assert p.evaluate('__sparStage===__originalStage');p.keyboard.press('Escape');p.wait_for_timeout(200);assert p.evaluate('__homeDraws')>before
  assert resources(p)['equipment']==fixtures['full']['state']['character']['equipment']
  p.evaluate(r'''async()=>{const source=await(await fetch('/src/components/ink/InkPlayScreen.tsx')).text();const path=source.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];const {useLifeStore}=await import(path);useLifeStore.setState({lastResult:{title:'長篇記事',feedback:'山路漸深，你收好行囊，循溪聲繼續前行。'.repeat(50),choiceText:'循山路前行',deltas:Array.from({length:30},(_,i)=>'修為＋'+(i+1))}})}''')
  d=modal(p,'結果');story=d.locator('.ink-result-story');p.wait_for_timeout(1500);assert story.evaluate('e=>e.scrollTop')==0
  tap(p,'查看變化');button=d.get_by_role('button',name='繼續',exact=True)
  assert button.evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}'),'result acknowledgement outside viewport'
  assert d.locator('h3').evaluate('e=>e.getBoundingClientRect().top>=0'),'result heading hidden'
  shot(p,'long-result-320.png');tap(p,'繼續')
  # 直接展示既有已入帳提示，不更改任何收益或玩家存檔。
  for key,value,label in [
   ('offlineGain',{'xp':800,'silver':200,'countedMs':7200000,'reserveXp':100,'timeCapped':False,'tierCapped':True,'reserveCapped':False},'閉關所得'),
   ('succession',['家傳武學已承接。','銀庫與裝備庫留予後人。'],'家族傳承'),
   ('breakthroughResult',{'success':False,'lines':[],'oldTierName':'引氣入體','setback':20,'hpLoss':5,'qiLoss':3,'chance':.7},'突破未成，修為受損')]:
   p.evaluate(r'''async([key,value])=>{const source=await(await fetch('/src/components/ink/InkPlayScreen.tsx')).text();const path=source.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];const {useLifeStore}=await import(path);useLifeStore.setState({[key]:value})}''',[key,value])
   d=modal(p,label);assert d.evaluate('e=>e.getBoundingClientRect().width<=innerWidth+1');p.keyboard.press('Escape');assert not p.locator('dialog.ink-native-modal[open]').count()
  assert not errors,errors
  (OUT/'motion.json').write_text(json.dumps({'normalDrawsIn350ms':normal,'coveredDrawsIn400ms':covered,'liveSystemPreference':True,'sameHomeEngine':True,'noEquipmentChange':True,'reducedLongStoryNoAutoScroll':True,'longResultActionVisible':True,'nativeOfflineSuccessionBreakthrough':True,'actualIphone':False,'pageerrors':errors},ensure_ascii=False,indent=2)+'\n');print('GAME_UNIFICATION_MOTION_PASS')
 except Exception:
  shot(p,'motion-failure.png');raise
 finally:c.close();b.close()
