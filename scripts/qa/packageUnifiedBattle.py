"""第26項只整理真實截圖／播放GIF，唔製作遊戲美術。"""
from pathlib import Path
import json
import os
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]
p=root/os.environ.get('QA_EVIDENCE_DIR','production/qa/evidence/redesign/unified-battle')
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
f=ImageFont.truetype(font,19)
small=ImageFont.truetype(font,14)

def board(items,name,red=False):
    image=Image.new('RGB',(24+len(items)*410,938),'#f4eee3')
    draw=ImageDraw.Draw(image)
    draw.text((18,10),'統一戰鬥畫面原型 · 先睇圖，未上線',font=f,fill='#24201a')
    draw.text((18,40),'實際遊戲截圖 · seed42 · 390×844 · 血條及武功跟戰報',font=small,fill='#686052')
    for i,(file,title) in enumerate(items):
        x=18+i*410
        draw.text((x,68),title,font=f,fill='#24201a')
        shot=Image.open(p/file).convert('RGB').resize((390,844),Image.Resampling.LANCZOS)
        image.paste(shot,(x,94))
        if red and 'chromium-' in file:
            for box in [(12,10,378,175),(12,660,378,831)]:
                draw.rectangle((x+box[0],94+box[1],x+box[2],94+box[3]),outline='#b43b31',width=2)
    image.save(p/name)

board([('chromium-spar.png','演武首領 · 原型'),('chromium-event.png','江湖交手 · 原型')],'prototype.png')
board([('before-spar.png','演武首領 · 改前'),('chromium-spar.png','演武首領 · 原型'),('before-event.png','江湖交手 · 改前'),('chromium-event.png','江湖交手 · 原型')],'before-after.png',True)
paths=sorted((p/'frames/gif').glob('*.png'))
if paths:
    times=json.loads((p/'frames/gif/times.json').read_text())
    frames=[Image.open(path).convert('RGB').quantize(colors=192) for path in paths]
    durations=[max(40,round(times[i+1]-times[i])) for i in range(len(times)-1)]+[900]
    frames[0].save(p/'battle.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2,optimize=False)
