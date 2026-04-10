-- 内容复核队列表
CREATE TABLE IF NOT EXISTS content_review_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL COMMENT '待复核内容',
  content_type ENUM('speech', 'topic', 'username') NOT NULL COMMENT '内容类型',
  user_id INT NOT NULL COMMENT '提交用户ID',
  related_id INT DEFAULT NULL COMMENT '关联内容ID（发言ID/话题ID等）',
  audit_result ENUM('pass', 'reject', 'manual_review') NOT NULL COMMENT 'AI审核结果',
  audit_reason TEXT COMMENT 'AI审核原因',
  violations JSON COMMENT '违规类型列表',
  confidence DECIMAL(3,2) COMMENT 'AI置信度',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '复核状态',
  reviewer_id INT DEFAULT NULL COMMENT '复核管理员ID',
  reject_reason TEXT COMMENT '驳回原因',
  review_note TEXT COMMENT '复核备注',
  reviewed_at DATETIME COMMENT '复核时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_content_type (content_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容复核队列表';
