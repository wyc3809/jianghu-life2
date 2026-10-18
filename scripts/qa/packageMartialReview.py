"""實際畫面對比板／影片合成，唔改遊戲人物圖像。"""
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/martial-identities'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
def ff(args): subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *map(str,args)], check=True)

im = Image.new('RGB', (1260, 1490), '#f6f0e3')
draw = ImageDraw.Draw(im)
draw.text((24, 15), '長河拳：持劍舊動作 → 空手崩拳原型', font=ImageFont.truetype(FONT, 30), fill='#211e18')
draw.text((24, 62), 'seed42 · 390×844 · DPR2 · 同一核心戰報／接觸時刻', font=ImageFont.truetype(FONT, 20), fill='#655c4e')
for i, (file, title) in enumerate([('before-ea075.png', '改前 EA0.75.0'), ('art_river_fist.png', '改後：代表原型，待驗收')]):
    shot = Image.open(OUT / file).convert('RGB').resize((600, 1298), Image.Resampling.LANCZOS)
    x, y = 20 + i * 620, 160
    im.paste(shot, (x,y))
    draw.text((x,115),title,font=ImageFont.truetype(FONT,23),fill='#211e18')
    draw.rectangle((x+20,y+740,x+580,y+1015),outline='#bd382d',width=4)
im.save(OUT / 'comparison.jpg', quality=92)

groups = {
 'fists-blind': ['art_river_fist','sl_luohan_fist','pr_mountain_split'],
 'swords-blind': ['art_rain_sword','pr_wind_thread'],
 'internal-blind': ['art_iron_body','pr_diamond_body'],
 'steps-blind': ['qg_broken_bridge','pr_cloud_step'],
}
for name, ids in groups.items():
    inputs=[]
    for art in ids: inputs += ['-i', OUT / f'blind-{art}.mp4']
    stack=''.join(f'[{i}:v]' for i in range(len(ids))) + f'hstack=inputs={len(ids)}[v]'
    ff([*inputs,'-filter_complex',stack,'-map','[v]','-c:v','libx264','-pix_fmt','yuv420p','-crf','18',OUT/f'{name}.mp4'])
    ff(['-i',OUT/f'{name}.mp4','-filter_complex','fps=15,split[a][b];[a]palettegen[p];[b][p]paletteuse',OUT/f'{name}.gif'])
ff(['-i', OUT/'art_river_fist.mp4','-filter_complex','fps=12,scale=312:-2,split[a][b];[a]palettegen[p];[b][p]paletteuse',OUT/'river-normal.gif'])
ff(['-i', OUT/'art_river_fist-slow.mp4','-filter_complex','fps=12,scale=312:-2,split[a][b];[a]palettegen[p];[b][p]paletteuse',OUT/'river-slow.gif'])

normal = ['art_river_fist','sl_luohan_fist','pr_mountain_split','art_stone_palm','art_wind_chase','art_rain_sword',
          'pr_wind_thread','art_thunder_blade','art_spear_cloud','tm_flying_needle','art_weiqi_trap']
listing = OUT / 'reel-files.txt'
listing.write_text(''.join(f"file '{art}.mp4'\n" for art in normal))
ff(['-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',OUT/'normal-reel.mp4'])
print('已合成實際畫面對比、正常／慢速GIF及四組盲辨影片')
