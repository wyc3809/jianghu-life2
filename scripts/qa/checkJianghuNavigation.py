"""江湖點進式列表：真遊戲／真雲端回歸，只操作自己嘅QA身份。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import os,json,re,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/jianghu-navigation';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('ONLINE_QA_BASE','http://127.0.0.1:5181/')
sessions=json.loads((ROOT/'.local-online/cloud-qa-sessions.json').read_text());session=sessions[0]
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text().replace("await import('/src/store/ancestryStore.ts')", "await import((await(await fetch('/src/components/ink/InkGachaPanel.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
report={'viewport':[390,844],'dpr':2,'seed':42,'jade':{'free':600,'paidTest':0},'baseline':'EA0.82.0','cases':[]}
def shot(page,name):page.evaluate('document.fonts.ready');page.wait_for_timeout(800);page.screenshot(path=str(OUT/name))
def world(page):return page.evaluate("async()=>{const {onlineRequest}=await import('/src/online/client.ts');return await onlineRequest('world','world')}")
def skip(page):
 d=page.get_by_role('dialog')
 if d.count():d.get_by_role('button',name='跳過 ›',exact=True).click();d.wait_for(state='detached')
def online_back(page):page.get_by_role('button',name='‹ 返回江湖風雲',exact=True).click();page.get_by_role('navigation',name='江湖風雲功能').wait_for()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,record_video_dir='/tmp/jianghu-navigation-video',record_video_size={'width':390,'height':844})
 ctx.add_init_script('localStorage.setItem("sb-seuocqrmyljjzndgbynt-auth-token",'+json.dumps(json.dumps(session))+');localStorage.setItem("jianghu-world-joined","1");')
 page=ctx.new_page();errors=[];commands=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def observe(request):
  if '/functions/v1/jianghu-world' in request.url and request.method=='POST':
   action=request.post_data_json.get('action')
   if action in ['challenge','claim','loadout']:commands.append(action)
 page.on('request',observe)
 page.goto(BASE,wait_until='domcontentloaded');page.wait_for_timeout(3500);page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}})
 page.locator('#ink-jianghu-menu').wait_for();shot(page,'after.png')
 assert page.get_by_role('navigation',name='江湖功能').get_by_role('button').count()==5
 for selector in ['#ink-online','#ink-gacha','.ink-huashan-panel','.ink-sect-founder-panel','.ink-world-panel']:assert page.locator(selector).count()==0,selector
 assert page.locator('#ink-jianghu-menu .ink-badge-object').count()==5
 # 原有功能各自點入，返回唔再留喺舊長頁底部。
 for name,selector in [('秘笈閣','#ink-gacha'),('華山論劍','.ink-huashan-panel'),('開宗立派','.ink-sect-founder-panel'),('心性','.ink-world-panel')]:
  page.get_by_role('button',name=name,exact=True).click();page.locator(selector).wait_for();shot(page,{'秘笈閣':'gacha.png','華山論劍':'huashan.png','開宗立派':'founder.png','心性':'nature.png'}[name])
  page.evaluate("document.querySelector('.ink-play-body').scrollTop=99999")
  page.get_by_role('button',name='‹ 返回江湖',exact=True).click();page.locator('#ink-jianghu-menu').wait_for();assert page.evaluate("document.querySelector('.ink-play-body').scrollTop")<2
 report['cases'].append({'name':'five_root_entries_and_back','only_selected_content':True,'icons':5,'scroll_reset':True})
 # 主頁兩個原有捷徑：直接開所選功能，而唔係捲向已經不存在嘅節點。
 for name,selector in [('秘笈閣','#ink-gacha'),('論劍','.ink-huashan-panel')]:
  page.get_by_role('navigation',name='分卷').get_by_role('button',name='鎮居',exact=True).click()
  page.get_by_role('navigation',name='功能入口').get_by_role('button',name=name,exact=True).click();page.locator(selector).wait_for()
  page.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click();page.locator('#ink-jianghu-menu').wait_for()
 report['cases'].append({'name':'home_shortcuts','gacha':True,'huashan':True,'dock_returns_to_menu':True})
 # 新導航唔改抽卡入帳；馬上裝備仍先去人物揀欄。
 page.get_by_role('button',name='秘笈閣',exact=True).click();before_skills=page.evaluate('window.qa.life.getState().state.character.skills')
 page.get_by_role('button',name=re.compile('^抽一次')).click();page.get_by_role('dialog').wait_for(timeout=30000)
 skip_button=page.get_by_role('button',name='跳過 ›',exact=True)
 if skip_button.count():skip_button.click()
 equip=page.get_by_role('button',name=re.compile('^馬上裝備：'));equip.wait_for(timeout=30000);page.wait_for_function("!document.querySelector('.ink-pull-equip-btn')?.disabled",timeout=30000)
 equip.click();page.wait_for_function("window.qa.life.getState().state.tab==='person'")
 assert page.evaluate('window.qa.anc.getState().meta.jade.free')==540
 assert page.evaluate('window.qa.life.getState().state.character.skills')==before_skills
 shot(page,'equip-selection.png');page.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click()
 report['cases'].append({'name':'gacha_equipment_handoff','jade_after_one_pull':540,'no_auto_learning':True,'person_page':True})
 page.get_by_role('button',name='江湖風雲',exact=True).click();page.locator('[data-my-rank]').wait_for(timeout=30000);shot(page,'online-menu.png')
 assert page.get_by_role('navigation',name='江湖風雲功能').get_by_role('button').count()==5
 for selector in ['.online-opponents','.online-income','.online-loadout','.online-history','.online-rules','#ink-gacha']:assert page.locator(selector).count()==0,selector
 # 配搭保存，資料沿用同一份伺服器角色。
 original=world(page);page.get_by_role('button',name='武學配搭',exact=True).click();shot(page,'loadout.png')
 page.get_by_role('button',name='保存配搭',exact=True).click();page.get_by_role('navigation',name='江湖風雲功能').wait_for();assert world(page)['me']['character']==original['me']['character']
 # 真實待領收益，連點只一條操作。
 page.get_by_role('button',name='修行所得',exact=True).click();page.locator('[data-silver]').wait_for();shot(page,'income.png');before=world(page)
 if before['me']['pendingOnline']+before['me']['pendingOffline']>0:
  with page.expect_response(lambda r:'/functions/v1/jianghu-world' in r.url and r.request.method=='POST' and r.request.post_data_json.get('action')=='claim') as claimed:
   page.get_by_role('button',name='收取收益',exact=True).evaluate('(el)=>{el.click();el.click()}')
  amount=claimed.value.json()['total'];page.wait_for_function('(n)=>Number(document.querySelector("[data-silver]").textContent.replaceAll(",",""))===n',arg=before['me']['silver']+amount)
  assert commands.count('claim')==1
 else:amount=0
 online_back(page);page.get_by_role('button',name='試場規則',exact=True).click();shot(page,'rules.png');assert page.locator('.online-rules').count()==1;online_back(page)
 # 戰報獨立內容頁，原有回放只讀。
 page.get_by_role('button',name='江湖戰報',exact=True).click();shot(page,'history.png');before_challenges=commands.count('challenge')
 if page.get_by_role('button',name='重播交手',exact=True).count():
  page.get_by_role('button',name='重播交手',exact=True).click();page.get_by_role('dialog').wait_for(timeout=30000);skip(page)
 assert commands.count('challenge')==before_challenges;online_back(page)
 # 只揀自己QA身份做真離線挑戰，唔襲擊其他玩家。
 page.get_by_role('button',name='對手名冊',exact=True).click();page.locator('.online-opponent').first.wait_for();shot(page,'opponents.png');target=None
 for s in sessions[1:]:
  candidate=page.locator('[data-peer-id="'+s['user']['id']+'"]')
  if candidate.count() and candidate.get_by_role('button',name='挑戰',exact=True).count() and candidate.get_by_role('button',name='挑戰',exact=True).is_enabled():target=candidate;break
 assert target is not None,'QA對手暫時受保護；請等保護期完再驗'
 with page.expect_response(lambda r:'/functions/v1/jianghu-world' in r.url and r.request.method=='POST' and r.request.post_data_json.get('action')=='challenge') as challenged:
  target.get_by_role('button',name='挑戰',exact=True).click()
 battle_id=challenged.value.json()['battleId'];assert challenged.value.status==200
 page.get_by_role('dialog').wait_for(timeout=30000);skip(page);online_back(page)
 page.get_by_role('button',name='江湖戰報',exact=True).click();page.locator('[data-battle-id="'+battle_id+'"]').wait_for(timeout=30000);shot(page,'new-battle-history.png')
 online_back(page);font=page.locator('.online-self h3').evaluate('(el)=>getComputedStyle(el).fontFamily');assert 'Noto Sans' in font
 report['cases'].append({'name':'online_sections','menu_only':True,'loadout_preserved':True,'claim_total':amount,'claim_double_click_once':True,'replay_no_challenge':True,'offline_qa_challenge_and_history':True,'font':font})
 # 小屏返回、觸控及圖示素材真正載入。
 phones=[]
 for width,height in [(320,568),(390,844),(420,896)]:
  page.get_by_role('button',name='‹ 返回江湖',exact=True).click();page.locator('#ink-jianghu-menu').wait_for();page.set_viewport_size({'width':width,'height':height});shot(page,f'root-{width}.png')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert page.locator('.ink-feature-list button').evaluate_all('(els)=>els.every(el=>el.getBoundingClientRect().height>=44)')
  assert page.locator('.ink-feature-list img').evaluate_all('(els)=>els.every(el=>el.complete && el.naturalWidth>0)')
  page.get_by_role('button',name='江湖風雲',exact=True).click();page.locator('[data-my-rank]').wait_for();shot(page,f'online-{width}.png')
  page.get_by_role('button',name='對手名冊',exact=True).click();page.evaluate("document.querySelector('.ink-play-body').scrollTop=99999");online_back(page)
  assert page.evaluate("document.querySelector('.ink-play-body').scrollTop")<2
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');phones.append(width)
 assert not errors,errors
 report.update({'phone_widths':phones,'overflow':False,'touch44':True,'bitmap_icons_loaded':True,'pageerrors':errors,'commands':{kind:commands.count(kind) for kind in ['loadout','claim','challenge']}})
 video=page.video;ctx.close();browser.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/'navigation.mp4')],check=True)
board=Image.new('RGB',(800,965),'#eee8dd');d=ImageDraw.Draw(board);font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
d.text((12,10),'江湖分層入口｜390×844 DPR2・seed42・玉石600／0',font=font,fill='#332e28')
for i,(f,label) in enumerate([('before.png','改前：內容全部攤開'),('after.png','改後：先選功能再點入')]):
 x=5+i*400;d.text((x+8,48),label,font=font,fill='#332e28');im=Image.open(OUT/f).convert('RGB').resize((390,844));board.paste(im,(x,90))
 if i:d.rectangle((x+5,90+184,x+385,90+675),outline='#b74335',width=3)
board.save(OUT/'comparison.jpg',quality=92);(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('JIANGHU_NAVIGATION_BROWSER_PASS',flush=True)
