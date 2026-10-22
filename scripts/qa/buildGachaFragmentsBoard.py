"""用真實瀏覽器截圖整前後對照，保留原圖。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/gacha-fragments'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
title_font = ImageFont.truetype(FONT, 23)
label_font = ImageFont.truetype(FONT, 15)

def board(title, context, entries, name, highlight=False):
    img = Image.new('RGB', (828, 940), '#f5efdf')
    draw = ImageDraw.Draw(img)
    draw.text((18, 10), title, font=title_font, fill='#302d28')
    draw.text((18, 43), context, font=label_font, fill='#63594c')
    for x, source, label in entries:
        draw.text((x, 70), label, font=label_font, fill='#912f29')
        img.paste(Image.open(OUT / source).convert('RGB').resize((390, 844)), (x, 96))
    if highlight:
        draw.rectangle((450, 462, 784, 611), outline='#c22e27', width=3)
    img.save(OUT / name)

board('抽取機率調整：20%武功／80%書頁', 'seed 42｜390×844・DPR 2｜免費玉石600／付費0', [(16, 'before-rules.png', '之前：每抽都出武功'), (422, 'rules.png', '之後：書頁、入帳及保底規則')], 'comparison.png', True)
board('真實抽取結果：書頁同武功分開顯示', '左：單抽書頁＋5｜右：十連2份武功＋40頁', [(16, 'single-pages.png', '單抽'), (422, 'mixed-ten.png', '十連')], 'results-board.png')
