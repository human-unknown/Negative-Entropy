-- 37_ai_audit_config.sql
-- AI审核配置表（管理后台可调节阈值）

CREATE TABLE IF NOT EXISTS ai_audit_config (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key   VARCHAR(50) NOT NULL UNIQUE,
  config_value VARCHAR(500) NOT NULL,
  description  VARCHAR(200) NULL COMMENT '配置说明',
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认配置
INSERT IGNORE INTO ai_audit_config (config_key, config_value, description) VALUES
('audit_enabled',              'true',  '是否启用AI审核'),
('confidence_threshold_reject', '0.85', '拒绝阈值（confidence >= 此值直接拒绝）'),
('confidence_threshold_manual', '0.60', '人工复核阈值（confidence 在此值到拒绝阈值之间时人工复核）'),
('max_content_length_topic',   '200',   '话题最大长度'),
('max_content_length_speech',  '1000',  '发言最大长度'),
('max_content_length_comment', '2000',  '评论最大长度'),
('max_content_length_post',    '10000', '帖子最大长度'),
('enable_audit_log',           'true',  '是否记录AI审核日志');
