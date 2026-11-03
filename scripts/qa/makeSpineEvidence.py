"""只裁切／排列實際App截圖作接點對照，不修改人物美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-character'
preferred=Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
font_path=preferred if preferred.exists() else Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
font=ImageFont.truetype(str(font_path),24,index=0 if preferred.exists() else 3)
small=ImageFont.truetype(str(font_path),17,index=0 if preferred.exists() else 3)
old=Image.open(ROOT/'production/qa/evidence/redesign/character-rig-prototype/app-idle.png').convert('RGB').resize((390,844),Image.Resampling.LANCZOS)
new=Image.open(OUT/'app-idle.png').convert('RGB').resize((390,844),Image.Resampling.LANCZOS)
board=Image.new('RGB',(810,940),'#f7f0e2');d=ImageDraw.Draw(board);d.text((15,10),'舊原型：玩家已否決',font=font,fill='#a3392f');d.text((420,10),'Spine：動作待評閱',font=font,fill='#2c3833');board.paste(old,(10,55));board.paste(new,(410,55));d.rectangle((145,315,275,445),outline='#b44032',width=3);d.rectangle((540,205,680,365),outline='#b44032',width=3);d.text((15,910),'同為390×844；展示高度與鏡頭不同，不作等比例量測。',font=small,fill='#665b4c');board.save(OUT/'before-after.png')
board=Image.new('RGB',(1380,640),'#f7f0e2');d=ImageDraw.Draw(board)
for i,(name,label) in enumerate([('idle','待機・頭頸與肩'),('attack','出拳・肩肘與腕'),('hurt','受擊・頸肩連動')]):
    image=Image.open(OUT/f'app-{name}.png').convert('RGB');crop=image.crop((200,280,650,850));board.paste(crop,(i*460,55));d.text((i*460+12,12),label,font=font,fill='#34382f')
d.text((12,615),'實際App截圖裁切；不是重新生成或修補人物。',font=small,fill='#665b4c');board.save(OUT/'joints.png');print('SPINE_EVIDENCE_BOARDS_PASS')
