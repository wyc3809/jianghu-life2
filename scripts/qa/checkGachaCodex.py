"""第31項：真抽卡入口、真核心結果、重複點擊／跳過不重結算。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, time, subprocess, re, os, base64
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/gacha-codex'
OUT.mkdir(parents=True, exist_ok=True)
SETUP = (ROOT / 'scripts/qa/gachaCodexSetup.js').read_text()
REPORT = {'cases': [], 'errors': [], 'scope': 'Chromium Linux手機尺寸，非iPhone實機'}
if os.environ.get('QA_CASES') and (OUT/'browser-report.json').exists():
 REPORT=json.loads((OUT/'browser-report.json').read_text());REPORT['cases']=[c for c in REPORT['cases'] if c['name'] not in os.environ['QA_CASES'].split(',')]
SCENARIOS = [('single-new',{}), ('single-premium',{'banner':'zhenben','premium':True}), ('wish',{'wish':True}), ('ten-mixed',{'n':10,'banner':'zhenben','premium':True}), ('ten-duplicates',{'n':10,'owned':True}), ('skip',{'n':10,'skip':True}), ('no-webgl',{'no_gl':True}), ('reduced',{'reduce':True})]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for name, opts in SCENARIOS:
  if os.environ.get('QA_CASES') and name not in os.environ['QA_CASES'].split(','): continue
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce' if opts.get('reduce') else 'no-preference',record_video_dir=str(OUT/'raw-video'),record_video_size={'width':390,'height':844})
  if opts.get('no_gl'):context.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args)}")
  context.add_init_script((ROOT/'scripts/qa/gachaAudioCapture.js').read_text())
  video_epoch=time.time()*1000
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**',lambda r:r.abort())
  page.goto('http://127.0.0.1:5173/',wait_until='networkidle');page.bring_to_front();page.evaluate(SETUP,opts)
  if opts.get('banner')=='zhenben':page.get_by_role('tab',name='珍本奇功').click()
  page.wait_for_timeout(800)
  if name=='single-new':page.screenshot(path=str(OUT/'after-page.png'))
  n=opts.get('n',1)
  expected=page.evaluate('''n=>{const q=window.qa;const m=structuredClone(q.anc.getState().meta);const result=q.g.pull(m,document.querySelector('[role=tab][aria-selected=true]').textContent.includes('珍本')?'zhenben':'jianghu',n);return{meta:m,results:result}}''',n)
  button=page.get_by_role('button',name='抽十次' if n==10 else '抽一次',exact=False)
  # 同一事件迴圈發送兩次click，核對只結算一次。
  button.evaluate('(el)=>{el.click();el.click()}')
  phases=[];start=time.time()
  if opts.get('no_gl'):
   page.get_by_role('dialog').filter(has_text='已入家族收藏').wait_for(timeout=30000)
  else:
   root=page.locator('[data-subject="codex"]');root.wait_for(timeout=30000)
   if opts.get('skip'):page.get_by_role('button',name='跳過 ›',exact=True).click()
   while time.time()-start<30:
    phase=root.get_attribute('data-phase')
    if not phases or phases[-1]!=phase:phases.append(phase)
    if phase=='settle':break
    page.wait_for_timeout(50)
   assert phase=='settle',(name,phases)
  elapsed=round(time.time()-start,2)
  actual=page.evaluate('''()=>{const m=window.qa.anc.getState().meta;return{jade:m.jade,gacha:m.gacha,manuals:m.manuals,pages:m.pages??0,results:window.qa.anc.getState().lastPull}}''')
  for key in ['jade','gacha','manuals']:
   assert actual[key]==expected['meta'].get(key),(name,key,actual[key],expected['meta'].get(key))
  assert actual['results']==expected['results'],name
  page.screenshot(path=str(OUT/f'{name}-result.png'))
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  if name=='wish':assert page.get_by_text('江湖 · 新得 · 心願',exact=True).is_visible()
  if name=='ten-duplicates':assert not any(r['isNew'] for r in actual['results']) and actual['pages']==0
  if name=='single-new':
   char_before=page.evaluate('JSON.stringify(window.qa.life.getState().state.character.equippedArts)')
   page.get_by_role('button',name=re.compile('^馬上裝備')).click()
   page.get_by_text('外功 · 五門自由配搭',exact=False).first.wait_for(timeout=10000) if page.get_by_text('外功 · 五門自由配搭',exact=False).count() else None
   assert page.evaluate('window.qa.life.getState().state.tab')=='person'
   assert page.evaluate('JSON.stringify(window.qa.life.getState().state.character.equippedArts)')==char_before
   page.screenshot(path=str(OUT/'equip-destination.png'))
  elif opts.get('no_gl'):page.get_by_role('button',name='完成入藏',exact=True).click()
  else:page.get_by_role('button',name='完成入藏',exact=True).click();page.locator('[data-subject="codex"]').wait_for(state='detached')
  final=page.evaluate('''()=>{const m=window.qa.anc.getState().meta;return{jade:m.jade,gacha:m.gacha,manuals:m.manuals}}''')
  assert all(final[k]==actual[k] for k in final)
  assert not errors,(name,errors)
  audio=page.evaluate('async()=>window.qaStopAudio?await window.qaStopAudio():[]')
  video=page.video;context.close();path=Path(video.path());dest=OUT/f'{name}.mp4'
  command=['ffmpeg','-y','-loglevel','error','-i',str(path)]
  for i,track in enumerate(audio):
   audio_path=OUT/'raw-video'/f'{name}-audio-{i}.webm';audio_path.write_bytes(base64.b64decode(track['data']))
   command+=['-itsoffset',str(max(0,(track['started']-video_epoch)/1000)),'-i',str(audio_path)]
  if audio:command+=['-filter_complex',''.join(f'[{i+1}:a]' for i in range(len(audio)))+f'amix=inputs={len(audio)}:duration=longest:normalize=0,apad[a]','-map','0:v','-map','[a]','-c:a','aac']
  else:command+=['-an']
  command+=['-vf','fps=24','-c:v','libx264','-crf','24','-pix_fmt','yuv420p','-shortest',str(dest)]
  subprocess.run(command,check=True)
  row={'name':name,'phases':phases,'seconds_to_results':elapsed,'result_count':len(actual['results']),'core_match':True,'double_click_once':True,'close_no_mutation':True,'audio_tracks':len(audio),'audio_timing':'實際輸出，按page建立與AudioContext開始時鐘對齊；非硬件延遲認證','errors':errors}
  REPORT['cases'].append(row);(OUT/'browser-report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2));print(name,'PASS',flush=True)
 browser.close()
