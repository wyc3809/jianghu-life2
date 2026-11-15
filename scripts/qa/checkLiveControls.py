from pathlib import Path
exec(compile(Path('scripts/qa/checkLiveWorld.py').read_text().split('\nwith sync_playwright() as pw:')[0],'helpers','exec'))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='reduce');c.add_init_script(init(0));p=c.new_page();logs=[];errors=[];bad=[];p.on('response',lambda r:bad.append({'status':r.status,'url':r.url}) if r.status>=400 else None);p.on('console',lambda e:logs.append({'text':e.text,'location':e.location}) if e.type=='error' else None);p.on('pageerror',lambda e:errors.append(str(e)));enter(p)
 fields=['attributes','nature','equipment','combatLoadout','appearance','gear','skills','volumes'];before=p.evaluate('(keys)=>{const c=JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character;return Object.fromEntries(keys.map(k=>[k,c[k]]))}',fields)
 assert not p.locator('.ink-hud,.ink-bottom-dock').count();
 for w,h in [(320,568),(430,932)]:
  p.set_viewport_size({'width':w,'height':h});healthy(p);p.screenshot(path=str(OUT/f'default-{w}.jpg'),type='jpeg',quality=93)
 p.set_viewport_size({'width':390,'height':844});p.locator('#live-message').focus();p.set_viewport_size({'width':390,'height':500});p.locator('.live-compose button').scroll_into_view_if_needed();r=p.locator('.live-compose button').bounding_box();assert r['y']>=0 and r['y']+r['height']<=500
 p.screenshot(path=str(OUT/'keyboard-short-390.jpg'),type='jpeg',quality=93)
 p.set_viewport_size({'width':390,'height':844});p.emulate_media(color_scheme='dark');assert p.evaluate('getComputedStyle(document.documentElement).colorScheme')=='light';tap(p,'退出同遊');p.get_by_role('button',name='加入同遊',exact=True).wait_for();tap(p,'‹ 返回江湖風雲');p.locator('.ink-hud').wait_for();assert p.get_by_role('navigation',name='分卷').count()==1
 after=p.evaluate('(keys)=>{const c=JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character;return Object.fromEntries(keys.map(k=>[k,c[k]]))}',fields);assert before==after;assert not errors,errors;assert not logs,logs;assert not bad,bad
 (OUT/'controls.json').write_text(json.dumps({'consoleErrors':logs,'failedResponses':bad,'pageerrors':errors,'focusedTextareaAt390x500':True,'sendWithinViewport':True,'backRestoresHudAndNav':True,'attributesNatureEquipmentAppearanceAndSkillsKept':True,'darkSystemLightPaper':True,'reducedMotion':True},ensure_ascii=False,indent=2)+'\n');c.close();b.close();print('LIVE_CONTROLS_PASS')
