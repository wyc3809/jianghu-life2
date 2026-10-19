"""原版獨立工作區與原型使用相同seed／餘額／手機尺寸，唔用概念圖。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/gacha-codex';SETUP=(ROOT/'scripts/qa/gachaCodexSetup.js').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for name,port in [('before',5174),('after',5173)]:
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=c.new_page();page.route('https://**',lambda r:r.abort());page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle');page.evaluate(SETUP,{'jade':{'free':600,'paidTest':0}});page.evaluate('document.fonts.ready');page.wait_for_timeout(1200)
  page.screenshot(path=str(OUT/f'{name}-page.png'));c.close()
 b.close()
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18);small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14)
board=Image.new('RGB',(820,920),'#f8f2e6');d=ImageDraw.Draw(board)
for i,(name,title) in enumerate([('before','改前 EA0.76.0：抽取按鈕需捲動'),('after','改後原型：線裝啟封／主操作同屏')]):
 im=Image.open(OUT/f'{name}-page.png').convert('RGB');im.thumbnail((390,844));board.paste(im,(i*410+10,40));d.text((i*410+10,8),title,font=font,fill='#354539')
d.rectangle((425,222,803,759),outline='#ac4135',width=3);d.text((12,894),'同一seed42、390×844、DPR2；免費玉石600、付費玉石0；原版da52e1f獨立工作區實際畫面',font=small,fill='#655e4b');board.save(OUT/'comparison.jpg',quality=93)
(OUT/'comparison-scenario.json').write_text(json.dumps({'before':'da52e1f','after':'work/gacha-codex-polish','seed':42,'viewport':[390,844],'dpr':2,'jade':{'free':600,'paidTest':0}},indent=2))
