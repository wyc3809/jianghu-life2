"""EA0.87.0發布驗收：正式構建／正式網站，以普通介面操作隔離人物。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import json, os, re, time

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/release-ea087'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv('RELEASE_BASE', 'http://127.0.0.1:5175/jianghu-life2/')
LABEL = os.getenv('RELEASE_LABEL', 'local')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  is_mobile=True, has_touch=True, reduced_motion='reduce')
    context.route('**/*.supabase.co/**', lambda route: route.abort())
    page = context.new_page()
    errors, bad = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: bad.append({'url': response.url, 'status': response.status})
            if response.status >= 400 and urlparse(response.url).netloc == urlparse(BASE).netloc else None)
    page.goto(BASE + '?verify=EA087-' + str(int(time.time())), wait_until='domcontentloaded')
    bundle = page.evaluate("""async () => { const url=document.querySelector('script[type="module"]').src;
      const text=await(await fetch(url,{cache:'no-store'})).text();return {url,version:text.includes('EA0.87.0')}; }""")
    assert bundle['version'], bundle
    page.get_by_role('button', name='開卷', exact=True).click()
    page.get_by_label('姓名', exact=True).fill('驗版少俠')
    page.get_by_role('button', name='翻開少時', exact=True).click()
    for _ in range(3):
        region = page.get_by_role('region', name='少時往事')
        assert not re.search('十四歲|十五歲|十六歲', region.inner_text())
        region.locator('button.ink-choice').first.click()
    page.get_by_role('button', name='開始遊戲', exact=True).click()
    page.locator('.scroll-shell--play').wait_for()
    assert page.locator('.ink-hud-avatar-lv').count() == 0
    assert '歲' not in page.locator('.ink-hud').inner_text()

    def dock(name):
        page.get_by_role('navigation', name='分卷').get_by_role('button', name=name, exact=True).click()

    def shot(name):
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(250)
        page.screenshot(path=str(OUT / f'{LABEL}-{name}.png'))

    dock('江湖')
    page.locator('.ink-jianghu-map').wait_for()
    page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth===1024")
    assert page.get_by_role('navigation', name='江湖功能').get_by_role('button').count() == 4
    assert page.get_by_role('navigation', name='江湖功能').get_by_role('button', name='心性', exact=True).count() == 0
    # 開局印章與獎勵提示退場後，才拍攝地圖的穩定畫面。
    page.wait_for_timeout(4500)
    shot('map')
    page.locator('.ink-map-destination--gacha .ink-map-destination-name').click()
    page.locator('#ink-gacha').wait_for()
    assert '20%' in page.locator('.ink-codex-probability').inner_text()
    assert '80%' in page.locator('.ink-codex-probability').inner_text()
    assert page.locator('.ink-codex-pulls button').count() == 2
    assert '60 玉石' in page.locator('.ink-codex-pulls').inner_text()
    assert '600 玉石' in page.locator('.ink-codex-pulls').inner_text()
    page.get_by_role('button', name='卡池詳情', exact=True).click()
    page.get_by_role('dialog').wait_for()
    assert not re.search('[唔嘅咗喺佢揀畀俾嚟咁冇啲嗰乜咩睇攞拎撳嘢]', page.get_by_role('dialog').inner_text())
    shot('gacha-rules')
    page.get_by_role('button', name='關閉卡池詳情', exact=True).click()
    page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
    for name, selector in [('華山論劍', '.ink-huashan-panel'), ('開宗立派', '.ink-sect-founder-panel'), ('江湖風雲', '#ink-online')]:
        page.get_by_role('button', name=name, exact=True).click()
        page.locator(selector).wait_for()
        assert not re.search('需滿.*歲|年歲既長', page.locator('.ink-play-body').inner_text())
        page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
        page.locator('.ink-jianghu-map').wait_for()
    # 在內容頁點底部江湖，仍直接回到地圖。
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    dock('江湖')
    page.locator('.ink-jianghu-map').wait_for()
    assert page.locator('#ink-gacha').count() == 0
    dock('人物')
    assert '歲' not in page.locator('.ink-play-body').inner_text()
    shot('person')
    page.get_by_role('listitem').filter(has_text='五維與心性').click()
    assert page.locator('.ink-nature-card').count() == 4
    shot('nature')
    dock('江湖')
    page.get_by_role('button', name='開啟設定', exact=True).click()
    page.get_by_role('dialog').wait_for()
    assert 'EA0.87.0' in page.locator('.ink-settings-version').inner_text()
    shot('version')
    page.keyboard.press('Escape')
    assert page.locator('.ink-map-destination-light').evaluate_all('(els)=>els.every(el=>getComputedStyle(el).animationName==="none")')
    phones = []
    for width, height in [(320, 568), (390, 844), (420, 896)]:
        page.set_viewport_size({'width': width, 'height': height})
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        assert page.locator('.ink-map-destination').evaluate_all('(els)=>els.every(el=>el.getBoundingClientRect().width>=44 && el.getBoundingClientRect().height>=44)')
        page.locator('.ink-map-destination--online .ink-map-destination-name').scroll_into_view_if_needed()
        name_box = page.locator('.ink-map-destination--online .ink-map-destination-name').bounding_box()
        dock_box = page.get_by_role('navigation', name='分卷').bounding_box()
        assert name_box['y'] + name_box['height'] <= dock_box['y']
        shot(f'map-{width}-{height}')
        page.get_by_role('button', name='江湖風雲', exact=True).click()
        page.locator('#ink-online').wait_for()
        page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
        phones.append([width, height])
    assert not errors and not bad, (errors, bad)
    (OUT / f'{LABEL}-browser.json').write_text(json.dumps({
        'base': BASE, 'version': 'EA0.87.0', 'mode': 'ordinary-production-ui-no-fixture-or-dev-import',
        'bundle': bundle, 'age_badge_removed': True, 'no_age_gates': True, 'nature_in_person': True,
        'four_landmarks': True, 'feature_navigation_and_back': True,
        'gacha_rates_costs_and_written_rules': True, 'settings_version': True,
        'phones': phones, 'dpr': 2, 'reduced_motion': True,
        'pageerrors': errors, 'failed_http': bad}, ensure_ascii=False, indent=2) + '\n')
    browser.close()
print('RELEASE_EA087_BROWSER_PASS', LABEL)
