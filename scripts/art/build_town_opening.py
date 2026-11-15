"""已選第三款晨景僅轉WebP，保留原示意及去UI生成PNG。"""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'design/art/town-opening/manifest.json').read_text())
source=ROOT/'design/art/town-opening'/manifest['sourceFile']
assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['sourceSha256']
image=Image.open(source);assert list(image.size)==manifest['dimensions'] and image.mode=='RGB'
output=ROOT/manifest['runtimeOutput'];output.parent.mkdir(parents=True,exist_ok=True)
image.save(output,quality=92,method=6)
print(json.dumps({'path':str(output.relative_to(ROOT)),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))
