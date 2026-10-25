"""正式構建內力耗盡分支，不把調息顯示成落空。"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
out=Path('production/qa/evidence/redesign/martial-economy-v2');f=json.load(open('.local-online/martial-economy-v2/battle.json'));f['state']['pendingCombat']['player']['qi']=0;f['state']['pendingCombat']['turn']=10
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 for glob in ['**/*.supabase.co/**','**/fonts.googleapis.com/**','**/fonts.gstatic.com/**']:c.route(glob,lambda r:r.abort())
 c.add_init_script('''const f='''+json.dumps(f,ensure_ascii=False)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5188/');page.get_by_role('button',name=re.compile('^續寫前緣')).click();page.wait_for_function('document.querySelector(".ink-unified-callout")?.textContent.trim()==="調息"',timeout=60000)
 page.screenshot(path=str(out/'meditate.png'));assert '落空' not in page.locator('.ink-unified-callout').inner_text();assert not errors,errors
 page.get_by_role('button',name='跳過 ›',exact=True).click();(out/'meditate.json').write_text(json.dumps({'productionBuild':True,'fixture':'ongoing fight at turn10 with depleted qi; not fresh-start rule','callout':'調息','notMiss':True,'pageerrors':errors},ensure_ascii=False,indent=2));b.close();print('MEDITATE_PASS')
