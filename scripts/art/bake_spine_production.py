"""官方Spine Runtime離線輸出；手機只讀動作幀及同源握點，不重算戰果。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import base64,io,json,math,hashlib,argparse,re

ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/spine-character';BUILD=ROOT/'.local-online/spine-rollout';OUT=ROOT/'public/ink/art/spine-character';OUT.mkdir(exist_ok=True)
CLIPS={'idle':(24,2,True),'attack':(30,1.15,False),'hurt':(16,.95,False),'walk':(16,1,True),'down':(12,.85,False),'seated':(1,1,False)}
HTML='''<!doctype html><html><style>*{margin:0;padding:0}#p{width:256px;height:224px}.spine-player{width:100%;height:100%}canvas{display:block;width:100%;height:100%}</style><div id="p"></div><script src="/.local-online/spine-rollout/baker-runtime.js"></script><script>
window.start=async function(){const json=await(await fetch('/design/art/spine-character/production/character.json')).text(),atlas=await(await fetch('/design/art/spine-character/production/character.atlas')).text(),im=await(await fetch('/.local-online/spine-rollout/atlases/atlas-topknot-traveller.png')).blob(),uri=await new Promise(r=>{const f=new FileReader;f.onload=()=>r(f.result);f.readAsDataURL(im)});return new Promise((resolve,reject)=>{window.p=new spine.SpinePlayer('p',{jsonUrl:'character.json',atlasUrl:'character.atlas',rawDataURIs:{'character.json':'data:application/json;base64,'+btoa(json),'character.atlas':'data:text/plain;base64,'+btoa(atlas),'atlas.png':uri},animation:'idle',showControls:false,showLoading:false,alpha:true,backgroundColor:'00000000',premultipliedAlpha:false,preserveDrawingBuffer:true,viewport:{x:-1024,y:-64,width:2048,height:1792,padLeft:0,padRight:0,padTop:0,padBottom:0,transitionTime:0},success(p){setTimeout(()=>{p.pause();p.stopRendering();resolve(true)},20)},error(p,e){reject(Error(e))}})})};
window.skin=async function(name){const im=new Image;im.src='/.local-online/spine-rollout/atlases/atlas-'+name+'.png';await im.decode();const tex=new spine.GLTexture(p.context,im,false),old=new Set;for(const slot of p.skeleton.slots){const a=slot.getAttachment();if(a?.region){old.add(a.region.texture);a.region.texture=tex;a.region.page.texture=tex;}}for(const t of old)t.dispose();window.currentImage=im;};
window.sample=function(name,time){p.pause();p.skeleton.x=p.skeleton.y=0;p.skeleton.setToSetupPose();p.skeleton.data.findAnimation(name).apply(p.skeleton,0,time,false,[],1,spine.MixBlend.setup,spine.MixDirection.mixIn);p.skeleton.updateWorldTransform(spine.Physics.update);
 if(name==='down'||name==='seated'){let min=Infinity;for(const slot of p.skeleton.slots){const a=slot.getAttachment(),v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);for(let i=1;i<v.length;i+=2)min=Math.min(min,v[i]);}p.skeleton.y-=min;p.skeleton.updateWorldTransform(spine.Physics.update);}
 p.drawFrame(false);const b=p.skeleton.findBone('near-hand'),l=b.data.length*.45,wx=b.worldX+b.a*l,wy=b.worldY+b.c*l;return{png:p.canvas.toDataURL('image/png').split(',')[1],grip:[(wx+1024)*.125,(1728-wy)*.125,Math.atan2(-b.c,b.a)-Math.PI/2],head:[p.skeleton.findBone('head').worldX,p.skeleton.findBone('head').worldY]};};
</script>'''

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--only');args=parser.parse_args();BUILD.mkdir(parents=True,exist_ok=True)
 runtime=re.search(r'<script>([\s\S]*?)</script>',(ART/'runtime/review.html').read_text()).group(1)
 (BUILD/'baker-runtime.js').write_text(runtime);(BUILD/'baker.html').write_text(HTML)
 skins=json.loads((ART/'production/skins.json').read_text())['skins'];manifest={'schema':1,'rig':'spine-v02-continuous','runtime':'4.2.120','skeletonSha256':hashlib.sha256((ART/'production/character.json').read_bytes()).hexdigest(),'frameWidth':256,'frameHeight':224,'columns':6,'origin':[128,216],'pixelsPerHeight':1533*.125,'clips':{},'skins':{}}
 samples=[];start=0
 for name,(frames,duration,loop) in CLIPS.items():
  manifest['clips'][name]={'start':start,'frames':frames,'duration':duration,'loop':loop}
  for i in range(frames):samples.append((name,duration*i/(frames if loop else max(1,frames-1))))
  start+=frames
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);page=browser.new_page(viewport={'width':900,'height':900},device_scale_factor=1);page.goto('http://127.0.0.1:5280/.local-online/spine-rollout/baker.html');page.evaluate('start()')
  for style in skins:
   key=style['head']+'-'+style['outfit']
   if args.only and key!=args.only:continue
   page.evaluate('skin',key);sheet=Image.new('RGBA',(256*6,224*math.ceil(len(samples)/6)));grips=[];bounds=[];frames=[]
   for n,(name,time) in enumerate(samples):
    result=page.evaluate('([name,time])=>sample(name,time)',[name,time]);im=Image.open(io.BytesIO(base64.b64decode(result['png']))).convert('RGBA');box=im.getbbox()
    if box and name in ['down','seated']:
     shift=216-box[3];fixed=Image.new('RGBA',im.size);fixed.alpha_composite(im,(0,shift));im=fixed;result['grip'][1]+=shift;box=im.getbbox()
    if not box:raise ValueError(key+' empty frame '+name)
    frames.append(im);grips.append(result['grip']);bounds.append(box)
   # 只裁透明邊及重排，不縮放任何幀；逐幀保留原點，禁止透明包圍盒fit。
   placements=[];x=y=2;row=0
   for box in bounds:
    w,h=box[2]-box[0],box[3]-box[1]
    if x+w+2>1024:x=2;y+=row+4;row=0
    placements.append([x,y,w,h,box[0],box[1]]);x+=w+4;row=max(row,h)
   sheet=Image.new('RGBA',(1024,y+row+2))
   for image,box,rect in zip(frames,bounds,placements):sheet.alpha_composite(image.crop(box),(rect[0],rect[1]))
   path=OUT/(key+'.webp');sheet.save(path,format='WEBP',quality=94,method=6)
   # 人物頁保留高解像靜態：同一骨架，不把戰鬥低解像幀硬放大。
   page.evaluate("document.getElementById('p').style.cssText='width:768px;height:672px'")
   for pose in ['idle','seated']:
    result=page.evaluate('([n,t])=>sample(n,t)',[pose,0]);im=Image.open(io.BytesIO(base64.b64decode(result['png']))).convert('RGBA');im.save(OUT/f'{key}-{pose}.webp',format='WEBP',quality=95,method=6)
   page.evaluate("document.getElementById('p').style.cssText='width:256px;height:224px'")
   fallback=frames[0];buf=io.BytesIO();fallback.save(buf,format='WEBP',quality=82,method=6)
   manifest['skins'][key]={'src':'ink/art/spine-character/'+path.name,'idle':'ink/art/spine-character/'+key+'-idle.webp','seated':'ink/art/spine-character/'+key+'-seated.webp','fallback':'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode(),'grips':grips,'bounds':bounds,'rects':placements,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()};print('BAKED',key,path.stat().st_size,flush=True)
  browser.close()
 target=BUILD/'manifest-preview.json' if args.only else ROOT/'src/appearance/spine/catalog.json';target.write_text(json.dumps(manifest,separators=(',',':'))+'\n');print('BAKE_COMPLETE',len(manifest['skins']),flush=True)

if __name__=='__main__':main()
