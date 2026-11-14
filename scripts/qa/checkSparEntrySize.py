"""黑影出場大小：對照同一真呈現器的舊／新行路、待機及實際演武短片。"""
from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
import subprocess
beforeSource=ROOT/'src/spar/.qa-engine-before.ts'
beforeSource.write_bytes(subprocess.check_output(['git','show','a561b726338a5c8d637152bd992c739beab65164:src/spar/engine.ts'],cwd=ROOT))
exclude=ROOT/'.git/info/exclude'
if '/src/spar/.qa-engine-before.ts' not in exclude.read_text():
 exclude.write_text(exclude.read_text()+'\n/src/spar/.qa-engine-before.ts\n')
BASE='http://127.0.0.1:5300/'
OUT=ROOT/'.local-online/spar-entry-size';OUT.mkdir(exist_ok=True);seed=copy.deepcopy(fixtures['full']);rows=[]
PROBE=r'''async old=>{const mod=await import(old?'/src/spar/.qa-engine-before.ts':'/src/spar/engine.ts');const live=window.__sparStage,cv=document.createElement('canvas');const images={...live.images,weapon:null};const actor=new mod.SparStage({canvas:cv,images});actor.resize(live.cssW,live.cssH,1);actor.heroX=live.cssW*.45;actor.idleT=0;actor.heroHitT=9;actor.heroDownT=null;actor.attackT=null;const ctx=cv.getContext('2d');const result=[];for(const gait of [null,0,.25,.5,.75]){ctx.clearRect(0,0,cv.width,cv.height);actor.heroMoving=gait!==null;actor.walkT=gait??0;actor.drawWarrior(actor.geom());const pixels=ctx.getImageData(0,0,cv.width,cv.height).data;let l=cv.width,t=cv.height,r=0,b=0,n=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(pixels[(y*cv.width+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);n++}result.push({pose:gait===null?'idle':`walk-${Math.round(gait*4)}`,bounds:[l,t,r,b],height:b-t,pixels:n,image:cv.toDataURL('image/png')})}return {width:live.cssW,height:live.cssH,poses:result}}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  fixtures['full']=copy.deepcopy(seed);fixtures['full']['state']['moments']=[];fixtures['full']['state']['pendingGearCompare']=None
  context,page,errors=start(browser,w,h);page.emulate_media(reduced_motion='no-preference');page.wait_for_function('Boolean(window.__sparStage)',timeout=30000)
  before=page.evaluate(PROBE,True);after=page.evaluate(PROBE,False);idle=after['poses'][0]['height']
  assert before['poses'][0]['height']==idle
  assert max(p['height'] for p in before['poses'][1:])>idle*1.15
  assert all(abs(p['height']-idle)<=2 for p in after['poses'][1:]),(w,idle,[p['height'] for p in after['poses']])
  assert max(p['bounds'][3] for p in after['poses'])-min(p['bounds'][3] for p in after['poses'])<=1
  if w==390:
   import base64
   for label,probe in [('before',before),('after',after)]:
    for pose in probe['poses']:(OUT/f"{label}-{pose['pose']}.png").write_bytes(base64.b64decode(pose['image'].split(',')[1]))
   page.wait_for_function('window.__sparStage.heroMoving&&!window.__sparStage.heroAttackActive',timeout=15000);page.screenshot(path=str(OUT/'entry-390.jpg'),type='jpeg',quality=93)
   frames=OUT/'frames';frames.mkdir(exist_ok=True)
   for i in range(24):page.locator('.ink-home-scene').screenshot(path=str(frames/f'{i:02}.png'));page.wait_for_timeout(180)
   page.screenshot(path=str(OUT/'spar-390.jpg'),type='jpeg',quality=93)
  rows.append({'viewport':[w,h],'before':{**before,'poses':[{k:v for k,v in p.items() if k!='image'} for p in before['poses']]},'after':{**after,'poses':[{k:v for k,v in p.items() if k!='image'} for p in after['poses']]},'sourceSameAsCombat':True,'noEntryScaleJump':True,'sameFootAnchor':True,'pageerrors':errors});assert not errors,errors;context.close();print('SPAR_ENTRY_SIZE',w,[p['height'] for p in before['poses']],[p['height'] for p in after['poses']],flush=True)
 browser.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'cloudBlocked':True,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('SPAR_ENTRY_SIZE_PASS',len(rows),flush=True)
