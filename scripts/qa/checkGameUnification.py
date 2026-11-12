"""第61項：全功能入口、真換裝／修煉／戰畢、彈窗隔離及動態偏好；雲端隔離。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,re,copy
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/game-unification';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('UNIFICATION_BASE','http://127.0.0.1:5294/')
fixtures=json.loads((ROOT/'.local-online/unify-game/fixtures.json').read_text())
rows=[]
ROUTE_LABELS=['鎮居','人物','裝備比較','武學七欄','外功選擇','設定','祖祠','修煉','單機門派','雅藝','江湖地圖','華山論劍','開宗立派','江湖風雲','秘笈閣','卡池詳情','家族收藏','書頁兌換','結果','修行詳情','境界與傳承','戰力詳解','屬性與心性詳解','裝備與詞綴','族譜','人際','成就','江湖根腳']
def start(browser,w=390,h=844,kind='full',record=False):
 c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce',**({'record_video_dir':str(ROOT/'.local-online/unify-game/videos'),'record_video_size':{'width':390,'height':844}} if record else {}))
 f=fixtures[kind]
 c.add_init_script('''(()=>{const f='''+json.dumps(f,ensure_ascii=False)+''';if(!localStorage.getItem('unification-qa')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('unification-qa','1')};const fetch=window.fetch.bind(window);window.fetch=(input,options)=>String(input?.url??input).includes('.supabase.co')?Promise.resolve(new Response(JSON.stringify({error:'qa_cloud_blocked'}),{status:503,headers:{'Content-Type':'application/json'}})):fetch(input,options);window.__homeDraws=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.closest('.ink-home-scene'))__homeDraws++;return draw.apply(this,args)}})();''')
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.set_default_timeout(10000)
 p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(450)
 if kind!='danger' and p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
 return c,p,errors
def tap(p,name,exact=True):
 b=p.get_by_role('button',name=name,exact=exact).first;b.scroll_into_view_if_needed();b.click();p.wait_for_timeout(100)
def nav(p,name):p.get_by_role('navigation',name='分卷').get_by_role('button',name=name,exact=True).click();p.wait_for_timeout(150)
def data(p):return p.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state')
def assets(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert not re.search(r'\b(?:NaN|undefined)\b',p.locator('body').inner_text())
 assert not p.locator('img').evaluate_all('es=>es.some(e=>e.complete&&!e.naturalWidth&&e.getBoundingClientRect().width>1)')
def resources(p):
 s=data(p);m=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
 return {k:copy.deepcopy(s['character'].get(k)) for k in ['equipment','combatLoadout','skills','volumes']}|{k:copy.deepcopy(m.get(k)) for k in ['jade','pages','manuals']}
def modal(p,label,role='dialog'):
 d=p.get_by_role(role,name=label,exact=True);d.wait_for();assert d.evaluate('e=>e.matches("dialog:modal")'),label
 # Background focus and click targets are fenced by the browser's native modal.
 assert p.evaluate('''()=>{const before=document.activeElement;const b=document.querySelector('.ink-bottom-dock button,.ink-hud button');if(b)b.focus();return document.activeElement===before}'''),label
 for _ in range(8):
  p.keyboard.press('Tab');assert p.evaluate('document.activeElement===document.body||Boolean(document.activeElement.closest("dialog[open]"))')
 return d
def shot(p,name):p.screenshot(path=str(OUT/name))
with sync_playwright() as pw:
 for engine in json.loads(os.getenv('UNIFICATION_ENGINES','["chromium","webkit"]')):
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('UNIFICATION_SIZES','[[320,568],[390,844],[430,932]]')):
   print('ROUTES',engine,w,h,flush=True);record=engine=='chromium' and w==390;c,p,errors=start(b,w,h,record=record)
   nav(p,'人物');before=resources(p)
   tap(p,'更換武器');d=modal(p,'更換武器');p.keyboard.press('Escape');assert resources(p)==before
   tap(p,'更換武器');p.locator('[data-gear-id="iron-blade"]').scroll_into_view_if_needed();p.locator('[data-gear-id="iron-blade"]').click();assert resources(p)==before
   tap(p,'換上');p.wait_for_timeout(300);after=resources(p);assert after['equipment']['weapon']=='iron-blade' and after['combatLoadout']==before['combatLoadout'] and after['jade']==before['jade'];before=after
   for label in ['修行詳情','境界與傳承','戰力詳解','屬性與心性詳解','裝備與詞綴','族譜','人際','成就','江湖根腳']:
    tap(p,'更多');tap(p,label);assets(p);tap(p,'← 返回人物')
   tap(p,'武學');assert p.locator('.ink-martial-slot').count()==7
   tap(p,'選擇外功欄位2');modal(p,'選擇外功');p.keyboard.press('Escape');tap(p,'返回人物');tap(p,'返回鎮居')
   trigger=p.get_by_role('button',name='開啟設定',exact=True);trigger.focus();tap(p,'開啟設定');d=modal(p,'設定');slider=d.get_by_role('slider',name='音效音量');slider.focus();p.wait_for_timeout(400);assert slider.evaluate('e=>e===document.activeElement')
   p.keyboard.press('Escape');assert trigger.evaluate('e=>e===document.activeElement')
   tap(p,'祖祠');d=modal(p,'祖祠');assert d.locator('h3').evaluate('e=>e.getBoundingClientRect().top>=0');assert d.locator('.ink-ancestry-points').evaluate('e=>e.getBoundingClientRect().bottom<innerHeight')
   d.locator('.ink-ancestry-content').evaluate('e=>e.scrollTop=e.scrollHeight');assert d.get_by_role('button',name='關閉祖祠').evaluate('e=>e.getBoundingClientRect().top>=0')
   if record:shot(p,'ancestry-390.png')
   p.keyboard.press('Escape');nav(p,'修煉')
   for name in ['門派','修習雅藝']:
    tap(p,name);assets(p);tap(p,'返回')
   nav(p,'江湖')
   for name in ['華山論劍','開宗立派','江湖風雲']:
    tap(p,name);assets(p);tap(p,'‹ 返回江湖')
   tap(p,'秘笈閣');assets(p);tap(p,'卡池詳情');modal(p,'卡池詳情');p.keyboard.press('Escape')
   tap(p,re.compile('^家族收藏'),False);assets(p);tap(p,'書頁兌換',False);modal(p,'書頁兌換');p.keyboard.press('Escape');tap(p,'‹ 返回江湖');tap(p,'返回鎮居')
   assert resources(p)==before,'browsing changed equipment/collection';assets(p)
   nav(p,'修煉');left=data(p)['practiceActionsLeft'];tap(p,re.compile('^苦練外功'),False);d=modal(p,'結果');assert data(p)['practiceActionsLeft']==left-1
   if record:shot(p,'result-390.png')
   tap(p,'查看變化');assert d.locator('.ink-delta-chips').is_visible();tap(p,'繼續');assert not p.locator('dialog[open]').count()
   assert not errors,errors;rows.append({'engine':engine,'viewport':[w,h],'routes':ROUTE_LABELS,'nativeModalsAndFocusReturn':True,'previewCancelNoMutation':True,'actualEquipNormalOnly':True,'browsingNoChargeOrLearn':True,'practiceSingleDebit':True,'ancestryHeaderAndPointsVisible':True,'pageerrors':errors})
   video=p.video;c.close()
   if record and video:(ROOT/'.local-online/unify-game/video.txt').write_text(str(video.path()))
  # 真風險確認／真戰畢及重開，唔用假結算。
  for kind in json.loads(os.getenv('UNIFICATION_STATES','["poor","founder","battle","danger"]')):
   print('STATE',engine,kind,flush=True);c,p,errors=start(b,kind=kind)
   if kind=='poor':
    nav(p,'修煉');btn=p.get_by_role('button',name=re.compile('精工鑄器'));assert btn.is_disabled() and '尚欠' in btn.inner_text();assert data(p)['practiceActionsLeft']==3
   elif kind=='founder':
    nav(p,'江湖');tap(p,'開宗立派');assert '青山門' in p.locator('.ink-sect-founder-panel').inner_text();tap(p,'親自指點 · 修煉1次');modal(p,'結果');p.keyboard.press('Escape');assert data(p)['practiceActionsLeft']==2
   elif kind=='danger':
    d=modal(p,'生死之約','alertdialog');assert d.get_by_role('button',name='暫且退避').count();p.keyboard.press('Escape');assert data(p)['character']['alive'] and not data(p).get('pendingCombat')
   else:
    skip=p.get_by_role('button',name='跳過 ›',exact=True);skip.wait_for(timeout=30000);p.wait_for_timeout(400)
    if engine=='chromium' and os.getenv('UNIFICATION_DEV','1')=='1':
     p.wait_for_function('Boolean(window.__martialBattleStage)',polling=100)
     p.evaluate('window.__firstStage=window.__martialBattleStage');p.emulate_media(reduced_motion='no-preference');p.wait_for_timeout(150);p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(150)
     p.wait_for_function('window.__martialBattleStage.quiet===true',polling=100)
     assert p.evaluate('window.__firstStage===window.__martialBattleStage'),'preference restarted replay'
    skip.evaluate('e=>{e.click();e.click()}');p.wait_for_timeout(300)
    if p.get_by_role('button',name='放其歸去',exact=True).count():tap(p,'放其歸去')
    assert not data(p).get('pendingCombat');p.keyboard.press('Escape');nav(p,'人物');p.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.tab==='person'")
    saved=resources(p);silver=data(p)['character']['money'];p.reload();p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(300)
    if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
    assert resources(p)==saved,'battle reloaded with another reward or mutation'
    assert data(p)['character']['money']==silver,'battle reload credited silver twice'
   assert not errors,errors;rows.append({'engine':engine,'state':kind,'passed':True,'pageerrors':errors});c.close()
  b.close()
(OUT/os.getenv('UNIFICATION_REPORT','browser.json')).write_text(json.dumps({'actualIphone':False,'cloudRequestsBlocked':True,'cases':rows},ensure_ascii=False,indent=2)+'\n')
print('GAME_UNIFICATION_BROWSER_PASS',len(rows))
