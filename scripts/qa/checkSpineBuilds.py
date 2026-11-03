"""Spine審閱的普通／內測構建隔離、設定入口及既存存檔保護。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-character'
fixture=json.loads((ROOT/'production/qa/evidence/redesign/character-rig-audit/qa-fixture.json').read_text());report=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for port,enabled in [(5278,False),(5277,True)]:
        c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{port}/?spine-lab=1');page.wait_for_timeout(2000)
        iframe=page.locator('iframe[title="Spine人物動畫驗收"]')
        if enabled:
            iframe.wait_for();f=page.frames[1];f.wait_for_function('__spineLab?.ready');f.get_by_role('button',name='出拳',exact=True).click();page.wait_for_timeout(1400);assert f.evaluate('__spineLab.metrics.invalidFrames')==0;f.get_by_role('button',name='‹ 返回',exact=True).click();page.wait_for_url(f'http://127.0.0.1:{port}/');assert page.locator('iframe').count()==0
        else:assert iframe.count()==0
        assert not errors,errors;report.append({'internalFlag':enabled,'queryGateCorrect':True,'returnCorrect':enabled,'pageerrors':errors});c.close()
    fixture['state']['tab']='practice';fixture['state']['pendingCombat']=None
    c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,body='{"code":"qa_isolated"}'))
    c.add_init_script('(()=>{if(window.top!==window)return;const f='+json.dumps(fixture)+';if(!localStorage.getItem("spine-build-seed")){localStorage.setItem("jianghu_life_v1_ls",JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem("jianghu_ancestry_v1",JSON.stringify(f.meta));localStorage.setItem("spine-build-seed","1");}})()')
    page=c.new_page();page.goto('http://127.0.0.1:5277/');page.get_by_role('button',name='續寫前緣',exact=False).click();page.wait_for_timeout(600)
    if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
    page.get_by_role('button',name='開啟設定',exact=True).click();page.get_by_role('button',name='角色動畫驗收',exact=True).click();page.wait_for_url('**/?spine-lab=1');page.locator('iframe').wait_for();f=page.frames[1];f.wait_for_function('__spineLab?.ready');saved=page.evaluate('JSON.stringify(localStorage)');f.get_by_role('button',name='出拳',exact=True).click();page.wait_for_timeout(1300);f.get_by_role('button',name='受擊',exact=True).click();page.wait_for_timeout(1100);assert page.evaluate('JSON.stringify(localStorage)')==saved;report.append({'internalSettingsEntry':True,'existingSaveUnchangedInsideLab':True});c.close();b.close()
    (OUT/'build-gates.json').write_text(json.dumps({'actualIphone':False,'cases':report},ensure_ascii=False,indent=2)+'\n');print('SPINE_BUILD_GATES_PASS')
