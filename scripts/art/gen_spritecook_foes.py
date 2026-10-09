"""用 SpriteCook（MCP over HTTP）生成敵人圖鑑專屬剪影（第 20 項）。

流程：
  1. 按 JOBS 嘅 prompt 呼叫 SpriteCook generate_game_art（gpt-image-2 低質素，每張約 2 credits；純白底、純黑剪影）
  2. 原圖存 assets/art-source/spritecook/raw/<id>.webp（唔部署，方便重做）
  3. 去白底 → 裁邊 → 腳底對齊放入 616×788 畫布（同 gen_nbp_characters.to_silhouette）；面向右嘅圖會左右反轉
  4. 輸出 public/ink/spar/sil/enemy-<id>.webp，並更新 data/foes/sprites.json（有專屬剪影嘅 id＋紅眼位置）

需要環境變數 SPRITECOOK_API_KEY（喺雲端環境設定加，唔好寫入 repo）。
用法：
  python3 scripts/art/gen_spritecook_foes.py                  # 生成未有 raw 嘅
  python3 scripts/art/gen_spritecook_foes.py --only road_boss # 淨係一隻（會重新生成）
  python3 scripts/art/gen_spritecook_foes.py --process-only   # 唔叫 API，只處理 raw/
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_nbp_characters import CANVAS, to_silhouette  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'assets' / 'art-source' / 'spritecook' / 'raw'
GAME = ROOT / 'public' / 'ink' / 'spar' / 'sil'
MANIFEST = ROOT / 'data' / 'foes' / 'sprites.json'
API = os.environ.get('SPRITECOOK_API_URL', 'https://api.spritecook.ai/mcp/')

COMMON = (
    'Full-body side-view silhouette of a Chinese wuxia fighter for a 2D ink-wash mobile game, facing LEFT. '
    'Solid pure black shape (#000000), NO interior detail, NO grey. Pure white background. '
    'No ground, no shadow, no mist, no ink splatter, no text. Clean crisp edge. '
    'Weapon, hair, hat and clothing clearly extend outside the body outline. Entire figure in frame with 5% margin. '
)

# id 同 data/foes/roster.ts 一致；flip＝出咗面向右嘅圖要反轉
JOBS: list[dict] = [
    {'id': 'town_boss', 'prompt': 'Huge bare-chested town tyrant with a big round belly and iron-shirt muscles, shaved head with topknot, fists on hips, heavy wide stance, boss scale.'},
    {'id': 'town_guard', 'prompt': 'Stocky manor bodyguard with rolled sleeves and thick arms, short iron club in hand, headband, wide guarding stance.'},
    {'id': 'town_bruiser', 'prompt': 'Street enforcer in an open vest, chain wrapped around one fist, short sabre in the other hand, swaggering stance.'},
    {'id': 'road_boss', 'prompt': 'Bandit chieftain with wild spiky long hair flowing back, fur-trimmed vest, huge broadsword over the shoulder, tattered cape, heavy wide stance, boss scale.'},
    {'id': 'road_brute', 'prompt': 'Giant mountain brute with a huge two-handed axe raised high, bare arms, fur shawl, stomping forward.'},
    {'id': 'road_captain', 'prompt': 'Bandit captain with a red headband trailing in wind, curved dao sabre held low, short cape, aggressive crouch.'},
    {'id': 'bamboo_boss', 'prompt': 'Sinister sect master in a hooded long robe with wide sleeves, a long thin blood-drinking sword held behind, bamboo hat with veil, eerie still pose, boss scale.'},
    {'id': 'bamboo_bloodguard', 'prompt': 'Masked blood guard with a crescent-blade polearm, layered robe, long hair tied back, lunging guard.'},
    {'id': 'bamboo_bloodmaid', 'prompt': 'Female assassin with long flowing ribbon sleeves and twin short daggers, high bun with hairpins, light tiptoe stance.'},
    {'id': 'inn_boss', 'prompt': 'Iron-masked assassin lord in a long rain cloak with a high collar, conical bamboo hat, twin long blades crossed, afterimage feeling, boss scale.'},
    {'id': 'inn_twin', 'prompt': 'Slim female night assassin with a face veil and a short cloak, twin daggers in reverse grip, mid-leap pose.'},
    {'id': 'inn_blades', 'prompt': 'Night guard with two hook swords spread wide, straw raincoat, low conical hat, low crouch.'},
    {'id': 'gate_boss', 'prompt': 'Massive demon-faced warrior monk with a horned ghost mask, prayer bead necklace, heavy iron monk spade staff, kasaya robe, towering boss scale.'},
    {'id': 'gate_vajra', 'prompt': 'Bronze-skinned guardian monk, bald, bare muscular torso, prayer beads, huge vajra club planted on the ground, firm stance.'},
    {'id': 'gate_ironbone', 'prompt': 'Lean temple soldier monk with a long iron staff held across the body, robe tied at waist, ready stance.'},
    {'id': 'peak_boss', 'prompt': 'Black-wind fortress lord with a lion-mane hair and beard, heavy armor with fur collar, giant guandao halberd, cape billowing, roaring stance, boss scale.'},
    {'id': 'peak_berserk', 'prompt': 'Berserker raider with wild hair, bandaged arms, a large jagged sabre swung back, hunched forward charging pose.'},
    {'id': 'peak_vanguard', 'prompt': 'Fortress vanguard with a wolf-head hood and fur cloak, long spear thrust forward, wide lunging stance.'},
]


def call(name: str, args: dict, key: str) -> dict:
    body = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call', 'params': {'name': name, 'arguments': args}}
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode(),
        headers={
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=240) as resp:
        data = json.loads(resp.read())
    if 'error' in data:
        raise RuntimeError(json.dumps(data['error'])[:400])
    res = data['result']
    return res.get('structuredContent') or json.loads(res['content'][0]['text'])


def generate(job: dict, key: str) -> bytes:
    out = call(
        'generate_game_art',
        {
            'prompt': COMMON + job['prompt'],
            'pixel': False,
            'bg_mode': 'white',
            'aspect_ratio': '9:16',
            'width': 512,
            'height': 512,
            'model': 'gpt-image-2',
            'quality': 'low',
            'resolution': '1K',
            'smart_crop': False,
            'variations': 1,
            'wait_seconds': 90,
        },
        key,
    )
    for _ in range(30):
        if out.get('status') == 'succeeded' and out.get('assets'):
            url = out['assets'][0]['url']
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        if out.get('status') in ('failed', 'cancelled'):
            raise RuntimeError(f"job {out.get('status')}: {json.dumps(out)[:300]}")
        time.sleep(6)
        out = call('check_job_status', {'job_id': out['job_id']}, key)
    raise RuntimeError('等太耐')


def eye_point(sil: Image.Image) -> dict:
    """紅眼位置（相對腳底錨點，設計單位）：頭頂以下約 9% 高、該行實心部分偏左（面向左）"""
    a = sil.getchannel('A')
    w, h = a.size
    bbox = a.point(lambda v: 255 if v > 128 else 0).getbbox()
    top = bbox[1] if bbox else 0
    y = int(top + (h - top) * 0.09)
    row = [x for x in range(w) if a.getpixel((x, y)) > 128]
    x = (row[0] + (row[-1] - row[0]) * 0.35) if row else w / 2
    return {'x': round(x - w / 2), 'y': round(y - h)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='淨係做呢啲 id（逗號分隔，會重新生成）')
    ap.add_argument('--process-only', action='store_true')
    ap.add_argument('--flip', default='', help='要左右反轉嘅 id（逗號分隔；出咗面向右嘅圖）')
    args = ap.parse_args()
    key = os.environ.get('SPRITECOOK_API_KEY', '')
    if not args.process_only and not key:
        print('未設定 SPRITECOOK_API_KEY')
        return 2
    only = set(args.only.split(',')) if args.only else None
    flips = set(filter(None, args.flip.split(',')))
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for job in JOBS:
        if only and job['id'] not in only:
            continue
        raw = RAW / f"{job['id']}.webp"
        if not args.process_only and (only or not raw.exists()):
            print(f"生成 {job['id']} …", flush=True)
            try:
                Image.open(io.BytesIO(generate(job, key))).convert('RGB').save(raw, 'WEBP', quality=90, method=6)
            except Exception as e:  # noqa: BLE001
                print(f'  失敗：{e}')
                continue
        if not raw.exists():
            continue
        sil = to_silhouette(Image.open(io.BytesIO(raw.read_bytes())))
        flip = job['id'] in flips or manifest.get(job['id'], {}).get('flip', False)
        if flip:
            sil = sil.transpose(Image.FLIP_LEFT_RIGHT)
        sil.save(GAME / f"enemy-{job['id']}.webp", 'WEBP', quality=92, method=6)
        manifest[job['id']] = {'w': CANVAS[0], 'h': CANVAS[1], 'eye': eye_point(sil), 'flip': flip}
        print(f"  → public/ink/spar/sil/enemy-{job['id']}.webp")
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
