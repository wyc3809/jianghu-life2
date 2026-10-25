"""正式構建逐招演出：真核心待戰存檔、真Canvas／DOM，無引擎替身。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/martial-economy-v2';TEMP=ROOT/'.local-online/martial-economy-v2/video';TEMP.mkdir(parents=True,exist_ok=True)
f=json.loads((ROOT/'.local-online/martial-economy-v2/battle.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='no-preference',record_video_dir=str(TEMP),record_video_size={'width':390,'height':844})
 for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
 c.add_init_script('''(()=>{const f='''+json.dumps(f,ensure_ascii=False)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));window.trace=[];let last='';document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>{const el=document.querySelector('.ink-unified-callout');if(!el)return;const text=el.textContent.trim(),round=document.querySelector('.ink-unified-round')?.textContent;if(text&&text!==last){last=text;window.trace.push({text,round,at:performance.now()});}}).observe(document.body,{subtree:true,childList:true,characterData:true});});})();''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5188/');page.get_by_role('button',name=re.compile('^續寫前緣')).click();page.locator('.ink-unified-battle').wait_for(timeout=60000)
 page.wait_for_function('window.trace.some(t=>t.round.includes("1")&&t.text.startsWith("卷七"))',timeout=60000);page.screenshot(path=str(OUT/'seven-volume.png'))
 page.wait_for_function('window.trace.some(t=>t.text.startsWith("卷一")&&t.round.includes("2"))',timeout=30000)
 trace=page.evaluate('window.trace');first=[t['text'] for t in trace if t['round']=='第 1 回合' and t['text'].startswith('卷')];assert len(first)==7,first
 assert not errors,errors
 before=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');page.get_by_role('button',name='跳過 ›',exact=True).click();page.wait_for_timeout(500)
 after=page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
 for key in ['jade','manuals','pages','gacha']:assert before.get(key)==after.get(key),key
 video=page.video.path();c.close();b.close()
 subprocess.run(['ffmpeg','-y','-i',str(video),'-vf','fps=8,scale=312:-1','-t','35',str(OUT/'seven-volume.gif')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
 (OUT/'playback.json').write_text(json.dumps({'productionBuild':True,'actualIphone':False,'fixture':'seed42, hp5000, no gear, ordinary seven volumes, real startCombat boss','trace':trace,'roundOneVolumes':first,'skipAccountBalancesUnchanged':True,'pageerrors':errors},ensure_ascii=False,indent=2));print('MARTIAL_V2_PLAYBACK_PASS')
