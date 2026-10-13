"""整合可交Mac／Codemagic編譯嘅工程包；唔係已簽名IPA。"""
from pathlib import Path
import zipfile, json
root=Path.cwd();out=root/'artifacts';out.mkdir(exist_ok=True)
version=json.loads((root/'package.json').read_text())['version']
archive=out/f'jianghu-life2-{version}-ios-project.zip'
folders=['ios','src','core','interfaces','data','content','public','tests','scripts','supabase','production/ios']
files=['package.json','package-lock.json','capacitor.config.ts','vite.config.ts','tsconfig.json','index.html','codemagic.yaml','.github/workflows/ios-package.yml']
skip={'node_modules','.git','build','DerivedData','xcuserdata','Pods','output','__pycache__'}
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in folders:
  for p in (root/name).rglob('*'):
   if p.is_file() and not any(part in skip for part in p.relative_to(root).parts) and p.suffix not in {'.p12','.p8','.mobileprovision'}:
    z.write(p,Path('jianghu-life2-ios')/p.relative_to(root))
 for name in files:
  p=root/name
  if p.exists():z.write(p,Path('jianghu-life2-ios')/name)
print(f'{archive} ({archive.stat().st_size} bytes)')
