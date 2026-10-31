"""放大頭頸接位、八款頭乘三套衣著、保護面孔髮絲及完整姿勢實播證據。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2];LOCAL=ROOT/'.local-online/neck-review';OUT=ROOT/'production/qa/evidence/redesign/neck-review'
LOCAL.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
(LOCAL/'zoom.html').write_text('<html><body style="margin:0;background:#eee7d8"><canvas width="1920" height="900"></canvas><script type="module" src="./zoom.ts"></script></body></html>')
(LOCAL/'zoom.ts').write_text('''import {loadAppearanceAssets} from '../../src/appearance/assets';
import {drawAppearance} from '../../src/appearance/model';
import {appearanceComposition} from '../../src/appearance/pose';
import {appearanceHead} from '../../src/appearance/neck';
import {APPEARANCE_HEADS} from '../../interfaces/appearance';
const a=await loadAppearanceAssets(),x=document.querySelector('canvas')!.getContext('2d')!,original=new URLSearchParams(location.search).has('original');
if(original)delete a.neck;
let protectedPixels=0,changedNeck=0;
for(let row=0;row<3;row++)for(let i=0;i<8;i++){
 const v={head:APPEARANCE_HEADS[i],outfit:['traveller','scholar','cloak'][row],tone:['ink','jade','cinnabar'][row]}as any;
 const h=a.heads[v.head],p=appearanceComposition(v,'seated',h.naturalWidth/h.naturalHeight);x.save();x.beginPath();x.rect(i*240,row*300,240,300);x.clip();
 x.fillStyle='#30352e';x.font='14px sans-serif';x.fillText(v.head,i*240+15,row*300+20);
 drawAppearance(x,a,v,{x:i*240+120,y:row*300+210-p.neck.y*2,height:800,pose:'seated'});x.restore();
 if(original)continue;
 const get=(image:CanvasImageSource)=>{const c=document.createElement('canvas');c.width=h.naturalWidth;c.height=h.naturalHeight;const q=c.getContext('2d')!;q.drawImage(image,0,0);return q.getImageData(0,0,c.width,c.height).data;};
 const before=get(h),after=get(appearanceHead(a,v,p));
 for(let yy=0;yy<h.naturalHeight;yy++)for(let xx=0;xx<h.naturalWidth;xx++){
  const k=(yy*h.naturalWidth+xx)*4,r=before[k],g=before[k+1],b=before[k+2],skin=r>=140&&g>=100&&b>=75&&r-g>10&&r-b>23&&g-b>7;
  const protect=p.head.y+yy/h.naturalHeight*p.head.height< -20||r<130||Math.max(r,g,b)-Math.min(r,g,b)<15;
  if(protect&&before[k+3]>180){for(let c=0;c<4;c++)if(Math.abs(before[k+c]-after[k+c])>1)throw Error('face/hair changed '+v.head+' '+xx+','+yy);protectedPixels++;}
  if(skin&&before[k+3]-after[k+3]>10)changedNeck++;
 }
}
document.body.dataset.report=JSON.stringify({protectedPixels,changedNeck});document.body.dataset.ready='1';''')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1920,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for original in [True,False]:
  page.goto('http://127.0.0.1:5251/.local-online/neck-review/zoom.html'+('?original=1'if original else''));page.wait_for_selector('body[data-ready="1"]');page.screenshot(path=str(OUT/('neck-before.png'if original else'neck-after.png')))
  if not original:report=json.loads(page.get_attribute('body','data-report'));assert report['protectedPixels']>10000 and report['changedNeck']>100
 for outfit in ['traveller','scholar','cloak']:
  page.set_viewport_size({'width':1520,'height':840});page.goto('http://127.0.0.1:5251/.local-online/appearance-fix/poses.html?outfit='+outfit);page.wait_for_selector('body[data-ready="1"]');page.screenshot(path=str(OUT/('poses-'+outfit+'.png')))
 assert not errors,errors;report.update({'all24HeadOutfits':True,'all24BodyPoses':True,'pageerrors':errors,'actualIphone':False});(OUT/'neck-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));b.close()
print('NECK_REVIEW_PASS',report,flush=True)
