"""第47項點按操作驗收：隔離存檔、封鎖雲端，只使用畫面可見的按鈕及分頁。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy,json,os,re
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/tap-navigation';OUT.mkdir(parents=True,exist_ok=True)
f=json.loads((ROOT/'.local-online/game-polish/fixtures.json').read_text())
BASE=os.getenv('TAP_BASE','http://127.0.0.1:5197/')
report={'productionBuild':True,'actualIphone':False,'cloudRequestsBlocked':True,'cases':[]}
VISIBLE='''e=>{let r=e.getBoundingClientRect();if(r.width<1||r.height<1||r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)return false;for(let p=e.parentElement;p;p=p.parentElement){let s=getComputedStyle(p);if(['hidden','clip','auto','scroll'].includes(s.overflowX)||['hidden','clip','auto','scroll'].includes(s.overflowY)){let b=p.getBoundingClientRect();if(r.left<b.left-1||r.right>b.right+1||r.top<b.top-1||r.bottom>b.bottom+1)return false}}return true}'''
def stable(page):page.wait_for_timeout(180)
def buttons(page,name,exact=True):return page.get_by_role('button',name=name,exact=exact).or_(page.get_by_role('tab',name=name,exact=exact))
def tap(page,name,exact=True):
 rewound=False
 for step in range(80):
  stable(page)
  candidates=buttons(page,name,exact)
  for i in range(candidates.count()):
   b=candidates.nth(i)
   if b.is_visible() and b.is_enabled() and b.evaluate(VISIBLE):
    rect=b.bounding_box();page.touchscreen.tap(rect['x']+rect['width']/2,rect['y']+rect['height']/2);stable(page);return
  dialogs=page.locator('dialog[open]')
  scope=dialogs.last if dialogs.count() else page
  if not rewound:
   prevs=scope.get_by_role('button',name=re.compile('上一頁$'))
   for _ in range(40):
    active=[b for b in prevs.all() if b.is_enabled() and b.evaluate(VISIBLE)]
    if not active:break
    active[-1].click();stable(page)
   rewound=True
   continue
  nexts=scope.get_by_role('button',name=re.compile('下一頁$'))
  moved=False
  for i in reversed(range(nexts.count())):
   b=nexts.nth(i)
   if b.is_enabled() and b.evaluate(VISIBLE):b.click();moved=True;break
  if not moved:
   page.screenshot(path='/tmp/tap-failed.png')
   print(candidates.evaluate_all('es=>es.map(e=>({text:e.innerText,rect:e.getBoundingClientRect().toJSON(),parents:[e.parentElement,e.parentElement.parentElement].map(p=>({cls:p.className,rect:p.getBoundingClientRect().toJSON()}))}))'),flush=True)
   raise AssertionError(f'No tap path to {name}: '+scope.locator('button').all_text_contents().__str__())
 raise AssertionError(f'Too many pages finding {name}')
def meta(page):return page.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
def ch(page):return page.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character')
def nav(page,name):
 if not page.get_by_role('navigation',name='分卷').count():
  for label in ['← 返回人物','返回修煉','‹ 返回江湖','‹ 返回江湖風雲','返回鎮居']:
   b=page.get_by_role('button',name=label,exact=True)
   if b.count() and b.first.is_visible():tap(page,label);break
 page.get_by_role('navigation',name='分卷').get_by_role('button',name=name,exact=True).click();stable(page)
def start(browser,w,h,state=None,video=False):
 c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce',**({'record_video_dir':str(ROOT/'.local-online/tap-navigation/video'),'record_video_size':{'width':390,'height':844}}if video else{}))
 for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
 value={'state':copy.deepcopy(state or f['state']),'meta':f['meta']}
 c.add_init_script('''(()=>{const f='''+json.dumps(value,ensure_ascii=False)+''';if(!localStorage.getItem('tap-qa')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('tap-qa','1');}})();''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);tap(page,re.compile('^續寫前緣'),False);page.wait_for_timeout(1000)
 if page.locator('.ink-offline-modal-btn').count():tap(page,'領受')
 return c,page,errors

def shot(page,name):stable(page);page.screenshot(path=str(OUT/name))
def geometry(page):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'), 'horizontal document overflow'
 assert page.locator('select,input[type="range"]').count()==0
 bad=page.locator('body *').evaluate_all('es=>es.filter(e=>{let r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&["auto","scroll"].includes(s.overflowY)&&e.scrollHeight>e.clientHeight+1}).map(e=>({cls:e.className,height:e.clientHeight,scroll:e.scrollHeight}))')
 assert not bad,bad
 for e in page.locator('.ink-play-body,.ink-tap-viewport').all():
  if e.is_visible():assert e.evaluate('e=>e.scrollHeight<=e.clientHeight+1'), e.get_attribute('class')+' vertical overflow'
def close(page,title):tap(page,'關閉'+title)
def each_page(page,label):
 # Every visible button stays inside the reader's vertical bounds; no drag or scroll call.
 pager=page.get_by_role('navigation',name=label+'分頁',exact=True)
 count=0
 while True:
  geometry(page);count+=1
  btn=pager.get_by_role('button',name=label+'下一頁',exact=True)
  assert btn.evaluate(VISIBLE)
  if not btn.is_enabled():return count
  btn.click();stable(page)
  assert count<50

with sync_playwright() as p:
 for engine in json.loads(os.getenv('TAP_ENGINES','["chromium","webkit"]')):
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
  for w,h in json.loads(os.getenv('TAP_SIZES','[[320,568],[390,844],[430,932]]')):
   print('CASE',engine,w,h,flush=True)
   record=engine=='chromium' and w==390
   c,page,errors=start(browser,w,h,video=record)
   nav(page,'人物');geometry(page)
   if record:shot(page,'02-after-person.png')
   tap(page,'人物誌卷');each_page(page,'人物誌');close(page,'人物誌')
   tap(page,'武學');geometry(page)
   before=ch(page);balance=meta(page)['jade'];pages=meta(page)['pages']
   tap(page,'選擇外功欄位2');each_page(page,'選擇外功');close(page,'選擇外功');assert ch(page)['skills']==before['skills']
   tap(page,'選擇外功欄位2');tap(page,'裝備柔絲手至外功欄位2');stable(page)
   assert ch(page)['volumes']['art_silk_hand']==[7] and ch(page)['equippedArts'][:2]==['art_river_fist','art_silk_hand']
   assert meta(page)['jade']==balance and meta(page)['pages']==pages
   # Returning from the picker restores the same column, then independent preset switch.
   tap(page,'對戰配搭');tap(page,'更換外功欄位1');tap(page,'裝備柔絲手至外功欄位1')
   assert ch(page)['combatLoadout']['external'][0]=='art_silk_hand' and ch(page)['equippedArts'][0]=='art_river_fist'
   tap(page,'普通配搭');tap(page,'收藏');tap(page,'查看鐵布衫');each_page(page,'鐵布衫');close(page,'鐵布衫')
   if record:shot(page,'04-after-library.png')
   nav(page,'修煉');geometry(page)
   if record:shot(page,'06-after-practice.png')
   tap(page,'武學修煉');each_page(page,'武學修煉');tap(page,'返回修煉');tap(page,'醫館與鑄器');each_page(page,'醫館與鑄器')
   nav(page,'人物');tap(page,'開啟設定');tap(page,'聲音');each_page(page,'設定內容')
   tap(page,'返回設定');tap(page,'聲音');tap(page,'降低音效音量')
   if record:shot(page,'07-after-audio.png')
   close(page,'設定')
   nav(page,'鎮居');page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();stable(page);geometry(page)
   if record:shot(page,'08-after-gacha.png')
   tap(page,'選擇抽卡流派');tap(page,'摧鋒破陣');geometry(page)
   tap(page,re.compile('^家族收藏'),False)
   tap(page,'武學收藏');tap(page,'查看長河拳');each_page(page,'長河拳');close(page,'長河拳')
   tap(page,'← 返回收藏');tap(page,'書頁兌換');tap(page,'選擇兌換武學');each_page(page,'選擇兌換武學');close(page,'選擇兌換武學')
   geometry(page)
   assert not errors,errors
   print('PASS',engine,w,h,flush=True)
   report['cases'].append({'engine':engine,'viewport':[w,h],'allTapPath':True,'cancelNoLearn':True,'singleVolumeSeven':True,'normalDuelSeparate':True,'noDebit':True,'noSelectWheelOrSlider':True,'noVerticalOverflow':True,'pageerrors':errors})
   video=page.video;c.close()
   if record and video:report['video']=video.path()
  browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
