"""同一瀏覽器連續三次重播，確認舊GPU context已釋放、圖片快取可再使用。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
OUT=Path('production/qa/evidence/redesign/chest-quality/replay');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('CHEST_DEMO_BASE','http://127.0.0.1:5180/')
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce')
 c.route('**/fonts.googleapis.com/**',lambda r:r.abort());c.route('**/fonts.gstatic.com/**',lambda r:r.abort())
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'?fx=highlight&mode=chest&grade=1',wait_until='domcontentloaded')
 for i in range(int(os.getenv('CHEST_REPLAY_COUNT','3'))):
  page.locator('[data-subject="chest"]').wait_for()
  if i==int(os.getenv('CHEST_REPLAY_LOSS_AT','-1')):
   page.evaluate('document.querySelector("[data-subject] canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
  else:page.locator('[data-subject="chest"]').get_by_role('button',name='跳過 ›',exact=True).click()
  page.wait_for_function('document.querySelector("[data-subject]")?.dataset.phase==="settle"',timeout=60000)
  assert page.evaluate('document.documentElement.dataset.highlightActive')=='1'
  page.screenshot(path=str(OUT/f'replay-{i+1}.png'))
  page.evaluate('window.previousFxCanvas=document.querySelector("[data-subject] canvas");window.previousFxGl=previousFxCanvas.getContext("webgl2")')
  page.get_by_role('button',name='領取',exact=True).click()
  page.wait_for_function('!window.previousFxCanvas.isConnected',timeout=30000)
  page.wait_for_function('window.previousFxGl.isContextLost()')
  page.locator('[data-subject="chest"]').wait_for()
  assert not errors,errors
  results.append({'cycle':i+1,'oldCanvasRemoved':True,'oldContextReleased':True,'nextChestMounted':True,'pageerrors':errors[:]})
 c.unroute_all(behavior='wait');c.close();b.close()
(OUT/'report.json').write_text(json.dumps({'mode':'development actual renderer, no GPU mock','results':results},indent=2)+'\n')
print('CHEST_REPLAY_PASS',len(results))
