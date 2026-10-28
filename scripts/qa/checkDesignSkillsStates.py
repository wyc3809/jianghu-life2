"""第52項：空藏本、大數字、資源不足及原有學習／升階／舊本轉頁保留。"""
from pathlib import Path
__file__=str(Path('scripts/qa/checkDesignSkillsUx.py').resolve())
exec(compile(Path(__file__).read_text().split('report=[]\nwith sync_playwright() as p:',1)[0],'design_helpers','exec'))
records=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for case in ['empty','large','insufficient','legacy']:
  print('STATE',case,flush=True);f=copy.deepcopy(fixtures['empty'] if case=='empty' else fixtures['full'])
  if case=='large':f['meta']['jade']={'free':9999999,'paidTest':1234567};f['meta']['pages']=9999999
  if case=='insufficient':f['meta']['jade']={'free':59,'paidTest':0};f['meta']['pages']=199
  if case=='legacy':f['meta']['manuals'][ids['storedExternal']]['copies']=1;f['state']['character']['money']=1000
  c,page,errors=start(b,320,568);enter(page);fixed(page)
  if case=='large':shot(page,'after-large-wallet.png')
  if case=='insufficient':assert '尚欠 1 玉石' in page.locator('#ink-codex-availability').inner_text()
  tap(page,re.compile('^家族收藏'),False)
  if case=='empty':
   assert page.locator('.ink-codex-empty').is_visible();shot(page,'after-empty.png');tap(page,'返回抽取',False);fixed(page)
  elif case=='legacy':
   card=page.locator('[data-manual-id="'+ids['storedExternal']+'"]');card.scroll_into_view_if_needed();card.click();d=sheet_check(page);before=snapshot(page)
   tap(page,'學習');assert ids['storedExternal'] in ch(page)['skills'];assert meta(page)['pages']==before['pages'];assert ch(page)['equipment']==before['equipment'];assert ch(page)['combatLoadout']==before['preset']
   tap(page,'升階 · 100頁');assert meta(page)['pages']==before['pages']-100;assert meta(page)['manuals'][ids['storedExternal']]['stars']==1
   tap(page,'舊重複本轉頁 · 1本');assert meta(page)['manuals'][ids['storedExternal']]['copies']==0
   # 原本一份舊本轉一份書頁，不將顯示本數當作整批轉換。
   assert meta(page)['pages']==before['pages']-100+20;assert page.get_by_role('button',name='舊重複本轉頁',exact=True).is_disabled();close(page,d.get_attribute('aria-label'))
   tap(page,'書頁兌換',False);d=sheet_check(page);silver=page.get_by_role('button',name='200兩換10頁',exact=True);silver.scroll_into_view_if_needed();silver.click();stable(page)
   assert ch(page)['money']==800 and meta(page)['pages']==before['pages']-100+20+10;close(page,'書頁兌換')
  else:
   tap(page,'書頁兌換',False);tap(page,'選擇兌換武學',False);d=sheet_check(page);d.locator('[data-exchange-art]').first.click();stable(page);d=sheet_check(page)
   if case=='insufficient':assert '尚欠 1 書頁' in d.locator('footer').inner_text();assert d.locator('footer button').is_disabled();shot(page,'after-pages-shortage.png')
   close(page,'書頁兌換')
  assert not errors,errors;records.append({'case':case,'passed':True,'pageerrors':errors});c.close()
 b.close()
(OUT/'state-report.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));print('DESIGN_STATES_PASS',len(records))
