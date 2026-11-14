"""按下落墨、拖動取消、原生彈窗及動態偏好；隔離存檔。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
BASE=os.getenv('PRESS_INK_BASE','http://127.0.0.1:5311/');OUT=ROOT/'.local-online/press-ink/qa';OUT.mkdir(parents=True,exist_ok=True);rows=[]
def saved(p):
 s=data(p)['character'];m=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(s.get(k)) for k in ['equipment','combatLoadout','appearance','gear','skills','volumes']}|{k:copy.deepcopy(m.get(k)) for k in ['jade','pages','manuals']}
def point(loc):
 r=loc.bounding_box();return r['x']+r['width']/2,r['y']+r['height']/2
PROBE='''()=>{window.__inkDraws=[];window.__inkMaxCores=0;let cores=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.matches('.ink-tap-fx'))cores=0;return clear.apply(this,args)};const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(this.canvas.matches('.ink-tap-fx')){const sprite=image.src.split('/').pop().split('?')[0];__inkDraws.push({t:performance.now(),sprite,alpha:this.globalAlpha});if(sprite==='tap-core.webp')__inkMaxCores=Math.max(__inkMaxCores,++cores)};return draw.call(this,image,...args)}}'''
def ink(p):return p.locator('canvas.ink-tap-fx')
def down(p,loc,wait=60):
 x,y=point(loc);p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(wait);assert ink(p).count()==1,'no ink before release';return x,y
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(b,w,h,record=w==390);p.emulate_media(reduced_motion='no-preference');nav(p,'人物');p.wait_for_timeout(700);before=saved(p);p.evaluate(PROBE)
  button=p.get_by_role('tab',name='普通配搭',exact=True);button.evaluate('e=>{window.__inkClicks=0;e.addEventListener("click",()=>__inkClicks++)}')
  x,y=down(p,button)
  assert ink(p).evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
  bounds=ink(p).evaluate('''(e)=>{const c=e.getContext('2d'),d=c.getImageData(0,0,e.width,e.height).data;let x0=e.width,y0=e.height,x1=0,y1=0,n=0;for(let y=0;y<e.height;y++)for(let x=0;x<e.width;x++)if(d[(y*e.width+x)*4+3]>4){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++}const r=e.getBoundingClientRect();return {cx:r.x+(x0+x1)/2* r.width/e.width,cy:r.y+(y0+y1)/2*r.height/e.height,n}}''')
  assert bounds['n']>20 and abs(bounds['cx']-x)<8 and abs(bounds['cy']-y)<8,bounds
  # 完成像素量度後另錄實際短按，避免截圖壓縮耗時吃掉淡出。
  p.mouse.up();p.wait_for_timeout(200)
  # 每次清理後只繪一張core；放手不追加第二組墨。
  draws=p.evaluate('__inkDraws');cores=[r for r in draws if r['sprite']=='tap-core.webp'];assert max(r['alpha'] for r in cores)>.25
  assert p.evaluate('__inkMaxCores')==1,'release duplicated ink'
  p.wait_for_timeout(500);assert not ink(p).count();assert p.evaluate('__inkClicks')==1
  if w==390:
   p.mouse.move(x+18,y+15);p.mouse.down();p.wait_for_timeout(15);p.screenshot(path=str(OUT/'after-down-390.jpg'),type='jpeg',quality=93);p.mouse.up();p.wait_for_timeout(650)
  # 真指針移動取消本次，不等放手；不影響之後操作。
  down(p,button);p.mouse.move(x+20,y);p.wait_for_timeout(20);assert not ink(p).count();p.mouse.up();p.wait_for_timeout(650)
  down(p,button);p.dispatch_event('body','pointercancel',{'pointerId':1,'isPrimary':True});assert not ink(p).count();p.mouse.up();p.wait_for_timeout(650)
  # 長按只落一次，約半秒自然消失，不循環重播。
  down(p,button);p.wait_for_timeout(600);assert not ink(p).count();p.mouse.up();p.wait_for_timeout(100);assert not ink(p).count()
  # 短連按保留一個canvas且按鍵每次仍原生確認。
  n=p.evaluate('__inkClicks')
  for _ in range(3):p.mouse.click(x,y,delay=18);p.wait_for_timeout(35);assert ink(p).count()<=1
  p.wait_for_timeout(650);assert not ink(p).count();assert p.evaluate('__inkClicks')==n+3
  # 原生觸控同樣在touchEnd前可見。
  session=c.new_cdp_session(p);session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});p.wait_for_timeout(35);assert ink(p).count()==1;session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(650)
  # 非主鍵、失效按鍵、高光覆蓋均不落墨。
  for mode in ['right','disabled','highlight']:
   if mode=='disabled':button.evaluate('e=>e.disabled=true')
   if mode=='highlight':p.evaluate("document.documentElement.dataset.highlightActive='1'")
   p.mouse.click(x,y,button='right' if mode=='right' else 'left');p.wait_for_timeout(30);assert not ink(p).count(),mode
   button.evaluate('e=>e.disabled=false');p.evaluate('delete document.documentElement.dataset.highlightActive');p.wait_for_timeout(100)
  n=len(p.evaluate('__inkDraws'));p.wait_for_timeout(80);assert len(p.evaluate('__inkDraws'))==n,'idle renderer running'
  button.focus();p.keyboard.down('Space');p.wait_for_timeout(50);assert ink(p).count()==1;p.keyboard.up('Space');p.wait_for_timeout(650);assert not ink(p).count()
  down(p,button);p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(30);assert not ink(p).count();p.mouse.up();p.wait_for_timeout(650)
  p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(50);assert not ink(p).count();p.mouse.up();p.emulate_media(reduced_motion='no-preference');p.wait_for_timeout(100)
  down(p,button);p.evaluate("document.documentElement.dataset.inkMotion='reduce'");p.wait_for_timeout(30);assert not ink(p).count();p.mouse.up();p.evaluate("document.documentElement.dataset.inkMotion='full'");p.wait_for_timeout(650)
  tap(p,'造型');d=p.get_by_role('dialog',name='衣著與造型',exact=True);p.wait_for_timeout(700)
  tab=p.get_by_role('tab',name='門派服',exact=True);down(p,tab);assert ink(p).evaluate('e=>e.parentElement.matches("dialog[open]")')
  if w==390:p.screenshot(path=str(OUT/'dialog-down-390.jpg'),type='jpeg',quality=93)
  p.mouse.up();p.wait_for_timeout(700);down(p,tab);p.keyboard.press('Escape');p.wait_for_timeout(50);assert not ink(p).count();p.mouse.up()
  assert saved(p)==before;assert not errors,errors;assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  rows.append({'viewport':[w,h],'inkBeforePointerup':True,'pointerBounds':bounds,'singleBurstAfterRelease':True,'dragAndCancelClear':True,'holdDoesNotRepeat':True,'rapidClicksExactlyThree':True,'keyboard':True,'nativeTouchDown':True,'invalidAndHighlightSuppressed':True,'idleRenderingStops':True,'systemAndGameReducedMotionClear':True,'nativeDialogHostAndClose':True,'equipmentAppearanceCollectionUnchanged':True,'pageerrors':errors})
  video=p.video;c.close()
  if w==390 and video:(OUT/'video.txt').write_text(str(video.path()))
  print('PRESS_INK',w,flush=True)
 # 無存檔新開頁，確認共用回饋亦涵蓋開卷與創角。
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='no-preference');p=c.new_page();p.goto(BASE);p.wait_for_timeout(1200)
 new=p.get_by_role('button',name=re.compile('^開卷'));down(p,new)
 p.screenshot(path=str(OUT/'start-down.jpg'),type='jpeg',quality=93);p.mouse.up();p.wait_for_timeout(1000)
 buttons=p.locator('.scroll-shell button:visible');assert buttons.count()>0;down(p,buttons.first);p.screenshot(path=str(OUT/'create-down.jpg'),type='jpeg',quality=93);p.mouse.up();c.close();b.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'startAndCreateCovered':True,'cloudBlockedForFixtures':True,'actualIphoneTested':False},ensure_ascii=False,indent=2)+'\n');print('PRESS_INK_PASS',len(rows),flush=True)
