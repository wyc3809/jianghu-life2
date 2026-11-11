"""第60g v03：只製作已接受比例嘅單人短拳；補衣層，沿母版拆真手臂。"""
from pathlib import Path
import copy
import base64
import shutil
import json
import math
import hashlib
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import label, binary_dilation, binary_fill_holes

sys.path.insert(0,str(Path(__file__).resolve().parent))
from build_upright_character_review import make_bones, POINTS, source_to_world
from build_independent_rigs import mesh_uv, smooth, world_of
from review_character_bind import inverse, unpack, bind_error

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'design/art/character-bind-review/punch-v03'
BUILD=ROOT/'.local-online/rig-repair/punch-v03'
SOURCE=ROOT/'design/art/spine-character/sources/master-v01.png'
ARM_POLYGONS={
 'near':[(331,310),(369,315),(392,344),(405,403),(393,454),(383,485),(392,516),(367,551),(365,602),(363,650),(376,712),(388,744),(405,775),(408,822),(388,850),(330,852),(300,831),(281,784),(264,731),(240,670),(223,622),(220,586),(229,539),(238,497),(266,438),(294,383),(317,337)],
 'far':[(660,345),(685,370),(698,422),(709,482),(717,512),(722,543),(724,585),(745,618),(754,665),(769,708),(773,748),(778,790),(770,822),(734,844),(705,826),(691,782),(685,733),(668,686),(657,642),(645,595),(639,548),(640,489),(640,423)]
}
TIMES=[0,.12,.28,.38,.52,.58,.72,1.02,1.36,1.6]


def make_body(source):
    """補圖只用作露出衣層；頭頸、中央衣襟及雙腳沿用已接受原像素。"""
    generated=Image.open(ART/'sources/body-underlay-v01.png').convert('RGBA')
    assert generated.size==source.size
    keep=Image.new('L',source.size)
    d=ImageDraw.Draw(keep)
    d.rectangle((0,0,1024,305),fill=255)
    d.rectangle((0,900,1024,1536),fill=255)
    d.polygon([(440,295),(617,295),(654,365),(659,480),(640,581),(640,649),(685,754),(692,900),(410,900),(407,681),(399,623),(412,540),(425,400)],fill=255)
    soft=keep.filter(ImageFilter.GaussianBlur(5))
    body=Image.composite(source,generated,soft)
    a=np.array(body);s=np.array(source)
    a[:300]=s[:300];a[920:]=s[920:]
    return Image.fromarray(a)


def body_weights(x,y):
    if y<=260:return {'head':1}
    if y<304:
        t=smooth(260,304,y);return {'head':1-t,'neck':t}
    if y<365:
        t=smooth(304,365,y);return {'neck':1-t,'chest':t}
    if y<650:
        t=smooth(440,650,y);return {'chest':1-t,'torso':t}
    if y<870:
        t=smooth(650,790,y);return {'torso':1-t,'hip':t}
    result={}
    for side,z in [('near',1-smooth(490,530,x)),('far',smooth(490,530,x))]:
        knee=POINTS[side+'-lower-leg'][1];ankle=POINTS[side+'-foot'][1]
        if y<ankle-20:
            t=smooth(knee-35,knee+35,y);ws={side+'-upper-leg':1-t,side+'-lower-leg':t}
        else:
            t=smooth(ankle-20,ankle+20,y);ws={side+'-lower-leg':1-t,side+'-foot':t}
        h=smooth(870,950,y);result['hip']=result.get('hip',0)+z*(1-h)
        for name,w in ws.items():result[name]=result.get(name,0)+z*h*w
    return result


def arm_weights(side,x,y):
    shoulder=POINTS[side+'-upper-arm'];elbow=POINTS[side+'-lower-arm'];wrist=POINTS[side+'-hand']
    # 彎曲分攤喺寬鬆衣袖，至護腕開始前收實；唔把變形擠喺窄肘線。
    t=smooth(elbow[1]-110,elbow[1]+40,y)
    u=smooth(wrist[1]-22,wrist[1]+22,y)
    # 肩甲／上袖隨上臂，以真重疊衣層接肩，唔用跨胸權重拉走衣身。
    return {side+'-upper-arm':(1-t)*(1-u),side+'-lower-arm':t*(1-u),side+'-hand':u}


def mesh_for(image,origin,weights,bones,step):
    frames=world_of(bones);indices={b['name']:i for i,b in enumerate(bones)}
    mapper=lambda name,x,y:inverse(frames[name],source_to_world((origin[0]+x,origin[1]+y)))
    wrapped=lambda x,y:weights(origin[0]+x,origin[1]+y)
    mesh=mesh_uv(image,mapper,wrapped,indices,step)
    vertices=[]
    for n,entries in enumerate(unpack(mesh)):
        point=source_to_world((origin[0]+mesh['uvs'][n*2]*image.width,origin[1]+mesh['uvs'][n*2+1]*image.height))
        vertices.append(len(entries));total=sum(e[3] for e in entries)
        for i,_x,_y,w in entries:
            lx,ly=inverse(frames[bones[int(i)]['name']],point)
            vertices.extend([i,round(lx,8),round(ly,8),w/total])
    mesh['vertices']=vertices
    return mesh


def animations(bones):
    """沿原站姿關節排短拳；雙腿唔更新，唔借用舊guard／戰鬥IK。"""
    B={b['name']:b for b in bones}
    upper=world_of(bones)['near-upper-arm'][2]*180/math.pi
    straight=-5-upper
    elbow=10-B['near-lower-arm']['rotation']
    values={
      'torso':[0,0,1.2,.6,-2.5,-2.5,-1.8,.5,0,0],
      'neck':[0,0,-.2,-.1,.5,.5,.3,-.1,0,0],
      'head':[0,0,-.1,0,.3,.3,.1,0,0,0],
      'near-upper-arm':[0,0,-5,9,straight,straight,straight*.84,23,0,0],
      'near-lower-arm':[0,0,10,7,elbow,elbow,elbow*.6,8,0,0],
      'near-hand':[0,0,-2,-2,0,0,0,1,0,0],
      'far-upper-arm':[0,0,-2,-2,-4,-4,-3,-1,0,0],
      'far-lower-arm':[0,0,2,3,5,5,4,1,0,0],
    }
    tracks={}
    for name,vs in values.items():
        keys=[]
        for i,(t,v) in enumerate(zip(TIMES,vs)):
            key={'time':t,'value':v}
            if i<len(TIMES)-1:
                # Spine4.2 curve係絕對時間／角度控制點，唔係CSS比例。
                dt=TIMES[i+1]-t
                key['curve']=[t+dt*.3,v,t+dt*.6,vs[i+1]]
            keys.append(key)
        tracks[name]={'rotate':keys}
    return {'stand':{},'punch':{'bones':tracks}}


def arm_chart(rest_image,raised_image,rest_origin,raised_origin,bones,paint_pose):
    """兩張原畫共用同一手臂拓撲及變形；保留實心底層，避免半透明雙手。"""
    frames=world_of(bones);indices={b['name']:i for i,b in enumerate(bones)}
    def matrix(frame):
        x,y,a=frame;c,s=math.cos(a),math.sin(a)
        return np.array([[c,-s,x],[s,c,y],[0,0,1.]])
    transforms={name:matrix(paint_pose[name])@np.linalg.inv(matrix(frames[name])) for name in frames}
    alpha_r=np.array(rest_image)[:,:,3];alpha_p=np.array(raised_image)[:,:,3]
    valid_rows=np.flatnonzero(np.any(alpha_r>16,axis=1));valid_columns=np.flatnonzero(np.any(alpha_p>16,axis=0))
    y0,y1=rest_origin[1]+float(valid_rows[0]),rest_origin[1]+float(valid_rows[-1])
    joint_y=[POINTS[n][1] for n in ['near-upper-arm','near-lower-arm','near-hand','near-knuckles']]
    pjoint=[]
    for name in ['near-upper-arm','near-lower-arm','near-hand']:
        x,y,_a=paint_pose[name];pjoint.append((x+512,1520-y))
    hand=bones[indices['near-hand']];x,y,a=paint_pose['near-hand'];pjoint.append((x+math.cos(a)*hand['length']+512,1520-y-math.sin(a)*hand['length']))
    control_y=[y0,*joint_y,y1]
    control_x=[raised_origin[0]+float(valid_columns[0]),*[p[0] for p in pjoint],raised_origin[0]+float(valid_columns[-1])]
    rows=sorted(set([y0+i*(y1-y0)/90 for i in range(91)]+joint_y))
    cols=8;uvr=[];uvp=[];vertices=[];deform=[];tri=[]
    def span(alpha,line,vertical=False):
        samples=alpha[:,min(alpha.shape[1]-1,max(0,round(line)))] if vertical else alpha[min(alpha.shape[0]-1,max(0,round(line)))]
        valid=np.flatnonzero(samples>16)
        if not len(valid):
            for delta in [-1,1,-2,2]:
                idx=round(line)+delta
                if 0<=idx<(alpha.shape[1] if vertical else alpha.shape[0]):
                    samples=alpha[:,idx] if vertical else alpha[idx];valid=np.flatnonzero(samples>16)
                    if len(valid):break
        if not len(valid):raise ValueError('手臂拓撲橫截面無實際材質')
        return float(valid[0]),float(max(valid[0]+1,valid[-1]))
    for y in rows:
        lo,hi=span(alpha_r,y-rest_origin[1]);lo+=rest_origin[0];hi+=rest_origin[0]
        center=float(np.interp(y,joint_y,[POINTS[n][0] for n in ['near-upper-arm','near-lower-arm','near-hand','near-knuckles']]))
        center=max(lo+.1,min(hi-.1,center))
        px=float(np.interp(y,control_y,control_x))
        top,bottom=span(alpha_p,px-raised_origin[0],True);top+=raised_origin[1];bottom+=raised_origin[1]
        cy=float(np.interp(px,[p[0] for p in pjoint],[p[1] for p in pjoint]));cy=max(top+.1,min(bottom-.1,cy))
        for col in range(cols+1):
            q=col/cols;rx=float(np.interp(q,[0,.5,1],[lo,center,hi]));py=float(np.interp(q,[0,.5,1],[bottom,cy,top]))
            uvr.extend([(rx-rest_origin[0])/rest_image.width,(y-rest_origin[1])/rest_image.height]);uvp.extend([(px-raised_origin[0])/raised_image.width,(py-raised_origin[1])/raised_image.height])
            weights={n:w for n,w in arm_weights('near',rx,y).items() if w>1e-7};total=sum(weights.values());weights={n:w/total for n,w in weights.items()}
            point=source_to_world((rx,y));target=source_to_world((px,py));blend=sum((transforms[n]*w for n,w in weights.items()),np.zeros((3,3)))
            corrected=np.linalg.solve(blend[:2,:2],np.array(target)-blend[:2,2]);vertices.append(len(weights))
            for name,w in weights.items():
                a,b=inverse(frames[name],point);c,d=inverse(frames[name],corrected)
                vertices.extend([indices[name],round(a,8),round(b,8),w]);deform.extend([round(c-a,8),round(d-b,8)])
    for row in range(len(rows)-1):
        for col in range(cols):
            i=row*(cols+1)+col;tri.extend([i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1])
    common={'type':'mesh','vertices':vertices,'triangles':tri}
    rest={**copy.deepcopy(common),'path':'near-arm','uvs':uvr,'width':rest_image.width,'height':rest_image.height}
    raised={**copy.deepcopy(common),'path':'near-punch','uvs':uvp,'width':raised_image.width,'height':raised_image.height}
    shape_times=[0,.28,.38,.52,.58,.72,1.02,1.36,1.6];amounts=[0,0,0,1,1,.85,.10,0,0];keys=[]
    for i,(t,h) in enumerate(zip(shape_times,amounts)):
        key={'time':t}
        if h:key['vertices']=[round(v*h,8) for v in deform]
        if i<len(shape_times)-1:
            dt=shape_times[i+1]-t;key['curve']=[t+dt*.3,0,t+dt*.6,1]
        keys.append(key)
    return rest,raised,keys,{'rows':len(rows),'columns':cols+1,'rowPositions':rows,'jointRows':joint_y,'posedJoints':pjoint}


def build():
    ART.mkdir(parents=True,exist_ok=True);(ART/'images').mkdir(exist_ok=True)
    BUILD.mkdir(parents=True,exist_ok=True)
    source=Image.open(SOURCE).convert('RGBA');bones=make_bones()
    parts={'body':make_body(source)};origins={'body':(0,0)}
    for side,polygon in ARM_POLYGONS.items():
        mask=Image.new('L',source.size);ImageDraw.Draw(mask).polygon(polygon,fill=255)
        pixels=np.array(source);selection=np.array(mask)
        if side=='near':
            # 前臂外側有真正透明間隙，按該段輪廓取到袖口，唔切入隔鄰衣襬。
            for y in range(550,755):
                opaque=pixels[y,:,3]>128
                start=np.flatnonzero(opaque[180:430])[0]+180
                end=start
                while end<430 and opaque[end]:end+=1
                selection[y,end+2:]=0
            # 拳頭同衣襬喺原畫接觸；用真膚色主連通區分離，保留暗輪廓。
            region=pixels[748:855,290:415,:3].astype(float)
            skin=(region[:,:,0]>region[:,:,2]+6)&(region[:,:,0]>region[:,:,1]+2)
            components,count=label(skin)
            sizes=np.bincount(components.ravel());sizes[0]=0
            hand=binary_dilation(binary_fill_holes(components==sizes.argmax()),iterations=1)
            gate=np.zeros(source.size[::-1],dtype=bool);gate[748:855,290:415]=hand
            selection[755:]=np.where(gate[755:],selection[755:],0)
        pixels[:,:,3]=np.minimum(pixels[:,:,3],selection)
        arm=Image.fromarray(pixels);box=arm.getbbox();parts[side+'-arm']=arm.crop(box);origins[side+'-arm']=box[:2]
    clip=animations(bones)
    posed=copy.deepcopy(bones)
    for bone in posed:
        track=clip['punch']['bones'].get(bone['name'])
        if track:bone['rotation']+=next(k['value'] for k in track['rotate'] if k['time']==.52)
    paint_pose=world_of(posed)
    corrective=Image.open(ART/'sources/raised-sleeve-v01.png').convert('RGBA')
    cmask=Image.new('L',source.size);ImageDraw.Draw(cmask).polygon([(373,323),(408,318),(451,332),(485,345),(550,351),(611,353),(670,357),(733,353),(769,343),(812,344),(844,350),(863,374),(863,408),(850,433),(818,440),(781,437),(756,433),(703,447),(650,447),(606,455),(571,463),(536,468),(489,467),(446,466),(414,460),(382,447),(361,429),(349,405),(347,375),(355,344)],fill=255)
    ca=np.array(corrective);ca[:,:,3]=np.minimum(ca[:,:,3],np.array(cmask));corrective=Image.fromarray(ca);box=corrective.getbbox();parts['near-punch']=corrective.crop(box);origins['near-punch']=box[:2]
    attachments={}
    for name,image in parts.items():
        pixels=np.array(image);transparent=pixels[:,:,3]<16
        pixels[transparent]=0;image=Image.fromarray(pixels);parts[name]=image
        image.save(ART/'images'/f'{name}.png')
        if name in ['near-arm','near-punch']:continue  # 下面一併建立共用拓撲，唔各自製作人體網格。
        weights=body_weights if name=='body' else lambda x,y,side=name.split('-')[0]:arm_weights(side,x,y)
        mesh=mesh_for(image,origins[name],weights,bones,24 if name=='body' else 12)
        mesh['path']=name;attachments[name]={name:mesh}
        assert bind_error(mesh,bones)<1e-6
    near,raised,deforms,chart=arm_chart(parts['near-arm'],parts['near-punch'],origins['near-arm'],origins['near-punch'],bones,paint_pose)
    attachments['near-arm']={'near-arm':near};attachments['near-punch']={'near-punch':raised}
    assert bind_error(near,bones)<1e-6 and bind_error(raised,bones)<1e-6
    order=['far-arm','body','near-arm','near-punch']
    # 修形只喺接近伸臂嘅有效角度啟用，唔將抬臂原畫硬扭返垂手姿勢。
    fade_times=[0,.44,.49,.66,.80,1.6];base_alpha=[1,1,0,0,1,1]
    # 兩材質喺完全相同網格上混色，底層保持實心；唔將兩隻手各自半透明疊放。
    clip['punch']['slots']={'near-punch':{'alpha':[{'time':t,'value':1-v} for t,v in zip(fade_times,base_alpha)]}}
    clip['punch']['attachments']={'default':{n:{n:{'deform':copy.deepcopy(deforms)}} for n in ['near-arm','near-punch']}}
    rig={'skeleton':{'hash':'punch-v03','spine':'4.2.120','x':-512,'y':-16,'width':1024,'height':1536,'images':'images/'},'bones':bones,'slots':[{'name':n,'bone':'root','attachment':n,**({'color':'ffffff00'} if n=='near-punch' else {})} for n in order],'skins':[{'name':'default','attachments':attachments}],'animations':clip}
    encoded=json.dumps(rig,separators=(',',':'))+'\n'
    (ART/'character.json').write_text(encoded);(BUILD/'character.json').write_text(encoded)
    atlas=Image.new('RGBA',(2048,2048));lines=['atlas.png','size: 2048,2048','format: RGBA8888','filter: Linear,Linear','repeat: none'];x=y=2;row=0
    for name,image in sorted(parts.items(),key=lambda v:-v[1].height):
        if x+image.width+2>2048:x=2;y+=row+2;row=0
        assert y+image.height+2<=2048
        atlas.paste(image,(x,y));lines.extend([name,'  rotate: false',f'  xy: {x}, {y}',f'  size: {image.width}, {image.height}',f'  orig: {image.width}, {image.height}','  offset: 0, 0','  index: -1']);x+=image.width+2;row=max(row,image.height)
    atlas.save(BUILD/'atlas.png');(BUILD/'character.atlas').write_text('\n'.join(lines)+'\n')
    runtime=re.search(r'<script>([\s\S]*?)</script>',(ROOT/'design/art/spine-character/runtime/review.html').read_text()).group(1)
    template=Path(__file__).with_name('punch_character_review.html').read_text()
    (BUILD/'runtime.js').write_text(runtime);(BUILD/'index.html').write_text(template)
    embedded={'json':encoded,'atlas':(BUILD/'character.atlas').read_text(),'image':'data:image/png;base64,'+base64.b64encode((BUILD/'atlas.png').read_bytes()).decode()}
    license_path=ROOT/'design/art/spine-character/runtime/SPINE-RUNTIME-LICENSE.txt'
    shutil.copyfile(license_path,ART/'SPINE-RUNTIME-LICENSE.txt')
    review=template.replace('/*PUNCH_DATA*/null',json.dumps(embedded)).replace('<script src="runtime.js"></script>','<script>'+runtime+'</script>')
    (ART/'review.html').write_text('<!--\n'+license_path.read_text()+'\n-->\n'+review)
    report={'status':'自然站姿v02已接受；只做同一人短拳，未動畫驗收／未發布','duration':1.6,'contact':.52,'bodyPlateSource':'exec-a0beb06b-9793-4af7-8e94-a6bc1238c35f.png','correctiveSource':'exec-6cde8894-5cac-4c0b-9e3e-9eab5b827c9b.png','sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [SOURCE,ART/'sources/body-underlay-v01.png',ART/'sources/raised-sleeve-v01.png']},'armPolygons':ARM_POLYGONS,'origins':origins,'boneCount':len(bones),'slots':order,'fixedLegBones':[n for n in world_of(bones) if 'leg' in n or 'foot' in n],'phases':{'stand':[0,.12],'windup':[.12,.38],'strike':[.38,.52],'contact':[.52,.58],'recover':[.58,1.36],'settled':[1.36,1.6]}}
    report['armChart']=chart
    (ART/'materials.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['sources','armPolygons']},ensure_ascii=False,indent=2))


if __name__=='__main__':build()
