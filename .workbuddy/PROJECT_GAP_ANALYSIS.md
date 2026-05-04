# 逆熵（Negative-Entropy）项目缺口分析与实现计划

> 分析日期：2026-05-03 | 最后更新：2026-05-04
> 分析方法：全栈代码审计（后端路由/控制器 + 前端路由/组件/API层）

---

## 一、关键缺口汇总 — 完成状态

### ✅ P0 - 阻塞性问题（已全部修复）

| # | 问题 | 状态 |
|---|------|------|
| 1 | 后端无登录接口 | ✅ 已新增 login 控制器 + 路由 |
| 2 | reviewRoutes 和 reportRoutes 未挂载 | ✅ 已挂载到 app.js |
| 3 | Admin 管理组件使用 Mock API 占位 | ✅ 6 个组件 10 个 TODO 已替换为真实 API |

### ✅ P1 - 前后端不匹配（已全部修复）

| # | 问题 | 状态 |
|---|------|------|
| 4 | getDebateResult 无后端路由 | ✅ 已新增 getTopicResult |
| 5 | preCheckContent 无后端路由 | ✅ 已创建 auditRoutes |
| 6 | getDebateCategories 路径不匹配 | ✅ /debates/ → /debate/ |
| 7 | 审核队列 API 不可用 | ✅ reviewRoutes 已挂载 |
| 8-9 | username / debate_id 字段名错误 | ✅ 6 处替换完成 |

### ✅ P2 - 功能完整度（已解决全部可实现项）

| # | 问题 | 状态 |
|---|------|------|
| 10 | 后端测试覆盖率低 | ✅ 新增 authController 7 个测试，后端共 15 个 |
| 11 | 前端测试覆盖率低 | ✅ 新增 Home.vue 4 个组件测试，前端共 20 个 |
| — | 通知系统 API 缺失 | ✅ 4 个端点全部实现 |
| — | 经验/等级查询 API 缺失 | ✅ getExpHistory + getLevelInfo |
| — | 规则辩论 API 不完整 | ✅ 补充详情/发言/结果/规则管理 |
| — | Admin 统计接口缺失 | ✅ /admin/stats 已实现 |
| — | 规则辩论公共页面缺失 | ✅ 列表/详情/历史 3 个页面 + 路由 |
| 12 | 验证码仅控制台输出 | ⏳ 需对接短信/邮件 SDK |
| 13 | 验证码内存存储 | ⏳ 需迁移 Redis |
| 14 | AI 审核模拟实现 | ⏳ 可对接真实 AI API |
| 15 | HTTPS 未配置 | ⏳ 需配置证书 |

### ✅ P3 - 体验优化（已解决全部可实现项）

| # | 问题 | 状态 |
|---|------|------|
| 16 | 无 E2E 测试 | ⏳ |
| 17 | 无 API 文档 | ⏳ |
| 18 | alert/confirm 未替换 | ✅ 9 文件 23 处全部替换为 ElMessage |
| 19 | 移动端适配 | ⏳ 微调 |
| 20 | CDN 加速 | ⏳ |

---

## 二、后端 API 完整映射（最终状态）

```
  POST /api/auth/register                  ✅
  POST /api/auth/login                     ✅
  POST /api/user/validate-name             ✅
  POST /api/user/add-exp                   ✅
  POST /api/user/phone                     ✅
  POST /api/user/email                     ✅
  GET  /api/user/debates                   ✅
  GET  /api/user/exp                       ✅ 新增
  GET  /api/user/level                     ✅ 新增
  GET  /api/check/logic-test               ✅
  POST /api/check/logic-test               ✅
  GET  /api/check/debate-topic             ✅
  POST /api/check/debate                   ✅
  GET  /api/check/result/:userId           ✅
  POST /api/security/send-reset-code       ✅
  POST /api/security/reset-password        ✅
  POST /api/security/2fa/enable            ✅
  POST /api/security/2fa/send-code         ✅
  POST /api/security/2fa/verify            ✅
  GET  /api/debate/                        ✅
  GET  /api/debate/categories              ✅
  GET  /api/debate/search                  ✅
  GET  /api/debate/topics                  ✅
  GET  /api/debate/topics/:id              ✅
  GET  /api/debate/topics/:id/speeches     ✅
  GET  /api/debate/topics/:id/result       ✅ 新增
  POST /api/debate/topics                  ✅
  PUT  /api/debate/topics/:id/audit        ✅
  POST /api/debate/topics/:id/join         ✅
  POST /api/debate/topics/:id/speeches     ✅
  POST /api/debate/topics/:id/audience-speeches ✅
  PUT  /api/debate/topics/:id/close        ✅
  POST /api/debate/topics/:id/vote         ✅
  POST /api/debate/topics/:id/settle       ✅
  PUT  /api/debate/speeches/:id/audit      ✅
  GET  /api/rule-debate/                   ✅
  GET  /api/rule-debate/:id                ✅ 新增
  GET  /api/rule-debate/:id/speeches       ✅ 新增
  GET  /api/rule-debate/:id/result         ✅ 新增
  POST /api/rule-debate/                   ✅
  POST /api/rule-debate/:id/join           ✅
  POST /api/rule-debate/:id/speeches       ✅
  POST /api/rule-debate/:id/vote           ✅
  POST /api/rule-debate/:id/settle         ✅
  POST /api/admin/punish                   ✅
  POST /api/admin/restore                  ✅
  GET  /api/admin/users/search             ✅
  GET  /api/admin/users/:id                ✅
  GET  /api/admin/topics/pending           ✅
  POST /api/admin/topics/review            ✅
  GET  /api/admin/ai/errors                ✅
  POST /api/admin/ai/optimize              ✅
  GET  /api/admin/rules                    ✅ 新增
  POST /api/admin/rules                    ✅ 新增
  POST /api/admin/rule-debates             ✅ 新增
  GET  /api/admin/stats                    ✅ 新增
  POST /api/report/                        ✅
  GET  /api/report/pending                 ✅
  PUT  /api/report/:id/review              ✅
  POST /api/review/queue                   ✅
  GET  /api/review/:id                     ✅
  POST /api/review/:id/approve             ✅
  POST /api/review/:id/reject              ✅
  POST /api/review/batch                   ✅
  GET  /api/notification/                  ✅ 新增
  GET  /api/notification/unread-count      ✅ 新增
  PUT  /api/notification/:id/read          ✅ 新增
  PUT  /api/notification/read-all          ✅ 新增
  POST /api/feedback/                      ✅
  POST /api/appeal/                        ✅
  GET  /api/appeal/pending                 ✅
  PUT  /api/appeal/:id/review              ✅
  POST /api/audit/precheck                 ✅ 新增
  POST /api/system/shutdown                ✅
```

## 三、剩余待办（非阻塞）

- 短信/邮件服务集成（securityController 的 console.log 替换）
- Redis 缓存验证码（替代内存 Map）
- AI 审核对接真实 API
- HTTPS 配置 + Nginx SSL
- E2E 测试
- 独立 API 文档（Swagger/OpenAPI）
- 移动端响应式微调
- CDN 加速
