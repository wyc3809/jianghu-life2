"""第51項減少動態回歸：實例化真Director，檢查揭面不以快速整圈代替靜態姿態。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
ROOT=Path(__file__).resolve().parents[2]
BASE=os.getenv('TOKEN_BASE','http://127.0.0.1:5210/')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':390,'height':844});page.goto(BASE)
 result=page.evaluate('''async()=>{
  const {Director}=await import('/src/fx/highlight/director.ts');const results=[];
  for(const reduced of [false,true]){
   const root=document.createElement('div');Object.assign(root.style,{position:'fixed',inset:'0',width:'390px',height:'844px'});document.body.append(root);
   const refs={root};for(const key of ['world','gl','fx','flash','shadow','beams','curtain','backGlow']){const e=document.createElement(key==='gl'||key==='fx'?'canvas':'div');root.append(e);refs[key]=e;}
   const samples=[];let director;let finish;
   const done=new Promise(resolve=>{finish=resolve;});
   director=new Director(refs,{subject:'token',targetGrade:0,revealTitle:'測試',rewards:[],balances:{coin:{label:'',value:0},gem:{label:'',value:0}}},{onPhase:p=>{if(p==='settle')finish();},onGrade:()=>{},onReveal:()=>setTimeout(()=>director.revealSettled(),50),onDone:()=>{}},{reduceMotion:reduced});
   let open=director.A.open;Object.defineProperty(director.A,'open',{configurable:true,get:()=>open,set:value=>{open=value;if(['bursting','revealing'].includes(director.phase))samples.push({open:value,scale:[director.A.sx,director.A.sy,director.A.sz]});}});
   director.tap();await Promise.race([done,new Promise((_,reject)=>setTimeout(()=>reject(Error('director timeout')),10000))]);
   results.push({reduced,samples});director.dispose();root.remove();
  }
  return results;
 }''')
 assert len(result[0]['samples'])>2 and any(.05<s['open']<.95 for s in result[0]['samples'])
 assert len(result[1]['samples'])>=1 and all(s['open']==1 for s in result[1]['samples']),result[1]
 assert all(s['scale']==[1,1,1] for case in result for s in case['samples'])
 out=ROOT/'production/qa/evidence/redesign/martial-ui/token-reduced-regression.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2));print('TOKEN_REDUCED_RIGID_PASS',[(x['reduced'],len(x['samples'])) for x in result]);b.close()
