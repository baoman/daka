-- V2.4 增量迁移：(姓名, 验证码) 组合唯一标识孩子
-- 在 Supabase SQL Editor 执行本文件

-- 1. 先清理：同 owner + 同 name 的多条记录只保留一条（避免唯一约束冲突时无法添加）
delete from public.children a
using public.children b
where a.owner_id = b.owner_id
  and a.name = b.name
  and a.code_plain = b.code_plain
  and a.id > b.id;

-- 2. 删除旧的 (owner_id, name) 唯一约束
alter table public.children drop constraint if exists children_owner_name_unique;

-- 3. 添加新的 (owner_id, name, code_plain) 唯一约束
alter table public.children add constraint children_owner_name_code_unique unique (owner_id, name, code_plain);
