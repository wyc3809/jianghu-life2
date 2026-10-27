"""第三款人物頁：真持有裝備、只預覽、確認換裝及獨立配搭；雲端封鎖。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkTapNavigation.py').read_text().split('with sync_playwright() as p:')[0], 'tap_helpers', 'exec'))
fixtures=json.loads((ROOT/'.local-online/character-redesign/fixtures.json').read_text())
f=fixtures['full'];BASE=os.getenv('PERSON_BASE','http://127.0.0.1:5199/')
OUT=ROOT/os.getenv('PERSON_OUT','production/qa/evidence/redesign/person-screen');OUT.mkdir(parents=True,exist_ok=True)
result={'actualIphone':False,'cloudRequestsBlocked':True,'source':'design/art/person-screen/selected-third.png','cases':[]}

def state(page):return page.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state')
def main_geometry(page):
 assert not page.locator('.ink-bottom-dock,.ink-hud,.scroll-shell--has-tabs').count(), 'person page must use full screen'
 assert page.get_by_role('button',name='返回鎮居',exact=True).evaluate(VISIBLE)
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert page.locator('.ink-person-overview').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 assert page.locator('.ink-play-body').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 assert not page.get_by_role('button',name=re.compile('下一頁|上一頁')).count()
 for name in ['更換武器','更換護甲','更換飾品','武學','更多']:
  button=page.get_by_role('button',name=name,exact=True);assert button.evaluate(VISIBLE),name
  assert button.evaluate('e=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return t===e||e.contains(t)}'),name+' pointer blocked'
  r=button.bounding_box();assert r['width']>=44 and r['height']>=44,(name,r)
 expected=state(page)['character']['attributes'];actual=page.locator('.ink-person-attributes dl dd').all_text_contents();assert actual==[str(expected[k]) for k in ['genGu','wuXing','fuYuan','meiLi','danShi']]
 assert page.locator('.ink-person-overview img').evaluate_all('es=>es.every(e=>e.complete&&e.naturalWidth>0)')
def picker(page,slot):
 tap(page,'更換'+slot)
 d=page.get_by_role('dialog',name='更換'+slot,exact=True);d.wait_for()
 assert d.evaluate('e=>e.scrollHeight<=e.clientHeight+1'), 'whole sheet scrolls/cuts fixed controls'
 assert d.locator('.ink-equipment-confirm').evaluate(VISIBLE)
 assert d.locator('select,input[type="range"]').count()==0
 return d
def select_item(page,id):
 b=page.locator('[data-gear-id="'+id+'"]')
 b.scroll_into_view_if_needed();stable(page);assert b.evaluate(VISIBLE),(id,b.bounding_box())
 r=b.bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2);stable(page)

def snapshots(page):
 s=state(page);c=s['character']
 return {'equipment':copy.deepcopy(c['equipment']),'duel':copy.deepcopy(c['combatLoadout']),'gear':copy.deepcopy(c['gear']),'qi':c['qi'],'maxQi':c['maxQi'],'health':c['health'],'maxHealth':c['maxHealth'],'practice':s['practiceActionsLeft'],'jade':meta(page)['jade'],'pages':meta(page)['pages']}

with sync_playwright() as p:
 for engine in json.loads(os.getenv('PERSON_ENGINES','["chromium","webkit"]')):
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('PERSON_SIZES','[[320,568],[390,844],[430,932]]')):
   print('CASE',engine,w,h,flush=True);record=engine=='chromium' and w==390
   f=fixtures['full'];c,page,errors=start(browser,w,h,video=record);nav(page,'人物');page.wait_for_timeout(400);main_geometry(page)
   if record:shot(page,'03-after-person.png')
   before=snapshots(page);d=picker(page,'武器');assert d.locator('[data-gear-id="plain-robe"]').count()==0
   select_item(page,'iron-blade');assert snapshots(page)==before
   assert '4 → 10' in d.locator('.ink-equipment-compare').text_content()
   assert d.locator('.ink-equipment-column').first.locator('dd').all_text_contents()==['4','0']
   if record:shot(page,'04-after-picker.png')
   close(page,'更換武器');assert snapshots(page)==before
   d=picker(page,'武器');tap(page,'全部品質');tap(page,'良品');assert d.locator('.ink-equipment-item').evaluate_all('es=>es.every(e=>e.classList.contains("is-fine"))')
   tap(page,'戰力優先');tap(page,'名稱排序');select_item(page,'iron-blade')
   page.get_by_role('button',name='換上',exact=True).evaluate('e=>{e.click();e.click()}');stable(page)
   assert not page.locator('dialog[open]').count() and not page.get_by_role('dialog',name='結果',exact=True).count()
   after=snapshots(page);assert after['equipment']['weapon']=='iron-blade' and after['duel']==before['duel']
   assert after['jade']==before['jade'] and after['pages']==before['pages'] and after['practice']==before['practice']
   assert '配搭已更新' in page.locator('.ink-person-status').inner_text()
   tap(page,'對戰配搭');d=picker(page,'武器');select_item(page,'inkrain-sword');tap(page,'換上')
   assert ch(page)['equipment']['weapon']=='iron-blade' and ch(page)['combatLoadout']['equipment']['weapon']=='inkrain-sword'
   for slot,wrong in [('護甲','iron-blade'),('飾品','plain-robe')]:
    d=picker(page,slot);assert not d.locator('[data-gear-id="'+wrong+'"]').count();close(page,'更換'+slot)
   tap(page,'普通配搭');main_geometry(page)
   # Martial support/cancel remains a native sheet and has no old pagination.
   tap(page,'武學');page.get_by_role('button',name='選擇外功欄位2',exact=True).scroll_into_view_if_needed();tap(page,'選擇外功欄位2');d=page.get_by_role('dialog',name='選擇外功',exact=True);assert not d.get_by_role('button',name=re.compile('下一頁|上一頁')).count();close(page,'選擇外功')
   tap(page,'← 返回人物');tap(page,'更多');tap(page,'屬性與心性詳解');assert page.locator('.ink-person-detail-body').count();tap(page,'← 返回人物')
   main_geometry(page)
   before_return=snapshots(page);tap(page,'返回鎮居');assert page.locator('.ink-bottom-dock').is_visible() and page.locator('.ink-nav-center').is_visible()
   assert snapshots(page)==before_return, 'returning must not advance a month or change equipment'
   nav(page,'人物');main_geometry(page);assert not errors,errors
   result['cases'].append({'engine':engine,'viewport':[w,h],'fixedMain':True,'fullScreenNoDock':True,'returnRestoresHomeDock':True,'threeSlots':True,'realAttributes':True,'previewAndCancelNoMutation':True,'confirmOnly':True,'normalDuelSeparate':True,'noExtraResultPopup':True,'noDebit':True,'filterAndSort':True,'noPagination':True,'targets44':True,'pageerrors':errors})
   video=page.video;c.close()
   if record and video:result['video']=video.path()
  # Empty and long names remain operable on the shortest supported screen.
  for key in ['empty','long']:
   f=fixtures[key];c,page,errors=start(browser,320,568);nav(page,'人物');main_geometry(page)
   d=picker(page,'飾品')
   if key=='empty':assert d.get_by_role('button',name='換上',exact=True).is_disabled() and d.locator('.ink-equipment-empty').count()==1
   assert not errors,errors;c.close()
  browser.close()
(OUT/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
