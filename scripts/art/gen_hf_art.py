"""用 Hugging Face（FLUX.1-schnell Space，免費帳戶額度）生成方向 B 美術素材（立繪、場景、UI）。

風格：design/art/art-direction-b.md（古風寫實，參考《九陰真經 Online》）。
需要環境變數 HF_TOKEN（Hugging Face 免費帳戶嘅 Read token；喺雲端環境設定加，唔好寫入 repo）。

流程：
  1. 按 JOBS 嘅 prompt 呼叫 Space 嘅 gradio API（/gradio_api/call/infer）
  2. 原圖存 assets/art-source/hf/raw/<key>.webp（唔部署，方便重做）
  3. 主畫面樣板等用法由之後嘅步驟處理（去背、裁切、接入）

用法：
  python3 scripts/art/gen_hf_art.py                    # 生成未有 raw 嘅
  python3 scripts/art/gen_hf_art.py --only hero-male   # 淨係一張（會重新生成）
  python3 scripts/art/gen_hf_art.py --seed 11          # 換 seed 再試
免費額度用完會報錯；隔日再跑會由未完成嗰張繼續。
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'assets' / 'art-source' / 'hf' / 'raw'
SPACE = os.environ.get('HF_SPACE', 'https://black-forest-labs-flux-1-schnell.hf.space')

STYLE = (
    'semi-realistic Chinese wuxia game art, painterly digital painting in the style of Age of Wushu key art, '
    'muted earthy palette with bronze and cinnabar accents, soft rim light, high detail, no text, no watermark, no logo'
)

# key：檔名；w／h：輸出尺寸（FLUX schnell 上限 2048，要 32 嘅倍數）
JOBS: list[dict] = [
    # 主角立繪（主畫面、人物頁）
    {'key': 'hero-male', 'w': 832, 'h': 1248,
     'prompt': 'full body young male swordsman standing, layered dark blue and bronze hanfu robe with leather bracers, '
               'long hair tied with a ribbon, straight jian sword at his side, calm determined expression, plain light grey background'},
    {'key': 'hero-female', 'w': 832, 'h': 1248,
     'prompt': 'full body young female swordswoman standing, layered pale jade and cream hanfu with embroidered sash, '
               'hair in a high bun with a silver hairpin, slender sword held low, composed expression, plain light grey background'},
    # 主畫面場景（千燈鎮水鄉）
    {'key': 'scene-town', 'w': 768, 'h': 1344,
     'prompt': 'vertical scene of a misty Jiangnan water town at dusk, stone arch bridge, paper lanterns, wooden houses with curved roofs, '
               'boats on the canal, layered ink-wash mountains in the distance, atmospheric depth, empty foreground street for characters'},
    # UI kit 參考（之後裁切成九宮格框）
    {'key': 'ui-panel', 'w': 1024, 'h': 1024,
     'prompt': 'game UI panel frame, dark lacquered wood board with ornate antique bronze cloud-pattern corner pieces and thin gold border lines, '
               'empty center, front view, flat, isolated on plain black background'},
    {'key': 'ui-buttons', 'w': 1024, 'h': 1024,
     'prompt': 'game UI button set sheet, three horizontal buttons: cinnabar red lacquer with bronze rim, jade teal lacquer with bronze rim, '
               'dark wood with bronze rim, empty labels, front view, flat, evenly spaced, isolated on plain black background'},
]


def call_space(prompt: str, w: int, h: int, seed: int, token: str) -> bytes:
    """gradio：POST 開 job → GET 讀 SSE 結果 → 下載圖"""
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    body = json.dumps({'data': [prompt, seed, False, w, h, 4]}).encode()
    req = urllib.request.Request(f'{SPACE}/gradio_api/call/infer', data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        event_id = json.loads(r.read())['event_id']
    req = urllib.request.Request(f'{SPACE}/gradio_api/call/infer/{event_id}', headers=headers)
    with urllib.request.urlopen(req, timeout=300) as r:
        stream = r.read().decode()
    event = None
    for line in stream.splitlines():
        if line.startswith('event:'):
            event = line.split(':', 1)[1].strip()
        elif line.startswith('data:') and event == 'complete':
            data = json.loads(line.split(':', 1)[1])
            img = data[0]
            url = img.get('url') if isinstance(img, dict) else None
            if not url:
                raise RuntimeError(f'冇圖網址：{str(data)[:200]}')
            req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        elif line.startswith('data:') and event == 'error':
            raise RuntimeError(f'Space 報錯（可能係額度用完或者要登入）：{line[5:].strip()[:200]}')
    raise RuntimeError(f'冇完成事件：{stream[:200]}')


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='淨係做呢啲 key（逗號分隔，會重新生成）')
    ap.add_argument('--seed', type=int, default=7)
    args = ap.parse_args()
    token = os.environ.get('HF_TOKEN', '')
    if not token:
        print('未設定 HF_TOKEN：喺雲端環境設定加 Hugging Face Read token，再開新 session。')
        return 2
    only = set(args.only.split(',')) if args.only else None
    RAW.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        if only and job['key'] not in only:
            continue
        out = RAW / f"{job['key']}.webp"
        if out.exists() and not only:
            continue
        print(f"生成 {job['key']} …", flush=True)
        try:
            data = call_space(f"{STYLE}, {job['prompt']}", job['w'], job['h'], args.seed, token)
        except Exception as e:  # noqa: BLE001 — 額度／網絡錯誤：停低，下次再跑
            print(f'  失敗：{e}')
            return 1
        Image.open(io.BytesIO(data)).convert('RGB').save(out, 'WEBP', quality=90, method=6)
        print(f'  → {out.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
