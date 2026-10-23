"""Pages 路徑實測：從正式構建的普通介面建立人物，不載入開發模組。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/jianghu-map'
BASE = os.getenv('MAP_BUILT_BASE', 'http://127.0.0.1:5175/jianghu-life2/')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, reduced_motion='reduce')
    context.route('**/*.supabase.co/**', lambda route: route.abort())
    page = context.new_page()
    errors, bad = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: bad.append(response.url) if response.status >= 400 and '127.0.0.1' in response.url else None)
    page.goto(BASE, wait_until='domcontentloaded')
    page.get_by_role('button', name='開卷', exact=True).click()
    page.get_by_label('姓名', exact=True).fill('驗圖少俠')
    page.get_by_role('button', name='翻開少時', exact=True).click()
    for _ in range(3):
        page.get_by_role('region', name='少時往事').locator('button.ink-choice').first.click()
    page.get_by_role('button', name='開始遊戲', exact=True).click()
    page.locator('.scroll-shell--play').wait_for()
    page.get_by_role('navigation', name='分卷').get_by_role('button', name='江湖', exact=True).click()
    page.locator('.ink-jianghu-map').wait_for()
    page.wait_for_function("document.querySelector('.ink-jianghu-map-art')?.naturalWidth===1024")
    assert page.get_by_role('navigation', name='江湖功能').get_by_role('button').count() == 4
    page.screenshot(path=str(OUT / 'pages-build-map.png'))
    page.get_by_role('button', name='秘笈閣', exact=True).click()
    page.locator('#ink-gacha').wait_for()
    page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
    page.locator('.ink-jianghu-map').wait_for()
    assert not errors and not bad, (errors, bad)
    (OUT / 'pages-build-report.json').write_text(json.dumps({
        'base': '/jianghu-life2/', 'mode': 'ordinary-production-ui-no-fixture-or-dev-import',
        'four_landmarks': True, 'image_loaded': True, 'gacha_and_return': True,
        'pageerrors': errors, 'failed_local_http': bad}, ensure_ascii=False, indent=2) + '\n')
    browser.close()
print('PAGES_MAP_SMOKE_PASS')
