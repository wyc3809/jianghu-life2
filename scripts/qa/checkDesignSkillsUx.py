"""第52項：雙技能改善後的秘笈閣，真冊頁／兌換／藏本及六組手機驗收。"""
from pathlib import Path
HELPER=Path('scripts/qa/checkPersonScreen.py')
exec(compile(HELPER.read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('DESIGN_UX_BASE','http://127.0.0.1:5212/');OUT=ROOT/os.getenv('DESIGN_UX_OUT','production/qa/evidence/redesign/design-skills');OUT.mkdir(parents=True,exist_ok=True)
fixtures=json.loads((ROOT/'.local-online/martial-ui/fixtures.json').read_text());f=fixtures['full'];ids=fixtures['ids']
old_tap=tap
def tap(page,name,exact=True):
 buttons(page,name,exact).first.wait_for(state='visible');page.wait_for_timeout(200);old_tap(page,name,exact)
def snapshot(page):
 character=ch(page)
 return {'jade':meta(page)['jade'],'pages':meta(page)['pages'],'manuals':meta(page)['manuals'],'skills':character['skills'],'volumes':character.get('volumes'),'equipment':character['equipment'],'preset':character['combatLoadout'],'practice':state(page)['practiceActionsLeft']}
def fixed(page):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert not page.locator('.ink-bottom-dock,.ink-hud,select').count()
 for name in ['抽一次','抽十次']:
  button=page.get_by_role('button',name=re.compile(name));assert button.evaluate(VISIBLE),(name,button.bounding_box())
  r=button.bounding_box();assert r['width']>=44 and r['height']>=44
 assert page.locator('.ink-play-body').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
def sheet_check(page):
 d=page.locator('dialog[open]').last
 assert d.evaluate('e=>e.scrollHeight<=e.clientHeight+1'),'whole dialog scrolls'
 header=d.locator('header');close_button=header.get_by_role('button');assert close_button.evaluate(VISIBLE)
 assert header.evaluate('e=>{const h=e.querySelector("h2,h3").getBoundingClientRect(),b=e.querySelector("button").getBoundingClientRect();return h.right<=b.left+1||h.bottom<=b.top+1}')
 for button in d.locator('footer button').all():
  assert button.evaluate(VISIBLE);r=button.bounding_box();assert r['width']>=44 and r['height']>=44
 return d

def enter(page):
 page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();page.wait_for_timeout(450)
report=[]
with sync_playwright() as p:
 for engine in json.loads(os.getenv('DESIGN_UX_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('DESIGN_UX_SIZES','[[320,568],[390,844],[430,932]]')):
   print('CASE',engine,w,h,flush=True);record=engine=='chromium' and w==390
   c,page,errors=start(b,w,h,video=record);enter(page);fixed(page);initial=snapshot(page)
   if engine=='chromium':shot(page,f'after-draw-{w}.png')
   tap(page,'選擇流派小冊');d=sheet_check(page);assert d.locator('.ink-codex-pack-options button[aria-pressed=true]').count()==1
   d.locator('.ink-codex-pack-options button').last.click();stable(page);assert snapshot(page)==initial;fixed(page)
   tap(page,'選擇抽卡流派');d=sheet_check(page)
   if record:shot(page,'after-school.png')
   tap(page,'選逍遙遊流派');fixed(page);assert snapshot(page)==initial
   tap(page,'珍本奇功',False);assert '付費測試玉石' in page.locator('#ink-codex-availability').text_content();assert not page.get_by_role('button',name=re.compile('抽一次')).is_enabled()
   if record:shot(page,'after-paid-shortage.png')
   tap(page,'江湖秘笈',False);tap(page,re.compile('^家族收藏'),False)
   assert not page.locator('select').count();assert page.locator('.ink-codex-collection-tools').evaluate(VISIBLE)
   assert page.locator('.ink-codex-collection').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
   premium=page.locator('[data-manual-id="'+ids['premium']+'"]');ordinary=page.locator('[data-manual-id="'+ids['external'][0]+'"]')
   assert premium.get_attribute('data-premium')=='1' and ordinary.get_attribute('data-premium')=='0'
   assert premium.locator('img').get_attribute('src')!=ordinary.locator('img').get_attribute('src')
   if engine=='chromium':shot(page,f'after-collection-{w}.png')
   card=page.locator('[data-manual-id="'+ids['external'][0]+'"]');card.scroll_into_view_if_needed();card.click();d=sheet_check(page)
   assert d.locator('[data-volume]').count()==7;assert snapshot(page)==initial
   if record:shot(page,'after-manual.png')
   page.keyboard.press('Escape');stable(page);assert snapshot(page)==initial
   tap(page,'書頁兌換',False);d=sheet_check(page);assert d.locator('footer button').is_disabled()
   tap(page,'選擇兌換武學',False);d=sheet_check(page);option=d.locator('[data-exchange-art="'+ids['external'][0]+'"]');option.scroll_into_view_if_needed();option.click();stable(page);d=sheet_check(page)
   # 已持有卷一不可點，指定卷七的預覽及取消不扣書頁。
   assert d.locator('.ink-codex-exchange-volumes button').nth(0).is_disabled()
   d.locator('.ink-codex-exchange-volumes button').nth(6).scroll_into_view_if_needed();d.locator('.ink-codex-exchange-volumes button').nth(6).click();stable(page);assert snapshot(page)==initial
   if record:shot(page,'after-exchange-preview.png')
   close(page,'書頁兌換');assert snapshot(page)==initial
   tap(page,'書頁兌換',False);tap(page,'選擇兌換武學',False);option=page.locator('[data-exchange-art="'+ids['external'][0]+'"]');option.scroll_into_view_if_needed();option.click();stable(page)
   v=page.locator('.ink-codex-exchange-volumes button').nth(6);v.scroll_into_view_if_needed();v.click();stable(page)
   page.get_by_role('button',name='確認兌換',exact=True).evaluate('e=>{e.click();e.click()}');stable(page)
   after=meta(page);assert after['pages']==initial['pages']-200;assert after['manuals'][ids['external'][0]]['vols']==[1,7]
   assert after['jade']==initial['jade'];assert ch(page)['volumes']==initial['volumes'];assert '已入藏' in page.locator('.ink-codex-exchange-confirm').inner_text()
   if record:shot(page,'after-exchange-receipt.png')
   close(page,'書頁兌換');tap(page,'流派：全部 ⌄');sheet_check(page);tap(page,'選鎖脈擒龍流派')
   empty=page.locator('.ink-codex-empty')
   if empty.count():tap(page,'查看全部藏本')
   else:
    page.locator('.ink-codex-collection-heading button').click();tap(page,'全部')
   tap(page,'入藏說明',False);sheet_check(page);close(page,'入藏說明');tap(page,'返回抽取',False);fixed(page)
   tap(page,'‹ 返回江湖');assert page.locator('.ink-jianghu-map').count();tap(page,'返回鎮居');assert page.locator('.ink-bottom-dock').is_visible();assert not errors,errors
   report.append({'engine':engine,'viewport':[w,h],'fixedDrawAndCollection':True,'targets44':True,'noSystemSelect':True,'permanentPremiumCover':True,'packAndSchoolNoCharge':True,'paidPoolShortageClear':True,'trueSevenVolumes':True,'previewCancelNoMutation':True,'doubleConfirmSingle200Debit':True,'onlyChosenVolumeAdded':True,'notAutoLearned':True,'dialogHeaderFooterVisible':True,'pageerrors':errors})
   video=page.video;c.close()
   if record and video:(ROOT/'.local-online/design-skills/ui-video.txt').write_text(str(video.path()))
  b.close()
(OUT/'ui-report.json').write_text(json.dumps({'actualIphone':False,'cloudRequestsBlocked':True,'cases':report},ensure_ascii=False,indent=2));print('DESIGN_UX_PASS',len(report))
