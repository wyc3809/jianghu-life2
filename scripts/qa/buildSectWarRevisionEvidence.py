"""將唯一原稿／被否決實作／最後真播放放同幅，並保存六時刻概覽。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/sect-war-revision'
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',13)
def read(p):return Image.open(p).convert('RGB').resize((390,844),Image.Resampling.LANCZOS)
source=read(ROOT/'design/art/sect-battle/selected-portrait.png');old=read(ROOT/'production/qa/evidence/redesign/sect-war/showcase/playing-390.png');new=read(OUT/'final/4s.png')
def pair(a,b,label1,label2,name):
 im=Image.new('RGB',(830,925),'#f4eedf');d=ImageDraw.Draw(im)
 for x,img,label in [(15,a,label1),(425,b,label2)]:d.text((x,8),label,font=font,fill='#25231e');im.paste(img,(x,40))
 d.text((15,899),'同幅390×844；右方為真遊戲元件試演00:04，未發布、待畫面確認。',font=small,fill='#5b5141');im.save(OUT/name,quality=95)
pair(source,new,'玩家選定原稿','重做後實播 · 未驗收','source-comparison.jpg')
pair(old,new,'已被否決的EA0.100.0','重做後實播 · 未發布','before-after.jpg')
sheet=Image.new('RGB',(810,1204),'#f4eedf');d=ImageDraw.Draw(sheet)
for i,t in enumerate(['0.75','2','3','4','6','8']):
 im=read(OUT/'final'/(t+'s.png'));im.thumbnail((260,563),Image.Resampling.LANCZOS);x=(i%3)*270+5;y=(i//3)*602+30;sheet.paste(im,(x,y));d.text((x,y-25),t+'秒',font=font,fill='#25231e')
sheet.save(OUT/'six-moments.jpg',quality=94)
print('REVISION_COMPARISON_READY')
