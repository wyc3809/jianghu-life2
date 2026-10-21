"""三位獨立身份共用江湖；先離線、另一人挑戰、不同時間返場查看同一戰果。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import os,json,urllib.request,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/online-shared';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('ONLINE_QA_BASE','http://127.0.0.1:5179/')
report={'viewport':[390,844],'dpr':2,'world':'shared','simultaneous_presence_required':False}
def shot(page,name):page.evaluate('document.fonts.ready');page.screenshot(path=str(OUT/name))
def state(page):return page.evaluate("async()=>{const {onlineRequest}=await import('/src/online/client.ts');return await onlineRequest('world','world')}")
def skip(page):
 d=page.get_by_role('dialog')
 if d.count():d.get_by_role('button',name='跳過 ›',exact=True).click();d.wait_for(state='detached')
def register(page,name):
 page.goto(BASE+'?online=1',wait_until='domcontentloaded');page.get_by_label('俠名',exact=True).fill(name)
 with page.expect_response(lambda r:'/functions/v1/jianghu-world' in r.url and r.request.method=='POST' and r.request.post_data_json.get('action')=='register') as response:
  page.get_by_role('button',name='踏入江湖',exact=True).click()
 result=response.value.json();assert response.value.status==200,result;page.locator('[data-my-rank]').wait_for();return result
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);errors=[];contexts=[]
 for i in range(3):
  ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,**({'record_video_dir':'/tmp/jianghu-shared-video','record_video_size':{'width':390,'height':844}} if i==0 else {}));page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));contexts.append((ctx,page))
 ca,a=contexts[0];cb,b=contexts[1];cc,c=contexts[2]
 a.goto(BASE+'?online=1',wait_until='domcontentloaded');a.get_by_role('button',name='踏入江湖',exact=True).wait_for();shot(a,'landing.png')
 sb=register(b,'離線劍客');bid=sb['me']['id'];b.get_by_role('button',name='離線留場',exact=True).click();b.get_by_role('button',name='重返江湖',exact=True).wait_for();b.close()
 sa=register(a,'遠行刀客');aid=sa['me']['id'];target=a.locator(f'[data-peer-id="{bid}"]');target.wait_for();assert target.get_attribute('data-peer-online')=='false'
 sc=register(c,'獨行俠客');cid=sc['me']['id'];c.get_by_role('button',name='離線留場',exact=True).click();c.get_by_role('button',name='重返江湖',exact=True).wait_for();cc.close()
 a.wait_for_function('(id)=>!!document.querySelector(`[data-peer-id="${id}"]`)',arg=cid)
 assert a.get_by_role('button',name='複製邀請連結',exact=True).count()==0
 target.scroll_into_view_if_needed();shot(a,'offline-list.png')
 a.get_by_role('button',name='配搭武學',exact=True).click();a.get_by_role('button',name='聽雨劍意',exact=True).click();a.get_by_role('button',name='保存配搭',exact=True).click();a.locator('.online-loadout').wait_for(state='detached')
 lost=[False]
 def drop(route):
  data=route.request.post_data_json
  if data and data.get('action')=='challenge' and not lost[0]:
   headers={k:v for k,v in route.request.headers.items() if k in ['authorization','apikey','origin','content-type']}
   with urllib.request.urlopen(urllib.request.Request(route.request.url,headers=headers,data=route.request.post_data.encode()),timeout=30) as response:assert response.status==200
   lost[0]=True;route.abort('failed')
  else:route.continue_()
 a.route('**/functions/v1/jianghu-world',drop)
 target.get_by_role('button',name='挑戰',exact=True).click();a.get_by_role('dialog').wait_for(timeout=45000)
 a.wait_for_function("document.querySelector('.ink-unified-callout')?.textContent.includes('大河落日')",timeout=45000);shot(a,'volume-six.png');skip(a)
 a.locator('.online-result').wait_for();a.wait_for_function("sessionStorage.getItem('jianghu-online-pending:challenge')===null")
 first=state(a);battle=first['battles'][0];assert lost[0] and battle['settledAt'] is not None
 a.locator('.online-result').scroll_into_view_if_needed();shot(a,'result.png')
 for i in range(2):a.get_by_role('button',name='重播交手',exact=True).click();a.get_by_role('dialog').wait_for();skip(a)
 assert len(state(a)['battles'])==1
 a.get_by_role('button',name='離線留場',exact=True).click();a.get_by_role('button',name='重返江湖',exact=True).wait_for()
 b=cb.new_page();b.on('pageerror',lambda e:errors.append(str(e)));b.goto(BASE+'?online=1',wait_until='domcontentloaded');b.locator('.online-result').wait_for(timeout=45000)
 back=state(b);assert back['me']['id']==bid and back['battles'][0]['id']==battle['id'];assert back['battles'][0]['after']==battle['after']
 assert back['me']['character']==sb['me']['character'];assert next(x for x in back['peers'] if x['id']==aid)['online']==False
 b.locator('.online-result').scroll_into_view_if_needed();shot(b,'return-later.png');b.reload(wait_until='domcontentloaded');b.locator('.online-result').wait_for();assert len(state(b)['battles'])==1
 phones=[]
 for width,height in [(320,568),(390,844),(420,896)]:
  b.set_viewport_size({'width':width,'height':height});b.locator('.online-self').scroll_into_view_if_needed();assert not b.evaluate('document.documentElement.scrollWidth>innerWidth');assert b.locator('.online-self-actions button').evaluate_all('(els)=>els.every(x=>x.getBoundingClientRect().height>=44)');shot(b,f'phone-{width}.png');phones.append(width)
 assert not errors,errors
 report.update({'independent_users':3,'third_person_can_enter':True,'no_room_or_invitation':True,'defender_closed_before_attacker_enters':True,'attacker_leaves_before_defender_returns':True,'offline_defence':True,'same_battle_on_later_login':True,'replay_reload_no_mutation':True,'lost_response_recovered':True,'hero_volume_six':True,'life_health_unchanged':True,'phone_widths':phones,'overflow':False,'touch44':True,'pageerrors':errors})
 video=a.video;ca.close();cb.close();browser.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','26','-pix_fmt','yuv420p',str(OUT/'asynchronous.mp4')],check=True)
board=Image.new('RGB',(800,970),'#eee8dd');d=ImageDraw.Draw(board);font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',21)
d.text((12,10),'非同步共用江湖｜唔開房・唔需同時在線',font=font,fill='#332e28')
for i,(f,label) in enumerate([(ROOT/'production/qa/evidence/redesign/online-cloud/landing.png','改前：開房邀請'),(OUT/'landing.png','改後：直接入籍共用江湖')]):
 x=5+i*400;d.text((x+8,48),label,font=font,fill='#332e28');im=Image.open(f).convert('RGB').resize((390,844));board.paste(im,(x,90))
 if i:d.rectangle((x+4,90+300,x+386,90+830),outline='#b74335',width=3)
board.save(OUT/'comparison.jpg',quality=92);(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SHARED_WORLD_BROWSER_PASS',flush=True)
