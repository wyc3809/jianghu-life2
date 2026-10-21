-- 共用非同步江湖；全部瀏覽器寫入關閉，由驗證身份嘅Edge提交。
create table public.jianghu_world (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  payload jsonb not null
);
insert into public.jianghu_world(id, payload) values (1,
  '{"world":{"version":1,"revision":0,"players":{},"battles":[]},"presence":{}}'::jsonb);

create table public.jianghu_world_battles (
  id uuid primary key,
  attacker uuid not null,
  defender uuid not null,
  started_at bigint not null,
  settled_at bigint,
  payload jsonb not null
);
create index jianghu_world_battles_attacker on public.jianghu_world_battles(attacker, started_at desc);
create index jianghu_world_battles_defender on public.jianghu_world_battles(defender, started_at desc);

create table public.jianghu_world_receipts (
  user_id uuid not null,
  request_id text not null,
  input text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create index jianghu_world_receipts_recent on public.jianghu_world_receipts(user_id, created_at desc);

alter table public.jianghu_world enable row level security;
alter table public.jianghu_world_battles enable row level security;
alter table public.jianghu_world_receipts enable row level security;
revoke all on public.jianghu_world, public.jianghu_world_battles, public.jianghu_world_receipts from public, anon, authenticated;
grant select, insert, update, delete on public.jianghu_world, public.jianghu_world_battles, public.jianghu_world_receipts to service_role;

create function public.commit_jianghu_world(p_expected bigint, p_payload jsonb, p_battles jsonb, p_receipt jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare battle jsonb;
begin
  update public.jianghu_world set revision = p_expected + 1, payload = p_payload
    where id = 1 and revision = p_expected;
  if not found then return false; end if;
  for battle in select value from jsonb_array_elements(p_battles) loop
    insert into public.jianghu_world_battles(id, attacker, defender, started_at, settled_at, payload)
      values ((battle->>'id')::uuid, (battle->>'attacker')::uuid, (battle->>'defender')::uuid,
        (battle->>'startedAt')::bigint, (battle->>'settledAt')::bigint, battle)
      on conflict(id) do update set payload=excluded.payload, settled_at=excluded.settled_at
        where public.jianghu_world_battles.settled_at is null;
  end loop;
  if p_receipt is not null and p_receipt <> 'null'::jsonb then
    insert into public.jianghu_world_receipts(user_id, request_id, input, result)
      values ((p_receipt->>'user_id')::uuid, p_receipt->>'request_id', p_receipt->>'input', p_receipt->'result');
  end if;
  return true;
end $$;
revoke all on function public.commit_jianghu_world(bigint,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.commit_jianghu_world(bigint,jsonb,jsonb,jsonb) to service_role;
