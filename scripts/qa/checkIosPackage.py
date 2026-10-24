"""在隔離目錄驗證真正打包產物及拒絕錯誤設定，不改遊戲存檔。"""
from pathlib import Path
from tempfile import TemporaryDirectory
import shutil, subprocess, json, zipfile, os
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/testflight-prep'

def command(args,cwd,env=None):
    return subprocess.run(args,cwd=cwd,env=env,capture_output=True,text=True)

cases=[]
result=command(['node','scripts/ios/verify-package.mjs'],ROOT)
assert result.returncode==0,result.stderr
report=json.loads(result.stdout)
with TemporaryDirectory(prefix='jianghu-ios-') as folder:
    tmp=Path(folder)
    shutil.copytree(ROOT/'ios',tmp/'ios')
    shutil.copytree(ROOT/'public',tmp/'public')
    (tmp/'scripts/ios').mkdir(parents=True)
    for f in ['verify-package.mjs','configure.mjs']:
        shutil.copy(ROOT/'scripts/ios'/f,tmp/'scripts/ios'/f)
    (tmp/'src').mkdir()
    shutil.copy(ROOT/'src/version.ts',tmp/'src/version.ts')
    html=tmp/'ios/App/App/public/index.html'
    original=html.read_text()
    html.write_text(original.replace('/assets/','/jianghu-life2/assets/'))
    assert command(['node','scripts/ios/verify-package.mjs'],tmp).returncode!=0
    html.write_text(original)
    cases.append('reject_pages_base_in_native_bundle')
    config=tmp/'ios/App/App/capacitor.config.json'
    original=config.read_text()
    bad=json.loads(original);bad['server']={'url':'http://localhost:5173'}
    config.write_text(json.dumps(bad))
    assert command(['node','scripts/ios/verify-package.mjs'],tmp).returncode!=0
    bad=json.loads(original);bad['appId']='com.other.app'
    config.write_text(json.dumps(bad))
    assert command(['node','scripts/ios/verify-package.mjs'],tmp).returncode!=0
    config.write_text(original)
    cases+=['reject_development_server','reject_bundle_id_mismatch']
    art=tmp/'ios/App/App/public/manifest.webmanifest'
    original=art.read_bytes();art.write_bytes(original+b'corrupt')
    assert command(['node','scripts/ios/verify-package.mjs'],tmp).returncode!=0
    art.write_bytes(original);cases.append('reject_changed_bundled_resource')
    env=dict(os.environ,IOS_BUILD_NUMBER='0')
    assert command(['node','scripts/ios/configure.mjs'],tmp,env).returncode!=0
    cases.append('reject_zero_build_number')
icon=Image.open(ROOT/'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
assert icon.size==(1024,1024) and icon.mode=='RGB'
source=next((ROOT/'artifacts').glob('*ios-project.zip'))
with zipfile.ZipFile(source) as z:
    names=z.namelist()
    assert not [n for n in names if '/.env' in n or n.endswith(('.p8','.p12','.pem','.key','.mobileprovision'))]
    assert any('/server/' in n for n in names)
    assert any('/ios/App/App/public/index.html' in n for n in names)
    folder=ROOT/'.local-online/testflight-prep/rebuild'
    folder.mkdir(parents=True,exist_ok=True)
    z.extractall(folder)
    project=folder/'jianghu-life2-ios'
    modules=project/'node_modules'
    if not modules.exists(): modules.symlink_to(ROOT/'node_modules',target_is_directory=True)
    result=command(['npm','run','build:mobile'],project)
    (OUT/'source-rebuild.log').write_text(result.stdout+result.stderr)
    assert result.returncode==0,(result.stdout+result.stderr)[-2000:]
    result=command(['npm','test'],project)
    (OUT/'source-tests.log').write_text(result.stdout+result.stderr)
    assert result.returncode==0,(result.stdout+result.stderr)[-2000:]
result=command(['node','scripts/ios/release-check.mjs'],ROOT)
assert result.returncode!=0
(OUT/'release-readiness.log').write_text(result.stdout+result.stderr)
report.update({'negative_cases':cases,'icon_1024_rgb':True,'zip_excludes_credentials':True,
               'source_zip_rebuild':True,'upload_missing_items_reported':True,'signedIPA':False})
(OUT/'package.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('IOS_PACKAGE_PASS',json.dumps(report,ensure_ascii=False))
