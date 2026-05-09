-- 内容水印日志表
CREATE TABLE IF NOT EXISTS content_watermark_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  content_id INT NOT NULL COMMENT '内容ID',
  content_type ENUM('speech', 'topic') NOT NULL COMMENT '内容类型',
  watermark_id VARCHAR(32) NOT NULL COMMENT '水印标识',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_watermark_id (watermark_id),
  INDEX idx_user_id (user_id),
  INDEX idx_content (content_id, content_type),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容水印日志表';
