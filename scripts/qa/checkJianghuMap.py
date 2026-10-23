"""江湖地圖手機驗收：只使用隔離本機存檔，不呼叫多人寫入服務。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json, os, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/jianghu-map'
OUT.mkdir(parents=True, exist_ok=True)
FRAMES = ROOT / '.local-online/jianghu-map/glow-frames'
FRAMES.mkdir(parents=True, exist_ok=True)
BASE = os.getenv('MAP_QA_BASE', 'http://127.0.0.1:5173/')
SETUP = (ROOT / 'scripts/qa/gachaCodexSetup.js').read_text().replace(
    "await import('/src/store/ancestryStore.ts')",
    "await import((await(await fetch('/src/main.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
report = {'seed': 42, 'jade': {'free': 600, 'paidTest': 0}, 'dpr': 2, 'cases': []}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  record_video_dir='/tmp/jianghu-map-video', record_video_size={'width': 390, 'height': 844})
    context.route('**/*.supabase.co/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_timeout(1600)
    page.evaluate(SETUP, {'jade': {'free': 600, 'paidTest': 0}})

    def dock(name):
        page.get_by_role('navigation', name='分卷').get_by_role('button', name=name, exact=True).click()

    def shot(name):
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(250)
        page.screenshot(path=str((FRAMES if name.startswith('glow-') else OUT) / name))

    def account():
        return page.evaluate("""() => { const m=window.qa.anc.getState().meta, c=window.qa.life.getState().state.character;
          return {jade:m.jade,gacha:m.gacha,manuals:m.manuals??{},pages:m.pages??0,skills:c.skills,equipment:c.equipment,nature:c.nature}; }""")

    initial = account()
    dock('鎮居')
    dock('江湖')
    page.locator('.ink-jianghu-map-art').wait_for()
    page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth === 1024")
    assert page.get_by_role('navigation', name='江湖功能').get_by_role('button').count() == 4
    assert page.locator('#ink-jianghu-menu .ink-feature-list').count() == 0
    assert page.locator('#ink-jianghu-menu').get_by_role('button', name='心性', exact=True).count() == 0
    shot('after-390.png')
    # 真正動畫連續抽樣，不能只以靜態圖聲稱高亮有動態。
    opacity_samples = []
    for i in range(12):
        opacity_samples.append(float(page.locator('.ink-map-destination--gacha .ink-map-destination-light').evaluate('(el)=>getComputedStyle(el).opacity')))
        if i in [0, 3, 6, 9]:
            shot(f'glow-{i}.png')
        page.wait_for_timeout(330)
    assert max(opacity_samples) - min(opacity_samples) > .1
    report['glow_opacity_range'] = [min(opacity_samples), max(opacity_samples)]
    frames = [Image.open(FRAMES / f'glow-{i}.png').convert('RGB').resize((390, 844)).quantize(colors=160) for i in [0, 3, 6, 9]]
    frames[0].save(OUT / 'landmark-glow.gif', save_all=True, append_images=frames[1:], duration=1100, loop=0)
    # 點建築範圍和其下真文字，都要進同一原有功能頁；返回恢復地圖。
    for label, selector, key in [('秘笈閣', '#ink-gacha', 'gacha'),
                                  ('華山論劍', '.ink-huashan-panel', 'huashan'),
                                  ('開宗立派', '.ink-sect-founder-panel', 'founder')]:
        destination = page.get_by_role('button', name=label, exact=True)
        destination.click(position={'x': destination.bounding_box()['width'] * .5, 'y': destination.bounding_box()['height'] * .5})
        page.locator(selector).wait_for()
        assert page.locator('.ink-jianghu-map').count() == 0
        shot(f'detail-{key}.png')
        page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
        page.locator('.ink-jianghu-map').wait_for()
        assert page.locator('.ink-play-body').evaluate('(el)=>el.scrollTop') < 2
        page.locator(f'.ink-map-destination--{key} .ink-map-destination-name').click()
        page.locator(selector).wait_for()
        page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
        report['cases'].append({'landmark': label, 'building_and_label_click': True, 'back_to_map': True})

    page.get_by_role('button', name='江湖風雲', exact=True).click()
    page.locator('#ink-online').wait_for()
    shot('detail-online.png')
    page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
    # 點底部分卷無論身處哪個子頁，都直接回地圖。
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    dock('江湖')
    page.locator('.ink-jianghu-map').wait_for()
    assert page.locator('#ink-gacha').count() == 0
    # 主頁捷徑仍直接進功能，裝備／抽卡核心不因改導航而改變。
    for name, selector in [('秘笈閣', '#ink-gacha'), ('論劍', '.ink-huashan-panel')]:
        dock('鎮居')
        page.get_by_role('navigation', name='功能入口').get_by_role('button', name=name, exact=True).click()
        page.locator(selector).wait_for()
        dock('江湖')
        page.locator('.ink-jianghu-map').wait_for()

    # 心性整合至人物原有屬性頁，保留四項真實數值及說明。
    dock('人物')
    page.get_by_role('listitem').filter(has_text='五維與心性').click()
    page.locator('.ink-nature-card').first.wait_for()
    assert page.locator('.ink-nature-card').count() == 4
    shot('person-nature.png')
    dock('江湖')
    final_account = account()
    assert final_account == initial, json.dumps({'before': initial, 'after': final_account}, ensure_ascii=False)
    report['navigation_keeps_account'] = True
    print('navigation_and_person_pass', flush=True)

    phone_results = []
    for width, height in [(320, 568), (390, 720), (390, 844), (420, 896)]:
        page.set_viewport_size({'width': width, 'height': height})
        dock('江湖')
        page.wait_for_timeout(250)
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
        assert page.locator('.ink-map-destination').evaluate_all('(els)=>els.every(el=>el.getBoundingClientRect().width>=44 && el.getBoundingClientRect().height>=44)')
        assert page.locator('.ink-map-destination-name').evaluate_all('(els)=>els.every(el=>el.getBoundingClientRect().height>=44 && Number.parseFloat(getComputedStyle(el).fontSize)>=16)')
        # 短屏可自然縱捲到城鎮，最底地標及題字不被固定導航遮住。
        page.locator('.ink-map-destination--online .ink-map-destination-name').scroll_into_view_if_needed()
        name_box = page.locator('.ink-map-destination--online .ink-map-destination-name').bounding_box()
        dock_box = page.get_by_role('navigation', name='分卷').bounding_box()
        assert name_box['y'] + name_box['height'] <= dock_box['y'], (name_box, dock_box)
        assert page.get_by_role('navigation', name='分卷').evaluate('(el)=>parseFloat(getComputedStyle(el,"::before").height)<=el.getBoundingClientRect().height'), '地圖導航漸層不可伸到地標名稱上方'
        shot(f'map-{width}-{height}.png')
        page.locator('.ink-map-destination--online .ink-map-destination-name').click()
        page.locator('#ink-online').wait_for()
        page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
        assert page.locator('.ink-play-body').evaluate('(el)=>el.scrollTop') < 2
        phone_results.append({'viewport': [width, height], 'touch44': True, 'label_font_min16': True, 'town_above_dock': True})
        print('phone_pass', width, height, flush=True)
    report['phones'] = phone_results
    page.set_viewport_size({'width': 390, 'height': 844})
    page.emulate_media(reduced_motion='reduce')
    assert page.locator('.ink-map-destination-light').evaluate_all('(els)=>els.every(el=>getComputedStyle(el).animationName==="none")')
    # 鍵盤焦點仍可操作；名稱有清晰焦點框。
    page.get_by_role('button', name='秘笈閣', exact=True).focus()
    shot('keyboard-focus.png')
    page.keyboard.press('Enter')
    page.locator('#ink-gacha').wait_for()
    dock('江湖')
    page.get_by_role('button', name='開啟設定', exact=True).click()
    page.get_by_role('dialog').wait_for()
    page.keyboard.press('Escape')
    # 位圖下載失敗仍能進入各功能。
    page.route('**/jianghu-map-watercolor.webp*', lambda route: route.abort())
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.evaluate(SETUP, {'jade': {'free': 600, 'paidTest': 0}})
    page.locator('.ink-jianghu-map--fallback').wait_for()
    shot('image-fallback.png')
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    page.locator('#ink-gacha').wait_for()
    assert not errors, errors
    report.update({'pageerrors': errors, 'reduced_motion': True, 'keyboard': True, 'image_failure_navigation': True})
    video = page.video
    context.close()
    browser.close()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video.path(), '-an', '-vf', 'fps=20', '-c:v', 'libx264', '-crf', '27', '-pix_fmt', 'yuv420p', str(OUT / 'navigation.mp4')], check=True)

font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 20)
board = Image.new('RGB', (800, 950), '#f3ebdc')
draw = ImageDraw.Draw(board)
draw.text((12, 8), '江湖地圖｜390×844 DPR2 · seed42 · 玉石600／0', font=font, fill='#332e28')
for i, (file, label) in enumerate([('before-390.png', '改前：功能列表'), ('after-390.png', '改後：直接點選地標')]):
    x = i * 400 + 5
    draw.text((x + 8, 42), label, font=font, fill='#332e28')
    board.paste(Image.open(OUT / file).convert('RGB').resize((390, 844)), (x, 83))
    if i:
        draw.rectangle((x + 1, 83 + 80, x + 388, 83 + 728), outline='#b74335', width=2)
board.save(OUT / 'comparison.png')
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('JIANGHU_MAP_BROWSER_PASS', flush=True)
