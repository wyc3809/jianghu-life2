"""將生成式原畫atlas裁成九宮格框WebP；只裁切／縮放／轉格式，唔重畫框。"""
from pathlib import Path
from PIL import Image
import argparse
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
NAMES = ['neutral', 'selected', 'panel', 'rare']


def prepare(source):
    """保留原始原畫，再輸出同一規格四種藝術框及來源記錄。"""
    art = ROOT / 'design/art/wuxia-frames'
    out = ROOT / 'public/ink/art/wuxia-frames'
    art.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    original = art / 'frame-atlas.png'
    if source.resolve() != original.resolve():
        shutil.copy2(source, original)
    atlas = Image.open(original).convert('RGBA')
    width, height = atlas.size
    assert width % 2 == 0 and height % 2 == 0
    entries = []
    for index, name in enumerate(NAMES):
        col, row = index % 2, index // 2
        box = (col * width // 2, row * height // 2, (col + 1) * width // 2, (row + 1) * height // 2)
        frame = atlas.crop(box).resize((512, 512), Image.Resampling.LANCZOS)
        target = out / f'frame-{name}.webp'
        frame.save(target, 'WEBP', quality=93, method=6)
        entries.append({'name': name, 'crop': box, 'size': [512, 512], 'slice': 128,
                        'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    manifest = {'source': 'frame-atlas.png', 'sourceSize': list(atlas.size),
                'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                'preparation': '只做2×2裁切、512px等比縮放、WebP編碼；無重畫或改色', 'frames': entries}
    (art / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'frames': len(entries), 'totalBytes': sum(e['bytes'] for e in entries)}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=ROOT / 'design/art/wuxia-frames/frame-atlas.png')
    prepare(parser.parse_args().source)
