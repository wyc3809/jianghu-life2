"""書面語手機驗收：固定本機QA存檔；多人只用隔離快照。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/written-copy';OUT.mkdir(parents=True,exist_ok=True)
LABEL=os.getenv('COPY_PHASE','after');WIDTH=int(os.getenv('COPY_WIDTH','390'));HEIGHT=int(os.getenv('COPY_HEIGHT','844'));BASE=os.getenv('COPY_BASE','http://127.0.0.1:5173/')
setup=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text().replace("await import('/src/store/ancestryStore.ts')", "await import((await(await fetch('/src/main.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 ctx=b.new_context(viewport={'width':WIDTH,'height':HEIGHT},device_scale_factor=2,reduced_motion='reduce');ctx.route('**/seuocqrmyljjzndgbynt.supabase.co/**',lambda r:r.abort())
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE,wait_until='domcontentloaded');page.wait_for_timeout(2200)
 def shot(name):page.evaluate('document.fonts.ready');page.wait_for_timeout(250);page.screenshot(path=str(OUT/f'{LABEL}-{name}{"" if WIDTH==390 and HEIGHT==844 else f"-{WIDTH}-{HEIGHT}"}.png'))
 shot('title');page.evaluate(setup,{'jade':{'free':600,'paidTest':0}})
 page.get_by_role('button',name='秘笈閣',exact=True).click();page.get_by_role('button',name='卡池詳情',exact=True).click();shot('gacha-rules');page.get_by_role('button',name='關閉卡池詳情',exact=True).click()
 page.get_by_role('navigation',name='分卷').get_by_role('button',name='鎮居',exact=True).click()
 page.evaluate("()=>{const a=window.qa.anc,m=structuredClone(a.getState().meta);m.encounter={...m.encounter,offer:{tpl:'enc_thunder_widow',at:Date.now()}};a.setState({meta:m,encounterOpen:true})}");page.get_by_role('dialog').wait_for();assert 'NaN' not in page.get_by_role('dialog').inner_text();shot('encounter');page.locator('.ink-enc-actions button').first.click()
 page.get_by_role('button',name='開啟設定',exact=True).click();shot('settings')
 if LABEL=='after':
  assert not re.search('[唔嘅咗喺佢揀畀俾嚟咁冇啲嗰乜咩睇攞拎撳嘢]',page.locator('body').inner_text())
  page.keyboard.press('Escape')
  page.evaluate("()=>{const l=window.qa.life,s=structuredClone(l.getState().state);s.tab='home';s.moments=[];s.pending={eventId:'event_083',year:s.year,month:s.month,kind:'special'};l.setState({state:s,lastResult:null})}")
  page.get_by_text('順水勢演練',exact=True).wait_for();shot('event');page.get_by_text('順水勢演練',exact=True).click();page.locator('.ink-result-story').wait_for();shot('event-result')
  text=page.locator('.ink-result-story').inner_text();assert ('水勢' in text or '瀑下' in text) and '客棧' not in text
  # 事件可能獎勵裝備；多人畫面用新一輪QA存檔，避免獎勵浮層遮住入口。
  page.reload(wait_until='domcontentloaded');page.wait_for_timeout(1800);page.evaluate(setup,{'jade':{'free':600,'paidTest':0}})
  # 多人只做顯示驗證；固定快照不會接觸真江湖服務。
  page.evaluate("()=>{const l=window.qa.life,s=structuredClone(l.getState().state);s.pending=null;s.tab='jianghu';s.moments=[];l.setState({state:s,lastResult:null});sessionStorage.setItem('jianghu-online-session','qa-copy');localStorage.removeItem('jianghu-world-joined')}")
  character=page.evaluate('window.qa.life.getState().state.character')
  me={'id':'qa-copy','character':character,'rank':100,'protectedUntil':0,'onlineUntil':9999999999999,'busy':None,'rewardAt':0,'offlineAccruedMs':0,'pendingOnline':0,'pendingOffline':0,'onlineRemainder':0,'offlineRemainder':0,'silver':0}
  snapshot={'serverNow':0,'revision':1,'me':me,'peers':[{'id':'qa-copy','name':character['name'],'rank':100,'online':True,'protectedUntil':0,'busy':None}],'battles':[],'confirmedRequests':[],'params':{'protectionMs':60000,'onlineSilverPerMinute':30,'offlineSilverPerMinute':1,'offlineCapMs':172800000}}
  page.route('**/api/jianghu/**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(snapshot,ensure_ascii=False)))
  page.get_by_role('button',name='江湖風雲',exact=True).click();page.wait_for_timeout(500);
  rule_button=page.get_by_role('button',name='試場規則',exact=True)
  if not rule_button.count():page.get_by_role('button',name='查看試場規則 ›',exact=True).click()
  else:rule_button.click()
  shot('online-rules');assert '切磋不會造成受傷或死亡' in page.locator('.online-rules').inner_text()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert not errors,errors
 (OUT/f'{LABEL}-capture-{WIDTH}-{HEIGHT}.json').write_text(json.dumps({'viewport':[WIDTH,HEIGHT],'dpr':2,'seed':42,'jade':{'free':600,'paidTest':0},'phase':LABEL,'pageerrors':errors},ensure_ascii=False,indent=2)+'\n');b.close();print('COPY_CAPTURE_PASS',LABEL)
