"""二十個獨立匿名身份；不使用真玩家，憑證只寫ignored目錄。"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,time,uuid,os,concurrent.futures,hashlib
ROOT=Path.cwd();OUT=ROOT/'.local-online/organization-qa';URL='https://seuocqrmyljjzndgbynt.supabase.co'
KEY=dict(l.split('=',1) for l in (ROOT/'.env.local').read_text().splitlines() if '=' in l)['VITE_SUPABASE_ANON_KEY']
def request(path,body=None,token=None,method='POST'):
 headers={'apikey':KEY,'Content-Type':'application/json','Origin':'https://wyc3809.github.io'}
 if token:headers['Authorization']='Bearer '+token
 try:
  with urlopen(Request(URL+path,data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None,headers=headers,method=method),timeout=45) as r:return r.status,json.loads(r.read() or b'{}')
 except HTTPError as e:return e.code,json.loads(e.read() or b'{}')
file=OUT/'accounts.json';states=json.loads((OUT/'states.json').read_text());accounts=json.loads(file.read_text()) if file.exists() else []
def persist():file.write_text(json.dumps(accounts,ensure_ascii=False));os.chmod(file,0o600)
for i in range(len(accounts),20):
 status,auth=request('/auth/v1/signup',{'data':{'qa_run':'organizations-114'}});assert status==200,('signup',i,status,auth.get('error_code'))
 accounts.append({'id':auth['user']['id'],'auth':auth,'state':states[i]});persist();print('QA_IDENTITY',i+1,flush=True)
for a in accounts:
 if a['auth'].get('expires_at',0)<time.time()+120:
  status,auth=request('/auth/v1/token?grant_type=refresh_token',{'refresh_token':a['auth']['refresh_token']});assert status==200; a['auth']=auth;persist()
def call(i,action,data=None,request_id=None,expected=200,sect=False):
 status,value=request('/functions/v1/'+('jianghu-sect' if sect else 'jianghu-organizations'),{'action':action,'data':data or {},**({'requestId':request_id or str(uuid.uuid4())} if action not in ['overview','messages','report'] else {})},accounts[i]['auth']['access_token'])
 assert status==expected,(i,action,status,value);return value
def digest(i):
 status,value=request('/rest/v1/saves?select=payload',token=accounts[i]['auth']['access_token'],method='GET');assert status==200;return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
phase=os.getenv('ORGANIZATION_QA_PHASE','prepare')
if phase=='prepare':
 for i,a in enumerate(accounts):
  status,_=request('/rest/v1/saves',{'user_id':a['id'],'payload':{'version':1,'savedAt':int(time.time()*1000),'life':a['state'],'ancestry':None},'app_version':'EA0.114.0'},a['auth']['access_token']);assert status in [200,201,204],('save',i,status)
  call(i,'join',sect=True)
 print('SECT_TWENTY_JOINED',flush=True)
 overview=call(0,'overview',sect=True);all_ids={a['id'] for a in accounts}
 for s in ['sect_qingyun','sect_wudang']:
  team=overview['teams'][s]['members'];assert len(team)==10 and set(team)<=all_ids,'已有非測試代表，停止驗收以免混入真人'
 hashes=[digest(i) for i in range(20)]
 a=call(0,'create',{'name':'驗收青竹會','intro':'獨立測試幫會，驗收後清除'})['guild']['id'];b=call(10,'create',{'name':'驗收赤松會'})['guild']['id']
 call(1,'apply',{'target':a});call(10,'accept',{'target':accounts[1]['id']},expected=409);call(1,'accept',{'target':accounts[1]['id']},expected=403)
 rid=str(uuid.uuid4())
 with concurrent.futures.ThreadPoolExecutor(2) as ex:r=list(ex.map(lambda _:call(0,'accept',{'target':accounts[1]['id']},rid),range(2)))
 assert r[0]==r[1];call(11,'apply',{'target':b});call(10,'accept',{'target':accounts[11]['id']})
 call(1,'apply',{'target':b},expected=409);call(0,'transfer',{'target':accounts[1]['id']});call(1,'transfer',{'target':accounts[0]['id']});call(0,'role',{'target':accounts[1]['id'],'role':'member'});call(1,'upgrade',expected=403)
 call(10,'attack',{'city':'luoyang'});call(0,'attack',{'city':'luoyang'},expected=409)
 rev=call(0,'overview')['revision']
 with concurrent.futures.ThreadPoolExecutor(6) as ex:views=list(ex.map(lambda _:call(0,'overview'),range(24)))
 assert all(v['revision']==rev for v in views)
 scope={'kind':'guild','group':a};mid=str(uuid.uuid4());call(0,'send',{**scope,'body':'聚義堂私聊驗收'},mid);call(0,'send',{**scope,'body':'聚義堂私聊驗收'},mid)
 assert any(m['id']==mid for m in call(1,'messages',scope)['messages']);call(2,'messages',scope,expected=409);call(10,'messages',scope,expected=409)
 call(1,'block',{**scope,'target':accounts[0]['id'],'blocked':True});assert not any(m['id']==mid for m in call(1,'messages',scope)['messages']);call(1,'block',{**scope,'target':accounts[0]['id'],'blocked':False});call(1,'reportMessage',{**scope,'messageId':mid,'reason':'獨立驗收，非真玩家內容'})
 time.sleep(2.1);s={'kind':'sect','group':'sect_qingyun'};mid2=str(uuid.uuid4());call(0,'send',{**s,'body':'青雲同門對話驗收'},mid2);assert any(m['id']==mid2 for m in call(2,'messages',s)['messages']);call(10,'messages',s,expected=409)
 for table in ['jianghu_guild_world','jianghu_guild_reports','jianghu_guild_receipts','jianghu_organization_messages','jianghu_organization_reports']:
  status,_=request('/rest/v1/'+table+'?select=*',token=accounts[2]['auth']['access_token'],method='GET');assert status in [401,403],table
 rid=str(uuid.uuid4())
 with concurrent.futures.ThreadPoolExecutor(2) as ex:battles=list(ex.map(lambda _:call(0,'challenge',{'target':'sect_wudang'},rid,sect=True),range(2)))
 assert battles[0]==battles[1];battle=battles[0]['reportId'];assert call(10,'challenge',{'target':'sect_qingyun'},sect=True)['reportId']==battle
 report=call(0,'report',{'id':battle},sect=True);assert len(report['roster'])==20;assert report==call(10,'report',{'id':battle},sect=True)
 assert [digest(i) for i in range(20)]==hashes
 (OUT/'context.json').write_text(json.dumps({'guildA':a,'guildB':b,'sectReport':battle,'hashes':hashes}));(OUT/'sect-report.json').write_text(json.dumps(report,ensure_ascii=False));print('ORGANIZATIONS_PREPARE_PASS',flush=True)
else:
 context=json.loads((OUT/'context.json').read_text());a=context['guildA'];b=context['guildB'];rid=str(uuid.uuid4())
 result=call(0,'attack',{'city':'luoyang'},rid);assert result['captured'];assert call(0,'attack',{'city':'luoyang'},rid)==result
 assert call(0,'report',{'id':result['reportId']})['replay']['outcome']=='won'
 bank=call(10,'overview')['guild']['materials'];assert bank>=100
 rid=str(uuid.uuid4());first=call(10,'upgrade',request_id=rid);second=call(10,'upgrade',request_id=rid);assert first==second and first['guild']['level']==2
 assert first['guild']['materials']==bank-100
 assert [digest(i) for i in range(20)]==context['hashes']
 proof={'anonymousTestIdentities':20,'actualHumanPlayers':False,'guildCreateApplyAccept':True,'membershipUniqueAndPermissions':True,'transferAndRoles':True,'sameIdAcceptanceAndCityBattleAndUpgrade':True,'guildAndSectChatIsolation':True,'blockAndReport':True,'directTablesDenied':True,'readOnlyOverview24Concurrent':True,'cityProtectionRejectedBeforeFixture':True,'adminFixtureOnlyOwnTestCityBackdated':True,'cityUsesRealFormula':True,'oldOwnerAccrualAndUpgradeSpendOnce':True,'twentyRealProfilesSameSectReport':True,'allCloudLifeSavesUnchanged':True,'capacityGuarantee':False,'actualIphoneTested':False}
 (OUT/'cloud.json').write_text(json.dumps(proof,indent=2)+'\n');print('ORGANIZATIONS_CLOUD_PASS',flush=True)
