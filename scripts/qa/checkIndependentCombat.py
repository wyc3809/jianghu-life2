"""逐門新動作接回真交手元件：雙造型、加速／略過／重播及無存檔寫入。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/os.getenv('MARTIAL_QA_OUT','production/qa/evidence/redesign/independent-animations');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5292/')
report={'actualIphone':False,'nativeEditorRoundTrip':False,'productionRenderer':True,'cases':[]}
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for kind in ['spar','event','event-boss']:
   record=engine=='chromium'and kind=='event';c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,**({'record_video_dir':str(ROOT/'.local-online/full-martial-motion/video'),'record_video_size':{'width':390,'height':844}}if record else{}));c.route('**/*.supabase.co/**',lambda r:r.abort());page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?battle-preview=unified&kind='+kind);page.wait_for_function('!!window.__martialBattleStage');before=page.evaluate('JSON.stringify(localStorage)')
   # 同一真交手元件及renderer；只換隔離角色快照，不連接配對或多人服務。
   page.evaluate('''async()=>{const {loadAppearanceAssets,prepareAppearance}=await import('/src/appearance/assets.ts');const assets=await loadAppearanceAssets();const hero={head:'topknot',outfit:'traveller',tone:'jade'},foe={head:'silver',outfit:'scholar',tone:'cinnabar'};await Promise.all([prepareAppearance(assets,hero),prepareAppearance(assets,foe)]);__martialBattleStage.setCharacterAppearance(hero,foe)}''')
   page.wait_for_timeout(9000 if record else 1800)
   page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));window.__pausedT=__martialBattleStage.idleT")
   page.wait_for_timeout(250)
   assert page.evaluate('__martialBattleStage.idleT===window.__pausedT')
   page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   if engine=='chromium':page.screenshot(path=str(OUT/f'battle-{kind}.png'))
   speed=page.get_by_role('button',name='加速 ×2',exact=True);speed.click();assert speed.get_attribute('aria-pressed')=='true';page.wait_for_timeout(1000)
   page.get_by_role('button',name='跳過 ›',exact=True).evaluate('e=>{e.click();e.click()}');page.get_by_role('button',name='重播此戰',exact=True).wait_for()
   assert page.evaluate('JSON.stringify(localStorage)')==before
   page.get_by_role('button',name='重播此戰',exact=True).click();page.wait_for_function('!!window.__martialBattleStage');page.wait_for_timeout(500)
   assert page.evaluate('JSON.stringify(localStorage)')==before and not errors,errors
   report['cases'].append({'engine':engine,'kind':kind,'viewport':[390,844],'twoAppearanceSnapshots':True,'speedAndDoubleSkip':True,'replayNoSaveWrite':True,'pageerrors':errors});video=page.video;c.close()
   if record:video.save_as(str(OUT/'battle-operation.webm'))
  b.close()
 (OUT/'battle-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('INDEPENDENT_COMBAT_BROWSER_PASS',len(report['cases']),flush=True)
