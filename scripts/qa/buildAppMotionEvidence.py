"""只整理真瀏覽器截圖及錄影；紅框為報告標註，不是遊戲素材。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/app-motion-guide'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
def board(before,after,name,title,rects):
 canvas=Image.new('RGB',(828,984),'#f8f1e3');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype(FONT,18);small=ImageFont.truetype(FONT,13)
 draw.text((18,9),title,fill='#25241f',font=font)
 for x,file,label in [(16,before,'修改前 EA0.97.2'),(422,after,'修改後 EA0.98.0')]:
  draw.text((x,38),label,fill='#a43c30',font=small);im=Image.open(OUT/file).convert('RGB').resize((390,844),Image.Resampling.LANCZOS);canvas.paste(im,(x,62))
 for left,top,right,bottom in rects:draw.rectangle((422+left,62+top,422+right,62+bottom),outline='#c1322b',width=3)
 draw.text((18,919),'390×844／DPR2；同一隔離存檔，未連接玩家帳戶。',fill='#25241f',font=small)
 draw.text((18,944),'紅框標示引導；僅比較介面，時間推移數值不作強度對照。',fill='#25241f',font=small)
 canvas.save(OUT/name,quality=91)
board('before-person.png','after-person.png','person-before-after.jpg','人物換裝：局部提示及朱砂入口',[(12,184,378,267),(10,360,96,481)])
board('before-picker.png','after-picker.png','picker-before-after.jpg','比較確認：選取不換裝，確認才套用',[(12,386,378,470),(12,708,378,830)])
board('before-equip-home.png','after-equip-home.png','home-before-after.jpg','試煉所得：前往人物，取代直接換上',[(10,590,378,730)])
report=json.loads((OUT/'guide-report.json').read_text());video=next(r['video']for r in report if r.get('video'))
subprocess.run(['ffmpeg','-y','-i',video,'-t','18','-filter_complex','fps=6,scale=330:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',str(OUT/'guide-demo.gif')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
r=json.loads((OUT/'after-animation-report.json').read_text());v=next((r['video']for r in r if r.get('video')),None)
if v:subprocess.run(['ffmpeg','-y','-i',v,'-t','16','-filter_complex','fps=8,scale=330:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',str(OUT/'animation-demo.gif')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('EVIDENCE_BUILT')
