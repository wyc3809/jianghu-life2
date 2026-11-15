"""正式構建驗斷線補讀、原草稿及單一view請求；可用舊正式站擷取對照。"""
from pathlib import Path
import os
exec(compile(Path('scripts/qa/checkLiveWorld.py').read_text().split('\nwith sync_playwright() as pw:')[0],'helpers','exec'))
legacy=os.getenv('LIVE_EXPECT_LEGACY')=='1'
OUT=ROOT/'.local-online/live-qa'/('reconnect-before' if legacy else 'reconnect-after');OUT.mkdir(exist_ok=True)
def post(i,action,data=None):
 req=Request('https://seuocqrmyljjzndgbynt.supabase.co/functions/v1/jianghu-live',data=json.dumps({'action':action,'clientId':accounts[i]['clientId'],'data':data or {}}).encode(),headers={'apikey':key,'Content-Type':'application/json','Authorization':'Bearer '+accounts[i]['auth']['access_token']},method='POST')
 with urlopen(req,timeout=30) as r:return json.loads(r.read())
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');context.add_init_script(init(0));p=context.new_page();calls=[];errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('request',lambda r:calls.append(r.post_data_json) if '/functions/v1/jianghu-live' in r.url and r.method=='POST' else None)
 enter(p);post(1,'liveEnter',{'name':accounts[1]['state']['character']['name']});p.wait_for_timeout(1500)
 p.locator('#live-message').fill('斷線仍然保留嘅草稿')
 p.screenshot(path=str(OUT/'connected-390.jpg'),type='jpeg',quality=92)
 context.set_offline(True)
 if legacy:p.evaluate('document.dispatchEvent(new Event("visibilitychange"))')
 else:tap(p,'送出')
 p.get_by_role('alert').wait_for(timeout=20000)
 p.screenshot(path=str(OUT/'offline-390.jpg'),type='jpeg',quality=92)
 marker='斷線期間補讀驗收'+str(int(time.time()));post(1,'send',{'requestId':str(__import__('uuid').uuid4()),'body':marker})
 before=len(calls);context.set_offline(False)
 if legacy:p.get_by_role('button',name='重新連線',exact=True).click()
 else:p.evaluate('window.dispatchEvent(new Event("online"))')
 p.get_by_role('log').get_by_text(marker,exact=True).wait_for(timeout=20000)
 assert p.locator('#live-message').input_value()=='斷線仍然保留嘅草稿'
 assert p.get_by_role('alert').count()==(1 if legacy else 0)
 p.locator('.ink-jianghu-back').scroll_into_view_if_needed()
 p.screenshot(path=str(OUT/'recovered-390.jpg'),type='jpeg',quality=92)
 recovered=calls[before:];assert recovered
 if not legacy:
  assert all(x['action']=='view' for x in recovered),recovered
  assert any(x['data'].get('renew') for x in recovered)
  for w,h in [(320,568),(430,932)]:
   p.set_viewport_size({'width':w,'height':h});healthy(p);p.screenshot(path=str(OUT/f'recovered-{w}.jpg'),type='jpeg',quality=92)
  p.set_viewport_size({'width':390,'height':844});p.get_by_label('對話頻道').select_option(accounts[1]['id']);p.get_by_label('對話頻道').select_option('');p.get_by_role('log').get_by_text(marker,exact=True).wait_for(timeout=15000)
  assert not p.get_by_role('log').get_by_text('合併補讀私訊驗收',exact=True).count()
  post(0,'liveLeave');p.evaluate('window.dispatchEvent(new Event("online"))');p.get_by_role('button',name='加入同遊',exact=True).wait_for(timeout=20000)
  assert not p.get_by_role('alert').count()
 else:tap(p,'退出同遊');p.get_by_role('button',name='加入同遊',exact=True).wait_for(timeout=20000)
 post(1,'liveLeave');assert not errors,errors
 (OUT/'reconnect.json').write_text(json.dumps({'legacy':legacy,'offlineDraftKept':True,'missedMessageBackfilled':True,'staleNetworkErrorCleared':not legacy,'recoveryActions':[x['action'] for x in recovered],'otherTabExitRecovered':not legacy,'pageerrors':errors,'actualIphoneTested':False},ensure_ascii=False,indent=2)+'\n')
 context.close();browser.close();print('LIVE_RECONNECT_PASS','before' if legacy else 'after',flush=True)
