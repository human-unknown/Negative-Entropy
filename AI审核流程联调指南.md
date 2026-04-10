# AI审核流程联调指南

## 流程概述

**完整流程**：内容预检 → 违规提醒 → 审核不通过 → 自动处罚

## 修复内容

### 1. AI审核中间件修复 ([`aiAudit.js`](backend/src/middlewares/aiAudit.js))

- 在审核不通过时自动调用 [`autoEscalateViolation()`](backend/src/utils/violation.js:45)
- 记录违规并根据历史自动升级处罚等级
- 返回响应中包含 `punished: true` 标记

### 2. 审核回调修复 ([`reviewController.js`](backend/src/controllers/reviewController.js))

- [`rejectReview()`](backend/src/controllers/reviewController.js:148) 函数在驳回时自动执行处罚
- 调用 [`autoEscalateViolation()`](backend/src/utils/violation.js:45) 进行违规升级
- 返回消息改为"复核驳回，已自动处罚"

### 3. 处罚执行函数修复

#### [`violation.js`](backend/src/utils/violation.js)
- 修复数据库字段映射：`type`、`violation_id`、`duration`、`expire_at`
- 时长单位改为分钟（与数据库表结构一致）

#### [`autoPunish.js`](backend/src/utils/autoPunish.js)
- 修复数据库字段映射
- 时长单位改为分钟

## 测试步骤

### 测试1：AI直接拒绝（包含违禁词）

**测试场景**：发布包含违禁词的话题

```bash
# 请求
POST /api/debate/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "测试话题包含广告",
  "description": "这是一个测试描述",
  "category": "科技"
}
```

**预期结果**：
1. AI审核检测到"广告"违禁词
2. 返回400错误，提示"内容审核未通过: 包含违禁词: 广告"
3. 自动记录违规到 `user_violation` 表
4. 自动创建处罚记录到 `user_punish` 表
5. 响应包含 `punished: true`

**验证SQL**：
```sql
-- 查看违规记录
SELECT * FROM user_violation WHERE user_id = <用户ID> ORDER BY created_at DESC LIMIT 1;

-- 查看处罚记录
SELECT * FROM user_punish WHERE user_id = <用户ID> ORDER BY created_at DESC LIMIT 1;
```

### 测试2：AI待人工复核 → 管理员驳回

**测试场景**：发布可疑内容，触发人工复核，然后管理员驳回

```bash
# 步骤1：发布可疑内容
POST /api/debate/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "测试话题联系方式",
  "description": "这是一个测试描述",
  "category": "科技"
}
```

**预期结果1**：
- 返回成功，但提示"话题已提交，AI检测到可能的问题，正在等待管理员复核"
- 话题 `audit_status = 0`（待审核）
- 添加到 `content_review_queue` 表

```bash
# 步骤2：管理员驳回
PUT /api/review/<复核ID>/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "内容不符合规范"
}
```

**预期结果2**：
1. 复核状态更新为 `rejected`
2. 话题 `audit_status = 2`（审核拒绝）
3. 自动记录违规
4. 自动执行处罚（根据历史升级）
5. 返回"复核驳回，已自动处罚"

### 测试3：违规升级机制

**测试场景**：同一用户多次违规，验证处罚升级

| 违规次数 | 处罚类型 | 说明 |
|---------|---------|------|
| 第1次 | 警告 (type=1) | 轻微违规 |
| 第2次 | 禁言1天 (type=2) | 中度违规 |
| 第3次 | 禁言7天 (type=4) | 严重违规 |
| 第4次+ | 封号 (type=6) | 严重违规 |

**验证SQL**：
```sql
-- 查看用户违规历史
SELECT 
  v.id,
  v.type as violation_type,
  v.content,
  v.created_at,
  p.type as punishment_type,
  p.duration,
  p.expire_at
FROM user_violation v
LEFT JOIN user_punish p ON v.id = p.violation_id
WHERE v.user_id = <用户ID>
ORDER BY v.created_at DESC;
```

## 关键代码位置

### AI审核中间件
- 文件：[`backend/src/middlewares/aiAudit.js`](backend/src/middlewares/aiAudit.js)
- 函数：[`aiAudit()`](backend/src/middlewares/aiAudit.js:144)、[`aiAuditBatch()`](backend/src/middlewares/aiAudit.js:195)

### 违规处理
- 文件：[`backend/src/utils/violation.js`](backend/src/utils/violation.js)
- 函数：[`autoEscalateViolation()`](backend/src/utils/violation.js:45)、[`recordViolation()`](backend/src/utils/violation.js:4)

### 审核回调
- 文件：[`backend/src/controllers/reviewController.js`](backend/src/controllers/reviewController.js)
- 函数：[`rejectReview()`](backend/src/controllers/reviewController.js:148)

## 数据库表结构

### user_violation（违规记录）
```sql
- id: 违规ID
- user_id: 用户ID
- type: 违规类型（1-4对应VIOLATION_LEVEL）
- content: 违规内容
- created_at: 创建时间
```

### user_punish（处罚记录）
```sql
- id: 处罚ID
- user_id: 用户ID
- violation_id: 关联的违规ID
- type: 处罚类型（1-6对应PUNISHMENT_TYPE）
- duration: 处罚时长（分钟）
- expire_at: 过期时间
- created_at: 创建时间
```

## 注意事项

1. **时长单位**：数据库中 `duration` 字段单位为分钟
2. **处罚类型映射**：
   - 1: 警告（无时长）
   - 2: 禁言1天（1440分钟）
   - 3: 禁言3天（4320分钟）
   - 4: 禁言7天（10080分钟）
   - 5: 永久禁言（52596000分钟）
   - 6: 封号（52596000分钟，同时更新user.status=0）

3. **违规升级逻辑**：
   - 0次历史违规 → 警告
   - 1-2次历史违规 → 禁言1天
   - 3-4次历史违规 → 禁言7天
   - 5次+历史违规 → 封号

4. **封号处理**：当处罚类型为6（封号）时，会同时更新 `user` 表的 `status` 字段为0

## 测试检查清单

- [ ] AI审核直接拒绝时记录违规
- [ ] AI审核直接拒绝时自动处罚
- [ ] 人工复核驳回时记录违规
- [ ] 人工复核驳回时自动处罚
- [ ] 违规记录正确写入数据库
- [ ] 处罚记录正确写入数据库
- [ ] 违规升级机制正常工作
- [ ] 封号时用户状态正确更新
- [ ] 前端收到正确的错误提示
