(function () {
  const config = window.SUMMER_CLOUD_CONFIG;
  // 本地优先（随项目打包，避免国内手机网络打不开 jsdelivr/unpkg 导致 SDK 加载失败），CDN 兜底
  const SDK_URLS = [
    'vendor/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://unpkg.com/@supabase/supabase-js@2'
  ];
  let client = null;
  let initPromise = null;

  function isConfigured() {
    return Boolean(config && config.supabaseUrl && config.supabasePublishableKey && config.tableName && config.functionName);
  }

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (initPromise) return initPromise;
    initPromise = new Promise((resolve, reject) => {
      let index = 0;
      const tryNext = () => {
        if (index >= SDK_URLS.length) {
          reject(new Error('服务加载失败，请检查网络后重试。'));
          return;
        }
        const script = document.createElement('script');
        script.src = SDK_URLS[index++];
        script.async = true;
        script.onload = () => window.supabase?.createClient ? resolve() : tryNext();
        script.onerror = () => { script.remove(); tryNext(); };
        document.head.appendChild(script);
      };
      tryNext();
    });
    return initPromise;
  }

  async function getClient() {
    if (!isConfigured()) throw new Error('云端配置缺失。');
    if (client) return client;
    await loadSdk();
    client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  async function getSession() {
    const api = await getClient();
    const { data, error } = await api.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function ensureAnonymousSession() {
    const api = await getClient();
    const current = await getSession();
    if (current) return current;
    const { data, error } = await api.auth.signInAnonymously();
    if (error) throw error;
    return data.session;
  }

  async function signIn(email, password) {
    const api = await getClient();
    const { data, error } = await api.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  async function signOut() {
    const api = await getClient();
    const { error } = await api.auth.signOut();
    if (error) throw error;
  }

  async function sendPasswordRecovery(email, redirectTo) {
    const api = await getClient();
    const { error } = await api.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(password) {
    const api = await getClient();
    const { error } = await api.auth.updateUser({ password });
    if (error) throw error;
  }

  function isNetworkError(msg) {
    return /fetch|network|Failed to fetch|NetworkError|timeout|ECONN|ENOTFOUND|getaddrinfo|aborted/i.test(msg || '');
  }

  async function invoke(action, payload) {
    const api = await getClient();
    const { data, error } = await api.functions.invoke(config.functionName, { body: { action, ...(payload || {}) } });
    if (error) {
      let message = data?.error || '';
      // Supabase 在非 2xx 时把函数响应放在 error.context 中；读取后优先展示服务端业务错误。
      const response = error.context;
      if (!message && response && typeof response.clone === 'function') {
        try {
          const details = await response.clone().json();
          message = details?.error || details?.message || '';
        } catch (_) {}
      }
      if (!message && isNetworkError(error.message)) {
        message = '网络无法连接服务器（可能手机网络访问不到 Supabase）。请切换网络/WiFi，或换浏览器重试。';
      }
      throw new Error(message || error.message || '请求失败。');
    }
    if (data && data.error) throw new Error(data.error);
    return data || {};
  }

  async function redeemCode(code, reward) {
    await ensureAnonymousSession();
    return invoke('redeem', { code, reward });
  }

  async function redeemRewardCode(code) {
    await ensureAnonymousSession();
    return invoke('redeem_reward_code', { code });
  }

  async function syncCheckin(snapshot) {
    await ensureAnonymousSession();
    return invoke('sync', { snapshot });
  }

  async function getDeviceStatus() {
    await ensureAnonymousSession();
    return invoke('device_status');
  }

  async function setRedeemCode(code) {
    return invoke('set_code', { code });
  }

  async function getRedeemCodeStatus() {
    return invoke('get_code_status');
  }

  async function createRewardCode(rewardKind, message, validDays) {
    return invoke('create_reward_code', { rewardKind, message, validDays });
  }

  async function listRewardCodes() {
    return invoke('list_reward_codes');
  }

  async function revokeRewardCode(id) {
    return invoke('revoke_reward_code', { id });
  }

  async function getSchedule(from, to) {
    const session = await getSession();
    if (!session) await ensureAnonymousSession();
    return invoke('get_schedule', { from, to });
  }

  async function saveScheduleOverrides(overrides) {
    return invoke('save_schedule_overrides', { overrides });
  }

  async function removeScheduleOverrides(dates) {
    return invoke('remove_schedule_overrides', { dates });
  }

  async function fetchCheckins(days) {
    const api = await getClient();
    const session = await getSession();
    if (!session || session.user.is_anonymous) throw new Error('请先登录查看账号。');
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Math.max((days || 7) - 1, 0));
    const startKey = start.toISOString().slice(0, 10);
    const { data, error } = await api.from(config.tableName)
      .select('check_date, checks, done_count, total_count, is_full, last_synced_at')
      .gte('check_date', startKey)
      .order('check_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ===== 家长管理模式（密码验证，经 Edge Function 执行） =====

  function getOrCreateFamilyOwnerId() {
    let id = localStorage.getItem('summer_parent_owner_id') || localStorage.getItem('summer_family_owner_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
      localStorage.setItem('summer_parent_owner_id', id);
    }
    return id;
  }

  function getAdminPassword() {
    return sessionStorage.getItem('summer_admin_password') || '';
  }

  function setAdminPassword(pwd) {
    if (pwd) sessionStorage.setItem('summer_admin_password', pwd);
    else sessionStorage.removeItem('summer_admin_password');
  }

  async function invokeAsAdmin(action, payload) {
    const api = await getClient();
    const password = getAdminPassword();
    // parentOwnerId 仅作"家长入口"标记；真实身份由后端按密码固定为单一家庭身份
    const body = { action, parentOwnerId: 'parent', password, ...(payload || {}) };
    const { data, error } = await api.functions.invoke(config.functionName, { body });
    if (error) {
      let message = data?.error || '';
      const response = error.context;
      if (!message && response && typeof response.clone === 'function') {
        try { const details = await response.clone().json(); message = details?.error || details?.message || ''; } catch (_) {}
      }
      // 密码错误 → 清除密码，让页面重新提示输入
      if (message === '家长密码不正确。') {
        setAdminPassword('');
        throw new Error('家长密码不正确，请重新输入。');
      }
      throw new Error(message || error.message || '请求失败。');
    }
    if (data && data.error) throw new Error(data.error);
    return data || {};
  }

  async function fetchCheckinsAsAdmin(days) {
    // V2.1：通过 Edge Function 查询（按孩子）
    const { checkins } = await invokeAsAdmin('fetch_all_checkins', { days });
    return checkins || [];
  }

  // ===== 孩子端 API（V2.0：姓名+密码登录，替换设备接入码） =====

  let childSession = null; // { childId, childName }

  function getChildSession() {
    try {
      const stored = localStorage.getItem('summer_child_session');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  function saveChildSession(session) {
    childSession = session;
    localStorage.setItem('summer_child_session', JSON.stringify(session));
  }

  function clearChildSession() {
    childSession = null;
    localStorage.removeItem('summer_child_session');
  }

  async function childLogin(name, code) {
    const api = await getClient();
    const { data } = await api.functions.invoke(config.functionName, { body: { action: 'child_login', name, code } });
    if (data && data.error) throw new Error(data.error);
    if (!data || !data.ok) throw new Error('登录失败，请重试。');
    saveChildSession({ childId: data.child.id, childName: data.child.name });
    return data;
  }

  function childLogout() {
    clearChildSession();
  }

  async function invokeAsChild(action, payload) {
    const api = await getClient();
    const session = getChildSession();
    if (!session?.childId) throw new Error('请先登录。');
    const body = { action, childId: session.childId, ...(payload || {}) };
    const { data, error } = await api.functions.invoke(config.functionName, { body });
    if (error) {
      let message = data?.error || '';
      const response = error.context;
      if (!message && response && typeof response.clone === 'function') {
        try { const details = await response.clone().json(); message = details?.error || details?.message || ''; } catch (_) {}
      }
      throw new Error(message || error.message || '请求失败。');
    }
    if (data && data.error) throw new Error(data.error);
    return data || {};
  }

  async function syncCheckinAsChild(snapshot) {
    return invokeAsChild('sync', { snapshot });
  }

  async function redeemRewardCodeAsChild(code) {
    return invokeAsChild('redeem_reward_code', { code });
  }

  async function fetchCheckinsForChild(childId, days) {
    const { checkins } = await invokeAsAdmin('fetch_checkins', { childId, days });
    return checkins || [];
  }

  // 孩子身份拉取自己全部打卡（从云端下行，保证换设备可见）
  async function fetchMyCheckins(days = 45) {
    const session = getChildSession();
    if (!session?.childId) throw new Error('请先登录。');
    const { checkins } = await invokeAsChild('fetch_checkins', { childId: session.childId, days });
    return checkins || [];
  }

  // ===== 家务任务（孩子端记录 + 家长配置/汇总） =====
  async function getChoreTasks() {
    return invokeAsAdmin('get_chore_tasks');
  }
  // 孩子端读取家庭共享的家务任务列表（无需家长密码）
  async function getChoreTasksPublic() {
    await ensureAnonymousSession();
    return invoke('get_chore_tasks');
  }
  async function saveChoreTasks(tasks) {
    return invokeAsAdmin('save_chore_tasks', { tasks });
  }
  async function addChoreLog(payload) {
    return invokeAsChild('add_chore_log', payload || {});
  }
  async function addChoreLogAsAdmin(payload) {
    return invokeAsAdmin('add_chore_log', payload || {});
  }
  async function listChoreLogs(params) {
    const session = getChildSession();
    if (session?.childId) return invokeAsChild('list_chore_logs', params || {});
    return invokeAsAdmin('list_chore_logs', params || {});
  }
  async function deleteChoreLog(id) {
    return invokeAsAdmin('delete_chore_log', { id });
  }

  // ===== 孩子进度（云端持久化） =====
  async function loadChildProgress() {
    return invokeAsChild('load_progress');
  }

  async function saveChildProgress(state) {
    return invokeAsChild('save_progress', {
      stars: state.stars || 0,
      cards: state.ownedCards || [],
      streak: state.streak || 0,
      dailyRewards: state.dailyRewards || {},
      redeemClaims: state.redeemClaims || {},
      exchanges: state.exchanges || []
    });
  }

  // ===== 孩子管理（家长端） =====

  async function listChildren() {
    return invokeAsAdmin('list_children');
  }

  async function createChild(name, code) {
    return invokeAsAdmin('create_child', { name, code });
  }

  async function updateChild(childId, name, code) {
    return invokeAsAdmin('update_child', { childId, name, code });
  }

  async function deleteChild(childId) {
    return invokeAsAdmin('delete_child', { childId });
  }

  window.SummerCloud = Object.freeze({
    isConfigured,
    getSession,
    ensureAnonymousSession,
    signIn,
    signOut,
    sendPasswordRecovery,
    updatePassword,
    // 旧版（兼容）
    redeemCode,
    redeemRewardCode,
    syncCheckin,
    getDeviceStatus,
    setRedeemCode,
    getRedeemCodeStatus,
    // 孩子端 V2.0
    childLogin,
    childLogout,
    getChildSession,
    invokeAsChild,
    syncCheckinAsChild,
    redeemRewardCodeAsChild,
    loadChildProgress,
    saveChildProgress,
    fetchMyCheckins,
    // 奖励码 + 课表（通用）
    createRewardCode,
    listRewardCodes,
    revokeRewardCode,
    getSchedule,
    saveScheduleOverrides,
    removeScheduleOverrides,
    fetchCheckins,
    // 家长管理
    getOrCreateFamilyOwnerId,
    getAdminPassword,
    setAdminPassword,
    invokeAsAdmin,
    fetchCheckinsAsAdmin,
    fetchCheckinsForChild,
    // 家务任务
    getChoreTasks,
    getChoreTasksPublic,
    saveChoreTasks,
    addChoreLog,
    addChoreLogAsAdmin,
    listChoreLogs,
    deleteChoreLog,
    listChildren,
    createChild,
    updateChild,
    deleteChild
  });
})();
