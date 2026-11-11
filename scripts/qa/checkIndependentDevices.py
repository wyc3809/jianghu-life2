"""手機尺寸／WebKit／減少動態／失圖承接；只讀隔離戰報，不當真iPhone驗收。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/os.getenv('MARTIAL_QA_OUT','production/qa/evidence/redesign/independent-animations');BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5292/');rows=[]
with sync_playwright()as pw:
 for engine in ['chromium','webkit']:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])if engine=='chromium'else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for width,height,mode in [(320,568,'normal'),(430,932,'normal'),(390,844,'reduce'),(390,844,'failure')]:
   c=b.new_context(viewport={'width':width,'height':height},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce'if mode=='reduce'else'no-preference');c.route('**/*.supabase.co/**',lambda r:r.abort())
   if mode=='failure':c.route('**/ink/art/independent/**',lambda r:r.abort())
   p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'?martial-preview=1&art=art_rain_sword&pose=1&clean=1&head=bun&outfit=scholar&tone=jade');p.wait_for_function('!!window.__martialQa',timeout=90000);before=p.evaluate('JSON.stringify(localStorage)');p.wait_for_timeout(600)
   assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   d=p.evaluate('''()=>{const s=__martialQa.stage;return{appearance:s.images.characterAppearance,cache:s.images.wardrobe.independent.stats(),rootHeight:s.heroVisualHeight(),drawing:s.canvas.getContext('2d').getImageData(0,0,s.canvas.width,s.canvas.height).data.some((v,i)=>i%4===3&&v>100)}}''');assert d['appearance']=={'head':'bun','outfit':'scholar','tone':'jade'}and d['drawing']
   if mode=='failure':assert d['cache']['failures']>0
   assert before==p.evaluate('JSON.stringify(localStorage)')and not errors,errors
   if engine=='chromium':p.screenshot(path=str(OUT/f'app-{width}-{mode}.png'))
   rows.append({'engine':engine,'viewport':[width,height],'mode':mode,'data':d,'pageerrors':errors,'storageUnchanged':True});c.close()
  b.close()
(OUT/'device-browser.json').write_text(json.dumps({'cases':rows,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('DEVICE_BROWSER_PASS',len(rows))
