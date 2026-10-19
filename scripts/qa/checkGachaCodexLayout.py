"""兩個瀏覽器／手機尺寸：真正入口、選派、心願、後備與點擊可達。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/gacha-codex';SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text();report=[]
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  if engine=='chromium':browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  else:
   base='/home/agent/.cache/ms-playwright/webkit-2336/minibrowser-wpe';env={**os.environ,'LD_LIBRARY_PATH':base+'/lib:'+base+'/sys/lib:/workspace/gacha-webkit-libs/root/usr/lib/x86_64-linux-gnu','WEBKIT_EXEC_PATH':base+'/bin','WEBKIT_INJECTED_BUNDLE_PATH':base+'/lib','WEBKIT_INSPECTOR_RESOURCES_PATH':base+'/share'}
   browser=p.webkit.launch(executable_path=base+'/bin/MiniBrowser',env=env)
  for width,height in [(320,568),(390,844),(420,896)]:
   context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,reduced_motion='reduce');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   context.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:original.call(this,t,...a)}")
   page.route('https://**',lambda r:r.abort());page.goto('http://127.0.0.1:5173/',wait_until='networkidle');page.evaluate(SETUP,{})
   page.get_by_role('button',name='選擇抽卡流派',exact=True).click();choices=page.get_by_role('group',name='抽卡流派').get_by_role('button');assert choices.count()==6
   for i in range(6):
    choices.nth(i).click();assert not page.get_by_role('dialog').count();page.get_by_role('button',name='選擇抽卡流派',exact=True).click();choices=page.get_by_role('group',name='抽卡流派').get_by_role('button')
   page.get_by_role('button',name='關閉六派藏卷',exact=True).click()
   page.get_by_role('button',name=re.compile('^心願：')).click();page.locator('.ink-codex-wish-options button').first.click()
   page.get_by_role('button',name=re.compile('本冊.*門')).click();assert page.locator('.ink-codex-catalog li').count()>=6;page.keyboard.press('Escape')
   page.get_by_role('button',name='抽十次',exact=False).scroll_into_view_if_needed()
   hit=page.get_by_role('button',name='抽十次',exact=False).evaluate('''el=>{const r=el.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{clickable:el===t||el.contains(t),bottom:r.bottom}}''');assert hit['clickable'],(engine,width,hit)
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   if height>=844:assert hit['bottom']<height-100,(engine,width,hit)
   page.screenshot(path=str(OUT/f'{engine}-{width}-layout.png'))
   page.get_by_role('button',name='抽十次',exact=False).click();page.get_by_role('dialog').filter(has_text='已入家族收藏').wait_for();assert page.locator('.ink-codex-fallback-cards button').count()==10
   page.get_by_role('button',name='完成入藏',exact=True).click()
   # 同時缺生成封面／紙紋及字體，文字、選擇及抽取仍然可用。
   page.route('**/ink/art/gacha/**',lambda r:r.abort());page.route('**/*.woff2',lambda r:r.abort());page.reload(wait_until='networkidle');page.evaluate(SETUP,{'jade':{'free':0,'paidTest':0}})
   assert page.get_by_role('button',name='抽一次',exact=False).is_disabled();assert page.get_by_role('button',name='抽十次',exact=False).is_disabled()
   assert not errors,(engine,width,errors)
   report.append({'engine':engine,'width':width,'height':height,'all_six_schools':True,'wish_catalog':True,'cta_clickable':True,'ten_fallback':True,'missing_cover_font':True,'insufficient_jade':True,'errors':errors});context.close();print(engine,width,'PASS',flush=True)
  browser.close()
(OUT/'layout-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
