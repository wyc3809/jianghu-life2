"""正式構建／正式網站驗證：讀取隔離schema-v1存檔，無DEV模組或引擎替身。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import json, os, re
ROOT=Path(__file__).resolve().parents[2]
BASE=os.getenv('SPAR_RELEASE_BASE','http://127.0.0.1:5175/jianghu-life2/')
LABEL=os.getenv('SPAR_RELEASE_LABEL','local')
OUT=ROOT/'production/qa/evidence/redesign/release-ea089'/LABEL
OUT.mkdir(parents=True,exist_ok=True)
EXPECTED='EA0.89.0'
fixtures=json.loads((ROOT/'.local-online/release-ea089/fixtures.json').read_text())
selected=json.loads(os.getenv('SPAR_RELEASE_COUNTS','[7]'))
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    cases=[]
    for fixture in fixtures:
        if fixture['count'] not in selected:continue
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce')
        context.route('**/*.supabase.co/**',lambda route:route.abort())
        context.add_init_script('''(()=>{const fixture='''+json.dumps(fixture,ensure_ascii=False)+''';
          if(!localStorage.getItem('qa-release-fixture')){
            localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:fixture.state}));
            localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(fixture.meta));
            localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));
            localStorage.setItem('qa-release-fixture','1');}
          window.qaReleaseTrace=[];let last='';
          const sample=()=>{const root=document.querySelector('.ink-spar-boss-screen');if(!root)return;
            const round=Number(root.querySelector('.ink-unified-round')?.textContent.match(/[0-9]+/)?.[0]);
            const call=root.querySelector('.ink-unified-callout')?.textContent||'';
            const slots=[...root.querySelectorAll('.ink-unified-volumes li')];const active=slots.findIndex(el=>el.classList.contains('is-active'))+1;
            const side=call.includes('還擊')?'foe':active&&call.startsWith('卷')?'hero':null;
            if(!side)return;const key=round+':'+side+':'+(side==='hero'?active:0);if(key===last)return;last=key;
            window.qaReleaseTrace.push({side,round,volume:side==='hero'?active:null,callout:call,time:performance.now()});};
          document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(sample).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});sample();});
        })();''')
        page=context.new_page();errors=[];bad=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('response',lambda response:bad.append({'url':response.url,'status':response.status}) if response.status>=400 and urlparse(response.url).netloc==urlparse(BASE).netloc else None)
        page.goto(BASE,wait_until='domcontentloaded')
        bundle=page.evaluate('''async expected=>{const url=document.querySelector('script[type="module"]').src;
          const text=await(await fetch(url,{cache:'no-store'})).text();return {url,version:expected,match:text.includes(expected)};}''',EXPECTED)
        assert bundle['match'],bundle
        page.get_by_role('button',name=re.compile('^續寫前緣')).click()
        page.locator('.scroll-shell--play').wait_for()
        page.wait_for_timeout(500)
        if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
        page.locator('.ink-spar-boss-screen').wait_for(timeout=90000)
        page.wait_for_function('(last)=>window.qaReleaseTrace.some(e=>e.side==="hero"&&e.round===1&&e.volume===last)',arg=fixture['count'],timeout=60000)
        page.screenshot(path=str(OUT/f'round-one-{fixture["count"]}.png'))
        assert '第 1 回合' in page.locator('.ink-unified-round').inner_text()
        page.wait_for_function('window.qaReleaseTrace.some(e=>e.side==="foe"&&e.round===1)',timeout=30000)
        trace=page.evaluate('window.qaReleaseTrace')
        expected=[('hero',1,v) for v in range(1,fixture['count']+1)]+[('foe',1,None)]
        actual=[(e['side'],e['round'],e['volume']) for e in trace[:len(expected)]]
        assert actual==expected,actual
        assert not errors and not bad,(errors,bad)
        cases.append({'volumes':fixture['count'],'bundle':bundle,'trace':trace,'pageerrors':errors,'http_errors':bad})
        context.close()
    browser.close()
(OUT/'spar-browser.json').write_text(json.dumps({'base':BASE,'version':EXPECTED,'storedFixtureSchema':1,'fixtureSeed':42,'fixtureHealth':5000,
  'fixtureMartial':0,'fixtureEquipment':None,'fixtureStage':1,'devImports':False,'engineMock':False,'directBossSelection':False,'cases':cases},ensure_ascii=False,indent=2)+'\n')
print('SPAR_ROUNDS_BUILT_PASS',LABEL)
