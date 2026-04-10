CREATE TABLE rule_debate_speech (
  id INT PRIMARY KEY AUTO_INCREMENT,
  debate_id INT NOT NULL COMMENT '辩论ID',
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '发言内容',
  audit_status TINYINT DEFAULT 0 COMMENT '审核状态：0-待审核 1-通过 2-拒绝',
  audit_reason VARCHAR(255) DEFAULT NULL COMMENT '审核拒绝原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_debate (debate_id),
  INDEX idx_user (user_id),
  INDEX idx_audit (audit_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则辩论发言表';
