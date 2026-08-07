-- V2.5 增量迁移：children.id 改为 text token（由 name+验证码+时间戳生成）
-- 在 Supabase SQL Editor 执行本文件

-- 1. 删除引用 children.id 的外键约束
alter table public.daily_checkins drop constraint if exists daily_checkins_child_id_fkey;
alter table public.reward_codes drop constraint if exists reward_codes_child_id_fkey;
alter table public.reward_claims drop constraint if exists reward_claims_child_id_fkey;
alter table public.daily_checkins drop constraint if exists daily_checkins_child_id_fkey1;
alter table public.reward_codes drop constraint if exists reward_codes_child_id_fkey1;
alter table public.reward_claims drop constraint if exists reward_claims_child_id_fkey1;

-- 2. 删除旧数据（id 需重新生成）
delete from public.reward_claims;
delete from public.reward_codes;
delete from public.daily_checkins;
delete from public.children;

-- 3. children.id 改为 text（删除主键默认值约束）
alter table public.children alter column id drop default;
alter table public.children alter column id type text using id::text;

-- 4. 引用列类型改为 text
alter table public.daily_checkins alter column child_id type text using child_id::text;
alter table public.reward_codes alter column child_id type text using child_id::text;
alter table public.reward_claims alter column child_id type text using child_id::text;

-- 5. 重建外键
alter table public.daily_checkins add constraint daily_checkins_child_id_fkey foreign key (child_id) references public.children(id) on delete cascade;
alter table public.reward_codes add constraint reward_codes_child_id_fkey foreign key (child_id) references public.children(id) on delete cascade;
alter table public.reward_claims add constraint reward_claims_child_id_fkey foreign key (child_id) references public.children(id) on delete cascade;

-- 6. 重建领取函数（child_id 改为 text）
drop function if exists public.claim_reward_code(text, uuid);
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
