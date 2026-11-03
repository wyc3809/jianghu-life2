"""實際交手元件與正式角色renderer：雙造型、略過／重播、手機及無存檔寫入。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-rollout';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('SPINE_ROLLOUT_BASE','http://127.0.0.1:5281/')
report={'actualIphone':False,'nativeEditorRoundTrip':False,'productionRenderer':True,'cases':[]}
with sync_playwright() as pw:
 for engine in ['chromium','webkit']:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else pw.webkit.launch(executable_path='/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh')
  for kind in ['spar','event','event-boss']:
   record=engine=='chromium' and kind=='event';c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,**({'record_video_dir':str(ROOT/'.local-online/spine-rollout/video'),'record_video_size':{'width':390,'height':844}}if record else{}));page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'?battle-preview=unified&kind='+kind);page.wait_for_function('!!window.__martialBattleStage');before=page.evaluate('JSON.stringify(localStorage)')
   # 同一真交手元件及renderer；只換隔離角色快照，不連接配對或多人服務。
   page.evaluate('''async()=>{const {loadAppearanceAssets,prepareAppearance}=await import('/src/appearance/assets.ts');const assets=await loadAppearanceAssets();const hero={head:'topknot',outfit:'traveller',tone:'jade'},foe={head:'silver',outfit:'scholar',tone:'cinnabar'};await Promise.all([prepareAppearance(assets,hero),prepareAppearance(assets,foe)]);__martialBattleStage.setCharacterAppearance(hero,foe)}''')
   page.wait_for_timeout(5000 if record else 1800)
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   if engine=='chromium':page.screenshot(path=str(OUT/f'battle-{kind}.png'))
   speed=page.get_by_role('button',name='加速 ×2',exact=True);speed.click();assert speed.get_attribute('aria-pressed')=='true';page.wait_for_timeout(1000)
   page.get_by_role('button',name='跳過 ›',exact=True).evaluate('e=>{e.click();e.click()}');page.get_by_role('button',name='重播此戰',exact=True).wait_for()
   assert page.evaluate('JSON.stringify(localStorage)')==before
   page.get_by_role('button',name='重播此戰',exact=True).click();page.wait_for_function('!!window.__martialBattleStage');page.wait_for_timeout(500)
   assert page.evaluate('JSON.stringify(localStorage)')==before and not errors,errors
   report['cases'].append({'engine':engine,'kind':kind,'viewport':[390,844],'twoAppearanceSnapshots':True,'speedAndDoubleSkip':True,'replayNoSaveWrite':True,'pageerrors':errors});video=page.video;c.close()
   if record:video.save_as(str(OUT/'battle-operation.webm'))
  # 正式renderer全96外觀，在隔離canvas讀真圖集及握點；不是另一套人體。
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=c.new_page();page.goto(BASE+'?battle-preview=unified&kind=event')
  result=page.evaluate('''async()=>{const {loadAppearanceAssets}=await import('/src/appearance/assets.ts'),{drawAppearance}=await import('/src/appearance/model.ts'),{APPEARANCE_HEADS,APPEARANCE_OUTFITS,APPEARANCE_TONES}=await import('/interfaces/appearance.ts');const assets=await loadAppearanceAssets(),canvas=document.createElement('canvas');canvas.width=400;canvas.height=430;const ctx=canvas.getContext('2d');let count=0;for(const head of APPEARANCE_HEADS)for(const outfit of APPEARANCE_OUTFITS)for(const tone of APPEARANCE_TONES){const a={head,outfit,tone};await assets.spine.prepare(a,'atlas');for(const face of [-1,1])for(const pose of ['idle','attack','hurt','walk','down','seated']){ctx.clearRect(0,0,400,430);drawAppearance(ctx,assets,a,{x:200,y:410,height:360,pose,time:pose==='down'?1:.2,face,family:pose==='attack'?'sword':'fist'});const d=ctx.getImageData(0,0,400,430).data;let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>100)opaque++;if(opaque<500)throw Error([head,outfit,tone,pose,face,'empty'].join(':'));count++;}}return{count,styles:96,bothDirections:true,poses:6,degraded:assets.spine.degraded}}''')
  assert result['count']==1152 and not result['degraded'];report['cases'].append({'engine':engine,'allAppearances':result});c.close();b.close()
 (OUT/'battle-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SPINE_ROLLOUT_BROWSER_PASS',len(report['cases']),flush=True)
