"""Real UI with mocked live transport; never creates Auth accounts or writes cloud data."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy,json,re,os,subprocess
R=Path.cwd();O=R/'.local-online/live-direct-entry';O.mkdir(exist_ok=True);fixture=json.loads((R/'design/art/manhua/fixtures.json').read_text())['full'];s=copy.deepcopy(fixture['state']);s['tab']='home';s['pending']=None;s['character']['flags']['newbie_done']=True
before=os.getenv('LIVE_ENTRY_BEFORE')=='1';base='http://127.0.0.1:5316/'
before_file=R/'src/components/ink/InkLiveWorld.before.tsx'
if before:before_file.write_bytes(subprocess.check_output(['git','show','6204c7f8:src/components/ink/InkLiveWorld.tsx']))
init="localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now()+100000,state:"+json.dumps(s,ensure_ascii=False)+"}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify("+json.dumps(fixture['meta'],ensure_ascii=False)+"));"
player={'id':'mock-me','character':s['character'],'rank':7,'protectedUntil':0,'busy':None,'live':{'joined':False,'red':False}};snapshot={'serverNow':0,'revision':1,'me':player,'peers':[],'battles':[],'liveBattles':[],'confirmedRequests':[],'params':{'protectionMs':30000}}
mock='''const state=window.__liveMock={entries:0,exits:0,fail:false,calls:[],snapshot:SNAP};
state.snapshot.me.protectedUntil=Date.now()+30000;
function snap(){state.snapshot.serverNow=Date.now();state.snapshot.peers=[{id:'mock-me',name:state.snapshot.me.character.name,rank:7,online:true,live:state.snapshot.me.live}];return structuredClone(state.snapshot);}
export async function liveRequest(action,data={}){state.calls.push(action);if(action==='liveEnter'){state.entries++;await new Promise(r=>setTimeout(r,120));if(state.fail)throw new Error('同遊暫時未能連線。');state.snapshot.me.live.joined=true;return snap();}if(action==='liveLeave'){state.exits++;state.snapshot.me.live.joined=false;return {};}if(action==='world')return snap();if(action==='view')return {snapshot:snap(),chat:{messages:[],blocked:[]}};if(action==='messages')return {messages:[],blocked:[]};return {};}
export const liveCommand=liveRequest;
export async function watchLiveUpdates(fn){state.notify=fn;fn();return()=>{state.notify=null;};}
'''.replace('SNAP',json.dumps(snapshot,ensure_ascii=False))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,record_video_dir=str(O/'videos'));c.add_init_script(init);c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{}'))
 c.route('**/src/cloud/live.ts',lambda r:r.fulfill(content_type='text/javascript',body=mock))
 if before:c.route(re.compile(r'.*/src/components/ink/InkLiveWorld\.tsx(?:\?.*)?$'),lambda r:r.fulfill(response=c.request.get(base+'src/components/ink/InkLiveWorld.before.tsx')))
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(300)
 if p.get_by_role('button',name='領受',exact=True).count():p.get_by_role('button',name='領受',exact=True).click()
 def enter():p.get_by_role('navigation',name='功能入口').get_by_role('button',name='同遊江湖',exact=True).click();p.locator('.ink-live').wait_for()
 enter()
 if before:p.get_by_role('button',name='加入同遊',exact=True).wait_for();p.screenshot(path=str(O/'before.jpg'),type='jpeg',quality=94)
 else:
  p.get_by_role('button',name='退出同遊',exact=True).wait_for();p.wait_for_timeout(300)
  assert p.evaluate('window.__liveMock.entries')==1
  assert not p.get_by_role('button',name='加入同遊',exact=True).count();assert not p.get_by_role('button',name='開紅',exact=True).get_attribute('aria-pressed')=='true'
  for w,h in [(390,844),(320,568),(430,932)]:
   p.set_viewport_size({'width':w,'height':h});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');p.screenshot(path=str(O/f'after-{w}.jpg'),type='jpeg',quality=94)
  p.set_viewport_size({'width':390,'height':844});p.evaluate('()=>{for(let i=0;i<5;i++)window.__liveMock.notify?.();window.dispatchEvent(new Event("online"));}');p.wait_for_timeout(250);assert p.evaluate('window.__liveMock.entries')==1
  p.get_by_role('button',name='退出同遊',exact=True).click();p.get_by_role('navigation',name='功能入口').wait_for();p.wait_for_timeout(250);assert p.evaluate('window.__liveMock.exits')==1;assert p.evaluate('window.__liveMock.entries')==1
  enter();p.get_by_role('button',name='退出同遊',exact=True).wait_for();assert p.evaluate('window.__liveMock.entries')==2
  # Go back without withdrawing, then re-enter: participation/protection remains intact.
  protection=p.evaluate('window.__liveMock.snapshot.me.protectedUntil');p.get_by_role('button',name='‹ 返回鎮居',exact=True).click();enter();p.get_by_role('button',name='退出同遊',exact=True).wait_for();assert p.evaluate('window.__liveMock.entries')==3;assert p.evaluate('window.__liveMock.snapshot.me.protectedUntil')==protection
  p.get_by_role('button',name='退出同遊',exact=True).click();p.get_by_role('navigation',name='功能入口').wait_for();p.evaluate('window.__liveMock.fail=true');enter();p.get_by_role('button',name='重新連線',exact=True).wait_for();assert p.evaluate('window.__liveMock.entries')==4
  p.evaluate('window.__liveMock.fail=false;window.dispatchEvent(new Event("online"))');p.get_by_role('button',name='退出同遊',exact=True).wait_for();assert p.evaluate('window.__liveMock.entries')==5
  p.evaluate('window.__liveMock.snapshot.me.live.joined=false;window.__liveMock.notify?.()');p.get_by_role('navigation',name='功能入口').wait_for();assert p.evaluate('window.__liveMock.entries')==5;assert not errors,errors
  (O/'result.json').write_text(json.dumps({'transport':'mocked live module; no Auth or cloud writes','strictModeSingleEntry':True,'entryAndRetry':True,'exitDoesNotRejoin':True,'reentryKeepsProtection':True,'noAutoRed':True,'otherTabExitReturnsHome':True,'viewports':[[320,568],[390,844],[430,932]],'pageerrors':errors},indent=2)+'\n')
 c.close();b.close();
 if before:before_file.unlink()
 print('LIVE_DIRECT_UI_PASS','before' if before else 'after')
