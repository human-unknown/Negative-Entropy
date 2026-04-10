# 账号安全功能测试指南

## 重要提示
后端代码已更新，需要重启后端服务器才能生效。

### 重启后端服务器
1. 在 Terminal 1 中按 `Ctrl+C` 停止当前服务
2. 重新运行：`cd backend && npm start`

或者使用开发模式（自动重启）：
```bash
cd backend && npm run dev
```

## 功能说明

### 1. 找回密码功能
- 路由：`/reset-password`
- 支持手机号和邮箱找回
- 验证码有效期：10分钟
- 密码最少6个字符

### 2. 双重认证功能
- 路由：`/profile`（个人中心 -> 账号安全）
- 开启时需要验证码确认
- 关闭时直接生效
- 验证码有效期：5分钟

## 测试账号（模拟数据）
- 手机号：`13800138000`
- 邮箱：`test@example.com`
- 用户ID：`1`

## API 测试

### 测试找回密码流程

#### 1. 发送验证码
```bash
curl -X POST http://localhost:3000/api/security/send-reset-code \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"13800138000\"}"
```

预期响应：
```json
{"code":200,"message":"验证码已发送","data":{"message":"验证码已发送"}}
```

查看后端控制台获取验证码（6位数字）

#### 2. 重置密码
```bash
curl -X POST http://localhost:3000/api/security/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"13800138000\",\"code\":\"验证码\",\"newPassword\":\"123456\"}"
```

预期响应：
```json
{"code":200,"message":"密码重置成功","data":{"message":"密码重置成功"}}
```

### 测试双重认证功能

#### 1. 开启双重认证（需先发送验证码）
```bash
# 发送验证码
curl -X POST http://localhost:3000/api/security/2fa/send-code \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"1\"}"

# 验证并开启
curl -X POST http://localhost:3000/api/security/2fa/verify \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"1\",\"code\":\"验证码\"}"

# 更新设置
curl -X POST http://localhost:3000/api/security/2fa/enable \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"1\",\"enable\":true}"
```

#### 2. 关闭双重认证
```bash
curl -X POST http://localhost:3000/api/security/2fa/enable \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"1\",\"enable\":false}"
```

## 前端测试

### 1. 测试找回密码页面
1. 访问：`http://localhost:5173/reset-password`
2. 选择账号类型（手机号/邮箱）
3. 输入测试账号：`13800138000`
4. 点击"获取验证码"
5. 查看后端控制台获取验证码
6. 输入验证码和新密码
7. 点击"重置密码"
8. 成功后自动跳转到登录页

### 2. 测试账号安全设置
1. 访问：`http://localhost:5173/profile`
2. 查看"账号安全"标签页
3. 点击"双重认证"开关
4. 输入验证码（查看后端控制台）
5. 确认开启/关闭

## 已知问题和修复

### ✅ 已修复
1. 数据库连接失败 - 添加模拟数据支持
2. 路由未配置 - 已添加 `/reset-password` 和 `/profile` 路由
3. API模块缺失 - 已创建 `frontend/src/api/security.js`
4. 验证码倒计时 - 已实现60秒倒计时
5. 密码验证 - 已添加两次密码一致性验证

### 功能特性
- ✅ 手机号/邮箱格式验证
- ✅ 验证码倒计时（60秒）
- ✅ 密码强度验证（最少6字符）
- ✅ 双重认证开关
- ✅ 验证码弹窗
- ✅ 错误提示
- ✅ 成功跳转

## 注意事项
1. 验证码在后端控制台输出，生产环境需接入短信/邮件服务
2. 当前使用内存存储验证码，生产环境建议使用Redis
3. 模拟数据仅用于测试，实际使用需连接数据库
