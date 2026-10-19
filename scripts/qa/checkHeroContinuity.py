"""真正入口與逐狀態人物來源檢查；只在獨立瀏覽器做驗收，唔寫玩家雲端。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,os

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/hero-continuity';OUT.mkdir(parents=True,exist_ok=True)
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
PREP="""async kind=>{
 const{startCombat}=await import('/core/life/combat.ts');
 const s=structuredClone(window.qa.life.getState().state),c=s.character;
 s.tab='home';s.pending=null;c.age=19;c.flags.newbie_done=true;c.flags.spar_stage=2;
 c.maxHealth=1800;c.health=1800;c.martial=kind==='spar-boss'?100:0;
 c.equipment.weapon='old-sword';c.skills=['art_river_fist','art_rain_sword','art_stone_palm','art_wind_chase','art_staff_iron','art_iron_body','qg_broken_bridge'];
 c.equippedArts=c.skills.slice(0,5);c.supportArts={internal:'art_iron_body',qinggong:'qg_broken_bridge'};
 c.mainArts={external:'art_river_fist',internal:'art_iron_body',qinggong:'qg_broken_bridge'};
 c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,2]));c.volumes=Object.fromEntries(c.equippedArts.map(id=>[id,[1,2]]));
 if(kind.startsWith('event')){if(kind==='event-boss'){
 c.health=1;c.maxHealth=20;c.skills=['art_river_fist'];c.equippedArts=['art_river_fist',null,null,null,null];c.supportArts={};c.mainArts={external:'art_river_fist'};c.skillRanks={art_river_fist:0};}
 startCombat(s,{source:'event',title:'人物連貫驗收',foeName:kind==='event-boss'?'鎮上惡霸':'黑衣刀客',foePower:kind==='event-boss'?'boss':'strong',lifeOrDeath:false});}
 window.qa.life.setState({state:structuredClone(s),lastResult:null,combatReplay:null});
}"""
PROBE="""()=>{
 const s=window.__martialBattleStage??window.__sparStage;window.qaHeroStage=s;
 const report={draws:0,legacy:0,blank:0,states:{},sources:{}};window.heroReport=report;
 const original=s.drawWarrior.bind(s),draw=s.ctx.drawImage.bind(s.ctx);let inside=false,count=0;
 s.ctx.drawImage=(...args)=>{if(inside){count++;const im=args[0],src=im.src??'';
  if(im===s.images.heroIdle||im===s.images.heroAttack||s.images.heroWalk?.includes(im)||s.images.heroAtk?.includes(im)||s.images.art?.walk.includes(im)||s.images.art?.heroDown.includes(im))report.legacy++;
  const key=src.startsWith('data:')?'embedded-detail':src.split('/').slice(-2).join('/');report.sources[key]=(report.sources[key]??0)+1;
 }return draw(...args)};
 s.drawWarrior=(...args)=>{inside=true;count=0;try{return original(...args)}finally{
  inside=false;report.draws++;if(!count)report.blank++;
  const state=s.heroDownT!==null?'down':s.attackT!==null?'attack':s.supportPose?'support':s.heroHitT<.22?'hurt':s.heroMoving?'walk':'idle';report.states[state]=(report.states[state]??0)+1;
 }};return{appearance:!!s.images.heroAppearance,fallback:s.images.heroAppearance?.guard};
}"""

def page_for(browser,port=5173,kind='home',width=390,height=844,record=False,missing=False,reduced=False):
    ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,reduced_motion='reduce' if reduced else 'no-preference',**({'record_video_dir':str(OUT/'raw-video'),'record_video_size':{'width':width,'height':height}} if record else {}))
    page=ctx.new_page();page.route('https://**',lambda r:r.abort());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    if missing:
        page.route('**/ink/spar/hero-detail/**',lambda r:r.abort());page.route('**/ink/art/martial/**',lambda r:r.abort())
    page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle');page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}})
    page.get_by_role('button',name='鎮居',exact=True).click();page.evaluate(PREP,kind)
    name='__martialBattleStage' if kind.startswith('event') else '__sparStage'
    check=f'window.{name}?.martialAssets.size>0' if kind.startswith('event') else f'window.{name}?.martialAssets.has("art_staff_iron")'
    page.wait_for_function(check,timeout=45000)
    return ctx,page,errors

static_only=bool(os.environ.get('HERO_QA_STATIC_ONLY'))
selected=set(os.environ.get('HERO_QA_CASES','').split(','))-{''}
report=json.loads((OUT/'report.json').read_text()) if static_only or selected else {'baseline':'3f374c6','seed':42,'dpr':2,'cases':[]}
if selected:report['cases']=[c for c in report['cases'] if str(c.get('kind',c.get('width'))) not in selected]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    # 同一真正頁面呈現器逐狀態檢視，暫停update，唔冒稱自然戰鬥截圖。
    for label,port in ([] if selected else [('before',5174),('after',5173)]):
        ctx,page,errors=page_for(browser,port=port)
        page.evaluate('''()=>{const s=window.__sparStage;s.update=()=>{};s.attackT=null;s.artRun=null;s.supportPose=null;s.heroHitT=9;s.heroDownT=null;s.heroMoving=false;s.martialId='art_river_fist';s.heroX=s.cssW*.33;s.heroFade=1;s.idleT=0;s.walkT=0;s.directorSample=null;s.render()}''')
        page.screenshot(path=str(OUT/f'{label}-idle.png'))
        if label=='after':
            for phase in ['walk','hurt','down']:
                page.evaluate('''phase=>{const s=window.__sparStage;s.heroMoving=phase==='walk';s.heroHitT=phase==='hurt'?.1:9;s.heroDownT=phase==='down'?.8:null;s.render()}''',phase)
                page.screenshot(path=str(OUT/f'{phase}-inspection.png'))
                pixels=page.evaluate('''()=>{const s=window.__sparStage,c=document.createElement('canvas');c.width=512;c.height=352;const original=s.ctx;s.ctx=c.getContext('2d');
                 try{s.drawWarrior({k:218/788,heroX:256,groundY:328});const data=s.ctx.getImageData(0,0,512,352).data;let visible=0;for(let i=3;i<data.length;i+=4)if(data[i]>80)visible++;return visible}finally{s.ctx=original}}''')
                assert pixels>1500,(phase,pixels)
        assert not errors,errors;ctx.close()
    for kind in ([] if static_only else ['home','spar-boss','event','event-boss']):
        if selected and kind not in selected:continue
        ctx,page,errors=page_for(browser,kind=kind,record=kind in ['home','event-boss'])
        initial=page.evaluate(PROBE);assert initial['appearance'] and not initial['fallback']
        if kind=='spar-boss':page.locator('.ink-unified-battle').wait_for(state='attached',timeout=60000)
        page.wait_for_timeout(14000 if kind=='home' else 5500)
        if kind=='event-boss':
            page.wait_for_function('window.heroReport.states.down>0',timeout=30000);page.wait_for_timeout(1300)
        result=page.evaluate('window.heroReport')
        assert result['draws']>0 and result['legacy']==0 and result['blank']==0,(kind,result)
        if kind=='event-boss':assert result['states'].get('down',0)>0,result
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'{kind}-live.png'))
        assert not errors,(kind,errors)
        report['cases'].append({'kind':kind,**result,'errors':errors})
        video=page.video;ctx.close()
        if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','25','-pix_fmt','yuv420p',str(OUT/f'{kind}.mp4')],check=True)
        (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(kind,'PASS',result['states'],flush=True)
    for width,height,missing,reduced in ([] if static_only else [(320,568,False,True),(390,844,True,False),(420,896,False,True)]):
        if selected and str(width) not in selected:continue
        ctx,page,errors=page_for(browser,width=width,height=height,missing=missing,reduced=reduced)
        initial=page.evaluate(PROBE);assert initial['appearance'];assert initial['fallback']==missing
        page.wait_for_timeout(2200);result=page.evaluate('window.heroReport')
        assert result['draws']>0 and result['legacy']==0 and result['blank']==0,(width,result)
        assert not errors and not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'{width}-fallback-{missing}.png'))
        report['cases'].append({'width':width,'height':height,'network_failure':missing,'reduced':reduced,**result,'errors':errors})
        (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));ctx.close();print(width,missing,'PASS',flush=True)
    browser.close()

font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',24)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
canvas=Image.new('RGB',(800,960),'#eee8dd');d=ImageDraw.Draw(canvas)
d.text((15,10),'主角全程細節人物 · 待機改前／改後',font=font,fill='#302e27')
d.text((15,45),'同一產品呈現器狀態檢視 · seed42 · 390×844 DPR2 · 免費600／付費0',font=small,fill='#57554b')
for i,label in enumerate(['before','after']):
    x=5+i*400;canvas.paste(Image.open(OUT/f'{label}-idle.png').resize((390,844)),(x,90));d.rectangle((x+65,90+410,x+250,90+565),outline='#b74335',width=3)
canvas.save(OUT/'comparison.jpg',quality=92)
print('HERO_CONTINUITY_PASS',flush=True)
