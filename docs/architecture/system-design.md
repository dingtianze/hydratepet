# HydratePet 系统架构设计文档

**版本**: v1.0  
**日期**: 2025年4月  
**文档类型**: 技术架构设计

---

## 1. 架构概述

### 1.1 设计目标
- **高可用性**: 7x24小时服务，SLA 99.9%
- **可扩展性**: 支持10万日活用户
- **安全性**: 用户数据加密存储与传输
- **离线优先**: PWA核心体验，支持弱网/离线使用

### 1.2 技术约束
| 层级 | 约束要求 |
|------|----------|
| 前端 | React + TypeScript + PWA |
| 后端 | Node.js |
| 数据库 | PostgreSQL |
| 部署 | Vercel(前端) + Railway(后端) |

---

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层 (PWA)                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        User Interface                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │   Home Page  │ │  Data Page   │ │ Settings Page│             │   │
│  │  │   (打卡页)   │ │  (统计页)    │ │  (设置页)    │             │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↑ React + TypeScript                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      State Management                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │   Zustand    │ │  LocalStorage│ │  IndexedDB   │             │   │
│  │  │  (应用状态)   │ │  (游客数据)   │ │  (离线缓存)   │             │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↑ Service Worker (Workbox)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTPS/WSS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              网关层                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Vercel Edge Network                         │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │   │  Static CDN │  │ API Proxy   │  │ SSL/TLS     │             │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              服务层 (Railway)                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Express.js App                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │  Auth Module │ │  Pet Module  │ │Record Module │             │   │
│  │  │   认证服务    │ │   宠物服务    │ │  记录服务     │             │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │Badge Module  │ │Notify Module │ │Share Module  │             │   │
│  │  │  称号服务     │ │  推送服务     │ │  分享服务     │             │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↑ JWT + Rate Limit                         │
└─────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   PostgreSQL     │        │     Redis        │        │   Object Store   │
│   (主数据库)      │        │    (缓存层)       │        │   (文件存储)      │
│                  │        │                  │        │                  │
│  • 用户数据       │        │  • Session缓存    │        │  • 宠物像素图     │
│  • 宠物状态       │        │  • 排行榜缓存     │        │  • 称号徽章图     │
│  • 饮水记录       │        │  • 推送队列       │        │  • 分享卡片模板   │
│  • 称号成就       │        │  • Rate Limit    │        │                  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              第三方服务                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │Firebase Cloud│ │ WeChat OAuth │ │   SMS API    │ │   Log/Monitor│   │
│  │  Messaging   │ │   (微信登录)  │ │  (短信服务)   │ │ (日志监控)   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 技术栈选型

### 3.1 前端技术栈

| 技术领域 | 选型 | 版本 | 说明 |
|----------|------|------|------|
| 框架 | React | 18.x | 组件化开发，生态成熟 |
| 语言 | TypeScript | 5.x | 类型安全，IDE友好 |
| 构建 | Vite | 5.x | 快速冷启动，HMR |
| 路由 | React Router | 6.x | 声明式路由 |
| 状态管理 | Zustand | 4.x | 轻量级，无样板代码 |
| UI样式 | Tailwind CSS | 3.x | 原子化CSS，快速开发 |
| UI组件 | Radix UI | 1.x | 无障碍，可定制 |
| 动画 | Framer Motion | 11.x | 声明式动画 |
| PWA | Workbox | 7.x | Service Worker工具 |
| HTTP客户端 | Axios | 1.x | 拦截器，自动重试 |
| 日期处理 | date-fns | 3.x | 模块化，Tree-shaking |
| 图表 | Recharts | 2.x | React友好 |

### 3.2 后端技术栈

| 技术领域 | 选型 | 版本 | 说明 |
|----------|------|------|------|
| 运行时 | Node.js | 20.x LTS | 长期支持版本 |
| 框架 | Express.js | 4.x | 简洁灵活 |
| ORM | Prisma | 5.x | 类型安全，迁移管理 |
| 验证 | Zod | 3.x | 运行时类型检查 |
| 认证 | JWT | 9.x | JSON Web Token |
| 加密 | bcrypt | 5.x | 密码哈希 |
| 队列 | Bull | 4.x | Redis-based队列 |
| 推送 | web-push | 3.x | Web Push协议 |
| 日志 | Winston | 3.x | 结构化日志 |
| 监控 | Prometheus + Grafana | - | 指标采集与可视化 |

### 3.3 数据库选型

| 组件 | 选型 | 用途 |
|------|------|------|
| 主数据库 | PostgreSQL 16 | ACID事务，复杂查询 |
| 缓存 | Redis 7 | 会话、队列、排行榜 |
| 文件存储 | Cloudflare R2 | 图片资源（S3兼容） |

### 3.4 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                         生产环境                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Vercel)                                          │
│  ├─ 主域名: hydratepet.app                                  │
│  ├─ 预览环境: *.vercel.app                                  │
│  ├─ Edge Network 全球CDN                                    │
│  └─ 自动部署 (Git Hook)                                     │
│                                                             │
│  Backend (Railway)                                          │
│  ├─ API: api.hydratepet.app                                 │
│  ├─ PostgreSQL (Managed)                                    │
│  ├─ Redis (Managed)                                         │
│  └─ 自动扩缩容                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         开发环境                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend: localhost:5173 (Vite Dev Server)                 │
│  Backend: localhost:3001 (nodemon)                          │
│  Database: Docker Compose (PostgreSQL + Redis)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据库ER图设计

### 4.1 实体关系图

```
                                   ┌─────────────────┐
                                   │     users       │
                                   ├─────────────────┤
                                   │ id (PK)         │
                                   │ auth_type       │
                                   │ phone (UQ)      │
                                   │ wechat_openid   │
                                   │ nickname        │
                                   │ avatar_url      │
                                   │ weight          │
                                   │ gender          │
                                   │ work_start      │
                                   │ work_end        │
                                   │ daily_goal      │
                                   │ push_token      │
                                   │ created_at      │
                                   │ updated_at      │
                                   └────────┬────────┘
                                            │ 1
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼ 1:1                   ▼ 1:N                   ▼ 1:N
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │     pets        │    │  water_records  │    │  user_badges    │
         ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
         │ id (PK)         │    │ id (PK)         │    │ id (PK)         │
         │ user_id (FK)    │    │ user_id (FK)    │    │ user_id (FK)    │
         │ name            │    │ amount          │    │ badge_id (FK)   │
         │ stage           │    │ timestamp       │    │ unlocked_at     │
         │ growth          │    │ record_type     │    └─────────────────┘
         │ body_type       │    │ note            │
         │ color_palette   │    │ created_at      │
         │ accessories     │    └─────────────────┘
         │ mood            │
         │ health          │
         │ last_fed        │
         │ created_at      │
         └─────────────────┘

         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   user_titles   │    │ reminder_configs│    │ daily_summaries │
         ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
         │ id (PK)         │    │ id (PK)         │    │ id (PK)         │
         │ user_id (FK)    │    │ user_id (FK)    │    │ user_id (FK)    │
         │ title_key       │    │ enabled         │    │ date            │
         │ unlocked_at     │    │ intervals       │    │ total_amount    │
         └─────────────────┘    │ workdays_only   │    │ goal_reached    │
                                │ quiet_hours     │    │ streak_days     │
                                └─────────────────┘    └─────────────────┘

         ┌─────────────────┐    ┌─────────────────┐
         │  badge_defs     │    │  title_defs     │
         ├─────────────────┤    ├─────────────────┤
         │ id (PK)         │    │ id (PK)         │
         │ key             │    │ key             │
         │ name            │    │ name            │
         │ description     │    │ description     │
         │ icon_url        │    │ icon_url        │
         │ rarity          │    │ category        │
         │ condition_type  │    │ condition_type  │
         │ condition_value │    │ condition_value │
         └─────────────────┘    └─────────────────┘
```

### 4.2 表结构设计

#### users - 用户表
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('guest', 'phone', 'wechat')),
    phone VARCHAR(20) UNIQUE,
    wechat_openid VARCHAR(100) UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    weight INTEGER NOT NULL CHECK (weight BETWEEN 20 AND 300),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    work_start TIME DEFAULT '09:00',
    work_end TIME DEFAULT '18:00',
    daily_goal INTEGER DEFAULT 1500 CHECK (daily_goal BETWEEN 500 AND 5000),
    push_token VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_phone_or_wechat CHECK (
        (auth_type = 'guest') OR 
        (auth_type = 'phone' AND phone IS NOT NULL) OR 
        (auth_type = 'wechat' AND wechat_openid IS NOT NULL)
    )
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat ON users(wechat_openid);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

#### pets - 宠物表
```sql
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) DEFAULT '小水滴',
    stage VARCHAR(20) DEFAULT 'egg' CHECK (stage IN ('egg', 'baby', 'child', 'teen', 'adult')),
    growth INTEGER DEFAULT 0 CHECK (growth >= 0),
    body_type VARCHAR(20) CHECK (body_type IN ('slim', 'normal', 'chubby')),
    color_palette JSONB DEFAULT '["#4ECDC4", "#FFE66D"]',
    accessories JSONB DEFAULT '[]',
    mood VARCHAR(20) DEFAULT 'happy' CHECK (mood IN ('happy', 'thirsty', 'sad', 'sleepy')),
    last_fed TIMESTAMP WITH TIME ZONE,
    health INTEGER DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_pets_user ON pets(user_id);
CREATE INDEX idx_pets_stage ON pets(stage);
```

#### water_records - 饮水记录表
```sql
CREATE TABLE water_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 5000),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    record_type VARCHAR(20) DEFAULT 'quick' CHECK (record_type IN ('quick', 'custom', 'reminder')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 复合索引优化查询
    CONSTRAINT valid_record_time CHECK (timestamp <= NOW() + INTERVAL '1 minute')
);

CREATE INDEX idx_records_user_time ON water_records(user_id, timestamp DESC);
CREATE INDEX idx_records_date ON water_records(DATE(timestamp));
CREATE INDEX idx_records_user_date ON water_records(user_id, DATE(timestamp));
```

#### daily_summaries - 每日汇总表
```sql
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount INTEGER DEFAULT 0,
    goal_reached BOOLEAN DEFAULT false,
    streak_days INTEGER DEFAULT 0,
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

CREATE INDEX idx_summaries_user_date ON daily_summaries(user_id, date DESC);
CREATE INDEX idx_summaries_date ON daily_summaries(date);
```

#### reminder_configs - 提醒配置表
```sql
CREATE TABLE reminder_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    intervals TEXT[] DEFAULT ARRAY['09:30', '11:00', '14:00', '16:00', '17:00'],
    workdays_only BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);
```

#### badge_defs - 徽章定义表
```sql
CREATE TABLE badge_defs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    condition_type VARCHAR(50) NOT NULL,
    condition_value JSONB NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_badges - 用户徽章表
```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_defs(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
```

#### title_defs - 称号定义表
```sql
CREATE TABLE title_defs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    category VARCHAR(50) CHECK (category IN ('volume', 'consistency', 'streak', 'habit', 'special')),
    condition_type VARCHAR(50) NOT NULL,
    condition_value JSONB NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_titles - 用户称号表
```sql
CREATE TABLE user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_id UUID NOT NULL REFERENCES title_defs(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT false,
    
    UNIQUE(user_id, title_id)
);

CREATE INDEX idx_user_titles_user ON user_titles(user_id);
```

### 4.3 数据库迁移策略

```typescript
// 使用Prisma迁移管理
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 每次迁移命令:
// npx prisma migrate dev --name add_user_titles
// npx prisma migrate deploy (生产)
```

---

## 5. API接口规划

### 5.1 API概览

| 模块 | 前缀 | 描述 |
|------|------|------|
| 认证 | /api/auth | 登录、注册、Token刷新 |
| 用户 | /api/users | 用户信息管理 |
| 宠物 | /api/pets | 宠物状态、成长 |
| 记录 | /api/records | 饮水记录CRUD |
| 统计 | /api/stats | 数据统计、报表 |
| 称号 | /api/titles | 称号、成就系统 |
| 提醒 | /api/reminders | 提醒配置、推送订阅 |
| 同步 | /api/sync | 离线数据同步 |

### 5.2 认证接口

```typescript
// POST /api/auth/register - 用户注册
interface RegisterRequest {
  authType: 'guest' | 'phone' | 'wechat';
  phone?: string;
  wechatCode?: string;
  nickname: string;
  weight: number;
  gender: 'male' | 'female' | 'other';
  workHours: { start: string; end: string };
}

interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
  pet: Pet;
}

// POST /api/auth/login - 登录
interface LoginRequest {
  authType: 'phone' | 'wechat';
  phone?: string;
  code?: string;        // 短信验证码
  wechatCode?: string;  // 微信授权码
}

// POST /api/auth/refresh - 刷新Token
// POST /api/auth/logout - 登出
// POST /api/auth/guest/upgrade - 游客账号升级
```

### 5.3 用户接口

```typescript
// GET /api/users/profile - 获取用户资料
// PUT /api/users/profile - 更新用户资料
// DELETE /api/users/account - 注销账号
// POST /api/users/sync - 游客数据同步到正式账号

interface UserProfileResponse {
  id: string;
  nickname: string;
  avatarUrl?: string;
  weight: number;
  gender: string;
  workStart: string;
  workEnd: string;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}
```

### 5.4 宠物接口

```typescript
// GET /api/pets - 获取宠物信息
interface PetResponse {
  id: string;
  name: string;
  stage: 'egg' | 'baby' | 'child' | 'teen' | 'adult';
  growth: number;
  maxGrowth: number;        // 当前阶段最大成长值
  bodyType: 'slim' | 'normal' | 'chubby';
  colorPalette: string[];
  accessories: string[];
  mood: 'happy' | 'thirsty' | 'sad' | 'sleepy';
  health: number;
  nextEvolution: number;    // 距离下次进化还需多少成长值
  lastFed: string;
}

// POST /api/pets/rename - 重命名宠物
// POST /api/pets/feed - 喂食（记录饮水时触发）
// POST /api/pets/interact - 宠物互动

// WebSocket: /ws/pets - 宠物实时状态（可选）
```

### 5.5 记录接口

```typescript
// POST /api/records - 创建记录
interface CreateRecordRequest {
  amount: number;
  timestamp?: string;  // ISO 8601, 可选，默认当前时间
  note?: string;
}

interface CreateRecordResponse {
  record: WaterRecord;
  petGrowth: number;       // 本次获得的成长值
  totalGrowth: number;     // 宠物当前总成长值
  newBadges?: Badge[];     // 新解锁的徽章
  newTitles?: Title[];     // 新解锁的称号
  goalReached?: boolean;   // 是否首次达到今日目标
}

// GET /api/records?start=2024-01-01&end=2024-01-31 - 查询记录
// GET /api/records/today - 今日记录
// DELETE /api/records/:id - 删除记录（允许删除当天记录）

interface WaterRecord {
  id: string;
  amount: number;
  timestamp: string;
  recordType: 'quick' | 'custom' | 'reminder';
  note?: string;
}
```

### 5.6 统计接口

```typescript
// GET /api/stats/summary?period=today|week|month|year
interface StatsSummaryResponse {
  period: string;
  totalAmount: number;
  averageAmount: number;
  goalReachedDays: number;
  totalDays: number;
  streakDays: number;
  recordCount: number;
}

// GET /api/stats/trend?period=week|month
interface TrendResponse {
  labels: string[];           // 日期标签
  data: number[];             // 每日饮水量
  goals: number[];            // 每日目标
}

// GET /api/stats/distribution - 时段分布
interface DistributionResponse {
  morning: number;    // 06:00-12:00
  afternoon: number;  // 12:00-18:00
  evening: number;    // 18:00-22:00
  night: number;      // 22:00-06:00
}
```

### 5.7 称号接口

```typescript
// GET /api/titles - 获取所有称号
interface TitlesResponse {
  current: Title;           // 当前佩戴称号
  unlocked: Title[];        // 已解锁称号
  locked: TitlePreview[];   // 未解锁称号（脱敏）
}

interface Title {
  id: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  unlockedAt?: string;
  isActive: boolean;
}

// POST /api/titles/:id/equip - 装备称号
// GET /api/badges - 获取徽章列表
```

### 5.8 提醒接口

```typescript
// GET /api/reminders/config - 获取提醒配置
interface ReminderConfigResponse {
  enabled: boolean;
  intervals: string[];      // ["09:30", "11:00", ...]
  workdaysOnly: boolean;
  quietHours: {
    start: string;          // "22:00"
    end: string;            // "08:00"
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// PUT /api/reminders/config - 更新配置
// POST /api/reminders/subscribe - 订阅推送
interface PushSubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// POST /api/reminders/unsubscribe - 取消订阅
// POST /api/reminders/test - 发送测试推送
```

### 5.9 同步接口

```typescript
// POST /api/sync - 离线数据同步
interface SyncRequest {
  clientRecords: ClientRecord[];  // 离线期间产生的记录
  lastSyncAt: string;              // 上次同步时间
}

interface SyncResponse {
  serverRecords: WaterRecord[];   // 服务器端新记录
  conflicts: SyncConflict[];      // 冲突记录
  pet: Pet;                        // 最新宠物状态
  badges: Badge[];                 // 新解锁徽章
  titles: Title[];                 // 新解锁称号
  serverTime: string;              // 服务器时间
}
```

### 5.10 API响应规范

```typescript
// 标准响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

// HTTP状态码
// 200 - 成功
// 201 - 创建成功
// 400 - 请求参数错误
// 401 - 未认证
// 403 - 无权限
// 404 - 资源不存在
// 409 - 资源冲突
// 422 - 业务逻辑错误
// 429 - 请求过于频繁
// 500 - 服务器错误
```

---

## 6. 核心业务逻辑设计

### 6.1 宠物成长算法

```typescript
// services/petGrowth.ts

interface DailyGrowthParams {
  baseAmount: number;           // 基础饮水量
  goalAmount: number;           // 目标饮水量
  streakDays: number;           // 连续达标天数
  recordIntervals: number[];    // 饮水间隔（分钟）
}

function calculateDailyGrowth(params: DailyGrowthParams): number {
  const { baseAmount, goalAmount, streakDays, recordIntervals } = params;
  
  // 基础成长值
  let growth = 5;
  
  // 完成目标奖励
  if (baseAmount >= goalAmount) {
    growth += 20;
  }
  
  // 连续天数加成（上限50）
  const streakBonus = Math.min(streakDays * 3, 50);
  growth += streakBonus;
  
  // 均匀饮水奖励（每次间隔>30分钟）
  const hasUniformDrinking = recordIntervals.every(interval => interval >= 30);
  if (hasUniformDrinking && recordIntervals.length >= 3) {
    growth += 10;
  }
  
  // 超额奖励（上限10）
  if (baseAmount > goalAmount) {
    const excessBonus = Math.min((baseAmount - goalAmount) / 100, 10);
    growth += excessBonus;
  }
  
  return Math.round(growth);
}

// 进化阈值
const EVOLUTION_THRESHOLDS = {
  egg: 0,
  baby: 30,      // 3天达标
  child: 100,    // 7天达标
  teen: 300,     // 21天达标
  adult: 600,    // 45天达标
};

function getPetStage(totalGrowth: number): PetStage {
  if (totalGrowth >= EVOLUTION_THRESHOLDS.adult) return 'adult';
  if (totalGrowth >= EVOLUTION_THRESHOLDS.teen) return 'teen';
  if (totalGrowth >= EVOLUTION_THRESHOLDS.child) return 'child';
  if (totalGrowth >= EVOLUTION_THRESHOLDS.baby) return 'baby';
  return 'egg';
}
```

### 6.2 称号解锁检测

```typescript
// services/titleDetection.ts

interface TitleCondition {
  type: string;
  value: any;
}

async function checkTitleUnlocks(userId: string, context: UnlockContext): Promise<Title[]> {
  const unlockedTitles: Title[] = [];
  
  // 获取所有称号定义
  const titleDefs = await prisma.titleDef.findMany();
  
  for (const def of titleDefs) {
    // 检查是否已解锁
    const alreadyUnlocked = await prisma.userTitle.findFirst({
      where: { userId, titleId: def.id }
    });
    
    if (alreadyUnlocked) continue;
    
    // 检查解锁条件
    const shouldUnlock = await evaluateCondition(def.conditionType, def.conditionValue, context);
    
    if (shouldUnlock) {
      const userTitle = await prisma.userTitle.create({
        data: {
          userId,
          titleId: def.id,
          unlockedAt: new Date(),
        },
        include: { titleDef: true }
      });
      unlockedTitles.push(userTitle);
    }
  }
  
  return unlockedTitles;
}

// 条件评估器
async function evaluateCondition(
  type: string, 
  value: any, 
  context: UnlockContext
): Promise<boolean> {
  switch (type) {
    case 'streak_days':
      return context.streakDays >= value;
      
    case 'total_records':
      return context.totalRecords >= value;
      
    case 'consecutive_goal':
      return context.consecutiveGoalDays >= value;
      
    case 'low_intake_streak':
      return context.lowIntakeStreak >= value;
      
    case 'night_drinking':
      return context.nightDrinkingDays >= value;
      
    case 'exact_amount':
      return context.todayAmount === value;
      
    default:
      return false;
  }
}
```

### 6.3 智能提醒算法

```typescript
// services/reminderService.ts

function generateSmartReminders(
  workStart: string,
  workEnd: string,
  userPattern?: UserDrinkingPattern
): string[] {
  const reminders: string[] = [];
  const start = parseTime(workStart);
  const end = parseTime(workEnd);
  
  // 默认提醒时间
  const defaultReminders = [
    addMinutes(start, 30),   // 上班后30分钟
    addMinutes(start, 150),  // 上午中间
    addMinutes(end, -240),   // 下午开始
    addMinutes(end, -120),   // 下午中间
    addMinutes(end, -60),    // 下班前
  ];
  
  // 如果有用户习惯数据，进行智能调整
  if (userPattern) {
    for (const defaultTime of defaultReminders) {
      const adjustedTime = adjustTimeByPattern(defaultTime, userPattern);
      reminders.push(formatTime(adjustedTime));
    }
  } else {
    reminders.push(...defaultReminders.map(formatTime));
  }
  
  return reminders;
}

function adjustTimeByPattern(time: Date, pattern: UserDrinkingPattern): Date {
  // 根据用户历史记录调整提醒时间
  // 例如：如果用户经常在10:00喝水，将9:30的提醒调整到10:00
  const nearbyRecords = pattern.records.filter(r => 
    Math.abs(r.hour - time.getHours()) <= 1
  );
  
  if (nearbyRecords.length > 0) {
    const avgHour = nearbyRecords.reduce((sum, r) => sum + r.hour, 0) / nearbyRecords.length;
    const adjusted = new Date(time);
    adjusted.setHours(Math.round(avgHour));
    return adjusted;
  }
  
  return time;
}
```

---

## 7. 安全设计

### 7.1 认证与授权

```typescript
// 1. JWT Token策略
// Access Token: 15分钟有效期
// Refresh Token: 7天有效期

// 2. 请求认证流程
// Request → Verify JWT → Check User Active → Attach User → Next

// 3. 权限控制
// 用户只能访问自己的数据
// 中间件检查 resource.userId === req.user.id
```

### 7.2 数据安全

| 措施 | 实现 |
|------|------|
| 传输加密 | HTTPS/TLS 1.3 |
| 密码存储 | bcrypt (cost factor: 12) |
| 敏感数据 | AES-256加密存储 |
| SQL注入 | Prisma ORM参数化查询 |
| XSS防护 | 输入验证+输出转义 |
| CSRF防护 | SameSite Cookies + Token |

### 7.3 限流策略

```typescript
// 使用Redis实现滑动窗口限流
const rateLimits = {
  // 一般API
  default: { windowMs: 60 * 1000, maxRequests: 60 },
  // 认证API（防暴力破解）
  auth: { windowMs: 60 * 1000, maxRequests: 5 },
  // 记录创建（防止刷数据）
  createRecord: { windowMs: 60 * 1000, maxRequests: 10 },
  // 发送短信
  sendSMS: { windowMs: 60 * 1000, maxRequests: 1 },
};
```

---

## 8. 性能优化策略

### 8.1 前端优化

```
┌─────────────────────────────────────────────────────────────┐
│                    前端性能策略                              │
├─────────────────────────────────────────────────────────────┤
│  1. 代码分割                                                │
│     - 路由级别懒加载                                        │
│     - 动态导入大型组件（图表库）                              │
│                                                             │
│  2. 缓存策略                                                │
│     - Service Worker缓存静态资源                            │
│     - IndexedDB缓存用户数据                                 │
│     - Stale-while-revalidate策略                           │
│                                                             │
│  3. 渲染优化                                                │
│     - React.memo + useMemo                                  │
│     - 虚拟列表（长列表场景）                                 │
│     - 图片懒加载 + WebP格式                                 │
│                                                             │
│  4. 网络优化                                                │
│     - 请求合并/防抖                                         │
│     - 离线队列（离线操作缓存）                               │
│     - 增量同步（只传输变更数据）                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 后端优化

```
┌─────────────────────────────────────────────────────────────┐
│                    后端性能策略                              │
├─────────────────────────────────────────────────────────────┤
│  1. 数据库优化                                              │
│     - 索引覆盖常用查询                                      │
│     - 读写分离（如果规模扩大）                               │
│     - 连接池管理                                            │
│                                                             │
│  2. 缓存策略                                                │
│     - Redis缓存热点数据（用户配置、宠物状态）                │
│     - 计算结果缓存（排行榜、统计）                           │
│     - Cache-Aside模式                                      │
│                                                             │
│  3. 异步处理                                                │
│     - 称号解锁检测异步执行                                  │
│     - 推送通知队列化                                        │
│     - 批量操作异步化                                        │
│                                                             │
│  4. 响应优化                                                │
│     - 分页/游标分页                                         │
│     - 字段过滤（GraphQL风格）                               │
│     - 压缩响应 (gzip/brotli)                                │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 性能指标目标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| 首屏加载时间 | < 2s | Lighthouse |
| 可交互时间 (TTI) | < 3s | Lighthouse |
| API响应时间 (P95) | < 200ms | APM监控 |
| 离线功能可用性 | 100% | 自动化测试 |
| 推送到达率 | > 95% | FCM统计 |

---

## 9. 部署与运维

### 9.1 CI/CD流程

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 前端测试
      - name: Frontend Tests
        working-directory: ./frontend
        run: |
          npm ci
          npm run lint
          npm run test
          npm run build
      
      # 后端测试
      - name: Backend Tests
        working-directory: ./backend
        run: |
          npm ci
          npm run lint
          npm run test
      
      # 数据库迁移测试
      - name: DB Migration Test
        run: npx prisma migrate diff

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    # 部署到Staging环境

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    # 部署到生产环境
```

### 9.2 环境配置

```
┌─────────────────────────────────────────────────────────────┐
│                      环境变量配置                            │
├─────────────────────────────────────────────────────────────┤
│  通用                                                        │
│  ├── NODE_ENV=production|development                        │
│  └── LOG_LEVEL=info|debug|error                             │
│                                                             │
│  数据库                                                      │
│  ├── DATABASE_URL=postgresql://user:pass@host/db            │
│  ├── REDIS_URL=redis://host:6379                            │
│  └── DB_POOL_SIZE=10                                        │
│                                                             │
│  认证                                                        │
│  ├── JWT_SECRET=xxx                                         │
│  ├── JWT_EXPIRES_IN=15m                                     │
│  └── REFRESH_TOKEN_EXPIRES_IN=7d                            │
│                                                             │
│  第三方服务                                                  │
│  ├── FIREBASE_PROJECT_ID=xxx                                │
│  ├── FIREBASE_PRIVATE_KEY=xxx                               │
│  ├── WECHAT_APP_ID=xxx                                      │
│  └── WECHAT_APP_SECRET=xxx                                  │
│                                                             │
│  推送                                                        │
│  ├── VAPID_PUBLIC_KEY=xxx                                   │
│  └── VAPID_PRIVATE_KEY=xxx                                  │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 监控告警

```typescript
// 监控指标
const metrics = {
  // 业务指标
  activeUsers: '每日活跃用户',
  retentionRate: '7日留存率',
  
  // 技术指标
  apiLatency: 'API响应时间',
  errorRate: '错误率',
  dbConnections: '数据库连接数',
  
  // 推送指标
  pushDeliveryRate: '推送到达率',
  pushClickRate: '推送点击率',
};

// 告警阈值
const alerts = {
  errorRate: { threshold: 0.01, duration: '5m' },      // 错误率>1%
  apiLatency: { threshold: 500, duration: '10m' },      // P99延迟>500ms
  dbConnections: { threshold: 80, duration: '5m' },     // 连接数>80%
  diskUsage: { threshold: 0.85, duration: '1m' },       // 磁盘使用>85%
};
```

---

## 10. 风险评估与应对

### 10.1 技术风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| PWA iOS兼容性问题 | 高 | 中 | 早期测试，准备降级方案 |
| 推送到达率低 | 中 | 高 | 多渠道提醒（邮件备选） |
| 离线同步冲突 | 中 | 中 | 时间戳+版本号冲突解决 |
| 数据库性能瓶颈 | 低 | 高 | 索引优化，读写分离预案 |
| 微信OAuth审核 | 中 | 高 | 准备手机号登录备选 |

### 10.2 业务风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 用户留存率低 | 中 | 高 | 游戏化深度优化，A/B测试 |
| 成本超预算 | 低 | 高 | 使用量监控，自动扩容限制 |
| 数据安全事件 | 低 | 高 | 加密存储，定期审计 |
| 竞品模仿 | 高 | 中 | 快速迭代，建立品牌壁垒 |

### 10.3 应急预案

```
┌─────────────────────────────────────────────────────────────┐
│                      应急处理流程                            │
├─────────────────────────────────────────────────────────────┤
│  服务不可用                                                  │
│  1. 自动切换到静态降级页面                                   │
│  2. Service Worker提供离线功能                               │
│  3. 通知用户数据本地保存，恢复后同步                         │
│                                                             │
│  数据丢失                                                    │
│  1. 自动备份（每日）+ 手动备份（每周）                        │
│  2.  point-in-time恢复                                       │
│  3. 用户数据本地副本保护                                     │
│                                                             │
│  安全事件                                                    │
│  1. 自动熔断可疑IP                                           │
│  2. 强制重置受影响用户Token                                  │
│  3. 日志审计追踪                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. 附录

### 11.1 项目目录结构

```
HydratePet/
├── README.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── frontend/                    # React + TypeScript PWA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js               # Service Worker
│   │   └── icons/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/         # UI组件
│       │   ├── Pet/
│       │   ├── RecordButton/
│       │   └── Charts/
│       ├── pages/              # 页面组件
│       │   ├── Home/
│       │   ├── Stats/
│       │   └── Settings/
│       ├── hooks/              # 自定义Hooks
│       ├── stores/             # Zustand状态
│       ├── services/           # API调用
│       ├── utils/              # 工具函数
│       └── types/              # TypeScript类型
│
├── backend/                     # Node.js + Express
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型
│   └── src/
│       ├── index.ts            # 入口
│       ├── app.ts              # Express配置
│       ├── config/             # 配置
│       ├── middleware/         # 中间件
│       ├── routes/             # 路由
│       ├── controllers/        # 控制器
│       ├── services/           # 业务逻辑
│       ├── models/             # 数据模型
│       ├── utils/              # 工具
│       └── jobs/               # 定时任务
│
├── shared/                      # 共享类型/常量
│   └── types/
│       └── index.ts
│
└── docs/                        # 文档
    ├── architecture/           # 架构文档
    ├── api/                    # API文档
    └── design/                 # 设计稿
```

### 11.2 开发时间线

| 阶段 | 周期 | 里程碑 |
|------|------|--------|
| Phase 1 | Week 1-2 | 基础框架、数据库、API定义 |
| Phase 2 | Week 3-4 | 用户系统、饮水记录、宠物基础 |
| Phase 3 | Week 5-6 | 成长算法、称号系统、社交分享 |
| Phase 4 | Week 7-8 | 性能优化、测试上线 |

### 11.3 参考资源

- [React PWA Guide](https://create-react-app.dev/docs/making-a-progressive-web-app/)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Vercel Edge Network](https://vercel.com/docs/concepts/edge-network/overview)

---

*文档版本: v1.0*  
*创建时间: 2025年4月*  
*维护者: Tech Lead Architect*
