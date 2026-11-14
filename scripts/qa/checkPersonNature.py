"""人物頁：只顯最高心性小印、下方排列、長姓名及預覽資料保持。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
BASE=os.getenv('PERSON_NATURE_BASE','http://127.0.0.1:5311/');OUT=ROOT/'.local-online/person-nature/qa';OUT.mkdir(parents=True,exist_ok=True);rows=[]
def saved(p):
 c=data(p)['character'];meta=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(c.get(k)) for k in ['attributes','nature','equipment','combatLoadout','appearance','gear','skills','volumes']}|{k:copy.deepcopy(meta.get(k)) for k in ['jade','pages','manuals']}
def bounds(loc):return loc.bounding_box()
def layout(p):
 name=p.locator('.ink-person-name h3');mark=p.get_by_role('img',name=re.compile('^心性：'));r=bounds(name);name_rect=r;m=bounds(mark);footer=bounds(p.locator('.ink-person-footer'));stage=bounds(p.locator('.ink-person-stage'))
 assert m['x']>=r['x']+r['width']-1 and abs(m['y']+m['height']/2-r['y']-r['height']/2)<2,(r,m)
 assert stage['y']+stage['height']<=footer['y']+1
 assert not p.locator('.ink-person-attributes,.ink-attr-grid').count()
 assert not re.search('根骨|悟性|福緣|魅力|膽識',p.locator('.ink-person-overview').inner_text())
 assert p.locator('.ink-person-footer [role="tab"]').count()==2
 for button in p.locator('.ink-person-footer button').all():
  b=bounds(button);assert b['height']>=44 and b['y']+b['height']<=p.viewport_size['height']+1,b
 for b in p.locator('.ink-person-gear-slot').all():
  r=bounds(b);assert r['y']>=stage['y']-1 and r['y']+r['height']<=footer['y']+1,r
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert not p.locator('img').evaluate_all('es=>es.some(e=>e.complete&&!e.naturalWidth&&e.getBoundingClientRect().width>1)')
 return {'name':name_rect,'mark':m,'stage':stage,'footer':footer}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(browser,w,h,record=w==390);
  if w==390:p.emulate_media(reduced_motion='no-preference')
  nav(p,'人物');p.wait_for_timeout(650);before=saved(p);geometry=layout(p)
  assert p.get_by_role('img',name='心性：俠',exact=True).count()==1
  p.screenshot(path=str(OUT/f'person-{w}.jpg'),type='jpeg',quality=94)
  p.get_by_role('tab',name='對戰配搭',exact=True).click();assert p.get_by_role('tab',name='對戰配搭',exact=True).get_attribute('aria-selected')=='true';assert p.get_by_role('img',name='心性：俠',exact=True).count()==1
  p.get_by_role('tab',name='普通配搭',exact=True).click();p.wait_for_timeout(100)
  tap(p,'更換武器');d=p.get_by_role('dialog',name='更換武器',exact=True);d.wait_for();d.locator('[data-gear-id="iron-blade"]').click();assert saved(p)==before;p.keyboard.press('Escape')
  tap(p,'造型');p.get_by_role('dialog',name='衣著與造型',exact=True).wait_for();p.get_by_role('tab',name='門派服',exact=True).click();p.keyboard.press('Escape');assert saved(p)==before
  tap(p,'更多');tap(p,'身世與身法');assert '身世與身法' in p.locator('.ink-person-detail-body').inner_text();assert not p.locator('.ink-attr-grid').count();tap(p,'← 返回人物');layout(p)
  tap(p,'更多');tap(p,'人物誌');p.wait_for_timeout(400);text=p.locator('body').inner_text();assert not re.search('根骨|悟性|福緣|魅力|膽識|心性四象',text);assert not p.locator('[aria-label^="心性四象"]').count();tap(p,'關閉');assert saved(p)==before
  # 真鍵盤選取不受新footer排列影響，仍保留墨跡按壓。
  p.emulate_media(reduced_motion='no-preference');normal=p.get_by_role('tab',name='普通配搭',exact=True);normal.focus();p.keyboard.down('Space');p.wait_for_timeout(45);assert p.locator('canvas.ink-tap-fx').count()==1;p.keyboard.up('Space');p.wait_for_timeout(650);assert not p.locator('canvas.ink-tap-fx').count()
  assert not errors,errors;assert saved(p)==before
  rows.append({'viewport':[w,h],'onlyHighestBesideName':True,'removedFiveStatsAndNatureTable':True,'footerAndGearWithinScreen':True,'presetsPreviewAndDetails':True,'keyboardAndInk':True,'unchangedGameData':True,'geometry':geometry,'pageerrors':errors})
  video=p.video;c.close()
  if w==390 and video:(OUT/'video.txt').write_text(str(video.path()))
  print('PERSON_NATURE',w,flush=True)
 colors=[]
 for key,label in [('xia','俠'),('xie','邪'),('kuang','狂'),('e','惡')]:
  variant=copy.deepcopy(fixtures['full']);variant['state']['character']['nature']={'xia':12,'xie':8,'kuang':10,'e':6,key:78};fixtures['nature']=variant
  c,p,errors=start(browser,kind='nature');nav(p,'人物');p.wait_for_timeout(400);assert p.get_by_role('img',name=f'心性：{label}',exact=True).count()==1;mark=p.locator('.ink-person-nature');colors.append(mark.evaluate('e=>getComputedStyle(e).color'));assert mark.locator('img').get_attribute('src').split('?')[0].endswith(f'nature-{key}.webp');layout(p);p.screenshot(path=str(OUT/f'nature-{key}.jpg'),type='jpeg',quality=93);assert not errors;rows.append({'nature':key,'highest':78,'label':label,'color':colors[-1],'passed':True});c.close()
 assert len(set(colors))==4
 # 長姓名與同分最高，不撐破或推走下方操作。
 variant=copy.deepcopy(fixtures['full']);variant['state']['character']['name']='獨孤長風踏雪尋梅';variant['state']['character']['nature']={'xia':0,'xie':40,'kuang':40,'e':40};fixtures['long']=variant
 for w,h in [[320,568],[320,844],[390,844]]:
  c,p,errors=start(browser,w,h,kind='long');nav(p,'人物');p.wait_for_timeout(350);layout(p);assert p.get_by_role('img',name='心性：邪',exact=True).count()==1;p.screenshot(path=str(OUT/f'long-{w}.jpg'),type='jpeg',quality=93);assert not errors;rows.append({'viewport':[w,h],'longNameAndStableTie':True,'passed':True});c.close()
 browser.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'cloudBlocked':True,'actualIphoneTested':False},ensure_ascii=False,indent=2)+'\n');print('PERSON_NATURE_PASS',len(rows),flush=True)
