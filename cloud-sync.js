(function () {
  const config = window.SUMMER_CLOUD_CONFIG;
  const SDK_URLS = [
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
    const parentOwnerId = getOrCreateFamilyOwnerId();
    const password = getAdminPassword();
    const body = { action, parentOwnerId, password, ...(payload || {}) };
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
    const api = await getAdminClient();
    const parentOwnerId = getOrCreateFamilyOwnerId();
    const body = { action: 'fetch_checkins', parentOwnerId, childId, days };
    const { data, error } = await api.functions.invoke(config.functionName, { body });
    if (error) throw new Error(data?.error || error.message || '请求失败。');
    if (data && data.error) throw new Error(data.error);
    return data || {};
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

  async function createChild(name, password) {
    return invokeAsAdmin('create_child', { name, password });
  }

  async function updateChild(childId, name, password) {
    return invokeAsAdmin('update_child', { childId, name, password });
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
    listChildren,
    createChild,
    updateChild,
    deleteChild
  });
})();
