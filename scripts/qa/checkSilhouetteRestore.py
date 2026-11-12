"""實際主頁及交手還原黑影；追蹤真正drawImage來源與操作，唔以資料旗標當畫面驗收。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/silhouette-restore';OUT.mkdir(parents=True,exist_ok=True)
f=json.loads((ROOT/'production/qa/evidence/redesign/character-bind-rollout/fixture.json').read_text());rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for kind in ['home','event','event-boss']:
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
  c.route('**/*.supabase.co/**',lambda r:r.abort())
  c.add_init_script('''(()=>{const f='''+json.dumps(f,ensure_ascii=False)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));window.__actorSources=new Set;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...args){const tags=source?.__actorTags??(source?.src?[source.src]:[]);this.canvas.__actorTags=[...new Set([...(this.canvas.__actorTags??[]),...tags])];if(this.canvas.closest('.ink-home-scene,.ink-auto-stage,.ink-unified-canvas-host'))for(const tag of tags)__actorSources.add(tag);return draw.call(this,source,...args)}})();''')
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto('http://127.0.0.1:5292/'+('' if kind=='home' else '?battle-preview=unified&kind='+kind))
  if kind=='home':p.get_by_role('button',name='續寫前緣',exact=False).click()
  p.wait_for_function("[...__actorSources].some(s=>s.includes('/sil/hero-')||s.includes('/commercial/hero-'))",timeout=30000,polling=100)
  if kind=='home' and p.get_by_role('button',name='領受',exact=True).count():p.get_by_role('button',name='領受',exact=True).click()
  p.wait_for_timeout(600);before=p.evaluate('JSON.stringify(localStorage)');sources=p.evaluate('[...__actorSources]')
  assert not any('/art/independent/' in s or '/hero-detail/' in s for s in sources),sources
  assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  p.screenshot(path=str(OUT/(kind+'-390.png')))
  if kind!='home':
   p.get_by_role('button',name='加速 ×2',exact=True).click();p.get_by_role('button',name='跳過 ›',exact=True).evaluate('e=>{e.click();e.click()}');p.get_by_role('button',name='重播此戰',exact=True).wait_for();p.get_by_role('button',name='重播此戰',exact=True).click();p.wait_for_timeout(200);assert p.evaluate('JSON.stringify(localStorage)')==before
  else:
   ch=p.evaluate('JSON.parse(localStorage.getItem("jianghu_life_v1_ls")).state.character');assert ch['appearance']==f['state']['character']['appearance'] and ch['equipment']==f['state']['character']['equipment']
  assert not errors,errors
  rows.append({'kind':kind,'sources':sources,'pageerrors':errors,'viewport':[390,844],'doubleSkipAndReplay':kind!='home','existingAppearanceAndEquipmentKept':kind=='home'});c.close()
 b.close()
(OUT/'browser.json').write_text(json.dumps({'cases':rows,'actualIphone':False},ensure_ascii=False,indent=2)+'\n');print('SILHOUETTE_BROWSER_PASS',len(rows))
