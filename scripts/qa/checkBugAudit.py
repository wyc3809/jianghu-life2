"""第53項：主頁至各主要功能、原生modal、修煉攔截、門派重開及交手結算。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'h','exec'))
BASE=os.getenv('BUG_BASE','http://127.0.0.1:5213/jianghu-life2/');OUT=ROOT/os.getenv('BUG_OUT','production/qa/evidence/redesign/bug-audit-ea097');OUT.mkdir(parents=True,exist_ok=True)
fixtures=json.loads((ROOT/'.local-online/bug-audit-ea097/fixtures.json').read_text());old_tap=tap

def tap(page,name,exact=True):
 buttons(page,name,exact).first.wait_for(state='visible');old_tap(page,name,exact)
def click(page,name,exact=True):
 target=page.get_by_role('button',name=name,exact=exact).first;target.scroll_into_view_if_needed();target.click();stable(page)
def check(page,screen):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),screen+' horizontal overflow'
 text=page.locator('body').inner_text();assert not re.search(r'\b(?:undefined|NaN)\b',text),screen+' raw value'
 assert not page.locator('img').evaluate_all('es=>es.some(e=>e.complete&&e.naturalWidth===0&&e.getBoundingClientRect().width>1)'),screen+' missing visible art'
def resources(page):
 m=meta(page);v=ch(page);return {key:copy.deepcopy(m.get(key)) for key in ['jade','pages','manuals']}|{'equipment':v['equipment'],'preset':v['combatLoadout'],'skills':v['skills'],'money':v['money']}
def resume(page):
 page.reload();page.get_by_role('button',name=re.compile('^續寫前緣')).wait_for();tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(500)
 if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
report=[]
with sync_playwright() as p:
 for engine in json.loads(os.getenv('BUG_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('BUG_SIZES','[[320,568],[390,844],[430,932]]')):
   print('ROUTES',engine,w,h,flush=True);f=fixtures['full'];c,page,errors=start(b,w,h);assets=[];page.on('pageerror',lambda e:print('PAGEERROR',e,flush=True))
   page.on('response',lambda r:assets.append(r.url) if r.status>=400 and r.url.startswith(BASE) else None)
   check(page,'home');before=resources(page)
   trigger=page.get_by_role('button',name='開啟設定');trigger.focus();tap(page,'開啟設定');d=page.get_by_role('dialog',name='設定');assert d.evaluate('e=>e.matches(":modal")')
   slider=d.get_by_role('slider',name='音效音量');slider.focus();page.wait_for_timeout(1300);assert slider.evaluate('e=>document.activeElement===e'),'ticker steals settings focus'
   for _ in range(20):page.keyboard.press('Tab');assert page.evaluate('document.activeElement===document.body||Boolean(document.activeElement.closest("dialog[open]"))')
   d.get_by_role('button',name='關閉設定').focus();page.keyboard.press('Escape');stable(page);assert not page.locator('dialog[open]').count()
   if engine=='chromium' and w==390:tap(page,'開啟設定');shot(page,'after-settings.png');page.keyboard.press('Escape')
   page.locator('.ink-quick').get_by_role('button',name='祖祠',exact=True).click();d=page.get_by_role('dialog',name='祖祠');assert d.evaluate('e=>e.matches(":modal")');page.keyboard.press('Escape');stable(page)
   nav(page,'人物');main_geometry(page)
   for label in ['修行詳情','境界與傳承','戰力詳解','屬性與心性詳解','裝備與詞綴','族譜','人際','成就','江湖根腳']:
    tap(page,'更多');tap(page,label);check(page,label);click(page,'← 返回人物')
   tap(page,'武學');assert page.locator('.ink-martial-slot').count()==7;page.locator('.ink-martial-slot button').first.click();page.keyboard.press('Escape');tap(page,'返回人物');tap(page,'返回鎮居')
   page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();tap(page,'卡池詳情');check(page,'gacha-info');close(page,'卡池詳情');tap(page,re.compile('^家族收藏'),False);check(page,'collection');tap(page,'書頁兌換',False);check(page,'exchange');close(page,'書頁兌換');tap(page,'‹ 返回江湖')
   for label in ['華山論劍','開宗立派','江湖風雲']:
    tap(page,label);page.wait_for_timeout(300);check(page,label);click(page,'‹ 返回江湖')
   tap(page,'返回鎮居');nav(page,'修煉');check(page,'practice');click(page,re.compile('^修習雅藝'),False);check(page,'arts');click(page,'返回');click(page,re.compile('^門派'),False);check(page,'sect');click(page,'返回');nav(page,'鎮居')
   assert resources(page)==before,'browsing charged or changed loadout';assert not errors,errors;assert not assets,assets
   report.append({'engine':engine,'viewport':[w,h],'screens':['鎮居','設定','祖祠','人物與九項詳情','武學及欄位','秘笈閣池規／收藏／兌換','華山論劍','開宗立派','江湖風雲','修煉／雅藝／門派'],'noPageErrors':True,'noAssetErrors':True,'noHorizontalOverflow':True,'noRawValues':True,'settingsAndAncestryNativeModal':True,'settingsFocusSurvivesTicker':True,'browsingNoChargeOrLearn':True});c.close()
  # 真零銀兩不能提交，合法苦練仍只扣一次；自立門派重開後仍在。
  for kind in ['poor','founder','battle']:
   print('STATE',engine,kind,flush=True);f=fixtures[kind];c,page,errors=start(b,390,844)
   if kind=='poor':
    nav(page,'修煉');button=page.get_by_role('button',name=re.compile('精工鑄器')).first;button.scroll_into_view_if_needed();assert button.is_disabled();assert '尚欠' in button.inner_text();assert state(page)['practiceActionsLeft']==3
    if engine=='chromium':shot(page,'after-poor-practice.png')
    click(page,re.compile('苦練外功'),False);assert state(page)['practiceActionsLeft']==2;page.keyboard.press('Escape')
   elif kind=='founder':
    nav(page,'江湖');tap(page,'開宗立派');assert '青山門' in page.locator('.ink-sect-founder-panel').inner_text();click(page,'親自指點 · 修煉1次');assert state(page)['practiceActionsLeft']==2;page.keyboard.press('Escape');stable(page)
    resume(page);nav(page,'江湖');tap(page,'開宗立派');assert '青山門' in page.locator('.ink-sect-founder-panel').inner_text();assert len(state(page)['foundedSect']['disciples'])==1;assert state(page)['practiceActionsLeft']==2
    if engine=='chromium':shot(page,'after-founder-reload.png')
   else:
    page.get_by_role('button',name=re.compile('^跳過')).first.wait_for(timeout=30000);page.get_by_role('button',name=re.compile('^跳過')).first.click();page.wait_for_timeout(500)
    if page.get_by_role('button',name='放其歸去',exact=True).count():click(page,'放其歸去')
    assert not page.locator('.ink-unified-battle').count();assert not state(page).get('pendingCombat');rewards=resources(page);page.keyboard.press('Escape');resume(page);assert resources(page)==rewards,'reloading battle credited again'
   assert not errors,errors;report.append({'engine':engine,'state':kind,'passed':True,'pageerrors':errors});c.close()
  b.close()
(OUT/'routes-report.json').write_text(json.dumps({'actualIphone':False,'cloudRequestsBlocked':True,'cases':report},ensure_ascii=False,indent=2));print('BUG_BROWSER_PASS',len(report))
