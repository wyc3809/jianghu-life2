"""二人版真雲端＋獨立手機瀏覽器；唔攔截／模擬伺服器戰果。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import os,json,subprocess,time,urllib.request
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/online-cloud';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('ONLINE_QA_BASE','http://127.0.0.1:5179/')
report={'url_kind':'live' if 'github.io' in BASE else 'local UI + live cloud backend','viewport':[390,844],'dpr':2,'cases':[]}
def shot(page,name):
 page.evaluate('document.fonts.ready');page.screenshot(path=str(OUT/name))
def skip(page):
 dialog=page.get_by_role('dialog')
 if dialog.count():dialog.get_by_role('button',name='跳過 ›',exact=True).click();dialog.wait_for(state='detached')
def snapshot(page):
 if 'github.io' in BASE:
  return page.evaluate('window.__qaSnapshot')
 return page.evaluate("async()=>{const {onlineRequest}=await import('/src/online/client.ts');return await onlineRequest('world','pair')}")
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 contexts=[];errors=[]
 for i in range(3):
  c=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,permissions=['clipboard-read','clipboard-write'],**({'record_video_dir':'/tmp/jianghu-online-cloud-video','record_video_size':{'width':390,'height':844}} if i==0 else {}))
  page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  contexts.append((c,page))
 ca,a=contexts[0];cb,b=contexts[1];cc,c=contexts[2]
 a.goto(BASE+'?online=1',wait_until='domcontentloaded');a.get_by_role('button',name='開二人試場',exact=True).wait_for();shot(a,'landing.png')
 with a.expect_response(lambda r:'functions/v1/jianghu-pair' in r.url and r.request.method=='POST' and r.request.post_data_json.get('action')=='create') as response:
  a.get_by_role('button',name='開二人試場',exact=True).click()
 created=response.value.json();assert response.value.status==200,created
 room=created['room']['id'];invite=created['room']['invite'];a.locator('[data-my-rank="100"]').wait_for();shot(a,'waiting.png')
 a.get_by_role('button',name='複製邀請連結',exact=True).click();a.get_by_text('邀請連結已複製，傳畀朋友就可以入場。',exact=True).wait_for()
 url=a.evaluate('navigator.clipboard.readText()');assert invite in url and '#invite=' in url
 b.goto(url,wait_until='domcontentloaded');shot(b,'invitation.png');b.get_by_role('button',name='接受邀請 · 入江湖',exact=True).click();b.locator('[data-my-rank="20"]').wait_for()
 a.wait_for_function("document.querySelector('[data-peer-online]')?.dataset.peerOnline==='true'",timeout=30000)
 shot(a,'two-players.png')
 c.goto(url,wait_until='domcontentloaded');c.get_by_role('button',name='接受邀請 · 入江湖',exact=True).click();c.get_by_role('alert').filter(has_text='已滿').wait_for();shot(c,'third-rejected.png');cc.close()
 a.get_by_role('button',name='配搭武學',exact=True).click();a.get_by_role('button',name='聽雨劍意',exact=True).click();a.get_by_role('button',name='保存配搭',exact=True).click();a.locator('.online-loadout').wait_for(state='detached')
 b.get_by_role('button',name='離線留場',exact=True).click();b.get_by_role('button',name='返回上次試場',exact=True).wait_for()
 a.wait_for_function("document.querySelector('[data-peer-online]')?.dataset.peerOnline==='false'",timeout=30000)
 a.locator('.online-opponents').scroll_into_view_if_needed();shot(a,'offline-opponent.png')
 lost=[False]
 def drop(route):
  d=route.request.post_data_json
  if d and d.get('action')=='challenge' and not lost[0]:
   lost[0]=True
   headers={k:v for k,v in route.request.headers.items() if k in ['authorization','apikey','origin','content-type']}
   with urllib.request.urlopen(urllib.request.Request(route.request.url,headers=headers,data=route.request.post_data.encode()),timeout=30) as remote: assert remote.status==200
   route.abort('failed')
  else:route.continue_()
 a.route('**/functions/v1/jianghu-pair',drop)
 a.get_by_role('button',name='挑戰',exact=True).click();a.get_by_role('dialog').wait_for(timeout=45000)
 a.wait_for_function("document.querySelector('.ink-unified-callout')?.textContent.includes('大河落日')",timeout=45000)
 shot(a,'volume-six.png');skip(a);a.locator('[data-my-rank="20"]').wait_for()
 a.wait_for_function("sessionStorage.getItem('jianghu-online-pending:challenge')===null",timeout=30000)
 a.locator('.online-result').scroll_into_view_if_needed();shot(a,'first-result.png')
 first=snapshot(a);assert first['me']['rank']==20 and len(first['battles'])==1 and lost[0]
 for i in range(2):a.get_by_role('button',name='重播交手',exact=True).click();a.get_by_role('dialog').wait_for();skip(a)
 assert len(snapshot(a)['battles'])==1
 b.get_by_role('button',name='返回上次試場',exact=True).click();b.locator('[data-my-rank="100"]').wait_for()
 assert snapshot(b)['battles'][0]['id']==first['battles'][0]['id']
 b.get_by_role('button',name='挑戰',exact=True).click()
 for page in [a,b]:page.get_by_role('dialog').wait_for(timeout=45000);skip(page)
 assert len(snapshot(a)['battles'])==2
 assert a.get_by_role('button',name='保護中',exact=True).is_disabled()
 a.reload(wait_until='domcontentloaded');a.locator('[data-my-rank="20"]').wait_for();assert len(snapshot(a)['battles'])==2
 a.locator('.online-result').scroll_into_view_if_needed();shot(a,'reload-same-result.png')
 for width,height in [(320,568),(390,844),(420,896)]:
  a.set_viewport_size({'width':width,'height':height});a.locator('.online-self').scroll_into_view_if_needed()
  assert not a.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert a.locator('.online-self-actions button').evaluate_all('(els)=>els.every(x=>x.getBoundingClientRect().height>=44)')
  shot(a,f'phone-{width}.png')
  report['cases'].append({'width':width,'overflow':False,'touch44':True})
 assert not errors,errors
 report.update({'copy_invite':True,'independent_users':3,'third_user_rejected':True,'offline_defence':True,'lost_response_recovered':True,'hero_volume6':True,'replay_no_mutation':True,'reload_same_room':True,'same_battle_both_players':True,'failed_challenge_ranks_unchanged':True,'ranks':[20,100],'errors':errors})
 video=a.video;ca.close();cb.close();browser.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','26','-pix_fmt','yuv420p',str(OUT/'two-phones.mp4')],check=True)
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
board=Image.new('RGB',(800,970),'#eee8dd');d=ImageDraw.Draw(board);font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
d.text((16,10),'二人江湖｜真雲端・390×844 DPR2',font=font,fill='#332e28')
for i,(name,label) in enumerate([('landing.png','開房／接受邀請'),('two-players.png','兩位獨立身份・真連線')]):
 x=5+i*400;d.text((x+8,46),label,font=font,fill='#332e28');im=Image.open(OUT/name).convert('RGB').resize((390,844));board.paste(im,(x,90));d.rectangle((x+4,90+300,x+386,90+830),outline='#b74335',width=3)
board.save(OUT/'comparison.jpg',quality=92)
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('ONLINE_CLOUD_BROWSER_PASS',flush=True)
