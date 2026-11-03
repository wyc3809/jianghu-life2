"""內測構建一名人物最少30秒的瀏覽器量測；不是iPhone或長時間效能驗收。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-character'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);t=c.new_page();errors=[];t.on('pageerror',lambda e:errors.append(str(e)));start=time.perf_counter();t.goto('http://127.0.0.1:5277/?spine-lab=1');t.locator('iframe').wait_for();f=t.frames[1];f.wait_for_function('__spineLab?.ready');ready_ms=(time.perf_counter()-start)*1000;t.wait_for_timeout(2000)
    f.evaluate('''()=>{window.__spinePerf={gaps:[],callback:[],heap:[],last:null};const old=__spineLab.player.config.frame;__spineLab.player.config.frame=function(p,d){const s=__spinePerf,now=performance.now();if(s.last!==null)s.gaps.push(now-s.last);s.last=now;const begin=performance.now();old(p,d);s.callback.push(performance.now()-begin)}}''')
    for _ in range(5):
        for action in ['待機','出拳','受擊']:
            f.get_by_role('button',name=action,exact=True).click();t.wait_for_timeout(2000)
        f.evaluate('__spinePerf.heap.push(performance.memory?.usedJSHeapSize??null)')
    raw=f.evaluate('__spinePerf');stats=f.evaluate('__spineLab.metrics');assert f.evaluate('__spineLab.failures')==[];assert not errors,errors
    def summary(values):
        x=sorted(values)
        return {'count':len(x),'p50':x[int((len(x)-1)*.5)],'p95':x[int((len(x)-1)*.95)],'p99':x[int((len(x)-1)*.99)],'max':x[-1]}
    result={'context':'Chromium headless / SwiftShader / 390x844 DPR2 / internal production build / one actor / three clips / warm after 2s','actualIphone':False,'requestedWaitSeconds':30,'durationSeconds':sum(raw['gaps'])/1000,'readyObservedAtMs':ready_ms,'rafGapMs':summary(raw['gaps']),'fixedStepCallbackCpuMs':summary(raw['callback']),'heapSamplesBytes':raw['heap'],'runtimeMetrics':stats,'pageerrors':errors,'caveats':['Callback CPU does not include all WebGL draw/GPU work.','Ready time uses localhost; not native cold launch or mobile network.','30 seconds does not establish long-run memory, energy, temperature or stable iPhone FPS.']}
    (OUT/'performance.json').write_text(json.dumps(result,indent=2)+'\n');(OUT/'performance-raw.json').write_text(json.dumps(raw)+'\n');print('SPINE_PERFORMANCE_RECORDED',result['rafGapMs']);c.close();b.close()
