"""第52項：真選中卷次的鍵盤焦點及原生dialog圍欄，預覽不結算。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkDesignSkillsUx.py').resolve())
exec(compile(Path(__file__).read_text().split('report=[]\nwith sync_playwright() as p:',1)[0],'design_helpers','exec'))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c,page,errors=start(b,320,568);enter(page);fixed(page);tap(page,re.compile('^家族收藏'),False)
 trigger=page.locator('.ink-codex-collection-tools>button').first;trigger.focus();tap(page,'書頁兌換',False);tap(page,'選擇兌換武學',False)
 option=page.locator('[data-exchange-art="'+ids['external'][0]+'"]');option.scroll_into_view_if_needed();option.click();stable(page);before=snapshot(page)
 page.keyboard.press('Tab');selected=page.locator('.ink-codex-exchange-volumes button[aria-pressed=true]');selected.focus();stable(page)
 assert selected.evaluate('e=>e.matches(":focus-visible")&&getComputedStyle(e).outlineWidth==="2px"&&getComputedStyle(e).outlineStyle==="solid"')
 assert selected.evaluate('e=>getComputedStyle(e).outlineColor')=='rgb(37, 36, 31)';sheet_check(page);shot(page,'after-keyboard-focus.png')
 assert page.locator('dialog[open]').evaluate('e=>e.matches(":modal")')
 assert page.evaluate('()=>{const before=document.activeElement;document.querySelector(".ink-codex-heading-actions button").focus();return document.activeElement===before}')
 # 原生dialog容許Tab到瀏覽器工具列；該時activeElement為body，不能誤當焦點進入背景按鈕。
 for _ in range(16):
  page.keyboard.press('Tab');assert page.evaluate('document.activeElement===document.body||Boolean(document.activeElement.closest("dialog[open]"))')
 page.keyboard.press('Escape');stable(page);assert not page.locator('dialog[open]').count();assert snapshot(page)==before
 assert page.evaluate('document.activeElement===document.querySelector(".ink-codex-collection-tools>button")');assert not errors,errors
 c.close();b.close()
(OUT/'focus-report.json').write_text(json.dumps({'selectedVolumeFocusVisible':True,'nativeFocusTrap':True,'escapeRestoresTriggerFocus':True,'noDebitOrLearn':True,'actualIphone':False,'pageerrors':errors},ensure_ascii=False,indent=2));print('DESIGN_FOCUS_PASS')
