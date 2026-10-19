from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2];out=root/'production/qa/evidence/redesign/gacha-codex'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);dev=b.new_page();dev.route('https://**',lambda r:r.abort());dev.goto('http://127.0.0.1:5173/',wait_until='networkidle');data=dev.evaluate((root/'scripts/qa/gachaCodexSetup.js').read_text(),{'jade':{'free':600,'paidTest':0}});dev.close()
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);c.add_init_script('localStorage.setItem("jianghu_ancestry_v1",'+json.dumps(json.dumps(data['meta']))+')');page=c.new_page();errs=[];bad=[];page.route('https://**',lambda r:r.abort());page.on('pageerror',lambda e:errs.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto('http://127.0.0.1:5176/jianghu-life2/',wait_until='networkidle');page.get_by_role('button',name='開卷',exact=True).click();page.get_by_placeholder('不書則天賜一名').fill('驗版行者');page.get_by_role('button',name='翻開少時',exact=True).click()
 for _ in range(3):page.locator('.ink-choice').first.click()
 page.get_by_role('button',name='落筆開卷',exact=True).click();page.get_by_role('button',name='江湖',exact=True).click();page.get_by_role('button',name='抽一次',exact=False).click();page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=30000);page.screenshot(path=str(out/'pages-build-result.png'))
 stored=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');assert stored['gacha']['pulls']==1 and stored['jade']['free']==540
 page.get_by_role('button',name='完成入藏',exact=True).click();page.locator('[data-subject="codex"]').wait_for(state='detached');assert page.evaluate('document.getElementById("root").inert')==False;assert not errs and not bad
 (out/'pages-build-smoke.json').write_text(json.dumps({'path':'/jianghu-life2/','real_start_create_draw':True,'one_pull':True,'free_jade':540,'root_restored':True,'errors':errs,'failed_http':bad},ensure_ascii=False,indent=2));print('PAGES_BUILD_SMOKE_PASS');b.close()
