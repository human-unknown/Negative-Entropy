-- 迁移追踪表 — 记录已执行的 SQL 脚本，支持增量迁移
-- 此文件必须在所有其他迁移之前执行

CREATE TABLE IF NOT EXISTS `migration_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(128) NOT NULL COMMENT 'SQL 文件名',
  `checksum` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '文件内容 SHA256 校验和',
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `success` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否执行成功',
  `error_message` TEXT NULL COMMENT '失败时的错误信息',
  UNIQUE KEY `uk_filename` (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库迁移日志';
