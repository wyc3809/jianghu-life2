"""歷史第60b項／f95b219的入口驗證；現行Spine入口改用checkSpineBuilds.py。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/character-rig-prototype';f=json.loads((R/'production/qa/evidence/redesign/character-rig-audit/qa-fixture.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);report=[]
 for port,enabled in [(5274,False),(5273,True)]:
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,body='{"code":"qa_isolated"}'));page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{port}/?rig-lab=1');page.wait_for_timeout(1200)
  if enabled:
   page.get_by_role('main',name='角色動畫驗收').wait_for();page.get_by_role('button',name='倒地',exact=True).click();page.wait_for_timeout(1250);page.get_by_role('button',name='起身',exact=True).click();page.wait_for_timeout(1800);assert page.locator('.rig-lab').get_attribute('data-action')=='idle'
   page.get_by_role('button',name='檢查',exact=True).click();assert '累計異常：0' in page.locator('.rig-lab-checks').inner_text().replace(' ','');page.get_by_role('button',name='返回遊戲',exact=True).click();page.wait_for_timeout(600);assert not page.locator('.rig-lab').count()
  else:assert not page.locator('.rig-lab').count()
  assert not errors,errors;report.append({'internalFlag':enabled,'queryGateCorrect':True,'pageerrors':errors});c.close()
 # 在修煉頁的真設定按鈕進入；固定QA檔案開修煉頁，避免主頁自動演武干擾入口驗收。
 f['state']['tab']='practice';f['state']['pendingCombat']=None;
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,body='{"code":"qa_isolated"}'));c.add_init_script('(()=>{const f='+json.dumps(f)+';if(!localStorage.getItem("rig-build-seed")){localStorage.setItem("jianghu_life_v1_ls",JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem("jianghu_ancestry_v1",JSON.stringify(f.meta));localStorage.setItem("rig-build-seed","1");}})()');page=c.new_page();page.goto('http://127.0.0.1:5273/');page.get_by_role('button',name='續寫前緣',exact=False).click();page.wait_for_timeout(600);
 if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()

 page.get_by_role('button',name='開啟設定',exact=True).click();page.get_by_role('button',name='角色動畫驗收',exact=True).click();page.get_by_role('main',name='角色動畫驗收').wait_for();page.wait_for_timeout(600);saved=page.evaluate('JSON.stringify(localStorage)');page.get_by_role('button',name='走路',exact=True).click();page.wait_for_timeout(600);page.get_by_role('button',name='出招',exact=True).click();page.wait_for_timeout(1100);assert page.evaluate('JSON.stringify(localStorage)')==saved;report.append({'internalSettingsEntry':True,'existingSaveUnchangedInsideLab':True});c.close();b.close();(O/'build-gates.json').write_text(json.dumps({'actualIphone':False,'cases':report},ensure_ascii=False,indent=2));print('BUILD_GATES_PASS')
