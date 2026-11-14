"""第68項：真正修煉只扣一次、結果及掛機冊頁清理／焦點。"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];__file__=str(ROOT/'scripts/qa/checkGameUnification.py')
exec(compile(Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'"),'helpers','exec'))
BASE=os.getenv('MOBILE_UI_BASE','http://127.0.0.1:5301/');OUT=ROOT/'.local-online/mobile-ui-polish/action';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c,p,errors=start(b);p.emulate_media(reduced_motion='no-preference');nav(p,'修煉');left=data(p)['practiceActionsLeft']
 tap(p,re.compile('^苦練外功'),False);dialog=p.get_by_role('dialog',name='結果',exact=True);dialog.wait_for();assert data(p)['practiceActionsLeft']==left-1;p.wait_for_timeout(350)
 assert not p.locator('[data-ink-entering]').count();p.screenshot(path=str(OUT/'practice-result-390.jpg'),type='jpeg',quality=90);tap(p,'查看變化');tap(p,'繼續');assert data(p)['practiceActionsLeft']==left-1
 nav(p,'鎮居');tap(p,'掛機收成');dialog=p.get_by_role('dialog',name='掛機收成',exact=True);dialog.wait_for();p.wait_for_timeout(300);assert not p.locator('[data-ink-entering]').count();p.keyboard.press('Escape');assert p.get_by_role('button',name='掛機收成',exact=True).evaluate('e=>e===document.activeElement')
 assert not errors,errors;c.close();b.close()
(OUT/'report.json').write_text(json.dumps({'practiceOneDebit':True,'resultAndHarvestMotionSettled':True,'harvestFocusRestored':True,'pageerrors':errors},ensure_ascii=False,indent=2));print('UI_ACTION_PASS',flush=True)
