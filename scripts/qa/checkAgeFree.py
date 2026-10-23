"""取消年齡：隔離本機存檔、手機畫面及真實跨年操作。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/remove-age'
OUT.mkdir(parents=True, exist_ok=True)
SETUP = (ROOT / 'scripts/qa/gachaCodexSetup.js').read_text().replace(
    "await import('/src/store/ancestryStore.ts')",
    "await import((await(await fetch('/src/main.tsx')).text()).match(/from [\"']([^\"']*store\\/ancestryStore\\.ts[^\"']*)[\"']/)[1])")
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, reduced_motion='reduce')
    context.route('**/*.supabase.co/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:5173/', wait_until='domcontentloaded')
    page.wait_for_timeout(1300)
    page.evaluate(SETUP, {'jade': {'free': 600, 'paidTest': 0}})

    def dock(label):
        page.get_by_role('navigation', name='分卷').get_by_role('button', name=label, exact=True).click()

    def shot(name):
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / name))

    dock('鎮居')
    assert page.locator('.ink-hud-avatar-lv').count() == 0
    assert '歲' not in page.locator('.ink-hud').inner_text()
    shot('after-home.png')
    dock('人物')
    assert '歲' not in page.locator('.ink-play-body').inner_text()
    shot('after-person.png')
    dock('江湖')
    shot('after-map.png')
    page.get_by_role('button', name='開宗立派', exact=True).click()
    assert '年歲' not in page.locator('.ink-play-body').inner_text()
    shot('founder-gate.png')
    page.get_by_role('button', name='‹ 返回江湖', exact=True).click()
    page.get_by_role('button', name='華山論劍', exact=True).click()
    assert '歲' not in page.locator('.ink-play-body').inner_text()
    shot('huashan-gate.png')
    # 透過實際 store 過月跨年，舊存檔年齡保持而曆法前進。
    page.evaluate("""() => { const l=window.qa.life,s=structuredClone(l.getState().state);
      s.character.age=92;s.month=12;s.pending=null;s.pendingCombat=null;s.moments=[];s.tab='home';
      l.setState({state:s,lastResult:null});l.getState().advanceMonth(); }""")
    calendar = page.evaluate('(()=>{const s=window.qa.life.getState().state;return {year:s.year,month:s.month,legacyAge:s.character.age}})()')
    assert calendar == {'year': 19, 'month': 1, 'legacyAge': 92}, calendar
    # 固定事件核對標頭、真正日期及可操作選項。
    page.evaluate("""() => { const l=window.qa.life,s=structuredClone(l.getState().state);
      s.pending={eventId:'event_083',year:s.year,month:s.month,kind:'special'};s.pendingCombat=null;s.moments=[];
      l.setState({state:s,lastResult:null,sealText:null}); }""")
    page.locator('.ink-event-year').wait_for()
    assert page.locator('.ink-event-year').inner_text().startswith('19年1月')
    assert '歲' not in page.locator('.ink-event-year').inner_text()
    shot('after-event.png')
    phones = []
    for width, height in [(320, 568), (390, 844), (420, 896)]:
        page.set_viewport_size({'width': width, 'height': height})
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        shot(f'event-{width}-{height}.png')
        phones.append([width, height])
    # 由核心產生的新總結不帶享年；祖蔭仍只結算一次。
    page.set_viewport_size({'width': 390, 'height': 844})
    page.evaluate("""async () => { const {buildLifeSummary}=await import('/core/life/summary.ts');
      const l=window.qa.life,s=structuredClone(l.getState().state);s.pending=null;s.pendingCombat=null;
      s.character.alive=false;s.phase='summary';s.summaryText=buildLifeSummary(s);s.moments=[];
      l.setState({state:s,lastResult:null,sealText:null}); }""")
    page.locator('.ink-epitaph-text').wait_for()
    assert '享年' not in page.locator('.ink-epitaph-text').inner_text()
    shot('after-summary.png')
    assert not errors, errors
    (OUT / 'browser.json').write_text(json.dumps({'seed': 42, 'jade': {'free': 600, 'paidTest': 0},
        'dpr': 2, 'phones': phones, 'calendar_after_store_advance': calendar,
        'age_badge_removed': True, 'person_and_gates': True, 'event_date_kept': True,
        'new_summary_has_no_age': True, 'pageerrors': errors}, ensure_ascii=False, indent=2) + '\n')
    browser.close()

font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 20)
for scene in ['home', 'person']:
    board = Image.new('RGB', (800, 950), '#f3ebdc')
    draw = ImageDraw.Draw(board)
    draw.text((12, 8), '取消歲數｜390×844 DPR2 · seed42 · 玉石600／0', font=font, fill='#332e28')
    for i, label in enumerate(['改前：顯示人物年齡', '改後：保留曆法，取消歲數']):
        x = i * 400 + 5
        draw.text((x + 8, 42), label, font=font, fill='#332e28')
        board.paste(Image.open(OUT / f'{"before" if i == 0 else "after"}-{scene}.png').convert('RGB').resize((390, 844)), (x, 83))
        draw.rectangle((x + 8, 83 + 20, x + 375, 83 + 180), outline='#b74335', width=2)
    board.save(OUT / f'comparison-{scene}.png')
print('AGE_FREE_BROWSER_PASS')
