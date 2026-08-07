-- V3.0 孩子进度表（奖励数据持久化到数据库）
-- 在 Supabase SQL Editor 执行本文件

create table if not exists public.child_progress (
  child_id text primary key references public.children(id) on delete cascade,
  stars integer not null default 0,
  cards jsonb not null default '[]'::jsonb,
  streak integer not null default 0,
  daily_rewards jsonb not null default '{}'::jsonb,
  redeem_claims jsonb not null default '{}'::jsonb,
  exchanges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.child_progress enable row level security;
revoke all on table public.child_progress from anon, authenticated;
