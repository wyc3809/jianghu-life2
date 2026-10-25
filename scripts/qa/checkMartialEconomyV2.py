"""第44項正式構建手機操作驗收；隔離真存檔，沒有DEV store注入或真玩家。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/martial-economy-v2';OUT.mkdir(parents=True,exist_ok=True)
f=json.loads((ROOT/'.local-online/martial-economy-v2/fixtures.json').read_text());BASE=os.getenv('MARTIAL_V2_BASE','http://127.0.0.1:5188/')
def meta(page):return page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
def saved(page):return page.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character')
def start(browser,width,height,m=None,reduce='reduce'):
 c=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion=reduce)
 for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
 fixture={'state':f['state'],'meta':m or f['meta']};c.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';if(!localStorage.getItem('v2-fixture')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('v2-fixture','1');}})();''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);page.get_by_role('button',name=re.compile('^續寫前緣')).click();page.locator('.ink-quick').wait_for();page.wait_for_timeout(500)
 if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
 return c,page,errors
report={'productionBuild':True,'actualIphone':False,'cases':[]}
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in [(320,568),(390,844),(430,932)]:
   c,page,errors=start(b,w,h);tag=f'{engine}-{w}-{h}';page.screenshot(path=str(OUT/f'{tag}-home.png'))
   main_font=page.locator('.ink-quick .ink-badge-label').first.evaluate('e=>getComputedStyle(e).fontFamily');before=meta(page)['jade']['free'];page.get_by_role('button',name='日常',exact=True).click();dialog=page.get_by_role('dialog',name='日常與成長');page.screenshot(path=str(OUT/f'{tag}-tasks.png'))
   for i in range(3):dialog.locator('button:not([disabled])').filter(has_text=re.compile('^領取60$')).first.click()
   assert meta(page)['jade']['free']==before+180
   assert dialog.get_by_role('button',name='領取60',exact=True).evaluate_all('es=>es.every(e=>e.disabled)')
   dialog.locator('button:not([disabled])').filter(has_text=re.compile('^領取30$')).first.click();assert meta(page)['jade']['free']==before+210
   assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   assert dialog.locator('button').evaluate_all('es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})')
   page.get_by_role('button',name='關閉日常與成長').click()
   page.get_by_role('navigation',name='分卷').get_by_role('button',name='人物',exact=True).click();page.locator('.ink-bitlife-row').filter(has=page.get_by_text('武學',exact=True)).click()
   assert page.get_by_role('tab',name='對戰配搭',exact=True).evaluate('e=>getComputedStyle(e).fontFamily')==main_font
   page.get_by_role('tab',name='對戰配搭',exact=True).click();page.get_by_role('button',name='選擇裝備：柔絲手',exact=True).click();page.get_by_role('button',name='替換柔絲手至欄位1',exact=True).click()
   page.wait_for_function('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character.combatLoadout.external[0]==="art_silk_hand"')
   ch=saved(page);assert ch['equippedArts'][0]=='art_river_fist';assert ch['volumes']['art_silk_hand']==[7]
   page.locator('.ink-play-body').evaluate('e=>e.scrollTop=0');page.screenshot(path=str(OUT/f'{tag}-duel.png'))
   page.get_by_role('tab',name='普通配搭',exact=True).click();assert page.locator('.ink-main-slot-name').first.inner_text()=='長河拳'
   page.get_by_role('navigation',name='分卷').get_by_role('button',name='鎮居',exact=True).click();page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();page.get_by_role('button',name=re.compile('^家族收藏')).click()
   page.get_by_label('選擇兌換武學').select_option('art_rain_sword');page.get_by_label('選擇兌換卷次').select_option('7');page.locator('.ink-pages').scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{tag}-exchange.png'));page.get_by_role('button',name='兌換',exact=True).click()
   assert meta(page)['manuals']['art_rain_sword']['vols']==[7];assert meta(page)['pages']==800;assert page.get_by_role('button',name='兌換',exact=True).is_disabled()
   row=page.locator('.ink-shelf-row').filter(has=page.locator('.ink-shelf-name',has_text='長河拳'))
   for cost in [100,200,300]:row.get_by_role('button',name=f'升階 · {cost}頁',exact=True).click()
   assert page.locator('.ink-shelf-name').first.evaluate('e=>getComputedStyle(e).fontFamily')==main_font
   m=meta(page);assert m['pages']==200;assert m['manuals']['art_river_fist']['stars']==3;assert m['manuals']['art_river_fist']['copies']==2
   row.scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{tag}-shelf.png'));assert not errors,errors
   assert page.locator('.ink-codex-shelf,.ink-shelf-row,.ink-pages,.ink-codex-shelf .ink-school-tabs').evaluate_all('es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)'),tag
   assert page.locator('.scroll-shell').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   assert page.locator('.ink-pages select,.ink-pages button,.ink-shelf-actions button').evaluate_all('es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})')
   report['cases'].append({'tag':tag,'dailyJade':180,'guideJade':30,'normalUnchanged':True,'duelVolume':[7],'exchangeVolume':[7],'upgradePages':600,'oldCopiesKept':2,'mainFont':main_font,'pageerrors':errors})
   c.close()
  b.close()
(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('MARTIAL_V2_BROWSER_PASS',len(report['cases']))
