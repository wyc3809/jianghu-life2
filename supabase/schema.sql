-- 江湖一生 · 雲端存檔＋排行榜（Supabase）
-- 用法：Supabase Dashboard → SQL Editor → 貼上全部 → Run。可重複執行。
-- 前置：Authentication → Sign In / Providers → 開啟「Allow anonymous sign-ins」同 Email。

-- ───────── 雲端存檔：每個玩家一份（人生存檔＋祖蔭）─────────
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  app_version text not null default '',
  saved_at timestamptz not null default now(),
  constraint saves_payload_size check (pg_column_size(payload) < 2000000)
);

alter table public.saves enable row level security;

drop policy if exists "saves: owner read" on public.saves;
create policy "saves: owner read" on public.saves
  for select using (auth.uid() = user_id);
drop policy if exists "saves: owner insert" on public.saves;
create policy "saves: owner insert" on public.saves
  for insert with check (auth.uid() = user_id);
drop policy if exists "saves: owner update" on public.saves;
create policy "saves: owner update" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ───────── 現世榜：每個玩家一行（現役角色），江湖排名／修為境界 ─────────
create table if not exists public.leaderboard_live (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  jianghu_rank integer not null check (jianghu_rank between 1 and 99999),
  cult_tier smallint not null check (cult_tier between 0 and 14),
  cult_xp bigint not null check (cult_xp >= 0),
  age smallint not null default 0 check (age between 0 and 200),
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_live_rank_idx on public.leaderboard_live (jianghu_rank asc);
create index if not exists leaderboard_live_cult_idx on public.leaderboard_live (cult_tier desc, cult_xp desc);

alter table public.leaderboard_live enable row level security;

drop policy if exists "live: anyone read" on public.leaderboard_live;
create policy "live: anyone read" on public.leaderboard_live
  for select using (true);
drop policy if exists "live: owner insert" on public.leaderboard_live;
create policy "live: owner insert" on public.leaderboard_live
  for insert with check (auth.uid() = user_id);
drop policy if exists "live: owner update" on public.leaderboard_live;
create policy "live: owner update" on public.leaderboard_live
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ───────── 一生榜：每完結一世記一行（同一世唔會重複，靠 life_key）─────────
create table if not exists public.life_scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  life_key text not null check (char_length(life_key) <= 64),
  name text not null check (char_length(name) between 1 and 24),
  score integer not null check (score between 0 and 100000),
  age smallint not null default 0 check (age between 0 and 200),
  cult_tier smallint not null default 0 check (cult_tier between 0 and 14),
  created_at timestamptz not null default now(),
  unique (user_id, life_key)
);

create index if not exists life_scores_score_idx on public.life_scores (score desc);

alter table public.life_scores enable row level security;

drop policy if exists "life: anyone read" on public.life_scores;
create policy "life: anyone read" on public.life_scores
  for select using (true);
drop policy if exists "life: owner insert" on public.life_scores;
create policy "life: owner insert" on public.life_scores
  for insert with check (auth.uid() = user_id);
