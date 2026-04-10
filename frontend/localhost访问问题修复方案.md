# localhost访问问题排查与修复方案

## 问题诊断

### 原因分析
1. ❌ **端口配置错误**：vite.config.js中端口设置为3000，但默认应为5173
2. ❌ **访问地址错误**：直接访问localhost（默认80端口）而非localhost:5173
3. ✅ 端口未被占用
4. ✅ 依赖已正确安装
5. ✅ 服务进程正常运行

## 已修复内容

### 1. 修改vite配置 (frontend/vite.config.js)
```javascript
server: {
  port: 5173,        // 修改为标准端口
  host: '0.0.0.0',   // 允许外部访问
  open: true,        // 自动打开浏览器
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

## 访问方式

### ✅ 正确的访问地址
- **本地访问**: http://localhost:5173
- **网络访问**: http://172.31.128.1:5173 或 http://10.180.65.3:5173

### ❌ 错误的访问方式
- ~~http://localhost~~ (默认80端口，未运行服务)
- ~~http://localhost:3000~~ (旧配置端口)
- ~~http://localhost:80~~ (HTTP默认端口)

## 服务状态确认

当前服务已成功运行：
```
➜  Local:   http://localhost:5173/
➜  Network: http://172.31.128.1:5173/
➜  Network: http://10.180.65.3:5173/
```

## 常见问题排查命令

### 1. 检查端口占用
```bash
netstat -ano | findstr :5173
```

### 2. 查看进程
```bash
tasklist | findstr node
```

### 3. 强制结束进程（如需要）
```bash
taskkill /F /PID <进程ID>
```

### 4. 重新安装依赖（如需要）
```bash
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

### 5. 清除缓存重启
```bash
cd frontend
rmdir /s /q node_modules\.vite
npm run dev
```

## 防火墙/代理问题

如果仍无法访问，检查：

### Windows防火墙
```bash
# 查看防火墙状态
netsh advfirewall show allprofiles

# 临时关闭防火墙测试（管理员权限）
netsh advfirewall set allprofiles state off
```

### 代理设置
检查系统代理或浏览器代理设置，确保localhost不走代理：
- Chrome: 设置 → 系统 → 打开代理设置
- 添加例外: localhost;127.0.0.1;*.local

## 完整启动流程

```bash
# 1. 进入前端目录
cd "c:/Users/34270/Desktop/'逆熵'/frontend"

# 2. 确保依赖已安装
npm install

# 3. 启动开发服务器
npm run dev

# 4. 浏览器访问
# http://localhost:5173
```

## 验证功能

访问 http://localhost:5173 后应该看到：
- ✅ 逆熵平台首页
- ✅ 登录表单
- ✅ 注册按钮
- ✅ 浏览辩论按钮

所有交互功能已通过mock数据实现，无需后端服务即可完整测试。
