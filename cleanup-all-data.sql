-- 清空所有业务数据（保留表结构）
-- 在 Supabase SQL Editor 执行本文件
-- 用 DO 块动态判断：不存在的表自动跳过，不报错

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'reward_claims','reward_codes','daily_checkins',
    'schedule_overrides','children','family_devices','family_groups'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute 'delete from public.' || tbl;
    end if;
  end loop;
end $$;

-- 确认结果
select 'children' as tbl, count(*) as rows from public.children
union all select 'reward_codes', count(*) from public.reward_codes
union all select 'reward_claims', count(*) from public.reward_claims
union all select 'daily_checkins', count(*) from public.daily_checkins
union all select 'schedule_overrides', count(*) from public.schedule_overrides;
