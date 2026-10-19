"""真正演武入口：短畫布敵我比例、首領逐卷招名／高亮；只寫獨立瀏覽器測試存檔。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json,base64,io,time,subprocess,os

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spar-sequence-scale';OUT.mkdir(parents=True,exist_ok=True)
setup=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
setup=setup.replace("useLifeStore.setState({state:s", """s.tab='home';const c=s.character;c.age=19;c.flags.spar_stage=1;c.maxHealth=1800;c.health=1800;c.martial=0;
c.skills=['art_river_fist','art_iron_body'];c.equippedArts=['art_river_fist',null,null,null,null];c.supportArts={internal:'art_iron_body',qinggong:null};
c.mainArts={external:'art_river_fist',internal:'art_iron_body'};c.skillRanks={art_river_fist:1,art_iron_body:1};c.volumes={art_river_fist:[1,6]};
useLifeStore.setState({state:s""")

def page_for(browser,port=5173,width=390,height=844,boss=False,record=False):
    started=time.monotonic()
    ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,**({'record_video_dir':'/tmp/jianghu-spar-sequence-video','record_video_size':{'width':width,'height':height}} if record else {}))
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**',lambda r:r.abort())
    page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle');page.evaluate(setup,{'jade':{'free':600,'paidTest':0}})
    page.get_by_role('button',name='鎮居',exact=True).click();page.wait_for_function('window.__sparStage?.martialAssets.has("art_river_fist")',timeout=45000)
    # 等本機bootstrap完成先重設固定測試玉石，唔將新手提示覆蓋當產品改動。
    page.evaluate('''()=>{const a=window.qa.anc,m=structuredClone(a.getState().meta);m.jade={free:600,paidTest:0};a.setState({meta:m,jadeToast:0,milestoneToast:[]})}''')
    if boss:
        # 明確首領checkpoint：唔冒稱自然過晒小兵；用現有真敵手及真核心還擊帶入UI。
        page.evaluate('''()=>{const s=window.__sparStage,d=window.__sparDuel;d.idx=d.queue.length-1;d.foeHp=d.foe.maxHp;d.traits=d.traitsFor(d.foe);s.settleIntro();s.combat.foeStrike()}''')
        page.locator('.ink-unified-battle').wait_for(timeout=30000);page.locator('.ink-battle-entrance').wait_for(state='detached',timeout=30000)
    page.video_offset=time.monotonic()-started
    return ctx,page,errors

FREEZE='''()=>{const s=window.__sparStage;s.update=()=>{};s.supportPose=null;s.attackT=null;s.artRun=null;s.poseInspection=null;s.heroMoving=false;s.heroHitT=9;s.heroDownT=null;s.heroFade=1;s.idleT=0;s.martialId='art_river_fist';s.heroX=s.cssW*.35;s.directorSample=null;
 const e=s.enemies[0];e.x=s.cssW*.7;e.state='hold';e.hitT=9;e.lungeT=null;e.bob=0;s.render()}'''
ACTORS='''()=>{const s=window.__sparStage,old=s.ctx,c=document.createElement('canvas');c.width=256;c.height=150;const ctx=c.getContext('2d');
 const render=fn=>{ctx.clearRect(0,0,256,150);s.ctx=ctx;try{fn();const a=ctx.getImageData(0,0,256,150).data;let top=150,bottom=0,count=0;for(let y=0;y<150;y++){let n=0;for(let x=0;x<256;x++)if(a[(y*256+x)*4+3]>110){n++;bottom=y;count++;}if(n>=3)top=Math.min(top,y);}return{png:c.toDataURL(),height:bottom-top+1,pixels:count};}finally{s.ctx=old}};
 const g={...s.geom(),heroX:128,groundY:130},e=s.enemies[0],ex=e.x;e.x=128;
 const hero=render(()=>s.drawWarrior(g)),foe=render(()=>s.drawEnemy(g,e));e.x=ex;return{hero,foe,canvas:[s.cssW,s.cssH]}}'''

static_only=bool(os.environ.get('SPAR_QA_STATIC_ONLY'))
battles_only=bool(os.environ.get('SPAR_QA_BATTLES_ONLY'))
report=json.loads((OUT/'report.json').read_text()) if static_only or battles_only else {'baseline':'0f2c9df','seed':42,'dpr':2,'static':[],'battles':[]}
if not battles_only:report['static']=[]
if not static_only:report['battles']=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for label,port in ([] if battles_only else [('before',5175),('after',5173)]):
        ctx,page,errors=page_for(browser,port)
        page.add_style_tag(content='.scroll-shell--home .ink-home-scene{flex:none!important;height:170px!important;min-height:170px!important;max-height:170px!important}')
        page.wait_for_timeout(250);page.evaluate(FREEZE);page.screenshot(path=str(OUT/f'{label}-short.png'))
        actors=page.evaluate(ACTORS)
        for kind in ['hero','foe']:
            (OUT/f'{label}-{kind}.png').write_bytes(base64.b64decode(actors[kind].pop('png').split(',')[1]))
        report['static'].append({'label':label,**actors,'errors':errors})
        if label=='after':
            assert abs(actors['hero']['height']-actors['foe']['height'])<=4,actors
            figures=page.evaluate('''async()=>{const s=window.__sparStage,{ENEMY_POOL}=await import('/src/spar/rig.ts');const e=s.enemies[0],old=s.ctx,c=document.createElement('canvas');c.width=160;c.height=110;const x=c.getContext('2d'),g={...s.geom(),groundY:95};const list=[];
             try{for(const def of ENEMY_POOL){x.clearRect(0,0,160,110);s.ctx=x;e.def=def;e.x=80;e.tier='minion';e.boss=false;e.accent=null;s.drawEnemy(g,e);list.push({id:def.part.src.split('/').at(-1),png:c.toDataURL()});}}finally{s.ctx=old;}return list}''')
            sheet=Image.new('RGB',(800,135*5),'#eee8dd');d=ImageDraw.Draw(sheet)
            font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',10)
            for i,item in enumerate(figures):
                im=Image.open(io.BytesIO(base64.b64decode(item['png'].split(',')[1]))).convert('RGBA');x,y=i%5*160,i//5*135;sheet.paste(im,(x,y),im);d.text((x+4,y+111),item['id'].replace('enemy-','').replace('.webp',''),font=font,fill='#332e28')
            sheet.save(OUT/'all-25-foes.jpg',quality=94)
        assert not errors,errors;ctx.close()
    for width,height,fast in ([] if static_only else [(390,844,False),(390,844,True),(320,568,True),(420,896,True)]):
        ctx,page,errors=page_for(browser,width=width,height=height,boss=True,record=width==390 and not fast)
        page.evaluate('''()=>{window.sequenceRecords=[];const record=()=>{const active=document.querySelector('.ink-unified-volumes .is-active'),callout=document.querySelector('.ink-unified-callout')?.textContent??'';
         const row={volume:active?.querySelector('b')?.textContent??'',move:active?.querySelector('span')?.textContent??'',callout},key=JSON.stringify(row);if(key!==window.lastSequenceKey){window.lastSequenceKey=key;window.sequenceRecords.push({...row,t:performance.now()})}};
         new MutationObserver(record).observe(document.querySelector('.ink-unified-battle'),{subtree:true,childList:true,characterData:true,attributes:true});record()}''')
        if fast:page.get_by_role('button',name='加速 ×2',exact=True).click()
        page.wait_for_function('new Set(window.sequenceRecords.filter(r=>r.volume).map(r=>r.volume)).size===2',timeout=30000)
        page.wait_for_function('window.sequenceRecords.filter(r=>r.move&&r.callout.includes(r.move)).length>=3',timeout=30000)
        page.wait_for_timeout(500)
        records=page.evaluate('window.sequenceRecords');now=page.evaluate('performance.now()');valid=[]
        for i,r in enumerate(records):
            if r['move'] and r['move'] in r['callout']:
                valid.append({**r,'durationMs':(records[i+1]['t'] if i+1<len(records) else now)-r['t']})
        seen=[]
        for r in valid:
            if not seen or seen[-1]!=r['volume']:seen.append(r['volume'])
        assert len(seen)>=3 and all(a!=b for a,b in zip(seen,seen[1:])),records
        assert set(seen)=={'卷一','卷六'},records
        minimum=175 if fast else 350
        assert all(any(r['volume']==v and r['durationMs']>=minimum for r in valid) for v in ['卷一','卷六']),valid
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'boss-{width}-fast-{fast}.png'))
        assert not errors,errors
        report['battles'].append({'width':width,'height':height,'fast':fast,'records':records,'readableMoves':valid,'sequence':seen,'errors':errors})
        video=page.video;offset=page.video_offset;ctx.close()
        if video:subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(offset),'-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','25','-pix_fmt','yuv420p',str(OUT/'boss-sequence.mp4')],check=True)
        (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(width,fast,'PASS',seen,flush=True)
    browser.close()

font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
board=Image.new('RGB',(800,390),'#eee8dd');d=ImageDraw.Draw(board);d.text((15,10),'短版演武台 · 主角大小不變，敵人對齊',font=font,fill='#332e28')
for i,label in enumerate(['before','after']):
    x=5+i*400;d.text((x+10,48),'改前' if label=='before' else '改後',font=font,fill='#332e28')
    board.paste(Image.open(OUT/f'{label}-short.png').resize((390,844)).crop((0,205,390,455)),(x,85));d.rectangle((x+70,85+75,x+355,85+185),outline='#b74335',width=3)
board.save(OUT/'comparison.jpg',quality=93);(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('SPAR_SEQUENCE_SCALE_PASS',flush=True)
