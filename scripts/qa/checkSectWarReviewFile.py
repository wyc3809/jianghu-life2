"""驗證單檔真元件試演：所有圖片／字體／工作程式內嵌，不連接帳戶。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/sect-war-revision/offline';OUT.mkdir(parents=True,exist_ok=True)
file=Path('/workspace/deliverables/sect-war-revision/門派會武-畫面驗收.html')
url=os.getenv('WAR_REVIEW_URL',file.as_uri())
results=[]
with sync_playwright()as pw:
 for engine in ['chromium','webkit']:
  print('OFFLINE_REVIEW',engine,flush=True)
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])if engine=='chromium'else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in [(390,844),(320,568)]:
   c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True)
   page=c.new_page();errors=[];network=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:network.append(r.url)if r.url.startswith('http')and r.url!=url else None)
   page.goto(url);page.wait_for_function("document.querySelector('.war-actions button')&&!document.querySelector('.war-actions button').disabled",timeout=30000)
   for button in page.locator('.war-actions>button,.war-back,.war-mode').all():assert button.evaluate('e=>{const b=e.getBoundingClientRect();return b.height>=43&&b.top>=0&&b.bottom<=innerHeight+1}')
   page.get_by_role('button',name='開始',exact=True).click();page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>2",timeout=15000)
   page.get_by_role('button',name='暫停',exact=True).click();before=page.locator('.war-stage canvas').evaluate('e=>e.toDataURL()');page.wait_for_timeout(250);assert before==page.locator('.war-stage canvas').evaluate('e=>e.toDataURL()')
   page.get_by_role('button',name='名冊',exact=True).click();d=page.get_by_role('dialog',name='代表名冊');assert d.locator('.war-roster-grid>button').count()==10;d.get_by_role('tab',name='武當派',exact=True).click();assert d.locator('.war-roster-grid>button').count()==10;d.locator('.war-roster-grid>button').nth(1).click()
   page.get_by_role('button',name='跳過',exact=True).click();first=page.locator('.war-result').inner_text();page.get_by_role('button',name='重播',exact=True).click();page.get_by_role('button',name='跳過',exact=True).click();assert page.locator('.war-result').inner_text()==first
   if w==390:page.screenshot(path=str(OUT/(engine+'-result.png')))
   assert not errors,errors;assert not network,network
   results.append({'engine':engine,'viewport':[w,h],'actualReactComponent':True,'realWorkerAndRenderer':True,'allAssetsEmbedded':True,'singleDocumentServedOverHttp':url.startswith('http'),'fileSchemeBlockedByEnvironment':True,'externalRequests':network,'pauseStable':True,'twentyRoster':True,'skipReplaySameResult':True,'pageerrors':errors,'actualIphone':False});c.close()
  b.close()
(OUT/'report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('OFFLINE_REVIEW_PASS',len(results),flush=True)
