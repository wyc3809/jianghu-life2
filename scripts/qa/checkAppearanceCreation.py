"""正式構建建立角色：選外觀、童年流程及首次存檔一致。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/appearance';report=[]
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce')
  for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
  page=c.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.goto('http://127.0.0.1:5252/');page.get_by_role('button',name='開卷',exact=True).click();page.get_by_role('button',name='衣著與造型',exact=True).click();d=page.get_by_role('dialog',name='衣著與造型',exact=True);d.get_by_role('button',name='高馬尾',exact=True).click();d.get_by_role('tab',name='衣著',exact=True).click();d.get_by_role('button',name='俠客勁裝',exact=True).click();d.get_by_role('tab',name='配色',exact=True).click();d.get_by_role('button',name='赭紅',exact=True).click();d.get_by_role('button',name='換上',exact=True).click()
  assert not page.evaluate('localStorage.getItem("jianghu_life_v1_ls")'),'preview must not create a life'
  page.get_by_role('button',name='翻開少時',exact=True).click()
  for _ in range(6):
   if page.get_by_role('button',name='開始遊戲',exact=True).count():break
   page.locator('.ink-choice-list button').first.click();page.wait_for_timeout(100)
  page.get_by_role('button',name='開始遊戲',exact=True).click();page.wait_for_timeout(700)
  saved=page.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state');assert saved['character']['appearance']=={'head':'ponytail','outfit':'traveller','tone':'cinnabar'};assert not errs,errs
  report.append({'engine':engine,'realCreationFlow':True,'previewDoesNotStartLife':True,'chosenAppearanceSaved':True,'pageerrors':errs});c.close();b.close()
(OUT/'creation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('CREATION_PASS',len(report),flush=True)
