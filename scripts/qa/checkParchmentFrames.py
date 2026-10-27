"""共用紙框驗收：隔離存檔、十個真實畫面、逐頁檢視仍未換材質的邊框。"""
from pathlib import Path
HELPER=Path('scripts/qa/checkPersonScreen.py')
exec(compile(HELPER.read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'person_helpers','exec'))
BASE=os.getenv('PARCHMENT_BASE','http://127.0.0.1:5201/');OUT=ROOT/'production/qa/evidence/redesign/parchment-ui';report=[]
def audit(page,name):
 stable(page);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),name+' horizontal overflow';shot(page,'after-'+name+'.png')
 unstyled=page.locator('body *').evaluate_all("""es=>es.filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();if(r.width<60||r.height<24||r.bottom<0||r.top>innerHeight||s.visibility==='hidden'||s.display==='none'||!parseFloat(s.borderTopWidth)||s.borderTopStyle==='none'||s.borderTopColor==='rgba(0, 0, 0, 0)')return false;const p=getComputedStyle(e,'::before');return ![s.backgroundImage,s.borderImageSource,p.backgroundImage,p.borderImageSource].join(' ').includes('/parchment-ui/')}).map(e=>({tag:e.tagName,cls:e.className,text:(e.innerText||'').slice(0,35),border:getComputedStyle(e).borderTopColor,bg:getComputedStyle(e).backgroundImage.slice(0,80)}))""")
 report.append({'screen':name,'bordersWithoutNewMaterial':unstyled})
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c,page,errors=start(b,390,844);page.evaluate('document.fonts.ready')
 page.wait_for_timeout(5000);audit(page,'home');tap(page,'開啟設定');audit(page,'settings');close(page,'設定');nav(page,'人物');audit(page,'person');tap(page,'更多');audit(page,'person-more');close(page,'人物詳情');tap(page,'武學');audit(page,'skills');tap(page,'收藏');audit(page,'skills-library');tap(page,'← 返回人物');tap(page,'返回鎮居');nav(page,'修煉');audit(page,'practice');nav(page,'鎮居');page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();audit(page,'gacha');tap(page,'卡池詳情');audit(page,'gacha-info');close(page,'卡池詳情');tap(page,re.compile('^家族收藏'),False);audit(page,'family-library');c.close();b.close()
 (OUT/'frames-audit.json').write_text(json.dumps({'cases':report,'pageerrors':errors},ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
