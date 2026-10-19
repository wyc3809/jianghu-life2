"""第31項書封分色：真實選池、混合十連、心願及無WebGL後備。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json, subprocess

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/gacha-book-colors'
OUT.mkdir(parents=True,exist_ok=True)
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
REPORT={'baseline':'1635b87','viewport':[390,844],'dpr':2,'seed':42,'cases':[]}

def context(browser,**options):
    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,**options)
    page=ctx.new_page();page.route('https://**',lambda r:r.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    return ctx,page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for label,port in [('before',5174),('after',5173)]:
        ctx,page,errors=context(browser)
        page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle')
        page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}})
        for pool in ['jianghu','zhenben','jianghu']:
            page.get_by_role('tab',name='江湖秘笈' if pool=='jianghu' else '珍本奇功').click()
            page.locator('.ink-codex-canvas, .ink-codex-static').first.wait_for()
            page.evaluate('document.fonts.ready');page.wait_for_timeout(1800)
            page.screenshot(path=str(OUT/f'{label}-{pool}.png'))
            if label=='after':assert page.locator('.ink-codex-canvas').get_attribute('data-codex-rarity')==('premium' if pool=='zhenben' else 'ordinary')
        assert not errors,errors
        ctx.close()
    scenarios=[('ordinary',{}),('premium',{'banner':'zhenben','premium':True}),('wish-ordinary',{'wish':True}),('ten-mixed',{'banner':'zhenben','premium':True,'n':10}),('fallback-ten',{'banner':'zhenben','premium':True,'n':10,'no_gl':True})]
    for name,opts in scenarios:
        recording={'record_video_dir':str(OUT/'raw-video'),'record_video_size':{'width':390,'height':844}} if name=='ten-mixed' else {}
        ctx,page,errors=context(browser,**recording)
        if opts.get('no_gl'):
            ctx.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args)}")
        requested=[];page.on('response',lambda r:requested.append({'url':r.url,'status':r.status}) if 'codex-cover' in r.url else None)
        page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
        page.evaluate(SETUP,opts)
        if opts.get('banner')=='zhenben':page.get_by_role('tab',name='珍本奇功').click()
        if opts.get('no_gl'):
            page.locator('.ink-codex-static').wait_for();assert 'codex-cover-premium.webp' in page.locator('.ink-codex-static').get_attribute('src')
        n=opts.get('n',1)
        expected=page.evaluate('''n=>{const q=window.qa;const m=structuredClone(q.anc.getState().meta);const results=q.g.pull(m,document.querySelector('[role=tab][aria-selected=true]').textContent.includes('珍本')?'zhenben':'jianghu',n);return{meta:m,results}}''',n)
        page.get_by_role('button',name='抽十次' if n==10 else '抽一次',exact=False).evaluate('(el)=>{el.click();el.click()}')
        if opts.get('no_gl'):
            page.get_by_role('dialog').filter(has_text='已入家族收藏').wait_for()
            images=page.locator('.ink-codex-fallback-cards img')
        else:
            page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=30000)
            images=page.locator('[data-card] img[data-codex-rarity]')
        assert images.count()==n
        for i,result in enumerate(expected['results']):
            image=images.nth(i);image.wait_for()
            assert image.get_attribute('data-codex-rarity')==('premium' if result['isPremium'] else 'ordinary')
            assert image.get_attribute('src').endswith('codex-cover-premium.webp' if result['isPremium'] else 'codex-cover.webp')
        page.wait_for_function("Array.from(document.querySelectorAll('img[data-codex-rarity]')).every(i=>i.complete&&i.naturalWidth>0)")
        if name=='ten-mixed':assert any(r['isPremium'] for r in expected['results']) and any(not r['isPremium'] for r in expected['results'])
        if name=='wish-ordinary':assert expected['results'][0]['isWish'] and not expected['results'][0]['isPremium']
        actual=page.evaluate('''()=>{const m=window.qa.anc.getState().meta;return{jade:m.jade,gacha:m.gacha,manuals:m.manuals,results:window.qa.anc.getState().lastPull}}''')
        for key in ['jade','gacha','manuals']:assert actual[key]==expected['meta'].get(key),(name,key)
        assert actual['results']==expected['results']
        page.screenshot(path=str(OUT/f'{name}-result.png'))
        if name=='ten-mixed':
            for i in [next(i for i,r in enumerate(expected['results']) if r['isPremium']),next(i for i,r in enumerate(expected['results']) if not r['isPremium'])]:
                page.locator('[data-card]').nth(i).click()
                chosen=page.locator('[data-codex-rarity]').first
                assert chosen.get_attribute('data-codex-rarity')==('premium' if expected['results'][i]['isPremium'] else 'ordinary')
                page.wait_for_timeout(600)
        page.get_by_role('button',name='完成入藏',exact=True).click()
        page.get_by_role('dialog').wait_for(state='detached')
        assert page.evaluate('document.getElementById("root").inert')==False
        final=page.evaluate('''()=>{const m=window.qa.anc.getState().meta;return{jade:m.jade,gacha:m.gacha,manuals:m.manuals}}''')
        assert all(final[k]==actual[k] for k in final)
        assert not errors,errors
        assert all(r['status']==200 for r in requested)
        video=page.video;ctx.close()
        if video:
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','24','-pix_fmt','yuv420p',str(OUT/'ten-mixed.mp4')],check=True)
        REPORT['cases'].append({'name':name,'results':actual['results'],'colors_match_identity':True,'core_match':True,'double_click_once':True,'close_no_mutation':True,'errors':errors})
        print(name,'PASS',flush=True)
    browser.close()

fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
title=ImageFont.truetype(fontpath,26);small=ImageFont.truetype(fontpath,17)
canvas=Image.new('RGB',(1200,960),'#eee8dd');draw=ImageDraw.Draw(canvas)
draw.text((22,10),'秘笈書封分色｜改前 → 改後',font=title,fill='#302e27')
draw.text((22,48),'真實畫面 · seed42 · 390×844 DPR2 · 免費600／付費0 · Linux Chromium',font=small,fill='#57554b')
for i,(file,label) in enumerate([('before-zhenben','改前：珍本仍係青綠'),('after-jianghu','改後：江湖一般 · 青綠'),('after-zhenben','改後：珍本 · 古金')]):
    img=Image.open(OUT/f'{file}.png').convert('RGB').resize((390,844),Image.Resampling.LANCZOS)
    x=5+i*400;canvas.paste(img,(x,104));draw.text((x+10,76),label,font=small,fill='#302e27')
    draw.rectangle((x+100,104+388,x+285,104+553),outline='#b74335',width=3)
canvas.save(OUT/'comparison.jpg',quality=92)
(OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2))
print('BOOK_COLORS_PASS',flush=True)
