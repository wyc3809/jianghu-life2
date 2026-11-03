"""已接受Spine人物的正式素材：連續上身、同一骨架及可重現離線動畫輸出。"""
from pathlib import Path
from PIL import Image
import json,math
import numpy as np

ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/spine-character';OUT=ART/'production';OUT.mkdir(exist_ok=True);ATLAS=ROOT/'.local-online/spine-rollout/atlases';ATLAS.mkdir(parents=True,exist_ok=True)
HEADS=['bamboo','topknot','master','silver','ponytail','loose','bun','short']
# 原圖只按格位裁切；完整頭頸上身等比放置，不再獨立縮放或貼一塊頸。
SOURCES={'traveller':'sheet-traveller.png','scholar':'sheet-scholar.png','cloak':'sheet-cloak.png'}
# 每格完整上身的頸部與腰帶中心，來源像素；手動核對後固定。
GUIDES={
 'traveller':[(215,230,490),(217,230,490),(217,230,490),(217,230,490),(217,230,490),(217,230,490),(217,230,490),(217,230,490)],
 'scholar':[(210,247,503),(210,247,503),(210,247,503),(210,247,503),(210,247,503),(210,247,503),(210,247,503),(210,247,503)],
 'cloak':[(210,230,490)]*8,
}
RECT={'x':180,'y':-30,'width':640,'height':730}

def blend(a,b,t):
 t=max(0,min(1,t));t=t*t*(3-2*t);return {a:1-t,b:t}

def weights(x,y):
 if y>=350:return blend('hip','chest',(625-y)/275)
 if y<=260:return {'head':1}
 central=max(0,1-abs(x-540)/85);central=central*central*(3-2*central)
 core=blend('chest','neck',(350-y)/40) if y>=310 else blend('neck','head',(310-y)/35)
 outer=blend('chest','head',(315-y)/55)
 return {k:core.get(k,0)*central+outer.get(k,0)*(1-central) for k in sorted(set(core)|set(outer))}

def main():
 skeleton=json.loads((ART/'runtime/character.json').read_text());skeleton['skeleton']['images']='editor-parts/'
 world={};indices={}
 for i,b in enumerate(skeleton['bones']):
  px,py,pa=world.get(b.get('parent'),(0,0,0));x,y=b['x'],b['y'];angle=math.radians(b['rotation']);world[b['name']]=(px+x*math.cos(pa)-y*math.sin(pa),py+x*math.sin(pa)+y*math.cos(pa),pa+angle);indices[b['name']]=i
 p=RECT;xs=sorted(set(list(range(180,821,32))+[490,510,525,535,545,555,570,590]));ys=sorted(set(list(range(-30,701,32))+[200,240,250,260,270,275,280,290,300,305,310,320,330,340,350,390,700]));nx=len(xs);uv=[];v=[];tri=[]
 for y in ys:
  for x in xs:
   uv.extend([(x-p['x'])/p['width'],(y-p['y'])/p['height']]);w={k:z for k,z in weights(x,y).items() if z>1e-8};v.append(len(w))
   for k,z in w.items():
    wx,wy,a=world[k];dx=x-512-wx;dy=1533-y-wy;v.extend([indices[k],dx*math.cos(a)+dy*math.sin(a),-dx*math.sin(a)+dy*math.cos(a),z])
 for row in range(len(ys)-1):
  for col in range(nx-1):i=row*nx+col;tri.extend([i,i+1,i+nx,i+1,i+nx+1,i+nx])
 skeleton['skins'][0]['attachments']['upper-body']['upper-body']={'type':'mesh','path':'upper-body','width':p['width'],'height':p['height'],'uvs':uv,'vertices':v,'triangles':tri}
 def rotate(times,values):return {'rotate':[{'time':t,'value':a} for t,a in zip(times,values)]}
 t=[0,.25,.5,.75,1]
 skeleton['animations']['walk']={'bones':{k:rotate(t,z) for k,z in {'near-upper-leg':[0,12,0,-12,0],'far-upper-leg':[0,-12,0,12,0],'near-lower-leg':[0,-5,0,15,0],'far-lower-leg':[0,15,0,-5,0],'near-upper-arm':[0,-5,0,5,0],'far-upper-arm':[0,5,0,-5,0]}.items()}}
 # 倒地由髖、膝、胸分別屈曲；不是將整張角色平面轉90度。
 t=[0,.16,.4,.7,.85]
 down={'hip':[0,12,45,80,80],'torso':[0,0,-2,-5,-5],'chest':[0,3,-3,-8,-8],'neck':[0,-3,-7,-9,-9],'head':[0,0,2,3,3],'near-upper-leg':[0,0,8,15,15],'far-upper-leg':[0,0,-5,-10,-10],'near-lower-leg':[0,0,10,20,20],'far-lower-leg':[0,0,5,10,10],'near-upper-arm':[0,-15,-25,-50,-50],'near-lower-arm':[0,10,35,55,55]}
 skeleton['animations']['down']={'bones':{k:rotate(t,z) for k,z in down.items()}}
 skeleton['animations']['down']['bones']['hip'].update({'translate':[{'time':t,'x':0,'y':y}for t,y in zip(t,[0,-50,-250,-480,-480])]})
 seated={'near-upper-leg':-75,'far-upper-leg':80,'near-lower-leg':142,'far-lower-leg':-145,'near-foot':24,'far-foot':-75}
 skeleton['animations']['seated']={'bones':{k:rotate([0,1],[v,v]) for k,v in seated.items()}}
 skeleton['animations']['seated']['bones']['hip']={'translate':[{'time':0,'x':0,'y':-450},{'time':1,'x':0,'y':-450}]}
 (OUT/'character.json').write_text(json.dumps(skeleton,separators=(',',':'))+'\n')
 # 全部skin共用region尺寸及同一UV；不同身份只更換原圖。
 parts={p.stem:Image.open(p).convert('RGBA') for p in (ART/'parts').glob('*.png') if p.stem!='upper-body'};parts['upper-body']=Image.new('RGBA',(RECT['width'],RECT['height']))
 width=1024;x=y=2;row=0;pos={}
 for key,im in sorted(parts.items(),key=lambda q:-q[1].height):
  if x+im.width+2>width:x=2;y+=row+2;row=0
  pos[key]=(x,y);x+=im.width+2;row=max(row,im.height)
 height=1<<(y+row+1).bit_length();lines=['atlas.png',f'size: {width},{height}','format: RGBA8888','filter: Linear,Linear','repeat: none']
 for key,im in parts.items():
  x,y=pos[key];lines += [key,'  rotate: false',f'  xy: {x}, {y}',f'  size: {im.width}, {im.height}',f'  orig: {im.width}, {im.height}','  offset: 0, 0','  index: -1']
 (OUT/'character.atlas').write_text('\n'.join(lines)+'\n');skins=[]
 for outfit,file in SOURCES.items():
  sheet=Image.open(ART/'sources'/file).convert('RGBA');cw,ch=sheet.width/4,sheet.height/2
  for i,head in enumerate(HEADS):
   cell=sheet.crop((round(i%4*cw),round(i//4*ch),round((i%4+1)*cw),round((i//4+1)*ch)))
   # 指引按原始格位像素，並非透明包圍盒逐幀fit。
   gx,gy,waist=GUIDES[outfit][i];scale=357/(waist-gy)
   # 沿真alpha選近指引的連通頸柱；只移動完整上身，不畫補片或放寬透明門檻。
   alpha0=np.array(cell)[:,:,3];rows=[round(gy+(y-310)/scale) for y in range(260,351)]
   candidates=[x for x in range(max(0,gx-40),min(cell.width,gx+41)) if min(int(alpha0[y,x]) for y in rows)>=240]
   if not candidates:raise ValueError(f'{head}/{outfit}: 原圖沒有連續頸柱，需補原圖')
   gx=min(candidates,key=lambda x:abs(x-gx));im=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
   upper=Image.new('RGBA',(RECT['width'],RECT['height']));upper.alpha_composite(im,(round(535-gx*scale-RECT['x']),round(310-gy*scale-RECT['y'])))
   if head=='topknot' and outfit=='traveller':
    p0=json.loads((ART/'layout.json').read_text())['parts']['upper-body'];original=Image.open(ART/'parts/upper-body.png').convert('RGBA').resize((round(p0['width']),round(p0['height'])),Image.Resampling.LANCZOS);upper=Image.new('RGBA',upper.size);upper.alpha_composite(original,(round(p0['x']-RECT['x']),round(p0['y']-RECT['y'])))
   # 衣領到頸部的共享走廊必須有真正像素，不填補缺口。
   alpha=np.array(upper)[:,:,3];corridor=[int(alpha[y-RECT['y'],535-RECT['x']]) for y in range(260,351)]
   if min(corridor)<200:raise ValueError(f'{head}/{outfit}: 頸面空隙，先修指引／原圖: {min(corridor)}')
   upper.save(OUT/f'upper-{head}-{outfit}.png');atlas=Image.new('RGBA',(width,height))
   for key,image in parts.items():atlas.paste(upper if key=='upper-body' else image,pos[key])
   atlas.save(ATLAS/f'atlas-{head}-{outfit}.png');skins.append({'head':head,'outfit':outfit,'minNeckAlpha':min(corridor),'source':file,'guide':[gx,gy,waist],'scale':scale})
 editor=OUT/'editor-parts';editor.mkdir(exist_ok=True)
 for part in (ART/'parts').glob('*.png'):
  source=OUT/'upper-topknot-traveller.png' if part.stem=='upper-body' else part
  (editor/part.name).write_bytes(source.read_bytes())
 (OUT/'skins.json').write_text(json.dumps({'upperRect':RECT,'skins':skins},indent=2)+'\n');print('PRODUCTION_SKINS',len(skins),'ATLAS',width,height)

if __name__=='__main__':main()
