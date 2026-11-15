"""Explicit offline UI check; ancestral archive preserved; no backend accounts or writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,copy,os,re
ROOT=Path.cwd();OUT=ROOT/'.local-online/legacy-paused';OUT.mkdir(exist_ok=True)
BASE=os.getenv('LEGACY_QA_BASE','http://127.0.0.1:5315/jianghu-life2/');before=os.getenv('LEGACY_QA_BEFORE')=='1';label='before' if before else 'after'
fixture=json.loads((ROOT/'design/art/manhua/fixtures.json').read_text())['full']
s=copy.deepcopy(fixture['state']);s['character']['flags']['newbie_done']=True;s['pending']=None;s['tab']='home';meta=copy.deepcopy(fixture['meta']);meta['points']=37;meta['talents']['genGu']=2;meta['unlockedArts']=['art_river_fist'];meta['artsSeen']=['art_river_fist'];meta['familyArts']=['art_river_fist']
def seed(state):return "localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now()+100000,state:"+json.dumps(state,ensure_ascii=False)+"}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify("+json.dumps(meta,ensure_ascii=False)+"));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()+100000));"
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce',**({} if before else {'record_video_dir':str(OUT/'videos'),'record_video_size':{'width':390,'height':844}}));c.add_init_script(seed(s));c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{}'));p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE);p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(500)
 if p.get_by_role('button',name='領受',exact=True).count():p.get_by_role('button',name='領受',exact=True).click()
 p.get_by_role('navigation',name='分卷').get_by_role('button',name='人物',exact=True).click();p.get_by_role('button',name='更多',exact=True).click();p.get_by_role('navigation',name='人物更多功能').wait_for();p.screenshot(path=str(OUT/f'{label}-menu.jpg'),type='jpeg',quality=94)
 if not before:assert not p.get_by_role('button',name=re.compile('族譜|傳承|天賦|祖祠')).count()
 p.get_by_role('button',name='境界與傳承' if before else '境界修行',exact=True).click();p.get_by_role('button',name='← 返回人物',exact=True).wait_for()
 for w,h in [(390,844),(320,568),(430,932)]:
  p.set_viewport_size({'width':w,'height':h});p.screenshot(path=str(OUT/f'{label}-cultivation-{w}.jpg'),type='jpeg',quality=94)
  if not before:assert not p.get_by_text('歸隱傳位',exact=True).count();assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
 p.set_viewport_size({'width':390,'height':844});p.get_by_role('button',name='← 返回人物',exact=True).click();p.get_by_role('button',name='更多',exact=True).click();p.get_by_role('button',name='人際',exact=True).click();p.screenshot(path=str(OUT/f'{label}-people.jpg'),type='jpeg',quality=94)
 if not before:
  assert not re.search('家族銀庫|裝備庫|繼承人|嗣「',p.locator('body').inner_text())
  stored=p.evaluate('JSON.parse(localStorage.getItem("jianghu_ancestry_v1"))')
  for k in ['points','talents','familyArts','unlockedArts','artsSeen']:assert stored[k]==meta[k],k
  saved=p.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character')
  for k in ['attributes','equipment','appearance','skills']:assert saved[k]==s['character'][k],k
 # A historical summary must stop promising inheritance, while original text remains in storage.
 summary=copy.deepcopy(s);summary['phase']='summary';summary['character']['alive']=False;summary['summaryText']='【家族銀庫】99,999兩全數傳後人。';summary['character']['money']=99999
 qctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);qctx.add_init_script(seed(summary));qctx.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{}'));q=qctx.new_page();q.goto(BASE);q.get_by_role('button',name=re.compile('^續寫前緣')).click();q.locator('.ink-epitaph-text').wait_for();q.screenshot(path=str(OUT/f'{label}-summary.jpg'),type='jpeg',quality=94)
 if not before:
  assert not re.search('家族銀庫|可傳後世|繼承人|族譜',q.locator('.ink-epitaph-text').inner_text());q.get_by_role('button',name='另起新生 · 再入江湖',exact=True).wait_for();assert not errors,errors
 (OUT/f'{label}-result.json').write_text(json.dumps({'explicitOffline':True,'viewports':[[320,568],[390,844],[430,932]],'archiveAndCurrentStatsKept':not before,'pageerrors':errors},indent=2)+'\n');qctx.close();c.close();b.close();print('LEGACY_UI_PASS',label)
