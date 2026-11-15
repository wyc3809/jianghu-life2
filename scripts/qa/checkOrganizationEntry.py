"""由未入幫畫面真正創會／解散／遞帖／審批／退出，唔只驗API。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkOrganizationsUI.py').read_text().split('\nwith sync_playwright() as pw:')[0],'helpers','exec'))
from urllib.request import Request,urlopen
import uuid
a=accounts[2]
with urlopen(Request('https://seuocqrmyljjzndgbynt.supabase.co/functions/v1/jianghu-world',data=json.dumps({'action':'register','clientId':str(uuid.uuid4()),'data':{'name':a['state']['character']['name']}}).encode(),headers={'apikey':key,'Authorization':'Bearer '+a['auth']['access_token'],'Content-Type':'application/json'}),timeout=30) as r:assert r.status==200
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);contexts=[];pages=[];errors=[];bad=[]
 for i in [2,0]:
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');c.add_init_script(init(i));p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append({'status':r.status,'url':r.url}) if r.status>=400 else None)
  if i==0:enter(p)
  else:
   p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(300)
   if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
   p.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click();tap(p,'江湖風雲');p.get_by_role('button',name=re.compile('^江湖幫會')).first.click();p.locator('.guild-recruit').first.wait_for(timeout=30000)
  contexts.append(c);pages.append(p)
 guest,leader=pages;guest.screenshot(path=str(OUT/'recruitment-390.jpg'),type='jpeg',quality=94);guest.get_by_text('自立幫會',exact=True).click();guest.get_by_label('幫會名',exact=True).fill('驗收白鶴會');guest.get_by_label('幫會宗旨').fill('界面驗收後解散');guest.screenshot(path=str(OUT/'create-390.jpg'),type='jpeg',quality=94);tap(guest,'創立幫會');guest.locator('.guild-tabs').wait_for(timeout=30000)
 tap(guest,'解散幫會');d=guest.get_by_role('dialog',name='確認幫會操作');d.get_by_role('button',name='再想想',exact=True).click();assert guest.locator('.guild-tabs').count();tap(guest,'解散幫會');guest.get_by_role('dialog',name='確認幫會操作').get_by_role('button',name='確認',exact=True).click();guest.locator('.guild-recruit').first.wait_for(timeout=30000)
 guest.locator('.guild-recruit').filter(has_text='驗收青竹會').get_by_role('button',name='申請加入',exact=True).click();guest.get_by_text('待回覆',exact=True).wait_for(timeout=15000)
 application=leader.get_by_label('入幫申請').locator('article').filter(has_text='組織驗收03');application.wait_for(timeout=15000);leader.screenshot(path=str(OUT/'application-390.jpg'),type='jpeg',quality=94);application.get_by_role('button',name='接納',exact=True).click();guest.locator('.guild-tabs').wait_for(timeout=15000)
 tap(guest,'退出幫會');guest.get_by_role('dialog',name='確認幫會操作').get_by_role('button',name='確認',exact=True).click();guest.locator('.guild-recruit').first.wait_for(timeout=15000)
 guest.get_by_text('自立幫會',exact=True).click();guest.set_viewport_size({'width':390,'height':500});guest.get_by_label('幫會名',exact=True).focus();guest.get_by_role('button',name='創立幫會',exact=True).scroll_into_view_if_needed();rect=guest.get_by_role('button',name='創立幫會',exact=True).bounding_box();assert rect['y']>=0 and rect['y']+rect['height']<=500;guest.screenshot(path=str(OUT/'keyboard-390.jpg'),type='jpeg',quality=94)
 assert not errors,errors;assert not bad,bad
 (OUT/'entry.json').write_text(json.dumps({'newcomerRecruitment':True,'createFormAndActualCreate':True,'disbandCancelThenConfirm':True,'actualApplicationAndLeaderRealtimeReceived':True,'acceptRealtimeJoins':True,'memberLeave':True,'shortViewportInputAndSubmitVisible':True,'pageerrors':errors,'failedResponses':bad},indent=2)+'\n')
 for c in contexts:c.close()
 b.close();print('ORGANIZATION_ENTRY_PASS',flush=True)
