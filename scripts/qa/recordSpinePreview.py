"""用App內同一組按鈕定時連續播放，錄真實Runtime畫面；不逐幀合成動畫。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-character'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,record_video_dir=str(ROOT/'.local-online/spine-ai/quick-video'),record_video_size={'width':390,'height':844});page=c.new_page();page.goto('http://127.0.0.1:5277/?spine-lab=1');page.locator('iframe').wait_for();f=page.frames[1];f.wait_for_function('__spineLab?.ready')
    f.evaluate('''async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const tap=name=>document.querySelector('[data-action='+name+']').click();tap('idle');await wait(1600);tap('attack');await wait(1600);tap('hurt');await wait(1400);tap('attack');await wait(1600);tap('idle');await wait(800)}''')
    assert f.evaluate('__spineLab.metrics.invalidFrames')==0
    report={'actualIphone':False,'realTimeRecording':True,'scriptedButtonTiming':True,'manualFrameSynthesis':False,'metrics':f.evaluate('__spineLab.metrics'),'contextAttributes':f.evaluate('__spineLab.player.context.gl.getContextAttributes()')}
    assert report['contextAttributes']['preserveDrawingBuffer'] is False
    video=page.video;c.close();video.save_as(str(OUT/'motion.webm'));b.close();(OUT/'motion-recording.json').write_text(json.dumps(report,indent=2)+'\n');print('SPINE_MOTION_RECORDED')
