"""正式構建的iOS安全區排版回歸；只替換CSS env輸入，不覆寫待測排版規則。"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import copy, json, os, re

ROOT = Path(__file__).resolve().parents[2]
MODE = os.getenv('IOS_SAFE_MODE', 'after')
BASE = os.getenv('IOS_SAFE_BASE', 'http://127.0.0.1:5176/')
OUT = ROOT/'production/qa/evidence/redesign/ios-safe-area'/MODE
OUT.mkdir(parents=True, exist_ok=True)
FIXTURE = json.loads((ROOT/'.local-online/release-ea089/fixtures.json').read_text())[0]
SIZES = [(320,568,20,0),(375,667,20,0),(390,844,47,34),(393,852,59,34),(430,932,59,34),(768,1024,24,20)]
report = {'mode': MODE, 'base': BASE, 'safeAreaSimulation': 'replace CSS env inputs in served stylesheet only',
          'nativeRuntime': False, 'fixtureSeed': 42, 'cases': []}

def rects(page):
    return page.evaluate('''()=>{const box=s=>{const e=document.querySelector(s);if(!e)return null;
      const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
      return {root:box('#root'),shell:box('.scroll-shell--play'),hud:box('.ink-hud'),name:box('.ink-name'),wallet:box('.ink-hud-wallet'),
        scene:box('.ink-home-scene'),quick:box('.ink-quick'),task:box('.ink-task-bar'),nav:box('.ink-bottom-dock'),
        shellPaddingTop:parseFloat(getComputedStyle(document.querySelector('.scroll-shell--play')).paddingTop),
        rootPaddingTop:parseFloat(getComputedStyle(document.querySelector('#root')).paddingTop)};}''')

with sync_playwright() as p:
    for engine in ['chromium', 'webkit']:
        browser = (p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox','--enable-unsafe-swiftshader'])
                   if engine == 'chromium' else p.webkit.launch(executable_path=os.getenv('IOS_SAFE_WEBKIT_EXECUTABLE')))
        for native in [True, False]:
            sizes=[(*size,False) for size in SIZES]+[(393,852,59,34,True)] if native else [(390,844,0,0,False)]
            for width,height,top,bottom,long_name in sizes:
                context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=2,
                    is_mobile=True, has_touch=True, reduced_motion='reduce')
                context.route('**/*.supabase.co/**', lambda route: route.abort())
                context.route('**/fonts.googleapis.com/**', lambda route: route.abort())
                context.route('**/fonts.gstatic.com/**', lambda route: route.abort())
                def css(route):
                    response=route.fetch()
                    body=response.text()
                    for edge, value in [('top',top),('bottom',bottom),('left',0),('right',0)]:
                        body=re.sub(r'env\(safe-area-inset-'+edge+r'(?:,\s*[^)]+)?\)',f'{value}px',body)
                    route.fulfill(response=response,body=body)
                context.route('**/*.css', css)
                fixture=copy.deepcopy(FIXTURE)
                fixture['state']['character']['name']='江湖驗圖長名少俠' if long_name else '驗圖少俠'
                context.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';
                  localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));
                  localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));
                  localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));})();''')
                if native: context.add_init_script('window.webkit={messageHandlers:{bridge:{postMessage(){}}}}')
                page=context.new_page(); errors=[]; bad=[]
                page.on('pageerror',lambda error: errors.append(str(error)))
                page.on('response',lambda response: bad.append(response.status)
                        if response.status>=400 and urlparse(response.url).netloc==urlparse(BASE).netloc else None)
                page.goto(BASE,wait_until='domcontentloaded')
                page.get_by_role('button',name=re.compile('^續寫前緣')).click()
                page.locator('.ink-quick').wait_for()
                page.wait_for_timeout(500)
                if page.locator('.ink-offline-modal-btn').count(): page.locator('.ink-offline-modal-btn').click()
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(150)
                data=rects(page)
                assert data['rootPaddingTop']==(top if native else 0),data
                if MODE=='after':
                    assert data['shellPaddingTop']==(8 if native else 12),data
                    assert data['hud']['y']>=top and data['hud']['y']<=top+14,data
                    assert data['name']['right']<=data['wallet']['x']+1,data
                    assert data['quick']['bottom']<=data['task']['y']+1,data
                    assert data['scene']['height']>=90,data
                    assert data['nav']['bottom']<=height+1,data
                    # 所有點擊中心都在可見安全範圍，且未被其他元素遮住。
                    checks=page.locator('.ink-bottom-dock button, .ink-quick button, .ink-task-bar summary, .ink-task-bar .ink-goal-btn').evaluate_all('''(els,bottom)=>els.map(el=>{
                      const r=el.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2;
                      const hit=document.elementFromPoint(cx,cy);
                      return {text:el.getAttribute('aria-label')||el.textContent.trim(),height:r.height,width:r.width,
                        safe:r.y>=0&&r.bottom<=innerHeight-bottom+1,hit:hit&&el.contains(hit)};})''',bottom)
                    assert all(c['safe'] and c['hit'] and c['height']>=44 and c['width']>=44 for c in checks),checks
                    data['touchTargets']=checks
                tag=f'{engine}-{"native" if native else "web"}-{width}-{height}'+('-long-name' if long_name else '')
                page.screenshot(path=str(OUT/f'{tag}.png'))
                # 只在一組完整手機尺寸測試子頁、地圖、返回及任務詳情，避免反覆重跑相同流程。
                if MODE=='after' and width==393 and not long_name:
                    page.locator('.ink-task-details summary').click()
                    assert page.locator('.ink-task-details').evaluate('e=>e.open')
                    page.screenshot(path=str(OUT/f'{engine}-task-open.png'))
                    page.locator('.ink-task-details summary').click()
                    page.get_by_role('navigation',name='分卷').get_by_role('button',name='人物',exact=True).click()
                    assert rects(page)['shellPaddingTop']==12
                    page.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click()
                    page.locator('.ink-jianghu-map').wait_for()
                    assert page.locator('.ink-hud').count()==0
                    assert page.locator('.ink-bottom-dock').count()==0
                    assert page.locator('.scroll-shell--jianghu-map').evaluate('e=>parseFloat(getComputedStyle(e).paddingTop)')==0
                    page.get_by_role('button',name='返回鎮居',exact=True).click()
                    assert rects(page)['shellPaddingTop']==8
                    data['personMapBackTaskDetails']=True
                assert not errors and not bad,(errors,bad)
                report['cases'].append({'engine':engine,'nativeMarker':native,'width':width,'height':height,'longName':long_name,
                    'safeTop':top,'safeBottom':bottom,'layout':data,'pageerrors':errors,'httpErrors':bad})
                context.unroute_all(behavior='wait')
                context.close()
        browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('IOS_SAFE_AREA_PASS',MODE,len(report['cases']))
