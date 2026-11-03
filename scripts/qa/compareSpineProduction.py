"""同一角色ID及顯示身高的舊新真renderer對照，不逐頭調整倍率。"""
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-rollout'
import subprocess
original=subprocess.check_output(['git','show','9a07caf49b0b05b6d7b39def891a41925391bbed:src/appearance/model.ts'],cwd=ROOT,text=True)
source=original.replace("'../spar/rig'","'/src/spar/rig'").replace("'./pose'","'/src/appearance/pose'").replace("'./assets'","'/src/appearance/assets'").replace("'./neck'","'/src/appearance/neck'")
(ROOT/'.local-online/spine-rollout/before-model.ts').write_text(source)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1000,'height':650},device_scale_factor=1);page.goto('http://127.0.0.1:5281/');
 page.evaluate('''async()=>{const{loadAppearanceAssets,prepareAppearance}=await import('/src/appearance/assets.ts'),before=await import('/.local-online/spine-rollout/before-model.ts'),after=await import('/src/appearance/model.ts'),assets=await loadAppearanceAssets(),a={head:'topknot',outfit:'traveller',tone:'ink'};await prepareAppearance(assets,a);await assets.spine.prepare(a,'idle');const c=document.createElement('canvas');c.width=1000;c.height=650;const x=c.getContext('2d');x.fillStyle='#eee6d6';x.fillRect(0,0,1000,650);x.font='26px sans-serif';x.fillStyle='#25221e';x.fillText('EA0.100.0',80,45);x.fillText('EA0.101.0',580,45);x.font='20px sans-serif';x.fillText('topknot / traveller / ink · 400px actor height',80,620);before.drawAppearance(x,assets,a,{x:250,y:530,height:400,pose:'idle',time:0});after.drawAppearance(x,assets,a,{x:750,y:530,height:400,pose:'idle',time:0,quality:'portrait'});x.strokeStyle='#a3342e';x.lineWidth=3;x.strokeRect(190,110,140,140);x.strokeRect(690,110,140,140);window.qaComparison=c.toDataURL()}''');import base64;(OUT/'before-after.png').write_bytes(base64.b64decode(page.evaluate('qaComparison.split(",")[1]')));b.close()
