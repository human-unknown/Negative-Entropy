-- 31_post.sql
-- 帖子表 - 逆熵严肃讨论社区核心

CREATE TABLE IF NOT EXISTS post (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  channel_id    INT UNSIGNED NOT NULL,
  author_id     BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  content       TEXT NOT NULL,
  -- 论证结构（可选但鼓励）
  thesis        VARCHAR(500) NULL COMMENT '核心论点（一句话）',
  premises      JSON NULL COMMENT '前提/论据列表 [{"text":"...","source_id":null}]',
  -- 来源引用
  sources       JSON NULL COMMENT '[{"url":"...","title":"...","note":"..."}]',
  -- 状态
  status        TINYINT NOT NULL DEFAULT 0 COMMENT '0=正常 1=关闭 2=已删除',
  audit_status  TINYINT NOT NULL DEFAULT 0 COMMENT '0=待审 1=通过 2=拒绝',
  -- 互动统计（冗余加速排序）
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  view_count    INT UNSIGNED NOT NULL DEFAULT 0,
  quality_score DECIMAL(3,2) NULL COMMENT '综合质量分 0.00-10.00，NULL=未评分',
  -- 辩论关联（可选，从帖子衍生辩论）
  debate_id     BIGINT UNSIGNED NULL COMMENT '关联的辩论话题ID',
  -- 元数据
  is_pinned     TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_channel_status (channel_id, status),
  INDEX idx_author (author_id),
  INDEX idx_status_created (status, created_at),
  INDEX idx_quality (quality_score),
  INDEX idx_debate (debate_id),
  FOREIGN KEY (channel_id) REFERENCES channel(id),
  FOREIGN KEY (author_id) REFERENCES user(id),
  FOREIGN KEY (debate_id) REFERENCES debate_topic(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
