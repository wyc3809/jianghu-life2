"""只做AI圖集裁格、腳底錨點及WebP輸出；唔畫角色、特效或景物。"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/art/spar-commercial/source'
OUT = ROOT / 'public/ink/spar/commercial'
OUT.mkdir(parents=True, exist_ok=True)

def save(im, name):
    im.save(OUT / f'{name}.webp', quality=92, method=4)

def box(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()

def align(cell, scale, width):
    bbox = box(cell)
    if bbox is None:
        raise ValueError('AI動作格冇角色')
    cell = cell.crop(bbox)
    cell = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.Resampling.LANCZOS)
    if cell.width > width or cell.height > 788:
        raise ValueError('動作超出錨點圖幅，需重新檢視原圖')
    frame = Image.new('RGBA', (width, 800))
    frame.alpha_composite(cell, ((width - cell.width) // 2, 788 - cell.height))
    return frame

im = Image.open(SOURCE / 'season.webp')
for i, season in enumerate(['spring', 'summer', 'autumn', 'winter']):
    x, y = i % 2, i // 2
    cell = im.crop((round(im.width*x/2), round(im.height*y/2), round(im.width*(x+1)/2), round(im.height*(y+1)/2)))
    save(cell.resize((1000, 500), Image.Resampling.LANCZOS), f'season-{season}')

im = Image.open(SOURCE / 'effects.webp')
for i, name in enumerate(['step-dust', 'land-dust', 'slash', 'impact', 'petal', 'rain', 'leaf', 'snow']):
    x, y = i % 4, i // 4
    cell = im.crop((round(im.width*x/4), round(im.height*y/2), round(im.width*(x+1)/4), round(im.height*(y+1)/2)))
    save(cell.resize((320, 320), Image.Resampling.LANCZOS), name)

im = Image.open(SOURCE / 'hero-motion.webp')
walk = [im.crop((round(im.width*i/4), 0, round(im.width*(i+1)/4), 495)) for i in range(4)]
scale = 788 / max(box(c)[3] - box(c)[1] for c in walk)
for i, cell in enumerate(walk):
    save(align(cell, scale, 900), f'hero-walk-{i}')
for i in range(4):
    cell = im.crop((round(im.width*i/4), 495, round(im.width*(i+1)/4), im.height))
    save(align(cell, scale, 900), f'hero-down-{i}')

im = Image.open(SOURCE / 'support.webp')
save(im.crop((0, 0, 1215, im.height)).resize((720, 360), Image.Resampling.LANCZOS), 'mist')
save(im.crop((1215, 0, im.width, im.height)).resize((420, 240), Image.Resampling.LANCZOS), 'shadow')

for atlas in json.loads((SOURCE.parent / 'atlas.json').read_text()):
    im = Image.open(SOURCE / atlas['source'])
    for row, character in enumerate(atlas['characters']):
        cells = [im.crop((round(im.width*i/4), atlas['rowCuts'][row], round(im.width*(i+1)/4), atlas['rowCuts'][row+1])) for i in range(4)]
        scale = 788 / max(box(c)[3] - box(c)[1] for c in cells)
        for i, cell in enumerate(cells):
            save(align(cell, scale, 1800).resize((540, 240), Image.Resampling.LANCZOS), f'enemy-{character}-down-{i}')
print('AI素材準備完成；原圖、構圖及身體動作由AI生成，腳底統一788du。')
