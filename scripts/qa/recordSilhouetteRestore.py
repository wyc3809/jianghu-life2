"""錄產品Canvas嘅原本黑影交手；唔生成新人物或補畫動作。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/silhouette-restore'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
 p.goto('http://127.0.0.1:5292/?battle-preview=unified&kind=event');p.wait_for_function('!!window.__martialBattleStage',polling=100);p.wait_for_timeout(500)
 data=p.evaluate('''()=>new Promise(resolve=>{const c=document.querySelector('.ink-unified-canvas-host canvas'),stream=c.captureStream(20),parts=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm'});recorder.ondataavailable=e=>parts.push(e.data);recorder.onstop=()=>{for(const track of stream.getTracks())track.stop();const r=new FileReader;r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(parts,{type:'video/webm'}))};recorder.start();setTimeout(()=>recorder.stop(),3500)})''')
 (OUT/'black-combat.webm').write_bytes(base64.b64decode(data));b.close();print('SILHOUETTE_RECORD_PASS')
