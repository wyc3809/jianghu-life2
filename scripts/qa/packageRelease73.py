"""整理EA0.73.0正式流程截圖／動圖，唔製作遊戲美術。"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
p=Path(__file__).resolve().parents[2]/'production/qa/evidence/redesign/release-ea073'
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',19)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14)
board=Image.new('RGB',(840,940),'#f3ede2');d=ImageDraw.Draw(board)
d.text((18,10),'EA0.73.0 · 正式戰鬥流程驗證',font=font,fill='#28231c')
d.text((18,40),'seed42 · 黃問天 · 390×844 · 原對戰／真實結算',font=small,fill='#6c6356')
for i,(kind,title) in enumerate([('spar-win','演武首領'),('event-boss','江湖首領')]):
 path=p/f'chromium-{kind}.png'
 if path.exists():
  d.text((18+i*410,70),title,font=font,fill='#28231c');board.paste(Image.open(path).convert('RGB').resize((390,844),Image.Resampling.LANCZOS),(18+i*410,96))
board.save(p/'release.png')
for kind in ('spar-win','event-boss'):
 paths=sorted((p/'frames'/kind).glob('*.png'))
 if not paths:continue
 times=json.loads((p/'frames'/kind/'times.json').read_text());paths=paths[:len(times)]
 frames=[Image.open(path).convert('RGB').quantize(colors=192) for path in paths]
 durations=[max(40,round(times[i+1]-times[i])) for i in range(len(times)-1)]+[900]
 frames[0].save(p/f'{kind}.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
