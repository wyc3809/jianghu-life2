"""第57項：二十人同場原型，雙引擎手機、播放生命週期、真結果與隔離。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, time
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/sect-battle-prototype';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('SECT_PREVIEW_BASE','http://127.0.0.1:5250/sect-battle-preview.html')
VISIBLE='e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>=43&&r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1}'
report=[]
def main(page):return page.locator('.sect-battle-preview')
def seconds(page):return float(main(page).get_attribute('data-seconds'))
def click(page,name):
 b=page.get_by_role('button',name=name,exact=True);assert b.evaluate(VISIBLE),name;b.click()
def pixels(page):return page.locator('canvas').evaluate('e=>e.toDataURL()')
def geometry(page):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1'),'page overflow'
 assert page.locator('canvas').evaluate('e=>{const r=e.getBoundingClientRect();return r.width>280&&r.height>180&&r.bottom<innerHeight}'),'arena too small'
 for b in page.locator('main button').all():assert b.evaluate(VISIBLE),b.inner_text()
def outcome(page):return page.locator('.sect-battle-result').inner_text()
def start(b,w,h,reduce=False,video=False,broken=None):
 c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce' if reduce else 'no-preference',**({'record_video_dir':str(ROOT/'.local-online/organization-wars/video'),'record_video_size':{'width':390,'height':844}} if video else {}))
 c.add_init_script('''window.__sectWrites=[];Storage.prototype.setItem=function(){window.__sectWrites.push('storage')};Storage.prototype.removeItem=function(){window.__sectWrites.push('remove')};indexedDB.open=function(){window.__sectWrites.push('indexeddb');throw Error('preview must not open saves')};window.__sectHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__sectHidden});''')
 if broken:
  c.add_init_script('''(()=>{let assets;Object.defineProperty(window,'__sectPreviewAssets',{get:()=>assets,set:value=>{for(const key of Object.keys(value)){if('''+('key.includes("/martial/")||key.includes("/hero-detail/")' if broken=='all' else 'key.endsWith("/qy_cloud_sword.webp")')+''')value[key]='data:image/webp;base64,AA==';}assets=value;}})})();''')
 page=c.new_page();errors=[];external=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and '127.0.0.1' not in r.url else None)
 page.goto(BASE);return c,page,errors,external
with sync_playwright() as p:
 for engine in json.loads(os.getenv('SECT_ENGINES','["chromium","webkit"]')):
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('SECT_SIZES','[[320,568],[390,844],[430,932]]')):
   print('SECT',engine,w,h,flush=True);record=engine=='chromium' and w==390;c,page,errors,external=start(b,w,h,video=record)
   page.get_by_role('button',name='開始會武',exact=True).wait_for();geometry(page)
   if record:page.screenshot(path=str(OUT/'formation-390.png'))
   click(page,'代表名冊');d=page.get_by_role('dialog',name='代表名冊');assert d.locator('.sect-roster-scroll button').count()==20;click(page,'關閉代表名冊')
   click(page,'開始會武');page.wait_for_timeout(4000 if record else 800);click(page,'暫停');held=seconds(page);paint=pixels(page);page.wait_for_timeout(500);assert seconds(page)==held and pixels(page)==paint,'pause did not freeze canvas'
   if record:page.screenshot(path=str(OUT/'melee-390.png'))
   click(page,'繼續');page.wait_for_timeout(400);page.evaluate("window.__sectHidden=true;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_timeout(250);held=seconds(page);paint=pixels(page);page.wait_for_timeout(600);assert seconds(page)==held and pixels(page)==paint,'hidden loop still advances'
   page.evaluate("window.__sectHidden=false;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_timeout(400);assert seconds(page)>held and seconds(page)-held<1,'background catch-up'
   click(page,'代表名冊');page.wait_for_timeout(250);held=seconds(page);page.wait_for_timeout(500);assert seconds(page)==held,'native sheet must stop playback'
   buttons=page.get_by_role('dialog',name='代表名冊').locator('.sect-roster-scroll button');buttons.nth(11).scroll_into_view_if_needed();buttons.nth(11).click();page.wait_for_timeout(250);assert '宋懷瑾' in page.locator('.sect-battle-focus').inner_text(),'roster selection failed'
   page.get_by_role('button',name='直接結果',exact=True).evaluate('e=>{e.click();e.click()}');page.wait_for_timeout(150);assert main(page).get_attribute('data-status')=='result';expected=outcome(page);paint=pixels(page);page.wait_for_timeout(350);assert pixels(page)==paint
   if record:page.screenshot(path=str(OUT/'result-390.png'))
   click(page,'重播戰報');assert seconds(page)==0;click(page,'速度 ×1');click(page,'開始會武')
   if record:
    page.wait_for_function("document.querySelector('main').dataset.status==='result'",timeout=45000);assert outcome(page)==expected,'normal play differs from skip'
   else:click(page,'直接結果');assert outcome(page)==expected
   assert page.evaluate('window.__sectWrites')==[];assert not errors,errors;assert not external,external
   report.append({'engine':engine,'viewport':[w,h],'allTwentyRoster':True,'fixedFullScreen':True,'pauseFreezesCanvas':True,'backgroundFreezesAndResumes':True,'nativeSheetPauses':True,'selectFromRoster':True,'skipReplaySameResult':True,'fullPlayback':record,'noSaveWrites':True,'noExternalRequests':True,'pageerrors':errors});v=page.video;c.close()
   if record and v:report[-1]['video']=v.path()
  for kind in ['reduced','partial','all']:
   print('EDGE',engine,kind,flush=True);c,page,errors,external=start(b,390,844,reduce=kind=='reduced',broken=kind if kind!='reduced' else None)
   if kind=='all':page.get_by_role('button',name='重試',exact=True).wait_for();assert '人物圖未能載入' in page.locator('[role=status]').inner_text()
   else:
    name='查看戰果' if kind=='reduced' else '開始會武';page.get_by_role('button',name=name,exact=True).wait_for();geometry(page);click(page,name)
    if kind=='partial':assert '簡化演出' in page.locator('.sect-battle-notes').inner_text();click(page,'直接結果')
    assert main(page).get_attribute('data-status')=='result';held=pixels(page);page.wait_for_timeout(400);assert pixels(page)==held
   assert not errors,errors;assert page.evaluate('window.__sectWrites')==[];assert not external;report.append({'engine':engine,'edge':kind,'passed':True});c.close()
  b.close()
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('SECT_PASS',len(report),flush=True)
