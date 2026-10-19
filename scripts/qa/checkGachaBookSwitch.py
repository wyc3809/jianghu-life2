"""書封切池重建唔丟WebGL；真context loss之後仍保留正確配色後備。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

root=Path(__file__).resolve().parents[2]
out=root/'production/qa/evidence/redesign/gacha-book-colors'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    errors=[];gl_errors=[];checks=[]
    page.route('https://**',lambda r:r.abort())
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:gl_errors.append(m.text) if m.type=='error' or 'WebGL: INVALID_' in m.text else None)
    page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
    page.evaluate((root/'scripts/qa/gachaCodexSetup.js').read_text(),{'jade':{'free':600,'paidTest':0}})
    for premium in [False,True,False,True,False,True]:
        page.get_by_role('tab',name='珍本奇功' if premium else '江湖秘笈').click()
        page.locator('.ink-codex-canvas').wait_for()
        page.wait_for_timeout(600)
        status=page.locator('.ink-codex-canvas').evaluate('''el=>{const gl=el.getContext('webgl2');return{lost:gl.isContextLost(),error:gl.getError(),rarity:el.dataset.codexRarity}}''')
        assert status=={'lost':False,'error':0,'rarity':'premium' if premium else 'ordinary'},status
        checks.append(status)
    page.locator('.ink-codex-canvas').evaluate("el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
    image=page.locator('.ink-codex-static');image.wait_for()
    assert image.get_attribute('src').endswith('codex-cover-premium.webp')
    page.get_by_role('tab',name='江湖秘笈').click()
    assert image.get_attribute('src').endswith('codex-cover.webp')
    assert page.evaluate('window.qa.anc.getState().meta.jade')=={'free':600,'paidTest':0}
    assert not errors and not gl_errors,(errors,gl_errors)
    (out/'switch-report.json').write_text(json.dumps({'switches':checks,'context_lost_fallback_colors':True,'jade_unchanged':True,'page_errors':errors,'console_errors':gl_errors},ensure_ascii=False,indent=2))
    b.close()
print('BOOK_SWITCH_PASS')
