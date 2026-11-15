-- 保留原資格、私訊隔離與兩秒限頻；寫入時間採真正取得鎖後的時計。
create or replace function public.jianghu_live_social(p_user uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare w jsonb; profile jsonb; target uuid; msg public.jianghu_chat_messages; old_msg public.jianghu_chat_messages; result jsonb; cursor_value bigint; ids uuid[];
begin
 -- 同一發言者序列化，避免併發繞過發言限頻。
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,76));
 -- 補讀走MVCC快照，不與全服交鋒爭行鎖；變更仍鎖住參與資格。
 if p_action='messages' then
  select payload->'world'->'players' into w from public.jianghu_world where id=1;
 else
  select payload->'world'->'players' into w from public.jianghu_world where id=1 for share;
 end if;
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
  if exists(select 1 from public.jianghu_chat_messages where sender=p_user and created_at>clock_timestamp()-interval '2 seconds') then raise exception '請稍候再發言。' using errcode='P0429';end if;
  insert into public.jianghu_chat_messages(id,sender,recipient,name,body,created_at) values((p_data->>'requestId')::uuid,p_user,target,profile->'character'->>'name',btrim(p_data->>'body'),clock_timestamp()) returning * into msg;
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
