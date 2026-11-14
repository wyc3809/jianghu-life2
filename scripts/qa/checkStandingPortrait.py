from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0],'helpers','exec'))
import sys
BASE=os.getenv('STANDING_BASE','http://127.0.0.1:5300/')
OUT=ROOT/'production/qa/evidence/redesign/standing-portrait-review';OUT.mkdir(parents=True,exist_ok=True)
mode=sys.argv[1] if len(sys.argv)>1 else 'after'
rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in ([[390,844]] if mode=='before' else [[320,568],[390,844],[430,932]]):
  c,p,errors=start(b,w,h);nav(p,'人物')
  figure=p.locator('.ink-person-seated-hero,.ink-person-figure')
  p.wait_for_function("()=>{const e=document.querySelector('.ink-person-seated-hero,.ink-person-figure');return e&&e.width>1&&e.height>1&&e.getContext('2d').getImageData(0,0,e.width,e.height).data.some((v,i)=>i%4===3&&v>100)}")
  p.wait_for_timeout(150)
  p.screenshot(path=str(OUT/f'{mode}-person-{w}.png'))
  metrics=figure.evaluate('''e=>{const c=e.getContext('2d'),d=c.getImageData(0,0,e.width,e.height).data;let l=e.width,t=e.height,r=-1,b=-1;for(let y=0;y<e.height;y++)for(let x=0;x<e.width;x++)if(d[(y*e.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return {label:e.getAttribute('aria-label'),appearance:e.dataset.appearance,canvas:[e.width,e.height],opaqueBounds:[l,t,r,b],unclipped:l>1&&t>1&&r<e.width-2&&b<e.height-2}}''')
  before=data(p)['character'];equipment=copy.deepcopy(before['equipment']);appearance=copy.deepcopy(before['appearance'])
  tap(p,'更換武器');p.screenshot(path=str(OUT/f'{mode}-equipment-{w}.png'));p.keyboard.press('Escape')
  assert data(p)['character']['equipment']==equipment and data(p)['character']['appearance']==appearance
  tap(p,'造型');p.get_by_role('dialog',name='衣著與造型').wait_for();p.screenshot(path=str(OUT/f'{mode}-wardrobe-{w}.png'));p.keyboard.press('Escape')
  assert data(p)['character']['appearance']==appearance
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  if mode!='before':
   assert metrics['unclipped'],metrics
   assert metrics['label']=='自然站姿的人物造型',metrics
   if w==390:
    tap(p,'返回鎮居');p.emulate_media(reduced_motion='no-preference');p.wait_for_timeout(700)
    for i in range(6):
     p.locator('.ink-home-scene').screenshot(path=str(OUT/f'home-motion-{i:02d}.png'));p.wait_for_timeout(150)
  assert not errors,errors
  rows.append({'viewport':[w,h],**metrics,'previewCancelKeptEquipmentAndAppearance':True,'pageerrors':errors})
  c.close()
 b.close()
(OUT/f'{mode}.json').write_text(json.dumps({'scope':'silver:traveller:jade only','actualIphone':False,'cloudBlocked':True,'cases':rows},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(rows,ensure_ascii=False),flush=True)
