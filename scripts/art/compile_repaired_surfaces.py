"""為真關節袖形製作Spine deform：連續截面、同一腕點，唔以拉長骨修補衣袖。"""
from pathlib import Path
import copy
import gzip
import json
import math
import sys

import numpy as np
from scipy.ndimage import maximum_filter1d, gaussian_filter1d

sys.path.insert(0,str(Path(__file__).resolve().parent))
from build_independent_rigs import world_of
from review_character_bind import unpack, forward, inverse

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'design/art/independent-animation'
BUILD=ROOT/'.local-online/full-martial-motion'


def curve(points,knots,positions):
    """經過真肩／肘／腕嘅C1曲線；回傳中心、切線及曲率供袖口截面修形。"""
    points=np.array(points);knots=np.array(knots);positions=np.array(positions)
    tangents=np.empty_like(points)
    tangents[0]=(points[1]-points[0])/(knots[1]-knots[0]);tangents[-1]=(points[-1]-points[-2])/(knots[-1]-knots[-2])
    tangents[1:-1]=(points[2:]-points[:-2])/(knots[2:]-knots[:-2])[:,None]
    i=np.clip(np.searchsorted(knots,positions)-1,0,len(knots)-2);h=(knots[i+1]-knots[i])[:,None];u=(positions[:,None]-knots[i,None])/h
    a,b=points[i],points[i+1];m,n=tangents[i]*h,tangents[i+1]*h
    centre=(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m+(-2*u**3+3*u*u)*b+(u**3-u*u)*n
    d=((6*u*u-6*u)*a+(3*u*u-4*u+1)*m+(-6*u*u+6*u)*b+(3*u*u-2*u)*n)/h
    dd=((12*u-6)*a+(6*u-4)*m+(-12*u+6)*b+(6*u-2)*n)/(h*h)
    for outside,which in [(positions<knots[0],0),(positions>knots[-1],-1)]:
        centre[outside]=points[which]+tangents[which]*(positions[outside]-knots[which])[:,None];d[outside]=tangents[which];dd[outside]=0
    length=np.maximum(.00001,np.linalg.norm(d,axis=1));normal=np.stack([-d[:,1],d[:,0]],axis=1)/length[:,None]
    curvature=np.abs(d[:,0]*dd[:,1]-d[:,1]*dd[:,0])/length**3
    curvature=gaussian_filter1d(maximum_filter1d(curvature,size=11,mode='nearest'),sigma=2)
    return centre,normal,curvature


def value(track,t,component,default=0):
    if not track:return default
    return next((k.get(component,default) for k in reversed(track) if k.get('time',0)<=t+1e-7),default)


def main():
    """逐衣輸出真蒙皮時間軸；Gzip只壓縮來源資料，正式App仍只讀位圖。"""
    materials=json.loads((ART/'materials.json').read_text());clips=json.loads((ART/'compiled-clips.json').read_text())
    for outfit in ['traveller','scholar','cloak']:
        path=BUILD/outfit/'character.json';document=json.loads(path.read_text());bones=document['bones'];rest=world_of(bones);indices={b['name']:i for i,b in enumerate(bones)}
        attachments=document['skins'][0]['attachments'];charts=materials['armCharts'][outfit];prepared={}
        for side,chart in charts.items():
            name=side+'-arm';a=attachments[name][name];entries=list(unpack(a));cols=chart['columns'];rows=chart['rows'];positions=chart['sourceY'];knots=chart['jointY'][:]
            knots.append(knots[-1]+(58 if side=='near' else 56))
            points=[np.array(rest[side+'-'+n][:2]) for n in ['upper-arm','lower-arm','hand']]
            x,y,angle=rest[side+'-hand'];length=next(b['length'] for b in bones if b['name']==side+'-hand')
            points.append(np.array([x+math.cos(angle)*length,y+math.sin(angle)*length]))
            _,normal,_=curve(points,knots,positions)
            old=[]
            for row in range(rows):
                centre=sum((np.array(forward(rest[bones[int(i)]['name']],x,y))*w for i,x,y,w in entries[row*cols+cols//2]),np.zeros(2))
                for col in range(cols):
                    point=sum((np.array(forward(rest[bones[int(i)]['name']],x,y))*w for i,x,y,w in entries[row*cols+col]),np.zeros(2))
                    old.append(float(np.dot(point-centre,normal[row])))
            flat=[(vertex,int(i),x,y,w) for vertex,es in enumerate(entries) for i,x,y,w in es]
            flat=np.array(flat);counts=np.array([len(es) for es in entries]);starts=np.r_[0,np.cumsum(counts)[:-1]]
            uv=np.clip((np.array(positions)-knots[0])/(knots[1]-knots[0]),0,1)
            local_mix=uv*uv*(3-2*uv)
            prepared[side]={'entries':entries,'widths':np.array(old).reshape(rows,cols),'knots':knots,'positions':positions,'columns':cols,'rows':rows,'flat':flat,'starts':starts,'localMix':local_mix}
        for id,animation in document['animations'].items():
            deform={};original=copy.deepcopy(animation.get('attachments',{}))
            for t in clips[id]['sampleTimes']:
                posed=copy.deepcopy(bones)
                for b in posed:
                    track=animation.get('bones',{}).get(b['name'],{})
                    b['rotation']=b.get('rotation',0)+value(track.get('rotate'),t,'value')
                    b['x']=b.get('x',0)+value(track.get('translate'),t,'x');b['y']=b.get('y',0)+value(track.get('translate'),t,'y')
                world=world_of(posed)
                for side,p in prepared.items():
                    points=[np.array(world[side+'-'+n][:2]) for n in ['upper-arm','lower-arm','hand']]
                    x,y,angle=world[side+'-hand'];length=bones[indices[side+'-hand']]['length'];points.append(np.array([x+math.cos(angle)*length,y+math.sin(angle)*length]))
                    centre,normal,curvature=curve(points,p['knots'],p['positions'])
                    widths=p['widths'];radius=1/np.maximum(.00001,curvature)
                    limit=radius*.52
                    # 兩邊收束到同一受限彎曲面，遠端腕關節中心不移動。
                    widths=widths*np.minimum(1,limit/np.maximum(.001,np.max(np.abs(widths),axis=1)))[:,None]
                    targets=centre[:,None,:]+normal[:,None,:]*widths[:,:,None]
                    flat=p['flat'];boneids=flat[:,1].astype(int);vertexids=flat[:,0].astype(int)
                    w=np.array([world[b['name']] for b in bones]);cs=np.cos(w[:,2])[boneids];sn=np.sin(w[:,2])[boneids];bonepos=w[boneids,:2]
                    oldkeys=original.get('default',{}).get(side+'-arm',{}).get(side+'-arm',{}).get('deform',[])
                    old_delta=next((k.get('vertices',[]) for k in oldkeys if abs(k.get('time',0)-t)<1e-7),[])
                    old_delta=np.array(old_delta).reshape(-1,2) if old_delta else np.zeros((len(flat),2))
                    local=flat[:,2:4]+old_delta
                    projected=np.stack([cs*local[:,0]-sn*local[:,1],sn*local[:,0]+cs*local[:,1]],axis=1)+bonepos
                    previous=np.add.reduceat(projected*flat[:,4,None],p['starts'],axis=0).reshape(p['rows'],p['columns'],2)
                    # 袖根保留原畫，肘至腕沿真關節修形；腕面同手形共享，唔留下交叉扭腕。
                    mix=p['localMix'][:,None,None];targets=previous*(1-mix)+targets*mix
                    diff=targets.reshape(-1,2)[vertexids]-bonepos
                    local=np.stack([cs*diff[:,0]+sn*diff[:,1],-sn*diff[:,0]+cs*diff[:,1]],axis=1)
                    values=np.round(local-flat[:,2:4],3).ravel().tolist()
                    deform.setdefault(side,[]).append({'time':t,'vertices':values})
            animation['attachments']={'default':{side+'-arm':{side+'-arm':{'deform':keys}} for side,keys in deform.items()}}
            if outfit=='traveller':
                keys=deform['near'];animation['attachments']['default']['near-punch']={'near-punch':{'deform':keys}}
                animation['attachments']['default'].setdefault('near-hand',{})['near-hand-fist']={'deform':keys}
        (BUILD/outfit/'clips').mkdir(exist_ok=True)
        for id,clip in document['animations'].items():(BUILD/outfit/'clips'/(id+'.json')).write_text(json.dumps(clip,separators=(',',':'))+'\n')
        path.write_text(json.dumps(document,separators=(',',':'))+'\n')
        raw=json.dumps(document['animations'],separators=(',',':')).encode()
        with gzip.GzipFile(filename=str(ART/'rig'/f'animations-{outfit}.json.gz'),mode='wb',mtime=0) as f:f.write(raw)
        print('SURFACES',outfit,len(document['animations']),len(raw),flush=True)


if __name__=='__main__':main()
