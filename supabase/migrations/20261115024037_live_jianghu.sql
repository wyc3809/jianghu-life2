-- 同遊：只有通知版本可由本人直接讀；訊息及舉報均經驗證身份Edge。
create table public.jianghu_live_notifications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1, updated_at timestamptz not null default now()
);
alter table public.jianghu_live_notifications enable row level security;
revoke all on public.jianghu_live_notifications from public,anon,authenticated;
grant select on public.jianghu_live_notifications to authenticated;
grant all on public.jianghu_live_notifications to service_role;
create policy "live notifications owner" on public.jianghu_live_notifications for select to authenticated using ((select auth.uid())=user_id);
create table public.jianghu_chat_messages (
 id uuid primary key, seq bigint generated always as identity unique,
 sender uuid not null references auth.users(id) on delete cascade,
 recipient uuid references auth.users(id) on delete cascade,
 name text not null, body text not null check (char_length(body) between 1 and 300),
 created_at timestamptz not null default now()
);
create index jianghu_chat_public_recent on public.jianghu_chat_messages(seq desc) where recipient is null;
create index jianghu_chat_sender_recent on public.jianghu_chat_messages(sender,created_at desc);
create index jianghu_chat_recipient_recent on public.jianghu_chat_messages(recipient,seq desc);
create table public.jianghu_chat_blocks (
 user_id uuid not null references auth.users(id) on delete cascade,
 blocked uuid not null references auth.users(id) on delete cascade,
 primary key(user_id,blocked),check(user_id<>blocked)
);
create index jianghu_chat_blocked on public.jianghu_chat_blocks(blocked,user_id);
create table public.jianghu_chat_reports (
 id uuid primary key, reporter uuid not null references auth.users(id) on delete cascade,
 message_id uuid references public.jianghu_chat_messages(id) on delete set null,
 reason text not null check(char_length(reason) between 1 and 200),
 evidence jsonb not null, created_at timestamptz not null default now(),
 unique(reporter,message_id)
);
alter table public.jianghu_chat_messages enable row level security;
alter table public.jianghu_chat_blocks enable row level security;
alter table public.jianghu_chat_reports enable row level security;
revoke all on public.jianghu_chat_messages,public.jianghu_chat_blocks,public.jianghu_chat_reports from public,anon,authenticated;
grant all on public.jianghu_chat_messages,public.jianghu_chat_blocks,public.jianghu_chat_reports to service_role;
grant usage,select on sequence public.jianghu_chat_messages_seq_seq to service_role;
create function public.notify_jianghu_live(p_users uuid[]) returns void language sql security invoker set search_path='' as $$
 insert into public.jianghu_live_notifications(user_id)
 select distinct u from unnest(p_users) as t(u) where u is not null order by u
 on conflict(user_id) do update set revision=public.jianghu_live_notifications.revision+1,updated_at=now();
$$;
revoke all on function public.notify_jianghu_live(uuid[]) from public,anon,authenticated;
grant execute on function public.notify_jianghu_live(uuid[]) to service_role;
create function public.wake_jianghu_live() returns trigger language plpgsql security invoker set search_path='' as $$
declare old_view jsonb; new_view jsonb;
begin
 select jsonb_object_agg(key,jsonb_build_array(value->'rank',value->'busy',value->'protectedUntil',value->'live',value->'character'->'name')) into old_view from jsonb_each(old.payload->'world'->'players');
 select jsonb_object_agg(key,jsonb_build_array(value->'rank',value->'busy',value->'protectedUntil',value->'live',value->'character'->'name')) into new_view from jsonb_each(new.payload->'world'->'players');
 if old_view is distinct from new_view then
  perform public.notify_jianghu_live(array(select key::uuid from jsonb_each(new.payload->'world'->'players') where value->'live'->>'joined'='true' or old.payload->'world'->'players'->key->'live'->>'joined'='true'));
 end if;
 return new;
end $$;
revoke all on function public.wake_jianghu_live() from public,anon,authenticated;
grant execute on function public.wake_jianghu_live() to service_role;
create trigger wake_live_after_world after update on public.jianghu_world for each row execute function public.wake_jianghu_live();
create function public.jianghu_live_social(p_user uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare w jsonb; profile jsonb; target uuid; msg public.jianghu_chat_messages; old_msg public.jianghu_chat_messages; result jsonb; cursor_value bigint; ids uuid[];
begin
 -- 同一發言者序列化，避免併發繞過發言限頻。
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,76));
 select payload->'world'->'players' into w from public.jianghu_world where id=1 for share;
 profile=w->p_user::text;
 if profile is null or coalesce(profile->'live'->>'joined','false')<>'true' then raise exception '請先加入同遊江湖。' using errcode='P0001'; end if;
 if p_action='send' then
  target=nullif(p_data->>'target','')::uuid;
  select * into old_msg from public.jianghu_chat_messages where id=(p_data->>'requestId')::uuid;
  if found then
   if old_msg.sender<>p_user or old_msg.recipient is distinct from target or old_msg.body<>btrim(p_data->>'body') then raise exception '同一指令不可更改內容。';end if;
   return jsonb_build_object('ok',true,'id',old_msg.id);
  end if;
  if target=p_user or (target is not null and coalesce(w->target::text->'live'->>'joined','false')<>'true') then raise exception '對方尚未加入同遊。';end if;
  if target is not null and exists(select 1 from public.jianghu_chat_blocks where (user_id=p_user and blocked=target) or(user_id=target and blocked=p_user)) then raise exception '此刻無法傳送私訊。';end if;
  if exists(select 1 from public.jianghu_chat_messages where sender=p_user and created_at>clock_timestamp()-interval '2 seconds') then raise exception '請稍候再發言。';end if;
  insert into public.jianghu_chat_messages(id,sender,recipient,name,body) values((p_data->>'requestId')::uuid,p_user,target,profile->'character'->>'name',btrim(p_data->>'body')) returning * into msg;
  ids=case when target is not null then array[p_user,target] else array(select key::uuid from jsonb_each(w) where value->'live'->>'joined'='true') end;
  perform public.notify_jianghu_live(ids);
  return jsonb_build_object('ok',true,'id',msg.id);
 elsif p_action='block' then
  target=(p_data->>'target')::uuid;
  if target=p_user then raise exception '不能屏蔽自己。';end if;
  if (p_data->>'blocked')::boolean then insert into public.jianghu_chat_blocks values(p_user,target) on conflict do nothing;
  else delete from public.jianghu_chat_blocks where user_id=p_user and blocked=target;end if;
  perform public.notify_jianghu_live(array[p_user,target]);return jsonb_build_object('ok',true);
 elsif p_action='report' then
  select * into msg from public.jianghu_chat_messages where id=(p_data->>'messageId')::uuid and (recipient is null or sender=p_user or recipient=p_user);
  if not found then raise exception '找不到可舉報的訊息。';end if;
  insert into public.jianghu_chat_reports(id,reporter,message_id,reason,evidence) values((p_data->>'requestId')::uuid,p_user,msg.id,p_data->>'reason',to_jsonb(msg)) on conflict(reporter,message_id) do nothing;
  return jsonb_build_object('ok',true);
 elsif p_action='messages' then
  target=nullif(p_data->>'target','')::uuid;cursor_value=coalesce((p_data->>'after')::bigint,0);
  select jsonb_agg(to_jsonb(t) order by seq) into result from (
   select m.id,m.seq,m.sender,m.recipient,m.name,m.body,m.created_at from public.jianghu_chat_messages m
   where ((target is null and recipient is null) or(target is not null and ((sender=p_user and recipient=target)or(sender=target and recipient=p_user))))
   and not exists(select 1 from public.jianghu_chat_blocks b where (b.user_id=p_user and b.blocked=m.sender)or(b.user_id=m.sender and b.blocked=p_user))
   and m.seq>cursor_value order by seq desc limit 100
  ) t;
  return jsonb_build_object('messages',coalesce(result,'[]'::jsonb),'blocked',coalesce((select jsonb_agg(blocked) from public.jianghu_chat_blocks where user_id=p_user),'[]'::jsonb));
 end if;
 raise exception '不支援此同遊指令。';
end $$;
revoke all on function public.jianghu_live_social(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.jianghu_live_social(uuid,text,jsonb) to service_role;
alter publication supabase_realtime add table public.jianghu_live_notifications;
