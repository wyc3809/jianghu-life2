"""實際App內Spine播放器的動作、固定步、隔離、尺寸及後備驗證。"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os, time

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/spine-character';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('SPINE_REVIEW_BASE','http://127.0.0.1:5276/')
report={'actualIphone':False,'nativeEditorRoundTrip':False,'cases':[]}

def get_frame(page):
    for _ in range(100):
        if len(page.frames)>1:
            f=page.frames[1]
            if f.evaluate('!!window.__spineLab?.ready'):return f
        page.wait_for_timeout(100)
    raise AssertionError('Spine frame not ready: '+page.content()[:200])

def check_controls(f):
    assert not f.evaluate('document.documentElement.scrollHeight>innerHeight+1 || document.documentElement.scrollWidth>innerWidth+1')
    assert f.locator('svg').count()==0
    for button in f.locator('button').all():
        b=button.bounding_box();assert b and b['width']>=43.9 and b['height']>=43.9,(button.inner_text(),b)
        assert b['y']>=0 and b['y']+b['height']<=f.evaluate('innerHeight')+1

def tap(f,name):f.get_by_role('button',name=name,exact=True).click()

with sync_playwright() as pw:
    for engine in ['chromium','webkit']:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE','/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh'))
        for size in [[320,568],[390,844],[430,932]]:
            print('CASE',engine,size,flush=True)
            record=engine=='chromium' and size==[390,844]
            ctx=browser.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=2,is_mobile=True,has_touch=True,**({'record_video_dir':str(ROOT/'.local-online/spine-ai/video'),'record_video_size':{'width':390,'height':844}} if record else {}))
            ctx.add_init_script('if(window.top===window)localStorage.setItem("spine-qa-guard","no-game-writes")')
            page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?spine-lab=1');f=get_frame(page);check_controls(f);saved=page.evaluate('JSON.stringify(localStorage)')
            for name,delay in [('待機',2200),('出拳',1400),('受擊',1200),('出拳',1400)]:
                tap(f,name);page.wait_for_timeout(delay);assert f.evaluate('__spineLab.metrics.invalidFrames')==0
            tap(f,'暫停');before=f.evaluate('__spineLab.steps');pose=f.evaluate('__spineLab.snapshot()');page.wait_for_timeout(250);assert f.evaluate('__spineLab.steps')==before and f.evaluate('__spineLab.snapshot()')==pose
            tap(f,'前進一幀');assert f.evaluate('__spineLab.steps')==before+1
            tap(f,'轉向');assert f.evaluate('__spineLab.player.skeleton.scaleX')==-1;tap(f,'轉向');tap(f,'骨架');assert f.evaluate('__spineLab.player.config.debug.meshes')
            if record:page.screenshot(path=str(OUT/'app-debug.png'))
            tap(f,'骨架');tap(f,'1×');expect(f.locator('#speed')).to_have_text('0.5×')
            tap(f,'出拳');page.wait_for_timeout(2200)
            if record:
                for name,t in [('idle',.8),('attack',.35),('hurt',.19)]:
                    f.evaluate('([name,time])=>__spineLab.inspect(name,time)',[name,t]);page.wait_for_timeout(80);page.screenshot(path=str(OUT/f'app-{name}.png'))
            # 模擬可見狀態通知，只驗本頁listener；不當成iPhone系統前後台驗收。
            f.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');before=f.evaluate('__spineLab.steps');page.wait_for_timeout(150);assert f.evaluate('__spineLab.steps')==before
            f.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
            assert page.evaluate('JSON.stringify(localStorage)')==saved
            assert not errors,errors
            assert f.evaluate('__spineLab.failures')==[]
            report['cases'].append({'engine':engine,'viewport':size,'actions':True,'pauseAndSingleStep':True,'mirror':True,'debug':True,'noStorageMutation':True,'noSvg':True,'invalidFrames':0,'pageerrors':errors})
            video=page.video;ctx.close()
            if record:video.save_as(str(OUT/'operation.webm'))
        # 減少動態時，按出拳定位在清晰姿勢；只會手動逐步。
        ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce');page=ctx.new_page();page.goto(BASE+'?spine-lab=1');f=get_frame(page);tap(f,'出拳');pose=f.evaluate('__spineLab.snapshot()');before=f.evaluate('__spineLab.steps');page.wait_for_timeout(200);assert f.evaluate('__spineLab.snapshot()')==pose and f.evaluate('__spineLab.steps')==before;tap(f,'前進一幀');assert f.evaluate('__spineLab.steps')==before+1
        report['cases'].append({'engine':engine,'reducedMotion':True,'staticActionAndStep':True});ctx.close();browser.close()
    # 模擬缺少WebGL：明確顯示母版後備，不能聲稱仍有動畫。
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);ctx=browser.new_context(viewport={'width':390,'height':844});ctx.add_init_script('const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...a){return String(k).includes("webgl")?null:old.call(this,k,...a)}');page=ctx.new_page();page.goto(BASE+'?spine-lab=1');page.wait_for_timeout(3000);f=page.frames[1];assert '目前顯示人物母版' in f.locator('#notice').inner_text();assert f.get_by_role('button',name='出拳',exact=True).is_disabled();page.screenshot(path=str(OUT/'webgl-fallback.png'));report['cases'].append({'engine':'chromium','webglFailureFallback':True});ctx.close();browser.close()
    # 獨立審閱檔不需要網絡：同一資料與官方Runtime，不是另一套假播放器。
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();external=[];page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and '127.0.0.1' not in r.url else None);page.goto('http://127.0.0.1:5275/review.html');page.wait_for_function('__spineLab?.ready');assert external==[];tap(page,'出拳');page.wait_for_timeout(1300);assert page.evaluate('__spineLab.metrics.invalidFrames')==0;report['offlineReview']={'externalRequests':external,'actualSpine':True};ctx.close();browser.close()
    (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SPINE_BROWSER_PASS',len(report['cases']))
