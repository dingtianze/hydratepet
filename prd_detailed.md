# PRD详细文档：像素宠物喝水助手
## 项目代号：HydratePet
## 版本：v1.0
## 状态：MVP阶段

---

# 一、项目概述

## 1.1 产品定位
一款以像素宠物养成为核心机制的喝水提醒PWA应用，通过游戏化体验帮助用户养成健康饮水习惯。

## 1.2 核心卖点
- **零门槛使用**：PWA无需下载，浏览器即用
- **游戏化激励**：像素宠物随饮水成长，解锁称号
- **社交货币**：搞笑称号可分享，形成传播

## 1.3 目标用户
| 属性 | 描述 |
|------|------|
| 年龄 | 18-30岁 |
| 职业 | 学生、办公室白领 |
| 特征 | 久坐、常忘喝水、喜欢轻度游戏 |
| 设备 | 手机为主，偶尔电脑 |

## 1.4 成功指标
| 指标 | MVP目标 | 验证周期 |
|------|---------|----------|
| 7日留存率 | >30% | 上线1个月 |
| 每日打卡率 | >50% | 上线1个月 |
| 添加桌面率 | >20% | 上线1个月 |
| NPS评分 | >30 | 上线1个月 |

---

# 二、功能模块详细设计

## 2.1 模块总览

```
HydratePet
├── M1: 用户系统
├── M2: 像素宠物系统（核心）
├── M3: 饮水记录系统
├── M4: 提醒系统
├── M5: 称号/成就系统
├── M6: 数据统计
└── M7: 社交分享
```

## 2.2 M1: 用户系统

### 2.2.1 功能清单
- [ ] 游客模式（本地存储）
- [ ] 手机号注册/登录
- [ ] 微信OAuth登录
- [ ] 个人资料设置
- [ ] 数据同步/备份

### 2.2.2 用户旅程
```
首次打开
  → 看到宠物蛋动画
  → 选择登录方式（游客/手机/微信）
  → 填写基础信息（体重、性别、工作时间）
  → 孵化宠物
  → 进入首页
```

### 2.2.3 数据字段
```typescript
interface User {
  id: string;
  auth_type: 'guest' | 'phone' | 'wechat';
  phone?: string;
  wechat_openid?: string;
  nickname: string;
  avatar?: string;
  weight: number;        // kg
  gender: 'male' | 'female';
  work_start: string;    // "09:00"
  work_end: string;      // "18:00"
  daily_goal: number;    // ml, 根据体重计算
  created_at: Date;
  last_login: Date;
}
```

---

## 2.3 M2: 像素宠物系统（核心）

### 2.3.1 宠物状态机
```
[蛋] → [孵化期] → [幼年期] → [成长期] → [成熟期]
        ↓          ↓          ↓
      注册后     连续3天    连续14天
      首次打卡    达标       达标
```

### 2.3.2 成长值计算
```typescript
// 每日成长值
const dailyGrowth = {
  base: 10,                    // 基础值
  goal_bonus: 20,              // 完成目标奖励
  streak_bonus: streak * 5,    // 连续天数加成
  perfect_bonus: 10,           // 均匀饮水奖励（每次间隔>30分钟）
}

// 总成长值 = 累计所有天数
// 形态进化阈值
const evolutionThresholds = {
  egg: 0,
  baby: 30,       // 3天
  child: 100,     // 7天
  teen: 300,      // 21天
  adult: 600,     // 45天
}
```

### 2.3.3 宠物形象生成规则
```typescript
interface Pet {
  id: string;
  user_id: string;
  name: string;           // 用户可自定义
  stage: 'egg' | 'baby' | 'child' | 'teen' | 'adult';
  growth: number;         // 总成长值
  
  // 视觉属性
  body_type: 'slim' | 'normal' | 'chubby';      // 根据平均饮水量
  color_palette: string[];                       // 根据饮水时间分布
  accessories: string[];                         // 解锁的装饰
  
  // 状态
  mood: 'happy' | 'thirsty' | 'sad' | 'sleepy';
  last_fed: Date;
  health: number;         // 0-100
}

// 体型计算
const getBodyType = (avgIntake: number, goal: number) => {
  if (avgIntake < goal * 0.5) return 'slim';      // 瘦小
  if (avgIntake > goal * 1.2) return 'chubby';    // 圆润
  return 'normal';
}

// 颜色计算（基于饮水时间热力分布）
const getColorPalette = (timeDistribution: number[]) => {
  // 上午多 → 暖色调
  // 下午多 → 冷色调
  // 均匀 → 彩虹色
}
```

### 2.3.4 宠物互动
- **点击反馈**：宠物有简单动画反应
- **喂食动画**：记录饮水时的成长动画
- **闲置状态**：长时间不操作时的待机动画
- **提醒动画**：到点时宠物的提示动画

---

## 2.4 M3: 饮水记录系统

### 2.4.1 记录方式
| 方式 | 交互 | 场景 |
|------|------|------|
| 快速打卡 | 一键+150ml | 忙碌时 |
| 选择容量 | 100/200/300/500ml | 精确记录 |
| 自定义 | 输入任意数值 | 特殊情况 |

### 2.4.2 数据模型
```typescript
interface WaterRecord {
  id: string;
  user_id: string;
  amount: number;         // ml
  timestamp: Date;
  type: 'quick' | 'custom';
  note?: string;          // 可选备注
}

interface DailySummary {
  user_id: string;
  date: string;           // YYYY-MM-DD
  total_amount: number;
  record_count: number;
  goal_reached: boolean;
  streak_days: number;
  records: WaterRecord[];
}
```

### 2.4.3 饮水建议算法
```typescript
// 计算建议饮水量
const calculateGoal = (weight: number, gender: string) => {
  const base = weight * (gender === 'male' ? 35 : 30);
  return Math.round(base / 50) * 50;  // 取整到50ml
}

// 智能提醒时间生成
const generateReminders = (workStart: string, workEnd: string) => {
  const reminders = [];
  const start = parseTime(workStart);
  const end = parseTime(workEnd);
  
  // 上午提醒
  reminders.push(addMinutes(start, 30));   // 9:30
  reminders.push(addMinutes(start, 120));  // 11:00
  
  // 下午提醒
  reminders.push(addMinutes(start, 300));  // 14:00
  reminders.push(addMinutes(start, 420));  // 16:00
  reminders.push(addMinutes(end, -60));    // 17:00
  
  return reminders;
}
```

---

## 2.5 M4: 提醒系统

### 2.5.1 提醒方式
| 方式 | 实现 | 优先级 |
|------|------|--------|
| PWA推送 | Service Worker + Push API | P0 |
| 宠物动画 | 页面内动画提示 | P0 |
| 声音提醒 | 可选音效 | P1 |
| 震动 | 移动端震动API | P2 |

### 2.5.2 提醒策略
```typescript
interface ReminderConfig {
  enabled: boolean;
  intervals: string[];    // ["09:30", "11:00", "14:00", "16:00", "17:00"]
  workdays_only: boolean;
  quiet_hours: {          // 免打扰
    start: "22:00",
    end: "08:00"
  };
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

// 智能调整
const adjustReminder = (userPattern: UserPattern) => {
  // 如果用户经常在10:00左右记录，调整提醒时间
  // 如果用户连续忽略某时段提醒，降低该时段频率
}
```

---

## 2.6 M5: 称号/成就系统

### 2.6.1 称号体系

#### 饮水量称号
| 称号 | 条件 | 类型 |
|------|------|------|
| 🏜️ 沙漠骆驼 | 连续3天饮水<500ml | 自嘲 |
| 🌵 仙人掌 | 偶尔喝水但活得很好 | 幽默 |
| 🐟 浅水鱼 | 每天达标但不规律 | 温和 |
| 🌊 深海霸主 | 连续30天达标 | 成就 |
| 🧊 冰山美人 | 只喝冰水 | 习惯 |
| ☕ 咖啡续命 | 咖啡计入饮水量的天数>50% | 习惯 |

#### 规律性称号
| 称号 | 条件 |
|------|------|
| ⏰ 喝水机器 | 连续7天准点喝水 |
| 🌅 早鸟 | 连续7天上午完成50%目标 |
| 🦉 夜猫子 | 连续3天晚上22点后喝水 |
| 🎯 狙击手 | 单次饮水恰好达到目标值 |

#### 连续性称号
| 称号 | 条件 |
|------|------|
| 🔥 三日燃 | 连续3天达标 |
| ⚡ 周周赞 | 连续7天达标 |
| 🏆 月冠军 | 连续30天达标 |
| 👑 喝水王者 | 连续100天达标 |

### 2.6.2 成就徽章
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // 像素图标
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: BadgeCondition;
  unlocked_at?: Date;
}
```

---

## 2.7 M6: 数据统计

### 2.7.1 数据维度
- 日视图：今日进度、各时段分布
- 周视图：本周趋势、达标天数
- 月视图：月度总结、称号获取
- 年视图：年度总饮水量、习惯养成

### 2.7.2 可视化
- 进度环：今日目标完成度
- 柱状图：周/月趋势
- 热力图：一天中的饮水时间分布
- 折线图：体重/饮水量变化（可选）

---

## 2.8 M7: 社交分享

### 2.8.1 分享内容
- 今日打卡卡片
- 新称号解锁海报
- 宠物成长对比图
- 周/月总结报告

### 2.8.2 分享形式
- 生成图片保存
- 直接分享到微信
- 复制文案到剪贴板

---

# 三、技术架构

## 3.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 组件化开发 |
| 状态管理 | Zustand | 轻量级状态 |
| UI组件 | Tailwind CSS + Headless UI | 原子化样式 |
| PWA | Workbox | Service Worker管理 |
| 动画 | Framer Motion + Lottie | 交互动画 |
| 后端 | Node.js + Express / Python + FastAPI | API服务 |
| 数据库 | PostgreSQL + Redis | 主库+缓存 |
| 推送 | Firebase Cloud Messaging | 跨平台推送 |
| 文件存储 | 阿里云OSS / AWS S3 | 图片资源 |
| 部署 | Vercel(前端) + Railway/Render(后端) | 快速部署 |

## 3.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      客户端层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Web    │  │  PWA     │  │  Mobile  │              │
│  │ (Chrome) │  │ (iOS/安卓)│  │  Browser │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼────────────┼────────────┼──────────────────────┘
        │            │            │
        └────────────┴────────────┘
                     │
        ┌────────────┴────────────┐
        │      Service Worker    │
        │   (离线缓存+推送接收)   │
        └────────────┬────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                      API网关层                           │
│              Nginx / Vercel Edge                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                      服务层                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 用户服务  │ │ 宠物服务  │ │ 记录服务  │ │ 推送服务  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────┴────┐ ┌────┴────┐ ┌────┴────┐
│ PostgreSQL │ │  Redis  │ │  OSS    │
│  (主数据)   │ │ (缓存)  │ │ (文件)  │
└────────────┘ └─────────┘ └─────────┘
```

## 3.3 API设计

### 3.3.1 用户相关
```typescript
// POST /api/auth/register
interface RegisterRequest {
  phone?: string;
  wechat_code?: string;
  nickname: string;
  weight: number;
  gender: string;
  work_hours: { start: string; end: string };
}

// GET /api/user/profile
// PUT /api/user/profile
// POST /api/user/sync  // 游客数据同步到正式账号
```

### 3.3.2 宠物相关
```typescript
// GET /api/pet
interface PetResponse {
  id: string;
  name: string;
  stage: string;
  growth: number;
  max_growth: number;
  visual: PetVisual;
  mood: string;
  next_evolution: number;
}

// POST /api/pet/rename
// POST /api/pet/feed  // 记录饮水触发
```

### 3.3.3 记录相关
```typescript
// POST /api/records
interface CreateRecordRequest {
  amount: number;
  timestamp?: string;
  note?: string;
}

// GET /api/records?start=2024-01-01&end=2024-01-31
// GET /api/records/today
// GET /api/records/summary?period=week|month
```

### 3.3.4 提醒相关
```typescript
// GET /api/reminders/config
// PUT /api/reminders/config
// POST /api/reminders/test  // 测试推送
```

---

# 四、数据库设计

## 4.1 ER图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │     pets     │       │    badges    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │   ┌───│ id (PK)      │
│ phone        │   │   │ user_id (FK) │───┘   │ name         │
│ wechat_id    │   └──→│ name         │       │ description  │
│ nickname     │       │ stage        │       │ icon_url     │
│ weight       │       │ growth       │       │ rarity       │
│ daily_goal   │       │ visual_json  │       └──────────────┘
│ created_at   │       │ mood         │
└──────────────┘       └──────────────┘
         │
         │            ┌──────────────┐       ┌──────────────┐
         │            │   records    │       │   titles     │
         │            ├──────────────┤       ├──────────────┤
         └───────────→│ id (PK)      │       │ id (PK)      │
                      │ user_id (FK) │       │ user_id (FK) │
                      │ amount       │       │ title_id     │
                      │ timestamp    │       │ unlocked_at  │
                      │ note         │       └──────────────┘
                      └──────────────┘
```

## 4.2 表结构

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_type VARCHAR(20) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    wechat_openid VARCHAR(100) UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    weight INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    work_start TIME DEFAULT '09:00',
    work_end TIME DEFAULT '18:00',
    daily_goal INTEGER DEFAULT 1500,
    push_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### pets
```sql
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) DEFAULT '小水滴',
    stage VARCHAR(20) DEFAULT 'egg',
    growth INTEGER DEFAULT 0,
    body_type VARCHAR(20),
    color_palette JSONB,
    accessories JSONB DEFAULT '[]',
    mood VARCHAR(20) DEFAULT 'happy',
    last_fed TIMESTAMP,
    health INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### water_records
```sql
CREATE TABLE water_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    record_type VARCHAR(20) DEFAULT 'quick',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 五、UI/UX设计规范

## 5.1 设计原则
- **像素风格**：复古8-bit游戏感
- **明亮配色**：蓝绿色系（水的联想）
- **大按钮**：方便快速打卡
- **即时反馈**：每次操作都有动画回应

## 5.2 配色方案
```css
:root {
  /* 主色调 */
  --primary: #4ECDC4;      /* 清新蓝绿 */
  --primary-dark: #26A69A;
  --primary-light: #80DEEA;
  
  /* 辅助色 */
  --secondary: #FFE66D;    /* 暖黄 */
  --accent: #FF6B6B;       /* 强调红 */
  
  /* 中性色 */
  --bg: #F0F9FF;          /* 浅蓝背景 */
  --text: #2C3E50;        /* 深色文字 */
  --text-light: #7F8C8D;  /* 浅色文字 */
  
  /* 宠物专用色 */
  --pet-blue: #74B9FF;
  --pet-green: #55EFC4;
  --pet-pink: #FD79A8;
}
```

## 5.3 页面结构

### 首页（打卡页）
```
┌─────────────────────────┐
│  ☰  HydratePet    👤    │  ← 导航栏
├─────────────────────────┤
│                         │
│      ┌─────────┐        │
│      │         │        │
│      │  像素   │        │  ← 宠物展示区
│      │  宠物   │        │    (点击互动)
│      │         │        │
│      └─────────┘        │
│                         │
│   "小水滴有点渴了~"      │  ← 宠物对话
│                         │
├─────────────────────────┤
│  今日进度: 750ml/1500ml  │
│  ████████░░░░░░ 50%     │  ← 进度条
├─────────────────────────┤
│                         │
│   ┌───────┐ ┌───────┐   │
│   │  +100 │ │  +200 │   │  ← 快速打卡按钮
│   └───────┘ └───────┘   │
│                         │
│   ┌─────────────────┐   │
│   │    自定义水量    │   │  ← 自定义输入
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

### 数据页
```
┌─────────────────────────┐
│  ←  数据统计            │
├─────────────────────────┤
│  周 | 月 | 年           │  ← 切换标签
├─────────────────────────┤
│                         │
│   [柱状图/折线图]        │  ← 趋势图表
│                         │
├─────────────────────────┤
│  本周达标: 5/7天        │
│  平均饮水: 1350ml/天    │
│  最爱时段: 下午2点      │  ← 关键指标
├─────────────────────────┤
│  获得称号               │
│  🌊 深海霸主             │
│  ⏰ 喝水机器             │  ← 称号展示
└─────────────────────────┘
```

## 5.4 交互规范
- **按钮点击**：缩小0.95 + 音效
- **宠物点击**：抖动动画 + 冒爱心
- **记录成功**：成长值飘字 + 宠物跳跃
- **获得称号**：弹窗 + 彩带动画
- **页面切换**：滑动过渡

---

# 六、Agent团队分工

## 6.1 角色定义

```
Project: HydratePet
│
├── 🎨 Product Designer (UI/UX)
│   ├── 设计首页、数据页、设置页
│   ├── 像素宠物视觉规范
│   └── 交互动效设计
│
├── ⚛️ Frontend Developer
│   ├── React组件开发
│   ├── PWA配置（Service Worker、Manifest）
│   └── 动画实现
│
├── 🔧 Backend Developer
│   ├── API接口开发
│   ├── 数据库设计与迁移
│   └── 推送服务集成
│
├── 📊 Data Analyst
│   ├── 称号/成就算法
│   ├── 宠物成长计算
│   └── 用户行为分析
│
└── 🧪 QA Engineer
    ├── 测试用例编写
    ├── 兼容性测试
    └── 性能优化
```

## 6.2 任务拆分

### Phase 1: 基础框架（Week 1-2）
| 任务 | 负责Agent | 交付物 |
|------|----------|--------|
| 项目初始化 | Frontend | React + TS + Tailwind 基础框架 |
| 数据库设计 | Backend | PostgreSQL schema + migrations |
| API接口定义 | Backend | OpenAPI/Swagger文档 |
| UI设计稿 | Designer | Figma设计稿（首页+打卡流程） |

### Phase 2: 核心功能（Week 3-4）
| 任务 | 负责Agent | 交付物 |
|------|----------|--------|
| 用户系统 | Backend | 注册/登录/数据同步API |
| 饮水记录 | Frontend + Backend | 记录组件 + API对接 |
| 宠物基础 | Frontend | 像素宠物展示组件 |
| 提醒系统 | Backend + Frontend | Push通知 + 提醒设置UI |

### Phase 3: 游戏化（Week 5-6）
| 任务 | 负责Agent | 交付物 |
|------|----------|--------|
| 成长算法 | Data Analyst | 成长值计算 + 进化逻辑 |
| 宠物进化 | Frontend | 不同形态宠物渲染 |
| 称号系统 | Data Analyst + Frontend | 称号解锁逻辑 + UI |
| 社交分享 | Frontend | 分享卡片生成 |

### Phase 4: 优化上线（Week 7-8）
| 任务 | 负责Agent | 交付物 |
|------|----------|--------|
| 性能优化 | QA + Frontend | Lighthouse评分>80 |
| 兼容性测试 | QA | iOS/Android/Chrome测试报告 |
| 部署上线 | Backend | 生产环境部署 |

---

# 七、开发规范

## 7.1 代码规范
- ESLint + Prettier 统一格式
- Conventional Commits 提交规范
- 组件命名：PascalCase
- 函数命名：camelCase
- 常量命名：UPPER_SNAKE_CASE

## 7.2 分支管理
```
main        ← 生产分支
├── develop  ← 开发分支
├── feature/pet-system
├── feature/notification
├── fix/login-issue
└── hotfix/critical-bug
```

## 7.3 测试要求
- 单元测试覆盖率 > 60%
- 核心流程必须测试（登录→打卡→查看数据）
- PWA离线功能测试
- 推送通知测试

---

# 八、附录

## 8.1 参考竞品
- Plant Nanny（游戏化参考）
- 喝水时间（功能参考）
- 小日常（UI风格参考）

## 8.2 技术参考
- PWA最佳实践：https://web.dev/pwa/
- Push API文档：https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Service Worker指南：https://developers.google.com/web/fundamentals/primers/service-workers

## 8.3 术语表
| 术语 | 解释 |
|------|------|
| PWA | Progressive Web App，渐进式网页应用 |
| Service Worker | 浏览器后台脚本，支持离线缓存和推送 |
| Push API | 浏览器推送通知接口 |
| MVP | Minimum Viable Product，最小可行产品 |
| 成长值 | 宠物升级的经验值 |

---

*文档版本: v1.0*
*创建时间: 2025年4月*
*最后更新: 2025年4月*
