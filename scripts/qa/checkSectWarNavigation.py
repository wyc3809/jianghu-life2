"""正式構建完整路徑：江湖、風雲、會武、名冊、對戰配搭與返回。雲端隔離。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkTapNavigation.py').read_text().split('with sync_playwright() as p:')[0], 'navigation_helpers', 'exec'))
BASE = os.getenv('WAR_BASE', 'http://127.0.0.1:5252/')
OUT = ROOT / 'production/qa/evidence/redesign/sect-war/navigation'
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,page,errors=start(b,390,844)
 nav(page,'江湖');tap(page,'江湖風雲');tap(page,'門派會武 · 報名與觀摩')
 page.locator('.ink-sect-war').wait_for();assert page.locator('#root').evaluate('e=>e.inert')
 tap(page,'觀摩試演');page.wait_for_function("document.querySelector('.war-actions button')&&!document.querySelector('.war-actions button').disabled",timeout=30000)
 tap(page,'開始');page.wait_for_function("document.querySelector('.ink-sect-war').dataset.status==='result'")
 tap(page,'名冊');page.get_by_role('button',name='規則與設定',exact=True).scroll_into_view_if_needed();tap(page,'規則與設定');tap(page,'關閉會武規則');tap(page,'名冊');page.get_by_role('button',name='前往對戰配搭',exact=True).scroll_into_view_if_needed();tap(page,'前往對戰配搭')
 assert not page.locator('.ink-sect-war').count();assert not page.locator('#root').evaluate('e=>e.inert')
 page.get_by_role('tab',name='對戰配搭',exact=True).wait_for();assert page.get_by_role('tab',name='對戰配搭',exact=True).get_attribute('aria-selected')=='true'
 page.screenshot(path=str(OUT/'duel-loadout.png'))
 tap(page,'返回人物');tap(page,'返回鎮居');nav(page,'江湖');tap(page,'江湖風雲');tap(page,'門派會武 · 報名與觀摩')
 page.locator('.ink-sect-war').wait_for();tap(page,'返回');assert not page.locator('.ink-sect-war').count();assert not page.locator('#root').evaluate('e=>e.inert')
 assert page.get_by_role('button',name='門派會武 · 報名與觀摩',exact=True).is_visible()
 assert not errors,errors
 (OUT/'browser-report.json').write_text(json.dumps({'productionBuild':True,'engine':'chromium','entry':'江湖→江湖風雲→門派會武','noGlobalDockInBattle':True,'rootInertRestored':True,'prepareOpensDuelPreset':True,'returnToOriginalPanel':True,'pageerrors':errors,'cloudBlocked':True,'actualIphone':False},ensure_ascii=False,indent=2))
 c.close();b.close();print('NAVIGATION_PASS',flush=True)
