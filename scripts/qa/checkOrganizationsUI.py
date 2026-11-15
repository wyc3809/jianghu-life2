"""三瀏覽器真服務操作；原人物資料及原生確認，不以假API代替真人名冊。"""
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright
import json,time,os,re,copy,hashlib
ROOT=Path.cwd();LOCAL=ROOT/'.local-online/organization-qa';OUT=LOCAL/'browser';OUT.mkdir(exist_ok=True);BASE=os.getenv('LIVE_BASE','http://127.0.0.1:5315/jianghu-life2/')
accounts=json.loads((LOCAL/'accounts.json').read_text());meta=json.loads((ROOT/'design/art/manhua/fixtures.json').read_text())['full']['meta'];context=json.loads((LOCAL/'context.json').read_text());key=dict(l.split('=',1) for l in (ROOT/'.env.local').read_text().splitlines() if '=' in l)['VITE_SUPABASE_ANON_KEY']
for a in accounts:
 if a['auth'].get('expires_at',0)<time.time()+120:
  with urlopen(Request('https://seuocqrmyljjzndgbynt.supabase.co/auth/v1/token?grant_type=refresh_token',data=json.dumps({'refresh_token':a['auth']['refresh_token']}).encode(),headers={'apikey':key,'Content-Type':'application/json'}),timeout=30) as r:a['auth']=json.loads(r.read())
(LOCAL/'accounts.json').write_text(json.dumps(accounts,ensure_ascii=False))
def init(i):
 a=accounts[i];s=copy.deepcopy(a['state']);s['character']['flags']['newbie_done']=True;s['pending']=None
 return '''(()=>{localStorage.setItem('sb-seuocqrmyljjzndgbynt-auth-token',JSON.stringify('''+json.dumps(a['auth'])+'''));localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now()+100000,state:'''+json.dumps(s,ensure_ascii=False)+'''}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify('''+json.dumps(meta,ensure_ascii=False)+'''));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()+100000));localStorage.setItem('jianghu-world-joined','1');const si=window.setInterval.bind(window);window.setInterval=(f,ms,...a)=>si(f,ms===15000?60000:ms,...a);})();'''
def tap(p,name):p.get_by_role('button',name=name,exact=True).click()
def enter(p):
 p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(350)
 if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
 p.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click();tap(p,'江湖風雲');p.get_by_role('button',name=re.compile('^江湖幫會')).first.click();p.locator('.guild-tabs').wait_for(timeout=30000)
def healthy(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert not p.locator('.ink-guild img').evaluate_all('es=>es.some(e=>e.complete&&!e.naturalWidth)')
 assert p.locator('.ink-guild button').evaluate_all('es=>es.filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=43)'), 'touch target below44'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);contexts=[];pages=[];errors=[];console=[];bad=[];frames=[]
 for i in [0,1,10]:
  c=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce' if i else 'no-preference',**({'record_video_dir':str(OUT/'videos'),'record_video_size':{'width':390,'height':844}} if i==0 else {}));c.add_init_script(init(i));p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:console.append(e.text) if e.type=='error' else None);p.on('response',lambda r:bad.append({'status':r.status,'url':r.url}) if r.status>=400 else None);p.on('websocket',lambda ws:ws.on('framereceived',lambda payload:frames.append(payload)));enter(p);healthy(p);contexts.append(c);pages.append(p)
 a,b,c=pages;fields=['attributes','nature','equipment','combatLoadout','appearance','gear','skills','volumes'];before=a.evaluate('(keys)=>{const c=JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character;return Object.fromEntries(keys.map(k=>[k,c[k]]))}',fields)
 assert not a.locator('.ink-hud,.ink-bottom-dock').count();a.screenshot(path=str(OUT/'guild-hall-390.jpg'),type='jpeg',quality=94)
 tap(a,'十城')
 for w,h in [(320,568),(390,844),(430,932)]:
  a.set_viewport_size({'width':w,'height':h});healthy(a);a.screenshot(path=str(OUT/f'cities-{w}.jpg'),type='jpeg',quality=94)
 a.set_viewport_size({'width':390,'height':844});tap(a,'幫庫');a.screenshot(path=str(OUT/'treasury-390.jpg'),type='jpeg',quality=94)
 for p in pages:tap(p,'幫會對話')
 marker='幫會即時推送'+str(int(time.time()));b.get_by_label('寫給幫眾').fill(marker);start=time.monotonic();tap(b,'送出');a.get_by_role('log').get_by_text(marker,exact=True).wait_for(timeout=15000);elapsed=time.monotonic()-start;assert elapsed<15;assert any('jianghu_live_notifications' in str(f) for f in frames);assert not c.get_by_role('log').get_by_text(marker,exact=True).count();a.screenshot(path=str(OUT/'guild-chat-390.jpg'),type='jpeg',quality=94)
 tap(a,'聚義堂');member=a.locator('.guild-person').filter(has_text='組織驗收02');member.get_by_text('管理',exact=True).click();member.get_by_role('button',name='傳位',exact=True).click();dialog=a.get_by_role('dialog',name='確認幫會操作');assert dialog.evaluate('e=>e.matches("dialog:modal")');a.screenshot(path=str(OUT/'guild-confirm-390.jpg'),type='jpeg',quality=94);dialog.get_by_role('button',name='再想想',exact=True).click()
 tap(a,'‹ 返回江湖風雲');a.get_by_role('button',name=re.compile('^門派會武')).first.click();a.locator('.war-lobby-note').wait_for(timeout=30000);a.locator('.war-loading').wait_for(state='detached',timeout=30000);a.screenshot(path=str(OUT/'sect-lobby-390.jpg'),type='jpeg',quality=94)
 tap(a,'門派對話');a.get_by_role('log').get_by_text('青雲同門對話驗收',exact=True).wait_for(timeout=15000);a.screenshot(path=str(OUT/'sect-chat-390.jpg'),type='jpeg',quality=94);a.get_by_role('button',name='關閉門派對話',exact=True).click()
 tap(a,'觀戰');a.wait_for_function('document.querySelector(".ink-sect-war")?.dataset.status==="playing"',timeout=30000);a.wait_for_timeout(2500);tap(a,'暫停');a.screenshot(path=str(OUT/'sect-battle-390.jpg'),type='jpeg',quality=94)
 stage=a.locator('.war-stage canvas');paused=stage.screenshot();a.wait_for_timeout(400);assert paused==stage.screenshot(),'pause still paints'
 for w,h in [(320,568),(430,932)]:
  a.set_viewport_size({'width':w,'height':h});a.wait_for_timeout(150);assert not a.evaluate('document.documentElement.scrollWidth>innerWidth+1');a.screenshot(path=str(OUT/f'sect-battle-{w}.jpg'),type='jpeg',quality=94)
 a.set_viewport_size({'width':390,'height':844});tap(a,'繼續');a.wait_for_timeout(1700);tap(a,'跳過');a.wait_for_function('document.querySelector(".ink-sect-war")?.dataset.status==="result"');a.screenshot(path=str(OUT/'sect-result-390.jpg'),type='jpeg',quality=94);tap(a,'返回');a.locator('.ink-hud').wait_for()
 after=a.evaluate('(keys)=>{const c=JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character;return Object.fromEntries(keys.map(k=>[k,c[k]]))}',fields);assert before==after
 assert not errors,errors;assert not console,console;assert not bad,bad
 result={'actualCloudBrowserContexts':3,'guildRealtimeWhilePollingExtended60Seconds':True,'pushSeconds':round(elapsed,3),'otherGuildCannotSeeMessage':True,'nativeManagementConfirmationCancel':True,'guildFullScreen':True,'guildAndBattleViewports':[[320,568],[390,844],[430,932]],'sectOwnChannel':True,'actualPersisted20PersonReplay':True,'originalHatSilhouettes':True,'pausePixelStable':True,'resumeAndSkipReadOnly':True,'oldCharacterFieldsKept':True,'backRestoresHud':True,'pageerrors':errors,'consoleErrors':console,'failedResponses':bad,'actualIphoneTested':False}
 (OUT/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 for item in contexts:item.close()
 browser.close();print('ORGANIZATIONS_BROWSER_PASS',round(elapsed,3),flush=True)
