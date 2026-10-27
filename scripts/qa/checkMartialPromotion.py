"""第51項：真苦練升階，演出及連點完成不再次推進或派獎。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'h','exec'));fixtures=json.loads((ROOT/'.local-online/martial-ui/fixtures.json').read_text());f=fixtures['promotion'];BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5208/');OUT=ROOT/'production/qa/evidence/redesign/martial-ui'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c,page,errors=start(b,390,844,video=True);page.emulate_media(reduced_motion='no-preference');nav(page,'修煉');button=page.get_by_role('button',name=re.compile('^苦練外功'));button.scroll_into_view_if_needed();stable(page);button.click();print('PRACTICED',ch(page)['skillRanks'],flush=True);page.wait_for_timeout(1000);page.keyboard.press('Escape');page.locator('[data-subject="token"]').wait_for(timeout=20000);print('TOKEN',page.locator('[data-subject="token"]').get_attribute('data-phase'),flush=True)
 token=page.locator('[data-subject="token"]');snap=lambda:{key:copy.deepcopy(ch(page).get(key)) for key in ['skills','skillRanks','skillProgress','volumes','manualStars','equippedArts','supportArts','combatLoadout']};before=snap();balance=meta(page)
 for _ in range(3):
  page.locator('[data-phase="idle"]').wait_for(timeout=20000);page.mouse.click(195,350);page.wait_for_timeout(100)
 page.locator('[data-phase="settle"]').wait_for(timeout=30000);page.screenshot(path=str(OUT/'actual-rank-result.png'));assert snap()==before and meta(page)==balance
 page.get_by_role('button',name='完成',exact=True).evaluate('e=>{e.click();e.click()}');page.wait_for_timeout(1200);assert not page.locator('[data-subject="token"]').count();assert snap()==before and meta(page)==balance;assert not errors,errors
 print('ACTUAL_PROMOTION_PASS');video=page.video;c.close();(ROOT/'.local-online/martial-ui/actual-token-video.txt').write_text(str(video.path()));b.close()
