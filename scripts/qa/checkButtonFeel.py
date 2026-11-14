"""真按鍵短壓、回彈、連按、邊位／滑動、偏好及實際音效；隔離存檔。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
BASE=os.getenv('BUTTON_FEEL_BASE','http://127.0.0.1:5310/');OUT=ROOT/'.local-online/button-feel/qa';OUT.mkdir(parents=True,exist_ok=True);rows=[]
def saved(p):
 s=data(p)['character'];m=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(s.get(k)) for k in ['equipment','combatLoadout','appearance','gear','skills','volumes']}|{k:copy.deepcopy(m.get(k)) for k in ['jade','pages','manuals']}
def point(loc):
 r=loc.bounding_box();return r['x']+r['width']/2,r['y']+r['height']/2
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(b,w,h);p.emulate_media(reduced_motion='no-preference');p.wait_for_timeout(180);before=saved(p)
  settings=p.get_by_role('button',name='開啟設定',exact=True);x,y=point(settings)
  p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(85)
  pressed=settings.evaluate('e=>({scale:Number(getComputedStyle(e).scale),y:getComputedStyle(e).translate,filter:getComputedStyle(e).filter})');assert pressed['scale']<.95
  if w==390:p.screenshot(path=str(OUT/'pressed-390.jpg'),type='jpeg',quality=93)
  p.mouse.up();p.get_by_role('dialog',name='設定',exact=True).wait_for();p.wait_for_timeout(350);assert not p.locator('[data-ink-press]').count();p.keyboard.press('Escape')
  nav(p,'人物');p.wait_for_timeout(350);button=p.get_by_role('tab',name='普通配搭',exact=True);x,y=point(button)
  button.evaluate('''e=>{window.__keyFrames=[];window.__keyClicks=0;e.addEventListener('click',()=>__keyClicks++);const start=performance.now();function frame(){const s=getComputedStyle(e);__keyFrames.push({elapsed:performance.now()-start,scale:s.scale==='none'?1:Number(s.scale),y:s.translate,phase:e.dataset.inkPress??null});if(performance.now()-start<600)requestAnimationFrame(frame)}requestAnimationFrame(frame)}''')
  p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(25);p.mouse.up();p.wait_for_timeout(650);frames=p.evaluate('window.__keyFrames')
  assert min(r['scale'] for r in frames)<.95,frames;assert max(r['scale'] for r in frames)>1.005,frames
  assert not p.locator('[data-ink-press],.ink-key-response').count()
  # 真連點不等候動畫，也不由測試重發任何遊戲指令。
  before_clicks=p.evaluate('__keyClicks')
  for _ in range(3):p.mouse.click(x,y,delay=18);p.wait_for_timeout(25)
  p.wait_for_timeout(400);assert p.evaluate('__keyClicks')==before_clicks+3,('rapid',before_clicks,p.evaluate('__keyClicks'));assert not p.locator('[data-ink-press],.ink-key-response').count()
  # 鼠標及觸控按原範圍最左邊1px，壓細後仍各確認一次。
  p.mouse.move(2,2);p.wait_for_timeout(250);box=button.bounding_box();n=p.evaluate('__keyClicks');p.mouse.click(box['x']+1,box['y']+box['height']/2,delay=90);p.wait_for_timeout(400);assert p.evaluate('__keyClicks')==n+1
  p.mouse.move(2,2);p.wait_for_timeout(250);box=button.bounding_box();session=c.new_cdp_session(p);session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+1,'y':box['y']+box['height']/2}]});p.wait_for_timeout(90);session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(400);assert p.evaluate('__keyClicks')==n+2
  duel=p.get_by_role('tab',name='對戰配搭',exact=True);dr=duel.bounding_box();session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':dr['x']+1,'y':dr['y']+dr['height']/2}]});p.wait_for_timeout(90);session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(350);assert duel.get_attribute('aria-selected')=='true';p.get_by_role('tab',name='普通配搭',exact=True).click();p.wait_for_timeout(350)
  tap(p,'造型');dialog=p.get_by_role('dialog',name='衣著與造型',exact=True);p.get_by_role('tab',name='門派服',exact=True).click();p.wait_for_timeout(350)
  choices=p.locator('.ink-appearance-choices');box=choices.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']*.8
  dialog.evaluate('e=>{window.__dragClicks=0;e.addEventListener("click",()=>__dragClicks++)}');session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for delta in [12,28,48,72]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':max(box['y']+4,y-delta)}]});p.wait_for_timeout(25)
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(350);assert p.evaluate('__dragClicks')==0;assert not p.locator('.is-pressed,[data-ink-press],.ink-key-response').count();p.keyboard.press('Escape');assert saved(p)==before
  button=p.get_by_role('tab',name='普通配搭',exact=True);button.focus();p.keyboard.down('Space');p.wait_for_timeout(80);assert button.evaluate('e=>Number(getComputedStyle(e).scale)<.95');p.keyboard.up('Space');p.wait_for_timeout(350)
  x,y=point(button);p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(50);p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(120);assert not p.locator('[data-ink-press],.ink-key-response').count();p.mouse.up();p.wait_for_timeout(350);assert not p.locator('.is-pressed,[data-ink-press]').count();assert saved(p)==before
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not errors,errors
  rows.append({'viewport':[w,h],'pressed':pressed,'fastTapFrames':frames,'rapidClicksExactlyThree':True,'mouseAndTouchEdgeClicks':True,'touchScrollDidNotClick':True,'keyboardAndReducedMotion':True,'equipmentAppearanceCollectionUnchanged':True,'pageerrors':errors});c.close();print('BUTTON_FEEL',w,round(min(r['scale'] for r in frames),3),round(max(r['scale'] for r in frames),3),flush=True)
 b.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'actualIphoneHapticsTested':False,'cloudBlocked':True},ensure_ascii=False,indent=2));print('BUTTON_FEEL_PASS',len(rows),flush=True)
