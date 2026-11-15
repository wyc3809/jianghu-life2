from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,re,copy
ROOT=Path.cwd();OUT=ROOT/'.local-online/live-qa/browser';OUT.mkdir(exist_ok=True);BASE=__import__('os').getenv('LIVE_BASE','http://127.0.0.1:5315/jianghu-life2/')
accounts=json.loads((ROOT/'.local-online/live-qa/accounts.json').read_text());meta=json.loads((ROOT/'design/art/manhua/fixtures.json').read_text())['full']['meta'];results=[]

# 驗收身份可能跨回合過期；用原refresh_token續期，不偽造expires_at。
from urllib.request import Request,urlopen
key=dict(line.split('=',1) for line in (ROOT/'.env.local').read_text().splitlines() if '=' in line)['VITE_SUPABASE_ANON_KEY']
for account in accounts:
 req=Request('https://seuocqrmyljjzndgbynt.supabase.co/auth/v1/token?grant_type=refresh_token',data=json.dumps({'refresh_token':account['auth']['refresh_token']}).encode(),headers={'apikey':key,'Content-Type':'application/json'},method='POST')
 with urlopen(req,timeout=30) as response:account['auth']=json.loads(response.read())
(ROOT/'.local-online/live-qa/accounts.json').write_text(json.dumps(accounts,ensure_ascii=False))

def init(i):
 a=accounts[i];state=copy.deepcopy(a['state']);state['character']['flags']['newbie_done']=True;state['pending']=None
 auth=a['auth']
 return '''(()=>{localStorage.setItem('sb-seuocqrmyljjzndgbynt-auth-token',JSON.stringify('''+json.dumps(auth)+'''));localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now()+100000,state:'''+json.dumps(state,ensure_ascii=False)+'''}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify('''+json.dumps(meta,ensure_ascii=False)+'''));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()+100000));const si=window.setInterval.bind(window);window.setInterval=(f,ms,...a)=>si(f,ms===5000?60000:ms,...a);})();'''
def tap(p,label):p.get_by_role('button',name=label,exact=True).click()
def enter(p):
 p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(400)
 if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
 p.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click();p.get_by_role('button',name='江湖風雲',exact=True).click();p.get_by_role('button',name=re.compile('^同遊江湖')).first.click();p.wait_for_function('Boolean(document.querySelector(".live-compose"))||Boolean(document.querySelector(".live-intro button:not(:disabled)"))');
 if not p.locator('.live-compose').count():tap(p,'加入同遊')
 p.locator('.live-compose').wait_for(timeout=30000)
def healthy(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert not p.locator('.ink-live img').evaluate_all('es=>es.some(e=>e.complete&&!e.naturalWidth)')
 assert p.locator('.ink-live button').evaluate_all('es=>es.filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=43)'), 'touch target below44px'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 contexts=[];pages=[];errs=[];frames=[]
 for i in range(3):
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce',**({'record_video_dir':str(OUT/'videos'),'record_video_size':{'width':390,'height':844}} if i==0 else {}));c.add_init_script(init(i));p=c.new_page();error=[];p.on('pageerror',lambda e,l=error:l.append(str(e)));p.on('websocket',lambda ws:ws.on('framereceived',lambda payload:frames.append(payload)));enter(p);healthy(p);contexts.append(c);pages.append(p);errs.append(error)
 a,bp,cp=pages
 assert not a.locator('.ink-hud,.ink-bottom-dock').count();
 a.screenshot(path=str(OUT/'lobby-390.jpg'),type='jpeg',quality=94);a.locator('.live-peers summary').click();a.screenshot(path=str(OUT/'players-390.jpg'),type='jpeg',quality=93)
 a.get_by_label('發言',exact=False) if False else None
 token='即時推送驗收'+str(int(time.time()));bp.locator('#live-message').fill(token);t=time.monotonic();tap(bp,'送出');a.get_by_role('log').get_by_text(token,exact=True).wait_for(timeout=15000);elapsed=time.monotonic()-t;assert elapsed<15,elapsed
 assert any('jianghu_live_notifications' in str(f) for f in frames),'no actual Realtime delivery'
 a.screenshot(path=str(OUT/'chat-390.jpg'),type='jpeg',quality=94)
 privateToken='私訊瀏覽器驗收'+str(int(time.time()));a.get_by_label('對話頻道').select_option(accounts[1]['id']);a.locator('#live-message').fill(privateToken);tap(a,'送出');bp.get_by_label('對話頻道').select_option(accounts[0]['id']);bp.get_by_role('log').get_by_text(privateToken,exact=True).wait_for(timeout=15000);assert not cp.get_by_role('log').get_by_text(privateToken,exact=True).count();bp.screenshot(path=str(OUT/'private-390.jpg'),type='jpeg',quality=93)
 a.get_by_label('對話頻道').select_option('');a.get_by_role('button',name='開紅',exact=True).click() if a.get_by_role('button',name='開紅',exact=True).count() else None
 peer=a.locator('.live-peer').filter(has_text='測試青乙');peer.get_by_role('button',name='交手',exact=True).click();d=a.get_by_role('dialog',name='確認同遊交手');d.wait_for();assert d.evaluate('e=>e.matches("dialog:modal")');a.screenshot(path=str(OUT/'confirm-390.jpg'),type='jpeg',quality=93);d.get_by_role('button',name='確認交手',exact=True).click()
 a.get_by_role('dialog',name='自動交手：同遊交鋒').wait_for(timeout=30000);bp.get_by_role('dialog',name='自動交手：同遊交鋒').wait_for(timeout=30000);a.wait_for_timeout(2500);a.screenshot(path=str(OUT/'battle-390.jpg'),type='jpeg',quality=94);bp.screenshot(path=str(OUT/'battle-peer-390.jpg'),type='jpeg',quality=94)
 assert not a.get_by_role('button',name='加速 ×2',exact=True).count()
 a.get_by_role('dialog',name='自動交手：同遊交鋒').wait_for(state='detached',timeout=60000);bp.get_by_role('dialog',name='自動交手：同遊交鋒').wait_for(state='detached',timeout=60000);bp.get_by_text(re.compile('戰敗保護 [0-9]+秒')).wait_for(timeout=15000);bp.screenshot(path=str(OUT/'protected-390.jpg'),type='jpeg',quality=93)
 for w,h in [(320,568),(430,932)]:
  a.set_viewport_size({'width':w,'height':h});healthy(a);a.screenshot(path=str(OUT/f'lobby-{w}.jpg'),type='jpeg',quality=93)
 results.append({'actualCloudAccounts':3,'actualRealtimeFrames':True,'heartbeatExtendedTo60Seconds':True,'messagePushSeconds':round(elapsed,3),'privateNoThirdPartyUILeak':True,'nativeConfirmation':True,'bothAutoOpenSameBattle':True,'serverClockNoLocalSpeed':True,'defeatProtectionVisible':True,'viewports':[[320,568],[390,844],[430,932]],'pageerrors':errs,'actualIphoneTested':False})
 for p in pages:
  p.get_by_role('button',name='退出同遊',exact=True).click();p.get_by_role('button',name='加入同遊',exact=True).wait_for(timeout=15000)
 for c in contexts:c.close()
 b.close()
 assert not any(errs),errs
(OUT/'browser.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print('LIVE_BROWSER_PASS',round(elapsed,3),flush=True)
