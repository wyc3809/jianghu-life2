"""30件獨有器物實畫、63件對應、雙配搭保存及取得裝備／開箱；隔離雲端。"""
from pathlib import Path
__file__=str(Path(__file__).resolve().with_name('checkGameUnification.py'))
helper=Path(__file__).read_text().split('\nwith sync_playwright() as pw:')[0].replace("ROOT/'.local-online/unify-game/fixtures.json'","ROOT/'design/art/manhua/fixtures.json'")
helper=helper.replace("if kind!='danger' and p.get_by_role","if kind!='danger' and not globals().get('weaponCompareExpected',False) and p.get_by_role")
exec(compile(helper,'helpers','exec'))
BASE=os.getenv('WEAPON_ART_BASE','http://127.0.0.1:5300/');OUT=ROOT/'.local-online/rare-weapons/screens';OUT.mkdir(parents=True,exist_ok=True)
inventory=json.loads((ROOT/'design/art/rare-weapons/inventory.json').read_text());seed=copy.deepcopy(fixtures['full']);cases=[];images=[]
def boot(browser,w=390,h=844,mode='normal'):
 global weaponCompareExpected
 weaponCompareExpected=mode=='compare'
 fixtures['full']=copy.deepcopy(seed);state=fixtures['full']['state'];c=state['character'];c['gear']=list(dict.fromkeys(c['gear']+[g['id'] for g in inventory['weapons']]));c['equipment']['weapon']='old-sword'
 c['combatLoadout']=copy.deepcopy(c.get('combatLoadout') or {'external':[None]*5,'internal':None,'qinggong':None,'equipment':copy.deepcopy(c['equipment'])});c['combatLoadout']['equipment']['weapon']='iron-blade';state['pendingGearCompare']=None;state['moments']=[]
 if mode=='compare':state['pendingGearCompare']={'gearId':'phoenix-blood-blade'};c['equipment']['weapon']='inkrain-sword'
 if mode=='loot':state['moments']=[{'kind':'loot','gearId':'divine-xuan-sword'}]
 context,page,errors=start(browser,w,h);page.set_default_timeout(15000);return context,page,errors
def shot(page,name):page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=93)
def loaded(locator):locator.evaluate_all('es=>Promise.all(es.map(e=>e.decode()))')
def money(page):
 s=data(page);m=page.evaluate("JSON.parse(localStorage.getItem('jianghu_ancestry_v1'))")
 return {'money':s['character']['money'],'jade':m['jade'],'pages':m['pages'],'gear':s['character']['gear'],'rngState':s['rngState']}
def picker(page):tap(page,'更換武器');return page.get_by_role('dialog',name='更換武器',exact=True)
def choose(dialog,key):dialog.locator(f'[data-gear-id="{key}"]').click();loaded(dialog.locator('.ink-equipment-column img'))
def in_view(locator):return locator.evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [[390,844],[320,568],[430,932]]:
  context,page,errors=boot(browser,w,h);nav(page,'人物');before=copy.deepcopy(data(page)['character']);wallet=money(page);dialog=picker(page)
  loaded(dialog.locator('.ink-equipment-item img'));assert dialog.locator('[data-gear-id]').count()==63
  if w==390:
   images=dialog.locator('.ink-equipment-item').evaluate_all('''es=>es.map(e=>{const img=e.querySelector('img'),cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0,128,128);const d=ctx.getImageData(0,0,128,128).data;let hash=2166136261,n=0,edge=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4;if(d[p+3]>32){n++;if(x<2||y<2||x>=126||y>=126)edge++}for(let k=0;k<4;k++)hash=Math.imul(hash^d[p+k],16777619)>>>0}return {id:e.dataset.gearId,src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,hash,pixels:n,edge,objectFit:getComputedStyle(img).objectFit}})''')
   byid={r['id']:r for r in images};hashes=set()
   for gear in inventory['unique']:
    row=byid[gear['id']];assert f"/weapons/{gear['id']}-" in row['src'];assert row['width']==row['height']==512;assert row['pixels']>20 and row['edge']==0;hashes.add(row['hash'])
   assert len(hashes)==30
   for gear in inventory['generic']:assert f"/icons/{gear['weaponKind']}.webp" in byid[gear['id']]['src']
   shot(page,'weapons-all-390')
  choose(dialog,'divine-xuan-sword');assert '/weapons/divine-xuan-sword-' in dialog.locator('.ink-equipment-column img').last.get_attribute('src')
  dialog.get_by_role('button',name='查看選中裝備詳情',exact=True).click();loaded(dialog.locator('.ink-equipment-detail-art'));assert dialog.locator('.ink-equipment-detail-art').first.get_attribute('src').find('/weapons/divine-xuan-sword-')>=0
  if w==390:shot(page,'weapon-detail-390')
  page.keyboard.press('Escape');assert data(page)['character']['equipment']==before['equipment'];assert money(page)==wallet
  dialog=picker(page);choose(dialog,'autumnwater-sword');assert in_view(dialog.get_by_role('button',name='換上',exact=True))
  if w==320:shot(page,'weapon-compare-320')
  dialog.get_by_role('button',name='換上',exact=True).click();page.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.equipment.weapon==='autumnwater-sword'")
  assert '/weapons/autumnwater-sword-' in page.get_by_role('button',name='更換武器',exact=True).locator('.ink-badge-object').get_attribute('src')
  assert data(page)['character']['combatLoadout']==before['combatLoadout']
  page.get_by_role('tab',name='對戰配搭',exact=True).click();dialog=picker(page);choose(dialog,'phoenix-blood-blade');dialog.get_by_role('button',name='換上',exact=True).click()
  page.wait_for_function("JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state.character.combatLoadout.equipment.weapon==='phoenix-blood-blade'");assert data(page)['character']['equipment']['weapon']=='autumnwater-sword';assert money(page)==wallet
  page.reload();tap(page,re.compile('^續寫前緣'),False)
  if page.get_by_role('button',name='領受',exact=True).count():tap(page,'領受')
  page.get_by_role('tab',name='普通配搭',exact=True).click();page.wait_for_timeout(100)
  assert data(page)['character']['equipment']['weapon']=='autumnwater-sword';assert data(page)['character']['combatLoadout']['equipment']['weapon']=='phoenix-blood-blade'
  assert '/weapons/autumnwater-sword-' in page.get_by_role('button',name='更換武器',exact=True).locator('.ink-badge-object').get_attribute('src');loaded(page.locator('.ink-person-gear-slot img'))
  if w==390:shot(page,'equipped-390')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not errors,errors
  cases.append({'viewport':[w,h],'all63ImagesLoaded':True,'unique30RenderHashes':w==390,'previewCancelUnchanged':True,'normalAndDuelSeparateAndReloaded':True,'currencyGearAndRngUnchanged':True,'pageerrors':errors});context.close();print('EQUIPMENT',w,flush=True)
  context,page,errors=boot(browser,w,h,'compare');dialog=page.get_by_role('dialog',name='獲得新裝備',exact=True);dialog.wait_for();loaded(dialog.locator('.ink-gear-compare-art'))
  assert '/weapons/inkrain-sword-' in dialog.locator('.ink-gear-compare-art').first.get_attribute('src');assert '/weapons/phoenix-blood-blade-' in dialog.locator('.ink-gear-compare-art').last.get_attribute('src')
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert in_view(dialog.get_by_role('button',name='先收好',exact=True));shot(page,f'new-gear-{w}')
  wallet=money(page);dialog.get_by_role('button',name='先收好',exact=True).click();assert money(page)==wallet;assert not errors,errors;cases.append({'viewport':[w,h],'newGearCompareDistinctArt':True,'keepDidNotDuplicateReward':True,'pageerrors':errors});context.close()
 # 真開箱卡面讀取正式lootConfig，而非示範頁假兵器。
 context,page,errors=boot(browser,mode='loot');wallet=money(page)
 if page.locator('[data-subject="chest"]').count():
  page.get_by_role('button',name='跳過 ›',exact=True).click();art=page.locator('[data-equipment-art="divine-xuan-sword"]').first;art.wait_for();loaded(art);assert '/weapons/divine-xuan-sword-' in art.get_attribute('src')
  page.get_by_role('button',name='領取',exact=True).wait_for();page.wait_for_function("!document.querySelector('[data-subject=chest] button[class*=claim]')?.disabled");shot(page,'loot-card-390');page.get_by_role('button',name='領取',exact=True).click();assert money(page)==wallet;cases.append({'actualLootHighlightUniqueArt':True,'claimNoDuplicateReward':True,'pageerrors':errors})
 else:raise AssertionError('Chromium did not exercise WebGL loot path')
 assert not errors,errors;context.close()
 # 同一來源在無WebGL的二維後備展示；覆寫只在隔離測試context。
 context,page,errors=boot(browser,320,568,'loot');context.add_init_script("{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return String(kind).includes('webgl')?null:get.call(this,kind,...args)}}")
 page.reload();tap(page,re.compile('^續寫前緣'),False)
 if page.get_by_role('button',name='領受',exact=True).count():tap(page,'領受')
 art=page.locator('[data-gear-art="divine-xuan-sword"]');art.wait_for();loaded(art);assert '/weapons/divine-xuan-sword-' in art.get_attribute('src');assert in_view(art);shot(page,'loot-fallback-320');cases.append({'forcedNoWebglUniqueArt':True,'pageerrors':errors});assert not errors,errors;context.close();browser.close()
(OUT.parent/'browser.json').write_text(json.dumps({'images':images,'cases':cases,'cloudBlocked':True,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('RARE_WEAPON_ART_PASS',len(images),len(cases),flush=True)
