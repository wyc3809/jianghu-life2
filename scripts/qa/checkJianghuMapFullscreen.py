"""江湖全畫面地圖驗收：隔離人物，只操作導航，不連接多人服務。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json, os

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/jianghu-map-fullscreen'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv('MAP_QA_BASE', 'http://127.0.0.1:5173/')
SETUP = (ROOT / 'scripts/qa/gachaCodexSetup.js').read_text().replace(
    "await import('/src/store/ancestryStore.ts')",
    "await import((await(await fetch('/src/main.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
report = {'seed': 42, 'jade': {'free': 600, 'paidTest': 0}, 'dpr': 2, 'phones': []}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  is_mobile=True, has_touch=True, reduced_motion='reduce')
    context.route('**/*.supabase.co/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_timeout(1600)
    page.evaluate(SETUP, {'jade': {'free': 600, 'paidTest': 0}})
    page.wait_for_timeout(4500)

    def shot(name):
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(OUT / name))

    def dock(name):
        page.get_by_role('navigation', name='分卷').get_by_role('button', name=name, exact=True).click()

    def account():
        return page.evaluate("""() => { const m=window.qa.anc.getState().meta, c=window.qa.life.getState().state.character;
          return {jade:m.jade,gacha:m.gacha,manuals:m.manuals??{},pages:m.pages??0,skills:c.skills,equipment:c.equipment,nature:c.nature}; }""")

    def full_map():
        page.locator('.ink-jianghu-map').wait_for()
        page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth === 1024")
        assert page.locator('.ink-hud').count() == 0
        assert page.get_by_role('navigation', name='分卷').count() == 0
        assert page.locator('.ink-task-dock').count() == 0
        assert page.get_by_role('button').count() == 5
        # 地圖、題字及返回均在視窗內；不用 scroll_into_view 掩蓋溢出。
        return page.evaluate("""() => {
          const nodes=[...document.querySelectorAll('.ink-jianghu-map-art,.ink-map-destination,.ink-map-destination-name,.ink-map-back')];
          const rects=nodes.map(el=>{const r=el.getBoundingClientRect();return {name:el.className,x:r.x,y:r.y,w:r.width,h:r.height};});
          if(!rects.every(r=>r.x>=-1&&r.y>=-1&&r.x+r.w<=innerWidth+1&&r.y+r.h<=innerHeight+1))throw Error(JSON.stringify(rects));
          for(const el of document.querySelectorAll('.scroll-shell,.ink-play-body')) {
            if(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)throw Error('overflow '+el.className);
          }
          for(const el of document.querySelectorAll('.ink-map-destination,.ink-map-destination-name,.ink-map-back')) {
            const r=el.getBoundingClientRect();if(r.width<44||r.height<44)throw Error('touch size');
            const at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
            if(!el.contains(at)&&!at?.contains(el))throw Error('occluded '+el.className);
          }
          const art=document.querySelector('.ink-jianghu-map-art').getBoundingClientRect();
          if(Math.abs(art.width/art.height-2/3)>.001)throw Error('art distorted');
          return {rects,bodyScroll:document.querySelector('.ink-play-body').scrollTop};
        }""")

    initial = account()
    full_map()
    shot('after-390.png')
    entries = [('秘笈閣', '#ink-gacha', 'gacha'), ('華山論劍', '.ink-huashan-panel', 'huashan'),
               ('開宗立派', '.ink-sect-founder-panel', 'founder'), ('江湖風雲', '#ink-online', 'online')]
    for width, height in [(320, 480), (320, 568), (390, 600), (390, 720), (390, 844), (420, 896)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(200)
        layout = full_map()
        shot(f'map-{width}-{height}.png')
        # 每個尺寸逐一點建築及題字，兩者均須直接打開原功能。
        for label, selector, key in entries:
            for target in [f'.ink-map-destination--{key}', f'.ink-map-destination--{key} .ink-map-destination-name']:
                page.locator(target).click()
                page.locator(selector).wait_for()
                assert page.locator('.ink-hud').count() == 1
                assert page.get_by_role('navigation', name='分卷').count() == 1
                page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
                full_map()
        # 返回後主頁恢復頂欄與底部導航，量度亦須重新安裝。
        page.get_by_role('button', name='返回鎮居', exact=True).click()
        assert page.locator('.ink-hud').count() == 1
        dock('江湖')
        full_map()
        assert page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--ink-dock-height")') == '0px'
        report['phones'].append({'viewport': [width, height], 'layout': layout, 'eight_destination_clicks': True, 'back_home_and_reenter': True})
        print('PHONE_PASS', width, height, flush=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    dock('江湖')
    full_map()
    page.get_by_role('button', name='返回鎮居', exact=True).click()
    assert float(page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--ink-dock-height").replace("px", "")')) > 44
    page.get_by_role('navigation', name='功能入口').get_by_role('button', name='論劍', exact=True).click()
    page.locator('.ink-huashan-panel').wait_for()
    dock('江湖')
    page.get_by_role('button', name='返回鎮居', exact=True).focus()
    page.keyboard.press('Enter')
    dock('江湖')
    page.get_by_role('button', name='秘笈閣', exact=True).focus()
    page.keyboard.press('Enter')
    page.locator('#ink-gacha').wait_for()
    dock('江湖')
    assert page.locator('.ink-map-destination-light').evaluate_all('(els)=>els.every(el=>getComputedStyle(el).animationName==="none")')
    assert account() == initial
    # 模擬瀏覽器工具列收放及橫向安全區，仍無溢出。
    for height in [664, 844, 600, 720]:
        page.set_viewport_size({'width': 390, 'height': height})
        full_map()
    page.add_style_tag(content='.scroll-shell--play.scroll-shell--jianghu-map {padding: 24px 8px 34px;}')
    full_map()
    shot('safe-area-390-720.png')
    page.emulate_media(reduced_motion='no-preference')
    samples=[]
    for _ in range(10):
        samples.append(float(page.locator('.ink-map-destination--gacha .ink-map-destination-light').evaluate('(el)=>getComputedStyle(el).opacity')))
        page.wait_for_timeout(350)
    assert max(samples)-min(samples)>.1
    page.route('**/jianghu-map-watercolor.webp*', lambda route: route.abort())
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(1600)
    page.evaluate(SETUP, {'jade': {'free': 600, 'paidTest': 0}})
    page.locator('.ink-jianghu-map--fallback').wait_for()
    assert page.get_by_role('button').count()==5
    shot('image-fallback.png')
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    page.locator('#ink-gacha').wait_for()
    assert not errors, errors
    report.update({'account_unchanged': True, 'keyboard': True, 'reduced_motion': True,
                   'glow_opacity_range': [min(samples),max(samples)], 'fallback_navigation': True, 'pageerrors': errors})
    (OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    browser.close()

font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 20)
board = Image.new('RGB', (800, 950), '#f8f1e5')
draw = ImageDraw.Draw(board)
draw.text((12, 8), '江湖地圖｜390×844、種子42、玉石600、相同人物', font=font, fill='#302b25')
for x, name, title in [(5,'before-390.png','修改前：人物與導航佔用空間'),(405,'after-390.png','修改後：一屏全圖、左上返回')]:
    draw.text((x, 42), title, font=font, fill='#302b25')
    board.paste(Image.open(OUT/name).convert('RGB').resize((390,844)),(x,80))
draw.rectangle((405,80,794,923),outline='#a33d32',width=2)
board.save(OUT/'comparison.png')
print('FULLSCREEN_MAP_BROWSER_PASS')
