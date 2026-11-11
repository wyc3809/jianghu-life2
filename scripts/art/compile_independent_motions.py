"""把逐門手／足目標解成共用受約束骨架。固定骨長、FK／二節IK，輸出Spine 4.2關鍵幀。"""
from pathlib import Path
import json,math,sys,importlib.util,copy
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';BUILD=ROOT/'.local-online/full-martial-motion'
D=math.pi/180

def clamp(x,a,b):return max(a,min(b,x))
def wrap(x):return (x+180)%360-180

def two_bone(dx,dy,l1,l2,max_bend=155,sign=1):
 distance=math.hypot(dx,dy);minimum=math.sqrt(l1*l1+l2*l2+2*l1*l2*math.cos(max_bend*D));maximum=l1+l2-.01
 # 只允許數值誤差；不拉長骨、不放寬角度去掩蓋不可達目標。
 error=max(0,minimum-distance,distance-maximum)
 if error>1:raise ValueError(f'IK目標不可達: d={distance:.2f}, range={minimum:.2f}..{maximum:.2f}, error={error:.2f}')
 r=clamp(distance,minimum,maximum);b=sign*math.acos(clamp((r*r-l1*l1-l2*l2)/(2*l1*l2),-1,1));a=math.atan2(dy,dx)-math.atan2(l2*math.sin(b),l1+l2*math.cos(b));return a/D,b/D

def lerp(a,b,t):
 if isinstance(a,bool):return a if t<.5 else b
 if isinstance(a,(float,int)) and isinstance(b,(float,int)):return a+(b-a)*t
 if isinstance(a,list):return[lerp(x,y,t)for x,y in zip(a,b)]
 return a if t<.5 else b

def keytimes(clock):
 d=clock['duration'];h=clock['contacts']
 if len(h)>=3:return[0,h[0]*.5,h[0],(h[0]+h[1])/2,h[1],(h[1]+h[2])/2,h[2],d]
 if len(h)==2:return[0,h[0]*.25,h[0]*.65,h[0],(h[0]+h[1])/2,h[1],h[1]+(d-h[1])*.6,d]
 contact=h[0]if h else d*.45
 return[0,contact*.3,contact*.7,contact,contact+(d-contact)*.18,contact+(d-contact)*.45,contact+(d-contact)*.72,d]

def arc(a,b,origin,t):
 ax,ay=a[0]-origin[0],a[1]-origin[1];bx,by=b[0]-origin[0],b[1]-origin[1];r=lerp(math.hypot(ax,ay),math.hypot(bx,by),t);angle=math.atan2(ay,ax)+wrap((math.atan2(by,bx)-math.atan2(ay,ax))/D)*D*t
 return[origin[0]+r*math.cos(angle),origin[1]+r*math.sin(angle)]

def goal_at(plan,poses,t,times):
 i=next((n for n in range(len(times)-1)if t<=times[n+1]),len(times)-2);u=clamp((t-times[i])/max(.00001,times[i+1]-times[i]),0,1);u=u*u*(3-2*u)
 a,b=poses[plan[i]],poses[plan[i+1]];p={k:lerp(a.get(k,b.get(k)),b.get(k,a.get(k)),u)for k in a.keys()|b.keys()}
 p['aim']=a['aim']+wrap(b['aim']-a['aim'])*u
 # 腕沿肩部的可達弧線過渡，避免直線插過肩心後把肘折反。
 for side,origin in [('near',[-165,-35]),('far',[120,-45])]:p[side]=arc(a[side],b[side],origin,u)
 for side,base,root in [('near',[-162,83],[-82,693]),('far',[98,93],[73,693])]:
  if a[side+'Foot'][1] or b[side+'Foot'][1]:
   av=[base[k]+a[side+'Foot'][k]-a['hip'][k]-root[k]for k in range(2)];bv=[base[k]+b[side+'Foot'][k]-b['hip'][k]-root[k]for k in range(2)];v=arc(av,bv,[0,0],u);p[side+'Foot']=[p['hip'][k]+root[k]+v[k]-base[k]for k in range(2)]
 ta,tb=a['two'],b['two'];p['twoGap']=lerp(ta,tb,u)if ta and tb else ta or tb;p['twoMix']=1 if ta and tb else u if tb else 1-u if ta else 0
 return p

def solve_pose(p,family,bones,hands):
 B={b['name']:b for b in bones};rot={};hipx,hipy=p['hip'];lean=p['lean'];rot['torso']=lean;rot['neck']=p['head']*.5;rot['head']=p['head']*.5
 weapon=family in ['sword','blade','spear','staff','whip','bow','hook','halberd','flute','mechanism','needle','dart']
 hand=p['hand']if p.get('handSpecified')else'grip'if weapon else p['hand'];farhand=p['farHand']if p.get('farHandSpecified')else'fist'
 if family=='flute':hand=farhand='flute'
 if family=='mechanism':hand=farhand='pinch'
 if family in ['needle','dart']:hand=farhand='pinch'
 if family=='weiqi':hand=farhand='stone'
 gap=p.get('clipGap',0)or p.get('twoGap',p['two'])or(260 if family in ['spear','staff','halberd']else 0)
 if gap:farhand='grip'if family!='flute'else'flute'
 wrist={};angles={}
 def arm(side,target,shape,aim):
  shoulder=B[side+'-upper-arm'];upper,lower=B[side+'-upper-arm'],B[side+'-lower-arm'];a,b=two_bone(target[0]-shoulder['x'],target[1]-shoulder['y'],upper['length'],lower['length'],sign=-1 if side=='far'and(gap or family=='bow')else 1);rot[side+'-upper-arm']=wrap(a-upper['rotation']);rot[side+'-lower-arm']=b-lower['rotation']
  fore=a+b;desired=fore if shape in ['fist','draw']else aim;handangle=fore+clamp(wrap(desired-fore),-85,85);rot[side+'-hand']=wrap(handangle-fore-B[side+'-hand']['rotation']);wrist[side]=target;angles[side]=handangle
  return target,handangle
 nearTarget=list(p['near']);farTarget=p['far']
 def project(target,side):
  b=B[side+'-upper-arm'];l1,l2=b['length'],B[side+'-lower-arm']['length'];lo=math.sqrt(l1*l1+l2*l2+2*l1*l2*math.cos(155*D))+1;hi=l1+l2-.05;dx,dy=target[0]-b['x'],target[1]-b['y'];d=math.hypot(dx,dy);r=clamp(d,lo,hi);return[b['x']+dx*r/max(.001,d),b['y']+dy*r/max(.001,d)]
 if gap:
  # 握點是二節IK末端。兵器軸與掌心握點分開，不能把手腕角誤當刀桿角。
  def effective(side,shape):
   g=hands[side+'-hand-'+shape]['grip'];l2=B[side+'-lower-arm']['length'];phi=math.atan2(g[1],l2+g[0])/D;length=math.hypot(l2+g[0],g[1]);limit=155-abs(phi);l1=B[side+'-upper-arm']['length'];return l1,length,phi,limit,math.sqrt(l1*l1+length*length+2*l1*length*math.cos(limit*D))+1,l1+length-.1
  nearE=effective('near',hand);farE=effective('far',farhand);angle=p['aim']*D;g=hands['near-hand-'+hand]['grip'];goal=[nearTarget[0]+g[0]*math.cos(angle)-g[1]*math.sin(angle),nearTarget[1]+g[0]*math.sin(angle)+g[1]*math.cos(angle)]
  if 'nearGrip' in p:goal=list(p['nearGrip'])
  for iteration in range(100):
   error=0
   for side,e,offset in [('near',nearE,[0,0]),('far',farE,[-gap*math.cos(angle),-gap*math.sin(angle)])]:
    b=B[side+'-upper-arm'];dx,dy=goal[0]+offset[0]-b['x'],goal[1]+offset[1]-b['y'];distance=math.hypot(dx,dy);radius=clamp(distance,e[4],e[5]);error=max(error,abs(radius-distance));goal[0]+=dx*(radius/max(.001,distance)-1);goal[1]+=dy*(radius/max(.001,distance)-1)
   if error<.001:break
  else:raise ValueError('雙手握點無共同可達位置，須重製姿勢')
  for side,e,offset in [('near',nearE,[0,0]),('far',farE,[-gap*math.cos(angle),-gap*math.sin(angle)])]:
   upper,lower=B[side+'-upper-arm'],B[side+'-lower-arm'];a,b=two_bone(goal[0]+offset[0]-upper['x'],goal[1]+offset[1]-upper['y'],e[0],e[1],e[3],sign=1 if side=='near'else-1);bend=b-e[2];rot[side+'-upper-arm']=wrap(a-upper['rotation']);rot[side+'-lower-arm']=bend-lower['rotation'];rot[side+'-hand']=-B[side+'-hand']['rotation']
 else:
  arm('near',nearTarget,hand,p['aim']);arm('far',farTarget,farhand,p.get('farAim',p['aim']))
 for side in ['near','far']:
  upper,lower=B[side+'-upper-leg'],B[side+'-lower-leg'];base=p.get('_feet',{}).get(side,(-162,83)if side=='near'else(98,93));offset=p[side+'Foot'];x,y=base[0]+offset[0],base[1]+offset[1];sx,sy=B['hip'].get('x',0)+hipx+upper['x'],B['hip']['y']+hipy+upper['y'];a,b=two_bone(x-sx,y-sy,upper['length'],lower['length'],150,sign=p.get('_legSigns',{}).get(side,-1));rot[side+'-upper-leg']=wrap(a-upper['rotation']);rot[side+'-lower-leg']=b-lower['rotation'];rot[side+'-foot']=wrap(p.get('_footAngles',{}).get(side,-41)-a-b-B[side+'-foot']['rotation'])
 rot['cloth-back']=clamp(p['cloth']-lean*.25,-12,12);rot['cloth-front']=clamp(-p['cloth']*.6+lean*.2,-10,10)
 return rot,{'hip':(hipx,hipy)},hand,farhand

def main():
 doc=json.loads((ART/'motions.json').read_text());clocks={z['id']:z for z in json.loads((ART/'clocks.json').read_text())};materials=json.loads((ART/'materials.json').read_text());base=json.loads((BUILD/'traveller/rig.json').read_text());animations={};manifest={};fail=[]
 repaired='--repaired' in sys.argv
 if repaired:
  from build_independent_rigs import world_of
  materials=json.loads((BUILD/'repaired-materials.json').read_text());old=json.loads((ROOT/'design/art/spine-character/production/character.json').read_text());OB={b['name']:b for b in old['bones']};NB={b['name']:b for b in base['bones']};W=world_of(base['bones'])
  for p in doc['poses'].values():
   for side in ['near','far']:
    u,l=side+'-upper-arm',side+'-lower-arm';factor=(NB[u]['length']+NB[l]['length'])/(OB[u]['length']+OB[l]['length'])
    p[side]=[NB[u][k]+(p[side][i]-OB[u][k])*factor for i,k in enumerate(['x','y'])]
    p[side+'Foot']=[z*.78 for z in p[side+'Foot']]
   p['hip']=[z*.78 for z in p['hip']];p['two']*=.94
   p['_feet']={s:list(W[s+'-foot'][:2]) for s in ['near','far']};p['_footAngles']={s:W[s+'-foot'][2]/D for s in ['near','far']};p['_legSigns']={'near':1,'far':-1}
  # 自然待機沿已接受比例，唔把舊屈膝guard帶回站姿。
  p=doc['poses']['rest'];p['hip']=[0,0]
  for side in ['near','far']:p[side]=[W[side+'-hand'][k]-W['chest'][k] for k in range(2)]
 # 生命週期另列，不冒充新增武學；同一所選造型由待機到倒地皆用同源材質。
 for tag,family,neutral in [('fist','fist','rest' if repaired else 'guard'),('grip','sword','weapon-guard'),('pole','staff','pole-guard'),('heavy','blade','blade-settle'),('bow','bow','weapon-guard'),('flute','flute','flute-guard'),('needle','needle','needle-hide'),('stone','weiqi','stone-think')]:
  for state,duration in [('idle',1.6),('walk',.8),('hurt',.26)]:
   id=f'_{state}_{tag}';doc['clips'][id]={'name':state+' '+tag,'kind':'lifecycle','family':family,'poses':[neutral]*8};clocks[id]={'id':id,'name':state+' '+tag,'kind':'lifecycle','family':family,'duration':duration,'contacts':[],'premium':False,'state':state}
 for tag,family,tokens in [('fist','fist',['guard','draw','draw','punch','punch','draw','guard','guard']),('grip','sword',['weapon-guard','weapon-draw','weapon-high','slash-level','slash-level','weapon-low','weapon-guard','weapon-guard']),('pole','staff',['pole-guard','pole-draw','pole-draw','pole-thrust','pole-thrust','pole-draw','pole-guard','pole-guard'])]:
  id='_basic_'+tag;doc['clips'][id]={'name':'基本出手 '+tag,'kind':'lifecycle','family':family,'poses':tokens};clocks[id]={'id':id,'name':'基本出手 '+tag,'kind':'lifecycle','family':family,'duration':.72,'contacts':[.36],'premium':False,'state':'basic'}
 for id,clip in doc['clips'].items():
  clock=clocks[id];clip=json.loads(json.dumps(clip));family=clip['family'];originalGap=max(doc['poses'][z]['two']for z in clip['poses'])
  neutral=clip['poses'][0]if clip['kind']=='lifecycle'else'qi-low'if clip['kind']=='internal'else'pole-guard'if family in ['spear','staff','halberd']else'flute-guard'if family=='flute'else'blade-settle'if family=='blade'and originalGap else'needle-hide'if family in ['needle','dart']else'stone-think'if family=='weiqi'else'weapon-guard'if family in ['sword','blade','bow','whip','hook','mechanism']else'guard'
  clip['poses'][0]=clip['poses'][-1]=neutral
  times=keytimes(clock);n=math.ceil(clock['duration']*(60 if repaired and originalGap else 30));
  closure=[]
  if originalGap and family in ['blade','sword']and clip['kind']!='lifecycle':
   B={z['name']:z for z in base['bones']};g=materials['hands']['near-hand-grip']['grip']
   for token in clip['poses']:
    p0={**doc['poses'][token],'clipGap':originalGap};r,_,_,_=solve_pose(p0,family,base['bones'],materials['hands']);a=(B['near-upper-arm']['rotation']+r['near-upper-arm'])*D;f=a+(B['near-lower-arm']['rotation']+r['near-lower-arm'])*D;h=f+(B['near-hand']['rotation']+r['near-hand'])*D;w=[B['near-upper-arm']['x']+B['near-upper-arm']['length']*math.cos(a)+B['near-lower-arm']['length']*math.cos(f),B['near-upper-arm']['y']+B['near-upper-arm']['length']*math.sin(a)+B['near-lower-arm']['length']*math.sin(f)];ng=[w[0]+g[0]*math.cos(h)-g[1]*math.sin(h),w[1]+g[0]*math.sin(h)+g[1]*math.cos(h)];closure.append({'far':[ng[0]-originalGap*math.cos(p0['aim']*D),ng[1]-originalGap*math.sin(p0['aim']*D)],'aim':p0['aim']})
  wristkeys=[]
  if not originalGap and family not in ['staff','spear','halberd']:
   wristkeys=[solve_pose(doc['poses'][token],family,base['bones'],materials['hands'])[0]for token in clip['poses']]
  samples=sorted(set([round(clock['duration']*i/n,7)for i in range(n+1)]+times+clock['contacts']));bones={};slots={};lastshapes=None;intents=[]
  for t in samples:
   p=goal_at(clip['poses'],doc['poses'],t,times);p['clipGap']=originalGap
   if closure:
    i=next((n for n in range(7)if t<=times[n+1]),6);u=clamp((t-times[i])/max(.00001,times[i+1]-times[i]),0,1);u=u*u*(3-2*u);q1,q2=closure[i],closure[i+1];fg=arc(q1['far'],q2['far'],[120,-45],u);a=(q1['aim']+wrap(q2['aim']-q1['aim'])*u)*D;ng=[fg[0]+originalGap*math.cos(a),fg[1]+originalGap*math.sin(a)];g=materials['hands']['near-hand-grip']['grip'];p['nearGrip']=ng;p['aim']=a/D

   phase=t/clock['duration'];state=clock.get('state')
   if state=='idle':p['head']+=math.sin(phase*math.tau)*.7;p['cloth']+=math.sin(phase*math.tau+.4)*.6
   elif state=='walk':
    swing=math.sin(phase*math.tau);p['nearFoot']=[80*swing,max(0,swing)*70];p['farFoot']=[-80*swing,max(0,-swing)*70];p['hip']=[0,-45-10*math.cos(phase*math.tau*2)];p['cloth']=3*swing
   elif state=='hurt':
    amount=math.sin(min(1,t/.2)*math.pi)**2 if t<.2 else 0;p['hip'][0]-=35*amount;p['lean']+=10*amount;p['head']-=2*amount
    if repaired:p['hip'][1]-=8*amount

   try:rot,trans,hand,farhand=solve_pose(p,clip['family'],base['bones'],materials['hands'])
   except ValueError as e:fail.append({'id':id,'time':t,'pose':clip['poses'][min(7,next((i for i,z in enumerate(times)if z>=t),7))],'error':str(e)});break
   if wristkeys:
    i=next((n for n in range(7)if t<=times[n+1]),6);u=clamp((t-times[i])/max(.00001,times[i+1]-times[i]),0,1);u=u*u*(3-2*u)
    for side in ['near','far']:
     name=side+'-hand';rot[name]=lerp(wristkeys[i][name],wristkeys[i+1][name],u)
   for name,v in rot.items():bones.setdefault(name,{}) .setdefault('rotate',[]).append({'time':t,'value':round(v,5)})
   for name,(x,y)in trans.items():bones.setdefault(name,{}) .setdefault('translate',[]).append({'time':t,'x':round(x,5),'y':round(y,5)})
   intents.append({'time':t,'aim':p['aim'],'contact':p.get('contact','near'),'gap':p['clipGap']})
   shapes=(hand,farhand)
   if shapes!=lastshapes:
    for side,shape in [('near',hand),('far',farhand)]:slots.setdefault(side+'-hand',{'attachment':[]})['attachment'].append({'time':t,'name':side+'-hand-'+shape})
    lastshapes=shapes
  else:
   animations[id]={'bones':bones,'slots':slots};manifest[id]={**clock,'neutral':neutral,'keyTimes':times,'sampleCount':len(samples),'sampleTimes':samples,'poses':clip['poses'],'sampleIntents':intents}
 if fail:
  (BUILD/'ik-failures.json').write_text(json.dumps(fail,ensure_ascii=False,indent=2));print('UNREACHABLE_POSES',len(fail));print(json.dumps(fail[:20],ensure_ascii=False,indent=2));sys.exit(1)
 # 倒地沿用既有受控關鍵幀，材質改用同源新衣著；頭頸總轉角統一成上身預設。
 old=json.loads((ROOT/'design/art/spine-character/production/character.json').read_text())
 down=json.loads(json.dumps(old['animations']['down']));times=[0,.16,.4,.7,.85]
 for name in ['neck','head']:down['bones'][name]={'rotate':[{'time':t,'value':v}for t,v in zip(times,[0,-1.5,-2.5,-3,-3])]}
 animations['_down']=down;manifest['_down']={'id':'_down','name':'倒地','kind':'lifecycle','family':'fist','duration':.85,'contacts':[],'premium':False,'state':'down','neutral':'guard','keyTimes':times,'sampleCount':27,'sampleTimes':[round(.85*i/26,7)for i in range(27)],'poses':[]}
 for outfit in ['traveller','scholar','cloak']:
  j=json.loads((BUILD/outfit/'rig.json').read_text());j.pop('animations',None);(ART/'rig').mkdir(exist_ok=True);(ART/'rig'/f'{outfit}.json').write_text(json.dumps(j,separators=(',',':'))+'\n');j['animations']=copy.deepcopy(animations)
  if repaired and outfit=='traveller':
   from build_independent_rigs import smooth
   accepted=json.loads((ROOT/'design/art/character-bind-review/punch-v03/character.json').read_text());source=accepted['animations']['punch']['attachments']['default']['near-arm']['near-arm']['deform'];delta=next(k['vertices'] for k in source if k['time']==.52)
   B={b['name']:b for b in j['bones']}
   for id,animation in j['animations'].items():
    shape=[];alpha=[]
    for t in manifest[id]['sampleTimes']:
     def rv(name):
      keys=animation['bones'].get(name,{}).get('rotate',[])
      return next((k.get('value',0) for k in reversed(keys) if k.get('time',0)<=t+1e-7),0)
     upper=B['near-upper-arm']['rotation']+rv('near-upper-arm')+rv('torso');elbow=B['near-lower-arm']['rotation']+rv('near-lower-arm')
     h=smooth(-75,-10,upper)*(1-smooth(25,90,abs(elbow)))
     shape.append({'time':t,'vertices':[round(v*h,8) for v in delta]});alpha.append({'time':t,'value':smooth(.3,.85,h)})
    animation['attachments']={'default':{slot:{attachment:{'deform':copy.deepcopy(shape)}} for slot,attachment in [('near-arm','near-arm'),('near-punch','near-punch'),('near-hand','near-hand-fist')]}}
    animation.setdefault('slots',{})['near-punch']={'alpha':alpha}
  (ART/'rig'/f'animations-{outfit}.json').write_text(json.dumps(j['animations'],separators=(',',':'))+'\n');(BUILD/outfit/'character.json').write_text(json.dumps(j,separators=(',',':'))+'\n')
 (ART/'rig/animations.json').write_text(json.dumps(animations,separators=(',',':'))+'\n')
 (ART/'compiled-clips.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print('COMPILED_CLIPS',len(animations),'CANONICAL',sum(z['kind']!='lifecycle'for z in manifest.values()))
if __name__=='__main__':main()
