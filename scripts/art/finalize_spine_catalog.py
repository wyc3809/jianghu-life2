"""完整輸出檢查、高解像盤坐後備及來源映射；不重畫人物或改動動作。"""
from pathlib import Path
from PIL import Image
import json,base64,io,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/spine-character';OUT=ROOT/'public/ink/art/spine-character';CAT=ROOT/'src/appearance/spine/catalog.json'

def main():
 c=json.loads(CAT.read_text())
 if len(c['skins'])!=24:raise ValueError('未覆蓋八頭三衣，拒絕發布')
 total=sum(clip['frames'] for clip in c['clips'].values())
 for key,skin in c['skins'].items():
  if not all(len(skin[prop])==total for prop in ['grips','bounds','rects']):raise ValueError(key+' 幀數不一致')
  for rect,box in zip(skin['rects'],skin['bounds']):
   if rect[2:4]!=[box[2]-box[0],box[3]-box[1]]:raise ValueError('圖集裁切曾改大小')
   if box[0]<=0 or box[1]<=0 or box[2]>=c['frameWidth'] or box[3]>=c['frameHeight']:raise ValueError(key+' 人物被鏡頭截斷')
  im=Image.open(OUT/(key+'-seated.webp')).convert('RGBA').resize((c['frameWidth'],c['frameHeight']),Image.Resampling.LANCZOS);buf=io.BytesIO();im.save(buf,format='WEBP',quality=82,method=6);skin['fallbackSeated']='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
 CAT.write_text(json.dumps(c,separators=(',',':'))+'\n')
 shutil.copyfile(ART/'runtime/SPINE-RUNTIME-LICENSE.txt',OUT/'SPINE-RUNTIME-LICENSE.txt')
 sources={name:hashlib.sha256((ART/'sources'/name).read_bytes()).hexdigest() for name in ['sheet-traveller.png','sheet-scholar.png','sheet-cloak.png','upper-body-v02.png']}
 (ART/'production/source-manifest.json').write_text(json.dumps({'sources':sources,'generatedIds':{'sheet-traveller.png':'exec-b03f06d6-5ee5-4e4a-aced-19163360bf8a.png','sheet-scholar.png':'exec-31e261ad-d9c4-4cf3-b18a-f8dc3341331e.png','sheet-cloak.png':'exec-36acaaa3-8976-4769-8dbf-491d2c40c7f0.png'},'originalsPreserved':True,'prompt':'../prompts/production-skins.txt','license':'按生成服務條款；未宣稱CC0。玩家已確認Spine工具及編輯器授權。','catalogSha256':hashlib.sha256(CAT.read_bytes()).hexdigest(),'runtime':'4.2.120','nativeEditorRoundTrip':False,'skins':24,'framesPerSkin':total},ensure_ascii=False,indent=2)+'\n')
 print('CATALOG_FINALIZED',len(c['skins']),total,'all frames fixed scale and inside camera')

if __name__=='__main__':main()
