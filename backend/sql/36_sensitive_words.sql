-- 36_sensitive_words.sql
-- 敏感词库表（管理后台可配置）

CREATE TABLE IF NOT EXISTS sensitive_words (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word       VARCHAR(100) NOT NULL COMMENT '敏感词',
  level      ENUM('blocked', 'suspicious') NOT NULL DEFAULT 'blocked' COMMENT 'blocked=直接拒绝, suspicious=疑似交AI判断',
  category   VARCHAR(50) NULL COMMENT '类别：人身攻击/色情/广告/政治/灌水/其他',
  is_active  TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
