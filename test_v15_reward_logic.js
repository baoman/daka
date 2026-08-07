const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const schema = fs.readFileSync(path.join(root, 'supabase-schema.sql'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'supabase/functions/family-sync/index.ts'), 'utf8');
const cloud = fs.readFileSync(path.join(root, 'cloud-sync.js'), 'utf8');
const childPage = fs.readFileSync(path.join(root, '每日打卡.html'), 'utf8');
const parentPage = fs.readFileSync(path.join(root, '家长查看.html'), 'utf8');

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}\n${error.stack}`); process.exitCode = 1; }
}

test('数据库包含日常奖励码和领取账本', () => {
  assert.match(schema, /create table if not exists public\.reward_codes/i);
  assert.match(schema, /create table if not exists public\.reward_claims/i);
  assert.match(schema, /reward_claims_code_device_unique unique \(reward_code_id, device_user_id\)/i);
  assert.match(schema, /create or replace function public\.claim_reward_code/i);
  assert.match(schema, /for update/i);
});

test('数据库奖励类型约束不允许 SSR 日常奖励', () => {
  assert.match(schema, /reward->>'rarity' in \('R', 'SR'\)/);
  assert.doesNotMatch(schema, /reward_codes_reward_valid[\s\S]*'SSR'/);
});

test('云函数在服务端固化日常奖励并支持幂等领取', () => {
  assert.match(edge, /if \(action === 'create_reward_code'\)/);
  assert.match(edge, /if \(action === 'redeem_reward_code'\)/);
  assert.match(edge, /claim_reward_code/);
  assert.match(edge, /alreadyClaimed: result === 'already_claimed'/);
  assert.match(edge, /const CARD_POOL/);
  assert.doesNotMatch(edge, /redeem_reward_code[\s\S]{0,500}body\.reward/);
});

test('接入码诊断仅由测试环境开关启用，且不返回完整哈希', () => {
  assert.doesNotMatch(edge, /TEST_DIAGNOSTICS|ivuerdnzjkwpkgjdzsia|codeHashPrefix|diagnostic:/);
});

test('前端云端接口覆盖创建、查询、撤销、领取，并解析非 2xx 业务错误', () => {
  for (const method of ['redeemRewardCode', 'createRewardCode', 'listRewardCodes', 'revokeRewardCode']) assert.match(cloud, new RegExp(`async function ${method}`));
  assert.match(cloud, /redeem_reward_code/);
  assert.match(cloud, /create_reward_code/);
  assert.match(cloud, /error\.context/);
  assert.match(cloud, /response\.clone\(\)\.json\(\)/);
  assert.match(cloud, /const SDK_URLS = \[/);
  assert.match(cloud, /https:\/\/unpkg\.com\/@supabase\/supabase-js@2/);
});

test('小朋友端奖励账本按 claimId 去重并兼容 v4', () => {
  assert.match(childPage, /summer_reward_center_v5/);
  assert.match(childPage, /const PREVIOUS_REWARD_KEY = 'summer_reward_center_v4'/);
  assert.match(childPage, /redeemClaims: \{\}/);
  assert.match(childPage, /hasRedeemClaim\(claimId\)/);
  assert.match(childPage, /legacy-link-reward/);
  assert.doesNotMatch(childPage, /rewardState\.redeemReward/);
});

test('未接入设备领取日常奖励码时提示先完成设备接入', () => {
  assert.match(childPage, /let status;/);
  assert.match(childPage, /!status\?\.redeemed && message\.includes\('兑换码不正确'\)/);
  assert.match(childPage, /这台设备还没有接入家庭/);
});

test('家长端可发放、查看和撤销日常奖励', () => {
  for (const id of ['rewardKind', 'rewardDays', 'rewardMessage', 'rewardList']) assert.match(parentPage, new RegExp(`id="${id}"`));
  for (const fn of ['createRewardCode', 'loadRewardCodes', 'revokeRewardCode']) assert.match(parentPage, new RegExp(`async function ${fn}`));
});

test('数据库包含 V1.6 按日期课表覆盖表', () => {
  assert.match(schema, /create table if not exists public\.schedule_overrides/i);
  assert.match(schema, /schedule_overrides_family_date_unique unique \(family_id, schedule_date\)/i);
  assert.match(schema, /schedule_overrides_tasks_is_array/i);
});

test('云函数校验课表任务并限制为家长写入', () => {
  for (const action of ['get_schedule', 'save_schedule_overrides', 'remove_schedule_overrides']) assert.match(edge, new RegExp(`action === '${action}'`));
  assert.match(edge, /function normalizeScheduleTasks/);
  assert.match(edge, /if \(!isParent\) return reply\(\{ error: '请先登录家长账号。' \}, 403\);/);
  assert.match(edge, /schedule_overrides/);
});

test('云端接口与小朋友端支持课表同步和缓存回退', () => {
  for (const method of ['getSchedule', 'saveScheduleOverrides', 'removeScheduleOverrides']) assert.match(cloud, new RegExp(`async function ${method}`));
  assert.match(childPage, /SCHEDULE_CACHE_KEY/);
  assert.match(childPage, /refreshScheduleOverrides/);
  assert.match(childPage, /getScheduleOverride\(dateKey\(date\)\)/);
  assert.match(childPage, /scheduleVersion/);
});

test('家长端支持单日编辑、多日复制、恢复默认和预览', () => {
  for (const id of ['scheduleDate', 'scheduleBoard', 'schedulePreview']) assert.match(parentPage, new RegExp(`id="${id}"`));
  for (const fn of ['saveSchedule', 'copyScheduleToDates', 'restoreDefaultSchedule', 'previewSchedule']) assert.match(parentPage, new RegExp(`function ${fn}`));
  assert.match(parentPage, /已同步历史不能调整/);
});

if (!process.exitCode) console.log('V1.6 日常奖励码与课表调整静态单元测试全部通过。');
