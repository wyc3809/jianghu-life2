"""正式構建的抽卡／武學文字、模式說明及隔離帳戶檢查；不是iPhone驗收。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy,json,os,re
ROOT=Path(__file__).resolve().parents[2]
BASE=os.getenv('MARTIAL_UI_BASE','http://127.0.0.1:5188/')
LABEL=os.getenv('MARTIAL_UI_LABEL','after')
OUT=ROOT/'production/qa/evidence/redesign/martial-economy'/LABEL
OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads((ROOT/'.local-online/codex-quality/fixtures.json').read_text())[0]
fixture=copy.deepcopy(fixture)
fixture['meta']['manuals']={'art_river_fist':{'stars':2,'copies':1,'vols':[1,3,7]},'art_silk_hand':{'stars':1,'copies':0,'vols':[2]}}
fixture['meta']['pages']=240
fixture['state']['character']['manualStars']={'art_river_fist':2,'art_silk_hand':1}
fixture['state']['character']['volumes']={'art_river_fist':[1,3,7]}
report={'base':BASE,'actualIOS':False,'productionBuild':True,'cases':[]}
with sync_playwright() as p:
 for engine in (['chromium'] if LABEL=='before' else ['chromium','webkit']):
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for width,height in ([(390,844)] if LABEL=='before' else [(320,568),(390,844),(420,896)]):
   ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce')
   ctx.route('**/*.supabase.co/**',lambda r:r.abort())
   ctx.route('**/fonts.googleapis.com/**',lambda r:r.abort())
   ctx.route('**/fonts.gstatic.com/**',lambda r:r.abort())
   ctx.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';
localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));
localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));
window.webkit={messageHandlers:{bridge:{postMessage(){}}}};})();''')
   page=ctx.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE,wait_until='domcontentloaded')
   page.get_by_role('button',name=re.compile('^續寫前緣')).click()
   page.locator('.ink-quick').wait_for()
   if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
   main=page.locator('.ink-quick .ink-badge-label').first.evaluate('e=>getComputedStyle(e).fontFamily')
   original=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
   tag=f'{engine}-{width}-{height}'
   page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click()
   page.evaluate('document.fonts.ready');page.wait_for_timeout(400)
   page.screenshot(path=str(OUT/f'{tag}-draw.png'))
   page.get_by_role('button',name='卡池詳情',exact=True).click()
   dialog=page.get_by_role('dialog')
   page.screenshot(path=str(OUT/f'{tag}-rules.png'))
   if LABEL!='before':
    assert dialog.get_by_label('本冊實際機率').is_visible()
    assert '不保證新卷' in dialog.inner_text()
   page.get_by_role('button',name='關閉卡池詳情').click()
   page.get_by_role('button',name=re.compile('^家族收藏')).click()
   page.locator('.ink-codex-shelf').wait_for()
   if LABEL!='before':assert '首次兌換外功會收錄完整七卷' in page.locator('.ink-codex-shelf').inner_text()
   page.screenshot(path=str(OUT/f'{tag}-shelf.png'))
   page.locator('.ink-codex-back').click()
   page.get_by_role('button',name='返回鎮居',exact=True).click()
   page.get_by_role('navigation',name='分卷').get_by_role('button',name='人物',exact=True).click()
   page.locator('.ink-bitlife-row').filter(has=page.get_by_text('武學',exact=True)).click()
   page.locator('.ink-skill-cards').wait_for()
   page.locator('.ink-skill-cards').scroll_into_view_if_needed()
   page.screenshot(path=str(OUT/f'{tag}-skills.png'))
   typography=page.locator('.ink-skill-card-head > strong,.ink-main-slot-name,.ink-school-tabs strong,.ink-school-tag').evaluate_all('es=>es.map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight}))')
   if LABEL!='before':
    assert all(x['font']==main for x in typography),typography
    assert page.get_by_text('尚未習得，選定裝備欄位後開始修煉。',exact=True).count()==1
    assert page.locator('.scroll-shell').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   actual=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
   for key in ['jade','gacha','manuals','pages']:assert actual.get(key)==original.get(key),(tag,key)
   assert not errors,errors
   report['cases'].append({'tag':tag,'mainFont':main,'typography':typography,'readOnlyNavigation':True,'pageerrors':errors})
   ctx.close()
  browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('MARTIAL_UI_PASS',LABEL,len(report['cases']))
