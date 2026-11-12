"""第61項：同一隔離存檔逐頁截圖；參數before／after記錄目前checkout。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,re,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/game-unification'/sys.argv[1];OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads((ROOT/'production/qa/evidence/redesign/character-bind-rollout/fixture.json').read_text())
CASES={'home':[], 'person':['人物'], 'equipment':['人物','更換武器'], 'martial':['人物','武學'], 'person-more':['人物','更多'], 'practice':['修煉'], 'sect':['修煉','門派'], 'arts':['修煉','修習雅藝'], 'jianghu':['江湖'], 'codex':['秘笈閣'], 'huashan':['論劍'], 'ancestry':['祖祠'], 'settings':['開啟設定']}
report=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,steps in CASES.items():
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  c.add_init_script('''(()=>{const f='''+json.dumps(fixture,ensure_ascii=False)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));const fetch=window.fetch.bind(window);window.fetch=(input,options)=>String(input?.url??input).includes('.supabase.co')?Promise.resolve(new Response(JSON.stringify({error:'qa_cloud_blocked'}),{status:503,headers:{'Content-Type':'application/json'}})):fetch(input,options)})();''')
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  try:
   p.goto(os.getenv('UNIFICATION_BASE','http://127.0.0.1:5294/'));p.get_by_role('button',name=re.compile('^續寫前緣')).click();p.wait_for_timeout(650)
   if p.get_by_role('button',name='領受',exact=True).count():p.get_by_role('button',name='領受',exact=True).click()
   for label in steps:
    p.get_by_role('button',name=label,exact=True).first.click(timeout=5000);p.wait_for_timeout(450)
   p.screenshot(path=str(OUT/(name+'.png')))
   geom=p.evaluate('''()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,dialogs:[...document.querySelectorAll('[role=dialog],dialog[open]')].map(e=>({label:e.getAttribute('aria-label'),native:e.matches('dialog:modal')})),buttons:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).map(e=>({label:e.getAttribute('aria-label')||e.innerText,w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}))})''')
   report.append({'screen':name,**geom,'errors':errors});print(name,'PASS',flush=True)
  except Exception as e:report.append({'screen':name,'failure':str(e),'errors':errors});p.screenshot(path=str(OUT/(name+'-failed.png')));print(name,str(e)[:150],flush=True)
  c.close()
 b.close()
(OUT/'inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
from PIL import Image,ImageDraw
files=[OUT/(n+'.png') for n in CASES if (OUT/(n+'.png')).exists()];board=Image.new('RGB',(5*235,((len(files)+4)//5)*535),'#eee7db');d=ImageDraw.Draw(board)
for i,f in enumerate(files):
 im=Image.open(f);im.thumbnail((230,500));x=(i%5)*235;y=(i//5)*535;board.paste(im,(x,y+25));d.text((x+4,y+6),f.stem,fill='#222')
board.save(OUT/'overview.png')
