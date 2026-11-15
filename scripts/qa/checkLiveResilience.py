"""三個隔離身份驗合併補讀與限頻，憑證沿用ignored測試檔。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkLiveCloud.py').read_text().split('\nfor i,a in enumerate(accounts):call')[0],'helpers','exec'))
for i,a in enumerate(accounts):call(i,'liveEnter',{'name':a['state']['character']['name']})
baseline=call(0,'world')['revision']
with concurrent.futures.ThreadPoolExecutor(8) as ex:
 views=list(ex.map(lambda _:call(0,'view'),range(40)))
assert all(v['snapshot']['revision']==baseline for v in views)
assert call(0,'world')['revision']==baseline
renew=call(0,'view',{'renew':True});assert renew['snapshot']['revision']==baseline+1
time.sleep(2.1)
inputs=[{'requestId':str(uuid.uuid4()),'body':'併發限頻驗收'+str(i)} for i in range(4)]
def send(data):
 a=accounts[0];status,value=request('/functions/v1/jianghu-live',{'action':'send','clientId':a['clientId'],'data':data},a['auth']['access_token']);return status,value
with concurrent.futures.ThreadPoolExecutor(4) as ex:sent=list(ex.map(send,inputs))
assert sorted(s for s,_ in sent)==[200,429,429,429],sent
accepted=inputs[next(i for i,(s,_) in enumerate(sent) if s==200)]
assert send(accepted)[0]==200
retry=inputs[next(i for i,(s,_) in enumerate(sent) if s==429)]
time.sleep(2.1);assert send(retry)[0]==200
time.sleep(2.1);secret=str(uuid.uuid4());call(0,'send',{'requestId':secret,'body':'合併補讀私訊驗收','target':accounts[1]['id']})
assert any(m['id']==secret for m in call(1,'view',{'target':accounts[0]['id']})['chat']['messages'])
assert not any(m['id']==secret for m in call(2,'view',{'target':accounts[0]['id']})['chat']['messages'])
call(0,'liveLeave');left=call(0,'view',{'renew':True});assert not left['snapshot']['me']['live']['joined'] and left['chat']['messages']==[]
for i in [1,2]:call(i,'liveLeave')
report={'actualAccounts':3,'concurrentReadViews':40,'readOnlyRevisionStable':True,'oneRenewOneWorldCommit':True,'concurrentDistinctSends':4,'accepted':1,'rateLimited429':3,'committedMessageReplay200':True,'rateLimitedSameIdRetry200':True,'combinedPrivateNoThirdPartyLeak':True,'otherTabExitRecovery':True,'capacityGuarantee':False}
(OUT/'resilience-cloud.json').write_text(json.dumps(report,indent=2)+'\n');print('LIVE_RESILIENCE_CLOUD_PASS',flush=True)
