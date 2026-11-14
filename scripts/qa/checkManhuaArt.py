from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('MANHUA_BASE','http://127.0.0.1:5300/');OUT=ROOT/os.getenv('MANHUA_OUT','.local-online/manga-style/screens');OUT.mkdir(exist_ok=True)
rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,p,errors=start(b);nav(p,'人物');initial=data(p)['character'];equipment=copy.deepcopy(initial['equipment'])
 for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
  for outfit in ['traveller','scholar','cloak']:
   for tone in ['ink','jade','cinnabar','sand']:
    a={'head':head,'outfit':outfit,'tone':tone};key=':'.join(a.values())
    assert p.evaluate("async a=>{const {useLifeStore}=await import('/src/store/lifeStore.ts');return useLifeStore.getState().setAppearance(a)}",a)
    p.wait_for_function("key=>{const e=document.querySelector('.ink-person-figure');return e?.dataset.artStyle==='manhua'&&e.dataset.renderedAppearance===key}",arg=key,polling=30)
    metrics=p.locator('.ink-person-figure').evaluate('''e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let n=0,edge=0,hash=2166136261;for(let y=0;y<e.height;y++)for(let x=0;x<e.width;x++)if(d[(y*e.width+x)*4+3]>32){n++;const i=(y*e.width+x)*4;hash=Math.imul(hash^d[i],16777619)>>>0;hash=Math.imul(hash^d[i+1],16777619)>>>0;hash=Math.imul(hash^d[i+2],16777619)>>>0;if(x<2||y<2||x>=e.width-2||y>=e.height-2)edge++}return {pixels:n,edge,hash}}''')
    assert metrics['pixels']>1000 and metrics['edge']==0,(key,metrics)
    if tone=='jade':p.screenshot(path=str(OUT/(head+'-'+outfit+'.png')))
    rows.append({'key':key,**metrics})
 assert len({row['hash'] for row in rows})==96,'造型或配色實畫重複'
 assert data(p)['character']['equipment']==equipment
 # 使用真衣櫥預覽／取消及真裝備比較，不代玩家換裝。
 tap(p,'造型');d=p.get_by_role('dialog',name='衣著與造型');d.get_by_role('tab',name='衣著',exact=True).click();d.get_by_role('button',name='江湖長衫',exact=True).click();p.wait_for_timeout(400);p.screenshot(path=str(OUT/'wardrobe.png'));p.keyboard.press('Escape')
 tap(p,'更換武器');p.wait_for_timeout(300);p.screenshot(path=str(OUT/'weapons.png'));p.keyboard.press('Escape');tap(p,'更換護甲');p.wait_for_timeout(300);p.screenshot(path=str(OUT/'armor.png'));p.keyboard.press('Escape');tap(p,'更換飾品');p.wait_for_timeout(300);p.screenshot(path=str(OUT/'accessories.png'));p.keyboard.press('Escape')
 assert data(p)['character']['equipment']==equipment
 c.close()
 for w,h in [[320,568],[430,932]]:
  c,p,err=start(b,w,h);nav(p,'人物');p.wait_for_function("document.querySelector('.ink-person-figure')?.dataset.artStyle==='manhua'")
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');p.screenshot(path=str(OUT/f'person-{w}.png'));assert not err,err;c.close()
 assert not errors,errors;b.close()
(OUT.parent/'browser.json').write_text(json.dumps({'cases':rows,'count':len(rows),'cloudBlocked':True,'equipmentUnchanged':True,'pageerrors':errors,'actualIphone':False},ensure_ascii=False,indent=2)+'\n')
print('MANHUA_BROWSER_PASS',len(rows),flush=True)
