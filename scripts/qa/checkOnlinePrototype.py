"""第32項：兩個真瀏覽器＋HTTP服務，驗收本機角色；使用全新獨立QA資料庫。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json,time,subprocess,os
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/online-prototype';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('ONLINE_QA_BASE','http://127.0.0.1:5178/')
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text().replace("await import('/src/store/ancestryStore.ts')", "await import((await(await fetch('/src/components/ink/InkGachaPanel.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
report={'seed':42,'viewport':[390,844],'dpr':2,'life_jade':{'free':600,'paidTest':0},'baseline':'0af2826','cases':[]}

def state(page):
 return page.evaluate("async()=>await(await fetch('/api/jianghu/world',{headers:{Authorization:'Bearer '+sessionStorage.getItem('jianghu-online-session')}})).json()")
def screen(page,name):
 page.evaluate('document.fonts.ready');page.screenshot(path=str(OUT/name))
def skip(page):
 dialog=page.get_by_role('dialog')
 if dialog.count():
  dialog.get_by_role('button',name='跳過 ›',exact=True).click();dialog.wait_for(state='detached')
def login(page,name):
 page.get_by_role('button',name=name).click();page.locator('[data-my-rank]').wait_for()

def ctxpage(browser,record=False,width=390,height=844):
 ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,**({'record_video_dir':'/tmp/jianghu-online-video','record_video_size':{'width':width,'height':height}} if record else {}))
 page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.route('https://**',lambda r:r.abort())
 return ctx,page,errs

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for label,base in [('before','http://127.0.0.1:5177/'),('after',BASE)]:
  ctx,page,errs=ctxpage(browser);page.goto(base,wait_until='networkidle');page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}})
  page.locator('#ink-gacha').wait_for()
  if label=='after':page.locator('#ink-online').wait_for()
  page.wait_for_timeout(700);screen(page,label+'-jianghu.png');assert not errs,errs;ctx.close()
 ca,a,ea=ctxpage(browser,True);cb,b,eb=ctxpage(browser)
 for page in [a,b]:page.goto(BASE+'?online=1',wait_until='networkidle')
 screen(a,'login.png');login(a,'沈雲舟');login(b,'謝清霜')
 a.wait_for_function("document.querySelector('[data-peer-online]')?.dataset.peerOnline==='true'")
 initialA=state(a);initialB=state(b)
 assert [initialA['me']['rank'],initialB['me']['rank']]==[100,20], 'QA需使用全新資料庫'
 a.get_by_role('button',name='配搭武學').click();a.get_by_role('button',name='聽雨劍意',exact=True).click()
 screen(a,'loadout.png');a.get_by_role('button',name='保存配搭').click()
 a.wait_for_function("!document.querySelector('.online-loadout')")
 expectedA=state(a)['me']['character']
 assert expectedA['equippedArts'].count('art_river_fist')==1
 b.get_by_role('button',name='離線留場').click();offline_at=time.monotonic()
 a.wait_for_function("document.querySelector('[data-peer-online]')?.dataset.peerOnline==='false'")
 screen(a,'opponent-offline.png')
 # 回覆遺失：請求已到真正服務，瀏覽器只失去回應；後續輪詢應恢復收據。
 dropped=[False]
 def lose_response(route):
  response=route.fetch();dropped[0]=True;route.abort('failed')
 a.route('**/api/jianghu/challenge',lose_response,times=1)
 a.get_by_role('button',name='挑戰',exact=True).click()
 a.get_by_role('dialog').wait_for(timeout=30000)
 a.get_by_role('button',name='加速 ×2',exact=True).click()
 a.wait_for_function("document.querySelector('.ink-unified-callout')?.textContent.includes('大河落日')",timeout=30000)
 screen(a,'battle-volume-six.png');skip(a)
 a.wait_for_function("document.querySelector('[data-my-rank]')?.dataset.myRank==='20'")
 first=state(a);battle=first['battles'][0]
 assert dropped[0] and len(first['battles'])==1 and battle['winner']=='river'
 assert first['me']['character']==expectedA
 assert first['peers'][1]['protectedUntil']>first['serverNow']
 a.wait_for_function("sessionStorage.getItem('jianghu-online-pending:challenge')===null")
 a.locator('.online-self').scroll_into_view_if_needed();screen(a,'victory-offline-defender.png')
 for _ in range(2):a.get_by_role('button',name='重播交手').click();a.get_by_role('dialog').wait_for();skip(a)
 assert len(state(a)['battles'])==1 and state(a)['me']['rank']==20
 report['cases'].append({'name':'offline_defender_lost_response_replay','battleId':battle['id'],'ranks':battle['after'],'requestRecovered':True,'replaysNoMutation':True})
 print('OFFLINE_BATTLE_AND_RECOVERY_PASS',flush=True)
 # 保留真實時鐘：A在線、B關閉遊戲超過一分鐘，唔用瀏覽器時鐘假造收益。
 remaining=max(0,63-(time.monotonic()-offline_at))
 while remaining>0:
  chunk=min(20,remaining);a.wait_for_timeout(chunk*1000);remaining-=chunk
 login(b,'謝清霜');afterOffline=state(b)
 assert afterOffline['me']['pendingOffline']>=initialB['me']['pendingOffline']+1
 assert afterOffline['battles'][0]['id']==battle['id']
 assert afterOffline['me']['character']==initialB['me']['character']
 assert afterOffline['me']['rank']==100
 b.locator('.online-income').scroll_into_view_if_needed();screen(b,'offline-income.png')
 wallet=afterOffline['me']['silver']
 with b.expect_response(lambda r:r.url.endswith('/api/jianghu/claim')) as response:
  b.get_by_role('button',name='收取收益').evaluate('(el)=>{el.click();el.click()}')
 claimed=response.value.json()
 b.wait_for_function('(silver)=>Number(document.querySelector("[data-silver]")?.textContent)===silver',arg=wallet+claimed['total'])
 assert state(b)['me']['silver']==wallet+claimed['total']
 report['cases'].append({'name':'real_offline_income_claim','offlineDelta':afterOffline['me']['pendingOffline']-initialB['me']['pendingOffline'],'claimed':claimed,'doubleClickOnce':True})
 print('REAL_OFFLINE_INCOME_PASS',flush=True)
 # 較低排名挑戰失敗：雙方順位不變；敗方重開保護。
 b.get_by_role('button',name='挑戰',exact=True).click()
 for page in [a,b]:page.get_by_role('dialog').wait_for(timeout=30000);skip(page)
 finalA=state(a);finalB=state(b)
 assert [finalA['me']['rank'],finalB['me']['rank']]==[20,100]
 assert finalA['battles'][0]['id']==finalB['battles'][0]['id'] and len(finalA['battles'])==2
 assert finalB['me']['protectedUntil']>finalB['serverNow']
 assert finalB['me']['character']==initialB['me']['character']
 assert a.get_by_role('button',name='保護中',exact=True).is_disabled()
 a.reload(wait_until='networkidle');a.locator('[data-my-rank="20"]').wait_for()
 assert len(state(a)['battles'])==2
 a.locator('.online-self').scroll_into_view_if_needed();screen(a,'final-ranks.png')
 b.locator('.online-result').scroll_into_view_if_needed();screen(b,'defeat-protection.png')
 report['cases'].append({'name':'failed_challenge_protection_reload','ranks':[20,100],'sameBattle':True,'reloadNoMutation':True,'injuryDeathUnchanged':True})
 assert not ea and not eb,(ea,eb)
 video=a.video;ca.close();cb.close()
 if video:
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','26','-pix_fmt','yuv420p',str(OUT/'two-accounts.mp4')],check=True)
 for width,height in [(320,568),(420,896)]:
  ctx,page,errs=ctxpage(browser,width=width,height=height);page.goto(BASE+'?online=1',wait_until='networkidle');login(page,'謝清霜')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert page.locator('.online-self-actions button').evaluate_all('(els)=>els.every(x=>x.getBoundingClientRect().height>=44)')
  screen(page,f'phone-{width}.png');assert not errs,errs;ctx.close()
  report['cases'].append({'name':'phone','width':width,'overflow':False,'touch44':True,'errors':errs})
 browser.close()
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
board=Image.new('RGB',(800,955),'#eee8dd');d=ImageDraw.Draw(board);d.text((15,9),'多人江湖本機原型｜真入口前後對照',font=font,fill='#332e28')
for i,label in enumerate(['before','after']):
 x=5+i*400;d.text((x+10,43),'改前 EA0.80.0' if label=='before' else '改後 · 江湖頁加入多人試場',font=font,fill='#332e28')
 im=Image.open(OUT/f'{label}-jianghu.png').convert('RGB').resize((390,844));board.paste(im,(x,90))
 if label=='after':d.rectangle((x+5,90+160,x+385,90+835),outline='#b74335',width=3)
board.save(OUT/'comparison.jpg',quality=92)
report['errors']=[];(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('ONLINE_PROTOTYPE_BROWSER_PASS',flush=True)
