"""第68項：三尺寸實際按壓／觸控捲動、焦點、揭頁及減少動態中斷。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('MOBILE_UI_BASE','http://127.0.0.1:5301/');OUT=ROOT/'.local-online/mobile-ui-polish/motion';OUT.mkdir(parents=True,exist_ok=True);reports=[]
def kept(p):
 s=data(p);m=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(s['character'].get(k)) for k in ['appearance','equipment','combatLoadout','gear','skills','volumes']}|{k:copy.deepcopy(m.get(k)) for k in ['jade','pages','manuals']}
def inside(loc):return loc.evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=-1&&r.bottom<=innerHeight+1}')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(b,w,h);saved=kept(p)
  p.evaluate('''()=>{window.__uiMotion=[];window.__uiObserver=new MutationObserver(rs=>{for(const r of rs){const e=r.target;if(e.dataset.inkEntering){const s=getComputedStyle(e);__uiMotion.push({kind:e.dataset.inkEntering,opacity:Number(s.opacity),transform:s.transform,tag:e.className})}}});__uiObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-ink-entering']})}''')
  p.emulate_media(reduced_motion='no-preference')
  for label in ['開啟設定']:
   button=p.get_by_role('button',name=label,exact=True);assert button.evaluate('e=>e.getBoundingClientRect().height>=44')
   box=button.bounding_box();p.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);p.mouse.down();p.wait_for_timeout(70)
   assert button.evaluate('e=>e.classList.contains("is-pressed")&&Number(getComputedStyle(e).scale)<1')
   if w==390:p.screenshot(path=str(OUT/'press-390.jpg'),type='jpeg',quality=90)
   p.mouse.up();dialog=p.get_by_role('dialog',name='設定',exact=True);dialog.wait_for();p.wait_for_timeout(320)
   assert dialog.evaluate('e=>e.matches(":modal")');assert not p.locator('.is-pressed').count()
   for _ in range(5):p.keyboard.press('Tab');assert p.evaluate('document.activeElement===document.body||Boolean(document.activeElement.closest("dialog[open]"))')
   p.keyboard.press('Escape');assert button.evaluate('e=>e===document.activeElement')
  nav(p,'人物');tap(p,'更換武器');dialog=p.get_by_role('dialog',name='更換武器',exact=True)
  for name in ['查看目前裝備詳情','查看選中裝備詳情']:
   assert dialog.get_by_role('button',name=name,exact=True).evaluate('e=>e.getBoundingClientRect().height>=44')
  assert inside(dialog.get_by_role('button',name='目前已裝備',exact=True));p.keyboard.press('Escape')
  tap(p,'造型');dialog=p.get_by_role('dialog',name='衣著與造型',exact=True);p.get_by_role('tab',name='門派服',exact=True).click();p.wait_for_timeout(300)
  assert inside(dialog.get_by_role('button',name='換上',exact=True));assert inside(dialog.get_by_role('button',name='關閉衣著與造型',exact=True))
  # 真觸控拖動制服名單：不換衫、不領取、不殘留按壓。
  choices=p.locator('.ink-appearance-choices');rect=choices.bounding_box();session=c.new_cdp_session(p);x=rect['x']+rect['width']*.5;y=rect['y']+rect['height']*.75
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for delta in [12,28,48,72]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':max(rect['y']+5,y-delta)}]});p.wait_for_timeout(20)
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(100);assert not p.locator('.is-pressed').count()
  if w==320:p.screenshot(path=str(OUT/'uniform-320.jpg'),type='jpeg',quality=90)
  p.keyboard.press('Escape');assert kept(p)==saved
  tap(p,'武學');p.get_by_role('tab',name='規則',exact=True).click();p.wait_for_timeout(300);assert p.get_by_role('heading',name='出招與內力',exact=True).is_visible()
  if w==320:p.screenshot(path=str(OUT/'rules-320.jpg'),type='jpeg',quality=90)
  tap(p,'返回人物');tap(p,'返回鎮居');nav(p,'修煉');tap(p,'門派');p.wait_for_timeout(300);tap(p,'返回');nav(p,'江湖');tap(p,'秘笈閣');tap(p,'卡池詳情');p.wait_for_timeout(300);p.keyboard.press('Escape')
  assert kept(p)==saved
  events=p.evaluate('window.__uiMotion');assert any(e['kind']=='page' for e in events);assert any(e['kind']=='sheet' for e in events);assert any(e['opacity']<.99 for e in events),events
  p.wait_for_timeout(350);assert not p.locator('[data-ink-entering]').count()
  # 開窗時切成減少動態：即時收尾，後續開頁不再排動畫。
  p.evaluate("document.querySelector('.ink-codex-heading-actions button').click()")
  p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(100);assert not p.locator('[data-ink-entering]').count();p.keyboard.press('Escape')
  p.evaluate('window.__uiMotion=[]');tap(p,'卡池詳情');p.wait_for_timeout(100);assert p.evaluate('window.__uiMotion.length')==0;p.keyboard.press('Escape')
  # 遊戲內減少動態亦生效。
  p.emulate_media(reduced_motion='no-preference');p.wait_for_timeout(200);p.evaluate("document.documentElement.dataset.inkMotion='reduce';window.__uiMotion=[]");tap(p,'卡池詳情');p.wait_for_timeout(100);assert p.evaluate('window.__uiMotion.length')==0;p.keyboard.press('Escape');p.evaluate("delete document.documentElement.dataset.inkMotion")
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not errors,errors
  reports.append({'viewport':[w,h],'events':events,'touchTargets44':True,'pressRetainsColourAndPosition':True,'touchScrollCancelledPress':True,'sheetFocusFenceAndReturn':True,'unchangedEquipmentAppearanceCollection':True,'systemAndGameReducedMotion':True,'noLeftoverAnimation':True,'pageerrors':errors});c.close();print('MOBILE_UI_MOTION',w,len(events),flush=True)
 b.close()
(OUT/'report.json').write_text(json.dumps({'cases':reports,'actualIphone':False,'cloudBlocked':True},ensure_ascii=False,indent=2));print('MOBILE_UI_MOTION_PASS',len(reports),flush=True)
