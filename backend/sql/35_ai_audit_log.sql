-- 35_ai_audit_log.sql
-- AI审核调用日志表（追踪每次LLM调用）

CREATE TABLE IF NOT EXISTS ai_audit_log (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_hash     VARCHAR(32) NOT NULL COMMENT '内容MD5（去重+隐私保护）',
  content_type     VARCHAR(20) NOT NULL COMMENT 'topic/speech/username/post_title/post_content/comment',
  verdict          VARCHAR(20) NOT NULL COMMENT 'pass/manual_review/reject',
  reason           VARCHAR(200) NULL COMMENT '审核原因',
  confidence       DECIMAL(3,2) NOT NULL DEFAULT 0 COMMENT '置信度 0.00-1.00',
  categories       JSON NULL COMMENT '违规类别列表',
  model            VARCHAR(50) NOT NULL COMMENT '使用的AI模型',
  elapsed_ms       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '调用耗时(ms)',
  prompt_tokens    INT UNSIGNED NOT NULL DEFAULT 0,
  completion_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_hash (content_hash),
  INDEX idx_verdict (verdict),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
