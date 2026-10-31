"""確認開發入口不啟動雲端或改已有存檔；並記錄現有單挑演出作構圖對照。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/sect-battle-prototype'
f=json.loads((ROOT/'.local-online/app-motion-guide/fixtures.json').read_text())['equip']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='no-preference')
 c.add_init_script('''(()=>{const f='''+json.dumps(f,ensure_ascii=False)+''';if(!localStorage.getItem('sect-integration')){const raw=JSON.stringify({version:1,savedAt:Date.now(),state:f.state});localStorage.setItem('jianghu_life_v1_ls',raw);localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('sect-integration',raw);}})()''')
 cloud=[]
 c.route('**/*.supabase.co/**',lambda r:(cloud.append(r.request.url),r.abort()))
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:5251/?sect-battle-preview=1',timeout=90000);page.get_by_role('button',name='開始會武',exact=True).wait_for(timeout=90000)
 assert not page.locator('.ink-hud,.ink-bottom-dock,.ink-start-gate').count();page.get_by_role('button',name='開始會武',exact=True).click();page.wait_for_timeout(1000);page.get_by_role('button',name='直接結果',exact=True).click();assert page.locator('.sect-battle-result').count()
 assert page.evaluate("localStorage.getItem('jianghu_life_v1_ls')===localStorage.getItem('sect-integration')")
 assert not cloud,cloud;assert not errors,errors;page.screenshot(path=str(OUT/'dev-entry-390.png'))
 page.goto('http://127.0.0.1:5251/?battle-preview=unified&kind=event',timeout=60000);page.wait_for_timeout(1800);page.screenshot(path=str(OUT/'before-single-demo-390.png'));assert not errors,errors
 (OUT/'integration-report.json').write_text(json.dumps({'devEntryWorks':True,'noHudOrDock':True,'skipReachesSameResult':True,'existingLifeSaveUnchanged':True,'cloudRequests':cloud,'pageerrors':errors,'baseline':'existing development-only unified single-duel demo; isolated fixture, not player combat','actualIphone':False},ensure_ascii=False,indent=2));b.close()
print('INTEGRATION_PASS',flush=True)
