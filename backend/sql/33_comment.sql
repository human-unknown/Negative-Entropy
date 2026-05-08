-- 32_comment.sql
-- 评论表 - 嵌套回复结构

CREATE TABLE IF NOT EXISTS comment (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id       BIGINT UNSIGNED NOT NULL,
  author_id     BIGINT UNSIGNED NOT NULL,
  parent_id     BIGINT UNSIGNED NULL COMMENT '父评论ID（NULL=顶级评论）',
  content       TEXT NOT NULL,
  -- 论证相关
  sources       JSON NULL COMMENT '[{"url":"...","title":"...","note":"..."}]',
  -- 状态
  audit_status  TINYINT NOT NULL DEFAULT 0 COMMENT '0=待审 1=通过 2=拒绝',
  is_deleted    TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除',
  -- 互动
  upvote_count  INT UNSIGNED NOT NULL DEFAULT 0,
  -- 元数据
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_post (post_id),
  INDEX idx_author (author_id),
  INDEX idx_parent (parent_id),
  INDEX idx_post_parent (post_id, parent_id),
  FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES user(id),
  FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
