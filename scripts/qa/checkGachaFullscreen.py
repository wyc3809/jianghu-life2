"""正式mobile構建秘笈閣獨立頁；安全區只替換CSS env輸入，無排版覆寫。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import copy, json, os, re
ROOT=Path(__file__).resolve().parents[2]
BASE=os.getenv('GACHA_FULL_BASE','http://127.0.0.1:5176/')
LABEL=os.getenv('GACHA_FULL_LABEL','after')
ENGINES=json.loads(os.getenv('GACHA_FULL_ENGINES','["chromium","webkit"]'))
SIZES=json.loads(os.getenv('GACHA_FULL_SIZES','[[320,568,20,0],[375,667,20,0],[390,844,47,34],[393,852,59,34],[430,932,59,34],[768,1024,24,20]]'))
OUT=ROOT/'production/qa/evidence/redesign/gacha-fullscreen'/LABEL;OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads((ROOT/'.local-online/gacha-fullscreen/fixture.json').read_text())
report={'base':BASE,'productionBuild':True,'actualIOS':False,'cssSafeAreaInputsOnly':True,'cases':[]}

def account(page):
 return page.evaluate('''()=>{const m=JSON.parse(localStorage.getItem('jianghu_ancestry_v1'));return {jade:m.jade,gacha:m.gacha,manuals:m.manuals,pages:m.pages??0};}''')

def visible_control(locator, top, bottom, height):
 return locator.evaluate('''(e,args)=>{const [top,bottom,height]=args,r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
 return {text:e.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,safe:r.y>=top-1&&r.bottom<=height-bottom+1,hit:!!hit&&e.contains(hit)};}''',[top,bottom,height])

with sync_playwright() as p:
 for engine in ENGINES:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']) if engine=='chromium' else p.webkit.launch(executable_path=os.getenv('GACHA_WEBKIT_EXECUTABLE'))
  for native in [True,False]:
   for width,height,top,bottom in (SIZES if native else [(390,844,0,0)]):
    context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce')
    context.route('**/*.supabase.co/**',lambda r:r.abort())
    context.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    context.route('**/fonts.gstatic.com/**',lambda r:r.abort())
    def css(route):
     response=route.fetch();body=response.text()
     for edge,value in [('top',top),('bottom',bottom),('left',0),('right',0)]:body=re.sub(r'env\(safe-area-inset-'+edge+r'(?:,\s*[^)]+)?\)',f'{value}px',body)
     route.fulfill(response=response,body=body)
    context.route('**/*.css',css)
    context.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';if(!localStorage.getItem('gacha-full-fixture')){
      localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));
      localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));
      localStorage.setItem('gacha-full-fixture','1');}})();''')
    if native:context.add_init_script('window.webkit={messageHandlers:{bridge:{postMessage(){}}}}')
    page=context.new_page();errors=[];bad=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda response:bad.append(response.status) if response.status>=400 and response.url.startswith(BASE) else None)
    page.goto(BASE,wait_until='domcontentloaded')
    page.get_by_role('button',name=re.compile('^續寫前緣')).click()
    page.locator('.ink-quick').wait_for()
    if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
    page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click()
    page.locator('#ink-gacha').wait_for();page.evaluate('document.fonts.ready');page.wait_for_timeout(500)
    tag=f'{engine}-{"native" if native else "web"}-{width}-{height}'
    data={'tag':tag,'errors':errors,'httpErrors':bad}
    page.screenshot(path=str(OUT/f'{tag}.png'))
    if LABEL=='before':
     data['hudVisible']=page.locator('.ink-hud').count()>0;data['dockVisible']=page.locator('.ink-bottom-dock').count()>0
    else:
     assert page.locator('.ink-hud,.ink-bottom-dock,.ink-task-dock').count()==0,tag
     assert page.get_by_text('按下方圓鈕即可過一月。',exact=True).count()==0
     data['layout']=page.evaluate('''()=>{const box=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};};return {shell:box('.scroll-shell'),body:box('.ink-play-body'),panel:box('#ink-gacha'),draw:box('.ink-codex-draw'),theatre:box('.ink-codex-theatre')};}''')
     for name in ['shell','body','panel']:
      r=data['layout'][name];assert r['scrollWidth']<=r['clientWidth']+1 and r['scrollHeight']<=r['clientHeight']+1,(tag,name,r)
     assert data['layout']['panel']['bottom']<=height-bottom+1,data
     controls=[]
     for selector in ['.ink-codex-back','.ink-codex-wallet > button','.ink-codex-wish','.ink-codex-pulls > button:first-child','.ink-codex-pulls > button:last-child']:
      loc=page.locator(selector)
      if height<667:loc.scroll_into_view_if_needed()
      c=visible_control(loc,top,bottom,height);assert c['safe'] and c['hit'] and c['height']>=44,(tag,selector,c);controls.append(c)
     data['controls']=controls
     # 次級入口及收藏始終保留；不經抽取，帳戶不變。
     initial=account(page)
     page.get_by_role('button',name='卡池詳情',exact=True).click();page.get_by_role('dialog',name='卡池詳情').wait_for();page.get_by_role('button',name='關閉卡池詳情').click()
     page.get_by_role('button',name=re.compile('^家族收藏')).click();page.locator('.ink-codex-shelf').wait_for()
     page.get_by_role('button',name='← 返回抽取').click()
     page.get_by_role('tab',name='珍本奇功').click();page.get_by_role('tab',name='江湖秘笈').click()
     page.get_by_role('button',name='選擇抽卡流派').click();assert page.get_by_role('dialog',name='六派藏卷').is_visible();page.get_by_role('button',name='關閉六派藏卷').click()
     page.locator('.ink-codex-back').click();page.locator('.ink-jianghu-map').wait_for()
     assert page.locator('.ink-hud,.ink-bottom-dock').count()==0
     page.get_by_role('button',name='秘笈閣',exact=True).click();page.locator('.ink-codex-draw').wait_for()
     assert account(page)==initial,(tag,'navigation changed account')
     if os.getenv('GACHA_FULL_FUNCTIONAL')=='1' and native and width==393:
      page.get_by_role('button',name=re.compile('^抽一次')).click()
      stage=page.locator('[data-subject="codex"]');stage.wait_for(timeout=60000)
      if stage.get_attribute('data-phase')!='settle':
       skip=stage.get_by_role('button',name='跳過 ›',exact=True)
       if skip.count():skip.click()
      page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=60000)
      single=account(page)
      assert single['jade']=={'free':540,'paidTest':600} and single['gacha']['pulls']==1,single
      assert single['gacha']['banners']['jianghu']['sinceWish']==0,single
      assert 'art_tiger_breath' in single['manuals'],single
      page.screenshot(path=str(OUT/f'{engine}-single.png'))
      equip=stage.get_by_role('button',name=re.compile('^馬上裝備：'))
      art_name=equip.get_attribute('aria-label').split('：',1)[1]
      equip.click()
      page.get_by_role('region',name='武學裝備').wait_for()
      assert page.locator('.ink-hud,.ink-bottom-dock').count()==2
      assert art_name in page.locator('.ink-loadout-selection').inner_text()
      # 導向人物後，玩家仍須明確指定內功欄位，沒有即抽即換。
      assert page.get_by_role('button',name=f'替換{art_name}至內功欄位',exact=True).count()==1
      assert '基礎吐納' in page.locator('.ink-loadout-support').inner_text()
      assert account(page)==single
      page.screenshot(path=str(OUT/f'{engine}-equip-handoff.png'))
      page.get_by_role('navigation',name='分卷').get_by_role('button',name='江湖',exact=True).click()
      page.get_by_role('button',name='秘笈閣',exact=True).click()
      page.get_by_role('button',name=re.compile('^抽十次')).click()
      stage=page.locator('[data-subject="codex"]');stage.wait_for(timeout=60000)
      if stage.get_attribute('data-phase')!='settle':
       skip=stage.get_by_role('button',name='跳過 ›',exact=True)
       if skip.count():skip.click()
      page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=60000)
      assert stage.locator('[data-card]').count()==10
      ten=account(page)
      assert ten['jade']=={'free':0,'paidTest':540} and ten['gacha']['pulls']==11,ten
      page.screenshot(path=str(OUT/f'{engine}-ten.png'))
      stage.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).click()
      assert page.locator('.ink-hud,.ink-bottom-dock').count()==0
      page.locator('.ink-codex-last').click()
      assert page.get_by_role('dialog',name='上次入藏').locator('.ink-pull-card').count()==10
      page.get_by_role('button',name='關閉上次入藏').click()
      assert account(page)==ten
      data['functional']={'singleCost60':True,'wishHitAndReset':True,'equipHandoffExplicitSlot':True,'tenCost600':True,'tenResults':10,'noRepeatDebitOnClose':True}
     page.locator('.ink-codex-back').click();page.get_by_role('button',name='返回鎮居').click();page.locator('.ink-quick').wait_for()
     assert page.locator('.ink-hud,.ink-bottom-dock').count()==2
     data['navigationAndAccountUnchanged']=True
    assert not errors and not bad,(tag,errors,bad)
    report['cases'].append(data);context.unroute_all(behavior='wait');context.close()
    print('PASS',tag,flush=True)
  browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
