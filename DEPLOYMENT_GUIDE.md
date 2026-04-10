# 逆熵辩论平台 - 生产环境部署文档

## 一、环境要求

### 硬件配置
- CPU：2 核及以上
- 内存：4GB 及以上
- 磁盘：20GB 及以上
- 网络：公网 IP + 域名（可选）

### 软件环境
- 操作系统：Ubuntu 20.04+ / CentOS 7+
- Docker：20.10+
- Docker Compose：1.29+
- Git：2.0+

## 二、服务器初始配置

### 1. 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. 创建应用目录

```bash
mkdir -p /app/negentropy
cd /app/negentropy
```

### 3. 克隆项目代码

```bash
git clone <your-repo-url> .
# 或上传项目文件到服务器
```

## 三、配置文件修改

### 1. 修改后端生产配置

编辑 [`backend/.env.production`](backend/.env.production:1)：

```bash
# 数据库配置（必改）
DB_HOST=mysql
DB_USER=negentropy_prod
DB_PASSWORD=your_strong_password_here_123456
DB_NAME=negentropy_production

# JWT 密钥（必改，使用强随机字符串）
JWT_SECRET=your_random_64_char_jwt_secret_string_here_change_me_now

# 会话密钥（必改）
SESSION_SECRET=your_random_64_char_session_secret_string_here_change_me

# 跨域配置（改为实际域名）
CORS_ORIGIN=https://your-domain.com
```

### 2. 修改前端生产配置

编辑 [`frontend/.env.production`](frontend/.env.production:1)：

```bash
# 接口地址（改为实际域名）
VITE_API_BASE_URL=https://your-domain.com/api
```

### 3. 修改 Docker Compose 配置

编辑 [`docker-compose.yml`](docker-compose.yml:1)：

```yaml
# 修改 MySQL 密码（第 8-11 行）
MYSQL_ROOT_PASSWORD: your_root_password_here
MYSQL_PASSWORD: your_strong_password_here_123456

# 修改后端环境变量（第 26-27 行）
DB_PASSWORD: your_strong_password_here_123456
JWT_SECRET: your_random_64_char_jwt_secret
```

### 4. 生成管理员密码哈希

```bash
# 在本地或服务器上执行
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourAdminPassword123!', 10, (err, hash) => console.log(hash));"
```

将生成的哈希值替换到 [`backend/sql/00_init_production.sql`](backend/sql/00_init_production.sql:1) 第 18 行。

## 四、部署命令

### 1. 构建并启动所有服务

```bash
cd /app/negentropy
docker-compose up -d
```

### 2. 查看服务状态

```bash
docker-compose ps
```

应该看到 3 个服务都是 `Up` 状态：
- negentropy-mysql
- negentropy-backend
- negentropy-frontend

### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 五、启动顺序

Docker Compose 会自动按依赖顺序启动：

1. **MySQL** 先启动（约 30 秒）
2. **Backend** 等待 MySQL 就绪后启动（约 10 秒）
3. **Frontend** 等待 Backend 就绪后启动（约 5 秒）

**首次启动需等待 1-2 分钟**，MySQL 会自动执行所有 SQL 初始化脚本。

## 六、数据库初始化验证

### 1. 进入 MySQL 容器

```bash
docker exec -it negentropy-mysql mysql -u negentropy_prod -p
# 输入密码：your_strong_password_here_123456
```

### 2. 验证数据库和表

```sql
USE negentropy_production;
SHOW TABLES;
SELECT * FROM user WHERE role='admin';
EXIT;
```

应该看到 25+ 张表和 1 个管理员账号。

## 七、测试账号

### 管理员账号
- 用户名：`admin`
- 密码：`YourAdminPassword123!`（你在第三步设置的密码）

### 测试用户账号
需要通过前端注册页面自行创建。

## 八、验证方法

### 1. 健康检查

```bash
# 检查后端 API
curl http://localhost:3000/api/health

# 检查前端页面
curl http://localhost:80
```

### 2. 执行冒烟测试

```bash
# 修改测试脚本端口（如果需要）
cd /app/negentropy/backend
bash scripts/smoke_test.sh
```

应该看到 8 项测试全部通过 ✓。

### 3. 浏览器访问测试

访问 `http://your-server-ip` 或 `http://your-domain.com`：

- [ ] 首页正常加载
- [ ] 注册新用户成功
- [ ] 登录成功
- [ ] 发布辩论话题成功
- [ ] 参与辩论成功
- [ ] 发表观点成功
- [ ] 投票成功
- [ ] 管理员登录成功
- [ ] 后台管理页面正常

## 九、配置 HTTPS（生产环境必须）

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 修改 Nginx 配置

将 [`nginx.production.conf`](nginx.production.conf:1) 复制到容器并重启：

```bash
docker cp nginx.production.conf negentropy-frontend:/etc/nginx/conf.d/default.conf
docker-compose restart frontend
```

## 十、配置定时任务

### 1. 设置数据库备份

```bash
# 编辑 crontab
crontab -e

# 添加以下内容
0 2 * * * docker exec negentropy-mysql /app/backend/scripts/backup_production.sh
```

### 2. 设置健康检查

```bash
# 添加到 crontab
*/5 * * * * docker exec negentropy-backend curl -f http://localhost:3000/api/health || docker-compose restart backend
```

## 十一、日志管理

### 1. 配置日志切割

```bash
# 复制 logrotate 配置
cp backend/scripts/logrotate.conf /etc/logrotate.d/negentropy
```

### 2. 查看日志

```bash
# 应用日志
docker-compose logs backend | tail -100

# 错误日志
docker-compose logs backend | grep ERROR

# 访问日志
docker-compose logs frontend | tail -100
```

## 十二、常见问题

### 1. 服务启动失败

```bash
# 查看详细错误
docker-compose logs backend

# 重启服务
docker-compose restart backend
```

### 2. 数据库连接失败

```bash
# 检查 MySQL 是否就绪
docker exec negentropy-mysql mysqladmin ping -h localhost

# 检查网络连接
docker network inspect negentropy_negentropy-network
```

### 3. 端口被占用

```bash
# 查看端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :3000

# 修改 docker-compose.yml 中的端口映射
```

### 4. 前端无法访问后端

- 检查 CORS 配置
- 检查 Nginx 代理配置
- 检查防火墙规则

## 十三、停止和重启

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（危险！会删除数据库）
docker-compose down -v

# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend
```

## 十四、备份和恢复

### 备份

```bash
# 手动备份数据库
docker exec negentropy-mysql mysqldump -u negentropy_prod -p negentropy_production | gzip > backup_$(date +%Y%m%d).sql.gz

# 备份整个项目
tar -czf negentropy_backup_$(date +%Y%m%d).tar.gz /app/negentropy
```

### 恢复

```bash
# 恢复数据库
gunzip < backup_20260410.sql.gz | docker exec -i negentropy-mysql mysql -u negentropy_prod -p negentropy_production
```

## 十五、监控和维护

### 1. 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
du -sh /var/lib/docker
```

### 2. 定期维护

- 每周检查日志文件大小
- 每月检查备份文件完整性
- 每季度更新 Docker 镜像
- 定期检查安全更新

## 十六、安全加固

1. **修改所有默认密码**
2. **配置防火墙**：只开放 80、443 端口
3. **启用 HTTPS**：强制 HTTP 跳转 HTTPS
4. **定期更新**：系统和 Docker 镜像
5. **备份策略**：每天自动备份，异地存储
6. **监控告警**：配置服务异常告警

---

## 快速部署命令汇总

```bash
# 1. 安装环境
curl -fsSL https://get.docker.com | sh

# 2. 克隆代码
cd /app && git clone <repo> negentropy && cd negentropy

# 3. 修改配置（见第三节）
vim backend/.env.production
vim frontend/.env.production
vim docker-compose.yml

# 4. 启动服务
docker-compose up -d

# 5. 查看状态
docker-compose ps
docker-compose logs -f

# 6. 验证部署
bash backend/scripts/smoke_test.sh
```

部署完成！访问 `http://your-server-ip` 开始使用。
