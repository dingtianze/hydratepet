# HydratePet 像素宠物喝水助手 🐾💧

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io)

> 🎮 养成喝水好习惯，让你的像素宠物从蛋孵化，一路进化到完全体！

---

## 🎯 项目介绍

HydratePet 是一款融合**健康管理**与**像素宠物养成**的 PWA 应用。每次喝水打卡，宠物都会获得成长值，从一颗蛋逐步进化为不同的像素形态。游戏化激励让喝水不再枯燥。

### 核心亮点

- **🐣 像素宠物进化** — 5 个进化阶段（蛋→幼年→成长期→少年→成年），每个阶段有独特的 SVG 像素造型
- **⚡ 进化动画** — 宝可梦风格进化特效：闪光→膨胀→粒子爆裂→新形态降临
- **🎨 体型个性化** — slim / normal / chubby 三种体型，影响宠物胖瘦和配色
- **😊 情绪联动** — 开心、口渴、难过、睡眠、兴奋，表情随 mood 实时变化
- **🏆 称号/徽章系统** — 解锁各种成就称号，展示你的饮水毅力
- **⏰ 智能提醒** — 定时推送通知，不错过每一次补水
- **📊 数据统计** — 周/月/年饮水趋势可视化
- **📤 社交分享** — 生成今日饮水成就卡片，分享给好友
- **💾 数据导出/导入** — JSON 备份与恢复，数据随身走
- **📱 PWA 离线支持** — 可安装到桌面，离线也能用

---

## 🧬 宠物进化系统

| 阶段 | 形态 | 特点 |
|------|------|------|
| 🥚 **蛋** | 像素椭圆 + 斑点 | 初始形态，有光泽高光 |
| 👶 **幼年** | 大头小身 + 大眼睛 | 圆润可爱，情绪反应丰富 |
| 🧒 **成长期** | 完整身体 + 手臂 | 开始有头冠/发型装饰 |
| 🧑 **少年** | 大眼 + 头发 + 完整肢体 | 更修长，表情更细腻 |
| 👑 **成年** | 流线型 + 皇冠光晕 | 最终形态，优雅霸气 |

### 进化动画流程

```
✨ 闪光 (0.5s) → 🔵 剪影膨胀 (1.0s) → 💥 粒子爆裂 (0.8s) → 🌟 新形态淡入 (0.5s)
```

---

## 🛠️ 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Tailwind CSS | 样式 + 深色/浅色主题 |
| Zustand | 状态管理 |
| Vite 5 | 构建工具 |
| Framer Motion | 进化动画 |
| react-router-dom v6 | 路由 |
| Workbox (PWA) | 离线缓存 + Service Worker |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js + Express | API 服务 |
| Prisma ORM + SQLite | 数据库 |
| JWT | 认证 (access + refresh token) |
| Zod | 请求校验 |
| Web Push | 浏览器推送通知 |

---

## 🚀 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm 或 pnpm

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/dingtianze/hydratepet.git
cd hydratepet

# 2. 安装并运行后端
cd backend
npm install
cp .env.example .env        # 配置环境变量（JWT密钥等）
npx prisma migrate dev
npm run dev
# 后端运行在 http://localhost:3001

# 3. 安装并运行前端（新终端）
cd ../frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

### 生产构建

```bash
# 构建全部
npm run build

# 或分别构建
cd backend && npm run build && npm start
cd frontend && npm run build
```

---

## 📁 项目结构

```
hydratepet/
├── frontend/                    # React PWA 前端
│   ├── src/
│   │   ├── pages/               # 页面（Home/Pet/Records/Settings...）
│   │   ├── components/
│   │   │   ├── pet/             # 像素宠物组件
│   │   │   │   ├── PetAvatar.tsx          # SVG 像素渲染（5阶段+情绪+体型）
│   │   │   │   ├── EvolutionAnimation.tsx # 进化动画（闪光→粒子→新形态）
│   │   │   │   ├── PixelSpriteRenderer.tsx# 精灵渲染引擎
│   │   │   │   └── pixelSprites.ts        # 像素精灵定义
│   │   │   ├── ui/              # 通用 UI 组件
│   │   │   └── Layout.tsx       # 应用布局
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── services/            # API 封装
│   │   ├── hooks/               # 自定义 Hooks
│   │   └── types/               # TypeScript 类型定义
│   └── public/                  # 静态资源
├── backend/                     # Express API 后端
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   ├── services/            # 业务逻辑
│   │   ├── middleware/          # 中间件
│   │   └── config/              # 配置文件
│   └── prisma/                  # 数据库模型 + 迁移
└── docs/                        # 文档
```

---

## 🔌 API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/guest` | POST | 游客登录（快速体验） |
| `/api/auth/register` | POST | 手机/微信注册 |
| `/api/auth/login` | POST | 手机/微信登录 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/pets` | GET | 获取宠物信息 |
| `/api/pets/feed` | POST | 喂食（增加成长值） |
| `/api/pets/interact` | POST | 与宠物互动 |
| `/api/water-records` | GET/POST | 饮水记录 |
| `/api/achievements` | GET | 成就列表 |

---

## 🤝 贡献

欢迎提交 Issue 和 PR！请确保：
- 代码通过 TypeScript 编译检查
- API 变动附带 curl 测试
- 前端修改在无痕模式下验证无报错

---

## 📄 许可证

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️, 💧 and 🐾 by HydratePet Team
  <br/>
  <sub>像素宠物喝水助手 · 让喝水成为习惯</sub>
</p>
