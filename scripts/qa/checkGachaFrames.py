"""秘笈閣第28項冊頁框回歸：真入口、Portal、手機觸控與核心入帳。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json,re,os

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/gacha-frames'
OUT.mkdir(parents=True,exist_ok=True)
SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
report={'baseline':'acf0ef4','cases':[]}
gl_only=bool(os.environ.get('FRAME_QA_GL_ONLY'))
if gl_only:report=json.loads((OUT/'report.json').read_text())
NO_GL="const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:original.call(this,t,...a)}"

def start(browser,width=390,height=844,port=5173,no_gl=True,opts=None,video=False):
    ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2,reduced_motion='reduce' if no_gl else 'no-preference',**({'record_video_dir':str(OUT/'raw-video'),'record_video_size':{'width':width,'height':height}} if video else {}))
    if no_gl:ctx.add_init_script(NO_GL)
    page=ctx.new_page();page.route('https://**',lambda r:r.abort());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle');page.evaluate(SETUP,opts or {'jade':{'free':600,'paidTest':0}})
    return ctx,page,errors

def frame(locator,expected):
    value=locator.evaluate("el=>getComputedStyle(el,'::before').borderImageSource")
    assert expected in value,(expected,value)

def clickable(locator):
    locator.scroll_into_view_if_needed()
    hit=locator.evaluate('''el=>{const r=el.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{hit:el===h||el.contains(h),height:r.height,width:r.width,bottom:r.bottom}}''')
    assert hit['hit'] and hit['height']>=44 and hit['width']>=44,hit
    return hit

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    for label,port in ([] if gl_only else [('before',5174),('after',5173)]):
        ctx,page,errors=start(b,port=port)
        page.wait_for_timeout(600);page.screenshot(path=str(OUT/f'{label}-page.png'))
        page.get_by_role('button',name='選擇抽卡流派').click();page.screenshot(path=str(OUT/f'{label}-school.png'))
        page.keyboard.press('Escape');assert not errors;ctx.close()
    for width,height in ([] if gl_only else [(320,568),(390,844),(420,896)]):
        ctx,page,errors=start(b,width,height)
        frame(page.locator('.ink-codex-banners button').first,'frame-selected.webp')
        frame(page.locator('.ink-codex-pulls button').first,'frame-neutral.webp')
        for name in ['卡池詳情','選擇抽卡流派']:
            button=page.get_by_role('button',name=name,exact=True);clickable(button);button.click()
            frame(page.get_by_role('dialog'),'frame-panel.webp')
            if name=='選擇抽卡流派':
                choices=page.get_by_role('group',name='抽卡流派').get_by_role('button');assert choices.count()==6
                frame(choices.first,'frame-selected.webp');frame(choices.nth(1),'frame-neutral.webp')
                for i in range(6):clickable(choices.nth(i))
            page.get_by_role('dialog').get_by_role('button',name=re.compile('^關閉')).click()
        page.get_by_role('button',name=re.compile('本冊.*門')).click()
        assert page.locator('.ink-codex-catalog li').count()>=6;frame(page.locator('.ink-codex-catalog li').first,'frame-neutral.webp');page.keyboard.press('Escape')
        page.get_by_role('button',name=re.compile('^心願：')).click();frame(page.locator('.ink-codex-wish-options button').first,'frame-neutral.webp');page.locator('.ink-codex-wish-options button').first.click();frame(page.locator('.ink-codex-wish'),'frame-selected.webp')
        pull=page.get_by_role('button',name='抽十次',exact=False);hit=clickable(pull)
        if height>=844:assert hit['bottom']<height-100,hit
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'{width}-page.png'))
        expected=page.evaluate('''()=>{const m=structuredClone(window.qa.anc.getState().meta);const results=window.qa.g.pull(m,'jianghu',10);return{meta:m,results}}''')
        pull.evaluate('(el)=>{el.click();el.click()}')
        page.get_by_role('dialog').filter(has_text='已入家族收藏').wait_for();cards=page.locator('.ink-codex-fallback-cards button');assert cards.count()==10
        frame(cards.first,'frame-selected.webp');frame(cards.nth(1),'frame-neutral.webp')
        clickable(cards.nth(7));cards.nth(7).click();assert cards.nth(7).get_attribute('aria-pressed')=='true'
        page.screenshot(path=str(OUT/f'{width}-fallback.png'))
        done=page.get_by_role('button',name='完成入藏',exact=True);clickable(done);done.click()
        actual=page.evaluate('''()=>{const m=window.qa.anc.getState().meta;return{jade:m.jade,gacha:m.gacha,manuals:m.manuals,results:window.qa.anc.getState().lastPull}}''')
        for key in ['jade','gacha','manuals']:assert actual[key]==expected['meta'].get(key)
        assert actual['results']==expected['results']
        page.get_by_role('button',name=re.compile('上次入藏')).click();frame(page.locator('.ink-pull-card').first,'frame-neutral.webp');page.keyboard.press('Escape')
        page.get_by_role('button',name=re.compile('家族收藏')).click();assert page.locator('.ink-shelf-row').count()>0;frame(page.locator('.ink-shelf-row').first,'frame-neutral.webp')
        assert not errors,errors
        report['cases'].append({'width':width,'height':height,'portal_frames':True,'six_schools_touch':True,'wish':True,'cta_hit':hit,'fallback_selection':True,'last_results_collection':True,'core_match':True,'errors':errors})
        ctx.close();print(width,'PASS',flush=True)
    ctx,page,errors=start(b,no_gl=False,opts={'banner':'zhenben','premium':True,'n':10},video=True)
    page.get_by_role('tab',name='珍本奇功').click()
    page.get_by_role('button',name=re.compile('本冊.*門')).click()
    rare=page.locator('.ink-codex-catalog li[data-premium="1"]').first;frame(rare,'frame-rare.webp');page.screenshot(path=str(OUT/'rare-catalog.png'));page.keyboard.press('Escape')
    page.get_by_role('button',name='抽十次',exact=False).click()
    stage=page.locator('[data-subject="codex"]');stage.wait_for();skip=page.get_by_role('button',name='跳過 ›',exact=True);clickable(skip)
    page.locator('[data-subject="codex"][data-phase="settle"]').wait_for(timeout=30000)
    cards=stage.locator('[data-card]');assert cards.count()==10
    rare=stage.locator('[data-card][data-premium="1"]').first
    rare.click();frame(rare,'frame-selected.webp')
    frame(stage.locator('[data-premium="1"]').first,'frame-rare.webp')
    ordinary=stage.locator('[data-card]:not([data-premium])').first
    ordinary.click();frame(rare,'frame-rare.webp');frame(ordinary,'frame-selected.webp')
    assert ordinary.evaluate("el=>getComputedStyle(el).outlineWidth")=='0px'
    page.screenshot(path=str(OUT/'ten-mixed-result.png'))
    clickable(page.get_by_role('button',name='靜音',exact=True))
    clickable(page.get_by_role('button',name=re.compile('^馬上裝備')))
    done=page.get_by_role('button',name='完成入藏',exact=True);clickable(done);done.click();stage.wait_for(state='detached')
    assert not errors,errors
    video=page.video;ctx.close()
    import subprocess
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',video.path(),'-an','-vf','fps=20','-c:v','libx264','-crf','25','-pix_fmt','yuv420p',str(OUT/'ten-mixed.mp4')],check=True)
    report['webgl']={'ten_mixed':True,'rare_selected_frames':True,'mute_equip_done_touch':True,'errors':errors}
    b.close()
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',24)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
canvas=Image.new('RGB',(800,950),'#eee8dd');d=ImageDraw.Draw(canvas)
d.text((15,10),'秘笈閣 · 跟返第28項冊頁藝術框',font=font,fill='#302e27')
d.text((15,45),'390×844 DPR2 · seed42 · 免費600／付費0 · 左改前／右改後',font=small,fill='#57554b')
for i,label in enumerate(['before','after']):
    x=5+i*400;canvas.paste(Image.open(OUT/f'{label}-page.png').resize((390,844)),(x,90));d.rectangle((x+22,90+207,x+365,90+426),outline='#b74335',width=3);d.rectangle((x+22,90+580,x+365,90+719),outline='#b74335',width=3)
canvas.save(OUT/'comparison.jpg',quality=92)
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GACHA_FRAMES_PASS',flush=True)
