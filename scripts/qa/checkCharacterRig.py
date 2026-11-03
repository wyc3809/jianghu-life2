"""App內單角色真骨架：按鈕、固定步、造型、背景、後備及連續播放。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,time,copy,base64
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/character-rig-prototype';O.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('CHARACTER_RIG_BASE','http://127.0.0.1:5271/');report={'actualIphone':False,'cases':[]}
def frame(p):return p.evaluate('window.__characterRigLab.animator.frame')
def tap(p,label):p.get_by_role('button',name={'逐幀':'前進一幀','轉向':'左右轉向'}.get(label,label),exact=True).click()
def shot(p,name):p.screenshot(path=str(O/name))
def geometry(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert p.locator('.rig-lab').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 for b in p.locator('.rig-lab button').all():
  if b.is_visible():
   box=b.bounding_box();assert box['width']>=43.9 and box['height']>=43.9,(b.inner_text(),box)
   if not b.evaluate('e=>e.closest("dialog")'):assert box['y']>=0 and box['y']+box['height']<=p.viewport_size['height']+1,(b.inner_text(),box)
def picker(p,kind,value):tap(p,kind);p.get_by_role('dialog').wait_for();tap(p,value);p.wait_for_timeout(60);assert not p.locator('dialog[open]').count()
def start(browser,size,video=False,reduced=False,failure=False):
 c=browser.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce' if reduced else 'no-preference',**({'record_video_dir':str(R/'.local-online/rig-prototype/raw'),'record_video_size':{'width':390,'height':844}} if video else {}))
 c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,body='{"code":"qa_isolated"}'))
 if failure:
  for glob in ['**/ink/art/character-rig/**','**/ink/art/appearance/head-*.webp','**/ink/spar/weapon-*.webp']:c.route(glob,lambda r:r.abort())
 fixture=json.loads((R/'production/qa/evidence/redesign/character-rig-audit/qa-fixture.json').read_text());c.add_init_script('(()=>{const f='+json.dumps(fixture)+';if(!localStorage.getItem("rig-qa-guard")){localStorage.setItem("jianghu_life_v1_ls",JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem("jianghu_ancestry_v1",JSON.stringify(f.meta));localStorage.setItem("rig-qa-guard","no-game-writes");}})()')
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'?rig-lab=1');p.wait_for_function('window.__characterRigLab',timeout=60000);p.wait_for_timeout(180);return c,p,errors
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE','/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh'))
  for size in [[320,568],[390,844],[430,932]]:
   record=engine=='chromium' and size==[390,844];c,p,errors=start(b,size,record);geometry(p);assert not p.evaluate('__characterRigLab.assets.simplified'),'unexpected normal asset fallback';saved=p.evaluate('JSON.stringify(localStorage)')
   for label,wait in [('待機',400),('走路',1100),('跑步',1100),('出招',500),('受擊',300),('擊退',450),('倒地',1250),('起身',1900)]:
    tap(p,label);p.wait_for_timeout(wait);assert frame(p)['violations']==[],(label,frame(p)['violations'])
    if record:shot(p,'app-'+{'待機':'idle','走路':'walk','跑步':'run','出招':'attack','受擊':'hurt','擊退':'knockback','倒地':'down','起身':'getup'}[label]+'.png')
   tap(p,'蓄勢');before=frame(p);p.wait_for_timeout(250);assert frame(p)==before;tap(p,'逐幀');after=frame(p);assert after['step']==before['step']+1
   tap(p,'收招');assert abs(frame(p)['time']-.8)<.001;tap(p,'轉向');assert p.evaluate('__characterRigLab.config.face')==-1;tap(p,'骨架');assert p.evaluate('__characterRigLab.config.debug');geometry(p)
   if record:shot(p,'app-debug.png')
   tap(p,'骨架');tap(p,'造型');geometry(p)
   for title,value in [('頭部：束髮劍客','霜髮劍客'),('衣著：俠客勁裝','江湖長衫'),('配色：玄墨','青玉'),('兵器：徒手','槍')]:picker(p,title,value)
   assert p.evaluate('__characterRigLab.config.grip')=='two';tap(p,'動作');tap(p,'繼續');tap(p,'出招');p.wait_for_timeout(430)
   if record:shot(p,'app-two-hand.png')
   tap(p,'造型');picker(p,'持握：雙手持握','背負');assert p.evaluate('__characterRigLab.config.grip')=='back';picker(p,'兵器：槍','劍');assert p.evaluate('__characterRigLab.config.grip')=='one';tap(p,'動作');tap(p,'出招');p.wait_for_timeout(450)
   if record:shot(p,'app-sword.png')
   # 前景模擬通知：驗證我們的listener；不是iPhone系統前後台驗收。
   p.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');f=frame(p);p.wait_for_timeout(400);assert frame(p)==f;p.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');p.wait_for_timeout(40);assert frame(p)['step']-f['step']<=4
   assert p.evaluate('__characterRigLab.animator.invalidFrames')==0
   assert p.evaluate('JSON.stringify(localStorage)')==saved,'lab wrote storage'
   assert not errors,errors;report['cases'].append({'engine':engine,'viewport':size,'normalAssets':True,'allActions':True,'pauseAndOneStep':True,'turnAndDebug':True,'outfitHeadToneWeapons':True,'noStorageMutation':True,'syntheticVisibility':True,'invalidFrames':0,'pageerrors':errors});v=p.video;c.close()
   if record:v.save_as(str(O/'app-operation.webm'))
  # 減少動態可點動作及逐步；失圖沿用同件內嵌後備。
  for reduced,failure in [(True,False),(False,True)]:
   c,p,errors=start(b,[390,844],False,reduced,failure);tap(p,'倒地');p.wait_for_timeout(1200 if not reduced else 50);f=frame(p)
   if reduced:p.wait_for_timeout(200);assert frame(p)==f;tap(p,'起身');tap(p,'逐幀')
   if failure:assert p.evaluate('__characterRigLab.assets.simplified');shot(p,'fallback-'+engine+'.png')
   assert p.evaluate('__characterRigLab.animator.invalidFrames')==0,(engine,reduced,failure,frame(p));assert not errors,errors;report['cases'].append({'engine':engine,'reduced':reduced,'failure':failure,'pageerrors':errors});c.close()
  b.close()
 (O/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('CHARACTER_RIG_PASS',len(report['cases']))
