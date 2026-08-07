-- V2.3 增量迁移：children 加明文验证码列（家长端展示用）
-- 在 Supabase SQL Editor 执行本文件（基于 V2.2 之后）

alter table public.children add column if not exists code_plain text;

-- 旧数据兜底：code_plain 为空时从 password_hash 无法还原，直接清空重建
delete from public.children where code_plain is null;
