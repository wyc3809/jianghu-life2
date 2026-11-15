-- 重啟組織功能；既有門派資料只補缺席世界列，不覆寫名冊。
insert into public.jianghu_sect_world(id,revision,payload) values(1,0,'{"term":0,"members":{},"ranks":{},"teams":{},"matches":[]}') on conflict(id) do nothing;
create table public.jianghu_guild_world(id integer primary key check(id=1),revision bigint not null default 0,payload jsonb not null);
insert into public.jianghu_guild_world select 1,0,jsonb_build_object('guilds','{}'::jsonb,'members','{}'::jsonb,'activity','{}'::jsonb,'applications','{}'::jsonb,'reports','[]'::jsonb,'cities',(select jsonb_object_agg(c,jsonb_build_object('id',c,'guildId',null,'defenderId',null,'defender',null,'heldSince',0,'accruedAt',0,'protectedUntil',0)) from unnest(array['luoyang','changan','xiangyang','dali','chengdu','gusu','linan','kaifeng','quanzhou','yangzhou']) c));
create table public.jianghu_guild_reports(id uuid primary key,payload jsonb not null,created_at timestamptz not null default now());
create table public.jianghu_guild_receipts(user_id uuid not null,request_id uuid not null,input text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_id));
create index guild_receipts_recent on public.jianghu_guild_receipts(user_id,created_at desc);
create table public.jianghu_organization_messages(id uuid primary key,seq bigint generated always as identity unique,kind text not null check(kind in ('guild','sect')),group_id text not null,sender uuid not null references auth.users(id) on delete cascade,name text not null,body text not null check(char_length(body) between 1 and 300),created_at timestamptz not null default clock_timestamp());
create index organization_messages_channel on public.jianghu_organization_messages(kind,group_id,seq desc);
create index organization_messages_sender on public.jianghu_organization_messages(sender,created_at desc);
create table public.jianghu_organization_reports(id uuid primary key,reporter uuid not null references auth.users(id) on delete cascade,message_id uuid references public.jianghu_organization_messages(id) on delete set null,reason text not null,evidence jsonb not null,created_at timestamptz not null default now(),unique(reporter,message_id));
alter table public.jianghu_guild_world enable row level security;
alter table public.jianghu_guild_reports enable row level security;
alter table public.jianghu_guild_receipts enable row level security;
alter table public.jianghu_organization_messages enable row level security;
alter table public.jianghu_organization_reports enable row level security;
revoke all on public.jianghu_guild_world,public.jianghu_guild_reports,public.jianghu_guild_receipts,public.jianghu_organization_messages,public.jianghu_organization_reports from public,anon,authenticated;
grant select,insert,update,delete on public.jianghu_guild_world,public.jianghu_guild_reports,public.jianghu_guild_receipts,public.jianghu_organization_messages,public.jianghu_organization_reports to service_role;
grant usage,select on sequence public.jianghu_organization_messages_seq_seq to service_role;
create function public.commit_jianghu_guild(p_expected bigint,p_payload jsonb,p_report jsonb,p_receipt jsonb) returns boolean language plpgsql security invoker set search_path='' as $$
declare prior_revision bigint; prior jsonb;
begin
 select revision,payload into prior_revision,prior from public.jianghu_guild_world where id=1 for update;
 if prior_revision is distinct from p_expected then return false;end if;
 update public.jianghu_guild_world set revision=p_expected+1,payload=p_payload where id=1;
 if p_report is not null and p_report<>'null'::jsonb then insert into public.jianghu_guild_reports(id,payload) values((p_report->>'id')::uuid,p_report);end if;
 insert into public.jianghu_guild_receipts(user_id,request_id,input,result)values((p_receipt->>'user_id')::uuid,(p_receipt->>'request_id')::uuid,p_receipt->>'input',p_receipt->'result');
 perform public.notify_jianghu_live(array(select id::uuid from (select jsonb_object_keys(prior->'members') id union select jsonb_object_keys(p_payload->'members') id) m));
 return true;
end $$;
revoke all on function public.commit_jianghu_guild(bigint,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.commit_jianghu_guild(bigint,jsonb,jsonb,jsonb) to service_role;
create function public.jianghu_organization_social(p_user uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare kind_value text:=p_data->>'kind'; group_value text:=p_data->>'group'; w jsonb; profile jsonb; eligible boolean:=false; ids uuid[]; msg public.jianghu_organization_messages; old_msg public.jianghu_organization_messages; result jsonb; target uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,78));
 if kind_value='guild' then
  if p_action='messages' then select payload into w from public.jianghu_guild_world where id=1;
  else select payload into w from public.jianghu_guild_world where id=1 for share;end if;
  eligible=coalesce(w->'members'->p_user::text->>'guildId','')=group_value;
  ids=array(select key::uuid from jsonb_each(w->'members') where value->>'guildId'=group_value);
 elsif kind_value='sect' then
  if p_action='messages' then select payload into w from public.jianghu_sect_world where id=1;
  else select payload into w from public.jianghu_sect_world where id=1 for share;end if;
  select payload->'life' into profile from public.saves where user_id=p_user;
  eligible=coalesce(w->'members'->p_user::text->>'sectId','')=group_value and coalesce(profile->'character'->>'sectId','')=group_value;
  ids=array(select key::uuid from jsonb_each(w->'members') where value->>'sectId'=group_value);
 end if;
 if eligible is distinct from true then raise exception '你已不在這個組織，請重新載入名冊。';end if;
 if p_action='send' then
  select * into old_msg from public.jianghu_organization_messages where id=(p_data->>'requestId')::uuid;
  if found then
   if old_msg.sender<>p_user or old_msg.kind<>kind_value or old_msg.group_id<>group_value or old_msg.body<>btrim(p_data->>'body') then raise exception '同一指令不可更改內容。';end if;
   return jsonb_build_object('ok',true,'id',old_msg.id);
  end if;
  if exists(select 1 from public.jianghu_organization_messages where sender=p_user and created_at>clock_timestamp()-interval '2 seconds') then raise exception '請稍候再發言。' using errcode='P0429';end if;
  select payload->'life' into profile from public.saves where user_id=p_user;
  if profile->>'phase' is distinct from 'playing' or profile->'character'->>'alive' is distinct from 'true' then raise exception '請先保存目前人物。';end if;
  insert into public.jianghu_organization_messages(id,kind,group_id,sender,name,body,created_at) values((p_data->>'requestId')::uuid,kind_value,group_value,p_user,profile->'character'->>'name',btrim(p_data->>'body'),clock_timestamp()) returning * into msg;
  perform public.notify_jianghu_live(ids);return jsonb_build_object('ok',true,'id',msg.id);
 elsif p_action='block' then
  target=(p_data->>'target')::uuid;if target=p_user then raise exception '不能屏蔽自己。';end if;
  if (p_data->>'blocked')::boolean then insert into public.jianghu_chat_blocks values(p_user,target) on conflict do nothing;else delete from public.jianghu_chat_blocks where user_id=p_user and blocked=target;end if;
  perform public.notify_jianghu_live(array[p_user,target]);return jsonb_build_object('ok',true);
 elsif p_action='reportMessage' then
  select * into msg from public.jianghu_organization_messages where id=(p_data->>'messageId')::uuid and kind=kind_value and group_id=group_value;
  if not found then raise exception '找不到可舉報的訊息。';end if;
  insert into public.jianghu_organization_reports(id,reporter,message_id,reason,evidence)values((p_data->>'requestId')::uuid,p_user,msg.id,p_data->>'reason',to_jsonb(msg)) on conflict(reporter,message_id) do nothing;
  return jsonb_build_object('ok',true);
 elsif p_action='messages' then
  select jsonb_agg(to_jsonb(t) order by seq) into result from (
   select m.id,m.seq,m.sender,null::uuid recipient,m.name,m.body,m.created_at from public.jianghu_organization_messages m where m.kind=kind_value and m.group_id=group_value and not exists(select 1 from public.jianghu_chat_blocks b where (b.user_id=p_user and b.blocked=m.sender)or(b.user_id=m.sender and b.blocked=p_user)) order by seq desc limit 100
  ) t;
  return jsonb_build_object('messages',coalesce(result,'[]'::jsonb),'blocked',coalesce((select jsonb_agg(blocked) from public.jianghu_chat_blocks where user_id=p_user),'[]'::jsonb),'blockedNames',coalesce((select jsonb_object_agg(b.blocked::text,coalesce(s.payload->'life'->'character'->>'name','江湖俠客')) from public.jianghu_chat_blocks b left join public.saves s on s.user_id=b.blocked where b.user_id=p_user),'{}'::jsonb));
 end if;
 raise exception '不支援此組織對話指令。';
end $$;
revoke all on function public.jianghu_organization_social(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.jianghu_organization_social(uuid,text,jsonb) to service_role;
