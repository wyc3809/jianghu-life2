"""演武台關卡／敵人排版、掛機詳情及原有收成：隔離本機真遊戲回歸。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,subprocess
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/spar-hud-harvest';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('SPAR_QA_BASE','http://127.0.0.1:5173/')
# 固定seed；只跳過本機測試角色嘅前排小兵，直接重現第6關精英名牌。
SETUP=r'''async()=>{
 const app=await(await fetch('/src/App.tsx')).text();const path=app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];
 const {useLifeStore:life}=await import(path);const main=await(await fetch('/src/main.tsx')).text();
 const ap=main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1];const {useAncestryStore:anc}=await import(ap);
 const {createNewLife}=await import('/core/life/gameState.ts');const{emptyAncestry}=await import('/core/life/ancestry.ts');
 const{FAMILY_MILESTONES}=await import('/data/ancestry/milestones.ts');const{ACHIEVEMENT_RULES}=await import('/core/life/achievements.ts');
 const s=createNewLife({seed:42,name:'沈雲舟',skipCoach:true});s.character.flags.newbie_done=true;s.character.flags.coach_done=true;
 s.character.flags.spar_stage=6;s.character.flags.idle_silver=123.75;s.character.health=2000;s.character.maxHealth=2000;s.pending=null;s.tab='home';
 const m=emptyAncestry();m.jade={free:600,paidTest:0};m.milestones=FAMILY_MILESTONES.map(x=>x.id);m.jadeAchv=ACHIEVEMENT_RULES.map(x=>x.id);
 life.setState({state:s,lastResult:null,combatReplay:null,sealText:null,flashLines:[]});anc.setState({meta:m,lastPull:null,jadeToast:0,milestoneToast:[]});window.qa={life,anc};
}'''
LAYOUT=r'''()=>{
 const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const keys={scene:'.ink-home-scene',info:'.ink-spar-info',caption:'.ink-spar-caption',stage:'.ink-spar-hud',enemy:'.ink-spar-enemy-name',trait:'.ink-spar-trait',heroHp:'.ink-spar-bar--hero',foeHp:'.ink-spar-bar--foe',entry:'.ink-spar-harvest-entry',quick:'.ink-quick',task:'.ink-task-bar',dock:'.ink-bottom-dock'};
 const rs=Object.fromEntries(Object.entries(keys).map(([k,s])=>[k,rect(s)]));
 const hit=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 return{rects:rs,overlaps:[['caption','stage'],['stage','enemy'],['enemy','trait'],['info','heroHp'],['info','foeHp'],['entry','heroHp'],['entry','foeHp'],['quick','task'],['task','dock']].filter(([a,b])=>hit(rs[a],rs[b])),overflow:document.documentElement.scrollWidth>innerWidth,
  entryHit:(()=>{const e=document.querySelector('.ink-spar-harvest-entry'),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===h||e.contains(h)})(),heroHeight:window.__sparStage.heroVisualHeight()};
}'''
report={'viewport_baseline':[390,844],'dpr':2,'seed':42,'jade':{'free':600,'paidTest':0},'fixture':'第6關精英；本機氣血2000、待收成123.75；跳過前排小兵以重現名牌','layouts':[],'cases':[],'pageerrors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 def start(width,height,video=False,reduced=False):
  kwargs={'viewport':{'width':width,'height':height},'device_scale_factor':2,'reduced_motion':'reduce' if reduced else 'no-preference'}
  if video:kwargs.update(record_video_dir='/tmp/spar-harvest-video',record_video_size={'width':390,'height':844})
  ctx=browser.new_context(**kwargs);ctx.route('**/seuocqrmyljjzndgbynt.supabase.co/**',lambda r:r.abort())
  page=ctx.new_page();page.on('pageerror',lambda e:report['pageerrors'].append(str(e)));page.goto(BASE,wait_until='domcontentloaded');page.wait_for_timeout(2700);page.evaluate(SETUP);page.wait_for_function('window.__sparStage && window.__sparDuel')
  page.evaluate("()=>{const d=window.__sparDuel;for(let i=0;i<10&&d.foe?.tier==='minion';i++){d.foeHp=0;d.ensureLiveFoe()}}")
  page.locator('.ink-spar-enemy-name.is-elite').wait_for(timeout=20000);page.wait_for_timeout(250);return ctx,page
 # 先連續真動畫抽樣，唔靠單一截圖宣稱冇重疊。
 ctx,page=start(390,844,True);page.evaluate('document.fonts.ready');page.screenshot(path=str(OUT/'after.png'))
 samples=[]
 for _ in range(12):
  data=page.evaluate(LAYOUT);assert not data['overlaps'],data;assert not data['overflow'];assert data['entryHit'];samples.append(data);page.wait_for_timeout(180)
 before=json.loads((OUT/'before-layout.json').read_text());assert samples[0]['rects']['scene']['height']>=before['scene']['height']+40
 report['cases'].append({'name':'live_elite_no_overlap','samples':len(samples),'scene_height_before':before['scene']['height'],'scene_height_after':samples[0]['rects']['scene']['height']})
 assert page.locator('.ink-play-body > .ink-home-focus > .ink-home-goals').count()==0
 duel_before=page.evaluate('({stage:window.__sparDuel.stage,hp:window.__sparDuel.foeHp})')
 entry=page.get_by_role('button',name='掛機收成',exact=True);entry.click();dialog=page.get_by_role('dialog',name='掛機收成',exact=True);dialog.wait_for()
 assert entry.get_attribute('aria-expanded')=='true';assert page.evaluate('document.activeElement.closest("dialog")!==null')
 # 原有數值讀自同一核心，並核對UI；開啟唔會觸發收成。
 actual=page.evaluate("""async()=>{const s=window.qa.life.getState().state;const i=await import('/core/life/idleHarvest.ts');const c=await import('/core/life/cultivation.ts');const d=await import('/core/life/sparDuel.ts');return{silver:s.character.money,pending:i.idleSilverPending(s),rate:c.effectiveCultivationRate(s),hour:i.idleSilverPerHour(s),cap:i.idleSilverCap(s),reward:d.sparStageReward(d.sparSavedStage(s)),harvestTotal:Number(s.character.flags.harvest_total??0)}}""")
 text=dialog.inner_text();assert f'{actual["rate"]:.2f}' in text and f'{actual["hour"]:.1f}' in text
 assert f'銀兩＋{actual["reward"]["silver"]}' in text and f'修為＋{actual["reward"]["xp"]}' in text
 page.screenshot(path=str(OUT/'harvest-open.png'));page.wait_for_timeout(1000)
 page.keyboard.press('Escape');dialog.wait_for(state='hidden');assert entry.get_attribute('aria-expanded')=='false';assert entry.evaluate('(e)=>e===document.activeElement')
 entry.click();dialog.wait_for();page.get_by_role('button',name='收成銀兩 123',exact=True).evaluate('(e)=>{e.click();e.click()}')
 after=page.evaluate('({money:window.qa.life.getState().state.character.money,total:Number(window.qa.life.getState().state.character.flags.harvest_total??0),pending:Number(window.qa.life.getState().state.character.flags.idle_silver)})')
 assert after['money']==actual['silver']+123 and after['total']==actual['harvestTotal']+123
 assert 0<=after['pending']<1;assert page.get_by_role('button',name='收成銀兩 0',exact=True).is_disabled()
 page.screenshot(path=str(OUT/'harvest-collected.png'));page.get_by_role('button',name='關閉掛機收成',exact=True).click();dialog.wait_for(state='hidden')
 assert page.evaluate('window.__sparDuel.stage')==duel_before['stage']
 # 無待領仍然可以打開睇速率；點背景可收起。
 entry.click();dialog.wait_for();page.mouse.click(2,2);dialog.wait_for(state='hidden')
 report['cases'].append({'name':'real_harvest_and_modal','rates_match_core':True,'double_click_credited':123,'fraction_retained':True,'empty_can_open':True,'escape_close_focus_return':True,'backdrop_close':True,'stage_not_reset':True})
 # 跨分頁再返嚟仍用同一場對打，唔因新入口重開關卡。
 page.get_by_role('navigation',name='分卷').get_by_role('button',name='人物',exact=True).click();page.get_by_role('navigation',name='分卷').get_by_role('button',name='鎮居',exact=True).click();entry.wait_for();assert page.evaluate('window.__sparDuel.stage')==6
 # 首領沿用全屏：詳情會收起，舊頁唔留原生modal遮住首領。
 entry.click();dialog.wait_for();page.evaluate("()=>{const d=window.__sparDuel;while(d.foe&&!d.foe.boss){d.foeHp=0;d.ensureLiveFoe()}const state=structuredClone(window.qa.life.getState().state);state.character.health-=.01;window.qa.life.setState({state})}")
 page.locator('.ink-spar-boss-screen').wait_for(timeout=20000);assert page.locator('dialog[open]').count()==0
 page.screenshot(path=str(OUT/'boss-preserved.png'));report['cases'].append({'name':'boss_handoff','fullscreen_preserved':True,'modal_removed':True})
 video=page.video;ctx.close()
 if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/'interaction.mp4')],check=True)
 # 小屏／Safari工具列高度情境；第二個390驗證畫布變高人物身高仍固定。
 for width,height,reduced in [(320,568,False),(390,720,False),(390,844,False),(420,896,True)]:
  ctx,page=start(width,height,reduced=reduced);data=page.evaluate(LAYOUT);assert not data['overlaps'],data;assert not data['overflow'];assert data['entryHit'];assert data['rects']['entry']['height']>=44
  assert data['rects']['scene']['bottom']<=data['rects']['quick']['top']+1
  if width==390:assert abs(data['heroHeight']-samples[0]['heroHeight'])<.01
  page.screenshot(path=str(OUT/f'home-{width}-{height}.png'));page.get_by_role('button',name='掛機收成',exact=True).click();d=page.get_by_role('dialog',name='掛機收成',exact=True);d.wait_for();r=d.bounding_box();assert r['y']>=0 and r['y']+r['height']<=height
  assert not d.evaluate('(e)=>e.scrollWidth>e.clientWidth+1');assert d.get_by_role('button').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().height>=44)')
  page.screenshot(path=str(OUT/f'details-{width}-{height}.png'));page.keyboard.press('Escape')
  report['layouts'].append({'width':width,'height':height,'reduced_motion':reduced,**data});ctx.close()
 browser.close()
assert not report['pageerrors'],report['pageerrors'];(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SPAR_HOME_BROWSER_PASS')
