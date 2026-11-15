from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,time,uuid,concurrent.futures,os
ROOT=Path.cwd();OUT=ROOT/'.local-online/live-qa';URL='https://seuocqrmyljjzndgbynt.supabase.co';KEY=dict(line.split('=',1) for line in (ROOT/'.env.local').read_text().splitlines() if '=' in line)['VITE_SUPABASE_ANON_KEY']
def request(path,body=None,token=None,method='POST'):
 h={'apikey':KEY,'Content-Type':'application/json','Origin':'http://127.0.0.1:5315'}
 if token:h['Authorization']='Bearer '+token
 req=Request(URL+path,data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None,headers=h,method=method)
 try:
  with urlopen(req,timeout=30) as r:return r.status,json.loads(r.read() or b'{}')
 except HTTPError as e:return e.code,json.loads(e.read() or b'{}')
if not (OUT/'accounts.json').exists():
 accounts=[];states=json.loads((OUT/'states.json').read_text())
 for i,state in enumerate(states):
  status,auth=request('/auth/v1/signup',{});assert status==200,(status,auth)
  uid=auth['user']['id'];status,_=request('/rest/v1/saves',{'user_id':uid,'payload':{'version':1,'savedAt':int(time.time()*1000),'life':state,'ancestry':None},'app_version':'EA0.113.0'},auth['access_token']);assert status in [200,201,204],status
  accounts.append({'id':uid,'auth':auth,'state':state,'clientId':str(uuid.uuid4())})
 (OUT/'accounts.json').write_text(json.dumps(accounts,ensure_ascii=False));os.chmod(OUT/'accounts.json',0o600)
accounts=json.loads((OUT/'accounts.json').read_text())
for account in accounts:
 status,auth=request('/auth/v1/token?grant_type=refresh_token',{'refresh_token':account['auth']['refresh_token']});assert status==200,status;account['auth']=auth
(OUT/'accounts.json').write_text(json.dumps(accounts,ensure_ascii=False))

def call(i,action,data=None,ok=200):
 a=accounts[i];status,value=request('/functions/v1/jianghu-live',{'action':action,'clientId':a['clientId'],'data':data or {}},a['auth']['access_token']);assert status==ok,(i,action,status,value);return value
for i,a in enumerate(accounts):call(i,'liveEnter',{'name':a['state']['character']['name']})
print('LIVE_JOIN_3',flush=True)
msgid=str(uuid.uuid4());call(0,'send',{'requestId':msgid,'body':'雲端驗收：茶樓見。'})
assert any(m['id']==msgid for m in call(1,'messages')['messages']);call(0,'send',{'requestId':msgid,'body':'雲端驗收：茶樓見。'})
time.sleep(2.1);secret=str(uuid.uuid4());call(0,'send',{'requestId':secret,'body':'私訊驗收：只傳給青乙。','target':accounts[1]['id']})
assert any(m['id']==secret for m in call(1,'messages',{'target':accounts[0]['id']})['messages'])
assert not any(m['id']==secret for m in call(2,'messages',{'target':accounts[0]['id']})['messages'])
assert not any(m['id']==secret for m in call(2,'messages')['messages'])
status,_=request('/rest/v1/jianghu_chat_messages?select=id',token=accounts[2]['auth']['access_token'],method='GET');assert status in [401,403],status
call(1,'block',{'target':accounts[0]['id'],'blocked':True});call(0,'send',{'requestId':str(uuid.uuid4()),'body':'被屏蔽不可私訊','target':accounts[1]['id']},409);call(1,'block',{'target':accounts[0]['id'],'blocked':False})
call(1,'report',{'requestId':str(uuid.uuid4()),'messageId':msgid,'reason':'雲端驗收測試舉報，非真玩家內容'})
print('LIVE_CHAT_PRIVATE_BLOCK_REPORT_PASS',flush=True)
call(0,'red',{'requestId':str(uuid.uuid4()),'enabled':True});data={'requestId':str(uuid.uuid4()),'target':accounts[1]['id']}
with concurrent.futures.ThreadPoolExecutor(2) as ex:result=list(ex.map(lambda _:call(0,'attack',data),[0,1]))
assert result[0]==result[1];battle=result[0]['battleId'];watch=[call(i,'watch',{'id':battle}) for i in range(3)]
assert all(x['startedAt']==watch[0]['startedAt'] and x['replay']==watch[0]['replay'] for x in watch)
assert set(watch[2]['look'])=={'sectId','weaponId'} and 'characters' not in watch[2]
call(1,'liveLeave',ok=409);wait=max(0,(watch[0]['endsAt']-watch[0]['serverNow'])/1000)+.4
print('LIVE_COMMON_BATTLE',battle,'waiting',round(wait,1),flush=True);time.sleep(wait)
b=call(1,'world');assert b['me']['protectedUntil']>b['serverNow'];before=b['me']['protectedUntil'];assert b['battles'][0].get('jadeAwards') is None
call(1,'liveEnter',{'name':accounts[1]['state']['character']['name']});assert call(1,'world')['me']['protectedUntil']==before
call(0,'attack',{'requestId':str(uuid.uuid4()),'target':accounts[1]['id']},409)
for i in range(3):call(i,'liveLeave')
report={'accounts':3,'join':True,'publicChat':True,'privateNoThirdPartyLeak':True,'idempotentMessageAndAttack':True,'directTableDenied':True,'blockAndReport':True,'threeClientsSameBattle':True,'busyExitDenied':True,'defeatProtection':True,'protectionSurvivesRejoin':True,'noNewJadeAward':True,'actualIphoneTested':False}
(OUT/'cloud.json').write_text(json.dumps(report,indent=2));print('LIVE_CLOUD_PASS',flush=True)
