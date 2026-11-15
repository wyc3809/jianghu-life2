# 第75項後開卷改青綠暖金漫畫晨景；其他共用淺色藝術檢查沿用第73項。
"""共用淺色藝術：正式構建三尺寸、開卷續寫、冊頁與夜間事件；隔離存檔。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
from PIL import Image,ImageStat
BASE=os.getenv('DAYLIGHT_BASE','http://127.0.0.1:5313/jianghu-life2/');OUT=ROOT/'.local-online/daylight-art/qa';OUT.mkdir(parents=True,exist_ok=True);rows=[]
def saved(p):
 c=data(p)['character'];meta=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))');return {k:copy.deepcopy(c.get(k)) for k in ['attributes','nature','equipment','combatLoadout','appearance','gear','skills','volumes']}|{k:copy.deepcopy(meta.get(k)) for k in ['jade','pages','manuals']}
def healthy(p):
 assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 assert not p.locator('img').evaluate_all('es=>es.some(e=>e.complete&&!e.naturalWidth&&e.getBoundingClientRect().width>1)')
 assert not re.search(r'\bNaN\b|undefined',p.locator('body').inner_text())
def shot(p,name):
 healthy(p);path=OUT/f'{name}.jpg';p.screenshot(path=str(path),type='jpeg',quality=93);return round(ImageStat.Stat(Image.open(path).convert('L')).mean[0],2)
def opening(p,w):
 p.get_by_role('button',name=re.compile('^續寫前緣')).wait_for();p.wait_for_function('document.querySelector(".ink-start-bg img")?.complete && document.querySelector(".ink-start-bg img")?.naturalWidth>0');assert not p.locator('.ink-start canvas,.ink-start-figure').count()
 assert p.locator('.ink-start-bg img').get_attribute('src').split('?')[0].endswith('theme/town-manhua.webp')
 assert not p.locator('.ink-start-seal').count();assert p.evaluate('getComputedStyle(document.documentElement).colorScheme')=='light'
 assert p.locator('.ink-start').evaluate('e=>e.scrollHeight<=e.clientHeight+1'),'opening overflow'
 for name in ['續寫前緣','開卷新篇']:
  r=p.get_by_role('button',name=re.compile('^'+name)).bounding_box();assert r['height']>=44 and r['y']+r['height']<=p.viewport_size['height'],r
 assert not p.locator('.ink-start-bg,.ink-start-keyart').evaluate_all('es=>es.some(e=>getComputedStyle(e).pointerEvents!=="none")')
 return shot(p,f'opening-{w}')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[320,568],[390,844],[430,932]]:
  c,p,errors=start(browser,w,h,record=w==390);before=saved(p);p.reload();p.wait_for_timeout(350);start_luma=opening(p,w);assert start_luma>190
  # 深色系統仍顯明亮宣紙；不改玩家偏好或存檔。
  p.emulate_media(color_scheme='dark');assert p.evaluate('getComputedStyle(document.documentElement).colorScheme')=='light';p.emulate_media(color_scheme='light')
  button=p.get_by_role('button',name=re.compile('^續寫前緣'))
  if w==390:
   p.emulate_media(reduced_motion='no-preference');button.evaluate('e=>{window.__entryClicks=0;e.addEventListener("click",()=>__entryClicks++)}');r=button.bounding_box();p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);p.mouse.down();p.wait_for_timeout(55);assert p.locator('canvas.ink-tap-fx').count()==1;assert button.evaluate('e=>Number(getComputedStyle(e).scale)<.96');p.mouse.up();p.wait_for_timeout(500);assert p.evaluate('__entryClicks')==1;p.emulate_media(reduced_motion='reduce')
  else:button.click();p.wait_for_timeout(500)
  if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
  p.wait_for_timeout(350);assert saved(p)==before;metrics={'opening':start_luma,'home':shot(p,f'home-{w}')}
  tap(p,'開啟設定');p.get_by_role('dialog',name='設定',exact=True).wait_for();p.keyboard.press('Escape')
  nav(p,'人物');p.wait_for_function('document.querySelector(".ink-person-figure")?.dataset.artStyle==="manhua"');assert 'daylight-landscape.webp' in p.locator('.ink-person-overview').evaluate('e=>getComputedStyle(e).backgroundImage');metrics['person']=shot(p,f'person-{w}');assert metrics['person']>195
  tap(p,'造型');p.get_by_role('dialog',name='衣著與造型',exact=True).wait_for();p.wait_for_timeout(200);metrics['wardrobe']=shot(p,f'wardrobe-{w}');p.get_by_role('tab',name='門派服',exact=True).click();p.keyboard.press('Escape');assert saved(p)==before
  tap(p,'武學');p.wait_for_timeout(250);metrics['martial']=shot(p,f'martial-{w}');tap(p,'返回人物')
  tap(p,'更多');tap(p,'人物誌');p.locator('.ink-stats-scroll').wait_for();p.wait_for_function('document.querySelector(".ink-stats-scroll canvas")?.dataset.artStyle==="manhua"');metrics['chronicle']=shot(p,f'chronicle-{w}');close=p.get_by_role('button',name='關閉',exact=True).bounding_box();portrait=p.locator('.ink-stats-scroll canvas').bounding_box();assert close['y']+close['height']<=portrait['y']+1;tap(p,'關閉');tap(p,'返回鎮居')
  nav(p,'修煉');p.wait_for_timeout(200);metrics['practice']=shot(p,f'practice-{w}')
  nav(p,'江湖');p.wait_for_timeout(200);metrics['map']=shot(p,f'map-{w}');assert p.locator('.ink-map-destination').count()==4
  tap(p,'秘笈閣');p.wait_for_timeout(250);metrics['codex']=shot(p,f'codex-{w}');tap(p,'卡池詳情');p.get_by_role('dialog',name='卡池詳情',exact=True).wait_for();p.keyboard.press('Escape');tap(p,'‹ 返回江湖');tap(p,'返回鎮居')
  assert saved(p)==before;assert not errors,errors
  rows.append({'viewport':[w,h],'openingAndRealContinue':True,'entryInkAndSingleNativeClick':w==390,'openingFitsAndButtons44px':True,'darkSystemLightPaper':True,'sharedPersonWardrobeMartialChroniclePracticeMapCodex':True,'nativeDialogsAndBack':True,'unchangedEquipmentAppearanceAttributesNatureAndCollection':True,'meanLuma255':metrics,'pageerrors':errors})
  video=p.video;c.close()
  if w==390 and video:(OUT/'video.txt').write_text(str(video.path()))
  print('DAYLIGHT_ART',w,flush=True)
 # 全新開卷：封面不設定／覆寫玩家造型，創角與取消保持原入口。
 for w,h in [[320,568],[390,844],[430,932]]:
  c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE);p.get_by_role('button',name='開卷',exact=True).wait_for();p.wait_for_function('document.querySelector(".ink-start-bg img")?.complete && document.querySelector(".ink-start-bg img")?.naturalWidth>0');assert not p.locator('.ink-start canvas,.ink-start-figure').count();assert not p.get_by_role('button',name=re.compile('^續寫前緣')).count();healthy(p)
  p.get_by_role('button',name='開卷',exact=True).click();p.get_by_role('textbox',name='姓名',exact=True).fill('林清風');p.wait_for_timeout(150);shot(p,f'create-{w}');assert not p.evaluate('localStorage.getItem("jianghu_life_v1_ls")');assert p.locator('canvas[data-appearance="bamboo:cloak:ink"]').count()>0;assert not errors;rows.append({'viewport':[w,h],'freshCreateDoesNotAdoptCoverAppearance':True,'nameInputAndNoPrematureSave':True,'pageerrors':errors});c.close()
 # 真夜雨事件仍保留語境／標記，但頁面不再使用舊黑底。
 night=copy.deepcopy(fixtures['full']);night['state']['pending']={'eventId':'ord_rain','year':night['state']['year'],'month':night['state']['month'],'kind':'ordinary'};fixtures['night']=night
 c,p,errors=start(browser,kind='night');p.wait_for_timeout(300);assert p.locator('.ink-scene--night').count()==1;assert p.locator('.ink-ai-wash--play').get_attribute('src').split('?')[0].endswith('daylight-landscape.webp');assert p.locator('.ink-backdrop-ai').get_attribute('src').split('?')[0].endswith('daylight-landscape.webp');assert p.locator('.scroll-shell').evaluate('e=>getComputedStyle(e).getPropertyValue("--paper").trim()')=='#fcf8f0';shot(p,'night-event');assert not errors;rows.append({'realNightEvent':'ord_rain','nightFlagPreserved':True,'sharedLightBackdropAndPaper':True,'pageerrors':errors});c.close();browser.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'cloudBlockedForFixtures':True,'actualIphoneTested':False},ensure_ascii=False,indent=2)+'\n');print('DAYLIGHT_ART_PASS',len(rows),flush=True)
