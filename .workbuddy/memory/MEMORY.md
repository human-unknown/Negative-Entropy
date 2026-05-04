---
summary: "项目长时记忆"
---

# MEMORY.md

## 项目: 逆熵 (Negative-Entropy) — 理性辩论平台

### 技术栈
- **前端**: Vue 3 (Composition API, `<script setup>`) + Vite 5 + Element Plus + Pinia + Axios
- **后端**: Express.js 4 + MySQL 8.0 (mysql2, 原生 SQL) + JWT + bcryptjs + express-validator
- **语言**: 全栈 JavaScript (ES Modules)
- **测试**: 前端 Vitest + 后端 node:test，4 个测试文件 16 个测试用例全部通过
- **部署**: Docker Compose (MySQL + Backend + Frontend Nginx)

### 代码审查体系 (2026-05-03 创建)
- **审查标准文档**: `CODE_REVIEW_STANDARDS.md` (v1.1)
- **ESLint 配置**: `frontend/.eslintrc.cjs` (Vue 3 + JS), `backend/.eslintrc.cjs` (Node.js)
- **Prettier 配置**: 根目录 `.prettierrc`
- **EditorConfig**: 根目录 `.editorconfig`
- **Git Hooks**: husky (`pre-commit → lint-staged`, `commit-msg → commitlint`)，已激活
- **Commit 规范**: Conventional Commits (`commitlint.config.cjs`)
- **PR 模板**: `.github/PULL_REQUEST_TEMPLATE.md`
- **根目录 package.json**: 整合 lint/format 脚本 + lint-staged 配置
- **CI 工作流**: `.github/workflows/ci.yml` — PR 时自动 lint + build
- **首次 PR 审查**: `PR_REVIEW_001_SpeechInput.md` — SpeechInput.vue 示范审查
- **复盘记录**: `RETROSPECTIVE_001.md` — 改进 3 项标准、修复 2 个 Major 问题

### 深度审查 & 修复 (2026-05-03)
- **严重**: 修复 debateController/ruleDebateController 中 30+ 条路径的连接重复释放 bug
- **高** 修复 userController 2 处缺少错误日志
- **中** adminController 魔法数字 level===4 → USER_LEVEL.ADMIN
- **中** reviewController 变量命名统一 (db→pool, connection→conn)
- **中** 投票权重魔法数字 → VOTE_WEIGHT_MAP 映射表
- **中** checkController 有偏随机 → Fisher-Yates 洗牌
- **中** database.js: 移除 mysql2 v3 不支持的 acquireTimeout/timeout，连接测试异步化（无 MySQL 也能启动）
- 清理临时文件，ESLint 前后端全部 0 Error 0 Warning

### 测试框架搭建 + 全面优化 (2026-05-03 13:34)
- **方向4**: 前端 Vitest + @vue/test-utils + jsdom，后端 node:test — 共 4 文件 16 测试用例 ✅
- **方向3**: Register.vue alert → ElMessage；Home.vue isLoggedIn 响应式修复
- **方向1**: 辩论流程端到端 Mock 测试覆盖（创建→列表→详情→发言→投票）
- **方向2**: AdminRuleManagement 组件连接 Mock API；Mock 数据补充规则/规则辩论接口

### 项目缺口分析与 P0 修复 (2026-05-03 13:59)
- **项目审计**: 编写 `PROJECT_GAP_ANALYSIS.md`（5 类 20+ 问题）
- **P0 修复**: 新增登录接口、挂载 review/report/audit 路由、创建 auditRoutes（precheck）
- **字段名修复**: 6 处 `username` → `name`，2 处 `debate_id` → `topic_id`
- **缺失 API 补充**: `getTopicResult`（辩论结果查询）
- **前端路径对齐**: `/debates/` → `/debate/`
- **Admin TODO 清零**: 6 个组件 10 个 TODO 占位全部替换为真实 API 调用

### 后续推进 (2026-05-04)
- **登录接口**: authController + authRoutes 完整实现 ✅
- **通知系统 API**: notificationController + routes（4 个端点）✅
- **经验/等级查询**: getExpHistory + getLevelInfo ✅
- **全站 alert→ElMessage**: 9 文件 23 处替换 ✅ (后续补扫 useContentProtection.js 5处，已清零)
- **测试加固**: 新增 11 个测试 → 总共 35 个全部通过 ✅
- **规则辩论补全**: 3 个新 API（详情/发言/结果）+ 规则管理 CRUD + AdminRuleManagement 参数修复 ✅
- **技术决策指南**: 撰写 `docs/技术决策指南.md` v1.0（原则手册，非代码规范）
- **ruleController 数据库化**: 内存存储 → `platform_rule` 表（SQL: `26_platform_rule.sql`），重启不丢数据
- **测试再次加固**: 后端新增 10 个测试（ruleController 5 + debateController 5），后端测试 24/全栈 44 全部通过 ✅
- **全栈 Lint**: 前后端 0 Error 0 Warning ✅
