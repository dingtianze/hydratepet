# HydratePet Backend API

像素宠物喝水助手后端 API 服务

## 技术栈

- **运行时**: Node.js 20.x LTS
- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL 16
- **验证**: Zod
- **认证**: JWT

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等参数
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 种子数据（称号、徽章定义）
npm run db:seed
```

### 4. 启动开发服务

```bash
npm run dev
```

服务将在 http://localhost:3001 运行

## 项目结构

```
src/
├── config/           # 配置文件
│   └── database.ts    # 数据库连接
├── controllers/      # 控制器
├── middleware/       # 中间件
│   ├── auth.ts        # JWT认证
│   ├── errorHandler.ts # 错误处理
│   └── requestLogger.ts # 请求日志
├── routes/           # 路由定义
│   ├── auth.routes.ts    # 认证路由
│   ├── health.routes.ts  # 健康检查
│   ├── user.routes.ts    # 用户路由
│   ├── pet.routes.ts     # 宠物路由
│   ├── record.routes.ts  # 饮水记录路由
│   ├── stats.routes.ts   # 统计路由
│   ├── title.routes.ts   # 称号路由
│   └── reminder.routes.ts # 提醒路由
├── utils/            # 工具函数
│   ├── ApiError.ts     # API错误类
│   └── logger.ts       # 日志工具
├── app.ts            # Express 应用配置
└── index.ts          # 入口文件

prisma/
├── schema.prisma     # 数据库模型
└── seed.ts           # 种子数据
```

## API 接口

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新 Token |
| POST | /api/auth/logout | 登出 |

### 用户接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users/profile | 获取用户资料 |
| PUT | /api/users/profile | 更新用户资料 |
| DELETE | /api/users/account | 注销账号 |

### 宠物接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/pets | 获取宠物信息 |
| POST | /api/pets/rename | 重命名宠物 |
| POST | /api/pets/interact | 与宠物互动 |

### 饮水记录接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/records | 获取记录列表 |
| GET | /api/records/today | 获取今日记录 |
| POST | /api/records | 创建记录 |
| DELETE | /api/records/:id | 删除记录 |

### 统计接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/stats/summary | 统计概览 |
| GET | /api/stats/trend | 饮水趋势 |
| GET | /api/stats/distribution | 时段分布 |

### 称号接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/titles | 获取称号列表 |
| POST | /api/titles/:id/equip | 装备称号 |
| GET | /api/badges | 获取徽章列表 |

### 提醒接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/reminders/config | 获取提醒配置 |
| PUT | /api/reminders/config | 更新提醒配置 |
| POST | /api/reminders/subscribe | 订阅推送 |
| POST | /api/reminders/unsubscribe | 取消订阅 |
| POST | /api/reminders/test | 发送测试推送 |

### 健康检查

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/health | 服务状态检查 |
| GET | /api/health/ping | Ping 测试 |

## 响应格式

所有 API 响应使用统一格式:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

错误响应:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3001 |
| DATABASE_URL | 数据库连接字符串 | - |
| JWT_SECRET | JWT 秘钥 | - |
| JWT_EXPIRES_IN | Token 有效期 | 15m |
| JWT_REFRESH_SECRET | 刷新 Token 秘钥 | - |
| JWT_REFRESH_EXPIRES_IN | 刷新 Token 有效期 | 7d |
| VAPID_PUBLIC_KEY | Web Push 公钥 | - |
| VAPID_PRIVATE_KEY | Web Push 私钥 | - |
| LOG_LEVEL | 日志级别 | debug |

## 部署

项目配置为部署到 Railway:

```bash
# 生成生产迁移
npm run db:migrate:prod

# 构建
npm run build

# 启动
npm start
```

## 开发规范

- 使用 ESLint + Prettier 统一代码格式
- 使用 Conventional Commits 提交规范
- 所有 API 需要进行输入验证 (Zod)
- 控制器使用 try-catch 捕获错误，由全局错误处理器统一处理
