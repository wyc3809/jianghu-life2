"""三衣十九類實際官方Runtime起手／接觸／收招板；武器由產品測試另核對。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json,base64,io
root=Path(__file__).resolve().parents[2];clips=json.load(open(root/'design/art/independent-animation/compiled-clips.json'));families={}
for name,c in clips.items():
 if c['kind']!='lifecycle' and c['family'] not in families:families[c['family']]=(name,c)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);p=b.new_page(viewport={'width':400,'height':400})
 for outfit in ['traveller','scholar','cloak']:
  p.goto('http://127.0.0.1:5293/.local-online/full-martial-motion/baker.html?outfit='+outfit);p.evaluate('ready')
  for batch in range(4):
   cases=list(families.items())[batch*5:batch*5+5]
   if not cases:continue
   board=Image.new('RGBA',(384*3,288*len(cases)),'#eee6d7')
   for row,(family,(name,c)) in enumerate(cases):
    p.evaluate('loadClip',name)
    for col,t in enumerate([0,c['contacts'][0] if c['contacts'] else c['duration']*.5,c['duration']*.8]):
     data=p.evaluate('''([n,t])=>{const s=player.skeleton;s.setToSetupPose();s.data.findAnimation(n).apply(s,0,t,false,[],1,spine.MixBlend.setup,spine.MixDirection.mixIn);s.updateWorldTransform(spine.Physics.update);player.drawFrame(false);return player.canvas.toDataURL().split(',')[1]}''',[name,t]);board.alpha_composite(Image.open(io.BytesIO(base64.b64decode(data))),(col*384,row*288));ImageDraw.Draw(board).text((col*384+8,row*288+5),f'{family} {t:.3f}s',font=font,fill='#28251f')
   board.convert('RGB').save(root/f'production/qa/evidence/redesign/character-bind-rollout/{outfit}-{batch+1}.jpg',quality=94)
 b.close()
