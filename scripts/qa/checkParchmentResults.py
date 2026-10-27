"""紙框結果驗證：真單抽、寶箱開發示範及320短屏十連；全部隔離存檔。"""
from pathlib import Path
HELPER=Path('scripts/qa/checkPersonScreen.py')
exec(compile(HELPER.read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('PARCHMENT_BASE','http://127.0.0.1:5201/');OUT=ROOT/'production/qa/evidence/redesign/parchment-ui'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 c,page,errors=start(b,390,844);nav(page,'鎮居');page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();stable(page);before=meta(page)['jade']['free'];tap(page,re.compile('抽一次'),False);page.locator('[data-subject]').wait_for(timeout=15000)
 if page.get_by_role('button',name=re.compile('跳過')).count():page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>es[0]?.click()')
 page.locator('[data-phase="settle"]').wait_for(timeout=20000);assert page.locator('[data-subject="codex"] [class*="_panel_"]').first.evaluate('e=>parseFloat(getComputedStyle(e,"::before").height)>50');shot(page,'after-gacha-result.png');assert meta(page)['jade']['free']==before-60;assert not errors,errors;c.close()
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce');page=c.new_page();page.goto('http://127.0.0.1:5203/?fx=highlight&mode=chest&grade=4');page.locator('[data-subject="chest"]').wait_for(timeout=30000);page.evaluate('document.fonts.ready');page.wait_for_timeout(2000)
 skip=page.get_by_role('button',name=re.compile('跳過'))
 if skip.count():skip.evaluate_all('es=>es[0]?.click()')
 else:page.locator('[data-subject="chest"]').click(position={'x':195,'y':350})
 page.locator('[data-phase="settle"]').wait_for(timeout=30000);page.wait_for_timeout(600);shot(page,'after-chest-demo-result.png');print('RESULT_FRAMES_PASS');c.close();b.close()


with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c,page,errors=start(b,320,568);nav(page,'人物');main_geometry(page);picker(page,'武器');shot(page,'after-picker-320.png');close(page,'更換武器');tap(page,'返回鎮居');page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();stable(page);tap(page,re.compile('抽十次'),False);page.locator('[data-subject]').wait_for(timeout=15000)
 if page.get_by_role('button',name=re.compile('跳過')).count():page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>es[0]?.click()')
 page.locator('[data-phase="settle"]').wait_for(timeout=20000);assert meta(page)['jade']['free']==0
 claim=page.locator('button[class*="claim"]');assert claim.evaluate(VISIBLE);assert claim.is_enabled();shot(page,'after-ten-320.png');assert not errors,errors;c.close();b.close();print('TEN_SHORT_SCREEN_PASS')
