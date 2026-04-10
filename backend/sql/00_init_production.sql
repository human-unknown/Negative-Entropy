-- 生产环境数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS negentropy_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE negentropy_production;

-- 创建用户表
CREATE TABLE IF NOT EXISTS user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  status ENUM('active', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入初始管理员账号（密码：Admin@123456）
INSERT INTO user (username, password, role, level) VALUES 
('admin', '$2b$10$YourHashedPasswordHere', 'admin', 10);

-- 创建索引
CREATE INDEX idx_username ON user(username);
CREATE INDEX idx_role ON user(role);
