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

-- ============================================================
-- v2 マイグレーション: 新機能追加
-- 既存のデータベースに対して実行してください
-- ============================================================

-- transactions テーブルに type カラム追加 (income / expense)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'expense';

-- transactions の user_type に 'giyodoll' を許可 (コメントのみ、制約なし)
-- user_type: 'user1' | 'user2' | 'giyodoll'

-- room_settings にアイコン・カスタムカテゴリカラム追加
ALTER TABLE room_settings
  ADD COLUMN IF NOT EXISTS user1_username text,
  ADD COLUMN IF NOT EXISTS user1_password text,
  ADD COLUMN IF NOT EXISTS user2_username text,
  ADD COLUMN IF NOT EXISTS user2_password text,
  ADD COLUMN IF NOT EXISTS user1_icon text,
  ADD COLUMN IF NOT EXISTS user2_icon text,
  ADD COLUMN IF NOT EXISTS giyodoll_icon text,
  ADD COLUMN IF NOT EXISTS expense_categories jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS income_categories jsonb DEFAULT NULL;

-- Supabase Storage: avatars バケットを public で作成
-- ダッシュボード > Storage > New bucket > "avatars" > Public bucket にチェック
-- または以下のSQLで作成（supabase_storage スキーマが必要な場合）:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
