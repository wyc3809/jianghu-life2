"""真正遊戲截圖嘅對照板／GIF；唔補畫遊戲內容。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/spar-commercial'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
title = ImageFont.truetype(FONT, 28)
small = ImageFont.truetype(FONT, 19)

def pic(p):
    return Image.open(OUT / p).convert('RGB')

before = pic('before-chromium/spring-stage.png')
after = pic('after-chromium/spring-stage.png')
w, h = after.size
before = before.resize((w, h))
board = Image.new('RGB', (w * 2 + 60, h + 120), '#f3ecdf')
d = ImageDraw.Draw(board)
d.text((18, 10), '改前：地面欠清楚', font=title, fill='#292a27')
d.text((w + 44, 10), '改後：AI四季石台＋貼地角色', font=title, fill='#292a27')
board.paste(before, (15, 55)); board.paste(after, (w + 45, 55))
for x in [15, w + 45]:
    d.rectangle((x + 2, 55 + int(h * .68), x + w - 3, 55 + h - 3), outline='#ae3029', width=4)
d.text((18, h + 68), '實際Canvas截圖；戰鬥持續推進，敵人／氣血可能不同。', font=small, fill='#56524b')
board.save(OUT / 'comparison.png')

board = Image.new('RGB', (w * 2 + 45, (h + 54) * 2 + 15), '#f3ecdf')
d = ImageDraw.Draw(board)
for i, (season, label) in enumerate([('spring', '春 · 桃花與山霧'), ('summer', '夏 · 青霧雨絲與濕石'), ('autumn', '秋 · 楓葉與暖灰山色'), ('winter', '冬 · 飄雪與積雪石台')]):
    x = 15 + i % 2 * (w + 15); y = i // 2 * (h + 54)
    d.text((x, y + 7), label, font=title, fill='#292a27')
    board.paste(pic(f'after-chromium/{season}-stage.png'), (x, y + 47))
board.save(OUT / 'four-seasons.png')

def gif(folder, pattern, name, duration, repeat_last=0):
    frames=[Image.open(p).convert('RGB') for p in sorted((OUT/folder).glob(pattern))]
    frames=[im.resize((536, round(im.height * 536 / im.width)), Image.Resampling.LANCZOS) for im in frames]
    if not frames:
        raise ValueError('冇真實动画截幀')
    frames += [frames[-1]] * repeat_last
    # 同一色盤，避免靜止場景色彩隨幀閃爍。
    palette = frames[0].quantize(colors=256)
    quantized=[im.quantize(palette=palette) for im in frames]
    quantized[0].save(OUT/name,save_all=True,append_images=quantized[1:],duration=duration,loop=0,disposal=2)

gif('motion/frames','walk-*.png','walking.gif',40,8)
gif('motion/frames','fall-*.png','defeat-slow.gif',78,12)
gif('after-chromium/frames','fight-*.png','combat.gif',120,5)
print('已建立真正畫面對照、四季板及步行／倒地（2倍慢播）／交手GIF。')
