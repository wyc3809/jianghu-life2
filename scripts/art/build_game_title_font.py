"""從OFL繁中字款產生遊戲標題WOFF2子集；只收固定UI及武學文案，唔改玩家姓名字款。"""
from pathlib import Path
import argparse
import hashlib
import json
import urllib.request
from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter

ROOT = Path(__file__).resolve().parents[2]
REVISION = '590eaaa6aa9447b4b7165d7768511a3ace35af5a'
BASE = f'https://raw.githubusercontent.com/google/fonts/{REVISION}/ofl/lxgwwenkaitc/'
SOURCE_SHA256 = '5c9feadfd928f3ae3860e7d001ad3d0d0c55b0157fff08cd4d51b51aca677f23'
FAMILY = 'Jianghu Wuxia Titles'
LABELS = '''修羅血戰道 長河疊浪 摧鋒破陣 鎖脈擒龍 不動金剛 逍遙遊
武學 主修 秘笈閣 家族收藏 江湖秘笈 珍本奇功 心願祈福 抽卡結果 全部 未選擇 未學
第冊門卷重 初窺門徑 登堂入室 爐火純青 出神入化 小成 大成 即學即裝 立即裝備 已裝備
傳承藏經 六派總覽 招式內功身法 流派 本冊可得武學 查看 本冊 入門 精通 大師 宗師
略有小成 駕輕就熟 融會貫通 神乎其技
一二三四五六七八九十百千萬 0123456789 ・·／（）「」＋%?？'''


def strings(value):
    """讀取卷名巢狀資料入面嘅文字。"""
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)


def build(source, license_text):
    """核對來源、檢查繁字覆蓋，再輸出可隨遊戲自託管嘅子集同授權。"""
    assert hashlib.sha256(source).hexdigest() == SOURCE_SHA256, '來源字體SHA256不符'
    import io
    font = TTFont(io.BytesIO(source), recalcTimestamp=False)
    text = LABELS
    for path in ['content/martial/catalog.json', 'content/martial/premium.json']:
        for skill in json.loads((ROOT / path).read_text())['skills']:
            text += skill['name'] + skill.get('move', {}).get('name', '')
    text += ''.join(strings(json.loads((ROOT / 'content/martial/volumes.json').read_text())))
    chars = ''.join(sorted(set(text) - set('\n\r\t')))
    missing = set(map(ord, chars)) - set(font.getBestCmap())
    assert not missing, f'標題缺字：{[chr(c) for c in missing]}'
    options = Options()
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    subset = Subsetter(options=options)
    subset.populate(text=chars)
    subset.subset(font)
    # 子集係修改版，用獨立family名，保留原作者copyright／license欄位。
    names = {1: FAMILY, 2: 'Bold', 3: f'{FAMILY} Bold v1', 4: f'{FAMILY} Bold',
             6: 'JianghuWuxiaTitles-Bold', 16: FAMILY, 17: 'Bold'}
    font['name'].names = [n for n in font['name'].names if n.nameID not in names]
    for name_id, name in names.items():
        font['name'].setName(name, name_id, 3, 1, 0x409)
    font.flavor = 'woff2'
    out = ROOT / 'src/assets/fonts/wuxia-titles.woff2'
    out.parent.mkdir(parents=True, exist_ok=True)
    font.save(out)
    license_out = ROOT / 'public/ink/fonts/OFL-LXGW-WenKai-TC.txt'
    license_out.parent.mkdir(parents=True, exist_ok=True)
    license_out.write_bytes(license_text)
    manifest = {'family': FAMILY, 'sourceFamily': 'LXGW WenKai TC Bold', 'weight': 700,
                'source': BASE + 'LXGWWenKaiTC-Bold.ttf', 'sourceSha256': SOURCE_SHA256,
                'license': 'SIL Open Font License 1.1', 'characters': chars,
                'characterCount': len(chars), 'bytes': out.stat().st_size,
                'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}
    path = ROOT / 'design/art/wuxia-typography/font-manifest.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in manifest.items() if k != 'characters'}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path)
    parser.add_argument('--license', type=Path)
    args = parser.parse_args()
    source = args.source.read_bytes() if args.source else urllib.request.urlopen(BASE + 'LXGWWenKaiTC-Bold.ttf', timeout=40).read()
    license_text = args.license.read_bytes() if args.license else urllib.request.urlopen(BASE + 'OFL.txt', timeout=40).read()
    build(source, license_text)
