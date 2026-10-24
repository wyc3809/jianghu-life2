"""打包可在Mac重建的完整工程；只收錄指定來源與生成的App資源。"""
from pathlib import Path
import zipfile, json, hashlib
root=Path.cwd()
out=root/'artifacts'
out.mkdir(exist_ok=True)
version=json.loads((root/'package.json').read_text())['version']
archive=out/f'jianghu-life2-{version}-ios-project.zip'
folders=['ios','src','core','interfaces','data','content','public','tests','server','supabase','production/ios','scripts','docs/architecture']
files=['package.json','package-lock.json','capacitor.config.ts','vite.config.ts','tsconfig.json','index.html','codemagic.yaml','.github/workflows/ios-package.yml','design/art/martial-identities/directions.json','design/art/spar-commercial/atlas.json']
skip={'node_modules','.git','build','DerivedData','xcuserdata','Pods','output','__pycache__','.temp'}
def permitted(p):
    return not any(part in skip or part.startswith('.env') for part in p.relative_to(root).parts) and p.suffix.lower() not in {'.p12','.p8','.pem','.key','.mobileprovision','.ipa'} and p.name not in {'credentials.json','secrets.json','.DS_Store'} and not p.is_symlink()
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in folders:
        for p in sorted((root/name).rglob('*')):
            if p.is_file() and permitted(p): z.write(p,Path('jianghu-life2-ios')/p.relative_to(root))
    for name in files:
        p=root/name
        if p.is_file() and permitted(p): z.write(p,Path('jianghu-life2-ios')/name)
manifest={'file':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'gameVersion':version,'signedIPA':False}
(out/'ios-project.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False))
