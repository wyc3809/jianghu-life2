"""以瀏覽器原圖製作文字改版對照，保留標題及修訂區紅框。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/written-copy'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
head=ImageFont.truetype(FONT,24);small=ImageFont.truetype(FONT,15)

def board(name,title,region):
    canvas=Image.new('RGB',(828,940),'#f4eedf');draw=ImageDraw.Draw(canvas)
    draw.text((16,10),title,font=head,fill='#302d28')
    draw.text((16,44),'390×844・DPR2｜seed42｜免費玉石600／付費0',font=small,fill='#655a4b')
    for x,phase,label in [(16,'before','修改前'),(422,'after','修改後')]:
        draw.text((x,70),label,font=small,fill='#9a352d')
        canvas.paste(Image.open(OUT/f'{phase}-{name}.png').convert('RGB').resize((390,844)),(x,96))
        if phase=='after':
            a,b,c,d=region;draw.rectangle((x+a,96+b,x+c,96+d),outline='#bd342d',width=3)
    canvas.save(OUT/f'comparison-{name}.png')

board('encounter','奇遇：書面語敘事與清楚的選項',(16,475,374,805))
board('gacha-rules','秘笈閣：規則與碎片說明',(25,370,365,520))
board('title','開卷：改用直接的遊戲介紹',(20,250,370,530))
