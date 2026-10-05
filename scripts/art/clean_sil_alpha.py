"""清走剪影 WebP 透明位入面嘅「假透明格仔紋」（AI 出圖殘留嘅棋盤雜點）。
做法：實心位（alpha ≥ 130）先剷走細碎獨立墨點（面積 < MIN_AREA），
再向外擴 2px 當保留區，保留區內留原 alpha（柔邊），區外一律透明。
用法：python3 scripts/art/clean_sil_alpha.py [檔案…]（預設處理 public/ink/spar/sil/enemy-*.webp）
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

MIN_AREA = 600  # 少過呢個像素數嘅獨立墨塊當雜點

ROOT = Path(__file__).resolve().parents[2]


def clean(path: Path) -> tuple[float, float]:
    im = Image.open(path).convert('RGBA')
    arr = np.array(im)
    a = arr[..., 3]
    before = float(((a > 0) & (a < 130)).mean())
    solid_mask = a >= 130
    labels, n = ndimage.label(solid_mask)
    if n:
        sizes = ndimage.sum(solid_mask, labels, range(1, n + 1))
        keep_ids = {i + 1 for i, sz in enumerate(sizes) if sz >= MIN_AREA}
        solid_mask = np.isin(labels, list(keep_ids))
    solid = Image.fromarray((solid_mask * 255).astype('uint8'))
    keep = np.array(solid.filter(ImageFilter.MaxFilter(5))) > 0
    arr[..., 3] = np.where(keep, a, 0)
    Image.fromarray(arr).save(path, 'WEBP', quality=92, method=6)
    after = float(((arr[..., 3] > 0) & (arr[..., 3] < 130)).mean())
    return before, after


if __name__ == '__main__':
    files = [Path(p) for p in sys.argv[1:]] or sorted((ROOT / 'public/ink/spar/sil').glob('enemy-*.webp'))
    for f in files:
        b, a = clean(f)
        print(f'{f.name}: 半透明雜點 {b:.3f} → {a:.3f}')
