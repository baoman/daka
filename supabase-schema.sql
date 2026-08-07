-- V2.2 孩子管理系统（无"家庭"概念，全新重建）
-- 请在 Supabase SQL Editor 完整执行本文件
-- 前置：确认已开启 Anonymous Sign-Ins（Authentication -> Providers）
-- 注意：会清空 children / reward_codes / reward_claims / daily_checkins / schedule_overrides 全部数据

-- ========== 删除旧表（含 V2.0/V2.1 残留结构） ==========
drop table if exists public.reward_claims cascade;
drop table if exists public.reward_codes cascade;
drop table if exists public.daily_checkins cascade;
drop table if exists public.schedule_overrides cascade;
drop table if exists public.children cascade;
drop table if exists public.family_devices cascade;
drop table if exists public.family_groups cascade;

-- ========== 孩子表（id 为 name+验证码+时间戳 生成的唯一 token） ==========
create table public.children (
  id text primary key,
  owner_id uuid not null,
  name text not null,
  code_plain text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint children_owner_name_code_unique unique (owner_id, name, code_plain),
  constraint children_code_plain_valid check (code_plain ~ '^\d{6}$')
);
create index children_owner_idx on public.children (owner_id);

-- ========== 日常打卡（按孩子） ==========
create table public.daily_checkins (
  id bigint generated always as identity primary key,
  child_id text not null references public.children(id) on delete cascade,
  check_date date not null,
  checks jsonb not null default '{}'::jsonb,
  done_count integer not null default 0 check (done_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  is_full boolean not null default false,
  last_synced_at timestamptz not null default now(),
  constraint daily_checkins_child_date_unique unique (child_id, check_date),
  constraint daily_checkins_progress_valid check (done_count <= total_count)
);
create index daily_checkins_child_date_idx on public.daily_checkins (child_id, check_date desc);

-- ========== 奖励码（属于某个孩子） ==========
create table public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  child_id text not null references public.children(id) on delete cascade,
  code_hash text not null unique,
  code_value text not null,
  reward jsonb not null,
  message text not null default '',
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 10),
  used_count integer not null default 0 check (used_count >= 0 and used_count <= max_uses),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reward_codes_code_value_valid check (code_value ~ '^\d{6}$'),
  constraint reward_codes_reward_valid check (
    (reward->>'type' = 'stars' and (reward->>'stars')::integer in (1, 3, 5))
    or (reward->>'type' = 'card' and reward->>'rarity' in ('R','SR','PR','SSR','HR','UR','CP','LGR','SP','GP') and length(coalesce(reward->>'cardId', '')) > 0)
  )
);
create index reward_codes_child_created_idx on public.reward_codes (child_id, created_at desc);
create index reward_codes_active_idx on public.reward_codes (expires_at) where revoked_at is null;

-- ========== 领取记录 ==========
create table public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  reward_code_id uuid not null references public.reward_codes(id) on delete cascade,
  child_id text not null references public.children(id) on delete cascade,
  reward jsonb not null,
  claimed_at timestamptz not null default now(),
  constraint reward_claims_code_child_unique unique (reward_code_id, child_id)
);
create index reward_claims_child_claimed_idx on public.reward_claims (child_id, claimed_at desc);

-- ========== 课表（家长个人） ==========
create table public.schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  schedule_date date not null,
  tasks jsonb not null default '[]'::jsonb,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_overrides_owner_date_unique unique (owner_id, schedule_date),
  constraint schedule_overrides_tasks_is_array check (jsonb_typeof(tasks) = 'array'),
  constraint schedule_overrides_task_limit check (jsonb_array_length(tasks) between 0 and 24)
);
create index schedule_overrides_owner_date_idx on public.schedule_overrides (owner_id, schedule_date);

-- ========== RLS（浏览器不直连，全部走 Edge Function service role） ==========
alter table public.children enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.reward_codes enable row level security;
alter table public.reward_claims enable row level security;
alter table public.schedule_overrides enable row level security;

revoke all on table public.children from anon, authenticated;
revoke all on table public.daily_checkins from anon, authenticated;
revoke all on table public.reward_codes from anon, authenticated;
revoke all on table public.reward_claims from anon, authenticated;
revoke all on table public.schedule_overrides from anon, authenticated;

drop policy if exists "children_read" on public.children;
create policy "children_read" on public.children for select to authenticated using (true);

-- ========== 领取函数 ==========
drop function if exists public.claim_reward_code(text, text);

create or replace function public.claim_reward_code(p_code_hash text, p_child_id text)
returns table (result text, claim_id uuid, reward jsonb, message text, claimed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.reward_codes%rowtype;
  v_claim public.reward_claims%rowtype;
begin
  if not exists (select 1 from public.children where id = p_child_id) then
    return query select 'not_linked'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;

  select * into v_code from public.reward_codes where code_hash = p_code_hash for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;

  if v_code.child_id is null or v_code.child_id <> p_child_id then
    return query select 'not_eligible'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;

  select * into v_claim from public.reward_claims
    where reward_code_id = v_code.id and child_id = p_child_id;
  if found then
    return query select 'already_claimed'::text, v_claim.id, v_claim.reward, v_code.message, v_claim.claimed_at;
    return;
  end if;
  if v_code.revoked_at is not null then
    return query select 'revoked'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;
  if v_code.expires_at <= now() then
    return query select 'expired'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;
  if v_code.used_count >= v_code.max_uses then
    return query select 'used_up'::text, null::uuid, null::jsonb, null::text, null::timestamptz;
    return;
  end if;

  insert into public.reward_claims (reward_code_id, child_id, reward)
    values (v_code.id, p_child_id, v_code.reward)
    returning * into v_claim;
  update public.reward_codes set used_count = used_count + 1 where id = v_code.id;
  return query select 'claimed'::text, v_claim.id, v_claim.reward, v_code.message, v_claim.claimed_at;
end;
$$;

revoke all on function public.claim_reward_code(text, text) from public;
