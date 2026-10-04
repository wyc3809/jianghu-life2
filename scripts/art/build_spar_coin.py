"""演武台首領掉落銅錢（位圖，唔用 SVG）：古銅圓錢＋方孔＋墨邊。
輸出 public/ink/spar/fx-coin.webp（128×128，透明底）。AI 圖可以同名同尺寸直接替換。
用法：python3 scripts/art/build_spar_coin.py
"""
from PIL import Image, ImageDraw, ImageFilter

S = 512  # 先畫大再縮，邊緣順滑
OUT = 'public/ink/spar/fx-coin.webp'

img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
c = S // 2
R = int(S * 0.46)
# 墨邊
d.ellipse([c - R, c - R, c + R, c + R], fill=(34, 26, 18, 255))
# 銅身（由外到內漸亮）
for i in range(40):
    r = int(R * 0.93) - i * 3
    t = i / 40
    col = (int(176 + 60 * t), int(128 + 70 * t), int(52 + 40 * t), 255)
    d.ellipse([c - r, c - r, c + r, c + r], fill=col)
# 內圈凸邊
ri = int(R * 0.58)
d.ellipse([c - ri, c - ri, c + ri, c + ri], outline=(120, 82, 34, 255), width=10)
# 方孔
h = int(R * 0.22)
d.rectangle([c - h - 10, c - h - 10, c + h + 10, c + h + 10], fill=(120, 82, 34, 255))
d.rectangle([c - h, c - h, c + h, c + h], fill=(0, 0, 0, 0))
# 四個筆劃字位（抽象墨點，代表錢文）
for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
    x = c + dx * int(R * 0.4)
    y = c + dy * int(R * 0.4)
    w = int(R * 0.09)
    d.rounded_rectangle([x - w, y - w, x + w, y + w], radius=w // 2, fill=(110, 70, 26, 230))
# 高光
hl = Image.new('RGBA', (S, S), (0, 0, 0, 0))
hd = ImageDraw.Draw(hl)
hd.ellipse([c - R * 0.8, c - R * 0.85, c + R * 0.1, c - R * 0.15], fill=(255, 240, 200, 90))
hl = hl.filter(ImageFilter.GaussianBlur(18))
img = Image.alpha_composite(img, hl)
img = img.resize((128, 128), Image.LANCZOS)
img.save(OUT, 'WEBP', quality=90, method=6)
print('wrote', OUT)
