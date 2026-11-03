"""連續頸面修正：兩引擎、左右、三段及實際App頭頸近鏡錄影。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-neck-v02';OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:5277/'
report={'actualIphone':False,'animationAccepted':False,'cameraOverrideOnlyForCloseup':True,'cases':[]}
with sync_playwright() as p:
    for engine in ['chromium','webkit']:
        b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path='/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh')
        c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?spine-lab=1');page.locator('iframe').wait_for();f=page.frames[1];f.wait_for_function('__spineLab?.ready');saved=page.evaluate('JSON.stringify(localStorage)')
        for label,delay in [('待機',800),('出拳',1700),('受擊',1500)]:f.get_by_role('button',name=label,exact=True).click();page.wait_for_timeout(delay)
        for face in ['right','left']:
            if face=='left':f.get_by_role('button',name='轉向',exact=True).click()
            for name,t in [('idle',.8),('attack',.35),('hurt',.19)]:
                f.evaluate('([n,t])=>__spineLab.inspect(n,t)',[name,t]);page.wait_for_timeout(100)
                if engine=='chromium':page.screenshot(path=str(OUT/f'{face}-{name}.png'))
            assert f.evaluate('__spineLab.metrics.invalidFrames')==0
        assert page.evaluate('JSON.stringify(localStorage)')==saved
        assert f.evaluate('__spineLab.failures')==[] and not errors,(errors,f.evaluate('__spineLab.failures'))
        report['cases'].append({'engine':engine,'viewport':[390,844],'realTimeActions':True,'bothDirections':True,'allThreePoses':True,'noStorageMutation':True,'invalidFrames':0,'pageerrors':errors});c.close();b.close()
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,record_video_dir=str(ROOT/'.local-online/spine-neck/video'),record_video_size={'width':390,'height':844});page=c.new_page();page.goto(BASE+'?spine-lab=1');page.locator('iframe').wait_for();f=page.frames[1];f.wait_for_function('__spineLab?.ready')
    # 只放大整個鏡頭供看接點，不改人物骨長、部件倍率或正式頁面鏡頭。
    f.evaluate('''()=>{const p=__spineLab.player;Object.assign(p.config.viewport,{x:-210,y:920,width:420,height:650,transitionTime:0});p.setViewport('idle')}''')
    f.evaluate('''async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),act=n=>document.querySelector('[data-action='+n+']').click();act('idle');await wait(1400);act('attack');await wait(1800);act('hurt');await wait(1500);document.getElementById('speed').click();document.getElementById('speed').click();act('hurt');await wait(4700);act('idle');await wait(500)}''')
    assert f.evaluate('__spineLab.metrics.invalidFrames')==0 and f.evaluate('__spineLab.failures')==[]
    report['closeup']={'realTime':True,'manualFrameSynthesis':False,'sameWholeActorCamera':True,'speeds':[1,.25],'metrics':f.evaluate('__spineLab.metrics')};video=page.video;c.close();video.save_as(str(OUT/'neck-closeup.webm'));b.close()
    (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SPINE_NECK_BROWSER_PASS')
