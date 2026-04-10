-- 审核日志表
CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '被审核用户ID',
  content TEXT NOT NULL COMMENT '被审核内容',
  content_type ENUM('speech', 'topic', 'username') NOT NULL COMMENT '内容类型',
  content_id INT COMMENT '关联内容ID',
  audit_type ENUM('ai', 'manual') NOT NULL COMMENT '审核类型',
  audit_result ENUM('pass', 'reject', 'manual_review') NOT NULL COMMENT '审核结果',
  violations JSON COMMENT '违规类型',
  reason TEXT COMMENT '审核原因',
  reviewer_id INT COMMENT '人工审核员ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
  INDEX idx_user_id (user_id),
  INDEX idx_audit_type (audit_type),
  INDEX idx_audit_result (audit_result),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核日志表';
