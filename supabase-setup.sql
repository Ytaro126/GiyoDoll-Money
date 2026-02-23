-- ============================================================
-- Giyodoll Money - Supabase テーブルセットアップ
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行
-- ============================================================

-- 取引テーブル
create table if not exists transactions (
  id text primary key,
  room_id text not null,
  date text not null,
  category text not null,
  description text not null default '',
  user_type text not null,  -- 'user1' or 'user2'
  amount numeric not null,
  created_at timestamptz default now()
);

-- 予算テーブル
create table if not exists budgets (
  id text primary key,
  room_id text not null,
  year integer not null,
  month integer,            -- null = 年間予算
  category text,            -- null = 合計予算
  amount numeric not null
);

-- ルーム設定テーブル
create table if not exists room_settings (
  room_id text primary key,
  user1_name text not null default 'ユーザー1',
  user2_name text not null default 'ユーザー2',
  currency text not null default '¥',
  updated_at timestamptz default now()
);

-- Row Level Security を有効化
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table room_settings enable row level security;

-- 全員にアクセスを許可 (room_id が共有パスワードの役割)
create policy "Public access to transactions"
  on transactions for all
  using (true)
  with check (true);

create policy "Public access to budgets"
  on budgets for all
  using (true)
  with check (true);

create policy "Public access to room_settings"
  on room_settings for all
  using (true)
  with check (true);

-- リアルタイム機能を有効化
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table budgets;
alter publication supabase_realtime add table room_settings;
