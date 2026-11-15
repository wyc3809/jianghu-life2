"""第75項青綠暖金漫畫晨景：無首頁人物、開卷／續寫、短屏及墨跡；隔離存檔。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
BASE=os.getenv('TOWN_OPENING_BASE','http://127.0.0.1:5315/jianghu-life2/');OUT=ROOT/os.getenv('TOWN_OPENING_OUT','.local-online/town-manhua/qa');OUT.mkdir(parents=True,exist_ok=True);rows=[]
def saved(p):
 c=data(p)['character'];m=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(c.get(k)) for k in ['attributes','nature','equipment','combatLoadout','appearance','gear','skills','volumes']}|{k:copy.deepcopy(m.get(k)) for k in ['jade','pages','manuals']}
def opening(p,w,h):
 p.wait_for_function('document.querySelector(".ink-start-bg img")?.complete&&document.querySelector(".ink-start-bg img")?.naturalWidth===852')
 assert not p.locator('.ink-start canvas,.ink-start-figure,.ink-start .ink-appearance-canvas').count(),'homepage character returned'
 assert p.locator('.ink-start img').count()==1
 assert p.locator('.ink-start-bg img').get_attribute('src').split('?')[0].endswith('town-manhua.webp')
 assert p.locator('.ink-verse').inner_text()=='少年起於千燈鎮'
 assert p.locator('.ink-start-bg img').evaluate('e=>getComputedStyle(e).objectFit')=='cover'
 assert p.locator('.ink-start').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert p.evaluate('getComputedStyle(document.documentElement).colorScheme')=='light'
 for b in p.locator('.ink-start .ink-cta-stack button').all():
  r=b.bounding_box();assert r['height']>=44 and r['y']>=0 and r['y']+r['height']<=h+1,r
 assert p.locator('.ink-start-bg').evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
 return p.locator('.ink-hero').bounding_box()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(browser,w,h,record=w==390);before=saved(p);p.reload();p.get_by_role('button',name=re.compile('^續寫前緣')).wait_for();p.wait_for_timeout(300);geometry=opening(p,w,h);p.screenshot(path=str(OUT/f'opening-{w}.jpg'),type='jpeg',quality=94)
  p.emulate_media(color_scheme='dark');opening(p,w,h);p.emulate_media(color_scheme='light')
  # 鍵盤焦點及真指針保持原輸入；390記錄按下墨跡，不重發click。
  button=p.get_by_role('button',name=re.compile('^續寫前緣'));button.focus();assert button.evaluate('e=>e===document.activeElement');button.evaluate('e=>{window.__townClicks=0;e.addEventListener("click",()=>__townClicks++)}')
  if w==390:
   p.emulate_media(reduced_motion='no-preference');r=button.bounding_box();p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);p.mouse.down();p.wait_for_timeout(55);assert p.locator('canvas.ink-tap-fx').count()==1;assert button.evaluate('e=>Number(getComputedStyle(e).scale)<.96');p.mouse.up()
  else:p.keyboard.press('Enter')
  p.wait_for_timeout(450);assert p.evaluate('__townClicks')==1
  if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
  assert saved(p)==before;nav(p,'人物');p.wait_for_function('document.querySelector(".ink-person-figure")?.dataset.artStyle==="manhua"');assert 'daylight-landscape.webp' in p.locator('.ink-person-overview').evaluate('e=>getComputedStyle(e).backgroundImage');p.screenshot(path=str(OUT/f'person-{w}.jpg'),type='jpeg',quality=92);assert saved(p)==before
  assert not errors,errors;rows.append({'viewport':[w,h],'noHomepageFigureOrCanvas':True,'selectedTownAssetAndCaption':True,'buttons44pxWithinScreen':True,'keyboardOrPointerNativeClickExactlyOne':True,'entryInkAndPress':w==390,'darkSystemStillLight':True,'realContinueAndUnchangedGameData':True,'personPageIllustrationAndBackgroundKept':True,'headerBounds':geometry,'pageerrors':errors});video=p.video;c.close()
  if w==390 and video:(OUT/'video.txt').write_text(str(video.path()))
  print('TOWN_OPENING',w,flush=True)
 # 新開卷只出一個主操作；封面不改創角預設，不提早寫入人物進度。
 for w,h in [[320,568],[390,844],[430,932]]:
  c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');c.add_init_script("const nativeFetch=window.fetch.bind(window);window.fetch=(i,o)=>String(i?.url??i).includes('.supabase.co')?Promise.resolve(new Response('{}',{status:503})):nativeFetch(i,o)");p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE);p.get_by_role('button',name='開卷',exact=True).wait_for();opening(p,w,h);assert p.locator('.ink-start .ink-cta-stack button').count()==1;p.screenshot(path=str(OUT/f'fresh-{w}.jpg'),type='jpeg',quality=92);p.get_by_role('button',name='開卷',exact=True).click();p.get_by_role('textbox',name='姓名',exact=True).fill('林清風');assert p.locator('canvas[data-appearance="bamboo:cloak:ink"]').count()>0;assert not p.evaluate('localStorage.getItem("jianghu_life_v1_ls")');assert not errors;rows.append({'viewport':[w,h],'freshOnePrimaryAndActualCreate':True,'defaultAppearanceAndNoPrematureSave':True,'pageerrors':errors});c.close()
 # 本世已結束的長提示仍可顯示，短屏主／次鍵不出界。
 f=copy.deepcopy(fixtures['full']);f['state']['phase']='summary';f['state']['character']['alive']=False;fixtures['summary']=f
 c=browser.new_context(viewport={'width':320,'height':568},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');c.add_init_script("const nativeFetch=window.fetch.bind(window);window.fetch=(i,o)=>String(i?.url??i).includes('.supabase.co')?Promise.resolve(new Response('{}',{status:503})):nativeFetch(i,o)");c.add_init_script('localStorage.setItem("jianghu_life_v1_ls",JSON.stringify('+json.dumps({'version':1,'savedAt':0,'state':f['state']},ensure_ascii=False)+'))');p=c.new_page();p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).wait_for();opening(p,320,568);p.screenshot(path=str(OUT/'summary-320.jpg'),type='jpeg',quality=92);rows.append({'summaryLongHintOnShortScreen':True,'passed':True});c.close();browser.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'cloudBlockedForFixtureAndFreshContexts':True,'actualIphoneTested':False},ensure_ascii=False,indent=2)+'\n');print('TOWN_OPENING_PASS',len(rows),flush=True)
