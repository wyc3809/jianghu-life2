"""明亮山水只轉WebP規格，不裁切、改色或覆寫原生成PNG。"""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'design/art/daylight-theme/manifest.json').read_text())
source=ROOT/'design/art/daylight-theme'/manifest['sourceFile']
assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['sourceSha256'],'來源與已記錄樣本不同'
image=Image.open(source)
assert list(image.size)==manifest['dimensions'] and image.mode=='RGB'
output=ROOT/manifest['output'];output.parent.mkdir(parents=True,exist_ok=True)
image.save(output,quality=92,method=6)
print(json.dumps({'output':str(output.relative_to(ROOT)),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()},ensure_ascii=False))
