"""真雲端共用江湖；使用ignored驗收身份，唔提交JWT／key。"""
from pathlib import Path
import json,uuid,time,concurrent.futures,urllib.request,urllib.error
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/online-shared';OUT.mkdir(parents=True,exist_ok=True)
c=json.loads((ROOT/'.local-online/cloud-config.json').read_text());sessions=json.loads((ROOT/'.local-online/cloud-qa-sessions.json').read_text())
clients=[str(uuid.uuid4()) for s in sessions]
def request(path,i,data=None):
 h={'apikey':c['key'],'Authorization':'Bearer '+sessions[i]['access_token'],'Content-Type':'application/json','Origin':'https://wyc3809.github.io'}
 try:
  with urllib.request.urlopen(urllib.request.Request(c['url']+path,headers=h,data=json.dumps(data).encode() if data is not None else None),timeout=30) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def call(i,action,data=None):return request('/functions/v1/jianghu-world',i,{'action':action,'clientId':clients[i],'data':data or {}})
ids=[s['user']['id'] for s in sessions];names=['驗收甲','驗收乙','驗收丙']
for i in range(3):
 status,s=call(i,'register',{'name':names[i]});assert status==200,('register',status,s)
status,a=call(0,'world');assert a['population']>=3 and set(ids).issubset({p['id'] for p in a['peers']}) and 'room' not in a
status,caught=call(0,'challenge',{'requestId':str(uuid.uuid4()),'target':ids[1],'damage':999});assert status==400
for table in ['jianghu_world','jianghu_world_battles','jianghu_world_receipts']:
 status,denied=request('/rest/v1/'+table+'?select=*',0);assert status in (401,403)
status,denied=request('/rest/v1/rpc/commit_jianghu_world',0,{'p_expected':0,'p_payload':{},'p_battles':[],'p_receipt':None});assert status in (401,403,404)
call(0,'leave');before_health=a['me']['character']['health']
payload={'requestId':str(uuid.uuid4()),'target':ids[0]}
with concurrent.futures.ThreadPoolExecutor() as ex: results=list(ex.map(lambda _:call(1,'challenge',payload),range(2)))
assert results[0][0]==results[1][0]==200 and results[0][1]==results[1][1],results
battle_id=results[0][1]['battleId'];time.sleep(2)
status,b=call(1,'world');status,a=call(0,'world');status,third=call(2,'world')
battle=next(x for x in b['battles'] if x['id']==battle_id)
assert next(x for x in a['battles'] if x['id']==battle_id)==battle
assert battle['after'] is not None and battle['settledAt'] is not None
assert len(third['battles'])==0
expected=dict(battle['before'])
if battle['winner']:
 loser=battle['defender'] if battle['winner']==battle['attacker'] else battle['attacker']
 if expected[battle['winner']]>expected[loser]:expected[battle['winner']],expected[loser]=expected[loser],expected[battle['winner']]
assert battle['after']==expected
assert a['me']['character']['health']==before_health
call(1,'challenge',payload);status,again=call(1,'world');assert len([x for x in again['battles'] if x['id']==battle_id])==1
# 無需任何玩家在線，亦唔依賴房間存活；重返後補收益及戰果。
for i in range(3):call(i,'leave')
time.sleep(62)
status,a=call(0,'heartbeat');assert status==200 and a['me']['pendingOffline']>=1
claim={'requestId':str(uuid.uuid4())};old_silver=a['me']['silver']
with concurrent.futures.ThreadPoolExecutor() as ex: claims=list(ex.map(lambda _:call(0,'claim',claim),range(2)))
assert claims[0][0]==claims[1][0]==200 and claims[0][1]==claims[1][1]
status,final=call(0,'world');assert final['me']['silver']==old_silver+claims[0][1]['total']
report={'world':'shared','real_users':3,'no_room_or_invite':True,'all_players_visible':True,'third_player_can_register':True,'third_player_cannot_read_others_battle':True,'all_tables_and_rpc_denied_to_browser':True,'tampered_stats_denied':True,'offline_defence':True,'same_battle_both_players':True,'duplicate_challenge_one_battle':True,'ranks_match_authoritative_winner':True,'unrelated_third_rank_unchanged':third['me']['rank']==3,'life_health_unchanged':True,'all_offline_62seconds_then_resume':True,'offline_income':a['me']['pendingOffline'],'duplicate_claim_one_credit':True}
(OUT/'api-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
