"""只裁切、校正腳底及壓縮生成原圖；唔繪製人物。重跑：python scripts/art/prepare_martial_identities.py"""
from pathlib import Path
import json
import hashlib
from PIL import Image
import numpy as np
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/art/martial-identities/source'
OUT = ROOT / 'public/ink/art/martial'
OUT.mkdir(parents=True, exist_ok=True)
# 人手看過五張原圖後指定每兩行嘅身高基準；槍尖唔計入人體身高。
GROUPS = {
 'fists': [('art_river_fist', 215), ('sl_luohan_fist', 205), ('pr_mountain_split', 212)],
 'palm-leg-needle': [('art_stone_palm', 205), ('art_wind_chase', 205), ('tm_flying_needle', 210)],
 'swords-blade': [('art_rain_sword', 203), ('pr_wind_thread', 200), ('art_thunder_blade', 205)],
 'spear-internal': [('art_spear_cloud', 190), ('art_iron_body', 215), ('pr_diamond_body', 215)],
 'steps-weiqi': [('qg_broken_bridge', 215), ('pr_cloud_step', 210), ('art_weiqi_trap', 215)],
 'premium-fist-internal': [('pr_mountain_split-crit', 215), ('pr_mountain_split-kill', 215), ('pr_diamond_body-detail', 215)],
 'premium-sword-step': [('pr_wind_thread-crit', 210), ('pr_wind_thread-kill', 210), ('pr_cloud_step-detail', 210)],
}
metadata = {}
for sheet, arts in GROUPS.items():
    path = SOURCE / f'{sheet}.png'
    source = Image.open(path).convert('RGBA')
    raw = np.array(source)
    labels, _ = label(raw[:, :, 3] > 80)
    components = []
    for component_id, rect in enumerate(find_objects(labels), 1):
        if rect and int((labels[rect] == component_id).sum()) > 1500:
            components.append((component_id, rect))
    if len(components) != 24:
        raise ValueError(f'{sheet} 須人手重分割：實體人物數 {len(components)}，唔係24')
    # 原圖部分手臂／槍尖跨分格；先按真實腳底分行，再按人物位置排序，絕不平均切斷。
    ordered = sorted(components, key=lambda item: item[1][0].stop)
    cells = []
    for row in range(6):
        cells.extend(sorted(ordered[row * 4:row * 4 + 4], key=lambda item: item[1][1].start))
    for group, (art_id, body_height) in enumerate(arts):
        atlas = Image.new('RGBA', (512 * 8, 352))
        frames = []
        for pose in range(8):
            cell = group * 8 + pose
            component_id, rect = cells[cell]
            x, y = max(0, rect[1].start - 3), max(0, rect[0].start - 3)
            x1, y1 = min(source.width, rect[1].stop + 3), min(source.height, rect[0].stop + 3)
            a = raw[y:y1, x:x1].copy()
            mask = binary_dilation(labels[y:y1, x:x1] == component_id, iterations=2)
            a[:, :, 3][~mask] = 0
            cw, ch = x1 - x, y1 - y
            # 清理低透明邊緣，避免縮細之後發灰；保留真正柔邊。
            a[:, :, 3][a[:, :, 3] < 28] = 0
            tile = Image.fromarray(a)
            alpha = a[:, :, 3]
            yy, xx = np.where(alpha > 110)
            if not len(xx):
                raise ValueError(f'{art_id} pose {pose} 冇實體像素')
            foot_y = int(yy.max())
            feet = xx[yy >= foot_y - 9]
            foot_x = float((np.percentile(feet, 8) + np.percentile(feet, 92)) / 2)
            # 同組共用比例；唔以每格 bbox 縮放，避免踢腿／長兵器令人物忽大忽細。
            scale = 218 / body_height
            resized = tile.resize((round(cw * scale), round(ch * scale)), Image.Resampling.LANCZOS)
            ox, oy = round(256 - foot_x * scale), round(328 - foot_y * scale)
            if ox < 0 or ox + resized.width > 512 or oy < 0 or oy + resized.height > 352:
                raise ValueError(f'{art_id} pose{pose} 會截肢，須修正圖集預算: offset={ox,oy}, size={resized.size}')
            normalized = Image.new('RGBA', (512, 352))
            normalized.paste(resized, (ox, oy))
            atlas.paste(normalized, (pose * 512, 0))
            # 以實際透明角色輪廓取前緣手／兵器端點，保留逐格數值供人工驗收校正。
            low, high = (.48, .95) if art_id == 'art_wind_chase' else (.18, .74)
            body_min_y = int(yy.min())
            band = (yy >= body_min_y + (foot_y - body_min_y) * low) & (yy <= body_min_y + (foot_y - body_min_y) * high)
            bx, by = xx[band], yy[band]
            tip_x = float(np.percentile(bx, 99.5))
            tip_y = float(np.median(by[bx >= tip_x - 3]))
            frames.append({'sourceRect': [x, y, cw, ch], 'sourceFoot': [round(foot_x, 2), foot_y],
                           'scale': round(scale, 5), 'offset': [ox, oy],
                           'contact': [round(ox + tip_x * scale, 2), round(oy + tip_y * scale, 2)]})
            if pose == 0:
                normalized.save(OUT / f'{art_id}-guard.webp', quality=90, method=4)
        target = OUT / f'{art_id}.webp'
        atlas.save(target, quality=90, method=4)
        metadata[art_id] = {'sheet': sheet, 'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                            'frameWidth': 512, 'frameHeight': 352, 'frameCount': 8, 'foot': [256, 328], 'bodyHeight': 218,
                            'bytes': target.stat().st_size, 'frames': frames}
(OUT / 'anchors.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
runtime = {key: [frame['contact'] for frame in value['frames']] for key, value in metadata.items()}
(ROOT / 'src/fx/art/poseAnchors.json').write_text(json.dumps(runtime, separators=(',', ':')) + '\n')
# 嵌入後備只佔85KB左右，唔需要下載全圖集。
fallbacks = {'fist':'art_river_fist','palm':'art_stone_palm','kick':'art_wind_chase','needle':'tm_flying_needle',
             'sword':'art_rain_sword','blade':'art_thunder_blade','spear':'art_spear_cloud','internal':'art_iron_body',
             'step':'qg_broken_bridge','weiqi':'art_weiqi_trap'}
fallback_dir = ROOT / 'src/fx/art/fallback'
fallback_dir.mkdir(exist_ok=True)
for family, art_id in fallbacks.items():
    Image.open(OUT / f'{art_id}-guard.webp').resize((256, 176), Image.Resampling.LANCZOS).save(fallback_dir / f'{family}.webp', quality=85, method=4)
fx_source = SOURCE / 'effects.png'
if fx_source.exists():
    im = Image.open(fx_source).convert('RGBA')
    names = ['wave', 'wave-big', 'rock', 'crack', 'rain', 'streak', 'lightning', 'thrust',
             'needle', 'wind', 'qi', 'diamond', 'dust', 'cloud', 'stones', 'spark']
    for i, name in enumerate(names):
        w, h = im.width // 4, im.height // 4
        tile = im.crop((i % 4 * w, i // 4 * h, (i % 4 + 1) * w, (i // 4 + 1) * h))
        tile.resize((256, 256), Image.Resampling.LANCZOS).save(OUT / f'fx-{name}.webp', quality=88, method=4)
print(json.dumps({'atlases': len(metadata), 'frames': len(metadata) * 8,
                  'atlasBytes': sum(v['bytes'] for v in metadata.values())}))
