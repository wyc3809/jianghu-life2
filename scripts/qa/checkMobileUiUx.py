"""第68項：22個手機實畫、共用按壓／揭頁與短屏資格及保存檢查；隔離雲端。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('MOBILE_UI_BASE','http://127.0.0.1:5301/');OUT=ROOT/'.local-online/mobile-ui-polish'/os.getenv('MOBILE_UI_TAG','after');OUT.mkdir(parents=True,exist_ok=True)
rows=[]
def snap(p,key):
 p.wait_for_timeout(300);assert not p.locator('vite-error-overlay').count();p.screenshot(path=str(OUT/(key+'.jpg')),type='jpeg',quality=85)
 rows.append({'step':key,'text':p.locator('body').inner_text(),'horizontalOverflow':p.evaluate('document.documentElement.scrollWidth>innerWidth+1'),'targets':p.locator('button,a[href],summary,[role=tab]').evaluate_all('es=>es.filter(e=>e.getBoundingClientRect().width>0&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute("aria-label")||e.innerText,width:r.width,height:r.height}})')})
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c,p,errors=start(b);snap(p,'01-home')
 nav(p,'人物');snap(p,'02-person');tap(p,'更換武器');snap(p,'03-weapon');p.keyboard.press('Escape')
 tap(p,'造型');snap(p,'04-appearance');p.get_by_role('tab',name='門派服',exact=True).click();snap(p,'05-uniform');p.get_by_role('tab',name='時裝',exact=True).click();snap(p,'06-fashion');p.keyboard.press('Escape')
 tap(p,'武學');snap(p,'07-martial');tap(p,'選擇外功欄位2');snap(p,'08-martial-picker');p.keyboard.press('Escape');p.get_by_role('tab',name='規則',exact=True).click();snap(p,'09-martial-rules');tap(p,'返回人物');tap(p,'更多');snap(p,'10-person-more');p.keyboard.press('Escape');tap(p,'返回鎮居')
 nav(p,'修煉');snap(p,'11-practice');tap(p,'門派');snap(p,'12-sects');tap(p,'返回');tap(p,'修習雅藝');snap(p,'13-arts');tap(p,'返回')
 nav(p,'江湖');snap(p,'14-map')
 for key,name in [('15-huashan','華山論劍'),('16-founder','開宗立派'),('17-online','江湖風雲')]:
  tap(p,name);snap(p,key);tap(p,'‹ 返回江湖')
 tap(p,'秘笈閣');snap(p,'18-gacha');tap(p,'卡池詳情');snap(p,'19-gacha-rules');p.keyboard.press('Escape');tap(p,re.compile('^家族收藏'),False);snap(p,'20-collection');tap(p,'‹ 返回江湖');tap(p,'返回鎮居')
 tap(p,'開啟設定');snap(p,'21-settings');p.keyboard.press('Escape');tap(p,'祖祠');snap(p,'22-ancestry');p.keyboard.press('Escape')
 assert not errors,errors;c.close();b.close()
(OUT/'report.json').write_text(json.dumps({'cases':rows,'pageerrors':errors,'actualIphone':False},ensure_ascii=False,indent=2));print('CAPTURE_PASS',len(rows),flush=True)
