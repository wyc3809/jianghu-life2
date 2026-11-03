"""由同一母版的部件與已核對座標建立三段Spine審閱資料；不改遊戲數值。"""
from pathlib import Path
import argparse, importlib.util, json, math, hashlib, subprocess, base64
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'design/art/spine-character'

def extract_parts():
    """只依已記錄格位裁切原始RGBA，不改臉、衣料或肢體造型。"""
    image=Image.open(ART/'sources/parts-v01.png').convert('RGBA');dest=ART/'parts';dest.mkdir(exist_ok=True)
    regions={'head':(0,0,343,460),'torso':(343,0,685,460),'hip':(685,0,1024,460),'near-arm':(0,465,342,975),'far-arm':(342,465,685,975),'near-leg':(0,980,342,1536),'far-leg':(342,980,685,1536)}
    report={}
    for name,box in regions.items():
        part=image.crop(box);crop=part.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
        if not crop:raise ValueError(f'{name}: missing alpha')
        part=part.crop(crop);part.save(dest/f'{name}.png');report[name]={'sourceCell':box,'alphaCrop':crop,'size':part.size}
    (ART/'extraction.json').write_text(json.dumps(report,indent=2)+'\n')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--skill',required=True);args=parser.parse_args()
    skill=Path(args.skill)
    if subprocess.check_output(['git','-C',str(skill),'rev-parse','HEAD'],text=True).strip()!='702b71689cac826efee942ee4564fef9560d6ef8':raise ValueError('Skill來源版本不同，須先核對輸出格式')
    spec=importlib.util.spec_from_file_location('spine_builder',skill/'scripts/build_spine_json.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
    extract_parts()
    output=ART/'runtime';output.mkdir(exist_ok=True)
    layout=json.loads((ART/'layout.json').read_text());bones=[];world={}
    def bone(name,parent,point,end=None):
        x,y=point[0]-512,1533-point[1];p=world.get(parent,(0,0,0));r=p[2];dx=x-p[0];dy=y-p[1]
        angle=math.atan2(point[1]-end[1],end[0]-point[0]) if end else 0
        b={'name':name,'x':dx*math.cos(r)+dy*math.sin(r),'y':-dx*math.sin(r)+dy*math.cos(r),'rotation':math.degrees(angle-r)}
        if parent:b['parent']=parent
        if end:b['length']=math.dist(point,end)
        bones.append(b);world[name]=(x,y,angle)
    bone('root',None,(512,1533));bone('hip','root',(512,625));bone('torso','hip',(512,625),(520,350));bone('chest','torso',(520,350))
    bone('neck','chest',(535,310),(535,275));bone('head','neck',(535,275))
    for side,joints in {'near':[(355,385),(295,605),(350,784),(364,823)],'far':[(640,395),(657,618),(718,780),(733,823)]}.items():
        for i,name in enumerate(['upper-arm','lower-arm','hand']):bone(side+'-'+name,'chest' if i==0 else side+'-'+['upper-arm','lower-arm'][i-1],joints[i],joints[i+1])
    for side,joints in {'near':[(430,840),(370,1190),(350,1450),(350,1530)],'far':[(585,840),(605,1185),(610,1440),(685,1505)]}.items():
        for i,name in enumerate(['upper-leg','lower-leg','foot']):bone(side+'-'+name,'hip' if i==0 else side+'-'+['upper-leg','lower-leg'][i-1],joints[i],joints[i+1])
    indices={b['name']:i for i,b in enumerate(bones)}
    def blend(a,b,t):
        t=max(0,min(1,t));t=t*t*(3-2*t)
        return {a:1-t,b:t}
    def weights(name,x,y):
        if name=='hip':return {'hip':1}
        if name=='torso':return blend('hip','chest',(625-y)/275)
        if name=='head':return blend('neck','head',(325-y)/65)
        side=name.split('-')[0]
        if name.endswith('arm'):
            elbow=605 if side=='near' else 618
            if y<elbow-45:return {side+'-upper-arm':1}
            if y<elbow+45:return blend(side+'-upper-arm',side+'-lower-arm',(y-elbow+45)/90)
            wrist=784 if side=='near' else 780
            return blend(side+'-lower-arm',side+'-hand',(y-wrist+18)/36)
        knee=1190 if side=='near' else 1185
        if y<knee+45:return blend(side+'-upper-leg',side+'-lower-leg',(y-knee+45)/90)
        ankle=1450 if side=='near' else 1440
        return blend(side+'-lower-leg',side+'-foot',(y-ankle+20)/40)
    attachments={};slots=[]
    for name in layout['z_order']:
        p=layout['parts'][name];im=Image.open(ART/'parts'/f'{name}.png');nx=max(8,math.ceil(im.width/24));ny=max(10,math.ceil(im.height/24));uvs=[];vertices=[];triangles=[]
        for row in range(ny+1):
            for col in range(nx+1):
                u,v=col/nx,row/ny;x=p['x']+u*p['width'];y=p['y']+v*p['height'];uvs.extend([u,v]);ws={k:w for k,w in weights(name,x,y).items() if w>1e-8};assert abs(sum(ws.values())-1)<1e-7
                vertices.append(len(ws))
                for k,w in ws.items():
                    wx,wy,a=world[k];dx=x-512-wx;dy=1533-y-wy
                    vertices.extend([indices[k],round(dx*math.cos(a)+dy*math.sin(a),6),round(-dx*math.sin(a)+dy*math.cos(a),6),round(w,8)])
        for row in range(ny):
            for col in range(nx):
                i=row*(nx+1)+col;triangles.extend([i,i+1,i+nx+1,i+1,i+nx+2,i+nx+1])
        attachments[name]={'type':'mesh','path':name,'width':im.width,'height':im.height,'uvs':uvs,'triangles':triangles,'vertices':vertices}
        slots.append({'name':name,'bone':'hip','attachment':name})
    def rotation(times,values):return {'rotate':[builder._kf(t,angle=a,curve=None if i==0 else builder.EASE) for i,(t,a) in enumerate(zip(times,values))]}
    idle={k:rotation([0,1,2],v) for k,v in {'torso':[0,-.35,0],'chest':[0,.15,0],'neck':[0,.15,0],'head':[0,.05,0],'near-upper-arm':[0,.35,0],'far-upper-arm':[0,-.25,0]}.items()}
    at=[0,.20,.34,.40,.58,.88,1.15]
    attack={k:rotation(at,v) for k,v in {'torso':[0,2,-4,-4,-2,1,0],'chest':[0,1,-2,-2,-1,0,0],'neck':[0,-1,2,2,1,-.3,0],'head':[0,-1,2,2,1,0,0],'near-upper-arm':[0,-12,100,100,65,10,0],'near-lower-arm':[0,20,-20,-20,0,12,0],'near-hand':[0,-3,-5,-5,0,2,0],'far-upper-arm':[0,-8,12,12,8,0,0],'far-lower-arm':[0,12,24,24,12,0,0]}.items()}
    ht=[0,.09,.19,.38,.65,.95]
    hurt={k:rotation(ht,v) for k,v in {'torso':[0,5,7,3,-1,0],'chest':[0,3,2,-1,0,0],'neck':[0,-2,-2,0,1,0],'head':[0,-4,-3,1,0,0],'near-upper-arm':[0,-12,-10,5,0,0],'near-lower-arm':[0,20,16,0,-2,0],'far-upper-arm':[0,-8,-6,2,0,0]}.items()}
    config={'skeleton':{'name':'jianghu-traveller-review','width':1100,'height':1560},'bones':bones,'slots':slots,'attachments':attachments,'animations':[],'custom_animations':{k:{'bones':v} for k,v in {'idle':idle,'attack':attack,'hurt':hurt}.items()}}
    (ART/'authoring.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
    skeleton=builder.build_spine_json(config);skeleton['skeleton']['images']='../parts/'
    for slot in slots:
        if not (output/skeleton['skeleton']['images']/f"{slot['attachment']}.png").is_file():raise ValueError(f"missing editor image: {slot['attachment']}")
    (output/'character.json').write_text(json.dumps(skeleton,separators=(',',':'))+'\n')
    subprocess.run(['python3',str(skill/'scripts/make_atlas.py'),'--parts',str(ART/'parts'),'--output',str(output),'--name','character'],check=True)
    subprocess.run(['python3',str(skill/'scripts/generate_spine_player.py'),'--skeleton',str(output/'character.json'),'--atlas',str(output/'character.atlas'),'--atlas-image',str(output/'character.png'),'--output',str(ROOT/'.local-online/spine-ai/upstream-player.html'),'--animation','idle'],check=True)
    vendor=ROOT/'.local-online/spine-ai/player/package'
    license=(vendor/'LICENSE').read_text();bundle=(vendor/'dist/iife/spine-player.min.js').read_text()
    Image.open(ART/'sources/master-v01.png').save(output/'master-fallback.webp',quality=88,method=6)
    data={name:'data:'+mime+';base64,'+base64.b64encode((output/name).read_bytes()).decode() for name,mime in [('character.json','application/json'),('character.atlas','application/octet-stream'),('character.png','image/png')]}
    html=(ART/'review-template.html').read_text().replace('/*SPINE_RUNTIME*/',bundle).replace('/*SPINE_DATA*/',json.dumps(data)).replace('/*RUNTIME_LICENSE*/',license.replace('</script','<\\/script'))
    font_license=(ROOT/'design/art/parchment-ui/sources/OFL-yujiboku.txt').read_text()
    html=html.replace('/*FONT_LICENSE*/',font_license.replace('</script','<\\/script'))
    for name,path,mime in [('paper','public/ink/art/parchment-ui/paper-fiber.webp','image/webp'),('frame','public/ink/art/parchment-ui/paper-rim.webp','image/webp'),('selected','public/ink/art/parchment-ui/brush-selected-reference.webp','image/webp'),('underline','public/ink/art/parchment-ui/brush-underline.webp','image/webp'),('brush-font','src/assets/fonts/parchment-brush.woff2','font/woff2'),('master','design/art/spine-character/runtime/master-fallback.webp','image/webp')]:
        html=html.replace('asset:'+name,'data:'+mime+';base64,'+base64.b64encode((ROOT/path).read_bytes()).decode())
    (output/'review.html').write_text(html)
    (output/'SPINE-RUNTIME-LICENSE.txt').write_text(license)
    (output/'OFL-YujiBoku.txt').write_text(font_license)
    (output/'build-manifest.json').write_text(json.dumps({'skillCommit':'702b71689cac826efee942ee4564fef9560d6ef8','player':'4.2.120','bones':len(bones),'weightedMeshes':len(slots),'animations':list(skeleton['animations']),'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in output.glob('*') if p.name!='build-manifest.json'}},indent=2)+'\n')
    print('SPINE_BUILD_PASS',len(bones),'bones',len(slots),'weighted meshes')

if __name__=='__main__':main()
