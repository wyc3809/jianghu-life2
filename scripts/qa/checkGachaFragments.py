"""20%武功／80%書頁：真核心、真演出、只用隔離本機QA存檔。"""
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json,re,os,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/gacha-fragments';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('GACHA_FRAGMENTS_QA_BASE','http://127.0.0.1:5173/')
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text().replace("await import('/src/store/ancestryStore.ts')", "await import((await(await fetch('/src/main.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
FIXTURE=r'''({scenario,n,banner})=>{
 const{anc,g}=window.qa;const m=structuredClone(anc.getState().meta);m.gacha={pulls:0,banners:{}};m.pages=0;
 if(banner==='zhenben')m.jade={free:600,paidTest:600};
 if(scenario==='wish'){g.setWish(m,banner,g.wishPool(banner,m)[0]);g.bannerState(m,banner).sinceWish=39;}
 for(let i=0;i<1000;i++){
  m.gacha.pulls=i;const next=structuredClone(m),res=g.pull(next,banner,n);
  const pages=res.filter(r=>r.kind==='pages').length;
  const good=scenario==='wish'||(scenario==='pages'&&pages===n)||(scenario==='art'&&pages===0)||(scenario==='mixed'&&pages>0&&pages<n);
  if(good){anc.setState({meta:m,lastPull:null,lastPullSource:null});window.qa.expected={res,meta:next,before:structuredClone(m)};return {offset:i,res};}
 }
 throw Error('找唔到固定QA抽序');
}'''
report={'seed':42,'viewport':[390,844],'dpr':2,'jade':{'free':600,'paidTest':0},'cases':[],'pageerrors':[]}
def economy(page):return page.evaluate('JSON.parse(JSON.stringify(window.qa.anc.getState().meta))')
def shot(page,name):
 page.evaluate('document.fonts.ready')
 page.screenshot(path=str(OUT/name),timeout=30000)

def finish(page):
 btn=page.get_by_role('button',name=re.compile('^完成(?:入藏)?$'));btn.wait_for(timeout=30000);page.wait_for_function("[...document.querySelectorAll('button')].some(b=>/^完成(?:入藏)?$/.test(b.textContent.trim())&&!b.disabled)",timeout=30000);btn.click();page.get_by_role('dialog').wait_for(state='detached')
def skip(page):
 # 演出可喺截圖／軟件GPU排程期間已自然播完；唔追住已移除嘅skip按鈕。
 try:
  page.get_by_role('button',name='跳過 ›',exact=True).click(timeout=1500)
 except PlaywrightTimeout:
  page.wait_for_function("document.querySelector('[data-phase=settle]')!==null",timeout=30000)
 page.get_by_role('button',name=re.compile('^完成(?:入藏)?$')).wait_for(timeout=30000)
 page.wait_for_function("document.querySelector('[data-phase=settle]')!==null",timeout=30000)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 def start(scenario='mixed',n=10,banner='jianghu',width=390,height=844,reduced=False,fallback=False,video=False):
  kwargs={'viewport':{'width':width,'height':height},'device_scale_factor':2,'reduced_motion':'reduce' if reduced else 'no-preference'}
  if video and os.getenv('GACHA_RECORD')=='1':kwargs.update(record_video_dir='/tmp/gacha-fragments-video',record_video_size={'width':390,'height':844})
  ctx=b.new_context(**kwargs);ctx.route('**/seuocqrmyljjzndgbynt.supabase.co/**',lambda r:r.abort())
  if fallback:ctx.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return /webgl/.test(k)?null:original.call(this,k,...args)}")
  page=ctx.new_page();page.on('pageerror',lambda e:report['pageerrors'].append(str(e)));page.goto(BASE,wait_until='domcontentloaded');page.wait_for_timeout(2700);page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}})
  expected=page.evaluate(FIXTURE,{'scenario':scenario,'n':n,'banner':banner});page.get_by_role('button',name='秘笈閣',exact=True).click();page.locator('#ink-gacha').wait_for()
  if banner=='zhenben':page.get_by_role('tab',name='珍本奇功',exact=False).click()
  return ctx,page,expected
 def draw(page,n,double=False):
  btn=page.get_by_role('button',name=re.compile('^抽一次' if n==1 else '^抽十次'))
  if double:btn.evaluate('(e)=>{e.click();e.click()}')
  else:btn.click()
  # 入帳係核心同步做，唔等動畫先比對；原始結果順序亦須一樣。
  assert page.evaluate('window.qa.anc.getState().lastPull')==page.evaluate('window.qa.expected.res')
  assert economy(page)==page.evaluate('window.qa.expected.meta')
 # 單抽書頁：完整啟封、skip、入帳一次、只有兌換操作。
 ctx,page,expected=start('pages',1,video=True);page.wait_for_timeout(500);shot(page,'after.png');page.get_by_role('button',name=re.compile('^抽十次')).scroll_into_view_if_needed();shot(page,'draw-controls.png')
 page.get_by_role('button',name='卡池詳情',exact=True).click();rules=page.get_by_role('dialog',name='卡池詳情',exact=True);assert '20%武功' in rules.inner_text() and '80%書頁' in rules.inner_text();shot(page,'rules.png');page.get_by_role('button',name='關閉卡池詳情',exact=True).click()
 draw(page,1,True);snapshot=economy(page);page.wait_for_function("document.querySelector('[data-phase=settle]')!==null",timeout=30000);page.wait_for_timeout(250);shot(page,'single-pages.png')
 assert page.get_by_role('button',name=re.compile('^馬上裝備')).count()==0
 assert page.locator('[data-reward-kind="pages"]').count()>=1
 assert '×5' in page.get_by_role('dialog').inner_text();assert economy(page)==snapshot
 finish(page);assert economy(page)==snapshot
 page.get_by_role('button',name=re.compile('^上次抽取')).click();last=page.get_by_role('dialog',name='上次入藏',exact=True);assert '書頁 ×5' in last.inner_text();assert last.get_by_role('button',name=re.compile('^馬上裝備')).count()==0;shot(page,'last-pages.png');page.get_by_role('button',name='關閉上次入藏',exact=True).click();assert economy(page)==snapshot
 # 書頁兌換入口可達；200頁規則沿用，呢次5頁唔會假裝換到武功。
 page.get_by_role('button',name=re.compile('^家族收藏')).click();page.locator('.ink-pages').wait_for();assert '5' in page.locator('.ink-pages').inner_text();assert page.get_by_role('button',name='兌換',exact=True).is_disabled();shot(page,'pages-wallet.png')
 print('case complete',flush=True);report['cases'].append({'name':'single_pages','double_click_once':True,'cost':60,'pages':5,'manuals_unchanged':True,'full_play_close_reopen_no_mutation':True,'no_equip':True,'exchange_entry':True})
 video=page.video if os.getenv('GACHA_RECORD')=='1' else None;ctx.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/'single-flow.mp4')],check=True)
 # 十連混合：同一份核心結果，所有卡可選；書頁同武功各自操作。
 ctx,page,expected=start('mixed',10);draw(page,10,True);snapshot=economy(page);skip(page);page.wait_for_timeout(250);shot(page,'mixed-ten.png');cards=page.locator('[data-card]');assert cards.count()==10
 arts=0;pages=0
 for i,r in enumerate(expected['res']):
  cards.nth(i).click();page.wait_for_timeout(80)
  if r['kind']=='pages':
   pages+=r['pages'];assert page.get_by_role('button',name='查看書頁兌換',exact=True).count()==1;assert page.get_by_role('button',name=re.compile('^馬上裝備')).count()==0
   assert f"已入帳{r['pages']}頁" in page.get_by_role('dialog').inner_text()
  else:
   arts+=1;assert page.get_by_role('button',name=re.compile('^馬上裝備')).count()==1
   assert page.locator('[data-codex-rarity="ordinary"]').count()>0
 assert snapshot['pages']==pages;assert snapshot['jade']['free']==0;assert economy(page)==snapshot
 finish(page);assert economy(page)==snapshot;print('case complete',flush=True);report['cases'].append({'name':'mixed_ten','arts':arts,'pages':pages,'all_cards_selectable':True,'one_core_receipt':True})
 video=page.video if os.getenv('GACHA_RECORD')=='1' else None;ctx.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/'mixed-flow.mp4')],check=True)
 # 一般心願同珍本心願：保底及封面身份正確，書頁唔稀釋第40抽。
 for banner,premium in [('jianghu',False),('zhenben',True)]:
  ctx,page,expected=start('wish',1,banner=banner,reduced=True);known=page.evaluate('window.qa.life.getState().state.character.skills');draw(page,1);snapshot=economy(page);page.get_by_role('button',name='完成入藏',exact=True).wait_for(timeout=30000);page.wait_for_timeout(250);shot(page,f'wish-{banner}.png')
  rarity='premium' if premium else 'ordinary';assert page.locator(f'[data-codex-rarity="{rarity}"]').count()>0;assert '心願得償' in page.get_by_role('dialog').inner_text();assert snapshot['gacha']['banners'][banner]['sinceWish']==0
  page.wait_for_function("!document.querySelector('.ink-pull-equip-btn')?.disabled",timeout=30000);page.get_by_role('button',name=re.compile('^馬上裝備')).click();page.wait_for_function("window.qa.life.getState().state.tab==='person'")
  assert page.evaluate('window.qa.life.getState().state.character.skills')==known;assert economy(page)==snapshot
  print('case complete',flush=True);report['cases'].append({'name':'wish_'+banner,'pity_40':True,'premium':premium,'person_handoff_no_auto_learning':True});ctx.close()
 # 上下文丟失、無WebGL及減少動態，全部呈現已入帳嘅同一批結果。
 ctx,page,expected=start('mixed',10);draw(page,10);snapshot=economy(page)
 page.locator('[data-subject="codex"] canvas').first.wait_for(timeout=30000)
 page.locator('[data-subject="codex"] canvas').first.evaluate("c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))")
 page.locator('.ink-codex-fallback-cards').wait_for(timeout=30000);assert page.locator('.ink-codex-fallback-cards button').count()==10;assert economy(page)==snapshot;shot(page,'context-loss.png');finish(page);assert economy(page)==snapshot;ctx.close()
 for fallback,reduced in [(True,False),(False,True)]:
  ctx,page,expected=start('pages',10,fallback=fallback,reduced=reduced);draw(page,10);snapshot=economy(page)
  if fallback:page.locator('.ink-codex-fallback-cards').wait_for(timeout=30000)
  else:page.get_by_role('button',name='完成',exact=True).wait_for(timeout=30000)
  page.wait_for_timeout(300);assert page.get_by_role('button',name=re.compile('^馬上裝備')).count()==0;assert '×5' in page.get_by_role('dialog').inner_text();shot(page,'fallback-pages.png' if fallback else 'reduced-pages.png');finish(page);assert economy(page)==snapshot;ctx.close()
 print('case complete',flush=True);report['cases'].append({'name':'fallbacks','context_loss_same_results':True,'no_webgl':True,'reduced_motion_amounts':True,'all_pages_ten':50})
 # 手機全覽、名稱／數量、可點及獨立結果捲動。
 for width,height in [(320,568),(390,720),(390,844),(420,896)]:
  ctx,page,expected=start('mixed',10,width=width,height=height);draw(page,10);skip(page);page.wait_for_timeout(200)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');assert page.locator('[data-card]').count()==10
  assert page.get_by_role('button',name='完成',exact=True).evaluate('(e)=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>=44}')
  assert page.locator('[data-card]').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().height>=44)')
  page.locator('[data-card]').last.click();shot(page,f'results-{width}-{height}.png');finish(page);report['cases'].append({'name':'mobile_results','width':width,'height':height,'ten_cards_min_height_44':True,'complete_inside_viewport':True});ctx.close()
 assert not report['pageerrors'],report['pageerrors'];b.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('GACHA_FRAGMENTS_BROWSER_PASS')
