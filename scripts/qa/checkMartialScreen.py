"""第51項：固定一屏配搭，真候選／七卷身份、比較確認、取消及雙配搭獨立。"""
from pathlib import Path
HELPER=Path('scripts/qa/checkPersonScreen.py')
exec(compile(HELPER.read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
fixtures=json.loads((ROOT/'.local-online/martial-ui/fixtures.json').read_text());ids=fixtures['ids']
BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5208/');OUT=ROOT/'production/qa/evidence/redesign/martial-ui'

base_snapshots=snapshots
def snapshots(page):
 result=base_snapshots(page);character=ch(page)
 result['learning']={key:copy.deepcopy(character.get(key)) for key in ['skills','volumes','skillRanks','skillProgress','manualStars','equippedArts','supportArts']}
 return result

def geometry(page):
 for selector in ['.ink-play-body','.ink-martial-screen','.ink-person-detail-body']:
  assert page.locator(selector).evaluate('e=>e.scrollHeight<=e.clientHeight+1'),selector+' scrolls'
 assert page.locator('.ink-martial-slot').count()==7
 for button in page.locator('.ink-martial-slot button,.ink-martial-footer>button').all():
  assert button.evaluate(VISIBLE),button.get_attribute('aria-label')
  r=button.bounding_box();assert r['width']>=44 and r['height']>=44,r
  assert button.evaluate('e=>e.scrollHeight<=e.clientHeight+1'),'text overflow '+str(button.text_content())
 assert not page.get_by_role('button',name=re.compile('下一頁|上一頁')).count()
 assert not page.locator('.ink-hud,.ink-bottom-dock').count()
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')

def choose(page,art):
 card=page.locator('[data-art-id="'+art+'"]');card.scroll_into_view_if_needed();stable(page)
 r=card.bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2);stable(page)

def open_slot(page,slot):
 label='外功欄位'+str(slot+1) if slot<5 else '內功欄位' if slot==5 else '身法欄位'
 tap(page,re.compile('^(選擇|更換)'+label+'$'),False)
 d=page.locator('dialog.ink-martial-sheet[open]');d.wait_for()
 assert d.evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 assert d.locator('.ink-martial-confirm').evaluate(VISIBLE)
 return d

report=[]
with sync_playwright() as p:
 for engine in json.loads(os.getenv('MARTIAL_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in [[320,568],[390,844],[430,932]]:
   print('MARTIAL',engine,w,h,flush=True);f=fixtures['full'];c,page,errors=start(b,w,h,video=(engine=='chromium' and w==390));nav(page,'人物');tap(page,'武學');geometry(page);before=snapshots(page)
   if engine=='chromium':shot(page,f'after-loadout-{w}.png')
   d=open_slot(page,1);choose(page,ids['external'][0]);assert d.locator('.ink-martial-confirm').is_disabled();assert snapshots(page)==before
   tap(page,'珍本');assert d.locator('[data-art-id]').evaluate_all('es=>es.every(e=>e.dataset.premium==="1")');choose(page,ids['premium']);assert snapshots(page)==before
   tap(page,'查看選中武學詳情');vols=d.locator('[data-volume]');assert vols.count()==7
   assert vols.evaluate_all('es=>es.map(e=>e.dataset.status)')==['未得','未得','已得','未得','未得','未得','已得']
   assert vols.locator('.ink-martial-volume-number').evaluate_all('es=>es.every(e=>e.scrollWidth<=e.clientWidth+1&&getComputedStyle(e).whiteSpace==="nowrap")')
   if engine=='chromium' and w==390:shot(page,'after-volumes.png')
   tap(page,'返回武學列表');page.keyboard.press('Escape');stable(page);assert snapshots(page)==before
   d=open_slot(page,1);choose(page,ids['storedExternal']);assert snapshots(page)==before
   if engine=='chromium':shot(page,f'after-picker-{w}.png')
   d.locator('.ink-martial-confirm').evaluate('e=>{e.click();e.click()}');stable(page);after=snapshots(page)
   assert after['equipment']==before['equipment'] and after['duel']==before['duel'];assert ch(page)['equippedArts'][1]==ids['storedExternal'];assert ch(page)['volumes'][ids['storedExternal']]==[3,7]
   for key in ['jade','pages','practice']:assert after[key]==before[key],key
   tap(page,'對戰配搭');geometry(page);d=open_slot(page,1);choose(page,ids['premium']);tap(page,re.compile('^裝備.*至外功欄位2$'),False)
   assert ch(page)['equippedArts'][1]==ids['storedExternal'] and ch(page)['combatLoadout']['external'][1]==ids['premium']
   # 支援各一門、所有外功不列入候選；卸下只影響目前配搭。
   d=open_slot(page,5);assert d.locator('[data-art-id]').evaluate_all('es=>es.every(e=>!e.dataset.artId.startsWith("pr_blood_lotus"))');choose(page,ids['internal'][1]);tap(page,re.compile('^裝備.*至內功欄位$'),False)
   assert ch(page)['combatLoadout']['internal']==ids['internal'][1] and ch(page)['supportArts']['internal']==ids['internal'][0]
   d=open_slot(page,6);tap(page,'卸下');assert ch(page)['combatLoadout']['qinggong'] is None and ch(page)['supportArts']['qinggong']==ids['qinggong'][0]
   tap(page,'普通配搭');tap(page,'查看耗內與回內');assert '1%' in page.get_by_role('dialog',name='耗內與回內').text_content();close(page,'耗內與回內')
   tap(page,re.compile('^配搭加成'),False);close(page,'配搭加成');geometry(page)
   tap(page,'收藏');page.locator('.ink-person-detail-body').get_by_role('button',name='查看長河拳',exact=True).scroll_into_view_if_needed();tap(page,'查看長河拳');assert page.get_by_role('dialog',name='長河拳').locator('[data-volume]').count()==7;close(page,'長河拳')
   tap(page,'返回人物');main_geometry(page);tap(page,'返回鎮居');assert page.locator('.ink-bottom-dock').is_visible();assert not errors,errors
   report.append({'engine':engine,'viewport':[w,h],'fixedSevenSlots':True,'targets44':True,'noOverflow':True,'noPagination':True,'previewCancelNoMutation':True,'realSevenVolumeStates':True,'filterPremium':True,'confirmAndDoubleClickGate':True,'collectionLearnOnlyOnConfirm':True,'normalDuelSeparate':True,'supportSeparate':True,'noDebit':True,'libraryVolumes':True,'pageerrors':errors})
   video=page.video;c.close()
   if engine=='chromium' and w==390 and video:(ROOT/'.local-online/martial-ui/ui-video.txt').write_text(str(video.path()))
  for key in ['empty','long']:
   f=fixtures[key];c,page,errors=start(b,320,568);nav(page,'人物');tap(page,'武學');geometry(page);d=open_slot(page,0)
   if key=='empty':assert d.locator('.ink-martial-confirm').is_disabled() and d.locator('.ink-martial-empty').count()
   assert not errors,errors;c.close()
  b.close()
(OUT/'ui-report.json').write_text(json.dumps({'actualIphone':False,'cloudRequestsBlocked':True,'cases':report},ensure_ascii=False,indent=2));print('MARTIAL_PASS',len(report))
