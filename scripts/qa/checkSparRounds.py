"""實際演武台回合錄影／截圖；隔離seed42，直接選第20關首領以觀察完整連招。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json, os, subprocess
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/spar-rounds'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('SPAR_QA_BASE','http://127.0.0.1:5173/')
LABEL=os.getenv('SPAR_QA_LABEL','after')
REDUCED=os.getenv('SPAR_QA_REDUCED')=='1'
WIDTH=int(os.getenv('SPAR_QA_WIDTH','390'))
HEIGHT=int(os.getenv('SPAR_QA_HEIGHT','844'))
SETUP=r'''async ({volumes,label})=>{
 const app=await(await fetch('/src/App.tsx')).text();
 const {useLifeStore}=await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);
 const main=await(await fetch('/src/main.tsx')).text();
 const {useAncestryStore}=await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
 const {createNewLife}=await import('/core/life/gameState.ts');
 const {emptyAncestry}=await import('/core/life/ancestry.ts');
 const {SparDuel,sparStageFoes}=await import('/core/life/sparDuel.ts');
 const {newTraitState}=await import('/core/life/foeTraits.ts');
 const {sparMoveAt}=await import('/src/spar/artCycle.ts');
 window.qa={trace:[],clearCalls:[],current:null,life:useLifeStore,anc:useAncestryStore,sparMoveAt,before:label==='before'};
 const clear=useLifeStore.getState().sparStageClear;useLifeStore.setState({sparStageClear:(...args)=>{window.qa.clearCalls.push(args);return clear(...args);}});
 const originalSnapshot=SparDuel.prototype.snapshot;
 SparDuel.prototype.snapshot=function(){
   if(!this.__qaPrepared){
     this.__qaPrepared=true;
     this.queue=[sparStageFoes(20).at(-1)];this.idx=0;this.foeHp=this.queue[0].maxHp;
     this.traits=newTraitState(this.queue[0].trait,this.queue[0].tier);
     const strike=this.heroStrike.bind(this),counter=this.foeStrike.bind(this);
     if(this.rounds){const begin=this.rounds.beginMove.bind(this.rounds);this.rounds.beginMove=c=>{
       const move=begin(c);if(move)window.qa.current={...move,round:this.rounds.round};return move;};}
     this.heroStrike=(...args)=>{const r=strike(...args);if(window.qa.current)window.qa.trace.push({side:'hero',...window.qa.current,damage:r.dmg,time:performance.now()});return r;};
     this.foeStrike=(...args)=>{const r=counter(...args);window.qa.trace.push({side:'foe',round:window.qa.current?.round,damage:r.dmg,time:performance.now()});return r;};
   }
   return originalSnapshot.call(this);
 };
 const s=createNewLife({seed:42,name:'逐招驗收'+volumes.join(''),skipCoach:true});
 s.character.flags.newbie_done=true;s.character.flags.coach_done=true;s.pending=null;s.tab='home';
 s.character.skills=['art_river_fist'];s.character.equippedArts=['art_river_fist',null,null,null,null];
 s.character.supportArts={internal:null,qinggong:null};s.character.volumes={art_river_fist:volumes};
 s.character.maxHealth=s.character.health=5000;s.character.flags.spar_stage=20;
 const m=emptyAncestry();m.jade={free:600,paidTest:0};m.manuals={art_river_fist:{stars:0,copies:0,vols:volumes}};
 useLifeStore.setState({state:s,lastResult:null,combatReplay:null});useAncestryStore.setState({meta:m,lastPull:null,jadeToast:0,milestoneToast:[]});
}'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    cases=[]
    for volumes in json.loads(os.getenv('SPAR_QA_CASES',json.dumps([[1,2,3,4,5,6,7]] if LABEL=='before' else [[1],[1,2,3],[1,2,3,4,5,6,7],[1,3,7]]))):
        key='-'.join(map(str,volumes))
        context=browser.new_context(viewport={'width':WIDTH,'height':HEIGHT},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce' if REDUCED else 'no-preference',
            record_video_dir=str(ROOT/'.local-online/spar-rounds/video'),record_video_size={'width':390,'height':844})
        context.route('**/*.supabase.co/**',lambda route:route.abort())
        page=context.new_page();errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(BASE,wait_until='domcontentloaded');page.wait_for_timeout(1400)
        page.evaluate(SETUP,{'volumes':volumes,'label':LABEL})
        try:
            page.wait_for_function('Boolean(window.__sparStage)',timeout=30000)
        except Exception:
            page.screenshot(path=str(OUT/f'{LABEL}-setup-failure.png'))
            print('SETUP_FAILED',errors,page.locator('body').inner_text()[:800],flush=True)
            raise
        if LABEL=='before':
            page.evaluate('''()=>{let n=0;const hooks=window.__sparStage.combat,original=hooks.nextArt;
              hooks.nextArt=()=>{const c=window.qa.life.getState().state.character;
                window.qa.current={...window.qa.sparMoveAt(c,n),round:n+1};n++;return original();};}''')
        page.locator('.ink-spar-boss-screen').wait_for(timeout=30000)
        if LABEL=='before':
            page.wait_for_function('window.qa.trace.filter(e=>e.side==="hero").length>=7',timeout=90000)
            page.screenshot(path=str(OUT/'before.png'))
        else:
            page.wait_for_function('window.qa.trace.some(e=>e.side==="hero"&&e.round===1)',timeout=30000)
            page.screenshot(path=str(OUT/f'{LABEL}-{key}-first.png'))
            if len(volumes)>1:
                page.wait_for_function('(last)=>window.qa.trace.some(e=>e.side==="hero"&&e.round===1&&e.volume===last)',arg=volumes[-1],timeout=90000)
                page.screenshot(path=str(OUT/f'{LABEL}-{key}-last.png'))
            page.wait_for_function('window.qa.trace.filter(e=>e.side==="foe").length>=2',timeout=90000)
            trace=page.evaluate('window.qa.trace')
            expected=[(side,round,vol) for round in [1,2] for side,vol in [('hero',v) for v in volumes]+[('foe',None)]]
            actual=[(e['side'],e['round'],e.get('volume')) for e in trace[:len(expected)]]
            assert actual==expected,actual
            # 加速只改播放時間，回合仍以完整招式組合交接。
            page.get_by_role('button',name='加速 ×2',exact=True).click()
            page.wait_for_function('window.qa.trace.filter(e=>e.side==="foe").length>=3',timeout=60000)
            third=page.evaluate('window.qa.trace.filter(e=>e.round===3)')
            assert [e.get('volume') for e in third if e['side']=='hero']==volumes,third
            assert len([e for e in third if e['side']=='foe'])==1
            if len(volumes)==7:
                page.get_by_role('button',name='跳過 ›',exact=True).evaluate('(el)=>{el.click();el.click()}')
                page.wait_for_function('!document.querySelector(".ink-spar-boss-screen")',timeout=30000)
                page.evaluate('''()=>{const life=window.qa.life;life.setState({state:{...life.getState().state,tab:'person'}})}''')
                page.wait_for_timeout(300)
                assert page.evaluate('window.qa.clearCalls.length')<=1
                stage=page.evaluate('window.qa.life.getState().state.character.flags.spar_stage')
                assert stage in [20,21],stage
                if stage==21:assert page.evaluate('window.qa.clearCalls.length')==1
        assert not errors,errors
        trace=page.evaluate('window.qa.trace');video=page.video
        cases.append({'volumes':volumes,'trace':trace,'clearCalls':page.evaluate('window.qa.clearCalls'),'pageerrors':errors})
        context.close()
        if len(volumes)==7:
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','27','-pix_fmt','yuv420p',str(OUT/f'{LABEL}-seven.mp4')],check=True)
        print('SPAR_BROWSER_CASE_PASS',LABEL,volumes,flush=True)
    browser.close()
(OUT/f'{LABEL}-browser.json').write_text(json.dumps({'base':BASE,'seed':42,'phone':[WIDTH,HEIGHT],'reducedMotion':REDUCED,'dpr':2,'bossStage':20,
    'fixtureHealth':5000,'directBossSelection':True,'realEngineAndDamage':True,'cases':cases},ensure_ascii=False,indent=2)+'\n')
if LABEL=='after' and (OUT/'before.png').exists():
    font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',19)
    board=Image.new('RGB',(800,930),'#f8f1e5');draw=ImageDraw.Draw(board)
    for x,name,title in [(5,'before.png','修改前：七卷分散於多個回合'),(405,'after-1-2-3-4-5-6-7-last.png','修改後：同一回合依次出卷一至七')]:
        draw.text((x,12),title,font=font,fill='#302b25');board.paste(Image.open(OUT/name).convert('RGB').resize((390,844)),(x,52))
    draw.rectangle((405,52,794,895),outline='#a33d32',width=2);board.save(OUT/'comparison.png')
print('SPAR_ROUNDS_BROWSER_PASS',LABEL)
