"""同一武學、造型、時間與產品呈現器，對照已發布EA0.102.0及修正版素材。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import subprocess,base64,io,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/character-bind-rollout';BEFORE=ROOT/'.local-online/repaired-before';BEFORE.mkdir(parents=True,exist_ok=True)
ref='bdabe7558f440ec3db067a4219f8c33d2b183d8a'
files=['art_river_fist.json','art_river_fist.webp','_upper-topknot.json','_upper-topknot.webp']
for name in files:
 p=BEFORE/name
 if not p.exists():p.write_bytes(subprocess.check_output(['git','show',f'{ref}:public/ink/art/independent/traveller/{name}'],cwd=ROOT))
images=[]
def old_route(name):
 def handle(route):route.fulfill(path=str(BEFORE/name),content_type='application/json' if name.endswith('.json') else 'image/webp')
 return handle
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for label in ['before','after']:
  p=b.new_page(viewport={'width':390,'height':844});p.route('**/*.supabase.co/**',lambda r:r.abort())
  if label=='before':
   for name in files:
    p.route('**/ink/art/independent/traveller/'+name+'*',old_route(name))
  p.goto('http://127.0.0.1:5292/?martial-preview=1&art=art_river_fist&pose=1&clean=1');p.wait_for_function('!!window.__martialQa',timeout=90000)
  pictures=p.evaluate('''async()=>{const {loadAppearanceAssets}=await import('/src/appearance/assets.ts'),{drawIndependentAppearance}=await import('/src/appearance/independent/draw.ts');const assets=await loadAppearanceAssets(),a={head:'topknot',outfit:'traveller',tone:'jade'};await assets.independent.prepareClip(a,'art_river_fist');await assets.independent.prepareUpper(a);const c=document.createElement('canvas');c.width=480;c.height=380;const x=c.getContext('2d');return [0,.24,.8].map(t=>{x.fillStyle='#eee6d6';x.fillRect(0,0,480,380);if(!drawIndependentAppearance(x,assets,a,{x:210,y:350,height:275,pose:'attack',family:'fist',martialId:'art_river_fist',motionTime:t}))throw Error('素材未備妥');return c.toDataURL()})}''')
  images.append([Image.open(io.BytesIO(base64.b64decode(uri.split(',')[1]))).convert('RGB') for uri in pictures]);p.close()
 b.close()
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';heading=ImageFont.truetype(font,27);small=ImageFont.truetype(font,20)
board=Image.new('RGB',(1440,880),'#eee6d6');d=ImageDraw.Draw(board)
for row,label in enumerate(['之前 EA0.102.0','之後 EA0.103.0']):
 y=row*440;d.text((20,y+8),label+' · 同一產品位圖呈現器',font=heading,fill='#28251f')
 for col,t in enumerate([0,.24,.8]):
  x=col*480;board.paste(images[row][col],(x,y+45));d.text((x+18,y+47),f'長河拳 {t:.2f}s',font=small,fill='#28251f');d.rectangle((x+123,y+100,x+342,y+421),outline='#ae342a',width=3)
board.save(OUT/'before-after.jpg',quality=95)
(OUT/'comparison.json').write_text(json.dumps({'beforeCommit':ref,'appearance':{'head':'topknot','outfit':'traveller','tone':'jade'},'martialId':'art_river_fist','sampleTimes':[0,.24,.8],'sameProductRenderer':True,'artOnlyNoSaveWrites':True},ensure_ascii=False,indent=2)+'\n')
print('COMPARISON_PASS')
