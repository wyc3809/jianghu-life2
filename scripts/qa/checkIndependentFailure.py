"""強制新素材全失效，真交手仍可跳過及重播，不重寫存檔。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/os.getenv('MARTIAL_QA_OUT','production/qa/evidence/redesign/independent-animations');BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5292/');rows=[]
with sync_playwright()as pw:
 for engine in ['chromium','webkit']:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])if engine=='chromium'else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'));p=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.route('**/*.supabase.co/**',lambda r:r.abort());p.route('**/ink/art/independent/**',lambda r:r.abort());p.goto(BASE+'?battle-preview=unified&kind=event');p.wait_for_function('!!window.__martialBattleStage',timeout=90000);before=p.evaluate('JSON.stringify(localStorage)');p.wait_for_timeout(1200);assert p.evaluate('__martialBattleStage.images.wardrobe.independent.stats().failures>0');p.get_by_role('button',name='跳過 ›',exact=True).evaluate('e=>{e.click();e.click()}');p.get_by_role('button',name='重播此戰',exact=True).wait_for();assert before==p.evaluate('JSON.stringify(localStorage)');p.get_by_role('button',name='重播此戰',exact=True).click();p.wait_for_function('!!window.__martialBattleStage');p.wait_for_timeout(300);assert before==p.evaluate('JSON.stringify(localStorage)')and not errors;rows.append({'engine':engine,'allNewMotionAssetsFailed':True,'doubleSkipAndReplay':True,'storageUnchanged':True,'pageerrors':errors});b.close()
(OUT/'failure-browser.json').write_text(json.dumps({'cases':rows,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('FAILURE_BROWSER_PASS',len(rows))
