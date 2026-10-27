"""將OFL毛筆字體打包成繁中介面子集；保留原圖字形，缺字由系統字款接續。"""
from pathlib import Path
import hashlib
import json
import re
from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/art/parchment-ui/sources/YujiBoku-Regular.ttf'
SOURCE_SHA256 = '94fda16384f3bdac24376a000c57e99abfa314961bd89ef27badfb7410322003'


def build():
    """只收遊戲文案字形，重命名修改版family，避免額外遠端字體請求。"""
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA256
    font = TTFont(SOURCE, recalcTimestamp=False)
    text = '更換武器人物護甲飾品返回普通配搭對戰裝備秘笈閣華山論劍江湖修煉突破黃天一蔣潤天設定祖祠收藏換上目前選中0123456789＋−／，。！？'
    for folder in ['src/components', 'data', 'content', 'interfaces']:
        for path in (ROOT / folder).rglob('*'):
            if path.suffix in ['.tsx', '.ts', '.json']:
                text += ''.join(re.findall(r'[\u3400-\u9fff]', path.read_text()))
    requested = set(map(ord, text))
    supported = requested & set(font.getBestCmap())
    options = Options()
    options.name_IDs = ['*']
    subset = Subsetter(options=options)
    subset.populate(unicodes=supported)
    subset.subset(font)
    family = 'Jianghu Brush TC'
    names = {1: family, 2: 'Regular', 3: family+' v1', 4: family, 6: 'JianghuBrushTC', 16: family, 17: 'Regular'}
    font['name'].names = [n for n in font['name'].names if n.nameID not in names]
    for key, value in names.items():
        font['name'].setName(value, key, 3, 1, 0x409)
    font.flavor = 'woff2'
    out = ROOT / 'src/assets/fonts/parchment-brush.woff2'
    font.save(out)
    (ROOT/'public/ink/fonts/OFL-YujiBoku.txt').write_bytes((SOURCE.parent/'OFL-yujiboku.txt').read_bytes())
    manifest = {'family':family,'sourceFamily':'Yuji Boku','source':'https://github.com/google/fonts/tree/main/ofl/yujiboku','sourceSha256':SOURCE_SHA256,'license':'SIL Open Font License 1.1','characters':len(supported),'fallbackCharacters':''.join(chr(c) for c in sorted(requested-supported)),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    (ROOT/'design/art/parchment-ui/font-source.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print({k:v for k,v in manifest.items() if k!='fallbackCharacters'})


if __name__ == '__main__':
    build()
