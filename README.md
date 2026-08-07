# 暑假学习 · 每日打卡 🎯

一个帮助孩子养成暑期学习习惯的打卡系统，含任务管理、星星奖励、卡片收藏和云端家长管理功能。

## 功能概览

| 页面 | 访问 | 说明 |
|------|------|------|
| **每日打卡** | `index.html` → 自动跳转 | 孩子每日打卡页面，完成任务获取星星和卡片 |
| **家长查看** | `家长查看.html` | 家长管理后台，需密码验证 |
| **全部卡片预览** | `全部卡片预览.html` | 查看所有可收集的卡片图鉴 |
| **重置密码** | `重置密码.html` | 孩子端密码重置 |

## 核心功能

### 👶 孩子端（每日打卡）
- **任务打卡**：上午/下午/晚上分时段任务，勾选完成
- **进度系统**：每日进度条，3 颗星拿满
- **星星奖励**：首次完成任务 + 满进度奖励
- **卡片收集**：连续打卡满 3/5/7 天掉落卡片，支持卡片解锁
- **收藏册**：查看已收集的卡片及收集进度
- **兑换码**：输入家长生成的奖励码兑换奖励

### 👨‍👩‍👧 家长端（家长查看）
- **密码验证**：首次访问需输入家长密码（sessionStorage 存储，关标签页即清除）
- **孩子管理**：添加/编辑/删除孩子账号（姓名 + 6 位验证码）
- **打卡进度**：查看每个孩子的打卡完成情况
- **奖励发放**：生成一次性奖励码（星星/卡片），设有效期和鼓励语
- **课表调整**：调整今天及之后的任务安排，支持复制到多天

### 🃏 卡片系统（10 级稀有度）
| 稀有度 | 解锁条件 |
|--------|---------|
| R | 3 ⭐ 解锁 |
| SR | 6 ⭐ 解锁 |
| PR / SSR / HR / UR / CP / LGR / SP / GP | 7 天自动解锁或奖励码获取 |

## 技术架构

```
┌─────────────────────────────────────────────┐
│           GitHub Pages（静态托管）            │
│  每日打卡.html · 家长查看.html · 全部卡片预览  │
└────────────┬────────────────────┬────────────┘
             │                    │
             ▼                    ▼
┌────────────────────┐  ┌──────────────────────┐
│  Supabase Database  │  │  Supabase Edge Func   │
│  (PostgreSQL)       │  │  family-sync          │
│  - children         │  │  - 孩子管理            │
│  - daily_checkins   │  │  - 打卡同步            │
│  - child_progress   │  │  - 奖励码管理           │
│  - reward_codes     │  │  - 课表管理            │
│  - schedule_overrides│  │  - 进度查询            │
└────────────────────┘  └──────────────────────┘
```

## 使用流程

### 首次使用

1. **设置 Supabase 环境变量**
   - 打开 https://supabase.com/dashboard/project/ajwqilzvgagaswhpdtul/functions/secrets
   - 添加 `ADMIN_PASSWORD` → 设一个家长密码
   - 不需要重新部署，环境变量立即生效

2. **部署到 GitHub Pages**
   ```bash
   cd /Users/sunjuan/Documents/daka
   git init
   git add .
   git commit -m "初始化：每日打卡系统"
   git remote add origin https://github.com/你的用户名/daka.git
   git push -u origin main
   ```
   - 打开仓库 Settings → Pages → 选 `main` → `/ (root)` → Save
   - 等待 1-2 分钟，访问 `https://你的用户名.github.io/daka/`

### 日常使用

1. **孩子打卡**：打开 `https://你的用户名.github.io/daka/` → 自动跳转到每日打卡页
2. **家长管理**：访问 `https://你的用户名.github.io/daka/家长查看.html` → 输入密码进入

## 本地开发

### 启动本地服务器
```bash
cd /Users/sunjuan/Documents/daka
node serve-test.js
# 访问 http://127.0.0.1:5186/
```

### 本地配置（可选）
如果需要在本地调试家长管理功能，创建 `cloud-config.local.js`：
```js
window.SUMMER_CLOUD_CONFIG = Object.freeze({
  supabaseUrl: 'https://ajwqilzvgagaswhpdtul.supabase.co',
  supabasePublishableKey: 'eyJ...',
  tableName: 'daily_checkins',
  functionName: 'family-sync'
});
```
> `cloud-config.local.js` 已在 `.gitignore` 中，不会提交到 GitHub。

### 部署 Edge Function
```bash
npx supabase functions deploy family-sync --use-api
```

## 发布流程流程图

```
修改代码 ──→ git add . ──→ git commit -m "说明" ──→ git push
                                                        │
                                                        ▼
                                              GitHub Pages 自动更新
                                              （等待 1-2 分钟）
                                                        │
                                                        ▼
                                              访问线上地址验证
```

## 项目文件结构

```
daka/
├── index.html              # 入口（自动跳转每日打卡）
├── 每日打卡.html            # 孩子打卡主页面
├── 家长查看.html            # 家长管理后台
├── 全部卡片预览.html         # 卡片图鉴
├── 重置密码.html            # 密码重置
├── 暑假学习计划表.html       # 计划表参考
├── cloud-config.js          # 云配置（Supabase URL + anon key）
├── cloud-config.local.js    # 本地配置覆盖（gitignored）
├── cloud-sync.js            # 云同步逻辑（Supabase SDK 封装）
├── cards-data.js            # 卡片数据定义
├── serve-test.js            # 本地开发服务器
├── cards/                   # 卡片图片资源（118 张）
├── supabase/
│   ├── functions/family-sync/  # Edge Function
│   └── migrations/             # 数据库迁移
└── .gitignore               # Git 忽略规则
```

## 安全说明

- `cloud-config.js` 只包含 Supabase URL 和 anon 公钥，可安全提交到 GitHub
- 家长管理功能需通过密码验证（`ADMIN_PASSWORD` 环境变量）
- 密码存在 sessionStorage 中，关闭浏览器标签页即清除
- 管理员密钥（`SUPABASE_SERVICE_ROLE_KEY`）仅在 Edge Function 服务端使用，不暴露给客户端