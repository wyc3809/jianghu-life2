"""第50項：真畫面點按／拖動／連點／原生dialog／減少動態；封鎖雲端。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkPersonScreen.py').read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('TAP_INK_BASE','http://127.0.0.1:5204/')
OUT=ROOT/'production/qa/evidence/redesign/tap-ink';OUT.mkdir(parents=True,exist_ok=True)
PROBE='''(()=>{window.tapProbe={draws:0,clears:0,contexts:0,alphaMax:0};const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){const c=get.apply(this,args);if(c&&args[0]==='2d'&&this.classList.contains('ink-tap-fx')&&!c.__tapProbe){c.__tapProbe=true;window.tapProbe.contexts++;const draw=c.drawImage,clear=c.clearRect;c.drawImage=function(...a){window.tapProbe.draws++;window.tapProbe.alphaMax=Math.max(window.tapProbe.alphaMax,this.globalAlpha);return draw.apply(this,a)};c.clearRect=function(...a){window.tapProbe.clears++;return clear.apply(this,a)}}return c}})();'''

def centre(button):
 r=button.bounding_box();return r['x']+r['width']/2,r['y']+r['height']/2

def point(page,button):
 x,y=centre(button);page.mouse.move(x,y);page.mouse.down();page.mouse.up();return x,y

def ink_position(page,button):
 x,y=centre(button)
 values=page.locator('canvas.ink-tap-fx').evaluate("""e=>{const r=e.getBoundingClientRect(),c=e.getContext('2d'),a=c.getImageData(0,0,e.width,e.height).data;let l=e.width,t=e.height,b=0,right=0,n=0;for(let i=3;i<a.length;i+=4)if(a[i]){let p=(i-3)/4,x=p%e.width,y=Math.floor(p/e.width);l=Math.min(l,x);right=Math.max(right,x);t=Math.min(t,y);b=Math.max(b,y);n++}const d=e.width/r.width;return {n,cx:r.left+(l+right)/2/d,cy:r.top+(t+b)/2/d,w:(right-l)/d,h:(b-t)/d}}""")
 assert values['n']>0 and abs(values['cx']-x)<18 and abs(values['cy']-y)<18,values
 assert values['w']<88 and values['h']<88,values

def empty(page):
 page.wait_for_function('!document.querySelector("canvas.ink-tap-fx")',timeout=3000)
 draws=page.evaluate('tapProbe.draws');page.wait_for_timeout(150)
 assert page.evaluate('tapProbe.draws')==draws,'tap renderer did not stop at idle'

def synthetic(page,button,kind='pointerdown',**extra):
 x,y=centre(button);event=dict(pointerId=71,isPrimary=True,pointerType='touch',button=0,clientX=x,clientY=y);event.update(extra);button.dispatch_event(kind,event)

results=[]
with sync_playwright() as p:
 for engine in json.loads(os.getenv('TAP_INK_ENGINES','["chromium","webkit"]')):
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in [[320,568],[390,844],[430,932]]:
   print('CASE',engine,w,h,flush=True)
   c,page,errors=start(browser,w,h,video=(engine=='chromium' and w==390));c.add_init_script(PROBE);page.emulate_media(reduced_motion='no-preference');page.reload();page.wait_for_timeout(500)
   if page.get_by_role('button',name=re.compile('^續寫前緣')).count():tap(page,re.compile('^續寫前緣'),False)
   page.wait_for_timeout(1200)
   if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
   page.wait_for_timeout(700)
   home=page.get_by_role('navigation',name='分卷').get_by_role('button',name='鎮居',exact=True)
   x,y=centre(home);page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(45)
   assert home.evaluate('e=>getComputedStyle(e).backgroundColor')=='rgba(0, 0, 0, 0)','pressed icon turned into black circle'
   if engine=='chromium' and w==390:page.screenshot(path=str(OUT/'after-press.png'))
   page.mouse.up();page.wait_for_timeout(700);point(page,home);page.wait_for_timeout(45)
   assert page.locator('canvas.ink-tap-fx').count()==1,'home did not emit ink'
   assert page.locator('canvas.ink-tap-fx').evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
   if engine=='chromium' and w==390:page.screenshot(path=str(OUT/'after-home-tap.png'))
   page.wait_for_timeout(700);empty(page)
   nav(page,'人物');page.wait_for_timeout(700);before=snapshots(page)
   ordinary=buttons(page,'普通配搭')
   point(page,ordinary);page.wait_for_timeout(45)
   assert page.locator('canvas.ink-tap-fx').count()==1
   ink_position(page,ordinary)
   if engine=='chromium' and w==390:page.screenshot(path=str(OUT/'after-person-tap.png'))
   page.wait_for_timeout(700);empty(page)
   # 無效操作不落墨：拖走後折返、長按、取消、非主指、多指、空白。
   for mode in ['drag','hold','cancel','secondary','blank','disabled','nonprimary']:
    count=page.evaluate('tapProbe.draws');x,y=centre(ordinary)
    if mode=='disabled':
     ordinary.evaluate('e=>e.setAttribute("disabled","")');synthetic(page,ordinary);synthetic(page,ordinary,'pointerup');ordinary.evaluate('e=>e.removeAttribute("disabled")')
    elif mode=='nonprimary':synthetic(page,ordinary,isPrimary=False);synthetic(page,ordinary,'pointerup',isPrimary=False)
    elif mode=='blank':page.mouse.click(195,100)
    elif mode=='hold':page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(700);page.mouse.up()
    elif mode=='secondary':page.mouse.click(x,y,button='right')
    else:
     synthetic(page,ordinary)
     if mode=='drag':synthetic(page,ordinary,'pointermove',clientX=x+25)
     if mode=='cancel':synthetic(page,ordinary,'pointercancel')
     synthetic(page,ordinary,'pointerup')
    page.wait_for_timeout(80);assert page.evaluate('tapProbe.draws')==count,mode+' emitted ink'
   # 開原生換裝窗：在頂層繪畫但不攔截卡片與換上。
   d=picker(page,'武器');page.wait_for_timeout(650);snapshot=snapshots(page)
   card=d.locator('[data-gear-id="iron-blade"]');card.scroll_into_view_if_needed();stable(page)
   point(page,card);page.wait_for_timeout(45)
   assert d.locator('canvas.ink-tap-fx').count()==1,'native dialog hid ink'
   ink_position(page,card)
   assert snapshots(page)==snapshot,'preview altered game state'
   if engine=='chromium' and w==390:page.screenshot(path=str(OUT/'after-dialog-tap.png'))
   page.wait_for_timeout(650);empty(page)
   # 30次密集pointer操作不新增畫布或遊戲動作；暈染完成後完全清理。
   for _ in range(30):
    synthetic(page,card);synthetic(page,card,'pointerup');page.wait_for_timeout(12)
   assert page.locator('canvas.ink-tap-fx').count()<=1
   assert snapshots(page)==snapshot
   page.wait_for_timeout(700);empty(page)
   close(page,'更換武器');page.wait_for_timeout(650)
   assert snapshots(page)==before
   # 設定可動態改變；在畫布出現時切減少動態即清，恢復後可再操作。
   point(page,ordinary);page.wait_for_timeout(35);assert page.locator('canvas.ink-tap-fx').count()==1
   page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(50);empty(page)
   point(page,ordinary);page.wait_for_timeout(100);empty(page)
   page.emulate_media(reduced_motion='no-preference');point(page,ordinary);page.wait_for_timeout(45);assert page.locator('canvas.ink-tap-fx').count()==1
   page.wait_for_timeout(700);empty(page)
   # 高光覆蓋時不疊加點墨，亦不消耗遊戲資源。
   page.evaluate('document.documentElement.dataset.highlightActive="1"');count=page.evaluate('tapProbe.draws')
   point(page,ordinary);page.wait_for_timeout(80);assert page.evaluate('tapProbe.draws')==count
   page.evaluate('delete document.documentElement.dataset.highlightActive')
   assert snapshots(page)==before
   assert not errors,errors
   probe=page.evaluate('tapProbe');assert probe['alphaMax']<=.28 and probe['contexts']<=2,probe
   results.append({'engine':engine,'viewport':[w,h],'homeAndFullScreen':True,'nativeDialog':True,'ignoreDragHoldCancelRightClickBlankDisabledNonprimary':True,'rapid30':True,'idleStops':True,'liveReducedMotion':True,'noGameMutation':True,'highlightSuppressed':True,'probe':probe,'pageerrors':errors})
   video=page.video;c.close()
   if engine=='chromium' and w==390 and video:(OUT/'video-path.txt').write_text(str(video.path()))
  browser.close()
(OUT/'report.json').write_text(json.dumps({'actualIphone':False,'cloudRequestsBlocked':True,'cases':results},ensure_ascii=False,indent=2));print('TAP_INK_PASS',len(results))
