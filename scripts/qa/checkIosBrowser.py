"""mobile正式構建的瀏覽器冒煙測試；只模擬原生識別／安全區，不冒稱真機。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json, re
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/testflight-prep'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    results=[]
    for native in [True,False]:
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce')
        context.route('**/*.supabase.co/**',lambda route:route.abort())
        context.route('**/fonts.googleapis.com/**',lambda route:route.abort())
        context.route('**/fonts.gstatic.com/**',lambda route:route.abort())
        if native: context.add_init_script('window.webkit={messageHandlers:{bridge:{postMessage(){}}}}')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto('http://127.0.0.1:5176/',wait_until='domcontentloaded')
        page.get_by_role('button',name='開卷',exact=True).click()
        assert page.locator('html').evaluate('el=>el.classList.contains("native-ios")')==native
        page.get_by_label('姓名',exact=True).fill('驗圖少俠')
        page.get_by_role('button',name='翻開少時',exact=True).click()
        for _ in range(3):page.get_by_role('region',name='少時往事').locator('button.ink-choice').first.click()
        page.get_by_role('button',name='開始遊戲',exact=True).click()
        page.locator('.scroll-shell--play').wait_for()
        page.wait_for_timeout(4500)
        nav=lambda:page.get_by_role('navigation',name='分卷')
        nav().get_by_role('button',name='江湖',exact=True).click()
        if native:
            # 瀏覽器沒有實體瀏海；以明確padding測試47px頂部及34px底部。
            page.add_style_tag(content='html.native-ios #root{padding-top:47px}html.native-ios .scroll-shell--jianghu-map{padding-bottom:34px}')
        for width,height in ([(320,568),(390,844),(768,1024)] if native else [(390,844)]):
            page.set_viewport_size({'width':width,'height':height})
            page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth===1024")
            assert nav().count()==0 and page.locator('.ink-hud').count()==0
            assert page.locator('.ink-play-body').evaluate('el=>el.scrollHeight<=el.clientHeight+1')
            assert page.locator('.ink-map-destination-name').evaluate_all('els=>els.every(el=>{const r=el.getBoundingClientRect();return r.y>=0&&r.bottom<=innerHeight&&r.x>=0&&r.right<=innerWidth})')
            page.screenshot(path=str(OUT/f'{"native" if native else "web"}-{width}-{height}.png'))
            for name,selector in [('秘笈閣','#ink-gacha'),('華山論劍','.ink-huashan-panel'),('開宗立派','.ink-sect-founder-panel'),('江湖風雲','#ink-online')]:
                page.get_by_role('button',name=name,exact=True).click()
                page.locator(selector).wait_for()
                page.get_by_role('button',name='‹ 返回江湖',exact=True).click()
        page.get_by_role('button',name='返回鎮居',exact=True).click()
        page.reload(wait_until='domcontentloaded')
        page.get_by_role('button',name=re.compile('^續寫前緣')).click()
        page.locator('.scroll-shell--play').wait_for()
        page.wait_for_timeout(500)
        if page.locator('.ink-offline-modal-btn').count():
            page.locator('.ink-offline-modal-btn').click()
        if page.locator('.ink-jianghu-map').count():
            page.get_by_role('button',name='返回鎮居',exact=True).click()
        assert '驗圖少俠' in page.locator('.ink-hud').inner_text()
        page.get_by_role('button',name='開啟設定',exact=True).click()
        assert 'EA0.88.0' in page.locator('.ink-settings-version').inner_text()
        assert not errors,errors
        results.append({'native_detection_simulated':native,'external_cloud_and_fonts_blocked':True,'four_destinations':True,'reload_save_resume':True,'pageerrors':errors})
        context.close()
    browser.close()
(OUT/'browser.json').write_text(json.dumps({'mode':'chromium-mobile-webkit-bridge-marker-and-safe-area-simulation-not-ios-runtime','results':results},ensure_ascii=False,indent=2)+'\n')
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
board=Image.new('RGB',(800,930),'#f8f1e5');draw=ImageDraw.Draw(board)
for x,name,label in [(5,'web-390-844.png','現行網頁排版'),(405,'native-390-844.png','原生識別／安全區模擬')]:
    draw.text((x,12),label,font=font,fill='#302b25')
    board.paste(Image.open(OUT/name).convert('RGB').resize((390,844)),(x,52))
draw.rectangle((405,52,794,895),outline='#a33d32',width=2)
board.save(OUT/'safe-area-comparison.png')
print('IOS_BROWSER_PASS')
