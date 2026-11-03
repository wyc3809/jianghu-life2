"""由真App截圖製作同倍率接點對照；不產生或修飾動畫幀。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/spine-neck-v02'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'


def package():
    """保留相同裁切／縮放，以原檔hash記錄來源及輸出。"""
    if '--encode' in sys.argv:
        source = str(OUT / 'neck-closeup.webm')
        base = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1.7', '-i', source]
        subprocess.run(base + ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUT / 'neck-closeup.mp4')], check=True)
        filters = 'fps=10,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none'
        subprocess.run(base + ['-vf', filters, '-loop', '0', str(OUT / 'neck-closeup.gif')], check=True)
    board = Image.new('RGB', (1120, 820), '#f1e8d7')
    draw = ImageDraw.Draw(board)
    font = ImageFont.truetype(FONT, 29, index=3)
    small = ImageFont.truetype(FONT, 21, index=3)
    draw.text((25, 15), '受擊 0.19秒 · 同一App鏡頭及同倍率裁切', font=font, fill='#292522')
    sources = [ROOT / 'production/qa/evidence/redesign/spine-character/app-hurt.png', OUT / 'right-hurt.png']
    # 截圖均780×1688；相同區域裁切，沒有分開縮放頭部。
    crop = (150, 280, 610, 850)
    for x, source, title in zip([20, 575], sources, ['v01 · 玩家已否決', 'v02 · 接點修正待評閱']):
        draw.text((x, 65), title, font=font, fill='#8e3b32')
        frame = Image.open(source).convert('RGB').crop(crop)
        board.paste(frame, (x, 115))
        draw.rectangle((x+150, 275, x+305, 385), outline='#a33e31', width=4)
    draw.text((25, 715), '頭／頸與胸口原為兩個表面 → 同一連續蒙皮', font=font, fill='#292522')
    draw.text((25, 765), '只作接點比較；請連同即時影片評閱動作。未上線、未作真機驗收。', font=small, fill='#655c50')
    board.save(OUT / 'before-after.png')
    installation = ROOT / 'design/art/spine-character/installation.json'
    info = json.loads(installation.read_text())
    info.update(rigRevision='v02-continuous-upper-body', activeWeightedMeshes=6, animationPlayerAccepted=False, headNeckPlayerAccepted=False)
    installation.write_text(json.dumps(info, ensure_ascii=False, indent=2)+'\n')
    paths = [p for p in OUT.iterdir() if p.is_file() and p.name != 'source-manifest.json']
    paths += [ROOT/'design/art/spine-character/sources/upper-body-v02.png', ROOT/'design/art/spine-character/parts/upper-body.png', *sources[:1]]
    manifest = {
        'date': '2026-11-03',
        'recording': '真App官方Runtime即時播放，整體鏡頭近鏡，非逐幀合成',
        'sourceImage': 'exec-9c066018-1fdb-4ebf-854d-e6597115ba1b.png',
        'playerAccepted': False, 'deployed': False, 'actualIphone': False,
        'files': {str(p.relative_to(ROOT)): {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(paths)}
    }
    (OUT/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    package()
