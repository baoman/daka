const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const child = fs.readFileSync(path.join(root, '每日打卡.html'), 'utf8');
const parent = fs.readFileSync(path.join(root, '家长查看.html'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'supabase/functions/family-sync/index.ts'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'supabase-schema.sql'), 'utf8');
const config = fs.readFileSync(path.join(root, 'cloud-config.js'), 'utf8');
const resetPage = fs.readFileSync(path.join(root, '重置密码.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'serve-test.js'), 'utf8');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const codeFixMigration = fs.readFileSync(path.join(root, 'supabase/migrations/20260804180000_fix_six_digit_code_constraints.sql'), 'utf8');

function test(name, fn) { try { fn(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}\n${error.stack}`); process.exitCode = 1; } }

test('小朋友端优先读取指定日期覆盖，再回退原始课表', () => {
  assert.match(child, /const override = getScheduleOverride\(dateKey\(date\)\)/);
  assert.match(child, /return \{ mode: 'custom', title: '今日安排'/);
  assert.match(child, /refreshScheduleOverrides\(\)/);
  assert.match(child, /先清掉该范围缓存/);
  assert.match(child, /课表覆盖是当天任务总量的唯一来源/);
  assert.match(child, /window\.addEventListener\('focus', refreshScheduleOverrides\)/);
  assert.match(child, /document\.addEventListener\('visibilitychange'/);
});

test('家长端课表默认值覆盖课程期和常规期', () => {
  assert.match(parent, /function defaultTasks\(key=/);
  assert.match(parent, /英语暑期课/);
  assert.match(parent, /数学暑期课/);
  assert.match(parent, /cn-read-c/);
});

test('保存课表不会修改历史日期', () => {
  assert.match(parent, /function futureOrToday/);
  assert.match(parent, /已同步历史不能调整/);
  assert.match(parent, /saveScheduleOverrides\(\[\{scheduleDate:key,tasks:currentSchedule\}\]\)/);
});

test('服务端限制单次日期、任务数量与字段', () => {
  assert.match(edge, /items\.length > 31/);
  assert.match(edge, /value\.length > 24/);
  assert.match(edge, /\^\[a-zA-Z0-9_-\]\{2,64\}\$/);
  assert.match(schema, /unique \(family_id, schedule_date\)/i);
});

test('家长页仅通过四个 Tab 进入低频功能', () => {
  assert.match(parent, /data-module="overview"[^>]*>打卡进度/);
  assert.match(parent, /data-module="rewards"[^>]*>奖励发放/);
  assert.match(parent, /data-module="schedule"[^>]*>课表调整/);
  assert.match(parent, /data-module="settings"[^>]*>设备与设置/);
  assert.doesNotMatch(parent, /<div class="overview-actions">/);
});

test('密码重置页校验恢复会话和两次密码', () => {
  assert.match(resetPage, /SummerCloud\.getSession\(\)/);
  assert.match(resetPage, /password\.length<8/);
  assert.match(resetPage, /password!==confirm/);
  assert.match(resetPage, /SummerCloud\.updatePassword\(password\)/);
});

test('本地测试通过服务器替换配置，页面不再直接加载 local 配置', () => {
  for (const page of [child, parent, resetPage]) assert.doesNotMatch(page, /cloud-config\.local\.js/);
  assert.match(server, /requested === '\/cloud-config\.js'/);
  assert.match(server, /fs\.readFileSync\(localConfigPath\)/);
  assert.match(server, /process\.env\.PORT \|\| 5186/);
  assert.match(config, /supabaseUrl/);
});

test('敏感本地文件被忽略，正式修复迁移使用正确六位数正则', () => {
  assert.match(ignore, /^cloud-config\.local\.js$/m);
  assert.match(ignore, /^test_e2e\.js$/m);
  assert.match(codeFixMigration, /\^\[0-9\]\{6\}\$/);
  assert.doesNotMatch(codeFixMigration, /\\d\{6\}/);
});

if (!process.exitCode) console.log('V1.6 课表调整逻辑测试全部通过。');
