"""整理真錄影及截圖；不生成遊戲畫面、不插假戰鬥幀。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/sect-battle-prototype'
video=json.loads((OUT/'showcase.json').read_text())['video']
subprocess.run(['ffmpeg','-y','-i',video,'-t','18','-vf','fps=24,scale=390:844:flags=lanczos','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'same-field-demo.mp4')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
subprocess.run(['ffmpeg','-y','-i',video,'-t','16','-filter_complex','fps=8,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',str(OUT/'same-field-demo.gif')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';large=ImageFont.truetype(font,22);small=ImageFont.truetype(font,16)
canvas=Image.new('RGB',(828,1000),'#f8f1e3');d=ImageDraw.Draw(canvas)
d.text((16,10),'同場混戰：二十人共用一個戰場',font=large,fill='#25241f')
for x,file,label in [(16,'formation-390.png','原型：兩派各十名代表列陣'),(422,'melee-showcase-390.png','原型：同一時間自主尋敵、出招及轉火')]:
 d.text((x,48),label,font=small,fill='#a43c30');im=Image.open(OUT/file).convert('RGB').resize((390,844),Image.Resampling.LANCZOS);canvas.paste(im,(x,78))
d.rectangle((432,204,802,750),outline='#ba392e',width=3)
d.text((16,942),'390×844／DPR2；隔離示範，沒有接入真帳戶或派獎。',font=small,fill='#25241f');d.text((16,970),'GIF為8fps／影片24fps匯出，並非iPhone幀率量度。',font=small,fill='#25241f');canvas.save(OUT/'formation-melee.jpg',quality=90)
if (OUT/'before-single-demo-390.png').exists():
 board=Image.new('RGB',(828,1000),'#f8f1e3');d=ImageDraw.Draw(board);d.text((16,10),'戰鬥形式對照：單挑 → 同場混戰',font=large,fill='#25241f')
 for x,file,label in [(16,'before-single-demo-390.png','現有：一對一開發示範'),(422,'melee-showcase-390.png','新增原型：二十人同場')]:
  d.text((x,48),label,font=small,fill='#a43c30');board.paste(Image.open(OUT/file).convert('RGB').resize((390,844),Image.Resampling.LANCZOS),(x,78))
 d.rectangle((432,204,802,750),outline='#ba392e',width=3);d.text((16,946),'兩套隔離示範，只比較人數／構圖，不比較強度或效能。',font=small,fill='#25241f');board.save(OUT/'before-after.jpg',quality=90)
print('SECT_EVIDENCE_BUILT',flush=True)
