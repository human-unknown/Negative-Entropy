# 逆熵 - 理性辩论平台

## 项目简介

「逆熵」是一个理性辩论平台，旨在通过结构化的辩论流程，促进高质量的观点交流和理性讨论。

## 技术栈

### 前端
- **框架**: Vue 3 + Vite
- **UI组件库**: Element Plus
- **响应式**: 原生CSS + Flexbox/Grid（自适应PC和移动端）
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

### 后端
- **框架**: Express.js (Node.js)
- **API规范**: RESTful API
- **认证**: JWT (jsonwebtoken)
- **数据库驱动**: mysql2
- **参数验证**: express-validator
- **跨域**: cors

### 数据库
- **数据库**: MySQL 8.0+
- **ORM**: 原生SQL查询（保持简单）

### 开发工具
- **包管理**: npm/pnpm
- **代码规范**: ESLint + Prettier
- **版本控制**: Git

## 项目结构

```
逆熵/
├── frontend/          # 前端项目
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   ├── config/
│   └── package.json
├── database/          # 数据库脚本
│   └── schema.sql
└── README.md
```

## 快速开始

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 后端启动
```bash
cd backend
npm install
npm run dev
```

### 数据库初始化
```bash
mysql -u root -p < database/schema.sql
```

## 核心功能

- 用户注册/登录
- 创建辩论话题
- 发表观点和论据
- 投票和评分机制
- 评论和回复

## 技术选型理由

- **Vue 3**: 轻量、易学、生态成熟，响应式系统强大
- **Express.js**: 极简、灵活、中间件丰富，快速开发API
- **MySQL**: 成熟稳定、事务支持、关系型数据适合辩论结构
- **RESTful API**: 标准化接口，前后端分离，易于维护

## 开发环境要求

- Node.js >= 18.0
- MySQL >= 8.0
- npm >= 9.0
