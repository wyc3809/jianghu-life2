-- 二人封測獨立世界；瀏覽器無直接讀寫權，Edge先驗身份／房間再以CAS提交。
create table public.jianghu_pair_rooms (
  id uuid primary key,
  host_id uuid not null unique references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  invite uuid not null unique,
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  constraint pair_different_players check (guest_id is null or guest_id <> host_id),
  constraint pair_host_room check (id = host_id)
);
create index jianghu_pair_rooms_guest_idx on public.jianghu_pair_rooms(guest_id) where guest_id is not null;
alter table public.jianghu_pair_rooms enable row level security;
revoke all on public.jianghu_pair_rooms from public, anon, authenticated;
grant select, insert, update, delete on public.jianghu_pair_rooms to service_role;
comment on table public.jianghu_pair_rooms is '第32項二人封測；RLS刻意無前端policy，所有行動經已驗身份Edge入口。';
