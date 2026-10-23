"""正式構建驗收：普通介面建立人物，無開發模組／測試存檔注入。"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/os.getenv('MAP_BUILT_OUT','production/qa/evidence/redesign/jianghu-map-fullscreen')
OUT.mkdir(parents=True,exist_ok=True)
EXPECTED_VERSION=os.getenv('MAP_EXPECTED_VERSION')
BASE=os.getenv('MAP_BUILT_BASE','http://127.0.0.1:5175/jianghu-life2/')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,
                               is_mobile=True,has_touch=True,reduced_motion='reduce')
    context.route('**/*.supabase.co/**',lambda route:route.abort())
    page=context.new_page()
    errors,bad=[],[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('response',lambda response:bad.append({'url':response.url,'status':response.status})
            if response.status>=400 and urlparse(response.url).netloc==urlparse(BASE).netloc else None)
    page.goto(BASE,wait_until='domcontentloaded')
    bundle=page.evaluate('''async expected=>{const url=document.querySelector('script[type="module"]').src;
        const body=await(await fetch(url,{cache:'no-store'})).text();return {url,version:expected,match:!expected||body.includes(expected)};}''',EXPECTED_VERSION)
    assert bundle['match'],bundle
    page.get_by_role('button',name='開卷',exact=True).click()
    page.get_by_label('姓名',exact=True).fill('驗圖少俠')
    page.get_by_role('button',name='翻開少時',exact=True).click()
    for _ in range(3):
        page.get_by_role('region',name='少時往事').locator('button.ink-choice').first.click()
    page.get_by_role('button',name='開始遊戲',exact=True).click()
    page.locator('.scroll-shell--play').wait_for()
    nav=lambda:page.get_by_role('navigation',name='分卷')
    nav().get_by_role('button',name='江湖',exact=True).click()
    page.wait_for_timeout(4500)
    for width,height in [(320,568),(390,844),(420,896)]:
        page.set_viewport_size({'width':width,'height':height})
        page.locator('.ink-jianghu-map').wait_for()
        page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth===1024")
        assert page.locator('.ink-hud').count()==0 and nav().count()==0
        assert page.get_by_role('button').count()==5
        assert page.locator('.ink-play-body').evaluate('(el)=>el.scrollHeight<=el.clientHeight+1')
        assert page.locator('.ink-map-destination-name').evaluate_all('els=>els.every(el=>{const r=el.getBoundingClientRect();return r.y>=0&&r.bottom<=innerHeight&&r.x>=0&&r.right<=innerWidth})')
        page.screenshot(path=str(OUT/f'built-{width}-{height}.png'))
        for label,selector in [('秘笈閣','#ink-gacha'),('華山論劍','.ink-huashan-panel'),('開宗立派','.ink-sect-founder-panel'),('江湖風雲','#ink-online')]:
            page.get_by_role('button',name=label,exact=True).click()
            page.locator(selector).wait_for()
            assert page.locator('.ink-hud').count()==1 and nav().count()==1
            page.get_by_role('button',name='‹ 返回江湖',exact=True).click()
        page.get_by_role('button',name='返回鎮居',exact=True).click()
        assert page.locator('.ink-hud').count()==1 and nav().count()==1
        nav().get_by_role('button',name='江湖',exact=True).click()
    if EXPECTED_VERSION:
        page.get_by_role('button',name='返回鎮居',exact=True).click()
        page.get_by_role('button',name='開啟設定',exact=True).click()
        page.get_by_role('dialog').wait_for()
        assert EXPECTED_VERSION in page.locator('.ink-settings-version').inner_text()
        page.screenshot(path=str(OUT/'settings-version.png'))
    assert not errors and not bad,(errors,bad)
    (OUT/'built-browser.json').write_text(json.dumps({'base':BASE,'bundle':bundle,'ordinary_ui':True,'fixture_injection':False,
        'phones':[[320,568],[390,844],[420,896]],'four_destinations_and_back':True,'pageerrors':errors,'http_errors':bad},ensure_ascii=False,indent=2)+'\n')
    browser.close()
print('FULLSCREEN_MAP_BUILT_PASS')
