"""用真正人物呈現器檢查103門、收勢及生命週期比例；唔改產品存檔或戰鬥。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import base64,json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/hero-small-scale';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('https://**',lambda r:r.abort())
    page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
    page.evaluate((ROOT/'scripts/qa/gachaCodexSetup.js').read_text(),{'jade':{'free':600,'paidTest':0}})
    page.get_by_role('button',name='鎮居',exact=True).click()
    page.wait_for_function('window.__sparStage?.images.heroAppearance',timeout=45000)
    result=page.evaluate('''async()=>{
      const s=window.__sparStage,{MARTIAL_POSES}=await import('/src/fx/art/martialPoses.ts');
      s.update=()=>{};s.render=()=>{};s.heroMoving=false;s.heroHitT=9;s.heroDownT=null;s.heroFade=1;s.supportPose=null;s.attackT=null;s.setQuiet(false);
      const load=url=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url});
      const measure=image=>{const c=document.createElement('canvas');c.width=512;c.height=352;const x=c.getContext('2d');x.drawImage(image,0,0,512,352);const a=x.getImageData(0,0,512,352).data;
        let top=null,bottom=0;for(let y=0;y<352;y++){let n=0;for(let x=0;x<512;x++)if(a[(y*512+x)*4+3]>110){n++;bottom=y;}if(n>=40&&top===null)top=y;}return bottom-top+1;};
      const g=s.geom(),canvas=document.createElement('canvas');canvas.width=256;canvas.height=150;
      const original=s.ctx,ctx=canvas.getContext('2d'),draw=ctx.drawImage.bind(ctx);let last;
      ctx.drawImage=(...args)=>{last=args;return draw(...args)};s.ctx=ctx;
      const render=()=>{last=null;ctx.clearRect(0,0,256,150);s.drawWarrior({...g,heroX:128,groundY:130});if(!last)throw Error('冇人物繪圖');return last;};
      const report={calibration:[],lifecycle:[],previews:[],cssHeight:s.cssH,motionHeight:s.motionHeight};
      try{
        const life=s.images.heroAppearance.image,c=document.createElement('canvas');c.width=512;c.height=352;c.getContext('2d').drawImage(life,0,352,512,352,0,0,512,352);
        const canonical=measure(c);s.martialAssets=new Map();const lifecycleHeight=render().slice(-1)[0];const expected=canonical*lifecycleHeight/352;
        report.expectedStandingBodyPx=expected;
        for(const def of MARTIAL_POSES){
          const prefix='/ink/art/martial/'+def.id,atlas=await load(prefix+'.webp');
          const names=def.critRecovery?['crit','kill']:def.premium&&['internal','step'].includes(def.family)?['detail']:[];
          const variants=Object.fromEntries(await Promise.all(names.map(async key=>[key,await load(prefix+'-'+key+'.webp')])));
          s.martialAssets=new Map([[def.id,{atlas,guard:false,scaleId:def.id,variants}]]);
          for(const key of ['base',...names]){
            const target=key==='base'?atlas:variants[key],result=key==='crit'||key==='kill'?{dmg:100,crit:true,killed:key==='kill',heal:0}:null;
            let sampled=false;
            for(let t=0;t<1.2;t+=.02){s.inspectMartialPose(def.id,t,result);render();if(last[0]===target){sampled=true;break;}}
            if(!sampled)throw Error('冇播放圖集 '+def.id+' '+key);
            const guard=await load(prefix+(key==='base'?'':'-'+key)+'-guard.webp');
            const bodyPx=measure(guard)*last.slice(-1)[0]/352;
            if(Math.abs(bodyPx-expected)>.02)throw Error('比例唔一致 '+def.id+' '+key+' '+bodyPx+' / '+expected);
            report.calibration.push({id:def.id,variant:key,bodyPx});
            if(['art_river_fist','art_rain_sword','pr_wind_thread','art_iron_body'].includes(def.id))report.previews.push({label:def.id+' '+key,png:canvas.toDataURL()});
          }
          s.inspectMartialPose(null);s.attackT=null;s.martialId=def.id;
          for(const state of [{heroMoving:true,heroHitT:9,heroDownT:null},{heroMoving:false,heroHitT:.1,heroDownT:null},{heroMoving:false,heroHitT:9,heroDownT:.8}]){
            Object.assign(s,state);const d=render();if(d[0]!==life||Math.abs(d.slice(-1)[0]-lifecycleHeight)>1e-8)throw Error('生命週期隨招式變大細 '+def.id);
          }
          Object.assign(s,{heroMoving:false,heroHitT:9,heroDownT:null});
        }
        s.martialAssets=new Map();s.martialId=null;
        for(let f=0;f<12;f++){
          Object.assign(s,{heroMoving:f<4,walkT:f/4,idleT:f===5?1.5:0,heroHitT:f===6?.02:f===7?.15:9,heroDownT:f>=8?[0,.2,.45,.7][f-8]:null});
          const d=render();if(Math.abs(d.slice(-1)[0]-lifecycleHeight)>1e-8)throw Error('生命週期逐格縮放 '+f);
          report.lifecycle.push({frame:f,drawHeight:d.slice(-1)[0]});
          if([0,4,6,11].includes(f))report.previews.push({label:['行路','','','','待機','','受擊','','','','','倒地'][f],png:canvas.toDataURL()});
        }
      }finally{s.ctx=original;}
      return report;
    }''')
    assert not errors,errors
    previews=result.pop('previews');result['errors']=errors
    (OUT/'scale-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14)
    sheet=Image.new('RGB',(768,185*((len(previews)+2)//3)),'#eee8dd');d=ImageDraw.Draw(sheet)
    for i,item in enumerate(previews):
        image=Image.open(__import__('io').BytesIO(base64.b64decode(item['png'].split(',')[1]))).convert('RGBA')
        x,y=(i%3)*256,(i//3)*185;sheet.paste(image,(x,y),image);d.text((x+8,y+152),item['label'],font=font,fill='#36322a')
    sheet.save(OUT/'fixed-scale-poses.jpg',quality=94)
    b.close();print('HERO_SCALE_PASS',len(result['calibration']),'套圖／',len(result['lifecycle']),'生命週期幀，守勢身高',round(result['expectedStandingBodyPx'],2),'CSS px')
