-- 門派會武與既有世界分開；只容許已驗身份Edge的service_role交易。
create table public.jianghu_sect_world(id integer primary key check(id=1),revision bigint not null default 0,payload jsonb not null);
insert into public.jianghu_sect_world values(1,0,'{"term":0,"members":{},"ranks":{},"teams":{},"matches":[]}'::jsonb);
create table public.jianghu_sect_reports(id uuid primary key,term bigint not null,pair text not null,payload jsonb not null,created_at timestamptz not null default now(),unique(term,pair));
create table public.jianghu_sect_receipts(user_id uuid not null,request_id text not null,input text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_id));
create index jianghu_sect_receipts_recent on public.jianghu_sect_receipts(user_id,created_at desc);
alter table public.jianghu_sect_world enable row level security;
alter table public.jianghu_sect_reports enable row level security;
alter table public.jianghu_sect_receipts enable row level security;
revoke all on public.jianghu_sect_world,public.jianghu_sect_reports,public.jianghu_sect_receipts from public,anon,authenticated;
grant select,insert,update,delete on public.jianghu_sect_world,public.jianghu_sect_reports,public.jianghu_sect_receipts to service_role;
create function public.commit_jianghu_sect(p_expected bigint,p_payload jsonb,p_report jsonb,p_receipt jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare pair_key text;
begin
 update public.jianghu_sect_world set revision=p_expected+1,payload=p_payload where id=1 and revision=p_expected;
 if not found then return false;end if;
 if p_report is not null and p_report<>'null'::jsonb then
  select string_agg(value,':' order by value) into pair_key from jsonb_array_elements_text(p_report->'sides');
  insert into public.jianghu_sect_reports(id,term,pair,payload)values((p_report->>'id')::uuid,(p_report->>'term')::bigint,pair_key,p_report);
 end if;
 if p_receipt is not null and p_receipt<>'null'::jsonb then
  insert into public.jianghu_sect_receipts(user_id,request_id,input,result)values((p_receipt->>'user_id')::uuid,p_receipt->>'request_id',p_receipt->>'input',p_receipt->'result');
 end if;
 return true;
end$$;
revoke all on function public.commit_jianghu_sect(bigint,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.commit_jianghu_sect(bigint,jsonb,jsonb,jsonb) to service_role;
comment on table public.jianghu_sect_reports is '門派會武：同週同對手只一場，保存公開戰鬥快照及伺服器校驗，沒有經濟派獎';
