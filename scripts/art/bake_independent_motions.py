"""官方Runtime輸出同幀肢體／握點及連續上身；保留固定原點與比例，不逐格fit。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import argparse,json,math,base64,io,hashlib,re
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';OLD=ROOT/'design/art/spine-character';BUILD=ROOT/'.local-online/full-martial-motion';OUT=ROOT/'public/ink/art/independent';ORIGIN=[192,272];DENSITY=.125;HEIGHT=1533*DENSITY
HTML='''<!doctype html><style>*{margin:0}#p{width:384px;height:288px}canvas{display:block}</style><div id=p></div><script src=runtime.js></script><script>
const url=new URLSearchParams(location.search),outfit=url.get('outfit')||'traveller';window.ready=new Promise(async(resolve,reject)=>{const base=await(await fetch(outfit+'/rig.json')).json();base.animations={art_river_fist:await(await fetch(outfit+'/clips/art_river_fist.json')).json()};const j=JSON.stringify(base),a=await(await fetch(outfit+'/character.atlas')).text(),blob=await(await fetch(outfit+'/atlas.png')).blob(),uri=await new Promise(r=>{const f=new FileReader;f.onload=()=>r(f.result);f.readAsDataURL(blob)});const sourceImage=new Image();sourceImage.src=uri;await sourceImage.decode();const sourceCanvas=document.createElement('canvas');sourceCanvas.width=sourceImage.width;sourceCanvas.height=sourceImage.height;const sourceContext=sourceCanvas.getContext('2d',{willReadFrequently:true});sourceContext.drawImage(sourceImage,0,0);window.sourcePixels={data:sourceContext.getImageData(0,0,sourceCanvas.width,sourceCanvas.height).data,width:sourceCanvas.width,height:sourceCanvas.height};window.player=new spine.SpinePlayer('p',{jsonUrl:'character.json',atlasUrl:'character.atlas',rawDataURIs:{'character.json':'data:application/json;base64,'+btoa(j),'character.atlas':'data:text/plain;base64,'+btoa(a),'atlas.png':uri},animation:'art_river_fist',showControls:false,showLoading:false,alpha:true,backgroundColor:'00000000',preserveDrawingBuffer:true,premultipliedAlpha:false,viewport:{x:-1536,y:-128,width:3072,height:2304,padLeft:0,padRight:0,padTop:0,padBottom:0,transitionTime:0},success(p){setTimeout(()=>{p.pause();p.stopRendering();const renderer=p.sceneRenderer,draw=renderer.drawSkeleton.bind(renderer);renderer.drawSkeleton=(s,...args)=>{const hidden=[];for(const slot of s.slots)if(slot.color.a===0&&slot.attachment){hidden.push([slot,slot.attachment]);slot.attachment=null;}try{return draw(s,...args)}finally{for(const[slot,attachment]of hidden)slot.attachment=attachment;}};resolve(true)},20)},error(p,e){reject(Error(e))}})});
window.loadClip=async name=>{player.skeleton.data.animations=[];new spine.SkeletonJson({}).readAnimation(await(await fetch(outfit+'/clips/'+encodeURIComponent(name)+'.json')).json(),name,player.skeleton.data)};
const groups=[['cloth-back','far-leg','near-leg','far-arm'],['hip','cloth-front'],['far-hand','near-hand'],['near-arm','near-punch']];
let originalAlpha=new Map();function show(names){for(const s of player.skeleton.slots)s.color.a=names.includes(s.data.name)?originalAlpha.get(s.data.name)??1:0}
window.sample=(name,t,hands)=>{const p=player,s=p.skeleton;s.x=s.y=0;s.setToSetupPose();s.updateWorldTransform(spine.Physics.update);const restChest=s.findBone('chest'),rest=[192+restChest.worldX*.125,272-restChest.worldY*.125];s.data.findAnimation(name).apply(s,0,t,false,[],1,spine.MixBlend.setup,spine.MixDirection.mixIn);s.updateWorldTransform(spine.Physics.update);
 if(name==='_down'){let low=Infinity;for(const slot of s.slots){const a=slot.getAttachment();if(!a?.worldVerticesLength)continue;const v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);const uv=a.regionUVs,r=a.region,source=sourcePixels;for(let i=1;i<v.length;i+=2){const vertex=(i-1)/2,x=Math.round(r.x+uv[vertex*2]*r.width),y=Math.round(r.y+uv[vertex*2+1]*r.height);if(source.data[(y*source.width+x)*4+3]>80)low=Math.min(low,v[i])}}if(Number.isFinite(low))s.y-=low;s.updateWorldTransform(spine.Physics.update)}
 originalAlpha=new Map(s.slots.map(z=>[z.data.name,z.color.a]));const gl=p.context.gl,renderer=p.sceneRenderer;document.getElementById('p').style.cssText='width:768px;height:576px';if(p.canvas.width!==768){p.canvas.width=768;p.canvas.height=576;}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);renderer.camera.setViewport(384,288);renderer.camera.zoom=8;renderer.camera.position.x=0;renderer.camera.position.y=1024;groups.forEach((g,i)=>{show(g);gl.viewport(i%2*384,i<2?288:0,384,288);renderer.begin();renderer.drawSkeleton(s,false);renderer.end()});const batch=p.canvas.toDataURL().split(',')[1];const chest=s.findBone('chest'),cx=192+chest.worldX*.125,cy=272-chest.worldY*.125,a=chest.a,b=-chest.c,c=-chest.b,d=chest.d;const upper=[a,b,c,d,cx-a*193-b*124.125,cy-b*193-d*124.125];
 // 基準胸骨(8,1183) -> (193,124.125)；畫面Y向下，不能混用世界Y。
 upper[4]=cx-a*rest[0]-c*rest[1];upper[5]=cy-b*rest[0]-d*rest[1];
 const grip=side=>{const bone=s.findBone(side+'-hand'),slot=s.findSlot(side+'-hand'),key=slot.getAttachment().name,meta=hands[key],g=meta.grip;return[192+(bone.worldX+bone.a*g[0]+bone.b*g[1])*.125,272-(bone.worldY+bone.c*g[0]+bone.d*g[1])*.125,Math.atan2(-bone.c,bone.a)]};
 const neck=s.findBone('neck'),head=s.findBone('head'),turn=neck.rotation-neck.data.rotation+head.rotation-head.data.rotation;
 return{batch,upper,head:Math.max(-6,Math.min(6,Math.round(turn))),grip:grip('near'),farGrip:grip('far')};};
window.skin=async(head,rect)=>{const p=player,base=new Image,im=new Image;base.src=outfit+'/atlas.png';im.src=outfit+'/upper-'+head+'.png';await Promise.all([base.decode(),im.decode()]);const c=document.createElement('canvas');c.width=base.naturalWidth;c.height=base.naturalHeight;const x=c.getContext('2d');x.drawImage(base,0,0);x.clearRect(...rect);x.drawImage(im,rect[0],rect[1],rect[2],rect[3]);const texture=new spine.GLTexture(p.context,c,false),regions=new Set(p.skeleton.data.defaultSkin.getAttachments().map(entry=>entry.attachment.region).filter(Boolean)),old=new Set([...regions].map(region=>region.texture));for(const region of regions){region.texture=texture;region.page.texture=texture;}for(const previous of old)if(previous!==texture)previous.dispose();};
window.upper=turn=>{document.getElementById('p').style.cssText='width:384px;height:288px';const p=player,s=p.skeleton;s.x=s.y=0;s.setToSetupPose();s.findBone('neck').rotation+=turn*.5;s.findBone('head').rotation+=turn*.5;s.updateWorldTransform(spine.Physics.update);originalAlpha=new Map(s.slots.map(z=>[z.data.name,z.color.a]));show(['upper-body']);p.drawFrame(false);return p.canvas.toDataURL().split(',')[1]};
</script>'''

def image(data):return Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA')
def rounded(v):return[round(x,5)for x in v]
def saved_metadata(path):
 try:return json.loads(path.read_text())
 except (ValueError,OSError):return {}
def pack(images,width=1024):
 placements=[];x=y=2;row=0
 for im in images:
  box=im.getbbox()
  if not box:placements.append([0,0,0,0,0,0]);continue
  w,h=box[2]-box[0],box[3]-box[1]
  if x+w+2>width:x=2;y+=row+4;row=0
  placements.append([x,y,w,h,box[0],box[1]]);x+=w+4;row=max(row,h)
 sheet=Image.new('RGBA',(width,max(4,y+row+2)))
 for im,p in zip(images,placements):
  if p[2]:sheet.alpha_composite(im.crop((p[4],p[5],p[4]+p[2],p[5]+p[3])),(p[0],p[1]))
 return sheet,placements

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--only');parser.add_argument('--outfits',default='traveller,scholar,cloak');parser.add_argument('--no-upper',action='store_true');parser.add_argument('--resume',action='store_true');args=parser.parse_args();OUT.mkdir(exist_ok=True)
 (BUILD/'baker.html').write_text(HTML);runtime=re.search(r'<script>([\s\S]*?)</script>',(OLD/'runtime/review.html').read_text()).group(1);(BUILD/'runtime.js').write_text(runtime)
 clips=json.loads((ART/'compiled-clips.json').read_text());materials=json.loads(((BUILD/'repaired-materials.json') if (BUILD/'repaired-materials.json').exists() else (ART/'materials.json')).read_text());chosen=set(args.only.split(','))if args.only else set(clips);index={id:{'name':c['name'],'kind':c['kind'],'family':c['family'],'duration':c['duration'],'contacts':c['contacts'],'state':c.get('state'),'neutral':c['neutral']}for id,c in clips.items()}
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  for outfit in args.outfits.split(','):
   folder=OUT/outfit;folder.mkdir(exist_ok=True);rigbytes=(BUILD/outfit/'rig.json').read_bytes();rigsha=hashlib.sha256(rigbytes).hexdigest();rigdata=json.loads(rigbytes);bindsha=hashlib.sha256(json.dumps({k:v for k,v in rigdata.items()if k!='animations'},sort_keys=True).encode()).hexdigest();page=b.new_page(viewport={'width':400,'height':400},device_scale_factor=1);page.goto('http://127.0.0.1:5293/.local-online/full-martial-motion/baker.html?outfit='+outfit);page.evaluate('ready')
   for id,c in clips.items():
    if id not in chosen:continue
    target=folder/(id+'.webp');meta=folder/(id+'.json')
    clipdata=json.loads((BUILD/outfit/'clips'/(id+'.json')).read_text());clipsha=hashlib.sha256(json.dumps(clipdata,sort_keys=True).encode()).hexdigest();bakerRule='material-alpha-floor-v2'
    if args.resume and target.exists()and meta.exists():
     old=saved_metadata(meta)
     if old.get('bakerRule')==bakerRule and old.get('bindSha256')==bindsha and old.get('clipSha256')==clipsha and old.get('sha256')==hashlib.sha256(target.read_bytes()).hexdigest():continue
    page.evaluate('loadClip',id)
    ims=[];frames=[]
    for ti,t in enumerate(c['sampleTimes']):
     f=page.evaluate('([id,t,h])=>sample(id,t,h)',[id,t,materials.get('outfitHands',{}).get(outfit,materials['hands'])]);batch=image(f['batch']);ims.extend(batch.crop((i%2*384,i//2*288,i%2*384+384,i//2*288+288)) for i in range(4));intent=(c.get('sampleIntents')or[{}]*len(c['sampleTimes']))[ti];m=f['upper'];angle=math.atan2(m[1],m[0])-intent.get('aim',0)*math.pi/180;f['grip'][2]=angle;frames.append({'t':t,'upper':rounded(f['upper']),'head':f['head'],'grip':rounded(f['grip']),'farGrip':rounded(f['farGrip']),'contact':intent.get('contact','near')})
    atlas,rects=pack(ims)
    if atlas.height>8192:raise ValueError('圖集超出手機預算 '+id)
    atlas.save(target,format='WEBP',quality=95,method=4)
    for n,f in enumerate(frames):f['parts']=rects[n*4:n*4+4]
    data={**index[id],'bakerRule':bakerRule,'rigSha256':rigsha,'bindSha256':bindsha,'clipSha256':clipsha,'id':id,'outfit':outfit,'origin':ORIGIN,'pixelsPerHeight':HEIGHT,'atlas':'ink/art/independent/'+outfit+'/'+id+'.webp','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'frames':frames};meta.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');print('BAKED',outfit,id,len(frames),target.stat().st_size,flush=True)
   if not args.no_upper:
    for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
     name='_upper-'+head;target=folder/(name+'.webp');meta=folder/(name+'.json')
     if args.resume and target.exists()and meta.exists()and saved_metadata(meta).get('rigSha256')==rigsha:continue
     page.evaluate('([h,r])=>skin(h,r)',[head,materials['outfits'][outfit]['upperRegion']]);ims=[image(page.evaluate('upper',turn))for turn in range(-6,7)];atlas,rects=pack(ims);atlas.save(target,format='WEBP',quality=96,method=4);meta.write_text(json.dumps({'outfit':outfit,'head':head,'rigSha256':rigsha,'origin':ORIGIN,'pixelsPerHeight':HEIGHT,'turns':list(range(-6,7)),'parts':rects,'atlas':'ink/art/independent/'+outfit+'/'+name+'.webp','sha256':hashlib.sha256(target.read_bytes()).hexdigest()},separators=(',',':'))+'\n');print('UPPER',outfit,head,flush=True)
   page.close()
  b.close()
 # 索引只含時計及身份，幀資料按當前武學載入，不能塞入首屏JS。
 (OUT/'index.json').write_text(json.dumps({'schema':1,'canonical':103,'origin':ORIGIN,'pixelsPerHeight':HEIGHT,'clips':index},ensure_ascii=False,separators=(',',':'))+'\n');print('BAKE_PASS',flush=True)
if __name__=='__main__':main()
