"""第51項：真十連結果導向指定欄位、比較後確認，不重扣抽卡成本。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkPersonScreen.py').resolve());exec(compile(Path(__file__).read_text().rsplit('\nwith sync_playwright() as p:',1)[0],'h','exec'));BASE=os.getenv('MARTIAL_BASE','http://127.0.0.1:5208/');OUT=ROOT/'production/qa/evidence/redesign/martial-ui'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c,page,errors=start(b,390,844);page.locator('.ink-quick').get_by_role('button',name='秘笈閣',exact=True).click();tap(page,re.compile('抽十次'),False);page.locator('[data-subject=codex]').wait_for(timeout=20000);page.get_by_role('button',name=re.compile('跳過')).evaluate_all('es=>es[0]?.click()');page.locator('[data-phase=settle]').wait_for(timeout=20000)
 art=page.locator('button[data-card]').filter(has=page.locator('[data-reward-kind=art]')).first;art.click();stable(page)
 equip=page.get_by_role('button',name=re.compile('^馬上裝備：'));print('GACHA_ART',equip.get_attribute('aria-label'),flush=True);equip.click();stable(page);before=ch(page);jade=meta(page)['jade'];pages=meta(page)['pages'];assert jade['free']==0
 # 抽取已入帳，但仍須明確指定外功／內功／身法欄位。
 assert page.locator('.ink-martial-selection').count()==1
 allowed=[x for x in page.locator('.ink-martial-slot button').all() if x.is_enabled()];assert allowed;allowed[0].click();stable(page)
 assert ch(page)['skills']==before['skills'] and ch(page).get('equippedArts')==before.get('equippedArts')
 d=page.locator('dialog.ink-martial-sheet');assert d.locator('.ink-martial-compare').is_visible();page.screenshot(path=str(OUT/'after-gacha-link.png'))
 if d.locator('.ink-martial-confirm').is_enabled():
  d.locator('.ink-martial-confirm').click();stable(page)
 else:close(page,d.get_attribute('aria-label'))
 assert meta(page)['jade']==jade and meta(page)['pages']==pages;assert not errors,errors
 print('GACHA_TO_MARTIAL_PASS');c.close();b.close()
