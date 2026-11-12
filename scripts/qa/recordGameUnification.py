"""第61項：真App正常動態操作影片；唔逐幀合成角色或改畫面數值。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkGameUnification.py').read_text().split('\nwith sync_playwright() as pw:')[0],'unification_helpers','exec'))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,p,errors=start(b,record=True)
 p.emulate_media(reduced_motion='no-preference');p.wait_for_function('Boolean(window.__sparStage)',polling=100);p.wait_for_timeout(1200)
 tap(p,'祖祠');p.wait_for_timeout(450);p.locator('.ink-ancestry-content').evaluate('e=>e.scrollTo({top:e.scrollHeight,behavior:"smooth"})');p.wait_for_timeout(600);tap(p,'關閉祖祠');nav(p,'修煉')
 tap(p,re.compile('^苦練外功'),False);p.get_by_role('dialog',name='結果',exact=True).wait_for();p.wait_for_timeout(800);tap(p,'查看變化');p.wait_for_timeout(850);tap(p,'繼續');p.wait_for_timeout(300)
 assert not errors,errors;video=p.video;c.close();(ROOT/'.local-online/unify-game/showcase-video.txt').write_text(str(video.path()));b.close()
print('GAME_UNIFICATION_RECORD_PASS')
