import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ═══════════════════ 卡池（10级稀有度）══════════════════
const CARD_POOL = {
  R:   ['r-sunny-egg','r-pink-heart','r-ocean-wave','r-cocoa-egg','r-forest-leaf','r-grape-pop','r-orange-joy','r-cloud-puff','r-red-bounce','r-mint-candy','r-bubble-pop','r-star-sprinkle'],
  SR:  ['sr-phoenix-egg','sr-dragon-scale','sr-neon-glow','sr-ice-crystal','sr-galaxy-swirl','sr-magic-hat','sr-crystal-gem','sr-magma-core','sr-thunder-egg','sr-aurora-egg'],
  PR:  ['pr-sakura-bloom','pr-moonlight-silver','pr-rainbow-arc','pr-cosmic-dust','pr-golden-feather','pr-starfall-shower','pr-ocean-pearl','pr-crystal-dew'],
  SSR: ['ssr-golden-egg','ssr-shadow-king','ssr-angel-wing','ssr-emperor-egg','ssr-celestial-egg','ssr-eternal-flame'],
  HR:  ['hr-dragon-emperor','hr-phoenix-queen','hr-cosmic-ruler','hr-time-keeper','hr-dream-weaver'],
  UR:  ['ur-void-lord','ur-storm-bringer','ur-light-bringer','ur-shadow-hunter'],
  CP:  ['cp-rainbow-prism','cp-galaxy-core','cp-infinity-loop'],
  LGR: ['lgr-origin-egg','lgr-universe-egg','lgr-destiny-egg'],
  SP:  ['sp-event-egg'],
  GP:  ['gp-imperial-egg','gp-legendary-egg']
} as const;
type Rarity = keyof typeof CARD_POOL;
type Reward = { type: 'stars'; stars: number } | { type: 'card'; rarity: Rarity; cardId: string };
const ALL_RARITIES: Rarity[] = ['R','SR','PR','SSR','HR','UR','CP','LGR','SP','GP'];

// ═══════════════════ 工具函数 ═══════════════════
function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(item => item.toString(16).padStart(2, '0')).join('');
}
function normalizeCode(v: unknown) { return String(v || '').trim().toUpperCase().replace(/\s+/g, ''); }
function validCode(c: string) { return /^\d{6}$/.test(c); }
function randomCode() { return String(Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * 900000)); }
async function childToken(name: string, code: string) {
  // id = name + 验证码 + 随机时间戳 生成的唯一 token
  const rand = crypto.getRandomValues(new Uint32Array(3)).join('-');
  const raw = `${name}|${code}|${Date.now()}|${rand}`;
  const h = await sha256(raw);
  return `c_${h.slice(0, 28)}`;
}
function randomItem<T>(items: readonly T[]): T { return items[crypto.getRandomValues(new Uint32Array(1))[0] % items.length]; }
function randomReward(): Reward {
  const roll = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * 100;
  if (roll < 50) return { type: 'card', rarity: 'R',  cardId: randomItem(CARD_POOL.R) };
  if (roll < 68) return { type: 'card', rarity: 'SR', cardId: randomItem(CARD_POOL.SR) };
  if (roll < 78) return { type: 'card', rarity: 'PR', cardId: randomItem(CARD_POOL.PR) };
  if (roll < 85) return { type: 'card', rarity: 'SSR',cardId: randomItem(CARD_POOL.SSR) };
  if (roll < 90) return { type: 'stars', stars: 3 };
  if (roll < 93) return { type: 'card', rarity: 'HR', cardId: randomItem(CARD_POOL.HR) };
  if (roll < 95) return { type: 'card', rarity: 'UR', cardId: randomItem(CARD_POOL.UR) };
  if (roll < 97) return { type: 'stars', stars: 5 };
  return roll < 99 ? { type: 'card', rarity: 'CP', cardId: randomItem(CARD_POOL.CP) } : { type: 'stars', stars: 1 };
}
function makeReward(v: unknown): Reward | null {
  const kind = String(v || 'surprise');
  if (kind === 'stars_1') return { type: 'stars', stars: 1 };
  if (kind === 'stars_3') return { type: 'stars', stars: 3 };
  if (kind === 'stars_5') return { type: 'stars', stars: 5 };
  if (kind === 'stars_100') return { type: 'stars', stars: 100 };
  if (kind === 'stars_1000') return { type: 'stars', stars: 1000 };
  const m = kind.match(/^card_(r|sr|pr|ssr|hr|ur|cp|lgr|sp|gp)$/i);
  if (m) { const rarity = m[1].toUpperCase() as Rarity; return { type: 'card', rarity, cardId: randomItem(CARD_POOL[rarity]) }; }
  return kind === 'surprise' ? randomReward() : null;
}
function expiryFor(days: unknown) {
  const d = [1, 3, 7].includes(Number(days)) ? Number(days) : 1;
  const e = new Date(); e.setHours(23, 59, 59, 999); e.setDate(e.getDate() + d - 1);
  return e.toISOString();
}
const PERIODS = ['morning', 'afternoon', 'evening'] as const;
const SUBJECTS = ['cn', 'en', 'ma', 'other', 'pe'] as const;
type ScheduleTask = { id: string; name: string; detail: string; period: typeof PERIODS[number]; subject: typeof SUBJECTS[number] };
function validScheduleDate(v: unknown) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')); }
function normalizeScheduleTasks(v: unknown): ScheduleTask[] | null {
  if (!Array.isArray(v) || v.length > 24) return null;
  const ids = new Set<string>(); const tasks: ScheduleTask[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') return null;
    const it = raw as Record<string, unknown>;
    const id = String(it.id || '').trim(), name = String(it.name || '').trim(), detail = String(it.detail || '').trim();
    const period = String(it.period || ''), subject = String(it.subject || 'other');
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id) || !name || name.length > 40 || detail.length > 120 || !PERIODS.includes(period as typeof PERIODS[number]) || !SUBJECTS.includes(subject as typeof SUBJECTS[number]) || ids.has(id)) return null;
    ids.add(id); tasks.push({ id, name, detail, period: period as ScheduleTask['period'], subject: subject as ScheduleTask['subject'] });
  }
  return tasks;
}

// ═══════════════════ 主函数 ═══════════════════
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return reply({ error: '只支持 POST 请求。' }, 405);

  const authHeader = request.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const adminPassword = Deno.env.get('ADMIN_PASSWORD') || '';
  const admin = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return reply({ error: '请求格式错误。' }, 400); }
  const action = body.action;
  try {

  // -- 身份识别 --
  // 家长身份固定为单一家庭身份（与具体设备/浏览器无关），确保换设备、清缓存后仍能看到同一份数据。
  // parentOwnerId 仅作为"这是家长请求"的入口标记；真实身份由后端统一固定，不再使用前端随机生成的 owner_id。
  const FAMILY_OWNER_ID = '11111111-1111-1111-1111-111111111111';
  const parentOwnerId = typeof body.parentOwnerId === 'string' && body.parentOwnerId.length > 0 ? body.parentOwnerId : null;
  let userId: string, isParent: boolean;

  if (parentOwnerId) {
    // 验证密码（如果已设置 ADMIN_PASSWORD），仅用于"挡住孩子"，不参与身份派生
    if (adminPassword) {
      const inputPwd = String(body.password || '');
      if (inputPwd !== adminPassword) return reply({ error: '家长密码不正确。' }, 403);
    }
    userId = FAMILY_OWNER_ID; isParent = true;
  } else {
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return reply({ error: '登录状态无效。' }, 401);
    userId = authData.user.id; isParent = !authData.user.is_anonymous;
  }

  // 一次性把历史 owner_id 归并到单一家庭身份（幂等；单家庭场景安全）。
  // 迁移必须由已通过密码验证的家长请求触发，因此放在此处。
  if (isParent) {
    try {
      await admin.from('children').update({ owner_id: FAMILY_OWNER_ID }).neq('owner_id', FAMILY_OWNER_ID);
      await admin.from('schedule_overrides').update({ owner_id: FAMILY_OWNER_ID }).neq('owner_id', FAMILY_OWNER_ID);
    } catch (_) { /* 迁移失败不影响本次请求 */ }
  }

  // ===== 孩子管理 =====
  if (action === 'list_children') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const { data, error } = await admin.from('children').select('id, name, code_plain, created_at').eq('owner_id', userId).order('created_at');
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, children: data || [] });
  }
  if (action === 'create_child') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const name = String(body.name || '').trim();
    const code = String(body.code || body.password || '').trim();
    if (!name || name.length > 20) return reply({ error: '孩子姓名需 1-20 个字符。' }, 400);
    if (!/^\d{6}$/.test(code)) return reply({ error: '验证码需为 6 位数字。' }, 400);
    const hash = await sha256(code);
    const id = await childToken(name, code);
    const { data, error } = await admin.from('children').insert({ id, owner_id: userId, name, code_plain: code, password_hash: hash }).select('id, name, code_plain, created_at').single();
    if (error) return reply({ error: error.code === '23505' ? `姓名"${name}" + 该验证码已存在，请更换验证码或使用其他姓名。` : error.message }, 400);
    return reply({ ok: true, child: data });
  }
  if (action === 'update_child') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const childId = String(body.childId || '');
    const name = String(body.name || '').trim();
    const code = String(body.code || '').trim();
    if (!name || name.length > 20) return reply({ error: '孩子姓名需 1-20 个字符。' }, 400);
    const updates: Record<string, unknown> = { name };
    if (/^\d{6}$/.test(code)) {
      updates.code_plain = code;
      updates.password_hash = await sha256(code);
    }
    const { error } = await admin.from('children').update(updates).eq('id', childId).eq('owner_id', userId);
    if (error) return reply({ error: error.code === '23505' ? `该姓名 + 验证码组合已存在，无法修改。` : error.message }, 400);
    return reply({ ok: true });
  }
  if (action === 'delete_child') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const childId = String(body.childId || '');
    const { error } = await admin.from('children').delete().eq('id', childId).eq('owner_id', userId);
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }
  if (action === 'child_login') {
    const name = String(body.name || '').trim();
    const code = String(body.code || body.password || '').trim();
    if (!name || !/^\d{6}$/.test(code)) return reply({ error: '请输入姓名和验证码。' }, 400);
    const hash = await sha256(code);
    const { data, error } = await admin.from('children').select('id, name').eq('name', name).eq('password_hash', hash).maybeSingle();
    if (error || !data) return reply({ error: '姓名或验证码不正确。' }, 400);
    return reply({ ok: true, child: data });
  }

  // ===== 奖励码管理 =====
  if (action === 'create_reward_code') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const reward = makeReward(body.rewardKind);
    if (!reward) return reply({ error: '奖励类型无效。' }, 400);
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请选择要奖励的孩子。' }, 400);
    const { data: child } = await admin.from('children').select('id').eq('id', childId).eq('owner_id', userId).maybeSingle();
    if (!child) return reply({ error: '孩子不存在。' }, 400);
    const message = String(body.message || '').trim().slice(0, 50);
    const expiresAt = expiryFor(body.validDays);
    for (let i = 0; i < 8; i++) {
      const code = randomCode();
      const { error } = await admin.from('reward_codes').insert({
        code_hash: await sha256(code), code_value: code, reward, message, expires_at: expiresAt, child_id: childId
      });
      if (!error) return reply({ ok: true, code, reward, message, expiresAt });
      if (error.code !== '23505') return reply({ error: error.message }, 400);
    }
    return reply({ error: '生成繁忙，请再试一次。' }, 503);
  }
  if (action === 'list_reward_codes') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const { data: children } = await admin.from('children').select('id, name').eq('owner_id', userId);
    const childIds = (children || []).map(c => c.id);
    if (!childIds.length) return reply({ ok: true, codes: [] });
    const childMap: Record<string, string> = {};
    for (const c of children || []) childMap[c.id] = c.name;
    const { data, error } = await admin.from('reward_codes')
      .select('id, code_value, reward, message, expires_at, max_uses, used_count, revoked_at, child_id, created_at, reward_claims(id, claimed_at)')
      .in('child_id', childIds).order('created_at', { ascending: false }).limit(30);
    if (error) return reply({ error: error.message }, 400);
    const codes = (data || []).map(c => ({ ...c, child_name: childMap[c.child_id] || '' }));
    return reply({ ok: true, codes });
  }
  if (action === 'revoke_reward_code') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const id = String(body.id || '');
    const { data: code } = await admin.from('reward_codes').select('id, children(owner_id)').eq('id', id).maybeSingle();
    const owner = (code?.children as { owner_id?: string } | null)?.owner_id;
    if (!code || owner !== userId || Number(code?.used_count || 0) > 0) return reply({ error: '奖励码不存在或已领取。' }, 400);
    const { error } = await admin.from('reward_codes').update({ revoked_at: new Date().toISOString() }).eq('id', id);
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }

  // ===== 孩子兑换奖励码 =====
  if (action === 'redeem_reward_code') {
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请先登录。' }, 400);
    const code = normalizeCode(body.code);
    if (!validCode(code)) return reply({ error: '兑换码是 6 位数字。' }, 400);
    const { data, error } = await admin.rpc('claim_reward_code', { p_code_hash: await sha256(code), p_child_id: childId }).maybeSingle() as { data: Record<string, unknown> | null; error: unknown };
    if (error || !data) return reply({ error: (error as { message?: string })?.message || '领取失败。' }, 400);
    const result = String(data.result);
    const msgs: Record<string, string> = {
      not_linked: '孩子信息无效，请重新登录。', not_found: '兑换码不正确，请再试一次。',
      not_eligible: '这份奖励不是给这个孩子的哦。', revoked: '这份奖励已被撤销。',
      expired: '这份惊喜已经过期啦。', used_up: '这份奖励已经领完啦。'
    };
    if (msgs[result]) return reply({ error: msgs[result] }, 400);
    return reply({ ok: true, alreadyClaimed: result === 'already_claimed', claimId: data.claim_id, reward: data.reward, message: data.message || '', claimedAt: data.claimed_at });
  }

  // ===== 孩子进度（云端持久化：星星、卡片、连续打卡） =====
  if (action === 'load_progress') {
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请先登录。' }, 400);
    const { data, error } = await admin.from('child_progress').select('*').eq('child_id', childId).maybeSingle();
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, progress: data || null });
  }
  if (action === 'save_progress') {
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请先登录。' }, 400);
    const { data: child } = await admin.from('children').select('id').eq('id', childId).maybeSingle();
    if (!child) return reply({ error: '孩子信息无效。' }, 400);
    const row: Record<string, unknown> = {
      child_id: childId,
      stars: Number(body.stars) || 0,
      cards: body.cards || [],
      streak: Number(body.streak) || 0,
      daily_rewards: body.dailyRewards || {},
      redeem_claims: body.redeemClaims || {},
      exchanges: body.exchanges || [],
      updated_at: new Date().toISOString()
    };
    const { error } = await admin.from('child_progress').upsert(row, { onConflict: 'child_id' });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }

  // ===== 打卡同步 =====
  if (action === 'sync') {
    const childId = String(body.childId || '');
    const snapshot = body.snapshot as Record<string, unknown> | undefined;
    if (!childId || !snapshot || !/^\d{4}-\d{2}-\d{2}$/.test(String(snapshot.checkDate || '')))
      return reply({ error: '打卡数据格式错误。' }, 400);
    const { data: child } = await admin.from('children').select('id').eq('id', childId).maybeSingle();
    if (!child) return reply({ error: '孩子信息无效。' }, 400);
    const row = {
      child_id: childId, check_date: String(snapshot.checkDate), checks: snapshot.checks || {},
      done_count: Number(snapshot.doneCount || 0), total_count: Number(snapshot.totalCount || 0),
      is_full: Boolean(snapshot.isFull), last_synced_at: new Date().toISOString()
    };
    const { error } = await admin.from('daily_checkins').upsert(row, { onConflict: 'child_id,check_date' });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }

  // ===== 查看打卡（孩子可读自己 / 家长可读名下孩子） =====
  if (action === 'fetch_checkins') {
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请选择孩子。' }, 400);
    // 孩子身份只能读自己；家长身份需属于该家庭
    if (isParent) {
      const { data: child } = await admin.from('children').select('id').eq('id', childId).eq('owner_id', userId).maybeSingle();
      if (!child) return reply({ ok: true, checkins: [] });
    } else {
      const { data: child } = await admin.from('children').select('id').eq('id', childId).maybeSingle();
      if (!child) return reply({ error: '孩子信息无效。' }, 400);
    }
    const days = Math.min(Number(body.days) || 30, 60);
    const since = new Date(); since.setDate(since.getDate() - days);
    const from = since.toISOString().slice(0, 10);
    const { data, error } = await admin.from('daily_checkins')
      .select('check_date, done_count, total_count, is_full, last_synced_at, checks')
      .eq('child_id', childId).gte('check_date', from).order('check_date', { ascending: false });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, checkins: data || [] });
  }
  if (action === 'fetch_all_checkins') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const { data: children } = await admin.from('children').select('id, name').eq('owner_id', userId);
    const kids = children || [];
    const days = Math.min(Number(body.days) || 7, 30);
    const since = new Date(); since.setDate(since.getDate() - days);
    const from = since.toISOString().slice(0, 10);
    const all: Record<string, unknown>[] = [];
    for (const kid of kids) {
      const { data, error } = await admin.from('daily_checkins')
        .select('child_id, check_date, done_count, total_count, is_full, last_synced_at, checks')
        .eq('child_id', kid.id).gte('check_date', from).order('check_date', { ascending: false });
      if (!error && data) for (const row of data) all.push({ ...row, child_name: kid.name });
    }
    return reply({ ok: true, checkins: all });
  }

  // ===== 课表（家庭级共享：家长保存、孩子读取都按单一家庭身份，确保小朋友端能看到家长调整的课表）=====
  if (action === 'get_schedule') {
    const ownerId = FAMILY_OWNER_ID;
    const from = validScheduleDate(body.from) ? String(body.from) : new Date().toISOString().slice(0, 10);
    const to = validScheduleDate(body.to) ? String(body.to) : from;
    // 逐日覆盖（具体日期）
    const { data, error } = await admin.from('schedule_overrides').select('schedule_date, tasks, version, updated_at').eq('owner_id', ownerId).gte('schedule_date', from).lte('schedule_date', to).order('schedule_date');
    if (error) return reply({ error: error.message }, 400);
    // 规则式课表（工作日 / 周末 / 每天）单独存于 schedule_rules 表，与逐日覆盖互不干扰
    const { data: ruleRow, error: ruleErr } = await admin.from('schedule_rules').select('config').eq('owner_id', ownerId).maybeSingle();
    if (ruleErr) return reply({ error: ruleErr.message }, 400);
    const cfg = (ruleRow && ruleRow.config && typeof ruleRow.config === 'object') ? ruleRow.config as Record<string, unknown> : {};
    const version = Number(cfg.version || 1);
    const rules: { schedule_date: string; tasks: ScheduleTask[]; version: number }[] = [];
    if (Array.isArray(cfg.daily)) rules.push({ schedule_date: '__daily__', tasks: normalizeScheduleTasks(cfg.daily) || [], version });
    if (Array.isArray(cfg.weekday)) rules.push({ schedule_date: '__weekday__', tasks: normalizeScheduleTasks(cfg.weekday) || [], version });
    if (Array.isArray(cfg.weekend)) rules.push({ schedule_date: '__weekend__', tasks: normalizeScheduleTasks(cfg.weekend) || [], version });
    return reply({ ok: true, overrides: data || [], rules });
  }
  if (action === 'save_schedule_rules') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const slot = String(body.slot || '');
    const isClear = slot === 'clear';
    if (!isClear && !['daily', 'weekday', 'weekend'].includes(slot)) return reply({ error: '课表作用范围不正确。' }, 400);
    let tasks: ScheduleTask[] = [];
    if (!isClear) {
      tasks = normalizeScheduleTasks(body.tasks);
      if (!tasks || !tasks.length) return reply({ error: '请先配置课表内容。' }, 400);
    }
    // 读取现有配置，按 slot 单独更新，避免互相覆盖
    const { data: existing, error: rerr } = await admin.from('schedule_rules').select('config').eq('owner_id', userId).maybeSingle();
    if (rerr) return reply({ error: rerr.message }, 400);
    const config: Record<string, unknown> = (existing && existing.config && typeof existing.config === 'object') ? existing.config as Record<string, unknown> : {};
    if (isClear) {
      config.daily = []; config.weekday = []; config.weekend = [];
    } else if (slot === 'daily') {
      config.daily = tasks; config.weekday = []; config.weekend = []; // 套用“每天”即清空工作日/周末拆分
    } else {
      config[slot] = tasks; // weekday / weekend 互不清除，可单独微调
      delete config.daily; // 设置具体日期范围后，“每天”不再生效
    }
    config.version = Number(config.version || 1) + 1;
    const { error } = await admin.from('schedule_rules').upsert({ owner_id: userId, config, updated_at: new Date().toISOString() }, { onConflict: 'owner_id' });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, slot: isClear ? 'clear' : slot });
  }
  if (action === 'save_schedule_overrides') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const items = Array.isArray(body.overrides) ? body.overrides : [];
    if (!items.length || items.length > 31) return reply({ error: '请选择 1 至 31 个日期。' }, 400);
    const rows = [];
    for (const raw of items) {
      const it = raw as Record<string, unknown>;
      const d = String(it?.scheduleDate || ''), tasks = normalizeScheduleTasks(it?.tasks);
      if (!validScheduleDate(d) || !tasks) return reply({ error: '课表格式不正确。' }, 400);
      rows.push({ owner_id: userId, schedule_date: d, tasks, updated_at: new Date().toISOString() });
    }
    if (new Set(rows.map(r => r.schedule_date)).size !== rows.length) return reply({ error: '日期不能重复。' }, 400);
    const { error } = await admin.from('schedule_overrides').upsert(rows, { onConflict: 'owner_id,schedule_date' });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, savedDates: rows.map(r => r.schedule_date) });
  }
  if (action === 'remove_schedule_overrides') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const dates = Array.isArray(body.dates) ? body.dates.map(String) : [];
    if (!dates.length || dates.length > 31 || dates.some(d => !validScheduleDate(d)))
      return reply({ error: '日期格式不正确。' }, 400);
    const { error } = await admin.from('schedule_overrides').delete().eq('owner_id', userId).in('schedule_date', dates);
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }

  // ===== 家务任务（家长配置 + 孩子记录 + 汇总）=====
  // 家务任务为家庭级共享配置：家长可配置，孩子也可读取（用于下拉选择）。
  if (action === 'get_chore_tasks') {
    const { data, error } = await admin.from('chore_tasks').select('*').eq('owner_id', FAMILY_OWNER_ID).order('sort_order').order('created_at');
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, tasks: data || [] });
  }
  if (action === 'save_chore_tasks') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const raw = Array.isArray(body.tasks) ? body.tasks : [];
    if (raw.length > 50) return reply({ error: '任务数量过多（最多 50 个）。' }, 400);
    const seen = new Set<string>();
    const tasks: Record<string, unknown>[] = [];
    for (const it of raw) {
      const t = it as Record<string, unknown>;
      const name = String(t?.name || '').trim();
      const amount = Math.round(Number(t?.amount) * 100) / 100;
      if (!name || name.length > 20) return reply({ error: '任务名称需 1-20 个字。' }, 400);
      if (!(amount > 0) || amount > 999) return reply({ error: '奖励金额需为 0.1-999 元。' }, 400);
      if (seen.has(name)) return reply({ error: `任务"${name}"重复，请合并或改名。` }, 400);
      seen.add(name);
      tasks.push({ owner_id: FAMILY_OWNER_ID, name, amount, sort_order: tasks.length });
    }
    const { error: delErr } = await admin.from('chore_tasks').delete().eq('owner_id', FAMILY_OWNER_ID);
    if (delErr) return reply({ error: delErr.message }, 400);
    if (tasks.length) {
      const { error: insErr } = await admin.from('chore_tasks').insert(tasks);
      if (insErr) return reply({ error: insErr.message }, 400);
    }
    return reply({ ok: true });
  }
  if (action === 'add_chore_log') {
    const childId = String(body.childId || '');
    if (!childId) return reply({ error: '请先登录。' }, 400);
    const { data: child } = await admin.from('children').select('id').eq('id', childId).maybeSingle();
    if (!child) return reply({ error: '孩子信息无效。' }, 400);
    const taskName = String(body.taskName || '').trim();
    const qty = Math.max(1, Math.min(Math.floor(Number(body.qty) || 1), 1000));
    const unitAmount = Math.round(Number(body.amount) * 100) / 100;
    const amount = Math.round(unitAmount * qty * 100) / 100;
    const note = String(body.note || '').trim().slice(0, 50);
    const logDate = validScheduleDate(body.logDate) ? String(body.logDate) : new Date().toISOString().slice(0, 10);
    if (!taskName || taskName.length > 20) return reply({ error: '任务名称无效。' }, 400);
    if (!(unitAmount > 0) || unitAmount > 999) return reply({ error: '奖励金额无效。' }, 400);
    const { data, error } = await admin.from('chore_logs').insert({
      owner_id: FAMILY_OWNER_ID, child_id: childId, task_id: body.taskId || null,
      task_name: taskName, amount, qty, log_date: logDate, note
    }).select('*').single();
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, log: data });
  }
  if (action === 'list_chore_logs') {
    const days = Math.min(Number(body.days) || 30, 120);
    const since = new Date(); since.setDate(since.getDate() - days + 1);
    const from = since.toISOString().slice(0, 10);
    let query = admin.from('chore_logs').select('*').gte('log_date', from);
    if (isParent) {
      const { data: children } = await admin.from('children').select('id').eq('owner_id', userId);
      const ids = (children || []).map((c: { id: string }) => c.id);
      if (!ids.length) return reply({ ok: true, logs: [] });
      query = query.in('child_id', ids);
    } else {
      const childId = String(body.childId || '');
      if (!childId) return reply({ error: '请先登录。' }, 400);
      query = query.eq('child_id', childId);
    }
    const { data, error } = await query.order('log_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true, logs: data || [] });
  }
  if (action === 'delete_chore_log') {
    if (!isParent) return reply({ error: '请先登录家长账号。' }, 403);
    const id = String(body.id || '');
    const { error } = await admin.from('chore_logs').delete().eq('id', id).eq('owner_id', userId);
    if (error) return reply({ error: error.message }, 400);
    return reply({ ok: true });
  }
  if (action === 'chore_total') {
    // 数据库侧直接给出累计合计金额（只取 amount 单列聚合，轻量快速）
    let query = admin.from('chore_logs').select('amount');
    if (isParent) {
      const { data: children } = await admin.from('children').select('id').eq('owner_id', userId);
      const ids = (children || []).map((c: { id: string }) => c.id);
      if (!ids.length) return reply({ ok: true, total: 0 });
      query = query.in('child_id', ids);
    } else {
      const childId = String(body.childId || '');
      if (!childId) return reply({ error: '请先登录。' }, 400);
      query = query.eq('child_id', childId);
    }
    const { data, error } = await query;
    if (error) return reply({ error: error.message }, 400);
    let total = 0;
    for (const row of (data || []) as { amount?: unknown }[]) total += Number(row.amount || 0);
    total = Math.round(total * 100) / 100;
    return reply({ ok: true, total });
  }

  } catch (e) {
    return reply({ error: '服务内部错误：' + (e && e.message ? e.message : String(e)) }, 500);
  }
  return reply({ error: '未知操作。' }, 400);
});
