"""二十個獨立匿名驗收身份：真Edge／RLS／CAS／單一戰報，不使用玩家身份或憑證。"""
from pathlib import Path
import json,uuid,time,concurrent.futures,urllib.request,urllib.error,hashlib,base64,os
ROOT=Path(__file__).resolve().parents[2];LOCAL=ROOT/'.local-online/sect-production';OUT=ROOT/'production/qa/evidence/redesign/sect-war';OUT.mkdir(parents=True,exist_ok=True)
config=json.loads((ROOT/'.local-online/appearance-cloud-config.json').read_text());states=json.loads((LOCAL/'states.json').read_text());meta=json.loads((ROOT/'.local-online/game-polish/fixtures.json').read_text())['meta']
key=config['key'];assert key.startswith('sb_publishable_')or json.loads(base64.urlsafe_b64decode(key.split('.')[1]+'=='))['role']=='anon'
file=LOCAL/'qa-sessions.json';sessions=json.loads(file.read_text())if file.exists()else[]
def request(path,session=None,data=None,extra=None):
 headers={'apikey':key,'Authorization':'Bearer '+(session['access_token']if session else key),'Content-Type':'application/json','Origin':'https://wyc3809.github.io'}
 if extra:headers.update(extra)
 try:
  with urllib.request.urlopen(urllib.request.Request(config['url']+path,headers=headers,data=json.dumps(data).encode()if data is not None else None),timeout=45)as r:return r.status,json.loads(r.read()or'null')
 except urllib.error.HTTPError as e:return e.code,json.loads(e.read()or'null')
def persist():file.write_text(json.dumps(sessions));os.chmod(file,0o600)
for index in range(len(sessions),20):
 status,value=request('/auth/v1/signup',data={'data':{'qa_run':'sect-war-production-validation'}})
 assert status in(200,201)and'access_token'in value,('auth_create',status,value.get('error_code')if isinstance(value,dict)else'')
 sessions.append(value);persist();print('QA_IDENTITY',index+1,flush=True);time.sleep(.35)
for i,s in enumerate(sessions):
 if s.get('expires_at',0)<time.time()+60:
  status,value=request('/auth/v1/token?grant_type=refresh_token',data={'refresh_token':s['refresh_token']});assert status==200,('refresh',status);sessions[i]=value;persist()
def call(i,action,data=None,request_id=None):return request('/functions/v1/jianghu-sect',sessions[i],{'action':action,'data':data or{},**({'requestId':request_id or str(uuid.uuid4())}if action not in['overview','report']else{})})
for i,s in enumerate(sessions):
 state=states[i]
 if i==9:state['character']['martial']=2000;state['character']['attributes']['genGu']=100
 payload={'version':1,'savedAt':int(time.time()*1000),'life':state,'ancestry':json.dumps(meta,ensure_ascii=False)}
 status,_=request('/rest/v1/saves',s,{'user_id':s['user']['id'],'payload':payload,'app_version':'sect-war-qa','saved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},{'Prefer':'resolution=merge-duplicates,return=minimal'})
 assert status in(200,201,204),('own_profile',i,status)
 status,answer=call(i,'join');assert status==200,('join',i,status,answer)
print('SIGNED_UP_TWENTY',flush=True)
status,overview=call(0,'overview');assert status==200;ids=[s['user']['id']for s in sessions]
assert len(overview['teams']['sect_qingyun']['members'])==len(overview['teams']['sect_wudang']['members'])==10
profile_before=[]
for i,s in enumerate(sessions):
 status,v=request('/rest/v1/saves?select=payload',s);assert status==200;profile_before.append(hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest())
status,_=call(0,'challenge',{'target':'sect_wudang','winner':0});assert status==400,('tampered',status)
for table in['jianghu_sect_world','jianghu_sect_reports','jianghu_sect_receipts']:
 status,_=request('/rest/v1/'+table+'?select=*',sessions[0]);assert status in(401,403),('table_access',table,status)
status,_=request('/rest/v1/rpc/commit_jianghu_sect',sessions[0],{'p_expected':0,'p_payload':{},'p_report':None,'p_receipt':None});assert status in(401,403,404),('rpc_access',status)
same=str(uuid.uuid4())
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:results=list(pool.map(lambda _:call(0,'challenge',{'target':'sect_wudang'},same),range(2)))
assert all(x[0]==200 for x in results),[(r[0],r[1])for r in results];assert results[0][1]==results[1][1]
report_id=results[0][1]['reportId'];status,reverse=call(10,'challenge',{'target':'sect_qingyun'});assert status==200 and reverse['reportId']==report_id
status,report=call(0,'report',{'id':report_id});status2,report2=call(10,'report',{'id':report_id});assert status==status2==200 and report==report2
assert len(report['roster'])==20 and len(set(u['id']for u in report['roster']))==20
assert not any('fatherName'in json.dumps(u)for u in report['roster'])
status,duel=call(9,'selection',{'target':sessions[0]['user']['id']});assert status==200,('selection',status,duel)
assert duel['before']>=1 and duel['after']==(1 if duel['replay']['outcome']=='won' else duel['before']),('rank_rule',duel['before'],duel['after'],duel['replay']['outcome'])
status,after=call(0,'overview');assert status==200 and after['teams']['sect_qingyun']['members']==overview['teams']['sect_qingyun']['members']
for i,s in enumerate(sessions):
 status,v=request('/rest/v1/saves?select=payload',s);assert status==200;assert hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()==profile_before[i],('profile_mutated',i)
(LOCAL/'live-report.json').write_text(json.dumps(report,ensure_ascii=False));(LOCAL/'live-overview.json').write_text(json.dumps(after,ensure_ascii=False));(LOCAL/'live-report-id.txt').write_text(report_id)
result={'authenticatedTestIdentities':20,'realHumanParticipants':False,'realDeployedEdge':True,'rlsAndRpcDenyBrowser':True,'eachSectTenSeats':True,'duplicateReplySameBattle':True,'reverseChallengeSameBattle':True,'bothAccountsIdenticalReport':True,'tamperedResultRejected':True,'selectionRankRule':True,'selectionOutcome':duel['replay']['outcome'],'currentRepresentativesStillLocked':True,'allTwentyLifeSavesUnchanged':True,'privateStoryNotExposed':True,'nativeIphone':False,'qaCleanupPending':True}
(OUT/'cloud-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('CLOUD_WAR_PASS',json.dumps(result),flush=True)
