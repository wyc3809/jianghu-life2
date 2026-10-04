"""用 NBP（Nano Banana Pro／Gemini 3 Pro Image）生成演武台角色剪影。

流程：
  1. 按下面 JOBS 嘅 prompt 呼叫 Gemini API 出圖（純白底、純黑剪影）
  2. 原圖存 assets/art-source/nbp/raw/<key>.png（唔部署，方便重做）
  3. 去白底 → 裁邊 → 腳底對齊放入 616×788 畫布 → 存 assets/art-source/nbp/out/<file>.webp
  4. 加 --apply 先會覆蓋遊戲用嘅 public/ink/spar/sil/<file>.webp（先睇清楚 out/ 先好 apply）

需要環境變數 GEMINI_API_KEY（喺雲端環境設定加，唔好貼入對話）。
用法：
  python3 scripts/art/gen_nbp_characters.py                 # 全部生成到 out/
  python3 scripts/art/gen_nbp_characters.py --only daoke    # 淨係一款
  python3 scripts/art/gen_nbp_characters.py --apply         # 生成後覆蓋遊戲素材
  python3 scripts/art/gen_nbp_characters.py --process-only  # 唔叫 API，只重新處理 raw/（例如你手動喺 NBP 網站出圖放入 raw/）
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'assets' / 'art-source' / 'nbp' / 'raw'
OUT = ROOT / 'assets' / 'art-source' / 'nbp' / 'out'
GAME = ROOT / 'public' / 'ink' / 'spar' / 'sil'

MODEL = os.environ.get('NBP_MODEL', 'gemini-3-pro-image-preview')
CANVAS = (616, 788)          # 同 src/spar/rig.ts SPAR_E 尺寸一致（腳底喺畫布底邊中間）
MARGIN_TOP = 0.05

COMMON = (
    'Full-body side-view silhouette of a Chinese wuxia martial artist for a 2D ink-wash game. '
    'Solid pure black shape (#000000) with NO interior detail, NO grey, NO outline colour. '
    'Pure white background (#FFFFFF). No ground line, no shadow, no mist, no ink splatter, no text, no seal. '
    'Clean crisp edge; weapon, hat, sleeves and hair clearly extend outside the body so the outline is readable. '
    'Entire figure in frame, feet touching the bottom margin, about 5% white margin on every side. Portrait 2:3.'
)

# key：剪影 key；file：遊戲檔名；facing：主角向右、敵人向左
JOBS: list[dict] = [
    {'key': 'hero-idle', 'file': 'hero-idle.webp', 'facing': 'right',
     'prompt': 'Young swordsman wearing a wide conical bamboo hat and a short cape, long straight sword held low and '
               'ready, relaxed guard stance, cape and sleeves drifting in wind.'},
    {'key': 'hero-attack', 'file': 'hero-attack.webp', 'facing': 'right',
     'prompt': 'The same young swordsman with conical bamboo hat mid-slash: lunging forward, sword swung far ahead at '
               'chest height, cape flaring behind, dynamic attack pose.'},
    {'key': 'daoke', 'file': 'enemy-daoke.webp', 'facing': 'left',
     'prompt': 'Black-clad bandit swordsman, headband with trailing ends, curved broad sabre raised, aggressive step.'},
    {'key': 'gouke', 'file': 'enemy-gouke.webp', 'facing': 'left',
     'prompt': 'Mountain bandit with twin hook swords, one raised one low, crouched wide stance, ragged vest.'},
    {'key': 'nvcike', 'file': 'enemy-nvcike.webp', 'facing': 'left',
     'prompt': 'Female assassin, high ponytail, face veil, slim fitted clothes, short dagger in reverse grip, light tiptoe.'},
    {'key': 'toutuo', 'file': 'enemy-toutuo.webp', 'facing': 'left',
     'prompt': 'Heavy-set wandering monk (toutuo) with hair band and prayer beads necklace, iron staff planted, bulky robe.'},
    {'key': 'tiemian', 'file': 'enemy-tiemian.webp', 'facing': 'left',
     'prompt': 'Tall imposing boss in an iron mask, long high-collared cloak, long straight blade held out, commanding stance.'},
    {'key': 'chifa', 'file': 'enemy-chifa.webp', 'facing': 'left',
     'prompt': 'Bandit chieftain with wild spiky flowing hair, twin axes, broad shoulders, aggressive forward lean.'},
    {'key': 'shadow', 'file': 'enemy-shadow.webp', 'facing': 'left',
     'prompt': 'Masked shadow assassin, cloak trailing to the ground, hands hidden in long sleeves, eerie still pose.'},
]


def build_prompt(job: dict) -> str:
    face = 'facing RIGHT (toward the right edge)' if job['facing'] == 'right' else 'facing LEFT (toward the left edge)'
    return f"{COMMON} The character is {face}. {job['prompt']}"


def call_nbp(prompt: str, api_key: str) -> bytes:
    """呼叫 Gemini generateContent，回傳第一張圖嘅 bytes"""
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'
    body = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '2:3'}},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read())
    for cand in data.get('candidates', []):
        for part in cand.get('content', {}).get('parts', []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data'):
                return base64.b64decode(inline['data'])
    raise RuntimeError(f'冇圖返嚟：{json.dumps(data)[:400]}')


def to_silhouette(raw: Image.Image) -> Image.Image:
    """白底黑影 → 透明底純黑剪影：亮度做 alpha、去雜點、裁邊、腳底對齊"""
    g = raw.convert('L')
    # 深色＝實心；中間灰做柔邊（避免鋸齒）
    alpha = g.point(lambda v: 255 if v < 70 else (0 if v > 200 else int((200 - v) / 130 * 255)))
    alpha = alpha.filter(ImageFilter.MedianFilter(3))
    bbox = alpha.point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bbox:
        raise RuntimeError('搵唔到剪影（圖可能唔係白底黑影）')
    alpha = alpha.crop(bbox)
    w, h = alpha.size
    cw, ch = CANVAS
    scale = min((ch * (1 - MARGIN_TOP)) / h, (cw * 0.96) / w)
    alpha = alpha.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    out = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    black = Image.new('RGBA', alpha.size, (12, 10, 8, 255))
    out.paste(black, ((cw - alpha.width) // 2, ch - alpha.height), alpha)   # 腳底貼畫布底
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='淨係做呢個 key（逗號分隔）')
    ap.add_argument('--apply', action='store_true', help='覆蓋 public/ink/spar/sil/ 遊戲素材')
    ap.add_argument('--process-only', action='store_true', help='唔叫 API，只處理 raw/ 入面現有圖')
    args = ap.parse_args()

    jobs = JOBS
    if args.only:
        keys = set(args.only.split(','))
        jobs = [j for j in JOBS if j['key'] in keys]
    RAW.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not args.process_only and not api_key:
        print('未設定 GEMINI_API_KEY：可以喺雲端環境設定加入，或者用 --process-only 處理手動放入 raw/ 嘅圖。')
        return 2

    for job in jobs:
        raw_path = RAW / f"{job['key']}.png"
        if not args.process_only:
            print(f"生成 {job['key']} …", flush=True)
            for attempt in range(3):
                try:
                    raw_path.write_bytes(call_nbp(build_prompt(job), api_key))
                    break
                except Exception as e:  # noqa: BLE001 — 網絡／配額錯誤重試
                    print(f'  失敗（{e}），{2 ** attempt * 5} 秒後再試')
                    time.sleep(2 ** attempt * 5)
            else:
                print(f"  放棄 {job['key']}")
                continue
        if not raw_path.exists():
            print(f"  raw/{job['key']}.png 唔存在，跳過")
            continue
        sil = to_silhouette(Image.open(io.BytesIO(raw_path.read_bytes())))
        out_path = OUT / job['file']
        sil.save(out_path, 'WEBP', quality=92, method=6)
        print(f'  → {out_path.relative_to(ROOT)}')
        if args.apply:
            sil.save(GAME / job['file'], 'WEBP', quality=92, method=6)
            print(f"  已覆蓋 public/ink/spar/sil/{job['file']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
