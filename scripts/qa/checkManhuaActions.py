"""漫畫素材：真換裝、衣櫥預覽／確認、重開及失圖後備；隔離存檔。"""
from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('MANHUA_BASE','http://127.0.0.1:5300/');OUT=ROOT/'.local-online/manga-style/screens'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c,p,err=start(b);nav(p,'人物');old=data(p)['character'];duel=copy.deepcopy(old['combatLoadout']);appearance=copy.deepcopy(old['appearance'])
 tap(p,'更換武器');p.locator('[data-gear-id="iron-blade"]').scroll_into_view_if_needed();p.locator('[data-gear-id="iron-blade"]').click();tap(p,'換上');p.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.equipment.weapon==='iron-blade'")
 assert data(p)['character']['combatLoadout']==duel and data(p)['character']['appearance']==appearance
 assert 'blade.webp' in p.locator('.ink-person-gear-slot--weapon .ink-badge-object').get_attribute('src')
 tap(p,'造型');d=p.get_by_role('dialog',name='衣著與造型');d.get_by_role('button',name='高馬尾',exact=True).click();d.get_by_role('tab',name='衣著',exact=True).click();d.get_by_role('button',name='行旅披風',exact=True).click();d.get_by_role('tab',name='配色',exact=True).click();d.get_by_role('button',name='赭紅',exact=True).click();assert data(p)['character']['appearance']==appearance
 d.get_by_role('button',name='換上',exact=True).click();p.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.appearance.head==='ponytail'")
 p.reload();tap(p,re.compile('^續寫前緣'),False)
 if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
 p.wait_for_function("document.querySelector('.ink-person-figure')?.dataset.renderedAppearance==='ponytail:cloak:cinnabar'")
 assert data(p)['character']['equipment']['weapon']=='iron-blade';assert not err,err;p.screenshot(path=str(OUT/'equipped-reloaded.png'));c.close()
 c,p,err=start(b);c.route('**/ink/art/manhua/figures/**',lambda route:route.abort());p.reload();tap(p,re.compile('^續寫前緣'),False)
 if p.get_by_role('button',name='領受',exact=True).count():tap(p,'領受')
 nav(p,'人物');p.wait_for_function("document.querySelector('.ink-person-figure')?.dataset.artStyle==='legacy-fallback'",timeout=20000)
 assert p.locator('.ink-person-figure').get_attribute('data-rendered-appearance')=='silver:traveller:jade';assert not err,err;c.close();b.close()
 result={'actualGearConfirmation':True,'previewNoMutation':True,'appearanceConfirmation':True,'reloadKeptAppearanceAndEquipment':True,'normalEquipDidNotChangeDuel':True,'sameIdentityImageFallback':True,'cloudBlocked':True,'pageerrors':[]}
 (OUT.parent/'actions.json').write_text(json.dumps(result,indent=2)+'\n');print('MANHUA_ACTIONS_AND_FALLBACK_PASS')
