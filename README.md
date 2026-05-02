# HydratePet 像素宠物喝水助手

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> 养成喝水好习惯，让你的像素宠物健康成长！

## 项目介绍

HydratePet 是一款融合健康管理与宠物养成的 PWA 应用，通过趣味性的方式帮助用户养成规律喝水的好习惯。每次记录饮水，你的宠物都会获得成长，从蛋孵逐渐进化为各种形态。

### 核心功能

- **智能饮水记录** — 快速记录饮水量，支持自定义杯具容量
- **像素宠物养成** — 记录饮水让宠物成长进化，多阶段形态变化
- **称号/徽章系统** — 解锁各种称号和徽章，展示你的饮水成就
- **智能提醒** — 定时推送提醒，不错过每一次补水时机
- **数据统计** — 周/月/年维度的饮水数据可视化
- **社交分享** — 分享今日成就卡片给好友
- **数据导出/导入** — JSON 格式数据备份与恢复
- **PWA 离线支持** — 可安装到桌面，离线也能使用

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS + 深色/浅色主题
- Zustand 状态管理
- Vite 构建工具
- PWA (Workbox)
- Vitest 测试

### 后端
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- JWT 认证
- Web Push 推送
- Zod 数据校验

## 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm 或 pnpm

### 安装与运行

```bash
# 1. 克隆项目
git clone <repo-url>
cd my_horse_project2

# 2. 安装并运行后端
cd backend
npm install
npx prisma migrate dev
npm run db:seed
npm run dev

# 3. 安装并运行前端 (新终端)
cd ../frontend
npm install
npm run dev
```

### 生产构建

```bash
# 后端
cd backend
npm run build
npm start

# 前端
cd frontend
npm run build
# 静态文件在 dist/ 目录，可部署到任何静态托管服务
```

## 项目结构

```
my_horse_project2/
├── frontend/          # React PWA 前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 通用组件
│   │   ├── stores/      # Zustand 状态管理
│   │   └── services/    # API 封装
│   └── public/          # 静态资源
├── backend/           # Express API 后端
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 业务逻辑
│   │   ├── middleware/  # 中间件
│   │   └── config/      # 配置文件
│   └── prisma/          # 数据库模型
└── docs/              # 文档
```

## 贡献

欢迎提交 Issue 和 PR！请确保代码经过测试并符合项目代码规范。

## 许可证

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by HydratePet Team
</p>
