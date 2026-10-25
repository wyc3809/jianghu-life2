"""真核心單抽重複及十連；跳過／重看／關閉不再扣款或發獎。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/martial-economy-v2';f=json.loads((ROOT/'.local-online/martial-economy-v2/fixtures.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='no-preference')
 for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
 c.add_init_script('''(()=>{const f='''+json.dumps(f,ensure_ascii=False)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.duplicate));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));})();''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5188/');page.get_by_role('button',name=re.compile('^續寫前緣')).click();page.locator('.ink-quick').wait_for();page.wait_for_timeout(500)
 if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
 page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();page.get_by_role('button',name=re.compile('^抽一次')).evaluate('e=>{e.click();e.click()}')
 stage=page.locator('[data-subject="codex"]');stage.wait_for(timeout=60000);page.wait_for_timeout(1200)
 stage.evaluate("e=>e.querySelector('button[class*=skip]')?.click()");page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=60000)
 actual=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');expected=f['expected']
 for key in ['jade','manuals','pages','gacha']:assert actual[key]==expected[key],key
 assert '已轉為20書頁' in stage.inner_text();page.screenshot(path=str(OUT/'duplicate-result.png'));stage.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).click()
 page.locator('.ink-codex-last').click();dialog=page.get_by_role('dialog',name='上次入藏');assert '重複' in dialog.inner_text();page.get_by_role('button',name='關閉上次入藏').click()
 page.get_by_role('button',name=re.compile('^抽十次')).evaluate('e=>{e.click();e.click()}');stage=page.locator('[data-subject="codex"]');stage.wait_for(timeout=60000);stage.evaluate("e=>e.querySelector('button[class*=skip]')?.click()");page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=60000)
 assert stage.locator('[data-card]').count()==10
 for i in range(10):stage.locator('[data-card]').nth(i).click()
 page.screenshot(path=str(OUT/'ten-result.png'));stage.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).click()
 final=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');assert final['gacha']['pulls']==11;assert final['jade']['free']==1340
 page.locator('.ink-codex-last').click();assert page.get_by_role('dialog',name='上次入藏').locator('.ink-pull-card').count()==10;page.get_by_role('button',name='關閉上次入藏').click();assert page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')==final
 assert not errors,errors
 (OUT/'pulls.json').write_text(json.dumps({'productionBuild':True,'doubleClickSingleCost':60,'doubleClickTenCost':600,'coreExpectedSingleMatched':True,'duplicate20True':True,'tenSelectable':10,'reopenDoesNotCredit':True,'pageerrors':errors},ensure_ascii=False,indent=2));print('MARTIAL_V2_PULLS_PASS');b.close()
