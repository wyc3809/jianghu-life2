"""只整理真實瀏覽器轉場截圖，唔畫遊戲素材。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[2]
p=root/'production/qa/evidence/redesign/battle-ink-entrance'
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',17)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',13)
for kind in ('spar','event'):
    paths=sorted((p/'frames'/kind).glob('*.png'))
    frames=[Image.open(path).convert('RGB').quantize(colors=192) for path in paths]
    if not frames:
        continue
    frames[0].save(p/f'entrance-{kind}.gif',save_all=True,append_images=frames[1:],duration=[40]*(len(frames)-1)+[900],loop=0,disposal=2)
    board=Image.new('RGB',(840,1290),'#f3ede2')
    draw=ImageDraw.Draw(board)
    draw.text((18,10),'B · 墨暈揭幕 · 實際瀏覽器原型，未上線',font=font,fill='#28231c')
    draw.text((18,38),'揭幕時暫停出招；720ms完成，之後開始交手',font=small,fill='#6c6356')
    labels=['0ms · 入場','160ms · 宣紙淡入','320ms · 中央墨暈','480ms · 向外揭幕','640ms · 墨邊散去','800ms · 可以交手']
    for n,i in enumerate([0,4,8,12,16,20]):
        x=18+(n%3)*274;y=75+(n//3)*603
        draw.text((x,y),labels[n],font=small,fill='#28231c')
        shot=Image.open(paths[i]).convert('RGB').resize((260,563),Image.Resampling.LANCZOS)
        board.paste(shot,(x,y+28))
        draw.rectangle((x,y+28,x+259,y+590),outline='#a33a32',width=1)
    board.save(p/f'storyboard-{kind}.png')
