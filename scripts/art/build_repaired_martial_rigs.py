"""第60g：將已接受自然比例、唯一逆綁定點及真手形邊界帶入三衣製作。"""
from pathlib import Path
import copy
import hashlib
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, find_objects

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_independent_rigs import GUIDES, CLOTH, HAND_NAMES, clean, mesh_uv, smooth, world_of
from review_character_bind import inverse, bind_error

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT/'design/art/independent-animation'
OLD = ROOT/'design/art/spine-character'
ACCEPTED = ROOT/'design/art/character-bind-review/punch-v03'
BUILD = ROOT/'.local-online/full-martial-motion'


def weighted_mesh(image, point, weights, bones, step=18):
    """每頂點先決定唯一世界點，再對所有影響骨作逆矩陣；禁止各骨縮放原畫。"""
    world = world_of(bones)
    indices = {b['name']: i for i, b in enumerate(bones)}
    result = mesh_uv(image, lambda name,x,y: inverse(world[name], point(x,y)), weights, indices, step)
    assert bind_error(result, bones) < .00003
    return result


def limb_mapping(joints, offset, side, kind, bones):
    """原畫中心線對齊已接受關節，兩個影響共用同一個連續來源座標。"""
    names = [side+'-upper-'+kind, side+'-lower-'+kind, side+('-foot' if kind=='leg' else '-hand')]
    world = world_of(bones)
    target = [world[n][:2] for n in names]
    if kind == 'leg':
        b = next(b for b in bones if b['name']==side+'-foot')
        x,y,a = world[side+'-foot']
        target.append((x+math.cos(a)*b['length'], y+math.sin(a)*b['length']))
    def point(x,y):
        sx,sy = x+offset[0],y+offset[1]
        i = max(0,min(len(joints)-2,next((i for i in range(len(joints)-1) if sy<=joints[i+1][1]),len(joints)-2)))
        p,q = joints[i],joints[i+1]
        t = (sy-p[1])/(q[1]-p[1])
        cx = p[0]+t*(q[0]-p[0])
        a,b = np.array(target[i]),np.array(target[i+1]);d=b-a
        # X係來源橫向，世界Y向上；源圖同一個橫截面唔拆開扭兩次。
        scale = np.linalg.norm(d)/math.dist(p,q)
        transverse = np.array([-d[1],d[0]])/np.linalg.norm(d)
        out = a+d*t+transverse*(sx-cx)*scale
        return tuple(out)
    def weights(x,y):
        sy=y+offset[1];t=smooth(joints[1][1]-38,joints[1][1]+38,sy)
        if kind=='arm':return {names[0]:1-t,names[1]:t}
        u=smooth(joints[2][1]-25,joints[2][1]+25,sy)
        return {names[0]:(1-t)*(1-u),names[1]:t*(1-u),names[2]:u}
    return point,weights


def main():
    """輸出三衣共用自然骨架；來源及舊否決原型保留，不改戰鬥核心。"""
    BUILD.mkdir(parents=True,exist_ok=True)
    accepted=json.loads((ACCEPTED/'character.json').read_text())
    bones=copy.deepcopy(accepted['bones'])
    for name in ['cloth-back','cloth-front']:
        bones.append({'name':name,'parent':'hip','x':0,'y':0,'rotation':0})
    world=world_of(bones)
    old_manifest=json.loads((ART/'materials.json').read_text())
    manifest={'revision':'accepted-upright-v04','acceptedRigSha256':hashlib.sha256((ACCEPTED/'character.json').read_bytes()).hexdigest(),'sources':old_manifest['sources'],'guides':GUIDES,'hands':{},'outfits':{},'bindErrors':{},'armCharts':{}}
    source=Image.open(ART/'sources/hands-v01.png').convert('RGBA')
    pixels=np.array(source);components,count=label(pixels[:,:,3]>80)
    # 逐個真實alpha島取手形，唔再將1246×1263當成1024×1536或硬切等高格。
    regions=[]
    for i,sl in enumerate(find_objects(components),1):
        if sl and np.count_nonzero(components[sl]==i)>1500:regions.append((i,sl))
    assert len(regions)==16, '必須恰好16個完整手形，唔接受相鄰腕部越界'
    regions=sorted(regions,key=lambda v:(round(v[1][0].start/315),v[1][1].start))
    handparts={}
    for n,(component,sl) in enumerate(regions):
        row,col=divmod(n,4);kind=HAND_NAMES[row*2+col//2];side='near' if col%2==0 else 'far'
        im=pixels[sl].copy();im[:,:,3]=np.where(components[sl]==component,im[:,:,3],0)
        im[im[:,:,3]<30]=0;image=Image.fromarray(im)
        yy,xx=np.where(im[:,:,3]>180)
        # 人工量度嘅掌根比例，前臂露出段唔當成腕關節；左右手按原畫透視分別計。
        wy=72 if side=='near' else 52
        band=(yy>=wy-5)&(yy<=wy+5)
        wx=float(np.median(xx[band]));width=float(np.percentile(xx[band],95)-np.percentile(xx[band],5))
        scale=(47 if side=='near' else 40)/width
        middle=(yy>image.height*.48)&(yy<image.height*.75)
        gx,gy=float(np.mean(xx[middle])),float(np.mean(yy[middle]))
        if kind=='stone':
            y0,x0=np.where((im[:,:,3]>180)&(im[:,:,:3].max(axis=2)<90))
            if len(x0)>20:gx,gy=float(x0.mean()),float(y0.mean())
        key=f'{side}-hand-{kind}';handparts[key]=image
        manifest['hands'][key]={'wrist':[wx,wy],'scale':scale,'grip':[(gy-wy)*scale,-(gx-wx)*scale],'sourceBounds':[sl[1].start,sl[0].start,sl[1].stop,sl[0].stop],'component':component}
    default_hands=copy.deepcopy(manifest['hands']);manifest['outfitHands']={}
    for outfit,guide in GUIDES.items():
        parts={};attachments={};folder=BUILD/outfit;folder.mkdir(exist_ok=True)
        image=Image.open(ART/f'sources/{outfit}-v01.png').convert('RGBA')
        for name,(box,joints0) in guide.items():
            joints=copy.deepcopy(joints0);side,kind=name.split('-')
            im=clean(image.crop(box));bounds=im.getbbox();im=im.crop(bounds);offset=(box[0]+bounds[0],box[1]+bounds[1])
            # 旅裝袖口人工量度；來源腕孔與真腕骨同一點，唔用最底透明像素猜。
            if kind=='arm':
                if outfit=='traveller':joints[2]=(300,632) if side=='near' else (759,624)
                a=np.array(im);yy=np.arange(im.height)+offset[1]
                a[yy>joints[2][1]+22,:,3]=0;im=Image.fromarray(a)
            mapper,weights=limb_mapping(joints,offset,side,kind,bones)
            mesh=weighted_mesh(im,mapper,weights,bones);mesh['path']=name
            if kind=='arm':
                aa=np.array(im)[:,:,3];valid=np.flatnonzero(np.any(aa>80,axis=1));ys=sorted(set([float(valid[0])+i*(float(valid[-1])-float(valid[0]))/64 for i in range(65)]+[float(j[1]-offset[1]) for j in joints if valid[0]<=j[1]-offset[1]<=valid[-1]]))
                uv=[];vertices=[];tri=[];columns=9;indices={b['name']:i for i,b in enumerate(bones)}
                for y in ys:
                    row=np.flatnonzero(aa[min(im.height-1,max(0,round(y)))]>80)
                    if not len(row):raise ValueError('袖形截面斷開 '+outfit+' '+name)
                    lo,hi=float(row[0]),float(row[-1]);cy=y+offset[1];cx=float(np.interp(cy,[j[1] for j in joints],[j[0] for j in joints]))-offset[0];cx=max(lo+.01,min(hi-.01,cx))
                    for col in range(columns):
                        x=float(np.interp(col/8,[0,.5,1],[lo,cx,hi]));uv.extend([x/im.width,y/im.height]);ws={n:w for n,w in weights(x,y).items() if w>1e-7};total=sum(ws.values());vertices.append(len(ws));point=mapper(x,y)
                        for n,w in ws.items():
                            lx,ly=inverse(world[n],point);vertices.extend([indices[n],lx,ly,w/total])
                for row in range(len(ys)-1):
                    for col in range(8):
                        i=row*columns+col;tri.extend([i,i+1,i+columns,i+1,i+columns+1,i+columns])
                mesh.update(uvs=uv,vertices=vertices,triangles=tri)
                manifest['armCharts'].setdefault(outfit,{})[side]={'rows':len(ys),'columns':columns,'sourceY':[y+offset[1] for y in ys],'jointY':[j[1] for j in joints],'sourceCentre':joints,'offset':offset,'imageSize':list(im.size)}
            attachments[name]={name:mesh};parts[name]=im
        # 連續頭頸胸仍係一塊材質；所有上身變體沿相同座標及固定比例。
        upper=Image.open(OLD/f'production/upper-topknot-{outfit}.png').convert('RGBA')
        def torso_weights(x,y):
            sy=y-30
            if sy<=260:return {'head':1}
            if sy<304:
                t=smooth(260,304,sy);return {'head':1-t,'neck':t}
            if sy<365:
                t=smooth(304,365,sy);return {'neck':1-t,'chest':t}
            return {'chest':1}
        # 同一來源x/y到自然站姿世界座標；保留頭頸一體，不做獨立縮頭。
        mapper=lambda x,y:(x+180-512,1520-(y-30))
        attachments['upper-body']={'upper-body':dict(weighted_mesh(upper,mapper,torso_weights,bones,24),path='upper-body')}
        # 肩甲／袖根只由活動衣袖擁有，胸片保留真實袖籠底層作遮擋。
        for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
            u=Image.open(OLD/f'production/upper-{head}-{outfit}.png').convert('RGBA')
            a=np.array(u);mask=Image.new('L',u.size);d=ImageDraw.Draw(mask)
            d.polygon([(65,335),(175,335),(202,370),(225,420),(225,485),(190,550),(65,550)],fill=255)
            d.polygon([(485,350),(565,350),(565,510),(482,510)],fill=255)
            a[np.array(mask)>0,3]=0;u=Image.fromarray(a);u.save(folder/f'upper-{head}.png')
        parts['upper-body']=Image.open(folder/'upper-topknot.png').convert('RGBA')
        # 原腰帶由上身唯一持有；下擺以髖骨接住腿根，唔疊第二條腰帶。
        hip=Image.open(OLD/'parts/hip.png').convert('RGBA');h=np.array(hip);h[:52,:,3]=0;hip=Image.fromarray(h)
        old=json.loads((OLD/'production/character.json').read_text())
        oldbones=old['bones'];ow=world_of(oldbones)
        from review_character_bind import unpack,forward
        original=old['skins'][0]['attachments'].get('hip',{}).get('hip')
        if original:
            vertices=[];indices={b['name']:i for i,b in enumerate(bones)}
            for entries in unpack(original):
                point=sum((np.array(forward(ow[oldbones[int(i)]['name']],x,y))*w for i,x,y,w in entries),np.zeros(2));point+=np.array([8,-178])
                x,y=inverse(world['hip'],point);vertices.extend([1,indices['hip'],x,y,1])
            hipmesh=copy.deepcopy(original);hipmesh['vertices']=vertices;hipmesh['path']='hip'
            attachments['hip']={'hip':hipmesh};parts['hip']=hip
        for name,(box,anchor,target,unused) in CLOTH.get(outfit,{}).items():
            im=clean(image.crop(box));bounds=im.getbbox();im=im.crop(bounds);ox,oy=box[0]+bounds[0],box[1]+bounds[1]
            ax,ay=anchor[0]-ox,anchor[1]-oy;scale=(730+(target[1]-908)-180)/max(1,im.height-ay)
            def point(x,y,ax=ax,ay=ay,scale=scale,target=target):return (target[0]+8+(x-ax)*scale,730+(target[1]-908)-(y-ay)*scale)
            def weights(x,y,name=name,height=im.height):
                t=smooth(height*.12,height*.8,y);return {'hip':1-t,name:t}
            attachments[name]={name:dict(weighted_mesh(im,point,weights,bones,28),path=name)};parts[name]=im
        for side in ['near','far']:
            name=side+'-hand';attachments[name]={}
            for kind in HAND_NAMES:
                key=f'{side}-hand-{kind}';im=handparts[key];meta=manifest['hands'][key];wx,wy=meta['wrist'];scale=meta['scale'];frame=world[name]
                from review_character_bind import forward
                point=lambda x,y,wx=wx,wy=wy,scale=scale,frame=frame:forward(frame,(y-wy)*scale,-(x-wx)*scale)
                attachments[name][key]=dict(weighted_mesh(im,point,lambda x,y,name=name:{name:1},bones,30),path=key);parts[key]=im
        # 自然站姿母版嘅真腿／真鞋：避免舊素材腳尖指引扭轉鞋底。
        body=Image.open(ACCEPTED/'images/body.png').convert('RGBA')
        source_origin=lambda x,y:(x-512,1520-y)
        for side,polygon in {
            'near':[(410,880),(500,880),(500,1060),(470,1160),(435,1290),(435,1498),(290,1536),(290,1400),(325,1250),(330,1110),(365,1040)],
            'far':[(500,880),(635,880),(645,1100),(670,1230),(670,1380),(780,1460),(780,1536),(540,1536),(530,1390),(535,1210),(520,1130)]
        }.items():
            mask=Image.new('L',body.size);ImageDraw.Draw(mask).polygon(polygon,fill=255)
            a=np.array(body);a[:,:,3]=np.minimum(a[:,:,3],np.array(mask));im=Image.fromarray(a)
            def weights(x,y,side=side):
                knee=1160 if side=='near' else 1154;ankle=1405 if side=='near' else 1401
                t=smooth(knee-35,knee+35,y);u=smooth(ankle-20,ankle+20,y)
                return {side+'-upper-leg':(1-t)*(1-u),side+'-lower-leg':t*(1-u),side+'-foot':u}
            name=side+'-leg';parts[name]=im
            attachments[name]={name:dict(weighted_mesh(im,source_origin,weights,bones,24),path=name)}
        # 腰至衣襬沿同一母版；頭／頸／胸唔拆開，腰帶亦唔重複疊放。
        for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
            if head=='topknot' and outfit=='traveller':
                u=body.crop((180,-30,820,700));u.save(folder/f'upper-{head}.png');parts['upper-body']=u
        hip=body.crop((0,640,1024,1130));mask=Image.new('L',hip.size)
        ImageDraw.Draw(mask).polygon([(410,0),(652,0),(700,230),(735,333),(625,380),(592,342),(505,427),(463,380),(393,485),(288,366),(348,202)],fill=255)
        h=np.array(hip);h[:,:,3]=np.minimum(h[:,:,3],np.array(mask));hip=Image.fromarray(h)
        parts['hip']=hip;attachments['hip']={'hip':dict(weighted_mesh(hip,lambda x,y:source_origin(x,y+640),lambda x,y:{'hip':1},bones,24),path='hip')}
        if outfit=='traveller':
            # 活動手臂沿v03同一拓撲，手形獨立於衣袖，袖口保留重疊。
            for side in ['near']:
                name=side+'-arm';im=Image.open(ACCEPTED/'images'/f'{name}.png').convert('RGBA');parts[name]=im
                a=copy.deepcopy(accepted['skins'][0]['attachments'][name][name]);a['path']=name
                meta=json.loads((ACCEPTED/'materials.json').read_text());origin=meta['origins'][name];wrist=756 if side=='near' else 758
                # 依真腕位置分三角形，唔用來源圖格邊界猜袖口。
                triangles=a['triangles'];arm=[];fist=[]
                for j in range(0,len(triangles),3):
                    ids=triangles[j:j+3];sy=sum(a['uvs'][v*2+1]*im.height+origin[1] for v in ids)/3
                    (arm if sy<wrist else fist).extend(ids)
                a['triangles']=arm;attachments[name]={name:a}
                chart=meta['armChart'];manifest['armCharts'][outfit][side]={'rows':chart['rows'],'columns':chart['columns'],'sourceY':chart['rowPositions'],'jointY':[385,580,756],'sourceCentre':[(360,385),(280,580),(335,756)],'offset':origin,'imageSize':list(im.size)}
                hand=copy.deepcopy(a);hand['triangles']=fist;key=side+'-hand-fist';attachments[side+'-hand'][key]=hand
                # 同幀真掌心點；原拳頭唔再錯配另一張手形嘅握點。
                point=(350,805) if side=='near' else (724,805);gx,gy=inverse(world[side+'-hand'],source_origin(*point));manifest['hands'][key]['grip']=[gx,gy]
        if outfit=='traveller':
            raised=copy.deepcopy(accepted['skins'][0]['attachments']['near-punch']['near-punch'])
            raised['triangles']=attachments['near-arm']['near-arm']['triangles'][:]
            attachments['near-punch']={'near-punch':raised}
            parts['near-punch']=Image.open(ACCEPTED/'images/near-punch.png').convert('RGBA')
        order=[n for n in ['cloth-back','far-leg','near-leg','far-arm','upper-body','hip','cloth-front','near-arm','near-punch','far-hand','near-hand'] if n in attachments]
        rig={'skeleton':{'hash':'accepted-upright-v04','spine':'4.2.120','images':'parts/'},'bones':bones,'slots':[{'name':n,'bone':'root','attachment':n+'-fist' if n.endswith('hand') else n,**({'color':'ffffff00'} if n=='near-punch' else {})} for n in order],'skins':[{'name':'default','attachments':attachments}],'animations':{}}
        pos={};x=y=2;row=0;width=2048
        for name,im in sorted(parts.items(),key=lambda z:-z[1].height):
            if x+im.width+2>width:x=2;y+=row+2;row=0
            pos[name]=(x,y);x+=im.width+2;row=max(row,im.height)
        height=1<<(y+row+1).bit_length();atlas=Image.new('RGBA',(width,height));lines=['atlas.png',f'size: {width},{height}','format: RGBA8888','filter: Linear,Linear','repeat: none']
        for name,im in parts.items():
            x,y=pos[name];atlas.paste(im,(x,y));lines.extend([name,'  rotate: false',f'  xy: {x}, {y}',f'  size: {im.width}, {im.height}',f'  orig: {im.width}, {im.height}','  offset: 0, 0','  index: -1'])
        atlas.save(folder/'atlas.png');(folder/'character.atlas').write_text('\n'.join(lines)+'\n');(folder/'rig.json').write_text(json.dumps(rig,separators=(',',':'))+'\n')
        manifest['outfits'][outfit]={'atlasSize':[width,height],'upperRegion':[*pos['upper-body'],640,730],'slots':order,'boneCount':len(bones),'upperSource':f'.local-online/full-martial-motion/{outfit}/upper-{{head}}.png'}
        manifest['outfitHands'][outfit]=copy.deepcopy(manifest['hands'] if outfit=='traveller' else default_hands)
        manifest['bindErrors'][outfit]={n:max(bind_error(a,bones) for a in group.values()) for n,group in attachments.items()}
    manifest['acceptedSources']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ACCEPTED/'character.json',ACCEPTED/'images/body.png',ACCEPTED/'images/near-arm.png',ACCEPTED/'images/near-punch.png']}
    (ART/'materials.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (BUILD/'repaired-materials.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print('REPAIRED_RIGS',manifest['bindErrors'])


if __name__=='__main__':main()
