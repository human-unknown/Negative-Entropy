# 逆熵辩论平台 — 项目审查与改进方向

> 审查日期：2026-05-08 | 审查范围：全栈（前端 + 后端 + 部署 + DevOps + 安全）

---

## 总评

项目整体质量扎实——17 个控制器、15 组路由、31 个组件、32 张数据库表、44 个测试全部通过、ESLint 前后端 0 Error 0 Warning。验收报告结论为「具备上线条件」是合理的。

但审查中发现若干**安全缺口、架构债务、运维盲区**，按严重程度分 P0/P1/P2 三级列出如下。

---

## 🔴 P0 — 上线前必须修复（阻塞生产部署）

### 1. 速率限制停留在配置文件中，未实际生效

**现状**：`.env.production` 定义了 `RATE_LIMIT_WINDOW_MS=900000` 和 `RATE_LIMIT_MAX_REQUESTS=100`，但代码中**没有任何地方读取这些变量，也没有安装/挂载任何 rate limiter 中间件**。验收报告中「速率限制：✅ 已实施 100次/15分钟」与事实不符。

**风险**：无防护状态下，单个 IP 可对登录、注册、验证码等端点发起暴力请求，几秒内打满数据库连接池。

**修复**：
```bash
cd backend && npm install express-rate-limit
```
在 `app.js` 中挂载全局和敏感路由限流：
```js
import rateLimit from 'express-rate-limit'

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', globalLimiter)

// 登录/注册等敏感端点：更严格
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
})
app.use('/api/auth/', authLimiter)
```

---

### 2. 缺少安全响应头（helmet）

**现状**：未使用 `helmet` 中间件。Nginx 配置中也没有 CSP、X-Frame-Options、X-Content-Type-Options 等安全头。

**风险**：XSS、点击劫持、MIME 嗅探攻击无硬件防护。

**修复**：
```bash
cd backend && npm install helmet
```
```js
import helmet from 'helmet'
app.use(helmet())
```

---

### 3. CORS 全放通

**现状**：`app.use(cors())` — 没有任何 origin 限制，任意域名的前端都可以调用 API。

**风险**：CSRF 攻击面完全暴露。

**修复**：生产环境硬编码允许的 origin：
```js
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:5173',
  credentials: true,
}
app.use(cors(corsOptions))
```

---

### 4. Docker Compose 中硬编码占位密码

**现状**：`docker-compose.yml` 中明文写着 `root_password_change_me`、`db_password_change_me`、`prod-jwt-secret-change-me`。

**风险**：若直接 `docker compose up`，数据库和 JWT 使用弱密码。

**修复**：改用环境变量文件：
```yaml
env_file:
  - .env.production
```
并在部署文档中明确要求**先修改密码再启动**。

---

### 5. 验证码内存存储，不支持多实例

**现状**：`SECURITY_TEST_GUIDE.md` 明确指出「当前使用内存存储验证码，生产环境建议使用 Redis」。尚无 Redis 集成。

**风险**：服务重启后所有验证码丢失；多实例部署时验证码不共享。

**修复**：集成 Redis，`docker-compose.yml` 增加 Redis 服务，验证码相关逻辑改用 Redis 存储 + TTL 自动过期。

---

## 🟠 P1 — 应尽快修复（影响长期维护）

### 6. Pinia 已安装但零 Store 文件

**现状**：`frontend/package.json` 依赖 `pinia`，`main.js` 中调用了 `createPinia()`，但 `frontend/src/stores/` 目录**不存在**。全站状态管理依赖 `localStorage.getItem/setItem` 在组件中直接操作。

**影响**：
- 状态分散，难以追踪和调试
- 重复读取 localStorage 影响性能
- 响应式断链——用户登出后其他组件不知道状态变更

**建议**：按领域拆出 Store：
```
stores/
├── user.js        # 用户信息、登录状态、token
├── debate.js      # 当前辩论状态、发言列表
├── notification.js # 未读通知数
└── admin.js       # 管理后台数据缓存
```

---

### 7. 测试未接入 CI

**现状**：`.github/workflows/ci.yml` 只做 `lint` + `build`，**没有跑测试**。44 个通过的测试只在本地有意义。

**修复**：在 CI 中增加测试 Job：
```yaml
test-backend:
  runs-on: ubuntu-latest
  services:
    mysql:
      image: mysql:8.0
      env:
        MYSQL_ROOT_PASSWORD: test
        MYSQL_DATABASE: negentropy_test
  steps:
    - run: npm ci && npm test
```

---

### 8. 测试覆盖率严重不均

| 控制器 | 是否有测试 |
|--------|----------|
| authController | ✅ |
| debateController | ✅ |
| ruleController | ✅ |
| templateController | ✅ |
| scoreController | ✅ |
| roundEngine (util) | ✅ |
| userController | ❌ |
| adminController | ❌ |
| reportController | ❌ |
| appealController | ❌ |
| notificationController | ❌ |
| checkController | ❌ |
| securityController | ❌ |
| feedbackController | ❌ |
| ruleDebateController | ❌ |
| systemController | ❌ |
| structuredDebateController | ❌ |

17 个控制器中仅 6 个有测试（35%），且前端仅 5 个测试文件覆盖 32 个组件（16%）。

**建议**：优先补齐 `userController`、`adminController`、`securityController` 的测试——这三者涉及权限和数据安全。

---

### 9. playwright 误放在 dependencies 中

**现状**：`frontend/package.json` 中 `playwright` 在 `dependencies` 而非 `devDependencies`。

**影响**：生产构建包含约 200MB 的浏览器二进制文件。

**修复**：
```bash
cd frontend
npm uninstall playwright
npm install -D playwright
```

---

### 10. 缺少 API 文档

**现状**：验收报告声称 API 文档「✅ 已完成」，但项目中没有 Swagger/OpenAPI 文件，也没有 API 列表页面。唯一可参考的是 `SECURITY_TEST_GUIDE.md` 中的 curl 示例。

**建议**：为后端添加 `swagger-jsdoc` + `swagger-ui-express`，或至少写一份 `API_REFERENCE.md` 列出所有端点。

---

### 11. console.log 作为唯一日志系统

**现状**：后端全部使用 `console.log`/`console.warn`/`console.error`。`LOG_PATH` 在 `.env.production` 中定义了但无任何读取代码。

**建议**：引入 `pino` 或 `winston`，按级别输出到 stdout（容器化环境标准做法），按需格式化 JSON 供日志聚合系统消费。

---

### 12. 数据库迁移无版本管理

**现状**：32 个 SQL 文件按编号排列（`00_init_production.sql` ~ `30_debate_topic_alter.sql`），Docker 启动时按文件名排序执行。没有迁移工具追踪哪些已执行、哪些未执行。

**风险**：生产环境增量更新时容易遗漏；多人协作时编号冲突。

**建议**：引入 `db-migrate` 或 `knex migrate`，或至少写一个 `migrations` 表记录已执行脚本。

---

## 🟡 P2 — 锦上添花（不影响上线，提升长期质量）

### 13. Nginx 缺少安全头

Nginx 层上加一层保护：
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 14. 健康检查过于简陋

当前 `/health` 只返回 `{ status: 'ok' }`——不检查数据库连通性。建议增加 `/health/deep` 做数据库 ping。

### 15. 缺少 E2E 测试

项目依赖中有 `playwright`，但没有 E2E 测试文件。建议为核心流程（注册→逻辑测试→创建辩论→发言→投票→查看结果）编写 1-3 个 E2E 用例。

### 16. Docker 镜像未做多阶段构建优化

前端 Dockerfile 应使用多阶段构建，将 `node:20` 用于构建，`nginx:alpine` 用于运行，减小最终镜像体积。

### 17. `docs/superpowers/` 目录存在但为空

`plans/` 和 `specs/` 子目录为空，要么填充要么清理。

### 18. 前端组件目录缺少索引

31 个组件平铺在 `components/` 下，建议按功能分子目录：
```
components/
├── debate/     # SpeechInput, SpeechList, VotePanel, DebateHeader...
├── admin/      # AdminUserManagement, AdminContentReview...
├── user/       # UserProfileSettings, UserLevelCard, UserStats...
└── common/     # LoadingSpinner, ErrorBoundary, SearchBox...
```

### 19. `环境配置与启动指南.md` 为中文文件名

Windows 下无问题，但 Linux CI 中可能因编码问题读取失败。建议改为英文文件名或确认编码为 UTF-8。

---

## 📊 量化总结

| 类别 | 发现数 | P0 | P1 | P2 |
|------|--------|----|----|-----|
| 安全 | 6 | 4 | 1 | 1 |
| 测试 | 3 | - | 3 | - |
| 架构 | 3 | - | 2 | 1 |
| DevOps | 3 | - | 1 | 2 |
| 代码质量 | 4 | - | 1 | 3 |
| **合计** | **19** | **4** | **8** | **7** |

---

## 🎯 建议执行顺序

```
第 1 天：P0-1 速率限制 + P0-2 helmet + P0-3 CORS 限制
第 2 天：P0-4 密码外部化 + P0-5 Redis 集成
第 3-5 天：P1-6 Pinia Store + P1-7 CI 测试 + P1-9 playwright 修复
第 2 周：P1-8 测试补全 + P1-10 API 文档
第 3 周+：P1-11 日志 + P1-12 迁移工具 + P2 各项
```

---

*本报告基于 2026-05-08 代码快照生成。建议修复后重新审查。*
