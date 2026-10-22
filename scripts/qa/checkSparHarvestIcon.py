"""掛機入口改淨器物圖示：手機觸控、透明背景、原有詳情開關。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import ast,json,os,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spar-harvest-icon'
OUT.mkdir(parents=True,exist_ok=True);MODE=os.getenv('ICON_QA_MODE','after')
# 重用既有隔離QA場景，唔執行原本完整回歸。
SETUP=next(ast.literal_eval(n.value) for n in ast.parse((ROOT/'scripts/qa/checkSparHome.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
report={'seed':42,'jade':{'free':600,'paidTest':0},'dpr':2,'cases':[],'pageerrors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);kwargs={'viewport':{'width':390,'height':844},'device_scale_factor':2}
 if MODE=='after':kwargs.update(record_video_dir='/tmp/spar-harvest-icon-video',record_video_size={'width':390,'height':844})
 ctx=b.new_context(**kwargs);ctx.route('**/seuocqrmyljjzndgbynt.supabase.co/**',lambda r:r.abort());page=ctx.new_page();page.on('pageerror',lambda e:report['pageerrors'].append(str(e)))
 page.goto(os.getenv('ICON_QA_BASE','http://127.0.0.1:5173/'),wait_until='domcontentloaded');page.wait_for_timeout(2700);page.evaluate(SETUP);page.wait_for_function('window.__sparDuel&&window.__sparStage')
 page.evaluate("()=>{const d=window.__sparDuel;while(d.foe?.tier==='minion'){d.foeHp=0;d.ensureLiveFoe()}}")
 page.locator('.ink-spar-enemy-name.is-elite').wait_for(timeout=20000);page.evaluate('document.fonts.ready');page.wait_for_timeout(250);page.screenshot(path=str(OUT/f'{MODE}.png'))
 if MODE=='after':
  for width,height in [(320,568),(390,720),(390,844),(420,896)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(200);entry=page.get_by_role('button',name='掛機收成',exact=True)
   data=entry.evaluate('''e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),img=e.querySelector('img'),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {width:r.width,height:r.height,text:e.textContent.trim(),border:s.borderTopWidth,borderImage:s.borderImageSource,background:s.backgroundColor,backgroundImage:s.backgroundImage,hit:e===hit||e.contains(hit),imageLoaded:img?.complete&&img.naturalWidth>0}}''')
   assert data['width']==44 and data['height']==44 and data['text']=='',data
   assert data['border']=='0px' and data['borderImage']=='none' and data['background']=='rgba(0, 0, 0, 0)' and data['backgroundImage']=='none',data
   assert data['hit'] and data['imageLoaded'];assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   page.screenshot(path=str(OUT/f'home-{width}-{height}.png'));entry.click();dialog=page.get_by_role('dialog',name='掛機收成',exact=True);dialog.wait_for();assert '演武每關' in dialog.inner_text() and '掛機銀兩' in dialog.inner_text()
   page.wait_for_timeout(250);page.screenshot(path=str(OUT/f'details-{width}-{height}.png'));page.keyboard.press('Escape');dialog.wait_for(state='hidden');assert entry.evaluate('e=>document.activeElement===e')
   report['cases'].append({'width':width,'height':height,**data})
  # 無待收成，icon仍可打開詳情，提示點正常移除。
  page.evaluate("()=>{const state=structuredClone(window.qa.life.getState().state);state.character.flags.idle_silver=0;window.qa.life.setState({state})}")
  entry=page.get_by_role('button',name='掛機收成',exact=True);assert entry.locator('.ink-spar-harvest-dot').count()==0;entry.click();page.get_by_role('dialog',name='掛機收成',exact=True).wait_for();assert page.get_by_role('button',name='收成銀兩 0',exact=True).is_disabled();page.get_by_role('button',name='關閉掛機收成',exact=True).click()
  assert not report['pageerrors'];report.update({'empty_opens_details':True,'focus_returns':True,'modal_content_preserved':True});(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 video=page.video if MODE=='after' else None;ctx.close();b.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/'interaction.mp4')],check=True)
print('HARVEST_ICON_'+MODE.upper()+'_PASS')
