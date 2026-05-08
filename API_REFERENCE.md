# 逆熵辩论平台 — API 参考

> 基路径：`/api` | 认证：Bearer Token (JWT) | 内容类型：`application/json`

---

## 认证 `/api/auth`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/auth/login` | 用户登录 | 否 |
| POST | `/auth/register` | 用户注册 | 否 |

---

## 用户 `/api/user`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/user/validate-name` | 校验用户名真实性 | 否 |
| POST | `/user/add-exp` | 增加经验值 | 是 |
| POST | `/user/phone` | 绑定/修改手机号 | 是 |
| POST | `/user/email` | 绑定/修改邮箱 | 是 |
| GET | `/user/debates` | 查询用户参与辩论列表 | 是 |
| GET | `/user/exp` | 经验获取历史 | 是 |
| GET | `/user/level` | 等级信息 | 是 |

---

## 考核 `/api/check`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/check/logic-test` | 获取逻辑测试题 | 否 |
| POST | `/check/logic-test` | 提交逻辑测试 | 否 |
| GET | `/check/debate-topic` | 获取辩论考核题 | 否 |
| POST | `/check/debate` | 提交辩论考核 | 否 |
| GET | `/check/result/:userId` | 查询考核结果 | 否 |

---

## 安全 `/api/security`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/security/send-reset-code` | 发送重置密码验证码 | 否 |
| POST | `/security/reset-password` | 重置密码 | 否 |
| POST | `/security/2fa/enable` | 开启/关闭双重认证 | 是 |
| POST | `/security/2fa/send-code` | 发送双重认证码 | 是 |
| POST | `/security/2fa/verify` | 验证双重认证码 | 是 |

---

## 辩论 `/api/debate`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/debate/categories` | 辩论分类列表 | 否 |
| GET | `/debate/search` | 搜索辩论 | 否 |
| GET | `/debate/topics` | 辩论话题列表 | 否 |
| GET | `/debate/topics/:topicId` | 辩论话题详情 | 否 |
| GET | `/debate/topics/:topicId/speeches` | 辩论发言列表 | 否 |
| POST | `/debate/topics` | 创建辩论话题 | 是 |
| PUT | `/debate/topics/:topicId/audit` | 审核话题 | 管理员 |
| POST | `/debate/topics/:topicId/join` | 加入辩论 | 是 |
| POST | `/debate/topics/:topicId/speeches` | 发表发言 | 是 |
| POST | `/debate/topics/:topicId/audience-speeches` | 观众发言 | 是 |
| PUT | `/debate/speeches/:speechId/audit` | 审核发言 | 管理员 |
| PUT | `/debate/topics/:topicId/close` | 关闭辩论 | 管理员 |
| POST | `/debate/topics/:topicId/vote` | 投票 | 是 |
| POST | `/debate/topics/:topicId/settle` | 结算辩论 | 管理员 |
| GET | `/debate/topics/:topicId/result` | 辩论结果 | 否 |
| GET | `/debate/topics/:topicId/current-round` | 当前轮次 | 否 |
| GET | `/debate/topics/:topicId/rounds` | 所有轮次 | 否 |
| POST | `/debate/topics/:topicId/rounds/:roundId/submit` | 提交轮次发言 | 是 |
| POST | `/debate/topics/:topicId/rounds/:roundId/skip` | 跳过轮次 | 是 |

---

## 辩论模板 `/api/debate/templates`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/debate/templates` | 模板列表 | 否 |
| GET | `/debate/templates/:id` | 模板详情 | 否 |
| POST | `/debate/templates` | 创建模板 | 管理员 |

---

## 辩论评分 `/api/debate`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/debate/topics/:topicId/score` | 提交评分 | 是 |
| GET | `/debate/topics/:topicId/score-result` | 评分结果 | 否 |

---

## 规则辩论 `/api/rule-debate`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/rule-debate` | 规则辩论列表 | 否 |
| GET | `/rule-debate/:debateId` | 规则辩论详情 | 否 |
| GET | `/rule-debate/:debateId/speeches` | 规则辩论发言 | 否 |
| GET | `/rule-debate/:debateId/result` | 规则辩论结果 | 否 |
| POST | `/rule-debate` | 发起规则辩论 | 是 |
| POST | `/rule-debate/:debateId/join` | 加入规则辩论 | 是 |
| POST | `/rule-debate/:debateId/speeches` | 规则辩论发言 | 是 |
| POST | `/rule-debate/:debateId/vote` | 规则辩论投票 | 是 |
| POST | `/rule-debate/:debateId/settle` | 结算规则辩论 | 管理员 |

---

## 审核 `/api/review`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/review/queue` | 审核队列 | 管理员 |
| GET | `/review/:id` | 审核项详情 | 管理员 |
| POST | `/review/:id/approve` | 审核通过 | 管理员 |
| POST | `/review/:id/reject` | 审核驳回 | 管理员 |
| POST | `/review/batch` | 批量审核 | 管理员 |

---

## 举报 `/api/report`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/report` | 提交举报 | 是 |
| GET | `/report/pending` | 待处理举报 | 管理员 |
| PUT | `/report/:reportId/review` | 处理举报 | 管理员 |

---

## 申诉 `/api/appeal`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/appeal` | 提交申诉 | 是 |
| GET | `/appeal/pending` | 待处理申诉 | 管理员 |
| PUT | `/appeal/:appealId/review` | 处理申诉 | 管理员 |

---

## 预检 `/api/audit`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/audit/precheck` | 内容预检（AI审核） | 是 |

---

## 通知 `/api/notification`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| GET | `/notification` | 通知列表 | 是 |
| GET | `/notification/unread-count` | 未读通知数 | 是 |
| PUT | `/notification/:id/read` | 标记已读 | 是 |
| PUT | `/notification/read-all` | 全部已读 | 是 |

---

## 反馈 `/api/feedback`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/feedback` | 提交反馈 | 否 |

---

## 管理后台 `/api/admin`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/admin/punish` | 处罚用户 | 管理员 |
| POST | `/admin/restore` | 恢复用户 | 管理员 |
| GET | `/admin/users/search` | 搜索用户 | 管理员 |
| GET | `/admin/users/:userId` | 用户详情 | 管理员 |
| GET | `/admin/topics/pending` | 待审核话题 | 管理员 |
| POST | `/admin/topics/review` | 审核话题 | 管理员 |
| GET | `/admin/ai/errors` | AI 审核错误 | 管理员 |
| POST | `/admin/ai/optimize` | AI 优化建议 | 管理员 |
| GET | `/admin/rules` | 规则列表 | 管理员 |
| POST | `/admin/rules` | 创建/更新规则 | 管理员 |
| POST | `/admin/rule-debates` | 发起规则辩论 | 管理员 |
| GET | `/admin/stats` | 数据统计 | 管理员 |

---

## 系统 `/api/system`

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | `/system/shutdown` | 优雅关闭服务 | 管理员 |

---

## 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 基础健康检查 |
| GET | `/health/deep` | 深度检查（含数据库连通性） |

---

## 通用响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 错误码

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
| 503 | 服务不可用 |
