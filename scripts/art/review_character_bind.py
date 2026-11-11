"""第60g項：只建立旅裝一人、待機／直拳兩個靜態驗收姿勢，不修改正式圖集。"""
from pathlib import Path
import copy
import json
import math
import re
import sys
import hashlib

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label as connected_components

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_independent_rigs import clean, mesh_uv, smooth, world_of, GUIDES
from compile_independent_motions import solve_pose

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'design/art/independent-animation'
OLD = ROOT / 'design/art/spine-character'
OUT = ROOT / 'design/art/character-bind-review'
BUILD = ROOT / '.local-online/rig-repair'


def forward(frame, x, y):
    """骨本地座標轉成唯一嘅綁定世界座標。"""
    px, py, a = frame
    return (px + x * math.cos(a) - y * math.sin(a), py + x * math.sin(a) + y * math.cos(a))


def inverse(frame, point):
    """同一綁定點按各骨逆矩陣轉回本地，禁止各骨自行縮放頂點。"""
    px, py, a = frame
    x, y = point[0] - px, point[1] - py
    return (x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a))


def unpack(attachment):
    """讀取Spine加權網格；每頂點獨立保留全部影響。"""
    v = attachment['vertices']
    cursor = 0
    for _ in range(len(attachment['uvs']) // 2):
        count = int(v[cursor])
        cursor += 1
        yield [v[cursor + n * 4:cursor + n * 4 + 4] for n in range(count)]
        cursor += count * 4
    assert cursor == len(v)


def bind_error(attachment, bones):
    """量度同頂點喺各骨逆綁定後重投影嘅分歧，唔以骨長檢查代替。"""
    frames = world_of(bones)
    worst = 0.0
    for influences in unpack(attachment):
        points = [forward(frames[bones[int(i)]['name']], x, y) for i, x, y, weight in influences if weight > 1e-7]
        for a in points:
            for b in points:
                worst = max(worst, math.dist(a, b))
    return worst


def rebind(attachment, bones, weight_edit=None):
    """保留原有靜態輪廓，但將所有影響統一成同一綁定世界點。"""
    result = copy.deepcopy(attachment)
    frames = world_of(bones)
    indices = {b['name']: i for i, b in enumerate(bones)}
    vertices = []
    for n, entries in enumerate(unpack(attachment)):
        points = [(forward(frames[bones[int(i)]['name']], x, y), w) for i, x, y, w in entries]
        total = sum(w for _, w in points)
        point = tuple(sum(p[k] * w for p, w in points) / total for k in [0, 1])
        weights = {bones[int(i)]['name']: w for i, x, y, w in entries}
        if weight_edit:
            weights = weight_edit(attachment['uvs'][n * 2] * attachment['width'], attachment['uvs'][n * 2 + 1] * attachment['height'], weights)
        weights = {name: w for name, w in weights.items() if w > 1e-7}
        vertices.append(len(weights))
        total = sum(weights.values())
        for name, w in weights.items():
            x, y = inverse(frames[name], point)
            vertices.extend([indices[name], round(x, 7), round(y, 7), w / total])
    result['vertices'] = vertices
    return result


def build():
    """產出隔離資料；只供兩張靜態驗收，唔改App入口。"""
    OUT.mkdir(exist_ok=True)
    BUILD.mkdir(exist_ok=True, parents=True)
    original = json.loads((OUT / 'rejected-baseline.json').read_text())
    rig = copy.deepcopy(original)
    bones = rig['bones']
    frames = world_of(bones)
    indices = {b['name']: i for i, b in enumerate(bones)}
    attachments = rig['skins'][0]['attachments']
    before = {name: bind_error(group[next(iter(group))], bones) for name, group in attachments.items()}
    parts = {'upper-body': Image.open(OLD / 'production/upper-topknot-traveller.png').convert('RGBA'), 'hip': Image.open(OLD / 'parts/hip.png').convert('RGBA')}
    for name, group in attachments.items():
        for key, a in group.items():
            group[key] = rebind(a, bones)

    # 原胸圖嘅肩甲唔可同完整袖甲重複。沿原畫縫線分出材質所有權，
    # 保留頭／頸／胸連續面；活動肩甲只由各側手臂持有。
    upper = parts['upper-body']
    alpha = upper.getchannel('A')
    mask = Image.new('L', upper.size)
    cut = ImageDraw.Draw(mask)
    # 留返貼住背帶嘅窄袖籠包邊作真實接縫重疊，唔切穿胸片。
    cut.polygon([(90,334),(175,334),(195,342),(219,366),(235,402),(242,445),(233,481),(216,510),(191,534),(180,549),(90,549)], fill=255)
    cut.polygon([(480,349),(550,349),(550,497),(478,497),(481,462),(482,416),(473,378)], fill=255)
    a = np.array(alpha); a[np.array(mask)>0] = 0
    upper.putalpha(Image.fromarray(a))
    assert np.array_equal(np.array(upper)[:334], np.array(Image.open(OLD / 'production/upper-topknot-traveller.png'))[:334]), '頭頸原像素唔准改'

    source = Image.open(ART / 'sources/traveller-v01.png').convert('RGBA')
    sockets = {}
    for name, (box, joints) in GUIDES['traveller'].items():
        im = clean(source.crop(box))
        bbox = im.getbbox()
        im = im.crop(bbox)
        offset = (box[0] + bbox[0], box[1] + bbox[1])
        side, kind = name.split('-')
        if kind == 'arm':
            # 唯一活動肩甲保留喺完整衣袖；胸圖嘅重複肩甲已沿縫線移除。
            pixels = np.array(im)
            pixels[np.arange(im.height) + offset[1] > 660, :, 3] = 0
            im = Image.fromarray(pixels)
            # 袖口圓孔中心係人工標定；唔用alpha頂部猜手腕。
            wrist = (300, 632) if side == 'near' else (759, 624)
            source_cuff = (wrist[0] - offset[0], wrist[1] - offset[1])
            lower = side + '-lower-arm'
            a = attachments[name][name]
            # 修正低臂末端偏移，袖口中心同腕骨使用同一個基準點。
            uv = np.array(a['uvs']).reshape(-1, 2)
            # 既有網格喺袖口附近插值實際世界點。
            entries = list(unpack(a))
            desired = frames[side + '-hand'][:2]
            q = np.array(source_cuff) / [im.width, im.height]
            nx = len(set(uv[:, 0])) - 1
            ny = len(set(uv[:, 1])) - 1
            cx, cy = min(nx - 1, int(q[0] * nx)), min(ny - 1, int(q[1] * ny))
            fx, fy = q[0] * nx - cx, q[1] * ny - cy
            sample = np.zeros(2)
            for ox, oy, weight in [(0, 0, (1-fx)*(1-fy)), (1, 0, fx*(1-fy)), (0, 1, (1-fx)*fy), (1, 1, fx*fy)]:
                v = entries[(cy + oy) * (nx + 1) + cx + ox]
                p = sum((np.array(forward(frames[bones[int(i)]['name']], x, y)) * w for i, x, y, w in v), np.zeros(2))
                sample += p * weight
            delta = np.array(desired) - sample
            out = []
            for n, v in enumerate(entries):
                y = uv[n][1] * im.height + offset[1]
                t = smooth(410, 590, y)
                out.append(len(v))
                for i, x, y0, w in v:
                    name0 = bones[int(i)]['name']
                    p = np.array(forward(frames[name0], x, y0)) + delta * t
                    lx, ly = inverse(frames[name0], p)
                    out.extend([i, lx, ly, w])
            a['vertices'] = out
            sockets[side] = {'sourceCuff': list(wrist), 'textureCuff': list(source_cuff), 'restCuff': list(desired), 'correction': delta.tolist()}
        parts[name] = im

    # 腰帶由上身唯一持有，下擺仍保留盆骨同腿根遮擋。
    hip = np.array(parts['hip'])
    hip[:52, :, 3] = 0
    parts['hip'] = Image.fromarray(hip)
    hands = Image.open(ART / 'sources/hands-v01.png').convert('RGBA')
    # 手圖上方包含一截前臂；腕關節喺掌根收窄處，唔係前臂裁口。
    for side, column, wrist in [('near', 0, (100, 100)), ('far', 1, (407, 100))]:
        # 原來源每行384高，但下一行手腕由y=335已伸入前格；
        # 必須按真實單手邊界取樣，否則會渲染游離皮膚塊。
        box = (0, 0, 320, 320) if side == 'near' else (320, 0, 600, 320)
        im = clean(hands.crop(box))
        bbox = im.getbbox()
        im = im.crop(bbox)
        wx, wy = wrist[0] - box[0] - bbox[0], wrist[1] - bbox[1]
        scale = .45 if side == 'near' else .53
        key = side + '-hand-fist'
        parts[key] = im
        mapper = lambda bone, x, y, wx=wx, wy=wy, scale=scale: ((y-wy)*scale, -(x-wx)*scale)
        attachments[side + '-hand'] = {key: dict(mesh_uv(im, mapper, lambda x, y, side=side: {side + '-hand': 1}, indices, 20), path=key)}
        sockets[side]['handSourceWrist'] = list(wrist)
        sockets[side]['handScale'] = scale
        sockets[side]['textureWrist'] = [wx,wy]

    # 遠側上臂置身後，前臂及手掌可跨胸。共享原網格，唔額外加一條手臂。
    far = attachments.pop('far-arm')['far-arm']
    for label, keep in [('far-upper', lambda y: y < 386), ('far-forearm', lambda y: y >= 386)]:
        a = copy.deepcopy(far)
        tri = []
        for i in range(0, len(a['triangles']), 3):
            ids = a['triangles'][i:i+3]
            source_y = sum(a['uvs'][n*2+1] * a['height'] + (GUIDES['traveller']['far-arm'][0][1] + clean(source.crop(GUIDES['traveller']['far-arm'][0])).getbbox()[1]) for n in ids)/3
            if keep(source_y):
                tri.extend(ids)
        a['triangles'] = tri
        a['path'] = 'far-arm'
        attachments[label] = {label: a}
    order = ['far-leg', 'near-leg', 'far-upper', 'upper-body', 'hip', 'far-forearm', 'far-hand', 'near-arm', 'near-hand']
    rig['slots'] = [{'name': k, 'bone': k if k.endswith('hand') else 'hip', 'attachment': k+'-fist' if k.endswith('hand') else k} for k in order]
    poses = json.loads((ART / 'motions.json').read_text())['poses']
    material = json.loads((ART / 'materials.json').read_text())
    rig['animations'] = {}
    original['animations'] = {}
    for name, token in [('guard', 'guard'), ('punch', 'punch')]:
        pose = copy.deepcopy(poses[token])
        # 第一輪驗收先固定腳，移動／踏步留待兩張姿勢被接受之後。
        if name == 'punch':
            pose.update(hip=[5, -35], nearFoot=[0,0], farFoot=[0,0], lean=-4, head=0, near=[238,-55], far=[150,-205])
        rot, trans, _, _ = solve_pose(pose, 'fist', bones, material['hands'])
        animation = {'bones': {k: {'rotate': [{'value': v}]} for k,v in rot.items()}}
        for k, (x,y) in trans.items():
            animation['bones'].setdefault(k, {})['translate'] = [{'x': x, 'y': y}]
        rig['animations'][name] = animation
        original['animations'][name] = copy.deepcopy(animation)
    # 同場基準：原材質、原蒙皮、原slot順序，與修正版用同一姿勢意圖。
    for tag, doc in [('after', rig), ('before', original)]:
        folder = BUILD / tag
        folder.mkdir(exist_ok=True)
        selected = copy.deepcopy(parts)
        if tag == 'before':
            selected['upper-body'] = Image.open(OLD / 'production/upper-topknot-traveller.png').convert('RGBA')
            selected.update({n: Image.open(ART / f'parts/traveller/{n}.png').convert('RGBA') for n in ['far-arm','near-arm','far-leg','near-leg']})
            selected['hip'] = Image.open(OLD / 'parts/hip.png').convert('RGBA')
            # 原版全部手形先按原始builder規則打包，供真實before重現。
            for row in range(4):
                for col in range(4):
                    kind = ['fist','palm','finger','pinch','grip','draw','flute','stone'][row*2+col//2]
                    side = 'near' if col%2 == 0 else 'far'
                    im = clean(hands.crop((col*256,row*384,(col+1)*256,(row+1)*384)))
                    selected[f'{side}-hand-{kind}'] = im.crop(im.getbbox())
        if tag == 'after':
            (OUT/'parts').mkdir(exist_ok=True)
            for key, im in selected.items():
                if key == 'upper-body':
                    im.save(OUT/'parts'/f'{key}.png')
                    continue  # 已接受頭頸原像素不清走獨立髮絲。
                pixels = np.array(im)
                components, count = connected_components(pixels[:,:,3] > 30)
                sizes = np.bincount(components.ravel())
                discard = sizes < 30
                discard[0] = False
                pixels[discard[components],3] = 0
                selected[key] = Image.fromarray(pixels)
                selected[key].save(OUT/'parts'/f'{key}.png')
        atlas = Image.new('RGBA', (2048,2048))
        lines = ['atlas.png','size: 2048,2048','format: RGBA8888','filter: Linear,Linear','repeat: none']
        x=y=2
        row=0
        for key, im in selected.items():
            if x+im.width+2>2048:
                x=2;y+=row+2;row=0
            if y+im.height>2048:
                # before含所有手形需要較高圖集。
                atlas2=Image.new('RGBA',(2048,4096));atlas2.paste(atlas,(0,0));atlas=atlas2;lines[1]='size: 2048,4096'
            atlas.paste(im,(x,y))
            lines += [key,'  rotate: false',f'  xy: {x}, {y}',f'  size: {im.width}, {im.height}',f'  orig: {im.width}, {im.height}','  offset: 0, 0','  index: -1']
            x+=im.width+2;row=max(row,im.height)
        atlas.save(folder/'atlas.png')
        (folder/'character.atlas').write_text('\n'.join(lines)+'\n')
        (folder/'character.json').write_text(json.dumps(doc,separators=(',',':'))+'\n')
    after = {n: max(bind_error(a,bones) for a in g.values()) for n,g in attachments.items()}
    assert max(after.values()) < 1e-5
    sources = [ART/'sources/traveller-v01.png', ART/'sources/hands-v01.png', OLD/'production/upper-topknot-traveller.png', OLD/'parts/hip.png']
    report = {'scope':'單人旅裝／束髮／徒手；兩個靜態姿勢；未發布／未經玩家驗收', 'beforeBindError':before, 'afterBindError':after,'sockets':sockets, 'sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}, 'limitations':['尚未動畫驗收','尚未其他頭／衣／武器','尚未真機','原生Spine編輯器回合待驗收']}
    (OUT/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    (OUT/'traveller-review.json').write_text(json.dumps(rig,separators=(',',':'))+'\n')
    runtime = re.search(r'<script>([\s\S]*?)</script>',(OLD/'runtime/review.html').read_text()).group(1)
    (BUILD/'runtime.js').write_text(runtime)
    (BUILD/'index.html').write_text(Path(__file__).with_name('character_bind_review.html').read_text())
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    build()
