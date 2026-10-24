"""核對真正Xcode Archive的SDK、版本、本機資源與未簽名狀態。"""
from pathlib import Path
import plistlib, json, re, sys, hashlib, subprocess
archive=Path(sys.argv[1])
app=archive/'Products/Applications/App.app'
info=plistlib.loads((app/'Info.plist').read_bytes())
expected=re.search("APP_VERSION = '([^']+)'",Path('src/version.ts').read_text())[1]
html=(app/'public/index.html').read_text()
script=re.search(r'<script[^>]+src="(/assets/[^\"]+\.js)"',html)[1]
assert expected in (app/'public'/script.lstrip('/')).read_text()
assert info['CFBundleIdentifier']==__import__('os').environ.get('IOS_BUNDLE_ID','com.wyc3809.jianghulife2')
assert int(re.search(r'\d+',info['DTSDKName'])[0])>=26,info['DTSDKName']
assert info['MinimumOSVersion']=='17.4',info['MinimumOSVersion']
assert info['UISupportedInterfaceOrientations']==['UIInterfaceOrientationPortrait']
assert (app/'PrivacyInfo.xcprivacy').is_file()
assert not (app/'_CodeSignature').exists(),'此流程應為未簽名驗證'
architecture=subprocess.check_output(['lipo','-archs',str(app/info['CFBundleExecutable'])],text=True).strip()
assert 'arm64' in architecture,architecture
assert info['DTPlatformName']=='iphoneos'
result={'gameVersion':expected,'bundleId':info['CFBundleIdentifier'],'appleVersion':info['CFBundleShortVersionString'],
        'buildNumber':info['CFBundleVersion'],'sdk':info['DTSDKName'],'minimumIOS':info['MinimumOSVersion'],
        'platform':info['DTPlatformName'],'architecture':architecture,'privacyManifest':True,
        'bundleSHA256':hashlib.sha256((app/'public'/script.lstrip('/')).read_bytes()).hexdigest(),
        'archiveCompileVerified':True,'signedIPA':False,'testflightUploaded':False}
Path('artifacts/build-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
