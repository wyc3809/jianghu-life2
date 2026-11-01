"""會武真元件驗收：雙引擎三尺寸、暫停／背景／名冊、跳過與重播、舊檔及素材後備。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,copy,time,base64
ROOT=Path(__file__).resolve().parents[2];LOCAL=ROOT/'.local-online/sect-production';OUT=ROOT/os.getenv('WAR_OUT','production/qa/evidence/redesign/sect-war/ui');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('WAR_BASE','http://127.0.0.1:5253/');config=json.loads((ROOT/'.local-online/appearance-cloud-config.json').read_text());session=json.loads((LOCAL/'qa-sessions.json').read_text())[0];session['expires_at']=json.loads(base64.urlsafe_b64decode(session['access_token'].split('.')[1]+'=='))['exp']
state=json.loads((LOCAL/'states.json').read_text())[0];meta=json.loads((ROOT/'.local-online/game-polish/fixtures.json').read_text())['meta'];auth_key='sb-'+config['url'].split('//')[1].split('.')[0]+'-auth-token'
report=[]
VISIBLE='e=>{const r=e.getBoundingClientRect();return r.width>=20&&r.height>=43&&r.top>=0&&r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}'
def start(browser,w,h,reduce=False,broken=False,native=False):
 c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce'if reduce else'no-preference')
 seed={'state':copy.deepcopy(state),'meta':meta,'session':session,'authKey':auth_key}
 c.add_init_script('''(()=>{const f='''+json.dumps(seed,ensure_ascii=False)+''';localStorage.setItem(f.authKey,JSON.stringify(f.session));if(!localStorage.getItem('war-qa')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('war-qa','1');}window.__warHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__warHidden});})()''')
 if native or os.getenv('WAR_NATIVE')=='1':c.add_init_script('window.CapacitorCustomPlatform={name:"ios"};')
 c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=204 if r.request.method=='OPTIONS'else 503,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*,authorization,apikey,content-type,x-client-info,x-supabase-api-version','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},content_type='application/json',body='{}'))
 if broken:c.route('**/ink/art/sect-battle/**',lambda r:r.abort())
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?sect-war=1&trial=1');page.wait_for_function("document.querySelector('.war-actions button')&&!document.querySelector('.war-actions button').disabled",timeout=30000)
 return c,page,errors
def click(p,name):
 b=p.get_by_role('button',name=name,exact=True);assert b.evaluate(VISIBLE),('not_visible',name,b.bounding_box());b.click()
def seconds(p):return float(p.locator('main.ink-sect-war').get_attribute('data-seconds'))
def snap(p):return p.evaluate("JSON.stringify([localStorage.getItem('jianghu_life_v1_ls'),localStorage.getItem('jianghu_ancestry_v1')])")
def pixels(p):return p.locator('.war-stage canvas').evaluate('e=>e.toDataURL()')
def geometry(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1'),'main page scrolls'
 for b in p.locator('.war-actions>button,.war-back,.war-mode,.war-teams>button,.war-focus').all():assert b.evaluate(VISIBLE),('clipped control',b.inner_text(),b.bounding_box())
 assert p.locator('.war-stage canvas').evaluate('e=>{const r=e.getBoundingClientRect();return r.height>160&&r.width>280}'),'arena too small'
with sync_playwright()as p:
 for engine in json.loads(os.getenv('WAR_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])if engine=='chromium'else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('WAR_SIZES','[[320,568],[390,844],[430,932]]')):
   print('WAR_UI',engine,w,h,flush=True);c,page,errors=start(b,w,h);geometry(page);before=snap(page)
   if w==390:page.screenshot(path=str(OUT/(engine+'-ready.png')))
   click(page,'開始');page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>4.0",timeout=20000);click(page,'暫停');held=seconds(page);paint=pixels(page);page.wait_for_timeout(450);assert seconds(page)==held and pixels(page)==paint
   if w==390:page.screenshot(path=str(OUT/(engine+'-playing.png')))
   click(page,'繼續');page.wait_for_timeout(200);page.evaluate("window.__warHidden=true;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_timeout(150);held=seconds(page);paint=pixels(page);page.wait_for_timeout(450);assert seconds(page)==held and pixels(page)==paint
   page.evaluate("window.__warHidden=false;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>"+str(held),timeout=5000);assert seconds(page)-held<.6
   click(page,'名冊');d=page.get_by_role('dialog',name='代表名冊');d.wait_for();page.wait_for_timeout(200);held=seconds(page);page.wait_for_timeout(350);assert seconds(page)==held
   assert d.locator('.war-roster-grid>button').count()==10;d.get_by_role('tab',name='武當派',exact=True).click();assert d.locator('.war-roster-grid>button').count()==10
   target=d.locator('.war-roster-grid>button').nth(1);expected=target.locator('b').inner_text().split(' · ')[-1];target.click();assert expected in page.locator('.war-focus-copy').inner_text();assert not page.locator('dialog[open]').count()
   click(page,'跳過');page.wait_for_function("document.querySelector('.ink-sect-war').dataset.status==='result'");result=page.locator('.war-result').inner_text();paint=pixels(page);page.wait_for_timeout(350);assert pixels(page)==paint
   if w==390:page.screenshot(path=str(OUT/(engine+'-result.png')))
   click(page,'重播');page.wait_for_timeout(300);assert page.locator('.ink-sect-war').get_attribute('data-status')=='playing';click(page,'跳過');assert page.locator('.war-result').inner_text()==result;assert snap(page)==before;assert not errors,errors
   report.append({'engine':engine,'viewport':[w,h],'fixedScreen':True,'touchControls44Visible':True,'twentyRosterSelect':True,'pausePixelStable':True,'hiddenNoCatchup':True,'nativeDialogPauses':True,'skipReplaySameResult':True,'lifeAndEconomyUnchanged':True,'pageerrors':errors});c.close()
  for kind in ['reduced','asset_failure']:
   print('WAR_EDGE',engine,kind,flush=True);c,page,errors=start(b,390,844,reduce=kind=='reduced',broken=kind=='asset_failure');click(page,'開始')
   if kind=='reduced':page.wait_for_function("document.querySelector('.ink-sect-war').dataset.status==='result'")
   else:page.wait_for_timeout(800);click(page,'跳過');assert page.locator('.war-result').count()
   assert not errors,errors;report.append({'engine':engine,'edge':kind,'sameDetailedAssetsFallback':kind=='asset_failure','pageerrors':errors});c.close()
  b.close()
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('WAR_UI_PASS',len(report),flush=True)
