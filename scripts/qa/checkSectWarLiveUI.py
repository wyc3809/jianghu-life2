"""正式 Edge 戰報雙瀏覽器播放；只使用受控驗收身份，不另開玩家帳戶。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, copy, time

ROOT = Path(__file__).resolve().parents[2]
LOCAL = ROOT / '.local-online/sect-production'
OUT = ROOT / os.getenv('WAR_OUT', 'production/qa/evidence/redesign/sect-war/live-ui')
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv('WAR_BASE', 'http://127.0.0.1:5253/')
config = json.loads((ROOT / '.local-online/appearance-cloud-config.json').read_text())
sessions = json.loads((LOCAL / 'qa-sessions.json').read_text())
states = json.loads((LOCAL / 'states.json').read_text())
meta = json.loads((ROOT / '.local-online/game-polish/fixtures.json').read_text())['meta']
expected = json.loads((LOCAL / 'live-report.json').read_text())
auth_key = 'sb-' + config['url'].split('//')[1].split('.')[0] + '-auth-token'
native = os.getenv('WAR_NATIVE') == '1'
results = []
with sync_playwright() as pw:
    for engine, index in [('chromium', 0), ('webkit', 10)]:
        print('LIVE_UI', engine, 'native-branch' if native else 'web', flush=True)
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox']) if engine == 'chromium' else pw.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE'))
        context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        seed = {'state': copy.deepcopy(states[index]), 'meta': meta, 'session': sessions[index], 'authKey': auth_key}
        context.add_init_script('''(()=>{const f=''' + json.dumps(seed, ensure_ascii=False) + ''';localStorage.setItem(f.authKey,JSON.stringify(f.session));if(!localStorage.getItem('war-live-qa')){localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));localStorage.setItem('war-live-qa','1');}})()''')
        if native:
            context.add_init_script('window.CapacitorCustomPlatform={name:"ios"};')
        page = context.new_page()
        errors, actions, workers = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('worker', lambda w: workers.append(w.url))
        def record(request):
            if request.url.endswith('/functions/v1/jianghu-sect') and request.method == 'POST':
                actions.append(request.post_data_json.get('action'))
        page.on('request', record)
        page.goto(BASE + '?sect-war=1')
        page.get_by_role('button', name='觀戰', exact=True).wait_for(timeout=45000)
        assert page.locator('#root').evaluate('e=>e.inert')
        page.get_by_role('button', name='觀戰', exact=True).click()
        page.wait_for_function("document.querySelector('.ink-sect-war')?.dataset.status==='playing'", timeout=30000)
        page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>4", timeout=15000)
        page.get_by_role('button', name='暫停', exact=True).click()
        page.screenshot(path=str(OUT / (engine + '-playing.png')))
        page.get_by_role('button', name='跳過', exact=True).click()
        page.wait_for_function("document.querySelector('.ink-sect-war').dataset.status==='result'")
        result = page.locator('.war-result').inner_text()
        assert f"在場 {expected['remaining'][0]}：{expected['remaining'][1]}" in result, result
        page.get_by_role('button', name='重播', exact=True).click()
        page.wait_for_function("document.querySelector('.ink-sect-war').dataset.status==='playing'")
        page.get_by_role('button', name='跳過', exact=True).click()
        assert result == page.locator('.war-result').inner_text()
        assert 'challenge' not in actions and 'selection' not in actions and 'join' not in actions, actions
        assert actions.count('report') == 1, actions
        assert not errors, errors
        assert not native or any(u.startswith('blob:') for u in workers), workers
        page.screenshot(path=str(OUT / (engine + '-result.png')))
        results.append({'engine': engine, 'actualDeployedEdge': True, 'canonicalTapeDecoded': True, 'sameServerRemaining': expected['remaining'], 'replayNoMutationOrRerequest': True, 'actions': actions, 'workerBlobBranchEmulated': native, 'actualIphone': False, 'pageerrors': errors})
        context.close()
        browser.close()
(OUT / 'browser-report.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print('LIVE_UI_PASS', len(results), flush=True)
