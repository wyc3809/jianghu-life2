"""獨立負載檢查幀時間、keyboard跳過、context-lost同重新載入入帳；唔當真機GPU驗收。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/gacha-codex';SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**',lambda r:r.abort());page.goto('http://127.0.0.1:5173/',wait_until='networkidle');page.bring_to_front();page.evaluate(SETUP,{})
 page.wait_for_timeout(800)
 def measure():
  return page.evaluate('''()=>new Promise(resolve=>{const times=[];let last=performance.now();function tick(now){times.push(now-last);last=now;if(times.length<180)requestAnimationFrame(tick);else{const a=times.slice(1).sort((a,b)=>a-b);resolve({samples:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),heap:performance.memory?.usedJSHeapSize??null,canvas:document.querySelectorAll('canvas').length})}}requestAnimationFrame(tick)})''')
 idle=measure();page.get_by_role('button',name='抽十次',exact=False).click();root=page.locator('[data-subject="codex"]');root.wait_for()
 # 聚焦靜音掣時Escape仍須可以跳過；唔改抽取結果。
 page.get_by_role('button',name='靜音',exact=True).focus();page.keyboard.press('Escape');page.locator('[data-subject="codex"][data-phase="settle"]').wait_for();ten=measure();meta=page.evaluate('JSON.stringify(window.qa.anc.getState().meta)')
 page.get_by_role('button',name='靜音',exact=True).focus();page.keyboard.press('Escape');root.wait_for(state='detached');assert page.evaluate('JSON.stringify(window.qa.anc.getState().meta)')==meta
 persisted=page.evaluate('async()=>{const{loadAncestry}=await import("/src/store/ancestryMeta.ts");return JSON.stringify(loadAncestry())}');assert json.loads(persisted)==json.loads(meta)
 # 第二次真抽取模擬GPU context lost：同一份已入帳結果轉DOM後備。
 page.evaluate('window.qa.anc.setState(s=>({meta:{...s.meta,jade:{free:60,paidTest:0}}}))');page.get_by_role('button',name='抽一次',exact=False).click();root.wait_for();committed=page.evaluate('JSON.stringify(window.qa.anc.getState().meta)')
 root.locator('canvas').first.evaluate("el=>el.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))")
 page.get_by_role('dialog').filter(has_text='已入家族收藏').wait_for();assert page.evaluate('JSON.stringify(window.qa.anc.getState().meta)')==committed
 page.get_by_role('button',name='完成入藏',exact=True).click();page.wait_for_timeout(300)
 assert not errors,errors
 report={'environment':'Linux Chromium / SwiftShader / 390x844 / DPR2，獨立運行','idle':idle,'settled_ten':ten,'keyboard_skip_on_control':True,'keyboard_close_on_control':True,'local_save_match':True,'context_lost_same_results':True,'page_errors':errors,'limits':'RAF唔等於GPU耗時；heap唔等於GPU峰值；未做iPhone真機／長時間溫度測試'}
 (OUT/'performance-recovery.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False));b.close()
