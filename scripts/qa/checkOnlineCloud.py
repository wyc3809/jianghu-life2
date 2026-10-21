"""二人雲端真API驗收；本機設定／session只寫ignored目錄，報告唔含金鑰或邀請。"""
import json, uuid, urllib.request, urllib.error, time, concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[2]
config=json.loads((root/'.local-online/cloud-config.json').read_text())
folder=root/'production/qa/evidence/redesign/online-cloud'; folder.mkdir(parents=True,exist_ok=True)
def request(path,token=None,data=None):
    h={'apikey':config['key'],'Content-Type':'application/json','Origin':'https://wyc3809.github.io'}
    if token: h['Authorization']='Bearer '+token
    req=urllib.request.Request(config['url']+path,headers=h,data=json.dumps(data).encode() if data is not None else None)
    try:
        with urllib.request.urlopen(req,timeout=30) as r: return r.status,json.load(r)
    except urllib.error.HTTPError as e:
        try: body=json.load(e)
        except Exception: body={}
        return e.code,body
sessions=[]
for i in range(3):
    status,s=request('/auth/v1/signup',data={})
    assert status==200 and s.get('access_token'), ('signup',status,s.get('msg'))
    sessions.append(s)
(root/'.local-online/cloud-qa-sessions.json').write_text(json.dumps(sessions))
clients=[str(uuid.uuid4()) for i in range(3)]
room=None
def call(i,action,data=None,room_id=None):
    return request('/functions/v1/jianghu-pair',sessions[i]['access_token'],{'action':action,'roomId':room_id or room,'clientId':clients[i],'data':data or {}})
status,a=call(0,'create'); assert status==200,('create',status,a)
room=a['room']['id']; invite=a['room']['invite']
assert a['room']['waiting'] and len(a['peers'])==1
status,again=call(0,'create'); assert status==200 and again['room']['id']==room
status,b=call(1,'join',{'invite':invite}); assert status==200 and b['me']['id']=='cloud',('join',status,b)
assert 'invite' not in b['room']
status,c=call(2,'join',{'invite':invite}); assert status==409,('third',status,c)
status,c=call(2,'world'); assert status==403
status,c=call(1,'challenge',{'requestId':str(uuid.uuid4()),'target':'river','damage':999}); assert status==400
status,c=request('/rest/v1/jianghu_pair_rooms?select=id',sessions[0]['access_token']); assert status in (401,403)
status,c=request('/functions/v1/jianghu-pair','fake',{'action':'world','clientId':clients[0],'roomId':room}); assert status==401
payload={'requestId':str(uuid.uuid4()),'target':'cloud'}
with concurrent.futures.ThreadPoolExecutor() as ex: results=list(ex.map(lambda _:call(0,'challenge',payload),range(2)))
assert all(s==200 for s,d in results),[(s,d) for s,d in results]
assert results[0][1]['battleId']==results[1][1]['battleId']
time.sleep(2)
status,a=call(0,'world'); status,b=call(1,'world')
assert len(a['battles'])==1 and a['me']['rank']==20 and b['me']['rank']==100
assert a['battles'][0]['after']==b['battles'][0]['after']
assert a['battles'][0]['settledAt'] is not None
status,c=call(0,'challenge',payload); assert status==200
status,c=call(0,'world'); assert len(c['battles'])==1
status,c=call(0,'loadout',{'requestId':str(uuid.uuid4()),'external':['art_river_fist','art_stone_palm'],'internal':'art_iron_body','qinggong':'qg_broken_bridge'}); assert status==200
status,c=call(0,'world'); assert c['me']['character']['equippedArts'][:2]==['art_river_fist','art_stone_palm']
status,c=call(1,'leave'); assert status==200
# 真實等待離線一分鐘；API讀取／重連先按伺服器時計補結算。
time.sleep(62)
status,b=call(1,'resume'); assert status==200 and b['me']['pendingOffline']>=1
offline_before=b['me']['pendingOffline']
claim={'requestId':str(uuid.uuid4())}
with concurrent.futures.ThreadPoolExecutor() as ex: claims=list(ex.map(lambda _:call(1,'claim',claim),range(2)))
assert claims[0][0]==claims[1][0]==200 and claims[0][1]==claims[1][1]
status,after=call(1,'world'); assert after['me']['silver']==claims[0][1]['total']
assert after['me']['pendingOffline']==0
status,c=call(1,'challenge',{'requestId':str(uuid.uuid4()),'target':'river'}); assert status==200
# 兩人離線，之後重讀亦只結算同一份已產生結果。
call(0,'leave');call(1,'leave'); time.sleep(2)
status,a=call(0,'world'); status,b=call(1,'world')
assert len(a['battles'])==2 and a['me']['rank']==20 and b['me']['rank']==100
report={'provider':'Supabase Edge + Postgres','room_slots':2,'actual_authenticated_users':3,'third_user_denied':True,'foreign_room_denied':True,'forged_jwt_denied':True,'direct_database_denied':True,'stat_tamper_denied':True,'duplicate_create_same_room':True,'concurrent_duplicate_challenge_one_battle':True,'same_settled_battle_both_players':True,'offline_defence':True,'ranks':[a['me']['rank'],b['me']['rank']],'failed_challenge_ranks_unchanged':True,'offline_pending_before_claim':offline_before,'duplicate_claim_one_credit':True,'loadout_saved':True,'battle_count':len(a['battles']),'life_health_unchanged':a['me']['character']['health']==a['battles'][0]['characters']['river']['health']}
(folder/'api-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
