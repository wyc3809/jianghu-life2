"""第60g v02：以已接受完整母版重新量自然站姿；只建一張靜態骨架評閱。"""
from pathlib import Path
import hashlib
import json
import math
import re
import shutil
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_independent_rigs import mesh_uv, smooth, world_of
from review_character_bind import inverse, bind_error, unpack

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'design/art/spine-character/sources/master-v01.png'
OUT = ROOT/'design/art/character-bind-review/upright-v02'
BUILD = ROOT/'.local-online/rig-repair/upright-v02'

# 同一母版像素座標；前後側保持母版原有透視，唔各自fit素材。
POINTS = {
    'hip': (520,790), 'torso': (520,650), 'chest': (520,390),
    'neck': (539,304), 'head': (538,246),
    'near-upper-arm': (360,385), 'near-lower-arm': (280,580),
    'near-hand': (335,756), 'near-knuckles': (350,814),
    'far-upper-arm': (647,398), 'far-lower-arm': (697,590),
    'far-hand': (725,758), 'far-knuckles': (724,814),
    'near-upper-leg': (445,900), 'near-lower-leg': (389,1160),
    'near-foot': (380,1405), 'near-toes': (354,1494),
    'far-upper-leg': (585,900), 'far-lower-leg': (606,1154),
    'far-foot': (608,1401), 'far-toes': (725,1480),
}
ORIGIN = (512,1520)


def source_to_world(point):
    """全張母版只用一個一比一座標變換，唔縮頭／壓身／改腳角。"""
    return (point[0]-ORIGIN[0], ORIGIN[1]-point[1])


def make_bones():
    """依實際站姿關節建立父子骨鏈，唔套用guard屈膝IK。"""
    bones = [{'name':'root','x':0,'y':0,'rotation':0}]
    frames = {'root':(0,0,0)}

    def add(name, parent, end=None):
        position = source_to_world(POINTS[name])
        x,y = inverse(frames[parent], position)
        if end:
            target = source_to_world(POINTS[end])
            angle = math.atan2(target[1]-position[1], target[0]-position[0])
        else:
            angle = 0
        bone = {'name':name,'parent':parent,'x':x,'y':y,'rotation':math.degrees(angle-frames[parent][2])}
        if end:
            bone['length'] = math.dist(position,target)
        bones.append(bone)
        frames[name] = (*position,angle)

    add('hip','root')
    add('torso','hip','chest')
    add('chest','torso')
    add('neck','chest','head')
    add('head','neck')
    for side in ['near','far']:
        add(side+'-upper-arm','chest',side+'-lower-arm')
        add(side+'-lower-arm',side+'-upper-arm',side+'-hand')
        add(side+'-hand',side+'-lower-arm',side+'-knuckles')
        add(side+'-upper-leg','hip',side+'-lower-leg')
        add(side+'-lower-leg',side+'-upper-leg',side+'-foot')
        add(side+'-foot',side+'-lower-leg',side+'-toes')
    return bones


def skin_weights(image):
    """建立連續表面初始權重；只供自然站姿，未驗收大動作或交叉遮擋。"""
    masks = {}
    polygons = {
        'near': [(340,335),(402,390),(367,510),(337,571),(368,681),(403,816),(362,850),(303,840),(278,736),(240,640),(226,561),(258,464),(298,380)],
        'far': [(639,353),(686,413),(714,535),(735,617),(770,744),(783,829),(729,854),(695,824),(676,735),(655,639),(644,594),(615,505)],
    }
    for side, polygon in polygons.items():
        mask = Image.new('L', image.size)
        ImageDraw.Draw(mask).polygon(polygon, fill=255)
        masks[side] = mask

    def blend(a,b,t):
        t=max(0,min(1,t))
        return {a:1-t,b:t}

    def body(y):
        if y<260:
            return {'head':1}
        if y<304:
            return blend('head','neck',smooth(260,304,y))
        if y<365:
            return blend('neck','chest',smooth(304,365,y))
        if y<650:
            return blend('chest','torso',smooth(440,650,y))
        return blend('torso','hip',smooth(650,790,y))

    def weights(x,y):
        for side in ['near','far']:
            if masks[side].getpixel((min(image.width-1,int(x)),min(image.height-1,int(y)))):
                shoulder=POINTS[side+'-upper-arm'][1]
                elbow=POINTS[side+'-lower-arm'][1]
                wrist=POINTS[side+'-hand'][1]
                arm=blend(side+'-upper-arm',side+'-lower-arm',smooth(elbow-40,elbow+40,y)) if y<wrist-25 else blend(side+'-lower-arm',side+'-hand',smooth(wrist-25,wrist+25,y))
                root_mix=smooth(shoulder-25,shoulder+90,y)
                result={k:v*(1-root_mix) for k,v in body(y).items()}
                for k,v in arm.items():
                    result[k]=result.get(k,0)+v*root_mix
                return result
        if y<870:
            return body(y)
        result={}
        for side,side_weight in [('near',1-smooth(490,530,x)),('far',smooth(490,530,x))]:
            knee=POINTS[side+'-lower-leg'][1]
            ankle=POINTS[side+'-foot'][1]
            leg=blend(side+'-upper-leg',side+'-lower-leg',smooth(knee-35,knee+35,y)) if y<ankle-20 else blend(side+'-lower-leg',side+'-foot',smooth(ankle-20,ankle+20,y))
            hip_mix=smooth(870,950,y)
            result['hip']=result.get('hip',0)+side_weight*(1-hip_mix)
            for k,v in leg.items():
                result[k]=result.get(k,0)+side_weight*hip_mix*v
        return result
    return weights


def build():
    """輸出隔離原型；保留上一版否決資料，唔改正式角色或戰鬥。"""
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'images').mkdir(exist_ok=True)
    BUILD.mkdir(parents=True,exist_ok=True)
    image=Image.open(SOURCE).convert('RGBA')
    bones=make_bones()
    frames=world_of(bones)
    indices={b['name']:i for i,b in enumerate(bones)}
    mapper=lambda bone,x,y: inverse(frames[bone],source_to_world((x,y)))
    mesh=dict(mesh_uv(image,mapper,skin_weights(image),indices,24),path='whole-body')
    # 保留更高精度嘅同一逆綁定點，唔沿用舊builder嘅5位小數截斷。
    vertices=[]
    for n,entries in enumerate(unpack(mesh)):
        position=source_to_world((mesh['uvs'][n*2]*image.width,mesh['uvs'][n*2+1]*image.height))
        vertices.append(len(entries))
        total=sum(e[3] for e in entries)
        for i,_x,_y,weight in entries:
            x,y=inverse(frames[bones[int(i)]['name']],position)
            vertices.extend([i,round(x,8),round(y,8),weight/total])
    mesh['vertices']=vertices
    assert bind_error(mesh,bones)<1e-6
    rig={'skeleton':{'hash':'upright-v02','spine':'4.2.120','x':-512,'y':-16,'width':1024,'height':1536,'images':'images/'},'bones':bones,'slots':[{'name':'whole-body','bone':'root','attachment':'whole-body'}],'skins':[{'name':'default','attachments':{'whole-body':{'whole-body':mesh}}}],'animations':{'stand':{}}}
    shutil.copyfile(SOURCE,OUT/'images/whole-body.png')
    assert (OUT/'images/whole-body.png').read_bytes()==SOURCE.read_bytes()
    atlas=Image.new('RGBA',(2048,2048))
    atlas.paste(image,(2,2))
    atlas.save(BUILD/'atlas.png')
    (BUILD/'character.atlas').write_text('atlas.png\nsize: 2048,2048\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\nwhole-body\n  rotate: false\n  xy: 2, 2\n  size: 1024, 1536\n  orig: 1024, 1536\n  offset: 0, 0\n  index: -1\n')
    encoded=json.dumps(rig,separators=(',',':'))+'\n'
    (BUILD/'character.json').write_text(encoded)
    (OUT/'character.json').write_text(encoded)
    runtime=re.search(r'<script>([\s\S]*?)</script>',(ROOT/'design/art/spine-character/runtime/review.html').read_text()).group(1)
    (BUILD/'runtime.js').write_text(runtime)
    (BUILD/'index.html').write_text(Path(__file__).with_name('upright_character_review.html').read_text())
    old=json.loads((ROOT/'design/art/character-bind-review/traveller-review.json').read_text())
    old_bones={b['name']:b for b in old['bones']}
    old_pose=old['animations']['guard']['bones']
    report={
        'status':'上一版已被玩家否決；本輪只交自然站姿；未動畫驗收／未合併／未發布',
        'source':str(SOURCE.relative_to(ROOT)), 'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'sourceUnmodified':True, 'sourceOrigin':ORIGIN, 'worldUnitsPerSourcePixel':1,
        'landmarks':POINTS, 'boneCount':len(bones), 'surfaceCount':1,
        'previousGuardKneeAngles':{s:old_bones[s+'-lower-leg']['rotation']+old_pose[s+'-lower-leg']['rotate'][0]['value'] for s in ['near','far']},
        'standingKneeAngles':{s:next(b['rotation'] for b in bones if b['name']==s+'-lower-leg') for s in ['near','far']},
        'maxBindDisagreement':bind_error(mesh,bones),
        'limitations':['使用已接受完整母版，唔係新畫或新出拳','只重建自然站姿初始綁定；大動作及交叉遮擋要另行處理','尚未連續動畫、換裝、持武或真機驗收']
    }
    (OUT/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='landmarks'},ensure_ascii=False,indent=2))


if __name__=='__main__':
    build()
